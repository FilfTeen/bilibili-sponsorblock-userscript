import { afterEach, describe, expect, it, vi } from "vitest";
import { cloneDefaultConfig, ConfigStore } from "../src/core/config-store";
import {
  CommentSponsorController,
  LOCAL_VIDEO_FEEDBACK_AVAILABILITY_EVENT,
  VIDEO_SIGNAL_FEEDBACK_EVENT,
  assessCommentRendererShill,
  classifyCommentRenderer,
  consumeCommentFeedbackToken,
  extractCommentAuthorMid,
  extractCommentLocation,
  commentMatchToVideoSignal,
  extractCommentText,
  hasSponsoredGoodsLink,
  parseCommentAuthorCardResponse,
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
    hasMediaAttachment?: boolean;
    authorMid?: string;
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
  if (options.hasMediaAttachment) {
    const image = document.createElement("img");
    image.alt = "评论晒单图";
    image.src = "https://i0.hdslb.com/bfs/test/order.jpg";
    richRoot.appendChild(image);
  }

  const userInfo = document.createElement("bili-comment-user-info");
  const userInfoRoot = userInfo.attachShadow({ mode: "open" });
  const userAnchor = options.authorMid ? document.createElement("a") : document.createElement("span");
  userAnchor.id = "user-up";
  userAnchor.textContent = "UP";
  if (options.authorMid && userAnchor instanceof HTMLAnchorElement) {
    userAnchor.href = `https://space.bilibili.com/${options.authorMid}`;
  }
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
    reply_control: options.location ? { location: options.location } : {},
    member: options.authorMid ? { mid: options.authorMid } : undefined
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

const zombieLikeProfile = {
  likelyDormant: true,
  vipStatus: 0,
  level: 1,
  follower: 0,
  likeNum: 0,
  archiveCount: 0,
  isSeniorMember: false,
  officialVerifyType: -1,
  evidence: ["非会员", "低等级", "低粉丝", "低获赞", "无投稿", "长UID"]
};

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
  vi.unstubAllGlobals();
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

  it("classifies tool trial links with an explicit experience CTA as sponsor comments", () => {
    const match = classifyCommentRenderer(
      createCommentRenderer(
        false,
        "给大家安利一个做视频的工具:花生!是啊b自己的产品，非常好用，做视频的时候，找素材又快又准，后期的效率那真的是大大提升啊，想在B站做视频，但是时间不够用，或者没怎么学过剪辑的小伙伴，真的可以试一下哦，戳体验 https://www.huasheng.cn/home"
      ) as HTMLElement & { shadowRoot: ShadowRoot },
      {
        dynamicRegexPattern: "/评论区|优惠券|广告|推广|好物推荐|邀请码|主页|店铺|橱窗/gi",
        dynamicRegexKeywordMinMatches: 1
      }
    );

    expect(match).toMatchObject({
      reason: "suspicion",
      category: "sponsor"
    });
  });

  it("classifies screenshot purchase testimonials as suspected shill comments", () => {
    const match = classifyCommentRenderer(
      createCommentRenderer(
        false,
        "我喜欢的吧牛 想买个适合的内裤，感觉up推荐的万力象挺适合我的，下单了，坐等收货",
        { hasMediaAttachment: true }
      ) as HTMLElement & { shadowRoot: ShadowRoot },
      {
        dynamicRegexPattern: "/广告|推广|购买|推荐/gi",
        dynamicRegexKeywordMinMatches: 1
      }
    );

    expect(match).toEqual({
      reason: "shill",
      category: "sponsor",
      matches: expect.arrayContaining(["晒单图", "购买/使用反馈", "UP推荐语境"])
    });
  });

  it("classifies demand-fit comments with comment endorsement as suspected shill comments", () => {
    const match = classifyCommentRenderer(
      createCommentRenderer(false, "刚好缺内裤，刷到这个算是缘分，看评论都说好就放心了。") as HTMLElement & {
        shadowRoot: ShadowRoot;
      },
      {
        dynamicRegexPattern: "/广告|推广|购买|推荐/gi",
        dynamicRegexKeywordMinMatches: 1
      }
    );

    expect(match).toEqual({
      reason: "shill",
      category: "sponsor",
      matches: expect.arrayContaining(["购买/使用反馈", "正向背书", "UP推荐语境"])
    });
  });

  it("classifies long product praise as suspected shill comments", () => {
    const match = classifyCommentRenderer(
      createCommentRenderer(false, "元力象手感真不错，亲肤，穿一天也没啥，以前老是黏黏的烦死了，现在好点") as HTMLElement & {
        shadowRoot: ShadowRoot;
      },
      {
        dynamicRegexPattern: "/广告|推广|购买|推荐/gi",
        dynamicRegexKeywordMinMatches: 1
      }
    );

    expect(match).toEqual({
      reason: "shill",
      category: "sponsor",
      matches: expect.arrayContaining(["购买/使用反馈", "产品体验细节", "正向背书"])
    });
  });

  it("classifies buyer-style questions only when product-use context is present", () => {
    const match = classifyCommentRenderer(
      createCommentRenderer(false, "有没有买过的大佬说说，洗几次会变形不") as HTMLElement & { shadowRoot: ShadowRoot },
      {
        dynamicRegexPattern: "/广告|推广|购买|推荐/gi",
        dynamicRegexKeywordMinMatches: 1
      }
    );
    const benign = classifyCommentRenderer(
      createCommentRenderer(false, "有没有看过这个系列的大佬说说，剧情会不会烂尾") as HTMLElement & { shadowRoot: ShadowRoot },
      {
        dynamicRegexPattern: "/广告|推广|购买|推荐/gi",
        dynamicRegexKeywordMinMatches: 1
      }
    );

    expect(match).toEqual({
      reason: "shill",
      category: "sponsor",
      matches: expect.arrayContaining(["购买/使用反馈", "产品体验细节", "购买前提问"])
    });
    expect(benign).toBeNull();
  });

  it("keeps negative product warnings out of suspected shill comments", () => {
    const match = classifyCommentRenderer(
      createCommentRenderer(false, "刚买这条内裤就退了，不推荐，别被广告话术带了。") as HTMLElement & { shadowRoot: ShadowRoot },
      {
        dynamicRegexPattern: "/广告|购买|推荐/gi",
        dynamicRegexKeywordMinMatches: 1
      }
    );

    expect(match).toBeNull();
  });

  it("classifies marketing replies and problem-solution testimonials as suspected shill comments", () => {
    const samples = [
      {
        text: "朋友们，和客服报【大吉】，专属优惠！7天不满意有运费险随时退，放心入手，给家人把春敏尘螨隐患全扫清～",
        expected: ["营销回复"]
      },
      {
        text: "我腿粗，以前穿别家老卷边，元力象这个不会，裤腿长度刚好，走路也不往上窜，比纯棉的干爽多了。",
        expected: ["痛点解决背书", "产品体验细节"]
      }
    ];

    for (const sample of samples) {
      const match = classifyCommentRenderer(
        createCommentRenderer(false, sample.text) as HTMLElement & { shadowRoot: ShadowRoot },
        {
          dynamicRegexPattern: "/广告|推广|购买|推荐|优惠|客服/gi",
          dynamicRegexKeywordMinMatches: 1
        }
      );

      expect(match).toMatchObject({
        reason: "shill",
        category: "sponsor",
        matches: expect.arrayContaining(sample.expected)
      });
    }
  });

  it("keeps lightweight shill patterns as account-gated candidates", () => {
    const samples = [
      "看着质感不错，准备入手两条试试水。",
      "现在国产内裤都这么卷了吗[妙啊]这做工看着挺细致",
      "不勒腿的确实爽[doge]",
      "这价格能买到兰精莫代尔？性价比有点高噢",
      "之前一直穿优衣库，这个元力象的舒适度能比得过吗"
    ];

    for (const text of samples) {
      const renderer = createCommentRenderer(false, text) as HTMLElement & { shadowRoot: ShadowRoot };
      expect(assessCommentRendererShill(renderer)).toMatchObject({
        state: "candidate"
      });
      expect(
        classifyCommentRenderer(renderer, {
          dynamicRegexPattern: "/广告|推广|购买|推荐/gi",
          dynamicRegexKeywordMinMatches: 1
        })
      ).toBeNull();
      expect(
        classifyCommentRenderer(
          renderer,
          {
            dynamicRegexPattern: "/广告|推广|购买|推荐/gi",
            dynamicRegexKeywordMinMatches: 1
          },
          zombieLikeProfile
        )
      ).toMatchObject({
        reason: "shill",
        category: "sponsor",
        matches: expect.arrayContaining(["账号状态补证"])
      });
    }
  });

  it("parses card responses into conservative dormant-account features", () => {
    const dormant = parseCommentAuthorCardResponse(
      "12345678901",
      JSON.stringify({
        code: 0,
        data: {
          card: {
            vip: { status: 0 },
            level_info: { current_level: 1 },
            follower: 0,
            like_num: 0,
            archive_count: 0,
            is_senior_member: false,
            official_verify: { type: -1 }
          }
        }
      })
    );
    const protectedProfile = parseCommentAuthorCardResponse(
      "12345678902",
      JSON.stringify({
        code: 0,
        data: {
          card: {
            vip: { status: 0 },
            level_info: { current_level: 1 },
            follower: 2000,
            like_num: 20,
            archive_count: 6,
            is_senior_member: false,
            official_verify: { type: -1 }
          }
        }
      })
    );

    expect(dormant.likelyDormant).toBe(true);
    expect(dormant.evidence).toEqual(expect.arrayContaining(["非会员", "低等级", "无投稿", "长UID"]));
    expect(protectedProfile.likelyDormant).toBe(false);
  });

  it("probes account state only after an account-gated candidate and upgrades dormant authors", async () => {
    history.replaceState({}, "", "https://www.bilibili.com/video/BV1xx411c7mZ");
    const gmRequest = vi.fn((options: { url: string; headers?: Record<string, string>; onload?: (response: { status: number; responseText: string }) => void }) => {
      options.onload?.({
        status: 200,
        responseText: JSON.stringify({
          code: 0,
          data: {
            card: {
              vip: { status: 0 },
              level_info: { current_level: 1 },
              follower: 0,
              like_num: 0,
              archive_count: 0,
              is_senior_member: false,
              official_verify: { type: -1 }
            }
          }
        })
      });
    });
    vi.stubGlobal("GM_xmlhttpRequest", gmRequest);

    const root = document.createElement("bili-comments");
    const rootShadow = root.attachShadow({ mode: "open" });
    document.body.appendChild(root);
    const shillRenderer = createCommentRenderer(false, "看着质感不错，准备入手两条试试水。", {
      authorMid: "100200300"
    }) as HTMLElement & { shadowRoot: ShadowRoot };
    rootShadow.appendChild(createThread(shillRenderer));

    expect(extractCommentAuthorMid(shillRenderer)).toBe("100200300");

    const controller = new CommentSponsorController(new ConfigStore());
    Reflect.set(controller, "currentConfig", {
      ...cloneDefaultConfig(),
      commentFilterMode: "label"
    });
    Reflect.get(controller, "refresh").call(controller);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(gmRequest).toHaveBeenCalledTimes(1);
    expect(gmRequest.mock.calls[0]?.[0].url).toContain("mid=100200300");
    expect(gmRequest.mock.calls[0]?.[0].url).toContain("photo=false");
    expect(gmRequest.mock.calls[0]?.[0].headers).toMatchObject({
      Referer: "https://www.bilibili.com/",
      Origin: "https://www.bilibili.com/"
    });
    expect(
      rootShadow
        .querySelector("bili-comment-thread-renderer")
        ?.shadowRoot?.querySelector("bili-comment-renderer")
        ?.shadowRoot?.querySelector("bili-comment-user-info")
        ?.shadowRoot?.querySelector("[data-bsb-comment-badge='true']")
        ?.textContent
    ).toContain("疑似托评评论");

    const ordinaryRoot = document.createElement("bili-comments");
    const ordinaryRootShadow = ordinaryRoot.attachShadow({ mode: "open" });
    document.body.appendChild(ordinaryRoot);
    ordinaryRootShadow.appendChild(
      createThread(createCommentRenderer(false, "这个剧情转折还挺有意思", { authorMid: "100200301" }) as HTMLElement)
    );
    Reflect.get(controller, "refresh").call(controller);
    await Promise.resolve();

    expect(gmRequest).toHaveBeenCalledTimes(1);
  });

  it("keeps account-gated candidates unprocessed when the account probe fails", async () => {
    history.replaceState({}, "", "https://www.bilibili.com/video/BV1xx411c7mY");
    const gmRequest = vi.fn((options: { onload?: (response: { status: number; responseText: string }) => void }) => {
      options.onload?.({ status: 500, responseText: "{}" });
    });
    vi.stubGlobal("GM_xmlhttpRequest", gmRequest);

    const root = document.createElement("bili-comments");
    const rootShadow = root.attachShadow({ mode: "open" });
    document.body.appendChild(root);
    rootShadow.appendChild(
      createThread(
        createCommentRenderer(false, "看着质感不错，准备入手两条试试水。", {
          authorMid: "100200302"
        }) as HTMLElement
      )
    );

    const controller = new CommentSponsorController(new ConfigStore());
    Reflect.set(controller, "currentConfig", {
      ...cloneDefaultConfig(),
      commentFilterMode: "label"
    });
    Reflect.get(controller, "refresh").call(controller);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(gmRequest).toHaveBeenCalledTimes(1);
    expect(
      rootShadow
        .querySelector("bili-comment-thread-renderer")
        ?.shadowRoot?.querySelector("bili-comment-renderer")
        ?.shadowRoot?.querySelector("bili-comment-user-info")
        ?.shadowRoot?.querySelector("[data-bsb-comment-badge='true']")
    ).toBeNull();
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
    const results = approvedSamples.map((sample) => {
      const renderer = createCommentRenderer(Boolean(sample.input.hasGoodsLink), sample.input.text, {
        hasMediaAttachment: sample.input.hasMediaAttachment
      }) as HTMLElement & { shadowRoot: ShadowRoot };
      return classifyCommentRenderer(
        renderer,
        {
          dynamicRegexPattern: sample.input.regexPattern ?? "/评论区|优惠券|广告|推广|好物推荐|邀请码|主页|店铺|橱窗/gi",
          dynamicRegexKeywordMinMatches: sample.input.regexKeywordMinMatches ?? 1
        },
        sample.input.authorProfile ?? null
      )?.category ?? null;
    });

    expect(results).toEqual(approvedSamples.map((sample) => sample.expectedCategory));
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

  it("shows a compact comment feedback menu only when local feedback is enabled", async () => {
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
    const menu = actionRoot?.querySelector<HTMLElement>("[data-bsb-comment-feedback-menu='true']");
    const trigger = actionRoot?.querySelector<HTMLButtonElement>("[data-bsb-comment-feedback-trigger='true']");
    const choices = menu?.querySelector<HTMLElement>(".bsb-tm-inline-feedback-menu__choices");
    expect(menu).toBeTruthy();
    expect(trigger?.textContent).toBe("反馈");
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
    expect(menu?.dataset.open).toBe("false");
    expect(choices?.getAttribute("aria-hidden")).toBe("true");
    expect(actionRoot?.textContent).not.toContain("保留此视频标签");
    expect(actionRoot?.textContent).not.toContain("忽略此视频");
  });

  it("shows a disabled explanation instead of hiding feedback when upstream owns the video label", async () => {
    history.replaceState({}, "", "https://www.bilibili.com/video/BV1xx411c7mR");

    const root = document.createElement("bili-comments");
    const rootShadow = root.attachShadow({ mode: "open" });
    document.body.appendChild(root);
    rootShadow.appendChild(createThread(createCommentRenderer(false, "点评论区置顶领取优惠券") as HTMLElement));

    const controller = new CommentSponsorController(new ConfigStore());
    Reflect.get(controller, "handleFeedbackAvailability").call(
      controller,
      new CustomEvent(LOCAL_VIDEO_FEEDBACK_AVAILABILITY_EVENT, {
        detail: {
          enabled: false,
          locked: true,
          disabledReason: "upstream-whole-video",
          bvid: "BV1xx411c7mR"
        }
      })
    );
    Reflect.get(controller, "refresh").call(controller);

    const actionRoot = getMainActionRoot(rootShadow);
    const menu = actionRoot?.querySelector<HTMLElement>("[data-bsb-comment-feedback-menu='true']");
    const trigger = actionRoot?.querySelector<HTMLButtonElement>("[data-bsb-comment-feedback-trigger='true']");
    expect(menu?.dataset.disabled).toBe("true");
    expect(trigger?.disabled).toBe(true);
    expect(trigger?.textContent).toBe("上游已接管");
    expect(trigger?.title).toContain("不会覆盖上游判断");
  });

  it("keeps submitted comment feedback independent per comment after a re-render", async () => {
    history.replaceState({}, "", "https://www.bilibili.com/video/BV1xx411c7mS");
    const storedFeedback: Record<string, number> = {};
    vi.stubGlobal("GM_getValue", vi.fn(async (_key, fallback) => (Object.keys(storedFeedback).length > 0 ? storedFeedback : fallback)));
    vi.stubGlobal("GM_setValue", vi.fn(async (_key, value) => Object.assign(storedFeedback, value)));

    const root = document.createElement("bili-comments");
    const rootShadow = root.attachShadow({ mode: "open" });
    document.body.appendChild(root);
    rootShadow.appendChild(createThread(createCommentRenderer(false, "点评论区置顶领取优惠券") as HTMLElement));
    rootShadow.appendChild(createThread(createCommentRenderer(false, "朋友们，和客服报【大吉】，专属优惠！") as HTMLElement));

    const controller = new CommentSponsorController(new ConfigStore());
    Reflect.get(controller, "handleFeedbackAvailability").call(
      controller,
      new CustomEvent(LOCAL_VIDEO_FEEDBACK_AVAILABILITY_EVENT, {
        detail: {
          enabled: true,
          locked: false,
          bvid: "BV1xx411c7mS"
        }
      })
    );
    Reflect.get(controller, "refresh").call(controller);

    const actionRoots = Array.from(rootShadow.querySelectorAll("bili-comment-thread-renderer")).map(
      (thread) =>
        thread.shadowRoot
          ?.querySelector("bili-comment-renderer")
          ?.shadowRoot?.querySelector("#main")
          ?.querySelector("bili-comment-action-buttons-renderer")
          ?.shadowRoot
    );
    const firstKeepButton = actionRoots[0]?.querySelector<HTMLButtonElement>("[data-bsb-comment-feedback-keep='true']");
    firstKeepButton?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    Reflect.get(controller, "resetProcessedThreads").call(controller);
    Reflect.get(controller, "refresh").call(controller);

    const nextActionRoots = Array.from(rootShadow.querySelectorAll("bili-comment-thread-renderer")).map(
      (thread) =>
        thread.shadowRoot
          ?.querySelector("bili-comment-renderer")
          ?.shadowRoot?.querySelector("#main")
          ?.querySelector("bili-comment-action-buttons-renderer")
          ?.shadowRoot
    );
    expect(nextActionRoots[0]?.querySelector<HTMLButtonElement>("[data-bsb-comment-feedback-trigger='true']")?.textContent).toBe("已提交");
    expect(nextActionRoots[0]?.querySelector<HTMLButtonElement>("[data-bsb-comment-feedback-trigger='true']")?.disabled).toBe(true);
    expect(nextActionRoots[1]?.querySelector<HTMLButtonElement>("[data-bsb-comment-feedback-trigger='true']")?.textContent).toBe("反馈");
    expect(nextActionRoots[1]?.querySelector<HTMLButtonElement>("[data-bsb-comment-feedback-trigger='true']")?.disabled).toBe(false);
  });

  it("dispatches structured feedback from the inserted comment actions", async () => {
    history.replaceState({}, "", "https://www.bilibili.com/video/BV1xx411c7mQ");
    vi.stubGlobal("GM_getValue", vi.fn(async (_key, fallback) => fallback));
    vi.stubGlobal("GM_setValue", vi.fn(async () => {}));

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
    const trigger = actionRoot?.querySelector<HTMLButtonElement>("[data-bsb-comment-feedback-trigger='true']");
    const choices = actionRoot?.querySelector<HTMLElement>(".bsb-tm-inline-feedback-menu__choices");
    trigger?.click();
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");
    expect(actionRoot?.querySelector<HTMLElement>("[data-bsb-comment-feedback-menu='true']")?.dataset.open).toBe("true");
    expect(choices?.getAttribute("aria-hidden")).toBe("false");

    const keepButton = actionRoot?.querySelector<HTMLButtonElement>("[data-bsb-comment-feedback-keep='true']");
    expect(keepButton?.textContent).toBe("保留");
    keepButton?.click();

    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect((eventSpy.mock.calls[0]?.[0] as CustomEvent).detail).toMatchObject({
      decision: "confirm",
      category: "sponsor",
      source: "comment-suspicion"
    });
    const feedbackToken = (eventSpy.mock.calls[0]?.[0] as CustomEvent).detail.feedbackToken;
    expect(typeof feedbackToken).toBe("string");
    expect(consumeCommentFeedbackToken(feedbackToken)).toBe(true);
    expect(consumeCommentFeedbackToken(feedbackToken)).toBe(false);
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
    expect(actionRoot?.querySelector<HTMLElement>("[data-bsb-comment-feedback-menu='true']")?.dataset.open).toBe("false");
    expect(actionRoot?.querySelector<HTMLElement>("[data-bsb-comment-feedback-menu='true']")?.dataset.submitted).toBe("true");
    expect(choices?.getAttribute("aria-hidden")).toBe("true");
    expect(trigger?.textContent).toBe("已提交");
    expect(trigger?.disabled).toBe(true);
    expect(keepButton?.disabled).toBe(true);
    keepButton?.click();
    expect(eventSpy).toHaveBeenCalledTimes(1);

    window.removeEventListener(VIDEO_SIGNAL_FEEDBACK_EVENT, eventSpy as EventListener);
  });
});
