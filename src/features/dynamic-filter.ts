import type { DynamicSponsorMatch, StoredConfig } from "../types";
import { ConfigStore } from "../core/config-store";
import { collectPatternMatches, isLikelyPromoText, regexFromStoredPattern } from "../utils/pattern";
import { debugLog } from "../utils/dom";
import { mutationsTouchSelectors } from "../utils/mutation";
import { observeUrlChanges } from "../utils/navigation";
import { supportsDynamicFilters } from "../utils/page";

const PROCESSED_ATTR = "data-bsb-dynamic-processed";
const BADGE_SELECTOR = "[data-bsb-dynamic-badge]";
const TOGGLE_SELECTOR = "[data-bsb-dynamic-toggle]";
const HIDDEN_ATTR = "data-bsb-dynamic-hidden";
const DYNAMIC_RELEVANT_SELECTORS = [
  ".bili-dyn-item",
  ".bili-dyn-card-goods",
  ".bili-rich-text__content",
  ".dyn-card-opus",
  ".dyn-card-opus__title"
] as const;
const DYNAMIC_IGNORED_SELECTORS = [BADGE_SELECTOR, TOGGLE_SELECTOR] as const;

export function classifyDynamicItem(
  element: HTMLElement,
  config: Pick<StoredConfig, "dynamicRegexPattern" | "dynamicRegexKeywordMinMatches">
): DynamicSponsorMatch | null {
  if (element.querySelector(".bili-dyn-card-goods.hide-border")) {
    return {
      category: "dynamicSponsor_forward_sponsor",
      matches: []
    };
  }

  if (element.querySelector(".bili-dyn-card-goods")) {
    return {
      category: "dynamicSponsor_sponsor",
      matches: []
    };
  }

  const pattern = regexFromStoredPattern(config.dynamicRegexPattern);
  if (!pattern) {
    return null;
  }

  const text = [
    ...element.querySelectorAll(".bili-rich-text__content span:not(.bili-dyn-item__interaction *), .opus-paragraph-children span, .dyn-card-opus__title")
  ]
    .map((node) => node.textContent ?? "")
    .join(" ");
  const matches = collectPatternMatches(text, pattern);
  if (!isLikelyPromoText(text, matches, config.dynamicRegexKeywordMinMatches)) {
    return null;
  }

  return {
    category: "dynamicSponsor_suspicion_sponsor",
    matches
  };
}

function getBadgeText(match: DynamicSponsorMatch): string {
  if (match.category === "dynamicSponsor_forward_sponsor") {
    return "转发带货";
  }
  if (match.category === "dynamicSponsor_sponsor") {
    return "带货动态";
  }
  return match.matches.length > 0 ? `疑似广告: ${match.matches.join(" / ")}` : "疑似广告";
}

function resolveBadgeAnchor(element: HTMLElement): HTMLElement | null {
  return (
    element.querySelector<HTMLElement>(".bili-dyn-title__text") ??
    element.querySelector<HTMLElement>(".dyn-card-opus__title") ??
    element.querySelector<HTMLElement>(".bili-dyn-item__header") ??
    element.querySelector<HTMLElement>(".bili-dyn-item__main")
  );
}

function resolveContentBody(element: HTMLElement): HTMLElement | null {
  return (
    element.querySelector<HTMLElement>(".bili-dyn-content") ??
    element.querySelector<HTMLElement>(".dyn-card-opus") ??
    element.querySelector<HTMLElement>(".bili-dyn-item__main")
  );
}

function createBadge(text: string): HTMLElement {
  const badge = document.createElement("div");
  badge.dataset.bsbDynamicBadge = "true";
  badge.style.cssText =
    "display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:6px 10px;border-radius:999px;background:rgba(255,102,153,.14);border:1px solid rgba(255,102,153,.28);color:#c2185b;font:600 12px/1.2 'SF Pro Text','PingFang SC',sans-serif;";
  badge.textContent = text;
  return badge;
}

function createToggleButton(onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.bsbDynamicToggle = "true";
  button.style.cssText =
    "margin-top:8px;border:0;border-radius:999px;padding:7px 12px;background:rgba(15,23,42,.08);color:#0f172a;font:600 12px/1.2 'SF Pro Text','PingFang SC',sans-serif;cursor:pointer;";
  button.textContent = "显示内容";
  button.addEventListener("click", onClick);
  return button;
}

function setDynamicHidden(body: HTMLElement, button: HTMLButtonElement, hidden: boolean): void {
  body.style.display = hidden ? "none" : "";
  button.textContent = hidden ? "显示内容" : "隐藏内容";
}

export class DynamicSponsorController {
  private started = false;
  private currentConfig: StoredConfig;
  private domObserver: MutationObserver | null = null;
  private refreshTimerId: number | null = null;
  private stopObservingUrl: (() => void) | null = null;
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
      this.resetProcessedItems();
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
      this.resetProcessedItems();
      this.scheduleRefresh();
    });

    this.domObserver = new MutationObserver((records) => {
      if (!mutationsTouchSelectors(records, DYNAMIC_RELEVANT_SELECTORS, DYNAMIC_IGNORED_SELECTORS)) {
        return;
      }
      this.scheduleRefresh();
    });
    this.domObserver.observe(document.documentElement, {
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
    if (this.refreshTimerId !== null) {
      window.clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
    this.domObserver?.disconnect();
    this.domObserver = null;
    this.pendingVisibleRefresh = false;
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.resetProcessedItems();
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
    }, 120);
  }

  private refresh(): void {
    if (document.hidden) {
      this.pendingVisibleRefresh = true;
      return;
    }

    if (
      !this.currentConfig.enabled ||
      this.currentConfig.dynamicFilterMode === "off" ||
      !supportsDynamicFilters(window.location.href)
    ) {
      this.resetProcessedItems();
      return;
    }

    for (const element of document.querySelectorAll<HTMLElement>(".bili-dyn-item")) {
      try {
        this.processDynamicItem(element);
      } catch (error) {
        debugLog("Failed to process dynamic item", error);
      }
    }
  }

  private processDynamicItem(element: HTMLElement): void {
    if (element.getAttribute(PROCESSED_ATTR) === "true") {
      return;
    }

    const match = classifyDynamicItem(element, this.currentConfig);
    if (!match) {
      return;
    }

    const anchor = resolveBadgeAnchor(element);
    if (!anchor?.parentElement) {
      return;
    }

    element.setAttribute(PROCESSED_ATTR, "true");

    const badge = createBadge(getBadgeText(match));
    anchor.parentElement.insertBefore(badge, anchor.nextSibling);

    if (this.currentConfig.dynamicFilterMode !== "hide") {
      return;
    }

    const body = resolveContentBody(element);
    if (!body || body.getAttribute(HIDDEN_ATTR) === "true") {
      return;
    }

    const toggle = createToggleButton(() => {
      const hidden = body.style.display === "none";
      setDynamicHidden(body, toggle, !hidden);
    });
    setDynamicHidden(body, toggle, true);
    body.setAttribute(HIDDEN_ATTR, "true");
    badge.parentElement?.insertBefore(toggle, badge.nextSibling);
  }

  private resetProcessedItems(): void {
    for (const element of document.querySelectorAll<HTMLElement>(`.bili-dyn-item[${PROCESSED_ATTR}='true']`)) {
      element.removeAttribute(PROCESSED_ATTR);
      element.querySelectorAll(BADGE_SELECTOR).forEach((node) => node.remove());
      element.querySelectorAll(TOGGLE_SELECTOR).forEach((node) => node.remove());

      const body = resolveContentBody(element);
      if (body) {
        body.style.display = "";
        body.removeAttribute(HIDDEN_ATTR);
      }
    }
    debugLog("Dynamic sponsor state reset");
  }
}
