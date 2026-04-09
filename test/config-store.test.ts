import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_DYNAMIC_REGEX_PATTERN } from "../src/constants";
import { ConfigStore, normalizeConfig } from "../src/core/config-store";

describe("config normalization", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    expect(config.labelTransparency).toEqual({
      titleBadge: false,
      thumbnailLabel: false,
      commentBadge: false,
      commentLocation: false,
      dynamicBadge: false
    });
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

  it("notifies listeners immediately before config persistence resolves", async () => {
    vi.stubGlobal("GM_getValue", vi.fn(async (_key, fallback) => fallback));
    let resolveSave: (() => void) | null = null;
    vi.stubGlobal(
      "GM_setValue",
      vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSave = resolve;
          })
      )
    );

    const store = new ConfigStore();
    await store.load();

    const states: boolean[] = [];
    store.subscribe((config) => {
      states.push(config.compactVideoHeader);
    });

    const pending = store.update((config) => ({
      ...config,
      compactVideoHeader: false
    }));

    expect(store.getSnapshot().compactVideoHeader).toBe(false);
    expect(states).toEqual([false]);

    const finishSave = resolveSave as (() => void) | null;
    if (finishSave) {
      finishSave();
    }
    await pending;
  });

  it("rolls config back when persistence fails", async () => {
    vi.stubGlobal("GM_getValue", vi.fn(async (_key, fallback) => fallback));
    vi.stubGlobal("GM_setValue", vi.fn(async () => {
      throw new Error("save failed");
    }));

    const store = new ConfigStore();
    await store.load();

    const states: boolean[] = [];
    store.subscribe((config) => {
      states.push(config.compactVideoHeader);
    });

    await expect(
      store.update((config) => ({
        ...config,
        compactVideoHeader: false
      }))
    ).rejects.toThrow("save failed");

    expect(store.getSnapshot().compactVideoHeader).toBe(true);
    expect(states).toEqual([false, true]);
  });
});
