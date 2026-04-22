import {
  CATEGORY_COLORS,
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CONTENT_FILTER_MODE_LABELS,
  MODE_LABELS,
  AUTHOR_NAME,
  SCRIPT_NAME,
  THUMBNAIL_LABEL_MODE_LABELS
} from "../constants";
import type { LocalVideoLabelListEntry } from "../core/local-label-store";
import type { CommentFeedbackRecordsSummary } from "../features/comment-filter";
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
import { normalizeHexColor, resolveCategoryAccent, resolveCategoryStyle } from "../utils/color";
import { validateStoredPattern } from "../utils/pattern";
import {
  clearDiagnostics,
  formatDiagnosticReport,
  getDiagnosticEvents,
  isDiagnosticDebugEnabled,
  reportDiagnostic,
  setDiagnosticDebugEnabled,
  subscribeDiagnostics,
  type DiagnosticEvent
} from "../utils/diagnostics";
import { createSponsorShieldIcon } from "./icons";
import { createInlineBadge, type InlineBadgeAppearance, type InlineTone } from "./inline-feedback";

type PanelCallbacks = {
  onPatchConfig: (patch: Partial<StoredConfig>) => Promise<void>;
  onCategoryModeChange: (category: Category, mode: CategoryMode) => Promise<void>;
  onClearCache: () => Promise<void>;
  onReset: () => Promise<void>;
  onClose?: (reason: "user" | "system") => void;
  onListLocalVideoLabels?: () => Promise<LocalVideoLabelListEntry[]>;
  onDeleteLocalVideoLabel?: (videoId: string) => Promise<void>;
  onClearLocalVideoLabels?: () => Promise<void>;
  onGetCommentFeedbackSummary?: () => Promise<CommentFeedbackRecordsSummary>;
  onClearCommentFeedback?: () => Promise<void>;
};

export type PanelTab = "overview" | "behavior" | "transparency" | "filters" | "mbga" | "help";
export type PanelCloseReason = "user" | "system";

type ColorPreviewSpec =
  | {
      kind: "category";
      category: Category;
      description: string;
    }
  | {
      kind: "inline";
      text: string;
      tone: InlineTone;
      appearance: InlineBadgeAppearance;
      description: string;
    };

type LocalLearningPanelState = {
  status: "idle" | "loading" | "ready" | "error";
  videoRecords: LocalVideoLabelListEntry[];
  commentFeedback: CommentFeedbackRecordsSummary;
  errorMessage: string | null;
};

const EMPTY_COMMENT_FEEDBACK_SUMMARY: CommentFeedbackRecordsSummary = {
  count: 0,
  maxRecords: 0,
  latestUpdatedAt: null
};
const LOCAL_LEARNING_ITEM_REMOVE_MS = 180;

const LOCAL_LABEL_SOURCE_LABELS: Record<LocalVideoLabelListEntry["source"], string> = {
  "comment-goods": "自动信号：评论商品卡",
  "comment-suspicion": "自动信号：评论线索",
  "page-heuristic": "自动信号：页面线索",
  manual: "手动保留",
  "manual-dismiss": "手动忽略"
};

const TAB_LABELS: Record<PanelTab, string> = {
  overview: "概览",
  behavior: "片段与标签",
  transparency: "标签透明度",
  filters: "动态 / 评论",
  mbga: "生态噪音压制 (MBGA)",
  help: "帮助 / 反馈"
};

const TAB_DESCRIPTIONS: Record<PanelTab, string> = {
  overview: "状态、摘要与维护工具",
  behavior: "片段、标签与显示策略",
  transparency: "胶囊透明度与降噪策略",
  filters: "动态和评论区增强",
  mbga: "已知规则、实验压制与沉浸化",
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
  private readonly transparencyForm = document.createElement("div");
  private readonly filterForm = document.createElement("div");
  private readonly categoryForm = document.createElement("div");
  private readonly mbgaForm = document.createElement("div");
  private readonly sections = new Map<PanelTab, HTMLElement>();
  private readonly panelId = "bsb-tm-panel";
  private readonly contentScrollByTab: Partial<Record<PanelTab, number>> = {};
  private activeTab: PanelTab = "overview";
  private filterValidationMessage: string | null = null;
  private diagnosticEvents: DiagnosticEvent[] = getDiagnosticEvents();
  private config: StoredConfig;
  private stats: StoredStats;
  private fullVideoLabels: string[] = [];
  private runtimeStatus: RuntimeStatus = {
    kind: "idle",
    message: "等待页面匹配",
    bvid: null,
    segmentCount: null
  };
  private localLearningState: LocalLearningPanelState = {
    status: "idle",
    videoRecords: [],
    commentFeedback: EMPTY_COMMENT_FEEDBACK_SUMMARY,
    errorMessage: null
  };
  private localLearningRequestId = 0;
  private localLearningRefreshPending = false;
  private readonly activeFeedbacks = new Map<string, string>(); // id -> originalText
  private readonly pendingConfirmations = new Set<string>(); // id
  private inlineControlUpdateDepth = 0;
  private unsubscribeDiagnostics: (() => void) | null = null;
  private readonly handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && !this.backdrop.hidden) {
      this.close("user");
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
        this.close("user");
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
    this.transparencyForm.className = "bsb-tm-form";
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
    this.unsubscribeDiagnostics = subscribeDiagnostics((events) => {
      this.diagnosticEvents = events;
      if (this.activeTab === "help") {
        this.renderHelp();
      }
    });
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
    this.close("user");
  }

  isOpen(): boolean {
    return !this.backdrop.hidden;
  }

  getActiveTab(): PanelTab {
    return this.activeTab;
  }

  open(tab: PanelTab = this.activeTab): void {
    const wasHidden = this.backdrop.hidden;
    this.mount();
    this.attachViewportListeners();
    this.syncViewportMetrics();
    this.setActiveTab(tab, { preserveScroll: true, scrollTop: this.contentScrollByTab[tab] ?? 0, skipRemember: wasHidden });
    this.backdrop.hidden = false;
    document.documentElement.classList.add("bsb-tm-panel-open");
    document.addEventListener("keydown", this.handleKeydown);
  }

  close(reason: PanelCloseReason = "user"): void {
    const wasOpen = !this.backdrop.hidden;
    if (wasOpen) {
      this.rememberActiveScroll();
    }
    this.backdrop.hidden = true;
    this.detachViewportListeners();
    document.documentElement.classList.remove("bsb-tm-panel-open");
    document.removeEventListener("keydown", this.handleKeydown);
    if (wasOpen) {
      this.callbacks.onClose?.(reason);
    }
  }

  unmount(): void {
    this.close("system");
    this.unsubscribeDiagnostics?.();
    this.unsubscribeDiagnostics = null;
    this.backdrop.remove();
  }

  updateConfig(config: StoredConfig): void {
    this.config = config;
    this.filterValidationMessage = null;
    if (this.inlineControlUpdateDepth > 0 && !this.backdrop.hidden) {
      this.renderInactiveConfigSections();
      return;
    }
    this.rememberActiveScroll();
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

  refreshLocalLearningRecords(): void {
    if (this.localLearningState.status === "loading") {
      this.localLearningRefreshPending = true;
      return;
    }

    const requestId = this.localLearningRequestId + 1;
    this.localLearningRequestId = requestId;
    this.localLearningRefreshPending = false;
    this.localLearningState = {
      ...this.localLearningState,
      status: "loading",
      errorMessage: null
    };

    Promise.all([
      this.callbacks.onListLocalVideoLabels?.() ?? Promise.resolve([]),
      this.callbacks.onGetCommentFeedbackSummary?.() ?? Promise.resolve(EMPTY_COMMENT_FEEDBACK_SUMMARY)
    ])
      .then(([videoRecords, commentFeedback]) => {
        if (requestId !== this.localLearningRequestId) {
          return;
        }
        this.localLearningState = {
          status: "ready",
          videoRecords,
          commentFeedback,
          errorMessage: null
        };
      })
      .catch((error) => {
        if (requestId !== this.localLearningRequestId) {
          return;
        }
        this.localLearningState = {
          ...this.localLearningState,
          status: "error",
          errorMessage: "本地学习记录读取失败"
        };
        reportDiagnostic({
          severity: "warn",
          area: "storage",
          message: "本地学习记录读取失败",
          detail: error
        });
      })
      .finally(() => {
        if (requestId !== this.localLearningRequestId) {
          return;
        }
        if (this.activeTab === "help" && !this.backdrop.hidden) {
          this.renderHelp();
        }
        if (this.localLearningRefreshPending) {
          this.localLearningRefreshPending = false;
          this.refreshLocalLearningRecords();
        }
      });
  }

  private render(preserveScroll = false): void {
    const nextScrollTop = preserveScroll ? (this.contentScrollByTab[this.activeTab] ?? this.content.scrollTop) : 0;
    this.renderOverview();
    this.renderBehavior();
    this.renderTransparency();
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
              "启用 Bilibili QoL Core",
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
            ),
            this.createCheckbox(
              "显示灰字广告文案",
              "默认关闭。关闭后，紧凑顶部栏只显示通用占位提示，不展示原生搜索框里的灰字广告内容。",
              this.config.compactHeaderPlaceholderVisible,
              async (checked) => {
                await this.callbacks.onPatchConfig({ compactHeaderPlaceholderVisible: checked });
              }
            ),
            this.createCheckbox(
              "允许搜索灰字广告文案",
              "默认关闭。开启后，若紧凑顶部栏搜索框为空，且当前实际显示的是非通用灰字广告文案，点击搜索或按回车会直接搜索该文案。",
              this.config.compactHeaderSearchPlaceholderEnabled,
              async (checked) => {
                await this.callbacks.onPatchConfig({ compactHeaderSearchPlaceholderEnabled: checked });
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
      const row = document.createElement("div");
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
      select.setAttribute("aria-label", `${CATEGORY_LABELS[category]}分类策略`);
      for (const mode of Object.keys(MODE_LABELS) as CategoryMode[]) {
        const option = document.createElement("option");
        option.value = mode;
        option.textContent = MODE_LABELS[mode];
        option.selected = this.config.categoryModes[category] === mode;
        select.appendChild(option);
      }
      let pointerDrivenSelection = false;
      this.bindPointerFocusSuppression(row, select, {
        activateControlOnPointer: true,
        onControlPointerFocus: () => {
          pointerDrivenSelection = true;
        }
      });
      select.addEventListener("change", async () => {
        const finishInlineUpdate = this.beginInlineControlUpdate();
        try {
          await this.callbacks.onCategoryModeChange(category, select.value as CategoryMode);
        } catch (error) {
          select.value = this.config.categoryModes[category];
          this.markControlError(row);
          reportDiagnostic({
            severity: "warn",
            area: "storage",
            message: `${CATEGORY_LABELS[category]} 分类策略保存失败，已回退`,
            detail: error
          });
        } finally {
          if (pointerDrivenSelection) {
            select.blur();
          }
          pointerDrivenSelection = false;
          finishInlineUpdate();
        }
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

  private renderTransparency(): void {
    const transparency = this.config.labelTransparency;
    const section = this.sections.get("transparency");
    if (!section) {
      return;
    }

    this.transparencyForm.replaceChildren(
      this.createFormGroup(
        "视频主线标签",
        "这两类标签属于 QoL Core 主线能力。透明模式会从高纯度胶囊改成更克制的 Liquid Glass 表现，默认保持关闭，确保升级后现有视觉不变。",
        this.createFieldGrid([
          this.createCheckbox(
            "标题商业标签使用透明模式",
            "用于视频标题前的整视频胶囊。开启后会保留分类色倾向，但把纯色填充改为更轻的玻璃染色，减少对标题阅读的干扰。",
            transparency.titleBadge,
            async (checked) => {
              await this.callbacks.onPatchConfig({
                labelTransparency: {
                  ...this.config.labelTransparency,
                  titleBadge: checked
                }
              });
            }
          ),
          this.createCheckbox(
            "封面胶囊标签使用透明模式",
            "用于首页、搜索、侧栏卡片上的整视频标签。开启后仍保留悬浮展开与可读性，但会降低对封面主体的视觉压制。",
            transparency.thumbnailLabel,
            async (checked) => {
              await this.callbacks.onPatchConfig({
                labelTransparency: {
                  ...this.config.labelTransparency,
                  thumbnailLabel: checked
                }
              });
            }
          )
        ])
      ),
      this.createFormGroup(
        "站内增强标签",
        "这三类标签更偏提示性质，不建议强绑成一个总开关。分项控制可以让你只给“过于显眼”的标签降噪，而不牺牲其他提醒能力。",
        this.createFieldGrid([
          this.createCheckbox(
            "评论广告标签使用透明模式",
            "用于评论区带货、促销、疑似广告等标签。开启后会弱化整块背景存在感，把注意力更多还给评论正文。",
            transparency.commentBadge,
            async (checked) => {
              await this.callbacks.onPatchConfig({
                labelTransparency: {
                  ...this.config.labelTransparency,
                  commentBadge: checked
                }
              });
            }
          ),
          this.createCheckbox(
            "评论属地标签使用透明模式",
            "用于评论发布时间旁的 IP 属地胶囊。这个场景最容易打断正文阅读，所以单独给开关，默认关闭。",
            transparency.commentLocation,
            async (checked) => {
              await this.callbacks.onPatchConfig({
                labelTransparency: {
                  ...this.config.labelTransparency,
                  commentLocation: checked
                }
              });
            }
          ),
          this.createCheckbox(
            "动态页商业标签使用透明模式",
            "用于动态页“带货动态 / 疑似广告”等标签。开启后仍保留强调点与轮廓，但会明显降低纯色块带来的抢眼感。",
            transparency.dynamicBadge,
            async (checked) => {
              await this.callbacks.onPatchConfig({
                labelTransparency: {
                  ...this.config.labelTransparency,
                  dynamicBadge: checked
                }
              });
            }
          )
        ])
      ),
      this.createInfoBox(
        "设计说明",
        "这里的“透明”不是简单调低 opacity，而是改为更低侵入的 Liquid Glass：轻染色、高光、边缘描线、受控模糊，并优先保证文字可读性。"
      )
    );

    section.replaceChildren(
      this.createSectionHeading(
        "标签透明度",
        "集中管理所有胶囊标签的透明模式。默认全部关闭，保证现有用户升级后不会被强制改变视觉风格。"
      ),
      this.transparencyForm
    );
  }

  private renderMbga(): void {
    const mbgaFields: HTMLElement[] = [
      this.createCheckbox(
        "启用生态噪音压制 (MBGA)",
        "总开关。开启后按已知规则尝试减少部分页面噪音，并启用若干 best-effort 页面小修。",
        this.config.mbgaEnabled,
        async (checked) => {
          await this.callbacks.onPatchConfig({ mbgaEnabled: checked });
        },
        true
      ),
      this.createCheckbox(
        "减少已知遥测与追踪噪音",
        "仅处理 data.bilibili.com / cm.bilibili.com 等少量已知 host，不是完整隐私防护或全面遥测阻断。",
        this.config.mbgaBlockTracking,
        async (checked) => {
          await this.callbacks.onPatchConfig({ mbgaBlockTracking: checked });
        },
        true
      ),
      this.createCheckbox(
        "实验：PCDN / WebRTC 路径压制",
        "默认关闭。仅对部分已知 PCDN / WebRTC / CDN 路径做 best-effort 压制，可能影响播放、直播或互动功能。",
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
        "页面小修与低侵入简化",
        "按已知 DOM 规则处理广告提示、黑白滤镜、复制限制、动态宽屏适配等 UI 小修；页面变化时可能失效。",
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
        "生态噪音压制 (MBGA)",
        "基于少量已知规则的 best-effort 页面小修和网络噪音压制。它不是完整隐私防护、完整遥测阻断或完整 PCDN 禁用工具。"
      ),
      this.createFormGroup(
        "功能开关",
        "网络与播放器相关改动需要刷新页面才会完全生效；实验项请在 Safari 主窗口确认无播放或直播副作用后再长期启用。",
        this.createFieldGrid(mbgaFields)
      )
    );
  }

  private renderHelp(): void {
    const children: HTMLElement[] = [
      this.createSectionHeading("帮助与反馈", "这里说明脚本在页面上会看到什么，以及如何判断标签是否工作正常。"),
      this.createFeatureGrid(
        [
          {
            title: "标题前商业标签",
            value: "视频页",
            description: "当整个视频有社区 full 标签、整视频标签接口结果或本地推理结果时，会在标题前显示彩色胶囊；只有带真实 UUID 的社区 full 标签可提交上游反馈。"
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
            href: "https://github.com/FilfTeen/bilibili-qol-core-userscript"
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
      ])
    ];
    children.push(this.createLocalLearningManagerCard());
    children.push(this.createDeveloperDiagnosticsCard());
    children.push(
      this.createInfoBox(
        "致谢与免责声明",
        `Bilibili QoL Core 由 ${AUTHOR_NAME} 维护。本脚本基于 GPL-3.0 的 BilibiliSponsorBlock 上游实现思路移植而来；评论区属地显示功能参考并适配了 mscststs 的 ISC 脚本「B站评论区开盒」。所有片段和社区 full 标签来自上游社区记录，本地推理只作为辅助判断，结果仅供参考。`
      )
    );
    this.sections.get("help")?.replaceChildren(...children);
  }

  private createLocalLearningManagerCard(): HTMLElement {
    if (this.localLearningState.status === "idle") {
      this.refreshLocalLearningRecords();
    }

    const card = document.createElement("div");
    card.className = "bsb-tm-local-learning-card";
    card.setAttribute("data-bsb-local-learning-manager", "true");

    const heading = document.createElement("div");
    heading.className = "bsb-tm-local-learning-heading";
    const title = document.createElement("strong");
    title.textContent = "本地学习记录";
    const badge = document.createElement("span");
    badge.className = "bsb-tm-local-learning-count";
    badge.textContent =
      this.localLearningState.status === "loading"
        ? "读取中"
        : `${this.localLearningState.videoRecords.length} 条视频 · ${this.localLearningState.commentFeedback.count} 条评论反馈锁`;
    heading.append(title, badge);

    const description = document.createElement("p");
    description.className = "bsb-tm-section-description";
    description.textContent =
      "这里只管理当前浏览器里的本地学习记录。上游 SponsorBlock / video label 记录不在这里，也不能通过这里删除。删除本地记录后，后续自动推理仍可能再次出现。";

    const videoSection = this.createLocalVideoLearningSection();
    const commentSection = this.createCommentFeedbackLearningSection();

    card.append(heading, description, videoSection, commentSection);
    return card;
  }

  private createLocalVideoLearningSection(): HTMLElement {
    const section = document.createElement("section");
    section.className = "bsb-tm-local-learning-section";

    const heading = document.createElement("div");
    heading.className = "bsb-tm-local-learning-subheading";
    const title = document.createElement("strong");
    title.textContent = "本地视频标签";
    const clearButton = this.createLocalLearningActionButton("清空视频记录", "danger", async () => {
      if (!this.callbacks.onClearLocalVideoLabels) {
        return;
      }
      await this.callbacks.onClearLocalVideoLabels();
      this.localLearningState = {
        ...this.localLearningState,
        status: "ready",
        videoRecords: [],
        errorMessage: null
      };
      this.renderHelpIfOpen();
      this.refreshLocalLearningRecords();
    }, "确认清空视频记录？");
    clearButton.setAttribute("data-bsb-local-label-clear", "true");
    clearButton.disabled =
      this.localLearningState.status !== "ready" ||
      this.localLearningState.videoRecords.length === 0 ||
      !this.callbacks.onClearLocalVideoLabels;
    heading.append(title, clearButton);

    const body = document.createElement("div");
    body.className = "bsb-tm-local-learning-list";
    if (this.localLearningState.status === "loading" || this.localLearningState.status === "idle") {
      body.appendChild(this.createLocalLearningEmpty("正在读取本地视频学习记录..."));
    } else if (this.localLearningState.status === "error") {
      body.appendChild(this.createLocalLearningEmpty(this.localLearningState.errorMessage ?? "本地学习记录读取失败"));
    } else if (this.localLearningState.videoRecords.length === 0) {
      body.appendChild(this.createLocalLearningEmpty("暂无本地视频学习记录。"));
    } else {
      for (const record of this.localLearningState.videoRecords) {
        body.appendChild(this.createLocalVideoLearningItem(record));
      }
    }

    section.append(heading, body);
    return section;
  }

  private createLocalVideoLearningItem(record: LocalVideoLabelListEntry): HTMLElement {
    const item = document.createElement("article");
    item.className = "bsb-tm-local-learning-item";
    item.dataset.source = record.source;

    const copy = document.createElement("div");
    copy.className = "bsb-tm-local-learning-copy";
    const title = document.createElement("strong");
    title.textContent = record.videoId;
    const meta = document.createElement("small");
    const categoryText = record.category ? CATEGORY_LABELS[record.category] : "已忽略";
    const confidenceText = `${Math.round(record.confidence * 100)}%`;
    meta.textContent = `${categoryText} · ${LOCAL_LABEL_SOURCE_LABELS[record.source]} · 置信度 ${confidenceText}`;
    const reason = document.createElement("p");
    reason.className = "bsb-tm-section-description";
    reason.textContent = record.reason
      ? `${record.reason}。更新于 ${this.formatLocalLearningTime(record.updatedAt)}`
      : `更新于 ${this.formatLocalLearningTime(record.updatedAt)}`;
    copy.append(title, meta, reason);

    const deleteButton = this.createLocalVideoDeleteButton(record, item);
    deleteButton.setAttribute("data-bsb-local-label-delete", record.videoId);
    deleteButton.disabled = !this.callbacks.onDeleteLocalVideoLabel;

    item.append(copy, deleteButton);
    return item;
  }

  private createLocalVideoDeleteButton(record: LocalVideoLabelListEntry, item: HTMLElement): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bsb-tm-button secondary compact";
    button.textContent = "删除";
    button.addEventListener("click", async () => {
      if (button.disabled || !this.callbacks.onDeleteLocalVideoLabel) {
        return;
      }

      button.disabled = true;
      button.textContent = "删除中";
      item.setAttribute("aria-busy", "true");

      try {
        await this.callbacks.onDeleteLocalVideoLabel(record.videoId);
        this.localLearningState = {
          ...this.localLearningState,
          status: "ready",
          videoRecords: this.localLearningState.videoRecords.filter((candidate) => candidate.videoId !== record.videoId),
          errorMessage: null
        };
        this.markLocalLearningItemRemoving(item);
        this.finishLocalLearningItemRemoval(item, () => {
          this.renderHelpIfOpen();
          this.refreshLocalLearningRecords();
        });
      } catch (error) {
        delete item.dataset.removing;
        item.removeAttribute("aria-busy");
        button.disabled = false;
        button.textContent = "操作失败";
        reportDiagnostic({
          severity: "warn",
          area: "storage",
          message: "本地学习记录操作失败，已保留原记录",
          detail: error
        });
        window.setTimeout(() => {
          button.textContent = "删除";
        }, 1600);
      }
    });
    return button;
  }

  private markLocalLearningItemRemoving(item: HTMLElement): void {
    const measuredHeight = Math.ceil(Math.max(item.scrollHeight, item.getBoundingClientRect().height));
    item.style.setProperty("--bsb-local-learning-item-height", `${Math.max(measuredHeight, 1)}px`);
    // Force Safari to see the measured height before the collapse state is applied.
    void item.offsetHeight;
    item.dataset.removing = "true";
    item.setAttribute("aria-busy", "true");
  }

  private createCommentFeedbackLearningSection(): HTMLElement {
    const section = document.createElement("section");
    section.className = "bsb-tm-local-learning-section";

    const heading = document.createElement("div");
    heading.className = "bsb-tm-local-learning-subheading";
    const title = document.createElement("strong");
    title.textContent = "评论反馈锁";
    const clearButton = this.createLocalLearningActionButton("清空反馈锁", "danger", async () => {
      if (!this.callbacks.onClearCommentFeedback) {
        return;
      }
      await this.callbacks.onClearCommentFeedback();
      this.localLearningState = {
        ...this.localLearningState,
        status: "ready",
        commentFeedback: {
          ...this.localLearningState.commentFeedback,
          count: 0,
          latestUpdatedAt: null
        },
        errorMessage: null
      };
      this.renderHelpIfOpen();
      this.refreshLocalLearningRecords();
    }, "确认清空反馈锁？");
    clearButton.setAttribute("data-bsb-comment-feedback-clear", "true");
    clearButton.disabled =
      this.localLearningState.status !== "ready" ||
      this.localLearningState.commentFeedback.count === 0 ||
      !this.callbacks.onClearCommentFeedback;
    heading.append(title, clearButton);

    const body = document.createElement("div");
    body.className = "bsb-tm-local-learning-comment-summary";
    const summary = document.createElement("p");
    summary.className = "bsb-tm-section-description";
    if (this.localLearningState.status === "loading" || this.localLearningState.status === "idle") {
      summary.textContent = "正在读取评论反馈锁...";
    } else if (this.localLearningState.status === "error") {
      summary.textContent = "评论反馈锁读取失败。";
    } else {
      const latest = this.localLearningState.commentFeedback.latestUpdatedAt
        ? `最近更新于 ${this.formatLocalLearningTime(this.localLearningState.commentFeedback.latestUpdatedAt)}。`
        : "";
      summary.textContent = `当前有 ${this.localLearningState.commentFeedback.count} 条评论反馈锁，最多保留 ${this.localLearningState.commentFeedback.maxRecords} 条。${latest} 不展示评论原文或哈希明细。`;
    }
    body.appendChild(summary);

    section.append(heading, body);
    return section;
  }

  private renderHelpIfOpen(): void {
    if (this.activeTab === "help" && !this.backdrop.hidden) {
      this.renderHelp();
    }
  }

  private finishLocalLearningItemRemoval(item: HTMLElement, onDone: () => void): void {
    if (this.prefersReducedMotion()) {
      onDone();
      return;
    }

    let finished = false;
    let timer: number | null = null;
    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      if (timer !== null) {
        window.clearTimeout(timer);
      }
      item.removeEventListener("transitionend", finish);
      onDone();
    };

    item.addEventListener("transitionend", finish);
    timer = window.setTimeout(finish, LOCAL_LEARNING_ITEM_REMOVE_MS + 80);
  }

  private prefersReducedMotion(): boolean {
    return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  private createLocalLearningActionButton(
    text: string,
    variant: "secondary" | "danger",
    onClick: () => Promise<void>,
    confirmText?: string
  ): HTMLButtonElement {
    const button = document.createElement("button");
    const originalText = text;
    let confirming = false;
    let resetTimer: number | null = null;
    button.type = "button";
    button.className = `bsb-tm-button ${variant} compact`;
    button.textContent = text;
    button.addEventListener("click", async () => {
      if (button.disabled) {
        return;
      }
      if (confirmText && !confirming) {
        confirming = true;
        button.textContent = confirmText;
        button.classList.add("confirming");
        resetTimer = window.setTimeout(() => {
          confirming = false;
          button.textContent = originalText;
          button.classList.remove("confirming");
        }, 3000);
        return;
      }
      if (resetTimer !== null) {
        window.clearTimeout(resetTimer);
        resetTimer = null;
      }
      button.disabled = true;
      try {
        await onClick();
      } catch (error) {
        button.disabled = false;
        confirming = false;
        button.textContent = "操作失败";
        button.classList.remove("confirming");
        reportDiagnostic({
          severity: "warn",
          area: "storage",
          message: "本地学习记录操作失败，已保留原记录",
          detail: error
        });
        window.setTimeout(() => {
          button.textContent = originalText;
        }, 1600);
      }
    });
    return button;
  }

  private createLocalLearningEmpty(text: string): HTMLElement {
    const empty = document.createElement("p");
    empty.className = "bsb-tm-local-learning-empty";
    empty.textContent = text;
    return empty;
  }

  private formatLocalLearningTime(timestamp: number): string {
    if (!Number.isFinite(timestamp) || timestamp <= 0) {
      return "未知时间";
    }
    return new Date(timestamp).toLocaleString();
  }

  private createDeveloperDiagnosticsCard(): HTMLElement {
    const events = this.diagnosticEvents.slice(-8).reverse();
    const warnCount = this.diagnosticEvents.filter((event) => event.severity === "warn").length;
    const errorCount = this.diagnosticEvents.filter((event) => event.severity === "error").length;

    const card = document.createElement("div");
    card.className = "bsb-tm-diagnostics-card";

    const heading = document.createElement("div");
    heading.className = "bsb-tm-diagnostics-heading";
    const title = document.createElement("strong");
    title.textContent = "开发者诊断";
    const badge = document.createElement("span");
    badge.className = "bsb-tm-diagnostics-count";
    badge.textContent = `${this.diagnosticEvents.length} 条 · ${warnCount} 警告 · ${errorCount} 错误`;
    heading.append(title, badge);

    const debugToggle = document.createElement("label");
    debugToggle.className = "bsb-tm-diagnostics-debug-toggle";
    const debugCopy = document.createElement("span");
    debugCopy.className = "bsb-tm-diagnostics-debug-copy";
    const debugTitle = document.createElement("strong");
    debugTitle.textContent = "详细日志";
    const debugStatus = document.createElement("small");
    debugCopy.append(debugTitle, debugStatus);
    const debugSwitch = document.createElement("input");
    debugSwitch.type = "checkbox";
    debugSwitch.className = "bsb-tm-switch";
    debugSwitch.setAttribute("data-bsb-diagnostics-debug", "true");
    const updateDebugStatus = () => {
      const enabled = isDiagnosticDebugEnabled();
      debugSwitch.checked = enabled;
      debugStatus.textContent = enabled
        ? "详细日志已开启，会输出更多控制台调试信息。"
        : "默认关闭。普通使用无需开启，排查问题时再打开。";
    };
    this.bindPointerFocusSuppression(debugToggle, debugSwitch);
    debugSwitch.addEventListener("change", () => {
      setDiagnosticDebugEnabled(debugSwitch.checked);
      updateDebugStatus();
    });
    updateDebugStatus();
    debugToggle.append(debugCopy, debugSwitch);

    const description = document.createElement("p");
    description.className = "bsb-tm-section-description";
    description.textContent = "诊断报告只保留最近事件，并会自动清洗用户 ID、评论原文、token 等敏感字段。";

    const list = document.createElement("div");
    list.className = "bsb-tm-diagnostics-list";
    if (events.length === 0) {
      const empty = document.createElement("p");
      empty.className = "bsb-tm-diagnostics-empty";
      empty.textContent = "暂无诊断事件。复制报告仍会包含版本、页面、浏览器和 debug 状态。";
      list.appendChild(empty);
    } else {
      for (const event of events) {
        const item = document.createElement("article");
        item.className = "bsb-tm-diagnostics-item";
        item.dataset.severity = event.severity;
        const meta = document.createElement("small");
        meta.textContent = `${event.severity} / ${event.area} · ${new Date(event.at).toLocaleTimeString()}`;
        const message = document.createElement("strong");
        message.textContent = event.message;
        item.append(meta, message);
        if (event.detail) {
          const detail = document.createElement("code");
          detail.textContent = event.detail;
          item.appendChild(detail);
        }
        list.appendChild(item);
      }
    }

    const actions = document.createElement("div");
    actions.className = "bsb-tm-diagnostics-actions";
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "bsb-tm-button secondary compact";
    copyButton.textContent = "复制诊断报告";
    copyButton.setAttribute("data-bsb-diagnostics-copy", "true");
    copyButton.addEventListener("click", () => {
      void this.copyDiagnosticReport(copyButton);
    });
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "bsb-tm-button secondary compact";
    clearButton.textContent = "清空";
    clearButton.setAttribute("data-bsb-diagnostics-clear", "true");
    clearButton.disabled = this.diagnosticEvents.length === 0;
    clearButton.addEventListener("click", () => {
      clearDiagnostics();
      this.renderHelp();
    });
    actions.append(copyButton, clearButton);

    card.append(heading, debugToggle, description, list, actions);
    return card;
  }

  private async copyDiagnosticReport(button: HTMLButtonElement): Promise<void> {
    const originalText = button.textContent ?? "复制诊断报告";
    try {
      const clipboard = navigator.clipboard;
      if (!clipboard || typeof clipboard.writeText !== "function") {
        throw new Error("Clipboard API unavailable");
      }
      await clipboard.writeText(formatDiagnosticReport());
      button.textContent = "已复制";
    } catch (error) {
      button.textContent = "复制失败";
      reportDiagnostic({
        severity: "warn",
        area: "ui",
        message: "诊断报告复制失败",
        detail: error
      });
    } finally {
      window.setTimeout(() => {
        button.textContent = originalText;
      }, 1400);
    }
  }

  private setActiveTab(tab: PanelTab, options?: { preserveScroll?: boolean; scrollTop?: number; skipRemember?: boolean }): void {
    if (!options?.skipRemember) {
      this.rememberActiveScroll();
    }
    this.activeTab = tab;
    for (const button of this.nav.querySelectorAll<HTMLButtonElement>("[data-tab]")) {
      const active = button.dataset.tab === tab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    }
    for (const [sectionTab, section] of this.sections) {
      const active = sectionTab === tab;
      section.hidden = !active;
      section.setAttribute("aria-hidden", String(!active));
      section.dataset.active = String(active);
    }
    if (tab === "help") {
      this.renderHelp();
    }
    this.content.scrollTop = options?.preserveScroll ? (options.scrollTop ?? this.contentScrollByTab[tab] ?? 0) : 0;
  }

  private beginInlineControlUpdate(): () => void {
    this.inlineControlUpdateDepth += 1;
    return () => {
      this.inlineControlUpdateDepth = Math.max(0, this.inlineControlUpdateDepth - 1);
    };
  }

  private renderInactiveConfigSections(): void {
    const activeTab = this.activeTab;
    if (activeTab !== "overview") {
      this.renderOverview();
    }
    if (activeTab !== "behavior") {
      this.renderBehavior();
    }
    if (activeTab !== "transparency") {
      this.renderTransparency();
    }
    if (activeTab !== "filters") {
      this.renderFilters();
    }
    if (activeTab !== "mbga") {
      this.renderMbga();
    }
    if (activeTab !== "help") {
      this.renderHelp();
    }
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
    let pointerDrivenActivation = false;
    button.addEventListener("pointerdown", () => {
      pointerDrivenActivation = true;
      button.dataset.pointerFocus = "true";
    });
    button.addEventListener("keydown", () => {
      pointerDrivenActivation = false;
      delete button.dataset.pointerFocus;
    });
    button.addEventListener("blur", () => {
      pointerDrivenActivation = false;
      delete button.dataset.pointerFocus;
    });
    button.addEventListener("click", () => {
      this.setActiveTab(tab, { preserveScroll: true, scrollTop: this.contentScrollByTab[tab] ?? 0 });
      if (pointerDrivenActivation) {
        button.blur();
        pointerDrivenActivation = false;
        delete button.dataset.pointerFocus;
      }
    });
    return button;
  }

  private bindPointerFocusSuppression(
    container: HTMLElement,
    control: HTMLElement,
    options?: { activateControlOnPointer?: boolean; onControlPointerFocus?: () => void; onPointerFocus?: () => void }
  ): void {
    let focusGuardTimer: number | null = null;
    let windowFocusClearArmed = false;
    let nativeSelectClosePointerArmed = false;
    let nativeSelectControlClickCloseAfter = 0;
    const getGroup = (): HTMLElement | null => container.closest<HTMLElement>(".bsb-tm-form-group");
    const isInsideControl = (event: Event): boolean => event.target instanceof Node && control.contains(event.target);
    const clearNativeSelectClosePointer = () => {
      if (!nativeSelectClosePointerArmed) {
        return;
      }
      document.removeEventListener("pointerdown", handleNativeSelectClosePointer);
      document.removeEventListener("mousedown", handleNativeSelectClosePointer);
      document.removeEventListener("click", handleNativeSelectClosePointer);
      nativeSelectClosePointerArmed = false;
    };
    const clearActiveVisual = () => {
      if (windowFocusClearArmed) {
        window.removeEventListener("focus", handleWindowFocus);
        windowFocusClearArmed = false;
      }
      clearNativeSelectClosePointer();
      delete container.dataset.controlActive;
      delete control.dataset.controlActive;
      const group = getGroup();
      if (group) {
        delete group.dataset.controlActive;
      }
    };
    const armWindowFocusClear = () => {
      if (windowFocusClearArmed) {
        return;
      }
      windowFocusClearArmed = true;
      window.addEventListener("focus", handleWindowFocus);
    };
    const armNativeSelectClosePointer = () => {
      if (!options?.activateControlOnPointer || nativeSelectClosePointerArmed) {
        return;
      }
      nativeSelectClosePointerArmed = true;
      nativeSelectControlClickCloseAfter = Date.now() + 80;
      document.addEventListener("pointerdown", handleNativeSelectClosePointer);
      document.addEventListener("mousedown", handleNativeSelectClosePointer);
      document.addEventListener("click", handleNativeSelectClosePointer);
    };
    const markActiveVisual = () => {
      container.dataset.controlActive = "true";
      control.dataset.controlActive = "true";
      const group = getGroup();
      if (group) {
        group.dataset.controlActive = "true";
      }
      armWindowFocusClear();
      armNativeSelectClosePointer();
    };
    const markPointerFocus = (event: Event) => {
      if (event.currentTarget === container && !isInsideControl(event)) {
        if (document.activeElement === control) {
          control.blur();
        }
        clearActiveVisual();
      }
      options?.onPointerFocus?.();
      container.dataset.pointerFocus = "true";
      control.dataset.pointerFocus = "true";
      const group = getGroup();
      if (group) {
        group.dataset.pointerFocus = "true";
      }
      if (options?.activateControlOnPointer && event.currentTarget === control) {
        options.onControlPointerFocus?.();
        markActiveVisual();
      }
      if (focusGuardTimer !== null) {
        window.clearTimeout(focusGuardTimer);
      }
      focusGuardTimer = window.setTimeout(() => {
        focusGuardTimer = null;
        if (!container.contains(document.activeElement)) {
          clearPointerFocus();
        }
      }, 0);
    };
    const clearPointerFocus = () => {
      if (focusGuardTimer !== null) {
        window.clearTimeout(focusGuardTimer);
        focusGuardTimer = null;
      }
      delete container.dataset.pointerFocus;
      delete control.dataset.pointerFocus;
      clearActiveVisual();
      const group = getGroup();
      if (group) {
        delete group.dataset.pointerFocus;
      }
    };
    const clearActiveControl = () => {
      clearPointerFocus();
      if (document.activeElement === control) {
        control.blur();
      }
    };
    function handleWindowFocus() {
      window.removeEventListener("focus", handleWindowFocus);
      windowFocusClearArmed = false;
      window.setTimeout(() => {
        if (control.dataset.controlActive === "true") {
          clearActiveControl();
        }
      }, 0);
    }
    function handleNativeSelectClosePointer(event: Event) {
      if (isInsideControl(event)) {
        return;
      }
      if (control.dataset.controlActive === "true") {
        clearActiveControl();
      }
    }
    function handleNativeSelectControlClickClose() {
      if (!options?.activateControlOnPointer || Date.now() < nativeSelectControlClickCloseAfter) {
        return;
      }
      if (control.dataset.controlActive === "true") {
        clearActiveControl();
      }
    }
    container.addEventListener("pointerdown", markPointerFocus);
    container.addEventListener("mousedown", markPointerFocus);
    control.addEventListener("pointerdown", markPointerFocus);
    control.addEventListener("mousedown", markPointerFocus);
    control.addEventListener("click", handleNativeSelectControlClickClose);
    control.addEventListener("keydown", (event) => {
      if (options?.activateControlOnPointer && event.key === "Escape") {
        clearActiveControl();
      }
    });
    control.addEventListener("blur", clearPointerFocus);
  }

  private bindChromeBlur(container: HTMLElement, controls: HTMLElement[]): void {
    const handleChromePointer = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (controls.some((control) => control.contains(target))) {
        return;
      }
      for (const control of controls) {
        if (document.activeElement === control) {
          control.blur();
        }
      }
    };
    container.addEventListener("pointerdown", handleChromePointer);
    container.addEventListener("mousedown", handleChromePointer);
  }

  private bindControlActiveState(container: HTMLElement, controls: HTMLElement[]): void {
    const markActive = (event: Event) => {
      const target = event.currentTarget;
      container.dataset.controlActive = "true";
      for (const control of controls) {
        delete control.dataset.controlActive;
      }
      if (target instanceof HTMLElement) {
        target.dataset.controlActive = "true";
      }
    };
    const clearActive = () => {
      window.setTimeout(() => {
        if (controls.some((control) => document.activeElement === control)) {
          return;
        }
        delete container.dataset.controlActive;
        for (const control of controls) {
          delete control.dataset.controlActive;
        }
      }, 0);
    };
    for (const control of controls) {
      control.addEventListener("pointerdown", markActive);
      control.addEventListener("mousedown", markActive);
      control.addEventListener("focus", markActive);
      control.addEventListener("blur", clearActive);
    }
  }

  private suppressHoverUntilPointerMovement(container: HTMLElement, controls: HTMLElement[]): void {
    const clearSuppression = () => {
      delete container.dataset.hoverSuppressed;
      for (const control of controls) {
        delete control.dataset.hoverSuppressed;
      }
      document.removeEventListener("pointermove", clearSuppression);
      document.removeEventListener("mousemove", clearSuppression);
      document.removeEventListener("pointerdown", clearSuppression);
      document.removeEventListener("mousedown", clearSuppression);
    };
    container.dataset.hoverSuppressed = "true";
    for (const control of controls) {
      control.dataset.hoverSuppressed = "true";
    }
    document.addEventListener("pointermove", clearSuppression);
    document.addEventListener("mousemove", clearSuppression);
    document.addEventListener("pointerdown", clearSuppression);
    document.addEventListener("mousedown", clearSuppression);
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
    let pointerDrivenToggle = false;
    this.bindPointerFocusSuppression(label, input, {
      onPointerFocus: () => {
        pointerDrivenToggle = true;
      }
    });
    let saving = false;
    let savingChecked = checked;
    input.addEventListener("change", async () => {
      if (saving) {
        input.checked = savingChecked;
        return;
      }
      const nextChecked = input.checked;
      const previousChecked = !nextChecked;
      saving = true;
      savingChecked = nextChecked;
      label.dataset.controlState = nextChecked ? "on" : "off";
      label.dataset.controlSaving = "true";
      input.setAttribute("aria-busy", "true");
      const finishInlineUpdate = this.beginInlineControlUpdate();
      try {
        await onChange(nextChecked);
      } catch (error) {
        input.checked = previousChecked;
        savingChecked = previousChecked;
        label.dataset.controlState = previousChecked ? "on" : "off";
        this.markControlError(label);
        reportDiagnostic({
          severity: "warn",
          area: "storage",
          message: `${labelText} 保存失败，已回退`,
          detail: error
        });
      } finally {
        finishInlineUpdate();
        if (pointerDrivenToggle) {
          input.blur();
        }
        pointerDrivenToggle = false;
        saving = false;
        label.removeAttribute("data-control-saving");
        input.removeAttribute("aria-busy");
      }
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
    const wrapper = document.createElement("div");
    wrapper.className = "bsb-tm-field stacked";

    wrapper.append(this.createInputLabel(labelText, helpText));

    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    input.spellcheck = false;
    input.setAttribute("aria-label", labelText);
    this.bindChromeBlur(wrapper, [input]);
    let committedValue = value.trim();
    let commitInFlight = false;
    const commitValue = async (): Promise<void> => {
      const nextValue = input.value.trim();
      if (commitInFlight || nextValue === committedValue) {
        return;
      }
      commitInFlight = true;
      try {
        await onCommit(nextValue);
        committedValue = nextValue;
      } finally {
        commitInFlight = false;
      }
    };
    input.addEventListener("change", async () => {
      await commitValue();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.isComposing) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.suppressHoverUntilPointerMovement(wrapper, [input]);
      input.blur();
      void commitValue();
    });

    wrapper.append(input);
    return wrapper;
  }

  private createRegexPatternInput(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "bsb-tm-field stacked";

    wrapper.append(
      this.createInputLabel("动态关键词正则", "用于识别带货、促销或疑似广告措辞。保留默认值通常更稳。")
    );

    const input = document.createElement("input");
    input.type = "text";
    input.value = this.config.dynamicRegexPattern;
    input.spellcheck = false;
    input.setAttribute("aria-label", "动态关键词正则");
    this.bindChromeBlur(wrapper, [input]);
    if (this.filterValidationMessage) {
      input.setAttribute("aria-invalid", "true");
    }
    let commitInFlight = false;
    const commitPattern = async (): Promise<boolean> => {
      if (commitInFlight) {
        return false;
      }
      commitInFlight = true;
      const nextValue = input.value.trim();
      const validation = validateStoredPattern(nextValue);
      if (!validation.valid) {
        this.filterValidationMessage = validation.error ?? "正则格式无效";
        this.renderFilters();
        commitInFlight = false;
        return false;
      }

      this.filterValidationMessage = null;
      try {
        await this.callbacks.onPatchConfig({ dynamicRegexPattern: nextValue });
      } catch (_error) {
        this.filterValidationMessage = "正则保存失败";
        this.renderFilters();
        commitInFlight = false;
        return false;
      }
      commitInFlight = false;
      return true;
    };
    input.addEventListener("change", async () => {
      await commitPattern();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.isComposing) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      void commitPattern().then((committed) => {
        if (committed) {
          this.suppressHoverUntilPointerMovement(wrapper, [input]);
          input.blur();
        }
      });
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
    const wrapper = document.createElement("div");
    wrapper.className = "bsb-tm-field stacked";

    wrapper.append(this.createInputLabel(labelText, helpText));

    const select = document.createElement("select");
    select.setAttribute("aria-label", labelText);
    for (const [optionValue, optionLabel] of Object.entries(options) as [T, string][]) {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionLabel;
      option.selected = optionValue === value;
      select.appendChild(option);
    }
    let pointerDrivenSelection = false;
    this.bindPointerFocusSuppression(wrapper, select, {
      activateControlOnPointer: true,
      onControlPointerFocus: () => {
        pointerDrivenSelection = true;
      }
    });
    select.addEventListener("change", async () => {
      const finishInlineUpdate = this.beginInlineControlUpdate();
      try {
        await onCommit(select.value as T);
      } catch (error) {
        select.value = value;
        this.markControlError(wrapper);
        reportDiagnostic({
          severity: "warn",
          area: "storage",
          message: `${labelText} 保存失败，已回退`,
          detail: error
        });
      } finally {
        if (pointerDrivenSelection) {
          select.blur();
        }
        pointerDrivenSelection = false;
        finishInlineUpdate();
      }
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
    const wrapper = document.createElement("div");
    wrapper.className = "bsb-tm-field stacked";

    wrapper.append(this.createInputLabel(labelText, helpText));

    const input = document.createElement("input");
    input.type = "number";
    input.value = String(value);
    input.min = "0";
    input.step = "1";
    input.setAttribute("aria-label", labelText);
    this.bindChromeBlur(wrapper, [input]);
    let committedValue = input.value;
    let commitInFlight = false;
    const commitValue = async (): Promise<void> => {
      if (commitInFlight || input.value === committedValue) {
        return;
      }
      commitInFlight = true;
      try {
        await onCommit(Number(input.value));
        committedValue = input.value;
      } finally {
        commitInFlight = false;
      }
    };
    input.addEventListener("change", async () => {
      await commitValue();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.isComposing) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.suppressHoverUntilPointerMovement(wrapper, [input]);
      input.blur();
      void commitValue();
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
    return this.createDraftColorInput({
      label: CATEGORY_LABELS[category],
      value,
      fallbackValue: CATEGORY_COLORS[category],
      preview: {
        kind: "category",
        category,
        description: CATEGORY_DESCRIPTIONS[category]
      },
      onCommit: async (normalized) => {
        await this.callbacks.onPatchConfig({
          categoryColorOverrides: {
            ...this.config.categoryColorOverrides,
            [category]: normalized
          }
        });
      }
    });
  }

  private createCustomColorInput(
    labelText: string,
    helpText: string,
    value: string,
    onCommit: (value: string) => Promise<void>
  ): HTMLElement {
    const isLocation = labelText.includes("IP");
    const wrapper = document.createElement("div");
    wrapper.className = "bsb-tm-field stacked";
    wrapper.append(this.createInputLabel(labelText, helpText));
    wrapper.append(this.createDraftColorInput({
      label: isLocation ? "IP 属地" : "评论广告",
      value,
      fallbackValue: value,
      preview: {
        kind: "inline",
        text: isLocation ? "IP 属地" : "评论广告",
        tone: isLocation ? "info" : "danger",
        appearance: (isLocation ? this.config.labelTransparency.commentLocation : this.config.labelTransparency.commentBadge) ? "glass" : "solid",
        description: isLocation
          ? "评论区 IP 属地标签，用于显示评论 payload 自带属地信息。"
          : "评论广告标签，用于标出广告、带货或可疑促销评论。"
      },
      onCommit
    }, true));
    return wrapper;
  }

  private createDraftColorInput(
    options: {
      label: string;
      value: string;
      fallbackValue: string;
      preview: ColorPreviewSpec;
      onCommit: (value: string) => Promise<void>;
    },
    compact = false
  ): HTMLElement {
    let savedValue = normalizeHexColor(options.value) ?? normalizeHexColor(options.fallbackValue) ?? "#60a5fa";
    const field = document.createElement("div");
    field.className = "bsb-tm-color-field";
    field.dataset.colorEditor = "true";
    field.dataset.colorDirty = "false";
    if (compact) {
      field.classList.add("compact");
    }

    const preview = document.createElement("div");
    preview.className = "bsb-tm-color-preview-card";
    const previewBadgeSlot = document.createElement("span");
    previewBadgeSlot.className = "bsb-tm-color-preview-badge";
    const previewDescription = document.createElement("small");
    previewDescription.className = "bsb-tm-color-preview-description";
    previewDescription.textContent = options.preview.description;
    preview.append(previewBadgeSlot, previewDescription);

    const editorRow = document.createElement("div");
    editorRow.className = "bsb-tm-color-editor-row";
    const controls = document.createElement("div");
    controls.className = "bsb-tm-color-controls";

    const swatch = document.createElement("input");
    swatch.type = "color";
    swatch.value = savedValue;
    swatch.setAttribute("aria-label", `${options.label}颜色`);

    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.value = savedValue;
    textInput.spellcheck = false;
    textInput.setAttribute("aria-label", `${options.label}颜色值`);
    this.bindChromeBlur(field, [swatch, textInput]);
    this.bindControlActiveState(field, [swatch, textInput]);

    const actions = document.createElement("div");
    actions.className = "bsb-tm-color-actions";
    actions.hidden = true;
    const applyButton = document.createElement("button");
    applyButton.type = "button";
    applyButton.className = "bsb-tm-color-action primary";
    applyButton.textContent = "应用";
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "bsb-tm-color-action secondary";
    cancelButton.textContent = "取消";

    let draftValue = savedValue;
    let isCommitting = false;

    const renderPreview = (nextValue: string): void => {
      previewBadgeSlot.replaceChildren(this.createColorPreviewBadge(options.preview, nextValue));
    };

    const updatePreview = (nextValue: string, previewOptions?: { syncText?: boolean }): void => {
      draftValue = nextValue;
      swatch.value = nextValue;
      if (previewOptions?.syncText !== false) {
        textInput.value = nextValue;
      }
      renderPreview(nextValue);
    };

    const updateButtons = (): void => {
      const isDirty = draftValue !== savedValue;
      const isValid = normalizeHexColor(textInput.value) !== null;
      field.dataset.colorDirty = String(isDirty);
      actions.hidden = !isDirty;
      applyButton.disabled = isCommitting || !isDirty || !isValid;
      cancelButton.disabled = isCommitting || !isDirty;
    };

    const resetDraft = (): void => {
      updatePreview(savedValue);
      updateButtons();
    };

    const commitDraft = async (): Promise<void> => {
      const normalized = normalizeHexColor(textInput.value);
      if (!normalized || normalized === savedValue || isCommitting) {
        updateButtons();
        return;
      }

      isCommitting = true;
      updateButtons();
      try {
        await options.onCommit(normalized);
        savedValue = normalized;
        updatePreview(savedValue);
      } catch (error) {
        this.markControlError(field);
        reportDiagnostic({
          severity: "warn",
          area: "storage",
          message: `${options.label} 颜色保存失败，已保留草稿`,
          detail: error
        });
      } finally {
        isCommitting = false;
        updateButtons();
      }
    };

    swatch.addEventListener("input", () => {
      updatePreview(normalizeHexColor(swatch.value) ?? savedValue);
      updateButtons();
    });
    swatch.addEventListener("focus", () => {
      renderPreview(draftValue);
    });
    swatch.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        this.suppressHoverUntilPointerMovement(field, [swatch, textInput]);
        swatch.blur();
        void commitDraft();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        resetDraft();
      }
    });

    textInput.addEventListener("input", () => {
      const normalized = normalizeHexColor(textInput.value);
      if (normalized) {
        updatePreview(normalized, { syncText: false });
      }
      updateButtons();
    });
    textInput.addEventListener("focus", () => {
      renderPreview(draftValue);
    });
    textInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        this.suppressHoverUntilPointerMovement(field, [swatch, textInput]);
        textInput.blur();
        void commitDraft();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        resetDraft();
      }
    });

    applyButton.addEventListener("click", () => {
      void commitDraft();
    });
    cancelButton.addEventListener("click", resetDraft);

    renderPreview(savedValue);
    updateButtons();
    actions.append(applyButton, cancelButton);
    controls.append(swatch, textInput);
    editorRow.append(controls, actions);
    field.append(preview, editorRow);
    return field;
  }

  private markControlError(element: HTMLElement): void {
    element.dataset.controlError = "true";
    window.setTimeout(() => {
      delete element.dataset.controlError;
    }, 2200);
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
      this.close("user");
    });

    actions.append(helpButton, closeButton);
    header.append(titleWrap, actions);
    return header;
  }

  private createSection(name: PanelTab): HTMLElement {
    const section = document.createElement("section");
    section.className = "bsb-tm-panel-section";
    section.dataset.section = name;
    section.dataset.active = "false";
    section.id = `${this.panelId}-section-${name}`;
    section.setAttribute("aria-hidden", "true");
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

  private createColorPreviewBadge(spec: ColorPreviewSpec, color: string): HTMLElement {
    const normalized = normalizeHexColor(color);
    if (!normalized) {
      const fallback = document.createElement("span");
      fallback.className = "bsb-tm-color-preview-invalid";
      fallback.textContent = "颜色格式无效";
      return fallback;
    }

    if (spec.kind === "inline") {
      return createInlineBadge("data-bsb-color-preview-inline", spec.text, spec.tone, "inline", normalized, spec.appearance);
    }

    const overrides: CategoryColorOverrides = { [spec.category]: normalized };
    const style = resolveCategoryStyle(spec.category, overrides);
    const wrap = document.createElement("span");
    const pill = document.createElement("span");
    const label = document.createElement("span");
    const glassVariant = this.config.labelTransparency.titleBadge ? style.transparentVariant : "dark";

    wrap.className = "bsb-tm-title-pill-wrap bsb-tm-color-preview-title-wrap";
    wrap.dataset.category = spec.category;
    wrap.dataset.transparent = String(this.config.labelTransparency.titleBadge);
    wrap.dataset.glassContext = "surface";
    wrap.dataset.glassVariant = glassVariant;
    wrap.style.setProperty("--bsb-category-accent", style.accent);
    wrap.style.setProperty("--bsb-category-accent-strong", style.accentStrong);
    wrap.style.setProperty("--bsb-category-display-accent", style.transparentDisplayAccent);
    wrap.style.setProperty("--bsb-category-contrast", this.config.labelTransparency.titleBadge ? "#0f172a" : style.contrast);
    wrap.style.setProperty("--bsb-category-soft-surface", style.softSurface);
    wrap.style.setProperty("--bsb-category-soft-border", style.softBorder);
    wrap.style.setProperty("--bsb-category-glass-surface", style.glassSurface);
    wrap.style.setProperty("--bsb-category-glass-border", style.glassBorder);

    pill.className = "bsb-tm-title-pill bsb-tm-color-preview-title-pill";
    label.className = "bsb-tm-title-pill-label";
    label.textContent = CATEGORY_LABELS[spec.category];
    pill.append(createSponsorShieldIcon(), label);
    wrap.append(pill);
    return wrap;
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
