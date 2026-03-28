import {
  CATEGORY_LABELS,
  POI_NOTICE_LEAD_SEC,
  SEGMENT_REWIND_RESET_SEC,
  TICK_INTERVAL_MS
} from "../constants";
import { ConfigStore, StatsStore } from "./config-store";
import { PersistentCache } from "./cache";
import { LocalVideoLabelStore } from "./local-label-store";
import { VoteHistoryStore } from "./vote-history-store";
import { SponsorBlockClient } from "../api/sponsorblock-client";
import { VideoLabelClient } from "../api/video-label-client";
import { normalizeSegments } from "./segment-filter";
import { resolveWholeVideoLabels } from "./whole-video-label";
import { requestPageSnapshot } from "../platform/page-bridge";
import { NoticeCenter } from "../ui/notice-center";
import { SettingsPanel } from "../ui/panel";
import { PreviewBar } from "../ui/preview-bar";
import { TitleBadge, type TitleBadgeVoteResult } from "../ui/title-badge";
import { CompactVideoHeader } from "../ui/compact-header";
import { scanCurrentPageCommentSignal, VIDEO_SIGNAL_EVENT } from "../features/comment-filter";
import type {
  Category,
  CategoryMode,
  FetchResponse,
  LocalVideoLabelRecord,
  LocalVideoSignal,
  RuntimeStatus,
  SegmentRecord,
  StoredConfig,
  StoredStats,
  VideoContext
} from "../types";
import { roundMinutes } from "../utils/number";
import { mutationsTouchSelectors } from "../utils/mutation";
import { inferLocalVideoSignal } from "../utils/local-video-signal";
import { resolveVideoContext } from "../utils/video-context";
import { debugLog, findVideoElement, formatDurationLabel, resolvePlayerHost } from "../utils/dom";
import { observeUrlChanges } from "../utils/navigation";
import { supportsVideoFeatures } from "../utils/page";

type RuntimeSegmentState = {
  actionConsumed: boolean;
  noticeShown: boolean;
  suppressedUntilExit: boolean;
  mutedByScript: boolean;
  poiShown: boolean;
  lastObservedTime: number | null;
  manualSkipGraceUntil: number | null;
  manualSkipGraceShown: boolean;
};

const VIDEO_RELEVANT_SELECTORS = [
  "video",
  "#bilibili-player",
  "#playerWrap",
  ".bpx-player-container",
  ".bpx-player-video-wrap",
  ".bilibili-player",
  ".video-container",
  ".player-container"
] as const;
const VIDEO_IGNORED_SELECTORS = [
  ".bsb-tm-panel",
  ".bsb-tm-entry-button",
  ".bsb-tm-banner",
  ".bsb-tm-notice-root",
  ".bsb-tm-notice"
] as const;
const SKIP_GRACE_WINDOW_MS = 10_000;

export class ScriptController {
  private started = false;
  private currentConfig: StoredConfig;
  private currentStats: StoredStats;
  private readonly segmentStates = new Map<string, RuntimeSegmentState>();
  private readonly notices = new NoticeCenter();
  private readonly client: SponsorBlockClient;
  private readonly videoLabelClient: VideoLabelClient;
  private readonly panel: SettingsPanel;
  private readonly previewBar = new PreviewBar();
  private readonly titleBadge: TitleBadge;
  private readonly compactHeader = new CompactVideoHeader();
  private tickIntervalId: number | null = null;
  private domObserver: MutationObserver | null = null;
  private domStructureDirty = true;
  private stopObservingUrl: (() => void) | null = null;
  private currentContext: VideoContext | null = null;
  private currentVideo: HTMLVideoElement | null = null;
  private currentSignature = "";
  private currentSegments: SegmentRecord[] = [];
  private currentFullVideoLabels: SegmentRecord[] = [];
  private currentTitleLabel: SegmentRecord | null = null;
  private activeMuteOwners = new Set<string>();
  private previousMutedState = false;
  private refreshing = false;
  private refreshScheduled = false;
  private refreshTimerId: number | null = null;
  private pendingRefresh = false;
  private pendingForceFetch = false;
  private pendingVisibleRefresh = false;
  private lastTickTime: number | null = null;
  private lastAnnouncedSignature = "";
  private readonly handleVisibilityChange = () => {
    if (!document.hidden && this.pendingVisibleRefresh) {
      this.pendingVisibleRefresh = false;
      const nextForceFetch = this.pendingForceFetch;
      this.pendingForceFetch = false;
      this.scheduleRefresh(nextForceFetch);
    }
  };
  private readonly handleVideoSignal = (event: Event) => {
    if (!(event instanceof CustomEvent) || !this.started || !this.currentConfig.enabled || !this.currentContext) {
      return;
    }

    const detail = event.detail as { category?: Category; source?: string; confidence?: number; reason?: string } | null;
    if (!detail?.category || this.currentConfig.categoryModes[detail.category] === "off") {
      return;
    }
    if (this.currentFullVideoLabels.length > 0 || this.localVideoLabelStore.isDismissed(this.currentContext.bvid)) {
      return;
    }

    const existing = this.currentTitleLabel;
    if (existing && !existing.UUID.startsWith("local-signal:")) {
      return;
    }

    const signal: LocalVideoSignal = {
      category: detail.category,
      source: detail.source === "comment-goods" || detail.source === "comment-suspicion" ? detail.source : "page-heuristic",
      confidence: detail.confidence ?? 0.76,
      reason: detail.reason ?? "页面出现本地商业线索"
    };
    const signalLabel = this.buildLocalSignalSegment(this.currentContext.bvid, signal);

    this.currentTitleLabel = signalLabel;
    this.updateTitleBadge(signalLabel);
    this.panel.setFullVideoLabels([signalLabel]);
    this.updateRuntimeStatus({
      kind: "loaded",
      message: "已根据本地页面线索补充整视频标签",
      bvid: this.currentContext.bvid,
      segmentCount: this.currentSegments.length
    });
    void this.localVideoLabelStore.rememberSignal(this.currentContext.bvid, signal);
  };
  private readonly handleMbgaLiveFallback = () => {
    this.notices.show({
      id: "mbga-live-fallback",
      title: "MBGA 直播增强",
      message: "检测到最高清晰度可能不可用，已为您自动切换至播放器上选择的清晰度。",
      durationMs: 4000
    });
  };

  constructor(
    private readonly configStore: ConfigStore,
    private readonly statsStore: StatsStore,
    private readonly cache: PersistentCache<FetchResponse>,
    private readonly localVideoLabelStore: LocalVideoLabelStore,
    private readonly voteHistoryStore: VoteHistoryStore
  ) {
    this.currentConfig = this.configStore.getSnapshot();
    this.currentStats = this.statsStore.getSnapshot();
    this.client = new SponsorBlockClient(this.cache);
    this.videoLabelClient = new VideoLabelClient(this.cache);
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
      onClearCache: async () => {
        await this.clearCache();
        this.notices.show({
          id: "bsb-tm-maintenance-feedback",
          title: "维护工具",
          message: "缓存清理已完成，相关数据已重置。",
          durationMs: 3000
        });
      },
      onReset: async () => {
        await this.configStore.reset();
        this.notices.show({
          id: "bsb-tm-maintenance-feedback",
          title: "维护工具",
          message: "所有脚本设置已恢复为初始默认值。",
          durationMs: 4000
        });
      }
    });
    this.titleBadge = new TitleBadge({
      onVote: async (segment, type) => {
        return await this.submitVote(segment, type);
      },
      onLocalDecision: async (segment, decision) => {
        await this.handleLocalBadgeDecision(segment, decision);
      },
      onOpenSettings: () => {
        this.panel.open("help");
      }
    });
    this.titleBadge.setColorOverrides(this.currentConfig.categoryColorOverrides);
    this.previewBar.setCategoryColorOverrides(this.currentConfig.categoryColorOverrides);

    this.configStore.subscribe((config) => {
      this.currentConfig = config;
      this.panel.updateConfig(config);
      this.previewBar.setEnabled(config.enabled && config.showPreviewBar);
      this.previewBar.setCategoryColorOverrides(config.categoryColorOverrides);
      this.titleBadge.setColorOverrides(config.categoryColorOverrides);
      this.syncCompactVideoHeader();
      if (!config.enabled) {
        this.notices.clear();
        this.restoreMuteState();
        this.titleBadge.clear();
      }
      this.scheduleRefresh(true);
    });

    this.statsStore.subscribe((stats) => {
      this.currentStats = stats;
      this.panel.updateStats(stats);
    });
  }

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.started = true;
    await this.cache.load();
    this.previewBar.setEnabled(this.currentConfig.enabled && this.currentConfig.showPreviewBar);
    this.syncCompactVideoHeader();
    this.updateRuntimeStatus(this.buildIdleStatus());
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.panel.mount();
    window.addEventListener(VIDEO_SIGNAL_EVENT, this.handleVideoSignal as EventListener);
    window.addEventListener("bsb_mbga_live_fallback", this.handleMbgaLiveFallback as EventListener);
    await this.refreshCurrentVideo(true);

    this.stopObservingUrl = observeUrlChanges(() => {
      this.syncCompactVideoHeader();
      this.scheduleRefresh(true);
    });

    this.tickIntervalId = window.setInterval(() => {
      this.tick();
    }, TICK_INTERVAL_MS);

    this.domObserver = new MutationObserver((records) => {
      if (!mutationsTouchSelectors(records, VIDEO_RELEVANT_SELECTORS, VIDEO_IGNORED_SELECTORS)) {
        return;
      }
      this.domStructureDirty = true;
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

  openPanel(): void {
    this.panel.open();
  }

  openHelp(): void {
    this.panel.open("help");
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
    if (!this.started) {
      return;
    }

    this.started = false;
    if (this.stopObservingUrl) {
      this.stopObservingUrl();
      this.stopObservingUrl = null;
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
    this.pendingVisibleRefresh = false;
    this.lastTickTime = null;
    this.domObserver?.disconnect();
    this.domObserver = null;
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    window.removeEventListener(VIDEO_SIGNAL_EVENT, this.handleVideoSignal as EventListener);
    this.syncCompactVideoHeader();
    this.clearRuntimeState(true);
  }

  private scheduleRefresh(forceFetch = false): void {
    this.pendingForceFetch = this.pendingForceFetch || forceFetch;

    if (document.hidden) {
      this.pendingVisibleRefresh = true;
      return;
    }

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
    let resolvedContext: VideoContext | null = null;

    if (this.refreshing) {
      this.pendingRefresh = true;
      this.pendingForceFetch = this.pendingForceFetch || forceFetch;
      return;
    }
    this.refreshing = true;

    try {
      this.syncCompactVideoHeader();
      if (!supportsVideoFeatures(window.location.href)) {
        this.clearRuntimeState();
        return;
      }

      const snapshot = (await requestPageSnapshot()) ?? {
        url: window.location.href,
        initialState: null,
        playerManifest: null,
        playInfo: null
      };
      const context = resolveVideoContext(snapshot);
      resolvedContext = context;
      const video = findVideoElement();

      if (!context || !video) {
        this.updateRuntimeStatus({
          kind: "pending",
          message: "等待播放器和页面信息",
          bvid: context?.bvid ?? null,
          segmentCount: null
        });
        if (video && supportsVideoFeatures(window.location.href)) {
          this.notices.show({
            id: "bsb-context-pending",
            title: "等待页面信息",
            message: "暂时无法识别当前视频，脚本会继续自动重试。",
            durationMs: 2600
          });
        }
        this.clearRuntimeState();
        return;
      }

      const signature = `${context.bvid}+${context.cid ?? ""}`;
      if (!forceFetch && signature === this.currentSignature && this.currentVideo === video) {
        const playerHost = resolvePlayerHost(video);
        this.notices.setHost(playerHost);
        this.previewBar.bind(video);
        this.previewBar.setEnabled(this.currentConfig.enabled && this.currentConfig.showPreviewBar);
        if (this.currentSegments.length > 0) {
          this.previewBar.setSegments(this.currentSegments);
        }
        this.panel.setFullVideoLabels(this.currentFullVideoLabels);
        this.updateTitleBadge(this.currentTitleLabel);
        return;
      }

      this.clearRuntimeState();
      this.currentContext = context;
      this.currentVideo = video;
      this.currentSignature = signature;

      const playerHost = resolvePlayerHost(video);
      this.notices.setHost(playerHost);
      this.previewBar.bind(video);
      this.previewBar.setEnabled(this.currentConfig.enabled && this.currentConfig.showPreviewBar);

      if (!this.currentConfig.enabled) {
        this.titleBadge.clear();
        this.updateRuntimeStatus({
          kind: "idle",
          message: "脚本已停用",
          bvid: context.bvid,
          segmentCount: null
        });
        return;
      }

      this.updateRuntimeStatus({
        kind: "pending",
        message: "正在加载 SponsorBlock 片段",
        bvid: context.bvid,
        segmentCount: null
      });

      const [segments, videoLabelCategory] = await Promise.all([
        this.client.getSegments(context, this.currentConfig),
        this.videoLabelClient.getVideoLabel(context.bvid, this.currentConfig)
      ]);
      this.currentSegments = normalizeSegments(segments, this.currentConfig, context.cid);
      this.currentFullVideoLabels = resolveWholeVideoLabels(
        context.bvid,
        this.currentSegments,
        videoLabelCategory,
        this.currentConfig
      );
      const localTitleLabel = await this.resolveLocalTitleLabel(context);
      this.currentTitleLabel = this.currentFullVideoLabels[0] ?? localTitleLabel;
      this.panel.setFullVideoLabels(
        this.currentFullVideoLabels.length > 0
          ? this.currentFullVideoLabels
          : this.currentTitleLabel
            ? [this.currentTitleLabel]
            : []
      );
      this.updateTitleBadge(this.currentTitleLabel);
      this.previewBar.setSegments(this.currentSegments);
      if (this.currentSegments.length > 0) {
        this.updateRuntimeStatus({
          kind: "loaded",
          message: `已加载 ${this.currentSegments.length} 个可处理片段`,
          bvid: context.bvid,
          segmentCount: this.currentSegments.length
        });
        if (this.lastAnnouncedSignature !== signature) {
          this.lastAnnouncedSignature = signature;
          this.notices.show({
            id: `segments-ready:${signature}`,
            title: "SponsorBlock 已就绪",
            message: `当前视频已载入 ${this.currentSegments.length} 个可处理片段。`,
            durationMs: 2400
          });
        }
      } else if (this.currentFullVideoLabels.length > 0) {
        this.updateRuntimeStatus({
          kind: "loaded",
          message: `已识别 ${this.currentFullVideoLabels.length} 个整视频标签`,
          bvid: context.bvid,
          segmentCount: 0
        });
      } else if (this.currentTitleLabel) {
        this.updateRuntimeStatus({
          kind: "loaded",
          message: "已根据本地页面线索补充整视频标签",
          bvid: context.bvid,
          segmentCount: 0
        });
      } else if (segments.length > 0) {
        this.updateRuntimeStatus({
          kind: "empty",
          message: `已读取 ${segments.length} 个片段，但当前设置未启用对应分类`,
          bvid: context.bvid,
          segmentCount: 0
        });
      } else {
        this.updateRuntimeStatus({
          kind: "empty",
          message: "当前视频暂无 SponsorBlock 数据",
          bvid: context.bvid,
          segmentCount: 0
        });
      }
      debugLog("Loaded segments", {
        signature,
        count: this.currentSegments.length
      });
    } catch (error) {
      debugLog("Failed to refresh video context", error);
      this.updateRuntimeStatus({
        kind: "error",
        message: error instanceof Error ? `片段读取失败：${error.message}` : "片段读取失败",
        bvid: resolvedContext?.bvid ?? this.currentContext?.bvid ?? null,
        segmentCount: null
      });
      this.notices.show({
        id: "bsb-fetch-error",
        title: "片段读取失败",
        message: error instanceof Error ? error.message : "未知错误",
        durationMs: 4000
      });
      this.titleBadge.clear();
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
    if (!this.currentConfig.enabled || !this.currentVideo || !this.currentContext || this.currentSegments.length === 0) {
      return;
    }

    if (this.domStructureDirty) {
      this.domStructureDirty = false;
      if (this.currentConfig.showPreviewBar) {
        this.previewBar.bind(this.currentVideo);
        this.previewBar.setSegments(this.currentSegments);
      }
      this.syncCompactVideoHeader();
    }

    const currentTime = this.currentVideo.currentTime;
    if (
      this.lastTickTime !== null &&
      currentTime === this.lastTickTime &&
      this.currentVideo.paused &&
      !this.currentVideo.seeking
    ) {
      return;
    }

    this.lastTickTime = currentTime;
    for (const segment of this.currentSegments) {
      if (segment.actionType === "full") {
        continue;
      }
      const state = this.getSegmentState(segment.UUID);
      const withinSegment =
        segment.end !== null &&
        currentTime >= segment.start &&
        currentTime < segment.end;
      // Re-arming state on rewind keeps manual actions and notices correct after backward seeks.
      if (this.shouldResetSegmentState(currentTime, state)) {
        const rewoundIntoAutoSkippedSegment =
          segment.actionType === "skip" &&
          segment.mode === "auto" &&
          state.actionConsumed &&
          withinSegment;
        const rewoundWithinKeptSegment =
          segment.actionType === "skip" &&
          segment.mode === "auto" &&
          state.suppressedUntilExit &&
          withinSegment;
        if (rewoundIntoAutoSkippedSegment) {
          this.rearmSegmentState(segment.UUID, state, state.manualSkipGraceShown);
          this.startSkipGrace(segment, state, "检测到你回到了该片段，10 秒内不会再次自动跳过。");
        } else if (rewoundWithinKeptSegment) {
          this.dismissSkipGrace(segment);
        } else {
          this.resetSegmentState(segment.UUID, state);
        }
      }

      if (!state.actionConsumed && state.lastObservedTime !== null) {
        const jumpedIntoAd =
          withinSegment &&
          Math.abs(currentTime - state.lastObservedTime) > 1.5 &&
          (segment.end === null || state.lastObservedTime < segment.start || state.lastObservedTime >= segment.end);

        if (jumpedIntoAd && !state.suppressedUntilExit) {
          this.startSkipGrace(segment, state, "检测到你主动跳转至该片段，10秒内不会自动跳过。");
        }
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
      this.dismissSkipGrace(segment);
      if (state.mutedByScript) {
        this.deactivateMute(segment.UUID);
        state.mutedByScript = false;
      }
      state.actionConsumed = false;
      state.noticeShown = false;
      state.suppressedUntilExit = false;
      state.poiShown = false;
      state.manualSkipGraceUntil = null;
      state.manualSkipGraceShown = false;
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
        this.dismissSkipGrace(segment);
        state.noticeShown = true;
        state.suppressedUntilExit = false;
        state.manualSkipGraceUntil = null;
        state.manualSkipGraceShown = false;
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
    if (state.manualSkipGraceUntil !== null && Date.now() >= state.manualSkipGraceUntil) {
      state.manualSkipGraceUntil = null;
      this.dismissSkipGrace(segment);
    }
    if (this.isSkipGraceActive(state)) {
      return;
    }

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
    this.dismissSegmentNotice(segment);
    this.dismissSkipGrace(segment);
    this.currentVideo.currentTime = Math.max(end, this.currentVideo.currentTime);

    void this.statsStore.recordSkip(roundMinutes(end - start));
    this.notices.show({
      id: this.resultNoticeIdForSegment(segment),
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
            const state = this.getSegmentState(segment.UUID);
            this.rearmSegmentState(segment.UUID, state, state.manualSkipGraceShown);
            this.currentVideo.currentTime = start;
            this.startSkipGrace(segment, state, "已回到广告开始处，10 秒内不会再次自动跳过。");
          }
        }
      ]
    });
  }

  private userMuteListener: (() => void) | null = null;

  private activateMute(owner: string): void {
    if (!this.currentVideo) {
      return;
    }
    if (this.activeMuteOwners.size === 0) {
      this.previousMutedState = this.currentVideo.muted;
      this.attachUserMuteListener();
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
      this.detachUserMuteListener();
      this.currentVideo.muted = this.previousMutedState;
    }
  }

  private restoreMuteState(): void {
    this.detachUserMuteListener();
    if (this.currentVideo && this.activeMuteOwners.size > 0) {
      this.currentVideo.muted = this.previousMutedState;
    }
    this.activeMuteOwners.clear();
  }

  private attachUserMuteListener(): void {
    if (this.userMuteListener || !this.currentVideo) {
      return;
    }
    const video = this.currentVideo;
    this.userMuteListener = () => {
      // If the script just muted (all owners active), ignore the event.
      // Otherwise, the user changed mute state manually — respect their intent on restore.
      if (this.activeMuteOwners.size > 0 && !video.muted) {
        // User unmuted during a sponsor-mute segment — update saved state.
        this.previousMutedState = false;
      } else if (this.activeMuteOwners.size > 0 && video.muted) {
        // Could be the script or the user; save muted as the intent to be safe.
        this.previousMutedState = true;
      }
    };
    video.addEventListener("volumechange", this.userMuteListener);
  }

  private detachUserMuteListener(): void {
    if (!this.userMuteListener) {
      return;
    }
    this.currentVideo?.removeEventListener("volumechange", this.userMuteListener);
    this.userMuteListener = null;
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
      lastObservedTime: null,
      manualSkipGraceUntil: null,
      manualSkipGraceShown: false
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

  private resultNoticeIdForSegment(segment: SegmentRecord): string {
    return `segment-result:${segment.UUID}`;
  }

  private skipGraceNoticeIdForSegment(segment: SegmentRecord): string {
    return `segment-grace:${segment.UUID}`;
  }

  private updateTitleBadge(segment: SegmentRecord | null): void {
    if (!segment) {
      this.titleBadge.clear();
      return;
    }

    this.titleBadge.setSegment(segment, {
      voteLocked: this.voteHistoryStore.has(segment.UUID)
    });
  }

  private clearRuntimeState(detachUi = false): void {
    this.restoreMuteState();
    this.notices.clear();
    this.segmentStates.clear();
    this.lastTickTime = null;
    this.currentSegments = [];
    this.currentFullVideoLabels = [];
    this.currentTitleLabel = null;
    this.currentSignature = "";
    this.currentContext = null;
    this.currentVideo = null;
    this.panel.setFullVideoLabels([]);
    this.previewBar.clear();
    this.previewBar.bind(null);
    this.titleBadge.clear();
    this.notices.setHost(null);
    if (detachUi) {
      this.panel.unmount();
      this.titleBadge.destroy();
      this.compactHeader.destroy();
    } else {
      this.syncCompactVideoHeader();
      this.updateRuntimeStatus(this.buildIdleStatus());
    }
  }

  private buildIdleStatus(): RuntimeStatus {
    if (!this.currentConfig.enabled) {
      return {
        kind: "idle",
        message: "脚本已停用",
        bvid: this.currentContext?.bvid ?? null,
        segmentCount: null
      };
    }

    if (supportsVideoFeatures(window.location.href)) {
      return {
        kind: "pending",
        message: "等待播放器和页面信息",
        bvid: this.currentContext?.bvid ?? null,
        segmentCount: null
      };
    }

    return {
      kind: "idle",
      message: "当前页面可使用缩略图标签与内容增强",
      bvid: null,
      segmentCount: null
    };
  }

  private updateRuntimeStatus(status: RuntimeStatus): void {
    this.panel.updateRuntimeStatus(status);
  }

  private syncCompactVideoHeader(): void {
    const shouldCompact =
      this.started &&
      this.currentConfig.enabled &&
      this.currentConfig.compactVideoHeader &&
      supportsVideoFeatures(window.location.href);
    if (shouldCompact) {
      this.compactHeader.mount();
      return;
    }
    this.compactHeader.unmount();
  }

  private resolveFullVideoSegment(): SegmentRecord | null {
    return this.currentTitleLabel;
  }

  private buildLocalSignalSegment(
    bvid: string,
    signal: Pick<LocalVideoSignal, "category" | "source" | "reason"> | Pick<LocalVideoLabelRecord, "category" | "source" | "reason">
  ): SegmentRecord {
    const category = signal.category ?? "sponsor";
    return {
      UUID: `local-signal:${bvid}:${signal.source}:${category}`,
      category,
      actionType: "full",
      segment: [0, 0],
      start: 0,
      end: 0,
      duration: 0,
      mode: this.currentConfig.categoryModes[category]
    };
  }

  private async resolveLocalTitleLabel(context: VideoContext): Promise<SegmentRecord | null> {
    const learned = this.localVideoLabelStore.getResolved(context.bvid);
    if (learned?.category && this.currentConfig.categoryModes[learned.category] !== "off") {
      return this.buildLocalSignalSegment(context.bvid, learned);
    }

    if (this.localVideoLabelStore.isDismissed(context.bvid)) {
      return null;
    }

    const commentSignal = scanCurrentPageCommentSignal(this.currentConfig);
    const pageSignal = inferLocalVideoSignal(context);
    const localSignal = this.pickPreferredLocalSignal(commentSignal, pageSignal);
    if (!localSignal || this.currentConfig.categoryModes[localSignal.category] === "off") {
      return null;
    }

    if (localSignal.confidence >= 0.72) {
      await this.localVideoLabelStore.rememberSignal(context.bvid, localSignal);
    }

    return this.buildLocalSignalSegment(context.bvid, localSignal);
  }

  private pickPreferredLocalSignal(
    commentSignal: LocalVideoSignal | null,
    pageSignal: LocalVideoSignal | null
  ): LocalVideoSignal | null {
    if (commentSignal && pageSignal) {
      return commentSignal.confidence >= pageSignal.confidence ? commentSignal : pageSignal;
    }

    return commentSignal ?? pageSignal;
  }

  private async handleLocalBadgeDecision(segment: SegmentRecord, decision: "confirm" | "dismiss"): Promise<void> {
    if (!this.currentContext || !segment.UUID.startsWith("local-signal:")) {
      return;
    }

    if (decision === "confirm") {
      await this.localVideoLabelStore.rememberManual(this.currentContext.bvid, segment.category, `手动保留 ${CATEGORY_LABELS[segment.category]}`);
      this.currentTitleLabel = this.buildLocalSignalSegment(this.currentContext.bvid, {
        category: segment.category,
        source: "manual",
        reason: `手动保留 ${CATEGORY_LABELS[segment.category]}`
      });
      this.updateTitleBadge(this.currentTitleLabel);
      this.panel.setFullVideoLabels([this.currentTitleLabel]);
      this.notices.show({
        id: `local-label-confirm:${this.currentContext.bvid}`,
        title: "已保留本地标签",
        message: `后续会继续把这个视频视作“${CATEGORY_LABELS[segment.category]}”。`,
        durationMs: 2800
      });
      return;
    }

    await this.localVideoLabelStore.dismiss(this.currentContext.bvid, `手动忽略 ${CATEGORY_LABELS[segment.category]}`);
    this.currentTitleLabel = null;
    this.titleBadge.clear();
    this.panel.setFullVideoLabels([]);
    this.updateRuntimeStatus({
      kind: this.currentSegments.length > 0 ? "loaded" : "empty",
      message: this.currentSegments.length > 0 ? `已加载 ${this.currentSegments.length} 个可处理片段` : "当前视频暂无可显示的整视频标签",
      bvid: this.currentContext.bvid,
      segmentCount: this.currentSegments.length
    });
    this.notices.show({
      id: `local-label-dismiss:${this.currentContext.bvid}`,
      title: "已忽略本地标签",
      message: "当前视频后续不会继续显示这条本地商业提示。",
      durationMs: 2800
    });
  }

  private async submitVote(segment: SegmentRecord, type: 0 | 1): Promise<TitleBadgeVoteResult> {
    const response = await this.client.vote(segment.UUID, type, this.currentConfig);
    if (response.successType === 1) {
      await this.voteHistoryStore.remember(segment.UUID);
      if (this.currentTitleLabel?.UUID === segment.UUID) {
        this.updateTitleBadge(this.currentTitleLabel);
      }
      this.notices.show({
        id: `segment-vote:${segment.UUID}:${type}`,
        title: "反馈已提交",
        message: type === 1 ? "已标记为“正确”，感谢反馈。" : "已标记为“有误”，感谢反馈。",
        durationMs: 2600
      });
      return "submitted";
    }

    if (response.successType === 0) {
      await this.voteHistoryStore.remember(segment.UUID);
      if (this.currentTitleLabel?.UUID === segment.UUID) {
        this.updateTitleBadge(this.currentTitleLabel);
      }
      this.notices.show({
        id: `segment-vote-duplicate:${segment.UUID}:${type}`,
        title: "已提交过反馈",
        message: "这个整视频标签你之前已经投过票了。",
        durationMs: 2800
      });
      return "duplicate";
    }

    this.notices.show({
      id: `segment-vote-error:${segment.UUID}:${type}`,
      title: "反馈提交失败",
      message:
        response.statusCode === 403
          ? "服务端拒绝了这次反馈，稍后可再试一次。"
          : response.statusCode === -1
            ? "请求没有送达 SponsorBlock 服务，请检查网络或 Tampermonkey 授权。"
            : response.responseText || `SponsorBlock API returned ${response.statusCode}`,
      durationMs: 3600
    });
    return "error";
  }

  private shouldResetSegmentState(currentTime: number, state: RuntimeSegmentState): boolean {
    return state.lastObservedTime !== null && currentTime < state.lastObservedTime - SEGMENT_REWIND_RESET_SEC;
  }

  private isSkipGraceActive(state: RuntimeSegmentState): boolean {
    return state.manualSkipGraceUntil !== null && Date.now() < state.manualSkipGraceUntil;
  }

  private dismissSkipGrace(segment: SegmentRecord): void {
    this.notices.dismiss(this.skipGraceNoticeIdForSegment(segment));
  }

  private suppressAutoSkipForCurrentSegment(segment: SegmentRecord): void {
    const state = this.getSegmentState(segment.UUID);
    state.manualSkipGraceUntil = null;
    state.manualSkipGraceShown = true;
    state.suppressedUntilExit = true;
    state.noticeShown = true;
    this.dismissSkipGrace(segment);
  }

  private startSkipGrace(segment: SegmentRecord, state: RuntimeSegmentState, message: string): void {
    state.manualSkipGraceUntil = Date.now() + SKIP_GRACE_WINDOW_MS;
    if (state.manualSkipGraceShown) {
      return;
    }

    state.manualSkipGraceShown = true;
    this.notices.show({
      id: this.skipGraceNoticeIdForSegment(segment),
      title: `${CATEGORY_LABELS[segment.category]}片段`,
      message,
      durationMs: SKIP_GRACE_WINDOW_MS,
      actions: [
        {
          label: "保留本段",
          variant: "secondary",
          onClick: () => {
            this.suppressAutoSkipForCurrentSegment(segment);
          }
        },
        {
          label: "立即跳过",
          variant: "primary",
          onClick: () => {
            const nextState = this.getSegmentState(segment.UUID);
            nextState.manualSkipGraceUntil = null;
            this.dismissSkipGrace(segment);
            this.performSkip(segment, "继续跳过");
            nextState.actionConsumed = true;
            nextState.noticeShown = true;
            nextState.suppressedUntilExit = true;
          }
        }
      ]
    });
  }

  private rearmSegmentState(id: string, state: RuntimeSegmentState, preserveSkipGraceShown = false): void {
    this.notices.dismiss(`segment:${id}`);
    this.notices.dismiss(`segment-result:${id}`);
    if (!preserveSkipGraceShown) {
      this.notices.dismiss(`segment-grace:${id}`);
    }
    if (state.mutedByScript) {
      this.deactivateMute(id);
    }
    state.actionConsumed = false;
    state.noticeShown = false;
    state.suppressedUntilExit = false;
    state.mutedByScript = false;
    state.poiShown = false;
    state.lastObservedTime = null;
    state.manualSkipGraceUntil = null;
    if (!preserveSkipGraceShown) {
      state.manualSkipGraceShown = false;
    }
  }

  private resetSegmentState(id: string, state: RuntimeSegmentState): void {
    this.rearmSegmentState(id, state);
  }
}
