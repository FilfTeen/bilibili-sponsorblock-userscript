import { describe, expect, it } from "vitest";
import { classifyDynamicItem } from "../src/features/dynamic-filter";
import { DEFAULT_DYNAMIC_REGEX_PATTERN } from "../src/constants";

describe("dynamic filter classification", () => {
  it("detects direct goods cards", () => {
    const element = document.createElement("div");
    element.innerHTML = `<div class="bili-dyn-card-goods"></div>`;

    expect(
      classifyDynamicItem(element, {
        dynamicRegexPattern: DEFAULT_DYNAMIC_REGEX_PATTERN,
        dynamicRegexKeywordMinMatches: 1
      })?.category
    ).toBe("dynamicSponsor_sponsor");
  });

  it("detects regex-based suspicious promo copy", () => {
    const element = document.createElement("div");
    element.innerHTML = `<div class="bili-rich-text__content"><span>点评论区置顶领取优惠券</span></div>`;

    const result = classifyDynamicItem(element, {
      dynamicRegexPattern: DEFAULT_DYNAMIC_REGEX_PATTERN,
      dynamicRegexKeywordMinMatches: 1
    });

    expect(result?.category).toBe("dynamicSponsor_suspicion_sponsor");
    expect(result?.matches.length).toBeGreaterThan(0);
  });
});
