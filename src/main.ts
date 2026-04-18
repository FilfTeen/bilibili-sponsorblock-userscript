import { gmAddStyle } from "./platform/gm";
import { ensurePageBridge } from "./platform/page-bridge";
import { ConfigStore, StatsStore } from "./core/config-store";
import { PersistentCache } from "./core/cache";
import { LocalVideoLabelStore } from "./core/local-label-store";
import { VoteHistoryStore } from "./core/vote-history-store";
import { ScriptController } from "./core/controller";
import { DynamicSponsorController } from "./features/dynamic-filter";
import { CommentSponsorController } from "./features/comment-filter";
import { ThumbnailLabelController } from "./features/thumbnail-labels";
import { registerBsbMenuCommands } from "./runtime/menu";
import { mountMbga, mountMbgaUi } from "./features/mbga";
import { createRuntimeLifecycle } from "./runtime/lifecycle";
import { mbgaStyles, styles } from "./ui/styles";
import { debugLog, isSupportedLocation } from "./utils/dom";
import type { FetchResponse } from "./types";

function isTopLevelWindow(): boolean {
  try {
    return window.top === window.self;
  } catch (_error) {
    return false;
  }
}

async function safeRun(label: string, task: () => void | Promise<void>): Promise<void> {
  try {
    await task();
  } catch (error) {
    debugLog(`${label} failed`, error);
  }
}

async function bootstrap(): Promise<void> {
  if (!isTopLevelWindow()) {
    return;
  }
  if (!isSupportedLocation(window.location.href)) {
    return;
  }

  gmAddStyle(styles);
  ensurePageBridge();

  const configStore = new ConfigStore();
  const statsStore = new StatsStore();
  const cache = new PersistentCache<FetchResponse>();
  const localVideoLabelStore = new LocalVideoLabelStore();
  const voteHistoryStore = new VoteHistoryStore();
  await Promise.all([configStore.load(), statsStore.load(), localVideoLabelStore.load(), voteHistoryStore.load()]);

  // Handle MBGA features early
  const currentConfig = configStore.getSnapshot();
  mountMbga(currentConfig);

  if (currentConfig.mbgaEnabled && currentConfig.mbgaSimplifyUi) {
    gmAddStyle(mbgaStyles);
    mountMbgaUi(currentConfig);
  }

  const controller = new ScriptController(configStore, statsStore, cache, localVideoLabelStore, voteHistoryStore);
  const dynamicSponsorController = new DynamicSponsorController(configStore);
  const commentSponsorController = new CommentSponsorController(configStore);
  const thumbnailLabelController = new ThumbnailLabelController(configStore, cache, localVideoLabelStore);
  const runtime = createRuntimeLifecycle(
    async () => {
      await safeRun("dynamic controller startup", () => {
        dynamicSponsorController.start();
      });
      await safeRun("comment controller startup", () => {
        commentSponsorController.start();
      });
      await safeRun("thumbnail controller startup", () => {
        thumbnailLabelController.start();
      });
      await safeRun("video controller startup", async () => {
        await controller.start();
      });
    },
    () => {
      void safeRun("dynamic controller shutdown", () => {
        dynamicSponsorController.stop();
      });
      void safeRun("comment controller shutdown", () => {
        commentSponsorController.stop();
      });
      void safeRun("thumbnail controller shutdown", () => {
        thumbnailLabelController.stop();
      });
      void safeRun("video controller shutdown", () => {
        controller.stop();
      });
    }
  );

  registerBsbMenuCommands(controller);

  await runtime.start();
}

function ready(): Promise<void> {
  if (document.readyState === "loading") {
    return new Promise((resolve) => {
      document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
    });
  }
  return Promise.resolve();
}

void ready()
  .then(() => bootstrap())
  .catch((error) => {
    debugLog("Bootstrap failed", error);
  });
