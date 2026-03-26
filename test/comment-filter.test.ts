import { describe, expect, it } from "vitest";
import { ConfigStore } from "../src/core/config-store";
import {
  CommentSponsorController,
  classifyCommentRenderer,
  hasSponsoredGoodsLink
} from "../src/features/comment-filter";

function createCommentRenderer(withGoods = true, text = "普通评论"): HTMLElement {
  const renderer = document.createElement("bili-comment-renderer");
  const rendererRoot = renderer.attachShadow({ mode: "open" });
  const richText = document.createElement("bili-rich-text");
  const richRoot = richText.attachShadow({ mode: "open" });
  const textNode = document.createElement("span");
  textNode.textContent = text;
  richRoot.appendChild(textNode);
  if (withGoods) {
    const link = document.createElement("a");
    link.textContent = "商品卡";
    link.setAttribute("data-type", "goods");
    richRoot.appendChild(link);
  }

  const userInfo = document.createElement("bili-comment-user-info");
  const userInfoRoot = userInfo.attachShadow({ mode: "open" });
  const userAnchor = document.createElement("span");
  userAnchor.id = "user-up";
  userAnchor.textContent = "UP";
  userInfoRoot.appendChild(userAnchor);

  const content = document.createElement("div");
  content.id = "content";
  content.textContent = text;

  const main = document.createElement("div");
  main.id = "main";
  const actions = document.createElement("bili-comment-action-buttons-renderer");
  const actionsRoot = actions.attachShadow({ mode: "open" });
  const reply = document.createElement("button");
  reply.id = "reply";
  reply.textContent = "回复";
  actionsRoot.appendChild(reply);
  main.appendChild(actions);

  rendererRoot.append(userInfo, richText, content, main);
  return renderer;
}

function createThread(renderer: HTMLElement): HTMLElement {
  const thread = document.createElement("bili-comment-thread-renderer");
  const threadRoot = thread.attachShadow({ mode: "open" });
  threadRoot.appendChild(renderer);
  return thread;
}

describe("comment filter", () => {
  it("detects comment goods links", () => {
    expect(hasSponsoredGoodsLink(createCommentRenderer(true) as HTMLElement & { shadowRoot: ShadowRoot })).toBe(true);
  });

  it("ignores normal comment links", () => {
    expect(hasSponsoredGoodsLink(createCommentRenderer(false) as HTMLElement & { shadowRoot: ShadowRoot })).toBe(false);
  });

  it("classifies suspicious promo text", () => {
    const match = classifyCommentRenderer(createCommentRenderer(false, "点评论区置顶领取优惠券") as HTMLElement & { shadowRoot: ShadowRoot }, {
      dynamicRegexPattern: "/评论区|优惠券/gi",
      dynamicRegexKeywordMinMatches: 1
    });

    expect(match).toEqual({
      reason: "suspicion",
      matches: ["评论区", "优惠券"]
    });
  });

  it("processes comment threads after a delayed re-scan", async () => {
    const configStore = new ConfigStore();
    const controller = new CommentSponsorController(configStore);
    window.history.replaceState({}, "", "/video/BV1xx411c7mD");

    const root = document.createElement("bili-comments");
    const rootShadow = root.attachShadow({ mode: "open" });
    document.body.appendChild(root);

    const refresh = Reflect.get(controller, "refresh") as () => void;
    refresh.call(controller);

    const thread = createThread(createCommentRenderer(true, "点评论区置顶领取优惠券"));
    rootShadow.appendChild(thread);
    refresh.call(controller);

    expect(thread.getAttribute("data-bsb-comment-processed")).toBe("true");
    expect(
      thread.shadowRoot
        ?.querySelector("bili-comment-renderer")
        ?.shadowRoot?.querySelector("#main")
        ?.querySelector("bili-comment-action-buttons-renderer")
        ?.shadowRoot?.querySelector("[data-bsb-comment-toggle='true']")
    ).toBeTruthy();
  });
});
