import { describe, expect, it } from "vitest";
import { isLikelyPromoText, validateStoredPattern } from "../src/utils/pattern";

describe("promo pattern helpers", () => {
  it("rejects malformed stored regex patterns", () => {
    expect(validateStoredPattern("/(/")).toEqual({
      valid: false,
      error: "正则格式无效"
    });
  });

  it("filters out benign marketing-adjacent phrasing", () => {
    expect(isLikelyPromoText("这期内容在讨论广告学课程和推广大使", ["广告", "课程", "推广"], 1)).toBe(false);
  });

  it("keeps strong sponsor intent copy classified as promo", () => {
    expect(isLikelyPromoText("点评论区置顶领取优惠券", ["评论区", "优惠券"], 1)).toBe(true);
  });
});
