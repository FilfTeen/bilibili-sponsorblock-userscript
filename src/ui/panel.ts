import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CONTENT_FILTER_MODE_LABELS,
  MODE_LABELS,
  SCRIPT_NAME
} from "../constants";
import type { Category, CategoryMode, ContentFilterMode, SegmentRecord, StoredConfig, StoredStats } from "../types";

type PanelCallbacks = {
  onPatchConfig: (patch: Partial<StoredConfig>) => Promise<void>;
  onCategoryModeChange: (category: Category, mode: CategoryMode) => Promise<void>;
  onReset: () => Promise<void>;
};

export class SettingsPanel {
  private readonly button = document.createElement("button");
  private readonly panel = document.createElement("aside");
  private readonly banner = document.createElement("div");
  private readonly statsEl = document.createElement("div");
  private readonly form = document.createElement("div");
  private readonly filterForm = document.createElement("div");
  private readonly panelId = "bsb-tm-panel";
  private config: StoredConfig;
  private stats: StoredStats;

  constructor(
    config: StoredConfig,
    stats: StoredStats,
    private readonly callbacks: PanelCallbacks
  ) {
    this.config = config;
    this.stats = stats;

    this.button.className = "bsb-tm-entry-button";
    this.button.type = "button";
    this.button.textContent = "BSB";
    this.button.setAttribute("aria-label", `${SCRIPT_NAME} panel`);
    this.button.setAttribute("aria-controls", this.panelId);
    this.button.setAttribute("aria-expanded", "false");
    this.button.addEventListener("click", () => {
      this.toggle();
    });

    this.banner.className = "bsb-tm-banner";
    this.banner.hidden = true;

    this.panel.className = "bsb-tm-panel";
    this.panel.id = this.panelId;
    this.panel.append(
      this.createHeader(),
      this.createSection("summary"),
      this.createSection("form"),
      this.createSection("filters"),
      this.createSection("categories")
    );
    this.panel.querySelector<HTMLButtonElement>(".bsb-tm-panel-close")?.addEventListener("click", () => {
      this.close();
    });

    this.statsEl.className = "bsb-tm-stats";
    this.form.className = "bsb-tm-form";
    this.filterForm.className = "bsb-tm-form";
    this.render();
  }

  mount(playerHost?: HTMLElement | null): void {
    if (!this.panel.isConnected) {
      document.documentElement.appendChild(this.panel);
    }
    if (!this.button.isConnected) {
      document.documentElement.appendChild(this.button);
    }

    if (playerHost) {
      if (getComputedStyle(playerHost).position === "static") {
        playerHost.style.position = "relative";
      }

      this.button.classList.remove("is-floating");
      this.button.classList.add("is-inline");
      playerHost.appendChild(this.button);

      const container = playerHost.parentElement;
      if (container) {
        container.insertBefore(this.banner, playerHost);
      }
      return;
    }

    this.banner.remove();
    this.button.classList.remove("is-inline");
    this.button.classList.add("is-floating");
    document.documentElement.appendChild(this.button);
  }

  toggle(): void {
    this.panel.classList.toggle("is-open");
    this.button.setAttribute("aria-expanded", String(this.panel.classList.contains("is-open")));
  }

  close(): void {
    this.panel.classList.remove("is-open");
    this.button.setAttribute("aria-expanded", "false");
  }

  unmount(): void {
    this.close();
    this.banner.remove();
    this.panel.remove();
    this.button.remove();
  }

  updateConfig(config: StoredConfig): void {
    this.config = config;
    this.render();
  }

  updateStats(stats: StoredStats): void {
    this.stats = stats;
    this.renderSummary();
  }

  setFullVideoLabels(segments: SegmentRecord[]): void {
    if (segments.length === 0) {
      this.banner.hidden = true;
      this.banner.textContent = "";
      return;
    }

    const labels = [...new Set(segments.map((segment) => CATEGORY_LABELS[segment.category]))];
    this.banner.hidden = false;
    this.banner.textContent = `整视频标签：${labels.join(" / ")}`;
  }

  private render(): void {
    this.renderSummary();
    this.renderForm();
    this.renderFilters();
    this.renderCategories();
  }

  private renderSummary(): void {
    this.statsEl.replaceChildren(
      this.createSummaryLine("状态", this.config.enabled ? "启用" : "停用"),
      this.createSummaryLine("跳过次数", String(this.stats.skipCount)),
      this.createSummaryLine("节省时长", `${this.stats.minutesSaved.toFixed(2)} 分钟`)
    );

    this.panel.querySelector<HTMLElement>("[data-section='summary']")?.replaceChildren(this.statsEl);
  }

  private renderForm(): void {
    this.form.replaceChildren(
      this.createCheckbox("脚本启用", this.config.enabled, async (checked) => {
        await this.callbacks.onPatchConfig({ enabled: checked });
      }),
      this.createCheckbox("启用缓存", this.config.enableCache, async (checked) => {
        await this.callbacks.onPatchConfig({ enableCache: checked });
      }),
      this.createInput("服务器地址", this.config.serverAddress, async (value) => {
        await this.callbacks.onPatchConfig({ serverAddress: value });
      }),
      this.createNumberInput("提示时长（秒）", this.config.noticeDurationSec, async (value) => {
        await this.callbacks.onPatchConfig({ noticeDurationSec: value });
      }),
      this.createNumberInput("最短片段（秒）", this.config.minDurationSec, async (value) => {
        await this.callbacks.onPatchConfig({ minDurationSec: value });
      }),
      this.createResetButton(false)
    );

    this.panel.querySelector<HTMLElement>("[data-section='form']")?.replaceChildren(this.form);
  }

  private renderFilters(): void {
    this.filterForm.replaceChildren(
      this.createSectionLabel("动态页广告过滤"),
      this.createSelect("动态过滤模式", this.config.dynamicFilterMode, CONTENT_FILTER_MODE_LABELS, async (value) => {
        await this.callbacks.onPatchConfig({ dynamicFilterMode: value as ContentFilterMode });
      }),
      this.createInput("动态关键词正则", this.config.dynamicRegexPattern, async (value) => {
        await this.callbacks.onPatchConfig({ dynamicRegexPattern: value });
      }),
      this.createNumberInput("动态最少命中数", this.config.dynamicRegexKeywordMinMatches, async (value) => {
        await this.callbacks.onPatchConfig({ dynamicRegexKeywordMinMatches: value });
      }),
      this.createSectionLabel("评论区广告过滤"),
      this.createSelect("评论过滤模式", this.config.commentFilterMode, CONTENT_FILTER_MODE_LABELS, async (value) => {
        await this.callbacks.onPatchConfig({ commentFilterMode: value as ContentFilterMode });
      }),
      this.createCheckbox("隐藏匹配评论的回复", this.config.commentHideReplies, async (checked) => {
        await this.callbacks.onPatchConfig({ commentHideReplies: checked });
      }),
      this.createResetButton(true)
    );

    this.panel.querySelector<HTMLElement>("[data-section='filters']")?.replaceChildren(this.filterForm);
  }

  private renderCategories(): void {
    const wrapper = document.createElement("div");
    wrapper.className = "bsb-tm-categories";

    for (const category of CATEGORY_ORDER) {
      const row = document.createElement("label");
      row.className = "bsb-tm-category-row";

      const label = document.createElement("span");
      label.textContent = CATEGORY_LABELS[category];

      const select = document.createElement("select");
      for (const mode of Object.keys(MODE_LABELS) as CategoryMode[]) {
        const option = document.createElement("option");
        option.value = mode;
        option.textContent = MODE_LABELS[mode];
        option.selected = this.config.categoryModes[category] === mode;
        select.appendChild(option);
      }
      select.addEventListener("change", async () => {
        await this.callbacks.onCategoryModeChange(category, select.value as CategoryMode);
      });

      row.append(label, select);
      wrapper.appendChild(row);
    }

    this.panel.querySelector<HTMLElement>("[data-section='categories']")?.replaceChildren(wrapper);
  }

  private createCheckbox(labelText: string, checked: boolean, onChange: (checked: boolean) => Promise<void>): HTMLElement {
    const label = document.createElement("label");
    label.className = "bsb-tm-field";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    input.addEventListener("change", async () => {
      await onChange(input.checked);
    });

    const text = document.createElement("span");
    text.textContent = labelText;
    label.append(input, text);
    return label;
  }

  private createInput(labelText: string, value: string, onCommit: (value: string) => Promise<void>): HTMLElement {
    const wrapper = document.createElement("label");
    wrapper.className = "bsb-tm-field stacked";

    const label = document.createElement("span");
    label.textContent = labelText;

    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    input.spellcheck = false;
    input.addEventListener("change", async () => {
      await onCommit(input.value.trim());
    });

    wrapper.append(label, input);
    return wrapper;
  }

  private createSelect<T extends string>(
    labelText: string,
    value: T,
    options: Record<T, string>,
    onCommit: (value: T) => Promise<void>
  ): HTMLElement {
    const wrapper = document.createElement("label");
    wrapper.className = "bsb-tm-field stacked";

    const label = document.createElement("span");
    label.textContent = labelText;

    const select = document.createElement("select");
    for (const [optionValue, optionLabel] of Object.entries(options) as [T, string][]) {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionLabel;
      option.selected = optionValue === value;
      select.appendChild(option);
    }
    select.addEventListener("change", async () => {
      await onCommit(select.value as T);
    });

    wrapper.append(label, select);
    return wrapper;
  }

  private createNumberInput(labelText: string, value: number, onCommit: (value: number) => Promise<void>): HTMLElement {
    const wrapper = document.createElement("label");
    wrapper.className = "bsb-tm-field stacked";

    const label = document.createElement("span");
    label.textContent = labelText;

    const input = document.createElement("input");
    input.type = "number";
    input.value = String(value);
    input.min = "0";
    input.step = "1";
    input.addEventListener("change", async () => {
      await onCommit(Number(input.value));
    });

    wrapper.append(label, input);
    return wrapper;
  }

  private createResetButton(compact: boolean): HTMLElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `bsb-tm-button danger${compact ? " compact" : ""}`;
    button.textContent = "恢复默认设置";
    button.addEventListener("click", async () => {
      await this.callbacks.onReset();
    });
    return button;
  }

  private createHeader(): HTMLElement {
    const header = document.createElement("div");
    header.className = "bsb-tm-panel-header";

    const title = document.createElement("strong");
    title.textContent = SCRIPT_NAME;

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "bsb-tm-button secondary bsb-tm-panel-close";
    closeButton.textContent = "关闭";

    header.append(title, closeButton);
    return header;
  }

  private createSection(name: string): HTMLElement {
    const section = document.createElement("div");
    section.className = "bsb-tm-panel-section";
    section.dataset.section = name;
    return section;
  }

  private createSectionLabel(text: string): HTMLElement {
    const label = document.createElement("strong");
    label.className = "bsb-tm-section-label";
    label.textContent = text;
    return label;
  }

  private createSummaryLine(labelText: string, valueText: string): HTMLElement {
    const line = document.createElement("div");
    const label = document.createElement("strong");
    label.textContent = `${labelText}：`;
    const value = document.createElement("span");
    value.textContent = valueText;
    line.append(label, value);
    return line;
  }
}
