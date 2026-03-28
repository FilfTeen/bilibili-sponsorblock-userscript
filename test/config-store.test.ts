import { describe, expect, it } from "vitest";
import { DEFAULT_DYNAMIC_REGEX_PATTERN } from "../src/constants";
import { normalizeConfig } from "../src/core/config-store";

describe("config normalization", () => {
  it("fills dynamic and comment filter defaults", () => {
    const config = normalizeConfig(null);
    expect(config.dynamicFilterMode).toBe("off");
    expect(config.commentFilterMode).toBe("off");
    expect(config.commentLocationEnabled).toBe(true);
    expect(config.commentHideReplies).toBe(false);
    expect(config.dynamicRegexPattern).toBe(DEFAULT_DYNAMIC_REGEX_PATTERN);
    expect(config.showPreviewBar).toBe(true);
    expect(config.compactVideoHeader).toBe(true);
    expect(config.thumbnailLabelMode).toBe("overlay");
  });

  it("clamps dynamic regex match count and accepts new modes", () => {
    const config = normalizeConfig({
      dynamicFilterMode: "label",
      commentFilterMode: "off",
      commentLocationEnabled: false,
      dynamicRegexKeywordMinMatches: 999
    });
    expect(config.dynamicFilterMode).toBe("label");
    expect(config.commentFilterMode).toBe("off");
    expect(config.commentLocationEnabled).toBe(false);
    expect(config.dynamicRegexKeywordMinMatches).toBe(10);
  });

  it("falls back to the default regex when stored input is invalid", () => {
    const config = normalizeConfig({
      dynamicRegexPattern: "/(/"
    });

    expect(config.dynamicRegexPattern).toBe(DEFAULT_DYNAMIC_REGEX_PATTERN);
  });

  it("migrates older intrusive filter defaults back to off", () => {
    const config = normalizeConfig({
      dynamicFilterMode: "hide",
      commentFilterMode: "hide"
    });

    expect(config.dynamicFilterMode).toBe("off");
    expect(config.commentFilterMode).toBe("off");
  });

  it("does not disable comment or dynamic filters when only the compact header setting is missing", () => {
    const config = normalizeConfig({
      showPreviewBar: true,
      thumbnailLabelMode: "overlay",
      dynamicFilterMode: "hide",
      commentFilterMode: "hide"
    });

    expect(config.dynamicFilterMode).toBe("hide");
    expect(config.commentFilterMode).toBe("hide");
    expect(config.compactVideoHeader).toBe(true);
  });

  it("only keeps valid hex color overrides for category labels", () => {
    const config = normalizeConfig({
      categoryColorOverrides: {
        sponsor: "#f44",
        selfpromo: "rgb(255, 0, 0)",
        exclusive_access: "#228b5d"
      }
    });

    expect(config.categoryColorOverrides.sponsor).toBe("#ff4444");
    expect(config.categoryColorOverrides.selfpromo).toBeUndefined();
    expect(config.categoryColorOverrides.exclusive_access).toBe("#228b5d");
  });
});
