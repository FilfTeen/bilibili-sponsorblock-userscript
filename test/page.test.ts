import { describe, expect, it } from "vitest";
import {
  detectPageType,
  isCompactVideoHeaderSuppressed,
  supportsCommentFilters,
  supportsCompactVideoHeader,
  supportsDynamicFilters,
  supportsVideoFeatures
} from "../src/utils/page";

describe("page detection", () => {
  it("detects main, dynamic and video style pages", () => {
    expect(detectPageType("https://www.bilibili.com/")).toBe("main");
    expect(detectPageType("https://www.bilibili.com/account/history")).toBe("history");
    expect(detectPageType("https://www.bilibili.com/history?spm_id_from=333.1007.0.0")).toBe("history");
    expect(detectPageType("https://www.bilibili.com/video/BV1xx411c7mD")).toBe("video");
    expect(detectPageType("https://www.bilibili.com/medialist/play/ml123")).toBe("list");
    expect(detectPageType("https://t.bilibili.com/123456")).toBe("dynamic");
    expect(detectPageType("https://space.bilibili.com/1")).toBe("channel");
  });

  it("maps feature support by page type", () => {
    expect(supportsVideoFeatures("https://www.bilibili.com/video/BV1xx411c7mD")).toBe(true);
    expect(supportsVideoFeatures("https://www.bilibili.com/opus/123")).toBe(true);
    expect(supportsVideoFeatures("https://www.bilibili.com/")).toBe(false);
    expect(supportsDynamicFilters("https://www.bilibili.com/")).toBe(true);
    expect(supportsCommentFilters("https://www.bilibili.com/opus/123")).toBe(true);
  });

  it("supports the compact video header on video-like pages", () => {
    expect(supportsCompactVideoHeader("https://www.bilibili.com/video/BV1xx411c7mD")).toBe(true);
    expect(supportsCompactVideoHeader("https://www.bilibili.com/bangumi/play/ep123456")).toBe(true);
    expect(supportsCompactVideoHeader("https://www.bilibili.com/bangumi/play/ss12345")).toBe(true);
    expect(supportsCompactVideoHeader("https://www.bilibili.com/opus/123")).toBe(true);
  });

  it("suppresses the compact video header while the player is in web fullscreen", () => {
    const doc = document.implementation.createHTMLDocument("fullscreen");
    expect(isCompactVideoHeaderSuppressed(doc)).toBe(false);

    const player = doc.createElement("div");
    player.className = "bpx-state-webfull";
    doc.body.appendChild(player);

    expect(isCompactVideoHeaderSuppressed(doc)).toBe(true);
  });
});
