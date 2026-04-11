import type { Category, LocalVideoSignal, StoredConfig } from "../types";
import { COMMENT_FEEDBACK_STORAGE_KEY } from "../constants";
import { ConfigStore } from "../core/config-store";
import { collectPatternMatches, isLikelyPromoText, regexFromStoredPattern } from "../utils/pattern";
import { analyzeCommercialIntent, inspectCommercialActionability } from "../utils/commercial-intent";
import { debugLog } from "../utils/dom";
import { mutationsTouchSelectors } from "../utils/mutation";
import { observeUrlChanges } from "../utils/navigation";
import { supportsCommentFilters } from "../utils/page";
import { gmGetValue, gmSetValue, gmXmlHttpRequest } from "../platform/gm";
import {
  createInlineBadge,
  createInlineToggle,
  ensureInlineFeedbackStyles,
  setInlineToggleState,
  type InlineTone
} from "../ui/inline-feedback";

const THREAD_PROCESSED_ATTR = "data-bsb-comment-processed";
const REPLY_PROCESSED_ATTR = "data-bsb-comment-reply-processed";
const PROBE_PENDING_ATTR = "data-bsb-comment-author-probe-pending";
const BADGE_ATTR = "data-bsb-comment-badge";
const TOGGLE_ATTR = "data-bsb-comment-toggle";
const FEEDBACK_MENU_ATTR = "data-bsb-comment-feedback-menu";
const FEEDBACK_TRIGGER_ATTR = "data-bsb-comment-feedback-trigger";
const FEEDBACK_KEEP_ATTR = "data-bsb-comment-feedback-keep";
const FEEDBACK_DISMISS_ATTR = "data-bsb-comment-feedback-dismiss";
const LOCATION_ATTR = "data-bsb-comment-location";
const HIDDEN_ATTR = "data-bsb-comment-hidden";
const REPLIES_HIDDEN_ATTR = "data-bsb-comment-replies-hidden";
const LOCATION_STATE_ATTR = "data-bsb-comment-location-state";
const VUE_LOCATION_MARK_ATTR = "data-bsb-comment-location-settled";
const NO_LOCATION_MARK = "__empty__";
const ROOT_SWEEP_DELAYS_MS = [120, 240, 420, 760, 1200, 1800] as const;
export const VIDEO_SIGNAL_EVENT = "bsb:video-signal";
export const VIDEO_SIGNAL_FEEDBACK_EVENT = "bsb:video-signal-feedback";
export const LOCAL_VIDEO_FEEDBACK_AVAILABILITY_EVENT = "bsb:local-video-feedback-availability";
export type LocalVideoFeedbackDisabledReason =
  | "upstream-whole-video"
  | "pending-upstream"
  | "manual-decision"
  | "unavailable";
export type LocalVideoFeedbackAvailabilityDetail = {
  enabled: boolean;
  locked: boolean;
  disabledReason?: LocalVideoFeedbackDisabledReason;
  bvid?: string | null;
};
const COMMENT_AUTHOR_PROBE_TIMEOUT_MS = 2000;
const COMMENT_AUTHOR_PROBE_CACHE_MS = 12 * 60 * 60 * 1000;
const COMMENT_AUTHOR_PROBE_MAX_IN_FLIGHT = 2;
const COMMENT_FEEDBACK_MAX_RECORDS = 1000;
const COMMENT_RELEVANT_SELECTORS = [
  "bili-comments",
  "bili-comment-thread-renderer",
  "bili-comment-renderer",
  "bili-comment-reply-renderer",
  "bili-comment-replies-renderer",
  "bili-rich-text",
  ".browser-pc",
  ".reply-item",
  ".sub-reply-item",
  ".reply-time",
  ".sub-reply-time"
] as const;
const COMMENT_IGNORED_SELECTORS = [
  `[${BADGE_ATTR}]`,
  `[${TOGGLE_ATTR}]`,
  `[${FEEDBACK_MENU_ATTR}]`,
  `[${FEEDBACK_TRIGGER_ATTR}]`,
  `[${FEEDBACK_KEEP_ATTR}]`,
  `[${FEEDBACK_DISMISS_ATTR}]`,
  `[${LOCATION_ATTR}]`
] as const;
const currentInlineBadgeAppearance = {
  commentBadge: false,
  commentLocation: false
};

type ReplyLocationPayload = {
  reply_control?: {
    location?: string | null;
  } | null;
} | null | undefined;

type CommentRenderer = HTMLElement & {
  shadowRoot: ShadowRoot;
  data?: ReplyLocationPayload & Record<string, unknown>;
};
export type CommentAuthorProfile = {
  mid?: string;
  likelyDormant: boolean;
  vipStatus?: number | null;
  level?: number | null;
  follower?: number | null;
  likeNum?: number | null;
  archiveCount?: number | null;
  isSeniorMember?: boolean | null;
  officialVerifyType?: number | null;
  evidence?: string[];
};
export type CommentShillAssessment = {
  state: "hit" | "candidate" | "pass";
  matches: string[];
};
type CommentSponsorMatch =
  | { reason: "goods"; category: "sponsor"; matches: [] }
  | { reason: "shill"; category: "sponsor"; matches: string[] }
  | { reason: "suspicion"; category: Extract<Category, "sponsor" | "selfpromo" | "exclusive_access">; matches: string[] };
type CommentTarget = {
  host: HTMLElement;
  renderer: CommentRenderer;
  processedAttr: string;
  thread: HTMLElement;
  kind: "comment" | "reply";
};
type LocalVideoFeedbackAvailabilityState = Required<Pick<LocalVideoFeedbackAvailabilityDetail, "enabled" | "locked">> &
  Pick<LocalVideoFeedbackAvailabilityDetail, "disabledReason" | "bvid">;

const COMMENT_STRONG_MATCHES = new Set(["赞助", "商务合作", "商品卡", "优惠券", "购买指引"]);
const COMMENT_INVITATION_PATTERN = /邀请码|体验码|兑换码|注册码/iu;
const COMMENT_SHILL_PATTERNS = {
  purchaseOrUse:
    /(?:刚|才)?(?:买|入手|拿到|收到|下单|收货|到手)|刚好缺|正好缺|缺(?:个|条|件|款)?|想买|准备买|打算买|买过|有没有买过|试穿|穿上|穿了|穿着|穿一天|用了|用起来|洗了|洗几次|下水洗|轮着穿|回购|复购|淘宝买|试试水/iu,
  productQuality:
    /透气|亲肤|弹力|包裹|勒|印子|黏黏|粘粘|闷|性价比|变形|掉色|面料|材质|莫代尔|水洗|下水|洗衣机|丝滑|滑溜|缝线|颜色|尺码|好穿|舒服|舒适|支撑|做工|手感|质感|素材|剪辑|后期|效率|腿粗|卷边|裤腿|往上窜|纯棉|干爽/iu,
  endorsement: /可以|确实|真(?:的)?|挺|非常|绝了|好用|不错|满意|放心|适合|推荐|希望(?:能|可以)|性价比还行|刚好|不会/iu,
  videoLead:
    /up(?:主)?推荐|UP(?:主)?推荐|博主推荐|视频(?:里)?(?:推荐|种草|安利)|刷到|刚好刷到|看(?:了)?评论|评论(?:都|区)?(?:说好|放心)|这(?:个|条|件|款|盒)|同款/iu,
  question: /有没有买过|买过的(?:大佬|兄弟|姐妹)?|说说|问下|洗几次|会不会|会变形不|变形不|靠谱吗|真的假的/iu,
  marketingReply: /客服报|专属优惠|优惠码|优惠|返利|包满意|运费险|随时退|放心入手|报[【\[]?[^\s，。,.]{1,8}[】\]]?/iu,
  problemSolution: /(?:腿粗|卷边|黏|粘|闷|不舒服|勒腿|过敏|春敏|尘螨).{0,40}(?:这个|元力象|这款|商单产品).{0,40}(?:不会|刚好|干爽|舒服|解决|扫清)|(?:以前|之前).{0,18}(?:别家|纯棉|优衣库).{0,32}(?:卷边|黏|粘|闷|不舒服).{0,48}(?:这个|元力象|这款).{0,32}(?:不会|刚好|干爽|舒服)/iu,
  reviewDiscussion: /横评|测评|评测|对比|版型|讲清楚|参考价值/iu,
  prospectiveTrial: /(?:看着|看起来|看)?[\s\S]{0,12}(?:质感|做工|性价比|舒服|舒适)[\s\S]{0,12}(?:准备|打算|想)[\s\S]{0,8}(?:入手|买|下单|试试水)|(?:准备|打算|想)[\s\S]{0,8}(?:入手|买|下单)[\s\S]{0,8}试试水/iu,
  macroPraise: /国产.{0,12}(?:卷|做工|细致|质感)|(?:卷了吗).{0,12}(?:做工|细致|质感)/iu,
  comfortPraise: /不勒腿|确实爽|真爽|穿着爽|穿起来爽/iu,
  priceAmazement: /这价格.{0,16}(?:兰精|莫代尔|性价比|高)|(?:性价比).{0,8}(?:有点|挺|真|太)?高/iu,
  brandComparison: /(?:优衣库|蕉内|ubras|元力象|万力象).{0,24}(?:舒适度|舒服|舒适|比得过|拉踩)|(?:舒适度|舒服|舒适).{0,24}(?:比得过|优衣库|蕉内|ubras|元力象|万力象)/iu,
  warning: /别(?:买|点|被|信)|不(?:推荐|建议|值|好用|舒服)|踩坑|避雷|退(?:了|货|款)|差评|翻车|广告话术|割韭菜/iu
} as const;
const commentAuthorProbeCache = new Map<string, { expiresAt: number; result: CommentAuthorProfile | null }>();
const commentAuthorProbeInFlight = new Map<string, Array<(profile: CommentAuthorProfile | null) => void>>();
const commentFeedbackTokens = new Set<string>();
const submittedCommentFeedbackKeys = new Set<string>();
let submittedCommentFeedbackLoaded = false;
let submittedCommentFeedbackLoadPromise: Promise<void> | null = null;

function getActionRendererNode(commentRenderer: CommentRenderer): HTMLElement | null {
  return (
    commentRenderer.shadowRoot?.querySelector<HTMLElement>("bili-comment-action-buttons-renderer") ??
    commentRenderer.shadowRoot?.querySelector<HTMLElement>("#main bili-comment-action-buttons-renderer") ??
    commentRenderer.shadowRoot?.querySelector<HTMLElement>("#footer bili-comment-action-buttons-renderer") ??
    null
  );
}

function getReplyRendererHost(replyHost: HTMLElement): CommentRenderer | null {
  const nestedRenderer = replyHost.shadowRoot?.querySelector("bili-comment-renderer");
  if (nestedRenderer instanceof HTMLElement && nestedRenderer.shadowRoot) {
    return nestedRenderer as CommentRenderer;
  }

  const replyRoot = replyHost.shadowRoot;
  if (!replyRoot) {
    return null;
  }

  const looksLikeFlatReplyRenderer = Boolean(
    replyRoot.querySelector("bili-comment-user-info") &&
      replyRoot.querySelector("bili-rich-text") &&
      getActionRendererNode(replyHost as CommentRenderer)
  );
  return looksLikeFlatReplyRenderer ? (replyHost as CommentRenderer) : null;
}

export function normalizeCommentLocationText(location: string | null | undefined): string | null {
  const value = String(location ?? "")
    .replace(/\s+/gu, " ")
    .trim();
  if (!value) {
    return null;
  }

  if (/^IP\s*属地/iu.test(value)) {
    return value.replace(/^IP\s*属地\s*[:：]?\s*/iu, "IP属地：");
  }

  return `IP属地：${value}`;
}

export function extractCommentLocation(reply: ReplyLocationPayload): string | null {
  return normalizeCommentLocationText(reply?.reply_control?.location ?? null);
}

const GOODS_STRUCTURAL_PATTERNS = {
  pricePattern: /[¥￥]\s*\d+(?:\.\d+)?/u,
  ecomDomains: /(?:jd\.com|taobao\.com|tmall\.com|pinduoduo\.com|pdd\.com|item\.m\.jd\.com)/iu,
  dataAttrKeywords: /goods|product|commodity|item/iu
};

export function hasSponsoredGoodsLink(commentRenderer: CommentRenderer): boolean {
  const richTextRoot = commentRenderer.shadowRoot?.querySelector("bili-rich-text")?.shadowRoot;
  if (!richTextRoot) {
    return false;
  }

  for (const link of richTextRoot.querySelectorAll<HTMLAnchorElement>("a")) {
    if (link.dataset.type === "goods" || link.getAttribute("data-type") === "goods") {
      return true;
    }

    const href = link.href || link.getAttribute("href") || "";
    if (href && GOODS_STRUCTURAL_PATTERNS.ecomDomains.test(href)) {
      return true;
    }

    const dataType = link.dataset.type || link.getAttribute("data-type") || link.dataset.jumpType || link.getAttribute("data-jump-type") || "";
    if (dataType && GOODS_STRUCTURAL_PATTERNS.dataAttrKeywords.test(dataType)) {
      return true;
    }

    if (GOODS_STRUCTURAL_PATTERNS.pricePattern.test(link.textContent || "")) {
      return true;
    }
  }

  return false;
}

export function hasCommentMediaAttachment(commentRenderer: CommentRenderer): boolean {
  const richTextRoot = commentRenderer.shadowRoot?.querySelector("bili-rich-text")?.shadowRoot;
  const selector = [
    "img",
    "picture",
    "bili-comment-picture",
    "bili-rich-text-img",
    ".reply-picture",
    ".comment-image"
  ].join(",");
  return Boolean(richTextRoot?.querySelector(selector) ?? commentRenderer.shadowRoot?.querySelector(selector));
}

export function extractCommentText(commentRenderer: CommentRenderer): string {
  const richTextNodes = [
    ...(commentRenderer.shadowRoot?.querySelector("bili-rich-text")?.shadowRoot?.querySelectorAll("span, a") ?? [])
  ];
  const nodes = [
    ...richTextNodes,
    ...(commentRenderer.shadowRoot?.querySelectorAll("#content, .reply-content") ?? [])
  ];
  return nodes
    .map((node) => node.textContent?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
}

export function classifyCommentRenderer(
  commentRenderer: CommentRenderer,
  config: Pick<StoredConfig, "dynamicRegexPattern" | "dynamicRegexKeywordMinMatches">,
  authorProfile: CommentAuthorProfile | null = null
): CommentSponsorMatch | null {
  if (hasSponsoredGoodsLink(commentRenderer)) {
    return {
      reason: "goods",
      category: "sponsor",
      matches: []
    };
  }

  const pattern = regexFromStoredPattern(config.dynamicRegexPattern);
  const text = extractCommentText(commentRenderer);
  const storedMatches = pattern ? collectPatternMatches(text, pattern) : [];
  const assessment = analyzeCommercialIntent(text, {
    storedMatches,
    minMatches: config.dynamicRegexKeywordMinMatches
  });
  const actionability = inspectCommercialActionability(text);
  const shillAssessment = inspectCommentShillSignals(commentRenderer, text, actionability.hasQuotedOrMockingContext, authorProfile);
  if (shillAssessment.state === "hit") {
    return {
      reason: "shill",
      category: "sponsor",
      matches: shillAssessment.matches
    };
  }

  if (!assessment.category) {
    return null;
  }

  const hasStrongToken = assessment.matches.some((match) => COMMENT_STRONG_MATCHES.has(match));
  const hasInvitationLead = COMMENT_INVITATION_PATTERN.test(text);
  const hasStrongEvidence = actionability.hasStrongClosure || hasStrongToken || hasInvitationLead;

  if (actionability.hasQuotedOrMockingContext) {
    return null;
  }

  if (
    pattern &&
    !isLikelyPromoText(text, storedMatches, config.dynamicRegexKeywordMinMatches) &&
    !hasStrongEvidence &&
    assessment.category !== "selfpromo"
  ) {
    return null;
  }

  if (assessment.category === "sponsor" && !hasStrongEvidence) {
    return null;
  }

  if (assessment.category === "selfpromo" && !actionability.hasOwnedActionLead && assessment.selfpromoScore < 2.6) {
    return null;
  }

  if (assessment.category === "exclusive_access" && !actionability.hasStrongClosure && assessment.exclusiveScore < 3.2) {
    return null;
  }

  return {
    reason: "suspicion",
    category: assessment.category,
    matches: storedMatches.length > 0 ? storedMatches : assessment.matches
  };
}

export function assessCommentRendererShill(
  commentRenderer: CommentRenderer,
  authorProfile: CommentAuthorProfile | null = null
): CommentShillAssessment {
  const text = extractCommentText(commentRenderer);
  const actionability = inspectCommercialActionability(text);
  return inspectCommentShillSignals(commentRenderer, text, actionability.hasQuotedOrMockingContext, authorProfile);
}

function inspectCommentShillSignals(
  commentRenderer: CommentRenderer,
  text: string,
  hasQuotedOrMockingContext: boolean,
  authorProfile: CommentAuthorProfile | null
): CommentShillAssessment {
  const normalized = normalizeRepeatedCommentText(text);
  if (!normalized || hasQuotedOrMockingContext || COMMENT_SHILL_PATTERNS.warning.test(normalized)) {
    return { state: "pass", matches: [] };
  }

  if (COMMENT_SHILL_PATTERNS.reviewDiscussion.test(normalized) && !COMMENT_SHILL_PATTERNS.marketingReply.test(normalized)) {
    return { state: "pass", matches: [] };
  }

  const hasMedia = hasCommentMediaAttachment(commentRenderer);
  const hits = [
    COMMENT_SHILL_PATTERNS.purchaseOrUse.test(normalized) ? "购买/使用反馈" : null,
    COMMENT_SHILL_PATTERNS.productQuality.test(normalized) ? "产品体验细节" : null,
    COMMENT_SHILL_PATTERNS.endorsement.test(normalized) ? "正向背书" : null,
    COMMENT_SHILL_PATTERNS.videoLead.test(normalized) ? "UP推荐语境" : null,
    COMMENT_SHILL_PATTERNS.question.test(normalized) ? "购买前提问" : null,
    COMMENT_SHILL_PATTERNS.marketingReply.test(normalized) ? "营销回复" : null,
    COMMENT_SHILL_PATTERNS.problemSolution.test(normalized) ? "痛点解决背书" : null,
    hasMedia ? "晒单图" : null
  ].filter((hit): hit is string => Boolean(hit));
  const candidateHits = [
    COMMENT_SHILL_PATTERNS.prospectiveTrial.test(normalized) ? "入手试水话术" : null,
    COMMENT_SHILL_PATTERNS.macroPraise.test(normalized) ? "宏观话术转商品做工" : null,
    COMMENT_SHILL_PATTERNS.comfortPraise.test(normalized) ? "商品穿着体验背书" : null,
    COMMENT_SHILL_PATTERNS.priceAmazement.test(normalized) ? "价格/材质惊叹" : null,
    COMMENT_SHILL_PATTERNS.brandComparison.test(normalized) ? "品牌拉踩提问" : null
  ].filter((hit): hit is string => Boolean(hit));

  const hasPurchaseOrUse = hits.includes("购买/使用反馈");
  const hasProductQuality = hits.includes("产品体验细节");
  const hasEndorsement = hits.includes("正向背书");
  const hasVideoLead = hits.includes("UP推荐语境");
  const hasQuestion = hits.includes("购买前提问");
  const hasMarketingReply = hits.includes("营销回复");
  const hasProblemSolution = hits.includes("痛点解决背书");

  const tightlyCoupledToVideoPromo =
    hasVideoLead && hasPurchaseOrUse && (hasProductQuality || hasEndorsement || hasMedia);
  const testimonialWithEnoughDetail =
    hasPurchaseOrUse && hasProductQuality && hasEndorsement && (hasMedia || normalized.length >= 28);
  const productQuestionWithContext = hasQuestion && hasPurchaseOrUse && hasProductQuality;
  const mediaBackedOrderClaim = hasMedia && hasPurchaseOrUse && (hasProductQuality || hasVideoLead);
  const marketingReplyWithClosure = hasMarketingReply && (hasPurchaseOrUse || hasEndorsement || normalized.length >= 12);
  const problemSolutionTestimonial =
    hasProblemSolution && hasProductQuality && (hasPurchaseOrUse || hasEndorsement || normalized.length >= 28);

  if (
    tightlyCoupledToVideoPromo ||
    testimonialWithEnoughDetail ||
    productQuestionWithContext ||
    mediaBackedOrderClaim ||
    marketingReplyWithClosure ||
    problemSolutionTestimonial
  ) {
    return { state: "hit", matches: hits };
  }

  if (candidateHits.length > 0) {
    const matches = uniqueStrings([...hits, ...candidateHits]);
    if (authorProfile?.likelyDormant) {
      return { state: "hit", matches: uniqueStrings([...matches, "账号状态补证"]) };
    }
    return { state: "candidate", matches };
  }

  return { state: "pass", matches: [] };
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function normalizeRepeatedCommentText(text: string): string {
  const normalized = text.replace(/\s+/gu, " ").trim();
  const chunks = normalized.split(" ").filter(Boolean);
  if (chunks.length === 2 && chunks[0] === chunks[1]) {
    return chunks[0];
  }
  return normalized;
}

export function extractCommentAuthorMid(commentRenderer: CommentRenderer): string | null {
  const data = commentRenderer.data as
    | {
        member?: { mid?: unknown } | null;
        user?: { mid?: unknown } | null;
        mid?: unknown;
      }
    | undefined;
  const dataMid = data?.member?.mid ?? data?.user?.mid ?? data?.mid;
  const normalizedDataMid = normalizeAuthorMid(dataMid);
  if (normalizedDataMid) {
    return normalizedDataMid;
  }

  const userRoot = commentRenderer.shadowRoot?.querySelector("bili-comment-user-info")?.shadowRoot;
  const href = userRoot?.querySelector<HTMLAnchorElement>("a[href*='space.bilibili.com']")?.href ?? "";
  return normalizeAuthorMid(href.match(/space\.bilibili\.com\/(\d+)/iu)?.[1]);
}

function normalizeAuthorMid(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return /^\d{2,}$/u.test(text) ? text : null;
}

function queueCommentAuthorProbe(mid: string, onResult: (profile: CommentAuthorProfile | null) => void): boolean {
  const now = Date.now();
  const cached = commentAuthorProbeCache.get(mid);
  if (cached && cached.expiresAt > now) {
    queueMicrotask(() => onResult(cached.result));
    return true;
  }

  const callbacks = commentAuthorProbeInFlight.get(mid);
  if (callbacks) {
    callbacks.push(onResult);
    return true;
  }

  if (commentAuthorProbeInFlight.size >= COMMENT_AUTHOR_PROBE_MAX_IN_FLIGHT) {
    return false;
  }

  commentAuthorProbeInFlight.set(mid, [onResult]);
  void probeCommentAuthorState(mid)
    .then((result) => {
      commentAuthorProbeCache.set(mid, {
        expiresAt: Date.now() + COMMENT_AUTHOR_PROBE_CACHE_MS,
        result
      });
      debugLog("Comment author probe completed", result);
      notifyCommentAuthorProbeCallbacks(mid, result);
    })
    .catch((error) => {
      commentAuthorProbeCache.set(mid, {
        expiresAt: Date.now() + Math.floor(COMMENT_AUTHOR_PROBE_CACHE_MS / 2),
        result: null
      });
      debugLog("Comment author probe failed", error);
      notifyCommentAuthorProbeCallbacks(mid, null);
    });
  return true;
}

function notifyCommentAuthorProbeCallbacks(mid: string, result: CommentAuthorProfile | null): void {
  const callbacks = commentAuthorProbeInFlight.get(mid) ?? [];
  commentAuthorProbeInFlight.delete(mid);
  for (const callback of callbacks) {
    callback(result);
  }
}

async function probeCommentAuthorState(mid: string): Promise<CommentAuthorProfile> {
  const response = await gmXmlHttpRequest({
    method: "GET",
    url: `https://api.bilibili.com/x/web-interface/card?mid=${encodeURIComponent(mid)}&photo=false`,
    headers: {
      Referer: "https://www.bilibili.com/",
      Origin: "https://www.bilibili.com/"
    },
    timeout: COMMENT_AUTHOR_PROBE_TIMEOUT_MS
  });
  if (!response.ok) {
    throw new Error(`Bilibili author card request failed with HTTP ${response.status}`);
  }

  return parseCommentAuthorCardResponse(mid, response.responseText);
}

export function parseCommentAuthorCardResponse(mid: string, responseText: string): CommentAuthorProfile {
  const payload = JSON.parse(responseText) as {
    code?: unknown;
    data?: {
      card?: {
        vip?: { status?: unknown } | null;
        level_info?: { current_level?: unknown } | null;
        follower?: unknown;
        like_num?: unknown;
        archive_count?: unknown;
        is_senior_member?: unknown;
        official_verify?: { type?: unknown } | null;
      } | null;
    } | null;
  };
  const code = finiteNumberOrNull(payload.code);
  if (code !== null && code !== 0) {
    throw new Error(`Bilibili author card returned code ${code}`);
  }
  const card = payload.data?.card ?? null;
  const vipStatus = finiteNumberOrNull(card?.vip?.status);
  const level = finiteNumberOrNull(card?.level_info?.current_level);
  const follower = finiteNumberOrNull(card?.follower);
  const likeNum = finiteNumberOrNull(card?.like_num);
  const archiveCount = finiteNumberOrNull(card?.archive_count);
  const isSeniorMember = booleanOrNull(card?.is_senior_member);
  const officialVerifyType = finiteNumberOrNull(card?.official_verify?.type);
  const evidence: string[] = [];
  let dormantScore = 0;
  if (vipStatus === 0) {
    dormantScore += 1;
    evidence.push("非会员");
  }
  if (level !== null && level <= 2) {
    dormantScore += 1;
    evidence.push("低等级");
  }
  if (follower !== null && follower <= 3) {
    dormantScore += 1;
    evidence.push("低粉丝");
  }
  if (likeNum !== null && likeNum <= 3) {
    dormantScore += 1;
    evidence.push("低获赞");
  }
  if (archiveCount !== null && archiveCount <= 0) {
    dormantScore += 1;
    evidence.push("无投稿");
  }
  if (mid.length >= 10) {
    dormantScore += 1;
    evidence.push("长UID");
  }
  const protectedProfile =
    isSeniorMember === true ||
    (officialVerifyType !== null && officialVerifyType >= 0) ||
    (follower !== null && follower >= 1000) ||
    (likeNum !== null && likeNum >= 1000) ||
    (archiveCount !== null && archiveCount >= 5);
  return {
    mid,
    likelyDormant: dormantScore >= 4 && !protectedProfile,
    vipStatus,
    level,
    follower,
    likeNum,
    archiveCount,
    isSeniorMember,
    officialVerifyType,
    evidence
  };
}

function finiteNumberOrNull(value: unknown): number | null {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function commentMatchToVideoSignal(match: CommentSponsorMatch): LocalVideoSignal {
  return {
    source: match.reason === "goods" ? "comment-goods" : "comment-suspicion",
    category: match.category,
    confidence:
      match.reason === "goods"
        ? 0.96
        : match.reason === "shill"
          ? 0.84
        : match.category === "sponsor"
          ? 0.87
          : match.category === "exclusive_access"
            ? 0.8
            : 0.79,
    reason:
      match.reason === "goods"
        ? "评论区命中商品卡广告"
        : match.reason === "shill"
          ? `评论区命中疑似托评线索：${match.matches.join(" / ")}`
        : `评论区命中商业线索：${match.matches.join(" / ")}`
  };
}

function getBadgeText(match: CommentSponsorMatch): string {
  if (match.reason === "goods") {
    return "评论区商品广告";
  }
  if (match.reason === "shill") {
    return "疑似托评评论";
  }
  if (match.category === "selfpromo") {
    return `疑似导流评论: ${match.matches.join(" / ")}`;
  }
  if (match.category === "exclusive_access") {
    return `疑似抢先体验评论: ${match.matches.join(" / ")}`;
  }
  return `疑似广告评论: ${match.matches.join(" / ")}`;
}

function getBadgeTone(match: CommentSponsorMatch): InlineTone {
  if (match.reason === "goods" || match.category === "sponsor") {
    return "danger";
  }
  if (match.category === "exclusive_access") {
    return "info";
  }
  return "warning";
}

function dispatchVideoSignal(match: CommentSponsorMatch): void {
  const detail = {
    ...commentMatchToVideoSignal(match),
    matches: match.matches
  };

  window.dispatchEvent(
    new CustomEvent(VIDEO_SIGNAL_EVENT, {
      detail
    })
  );
}

export function createCommentFeedbackToken(): string {
  const randomUUID =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const token = `comment-feedback:${randomUUID}`;
  commentFeedbackTokens.add(token);
  return token;
}

export function consumeCommentFeedbackToken(token: unknown): boolean {
  if (typeof token !== "string" || !commentFeedbackTokens.has(token)) {
    return false;
  }
  commentFeedbackTokens.delete(token);
  return true;
}

function dispatchVideoSignalFeedback(
  match: CommentSponsorMatch,
  decision: "confirm" | "dismiss",
  feedbackToken: string,
  feedbackKey: string | null
): void {
  const detail = {
    decision,
    feedbackToken,
    feedbackKey,
    ...commentMatchToVideoSignal(match),
    matches: match.matches
  };

  window.dispatchEvent(
    new CustomEvent(VIDEO_SIGNAL_FEEDBACK_EVENT, {
      detail
    })
  );
}

async function loadSubmittedCommentFeedbackKeys(): Promise<void> {
  if (submittedCommentFeedbackLoaded) {
    return;
  }
  if (submittedCommentFeedbackLoadPromise) {
    return submittedCommentFeedbackLoadPromise;
  }

  submittedCommentFeedbackLoadPromise = gmGetValue<Record<string, number> | null>(COMMENT_FEEDBACK_STORAGE_KEY, null)
    .then((payload) => {
      submittedCommentFeedbackKeys.clear();
      const entries = Object.entries(payload ?? {})
        .filter(([key, value]) => key.startsWith("BV") && Number.isFinite(value))
        .sort((left, right) => right[1] - left[1])
        .slice(0, COMMENT_FEEDBACK_MAX_RECORDS);
      for (const [key] of entries) {
        submittedCommentFeedbackKeys.add(key);
      }
      submittedCommentFeedbackLoaded = true;
    })
    .catch((error) => {
      debugLog("Failed to load comment feedback state", error);
      submittedCommentFeedbackLoaded = true;
    })
    .finally(() => {
      submittedCommentFeedbackLoadPromise = null;
    });
  return submittedCommentFeedbackLoadPromise;
}

async function rememberSubmittedCommentFeedbackKey(key: string | null): Promise<void> {
  if (!key) {
    return;
  }
  await loadSubmittedCommentFeedbackKeys();
  submittedCommentFeedbackKeys.add(key);
  const existing = await gmGetValue<Record<string, number> | null>(COMMENT_FEEDBACK_STORAGE_KEY, null);
  const now = Date.now();
  const payload = Object.fromEntries(
    Object.entries({ ...(existing ?? {}), [key]: now })
      .filter(([entryKey, value]) => entryKey.startsWith("BV") && Number.isFinite(value))
      .sort((left, right) => right[1] - left[1])
      .slice(0, COMMENT_FEEDBACK_MAX_RECORDS)
  );
  submittedCommentFeedbackKeys.clear();
  for (const entryKey of Object.keys(payload)) {
    submittedCommentFeedbackKeys.add(entryKey);
  }
  await gmSetValue(COMMENT_FEEDBACK_STORAGE_KEY, payload);
}

function hasSubmittedCommentFeedbackKey(key: string | null): boolean {
  return Boolean(key && submittedCommentFeedbackKeys.has(key));
}

function createCommentFeedbackKey(bvid: string | null | undefined, commentRenderer: CommentRenderer, match: CommentSponsorMatch): string | null {
  if (!bvid) {
    return null;
  }
  const text = normalizeRepeatedCommentText(extractCommentText(commentRenderer)).slice(0, 220);
  if (!text) {
    return null;
  }
  const authorMid = extractCommentAuthorMid(commentRenderer) ?? "anonymous";
  return `${bvid}:${hashCommentFeedbackIdentity(`${authorMid}|${match.reason}|${match.category}|${text}`)}`;
}

function hashCommentFeedbackIdentity(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function getBadgeRoot(commentRenderer: CommentRenderer): ShadowRoot | null {
  return commentRenderer.shadowRoot?.querySelector("bili-comment-user-info")?.shadowRoot ?? null;
}

function getActionRoot(commentRenderer: CommentRenderer): ShadowRoot | null {
  return getActionRendererNode(commentRenderer)?.shadowRoot ?? null;
}

export function scanCurrentPageCommentSignal(
  config: Pick<StoredConfig, "dynamicRegexPattern" | "dynamicRegexKeywordMinMatches">
): LocalVideoSignal | null {
  const host = document.querySelector("bili-comments");
  const root = host?.shadowRoot;
  if (!root) {
    return null;
  }

  for (const thread of root.querySelectorAll<HTMLElement>("bili-comment-thread-renderer")) {
    const mainRenderer = getMainCommentRenderer(thread);
    if (mainRenderer) {
      const match = classifyCommentRenderer(mainRenderer, config);
      if (match) {
        return commentMatchToVideoSignal(match);
      }
    }

    for (const replyTarget of getReplyTargets(thread)) {
      const match = classifyCommentRenderer(replyTarget.renderer, config);
      if (match) {
        return commentMatchToVideoSignal(match);
      }
    }
  }

  return null;
}

function createBadge(text: string, tone: InlineTone, color?: string): HTMLElement {
  return createInlineBadge(
    BADGE_ATTR,
    text,
    tone,
    "inline",
    color,
    currentInlineBadgeAppearance.commentBadge ? "glass" : "solid"
  );
}

function createToggleButton(onClick: () => void): HTMLButtonElement {
  const button = createInlineToggle(TOGGLE_ATTR, onClick, "inline");
  return button;
}

function createFeedbackButton(
  attrName: string,
  text: string,
  title: string,
  onClick: () => void
): HTMLButtonElement {
  const button = createInlineToggle(attrName, onClick, "inline");
  button.dataset.state = "hidden";
  button.setAttribute("aria-pressed", "false");
  button.textContent = text;
  button.title = title;
  return button;
}

function createFeedbackMenu(match: CommentSponsorMatch, feedbackKey: string | null, alreadySubmitted = false): HTMLElement {
  const menu = document.createElement("span");
  const choices = document.createElement("span");
  const feedbackToken = createCommentFeedbackToken();
  let submitted = alreadySubmitted;
  const trigger = createFeedbackButton(
    FEEDBACK_TRIGGER_ATTR,
    "反馈",
    "反馈这条评论对当前视频本地标签的影响",
    () => {
      setFeedbackMenuOpen(trigger, choices, trigger.getAttribute("aria-expanded") !== "true");
    }
  );
  const keepButton = createFeedbackButton(
    FEEDBACK_KEEP_ATTR,
    "保留",
    "保留这条本地推理结果。提交后这条评论不可重复反馈。",
    () => {
      if (submitted) {
        return;
      }
      submitted = true;
      void rememberSubmittedCommentFeedbackKey(feedbackKey);
      dispatchVideoSignalFeedback(match, "confirm", feedbackToken, feedbackKey);
      setFeedbackMenuSubmitted(menu, trigger, choices, keepButton, dismissButton);
    }
  );
  const dismissButton = createFeedbackButton(
    FEEDBACK_DISMISS_ATTR,
    "忽略",
    "忽略这条本地推理结果。提交后这条评论不可重复反馈。",
    () => {
      if (submitted) {
        return;
      }
      submitted = true;
      void rememberSubmittedCommentFeedbackKey(feedbackKey);
      dispatchVideoSignalFeedback(match, "dismiss", feedbackToken, feedbackKey);
      setFeedbackMenuSubmitted(menu, trigger, choices, keepButton, dismissButton);
    }
  );

  menu.className = "bsb-tm-inline-feedback-menu";
  menu.setAttribute(FEEDBACK_MENU_ATTR, "true");
  menu.dataset.open = "false";
  menu.dataset.submitted = String(alreadySubmitted);
  choices.className = "bsb-tm-inline-feedback-menu__choices";
  choices.setAttribute("role", "menu");
  choices.setAttribute("aria-hidden", "true");
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");
  keepButton.setAttribute("role", "menuitem");
  dismissButton.setAttribute("role", "menuitem");

  choices.append(keepButton, dismissButton);
  menu.append(trigger, choices);
  if (alreadySubmitted) {
    setFeedbackMenuSubmitted(menu, trigger, choices, keepButton, dismissButton);
  }
  return menu;
}

function createDisabledFeedbackMenu(state: LocalVideoFeedbackAvailabilityState): HTMLElement {
  const menu = document.createElement("span");
  const trigger = createFeedbackButton(
    FEEDBACK_TRIGGER_ATTR,
    resolveDisabledFeedbackLabel(state),
    resolveDisabledFeedbackTitle(state),
    () => {}
  );
  menu.className = "bsb-tm-inline-feedback-menu";
  menu.setAttribute(FEEDBACK_MENU_ATTR, "true");
  menu.dataset.open = "false";
  menu.dataset.submitted = state.disabledReason === "manual-decision" ? "true" : "false";
  menu.dataset.disabled = "true";
  trigger.disabled = true;
  trigger.dataset.state = state.disabledReason === "manual-decision" ? "shown" : "hidden";
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-disabled", "true");
  menu.append(trigger);
  return menu;
}

function resolveDisabledFeedbackLabel(state: LocalVideoFeedbackAvailabilityState): string {
  if (state.disabledReason === "manual-decision") {
    return "已提交";
  }
  if (state.disabledReason === "upstream-whole-video") {
    return "上游已接管";
  }
  if (state.disabledReason === "pending-upstream") {
    return "同步中";
  }
  return "反馈不可用";
}

function resolveDisabledFeedbackTitle(state: LocalVideoFeedbackAvailabilityState): string {
  if (state.disabledReason === "manual-decision") {
    return "你已对当前视频提交过本地反馈，本地学习不会重复处理。";
  }
  if (state.disabledReason === "upstream-whole-video") {
    return "当前视频已有上游整视频记录，本地评论反馈不会覆盖上游判断。";
  }
  if (state.disabledReason === "pending-upstream") {
    return "正在等待上游整视频记录结果，确认后再决定是否允许本地反馈。";
  }
  return "当前页面暂时不能提交本地视频反馈。";
}

function setFeedbackMenuOpen(trigger: HTMLButtonElement, choices: HTMLElement, open: boolean): void {
  const menu = trigger.closest<HTMLElement>(`[${FEEDBACK_MENU_ATTR}='true']`);
  if (menu) {
    menu.dataset.open = String(open);
  }
  trigger.dataset.state = open ? "shown" : "hidden";
  trigger.setAttribute("aria-expanded", String(open));
  choices.setAttribute("aria-hidden", String(!open));
}

function setFeedbackMenuSubmitted(
  menu: HTMLElement,
  trigger: HTMLButtonElement,
  choices: HTMLElement,
  keepButton: HTMLButtonElement,
  dismissButton: HTMLButtonElement
): void {
  menu.dataset.submitted = "true";
  setFeedbackMenuOpen(trigger, choices, false);
  trigger.textContent = "已提交";
  trigger.title = "已提交，不可重复操作。本地学习会按你的选择处理这条评论。";
  trigger.disabled = true;
  keepButton.disabled = true;
  dismissButton.disabled = true;
}

function createLocationBadge(text: string, color?: string): HTMLDivElement {
  return createInlineBadge(
    LOCATION_ATTR,
    text,
    "info",
    "inline",
    color,
    currentInlineBadgeAppearance.commentLocation ? "glass" : "solid"
  );
}

function getMainCommentRenderer(thread: HTMLElement): CommentRenderer | null {
  const renderer = thread.shadowRoot?.querySelector("bili-comment-renderer");
  return renderer instanceof HTMLElement && renderer.shadowRoot ? (renderer as CommentRenderer) : null;
}

function getReplyTargets(thread: HTMLElement): CommentTarget[] {
  const repliesRenderer = thread.shadowRoot?.querySelector("bili-comment-replies-renderer");
  const repliesRoot = repliesRenderer?.shadowRoot;
  if (!repliesRoot) {
    return [];
  }

  const targets: CommentTarget[] = [];
  for (const reply of repliesRoot.querySelectorAll<HTMLElement>("bili-comment-reply-renderer")) {
    const renderer = getReplyRendererHost(reply);
    if (!renderer) {
      continue;
    }

    targets.push({
      host: reply,
      renderer,
      processedAttr: REPLY_PROCESSED_ATTR,
      thread,
      kind: "reply"
    });
  }
  return targets;
}

function getBadgeAnchor(commentRenderer: CommentRenderer): HTMLElement | null {
  const userInfo = commentRenderer.shadowRoot?.querySelector("bili-comment-user-info");
  const infoRoot = userInfo?.shadowRoot;
  return infoRoot?.querySelector<HTMLElement>("#user-up") ?? infoRoot?.querySelector<HTMLElement>("#user-level") ?? null;
}

function getContentBody(commentRenderer: CommentRenderer): HTMLElement | null {
  return (
    commentRenderer.shadowRoot?.querySelector<HTMLElement>("#content") ??
    commentRenderer.shadowRoot?.querySelector<HTMLElement>(".reply-content") ??
    commentRenderer.shadowRoot?.querySelector<HTMLElement>("bili-rich-text") ??
    null
  );
}

function getActionAnchor(commentRenderer: CommentRenderer): HTMLElement | null {
  return getActionRoot(commentRenderer)?.querySelector<HTMLElement>("#reply") ?? getContentBody(commentRenderer);
}

function getLocationAnchor(commentRenderer: CommentRenderer): HTMLElement | null {
  return getActionRoot(commentRenderer)?.getElementById("pubdate") ?? getActionAnchor(commentRenderer);
}

function cleanupActionRootLocationNodes(actionRoot: ShadowRoot): void {
  actionRoot
    .querySelectorAll<HTMLElement>(`[${LOCATION_ATTR}='true'], #location, .reply-location`)
    .forEach((node) => node.remove());
}

export function resolveCommentRendererLocation(commentRenderer: CommentRenderer): string | null {
  const fromReplyData = extractCommentLocation(commentRenderer.data);
  if (fromReplyData) {
    return fromReplyData;
  }

  const actionRoot = getActionRoot(commentRenderer);
  const legacyText =
    actionRoot?.getElementById("location")?.textContent ??
    actionRoot?.querySelector<HTMLElement>(".reply-location")?.textContent ??
    null;
  return normalizeCommentLocationText(legacyText);
}

function injectCommentLocation(commentRenderer: CommentRenderer, color?: string): void {
  const actionRoot = getActionRoot(commentRenderer);
  const anchor = getLocationAnchor(commentRenderer);
  if (!actionRoot || !anchor) {
    return;
  }

  const text = resolveCommentRendererLocation(commentRenderer);
  const locationState = text ?? NO_LOCATION_MARK;
  if (commentRenderer.getAttribute(LOCATION_STATE_ATTR) === locationState) {
    return;
  }

  const existing = actionRoot.querySelector<HTMLElement>(`[${LOCATION_ATTR}='true']`);
  if (existing && existing.textContent?.trim() === text) {
    commentRenderer.setAttribute(LOCATION_STATE_ATTR, locationState);
    return;
  }

  cleanupActionRootLocationNodes(actionRoot);
  if (!text) {
    commentRenderer.setAttribute(LOCATION_STATE_ATTR, NO_LOCATION_MARK);
    return;
  }

  ensureInlineFeedbackStyles(actionRoot);
  insertAfter(anchor, createLocationBadge(text, color));
  commentRenderer.setAttribute(LOCATION_STATE_ATTR, text);
}

function extractVueReplyPayload(node: Element): ReplyLocationPayload {
  const component = Reflect.get(node, "__vueParentComponent") as
    | { props?: { reply?: ReplyLocationPayload; subReply?: ReplyLocationPayload } }
    | undefined;
  return component?.props?.reply ?? component?.props?.subReply ?? null;
}

export function resolveVueCommentLocation(node: Element): string | null {
  const fromReply = extractCommentLocation(extractVueReplyPayload(node));
  if (fromReply) {
    return fromReply;
  }

  const legacyText = node.parentElement?.querySelector<HTMLElement>(".reply-location")?.textContent ?? null;
  return normalizeCommentLocationText(legacyText);
}

function cleanupVueLocationNodes(scope: ParentNode = document): void {
  scope
    .querySelectorAll<HTMLElement>(`.reply-location, [${LOCATION_ATTR}='true']`)
    .forEach((node) => node.remove());
  scope
    .querySelectorAll<HTMLElement>(`[${VUE_LOCATION_MARK_ATTR}]`)
    .forEach((node) => node.removeAttribute(VUE_LOCATION_MARK_ATTR));
}

function injectVueCommentLocation(node: HTMLElement, color?: string): void {
  const text = resolveVueCommentLocation(node);
  const nextMarker = text ?? NO_LOCATION_MARK;
  const currentMarker = node.getAttribute(VUE_LOCATION_MARK_ATTR);
  if (currentMarker && currentMarker === nextMarker) {
    return;
  }

  const siblingLocations = Array.from(node.parentElement?.children ?? []).filter((child) => {
    if (!(child instanceof HTMLElement) || child === node) {
      return false;
    }
    return child.classList.contains("reply-location") || child.getAttribute(LOCATION_ATTR) === "true";
  });
  siblingLocations.forEach((child) => child.remove());

  if (!text) {
    node.setAttribute(VUE_LOCATION_MARK_ATTR, NO_LOCATION_MARK);
    return;
  }

  const badge = createLocationBadge(text, color);
  node.insertAdjacentElement("afterend", badge);
  node.setAttribute(VUE_LOCATION_MARK_ATTR, text);
}

function removeInjectedDecorations(commentRenderer: CommentRenderer): void {
  getBadgeRoot(commentRenderer)?.querySelectorAll<HTMLElement>(`[${BADGE_ATTR}='true']`).forEach((node) => node.remove());
  const actionRoot = getActionRoot(commentRenderer);
  const roots = new Set<ParentNode>([commentRenderer.shadowRoot]);
  if (actionRoot) {
    roots.add(actionRoot);
  }
  for (const root of roots) {
    root
      .querySelectorAll<HTMLElement>(
        `[${TOGGLE_ATTR}='true'], [${FEEDBACK_MENU_ATTR}='true'], [${FEEDBACK_TRIGGER_ATTR}='true'], [${FEEDBACK_KEEP_ATTR}='true'], [${FEEDBACK_DISMISS_ATTR}='true'], [${LOCATION_ATTR}='true'], #location, .reply-location`
      )
      .forEach((node) => node.remove());
  }
}

function insertAfter(anchor: Node, node: Node): boolean {
  const parent = anchor.parentNode;
  if (!parent) {
    return false;
  }

  parent.insertBefore(node, anchor.nextSibling);
  return true;
}

function setCommentHidden(content: HTMLElement, toggle: HTMLButtonElement, hidden: boolean): void {
  content.style.display = hidden ? "none" : "";
  content.setAttribute(HIDDEN_ATTR, String(hidden));
  toggle.setAttribute("data-bsb-comment-hidden", String(hidden));
  setInlineToggleState(toggle, hidden ? "hidden" : "shown", {
    hidden: "显示评论内容",
    shown: "再次隐藏评论"
  });
}

function hideReplies(thread: HTMLElement): void {
  const repliesRenderer = thread.shadowRoot?.querySelector("bili-comment-replies-renderer");
  const repliesRoot = repliesRenderer?.shadowRoot;
  if (!repliesRoot) {
    return;
  }

  repliesRoot.querySelectorAll<HTMLElement>("bili-comment-reply-renderer").forEach((reply) => {
    reply.style.display = "none";
    reply.setAttribute(REPLIES_HIDDEN_ATTR, "true");
  });
}

function restoreReplies(thread: HTMLElement): void {
  const repliesRenderer = thread.shadowRoot?.querySelector("bili-comment-replies-renderer");
  const repliesRoot = repliesRenderer?.shadowRoot;
  if (!repliesRoot) {
    return;
  }

  repliesRoot.querySelectorAll<HTMLElement>(`bili-comment-reply-renderer[${REPLIES_HIDDEN_ATTR}='true']`).forEach((reply) => {
    reply.style.display = "";
    reply.removeAttribute(REPLIES_HIDDEN_ATTR);
  });
}

export class CommentSponsorController {
  private started = false;
  private currentConfig: StoredConfig;
  private localVideoFeedbackAvailability: LocalVideoFeedbackAvailabilityState = {
    enabled: false,
    locked: false,
    disabledReason: "unavailable",
    bvid: null
  };
  private rootSweepTimerId: number | null = null;
  private rootSweepAttempt = 0;
  private documentObserver: MutationObserver | null = null;
  private refreshTimerId: number | null = null;
  private stopObservingUrl: (() => void) | null = null;
  private readonly rootObservers = new Map<HTMLElement, MutationObserver>();
  private pendingVisibleRefresh = false;
  private readonly handleVisibilityChange = () => {
    if (!document.hidden && this.pendingVisibleRefresh) {
      this.pendingVisibleRefresh = false;
      this.scheduleRefresh();
    }
  };
  private readonly handleFeedbackAvailability = (event: Event) => {
    if (!(event instanceof CustomEvent)) {
      return;
    }

    const nextState = normalizeLocalVideoFeedbackAvailability(event.detail);
    if (isSameFeedbackAvailability(nextState, this.localVideoFeedbackAvailability)) {
      return;
    }

    this.localVideoFeedbackAvailability = nextState;
    this.resetProcessedThreads();
    this.scheduleRefresh();
  };

  constructor(private readonly configStore: ConfigStore) {
    this.currentConfig = this.configStore.getSnapshot();
    currentInlineBadgeAppearance.commentBadge = this.currentConfig.labelTransparency.commentBadge;
    currentInlineBadgeAppearance.commentLocation = this.currentConfig.labelTransparency.commentLocation;
    this.configStore.subscribe((config) => {
      this.currentConfig = config;
      currentInlineBadgeAppearance.commentBadge = config.labelTransparency.commentBadge;
      currentInlineBadgeAppearance.commentLocation = config.labelTransparency.commentLocation;
      this.resetProcessedThreads();
      this.scheduleRefresh();
    });
  }

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.scheduleRefresh();
    this.scheduleRootSweep(true);
    void loadSubmittedCommentFeedbackKeys().then(() => {
      if (!this.started) {
        return;
      }
      this.resetProcessedThreads();
      this.scheduleRefresh();
    });

    this.stopObservingUrl = observeUrlChanges(() => {
      this.resetProcessedThreads();
      this.rootSweepAttempt = 0;
      this.scheduleRefresh();
      this.scheduleRootSweep(true);
    });

    this.documentObserver = new MutationObserver((records) => {
      if (!mutationsTouchSelectors(records, COMMENT_RELEVANT_SELECTORS, COMMENT_IGNORED_SELECTORS)) {
        return;
      }
      this.scheduleRefresh();
      this.scheduleRootSweep(true);
    });
    this.documentObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener(LOCAL_VIDEO_FEEDBACK_AVAILABILITY_EVENT, this.handleFeedbackAvailability as EventListener);

    window.addEventListener(
      "pagehide",
      () => {
        this.stop();
      },
      { once: true }
    );
  }

  stop(): void {
    if (!this.started) {
      return;
    }

    this.started = false;
    if (this.stopObservingUrl) {
      this.stopObservingUrl();
      this.stopObservingUrl = null;
    }
    if (this.rootSweepTimerId !== null) {
      window.clearTimeout(this.rootSweepTimerId);
      this.rootSweepTimerId = null;
    }
    if (this.refreshTimerId !== null) {
      window.clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
    this.documentObserver?.disconnect();
    this.documentObserver = null;
    this.disconnectRootObservers();
    this.pendingVisibleRefresh = false;
    this.rootSweepAttempt = 0;
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    window.removeEventListener(LOCAL_VIDEO_FEEDBACK_AVAILABILITY_EVENT, this.handleFeedbackAvailability as EventListener);
    this.resetProcessedThreads();
  }

  private scheduleRootSweep(force = false): void {
    if (!this.started) {
      return;
    }

    // Keep a short adaptive retry window for comment roots instead of a permanent
    // polling loop. Once roots appear, shadow-root observers take over.
    if (force) {
      this.rootSweepAttempt = 0;
      if (this.rootSweepTimerId !== null) {
        window.clearTimeout(this.rootSweepTimerId);
        this.rootSweepTimerId = null;
      }
    } else if (this.rootSweepTimerId !== null) {
      return;
    }

    const index = Math.min(this.rootSweepAttempt, ROOT_SWEEP_DELAYS_MS.length - 1);
    const delay = ROOT_SWEEP_DELAYS_MS[index];
    this.rootSweepTimerId = window.setTimeout(() => {
      this.rootSweepTimerId = null;
      if (!this.started || document.hidden) {
        this.pendingVisibleRefresh = true;
        return;
      }
      this.refresh();
      this.rootSweepAttempt += 1;
    }, delay);
  }

  private scheduleRefresh(): void {
    if (document.hidden) {
      this.pendingVisibleRefresh = true;
      return;
    }

    if (this.refreshTimerId !== null) {
      return;
    }

    this.refreshTimerId = window.setTimeout(() => {
      this.refreshTimerId = null;
      const schedule =
        typeof requestIdleCallback === "function"
          ? requestIdleCallback
          : (cb: () => void) => window.setTimeout(cb, 0);
      schedule(() => {
        this.refresh();
      });
    }, 160);
  }

  private refresh(): void {
    if (document.hidden) {
      this.pendingVisibleRefresh = true;
      return;
    }

    if (
      !this.currentConfig.enabled ||
      (this.currentConfig.commentFilterMode === "off" && !this.currentConfig.commentLocationEnabled) ||
      !supportsCommentFilters(window.location.href)
    ) {
      this.disconnectRootObservers();
      this.resetProcessedThreads();
      return;
    }

    const roots = Array.from(document.querySelectorAll<HTMLElement>("bili-comments"));
    if (roots.length === 0) {
      this.scheduleRootSweep();
    } else {
      this.rootSweepAttempt = 0;
      if (this.rootSweepTimerId !== null) {
        window.clearTimeout(this.rootSweepTimerId);
        this.rootSweepTimerId = null;
      }
    }
    this.syncRootObservers(roots);
    for (const root of roots) {
      try {
        this.scanCommentRoot(root);
      } catch (error) {
        debugLog("Failed to process comment root", error);
      }
    }
    this.processVueComments();
  }

  private syncRootObservers(roots: HTMLElement[]): void {
    const liveRoots = new Set(roots);
    const subRoots = new Set<HTMLElement>();

    // Collect all reply renderers that have shadow roots
    for (const root of roots) {
      const feedRoot = root.shadowRoot;
      if (!feedRoot) continue;
      
      feedRoot.querySelectorAll<HTMLElement>("bili-comment-thread-renderer").forEach(thread => {
        const repliesRenderer = thread.shadowRoot?.querySelector<HTMLElement>("bili-comment-replies-renderer");
        if (repliesRenderer?.shadowRoot) {
          subRoots.add(repliesRenderer);
        }
      });
    }

    const allTargetRoots = new Set([...liveRoots, ...subRoots]);

    for (const [root, observer] of this.rootObservers) {
      if (!allTargetRoots.has(root) || !document.contains(root)) {
        observer.disconnect();
        this.rootObservers.delete(root);
      }
    }

    for (const root of allTargetRoots) {
      if (this.rootObservers.has(root) || !root.shadowRoot) {
        continue;
      }

      const observer = new MutationObserver((records) => {
        if (!mutationsTouchSelectors(records, COMMENT_RELEVANT_SELECTORS, COMMENT_IGNORED_SELECTORS)) {
          return;
        }
        this.scheduleRefresh();
      });
      
      observer.observe(root.shadowRoot, {
        childList: true,
        subtree: true
      });
      this.rootObservers.set(root, observer);
    }
  }

  private disconnectRootObservers(): void {
    for (const observer of this.rootObservers.values()) {
      observer.disconnect();
    }
    this.rootObservers.clear();
  }

  private scanCommentRoot(root: HTMLElement): void {
    const feedRoot = root.shadowRoot;
    if (!feedRoot) {
      return;
    }

    for (const thread of feedRoot.querySelectorAll<HTMLElement>("bili-comment-thread-renderer")) {
      const mainRenderer = getMainCommentRenderer(thread);
      if (mainRenderer) {
        this.processTarget({
          host: thread,
          renderer: mainRenderer,
          processedAttr: THREAD_PROCESSED_ATTR,
          thread,
          kind: "comment"
        });
      }

      for (const replyTarget of getReplyTargets(thread)) {
        this.processTarget(replyTarget);
      }
    }
  }

  private processTarget(target: CommentTarget): void {
    if (this.currentConfig.commentLocationEnabled) {
      injectCommentLocation(target.renderer, this.currentConfig.commentIpColor);
    }

    if (target.host.getAttribute(target.processedAttr) === "true") {
      return;
    }

    const match = classifyCommentRenderer(target.renderer, this.currentConfig);
    if (!match) {
      this.queueCandidateAuthorUpgrade(target);
      return;
    }

    this.applyTargetMatch(target, match);
  }

  private queueCandidateAuthorUpgrade(target: CommentTarget): void {
    if (target.host.getAttribute(PROBE_PENDING_ATTR) === "true") {
      return;
    }

    const assessment = assessCommentRendererShill(target.renderer);
    if (assessment.state !== "candidate") {
      return;
    }

    const mid = extractCommentAuthorMid(target.renderer);
    if (!mid) {
      return;
    }

    target.host.setAttribute(PROBE_PENDING_ATTR, "true");
    const queued = queueCommentAuthorProbe(mid, (profile) => {
      target.host.removeAttribute(PROBE_PENDING_ATTR);
      if (!profile?.likelyDormant || !target.host.isConnected || target.host.getAttribute(target.processedAttr) === "true") {
        return;
      }

      const match = classifyCommentRenderer(target.renderer, this.currentConfig, profile);
      if (match?.reason === "shill") {
        this.applyTargetMatch(target, match);
      }
    });
    if (!queued) {
      target.host.removeAttribute(PROBE_PENDING_ATTR);
    }
  }

  private applyTargetMatch(target: CommentTarget, match: CommentSponsorMatch): void {
    if (target.kind === "comment") {
      dispatchVideoSignal(match);
    }

    const badgeAnchor = getBadgeAnchor(target.renderer);
    if (!badgeAnchor) {
      return;
    }

    target.host.setAttribute(target.processedAttr, "true");
    const badgeRoot = getBadgeRoot(target.renderer);
    if (badgeRoot) {
      ensureInlineFeedbackStyles(badgeRoot);
    }

    const badge = createBadge(getBadgeText(match), getBadgeTone(match), this.currentConfig.commentAdColor);
    if (!insertAfter(badgeAnchor, badge)) {
      target.host.removeAttribute(target.processedAttr);
      return;
    }

    const actionAnchor = getActionAnchor(target.renderer);
    const actionRoot = getActionRoot(target.renderer);
    if (actionAnchor) {
      const feedbackRoot = actionRoot ?? target.renderer.shadowRoot;
      ensureInlineFeedbackStyles(feedbackRoot);
      const feedbackKey = createCommentFeedbackKey(this.localVideoFeedbackAvailability.bvid, target.renderer, match);
      const feedbackNode = this.localVideoFeedbackAvailability.enabled
        ? createFeedbackMenu(match, feedbackKey, hasSubmittedCommentFeedbackKey(feedbackKey))
        : this.shouldRenderDisabledFeedback()
          ? createDisabledFeedbackMenu(this.localVideoFeedbackAvailability)
          : null;
      if (feedbackNode) {
        insertAfter(actionAnchor, feedbackNode);
      }
    }

    if (this.currentConfig.commentFilterMode !== "hide") {
      return;
    }

    const content = getContentBody(target.renderer);
    if (!content || !actionAnchor) {
      return;
    }

    if (actionRoot) {
      ensureInlineFeedbackStyles(actionRoot);
    }

    const toggle = createToggleButton(() => {
      const hidden = content.style.display === "none";
      setCommentHidden(content, toggle, !hidden);
      if (target.kind === "comment" && this.currentConfig.commentHideReplies) {
        if (hidden) {
          restoreReplies(target.thread);
        } else {
          hideReplies(target.thread);
        }
      }
    });
    setCommentHidden(content, toggle, true);
    if (!insertAfter(actionAnchor, toggle)) {
      return;
    }

    if (target.kind === "comment" && this.currentConfig.commentHideReplies) {
      hideReplies(target.thread);
    }
  }

  private shouldRenderDisabledFeedback(): boolean {
    return (
      this.localVideoFeedbackAvailability.disabledReason === "upstream-whole-video" ||
      this.localVideoFeedbackAvailability.disabledReason === "pending-upstream"
    );
  }

  private processVueComments(): void {
    if (!this.currentConfig.commentLocationEnabled) {
      cleanupVueLocationNodes(document);
      return;
    }

    const nodes = document.querySelectorAll<HTMLElement>(".browser-pc .reply-item .reply-time, .browser-pc .sub-reply-item .sub-reply-time");
    for (const node of nodes) {
      try {
        injectVueCommentLocation(node, this.currentConfig.commentIpColor);
      } catch (error) {
        debugLog("Failed to inject Vue comment location", error);
      }
    }
  }

  private resetProcessedThreads(): void {
    for (const root of document.querySelectorAll<HTMLElement>("bili-comments")) {
      const feedRoot = root.shadowRoot;
      if (!feedRoot) {
        continue;
      }

      for (const thread of feedRoot.querySelectorAll<HTMLElement>("bili-comment-thread-renderer")) {
        const mainRenderer = getMainCommentRenderer(thread);
        if (mainRenderer) {
          removeInjectedDecorations(mainRenderer);
          mainRenderer.removeAttribute(LOCATION_STATE_ATTR);
        }
        if (thread.getAttribute(THREAD_PROCESSED_ATTR) === "true" && mainRenderer) {
          thread.removeAttribute(THREAD_PROCESSED_ATTR);
          const content = getContentBody(mainRenderer);
          if (content) {
            content.style.display = "";
            content.removeAttribute(HIDDEN_ATTR);
          }
        }
        thread.removeAttribute(PROBE_PENDING_ATTR);

        for (const replyTarget of getReplyTargets(thread)) {
          removeInjectedDecorations(replyTarget.renderer);
          replyTarget.renderer.removeAttribute(LOCATION_STATE_ATTR);
          if (replyTarget.host.getAttribute(REPLY_PROCESSED_ATTR) !== "true") {
            continue;
          }

          replyTarget.host.removeAttribute(REPLY_PROCESSED_ATTR);
          replyTarget.host.removeAttribute(PROBE_PENDING_ATTR);
          const content = getContentBody(replyTarget.renderer);
          if (content) {
            content.style.display = "";
            content.removeAttribute(HIDDEN_ATTR);
          }
        }

        restoreReplies(thread);
      }
    }
    cleanupVueLocationNodes(document);
    debugLog("Comment sponsor state reset");
  }
}

function normalizeLocalVideoFeedbackAvailability(detail: unknown): LocalVideoFeedbackAvailabilityState {
  const value = detail && typeof detail === "object" ? (detail as LocalVideoFeedbackAvailabilityDetail) : null;
  const disabledReason = isLocalVideoFeedbackDisabledReason(value?.disabledReason) ? value.disabledReason : undefined;
  const enabled = Boolean(value?.enabled) && !disabledReason;
  return {
    enabled,
    locked: Boolean(value?.locked) || Boolean(disabledReason && disabledReason !== "unavailable"),
    disabledReason: enabled ? undefined : (disabledReason ?? "unavailable"),
    bvid: typeof value?.bvid === "string" ? value.bvid : null
  };
}

function isLocalVideoFeedbackDisabledReason(value: unknown): value is LocalVideoFeedbackDisabledReason {
  return (
    value === "upstream-whole-video" ||
    value === "pending-upstream" ||
    value === "manual-decision" ||
    value === "unavailable"
  );
}

function isSameFeedbackAvailability(left: LocalVideoFeedbackAvailabilityState, right: LocalVideoFeedbackAvailabilityState): boolean {
  return (
    left.enabled === right.enabled &&
    left.locked === right.locked &&
    left.disabledReason === right.disabledReason &&
    left.bvid === right.bvid
  );
}
