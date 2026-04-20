import { SCRIPT_NAME } from "../constants";
import { isDiagnosticDebugEnabled } from "./diagnostics";
export { isSupportedLocation } from "./page";

const PLAYER_HOST_SELECTORS = [
  "#bilibili-player",
  ".bpx-player-container",
  ".bpx-player-video-area",
  ".player-container",
  ".bili-video-player"
];
const VIDEO_TITLE_SELECTORS = [
  ".video-info-container h1",
  ".video-title-container h1",
  ".media-right h1",
  "h1.video-title",
  ".video-title"
];
const TITLE_ACCESSORY_ATTR = "data-bsb-title-accessories";
const PLAYER_BUTTON_HOST_SELECTORS = [
  ".bpx-player-control-bottom-right",
  ".bpx-player-control-bottom-center-right",
  ".bpx-player-control-wrap .bpx-player-ctrl-btns-right",
  ".bpx-player-control-wrap .bpx-player-control-bottom-right",
  ".bpx-player-ctrl-bottom-right"
];

export function findVideoElement(): HTMLVideoElement | null {
  return document.querySelector("video");
}

export function resolvePlayerHost(video: HTMLVideoElement): HTMLElement {
  for (const selector of PLAYER_HOST_SELECTORS) {
    const found = video.closest<HTMLElement>(selector);
    if (found) {
      return found;
    }
  }

  return video.parentElement ?? video;
}

export function findVideoTitleElement(): HTMLElement | null {
  for (const selector of VIDEO_TITLE_SELECTORS) {
    const found = document.querySelector<HTMLElement>(selector);
    if (found) {
      return found;
    }
  }
  return null;
}

export function ensureVideoTitleAccessoryHost(): HTMLElement | null {
  const title = findVideoTitleElement();
  if (!title) {
    return null;
  }

  const parent = title.parentElement;
  if (!parent) {
    return null;
  }

  title.classList.remove("bsb-tm-title-row", "bsb-tm-title-text");
  parent.classList.remove("bsb-tm-title-layout");

  let accessories =
    Array.from(parent.children).find(
      (child): child is HTMLElement => child instanceof HTMLElement && child.getAttribute(TITLE_ACCESSORY_ATTR) === "true"
    ) ?? null;
  if (!accessories) {
    accessories = document.createElement("span");
    accessories.className = "bsb-tm-title-accessories";
    accessories.setAttribute(TITLE_ACCESSORY_ATTR, "true");
    parent.insertBefore(accessories, title);
  }

  return accessories;
}

export function cleanupVideoTitleAccessoryHost(host: HTMLElement | null): void {
  if (!host || host.getAttribute(TITLE_ACCESSORY_ATTR) !== "true") {
    return;
  }

  const parent = host.parentElement instanceof HTMLElement ? host.parentElement : null;
  const title = host.nextElementSibling instanceof HTMLElement ? host.nextElementSibling : null;
  if (host.childElementCount === 0) {
    host.remove();
  }
  title?.classList.remove("bsb-tm-title-row", "bsb-tm-title-text");
  parent?.classList.remove("bsb-tm-title-layout");
}

export function findPlayerButtonHost(video: HTMLVideoElement | null): HTMLElement | null {
  const titleAccessories = ensureVideoTitleAccessoryHost();
  if (titleAccessories) {
    return titleAccessories;
  }

  const scopes: ParentNode[] = [
    video?.closest("#bilibili-player") ?? null,
    video?.closest(".bpx-player-container") ?? null,
    video?.closest(".bpx-player-primary-area") ?? null,
    document
  ].filter(Boolean) as ParentNode[];

  for (const scope of scopes) {
    for (const selector of PLAYER_BUTTON_HOST_SELECTORS) {
      const found = scope.querySelector<HTMLElement>(selector);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

export function formatSegmentTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const secs = (total % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function formatDurationLabel(start: number, end: number | null): string {
  if (end === null) {
    return formatSegmentTime(start);
  }
  return `${formatSegmentTime(start)} - ${formatSegmentTime(end)}`;
}

export function debugLog(message: string, ...extra: unknown[]): void {
  if (isDiagnosticDebugEnabled()) {
    console.debug(`[${SCRIPT_NAME}] ${message}`, ...extra);
  }
}
