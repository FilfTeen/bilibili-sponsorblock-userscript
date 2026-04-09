import type { DynamicSponsorMatch, StoredConfig } from "../types";
import { ConfigStore } from "../core/config-store";
import { collectPatternMatches, isLikelyPromoText, regexFromStoredPattern } from "../utils/pattern";
import { analyzeCommercialIntent } from "../utils/commercial-intent";
import { debugLog } from "../utils/dom";
import { mutationsTouchSelectors } from "../utils/mutation";
import { observeUrlChanges } from "../utils/navigation";
import { supportsDynamicFilters } from "../utils/page";
import {
  createInlineBadge,
  createInlineToggle,
  setInlineToggleState,
  type InlineTone
} from "../ui/inline-feedback";

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
const currentInlineBadgeAppearance = {
  dynamicBadge: false
};

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
  const text = [
    ...element.querySelectorAll(".bili-rich-text__content span:not(.bili-dyn-item__interaction *), .opus-paragraph-children span, .dyn-card-opus__title")
  ]
    .map((node) => node.textContent ?? "")
    .join(" ");
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
      category:
        assessment.category === "selfpromo" ? "dynamicSponsor_forward_sponsor" : "dynamicSponsor_suspicion_sponsor",
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
    category:
      assessment.category === "selfpromo" ? "dynamicSponsor_forward_sponsor" : "dynamicSponsor_suspicion_sponsor",
    matches: storedMatches.length > 0 ? storedMatches : assessment.matches
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

function getBadgeTone(match: DynamicSponsorMatch): InlineTone {
  switch (match.category) {
    case "dynamicSponsor_forward_sponsor":
      return "warning";
    case "dynamicSponsor_suspicion_sponsor":
      return "warning";
    default:
      return "danger";
  }
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

function createBadge(text: string, tone: InlineTone): HTMLElement {
  return createInlineBadge(
    "data-bsb-dynamic-badge",
    text,
    tone,
    "stack",
    undefined,
    currentInlineBadgeAppearance.dynamicBadge ? "glass" : "solid"
  );
}

function createToggleButton(onClick: () => void): HTMLButtonElement {
  return createInlineToggle("data-bsb-dynamic-toggle", onClick, "stack");
}

function setDynamicHidden(body: HTMLElement, button: HTMLButtonElement, hidden: boolean): void {
  body.style.display = hidden ? "none" : "";
  body.setAttribute(HIDDEN_ATTR, String(hidden));
  setInlineToggleState(button, hidden ? "hidden" : "shown", {
    hidden: "显示动态内容",
    shown: "再次隐藏动态"
  });
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
    currentInlineBadgeAppearance.dynamicBadge = this.currentConfig.labelTransparency.dynamicBadge;
    this.configStore.subscribe((config) => {
      this.currentConfig = config;
      currentInlineBadgeAppearance.dynamicBadge = config.labelTransparency.dynamicBadge;
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

    const badge = createBadge(getBadgeText(match), getBadgeTone(match));
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
