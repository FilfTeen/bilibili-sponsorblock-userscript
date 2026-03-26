import {
  CATEGORY_LABELS,
  POI_NOTICE_LEAD_SEC,
  SEGMENT_REWIND_RESET_SEC,
  TICK_INTERVAL_MS,
  VIDEO_SCAN_INTERVAL_MS
} from "../constants";
import { ConfigStore, StatsStore } from "./config-store";
import { PersistentCache } from "./cache";
import { SponsorBlockClient } from "../api/sponsorblock-client";
import { normalizeSegments } from "./segment-filter";
import { requestPageSnapshot } from "../platform/page-bridge";
import { NoticeCenter } from "../ui/notice-center";
import { SettingsPanel } from "../ui/panel";
import type { Category, CategoryMode, FetchResponse, SegmentRecord, StoredConfig, StoredStats, VideoContext } from "../types";
import { roundMinutes } from "../utils/number";
import { resolveVideoContext } from "../utils/video-context";
import { debugLog, findVideoElement, formatDurationLabel, resolvePlayerHost } from "../utils/dom";
import { supportsVideoFeatures } from "../utils/page";

type RuntimeSegmentState = {
  actionConsumed: boolean;
  noticeShown: boolean;
  suppressedUntilExit: boolean;
  mutedByScript: boolean;
  poiShown: boolean;
  lastObservedTime: number | null;
};

export class ScriptController {
  private currentConfig: StoredConfig;
  private currentStats: StoredStats;
  private readonly segmentStates = new Map<string, RuntimeSegmentState>();
  private readonly notices = new NoticeCenter();
  private readonly cache = new PersistentCache<FetchResponse>();
  private readonly client = new SponsorBlockClient(this.cache);
  private readonly panel: SettingsPanel;
  private locationIntervalId: number | null = null;
  private tickIntervalId: number | null = null;
  private domObserver: MutationObserver | null = null;
  private href = window.location.href;
  private currentContext: VideoContext | null = null;
  private currentVideo: HTMLVideoElement | null = null;
  private currentSignature = "";
  private currentSegments: SegmentRecord[] = [];
  private activeMuteOwners = new Set<string>();
  private previousMutedState = false;
  private refreshing = false;
  private refreshScheduled = false;
  private refreshTimerId: number | null = null;
  private pendingRefresh = false;
  private pendingForceFetch = false;

  constructor(
    private readonly configStore: ConfigStore,
    private readonly statsStore: StatsStore
  ) {
    this.currentConfig = this.configStore.getSnapshot();
    this.currentStats = this.statsStore.getSnapshot();
    this.panel = new SettingsPanel(this.currentConfig, this.currentStats, {
      onPatchConfig: async (patch) => {
        await this.configStore.update((config) => ({
          ...config,
          ...patch,
          categoryModes: {
            ...config.categoryModes,
            ...(patch.categoryModes ?? {})
          }
        }));
      },
      onCategoryModeChange: async (category: Category, mode: CategoryMode) => {
        await this.configStore.update((config) => ({
          ...config,
          categoryModes: {
            ...config.categoryModes,
            [category]: mode
          }
        }));
      },
      onReset: async () => {
        await this.configStore.reset();
      }
    });

    this.configStore.subscribe((config) => {
      this.currentConfig = config;
      this.panel.updateConfig(config);
      if (!config.enabled) {
        this.notices.clear();
        this.restoreMuteState();
      }
      void this.refreshCurrentVideo(true);
    });

    this.statsStore.subscribe((stats) => {
      this.currentStats = stats;
      this.panel.updateStats(stats);
    });
  }

  async start(): Promise<void> {
    await this.cache.load();
    this.panel.mount();
    await this.refreshCurrentVideo(true);

    this.locationIntervalId = window.setInterval(() => {
      if (this.href !== window.location.href) {
        this.href = window.location.href;
        void this.refreshCurrentVideo(true);
      }
    }, VIDEO_SCAN_INTERVAL_MS);

    this.tickIntervalId = window.setInterval(() => {
      this.tick();
    }, TICK_INTERVAL_MS);

    this.domObserver = new MutationObserver(() => {
      this.scheduleRefresh();
    });
    this.domObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    window.addEventListener(
      "pagehide",
      () => {
        this.stop();
      },
      { once: true }
    );
  }

  togglePanel(): void {
    this.panel.toggle();
  }

  async clearCache(): Promise<void> {
    await this.cache.clear();
    this.notices.show({
      id: "bsb-cache-cleared",
      title: "缓存已清理",
      message: "下次进入视频时会重新请求片段数据。",
      durationMs: 2800
    });
    await this.refreshCurrentVideo(true);
  }

  stop(): void {
    if (this.locationIntervalId !== null) {
      window.clearInterval(this.locationIntervalId);
      this.locationIntervalId = null;
    }
    if (this.tickIntervalId !== null) {
      window.clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
    if (this.refreshTimerId !== null) {
      window.clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
    this.refreshScheduled = false;
    this.pendingRefresh = false;
    this.pendingForceFetch = false;
    this.domObserver?.disconnect();
    this.domObserver = null;
    this.clearRuntimeState(true);
  }

  private scheduleRefresh(forceFetch = false): void {
    this.pendingForceFetch = this.pendingForceFetch || forceFetch;

    if (this.refreshScheduled) {
      return;
    }

    // Bilibili rerenders player DOM aggressively; debounce bridge/network refresh work into one pass.
    this.refreshScheduled = true;
    this.refreshTimerId = window.setTimeout(() => {
      this.refreshScheduled = false;
      this.refreshTimerId = null;
      const nextForceFetch = this.pendingForceFetch;
      this.pendingForceFetch = false;
      void this.refreshCurrentVideo(nextForceFetch);
    }, 120);
  }

  private async refreshCurrentVideo(forceFetch = false): Promise<void> {
    if (this.refreshing) {
      this.pendingRefresh = true;
      this.pendingForceFetch = this.pendingForceFetch || forceFetch;
      return;
    }
    this.refreshing = true;

    try {
      if (!supportsVideoFeatures(window.location.href)) {
        this.clearRuntimeState();
        return;
      }

      const snapshot = await requestPageSnapshot();
      const context = resolveVideoContext(snapshot);
      const video = findVideoElement();

      if (!context || !video) {
        this.clearRuntimeState();
        return;
      }

      const signature = `${context.bvid}+${context.cid ?? ""}`;
      if (!forceFetch && signature === this.currentSignature && this.currentVideo === video) {
        return;
      }

      this.clearRuntimeState();
      this.currentContext = context;
      this.currentVideo = video;
      this.currentSignature = signature;

      const playerHost = resolvePlayerHost(video);
      this.panel.mount(playerHost);

      if (!this.currentConfig.enabled) {
        return;
      }

      const segments = await this.client.getSegments(context, this.currentConfig);
      this.currentSegments = normalizeSegments(segments, this.currentConfig);
      this.panel.setFullVideoLabels(this.currentSegments.filter((segment) => segment.actionType === "full"));
      debugLog("Loaded segments", {
        signature,
        count: this.currentSegments.length
      });
    } catch (error) {
      debugLog("Failed to refresh video context", error);
      this.notices.show({
        id: "bsb-fetch-error",
        title: "片段读取失败",
        message: error instanceof Error ? error.message : "未知错误",
        durationMs: 4000
      });
    } finally {
      this.refreshing = false;
      if (this.pendingRefresh) {
        const nextForceFetch = this.pendingForceFetch;
        this.pendingRefresh = false;
        this.pendingForceFetch = false;
        this.scheduleRefresh(nextForceFetch);
      }
    }
  }

  private tick(): void {
    if (!this.currentConfig.enabled || !this.currentVideo || !this.currentContext) {
      return;
    }

    const currentTime = this.currentVideo.currentTime;
    for (const segment of this.currentSegments) {
      if (segment.actionType === "full") {
        continue;
      }
      const state = this.getSegmentState(segment.UUID);
      // Re-arming state on rewind keeps manual actions and notices correct after backward seeks.
      if (this.shouldResetSegmentState(currentTime, state)) {
        this.resetSegmentState(segment.UUID, state);
      }
      this.processSegment(segment, currentTime);
      state.lastObservedTime = currentTime;
    }
  }

  private processSegment(segment: SegmentRecord, currentTime: number): void {
    const state = this.getSegmentState(segment.UUID);
    const resetThreshold = segment.start - SEGMENT_REWIND_RESET_SEC;

    if (currentTime < resetThreshold) {
      this.dismissSegmentNotice(segment);
      if (state.mutedByScript) {
        this.deactivateMute(segment.UUID);
        state.mutedByScript = false;
      }
      state.actionConsumed = false;
      state.noticeShown = false;
      state.suppressedUntilExit = false;
      state.poiShown = false;
      return;
    }

    if (segment.actionType === "poi") {
      this.processPoiSegment(segment, currentTime, state);
      return;
    }

    if (segment.end === null) {
      return;
    }

    const active = currentTime >= segment.start && currentTime < segment.end;
    if (!active) {
      if (currentTime >= segment.end) {
        this.dismissSegmentNotice(segment);
        state.noticeShown = true;
        state.suppressedUntilExit = false;
        if (state.mutedByScript) {
          this.deactivateMute(segment.UUID);
          state.mutedByScript = false;
          state.actionConsumed = true;
        }
      }
      return;
    }

    if (segment.actionType === "mute") {
      this.processMuteSegment(segment, state);
      return;
    }

    this.processSkipSegment(segment, state);
  }

  private processSkipSegment(segment: SegmentRecord, state: RuntimeSegmentState): void {
    if (segment.mode === "auto") {
      if (!state.actionConsumed && !state.suppressedUntilExit) {
        this.performSkip(segment, "自动跳过");
        state.actionConsumed = true;
        state.noticeShown = true;
        state.suppressedUntilExit = true;
      }
      return;
    }

    if (segment.mode === "manual" && !state.noticeShown) {
      state.noticeShown = true;
      this.notices.show({
        id: this.noticeIdForSegment(segment),
        title: `${CATEGORY_LABELS[segment.category]}片段`,
        message: `当前片段 ${formatDurationLabel(segment.start, segment.end)}，可手动跳过。`,
        sticky: true,
        actions: [
          {
            label: "跳过",
            variant: "primary",
            onClick: () => {
              this.performSkip(segment, "手动跳过");
              state.actionConsumed = true;
              state.suppressedUntilExit = true;
            }
          }
        ]
      });
      return;
    }

    if (segment.mode === "notice" && !state.noticeShown) {
      state.noticeShown = true;
      this.notices.show({
        id: this.noticeIdForSegment(segment),
        title: `${CATEGORY_LABELS[segment.category]}片段`,
        message: `当前片段 ${formatDurationLabel(segment.start, segment.end)}。`,
        sticky: true
      });
    }
  }

  private processMuteSegment(segment: SegmentRecord, state: RuntimeSegmentState): void {
    if (segment.mode === "auto") {
      if (!state.mutedByScript && !state.suppressedUntilExit) {
        this.activateMute(segment.UUID);
        state.mutedByScript = true;
        state.actionConsumed = true;
        this.notices.show({
          id: this.noticeIdForSegment(segment),
          title: `${CATEGORY_LABELS[segment.category]}片段`,
          message: `已自动静音，范围 ${formatDurationLabel(segment.start, segment.end)}。`,
          sticky: true,
          actions: [
            {
              label: "恢复声音",
              variant: "secondary",
              onClick: () => {
                this.deactivateMute(segment.UUID);
                state.mutedByScript = false;
                state.suppressedUntilExit = true;
              }
            }
          ]
        });
      }
      return;
    }

    if (segment.mode === "manual" && !state.noticeShown) {
      state.noticeShown = true;
      this.notices.show({
        id: this.noticeIdForSegment(segment),
        title: `${CATEGORY_LABELS[segment.category]}片段`,
        message: `当前片段 ${formatDurationLabel(segment.start, segment.end)}，可手动静音。`,
        sticky: true,
        actions: [
          {
            label: "静音此段",
            variant: "primary",
            onClick: () => {
              this.activateMute(segment.UUID);
              state.mutedByScript = true;
              state.actionConsumed = true;
            }
          }
        ]
      });
      return;
    }

    if (segment.mode === "notice" && !state.noticeShown) {
      state.noticeShown = true;
      this.notices.show({
        id: this.noticeIdForSegment(segment),
        title: `${CATEGORY_LABELS[segment.category]}片段`,
        message: `当前片段 ${formatDurationLabel(segment.start, segment.end)}，建议留意音量。`,
        sticky: true
      });
    }
  }

  private processPoiSegment(segment: SegmentRecord, currentTime: number, state: RuntimeSegmentState): void {
    const visibleStart = Math.max(0, segment.start - POI_NOTICE_LEAD_SEC);
    const visibleEnd = segment.start + 3;

    if (currentTime > visibleEnd) {
      this.dismissSegmentNotice(segment);
      state.poiShown = true;
      return;
    }

    if (currentTime < visibleStart) {
      state.poiShown = false;
      return;
    }

    if (state.poiShown || segment.mode === "off") {
      return;
    }

    state.poiShown = true;
    this.notices.show({
      id: this.noticeIdForSegment(segment),
      title: `${CATEGORY_LABELS[segment.category]}提示`,
      message: `在 ${formatDurationLabel(segment.start, null)} 有一个高光点。`,
      durationMs: this.currentConfig.noticeDurationSec * 1000,
      sticky: segment.mode !== "notice",
      actions:
        segment.mode === "notice"
          ? []
          : [
              {
                label: "跳到高光",
                variant: "primary",
                onClick: () => {
                  if (this.currentVideo) {
                    this.currentVideo.currentTime = segment.start;
                  }
                }
              }
            ]
    });
  }

  private performSkip(segment: SegmentRecord, verb: string): void {
    if (!this.currentVideo || segment.end === null) {
      return;
    }

    const start = segment.start;
    const end = segment.end;
    this.currentVideo.currentTime = Math.max(end, this.currentVideo.currentTime);

    void this.statsStore.recordSkip(roundMinutes(end - start));
    this.notices.show({
      id: this.noticeIdForSegment(segment),
      title: `${verb}：${CATEGORY_LABELS[segment.category]}`,
      message: `范围 ${formatDurationLabel(start, end)}。`,
      durationMs: this.currentConfig.noticeDurationSec * 1000,
      actions: [
        {
          label: "撤销",
          variant: "secondary",
          onClick: () => {
            if (!this.currentVideo) {
              return;
            }
            this.currentVideo.currentTime = Math.max(0, start);
            const state = this.getSegmentState(segment.UUID);
            state.suppressedUntilExit = true;
          }
        }
      ]
    });
  }

  private activateMute(owner: string): void {
    if (!this.currentVideo) {
      return;
    }
    if (this.activeMuteOwners.size === 0) {
      this.previousMutedState = this.currentVideo.muted;
    }
    this.activeMuteOwners.add(owner);
    this.currentVideo.muted = true;
  }

  private deactivateMute(owner: string): void {
    if (!this.currentVideo) {
      return;
    }
    this.activeMuteOwners.delete(owner);
    if (this.activeMuteOwners.size === 0) {
      this.currentVideo.muted = this.previousMutedState;
    }
  }

  private restoreMuteState(): void {
    if (this.currentVideo && this.activeMuteOwners.size > 0) {
      this.currentVideo.muted = this.previousMutedState;
    }
    this.activeMuteOwners.clear();
  }

  private getSegmentState(id: string): RuntimeSegmentState {
    const existing = this.segmentStates.get(id);
    if (existing) {
      return existing;
    }

    const created: RuntimeSegmentState = {
      actionConsumed: false,
      noticeShown: false,
      suppressedUntilExit: false,
      mutedByScript: false,
      poiShown: false,
      lastObservedTime: null
    };
    this.segmentStates.set(id, created);
    return created;
  }

  private dismissSegmentNotice(segment: SegmentRecord): void {
    this.notices.dismiss(this.noticeIdForSegment(segment));
  }

  private noticeIdForSegment(segment: SegmentRecord): string {
    return `segment:${segment.UUID}`;
  }

  private clearRuntimeState(detachUi = false): void {
    this.restoreMuteState();
    this.notices.clear();
    this.segmentStates.clear();
    this.currentSegments = [];
    this.currentSignature = "";
    this.currentContext = null;
    this.currentVideo = null;
    this.panel.setFullVideoLabels([]);
    if (detachUi) {
      this.panel.unmount();
    } else {
      this.panel.mount();
    }
  }

  private shouldResetSegmentState(currentTime: number, state: RuntimeSegmentState): boolean {
    return state.lastObservedTime !== null && currentTime < state.lastObservedTime - SEGMENT_REWIND_RESET_SEC;
  }

  private resetSegmentState(id: string, state: RuntimeSegmentState): void {
    this.notices.dismiss(`segment:${id}`);
    if (state.mutedByScript) {
      this.deactivateMute(id);
    }
    state.actionConsumed = false;
    state.noticeShown = false;
    state.suppressedUntilExit = false;
    state.mutedByScript = false;
    state.poiShown = false;
    state.lastObservedTime = null;
  }
}
