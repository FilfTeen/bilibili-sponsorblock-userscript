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
