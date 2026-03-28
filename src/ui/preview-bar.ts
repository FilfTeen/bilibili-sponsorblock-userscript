import type { CategoryColorOverrides, SegmentRecord } from "../types";
import { resolveCategoryAccent } from "../utils/color";

type PreviewParents = {
  main: HTMLElement;
  shadow: HTMLElement;
};

function resolvePreviewParents(video: HTMLVideoElement | null): PreviewParents | null {
  const scope = video?.closest(".bpx-player-control-wrap, .bpx-player-control-entity") ?? document;
  const main =
    scope.querySelector<HTMLElement>(".bpx-player-progress") ??
    scope.querySelector<HTMLElement>(".bpx-player-progress-wrap");
  const shadow =
    scope.querySelector<HTMLElement>(".bpx-player-shadow-progress-area") ??
    scope.querySelector<HTMLElement>(".bpx-player-progress") ??
    scope.querySelector<HTMLElement>(".bpx-player-progress-wrap");

  if (!main || !shadow) {
    return null;
  }

  return { main, shadow };
}

function createContainer(id: string): HTMLUListElement {
  const container = document.createElement("ul");
  container.id = id;
  return container;
}

export class PreviewBar {
  private readonly mainContainer = createContainer("previewbar");
  private readonly shadowContainer = createContainer("shadowPreviewbar");
  private boundVideo: HTMLVideoElement | null = null;
  private boundParents: PreviewParents | null = null;
  private segments: SegmentRecord[] = [];
  private enabled = true;
  private categoryColorOverrides: CategoryColorOverrides = {};
  private readonly handleDurationChange = () => {
    this.render();
  };

  bind(video: HTMLVideoElement | null): void {
    if (this.boundVideo === video) {
      if (!this.boundParents || !this.boundParents.main.isConnected || !this.boundParents.shadow.isConnected) {
        this.boundParents = resolvePreviewParents(video);
      }
      this.ensureMounted();
      this.render();
      return;
    }

    this.unbind();
    this.boundVideo = video;
    this.boundParents = resolvePreviewParents(video);
    if (!this.boundVideo) {
      return;
    }

    this.boundVideo.addEventListener("loadedmetadata", this.handleDurationChange);
    this.boundVideo.addEventListener("durationchange", this.handleDurationChange);
    this.ensureMounted();
    this.render();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.render();
  }

  setCategoryColorOverrides(overrides: CategoryColorOverrides): void {
    this.categoryColorOverrides = { ...overrides };
    this.render();
  }

  setSegments(segments: SegmentRecord[]): void {
    this.segments = segments.filter((segment) => segment.actionType !== "full");
    this.render();
  }

  clear(): void {
    this.segments = [];
    this.render();
  }

  destroy(): void {
    this.unbind();
    this.mainContainer.remove();
    this.shadowContainer.remove();
  }

  private unbind(): void {
    if (this.boundVideo) {
      this.boundVideo.removeEventListener("loadedmetadata", this.handleDurationChange);
      this.boundVideo.removeEventListener("durationchange", this.handleDurationChange);
    }
    this.boundVideo = null;
    this.boundParents = null;
  }

  private ensureMounted(): void {
    if (!this.boundParents) {
      return;
    }

    if (getComputedStyle(this.boundParents.main).position === "static") {
      this.boundParents.main.style.position = "relative";
    }
    if (getComputedStyle(this.boundParents.shadow).position === "static") {
      this.boundParents.shadow.style.position = "relative";
    }

    if (this.mainContainer.parentElement !== this.boundParents.main) {
      this.boundParents.main.prepend(this.mainContainer);
    }
    if (this.shadowContainer.parentElement !== this.boundParents.shadow) {
      this.boundParents.shadow.prepend(this.shadowContainer);
    }
  }

  private render(): void {
    this.mainContainer.replaceChildren();
    this.shadowContainer.replaceChildren();

    if (!this.enabled || !this.boundVideo || !this.boundParents) {
      return;
    }

    this.ensureMounted();

    const duration = Number.isFinite(this.boundVideo.duration) ? this.boundVideo.duration : 0;
    if (duration <= 0) {
      return;
    }

    const segments = [...this.segments].sort((left, right) => {
      const leftDuration = (left.end ?? left.start) - left.start;
      const rightDuration = (right.end ?? right.start) - right.start;
      return rightDuration - leftDuration;
    });

    for (const segment of segments) {
      const bar = this.createBar(segment, duration);
      if (!bar) {
        continue;
      }

      this.mainContainer.appendChild(bar);
      this.shadowContainer.appendChild(bar.cloneNode(true));
    }
  }

  private createBar(segment: SegmentRecord, duration: number): HTMLLIElement | null {
    const start = Math.max(0, Math.min(duration, segment.start));
    const end =
      segment.actionType === "poi"
        ? Math.min(duration, start + Math.max(0.6, duration * 0.0025))
        : Math.max(start, Math.min(duration, segment.end ?? start));

    if (end <= start) {
      return null;
    }

    const bar = document.createElement("li");
    bar.className = "previewbar";
    bar.dataset.category = segment.category;
    bar.dataset.actionType = segment.actionType;
    bar.style.left = `${(start / duration) * 100}%`;
    bar.style.right = `${100 - (end / duration) * 100}%`;
    bar.style.backgroundColor = resolveCategoryAccent(segment.category, this.categoryColorOverrides);
    bar.style.opacity = segment.actionType === "poi" ? "0.9" : "0.7";
    return bar;
  }
}
