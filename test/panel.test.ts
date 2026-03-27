import { describe, expect, it, vi } from "vitest";
import { cloneDefaultConfig } from "../src/core/config-store";
import { SettingsPanel } from "../src/ui/panel";

describe("settings panel", () => {
  it("mounts globally and toggles a hidden modal", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    const backdrop = document.querySelector<HTMLElement>(".bsb-tm-panel-backdrop");
    expect(backdrop?.hidden).toBe(true);
    expect(window.getComputedStyle(backdrop!).display).toBe("none");

    panel.toggle();
    expect(backdrop?.hidden).toBe(false);
  });

  it("blocks invalid regex updates and shows a validation message", async () => {
    const onPatchConfig = vi.fn(async () => {});
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig,
      onCategoryModeChange: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    const regexInput = Array.from(document.querySelectorAll<HTMLLabelElement>(".bsb-tm-field.stacked")).find(
      (field) => field.querySelector("span")?.textContent === "动态关键词正则"
    )?.querySelector<HTMLInputElement>("input");

    expect(regexInput).toBeTruthy();
    regexInput!.value = "/(/";
    regexInput!.dispatchEvent(new Event("change"));
    await Promise.resolve();

    expect(onPatchConfig).not.toHaveBeenCalled();
    expect(document.querySelector(".bsb-tm-validation-message")?.textContent).toContain("正则格式无效");
  });
});
