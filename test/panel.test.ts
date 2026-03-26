import { describe, expect, it, vi } from "vitest";
import { cloneDefaultConfig } from "../src/core/config-store";
import { SettingsPanel } from "../src/ui/panel";

describe("settings panel", () => {
  it("mounts globally and toggles panel state", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    const button = document.querySelector(".bsb-tm-entry-button");
    expect(button?.classList.contains("is-floating")).toBe(true);
    expect(button?.getAttribute("aria-expanded")).toBe("false");

    panel.toggle();
    expect(button?.getAttribute("aria-expanded")).toBe("true");
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
