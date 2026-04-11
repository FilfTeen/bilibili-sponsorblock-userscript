import { afterEach, describe, expect, it, vi } from "vitest";
import { cloneDefaultConfig, ConfigStore } from "../src/core/config-store";
import {
  CommentSponsorController,
  LOCAL_VIDEO_FEEDBACK_AVAILABILITY_EVENT,
  VIDEO_SIGNAL_FEEDBACK_EVENT,
  classifyCommentRenderer,
  extractCommentLocation,
  commentMatchToVideoSignal,
  extractCommentText,
  hasSponsoredGoodsLink,
  resolveCommentRendererLocation,
  resolveVueCommentLocation,
  scanCurrentPageCommentSignal
} from "../src/features/comment-filter";
import { COMMENT_RECOGNITION_SAMPLES } from "./fixtures/recognition-samples";

function createCommentRenderer(
  withGoods = true,
  text = "普通评论",
  options: {
    location?: string | null;
    legacyLocationText?: string | null;
  } = {}
): HTMLElement {
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
  const pubdate = document.createElement("div");
  pubdate.id = "pubdate";
  pubdate.textContent = "17天前发布";
  const reply = document.createElement("button");
  reply.id = "reply";
  reply.textContent = "回复";
  actionsRoot.append(pubdate, reply);
  main.appendChild(actions);

  rendererRoot.append(userInfo, richText, content, main);
  Reflect.set(renderer, "data", {
    reply_control: options.location ? { location: options.location } : {}
  });
  if (options.legacyLocationText) {
    const legacy = document.createElement("div");
    legacy.id = "location";
    legacy.textContent = options.legacyLocationText;
    actionsRoot.appendChild(legacy);
  }
  return renderer;
}

function createThread(renderer: HTMLElement): HTMLElement {
  const thread = document.createElement("bili-comment-thread-renderer");
  const threadRoot = thread.attachShadow({ mode: "open" });
  threadRoot.appendChild(renderer);
  return thread;
}

function createFlatReplyRenderer(
  withGoods = true,
  text = "普通回复",
  options: {
    location?: string | null;
    legacyLocationText?: string | null;
  } = {}
): HTMLElement {
  const reply = document.createElement("bili-comment-reply-renderer");
  const replyRoot = reply.attachShadow({ mode: "open" });

  const body = document.createElement("div");
  body.id = "body";

  const main = document.createElement("div");
  main.id = "main";

  const userInfo = document.createElement("bili-comment-user-info");
  const userInfoRoot = userInfo.attachShadow({ mode: "open" });
  const userAnchor = document.createElement("span");
  userAnchor.id = "user-up";
  userAnchor.textContent = "回复用户";
  userInfoRoot.appendChild(userAnchor);

  const richText = document.createElement("bili-rich-text");
  const richRoot = richText.attachShadow({ mode: "open" });
  const textNode = document.createElement("span");
  textNode.textContent = text;
  richRoot.appendChild(textNode);
  if (withGoods) {
    const goods = document.createElement("a");
    goods.setAttribute("data-type", "goods");
    goods.textContent = "商品卡";
    richRoot.appendChild(goods);
  }

  main.append(userInfo, richText);

  const footer = document.createElement("div");
  footer.id = "footer";
  const actions = document.createElement("bili-comment-action-buttons-renderer");
  const actionsRoot = actions.attachShadow({ mode: "open" });
  const pubdate = document.createElement("div");
  pubdate.id = "pubdate";
  pubdate.textContent = "1天前";
  const replyButton = document.createElement("button");
  replyButton.id = "reply";
  replyButton.textContent = "回复";
  actionsRoot.append(pubdate, replyButton);
  if (options.legacyLocationText) {
    const legacy = document.createElement("div");
    legacy.id = "location";
    legacy.textContent = options.legacyLocationText;
    actionsRoot.appendChild(legacy);
  }
  footer.appendChild(actions);

  body.append(main, footer);
  replyRoot.appendChild(body);
  Reflect.set(reply, "data", {
    reply_control: options.location ? { location: options.location } : {}
  });
  return reply;
}

function getMainActionRoot(rootShadow: ShadowRoot): ShadowRoot | null {
  return rootShadow
    .querySelector("bili-comment-thread-renderer")
    ?.shadowRoot?.querySelector("bili-comment-renderer")
    ?.shadowRoot?.querySelector("#main")
    ?.querySelector("bili-comment-action-buttons-renderer")
    ?.shadowRoot ?? null;
}

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
  history.replaceState({}, "", "https://www.bilibili.com/");
});

describe("comment filter", () => {
  it("detects comment goods links", () => {
    expect(hasSponsoredGoodsLink(createCommentRenderer(true) as HTMLElement & { shadowRoot: ShadowRoot })).toBe(true);
  });

  it("normalizes comment locations from reply payloads", () => {
    expect(extractCommentLocation({ reply_control: { location: "江苏" } })).toBe("IP属地：江苏");
    expect(extractCommentLocation({ reply_control: { location: "IP属地：上海" } })).toBe("IP属地：上海");
  });

  it("ignores normal comment links", () => {
    expect(hasSponsoredGoodsLink(createCommentRenderer(false) as HTMLElement & { shadowRoot: ShadowRoot })).toBe(false);
  });

  it("extracts text from the rich text shadow root", () => {
    expect(extractCommentText(createCommentRenderer(false, "点评论区置顶领取优惠券") as HTMLElement & { shadowRoot: ShadowRoot })).toContain(
      "点评论区置顶领取优惠券"
    );
  });

  it("classifies suspicious promo text", () => {
    const match = classifyCommentRenderer(createCommentRenderer(false, "点评论区置顶领取优惠券") as HTMLElement & { shadowRoot: ShadowRoot }, {
      dynamicRegexPattern: "/评论区|优惠券/gi",
      dynamicRegexKeywordMinMatches: 1
    });

    expect(match).toEqual({
      reason: "suspicion",
      category: "sponsor",
      matches: ["评论区", "优惠券"]
    });
  });

  it("ignores benign ad-adjacent discussion", () => {
    const match = classifyCommentRenderer(
      createCommentRenderer(false, "这条评论在讨论广告学课程和推广大使的区别") as HTMLElement & { shadowRoot: ShadowRoot },
      {
        dynamicRegexPattern: "/广告|课程|推广/gi",
        dynamicRegexKeywordMinMatches: 1
      }
    );

    expect(match).toBeNull();
  });

  it("does not treat mocked quoted promo copy as a real sponsor comment", () => {
    const match = classifyCommentRenderer(
      createCommentRenderer(false, "笑死，这条“点评论区置顶领取优惠券”的广告话术也太土了") as HTMLElement & { shadowRoot: ShadowRoot },
      {
        dynamicRegexPattern: "/评论区|优惠券|广告/gi",
        dynamicRegexKeywordMinMatches: 1
      }
    );

    expect(match).toBeNull();
  });

  it("upgrades invitation-style promo comments to sponsor signals", () => {
    const match = classifyCommentRenderer(
      createCommentRenderer(false, "感谢点赞！上期好物推荐里我还有几个邀请码") as HTMLElement & { shadowRoot: ShadowRoot },
      {
        dynamicRegexPattern: "/好物推荐|邀请码/gi",
        dynamicRegexKeywordMinMatches: 1
      }
    );

    expect(match).toEqual({
      reason: "suspicion",
      category: "sponsor",
      matches: ["好物推荐", "邀请码"]
    });
    expect(commentMatchToVideoSignal(match!)).toMatchObject({
      category: "sponsor",
      source: "comment-suspicion"
    });
  });

  it("scans the current page comments for a reusable video-level local signal", () => {
    const root = document.createElement("bili-comments");
    const rootShadow = root.attachShadow({ mode: "open" });
    document.body.appendChild(root);
    rootShadow.appendChild(createThread(createCommentRenderer(false, "感谢点赞！上期好物推荐里我还有几个邀请码") as HTMLElement));

    const signal = scanCurrentPageCommentSignal({
      dynamicRegexPattern: "/好物推荐|邀请码/gi",
      dynamicRegexKeywordMinMatches: 1
    });

    expect(signal).toMatchObject({
      category: "sponsor",
      source: "comment-suspicion"
    });
  });

  it("evaluates the approved shared comment corpus", () => {
    const approvedSamples = COMMENT_RECOGNITION_SAMPLES.filter((sample) => sample.humanVerdict === "confirmed");
    const results = approvedSamples.map((sample) =>
      classifyCommentRenderer(createCommentRenderer(Boolean(sample.input.hasGoodsLink), sample.input.text) as HTMLElement & { shadowRoot: ShadowRoot }, {
        dynamicRegexPattern: sample.input.regexPattern ?? "/评论区|优惠券|广告|推广|好物推荐|邀请码|主页|店铺|橱窗/gi",
        dynamicRegexKeywordMinMatches: sample.input.regexKeywordMinMatches ?? 1
      })?.category ?? null
    );

    expect(results).toEqual(["sponsor", "sponsor", "selfpromo", null, null, "sponsor"]);
  });

  it("reads comment locations from renderer data before legacy DOM fallbacks", () => {
    const renderer = createCommentRenderer(false, "普通评论", {
      location: "浙江",
      legacyLocationText: "IP属地：北京"
    }) as HTMLElement & { shadowRoot: ShadowRoot };

    expect(resolveCommentRendererLocation(renderer)).toBe("IP属地：浙江");
  });

  it("falls back to legacy location DOM when renderer data is absent", () => {
    const renderer = createCommentRenderer(false, "普通评论", {
      legacyLocationText: "IP属地：山东"
    }) as HTMLElement & { shadowRoot: ShadowRoot };

    expect(resolveCommentRendererLocation(renderer)).toBe("IP属地：山东");
  });

  it("processes comment threads after a delayed re-scan", async () => {
    const configStore = new ConfigStore();
    const controller = new CommentSponsorController(configStore);
    Reflect.set(controller, "currentConfig", {
      ...cloneDefaultConfig(),
      commentFilterMode: "hide"
    });
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
        ?.shadowRoot?.querySelector("bili-comment-user-info")
        ?.shadowRoot?.querySelector("style[data-bsb-inline-feedback-style='true']")
    ).toBeTruthy();
    expect(
      thread.shadowRoot
        ?.querySelector("bili-comment-renderer")
        ?.shadowRoot?.querySelector("bili-comment-user-info")
        ?.shadowRoot?.querySelector("[data-bsb-comment-badge='true']")
        ?.classList.contains("bsb-tm-inline-chip")
    ).toBe(true);
    expect(
      thread.shadowRoot
        ?.querySelector("bili-comment-renderer")
        ?.shadowRoot?.querySelector("#main")
        ?.querySelector("bili-comment-action-buttons-renderer")
        ?.shadowRoot?.querySelector("[data-bsb-comment-toggle='true']")
    ).toBeTruthy();
    expect(
      thread.shadowRoot
        ?.querySelector("bili-comment-renderer")
        ?.shadowRoot?.querySelector("#main")
        ?.querySelector("bili-comment-action-buttons-renderer")
        ?.shadowRoot?.querySelector<HTMLButtonElement>("[data-bsb-comment-toggle='true']")?.textContent
    ).toBe("显示评论内容");
  });

  it("processes sponsored reply renderers", () => {
    const configStore = new ConfigStore();
    const controller = new CommentSponsorController(configStore);
    Reflect.set(controller, "currentConfig", {
      ...cloneDefaultConfig(),
      commentFilterMode: "hide"
    });
    window.history.replaceState({}, "", "/video/BV1xx411c7mD");

    const root = document.createElement("bili-comments");
    const rootShadow = root.attachShadow({ mode: "open" });
    document.body.appendChild(root);

    const thread = createThread(createCommentRenderer(false, "正常主评论"));
    const repliesRenderer = document.createElement("bili-comment-replies-renderer");
    const repliesRoot = repliesRenderer.attachShadow({ mode: "open" });
    const reply = document.createElement("bili-comment-reply-renderer");
    const replyRoot = reply.attachShadow({ mode: "open" });
    replyRoot.appendChild(createCommentRenderer(true, "回复里的商品广告"));
    repliesRoot.appendChild(reply);
    thread.shadowRoot?.appendChild(repliesRenderer);
    rootShadow.appendChild(thread);

    const refresh = Reflect.get(controller, "refresh") as () => void;
    refresh.call(controller);

    expect(reply.getAttribute("data-bsb-comment-reply-processed")).toBe("true");
    expect(
      reply.shadowRoot
        ?.querySelector("bili-comment-renderer")
        ?.shadowRoot?.querySelector("#main")
        ?.querySelector("bili-comment-action-buttons-renderer")
        ?.shadowRoot?.querySelector("[data-bsb-comment-toggle='true']")
    ).toBeTruthy();
  });

  it("processes flat reply renderers used by the current elements comment tree", () => {
    const configStore = new ConfigStore();
    const controller = new CommentSponsorController(configStore);
    Reflect.set(controller, "currentConfig", {
      ...cloneDefaultConfig(),
      commentFilterMode: "hide",
      commentLocationEnabled: true
    });
    window.history.replaceState({}, "", "/video/BV1xx411c7mD");

    const root = document.createElement("bili-comments");
    const rootShadow = root.attachShadow({ mode: "open" });
    document.body.appendChild(root);

    const thread = createThread(createCommentRenderer(false, "正常主评论"));
    const repliesRenderer = document.createElement("bili-comment-replies-renderer");
    const repliesRoot = repliesRenderer.attachShadow({ mode: "open" });
    const reply = createFlatReplyRenderer(true, "回复里的商品广告", { location: "山东" });
    repliesRoot.appendChild(reply);
    thread.shadowRoot?.appendChild(repliesRenderer);
    rootShadow.appendChild(thread);

    const refresh = Reflect.get(controller, "refresh") as () => void;
    refresh.call(controller);

    const actionRoot = reply.shadowRoot
      ?.querySelector("bili-comment-action-buttons-renderer")
      ?.shadowRoot;
    expect(reply.getAttribute("data-bsb-comment-reply-processed")).toBe("true");
    expect(actionRoot?.querySelector("[data-bsb-comment-toggle='true']")).toBeTruthy();
    expect(actionRoot?.querySelector("[data-bsb-comment-location='true']")?.textContent).toBe("IP属地：山东");
  });

  it("injects comment locations for elements comments even when filtering is off", () => {
    const configStore = new ConfigStore();
    const controller = new CommentSponsorController(configStore);
    Reflect.set(controller, "currentConfig", {
      ...cloneDefaultConfig(),
      commentFilterMode: "off",
      commentLocationEnabled: true
    });
    window.history.replaceState({}, "", "/video/BV1xx411c7mD");

    const root = document.createElement("bili-comments");
    const rootShadow = root.attachShadow({ mode: "open" });
    document.body.appendChild(root);
    rootShadow.appendChild(createThread(createCommentRenderer(false, "普通评论", { location: "四川" }) as HTMLElement));

    const refresh = Reflect.get(controller, "refresh") as () => void;
    refresh.call(controller);

    const location = getMainActionRoot(rootShadow)?.querySelector<HTMLElement>("[data-bsb-comment-location='true']");
    expect(location?.textContent).toBe("IP属地：四川");
  });

  it("deduplicates legacy elements location nodes", () => {
    const configStore = new ConfigStore();
    const controller = new CommentSponsorController(configStore);
    Reflect.set(controller, "currentConfig", {
      ...cloneDefaultConfig(),
      commentFilterMode: "off",
      commentLocationEnabled: true
    });
    window.history.replaceState({}, "", "/video/BV1xx411c7mD");

    const root = document.createElement("bili-comments");
    const rootShadow = root.attachShadow({ mode: "open" });
    document.body.appendChild(root);
    rootShadow.appendChild(
      createThread(createCommentRenderer(false, "普通评论", { legacyLocationText: "IP属地：广东" }) as HTMLElement)
    );

    const refresh = Reflect.get(controller, "refresh") as () => void;
    refresh.call(controller);

    const actionRoot = getMainActionRoot(rootShadow);
    expect(actionRoot?.querySelectorAll("#location").length).toBe(0);
    expect(actionRoot?.querySelectorAll("[data-bsb-comment-location='true']").length).toBe(1);
  });

  it("injects vue-style comment locations beside reply time nodes", () => {
    const configStore = new ConfigStore();
    const controller = new CommentSponsorController(configStore);
    Reflect.set(controller, "currentConfig", {
      ...cloneDefaultConfig(),
      commentFilterMode: "off",
      commentLocationEnabled: true
    });
    window.history.replaceState({}, "", "/video/BV1xx411c7mD");

    const browserPc = document.createElement("div");
    browserPc.className = "browser-pc";
    const replyItem = document.createElement("div");
    replyItem.className = "reply-item";
    const replyTime = document.createElement("span");
    replyTime.className = "reply-time";
    replyTime.textContent = "17天前";
    Reflect.set(replyTime, "__vueParentComponent", {
      props: {
        reply: {
          reply_control: {
            location: "IP属地：湖北"
          }
        }
      }
    });
    replyItem.appendChild(replyTime);
    browserPc.appendChild(replyItem);
    document.body.appendChild(browserPc);

    const refresh = Reflect.get(controller, "refresh") as () => void;
    refresh.call(controller);

    expect(resolveVueCommentLocation(replyTime)).toBe("IP属地：湖北");
    expect(replyItem.querySelector("[data-bsb-comment-location='true']")?.textContent).toBe("IP属地：湖北");
  });

  it("shows comment feedback buttons only when local feedback is enabled", async () => {
    history.replaceState({}, "", "https://www.bilibili.com/video/BV1xx411c7mP");

    const root = document.createElement("bili-comments");
    const rootShadow = root.attachShadow({ mode: "open" });
    document.body.appendChild(root);
    rootShadow.appendChild(createThread(createCommentRenderer(false, "点评论区置顶领取优惠券") as HTMLElement));

    const controller = new CommentSponsorController(new ConfigStore());
    Reflect.get(controller, "handleFeedbackAvailability").call(
      controller,
      new CustomEvent(LOCAL_VIDEO_FEEDBACK_AVAILABILITY_EVENT, {
        detail: { enabled: true }
      })
    );
    Reflect.get(controller, "refresh").call(controller);

    const actionRoot = getMainActionRoot(rootShadow);
    expect(actionRoot?.textContent).toContain("保留此视频标签");
    expect(actionRoot?.textContent).toContain("忽略此视频");
  });

  it("dispatches structured feedback from the inserted comment actions", async () => {
    history.replaceState({}, "", "https://www.bilibili.com/video/BV1xx411c7mQ");

    const root = document.createElement("bili-comments");
    const rootShadow = root.attachShadow({ mode: "open" });
    document.body.appendChild(root);
    rootShadow.appendChild(createThread(createCommentRenderer(false, "点评论区置顶领取优惠券") as HTMLElement));

    const eventSpy = vi.fn();
    window.addEventListener(VIDEO_SIGNAL_FEEDBACK_EVENT, eventSpy as EventListener);

    const controller = new CommentSponsorController(new ConfigStore());
    Reflect.get(controller, "handleFeedbackAvailability").call(
      controller,
      new CustomEvent(LOCAL_VIDEO_FEEDBACK_AVAILABILITY_EVENT, {
        detail: { enabled: true }
      })
    );
    Reflect.get(controller, "refresh").call(controller);

    const actionRoot = getMainActionRoot(rootShadow);
    const keepButton = Array.from(actionRoot?.querySelectorAll<HTMLButtonElement>("button") ?? []).find((button) =>
      button.textContent?.includes("保留此视频标签")
    );
    keepButton?.click();

    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect((eventSpy.mock.calls[0]?.[0] as CustomEvent).detail).toMatchObject({
      decision: "confirm",
      category: "sponsor",
      source: "comment-suspicion"
    });

    window.removeEventListener(VIDEO_SIGNAL_FEEDBACK_EVENT, eventSpy as EventListener);
  });
});
