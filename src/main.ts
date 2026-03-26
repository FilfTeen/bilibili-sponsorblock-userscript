import { gmAddStyle, gmRegisterMenuCommand } from "./platform/gm";
import { ensurePageBridge } from "./platform/page-bridge";
import { ConfigStore, StatsStore } from "./core/config-store";
import { ScriptController } from "./core/controller";
import { DynamicSponsorController } from "./features/dynamic-filter";
import { CommentSponsorController } from "./features/comment-filter";
import { styles } from "./ui/styles";
import { debugLog, isSupportedLocation } from "./utils/dom";

async function bootstrap(): Promise<void> {
  if (!isSupportedLocation(window.location.href)) {
    return;
  }

  gmAddStyle(styles);
  ensurePageBridge();

  const configStore = new ConfigStore();
  const statsStore = new StatsStore();
  await Promise.all([configStore.load(), statsStore.load()]);

  const controller = new ScriptController(configStore, statsStore);
  const dynamicSponsorController = new DynamicSponsorController(configStore);
  const commentSponsorController = new CommentSponsorController(configStore);
  dynamicSponsorController.start();
  commentSponsorController.start();
  await controller.start();

  gmRegisterMenuCommand("Toggle BSB panel", () => controller.togglePanel());
  gmRegisterMenuCommand("Clear BSB cache", () => {
    void controller.clearCache();
  });
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
