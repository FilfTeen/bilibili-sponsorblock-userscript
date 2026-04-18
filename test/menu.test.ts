import { describe, expect, it, vi } from "vitest";
import { BSB_MENU_LABELS, registerBsbMenuCommands, type BsbMenuController } from "../src/runtime/menu";

describe("registerBsbMenuCommands", () => {
  it("registers one console entry and no duplicate toggle entry", () => {
    const controller: BsbMenuController = {
      openPanel: vi.fn(),
      openHelp: vi.fn(),
      clearCache: vi.fn()
    };
    const registered: Array<{ label: string; handler: () => void }> = [];

    registerBsbMenuCommands(controller, (label, handler) => {
      registered.push({ label, handler });
    });

    expect(registered.map((entry) => entry.label)).toEqual([...BSB_MENU_LABELS]);
    expect(registered.map((entry) => entry.label)).not.toContain("切换 BSB 控制台");

    registered[0]?.handler();
    registered[1]?.handler();
    registered[2]?.handler();

    expect(controller.openPanel).toHaveBeenCalledTimes(1);
    expect(controller.openHelp).toHaveBeenCalledTimes(1);
    expect(controller.clearCache).toHaveBeenCalledTimes(1);
  });
});
