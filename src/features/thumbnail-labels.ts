import { CATEGORY_LABELS, CATEGORY_SHORT_LABELS } from "../constants";
import { ConfigStore } from "../core/config-store";
import { PersistentCache } from "../core/cache";
import { LocalVideoLabelStore } from "../core/local-label-store";
import { normalizeSegments } from "../core/segment-filter";
import { resolveWholeVideoCategory } from "../core/whole-video-label";
import { SponsorBlockClient } from "../api/sponsorblock-client";
import { observeUrlChanges } from "../utils/navigation";
import { detectPageType } from "../utils/page";
import { extractBvidFromUrl } from "../utils/video-context";
import { isBvid } from "../utils/bvid";
import { mutationsTouchSelectors } from "../utils/mutation";
import { debugLog } from "../utils/dom";
import type { Category, PageType, StoredConfig, SponsorTime, VideoContext } from "../types";
import type { FetchResponse } from "../types";
import { VideoLabelClient } from "../api/video-label-client";
import { resolveCategoryStyle } from "../utils/color";

const PROCESSED_ATTR = "data-bsb-thumbnail-processed";
const RELEVANT_SELECTORS = [
  ".bili-video-card",
  ".video-page-card-small",
  ".video-page-card",
  ".video-page-special-card-small",
  ".pop-live-card",
  ".video-card",
  ".video-episode-card",
  ".history-card",
  ".bili-cover-card",
  ".bili-dyn-content",
  ".header-history-card"
] as const;
const IGNORED_SELECTORS = [".sponsorThumbnailLabel"] as const;

type ThumbnailTarget = {
  containerSelector: string;
  itemSelector: string;
  labelAnchorSelector?: string;
  linkSelector?: string;
  linkAttribute?: string;
  placement?: "default" | "corner";
};

type OverlayParts = {
  slot: HTMLElement;
  overlay: HTMLElement;
  shortText: HTMLElement;
  text: HTMLElement;
  anchor: HTMLElement | null;
};

const thumbnailHoverFrames = new WeakMap<HTMLElement, number>();

function cancelOverlayHoverFrame(slot: HTMLElement | null): void {
  if (!slot) {
    return;
  }

  const frame = thumbnailHoverFrames.get(slot);
  if (frame) {
    cancelAnimationFrame(frame);
    thumbnailHoverFrames.delete(slot);
  }
}

const COMMON_THUMBNAIL_TARGETS: ThumbnailTarget[] = [
  {
    containerSelector: ".bili-header .right-entry .v-popover-wrap:nth-of-type(3)",
    itemSelector: "a[data-mod='top_right_bar_window_dynamic']"
  },
  {
    containerSelector: ".bili-header .right-entry .v-popover-wrap:nth-of-type(4)",
    itemSelector: "a[data-mod='top_right_bar_window_default_collection']"
  },
  {
    containerSelector: ".bili-header .right-entry .v-popover-wrap:nth-of-type(5)",
    itemSelector: "a.header-history-card",
    labelAnchorSelector: ".cover, .header-history-card__cover, .bili-cover-card__thumbnail",
    placement: "corner"
  }
];

const THUMBNAIL_TARGETS: Partial<Record<PageType, ThumbnailTarget[]>> = {
  main: [
    ...COMMON_THUMBNAIL_TARGETS,
    { containerSelector: ".recommended-container_floor-aside .container", itemSelector: ".bili-video-card" },
    { containerSelector: ".feed-card", itemSelector: ".bili-video-card" }
  ],
  history: [
    ...COMMON_THUMBNAIL_TARGETS,
    {
      containerSelector: ".main-content",
      itemSelector: ".history-card, .bili-cover-card, .history-video-card",
      labelAnchorSelector: ".bili-cover-card__thumbnail"
    }
  ],
  search: [...COMMON_THUMBNAIL_TARGETS, { containerSelector: ".search-page-wrapper", itemSelector: ".bili-video-card" }],
  video: [
    ...COMMON_THUMBNAIL_TARGETS,
    {
      containerSelector: ".right-container, .rec-list, .rec-list-container, .next-play-list",
      itemSelector:
        ".video-page-card-small, .video-page-card, .video-page-special-card-small, .rec-list .video-page-card-small, .rec-list .video-page-card, .rec-list .video-page-special-card-small",
      labelAnchorSelector: ".pic-box, .pic, .b-img, .cover, .cover-picture, .cover-picture__image, .bili-cover-card__thumbnail, .card-box",
      placement: "corner"
    }
  ],
  list: [...COMMON_THUMBNAIL_TARGETS, { containerSelector: ".recommend-list-container", itemSelector: ".video-card" }],
  channel: [
    ...COMMON_THUMBNAIL_TARGETS,
    { containerSelector: ".space-home", itemSelector: ".bili-video-card" },
    { containerSelector: ".space-main", itemSelector: ".bili-video-card" },
    { containerSelector: ".bili-dyn-list", itemSelector: ".bili-dyn-content" }
  ],
  dynamic: [...COMMON_THUMBNAIL_TARGETS, { containerSelector: ".bili-dyn-list", itemSelector: ".bili-dyn-content" }],
  festival: [
    ...COMMON_THUMBNAIL_TARGETS,
    {
      containerSelector: ".video-sections",
      itemSelector: ".video-episode-card",
      labelAnchorSelector: ".activity-image-card"
    }
  ]
};

const DEFAULT_LINK_SELECTOR = "a[href]";
const DEFAULT_LINK_ATTRIBUTE = "href";
const DEFAULT_LABEL_ANCHOR_SELECTOR =
  ".bili-video-card__cover, .bili-cover-card__thumbnail, .activity-image-card, .activity-image-card__image, .header-history-card__cover, .b-img, .pic-box, .pic, .cover, .cover-picture, .cover-picture__image, .v-img, a[href*='/video/'], picture";
const CANDIDATE_LINK_ATTRIBUTES = [
  "href",
  "data-target-url",
  "data-url",
  "data-link",
  "data-href",
  "data-video-id",
  "data-bvid"
] as const;
const GENERIC_THUMBNAIL_TARGETS: ThumbnailTarget[] = [
  { containerSelector: "body", itemSelector: ".bili-video-card" },
  {
    containerSelector: "body",
    itemSelector: ".video-page-card-small",
    labelAnchorSelector: ".pic-box, .pic, .b-img",
    placement: "corner"
  },
  {
    containerSelector: "body",
    itemSelector: ".video-page-card",
    labelAnchorSelector: ".pic-box, .pic, .b-img",
    placement: "corner"
  },
  { containerSelector: "body", itemSelector: ".pop-live-card" },
  { containerSelector: "body", itemSelector: ".video-card" },
  { containerSelector: "body", itemSelector: ".video-episode-card", labelAnchorSelector: ".activity-image-card" },
  { containerSelector: "body", itemSelector: ".history-card", labelAnchorSelector: ".bili-cover-card__thumbnail" },
  { containerSelector: "body", itemSelector: ".bili-cover-card", labelAnchorSelector: ".bili-cover-card__thumbnail" },
  {
    containerSelector: "body",
    itemSelector: ".header-history-card",
    labelAnchorSelector: ".cover, .header-history-card__cover, .bili-cover-card__thumbnail",
    placement: "corner"
  },
  { containerSelector: "body", itemSelector: ".bili-dyn-content" }
];
const GENERIC_VIDEO_LINK_SELECTOR =
  "a[href*='/video/BV'], a[href*='bilibili.com/video/BV'], [data-bvid^='BV'], [data-video-id^='BV']";

function extractBvidFromAttributeValue(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (isBvid(normalized)) {
    return normalized;
  }

  return extractBvidFromUrl(normalized);
}

function collectCardLinks(card: HTMLElement, target: ThumbnailTarget): string[] {
  const linkSelector = target.linkSelector ?? DEFAULT_LINK_SELECTOR;
  const linkAttribute = target.linkAttribute ?? DEFAULT_LINK_ATTRIBUTE;
  const urls = new Set<string>();
  const candidates = card.matches(linkSelector) ? [card] : [];
  candidates.push(...Array.from(card.querySelectorAll<HTMLElement>(linkSelector)));
  for (const link of candidates) {
    const bvid =
      extractBvidFromAttributeValue(link.getAttribute(linkAttribute)) ??
      CANDIDATE_LINK_ATTRIBUTES.map((attribute) => extractBvidFromAttributeValue(link.getAttribute(attribute))).find(Boolean) ??
      null;
    if (bvid) {
      urls.add(bvid);
    }
  }

  if (urls.size === 0) {
    const nodes = [card, ...Array.from(card.querySelectorAll<HTMLElement>("[data-bvid], [data-video-id], [data-target-url], [data-url], [data-link], [data-href]"))];
    for (const node of nodes) {
      for (const attribute of CANDIDATE_LINK_ATTRIBUTES) {
        const bvid = extractBvidFromAttributeValue(node.getAttribute(attribute));
        if (bvid) {
          urls.add(bvid);
        }
      }
    }
  }

  return [...urls];
}

function resolveLabelAnchor(card: HTMLElement, target: ThumbnailTarget): HTMLElement | null {
  const coverAnchor =
    (target.labelAnchorSelector ? card.querySelector<HTMLElement>(target.labelAnchorSelector) : null) ??
    card.querySelector<HTMLElement>(DEFAULT_LABEL_ANCHOR_SELECTOR) ??
    (card.lastElementChild instanceof HTMLElement ? card.lastElementChild : null);
  const normalizedCoverAnchor =
    coverAnchor?.matches("img, picture") ? (coverAnchor.parentElement as HTMLElement | null) : coverAnchor;
  normalizedCoverAnchor?.classList.add("bsb-tm-thumbnail-cover-anchor");
  return normalizedCoverAnchor ?? null;
}

function ensureCardHost(card: HTMLElement): HTMLElement {
  card.classList.add("bsb-tm-thumbnail-card-host");
  return card;
}

function ensureOverlayHost(card: HTMLElement): HTMLElement {
  const host = card;
  ensureCardHost(card);
  host.classList.add("bsb-tm-thumbnail-host");
  if (getComputedStyle(host).position === "static") {
    host.style.position = "relative";
  }
  return host;
}

function positionOverlay(host: HTMLElement, card: HTMLElement, anchor: HTMLElement | null, overlay: HTMLElement): void {
  const slot = overlay.parentElement instanceof HTMLElement ? overlay.parentElement : overlay;
  const placement = slot.dataset.placement === "corner" ? "corner" : "default";
  const hostRect = host.getBoundingClientRect();
  const anchorRect = anchor?.getBoundingClientRect() ?? null;

  if (placement === "corner") {
    const anchorWidth =
      anchorRect && Number.isFinite(anchorRect.width) ? anchorRect.width : hostRect.width || card.getBoundingClientRect().width;
    const anchorLeft = anchorRect && Number.isFinite(anchorRect.left) ? Math.max(0, anchorRect.left - hostRect.left + 6) : 6;
    const anchorTop =
      anchorRect && Number.isFinite(anchorRect.top) ? Math.max(0, anchorRect.top - hostRect.top + 6) : 6;
    slot.style.setProperty("--bsb-thumbnail-anchor-left", `${Math.round(anchorLeft)}px`);
    slot.style.setProperty("--bsb-thumbnail-anchor-top", `${Math.round(anchorTop)}px`);
    slot.style.setProperty("--bsb-thumbnail-anchor-width", `${Math.round(anchorWidth)}px`);
    return;
  }

  const anchorLeft =
    anchorRect && host !== anchor && Number.isFinite(anchorRect.left)
      ? anchorRect.left - hostRect.left + anchorRect.width / 2
      : hostRect.width / 2;
  const anchorTop =
    anchorRect && host !== anchor && Number.isFinite(anchorRect.top)
      ? Math.max(0, anchorRect.top - hostRect.top)
      : 0;

  const anchorWidth = anchorRect && Number.isFinite(anchorRect.width) ? anchorRect.width : hostRect.width || card.getBoundingClientRect().width;

  slot.style.setProperty("--bsb-thumbnail-anchor-left", `${Math.round(anchorLeft)}px`);
  slot.style.setProperty("--bsb-thumbnail-anchor-top", `${Math.round(anchorTop)}px`);
  slot.style.setProperty("--bsb-thumbnail-anchor-width", `${Math.round(anchorWidth)}px`);
}

function estimateTextWidth(text: string, fontSize: number, isCorner: boolean, multiplier: number): number {
  const normalized = text.trim();
  if (!normalized) {
    return Math.round(fontSize);
  }

  const probe = document.createElement("span");
  probe.textContent = normalized;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.whiteSpace = "nowrap";
  // Maintain strict parity with .sponsorThumbnailLabel styles
  probe.style.setProperty("-webkit-font-smoothing", "antialiased");
  probe.style.textRendering = "optimizeLegibility";
  probe.style.font = `650 ${fontSize}px -apple-system, BlinkMacSystemFont, "PingFang SC", "SF Pro Text", sans-serif`;
  probe.style.letterSpacing = isCorner ? "0" : "0.01em"; // MATCH CSS
  (document.body ?? document.documentElement).appendChild(probe);
  const measured = probe.getBoundingClientRect().width;
  probe.remove();
  // V2.1: Use specific multiplier + small base safety
  return Math.max(Math.ceil(measured * multiplier + 2), Math.round(fontSize));
}

function syncOverlayMetrics(overlay: HTMLElement, shortLabel: string, fullLabel: string): void {
  const placement = overlay.dataset.placement || "default";
  const isCorner = placement === "corner";
  const fontSize = isCorner ? 9.5 : 10;
  
  // V3.2: Universal Calibration
  // Home Page (default): Pill-style, height 22px, min-width 38px
  // Sidebar/History (corner): Sphere-style, height 19px, min-width 19px
  const padding = isCorner ? 7 : 9;
  const dotAndGap = isCorner ? 9 : 11; 
  const minCollapsed = isCorner ? 19 : 38;
  const maxExpanded = 180;

  const multiplier = isCorner ? 1.08 : 1.0;
  const mainSafety = isCorner ? 4 : 8; // Extra safety for Home Page font weight

  const measuredShort = estimateTextWidth(shortLabel, fontSize, isCorner, multiplier);
  const measuredFull = estimateTextWidth(fullLabel, fontSize, isCorner, multiplier);

  const collapsedTextWidth = measuredShort;
  const expandedTextWidth = Math.max(collapsedTextWidth, measuredFull);
  
  // Symmetrical Geometry Model: LeftOffset = Dot + Gap + Padding
  const leftOffset = padding + dotAndGap; 
  const collapsedWidth = Math.max(minCollapsed, Math.round(collapsedTextWidth + (leftOffset * 2)));
  const baseExpandedWidth = Math.round(expandedTextWidth + (leftOffset * 2) + mainSafety);
  
  // V3.1+ Stability: Ensure a meaningful expansion gap for short labels (min +4px)
  const expandedWidth = Math.min(maxExpanded, Math.max(collapsedWidth + 4, baseExpandedWidth));

  overlay.style.setProperty("--bsb-thumbnail-collapsed-width", `${collapsedWidth}px`);
  overlay.style.setProperty("--bsb-thumbnail-expanded-width", `${expandedWidth}px`);
  overlay.style.setProperty("--bsb-thumbnail-collapsed-text-width", `${collapsedTextWidth}px`);
  overlay.style.setProperty("--bsb-thumbnail-expanded-text-width", `${expandedTextWidth}px`);
}

function bindOverlayHoverState(host: HTMLElement, anchor: HTMLElement | null, slot: HTMLElement, overlay: HTMLElement): void {
  if (slot.dataset.hoverBound === "true") {
    return;
  }

  slot.dataset.hoverBound = "true";
  const trigger = anchor ?? host;
  let pendingFrame = 0;

  const setExpanded = (expanded: boolean): void => {
    if (expanded) {
      host.dataset.bsbHover = "true";
      slot.dataset.bsbExpanded = "true";
      overlay.dataset.bsbExpanded = "true";
      return;
    }
    host.removeAttribute("data-bsb-hover");
    slot.removeAttribute("data-bsb-expanded");
    overlay.removeAttribute("data-bsb-expanded");
  };

  const isActive = (node: Element | null): boolean => {
    if (!node) {
      return false;
    }
    return node.matches(":hover") || node.matches(":focus-within");
  };

  const syncState = (): void => {
    pendingFrame = 0;
    thumbnailHoverFrames.delete(slot);
    setExpanded(isActive(host) || isActive(trigger) || isActive(slot));
  };

  const scheduleSync = (): void => {
    if (pendingFrame) {
      cancelAnimationFrame(pendingFrame);
      thumbnailHoverFrames.delete(slot);
    }
    pendingFrame = requestAnimationFrame(syncState);
    thumbnailHoverFrames.set(slot, pendingFrame);
  };

  const activate = (): void => {
    if (pendingFrame) {
      cancelAnimationFrame(pendingFrame);
      pendingFrame = 0;
      thumbnailHoverFrames.delete(slot);
    }
    setExpanded(true);
  };

  for (const node of new Set<HTMLElement>([host, trigger, slot])) {
    node.addEventListener("pointerenter", activate);
    node.addEventListener("mouseenter", activate);
    node.addEventListener("mouseover", activate);
    node.addEventListener("focusin", activate);
    node.addEventListener("pointerleave", scheduleSync);
    node.addEventListener("mouseleave", scheduleSync);
    node.addEventListener("mouseout", scheduleSync);
    node.addEventListener("focusout", scheduleSync);
  }
}

function getOrCreateOverlay(card: HTMLElement, target: ThumbnailTarget): OverlayParts {
  const anchor = resolveLabelAnchor(card, target);
  const host = ensureOverlayHost(card);
  const existing = card.querySelector<HTMLElement>(".sponsorThumbnailLabel");
  if (existing) {
    const textStack = existing.querySelector<HTMLElement>(".bsb-tm-thumbnail-text-stack");
    const shortText = existing.querySelector<HTMLElement>(".bsb-tm-thumbnail-short-label");
    const text = existing.querySelector<HTMLElement>(".bsb-tm-thumbnail-label");
    const slot = existing.parentElement instanceof HTMLElement ? existing.parentElement : null;
    if (
      textStack instanceof HTMLElement &&
      shortText instanceof HTMLElement &&
      text instanceof HTMLElement &&
      slot?.classList.contains("bsb-tm-thumbnail-slot") &&
      slot.parentElement === host
    ) {
      slot.dataset.placement = target.placement ?? "default";
      existing.dataset.placement = target.placement ?? "default";
      existing.dataset.glassContext = "overlay";
      bindOverlayHoverState(host, anchor, slot, existing);
      positionOverlay(host, card, anchor, existing);
      return { slot, overlay: existing, shortText, text, anchor };
    }
    slot?.remove();
    existing.remove();
  }

  const slot = document.createElement("div");
  slot.className = "bsb-tm-thumbnail-slot";
  slot.dataset.placement = target.placement ?? "default";
  const overlay = document.createElement("div");
  overlay.className = "sponsorThumbnailLabel";
  overlay.dataset.placement = target.placement ?? "default";
  overlay.dataset.glassContext = "overlay";

  const textStack = document.createElement("span");
  textStack.className = "bsb-tm-thumbnail-text-stack";

  const shortText = document.createElement("span");
  shortText.className = "bsb-tm-thumbnail-short-label";
  shortText.appendChild(document.createElement("span"));
  textStack.appendChild(shortText);

  const text = document.createElement("span");
  text.className = "bsb-tm-thumbnail-label";
  text.appendChild(document.createElement("span"));
  textStack.appendChild(text);

  overlay.appendChild(textStack);

  slot.appendChild(overlay);
  host.appendChild(slot);
  bindOverlayHoverState(host, anchor, slot, overlay);
  positionOverlay(host, card, anchor, overlay);
  return { slot, overlay, shortText, text, anchor };
}

function hideOverlay(card: HTMLElement): void {
  const overlay = card.querySelector<HTMLElement>(".sponsorThumbnailLabel");
  if (!overlay) {
    return;
  }

  const slot = overlay.parentElement instanceof HTMLElement ? overlay.parentElement : null;
  cancelOverlayHoverFrame(slot);
  overlay.classList.remove("sponsorThumbnailLabelVisible");
  overlay.removeAttribute("data-category");
  overlay.removeAttribute("data-bsb-expanded");
  slot?.removeAttribute("data-bsb-expanded");
  slot?.parentElement?.removeAttribute("data-bsb-hover");
  card.removeAttribute("data-bsb-hover");
  card.removeAttribute(PROCESSED_ATTR);
}

function applyCategoryLabel(
  card: HTMLElement,
  target: ThumbnailTarget,
  videoId: string,
  category: Category,
  config: StoredConfig
): void {
  const { overlay, shortText, text, anchor } = getOrCreateOverlay(card, target);
  const transparencyEnabled = config.labelTransparency.thumbnailLabel;
  const host =
    overlay.parentElement instanceof HTMLElement && overlay.parentElement.parentElement instanceof HTMLElement
      ? overlay.parentElement.parentElement
      : card;
  const style = resolveCategoryStyle(category, config.categoryColorOverrides);
  const glassVariant = transparencyEnabled ? style.transparentVariant : "dark";
  card.setAttribute(PROCESSED_ATTR, videoId);
  overlay.dataset.category = category;
  overlay.dataset.glassContext = "overlay";
  overlay.dataset.glassVariant = glassVariant;
  overlay.style.setProperty("--category-accent", style.accent);
  overlay.style.setProperty("--category-display-accent", style.transparentDisplayAccent);
  overlay.style.setProperty("--category-contrast", glassVariant === "light" ? style.contrast : style.darkContrast);
  overlay.style.setProperty("--category-glass-surface", glassVariant === "light" ? style.glassSurface : style.darkSurface);
  overlay.style.setProperty("--category-glass-border", style.glassBorder);
  overlay.dataset.transparent = String(transparencyEnabled);
  overlay.setAttribute("aria-label", `整视频标签：${CATEGORY_LABELS[category]}`);
  const shortTextNode = shortText.firstElementChild instanceof HTMLElement ? shortText.firstElementChild : shortText;
  const textNode = text.firstElementChild instanceof HTMLElement ? text.firstElementChild : text;
  shortTextNode.textContent = CATEGORY_SHORT_LABELS[category];
  textNode.textContent = CATEGORY_LABELS[category];
  syncOverlayMetrics(overlay, CATEGORY_SHORT_LABELS[category], CATEGORY_LABELS[category]);
  positionOverlay(host, card, anchor, overlay);
  overlay.classList.add("sponsorThumbnailLabelVisible");
}

class WholeVideoLabelClient {
  private readonly segmentClient: SponsorBlockClient;
  private readonly labelClient: VideoLabelClient;
  private readonly rawLabelRequests = new Map<string, Promise<{ segments: SponsorTime[]; labelCategory: Category | null }>>();

  constructor(cache: PersistentCache<FetchResponse>) {
    this.segmentClient = new SponsorBlockClient(cache);
    this.labelClient = new VideoLabelClient(cache);
  }

  async getWholeVideoLabel(videoId: string, config: StoredConfig): Promise<Category | null> {
    const normalizedServer = config.serverAddress.replace(/\/+$/u, "");
    const cacheKey = `${normalizedServer}:${videoId}`;
    const existing = this.rawLabelRequests.get(cacheKey);
    const context: VideoContext = {
      bvid: videoId,
      cid: null,
      page: 1,
      title: null,
      href: window.location.href
    };
    const request =
      existing ??
      Promise.all([
        this.segmentClient.getSegments(context, config),
        this.labelClient.getVideoLabel(videoId, config)
      ])
        .then(([segments, labelCategory]) => ({
          segments,
          labelCategory
        }))
        .finally(() => {
          this.rawLabelRequests.delete(cacheKey);
        });
    if (!existing) {
      this.rawLabelRequests.set(cacheKey, request);
    }

    const { segments, labelCategory } = await request;

    return resolveWholeVideoCategory(videoId, normalizeSegments(segments, config), labelCategory, config);
  }
}

export class ThumbnailLabelController {
  private started = false;
  private refreshing = false;
  private pendingRefresh = false;
  private refreshTimerId: number | null = null;
  private cancelIdleRefresh: (() => void) | null = null;
  private domObserver: MutationObserver | null = null;
  private stopObservingUrl: (() => void) | null = null;
  private currentConfig: StoredConfig;
  private readonly client: WholeVideoLabelClient;
  private readonly handleWindowLayoutChange = () => {
    this.scheduleRefresh();
  };
  private readonly handleVisibilityChange = () => {
    if (!document.hidden) {
      this.scheduleRefresh();
    }
  };

  constructor(
    private readonly configStore: ConfigStore,
    cache: PersistentCache<FetchResponse>,
    private readonly localVideoLabelStore: LocalVideoLabelStore
  ) {
    this.currentConfig = this.configStore.getSnapshot();
    this.client = new WholeVideoLabelClient(cache);
    this.configStore.subscribe((config) => {
      this.currentConfig = config;
      this.reset();
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
      this.reset();
      this.scheduleRefresh();
    });

    this.domObserver = new MutationObserver((records) => {
      if (!mutationsTouchSelectors(records, RELEVANT_SELECTORS, IGNORED_SELECTORS)) {
        return;
      }
      this.scheduleRefresh();
    });
    this.domObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    window.addEventListener("resize", this.handleWindowLayoutChange);
    window.addEventListener("load", this.handleWindowLayoutChange, { once: true });
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  stop(): void {
    if (!this.started) {
      return;
    }

    this.started = false;
    this.stopObservingUrl?.();
    this.stopObservingUrl = null;
    if (this.refreshTimerId !== null) {
      window.clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
    this.cancelIdleRefresh?.();
    this.cancelIdleRefresh = null;
    window.removeEventListener("resize", this.handleWindowLayoutChange);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.domObserver?.disconnect();
    this.domObserver = null;
    this.reset();
  }

  private scheduleRefresh(): void {
    if (!this.started) {
      return;
    }

    if (this.refreshTimerId !== null) {
      return;
    }

    this.refreshTimerId = window.setTimeout(() => {
      this.refreshTimerId = null;
      if (!this.started) {
        return;
      }
      const runRefresh = () => {
        this.cancelIdleRefresh = null;
        if (!this.started) {
          return;
        }
        void this.refresh();
      };
      if (typeof requestIdleCallback === "function" && typeof cancelIdleCallback === "function") {
        const idleId = requestIdleCallback(runRefresh);
        this.cancelIdleRefresh = () => cancelIdleCallback(idleId);
        return;
      }

      const timeoutId = window.setTimeout(runRefresh, 0);
      this.cancelIdleRefresh = () => window.clearTimeout(timeoutId);
    }, 180);
  }

  private async refresh(): Promise<void> {
    if (!this.started) {
      return;
    }

    if (this.refreshing) {
      this.pendingRefresh = true;
      return;
    }

    this.refreshing = true;
    try {
      if (!this.currentConfig.enabled || this.currentConfig.thumbnailLabelMode === "off") {
        this.reset();
        return;
      }

      const pageType = detectPageType(window.location.href);
      const targets = [...(THUMBNAIL_TARGETS[pageType] ?? []), ...GENERIC_THUMBNAIL_TARGETS];
      if (targets.length === 0) {
        return;
      }

      const processedCards = new Set<HTMLElement>();
      const jobs: Array<Promise<void>> = [];
      for (const target of targets) {
        const containers = document.querySelectorAll<HTMLElement>(target.containerSelector);
        for (const container of containers) {
          const cards = container.querySelectorAll<HTMLElement>(target.itemSelector);
          for (const card of cards) {
            if (processedCards.has(card) || !card.isConnected || this.isCoveredByProcessedCard(card, processedCards)) {
              continue;
            }
            processedCards.add(card);
            jobs.push(
              this.processCard(card, target).catch((error) => {
                debugLog("Failed to label thumbnail", error);
              })
            );
          }
        }
      }

      for (const node of document.querySelectorAll<HTMLElement>(GENERIC_VIDEO_LINK_SELECTOR)) {
        const card =
          node.closest<HTMLElement>(RELEVANT_SELECTORS.join(", ")) ??
          (node.matches("a, [data-bvid], [data-video-id]") ? node : null);
        if (!card || processedCards.has(card) || !card.isConnected || this.isCoveredByProcessedCard(card, processedCards)) {
          continue;
        }
        processedCards.add(card);
        jobs.push(
          this.processCard(card, {
            containerSelector: "body",
            itemSelector: GENERIC_VIDEO_LINK_SELECTOR,
            linkSelector: GENERIC_VIDEO_LINK_SELECTOR
          }).catch((error) => {
            debugLog("Failed to label generic thumbnail", error);
          })
        );
      }

      if (jobs.length > 0) {
        await Promise.allSettled(jobs);
      }
    } finally {
      this.refreshing = false;
      if (this.started && this.pendingRefresh) {
        this.pendingRefresh = false;
        this.scheduleRefresh();
      }
    }
  }

  private isCoveredByProcessedCard(card: HTMLElement, processedCards: Set<HTMLElement>): boolean {
    for (const processed of processedCards) {
      if (processed.contains(card) || card.contains(processed)) {
        return true;
      }
    }
    return false;
  }

  private async processCard(card: HTMLElement, target: ThumbnailTarget): Promise<void> {
    const videoIds = collectCardLinks(card, target);
    const videoId = videoIds[0] ?? null;
    if (!videoId) {
      hideOverlay(card);
      return;
    }

    const lastProcessed = card.getAttribute(PROCESSED_ATTR);
    if (lastProcessed === videoId) {
      const overlay = card.querySelector<HTMLElement>(".sponsorThumbnailLabel");
      if (overlay) {
        const anchor = resolveLabelAnchor(card, target);
        const host = ensureOverlayHost(card);
        positionOverlay(host, card, anchor, overlay);
      }
      return;
    }

    const category =
      (await this.client.getWholeVideoLabel(videoId, this.currentConfig)) ??
      this.localVideoLabelStore.getResolved(videoId)?.category ??
      null;
    if (!category) {
      hideOverlay(card);
      return;
    }

    applyCategoryLabel(card, target, videoId, category, this.currentConfig);
  }

  private reset(): void {
    for (const overlay of document.querySelectorAll<HTMLElement>(".sponsorThumbnailLabel")) {
      const slot = overlay.parentElement instanceof HTMLElement ? overlay.parentElement : null;
      cancelOverlayHoverFrame(slot);
      overlay.classList.remove("sponsorThumbnailLabelVisible");
      overlay.removeAttribute("data-category");
      overlay.removeAttribute("data-bsb-expanded");
    }

    for (const slot of document.querySelectorAll<HTMLElement>(".bsb-tm-thumbnail-slot[data-bsb-expanded]")) {
      slot.removeAttribute("data-bsb-expanded");
    }

    for (const host of document.querySelectorAll<HTMLElement>(".bsb-tm-thumbnail-host[data-bsb-hover]")) {
      host.removeAttribute("data-bsb-hover");
    }

    for (const card of document.querySelectorAll<HTMLElement>(`[${PROCESSED_ATTR}]`)) {
      card.removeAttribute(PROCESSED_ATTR);
    }
  }
}
