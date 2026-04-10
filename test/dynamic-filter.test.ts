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

  it("avoids false positives for benign marketing-adjacent text", () => {
    const element = document.createElement("div");
    element.innerHTML = `<div class="bili-rich-text__content"><span>这期分享广告学课程的阅读笔记</span></div>`;

    const result = classifyDynamicItem(element, {
      dynamicRegexPattern: "/广告|课程/gi",
      dynamicRegexKeywordMinMatches: 1
    });

    expect(result).toBeNull();
  });

  it("does not classify ordinary event coverage as ad content when no CTA is present", () => {
    const element = document.createElement("div");
    element.innerHTML = `<div class="bili-rich-text__content"><span>某品牌发布会现场体验，主要聊聊新品设计思路，没有购买链接</span></div>`;

    const result = classifyDynamicItem(element, {
      dynamicRegexPattern: "/品牌|发布会|新品|购买链接/gi",
      dynamicRegexKeywordMinMatches: 1
    });

    expect(result).toBeNull();
  });

  it("does not treat mocked quoted promo copy as a real ad dynamic", () => {
    const element = document.createElement("div");
    element.innerHTML = `<div class="bili-rich-text__content"><span>笑死，又来一条“点评论区置顶领取优惠券”的土味文案</span></div>`;

    const result = classifyDynamicItem(element, {
      dynamicRegexPattern: "/评论区|优惠券|文案/gi",
      dynamicRegexKeywordMinMatches: 1
    });

    expect(result).toBeNull();
  });
});
