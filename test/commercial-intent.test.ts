import { describe, expect, it } from "vitest";
import { analyzeCommercialIntent } from "../src/utils/commercial-intent";

describe("commercial intent analysis", () => {
  it("prefers sponsor classification for explicit commercial CTA copy", () => {
    const result = analyzeCommercialIntent("本期视频由品牌合作支持，点评论区置顶领取优惠券和购买链接", {
      storedMatches: ["评论区", "优惠券", "购买链接"],
      minMatches: 1
    });

    expect(result.category).toBe("sponsor");
    expect(result.matches).toContain("赞助");
  });

  it("prefers exclusive-access when the text is clearly about early access", () => {
    const result = analyzeCommercialIntent("首发抢先体验，新机工程机上手，提前体验版本仅供展示");

    expect(result.category).toBe("exclusive_access");
  });

  it("filters benign marketing-adjacent discussion", () => {
    const result = analyzeCommercialIntent("这条内容在讨论广告学课程、推广曲和推广大使的案例", {
      storedMatches: ["广告", "课程", "推广"],
      minMatches: 1
    });

    expect(result.category).toBeNull();
  });
});
