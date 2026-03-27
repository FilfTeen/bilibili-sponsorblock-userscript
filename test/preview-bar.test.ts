import { describe, expect, it } from "vitest";
import { PreviewBar } from "../src/ui/preview-bar";
import type { SegmentRecord } from "../src/types";

describe("preview bar", () => {
  it("renders overlay bars into the player progress areas", () => {
    document.body.innerHTML = `
      <div class="bpx-player-control-wrap">
        <div class="bpx-player-progress-area">
          <div class="bpx-player-progress-wrap"></div>
        </div>
        <div class="bpx-player-shadow-progress-area"></div>
      </div>
      <div class="bpx-player-container">
        <video></video>
      </div>
    `;

    const video = document.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(video, "duration", {
      configurable: true,
      value: 100
    });

    const previewBar = new PreviewBar();
    previewBar.bind(video);
    previewBar.setSegments([
      {
        UUID: "segment-1",
        category: "sponsor",
        actionType: "skip",
        segment: [10, 20],
        start: 10,
        end: 20,
        duration: 10,
        mode: "auto"
      } as SegmentRecord
    ]);

    expect(document.querySelectorAll("#previewbar .previewbar").length).toBe(1);
    expect(document.querySelectorAll("#shadowPreviewbar .previewbar").length).toBe(1);
  });

  it("re-resolves progress parents when they appear after the initial bind", () => {
    document.body.innerHTML = `
      <div class="bpx-player-container">
        <video></video>
      </div>
    `;

    const video = document.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(video, "duration", {
      configurable: true,
      value: 100
    });

    const previewBar = new PreviewBar();
    previewBar.bind(video);

    const controls = document.createElement("div");
    controls.className = "bpx-player-control-wrap";
    controls.innerHTML = `
      <div class="bpx-player-progress-wrap"></div>
      <div class="bpx-player-shadow-progress-area"></div>
    `;
    document.body.appendChild(controls);

    previewBar.bind(video);
    previewBar.setSegments([
      {
        UUID: "segment-2",
        category: "sponsor",
        actionType: "skip",
        segment: [5, 10],
        start: 5,
        end: 10,
        duration: 5,
        mode: "auto"
      } as SegmentRecord
    ]);

    expect(document.querySelectorAll("#previewbar .previewbar").length).toBe(1);
  });
});
