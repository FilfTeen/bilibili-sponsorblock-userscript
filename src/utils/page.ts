import type { PageType } from "../types";

const SUPPORTED_HOSTS = new Set([
  "www.bilibili.com",
  "search.bilibili.com",
  "t.bilibili.com",
  "space.bilibili.com"
]);

export function detectPageType(url: string): PageType {
  try {
    const parsed = new URL(url);
    if (!SUPPORTED_HOSTS.has(parsed.hostname)) {
      return "unsupported";
    }

    if (parsed.hostname === "search.bilibili.com") {
      return "search";
    }

    if (parsed.hostname === "t.bilibili.com") {
      return "dynamic";
    }

    if (parsed.hostname === "space.bilibili.com") {
      return "channel";
    }

    if (parsed.pathname.startsWith("/account/history") || parsed.pathname.startsWith("/history")) {
      return "history";
    }

    if (parsed.pathname.startsWith("/video/")) {
      return "video";
    }
    if (parsed.pathname.startsWith("/list/") || parsed.pathname.startsWith("/medialist/play/")) {
      return "list";
    }
    if (parsed.pathname.startsWith("/festival/")) {
      return "festival";
    }
    if (parsed.pathname.startsWith("/bangumi/")) {
      return "anime";
    }
    if (parsed.pathname.startsWith("/opus/")) {
      return "opus";
    }

    return "main";
  } catch (_error) {
    return "unknown";
  }
}

export function isSupportedLocation(url: string): boolean {
  const pageType = detectPageType(url);
  return pageType !== "unknown" && pageType !== "unsupported";
}

export function supportsVideoFeatures(url: string): boolean {
  const pageType = detectPageType(url);
  return (
    pageType === "video" ||
    pageType === "list" ||
    pageType === "festival" ||
    pageType === "anime" ||
    pageType === "opus"
  );
}

export function supportsCompactVideoHeader(url: string): boolean {
  return supportsVideoFeatures(url);
}

export function isCompactVideoHeaderSuppressed(documentRef: Document = document): boolean {
  if (documentRef.fullscreenElement) {
    return true;
  }

  return Boolean(
    documentRef.querySelector(
      [
        ".player-full-win",
        ".player-fullscreen",
        ".bpx-state-webfull",
        ".bpx-state-webscreen",
        ".bpx-state-fullscreen",
        ".bpx-player-container[data-screen='web']",
        ".bpx-player-container[data-screen='webscreen']",
        ".bpx-player-container[data-screen='full']",
        ".squirtle-video-pagefullscreen",
        ".squirtle-video-fullscreen",
        ".player-mode-webfullscreen",
        ".mode-webscreen"
      ].join(",")
    )
  );
}

export function supportsDynamicFilters(url: string): boolean {
  const pageType = detectPageType(url);
  return pageType === "main" || pageType === "dynamic" || pageType === "channel";
}

export function supportsCommentFilters(url: string): boolean {
  const pageType = detectPageType(url);
  return (
    pageType === "video" ||
    pageType === "list" ||
    pageType === "festival" ||
    pageType === "anime" ||
    pageType === "opus" ||
    pageType === "dynamic" ||
    pageType === "channel"
  );
}
