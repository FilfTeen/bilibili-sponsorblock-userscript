import { afterEach, describe, expect, it, vi } from "vitest";
import { cloneDefaultConfig, ConfigStore, StatsStore } from "../src/core/config-store";
import { PersistentCache } from "../src/core/cache";
import { LocalVideoLabelStore } from "../src/core/local-label-store";
import { VoteHistoryStore } from "../src/core/vote-history-store";
import { ScriptController } from "../src/core/controller";
import { VIDEO_SIGNAL_EVENT, VIDEO_SIGNAL_FEEDBACK_EVENT, createCommentFeedbackToken } from "../src/features/comment-filter";
import * as pageBridge from "../src/platform/page-bridge";
import * as domUtils from "../src/utils/dom";
import * as videoContextUtils from "../src/utils/video-context";
import type { FetchResponse, SegmentRecord, VideoContext } from "../src/types";

function createController(): ScriptController {
  vi.stubGlobal("GM_getValue", vi.fn(async (_key, fallback) => fallback));
  vi.stubGlobal("GM_setValue", vi.fn());
  return new ScriptController(
    new ConfigStore(),
    new StatsStore(),
    new PersistentCache<FetchResponse>(),
    new LocalVideoLabelStore(),
    new VoteHistoryStore()
  );
}

function setDocumentHidden(hidden: boolean): () => void {
  const original = Object.getOwnPropertyDescriptor(document, "hidden");
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: hidden
  });

  return () => {
    if (original) {
      Object.defineProperty(document, "hidden", original);
      return;
    }

    Reflect.deleteProperty(document, "hidden");
  };
}

const skipSegment: SegmentRecord = {
  UUID: "segment-skip",
  category: "sponsor",
  actionType: "skip",
  segment: [10, 20],
  start: 10,
  end: 20,
  duration: 10,
  mode: "auto"
};

describe("script controller", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("undoes a skip back to the segment start and opens a grace window", async () => {
    const controller = createController();
    Reflect.set(controller, "currentConfig", cloneDefaultConfig());

    const video = document.createElement("video");
    video.currentTime = 12;
    Reflect.set(controller, "currentVideo", video);

    const notices = Reflect.get(controller, "notices") as { show: (options: unknown) => void };
    const showSpy = vi.spyOn(notices, "show");

    await Reflect.get(controller, "performSkip").call(controller, skipSegment, "自动跳过");

    expect(video.currentTime).toBe(20);

    const resultNotice = showSpy.mock.calls[0]?.[0] as {
      actions?: Array<{ onClick: () => void }>;
    };
    resultNotice.actions?.[0]?.onClick();

    const state = Reflect.get(controller, "getSegmentState").call(controller, skipSegment.UUID) as {
      manualSkipGraceShown: boolean;
      manualSkipGraceUntil: number | null;
    };
    expect(video.currentTime).toBe(10);
    expect(state.manualSkipGraceShown).toBe(true);
    expect(state.manualSkipGraceUntil).toBeTypeOf("number");
    expect(showSpy.mock.calls[1]?.[0]).toMatchObject({
      id: "segment-grace:segment-skip",
      durationMs: 10_000
    });
    expect((showSpy.mock.calls[1]?.[0] as { actions?: Array<{ label: string }> }).actions?.map((action) => action.label)).toEqual([
      "保留本段",
      "立即跳过"
    ]);
  });

  it("keeps the current segment when the user chooses to keep watching", () => {
    const controller = createController();
    const notices = Reflect.get(controller, "notices") as { show: (options: unknown) => void };
    const showSpy = vi.spyOn(notices, "show");
    const state = Reflect.get(controller, "getSegmentState").call(controller, skipSegment.UUID) as {
      manualSkipGraceShown: boolean;
      manualSkipGraceUntil: number | null;
      suppressedUntilExit: boolean;
      noticeShown: boolean;
    };

    Reflect.get(controller, "startSkipGrace").call(
      controller,
      skipSegment,
      state,
      "检测到你主动跳转至该片段，10秒内不会自动跳过。"
    );

    const notice = showSpy.mock.calls[0]?.[0] as {
      actions?: Array<{ label: string; onClick: () => void }>;
    };
    const keepWatching = notice.actions?.find((action) => action.label === "保留本段");
    keepWatching?.onClick();

    expect(state.manualSkipGraceUntil).toBeNull();
    expect(state.suppressedUntilExit).toBe(true);
    expect(state.noticeShown).toBe(true);
  });

  it("does not auto-skip again when the user scrubs inside a kept segment", () => {
    const controller = createController();
    Reflect.set(controller, "currentConfig", cloneDefaultConfig());
    Reflect.set(controller, "currentSegments", [skipSegment]);

    const video = document.createElement("video");
    video.currentTime = 13;
    Reflect.set(controller, "currentVideo", video);

    const state = Reflect.get(controller, "getSegmentState").call(controller, skipSegment.UUID) as {
      actionConsumed: boolean;
      suppressedUntilExit: boolean;
      noticeShown: boolean;
      lastObservedTime: number | null;
      manualSkipGraceUntil: number | null;
      manualSkipGraceShown: boolean;
    };
    state.suppressedUntilExit = true;
    state.noticeShown = true;
    state.manualSkipGraceShown = true;
    state.lastObservedTime = 17;

    const performSkipSpy = vi.spyOn(controller as never, "performSkip" as never);

    Reflect.get(controller, "tick").call(controller);

    expect(state.suppressedUntilExit).toBe(true);
    expect(state.manualSkipGraceUntil).toBeNull();
    expect(performSkipSpy).not.toHaveBeenCalled();
    expect(video.currentTime).toBe(13);
  });

  it("does not raise duplicate grace notices for the same segment session", () => {
    const controller = createController();
    const notices = Reflect.get(controller, "notices") as { show: (options: unknown) => void };
    const showSpy = vi.spyOn(notices, "show");
    const state = Reflect.get(controller, "getSegmentState").call(controller, skipSegment.UUID) as {
      manualSkipGraceShown: boolean;
      manualSkipGraceUntil: number | null;
    };

    Reflect.get(controller, "startSkipGrace").call(
      controller,
      skipSegment,
      state,
      "已回到广告开始处，10 秒内不会再次自动跳过。"
    );
    Reflect.get(controller, "startSkipGrace").call(
      controller,
      skipSegment,
      state,
      "检测到你回到了该片段，10 秒内不会再次自动跳过。"
    );

    expect(showSpy).toHaveBeenCalledTimes(1);
    expect(state.manualSkipGraceShown).toBe(true);
  });

  it("restores an open settings panel after stop/start", async () => {
    const controller = createController();
    vi.spyOn(controller as any, "refreshCurrentVideo").mockImplementation(async () => {});

    await controller.start();
    controller.openPanel();
    expect(document.querySelector<HTMLElement>(".bsb-tm-panel-backdrop")?.hidden).toBe(false);

    controller.stop();
    expect(document.querySelector(".bsb-tm-panel-backdrop")).toBeNull();

    await controller.start();
    expect(document.querySelector<HTMLElement>(".bsb-tm-panel-backdrop")?.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>("[data-section='overview']")?.hidden).toBe(false);
  });

  it("restores the help tab after stop/start when opened from the menu", async () => {
    const controller = createController();
    vi.spyOn(controller as any, "refreshCurrentVideo").mockImplementation(async () => {});

    await controller.start();
    controller.openHelp();
    expect(document.querySelector<HTMLElement>("[data-section='help']")?.hidden).toBe(false);

    controller.stop();
    await controller.start();

    expect(document.querySelector<HTMLElement>(".bsb-tm-panel-backdrop")?.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>("[data-section='help']")?.hidden).toBe(false);
    expect(document.querySelector<HTMLButtonElement>("[data-tab='help']")?.classList.contains("active")).toBe(true);
  });

  it("does not restore a panel opened via toggle after stop/start", async () => {
    const controller = createController();
    vi.spyOn(controller as any, "refreshCurrentVideo").mockImplementation(async () => {});

    await controller.start();
    controller.togglePanel();
    expect(document.querySelector<HTMLElement>(".bsb-tm-panel-backdrop")?.hidden).toBe(false);

    controller.stop();
    await controller.start();

    expect(document.querySelector<HTMLElement>(".bsb-tm-panel-backdrop")?.hidden).toBe(true);
  });

  it("does not force the panel back to the original menu tab after visibility recovery", async () => {
    const controller = createController();
    vi.spyOn(controller as any, "refreshCurrentVideo").mockImplementation(async () => {});

    await controller.start();
    controller.openHelp();
    document.querySelector<HTMLButtonElement>("[data-tab='filters']")?.click();
    expect(document.querySelector<HTMLButtonElement>("[data-tab='filters']")?.classList.contains("active")).toBe(true);

    const restoreHidden = setDocumentHidden(true);
    document.dispatchEvent(new Event("visibilitychange"));
    restoreHidden();

    const restoreVisible = setDocumentHidden(false);
    document.dispatchEvent(new Event("visibilitychange"));
    restoreVisible();

    expect(document.querySelector<HTMLButtonElement>("[data-tab='filters']")?.classList.contains("active")).toBe(true);
    expect(document.querySelector<HTMLElement>("[data-section='filters']")?.hidden).toBe(false);
  });

  it("restores the current active tab after a system stop/start", async () => {
    const controller = createController();
    vi.spyOn(controller as any, "refreshCurrentVideo").mockImplementation(async () => {});

    await controller.start();
    controller.openHelp();
    document.querySelector<HTMLButtonElement>("[data-tab='filters']")?.click();
    expect(document.querySelector<HTMLButtonElement>("[data-tab='filters']")?.classList.contains("active")).toBe(true);

    controller.stop();
    await controller.start();

    expect(document.querySelector<HTMLButtonElement>("[data-tab='filters']")?.classList.contains("active")).toBe(true);
    expect(document.querySelector<HTMLElement>("[data-section='filters']")?.hidden).toBe(false);
  });

  it("skips local title reasoning when an upstream whole-video label already exists", async () => {
    const controller = createController();
    const context: VideoContext = {
      bvid: "BV1xx411c7mK",
      cid: "12345",
      page: 1,
      title: "测试视频",
      href: "https://www.bilibili.com/video/BV1xx411c7mK"
    };
    const video = document.createElement("video");
    window.history.replaceState({}, "", context.href);

    Reflect.set(controller, "currentConfig", cloneDefaultConfig());
    vi.spyOn(pageBridge, "requestPageSnapshot").mockResolvedValue({
      url: context.href,
      initialState: null,
      playerManifest: null,
      playInfo: null
    });
    vi.spyOn(videoContextUtils, "resolveVideoContext").mockReturnValue(context);
    vi.spyOn(domUtils, "findVideoElement").mockReturnValue(video);
    vi.spyOn(Reflect.get(controller, "client"), "getSegments").mockResolvedValue([]);
    vi.spyOn(Reflect.get(controller, "videoLabelClient"), "getVideoLabel").mockResolvedValue("sponsor");
    const resolveLocalTitleLabelSpy = vi.spyOn(controller as never, "resolveLocalTitleLabel" as never);

    await Reflect.get(controller, "refreshCurrentVideo").call(controller, true);

    expect(resolveLocalTitleLabelSpy).not.toHaveBeenCalled();
    expect((Reflect.get(controller, "currentTitleLabel") as SegmentRecord | null)?.UUID).toBe("video-label:BV1xx411c7mK:sponsor");
  });

  it("does not let automatic signals override a manually kept local title label", () => {
    const controller = createController();
    const rememberSignalSpy = vi.spyOn(Reflect.get(controller, "localVideoLabelStore"), "rememberSignal");

    Reflect.set(controller, "started", true);
    Reflect.set(controller, "currentConfig", cloneDefaultConfig());
    Reflect.set(controller, "currentContext", {
      bvid: "BV1xx411c7mL",
      cid: "12345",
      page: 1,
      title: "测试视频",
      href: "https://www.bilibili.com/video/BV1xx411c7mL"
    } satisfies VideoContext);
    Reflect.set(controller, "currentTitleLabel", {
      UUID: "local-signal:BV1xx411c7mL:manual:sponsor",
      category: "sponsor",
      actionType: "full",
      segment: [0, 0],
      start: 0,
      end: 0,
      duration: 0,
      mode: "auto"
    } satisfies SegmentRecord);

    Reflect.get(controller, "handleVideoSignal").call(
      controller,
      new CustomEvent(VIDEO_SIGNAL_EVENT, {
        detail: {
          category: "sponsor",
          source: "comment-goods",
          confidence: 0.96,
          reason: "评论区命中商品卡广告"
        }
      })
    );

    expect((Reflect.get(controller, "currentTitleLabel") as SegmentRecord | null)?.UUID).toContain(":manual:");
    expect(rememberSignalSpy).not.toHaveBeenCalled();
  });

  it("does not flip an existing local video label from a weaker transient comment signal", () => {
    const controller = createController();
    const rememberSignalSpy = vi.spyOn(Reflect.get(controller, "localVideoLabelStore"), "rememberSignal");

    Reflect.set(controller, "started", true);
    Reflect.set(controller, "currentConfig", cloneDefaultConfig());
    Reflect.set(controller, "currentContext", {
      bvid: "BV1xx411c7mW",
      cid: "12345",
      page: 1,
      title: "测试视频",
      href: "https://www.bilibili.com/video/BV1xx411c7mW"
    } satisfies VideoContext);
    Reflect.set(controller, "currentRuntimeLocalSignal", {
      category: "sponsor",
      source: "page-heuristic",
      confidence: 0.82,
      reason: "标题和标签命中本地商业线索"
    });
    Reflect.set(controller, "currentTitleLabel", {
      UUID: "local-signal:BV1xx411c7mW:page-heuristic:sponsor",
      category: "sponsor",
      actionType: "full",
      segment: [0, 0],
      start: 0,
      end: 0,
      duration: 0,
      mode: "auto"
    } satisfies SegmentRecord);

    Reflect.get(controller, "handleVideoSignal").call(
      controller,
      new CustomEvent(VIDEO_SIGNAL_EVENT, {
        detail: {
          category: "selfpromo",
          source: "comment-suspicion",
          confidence: 0.79,
          reason: "单条评论弱导流线索"
        }
      })
    );

    expect((Reflect.get(controller, "currentTitleLabel") as SegmentRecord | null)?.category).toBe("sponsor");
    expect(rememberSignalSpy).not.toHaveBeenCalled();
  });

  it("accepts comment feedback as an automatic local signal without globally locking the video", async () => {
    const controller = createController();
    const rememberSignalSpy = vi.spyOn(Reflect.get(controller, "localVideoLabelStore"), "rememberSignal");

    Reflect.set(controller, "started", true);
    Reflect.set(controller, "currentConfig", cloneDefaultConfig());
    Reflect.set(controller, "currentContext", {
      bvid: "BV1xx411c7mM",
      cid: "12345",
      page: 1,
      title: "测试视频",
      href: "https://www.bilibili.com/video/BV1xx411c7mM"
    } satisfies VideoContext);

    Reflect.get(controller, "handleVideoSignalFeedback").call(
      controller,
      new CustomEvent(VIDEO_SIGNAL_FEEDBACK_EVENT, {
        detail: {
          category: "sponsor",
          decision: "confirm",
          source: "comment-suspicion",
          reason: "评论区用户反馈",
          feedbackToken: createCommentFeedbackToken()
        }
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(rememberSignalSpy).toHaveBeenCalledWith(
      "BV1xx411c7mM",
      expect.objectContaining({
        category: "sponsor",
        source: "comment-suspicion"
      })
    );
    expect((Reflect.get(controller, "currentTitleLabel") as SegmentRecord | null)?.UUID).toContain(":comment-suspicion:sponsor");
  });

  it("rejects forged comment feedback without a one-time token", async () => {
    const controller = createController();
    const rememberSignalSpy = vi.spyOn(Reflect.get(controller, "localVideoLabelStore"), "rememberSignal");

    Reflect.set(controller, "started", true);
    Reflect.set(controller, "currentConfig", cloneDefaultConfig());
    Reflect.set(controller, "currentContext", {
      bvid: "BV1xx411c7mT",
      cid: "12345",
      page: 1,
      title: "测试视频",
      href: "https://www.bilibili.com/video/BV1xx411c7mT"
    } satisfies VideoContext);

    Reflect.get(controller, "handleVideoSignalFeedback").call(
      controller,
      new CustomEvent(VIDEO_SIGNAL_FEEDBACK_EVENT, {
        detail: {
          category: "sponsor",
          decision: "confirm",
          source: "comment-suspicion",
          reason: "伪造反馈"
        }
      })
    );
    await Promise.resolve();

    expect(rememberSignalSpy).not.toHaveBeenCalled();
  });

  it("does not let comment feedback override an existing manual video decision", async () => {
    const controller = createController();
    const store = Reflect.get(controller, "localVideoLabelStore") as LocalVideoLabelStore;
    const rememberSignalSpy = vi.spyOn(store, "rememberSignal");
    const notices = Reflect.get(controller, "notices") as { show: (options: unknown) => void };
    const showSpy = vi.spyOn(notices, "show");

    Reflect.set(controller, "started", true);
    Reflect.set(controller, "currentConfig", cloneDefaultConfig());
    Reflect.set(controller, "currentContext", {
      bvid: "BV1xx411c7mU",
      cid: "12345",
      page: 1,
      title: "测试视频",
      href: "https://www.bilibili.com/video/BV1xx411c7mU"
    } satisfies VideoContext);

    await store.rememberManual("BV1xx411c7mU", "sponsor", "既有手动保留");
    Reflect.get(controller, "handleVideoSignalFeedback").call(
      controller,
      new CustomEvent(VIDEO_SIGNAL_FEEDBACK_EVENT, {
        detail: {
          category: "sponsor",
          decision: "dismiss",
          source: "comment-suspicion",
          reason: "重复反馈",
          feedbackToken: createCommentFeedbackToken()
        }
      })
    );
    await Promise.resolve();

    expect(rememberSignalSpy).not.toHaveBeenCalled();
    expect(showSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringContaining("comment-feedback-dismiss:BV1xx411c7mU")
      })
    );
  });

  it("keeps comment feedback available after a persisted manual video decision", async () => {
    const controller = createController();
    const store = Reflect.get(controller, "localVideoLabelStore") as LocalVideoLabelStore;
    const availabilitySpy = vi.fn();
    window.addEventListener("bsb:local-video-feedback-availability", availabilitySpy as EventListener);

    Reflect.set(controller, "started", true);
    Reflect.set(controller, "currentConfig", cloneDefaultConfig());
    Reflect.set(controller, "currentContext", {
      bvid: "BV1xx411c7mV",
      cid: "12345",
      page: 1,
      title: "测试视频",
      href: "https://www.bilibili.com/video/BV1xx411c7mV"
    } satisfies VideoContext);

    await store.rememberManual("BV1xx411c7mV", "sponsor", "既有手动保留");
    Reflect.get(controller, "syncLocalFeedbackAvailability").call(controller);

    expect((availabilitySpy.mock.calls[0]?.[0] as CustomEvent).detail).toMatchObject({
      enabled: true,
      locked: false,
      bvid: "BV1xx411c7mV"
    });
    window.removeEventListener("bsb:local-video-feedback-availability", availabilitySpy as EventListener);
  });

  it("blocks comment feedback when an upstream whole-video label is already present", async () => {
    const controller = createController();
    const rememberSignalSpy = vi.spyOn(Reflect.get(controller, "localVideoLabelStore"), "rememberSignal");
    const notices = Reflect.get(controller, "notices") as { show: (options: unknown) => void };
    const showSpy = vi.spyOn(notices, "show");

    Reflect.set(controller, "started", true);
    Reflect.set(controller, "currentConfig", cloneDefaultConfig());
    Reflect.set(controller, "currentContext", {
      bvid: "BV1xx411c7mN",
      cid: "12345",
      page: 1,
      title: "测试视频",
      href: "https://www.bilibili.com/video/BV1xx411c7mN"
    } satisfies VideoContext);
    Reflect.set(controller, "currentFullVideoLabels", [
      {
        UUID: "video-label:BV1xx411c7mN:sponsor",
        category: "sponsor",
        actionType: "full",
        segment: [0, 0],
        start: 0,
        end: 0,
        duration: 0,
        mode: "auto"
      } satisfies SegmentRecord
    ]);

    Reflect.get(controller, "handleVideoSignalFeedback").call(
      controller,
      new CustomEvent(VIDEO_SIGNAL_FEEDBACK_EVENT, {
        detail: {
          category: "sponsor",
          decision: "confirm",
          source: "comment-suspicion",
          reason: "评论区用户反馈",
          feedbackToken: createCommentFeedbackToken()
        }
      })
    );
    await Promise.resolve();

    expect(rememberSignalSpy).not.toHaveBeenCalled();
    expect(showSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "local-feedback-blocked:BV1xx411c7mN"
      })
    );
  });

  it("sanitizes upstream vote HTML errors before showing a notice", async () => {
    const controller = createController();
    const notices = Reflect.get(controller, "notices") as { show: (options: unknown) => void };
    const showSpy = vi.spyOn(notices, "show");
    vi.spyOn(Reflect.get(controller, "client"), "vote").mockResolvedValue({
      successType: -1,
      statusCode: 500,
      responseText: "<!DOCTYPE html><html lang=\"en\"><body><pre>Internal Server Error</pre></body></html>"
    });
    Reflect.set(controller, "currentConfig", cloneDefaultConfig());

    const result = await Reflect.get(controller, "submitVote").call(
      controller,
      {
        UUID: "real-upstream-full-uuid",
        category: "sponsor",
        actionType: "full",
        segment: [0, 0],
        start: 0,
        end: 0,
        duration: 0,
        mode: "auto"
      } satisfies SegmentRecord,
      1
    );

    expect(result).toBe("error");
    expect(showSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "反馈提交失败",
        message: "SponsorBlock 服务暂时异常（HTTP 500），反馈未提交，请稍后再试。"
      })
    );
    expect(JSON.stringify(showSpy.mock.calls)).not.toContain("<!DOCTYPE html>");
  });
});
