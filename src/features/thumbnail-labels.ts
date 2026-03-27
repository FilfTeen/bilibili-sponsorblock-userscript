import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_TEXT_COLORS } from "../constants";
import { ConfigStore } from "../core/config-store";
import { PersistentCache } from "../core/cache";
import { observeUrlChanges } from "../utils/navigation";
import { detectPageType } from "../utils/page";
import { extractBvidFromUrl } from "../utils/video-context";
import { mutationsTouchSelectors } from "../utils/mutation";
import { debugLog } from "../utils/dom";
import type { Category, PageType, StoredConfig } from "../types";
import type { FetchResponse } from "../types";
import { VideoLabelClient } from "../api/video-label-client";

const PROCESSED_ATTR = "data-bsb-thumbnail-processed";
const RELEVANT_SELECTORS = [
  ".bili-video-card",
  ".video-page-card-small",
  ".video-card",
  ".video-episode-card",
  ".history-card",
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
};

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
    itemSelector: "a.header-history-card"
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
      itemSelector: ".history-card",
      labelAnchorSelector: ".bili-cover-card__thumbnail > img"
    }
  ],
  search: [...COMMON_THUMBNAIL_TARGETS, { containerSelector: ".search-page-wrapper", itemSelector: ".bili-video-card" }],
  video: [
    ...COMMON_THUMBNAIL_TARGETS,
    {
      containerSelector: ".right-container",
      itemSelector: ".video-page-card-small",
      labelAnchorSelector: ".b-img img"
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
      labelAnchorSelector: ".activity-image-card__image"
    }
  ]
};

const DEFAULT_LINK_SELECTOR = "a[href]";
const DEFAULT_LINK_ATTRIBUTE = "href";
const DEFAULT_LABEL_ANCHOR_SELECTOR =
  "div:not(.b-img--face) > picture img:not(.bili-avatar-img), .bili-cover-card__thumbnail > img, .activity-image-card__image, .b-img img";

function createSbIcon(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 565.15 568");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", "#SponsorBlockIcon");
  svg.appendChild(use);
  return svg;
}

function ensureSbIconDefinition(root: ParentNode): void {
  if (root.querySelector("#SponsorBlockIcon")) {
    return;
  }

  const SVG_NS = "http://www.w3.org/2000/svg";
  const container = document.createElement("span");
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 565.15 568");
  svg.style.display = "none";

  const defs = document.createElementNS(SVG_NS, "defs");
  const group = document.createElementNS(SVG_NS, "g");
  group.id = "SponsorBlockIcon";

  const firstPath = document.createElementNS(SVG_NS, "path");
  firstPath.setAttribute(
    "d",
    "M282.58,568a65,65,0,0,1-34.14-9.66C95.41,463.94,2.54,300.46,0,121A64.91,64.91,0,0,1,34,62.91a522.56,522.56,0,0,1,497.16,0,64.91,64.91,0,0,1,34,58.12c-2.53,179.43-95.4,342.91-248.42,437.3A65,65,0,0,1,282.58,568Zm0-548.31A502.24,502.24,0,0,0,43.4,80.22a45.27,45.27,0,0,0-23.7,40.53c2.44,172.67,91.81,330,239.07,420.83a46.19,46.19,0,0,0,47.61,0C453.64,450.73,543,293.42,545.45,120.75a45.26,45.26,0,0,0-23.7-40.54A502.26,502.26,0,0,0,282.58,19.69Z"
  );

  const secondPath = document.createElementNS(SVG_NS, "path");
  secondPath.setAttribute(
    "d",
    "M 284.70508 42.693359 A 479.9 479.9 0 0 0 54.369141 100.41992 A 22.53 22.53 0 0 0 42.669922 120.41992 C 45.069922 290.25992 135.67008 438.63977 270.83008 522.00977 A 22.48 22.48 0 0 0 294.32031 522.00977 C 429.48031 438.63977 520.08047 290.25992 522.48047 120.41992 A 22.53 22.53 0 0 0 510.7793 100.41992 A 479.9 479.9 0 0 0 284.70508 42.693359 z M 220.41016 145.74023 L 411.2793 255.93945 L 220.41016 366.14062 L 220.41016 145.74023 z "
  );

  group.append(firstPath, secondPath);
  defs.appendChild(group);
  svg.appendChild(defs);
  container.appendChild(svg);
  if (root instanceof Element) {
    root.appendChild(container);
  } else {
    document.body.appendChild(container);
  }
}

function collectCardLinks(card: HTMLElement, target: ThumbnailTarget): string[] {
  const linkSelector = target.linkSelector ?? DEFAULT_LINK_SELECTOR;
  const linkAttribute = target.linkAttribute ?? DEFAULT_LINK_ATTRIBUTE;
  const urls = new Set<string>();
  const candidates = card.matches(linkSelector) ? [card] : [];
  candidates.push(...Array.from(card.querySelectorAll<HTMLElement>(linkSelector)));
  for (const link of candidates) {
    const bvid = extractBvidFromUrl(link.getAttribute(linkAttribute) ?? "");
    if (bvid) {
      urls.add(bvid);
    }
  }
  return [...urls];
}

function insertAfter(anchor: Node, node: Node): boolean {
  const parent = anchor.parentNode;
  if (!parent) {
    return false;
  }

  parent.insertBefore(node, anchor.nextSibling);
  return true;
}

function dispatchThumbnailHover(card: HTMLElement, entering: boolean): void {
  card.dispatchEvent(
    new PointerEvent(entering ? "pointerenter" : "pointerleave", {
      bubbles: true
    })
  );
}

function resolveLabelAnchor(card: HTMLElement, target: ThumbnailTarget): HTMLElement | null {
  return (
    (target.labelAnchorSelector ? card.querySelector<HTMLElement>(target.labelAnchorSelector) : null) ??
    card.querySelector<HTMLElement>(DEFAULT_LABEL_ANCHOR_SELECTOR) ??
    (card.lastElementChild instanceof HTMLElement ? card.lastElementChild : null) ??
    card
  );
}

function getOrCreateOverlay(card: HTMLElement, target: ThumbnailTarget): { overlay: HTMLElement; text: HTMLElement } {
  const existing = card.querySelector<HTMLElement>(".sponsorThumbnailLabel");
  if (existing) {
    const text = existing.querySelector("span");
    if (text instanceof HTMLElement) {
      return { overlay: existing, text };
    }
  }

  const overlay = document.createElement("div");
  overlay.className = "sponsorThumbnailLabel";
  overlay.addEventListener("pointerenter", (event) => {
    event.stopPropagation();
    dispatchThumbnailHover(card, false);
  });
  overlay.addEventListener("pointerleave", (event) => {
    event.stopPropagation();
    dispatchThumbnailHover(card, true);
  });
  overlay.appendChild(createSbIcon());

  const text = document.createElement("span");
  overlay.appendChild(text);

  const anchor = resolveLabelAnchor(card, target);
  if (!anchor || !insertAfter(anchor, overlay)) {
    card.appendChild(overlay);
  }
  return { overlay, text };
}

function hideOverlay(card: HTMLElement): void {
  const overlay = card.querySelector<HTMLElement>(".sponsorThumbnailLabel");
  if (!overlay) {
    return;
  }

  overlay.classList.remove("sponsorThumbnailLabelVisible");
  overlay.removeAttribute("data-category");
  card.removeAttribute(PROCESSED_ATTR);
}

function applyCategoryLabel(card: HTMLElement, target: ThumbnailTarget, videoId: string, category: Category): void {
  const { overlay, text } = getOrCreateOverlay(card, target);
  card.setAttribute(PROCESSED_ATTR, videoId);
  overlay.dataset.category = category;
  overlay.style.setProperty("--category-color", CATEGORY_COLORS[category]);
  overlay.style.setProperty("--category-text-color", CATEGORY_TEXT_COLORS[category]);
  text.textContent = CATEGORY_LABELS[category];
  overlay.classList.add("sponsorThumbnailLabelVisible");
}

export class ThumbnailLabelController {
  private started = false;
  private refreshing = false;
  private pendingRefresh = false;
  private refreshTimerId: number | null = null;
  private domObserver: MutationObserver | null = null;
  private stopObservingUrl: (() => void) | null = null;
  private currentConfig: StoredConfig;
  private readonly client: VideoLabelClient;

  constructor(
    private readonly configStore: ConfigStore,
    cache: PersistentCache<FetchResponse>
  ) {
    this.currentConfig = this.configStore.getSnapshot();
    this.client = new VideoLabelClient(cache);
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
    ensureSbIconDefinition(document.body);
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
    this.domObserver?.disconnect();
    this.domObserver = null;
    this.reset();
  }

  private scheduleRefresh(): void {
    if (this.refreshTimerId !== null) {
      return;
    }

    this.refreshTimerId = window.setTimeout(() => {
      this.refreshTimerId = null;
      void this.refresh();
    }, 180);
  }

  private async refresh(): Promise<void> {
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
      const targets = THUMBNAIL_TARGETS[pageType] ?? [];
      if (targets.length === 0) {
        return;
      }

      for (const target of targets) {
        const containers = document.querySelectorAll<HTMLElement>(target.containerSelector);
        for (const container of containers) {
          const cards = container.querySelectorAll<HTMLElement>(target.itemSelector);
          for (const card of cards) {
            try {
              await this.processCard(card, target);
            } catch (error) {
              debugLog("Failed to label thumbnail", error);
            }
          }
        }
      }
    } finally {
      this.refreshing = false;
      if (this.pendingRefresh) {
        this.pendingRefresh = false;
        this.scheduleRefresh();
      }
    }
  }

  private async processCard(card: HTMLElement, target: ThumbnailTarget): Promise<void> {
    const videoIds = collectCardLinks(card, target);
    if (videoIds.length !== 1) {
      hideOverlay(card);
      return;
    }

    const [videoId] = videoIds;
    const lastProcessed = card.getAttribute(PROCESSED_ATTR);
    if (lastProcessed === videoId) {
      return;
    }

    const category = await this.client.getVideoLabel(videoId, this.currentConfig);
    if (!category) {
      hideOverlay(card);
      return;
    }

    applyCategoryLabel(card, target, videoId, category);
  }

  private reset(): void {
    for (const overlay of document.querySelectorAll<HTMLElement>(".sponsorThumbnailLabel")) {
      overlay.classList.remove("sponsorThumbnailLabelVisible");
      overlay.removeAttribute("data-category");
    }

    for (const card of document.querySelectorAll<HTMLElement>(`[${PROCESSED_ATTR}]`)) {
      card.removeAttribute(PROCESSED_ATTR);
    }
  }
}
