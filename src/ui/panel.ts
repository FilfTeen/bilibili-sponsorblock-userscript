import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CONTENT_FILTER_MODE_LABELS,
  MODE_LABELS,
  SCRIPT_NAME,
  THUMBNAIL_LABEL_MODE_LABELS
} from "../constants";
import type {
  Category,
  CategoryMode,
  ContentFilterMode,
  RuntimeStatus,
  SegmentRecord,
  StoredConfig,
  StoredStats,
  ThumbnailLabelMode
} from "../types";
import { validateStoredPattern } from "../utils/pattern";

type PanelCallbacks = {
  onPatchConfig: (patch: Partial<StoredConfig>) => Promise<void>;
  onCategoryModeChange: (category: Category, mode: CategoryMode) => Promise<void>;
  onReset: () => Promise<void>;
};

export class SettingsPanel {
  private readonly backdrop = document.createElement("div");
  private readonly panel = document.createElement("aside");
  private readonly statsEl = document.createElement("div");
  private readonly form = document.createElement("div");
  private readonly filterForm = document.createElement("div");
  private readonly categoryForm = document.createElement("div");
  private readonly panelId = "bsb-tm-panel";
  private filterValidationMessage: string | null = null;
  private config: StoredConfig;
  private stats: StoredStats;
  private fullVideoLabels: string[] = [];
  private runtimeStatus: RuntimeStatus = {
    kind: "idle",
    message: "等待页面匹配",
    bvid: null,
    segmentCount: null
  };
  private readonly handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && !this.backdrop.hidden) {
      this.close();
    }
  };

  constructor(
    config: StoredConfig,
    stats: StoredStats,
    private readonly callbacks: PanelCallbacks
  ) {
    this.config = config;
    this.stats = stats;

    this.backdrop.className = "bsb-tm-panel-backdrop";
    this.backdrop.hidden = true;
    this.backdrop.addEventListener("click", (event) => {
      if (event.target === this.backdrop) {
        this.close();
      }
    });

    this.panel.className = "bsb-tm-panel";
    this.panel.id = this.panelId;
    this.panel.setAttribute("role", "dialog");
    this.panel.setAttribute("aria-modal", "true");
    this.panel.setAttribute("aria-labelledby", "bsb-tm-panel-title");
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
    this.categoryForm.className = "bsb-tm-categories";
    this.backdrop.appendChild(this.panel);
    this.render();
  }

  mount(): void {
    if (!this.backdrop.isConnected) {
      document.documentElement.appendChild(this.backdrop);
    }
  }

  toggle(): void {
    if (this.backdrop.hidden) {
      this.open();
      return;
    }
    this.close();
  }

  open(): void {
    this.mount();
    this.backdrop.hidden = false;
    document.documentElement.classList.add("bsb-tm-panel-open");
    document.addEventListener("keydown", this.handleKeydown);
  }

  close(): void {
    this.backdrop.hidden = true;
    document.documentElement.classList.remove("bsb-tm-panel-open");
    document.removeEventListener("keydown", this.handleKeydown);
  }

  unmount(): void {
    this.close();
    this.backdrop.remove();
  }

  updateConfig(config: StoredConfig): void {
    this.config = config;
    this.filterValidationMessage = null;
    this.render();
  }

  updateStats(stats: StoredStats): void {
    this.stats = stats;
    this.renderSummary();
  }

  updateRuntimeStatus(status: RuntimeStatus): void {
    this.runtimeStatus = status;
    this.renderSummary();
  }

  setFullVideoLabels(segments: SegmentRecord[]): void {
    this.fullVideoLabels = [...new Set(segments.map((segment) => CATEGORY_LABELS[segment.category]))];
    this.renderSummary();
  }

  private render(): void {
    this.renderSummary();
    this.renderForm();
    this.renderFilters();
    this.renderCategories();
  }

  private renderSummary(): void {
    const labels = this.fullVideoLabels.length > 0 ? this.fullVideoLabels.join(" / ") : "-";
    this.statsEl.replaceChildren(
      this.createSummaryLine("运行状态", this.config.enabled ? "已启用" : "已停用"),
      this.createSummaryLine("当前视频", this.runtimeStatus.bvid ?? "-"),
      this.createSummaryLine("片段状态", this.runtimeStatus.message),
      this.createSummaryLine("整视频标签", labels),
      this.createSummaryLine("累计跳过", `${this.stats.skipCount} 次`),
      this.createSummaryLine("节省时长", `${this.stats.minutesSaved.toFixed(2)} 分钟`)
    );

    this.panel.querySelector<HTMLElement>("[data-section='summary']")?.replaceChildren(
      this.createSectionHeading("状态总览", "脚本默认不改动页面布局，设置仅在你主动打开时出现。"),
      this.statsEl
    );
  }

  private renderForm(): void {
    this.form.replaceChildren(
      this.createCheckbox("启用脚本", "总开关。关闭后不再请求片段、渲染角标或过滤内容。", this.config.enabled, async (checked) => {
        await this.callbacks.onPatchConfig({ enabled: checked });
      }),
      this.createCheckbox("启用缓存", "缓存 SponsorBlock 和缩略图标签结果，减少重复请求。", this.config.enableCache, async (checked) => {
        await this.callbacks.onPatchConfig({ enableCache: checked });
      }),
      this.createCheckbox("显示播放器预览条", "在视频进度条上叠加上游同类的片段颜色标记。", this.config.showPreviewBar, async (checked) => {
        await this.callbacks.onPatchConfig({ showPreviewBar: checked });
      }),
      this.createSelect(
        "缩略图整视频标签",
        this.config.thumbnailLabelMode,
        THUMBNAIL_LABEL_MODE_LABELS,
        async (value) => {
          await this.callbacks.onPatchConfig({ thumbnailLabelMode: value as ThumbnailLabelMode });
        }
      ),
      this.createInput("服务器地址", "SponsorBlock API 服务地址。通常保持默认即可。", this.config.serverAddress, async (value) => {
        await this.callbacks.onPatchConfig({ serverAddress: value });
      }),
      this.createNumberInput("提示停留时间（秒）", "自动跳过、错误和高光提示的停留时间。", this.config.noticeDurationSec, async (value) => {
        await this.callbacks.onPatchConfig({ noticeDurationSec: value });
      }),
      this.createNumberInput("忽略短片段（秒）", "低于此长度的普通片段不处理。", this.config.minDurationSec, async (value) => {
        await this.callbacks.onPatchConfig({ minDurationSec: value });
      }),
      this.createResetButton(false)
    );

    this.panel.querySelector<HTMLElement>("[data-section='form']")?.replaceChildren(
      this.createSectionHeading("基础选项", "优先贴近原插件体验，不做额外页面改造。"),
      this.form
    );
  }

  private renderFilters(): void {
    const children: HTMLElement[] = [
      this.createSectionLabel("动态页广告过滤"),
      this.createSelect("动态过滤模式", this.config.dynamicFilterMode, CONTENT_FILTER_MODE_LABELS, async (value) => {
        await this.callbacks.onPatchConfig({ dynamicFilterMode: value as ContentFilterMode });
      }),
      this.createRegexPatternInput(),
      this.createNumberInput("动态最少命中数", "仅对疑似广告词命中达到该数量的内容采取动作。", this.config.dynamicRegexKeywordMinMatches, async (value) => {
        await this.callbacks.onPatchConfig({ dynamicRegexKeywordMinMatches: value });
      }),
      this.createSectionLabel("评论区广告过滤"),
      this.createSelect("评论过滤模式", this.config.commentFilterMode, CONTENT_FILTER_MODE_LABELS, async (value) => {
        await this.callbacks.onPatchConfig({ commentFilterMode: value as ContentFilterMode });
      }),
      this.createCheckbox("同时处理命中评论的回复", "开启后，命中主评论时可同步隐藏其回复楼层。", this.config.commentHideReplies, async (checked) => {
        await this.callbacks.onPatchConfig({ commentHideReplies: checked });
      }),
      this.createResetButton(true)
    ];

    if (this.filterValidationMessage) {
      children.splice(3, 0, this.createValidationMessage(this.filterValidationMessage));
    }

    this.filterForm.replaceChildren(...children);

    this.panel.querySelector<HTMLElement>("[data-section='filters']")?.replaceChildren(
      this.createSectionHeading("动态与评论", "默认关闭，避免误伤正常内容。需要时再单独开启。"),
      this.filterForm
    );
  }

  private renderCategories(): void {
    this.categoryForm.replaceChildren();

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
      this.categoryForm.appendChild(row);
    }

    this.panel.querySelector<HTMLElement>("[data-section='categories']")?.replaceChildren(
      this.createSectionHeading("分类处理", "沿用原项目的自动/手动/仅提示/关闭语义。"),
      this.categoryForm
    );
  }

  private createCheckbox(
    labelText: string,
    helpText: string,
    checked: boolean,
    onChange: (checked: boolean) => Promise<void>
  ): HTMLElement {
    const label = document.createElement("label");
    label.className = "bsb-tm-field";

    const copy = document.createElement("div");
    copy.className = "bsb-tm-field-copy";

    const title = document.createElement("span");
    title.className = "bsb-tm-field-title";
    title.textContent = labelText;

    const help = document.createElement("small");
    help.className = "bsb-tm-field-help";
    help.textContent = helpText;

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    input.addEventListener("change", async () => {
      await onChange(input.checked);
    });

    copy.append(title, help);
    label.append(copy, input);
    return label;
  }

  private createInput(
    labelText: string,
    helpText: string,
    value: string,
    onCommit: (value: string) => Promise<void>
  ): HTMLElement {
    const wrapper = document.createElement("label");
    wrapper.className = "bsb-tm-field stacked";

    wrapper.append(this.createInputLabel(labelText, helpText));

    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    input.spellcheck = false;
    input.addEventListener("change", async () => {
      await onCommit(input.value.trim());
    });

    wrapper.append(input);
    return wrapper;
  }

  private createRegexPatternInput(): HTMLElement {
    const wrapper = document.createElement("label");
    wrapper.className = "bsb-tm-field stacked";

    wrapper.append(this.createInputLabel("动态关键词正则", "用于识别可疑广告措辞。保留默认值通常更稳。"));

    const input = document.createElement("input");
    input.type = "text";
    input.value = this.config.dynamicRegexPattern;
    input.spellcheck = false;
    if (this.filterValidationMessage) {
      input.setAttribute("aria-invalid", "true");
    }
    input.addEventListener("change", async () => {
      const nextValue = input.value.trim();
      const validation = validateStoredPattern(nextValue);
      if (!validation.valid) {
        this.filterValidationMessage = validation.error ?? "正则格式无效";
        this.renderFilters();
        return;
      }

      this.filterValidationMessage = null;
      try {
        await this.callbacks.onPatchConfig({ dynamicRegexPattern: nextValue });
      } catch (_error) {
        this.filterValidationMessage = "正则保存失败";
        this.renderFilters();
      }
    });

    wrapper.append(input);
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

    wrapper.append(this.createInputLabel(labelText));

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

    wrapper.append(select);
    return wrapper;
  }

  private createNumberInput(
    labelText: string,
    helpText: string,
    value: number,
    onCommit: (value: number) => Promise<void>
  ): HTMLElement {
    const wrapper = document.createElement("label");
    wrapper.className = "bsb-tm-field stacked";

    wrapper.append(this.createInputLabel(labelText, helpText));

    const input = document.createElement("input");
    input.type = "number";
    input.value = String(value);
    input.min = "0";
    input.step = "1";
    input.addEventListener("change", async () => {
      await onCommit(Number(input.value));
    });

    wrapper.append(input);
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

    const titleWrap = document.createElement("div");

    const title = document.createElement("strong");
    title.id = "bsb-tm-panel-title";
    title.textContent = SCRIPT_NAME;

    const subtitle = document.createElement("div");
    subtitle.className = "bsb-tm-panel-subtitle";
    subtitle.textContent = "按上游体验做轻量增强，不改写 B 站原有布局。";

    titleWrap.append(title, subtitle);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "bsb-tm-button secondary bsb-tm-panel-close";
    closeButton.textContent = "关闭";

    header.append(titleWrap, closeButton);
    return header;
  }

  private createSection(name: string): HTMLElement {
    const section = document.createElement("section");
    section.className = "bsb-tm-panel-section";
    section.dataset.section = name;
    return section;
  }

  private createSectionHeading(titleText: string, descriptionText?: string): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "bsb-tm-section-heading";

    const title = document.createElement("strong");
    title.className = "bsb-tm-section-title";
    title.textContent = titleText;

    wrapper.appendChild(title);
    if (descriptionText) {
      const description = document.createElement("p");
      description.className = "bsb-tm-section-description";
      description.textContent = descriptionText;
      wrapper.appendChild(description);
    }

    return wrapper;
  }

  private createSectionLabel(text: string): HTMLElement {
    const label = document.createElement("strong");
    label.className = "bsb-tm-section-label";
    label.textContent = text;
    return label;
  }

  private createInputLabel(titleText: string, helpText?: string): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "bsb-tm-input-label";

    const title = document.createElement("span");
    title.className = "bsb-tm-field-title";
    title.textContent = titleText;

    wrapper.appendChild(title);
    if (helpText) {
      const help = document.createElement("small");
      help.className = "bsb-tm-field-help";
      help.textContent = helpText;
      wrapper.appendChild(help);
    }
    return wrapper;
  }

  private createSummaryLine(labelText: string, valueText: string): HTMLElement {
    const line = document.createElement("div");
    line.className = "bsb-tm-summary-line";
    const label = document.createElement("strong");
    label.textContent = labelText;
    const value = document.createElement("span");
    value.textContent = valueText;
    line.append(label, value);
    return line;
  }

  private createValidationMessage(text: string): HTMLElement {
    const message = document.createElement("p");
    message.className = "bsb-tm-validation-message";
    message.textContent = text;
    return message;
  }
}
