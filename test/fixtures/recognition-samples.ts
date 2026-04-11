import { DEFAULT_DYNAMIC_REGEX_PATTERN } from "../../src/constants";
import type { Category, DynamicSponsorMatch, LocalVideoLabelRecord, LocalVideoSignal } from "../../src/types";

export type RecognitionDomain = "video" | "comment" | "dynamic" | "local-learning";
export type RecognitionCaseType = "must-hit" | "must-pass" | "boundary" | "trap";
export type RecognitionRiskTag =
  | "false-positive-protection"
  | "false-negative-risk"
  | "quote-mocking"
  | "negation"
  | "owned-surface"
  | "weak-title-only"
  | "local-learning";
export type RecognitionSource = "repo-test" | "manual-real-world" | "ai-trap-candidate";
export type HumanVerdict = "confirmed" | "pending" | "rejected";

type BaseSample = {
  id: string;
  domain: RecognitionDomain;
  caseType: RecognitionCaseType;
  expectedCategory: string | null;
  expectedBehavior:
    | "classify"
    | "suppress"
    | "review"
    | "persist"
    | "do-not-persist"
    | "manual-keep-wins"
    | "manual-dismiss-wins"
    | "prefer-comment-signal";
  riskTag: RecognitionRiskTag;
  source: RecognitionSource;
  humanVerdict: HumanVerdict;
  notes?: string;
};

export type VideoRecognitionSample = BaseSample & {
  domain: "video";
  input: {
    title: string;
    description?: string;
    tags?: string[];
    storedMatches?: string[];
  };
  expectedCategory: Extract<Category, "sponsor" | "selfpromo" | "exclusive_access"> | null;
};

export type CommentRecognitionSample = BaseSample & {
  domain: "comment";
  input: {
    text: string;
    hasGoodsLink?: boolean;
    storedMatches?: string[];
    regexPattern?: string;
    regexKeywordMinMatches?: number;
  };
  expectedCategory: Extract<Category, "sponsor" | "selfpromo" | "exclusive_access"> | null;
};

export type DynamicRecognitionSample = BaseSample & {
  domain: "dynamic";
  input: {
    text: string;
    hasGoodsCard?: boolean;
    isForwardGoodsCard?: boolean;
    storedMatches?: string[];
    regexPattern?: string;
    regexKeywordMinMatches?: number;
  };
  expectedCategory: DynamicSponsorMatch["category"] | null;
};

export type LocalLearningRecognitionSample = BaseSample & {
  domain: "local-learning";
  input: {
    videoId: string;
    existingRecord?: LocalVideoLabelRecord | null;
    incomingSignal?: LocalVideoSignal;
    userDecision?: "confirm" | "dismiss";
  };
  expectedCategory: Category | null;
};

export type RecognitionSample =
  | VideoRecognitionSample
  | CommentRecognitionSample
  | DynamicRecognitionSample
  | LocalLearningRecognitionSample;

export const VIDEO_RECOGNITION_SAMPLES: readonly VideoRecognitionSample[] = [
  {
    id: "video-hit-sponsor-cta",
    domain: "video",
    caseType: "must-hit",
    input: {
      title: "这台机器值不值",
      description: "本期视频由品牌合作支持，评论区置顶有优惠券和购买链接。",
      tags: ["开箱"]
    },
    expectedCategory: "sponsor",
    expectedBehavior: "classify",
    riskTag: "false-negative-risk",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "video-hit-exclusive-access",
    domain: "video",
    caseType: "must-hit",
    input: {
      title: "【首发】某新品上手体验",
      description: "这是一次抢先体验，不是正式零售版。",
      tags: ["首发"]
    },
    expectedCategory: "exclusive_access",
    expectedBehavior: "classify",
    riskTag: "false-negative-risk",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "video-pass-disclaimer-review",
    domain: "video",
    caseType: "must-pass",
    input: {
      title: "这台机器值不值得买",
      description: "本期非商单，自费购买，主要分享一周使用感受，没有购买链接。",
      tags: ["测评"]
    },
    expectedCategory: null,
    expectedBehavior: "suppress",
    riskTag: "negation",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "video-pass-event-coverage",
    domain: "video",
    caseType: "must-pass",
    input: {
      title: "某品牌发布会现场体验",
      description: "聊聊新品设计，没有购买链接。",
      tags: ["活动记录"]
    },
    expectedCategory: null,
    expectedBehavior: "suppress",
    riskTag: "false-positive-protection",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "video-boundary-weak-title-only",
    domain: "video",
    caseType: "boundary",
    input: {
      title: "某品牌合作活动记录"
    },
    expectedCategory: null,
    expectedBehavior: "review",
    riskTag: "weak-title-only",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "video-boundary-borrow-and-try",
    domain: "video",
    caseType: "boundary",
    input: {
      title: "新机借测体验",
      description: "借测体验一天，说说优缺点，没有购买引导。"
    },
    expectedCategory: null,
    expectedBehavior: "review",
    riskTag: "false-positive-protection",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "video-trap-disclaimer-plus-purchase",
    domain: "video",
    caseType: "trap",
    input: {
      title: "非商单但给你们整理了购买链接",
      description: "自费购买，但评论区有购买清单。"
    },
    expectedCategory: null,
    expectedBehavior: "review",
    riskTag: "negation",
    source: "ai-trap-candidate",
    humanVerdict: "pending",
    notes: "双重语义，必须人工打标后才能进入正式回归。"
  }
];

export const COMMENT_RECOGNITION_SAMPLES: readonly CommentRecognitionSample[] = [
  {
    id: "comment-hit-goods-link",
    domain: "comment",
    caseType: "must-hit",
    input: {
      text: "我把商品卡放上了，直接点蓝链下单就行。",
      hasGoodsLink: true
    },
    expectedCategory: "sponsor",
    expectedBehavior: "classify",
    riskTag: "false-negative-risk",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "comment-hit-coupon-cta",
    domain: "comment",
    caseType: "must-hit",
    input: {
      text: "点评论区置顶领取优惠券和购买链接",
      storedMatches: ["评论区", "优惠券"],
      regexPattern: DEFAULT_DYNAMIC_REGEX_PATTERN
    },
    expectedCategory: "sponsor",
    expectedBehavior: "classify",
    riskTag: "false-negative-risk",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "comment-hit-tool-trial-link",
    domain: "comment",
    caseType: "must-hit",
    input: {
      text: "给大家安利一个做视频的工具:花生!是啊b自己的产品，非常好用，做视频的时候，找素材又快又准，后期的效率那真的是大大提升啊，想在B站做视频，但是时间不够用，或者没怎么学过剪辑的小伙伴，真的可以试一下哦，戳体验 https://www.huasheng.cn/home",
      regexPattern: DEFAULT_DYNAMIC_REGEX_PATTERN
    },
    expectedCategory: "sponsor",
    expectedBehavior: "classify",
    riskTag: "false-negative-risk",
    source: "manual-real-world",
    humanVerdict: "confirmed"
  },
  {
    id: "comment-hit-owned-surface",
    domain: "comment",
    caseType: "must-hit",
    input: {
      text: "主页见我的店铺，橱窗里都整理好了。",
      regexPattern: DEFAULT_DYNAMIC_REGEX_PATTERN
    },
    expectedCategory: "selfpromo",
    expectedBehavior: "classify",
    riskTag: "owned-surface",
    source: "manual-real-world",
    humanVerdict: "confirmed"
  },
  {
    id: "comment-pass-benign-discussion",
    domain: "comment",
    caseType: "must-pass",
    input: {
      text: "这条评论在讨论广告学课程和推广大使。",
      regexPattern: "/广告|课程|推广/gi"
    },
    expectedCategory: null,
    expectedBehavior: "suppress",
    riskTag: "false-positive-protection",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "comment-pass-quoted-mocking",
    domain: "comment",
    caseType: "must-pass",
    input: {
      text: "笑死，这条“点评论区置顶领取优惠券”的广告话术也太土了。",
      regexPattern: "/评论区|优惠券|广告/gi"
    },
    expectedCategory: null,
    expectedBehavior: "suppress",
    riskTag: "quote-mocking",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "comment-boundary-invitation-code",
    domain: "comment",
    caseType: "boundary",
    input: {
      text: "感谢点赞！上期好物推荐里我还有几个邀请码。",
      regexPattern: "/好物推荐|邀请码/gi"
    },
    expectedCategory: "sponsor",
    expectedBehavior: "review",
    riskTag: "false-negative-risk",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "comment-trap-blue-link-warning",
    domain: "comment",
    caseType: "trap",
    input: {
      text: "兄弟们蓝链别点，我踩坑了。",
      regexPattern: "/蓝链/gi"
    },
    expectedCategory: null,
    expectedBehavior: "review",
    riskTag: "quote-mocking",
    source: "ai-trap-candidate",
    humanVerdict: "pending"
  }
];

export const DYNAMIC_RECOGNITION_SAMPLES: readonly DynamicRecognitionSample[] = [
  {
    id: "dynamic-hit-goods-card",
    domain: "dynamic",
    caseType: "must-hit",
    input: {
      text: "今日推荐",
      hasGoodsCard: true
    },
    expectedCategory: "dynamicSponsor_sponsor",
    expectedBehavior: "classify",
    riskTag: "false-negative-risk",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "dynamic-hit-forward-owned-surface",
    domain: "dynamic",
    caseType: "must-hit",
    input: {
      text: "主页见我的小店，合集已经整理好。",
      regexPattern: DEFAULT_DYNAMIC_REGEX_PATTERN
    },
    expectedCategory: "dynamicSponsor_forward_sponsor",
    expectedBehavior: "classify",
    riskTag: "owned-surface",
    source: "manual-real-world",
    humanVerdict: "confirmed"
  },
  {
    id: "dynamic-hit-coupon-cta",
    domain: "dynamic",
    caseType: "must-hit",
    input: {
      text: "点蓝链领券，评论区有购买入口。",
      regexPattern: DEFAULT_DYNAMIC_REGEX_PATTERN
    },
    expectedCategory: "dynamicSponsor_suspicion_sponsor",
    expectedBehavior: "classify",
    riskTag: "false-negative-risk",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "dynamic-pass-event-coverage",
    domain: "dynamic",
    caseType: "must-pass",
    input: {
      text: "某品牌发布会现场体验，聊新品设计，没有购买链接。",
      regexPattern: "/品牌|发布会|新品|购买链接/gi"
    },
    expectedCategory: null,
    expectedBehavior: "suppress",
    riskTag: "false-positive-protection",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "dynamic-pass-quoted-copy",
    domain: "dynamic",
    caseType: "must-pass",
    input: {
      text: "笑死，又来一条“点评论区置顶领取优惠券”的土味文案。",
      regexPattern: "/评论区|优惠券|文案/gi"
    },
    expectedCategory: null,
    expectedBehavior: "suppress",
    riskTag: "quote-mocking",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "dynamic-boundary-homepage-lead",
    domain: "dynamic",
    caseType: "boundary",
    input: {
      text: "主页见完整合集。",
      regexPattern: DEFAULT_DYNAMIC_REGEX_PATTERN
    },
    expectedCategory: "dynamicSponsor_forward_sponsor",
    expectedBehavior: "review",
    riskTag: "owned-surface",
    source: "manual-real-world",
    humanVerdict: "confirmed",
    notes: "当前口径下，主页导流会归到 forward/selfpromo 档；Phase 2 再决定是否继续收紧。"
  },
  {
    id: "dynamic-trap-not-ad-but-link",
    domain: "dynamic",
    caseType: "trap",
    input: {
      text: "不是广告，真的只是把购买入口顺手贴出来。",
      regexPattern: DEFAULT_DYNAMIC_REGEX_PATTERN
    },
    expectedCategory: null,
    expectedBehavior: "review",
    riskTag: "negation",
    source: "ai-trap-candidate",
    humanVerdict: "pending"
  }
];

export const LOCAL_LEARNING_RECOGNITION_SAMPLES: readonly LocalLearningRecognitionSample[] = [
  {
    id: "learning-hit-persist-high-confidence",
    domain: "local-learning",
    caseType: "must-hit",
    input: {
      videoId: "BV1xx411c7mD",
      incomingSignal: {
        category: "sponsor",
        source: "comment-goods",
        confidence: 0.96,
        reason: "评论区命中商品卡广告"
      }
    },
    expectedCategory: "sponsor",
    expectedBehavior: "persist",
    riskTag: "local-learning",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "learning-pass-skip-low-confidence",
    domain: "local-learning",
    caseType: "must-pass",
    input: {
      videoId: "BV1xx411c7mE",
      incomingSignal: {
        category: "sponsor",
        source: "page-heuristic",
        confidence: 0.71,
        reason: "页面文本出现本地商业线索"
      }
    },
    expectedCategory: null,
    expectedBehavior: "do-not-persist",
    riskTag: "local-learning",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "learning-pass-manual-keep-wins",
    domain: "local-learning",
    caseType: "must-pass",
    input: {
      videoId: "BV1xx411c7mF",
      existingRecord: {
        category: "selfpromo",
        source: "manual",
        confidence: 1,
        updatedAt: 1,
        reason: "手动确认本地标签"
      },
      incomingSignal: {
        category: "sponsor",
        source: "comment-goods",
        confidence: 0.96,
        reason: "评论区命中商品卡广告"
      }
    },
    expectedCategory: "selfpromo",
    expectedBehavior: "manual-keep-wins",
    riskTag: "local-learning",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "learning-pass-manual-dismiss-wins",
    domain: "local-learning",
    caseType: "must-pass",
    input: {
      videoId: "BV1xx411c7mG",
      existingRecord: {
        category: null,
        source: "manual-dismiss",
        confidence: 1,
        updatedAt: 1,
        reason: "手动忽略本地标签"
      },
      incomingSignal: {
        category: "sponsor",
        source: "comment-goods",
        confidence: 0.96,
        reason: "评论区命中商品卡广告"
      }
    },
    expectedCategory: null,
    expectedBehavior: "manual-dismiss-wins",
    riskTag: "local-learning",
    source: "repo-test",
    humanVerdict: "confirmed"
  },
  {
    id: "learning-boundary-prefer-comment-on-tie",
    domain: "local-learning",
    caseType: "boundary",
    input: {
      videoId: "BV1xx411c7mH",
      existingRecord: {
        category: "sponsor",
        source: "comment-suspicion",
        confidence: 0.87,
        updatedAt: 1,
        reason: "评论区命中商业线索"
      },
      incomingSignal: {
        category: "sponsor",
        source: "page-heuristic",
        confidence: 0.87,
        reason: "页面文本出现本地商业线索"
      }
    },
    expectedCategory: "sponsor",
    expectedBehavior: "prefer-comment-signal",
    riskTag: "local-learning",
    source: "repo-test",
    humanVerdict: "confirmed",
    notes: "当前实现相等置信度时偏向 comment signal。"
  },
  {
    id: "learning-trap-manual-dismiss-then-exclusive",
    domain: "local-learning",
    caseType: "trap",
    input: {
      videoId: "BV1xx411c7mJ",
      existingRecord: {
        category: null,
        source: "manual-dismiss",
        confidence: 1,
        updatedAt: 1,
        reason: "手动忽略本地标签"
      },
      incomingSignal: {
        category: "exclusive_access",
        source: "page-heuristic",
        confidence: 0.9,
        reason: "页面出现抢先体验线索"
      }
    },
    expectedCategory: null,
    expectedBehavior: "review",
    riskTag: "local-learning",
    source: "ai-trap-candidate",
    humanVerdict: "pending"
  }
];

export const APPROVED_RECOGNITION_SAMPLES: readonly RecognitionSample[] = [
  ...VIDEO_RECOGNITION_SAMPLES,
  ...COMMENT_RECOGNITION_SAMPLES,
  ...DYNAMIC_RECOGNITION_SAMPLES,
  ...LOCAL_LEARNING_RECOGNITION_SAMPLES
].filter((sample) => sample.humanVerdict === "confirmed");

export const PENDING_TRAP_RECOGNITION_SAMPLES: readonly RecognitionSample[] = [
  ...VIDEO_RECOGNITION_SAMPLES,
  ...COMMENT_RECOGNITION_SAMPLES,
  ...DYNAMIC_RECOGNITION_SAMPLES,
  ...LOCAL_LEARNING_RECOGNITION_SAMPLES
].filter((sample) => sample.caseType === "trap" && sample.humanVerdict === "pending");
