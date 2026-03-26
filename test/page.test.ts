import { describe, expect, it } from "vitest";
import { detectPageType, supportsCommentFilters, supportsDynamicFilters, supportsVideoFeatures } from "../src/utils/page";

describe("page detection", () => {
  it("detects main, dynamic and video style pages", () => {
    expect(detectPageType("https://www.bilibili.com/")).toBe("main");
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
});
