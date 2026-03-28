import type { LocalVideoSignal, VideoContext } from "../types";
import { analyzeCommercialIntent } from "./commercial-intent";

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

export function inferLocalVideoSignal(context: Pick<VideoContext, "title">): LocalVideoSignal | null {
  const title = context.title?.replace(/\s+/gu, " ").trim() ?? "";
  const description = collectTextFromSelectors(DESCRIPTION_SELECTORS);
  const tags = collectTextFromSelectors(TAG_SELECTORS);
  const combined = [title, description, tags].filter(Boolean).join(" ");
  const assessment = analyzeCommercialIntent(combined, {
    minMatches: 1
  });
  if (!assessment.category) {
    return null;
  }

  return {
    category: assessment.category,
    source: "page-heuristic",
    confidence: assessment.confidence,
    reason: assessment.reason ?? "页面文本出现本地商业线索"
  };
}
