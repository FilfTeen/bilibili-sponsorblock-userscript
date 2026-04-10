import { afterEach, describe, expect, it, vi } from "vitest";
import { cloneDefaultConfig, ConfigStore, StatsStore } from "../src/core/config-store";
import { PersistentCache } from "../src/core/cache";
import { LocalVideoLabelStore } from "../src/core/local-label-store";
import { VoteHistoryStore } from "../src/core/vote-history-store";
import { ScriptController } from "../src/core/controller";
import type { FetchResponse, SegmentRecord } from "../src/types";

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
});
