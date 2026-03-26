import { describe, expect, it } from "vitest";
import { DEFAULT_DYNAMIC_REGEX_PATTERN } from "../src/constants";
import { normalizeConfig } from "../src/core/config-store";

describe("config normalization", () => {
  it("fills dynamic and comment filter defaults", () => {
    const config = normalizeConfig(null);
    expect(config.dynamicFilterMode).toBe("hide");
    expect(config.commentFilterMode).toBe("hide");
    expect(config.commentHideReplies).toBe(false);
    expect(config.dynamicRegexPattern).toBe(DEFAULT_DYNAMIC_REGEX_PATTERN);
  });

  it("clamps dynamic regex match count and accepts new modes", () => {
    const config = normalizeConfig({
      dynamicFilterMode: "label",
      commentFilterMode: "off",
      dynamicRegexKeywordMinMatches: 999
    });
    expect(config.dynamicFilterMode).toBe("label");
    expect(config.commentFilterMode).toBe("off");
    expect(config.dynamicRegexKeywordMinMatches).toBe(10);
  });
});
