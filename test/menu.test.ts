import { describe, expect, it, vi } from "vitest";
import { QOL_CORE_MENU_LABELS, registerQolCoreMenuCommands, type QolCoreMenuController } from "../src/runtime/menu";

describe("registerQolCoreMenuCommands", () => {
  it("registers one console entry and no duplicate toggle entry", () => {
    const controller: QolCoreMenuController = {
      openPanel: vi.fn(),
      openHelp: vi.fn(),
      clearCache: vi.fn()
    };
    const registered: Array<{ label: string; handler: () => void }> = [];

    registerQolCoreMenuCommands(controller, (label, handler) => {
      registered.push({ label, handler });
    });

    expect(registered.map((entry) => entry.label)).toEqual([...QOL_CORE_MENU_LABELS]);
    expect(registered.map((entry) => entry.label)).not.toContain("切换 BSB 控制台");
    expect(registered.map((entry) => entry.label)).toEqual([
      "打开 QoL Core 控制台",
      "打开 QoL Core 帮助",
      "清理 QoL Core 缓存"
    ]);

    registered[0]?.handler();
    registered[1]?.handler();
    registered[2]?.handler();

    expect(controller.openPanel).toHaveBeenCalledTimes(1);
    expect(controller.openHelp).toHaveBeenCalledTimes(1);
    expect(controller.clearCache).toHaveBeenCalledTimes(1);
  });
});
