import type { Category } from "../types";

type ScoreBucket = "sponsor" | "selfpromo" | "exclusive" | "negative";

type WeightedRule = {
  label: string;
  bucket: ScoreBucket;
  weight: number;
  patterns: readonly RegExp[];
};

export type CommercialIntentAssessment = {
  category: Category | null;
  confidence: number;
  hits: string[];
  sponsorScore: number;
  selfpromoScore: number;
  exclusiveScore: number;
  negativeScore: number;
  reason: string | null;
};

const COMMERCIAL_RULES: readonly WeightedRule[] = [
  {
    label: "赞助声明",
    bucket: "sponsor",
    weight: 6,
    patterns: [
      /本期视频(?:由|感谢)[^。！？\n]{0,24}(?:赞助|支持|联合呈现|提供|合作)/iu,
      /(?:由|感谢)[^。！？\n]{0,24}(?:冠名|赞助|支持)/iu,
      /本视频(?:由|感谢)[^。！？\n]{0,24}(?:赞助|支持|合作)/iu
    ]
  },
  {
    label: "商务合作",
    bucket: "sponsor",
    weight: 5,
    patterns: [
      /(?:商务|品牌|官方|联合)(?:合作|支持|赞助)/iu,
      /花火/u,
      /商业合作/iu,
      /合作伙伴/iu
    ]
  },
  {
    label: "购物导流",
    bucket: "sponsor",
    weight: 4,
    patterns: [
      /商品卡/iu,
      /(?:评论区|置顶(?:评论)?)[^。！？\n]{0,18}(?:链接|蓝链|商品卡|传送门|店铺|关键词|同款|领券)/iu,
      /(?:店铺|旗舰店|官方店|蓝链|链接|传送门|购买链接|下单链接)/iu,
      /(?:淘宝|tb|京东|jd|狗东|拼多多|pdd|天猫|tmall)(?:搜|搜索)?/iu,
      /(?:下单|购买|拍下|上车|冲|领券|叠券|拍立减|补贴)/iu
    ]
  },
  {
    label: "优惠促销",
    bucket: "sponsor",
    weight: 3,
    patterns: [
      /优惠(?:券|卷|劵)/iu,
      /(?:百亿补贴|国补|到手价|拍立减|神价|补贴后|返利|返现|红包|福利|赠品|抽免单|赠送)/iu,
      /(?:大促|促销|折扣|特价|秒杀|预售|热卖|低至|清仓)/iu,
      /满\d+/u
    ]
  },
  {
    label: "互动导购",
    bucket: "sponsor",
    weight: 2,
    patterns: [
      /(?:点击|戳|看|去|搜)(?:评论区|置顶|店铺|蓝链|链接)?/iu,
      /(?:扫码|口令|密令|暗号|私信|加群|群号|vx|wx|微信|QQ)/iu,
      /(?:领|抢|得|送)(?:优惠|红包|券|福利)/iu
    ]
  },
  {
    label: "作者导流",
    bucket: "selfpromo",
    weight: 4,
    patterns: [
      /(?:我的|我自己(?:的)?)?(?:频道|主页|店铺|淘宝店|公众号|直播间|社群|群|专栏|课程|合集)/iu,
      /(?:新号|副号|小号|备用号|交流群|粉丝群)/iu,
      /(?:好物推荐|使用清单|购买清单|体验清单|安利|团购|开团)/iu
    ]
  },
  {
    label: "抢先体验",
    bucket: "exclusive",
    weight: 4,
    patterns: [
      /(?:首发|抢先体验|独家|先行版|抢先上手|全球首发|提前体验|优先体验)/iu,
      /(?:工程机|样机|媒体机|媒体样机|借测|借来|试玩机|测试机)/iu,
      /(?:预览版|体验版|beta|Beta|内测)/u
    ]
  },
  {
    label: "非商业声明",
    bucket: "negative",
    weight: 5,
    patterns: [
      /(?:非广告|不是广告|无广告|非商单|不是商单)/iu,
      /(?:无商业合作|无赞助|未收钱|没收钱|没有接广告)/iu,
      /(?:自费购买|自己买的|自己花钱买的|个人购买|自掏腰包)/iu
    ]
  },
  {
    label: "噪声语境",
    bucket: "negative",
    weight: 3,
    patterns: [/广告学/iu, /推广曲/iu, /推广大使/iu, /同款(?:bgm|BGM|音乐|滤镜)/iu, /广告位招租/iu]
  }
] as const;

function normalizeCommercialText(text: string): string {
  return text.replace(/\s+/gu, " ").trim();
}

function collectRuleMatches(text: string, rule: WeightedRule): string[] {
  const hits = new Set<string>();
  for (const pattern of rule.patterns) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const globalPattern = new RegExp(pattern.source, flags);
    for (const match of text.matchAll(globalPattern)) {
      const value = match[0]?.trim();
      if (value) {
        hits.add(value);
      }
      if (hits.size >= 2) {
        break;
      }
    }
    if (hits.size >= 2) {
      break;
    }
  }
  return [...hits];
}

export function assessCommercialIntent(
  text: string,
  options: {
    extraMatches?: string[];
    minMatches?: number;
  } = {}
): CommercialIntentAssessment {
  const normalized = normalizeCommercialText(text);
  const extraMatches = [...new Set((options.extraMatches ?? []).map((value) => value.trim()).filter(Boolean))];
  const minMatches = Math.max(1, options.minMatches ?? 1);

  if (!normalized) {
    return {
      category: null,
      confidence: 0,
      hits: extraMatches,
      sponsorScore: 0,
      selfpromoScore: 0,
      exclusiveScore: 0,
      negativeScore: 0,
      reason: null
    };
  }

  let sponsorScore = 0;
  let selfpromoScore = 0;
  let exclusiveScore = 0;
  let negativeScore = 0;
  const hits = new Set<string>(extraMatches);
  const matchedLabels = new Set<string>();

  for (const rule of COMMERCIAL_RULES) {
    const ruleHits = collectRuleMatches(normalized, rule);
    if (ruleHits.length === 0) {
      continue;
    }

    matchedLabels.add(rule.label);
    for (const hit of ruleHits) {
      hits.add(hit);
    }

    const effectiveWeight = rule.weight * Math.min(2, ruleHits.length);
    switch (rule.bucket) {
      case "sponsor":
        sponsorScore += effectiveWeight;
        break;
      case "selfpromo":
        selfpromoScore += effectiveWeight;
        break;
      case "exclusive":
        exclusiveScore += effectiveWeight;
        break;
      case "negative":
        negativeScore += effectiveWeight;
        break;
      default:
        break;
    }
  }

  const regexBoost = Math.min(3, extraMatches.length);
  sponsorScore += regexBoost;
  selfpromoScore += Math.min(2, regexBoost);

  const sponsorNet = sponsorScore - negativeScore;
  const selfpromoNet = selfpromoScore - negativeScore;
  const exclusiveNet = exclusiveScore - Math.floor(negativeScore / 2);

  let category: Category | null = null;
  if (sponsorNet >= 6 && (extraMatches.length >= minMatches || sponsorScore >= 8)) {
    category = "sponsor";
  } else if (exclusiveNet >= 4 && sponsorNet < 6) {
    category = "exclusive_access";
  } else if (selfpromoNet >= 4 && sponsorNet < 6) {
    category = "selfpromo";
  } else if (sponsorNet >= 4 && extraMatches.length >= Math.max(1, minMatches)) {
    category = "sponsor";
  }

  const dominantScore =
    category === "sponsor" ? sponsorNet : category === "selfpromo" ? selfpromoNet : category === "exclusive_access" ? exclusiveNet : 0;
  const confidence =
    category === null
      ? 0
      : Math.max(0.58, Math.min(0.97, 0.58 + dominantScore * 0.035 + Math.min(0.12, extraMatches.length * 0.025)));
  const reason =
    category === null
      ? null
      : `命中${[...matchedLabels].slice(0, 3).join(" / ")}线索${extraMatches.length > 0 ? `，并匹配 ${extraMatches.join(" / ")}` : ""}`;

  return {
    category,
    confidence,
    hits: [...hits].slice(0, 8),
    sponsorScore,
    selfpromoScore,
    exclusiveScore,
    negativeScore,
    reason
  };
}
