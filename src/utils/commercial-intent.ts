import type { Category } from "../types";

type CommercialCategory = Extract<Category, "sponsor" | "selfpromo" | "exclusive_access">;

type CommercialRule = {
  token: string;
  pattern: RegExp;
  weight: number;
};

export type CommercialIntentAssessment = {
  category: CommercialCategory | null;
  confidence: number;
  reason: string | null;
  matches: string[];
  sponsorScore: number;
  selfpromoScore: number;
  exclusiveScore: number;
};

export type CommercialActionability = {
  hasActionVerb: boolean;
  hasCommerceSurface: boolean;
  hasBenefitCue: boolean;
  hasPurchaseCue: boolean;
  hasOwnedSurface: boolean;
  hasOwnedActionLead: boolean;
  hasStrongClosure: boolean;
  hasQuotedOrMockingContext: boolean;
};

const BENIGN_CONTEXT_PATTERN =
  /广告位|广告学|推广曲|推广大使|同款(?:bgm|BGM|音乐|滤镜)|团购课|营销课|(?:分享|讨论)广告/iu;
const VIDEO_BENIGN_TOPIC_PATTERN =
  /(?:普通)?(?:测评|评测)|体验(?:记录|分享|感受)|发布会|展会|开放日|媒体日|活动记录|现场(?:体验|直击)?|新品(?:解析|说明)|技术说明|参数对比/iu;
const DISCLAIMER_PATTERN =
  /(?:不是|并非|完全不算|真不是)(?:广告|商单|恰饭)|(?:无广|无广告|无赞助|非商单|非广告|自费购买|自费购入|自己买的|个人自费|无商业合作|没收钱|未收钱|没有接广告|自己花钱买的|自掏腰包)/iu;
const NEGATED_MATCH_PREFIX_PATTERN = /(?:无|没|没有|非|不是|并非|不算|并不是|未|并无|别|勿)$/u;

const SPONSOR_STRONG_RULES: readonly CommercialRule[] = [
  { token: "商单", pattern: /商单|恰饭|金主/iu, weight: 4.2 },
  { token: "赞助", pattern: /本期视频由|由.+赞助|感谢.+赞助|赞助播出|品牌支持|官方支持|合作伙伴/iu, weight: 4.1 },
  { token: "商务合作", pattern: /商务合作|商业合作|品牌合作|联合出品|合作推广/iu, weight: 3.9 },
  { token: "商品卡", pattern: /商品卡|店铺橱窗|购物车|蓝链|专属链接/iu, weight: 3.8 },
  { token: "优惠券", pattern: /优惠(?:券|卷|劵)|折扣码|密令|红包|返利|返现/iu, weight: 3.4 },
  {
    token: "购买指引",
    pattern:
      /(?:立即|直接|马上|点击|戳|去)[^。！？\n]{0,6}(?:下单|购买)|(?:下单|购买)(?:链接|入口|方式|清单)|购买链接|购买清单|使用清单|开箱清单|评论区(?:置顶)?[^。！？\n]{0,10}(?:链接|蓝链|商品卡|领券|购买|下单)/iu,
    weight: 3.3
  }
];

const SPONSOR_SUPPORT_RULES: readonly CommercialRule[] = [
  { token: "广告", pattern: /广告|推广|促销|大促|特价|秒杀|热卖/iu, weight: 1.2 },
  { token: "领券", pattern: /领(?:券|红包|福利)|抢(?:券|红包|福利)|满\d+|低至|到手价/iu, weight: 1.35 },
  { token: "电商平台", pattern: /淘宝|天猫|京东|拼多多|pdd|闲鱼|得物|抖音商城/iu, weight: 1.25 },
  { token: "导购词", pattern: /同款|安利|好物推荐|购物清单|推荐清单|入手建议/iu, weight: 1.05 },
  { token: "外卖导流", pattern: /(?:饿了么|美团|闪购|外卖)(?:红包|优惠|福利|券|平台|活动|服务)?/iu, weight: 0.95 }
];

const SELFPROMO_RULES: readonly CommercialRule[] = [
  { token: "自家店铺", pattern: /(?:我的|本)?(?:店铺|小店|橱窗|闲鱼店|店里|群里)/iu, weight: 2.3 },
  { token: "自家频道", pattern: /(?:我的|本)?(?:频道|直播间|主页|专栏|播客|作品|活动)/iu, weight: 1.9 },
  { token: "自荐导流", pattern: /自荐|导流|安利|收藏夹|合集|置顶看(?:我|简介)|主页见/iu, weight: 1.7 },
  { token: "邀请码", pattern: /邀请码|体验码|兑换码|注册码/iu, weight: 1.8 }
];

const EXCLUSIVE_RULES: readonly CommercialRule[] = [
  { token: "独家访问", pattern: /独家(?:访问|探访|体验)?|独家首发/iu, weight: 3.2 },
  { token: "抢先体验", pattern: /抢先体验|提前体验|抢先上手|首批体验|先行版/iu, weight: 3 },
  { token: "首发", pattern: /首发|首批|首个|最先/iu, weight: 2.1 },
  { token: "工程机", pattern: /工程机|样机|内测|beta|试玩|预览版|体验版/iu, weight: 2.4 }
];

const CTA_ACTION_PATTERN =
  /点击|点开|点进|戳|打开|去|领取|领|抢|下单|购买|买|入手|搜索|看我|看主页|主页见|置顶看我/iu;
const CTA_SURFACE_PATTERN =
  /评论区(?:置顶)?|蓝链|链接|商品卡|店铺|橱窗|主页|频道|直播间|专栏|收藏夹|合集/iu;
const CTA_BENEFIT_PATTERN = /优惠(?:券|卷|劵)|红包|福利|返利|返现|折扣|到手价|密令/iu;
const CTA_PURCHASE_PATTERN = /下单|购买|买|入手/u;
const CTA_OWNED_SURFACE_PATTERN = /(?:我的|本)?(?:店铺|小店|橱窗|主页|频道|直播间|专栏|收藏夹|合集)/iu;
const QUOTED_OR_MOCKING_CONTEXT_PATTERN =
  /玩梗|整活|反串|阴阳怪气|吐槽|调侃|引用|复读|照搬|原话|话术|文案|笑死|绷不住|尬|土味|逆天|离谱|“[^”]{0,24}(?:广告|推广|优惠券|购买|下单|链接)[^”]{0,24}”|"[^"]{0,24}(?:广告|推广|优惠券|购买|下单|链接)[^"]{0,24}"/iu;

function normalizeText(text: string): string {
  return text.replace(/\s+/gu, " ").trim();
}

function unique(values: Iterable<string>): string[] {
  return [...new Set([...values].map((value) => value.trim()).filter(Boolean))];
}

function hasNonNegatedPattern(text: string, pattern: RegExp): boolean {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const globalPattern = new RegExp(pattern.source, flags);
  for (const result of text.matchAll(globalPattern)) {
    const matchedText = result[0];
    const startIndex = result.index ?? text.indexOf(matchedText);
    if (startIndex < 0 || isNegatedMatch(text, startIndex)) {
      continue;
    }
    return true;
  }
  return false;
}

function isNegatedMatch(text: string, startIndex: number): boolean {
  const prefix = text.slice(Math.max(0, startIndex - 8), startIndex).replace(/\s+/gu, "");
  return NEGATED_MATCH_PREFIX_PATTERN.test(prefix);
}

export function inspectCommercialActionability(text: string): CommercialActionability {
  const normalized = normalizeText(text);
  if (!normalized) {
    return {
      hasActionVerb: false,
      hasCommerceSurface: false,
      hasBenefitCue: false,
      hasPurchaseCue: false,
      hasOwnedSurface: false,
      hasOwnedActionLead: false,
      hasStrongClosure: false,
      hasQuotedOrMockingContext: false
    };
  }

  const hasActionVerb = hasNonNegatedPattern(normalized, CTA_ACTION_PATTERN);
  const hasCommerceSurface = hasNonNegatedPattern(normalized, CTA_SURFACE_PATTERN);
  const hasBenefitCue = hasNonNegatedPattern(normalized, CTA_BENEFIT_PATTERN);
  const hasPurchaseCue = hasNonNegatedPattern(normalized, CTA_PURCHASE_PATTERN);
  const hasOwnedSurface = hasNonNegatedPattern(normalized, CTA_OWNED_SURFACE_PATTERN);
  const hasOwnedActionLead = hasOwnedSurface && (hasActionVerb || /主页见|置顶看我/iu.test(normalized));
  const hasStrongClosure =
    (hasActionVerb && hasCommerceSurface) ||
    (hasBenefitCue && (hasCommerceSurface || hasPurchaseCue)) ||
    (hasPurchaseCue && hasCommerceSurface) ||
    hasOwnedActionLead;

  return {
    hasActionVerb,
    hasCommerceSurface,
    hasBenefitCue,
    hasPurchaseCue,
    hasOwnedSurface,
    hasOwnedActionLead,
    hasStrongClosure,
    hasQuotedOrMockingContext: QUOTED_OR_MOCKING_CONTEXT_PATTERN.test(normalized)
  };
}

function collectRuleHits(text: string, rules: readonly CommercialRule[]): { score: number; matches: string[] } {
  const matches: string[] = [];
  let score = 0;

  for (const rule of rules) {
    if (hasNonNegatedPattern(text, rule.pattern)) {
      matches.push(rule.token);
      score += rule.weight;
    }
  }

  return {
    score,
    matches
  };
}

function deriveReason(category: CommercialCategory, matches: string[]): string {
  const joined = matches.slice(0, 4).join(" / ");
  if (category === "exclusive_access") {
    return joined ? `页面出现抢先体验线索：${joined}` : "页面出现抢先体验线索";
  }
  if (category === "selfpromo") {
    return joined ? `页面出现自荐导流线索：${joined}` : "页面出现自荐导流线索";
  }
  return joined ? `页面出现商业合作线索：${joined}` : "页面出现商业合作线索";
}

function clampConfidence(score: number): number {
  return Math.min(0.96, Math.max(0.56, 0.58 + score * 0.045));
}

export function analyzeCommercialIntent(
  text: string,
  options: {
    storedMatches?: string[];
    minMatches?: number;
  } = {}
): CommercialIntentAssessment {
  const normalized = normalizeText(text);
  if (!normalized) {
    return {
      category: null,
      confidence: 0,
      reason: null,
      matches: [],
      sponsorScore: 0,
      selfpromoScore: 0,
      exclusiveScore: 0
    };
  }

  const minMatches = Math.max(1, options.minMatches ?? 1);
  const storedMatches = unique(options.storedMatches ?? []);

  const sponsorStrong = collectRuleHits(normalized, SPONSOR_STRONG_RULES);
  const sponsorSupport = collectRuleHits(normalized, SPONSOR_SUPPORT_RULES);
  const selfpromo = collectRuleHits(normalized, SELFPROMO_RULES);
  const exclusive = collectRuleHits(normalized, EXCLUSIVE_RULES);

  let sponsorScore = sponsorStrong.score + sponsorSupport.score;
  let selfpromoScore = selfpromo.score;
  let exclusiveScore = exclusive.score;

  const hasExplicitCTA =
    /评论区(?:置顶)?|(?:购买|下单|点击|打开).{0,8}(?:链接|蓝链)|(?:领|抢)(?:券|红包|福利)|优惠(?:券|卷|劵)|商品卡/iu.test(
      normalized
    );
  const hasOwnedSurface =
    /(?:我的|本)?(?:频道|店铺|小店|橱窗|直播间|主页|作品|活动|课程|专栏)/iu.test(normalized);
  const benignContext = BENIGN_CONTEXT_PATTERN.test(normalized);
  const benignVideoTopic = VIDEO_BENIGN_TOPIC_PATTERN.test(normalized);

  if (benignContext && sponsorStrong.score === 0 && exclusive.score === 0 && !hasExplicitCTA && !hasOwnedSurface) {
    return {
      category: null,
      confidence: 0,
      reason: null,
      matches: storedMatches,
      sponsorScore: 0,
      selfpromoScore: 0,
      exclusiveScore: 0
    };
  }

  if (storedMatches.length >= minMatches) {
    sponsorScore += 1.05 + Math.min(1.2, storedMatches.length * 0.24);
    selfpromoScore += 0.72 + Math.min(0.9, storedMatches.length * 0.18);
  }

  if (hasExplicitCTA) {
    sponsorScore += 1.45;
  }

  if (hasOwnedSurface && /(?:评论区|置顶|链接|主页|店铺|橱窗|直播间)/iu.test(normalized)) {
    selfpromoScore += 1.4;
  }

  if (DISCLAIMER_PATTERN.test(normalized) && sponsorStrong.score < 4.1) {
    sponsorScore = Math.max(0, sponsorScore - 2.8);
    selfpromoScore = Math.max(0, selfpromoScore - 1.1);
  }

  if (benignContext && sponsorStrong.score === 0 && selfpromoScore < 2.8) {
    sponsorScore = Math.max(0, sponsorScore - 1.8);
    selfpromoScore = Math.max(0, selfpromoScore - 1.5);
  }

  if (benignVideoTopic && sponsorStrong.score === 0 && !hasExplicitCTA) {
    sponsorScore = Math.max(0, sponsorScore - 1.9);
    selfpromoScore = Math.max(0, selfpromoScore - 0.9);
  }

  let category: CommercialCategory | null = null;
  if (
    exclusiveScore >= 2.2 &&
    exclusiveScore >= sponsorScore + 0.35 &&
    exclusiveScore >= selfpromoScore + 0.2
  ) {
    category = "exclusive_access";
  } else if (sponsorScore >= 3.1 || (sponsorScore >= 2.35 && storedMatches.length >= minMatches)) {
    category = "sponsor";
  } else if (selfpromoScore >= 2.2 || (selfpromoScore >= 1.85 && storedMatches.length >= minMatches)) {
    category = sponsorScore >= selfpromoScore + 0.7 ? "sponsor" : "selfpromo";
  }

  if (!category) {
    return {
      category: null,
      confidence: 0,
      reason: null,
      matches: unique([...storedMatches, ...sponsorStrong.matches, ...sponsorSupport.matches, ...selfpromo.matches, ...exclusive.matches]),
      sponsorScore,
      selfpromoScore,
      exclusiveScore
    };
  }

  const categoryMatches =
    category === "exclusive_access"
      ? unique([...exclusive.matches, ...storedMatches])
      : category === "selfpromo"
        ? unique([...selfpromo.matches, ...storedMatches, ...sponsorSupport.matches.filter((value) => value !== "广告")])
        : unique([...sponsorStrong.matches, ...sponsorSupport.matches, ...storedMatches]);

  const strongestScore =
    category === "exclusive_access" ? exclusiveScore : category === "selfpromo" ? selfpromoScore : sponsorScore;

  return {
    category,
    confidence: clampConfidence(strongestScore),
    reason: deriveReason(category, categoryMatches),
    matches: categoryMatches,
    sponsorScore,
    selfpromoScore,
    exclusiveScore
  };
}

export function isBenignCommercialContext(text: string): boolean {
  return BENIGN_CONTEXT_PATTERN.test(normalizeText(text));
}
