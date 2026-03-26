import { SCRIPT_NAME } from "../constants";
export { isSupportedLocation } from "./page";

const PLAYER_HOST_SELECTORS = [
  "#bilibili-player",
  ".bpx-player-container",
  ".bpx-player-video-area",
  ".player-container",
  ".bili-video-player"
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
  console.debug(`[${SCRIPT_NAME}] ${message}`, ...extra);
}
