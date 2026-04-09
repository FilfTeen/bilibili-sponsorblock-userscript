import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS } from "../constants";
import type { CategoryColorOverrides, SegmentRecord } from "../types";
import { cleanupVideoTitleAccessoryHost, ensureVideoTitleAccessoryHost } from "../utils/dom";
import { resolveCategoryStyle } from "../utils/color";
import { createCogIcon, createSponsorShieldIcon, createThumbIcon } from "./icons";

export type TitleBadgeVoteType = 0 | 1;
export type TitleBadgeVoteResult = "submitted" | "duplicate" | "error";

type TitleBadgeCallbacks = {
  onVote: (segment: SegmentRecord, type: TitleBadgeVoteType) => Promise<TitleBadgeVoteResult>;
  onLocalDecision: (segment: SegmentRecord, decision: "confirm" | "dismiss") => Promise<void>;
  onOpenSettings: () => void;
};

const DEFAULT_COPY =
  "整个视频都被社区标记为这一类内容。标签仅用于辅助判断，不应替代你自己的观看判断。";
const LABEL_ONLY_COPY = "这个标签来自整视频标签结果，但当前没有可直接反馈的投票记录。";
const LOCAL_SIGNAL_COPY = "这个标签来自本地页面线索，而不是 SponsorBlock 社区已收录的整视频记录。";
const LOCKED_COPY = "这条整视频标签的反馈已在本机提交。为避免重复投票，当前按钮已锁定。";

function resolveCopy(segment: SegmentRecord, votingAvailable: boolean): string {
  const base = CATEGORY_DESCRIPTIONS[segment.category] ?? DEFAULT_COPY;
  if (segment.UUID.startsWith("local-signal:")) {
    return `${base} ${LOCAL_SIGNAL_COPY}`;
  }
  if (!votingAvailable) {
    return `${base} ${LABEL_ONLY_COPY}`;
  }
  return base;
}

export class TitleBadge {
  private readonly root = document.createElement("span");
  private readonly pillButton = document.createElement("button");
  private readonly titleText = document.createElement("span");
  private readonly popover = document.createElement("div");
  private readonly description = document.createElement("p");
  private readonly actions = document.createElement("div");
  private readonly feedbackHint = document.createElement("p");
  private readonly upvoteButton = document.createElement("button");
  private readonly downvoteButton = document.createElement("button");
  private readonly settingsButton = document.createElement("button");
  private currentSegment: SegmentRecord | null = null;
  private mountedHost: HTMLElement | null = null;
  private isOpen = false;
  private closeTimer: number | null = null;
  private positionFrame: number | null = null;
  private categoryColorOverrides: CategoryColorOverrides = {};
  private transparencyEnabled = false;
  private votingAvailable = true;
  private localActionsAvailable = false;
  private voteLocked = false;

  private readonly handleDocumentPointerDown = (event: PointerEvent) => {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    if (this.root.contains(target) || this.popover.contains(target)) {
      return;
    }

    this.closePopover();
  };

  private readonly handleViewportChange = () => {
    if (this.isOpen) {
      this.schedulePopoverPosition();
    }
  };

  constructor(private readonly callbacks: TitleBadgeCallbacks) {
    this.root.className = "bsb-tm-title-pill-wrap";
    this.root.dataset.glassContext = "surface";
    this.root.hidden = true;

    this.pillButton.type = "button";
    this.pillButton.className = "bsb-tm-title-pill";
    this.pillButton.setAttribute("aria-expanded", "false");
    this.pillButton.append(createSponsorShieldIcon(), this.titleText);
    this.pillButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.isOpen ? this.closePopover() : this.openPopover();
    });

    this.popover.className = "bsb-tm-title-popover";
    this.popover.hidden = true;

    this.description.className = "bsb-tm-title-popover-copy";
    this.description.textContent = DEFAULT_COPY;

    this.actions.className = "bsb-tm-title-popover-actions";
    this.feedbackHint.className = "bsb-tm-title-popover-hint";
    this.feedbackHint.hidden = true;

    this.upvoteButton.type = "button";
    this.upvoteButton.className = "bsb-tm-pill-action positive";
    this.upvoteButton.append(createThumbIcon("up"), document.createTextNode("标记正确"));
    this.upvoteButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await this.handleVote(1);
    });

    this.downvoteButton.type = "button";
    this.downvoteButton.className = "bsb-tm-pill-action negative";
    this.downvoteButton.append(createThumbIcon("down"), document.createTextNode("标记有误"));
    this.downvoteButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await this.handleVote(0);
    });

    this.settingsButton.type = "button";
    this.settingsButton.className = "bsb-tm-pill-action subtle";
    this.settingsButton.append(createCogIcon(), document.createTextNode("设置"));
    this.settingsButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.callbacks.onOpenSettings();
      this.closePopover();
    });

    this.actions.append(this.upvoteButton, this.downvoteButton, this.settingsButton);
    this.popover.append(this.description, this.actions, this.feedbackHint);
    this.root.append(this.pillButton);
  }

  setColorOverrides(overrides: CategoryColorOverrides): void {
    this.categoryColorOverrides = { ...overrides };
    if (this.currentSegment) {
      this.applyAppearance(this.currentSegment);
    }
  }

  setTransparencyEnabled(enabled: boolean): void {
    this.transparencyEnabled = enabled;
    this.root.dataset.transparent = String(enabled);
    if (this.currentSegment) {
      this.applyAppearance(this.currentSegment);
    }
  }

  setSegment(segment: SegmentRecord | null, options?: { voteLocked?: boolean }): void {
    this.currentSegment = segment;
    this.voteLocked = options?.voteLocked ?? false;
    if (!segment) {
      this.closePopover();
      this.root.hidden = true;
      return;
    }

    this.ensureMounted();
    this.ensurePopoverMounted();
    this.root.hidden = false;
    this.applyAppearance(segment);
  }

  clear(): void {
    this.setSegment(null);
  }

  destroy(): void {
    this.clear();
    this.detachPopoverListeners();
    if (this.closeTimer !== null) {
      window.clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    if (this.positionFrame !== null) {
      window.cancelAnimationFrame(this.positionFrame);
      this.positionFrame = null;
    }
    const host = this.root.parentElement as HTMLElement | null;
    this.root.remove();
    cleanupVideoTitleAccessoryHost(host);
    this.popover.remove();
    this.mountedHost = null;
  }

  private applyAppearance(segment: SegmentRecord): void {
    const style = resolveCategoryStyle(segment.category, this.categoryColorOverrides);
    const glassVariant = this.transparencyEnabled ? style.transparentVariant : "dark";
    const transparentContrast = "#0f172a";
    const transparentSurface = style.glassSurface;
    this.votingAvailable =
      segment.actionType === "full" &&
      segment.UUID.length > 0 &&
      !segment.UUID.startsWith("video-label:") &&
      !segment.UUID.startsWith("local-signal:");
    this.localActionsAvailable = segment.UUID.startsWith("local-signal:");

    this.root.dataset.category = segment.category;
    this.root.dataset.transparent = String(this.transparencyEnabled);
    this.root.dataset.glassContext = "surface";
    this.root.dataset.glassVariant = glassVariant;
    this.root.style.setProperty("--bsb-category-accent", style.accent);
    this.root.style.setProperty("--bsb-category-accent-strong", style.accentStrong);
    this.root.style.setProperty("--bsb-category-display-accent", style.transparentDisplayAccent);
    this.root.style.setProperty(
      "--bsb-category-contrast",
      this.transparencyEnabled ? transparentContrast : style.contrast
    );
    this.root.style.setProperty("--bsb-category-soft-surface", style.softSurface);
    this.root.style.setProperty("--bsb-category-soft-border", style.softBorder);
    this.root.style.setProperty("--bsb-category-glass-surface", this.transparencyEnabled ? transparentSurface : style.glassSurface);
    this.root.style.setProperty("--bsb-category-glass-border", style.glassBorder);
    this.titleText.textContent = CATEGORY_LABELS[segment.category];
    this.description.textContent = resolveCopy(segment, this.votingAvailable);
    this.upvoteButton.disabled = !this.localActionsAvailable && (!this.votingAvailable || this.voteLocked);
    this.downvoteButton.disabled = !this.localActionsAvailable && (!this.votingAvailable || this.voteLocked);
    this.upvoteButton.hidden = false;
    this.downvoteButton.hidden = false;
    this.upvoteButton.title = this.votingAvailable
      ? this.voteLocked
        ? "这条整视频标签的反馈已提交"
        : "把这条整视频标签标记为正确"
      : this.localActionsAvailable
        ? "把这条本地标签记为可信，并在后续继续保留"
        : "当前没有可直接反馈的 SponsorBlock 投票记录";
    this.downvoteButton.title = this.votingAvailable
      ? this.voteLocked
        ? "这条整视频标签的反馈已提交"
        : "把这条整视频标签标记为有误"
      : this.localActionsAvailable
        ? "忽略这条本地标签，并停止继续提示当前视频"
        : "当前没有可直接反馈的 SponsorBlock 投票记录";
    this.upvoteButton.lastChild && (this.upvoteButton.lastChild.textContent = this.votingAvailable ? "标记正确" : this.localActionsAvailable ? "保留本地标签" : "标记正确");
    this.downvoteButton.lastChild && (this.downvoteButton.lastChild.textContent = this.votingAvailable ? "标记有误" : this.localActionsAvailable ? "忽略此视频" : "标记有误");
    this.feedbackHint.hidden = this.votingAvailable && !this.localActionsAvailable && !this.voteLocked;
    this.feedbackHint.textContent = this.localActionsAvailable
      ? "这条提示来自本地评论或页面线索。你可以保留它，也可以忽略并阻止当前视频继续触发本地提示。"
      : this.voteLocked
        ? LOCKED_COPY
      : "这条标签目前只有整视频标签结果，没有可直接投票的 SponsorBlock UUID。";
    this.actions.classList.toggle("vote-unavailable", !this.votingAvailable);
    this.pillButton.setAttribute(
      "aria-label",
      this.votingAvailable
        ? this.voteLocked
          ? `${CATEGORY_LABELS[segment.category]}，点击查看说明，反馈已提交`
          : `${CATEGORY_LABELS[segment.category]}，点击查看说明和反馈按钮`
        : this.localActionsAvailable
          ? `${CATEGORY_LABELS[segment.category]}，点击查看本地学习按钮`
          : `${CATEGORY_LABELS[segment.category]}，点击查看说明和不可用反馈按钮`
    );
  }

  private ensureMounted(): void {
    const host = ensureVideoTitleAccessoryHost();
    if (!host) {
      return;
    }

    if (this.mountedHost !== host || this.root.parentElement !== host) {
      host.append(this.root);
      this.mountedHost = host;
    }
  }

  private ensurePopoverMounted(): void {
    if (!this.popover.isConnected) {
      document.body.appendChild(this.popover);
    }
  }

  private openPopover(): void {
    if (!this.currentSegment) {
      return;
    }

    if (this.closeTimer !== null) {
      window.clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }

    this.ensureMounted();
    this.ensurePopoverMounted();
    this.isOpen = true;
    this.pillButton.setAttribute("aria-expanded", "true");
    this.popover.hidden = false;
    this.schedulePopoverPosition();
    requestAnimationFrame(() => {
      this.popover.classList.add("open");
    });
    this.attachPopoverListeners();
  }

  private closePopover(): void {
    this.isOpen = false;
    this.pillButton.setAttribute("aria-expanded", "false");
    this.popover.classList.remove("open");
    this.detachPopoverListeners();

    if (this.closeTimer !== null) {
      window.clearTimeout(this.closeTimer);
    }
    this.closeTimer = window.setTimeout(() => {
      if (!this.isOpen) {
        this.popover.hidden = true;
      }
    }, 160);
  }

  private positionPopover(): void {
    this.positionFrame = null;
    const viewport = window.visualViewport;
    const viewportWidth = Math.max(320, Math.floor(viewport?.width ?? window.innerWidth));
    const viewportHeight = Math.max(240, Math.floor(viewport?.height ?? window.innerHeight));
    const viewportLeft = Math.floor(viewport?.offsetLeft ?? 0);
    const viewportTop = Math.floor(viewport?.offsetTop ?? 0);
    const maxWidth = Math.min(348, viewportWidth - 24);

    this.popover.style.maxWidth = `${maxWidth}px`;
    this.popover.style.width = `${maxWidth}px`;

    const triggerRect = this.pillButton.getBoundingClientRect();
    const popoverRect = this.popover.getBoundingClientRect();

    let left = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2;
    left = Math.max(12, Math.min(left, viewportWidth - popoverRect.width - 12));

    let top = triggerRect.bottom + 12;
    let placement: "top" | "bottom" = "bottom";
    if (top + popoverRect.height > viewportHeight - 12 && triggerRect.top - popoverRect.height - 12 >= 12) {
      top = triggerRect.top - popoverRect.height - 12;
      placement = "top";
    }

    this.popover.dataset.placement = placement;
    this.popover.style.left = `${viewportLeft + Math.round(left)}px`;
    this.popover.style.top = `${viewportTop + Math.round(top)}px`;
  }

  private schedulePopoverPosition(): void {
    if (!this.isOpen || this.positionFrame !== null) {
      return;
    }

    this.positionFrame = window.requestAnimationFrame(() => {
      if (!this.isOpen) {
        this.positionFrame = null;
        return;
      }

      this.positionPopover();
    });
  }

  private attachPopoverListeners(): void {
    document.addEventListener("pointerdown", this.handleDocumentPointerDown);
    window.addEventListener("resize", this.handleViewportChange);
    window.addEventListener("scroll", this.handleViewportChange, true);
    window.visualViewport?.addEventListener("resize", this.handleViewportChange);
    window.visualViewport?.addEventListener("scroll", this.handleViewportChange);
  }

  private detachPopoverListeners(): void {
    document.removeEventListener("pointerdown", this.handleDocumentPointerDown);
    window.removeEventListener("resize", this.handleViewportChange);
    window.removeEventListener("scroll", this.handleViewportChange, true);
    window.visualViewport?.removeEventListener("resize", this.handleViewportChange);
    window.visualViewport?.removeEventListener("scroll", this.handleViewportChange);
  }

  private async handleVote(type: TitleBadgeVoteType): Promise<void> {
    if (!this.currentSegment || (this.voteLocked && this.votingAvailable)) {
      return;
    }

    this.setBusy(true);
    try {
      if (this.votingAvailable) {
        const result = await this.callbacks.onVote(this.currentSegment, type);
        if (result !== "error") {
          this.voteLocked = true;
          this.applyAppearance(this.currentSegment);
        }
      } else if (this.localActionsAvailable) {
        await this.callbacks.onLocalDecision(this.currentSegment, type === 1 ? "confirm" : "dismiss");
      } else {
        return;
      }
      this.closePopover();
    } finally {
      this.setBusy(false);
    }
  }

  private setBusy(busy: boolean): void {
    for (const button of [this.upvoteButton, this.downvoteButton, this.settingsButton]) {
      if (button === this.upvoteButton || button === this.downvoteButton) {
        button.disabled = busy || (this.localActionsAvailable ? false : !this.votingAvailable || this.voteLocked);
      } else {
        button.disabled = busy;
      }
    }
    this.root.classList.toggle("is-busy", busy);
  }
}
