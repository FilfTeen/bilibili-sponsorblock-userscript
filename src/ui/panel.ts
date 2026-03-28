import {
  CATEGORY_COLORS,
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CONTENT_FILTER_MODE_LABELS,
  MODE_LABELS,
  SCRIPT_NAME,
  THUMBNAIL_LABEL_MODE_LABELS
} from "../constants";
import type {
  Category,
  CategoryColorOverrides,
  CategoryMode,
  ContentFilterMode,
  RuntimeStatus,
  SegmentRecord,
  StoredConfig,
  StoredStats,
  ThumbnailLabelMode
} from "../types";
import { normalizeHexColor, resolveCategoryAccent } from "../utils/color";
import { validateStoredPattern } from "../utils/pattern";
import { createSponsorShieldIcon } from "./icons";

type PanelCallbacks = {
  onPatchConfig: (patch: Partial<StoredConfig>) => Promise<void>;
  onCategoryModeChange: (category: Category, mode: CategoryMode) => Promise<void>;
  onClearCache: () => Promise<void>;
  onReset: () => Promise<void>;
};

export type PanelTab = "overview" | "behavior" | "filters" | "mbga" | "help";

const TAB_LABELS: Record<PanelTab, string> = {
  overview: "概览",
  behavior: "片段与标签",
  filters: "动态 / 评论",
  mbga: "生态净化 (MBGA)",
  help: "帮助 / 反馈"
};

const TAB_DESCRIPTIONS: Record<PanelTab, string> = {
  overview: "状态、摘要与维护工具",
  behavior: "片段、标签与显示策略",
  filters: "动态和评论区增强",
  mbga: "屏蔽追踪、原画锁定与沉浸化",
  help: "帮助链接与使用说明"
};

export class SettingsPanel {
  private readonly backdrop = document.createElement("div");
  private readonly panel = document.createElement("aside");
  private readonly body = document.createElement("div");
  private readonly nav = document.createElement("nav");
  private readonly content = document.createElement("div");
  private readonly statsEl = document.createElement("div");
  private readonly form = document.createElement("div");
  private readonly filterForm = document.createElement("div");
  private readonly categoryForm = document.createElement("div");
  private readonly mbgaForm = document.createElement("div");
  private readonly sections = new Map<PanelTab, HTMLElement>();
  private readonly panelId = "bsb-tm-panel";
  private readonly contentScrollByTab: Partial<Record<PanelTab, number>> = {};
  private activeTab: PanelTab = "overview";
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
  private readonly activeFeedbacks = new Map<string, string>(); // id -> originalText
  private readonly pendingConfirmations = new Set<string>(); // id
  private readonly handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && !this.backdrop.hidden) {
      this.close();
    }
  };
  private readonly handleViewportResize = () => {
    this.syncViewportMetrics();
  };
  private viewportListenersAttached = false;

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

    this.body.className = "bsb-tm-panel-body";
    this.nav.className = "bsb-tm-panel-nav";
    this.content.className = "bsb-tm-panel-content";

    this.statsEl.className = "bsb-tm-stats";
    this.form.className = "bsb-tm-form";
    this.filterForm.className = "bsb-tm-form";
    this.categoryForm.className = "bsb-tm-categories";
    this.mbgaForm.className = "bsb-tm-form";

    this.panel.append(this.createHeader(), this.body);
    this.body.append(this.nav, this.content);
    for (const tab of Object.keys(TAB_LABELS) as PanelTab[]) {
      this.nav.appendChild(this.createTabButton(tab));
      const section = this.createSection(tab);
      this.sections.set(tab, section);
      this.content.appendChild(section);
    }

    this.backdrop.appendChild(this.panel);
    this.render();
    this.setActiveTab("overview");
  }

  mount(): void {
    if (!this.backdrop.isConnected) {
      document.documentElement.appendChild(this.backdrop);
    }
    this.syncViewportMetrics();
  }

  toggle(): void {
    if (this.backdrop.hidden) {
      this.open();
      return;
    }
    this.close();
  }

  open(tab: PanelTab = this.activeTab): void {
    this.mount();
    this.attachViewportListeners();
    this.syncViewportMetrics();
    this.setActiveTab(tab);
    this.backdrop.hidden = false;
    document.documentElement.classList.add("bsb-tm-panel-open");
    document.addEventListener("keydown", this.handleKeydown);
  }

  close(): void {
    this.backdrop.hidden = true;
    this.detachViewportListeners();
    document.documentElement.classList.remove("bsb-tm-panel-open");
    document.removeEventListener("keydown", this.handleKeydown);
  }

  unmount(): void {
    this.close();
    this.backdrop.remove();
  }

  updateConfig(config: StoredConfig): void {
    this.rememberActiveScroll();
    this.config = config;
    this.filterValidationMessage = null;
    this.render(true);
  }

  updateStats(stats: StoredStats): void {
    this.rememberActiveScroll();
    this.stats = stats;
    this.renderOverview();
    this.restoreActiveScroll();
  }

  updateRuntimeStatus(status: RuntimeStatus): void {
    this.rememberActiveScroll();
    this.runtimeStatus = status;
    this.renderOverview();
    this.restoreActiveScroll();
  }

  setFullVideoLabels(segments: SegmentRecord[]): void {
    this.rememberActiveScroll();
    this.fullVideoLabels = [...new Set(segments.map((segment) => CATEGORY_LABELS[segment.category]))];
    this.renderOverview();
    this.restoreActiveScroll();
  }

  private render(preserveScroll = false): void {
    const nextScrollTop = preserveScroll ? (this.contentScrollByTab[this.activeTab] ?? this.content.scrollTop) : 0;
    this.renderOverview();
    this.renderBehavior();
    this.renderFilters();
    this.renderMbga();
    this.renderHelp();
    this.setActiveTab(this.activeTab, { preserveScroll, scrollTop: nextScrollTop });
  }

  private renderOverview(): void {
    const labels = this.fullVideoLabels.length > 0 ? this.fullVideoLabels.join(" / ") : "当前视频无整视频标签";
    const thumbnailStatus = this.config.thumbnailLabelMode === "off" ? "已关闭" : "已开启";
    const titleLabelStatus = this.fullVideoLabels.length > 0 ? "已识别" : "等待中";
    const compactHeaderStatus = this.config.compactVideoHeader ? "已开启" : "已关闭";
    const commentFilterStatus = this.config.commentFilterMode === "off" ? "已关闭" : "已开启";
    const commentLocationStatus = this.config.commentLocationEnabled ? "已开启" : "已关闭";
    this.statsEl.replaceChildren(
      this.createSummaryLine("脚本状态", this.config.enabled ? "已启用" : "已停用"),
      this.createSummaryLine("当前视频", this.runtimeStatus.bvid ?? "当前不是视频页"),
      this.createSummaryLine("片段状态", this.runtimeStatus.message),
      this.createSummaryLine("整视频标签", labels),
      this.createSummaryLine("累计跳过", `${this.stats.skipCount} 次`),
      this.createSummaryLine("累计节省", `${this.stats.minutesSaved.toFixed(2)} 分钟`)
    );

    const section = this.sections.get("overview");
    if (!section) {
      return;
    }

    section.replaceChildren(
      this.createSectionHeading(
        "当前状态",
        "这一页集中展示脚本是否生效、当前视频识别结果，以及你在站内会看到哪些增强元素。"
      ),
      this.statsEl,
      this.createFeatureGrid(
        [
          {
            title: "首页 / 搜索卡片标签",
            value: thumbnailStatus,
            description: "在整视频被标记为商业内容时，于封面上方居中显示简写标签，悬停后展开完整分类名。"
          },
          {
            title: "视频标题商业标签",
            value: titleLabelStatus,
            description: "在视频标题前显示分类胶囊，并提供“标记正确 / 标记有误”的反馈入口。"
          },
          {
            title: "紧凑视频顶部栏",
            value: compactHeaderStatus,
            description: "仅在视频播放页收起左侧导航，保留搜索与个人入口，减少顶部占高。"
          },
          {
            title: "评论区商品过滤",
            value: commentFilterStatus,
            description: "识别带货评论时，会给出更明确的隐藏 / 显示反馈，而不是直接静默处理。"
          },
          {
            title: "评论区属地显示（开盒）",
            value: commentLocationStatus,
            description: "默认开启，直接显示 B 站评论 payload 自带的 IP 属地信息，并兼容新版评论结构。"
          }
        ],
        "bsb-tm-overview-grid"
      ),
      this.createFormGroup(
        "维护工具",
        "排障或想回到初始状态时，再使用这些动作。缓存清理只会影响 SponsorBlock 数据，不会删除你的其他脚本设置。",
        this.createActionRow(
          this.createActionButton("清理缓存", "secondary", async () => {
            await this.callbacks.onClearCache();
          }, { id: "clear-cache" }),
          this.createActionButton("恢复默认设置", "danger", async () => {
            await this.callbacks.onReset();
          }, { id: "reset-settings", confirmText: "确定恢复吗？" })
        )
      )
    );
  }

  private renderBehavior(): void {
    this.form.replaceChildren(
      this.createFormGroup(
        "基础开关",
        "先决定脚本是否工作，再控制缓存和播放器可视化增强。",
        this.createFieldGrid(
          [
            this.createCheckbox(
              "启用 Bilibili SponsorBlock",
              "关闭后将停止片段请求、标题标签、缩略图标签和播放器增强。",
              this.config.enabled,
              async (checked) => {
                await this.callbacks.onPatchConfig({ enabled: checked });
              }
            ),
            this.createCheckbox(
              "启用缓存",
              "缓存 SponsorBlock 片段和整视频标签，减少重复请求并提升页面切换速度。",
              this.config.enableCache,
              async (checked) => {
                await this.callbacks.onPatchConfig({ enableCache: checked });
              }
            ),
            this.createCheckbox(
              "显示播放器进度条标签",
              "在进度条上显示不同类别的彩色片段标记。",
              this.config.showPreviewBar,
              async (checked) => {
                await this.callbacks.onPatchConfig({ showPreviewBar: checked });
              }
            ),
            this.createCheckbox(
              "启用紧凑视频顶部栏",
              "仅在视频播放页保留搜索栏和个人入口，收起左侧导航并减少顶部空白。",
              this.config.compactVideoHeader,
              async (checked) => {
                await this.callbacks.onPatchConfig({ compactVideoHeader: checked });
              }
            )
          ],
          "single-column"
        )
      ),
      this.createFormGroup(
        "显示与识别",
        "这里的选项决定卡片标签、提示策略和 SponsorBlock 请求的基础行为。",
        this.createFieldGrid([
          this.createSelect(
            "首页 / 列表卡片标签",
            this.config.thumbnailLabelMode,
            THUMBNAIL_LABEL_MODE_LABELS,
            async (value) => {
              await this.callbacks.onPatchConfig({ thumbnailLabelMode: value as ThumbnailLabelMode });
            },
            "整视频被标记为商业内容时，如何在推荐卡片上展示。"
          ),
          this.createInput(
            "SponsorBlock 服务器地址",
            "默认保持 https://www.bsbsb.top 即可。只有在你明确知道备用服务可用时再修改。",
            this.config.serverAddress,
            async (value) => {
              await this.callbacks.onPatchConfig({ serverAddress: value });
            }
          ),
          this.createNumberInput(
            "提示停留时间（秒）",
            "自动跳过、错误提示和高光点提示的默认停留时间。",
            this.config.noticeDurationSec,
            async (value) => {
              await this.callbacks.onPatchConfig({ noticeDurationSec: value });
            }
          ),
          this.createNumberInput(
            "最短处理时长（秒）",
            "短于该长度的普通片段不会自动处理，可用于减少误触发。",
            this.config.minDurationSec,
            async (value) => {
              await this.callbacks.onPatchConfig({ minDurationSec: value });
            }
          )
        ])
      )
    );

    this.categoryForm.replaceChildren();
    for (const category of CATEGORY_ORDER) {
      const row = document.createElement("label");
      row.className = "bsb-tm-category-row";

      const copy = document.createElement("div");
      copy.className = "bsb-tm-field-copy";
      const label = document.createElement("span");
      label.className = "bsb-tm-field-title";
      label.textContent = CATEGORY_LABELS[category];
      const help = document.createElement("small");
      help.className = "bsb-tm-field-help";
      help.textContent = CATEGORY_DESCRIPTIONS[category];
      copy.append(label, help);

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

      row.append(copy, select);
      this.categoryForm.appendChild(row);
    }

    const section = this.sections.get("behavior");
    if (!section) {
      return;
    }

    section.replaceChildren(
      this.createSectionHeading("片段与标签", "这里的选项决定视频页、进度条和首页卡片如何展示 SponsorBlock 数据。"),
      this.form,
      this.createFormGroup(
        "标签配色",
        "默认配色尽量贴近人的直觉：红色偏警示、绿色偏安心、黄色偏自荐。你可以按自己的判断微调。",
        this.createColorPalette(this.config.categoryColorOverrides)
      ),
      this.createFormGroup(
        "片段分类策略",
        "保持上游常见语义：自动、手动、仅提示、关闭。整视频标签会同步影响标题胶囊与封面顶部短标签。",
        this.categoryForm
      )
    );
  }

  private renderFilters(): void {
    const dynamicFields: HTMLElement[] = [
      this.createSelect(
        "动态过滤模式",
        this.config.dynamicFilterMode,
        CONTENT_FILTER_MODE_LABELS,
        async (value) => {
          await this.callbacks.onPatchConfig({ dynamicFilterMode: value as ContentFilterMode });
        },
        "选择是隐藏动态内容、仅保留标签提示，还是完全关闭这部分增强。"
      ),
      this.createRegexPatternInput(),
      this.createNumberInput(
        "动态最少命中数",
        "仅当疑似广告词命中数达到这个阈值时，才对内容做标记或隐藏。",
        this.config.dynamicRegexKeywordMinMatches,
        async (value) => {
          await this.callbacks.onPatchConfig({ dynamicRegexKeywordMinMatches: value });
        }
      ),
    ];

    if (this.filterValidationMessage) {
      dynamicFields.splice(2, 0, this.createValidationMessage(this.filterValidationMessage));
    }

    const commentFields: HTMLElement[] = [
      this.createCheckbox(
        "显示评论区属地（开盒）",
        "默认开启。复刻自「B站评论区开盒」的核心能力，直接展示评论 payload 自带的 IP 属地信息。",
        this.config.commentLocationEnabled,
        async (checked) => {
          await this.callbacks.onPatchConfig({ commentLocationEnabled: checked });
        }
      ),
      this.createCheckbox(
        "同时隐藏命中评论的回复",
        "开启后，如果主评论命中广告规则，其回复楼层也会一并隐藏。",
        this.config.commentHideReplies,
        async (checked) => {
          await this.callbacks.onPatchConfig({ commentHideReplies: checked });
        }
      ),
      this.createSelect(
        "评论过滤模式",
        this.config.commentFilterMode,
        CONTENT_FILTER_MODE_LABELS,
        async (value) => {
          await this.callbacks.onPatchConfig({ commentFilterMode: value as ContentFilterMode });
        },
        "选择是隐藏命中评论、仅保留评论标签提示，还是完全关闭评论过滤。"
      ),
      this.createCustomColorInput(
        "IP 属地标签颜色",
        "自定义评论区 IP 属地胶囊标签的主题颜色。",
        this.config.commentIpColor ?? "#60a5fa",
        async (value) => {
          await this.callbacks.onPatchConfig({ commentIpColor: value });
        }
      ),
      this.createCustomColorInput(
        "评论广告标签颜色",
        "自定义评论区识别到的广告、带货或可疑促销标签的主题颜色。",
        this.config.commentAdColor ?? "#ff6b66",
        async (value) => {
          await this.callbacks.onPatchConfig({ commentAdColor: value });
        }
      )
    ];

    this.filterForm.replaceChildren(
      this.createFormGroup(
        "动态页商业内容过滤",
        "默认关闭，避免误伤正常动态。只有在你确实需要屏蔽商业动态时再启用。",
        this.createFieldGrid(dynamicFields)
      ),
      this.createFormGroup(
        "评论区商品 / 带货过滤",
        "用于识别评论区商品卡广告、带货留言和可疑促销评论。",
        this.createFieldGrid(commentFields)
      )
    );
    this.sections.get("filters")?.replaceChildren(
      this.createSectionHeading("动态 / 评论增强", "这部分不是 SponsorBlock 原始片段接口，而是对 B 站站内商业内容的附加增强。"),
      this.filterForm
    );
  }

  private renderMbga(): void {
    const mbgaFields: HTMLElement[] = [
      this.createCheckbox(
        "启用生态净化 (MBGA)",
        "总开关。开启后将注入网络拦截层及样式优化补丁，还你一个更干净、高效的 B 站。",
        this.config.mbgaEnabled,
        async (checked) => {
          await this.callbacks.onPatchConfig({ mbgaEnabled: checked });
        },
        true
      ),
      this.createCheckbox(
        "屏蔽隐私追踪与行为上报",
        "拦截 data.bilibili.com / cm.bilibili.com 等遥测请求，保护个人隐私。",
        this.config.mbgaBlockTracking,
        async (checked) => {
          await this.callbacks.onPatchConfig({ mbgaBlockTracking: checked });
        },
        true
      ),
      this.createCheckbox(
        "锁定最高画质与直连官方源",
        "强制直播原画，并禁用 Mcdn / P2P 技术，减少本地资源占用与发热。",
        this.config.mbgaDisablePcdn,
        async (checked) => {
          await this.callbacks.onPatchConfig({ mbgaDisablePcdn: checked });
        },
        true
      ),
      this.createCheckbox(
        "清理地址栏追踪参数",
        "自动移除 URL 中 spm_id_from, vd_source 等追踪参数。",
        this.config.mbgaCleanUrl,
        async (checked) => {
          await this.callbacks.onPatchConfig({ mbgaCleanUrl: checked });
        },
        true
      ),
      this.createCheckbox(
        "深度网页净化与简化",
        "移除广告提示、黑白滤镜、解除复制限制、动态宽屏适配等 UI 补丁。",
        this.config.mbgaSimplifyUi,
        async (checked) => {
          await this.callbacks.onPatchConfig({ mbgaSimplifyUi: checked });
        },
        true
      )
    ];

    const section = this.sections.get("mbga");
    if (!section) {
      return;
    }

    section.replaceChildren(
      this.createSectionHeading(
        "生态净化 (MBGA)",
        "复刻自经典的 MBGA 脚本，旨在通过网络层劫持与原生网页重构，还你一个干净、高效且私密的 B 站。"
      ),
      this.createFormGroup(
        "功能开关",
        "所有改动均经过安全审计，旨在保证 BSB 核心功能不被干扰的前提下，最大限度释放本地算力。开启后请刷新页面以完全生效。",
        this.createFieldGrid(mbgaFields)
      )
    );
  }

  private renderHelp(): void {
    this.sections.get("help")?.replaceChildren(
      this.createSectionHeading("帮助与反馈", "这里说明脚本在页面上会看到什么，以及如何判断标签是否工作正常。"),
      this.createFeatureGrid(
        [
          {
            title: "标题前商业标签",
            value: "视频页",
            description: "当整个视频被社区标记为赞助、自荐或独家访问等整视频标签时，会在标题前显示彩色胶囊。点击胶囊可打开“标记正确 / 标记有误”反馈。"
          },
          {
            title: "缩略图顶部居中标签",
            value: "首页 / 搜索 / 侧栏",
            description: "对整视频商业标签的视频卡片显示短标签，悬浮时以更完整的胶囊形式展开。"
          },
          {
            title: "紧凑视频顶部栏",
            value: "视频页",
            description: "用于在视频页保留搜索与个人入口，避免原生顶部栏过高或留出不必要的空白。"
          },
          {
            title: "评论区属地显示（开盒）",
            value: "评论区",
            description: "当评论数据本身携带 IP 属地时，会在评论发布时间旁直接展示。该功能基于 mscststs 的「B站评论区开盒」思路适配。"
          }
        ],
        "bsb-tm-help-grid"
      ),
      this.createLinkGroup([
        {
          label: "当前脚本仓库",
          href: "https://github.com/FilfTeen/bilibili-sponsorblock-userscript"
        },
        {
          label: "上游项目 hanydd/BilibiliSponsorBlock",
          href: "https://github.com/hanydd/BilibiliSponsorBlock"
        },
        {
          label: "参考脚本 mscststs/B站评论区开盒",
          href: "https://greasyfork.org/zh-CN/scripts/448434-b站评论区开盒"
        },
        {
          label: "SponsorBlock 服务器",
          href: "https://www.bsbsb.top"
        }
      ]),
      this.createInfoBox(
        "致谢与免责声明",
        "本脚本基于 GPL-3.0 的 BilibiliSponsorBlock 上游实现思路移植而来；评论区属地显示功能参考并适配了 mscststs 的 ISC 脚本「B站评论区开盒」。所有片段和整视频标签都来自社区提交与投票，评论属地则以 B 站评论 payload 自带信息为准，结果仅供参考。"
      )
    );
  }

  private setActiveTab(tab: PanelTab, options?: { preserveScroll?: boolean; scrollTop?: number }): void {
    this.rememberActiveScroll();
    this.activeTab = tab;
    for (const button of this.nav.querySelectorAll<HTMLButtonElement>("[data-tab]")) {
      const active = button.dataset.tab === tab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    }
    for (const [sectionTab, section] of this.sections) {
      section.hidden = sectionTab !== tab;
    }
    this.content.scrollTop = options?.preserveScroll ? (options.scrollTop ?? this.contentScrollByTab[tab] ?? 0) : 0;
  }

  private createTabButton(tab: PanelTab): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bsb-tm-tab-button";
    button.dataset.tab = tab;
    button.setAttribute("aria-controls", `${this.panelId}-section-${tab}`);

    const title = document.createElement("strong");
    title.className = "bsb-tm-tab-title";
    title.textContent = TAB_LABELS[tab];

    const description = document.createElement("small");
    description.className = "bsb-tm-tab-description";
    description.textContent = TAB_DESCRIPTIONS[tab];

    button.append(title, description);
    button.addEventListener("click", () => {
      this.setActiveTab(tab, { preserveScroll: true, scrollTop: this.contentScrollByTab[tab] ?? 0 });
    });
    return button;
  }

  private createCheckbox(
    labelText: string,
    helpText: string,
    checked: boolean,
    onChange: (checked: boolean) => Promise<void>,
    needsRefresh = false
  ): HTMLElement {
    const label = document.createElement("label");
    label.className = "bsb-tm-field bsb-tm-field-toggle";
    label.dataset.controlState = checked ? "on" : "off";

    const copy = document.createElement("div");
    copy.className = "bsb-tm-field-copy";

    const title = document.createElement("span");
    title.className = "bsb-tm-field-title";
    title.textContent = labelText;

    if (needsRefresh) {
      const hint = document.createElement("span");
      hint.className = "bsb-tm-refresh-hint";
      hint.textContent = "需刷新";
      title.appendChild(hint);
    }

    const help = document.createElement("small");
    help.className = "bsb-tm-field-help";
    help.textContent = helpText;

    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "bsb-tm-switch";
    input.setAttribute("role", "switch");
    input.checked = checked;
    input.addEventListener("change", async () => {
      label.dataset.controlState = input.checked ? "on" : "off";
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

    wrapper.append(
      this.createInputLabel("动态关键词正则", "用于识别带货、促销或疑似广告措辞。保留默认值通常更稳。")
    );

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
    onCommit: (value: T) => Promise<void>,
    helpText?: string
  ): HTMLElement {
    const wrapper = document.createElement("label");
    wrapper.className = "bsb-tm-field stacked";

    wrapper.append(this.createInputLabel(labelText, helpText));

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

  private createColorPalette(overrides: CategoryColorOverrides): HTMLElement {
    const grid = document.createElement("div");
    grid.className = "bsb-tm-color-grid";

    for (const category of CATEGORY_ORDER) {
      grid.appendChild(this.createColorInput(category, resolveCategoryAccent(category, overrides)));
    }

    return grid;
  }

  private createColorInput(category: Category, value: string): HTMLElement {
    const field = document.createElement("label");
    field.className = "bsb-tm-color-field";

    const preview = document.createElement("span");
    preview.className = "bsb-tm-color-preview";
    preview.style.setProperty("--bsb-color-preview", value);
    preview.textContent = CATEGORY_LABELS[category];

    const controls = document.createElement("div");
    controls.className = "bsb-tm-color-controls";

    const swatch = document.createElement("input");
    swatch.type = "color";
    swatch.value = value;
    swatch.setAttribute("aria-label", `${CATEGORY_LABELS[category]}颜色`);

    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.value = value;
    textInput.spellcheck = false;

    const commit = async (nextValue: string) => {
      const normalized = normalizeHexColor(nextValue) ?? CATEGORY_COLORS[category];
      swatch.value = normalized;
      textInput.value = normalized;
      preview.style.setProperty("--bsb-color-preview", normalized);
      await this.callbacks.onPatchConfig({
        categoryColorOverrides: {
          ...this.config.categoryColorOverrides,
          [category]: normalized
        }
      });
    };

    swatch.addEventListener("input", async () => {
      await commit(swatch.value);
    });

    textInput.addEventListener("change", async () => {
      await commit(textInput.value);
    });

    controls.append(swatch, textInput);
    field.append(preview, controls);
    return field;
  }

  private createCustomColorInput(
    labelText: string,
    helpText: string,
    value: string,
    onCommit: (value: string) => Promise<void>
  ): HTMLElement {
    const wrapper = document.createElement("label");
    wrapper.className = "bsb-tm-field stacked";
    wrapper.append(this.createInputLabel(labelText, helpText));

    const colorField = document.createElement("div");
    colorField.className = "bsb-tm-color-field";
    colorField.style.padding = "0";
    colorField.style.border = "none";
    colorField.style.background = "transparent";
    colorField.style.boxShadow = "none";

    const controls = document.createElement("div");
    controls.className = "bsb-tm-color-controls";
    controls.style.width = "100%";

    const swatch = document.createElement("input");
    swatch.type = "color";
    swatch.value = value;

    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.value = value;
    textInput.spellcheck = false;

    const commit = async (nextValue: string) => {
      const normalized = normalizeHexColor(nextValue) ?? value;
      swatch.value = normalized;
      textInput.value = normalized;
      await onCommit(normalized);
    };

    swatch.addEventListener("input", async () => commit(swatch.value));
    textInput.addEventListener("change", async () => commit(textInput.value));

    controls.append(swatch, textInput);
    colorField.append(controls);
    wrapper.append(colorField);
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
    titleWrap.className = "bsb-tm-panel-header-copy";

    const eyebrow = document.createElement("div");
    eyebrow.className = "bsb-tm-panel-eyebrow";
    const eyebrowIcon = document.createElement("span");
    eyebrowIcon.className = "bsb-tm-panel-eyebrow-icon";
    eyebrowIcon.appendChild(createSponsorShieldIcon());
    const eyebrowText = document.createElement("span");
    eyebrowText.textContent = "Video Quality of Life";
    eyebrow.append(eyebrowIcon, eyebrowText);

    const title = document.createElement("strong");
    title.id = "bsb-tm-panel-title";
    title.textContent = SCRIPT_NAME;

    const subtitle = document.createElement("div");
    subtitle.className = "bsb-tm-panel-subtitle";
    subtitle.textContent = "尽量贴近上游体验，在 B 站页面上做最少量、最可解释的增强。";

    titleWrap.append(eyebrow, title, subtitle);

    const actions = document.createElement("div");
    actions.className = "bsb-tm-panel-header-actions";

    const helpButton = document.createElement("button");
    helpButton.type = "button";
    helpButton.className = "bsb-tm-button secondary bsb-tm-header-action";
    helpButton.textContent = "帮助";
    helpButton.addEventListener("click", () => {
      this.setActiveTab("help");
    });

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "bsb-tm-button secondary bsb-tm-header-action bsb-tm-panel-close";
    closeButton.textContent = "关闭";
    closeButton.addEventListener("click", () => {
      this.close();
    });

    actions.append(helpButton, closeButton);
    header.append(titleWrap, actions);
    return header;
  }

  private createSection(name: PanelTab): HTMLElement {
    const section = document.createElement("section");
    section.className = "bsb-tm-panel-section";
    section.dataset.section = name;
    section.id = `${this.panelId}-section-${name}`;
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

  private createInlineHeading(titleText: string, descriptionText?: string): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "bsb-tm-inline-heading";

    const title = document.createElement("strong");
    title.className = "bsb-tm-section-label";
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

  private createFeatureGrid(
    items: Array<{ title: string; value: string; description: string }>,
    className: string
  ): HTMLElement {
    const grid = document.createElement("div");
    grid.className = className;

    for (const item of items) {
      const card = document.createElement("article");
      card.className = "bsb-tm-feature-card";

      const title = document.createElement("strong");
      title.className = "bsb-tm-feature-title";
      title.textContent = item.title;

      const value = document.createElement("span");
      value.className = "bsb-tm-feature-value";
      value.textContent = item.value;

      const description = document.createElement("p");
      description.className = "bsb-tm-section-description";
      description.textContent = item.description;

      card.append(title, value, description);
      grid.appendChild(card);
    }

    return grid;
  }

  private createFieldGrid(items: HTMLElement[], variant: "default" | "single-column" = "default"): HTMLElement {
    const grid = document.createElement("div");
    grid.className = "bsb-tm-field-grid";

    if (variant === "single-column") {
      grid.classList.add("single-column");
    }

    for (const item of items) {
      grid.appendChild(item);
    }

    return grid;
  }

  private createFormGroup(titleText: string, descriptionText: string, ...children: HTMLElement[]): HTMLElement {
    const group = document.createElement("section");
    group.className = "bsb-tm-form-group";

    const header = document.createElement("div");
    header.className = "bsb-tm-form-group-header";

    const title = document.createElement("strong");
    title.className = "bsb-tm-section-label";
    title.textContent = titleText;

    const description = document.createElement("p");
    description.className = "bsb-tm-section-description";
    description.textContent = descriptionText;

    header.append(title, description);

    const body = document.createElement("div");
    body.className = "bsb-tm-form-group-body";
    body.append(...children);

    group.append(header, body);
    return group;
  }

  private createActionRow(...actions: HTMLElement[]): HTMLElement {
    const row = document.createElement("div");
    row.className = "bsb-tm-actions-row";
    row.append(...actions);
    return row;
  }

  private createActionButton(
    text: string,
    variant: "primary" | "secondary" | "danger" = "primary",
    onClick: () => Promise<void>,
    options?: { id?: string; confirmText?: string }
  ): HTMLButtonElement {
    const { id, confirmText } = options ?? {};
    const button = document.createElement("button");
    const originalText = text;

    button.type = "button";

    // Restore persistent feedback state
    if (id && this.activeFeedbacks.has(id)) {
      button.className = "bsb-tm-button success";
      button.textContent = "已完成";
      button.disabled = true;
    } else {
      button.className = `bsb-tm-button ${variant}`;
      // Restore confirmation state
      if (id && confirmText && this.pendingConfirmations.has(id)) {
        button.textContent = confirmText;
        button.classList.add("confirming");
      } else {
        button.textContent = text;
      }
    }

    button.addEventListener("click", async () => {
      if (button.disabled) return;

      // Handle Two-Stage Confirmation
        if (id && confirmText && !this.pendingConfirmations.has(id)) {
        this.pendingConfirmations.add(id);
        button.textContent = confirmText;
        button.classList.add("confirming");
        
        // Auto-cancel confirmation after 3s
        setTimeout(() => {
          if (this.pendingConfirmations.has(id) && !this.activeFeedbacks.has(id)) {
            this.pendingConfirmations.delete(id);
            this.render(true); // Refresh to original status
          }
        }, 3000);
        return;
      }

      button.disabled = true;
      try {
        await onClick();
        
        if (id) {
          this.pendingConfirmations.delete(id);
          this.activeFeedbacks.set(id, originalText);
          
          // Trigger a re-render to show completion state across the class
          this.render(true);

          setTimeout(() => {
            this.activeFeedbacks.delete(id);
            this.render(true); // Re-render to clear success state
          }, 3000);
        } else {
          // Legacy behavior for non-ID buttons
          button.textContent = "已完成";
          button.classList.add("success");
          setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove("success");
            button.disabled = false;
          }, 3000);
        }
      } catch (e) {
        button.disabled = false;
        button.textContent = originalText;
        if (id) this.pendingConfirmations.delete(id);
      }
    });

    return button;
  }

  private createLinkGroup(links: Array<{ label: string; href: string }>): HTMLElement {
    const group = document.createElement("div");
    group.className = "bsb-tm-link-group";

    for (const entry of links) {
      const anchor = document.createElement("a");
      anchor.className = "bsb-tm-link-card";
      anchor.href = entry.href;
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
      anchor.textContent = entry.label;
      group.appendChild(anchor);
    }

    return group;
  }

  private createInfoBox(titleText: string, bodyText: string): HTMLElement {
    const box = document.createElement("div");
    box.className = "bsb-tm-info-box";
    const title = document.createElement("strong");
    title.textContent = titleText;
    const body = document.createElement("p");
    body.className = "bsb-tm-section-description";
    body.textContent = bodyText;
    box.append(title, body);
    return box;
  }

  private attachViewportListeners(): void {
    if (this.viewportListenersAttached) {
      return;
    }

    window.addEventListener("resize", this.handleViewportResize);
    window.visualViewport?.addEventListener("resize", this.handleViewportResize);
    window.visualViewport?.addEventListener("scroll", this.handleViewportResize);
    this.viewportListenersAttached = true;
  }

  private detachViewportListeners(): void {
    if (!this.viewportListenersAttached) {
      return;
    }

    window.removeEventListener("resize", this.handleViewportResize);
    window.visualViewport?.removeEventListener("resize", this.handleViewportResize);
    window.visualViewport?.removeEventListener("scroll", this.handleViewportResize);
    this.viewportListenersAttached = false;
  }

  private syncViewportMetrics(): void {
    const viewportWidth = Math.max(Math.floor(window.visualViewport?.width ?? window.innerWidth), 360);
    const viewportHeight = Math.max(Math.floor(window.visualViewport?.height ?? window.innerHeight), 360);
    const availableHeight = Math.max(viewportHeight - 24, 320);
    const preferredHeight = Math.min(860, Math.max(640, Math.round(viewportHeight * 0.82)));
    const stablePanelHeight = Math.min(availableHeight, preferredHeight);
    this.backdrop.style.setProperty("--bsb-tm-panel-vw", `${viewportWidth}px`);
    this.backdrop.style.setProperty("--bsb-tm-panel-vh", `${viewportHeight}px`);
    this.backdrop.style.setProperty("--bsb-tm-panel-height", `${stablePanelHeight}px`);
  }

  private rememberActiveScroll(): void {
    if (!this.content.isConnected) {
      return;
    }
    this.contentScrollByTab[this.activeTab] = this.content.scrollTop;
  }

  private restoreActiveScroll(): void {
    if (!this.content.isConnected) {
      return;
    }
    this.content.scrollTop = this.contentScrollByTab[this.activeTab] ?? 0;
  }
}
