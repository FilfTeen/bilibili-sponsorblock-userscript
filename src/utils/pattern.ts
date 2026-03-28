import { analyzeCommercialIntent, isBenignCommercialContext } from "./commercial-intent";

export function regexFromStoredPattern(input: string): RegExp | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^\/(.*)\/([a-z]*)$/iu);
  try {
    if (match) {
      return new RegExp(match[1], match[2]);
    }

    return new RegExp(trimmed, "giu");
  } catch (_error) {
    return null;
  }
}

export function collectPatternMatches(text: string, pattern: RegExp, minLength = 2): string[] {
  const globalPattern = pattern.global ? pattern : new RegExp(pattern.source, `${pattern.flags}g`);
  const matches = text.match(globalPattern) ?? [];
  return [...new Set(matches.map((entry) => entry.trim()).filter((entry) => entry.length >= minLength))];
}

export function validateStoredPattern(input: string): { valid: boolean; error: string | null } {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: "正则不能为空"
    };
  }

  const compiled = regexFromStoredPattern(trimmed);
  if (!compiled) {
    return {
      valid: false,
      error: "正则格式无效"
    };
  }

  return {
    valid: true,
    error: null
  };
}

export function isLikelyPromoText(text: string, matches: string[], minMatches: number): boolean {
  const normalizedText = text.replace(/\s+/gu, " ").trim();
  if (!normalizedText || matches.length === 0) {
    return false;
  }

  if (isBenignCommercialContext(normalizedText)) {
    return false;
  }

  const effectiveThreshold = Math.max(1, minMatches);
  const assessment = analyzeCommercialIntent(normalizedText, {
    storedMatches: matches,
    minMatches: effectiveThreshold
  });

  return Boolean(assessment.category);
}
