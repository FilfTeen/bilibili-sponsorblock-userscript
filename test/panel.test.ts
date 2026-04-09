import { describe, expect, it, vi } from "vitest";
import { cloneDefaultConfig } from "../src/core/config-store";
import { SettingsPanel } from "../src/ui/panel";

describe("settings panel", () => {
  it("mounts globally and toggles a hidden modal", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    const backdrop = document.querySelector<HTMLElement>(".bsb-tm-panel-backdrop");
    expect(backdrop?.hidden).toBe(true);
    expect(window.getComputedStyle(backdrop!).display).toBe("none");

    panel.toggle();
    expect(backdrop?.hidden).toBe(false);
  });

  it("can open directly on the help tab", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("help");

    expect(document.querySelector<HTMLElement>("[data-section='help']")?.hidden).toBe(false);
    expect(document.querySelector<HTMLButtonElement>("[data-tab='help']")?.classList.contains("active")).toBe(true);
  });

  it("computes a stable panel height token when opened", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.open("behavior");

    const backdrop = document.querySelector<HTMLElement>(".bsb-tm-panel-backdrop");
    expect(backdrop?.style.getPropertyValue("--bsb-tm-panel-height")).not.toBe("");
  });

  it("blocks invalid regex updates and shows a validation message", async () => {
    const onPatchConfig = vi.fn(async () => {});
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig,
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
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

  it("renders helper text for dynamic and comment filter modes", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("filters");

    const section = document.querySelector<HTMLElement>("[data-section='filters']");
    expect(section?.textContent).toContain("选择是隐藏动态内容、仅保留标签提示");
    expect(section?.textContent).toContain("选择是隐藏命中评论、仅保留评论标签提示");
  });

  it("shows comment location toggle and enables it by default", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("filters");

    const field = Array.from(document.querySelectorAll<HTMLLabelElement>(".bsb-tm-field-toggle")).find((candidate) =>
      candidate.textContent?.includes("显示评论区属地（开盒）")
    );
    const checkbox = field?.querySelector<HTMLInputElement>("input[type='checkbox']");

    expect(field?.textContent).toContain("显示评论区属地（开盒）");
    expect(checkbox?.checked).toBe(true);
  });

  it("shows maintenance actions once and wires clear-cache on overview", async () => {
    const onClearCache = vi.fn(async () => {});
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache,
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("overview");

    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".bsb-tm-button"));
    expect(buttons.filter((button) => button.textContent === "恢复默认设置")).toHaveLength(1);

    const clearButton = buttons.find((button) => button.textContent === "清理缓存");
    expect(clearButton).toBeTruthy();
    clearButton?.click();
    await Promise.resolve();

    expect(onClearCache).toHaveBeenCalledTimes(1);
  });

  it("preserves content scroll when config changes re-render the active tab", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("behavior");

    const content = document.querySelector<HTMLElement>(".bsb-tm-panel-content");
    expect(content).toBeTruthy();
    content!.scrollTop = 188;

    panel.updateConfig({
      ...cloneDefaultConfig(),
      compactVideoHeader: false
    });

    expect(document.querySelector<HTMLElement>("[data-section='behavior']")?.hidden).toBe(false);
    expect(content?.scrollTop).toBe(188);
  });

  it("reverts a checkbox when persisting the change fails", async () => {
    const onPatchConfig = vi.fn(async () => {
      throw new Error("save failed");
    });
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig,
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("behavior");

    const field = Array.from(document.querySelectorAll<HTMLLabelElement>(".bsb-tm-field-toggle")).find((candidate) =>
      candidate.textContent?.includes("启用紧凑视频顶部栏")
    );
    const checkbox = field?.querySelector<HTMLInputElement>("input[type='checkbox']");

    expect(checkbox?.checked).toBe(true);
    checkbox!.checked = false;
    checkbox!.dispatchEvent(new Event("change"));
    await Promise.resolve();
    await Promise.resolve();

    expect(onPatchConfig).toHaveBeenCalledWith({ compactVideoHeader: false });
    expect(checkbox?.checked).toBe(true);
    expect(field?.dataset.controlState).toBe("on");
  });

  it("renders overview feature cards in title-chip-copy order", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("overview");

    const firstCard = document.querySelector<HTMLElement>(".bsb-tm-overview-grid .bsb-tm-feature-card");
    expect(firstCard).toBeTruthy();
    expect(firstCard?.querySelector(".bsb-tm-feature-head")).toBeNull();
    expect(firstCard?.children[0]?.className).toContain("bsb-tm-feature-title");
    expect(firstCard?.children[1]?.className).toContain("bsb-tm-feature-value");
    expect(firstCard?.children[2]?.className).toContain("bsb-tm-section-description");
  });
});
