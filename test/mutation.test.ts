import { describe, expect, it } from "vitest";
import { mutationsTouchSelectors } from "../src/utils/mutation";

describe("mutation selector detection", () => {
  it("ignores injected script decorations", () => {
    const badge = document.createElement("div");
    badge.setAttribute("data-bsb-dynamic-badge", "true");

    expect(mutationsTouchSelectors([{ addedNodes: [badge], removedNodes: [] }], [".bili-dyn-item"], ["[data-bsb-dynamic-badge]"])).toBe(
      false
    );
  });

  it("detects text insertion under a relevant subtree", () => {
    const item = document.createElement("div");
    item.className = "bili-dyn-item";
    const textNode = document.createTextNode("点评论区置顶领取优惠券");
    item.appendChild(textNode);

    expect(mutationsTouchSelectors([{ addedNodes: [textNode], removedNodes: [] }], [".bili-dyn-item"])).toBe(true);
  });
});
