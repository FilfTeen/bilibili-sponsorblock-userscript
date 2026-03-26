const STRONG_PROMO_INTENT_PATTERN =
  /评论区(?:置顶)?|优惠(?:券|卷|劵)|无门槛|折扣|下单|购买|蓝链|链接|扫码|同款|密令|红包|福利|领(?:取|券|红包)|抢(?:券|红包)?|淘宝|京东|拼多多|天猫|满\d+|大促|金主|恰饭|商品卡/iu;
const BENIGN_PROMO_CONTEXT_PATTERN =
  /广告位|广告学|推广曲|推广大使|外卖(?:到了|真香|好吃|骑手)|同款(?:bgm|BGM|音乐|滤镜)/iu;

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
  } catch {
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

  if (BENIGN_PROMO_CONTEXT_PATTERN.test(normalizedText)) {
    return false;
  }

  const strongIntent = STRONG_PROMO_INTENT_PATTERN.test(normalizedText);
  const effectiveThreshold = strongIntent ? Math.max(1, minMatches) : Math.max(2, minMatches);
  return matches.length >= effectiveThreshold;
}
