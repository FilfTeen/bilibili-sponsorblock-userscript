import { describe, expect, it } from "vitest";
import { inferLocalVideoSignal } from "../src/utils/local-video-signal";

describe("local video signal", () => {
  it("detects exclusive-access wording from title text", () => {
    document.body.innerHTML = `
      <div class="video-desc-container">这是一次抢先体验，不是正式零售版。</div>
      <div class="video-tag-container">
        <a class="tag-link">首发</a>
      </div>
    `;

    const signal = inferLocalVideoSignal({
      title: "【首发】某新品上手体验"
    });

    expect(signal).toMatchObject({
      category: "exclusive_access",
      source: "page-heuristic"
    });
  });

  it("detects sponsor wording from page description text", () => {
    document.body.innerHTML = `
      <div class="video-desc-container">本期视频由品牌合作支持，评论区置顶有优惠券和购买链接。</div>
    `;

    const signal = inferLocalVideoSignal({
      title: "某产品体验"
    });

    expect(signal).toMatchObject({
      category: "sponsor",
      source: "page-heuristic"
    });
  });

  it("does not classify title-only weak partnership wording as sponsor", () => {
    document.body.innerHTML = "";

    const signal = inferLocalVideoSignal({
      title: "某品牌合作活动记录"
    });

    expect(signal).toBeNull();
  });

  it("keeps ordinary review copy with disclaimer out of sponsor classification", () => {
    document.body.innerHTML = `
      <div class="video-desc-container">本期非商单，自费购买，主要分享一周使用感受，没有购买链接。</div>
      <div class="video-tag-container">
        <a class="tag-link">测评</a>
      </div>
    `;

    const signal = inferLocalVideoSignal({
      title: "这台机器值不值得买"
    });

    expect(signal).toBeNull();
  });

  it("keeps ordinary event coverage out of sponsor classification", () => {
    document.body.innerHTML = `
      <div class="video-desc-container">发布会现场体验和新品解析，没有购买链接。</div>
      <div class="video-tag-container">
        <a class="tag-link">活动记录</a>
      </div>
    `;

    const signal = inferLocalVideoSignal({
      title: "某品牌发布会现场体验"
    });

    expect(signal).toBeNull();
  });

  it("keeps borrow-and-try copy conservative when early-access evidence is incomplete", () => {
    document.body.innerHTML = `
      <div class="video-desc-container">借测体验一天，说说优缺点，没有购买引导。</div>
    `;

    const signal = inferLocalVideoSignal({
      title: "新机借测体验"
    });

    expect(signal).toBeNull();
  });
});
