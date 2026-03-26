import type { StoredConfig } from "../types";
import { ConfigStore } from "../core/config-store";
import { collectPatternMatches, isLikelyPromoText, regexFromStoredPattern } from "../utils/pattern";
import { debugLog } from "../utils/dom";
import { mutationsTouchSelectors } from "../utils/mutation";
import { observeUrlChanges } from "../utils/navigation";
import { supportsCommentFilters } from "../utils/page";

const THREAD_PROCESSED_ATTR = "data-bsb-comment-processed";
const REPLY_PROCESSED_ATTR = "data-bsb-comment-reply-processed";
const BADGE_ATTR = "data-bsb-comment-badge";
const TOGGLE_ATTR = "data-bsb-comment-toggle";
const HIDDEN_ATTR = "data-bsb-comment-hidden";
const REPLIES_HIDDEN_ATTR = "data-bsb-comment-replies-hidden";
const ROOT_REFRESH_INTERVAL_MS = 900;
const COMMENT_RELEVANT_SELECTORS = [
  "bili-comments",
  "bili-comment-thread-renderer",
  "bili-comment-renderer",
  "bili-comment-reply-renderer",
  "bili-comment-replies-renderer",
  "bili-rich-text"
] as const;
const COMMENT_IGNORED_SELECTORS = [`[${BADGE_ATTR}]`, `[${TOGGLE_ATTR}]`] as const;

type CommentRenderer = HTMLElement & { shadowRoot: ShadowRoot };
type CommentSponsorMatch =
  | { reason: "goods"; matches: [] }
  | { reason: "suspicion"; matches: string[] };
type CommentTarget = {
  host: HTMLElement;
  renderer: CommentRenderer;
  processedAttr: string;
  thread: HTMLElement;
  kind: "comment" | "reply";
};

export function hasSponsoredGoodsLink(commentRenderer: CommentRenderer): boolean {
  const links = commentRenderer.shadowRoot
    ?.querySelector("bili-rich-text")
    ?.shadowRoot?.querySelectorAll<HTMLAnchorElement>("a[data-type='goods']");
  return Boolean(links && links.length > 0);
}

export function extractCommentText(commentRenderer: CommentRenderer): string {
  const richTextNodes = [
    ...(commentRenderer.shadowRoot?.querySelector("bili-rich-text")?.shadowRoot?.querySelectorAll("span, a") ?? [])
  ];
  const nodes = [
    ...richTextNodes,
    ...(commentRenderer.shadowRoot?.querySelectorAll("#content, .reply-content") ?? [])
  ];
  return nodes
    .map((node) => node.textContent?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
}

export function classifyCommentRenderer(
  commentRenderer: CommentRenderer,
  config: Pick<StoredConfig, "dynamicRegexPattern" | "dynamicRegexKeywordMinMatches">
): CommentSponsorMatch | null {
  if (hasSponsoredGoodsLink(commentRenderer)) {
    return {
      reason: "goods",
      matches: []
    };
  }

  const pattern = regexFromStoredPattern(config.dynamicRegexPattern);
  if (!pattern) {
    return null;
  }

  const text = extractCommentText(commentRenderer);
  const matches = collectPatternMatches(text, pattern);
  if (!isLikelyPromoText(text, matches, config.dynamicRegexKeywordMinMatches)) {
    return null;
  }

  return {
    reason: "suspicion",
    matches
  };
}

function getBadgeText(match: CommentSponsorMatch): string {
  return match.reason === "goods" ? "评论区商品广告" : `疑似广告评论: ${match.matches.join(" / ")}`;
}

function createBadge(text: string): HTMLElement {
  const badge = document.createElement("div");
  badge.setAttribute(BADGE_ATTR, "true");
  badge.style.cssText =
    "display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;background:rgba(255,102,153,.15);border:1px solid rgba(255,102,153,.28);color:#c2185b;font:600 11px/1.2 'SF Pro Text','PingFang SC',sans-serif;";
  badge.textContent = text;
  return badge;
}

function createToggleButton(onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute(TOGGLE_ATTR, "true");
  button.style.cssText =
    "margin-left:8px;border:0;border-radius:999px;padding:6px 10px;background:rgba(15,23,42,.08);color:#0f172a;font:600 12px/1.2 'SF Pro Text','PingFang SC',sans-serif;cursor:pointer;";
  button.textContent = "显示评论内容";
  button.addEventListener("click", onClick);
  return button;
}

function getMainCommentRenderer(thread: HTMLElement): CommentRenderer | null {
  const renderer = thread.shadowRoot?.querySelector("bili-comment-renderer");
  return renderer instanceof HTMLElement && renderer.shadowRoot ? (renderer as CommentRenderer) : null;
}

function getReplyTargets(thread: HTMLElement): CommentTarget[] {
  const repliesRenderer = thread.shadowRoot?.querySelector("bili-comment-replies-renderer");
  const repliesRoot = repliesRenderer?.shadowRoot;
  if (!repliesRoot) {
    return [];
  }

  const targets: CommentTarget[] = [];
  for (const reply of repliesRoot.querySelectorAll<HTMLElement>("bili-comment-reply-renderer")) {
    const renderer = reply.shadowRoot?.querySelector("bili-comment-renderer");
    if (!(renderer instanceof HTMLElement) || !renderer.shadowRoot) {
      continue;
    }

    targets.push({
      host: reply,
      renderer: renderer as CommentRenderer,
      processedAttr: REPLY_PROCESSED_ATTR,
      thread,
      kind: "reply"
    });
  }
  return targets;
}

function getBadgeAnchor(commentRenderer: CommentRenderer): HTMLElement | null {
  const userInfo = commentRenderer.shadowRoot?.querySelector("bili-comment-user-info");
  const infoRoot = userInfo?.shadowRoot;
  return infoRoot?.querySelector<HTMLElement>("#user-up") ?? infoRoot?.querySelector<HTMLElement>("#user-level") ?? null;
}

function getContentBody(commentRenderer: CommentRenderer): HTMLElement | null {
  return commentRenderer.shadowRoot?.querySelector<HTMLElement>("#content") ?? null;
}

function getActionAnchor(commentRenderer: CommentRenderer): HTMLElement | null {
  const actionRenderer = commentRenderer.shadowRoot
    ?.querySelector("#main")
    ?.querySelector("bili-comment-action-buttons-renderer");
  return actionRenderer?.shadowRoot?.querySelector<HTMLElement>("#reply") ?? getContentBody(commentRenderer);
}

function removeInjectedDecorations(commentRenderer: CommentRenderer): void {
  commentRenderer.shadowRoot
    ?.querySelector("bili-comment-user-info")
    ?.shadowRoot?.querySelectorAll<HTMLElement>(`[${BADGE_ATTR}='true']`)
    .forEach((node) => node.remove());
  commentRenderer.shadowRoot
    ?.querySelector("#main")
    ?.querySelector("bili-comment-action-buttons-renderer")
    ?.shadowRoot?.querySelectorAll<HTMLElement>(`[${TOGGLE_ATTR}='true']`)
    .forEach((node) => node.remove());
}

function insertAfter(anchor: Node, node: Node): boolean {
  const parent = anchor.parentNode;
  if (!parent) {
    return false;
  }

  parent.insertBefore(node, anchor.nextSibling);
  return true;
}

function setCommentHidden(content: HTMLElement, toggle: HTMLButtonElement, hidden: boolean): void {
  content.style.display = hidden ? "none" : "";
  toggle.textContent = hidden ? "显示评论内容" : "隐藏评论内容";
}

function hideReplies(thread: HTMLElement): void {
  const repliesRenderer = thread.shadowRoot?.querySelector("bili-comment-replies-renderer");
  const repliesRoot = repliesRenderer?.shadowRoot;
  if (!repliesRoot) {
    return;
  }

  repliesRoot.querySelectorAll<HTMLElement>("bili-comment-reply-renderer").forEach((reply) => {
    reply.style.display = "none";
    reply.setAttribute(REPLIES_HIDDEN_ATTR, "true");
  });
}

function restoreReplies(thread: HTMLElement): void {
  const repliesRenderer = thread.shadowRoot?.querySelector("bili-comment-replies-renderer");
  const repliesRoot = repliesRenderer?.shadowRoot;
  if (!repliesRoot) {
    return;
  }

  repliesRoot.querySelectorAll<HTMLElement>(`bili-comment-reply-renderer[${REPLIES_HIDDEN_ATTR}='true']`).forEach((reply) => {
    reply.style.display = "";
    reply.removeAttribute(REPLIES_HIDDEN_ATTR);
  });
}

export class CommentSponsorController {
  private started = false;
  private currentConfig: StoredConfig;
  private rootSweepIntervalId: number | null = null;
  private documentObserver: MutationObserver | null = null;
  private refreshTimerId: number | null = null;
  private stopObservingUrl: (() => void) | null = null;
  private readonly rootObservers = new Map<HTMLElement, MutationObserver>();
  private pendingVisibleRefresh = false;
  private readonly handleVisibilityChange = () => {
    if (!document.hidden && this.pendingVisibleRefresh) {
      this.pendingVisibleRefresh = false;
      this.scheduleRefresh();
    }
  };

  constructor(private readonly configStore: ConfigStore) {
    this.currentConfig = this.configStore.getSnapshot();
    this.configStore.subscribe((config) => {
      this.currentConfig = config;
      this.resetProcessedThreads();
      this.scheduleRefresh();
    });
  }

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.scheduleRefresh();

    this.stopObservingUrl = observeUrlChanges(() => {
      this.resetProcessedThreads();
      this.scheduleRefresh();
    });

    this.rootSweepIntervalId = window.setInterval(() => {
      if (document.hidden) {
        this.pendingVisibleRefresh = true;
        return;
      }
      this.refresh();
    }, ROOT_REFRESH_INTERVAL_MS);

    this.documentObserver = new MutationObserver((records) => {
      if (!mutationsTouchSelectors(records, COMMENT_RELEVANT_SELECTORS, COMMENT_IGNORED_SELECTORS)) {
        return;
      }
      this.scheduleRefresh();
    });
    this.documentObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    window.addEventListener(
      "pagehide",
      () => {
        this.stop();
      },
      { once: true }
    );
  }

  stop(): void {
    if (!this.started) {
      return;
    }

    this.started = false;
    if (this.stopObservingUrl) {
      this.stopObservingUrl();
      this.stopObservingUrl = null;
    }
    if (this.rootSweepIntervalId !== null) {
      window.clearInterval(this.rootSweepIntervalId);
      this.rootSweepIntervalId = null;
    }
    if (this.refreshTimerId !== null) {
      window.clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
    this.documentObserver?.disconnect();
    this.documentObserver = null;
    this.disconnectRootObservers();
    this.pendingVisibleRefresh = false;
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.resetProcessedThreads();
  }

  private scheduleRefresh(): void {
    if (document.hidden) {
      this.pendingVisibleRefresh = true;
      return;
    }

    if (this.refreshTimerId !== null) {
      return;
    }

    this.refreshTimerId = window.setTimeout(() => {
      this.refreshTimerId = null;
      this.refresh();
    }, 160);
  }

  private refresh(): void {
    if (document.hidden) {
      this.pendingVisibleRefresh = true;
      return;
    }

    if (
      !this.currentConfig.enabled ||
      this.currentConfig.commentFilterMode === "off" ||
      !supportsCommentFilters(window.location.href)
    ) {
      this.disconnectRootObservers();
      this.resetProcessedThreads();
      return;
    }

    const roots = Array.from(document.querySelectorAll<HTMLElement>("bili-comments"));
    this.syncRootObservers(roots);
    for (const root of roots) {
      try {
        this.scanCommentRoot(root);
      } catch (error) {
        debugLog("Failed to process comment root", error);
      }
    }
  }

  private syncRootObservers(roots: HTMLElement[]): void {
    const liveRoots = new Set(roots);
    for (const [root, observer] of this.rootObservers) {
      if (!liveRoots.has(root) || !document.contains(root)) {
        observer.disconnect();
        this.rootObservers.delete(root);
      }
    }

    for (const root of roots) {
      if (this.rootObservers.has(root) || !root.shadowRoot) {
        continue;
      }

      // Comment threads often render entirely inside nested shadow roots, so
      // document-level observers miss the follow-up mutations after the host appears.
      const observer = new MutationObserver((records) => {
        if (!mutationsTouchSelectors(records, COMMENT_RELEVANT_SELECTORS, COMMENT_IGNORED_SELECTORS)) {
          return;
        }
        this.scheduleRefresh();
      });
      observer.observe(root.shadowRoot, {
        childList: true,
        subtree: true
      });
      this.rootObservers.set(root, observer);
    }
  }

  private disconnectRootObservers(): void {
    for (const observer of this.rootObservers.values()) {
      observer.disconnect();
    }
    this.rootObservers.clear();
  }

  private scanCommentRoot(root: HTMLElement): void {
    const feedRoot = root.shadowRoot;
    if (!feedRoot) {
      return;
    }

    for (const thread of feedRoot.querySelectorAll<HTMLElement>("bili-comment-thread-renderer")) {
      const mainRenderer = getMainCommentRenderer(thread);
      if (mainRenderer) {
        this.processTarget({
          host: thread,
          renderer: mainRenderer,
          processedAttr: THREAD_PROCESSED_ATTR,
          thread,
          kind: "comment"
        });
      }

      for (const replyTarget of getReplyTargets(thread)) {
        this.processTarget(replyTarget);
      }
    }
  }

  private processTarget(target: CommentTarget): void {
    if (target.host.getAttribute(target.processedAttr) === "true") {
      return;
    }

    const match = classifyCommentRenderer(target.renderer, this.currentConfig);
    if (!match) {
      return;
    }

    const badgeAnchor = getBadgeAnchor(target.renderer);
    if (!badgeAnchor) {
      return;
    }

    target.host.setAttribute(target.processedAttr, "true");
    if (!insertAfter(badgeAnchor, createBadge(getBadgeText(match)))) {
      target.host.removeAttribute(target.processedAttr);
      return;
    }

    if (this.currentConfig.commentFilterMode !== "hide") {
      return;
    }

    const content = getContentBody(target.renderer);
    const actionAnchor = getActionAnchor(target.renderer);
    if (!content || !actionAnchor) {
      return;
    }

    const toggle = createToggleButton(() => {
      const hidden = content.style.display === "none";
      setCommentHidden(content, toggle, !hidden);
      if (target.kind === "comment" && this.currentConfig.commentHideReplies) {
        if (hidden) {
          restoreReplies(target.thread);
        } else {
          hideReplies(target.thread);
        }
      }
    });
    setCommentHidden(content, toggle, true);
    content.setAttribute(HIDDEN_ATTR, "true");
    if (!insertAfter(actionAnchor, toggle)) {
      return;
    }

    if (target.kind === "comment" && this.currentConfig.commentHideReplies) {
      hideReplies(target.thread);
    }
  }

  private resetProcessedThreads(): void {
    for (const root of document.querySelectorAll<HTMLElement>("bili-comments")) {
      const feedRoot = root.shadowRoot;
      if (!feedRoot) {
        continue;
      }

      for (const thread of feedRoot.querySelectorAll<HTMLElement>("bili-comment-thread-renderer")) {
        const mainRenderer = getMainCommentRenderer(thread);
        if (thread.getAttribute(THREAD_PROCESSED_ATTR) === "true" && mainRenderer) {
          thread.removeAttribute(THREAD_PROCESSED_ATTR);
          removeInjectedDecorations(mainRenderer);
          const content = getContentBody(mainRenderer);
          if (content) {
            content.style.display = "";
            content.removeAttribute(HIDDEN_ATTR);
          }
        }

        for (const replyTarget of getReplyTargets(thread)) {
          if (replyTarget.host.getAttribute(REPLY_PROCESSED_ATTR) !== "true") {
            continue;
          }

          replyTarget.host.removeAttribute(REPLY_PROCESSED_ATTR);
          removeInjectedDecorations(replyTarget.renderer);
          const content = getContentBody(replyTarget.renderer);
          if (content) {
            content.style.display = "";
            content.removeAttribute(HIDDEN_ATTR);
          }
        }

        restoreReplies(thread);
      }
    }
    debugLog("Comment sponsor state reset");
  }
}
