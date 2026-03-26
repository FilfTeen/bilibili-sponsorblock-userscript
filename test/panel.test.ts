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
});
