import type { LocalVideoSignal, VideoContext } from "../types";
import { analyzeCommercialIntent, type CommercialIntentAssessment } from "./commercial-intent";

const DESCRIPTION_SELECTORS = [
  ".video-desc-container",
  ".desc-info-text",
  ".video-desc",
  ".basic-desc-info",
  "#v_desc"
] as const;

const TAG_SELECTORS = [".video-tag-container .tag-link", ".tag-panel .tag", ".video-info-tag a", ".video-tag a"] as const;

function collectTextFromSelectors(selectors: readonly string[]): string {
  const values = new Set<string>();
  for (const selector of selectors) {
    for (const node of document.querySelectorAll<HTMLElement>(selector)) {
      const text = node.textContent?.replace(/\s+/gu, " ").trim();
      if (text) {
        values.add(text);
      }
    }
  }
  return [...values].join(" ");
}

const TITLE_STRONG_SPONSOR_MATCHES = new Set(["赞助", "商务合作", "商品卡", "优惠券", "购买指引"]);
const TITLE_STRONG_SELFPROMO_MATCHES = new Set(["自家店铺", "自家频道"]);

function analyzeSurface(text: string): CommercialIntentAssessment | null {
  if (!text) {
    return null;
  }
  return analyzeCommercialIntent(text, {
    minMatches: 1
  });
}

function hasStrongTitleSponsorEvidence(assessment: CommercialIntentAssessment | null): boolean {
  return Boolean(
    assessment &&
      assessment.sponsorScore >= 4.1 &&
      assessment.matches.some((match) => TITLE_STRONG_SPONSOR_MATCHES.has(match))
  );
}

function hasStrongTitleSelfpromoEvidence(assessment: CommercialIntentAssessment | null): boolean {
  return Boolean(
    assessment &&
      assessment.selfpromoScore >= 2.3 &&
      assessment.matches.some((match) => TITLE_STRONG_SELFPROMO_MATCHES.has(match))
  );
}

function hasStrongTitleExclusiveEvidence(assessment: CommercialIntentAssessment | null): boolean {
  return Boolean(assessment && (assessment.exclusiveScore >= 4.5 || assessment.matches.includes("抢先体验")));
}

function hasStrongNonTitleEvidence(
  category: NonNullable<CommercialIntentAssessment["category"]>,
  assessments: Array<CommercialIntentAssessment | null>
): boolean {
  return assessments.some((assessment) => {
    if (!assessment) {
      return false;
    }

    if (category === "sponsor") {
      return assessment.sponsorScore >= 3.3;
    }
    if (category === "selfpromo") {
      return assessment.selfpromoScore >= 2.3;
    }
    return assessment.exclusiveScore >= 3;
  });
}

function resolveVideoAssessment(
  titleAssessment: CommercialIntentAssessment | null,
  descriptionAssessment: CommercialIntentAssessment | null,
  tagAssessment: CommercialIntentAssessment | null,
  combinedAssessment: CommercialIntentAssessment
): CommercialIntentAssessment | null {
  if (!combinedAssessment.category) {
    return null;
  }

  const nonTitleAssessments = [descriptionAssessment, tagAssessment];
  const hasNonTitleEvidence = hasStrongNonTitleEvidence(combinedAssessment.category, nonTitleAssessments);

  if (combinedAssessment.category === "sponsor") {
    if (!hasNonTitleEvidence && !hasStrongTitleSponsorEvidence(titleAssessment)) {
      return null;
    }
  } else if (combinedAssessment.category === "selfpromo") {
    if (!hasNonTitleEvidence && !hasStrongTitleSelfpromoEvidence(titleAssessment)) {
      return null;
    }
  } else if (!hasNonTitleEvidence && !hasStrongTitleExclusiveEvidence(titleAssessment)) {
    return null;
  }

  return combinedAssessment;
}

export function inferLocalVideoSignal(context: Pick<VideoContext, "title">): LocalVideoSignal | null {
  const title = context.title?.replace(/\s+/gu, " ").trim() ?? "";
  const description = collectTextFromSelectors(DESCRIPTION_SELECTORS);
  const tags = collectTextFromSelectors(TAG_SELECTORS);
  const combined = [title, description, tags].filter(Boolean).join(" ");
  const titleAssessment = analyzeSurface(title);
  const descriptionAssessment = analyzeSurface(description);
  const tagAssessment = analyzeSurface(tags);
  const combinedAssessment = analyzeCommercialIntent(combined, {
    minMatches: 1
  });
  const assessment = resolveVideoAssessment(titleAssessment, descriptionAssessment, tagAssessment, combinedAssessment);
  if (!assessment || !assessment.category) {
    return null;
  }

  return {
    category: assessment.category,
    source: "page-heuristic",
    confidence: assessment.confidence,
    reason: assessment.reason ?? "页面文本出现本地商业线索"
  };
}
