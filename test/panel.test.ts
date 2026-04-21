import { beforeEach, describe, expect, it, vi } from "vitest";
import { CATEGORY_LABELS } from "../src/constants";
import { cloneDefaultConfig } from "../src/core/config-store";
import { SettingsPanel } from "../src/ui/panel";
import { styles } from "../src/ui/styles";
import {
  clearDiagnostics,
  getDiagnosticEvents,
  isDiagnosticDebugEnabled,
  reportDiagnostic,
  setDiagnosticDebugEnabled
} from "../src/utils/diagnostics";

beforeEach(() => {
  setDiagnosticDebugEnabled(false);
  clearDiagnostics();
  const style = document.createElement("style");
  style.textContent = styles;
  document.head.appendChild(style);
});

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

  it("keeps inactive sections hidden after opening a tab", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.open("filters");

    const hiddenSections = Array.from(document.querySelectorAll<HTMLElement>(".bsb-tm-panel-section")).filter(
      (section) => section.dataset.section !== "filters"
    );
    expect(hiddenSections.length).toBeGreaterThan(0);
    for (const section of hiddenSections) {
      expect(section.hidden).toBe(true);
      expect(section.getAttribute("aria-hidden")).toBe("true");
      expect(window.getComputedStyle(section).display).toBe("none");
    }
  });

  it("shows exactly one visible section after tab switches", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.open("overview");
    document.querySelector<HTMLButtonElement>("[data-tab='behavior']")?.click();

    const visibleSections = Array.from(document.querySelectorAll<HTMLElement>(".bsb-tm-panel-section")).filter(
      (section) => !section.hidden && window.getComputedStyle(section).display !== "none"
    );
    expect(visibleSections).toHaveLength(1);
    expect(visibleSections[0]?.dataset.section).toBe("behavior");
  });

  it("does not keep pointer focus on tab buttons after switching tabs", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.open("overview");
    const behaviorTab = document.querySelector<HTMLButtonElement>("[data-tab='behavior']");
    expect(behaviorTab).toBeTruthy();

    behaviorTab!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    behaviorTab!.click();

    expect(document.activeElement).not.toBe(behaviorTab);
    expect(behaviorTab?.dataset.pointerFocus).toBeUndefined();
    expect(document.querySelector<HTMLElement>("[data-section='behavior']")?.hidden).toBe(false);
  });

  it("renders a dedicated transparency tab with all tag toggles defaulting to off", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("transparency");

    expect(document.querySelector<HTMLElement>("[data-section='transparency']")?.hidden).toBe(false);
    expect(document.querySelector<HTMLButtonElement>("[data-tab='transparency']")?.classList.contains("active")).toBe(true);

    for (const text of [
      "标题商业标签使用透明模式",
      "封面胶囊标签使用透明模式",
      "评论广告标签使用透明模式",
      "评论属地标签使用透明模式",
      "动态页商业标签使用透明模式"
    ]) {
      const field = Array.from(document.querySelectorAll<HTMLLabelElement>(".bsb-tm-field-toggle")).find((candidate) =>
        candidate.textContent?.includes(text)
      );
      expect(field?.querySelector<HTMLInputElement>("input[type='checkbox']")?.checked).toBe(false);
    }
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

  it("restores the active tab scroll position after closing and reopening the panel", () => {
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
    content!.scrollTop = 244;

    panel.close("user");
    content!.scrollTop = 0;
    panel.open();

    expect(document.querySelector<HTMLElement>("[data-section='behavior']")?.hidden).toBe(false);
    expect(content?.scrollTop).toBe(244);
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

  it("does not replace an active checkbox after a successful config save", async () => {
    const baseConfig = cloneDefaultConfig();
    let panel: SettingsPanel;
    const onPatchConfig = vi.fn(async (patch: Partial<ReturnType<typeof cloneDefaultConfig>>) => {
      panel.updateConfig({
        ...baseConfig,
        ...patch
      });
    });
    panel = new SettingsPanel(baseConfig, { skipCount: 0, minutesSaved: 0 }, {
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

    const nextField = Array.from(document.querySelectorAll<HTMLLabelElement>(".bsb-tm-field-toggle")).find((candidate) =>
      candidate.textContent?.includes("启用紧凑视频顶部栏")
    );
    const nextCheckbox = nextField?.querySelector<HTMLInputElement>("input[type='checkbox']");

    expect(onPatchConfig).toHaveBeenCalledWith({ compactVideoHeader: false });
    expect(nextCheckbox).toBe(checkbox);
    expect(nextField).toBe(field);
    expect(nextCheckbox?.checked).toBe(false);
    expect(nextField?.dataset.controlState).toBe("off");
  });

  it("keeps checkbox focus while an async save is pending", async () => {
    let resolveSave: () => void = () => {};
    const onPatchConfig = vi.fn(() => new Promise<void>((resolve) => {
      resolveSave = resolve;
    }));
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

    checkbox!.focus();
    checkbox!.checked = false;
    checkbox!.dispatchEvent(new Event("change"));
    await Promise.resolve();

    expect(onPatchConfig).toHaveBeenCalledWith({ compactVideoHeader: false });
    expect(checkbox?.disabled).toBe(false);
    expect(checkbox?.getAttribute("aria-busy")).toBe("true");
    expect(field?.dataset.controlSaving).toBe("true");
    expect(document.activeElement).toBe(checkbox);

    checkbox!.checked = true;
    checkbox!.dispatchEvent(new Event("change"));
    await Promise.resolve();
    expect(checkbox?.checked).toBe(false);

    resolveSave();
    await Promise.resolve();
    await Promise.resolve();

    expect(checkbox?.getAttribute("aria-busy")).toBeNull();
    expect(field?.dataset.controlSaving).toBeUndefined();
  });

  it("does not replay select-card focus styling after a pointer selection save", async () => {
    const baseConfig = cloneDefaultConfig();
    let panel: SettingsPanel;
    const onPatchConfig = vi.fn(async (patch: Partial<ReturnType<typeof cloneDefaultConfig>>) => {
      panel.updateConfig({
        ...baseConfig,
        ...patch
      });
    });
    panel = new SettingsPanel(baseConfig, { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig,
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("behavior");

    const field = Array.from(document.querySelectorAll<HTMLLabelElement>(".bsb-tm-field.stacked")).find((candidate) =>
      candidate.textContent?.includes("首页 / 列表卡片标签")
    );
    const select = field?.querySelector<HTMLSelectElement>("select");

    expect(select).toBeTruthy();
    select!.focus();
    select!.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    select!.value = "off";
    select!.dispatchEvent(new Event("change", { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();

    const nextField = Array.from(document.querySelectorAll<HTMLLabelElement>(".bsb-tm-field.stacked")).find((candidate) =>
      candidate.textContent?.includes("首页 / 列表卡片标签")
    );
    const nextSelect = nextField?.querySelector<HTMLSelectElement>("select");

    expect(onPatchConfig).toHaveBeenCalledWith({ thumbnailLabelMode: "off" });
    expect(nextSelect).toBe(select);
    expect(document.activeElement).not.toBe(select);
  });

  it("keeps pointer-origin select focus suppressed until focus leaves the card", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("filters");

    const field = Array.from(document.querySelectorAll<HTMLLabelElement>(".bsb-tm-field.stacked")).find((candidate) =>
      candidate.textContent?.includes("动态过滤模式")
    );
    const select = field?.querySelector<HTMLSelectElement>("select");
    expect(field).toBeTruthy();
    expect(select).toBeTruthy();

    select!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    select!.focus();
    expect(field?.dataset.pointerFocus).toBe("true");
    expect(select?.dataset.pointerFocus).toBe("true");

    select!.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(field?.dataset.pointerFocus).toBe("true");
    expect(select?.dataset.pointerFocus).toBe("true");

    select!.blur();
    expect(field?.dataset.pointerFocus).toBeUndefined();
    expect(select?.dataset.pointerFocus).toBeUndefined();
  });

  it("suppresses pointer-origin focus when the pointer lands on the select card chrome", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("behavior");

    const field = Array.from(document.querySelectorAll<HTMLLabelElement>(".bsb-tm-field.stacked")).find((candidate) =>
      candidate.textContent?.includes("首页 / 列表卡片标签")
    );
    const group = field?.closest<HTMLElement>(".bsb-tm-form-group");
    const select = field?.querySelector<HTMLSelectElement>("select");
    expect(field).toBeTruthy();
    expect(group).toBeTruthy();
    expect(select).toBeTruthy();

    field!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    select!.focus();

    expect(field?.dataset.pointerFocus).toBe("true");
    expect(select?.dataset.pointerFocus).toBe("true");
    expect(group?.dataset.pointerFocus).toBe("true");
    expect(field?.dataset.controlActive).toBeUndefined();
    expect(select?.dataset.controlActive).toBeUndefined();
    expect(group?.dataset.controlActive).toBeUndefined();

    select!.blur();

    expect(field?.dataset.pointerFocus).toBeUndefined();
    expect(select?.dataset.pointerFocus).toBeUndefined();
    expect(group?.dataset.pointerFocus).toBeUndefined();
    expect(field?.dataset.controlActive).toBeUndefined();
    expect(select?.dataset.controlActive).toBeUndefined();
    expect(group?.dataset.controlActive).toBeUndefined();
  });

  it("uses click-selected visuals only when the pointer lands on the real select control", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("behavior");

    const field = Array.from(document.querySelectorAll<HTMLLabelElement>(".bsb-tm-field.stacked")).find((candidate) =>
      candidate.textContent?.includes("首页 / 列表卡片标签")
    );
    const group = field?.closest<HTMLElement>(".bsb-tm-form-group");
    const select = field?.querySelector<HTMLSelectElement>("select");
    expect(field).toBeTruthy();
    expect(group).toBeTruthy();
    expect(select).toBeTruthy();

    select!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    select!.focus();

    expect(field?.dataset.pointerFocus).toBe("true");
    expect(group?.dataset.pointerFocus).toBe("true");
    expect(select?.dataset.pointerFocus).toBe("true");
    expect(field?.dataset.controlActive).toBe("true");
    expect(group?.dataset.controlActive).toBe("true");
    expect(select?.dataset.controlActive).toBe("true");

    select!.blur();

    expect(field?.dataset.pointerFocus).toBeUndefined();
    expect(group?.dataset.pointerFocus).toBeUndefined();
    expect(select?.dataset.pointerFocus).toBeUndefined();
    expect(field?.dataset.controlActive).toBeUndefined();
    expect(group?.dataset.controlActive).toBeUndefined();
    expect(select?.dataset.controlActive).toBeUndefined();
  });

  it("keeps same-value pointer select active visuals until the select closes", () => {
    vi.useFakeTimers();
    try {
      const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
        onPatchConfig: vi.fn(async () => {}),
        onCategoryModeChange: vi.fn(async () => {}),
        onClearCache: vi.fn(async () => {}),
        onReset: vi.fn(async () => {})
      });

      panel.mount();
      panel.open("behavior");

      const field = Array.from(document.querySelectorAll<HTMLLabelElement>(".bsb-tm-field.stacked")).find((candidate) =>
        candidate.textContent?.includes("首页 / 列表卡片标签")
      );
      const group = field?.closest<HTMLElement>(".bsb-tm-form-group");
      const select = field?.querySelector<HTMLSelectElement>("select");
      expect(field).toBeTruthy();
      expect(group).toBeTruthy();
      expect(select).toBeTruthy();

      select!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      select!.focus();
      select!.value = select!.value;
      select!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

      expect(field?.dataset.pointerFocus).toBe("true");
      expect(group?.dataset.pointerFocus).toBe("true");
      expect(select?.dataset.pointerFocus).toBe("true");
      expect(field?.dataset.controlActive).toBe("true");
      expect(group?.dataset.controlActive).toBe("true");
      expect(select?.dataset.controlActive).toBe("true");

      vi.advanceTimersByTime(5000);

      expect(field?.dataset.pointerFocus).toBe("true");
      expect(group?.dataset.pointerFocus).toBe("true");
      expect(select?.dataset.pointerFocus).toBe("true");
      expect(field?.dataset.controlActive).toBe("true");
      expect(group?.dataset.controlActive).toBe("true");
      expect(select?.dataset.controlActive).toBe("true");

      select!.blur();

      expect(field?.dataset.controlActive).toBeUndefined();
      expect(group?.dataset.controlActive).toBeUndefined();
      expect(select?.dataset.controlActive).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears pointer select active visuals when Escape closes the select", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("behavior");

    const field = Array.from(document.querySelectorAll<HTMLLabelElement>(".bsb-tm-field.stacked")).find((candidate) =>
      candidate.textContent?.includes("首页 / 列表卡片标签")
    );
    const group = field?.closest<HTMLElement>(".bsb-tm-form-group");
    const select = field?.querySelector<HTMLSelectElement>("select");
    expect(field).toBeTruthy();
    expect(group).toBeTruthy();
    expect(select).toBeTruthy();

    select!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    select!.focus();
    select!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(document.activeElement).not.toBe(select);
    expect(field?.dataset.pointerFocus).toBeUndefined();
    expect(group?.dataset.pointerFocus).toBeUndefined();
    expect(select?.dataset.pointerFocus).toBeUndefined();
    expect(field?.dataset.controlActive).toBeUndefined();
    expect(group?.dataset.controlActive).toBeUndefined();
    expect(select?.dataset.controlActive).toBeUndefined();
  });

  it("blurs pointer-origin checkbox changes because toggles have no editing state", async () => {
    const onPatchConfig = vi.fn(async () => {});
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig,
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("behavior");

    const field = Array.from(document.querySelectorAll<HTMLLabelElement>(".bsb-tm-field-toggle")).find((candidate) =>
      candidate.textContent?.includes("启用缓存")
    );
    const checkbox = field?.querySelector<HTMLInputElement>("input[type='checkbox']");
    expect(field).toBeTruthy();
    expect(checkbox).toBeTruthy();

    field!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    checkbox!.focus();
    checkbox!.checked = !checkbox!.checked;
    checkbox!.dispatchEvent(new Event("change", { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();

    expect(onPatchConfig).toHaveBeenCalledWith({ enableCache: false });
    expect(document.activeElement).not.toBe(checkbox);
    expect(field?.dataset.pointerFocus).toBeUndefined();
    expect(checkbox?.dataset.pointerFocus).toBeUndefined();
  });

  it("blurs pointer-origin select saves when the pointer starts from the card", async () => {
    const baseConfig = cloneDefaultConfig();
    let panel: SettingsPanel;
    const onPatchConfig = vi.fn(async (patch: Partial<ReturnType<typeof cloneDefaultConfig>>) => {
      panel.updateConfig({
        ...baseConfig,
        ...patch
      });
    });
    panel = new SettingsPanel(baseConfig, { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig,
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("behavior");

    const activeBehaviorSection = document.querySelector<HTMLElement>("[data-section='behavior']");
    const field = Array.from(document.querySelectorAll<HTMLLabelElement>(".bsb-tm-field.stacked")).find((candidate) =>
      candidate.textContent?.includes("首页 / 列表卡片标签")
    );
    const select = field?.querySelector<HTMLSelectElement>("select");
    expect(field).toBeTruthy();
    expect(select).toBeTruthy();

    select!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    select!.focus();
    select!.value = "off";
    select!.dispatchEvent(new Event("change", { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();

    expect(onPatchConfig).toHaveBeenCalledWith({ thumbnailLabelMode: "off" });
    const currentField = Array.from(activeBehaviorSection!.querySelectorAll<HTMLLabelElement>(".bsb-tm-field.stacked")).find(
      (candidate) => candidate.textContent?.includes("首页 / 列表卡片标签")
    );
    expect(currentField).toBe(field);
    expect(document.activeElement).not.toBe(select);
    expect(field?.dataset.pointerFocus).toBeUndefined();
    expect(field?.dataset.controlActive).toBeUndefined();
    expect(select?.dataset.pointerFocus).toBeUndefined();
    expect(select?.dataset.controlActive).toBeUndefined();
    expect(field?.querySelector<HTMLSelectElement>("select")).toBe(select);
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

  it("previews category colors while dragging and only saves after explicit apply", async () => {
    const onPatchConfig = vi.fn(async () => {});
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig,
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("behavior");

    const field = Array.from(document.querySelectorAll<HTMLElement>(".bsb-tm-color-field[data-color-editor='true']")).find(
      (candidate) => candidate.textContent?.includes(CATEGORY_LABELS.sponsor)
    );
    const swatch = field?.querySelector<HTMLInputElement>("input[type='color']");
    const textInput = field?.querySelector<HTMLInputElement>("input[type='text']");
    const applyButton = field?.querySelector<HTMLButtonElement>(".bsb-tm-color-action.primary");
    const actions = field?.querySelector<HTMLElement>(".bsb-tm-color-actions");
    const previewCard = field?.querySelector<HTMLElement>(".bsb-tm-color-preview-card");
    const previewBadge = field?.querySelector<HTMLElement>(".bsb-tm-color-preview-badge");
    const previewDescription = field?.querySelector<HTMLElement>(".bsb-tm-color-preview-description");
    expect(field).toBeTruthy();
    expect(swatch).toBeTruthy();
    expect(textInput).toBeTruthy();
    expect(field?.querySelector(".bsb-tm-title-pill-wrap")).toBeTruthy();
    expect(previewCard?.children[0]).toBe(previewBadge);
    expect(previewCard?.children[1]).toBe(previewDescription);
    expect(previewDescription?.textContent).toContain("第三方商单");
    expect(actions?.hidden).toBe(true);

    const originalSwatch = swatch!;
    originalSwatch.value = "#123456";
    originalSwatch.dispatchEvent(new Event("input", { bubbles: true }));

    expect(onPatchConfig).not.toHaveBeenCalled();
    expect(document.querySelector<HTMLInputElement>("input[type='color']")).toBe(originalSwatch);
    expect(textInput?.value).toBe("#123456");
    expect(field?.querySelector<HTMLElement>(".bsb-tm-title-pill-wrap")?.style.getPropertyValue("--bsb-category-accent")).toBe("#123456");
    expect(document.querySelector(".bsb-tm-color-floating-preview")).toBeNull();
    expect(actions?.hidden).toBe(false);

    applyButton?.click();
    await Promise.resolve();

    expect(onPatchConfig).toHaveBeenCalledTimes(1);
    expect(onPatchConfig).toHaveBeenCalledWith(expect.objectContaining({
      categoryColorOverrides: expect.objectContaining({
        sponsor: "#123456"
      })
    }));
  });

  it("refreshes existing category color previews after transparency settings change", async () => {
    let config = cloneDefaultConfig();
    let panel: SettingsPanel;
    const onPatchConfig = vi.fn(async (patch: Partial<ReturnType<typeof cloneDefaultConfig>>) => {
      config = {
        ...config,
        ...patch
      };
      panel.updateConfig(config);
    });
    panel = new SettingsPanel(config, { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig,
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("behavior");

    const findSponsorPreview = (): HTMLElement | null => {
      const field = Array.from(document.querySelectorAll<HTMLElement>(".bsb-tm-color-field[data-color-editor='true']")).find(
        (candidate) => candidate.textContent?.includes(CATEGORY_LABELS.sponsor)
      );
      return field?.querySelector<HTMLElement>(".bsb-tm-title-pill-wrap") ?? null;
    };

    expect(findSponsorPreview()?.dataset.transparent).toBe("false");

    panel.open("transparency");
    const titleTransparencyField = Array.from(document.querySelectorAll<HTMLLabelElement>(".bsb-tm-field-toggle")).find(
      (candidate) => candidate.textContent?.includes("标题商业标签使用透明模式")
    );
    const titleTransparencySwitch = titleTransparencyField?.querySelector<HTMLInputElement>("input[type='checkbox']");
    expect(titleTransparencyField).toBeTruthy();
    expect(titleTransparencySwitch).toBeTruthy();

    titleTransparencyField!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    titleTransparencySwitch!.checked = true;
    titleTransparencySwitch!.dispatchEvent(new Event("change", { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    panel.open("behavior");

    expect(onPatchConfig).toHaveBeenCalledWith(expect.objectContaining({
      labelTransparency: expect.objectContaining({
        titleBadge: true
      })
    }));
    expect(findSponsorPreview()?.dataset.transparent).toBe("true");
  });

  it("cancels a draft color without persisting it", () => {
    const onPatchConfig = vi.fn(async () => {});
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig,
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("behavior");

    const field = Array.from(document.querySelectorAll<HTMLElement>(".bsb-tm-color-field[data-color-editor='true']")).find(
      (candidate) => candidate.textContent?.includes(CATEGORY_LABELS.sponsor)
    );
    const swatch = field?.querySelector<HTMLInputElement>("input[type='color']");
    const textInput = field?.querySelector<HTMLInputElement>("input[type='text']");
    const actions = field?.querySelector<HTMLElement>(".bsb-tm-color-actions");
    const cancelButton = field?.querySelector<HTMLButtonElement>(".bsb-tm-color-action.secondary");
    const originalValue = swatch?.value;
    expect(actions?.hidden).toBe(true);

    swatch!.value = "#654321";
    swatch!.dispatchEvent(new Event("input", { bubbles: true }));
    expect(actions?.hidden).toBe(false);
    cancelButton?.click();

    expect(onPatchConfig).not.toHaveBeenCalled();
    expect(swatch?.value).toBe(originalValue);
    expect(textInput?.value).toBe(originalValue);
    expect(field?.dataset.colorDirty).toBe("false");
    expect(actions?.hidden).toBe(true);
  });

  it("uses Escape to cancel draft colors without closing the panel", () => {
    const onPatchConfig = vi.fn(async () => {});
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig,
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("behavior");

    const backdrop = document.querySelector<HTMLElement>(".bsb-tm-panel-backdrop");
    const field = Array.from(document.querySelectorAll<HTMLElement>(".bsb-tm-color-field[data-color-editor='true']")).find(
      (candidate) => candidate.textContent?.includes(CATEGORY_LABELS.sponsor)
    );
    const swatch = field?.querySelector<HTMLInputElement>("input[type='color']");
    const textInput = field?.querySelector<HTMLInputElement>("input[type='text']");
    const actions = field?.querySelector<HTMLElement>(".bsb-tm-color-actions");
    const originalValue = swatch?.value;

    swatch!.value = "#654321";
    swatch!.dispatchEvent(new Event("input", { bubbles: true }));
    textInput!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(backdrop?.hidden).toBe(false);
    expect(onPatchConfig).not.toHaveBeenCalled();
    expect(swatch?.value).toBe(originalValue);
    expect(textInput?.value).toBe(originalValue);
    expect(actions?.hidden).toBe(true);
  });

  it("does not rewrite text color input while the user is typing a valid short hex", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("behavior");

    const field = Array.from(document.querySelectorAll<HTMLElement>(".bsb-tm-color-field[data-color-editor='true']")).find(
      (candidate) => candidate.textContent?.includes(CATEGORY_LABELS.sponsor)
    );
    const textInput = field?.querySelector<HTMLInputElement>("input[type='text']");
    const swatch = field?.querySelector<HTMLInputElement>("input[type='color']");

    textInput!.value = "#123";
    textInput!.dispatchEvent(new Event("input", { bubbles: true }));

    expect(textInput?.value).toBe("#123");
    expect(swatch?.value).toBe("#112233");
  });

  it("uses real inline comment badge previews with transparency state", () => {
    const config = {
      ...cloneDefaultConfig(),
      labelTransparency: {
        ...cloneDefaultConfig().labelTransparency,
        commentLocation: true,
        commentBadge: true
      }
    };
    const panel = new SettingsPanel(config, { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("filters");

    const locationWrapper = Array.from(document.querySelectorAll<HTMLElement>(".bsb-tm-field.stacked")).find(
      (candidate) => candidate.textContent?.includes("IP 属地标签颜色")
    );
    const adWrapper = Array.from(document.querySelectorAll<HTMLElement>(".bsb-tm-field.stacked")).find(
      (candidate) => candidate.textContent?.includes("评论广告标签颜色")
    );
    const locationPreview = locationWrapper?.querySelector<HTMLElement>(".bsb-tm-color-preview-badge .bsb-tm-inline-chip");
    const adPreview = adWrapper?.querySelector<HTMLElement>(".bsb-tm-color-preview-badge .bsb-tm-inline-chip");

    expect(locationPreview?.dataset.appearance).toBe("glass");
    expect(locationPreview?.textContent).toContain("IP 属地");
    expect(locationPreview?.getAttribute("data-bsb-color-preview-inline")).toBe("true");
    expect(adPreview?.dataset.appearance).toBe("glass");
    expect(adPreview?.textContent).toContain("评论广告");
    expect(adPreview?.getAttribute("data-bsb-color-preview-inline")).toBe("true");
  });

  it("shows a sanitized developer diagnostics card when diagnostics exist", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText }
    });
    reportDiagnostic({
      severity: "warn",
      area: "storage",
      message: "设置保存失败，已回退",
      detail: {
        userId: "secret-user-id",
        reason: "GM_setValue failed"
      }
    });
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("help");

    const card = document.querySelector<HTMLElement>(".bsb-tm-diagnostics-card");
    expect(card).toBeTruthy();
    expect(card?.textContent).toContain("开发者诊断");
    expect(card?.textContent).toContain("设置保存失败，已回退");
    expect(card?.textContent).not.toContain("secret-user-id");

    card?.querySelector<HTMLButtonElement>("[data-bsb-diagnostics-copy='true']")?.click();
    await Promise.resolve();
    expect(writeText).toHaveBeenCalledTimes(1);
    const copiedReport = String((writeText.mock.calls as unknown as string[][])[0]?.[0] ?? "");
    expect(copiedReport).toContain("GM_setValue failed");
    expect(copiedReport).not.toContain("secret-user-id");

    card?.querySelector<HTMLButtonElement>("[data-bsb-diagnostics-clear='true']")?.click();
    expect(getDiagnosticEvents()).toHaveLength(0);
    expect(document.querySelector(".bsb-tm-diagnostics-card")).toBeTruthy();
    expect(document.querySelector(".bsb-tm-diagnostics-card")?.textContent).toContain("暂无诊断事件");
  });

  it("always exposes developer diagnostics with a visible debug switch", () => {
    const panel = new SettingsPanel(cloneDefaultConfig(), { skipCount: 0, minutesSaved: 0 }, {
      onPatchConfig: vi.fn(async () => {}),
      onCategoryModeChange: vi.fn(async () => {}),
      onClearCache: vi.fn(async () => {}),
      onReset: vi.fn(async () => {})
    });

    panel.mount();
    panel.open("help");

    const card = document.querySelector<HTMLElement>(".bsb-tm-diagnostics-card");
    const debugSwitch = card?.querySelector<HTMLInputElement>("[data-bsb-diagnostics-debug='true']");
    expect(card).toBeTruthy();
    expect(card?.textContent).toContain("暂无诊断事件");
    expect(debugSwitch).toBeTruthy();
    expect(debugSwitch?.checked).toBe(false);

    const debugToggle = debugSwitch?.closest<HTMLElement>(".bsb-tm-diagnostics-debug-toggle");
    expect(debugToggle).toBeTruthy();
    debugToggle!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    debugSwitch!.focus();
    expect(debugToggle?.dataset.pointerFocus).toBe("true");
    debugSwitch!.blur();
    expect(debugToggle?.dataset.pointerFocus).toBeUndefined();

    debugSwitch?.click();

    expect(isDiagnosticDebugEnabled()).toBe(true);
    expect(debugSwitch?.checked).toBe(true);
    expect(card?.textContent).toContain("详细日志已开启");
  });
});
