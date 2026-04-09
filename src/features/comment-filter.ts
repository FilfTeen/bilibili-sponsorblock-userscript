import type { Category, LocalVideoSignal, StoredConfig } from "../types";
import { ConfigStore } from "../core/config-store";
import { collectPatternMatches, isLikelyPromoText, regexFromStoredPattern } from "../utils/pattern";
import { analyzeCommercialIntent } from "../utils/commercial-intent";
import { debugLog } from "../utils/dom";
import { mutationsTouchSelectors } from "../utils/mutation";
import { observeUrlChanges } from "../utils/navigation";
import { supportsCommentFilters } from "../utils/page";
import {
  createInlineBadge,
  createInlineToggle,
  ensureInlineFeedbackStyles,
  setInlineToggleState,
  type InlineTone
} from "../ui/inline-feedback";

const THREAD_PROCESSED_ATTR = "data-bsb-comment-processed";
const REPLY_PROCESSED_ATTR = "data-bsb-comment-reply-processed";
const BADGE_ATTR = "data-bsb-comment-badge";
const TOGGLE_ATTR = "data-bsb-comment-toggle";
const LOCATION_ATTR = "data-bsb-comment-location";
const HIDDEN_ATTR = "data-bsb-comment-hidden";
const REPLIES_HIDDEN_ATTR = "data-bsb-comment-replies-hidden";
const LOCATION_STATE_ATTR = "data-bsb-comment-location-state";
const VUE_LOCATION_MARK_ATTR = "data-bsb-comment-location-settled";
const NO_LOCATION_MARK = "__empty__";
const ROOT_SWEEP_DELAYS_MS = [120, 240, 420, 760, 1200, 1800] as const;
export const VIDEO_SIGNAL_EVENT = "bsb:video-signal";
const COMMENT_RELEVANT_SELECTORS = [
  "bili-comments",
  "bili-comment-thread-renderer",
  "bili-comment-renderer",
  "bili-comment-reply-renderer",
  "bili-comment-replies-renderer",
  "bili-rich-text",
  ".browser-pc",
  ".reply-item",
  ".sub-reply-item",
  ".reply-time",
  ".sub-reply-time"
] as const;
const COMMENT_IGNORED_SELECTORS = [`[${BADGE_ATTR}]`, `[${TOGGLE_ATTR}]`, `[${LOCATION_ATTR}]`] as const;
const currentInlineBadgeAppearance = {
  commentBadge: false,
  commentLocation: false
};

type ReplyLocationPayload = {
  reply_control?: {
    location?: string | null;
  } | null;
} | null | undefined;

type CommentRenderer = HTMLElement & {
  shadowRoot: ShadowRoot;
  data?: ReplyLocationPayload & Record<string, unknown>;
};
type CommentSponsorMatch =
  | { reason: "goods"; category: "sponsor"; matches: [] }
  | { reason: "suspicion"; category: Extract<Category, "sponsor" | "selfpromo" | "exclusive_access">; matches: string[] };
type CommentTarget = {
  host: HTMLElement;
  renderer: CommentRenderer;
  processedAttr: string;
  thread: HTMLElement;
  kind: "comment" | "reply";
};

function getActionRendererNode(commentRenderer: CommentRenderer): HTMLElement | null {
  return (
    commentRenderer.shadowRoot?.querySelector<HTMLElement>("bili-comment-action-buttons-renderer") ??
    commentRenderer.shadowRoot?.querySelector<HTMLElement>("#main bili-comment-action-buttons-renderer") ??
    commentRenderer.shadowRoot?.querySelector<HTMLElement>("#footer bili-comment-action-buttons-renderer") ??
    null
  );
}

function getReplyRendererHost(replyHost: HTMLElement): CommentRenderer | null {
  const nestedRenderer = replyHost.shadowRoot?.querySelector("bili-comment-renderer");
  if (nestedRenderer instanceof HTMLElement && nestedRenderer.shadowRoot) {
    return nestedRenderer as CommentRenderer;
  }

  const replyRoot = replyHost.shadowRoot;
  if (!replyRoot) {
    return null;
  }

  const looksLikeFlatReplyRenderer = Boolean(
    replyRoot.querySelector("bili-comment-user-info") &&
      replyRoot.querySelector("bili-rich-text") &&
      getActionRendererNode(replyHost as CommentRenderer)
  );
  return looksLikeFlatReplyRenderer ? (replyHost as CommentRenderer) : null;
}

export function normalizeCommentLocationText(location: string | null | undefined): string | null {
  const value = String(location ?? "")
    .replace(/\s+/gu, " ")
    .trim();
  if (!value) {
    return null;
  }

  if (/^IP\s*属地/iu.test(value)) {
    return value.replace(/^IP\s*属地\s*[:：]?\s*/iu, "IP属地：");
  }

  return `IP属地：${value}`;
}

export function extractCommentLocation(reply: ReplyLocationPayload): string | null {
  return normalizeCommentLocationText(reply?.reply_control?.location ?? null);
}

const GOODS_STRUCTURAL_PATTERNS = {
  pricePattern: /[¥￥]\s*\d+(?:\.\d+)?/u,
  ecomDomains: /(?:jd\.com|taobao\.com|tmall\.com|pinduoduo\.com|pdd\.com|item\.m\.jd\.com)/iu,
  dataAttrKeywords: /goods|product|commodity|item/iu
};

export function hasSponsoredGoodsLink(commentRenderer: CommentRenderer): boolean {
  const richTextRoot = commentRenderer.shadowRoot?.querySelector("bili-rich-text")?.shadowRoot;
  if (!richTextRoot) {
    return false;
  }

  for (const link of richTextRoot.querySelectorAll<HTMLAnchorElement>("a")) {
    if (link.dataset.type === "goods" || link.getAttribute("data-type") === "goods") {
      return true;
    }

    const href = link.href || link.getAttribute("href") || "";
    if (href && GOODS_STRUCTURAL_PATTERNS.ecomDomains.test(href)) {
      return true;
    }

    const dataType = link.dataset.type || link.getAttribute("data-type") || link.dataset.jumpType || link.getAttribute("data-jump-type") || "";
    if (dataType && GOODS_STRUCTURAL_PATTERNS.dataAttrKeywords.test(dataType)) {
      return true;
    }

    if (GOODS_STRUCTURAL_PATTERNS.pricePattern.test(link.textContent || "")) {
      return true;
    }
  }

  return false;
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
      category: "sponsor",
      matches: []
    };
  }

  const pattern = regexFromStoredPattern(config.dynamicRegexPattern);
  const text = extractCommentText(commentRenderer);
  const storedMatches = pattern ? collectPatternMatches(text, pattern) : [];
  if (pattern && !isLikelyPromoText(text, storedMatches, config.dynamicRegexKeywordMinMatches)) {
    const assessment = analyzeCommercialIntent(text, {
      storedMatches,
      minMatches: config.dynamicRegexKeywordMinMatches
    });
    if (!assessment.category) {
      return null;
    }

    return {
      reason: "suspicion",
      category: assessment.category,
      matches: storedMatches.length > 0 ? storedMatches : assessment.matches
    };
  }

  const assessment = analyzeCommercialIntent(text, {
    storedMatches,
    minMatches: config.dynamicRegexKeywordMinMatches
  });
  if (!assessment.category) {
    return null;
  }

  return {
    reason: "suspicion",
    category: assessment.category,
    matches: storedMatches.length > 0 ? storedMatches : assessment.matches
  };
}

export function commentMatchToVideoSignal(match: CommentSponsorMatch): LocalVideoSignal {
  return {
    source: match.reason === "goods" ? "comment-goods" : "comment-suspicion",
    category: match.category,
    confidence:
      match.reason === "goods"
        ? 0.96
        : match.category === "sponsor"
          ? 0.87
          : match.category === "exclusive_access"
            ? 0.8
            : 0.79,
    reason:
      match.reason === "goods"
        ? "评论区命中商品卡广告"
        : `评论区命中商业线索：${match.matches.join(" / ")}`
  };
}

function getBadgeText(match: CommentSponsorMatch): string {
  if (match.reason === "goods") {
    return "评论区商品广告";
  }
  if (match.category === "selfpromo") {
    return `疑似导流评论: ${match.matches.join(" / ")}`;
  }
  if (match.category === "exclusive_access") {
    return `疑似抢先体验评论: ${match.matches.join(" / ")}`;
  }
  return `疑似广告评论: ${match.matches.join(" / ")}`;
}

function getBadgeTone(match: CommentSponsorMatch): InlineTone {
  if (match.reason === "goods" || match.category === "sponsor") {
    return "danger";
  }
  if (match.category === "exclusive_access") {
    return "info";
  }
  return "warning";
}

function dispatchVideoSignal(match: CommentSponsorMatch): void {
  const detail = {
    ...commentMatchToVideoSignal(match),
    matches: match.matches
  };

  window.dispatchEvent(
    new CustomEvent(VIDEO_SIGNAL_EVENT, {
      detail
    })
  );
}

function getBadgeRoot(commentRenderer: CommentRenderer): ShadowRoot | null {
  return commentRenderer.shadowRoot?.querySelector("bili-comment-user-info")?.shadowRoot ?? null;
}

function getActionRoot(commentRenderer: CommentRenderer): ShadowRoot | null {
  return getActionRendererNode(commentRenderer)?.shadowRoot ?? null;
}

export function scanCurrentPageCommentSignal(
  config: Pick<StoredConfig, "dynamicRegexPattern" | "dynamicRegexKeywordMinMatches">
): LocalVideoSignal | null {
  const host = document.querySelector("bili-comments");
  const root = host?.shadowRoot;
  if (!root) {
    return null;
  }

  for (const thread of root.querySelectorAll<HTMLElement>("bili-comment-thread-renderer")) {
    const mainRenderer = getMainCommentRenderer(thread);
    if (mainRenderer) {
      const match = classifyCommentRenderer(mainRenderer, config);
      if (match) {
        return commentMatchToVideoSignal(match);
      }
    }

    for (const replyTarget of getReplyTargets(thread)) {
      const match = classifyCommentRenderer(replyTarget.renderer, config);
      if (match) {
        return commentMatchToVideoSignal(match);
      }
    }
  }

  return null;
}

function createBadge(text: string, tone: InlineTone, color?: string): HTMLElement {
  return createInlineBadge(
    BADGE_ATTR,
    text,
    tone,
    "inline",
    color,
    currentInlineBadgeAppearance.commentBadge ? "glass" : "solid"
  );
}

function createToggleButton(onClick: () => void): HTMLButtonElement {
  const button = createInlineToggle(TOGGLE_ATTR, onClick, "inline");
  return button;
}

function createLocationBadge(text: string, color?: string): HTMLDivElement {
  return createInlineBadge(
    LOCATION_ATTR,
    text,
    "info",
    "inline",
    color,
    currentInlineBadgeAppearance.commentLocation ? "glass" : "solid"
  );
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
    const renderer = getReplyRendererHost(reply);
    if (!renderer) {
      continue;
    }

    targets.push({
      host: reply,
      renderer,
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
  return (
    commentRenderer.shadowRoot?.querySelector<HTMLElement>("#content") ??
    commentRenderer.shadowRoot?.querySelector<HTMLElement>(".reply-content") ??
    commentRenderer.shadowRoot?.querySelector<HTMLElement>("bili-rich-text") ??
    null
  );
}

function getActionAnchor(commentRenderer: CommentRenderer): HTMLElement | null {
  return getActionRoot(commentRenderer)?.querySelector<HTMLElement>("#reply") ?? getContentBody(commentRenderer);
}

function getLocationAnchor(commentRenderer: CommentRenderer): HTMLElement | null {
  return getActionRoot(commentRenderer)?.getElementById("pubdate") ?? getActionAnchor(commentRenderer);
}

function cleanupActionRootLocationNodes(actionRoot: ShadowRoot): void {
  actionRoot
    .querySelectorAll<HTMLElement>(`[${LOCATION_ATTR}='true'], #location, .reply-location`)
    .forEach((node) => node.remove());
}

export function resolveCommentRendererLocation(commentRenderer: CommentRenderer): string | null {
  const fromReplyData = extractCommentLocation(commentRenderer.data);
  if (fromReplyData) {
    return fromReplyData;
  }

  const actionRoot = getActionRoot(commentRenderer);
  const legacyText =
    actionRoot?.getElementById("location")?.textContent ??
    actionRoot?.querySelector<HTMLElement>(".reply-location")?.textContent ??
    null;
  return normalizeCommentLocationText(legacyText);
}

function injectCommentLocation(commentRenderer: CommentRenderer, color?: string): void {
  const actionRoot = getActionRoot(commentRenderer);
  const anchor = getLocationAnchor(commentRenderer);
  if (!actionRoot || !anchor) {
    return;
  }

  const text = resolveCommentRendererLocation(commentRenderer);
  const locationState = text ?? NO_LOCATION_MARK;
  if (commentRenderer.getAttribute(LOCATION_STATE_ATTR) === locationState) {
    return;
  }

  const existing = actionRoot.querySelector<HTMLElement>(`[${LOCATION_ATTR}='true']`);
  if (existing && existing.textContent?.trim() === text) {
    commentRenderer.setAttribute(LOCATION_STATE_ATTR, locationState);
    return;
  }

  cleanupActionRootLocationNodes(actionRoot);
  if (!text) {
    commentRenderer.setAttribute(LOCATION_STATE_ATTR, NO_LOCATION_MARK);
    return;
  }

  ensureInlineFeedbackStyles(actionRoot);
  insertAfter(anchor, createLocationBadge(text, color));
  commentRenderer.setAttribute(LOCATION_STATE_ATTR, text);
}

function extractVueReplyPayload(node: Element): ReplyLocationPayload {
  const component = Reflect.get(node, "__vueParentComponent") as
    | { props?: { reply?: ReplyLocationPayload; subReply?: ReplyLocationPayload } }
    | undefined;
  return component?.props?.reply ?? component?.props?.subReply ?? null;
}

export function resolveVueCommentLocation(node: Element): string | null {
  const fromReply = extractCommentLocation(extractVueReplyPayload(node));
  if (fromReply) {
    return fromReply;
  }

  const legacyText = node.parentElement?.querySelector<HTMLElement>(".reply-location")?.textContent ?? null;
  return normalizeCommentLocationText(legacyText);
}

function cleanupVueLocationNodes(scope: ParentNode = document): void {
  scope
    .querySelectorAll<HTMLElement>(`.reply-location, [${LOCATION_ATTR}='true']`)
    .forEach((node) => node.remove());
  scope
    .querySelectorAll<HTMLElement>(`[${VUE_LOCATION_MARK_ATTR}]`)
    .forEach((node) => node.removeAttribute(VUE_LOCATION_MARK_ATTR));
}

function injectVueCommentLocation(node: HTMLElement, color?: string): void {
  const text = resolveVueCommentLocation(node);
  const nextMarker = text ?? NO_LOCATION_MARK;
  const currentMarker = node.getAttribute(VUE_LOCATION_MARK_ATTR);
  if (currentMarker && currentMarker === nextMarker) {
    return;
  }

  const siblingLocations = Array.from(node.parentElement?.children ?? []).filter((child) => {
    if (!(child instanceof HTMLElement) || child === node) {
      return false;
    }
    return child.classList.contains("reply-location") || child.getAttribute(LOCATION_ATTR) === "true";
  });
  siblingLocations.forEach((child) => child.remove());

  if (!text) {
    node.setAttribute(VUE_LOCATION_MARK_ATTR, NO_LOCATION_MARK);
    return;
  }

  const badge = createLocationBadge(text, color);
  node.insertAdjacentElement("afterend", badge);
  node.setAttribute(VUE_LOCATION_MARK_ATTR, text);
}

function removeInjectedDecorations(commentRenderer: CommentRenderer): void {
  getBadgeRoot(commentRenderer)?.querySelectorAll<HTMLElement>(`[${BADGE_ATTR}='true']`).forEach((node) => node.remove());
  getActionRoot(commentRenderer)
    ?.querySelectorAll<HTMLElement>(`[${TOGGLE_ATTR}='true'], [${LOCATION_ATTR}='true'], #location, .reply-location`)
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
  content.setAttribute(HIDDEN_ATTR, String(hidden));
  toggle.setAttribute("data-bsb-comment-hidden", String(hidden));
  setInlineToggleState(toggle, hidden ? "hidden" : "shown", {
    hidden: "显示评论内容",
    shown: "再次隐藏评论"
  });
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
  private rootSweepTimerId: number | null = null;
  private rootSweepAttempt = 0;
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
    currentInlineBadgeAppearance.commentBadge = this.currentConfig.labelTransparency.commentBadge;
    currentInlineBadgeAppearance.commentLocation = this.currentConfig.labelTransparency.commentLocation;
    this.configStore.subscribe((config) => {
      this.currentConfig = config;
      currentInlineBadgeAppearance.commentBadge = config.labelTransparency.commentBadge;
      currentInlineBadgeAppearance.commentLocation = config.labelTransparency.commentLocation;
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
    this.scheduleRootSweep(true);

    this.stopObservingUrl = observeUrlChanges(() => {
      this.resetProcessedThreads();
      this.rootSweepAttempt = 0;
      this.scheduleRefresh();
      this.scheduleRootSweep(true);
    });

    this.documentObserver = new MutationObserver((records) => {
      if (!mutationsTouchSelectors(records, COMMENT_RELEVANT_SELECTORS, COMMENT_IGNORED_SELECTORS)) {
        return;
      }
      this.scheduleRefresh();
      this.scheduleRootSweep(true);
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
    if (this.rootSweepTimerId !== null) {
      window.clearTimeout(this.rootSweepTimerId);
      this.rootSweepTimerId = null;
    }
    if (this.refreshTimerId !== null) {
      window.clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
    this.documentObserver?.disconnect();
    this.documentObserver = null;
    this.disconnectRootObservers();
    this.pendingVisibleRefresh = false;
    this.rootSweepAttempt = 0;
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.resetProcessedThreads();
  }

  private scheduleRootSweep(force = false): void {
    if (!this.started) {
      return;
    }

    // Keep a short adaptive retry window for comment roots instead of a permanent
    // polling loop. Once roots appear, shadow-root observers take over.
    if (force) {
      this.rootSweepAttempt = 0;
      if (this.rootSweepTimerId !== null) {
        window.clearTimeout(this.rootSweepTimerId);
        this.rootSweepTimerId = null;
      }
    } else if (this.rootSweepTimerId !== null) {
      return;
    }

    const index = Math.min(this.rootSweepAttempt, ROOT_SWEEP_DELAYS_MS.length - 1);
    const delay = ROOT_SWEEP_DELAYS_MS[index];
    this.rootSweepTimerId = window.setTimeout(() => {
      this.rootSweepTimerId = null;
      if (!this.started || document.hidden) {
        this.pendingVisibleRefresh = true;
        return;
      }
      this.refresh();
      this.rootSweepAttempt += 1;
    }, delay);
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
      const schedule =
        typeof requestIdleCallback === "function"
          ? requestIdleCallback
          : (cb: () => void) => window.setTimeout(cb, 0);
      schedule(() => {
        this.refresh();
      });
    }, 160);
  }

  private refresh(): void {
    if (document.hidden) {
      this.pendingVisibleRefresh = true;
      return;
    }

    if (
      !this.currentConfig.enabled ||
      (this.currentConfig.commentFilterMode === "off" && !this.currentConfig.commentLocationEnabled) ||
      !supportsCommentFilters(window.location.href)
    ) {
      this.disconnectRootObservers();
      this.resetProcessedThreads();
      return;
    }

    const roots = Array.from(document.querySelectorAll<HTMLElement>("bili-comments"));
    if (roots.length === 0) {
      this.scheduleRootSweep();
    } else {
      this.rootSweepAttempt = 0;
      if (this.rootSweepTimerId !== null) {
        window.clearTimeout(this.rootSweepTimerId);
        this.rootSweepTimerId = null;
      }
    }
    this.syncRootObservers(roots);
    for (const root of roots) {
      try {
        this.scanCommentRoot(root);
      } catch (error) {
        debugLog("Failed to process comment root", error);
      }
    }
    this.processVueComments();
  }

  private syncRootObservers(roots: HTMLElement[]): void {
    const liveRoots = new Set(roots);
    const subRoots = new Set<HTMLElement>();

    // Collect all reply renderers that have shadow roots
    for (const root of roots) {
      const feedRoot = root.shadowRoot;
      if (!feedRoot) continue;
      
      feedRoot.querySelectorAll<HTMLElement>("bili-comment-thread-renderer").forEach(thread => {
        const repliesRenderer = thread.shadowRoot?.querySelector<HTMLElement>("bili-comment-replies-renderer");
        if (repliesRenderer?.shadowRoot) {
          subRoots.add(repliesRenderer);
        }
      });
    }

    const allTargetRoots = new Set([...liveRoots, ...subRoots]);

    for (const [root, observer] of this.rootObservers) {
      if (!allTargetRoots.has(root) || !document.contains(root)) {
        observer.disconnect();
        this.rootObservers.delete(root);
      }
    }

    for (const root of allTargetRoots) {
      if (this.rootObservers.has(root) || !root.shadowRoot) {
        continue;
      }

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
    if (this.currentConfig.commentLocationEnabled) {
      injectCommentLocation(target.renderer, this.currentConfig.commentIpColor);
    }

    if (target.host.getAttribute(target.processedAttr) === "true") {
      return;
    }

    const match = classifyCommentRenderer(target.renderer, this.currentConfig);
    if (!match) {
      return;
    }

    if (target.kind === "comment") {
      dispatchVideoSignal(match);
    }

    const badgeAnchor = getBadgeAnchor(target.renderer);
    if (!badgeAnchor) {
      return;
    }

    target.host.setAttribute(target.processedAttr, "true");
    const badgeRoot = getBadgeRoot(target.renderer);
    if (badgeRoot) {
      ensureInlineFeedbackStyles(badgeRoot);
    }

    const badge = createBadge(getBadgeText(match), getBadgeTone(match), this.currentConfig.commentAdColor);
    if (!insertAfter(badgeAnchor, badge)) {
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

    const actionRoot = getActionRoot(target.renderer);
    if (actionRoot) {
      ensureInlineFeedbackStyles(actionRoot);
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
    if (!insertAfter(actionAnchor, toggle)) {
      return;
    }

    if (target.kind === "comment" && this.currentConfig.commentHideReplies) {
      hideReplies(target.thread);
    }
  }

  private processVueComments(): void {
    if (!this.currentConfig.commentLocationEnabled) {
      cleanupVueLocationNodes(document);
      return;
    }

    const nodes = document.querySelectorAll<HTMLElement>(".browser-pc .reply-item .reply-time, .browser-pc .sub-reply-item .sub-reply-time");
    for (const node of nodes) {
      try {
        injectVueCommentLocation(node, this.currentConfig.commentIpColor);
      } catch (error) {
        debugLog("Failed to inject Vue comment location", error);
      }
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
        if (mainRenderer) {
          removeInjectedDecorations(mainRenderer);
          mainRenderer.removeAttribute(LOCATION_STATE_ATTR);
        }
        if (thread.getAttribute(THREAD_PROCESSED_ATTR) === "true" && mainRenderer) {
          thread.removeAttribute(THREAD_PROCESSED_ATTR);
          const content = getContentBody(mainRenderer);
          if (content) {
            content.style.display = "";
            content.removeAttribute(HIDDEN_ATTR);
          }
        }

        for (const replyTarget of getReplyTargets(thread)) {
          removeInjectedDecorations(replyTarget.renderer);
          replyTarget.renderer.removeAttribute(LOCATION_STATE_ATTR);
          if (replyTarget.host.getAttribute(REPLY_PROCESSED_ATTR) !== "true") {
            continue;
          }

          replyTarget.host.removeAttribute(REPLY_PROCESSED_ATTR);
          const content = getContentBody(replyTarget.renderer);
          if (content) {
            content.style.display = "";
            content.removeAttribute(HIDDEN_ATTR);
          }
        }

        restoreReplies(thread);
      }
    }
    cleanupVueLocationNodes(document);
    debugLog("Comment sponsor state reset");
  }
}
