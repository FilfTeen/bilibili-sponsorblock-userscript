import {
  CATEGORY_ORDER,
  CONFIG_STORAGE_KEY,
  DEFAULT_CONFIG,
  DEFAULT_STATS,
  STATS_STORAGE_KEY
} from "../constants";
import { gmGetValue, gmSetValue } from "../platform/gm";
import type { CategoryMode, StoredConfig, StoredStats, ThumbnailLabelMode } from "../types";
import { clampNumber } from "../utils/number";
import { regexFromStoredPattern } from "../utils/pattern";
import { normalizeHexColor } from "../utils/color";
import { normalizeServerAddress } from "../utils/url";

type ConfigListener = (config: StoredConfig) => void;
type StatsListener = (stats: StoredStats) => void;

function isCategoryMode(value: string): value is CategoryMode {
  return value === "auto" || value === "manual" || value === "notice" || value === "off";
}

function isThumbnailLabelMode(value: string): value is ThumbnailLabelMode {
  return value === "overlay" || value === "off";
}

export function cloneDefaultConfig(): StoredConfig {
  return {
    ...DEFAULT_CONFIG,
    categoryModes: { ...DEFAULT_CONFIG.categoryModes },
    categoryColorOverrides: { ...DEFAULT_CONFIG.categoryColorOverrides }
  };
}

export function normalizeConfig(input: Partial<StoredConfig> | null | undefined): StoredConfig {
  const next = cloneDefaultConfig();
  if (!input) {
    return next;
  }

  const migratedFromOlderBuild =
    typeof input.showPreviewBar !== "boolean" ||
    typeof input.thumbnailLabelMode !== "string";

  next.enabled = input.enabled ?? next.enabled;
  next.enableCache = input.enableCache ?? next.enableCache;
  next.showPreviewBar = input.showPreviewBar ?? next.showPreviewBar;
  next.compactVideoHeader = input.compactVideoHeader ?? next.compactVideoHeader;
  next.compactHeaderPlaceholderVisible =
    input.compactHeaderPlaceholderVisible ?? next.compactHeaderPlaceholderVisible;
  next.compactHeaderSearchPlaceholderEnabled =
    input.compactHeaderSearchPlaceholderEnabled ?? next.compactHeaderSearchPlaceholderEnabled;
  next.noticeDurationSec = clampNumber(
    Number.isFinite(input.noticeDurationSec) ? Number(input.noticeDurationSec) : next.noticeDurationSec,
    1,
    15
  );
  next.minDurationSec = clampNumber(
    Number.isFinite(input.minDurationSec) ? Number(input.minDurationSec) : next.minDurationSec,
    0,
    300
  );
  next.dynamicFilterMode =
    input.dynamicFilterMode === "hide" || input.dynamicFilterMode === "label" || input.dynamicFilterMode === "off"
      ? input.dynamicFilterMode
      : next.dynamicFilterMode;
  next.commentFilterMode =
    input.commentFilterMode === "hide" || input.commentFilterMode === "label" || input.commentFilterMode === "off"
      ? input.commentFilterMode
      : next.commentFilterMode;
  next.commentLocationEnabled = input.commentLocationEnabled ?? next.commentLocationEnabled;
  next.commentHideReplies = input.commentHideReplies ?? next.commentHideReplies;
  next.commentIpColor = normalizeHexColor(input.commentIpColor) ?? next.commentIpColor;
  next.commentAdColor = normalizeHexColor(input.commentAdColor) ?? next.commentAdColor;
  next.mbgaEnabled = input.mbgaEnabled ?? next.mbgaEnabled;
  next.mbgaBlockTracking = input.mbgaBlockTracking ?? next.mbgaBlockTracking;
  next.mbgaDisablePcdn = input.mbgaDisablePcdn ?? next.mbgaDisablePcdn;
  next.mbgaCleanUrl = input.mbgaCleanUrl ?? next.mbgaCleanUrl;
  next.mbgaSimplifyUi = input.mbgaSimplifyUi ?? next.mbgaSimplifyUi;
  if (typeof input.thumbnailLabelMode === "string" && isThumbnailLabelMode(input.thumbnailLabelMode)) {
    next.thumbnailLabelMode = input.thumbnailLabelMode;
  }
  const regexPattern =
    typeof input.dynamicRegexPattern === "string" && input.dynamicRegexPattern.trim().length > 0
      ? input.dynamicRegexPattern.trim()
      : null;
  if (regexPattern && regexFromStoredPattern(regexPattern)) {
    next.dynamicRegexPattern = regexPattern;
  }
  next.dynamicRegexKeywordMinMatches = clampNumber(
    Number.isFinite(input.dynamicRegexKeywordMinMatches)
      ? Number(input.dynamicRegexKeywordMinMatches)
      : next.dynamicRegexKeywordMinMatches,
    1,
    10
  );

  if (migratedFromOlderBuild) {
    if (next.dynamicFilterMode === "hide") {
      next.dynamicFilterMode = "off";
    }
    if (next.commentFilterMode === "hide") {
      next.commentFilterMode = "off";
    }
  }

  const serverAddress = normalizeServerAddress(input.serverAddress);
  if (serverAddress) {
    next.serverAddress = serverAddress;
  }

  for (const category of CATEGORY_ORDER) {
    const value = input.categoryModes?.[category];
    if (value && isCategoryMode(value)) {
      next.categoryModes[category] = value;
    }

    const categoryColor = normalizeHexColor(input.categoryColorOverrides?.[category]);
    if (categoryColor) {
      next.categoryColorOverrides[category] = categoryColor;
    }
  }

  return next;
}

export class ConfigStore {
  private config = cloneDefaultConfig();
  private readonly listeners = new Set<ConfigListener>();

  async load(): Promise<StoredConfig> {
    this.config = normalizeConfig(await gmGetValue<StoredConfig | null>(CONFIG_STORAGE_KEY, null));
    return this.getSnapshot();
  }

  getSnapshot(): StoredConfig {
    return {
      ...this.config,
      categoryModes: { ...this.config.categoryModes },
      categoryColorOverrides: { ...this.config.categoryColorOverrides }
    };
  }

  subscribe(listener: ConfigListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async update(updater: (config: StoredConfig) => StoredConfig): Promise<StoredConfig> {
    this.config = normalizeConfig(updater(this.getSnapshot()));
    await gmSetValue(CONFIG_STORAGE_KEY, this.config);
    for (const listener of this.listeners) {
      listener(this.getSnapshot());
    }
    return this.getSnapshot();
  }

  async reset(): Promise<StoredConfig> {
    await gmSetValue(CONFIG_STORAGE_KEY, null);
    this.config = cloneDefaultConfig();
    for (const listener of this.listeners) {
      listener(this.getSnapshot());
    }
    return this.getSnapshot();
  }
}

export class StatsStore {
  private stats: StoredStats = { ...DEFAULT_STATS };
  private readonly listeners = new Set<StatsListener>();

  async load(): Promise<StoredStats> {
    const stored = await gmGetValue<StoredStats | null>(STATS_STORAGE_KEY, null);
    this.stats = {
      skipCount: Number.isFinite(stored?.skipCount) ? Number(stored?.skipCount) : DEFAULT_STATS.skipCount,
      minutesSaved: Number.isFinite(stored?.minutesSaved)
        ? Math.max(0, Number(stored?.minutesSaved))
        : DEFAULT_STATS.minutesSaved
    };
    return this.getSnapshot();
  }

  getSnapshot(): StoredStats {
    return { ...this.stats };
  }

  subscribe(listener: StatsListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async patch(update: Partial<StoredStats>): Promise<StoredStats> {
    this.stats = {
      skipCount: update.skipCount ?? this.stats.skipCount,
      minutesSaved: update.minutesSaved ?? this.stats.minutesSaved
    };
    await gmSetValue(STATS_STORAGE_KEY, this.stats);
    for (const listener of this.listeners) {
      listener(this.getSnapshot());
    }
    return this.getSnapshot();
  }

  async recordSkip(minutesSavedDelta: number): Promise<StoredStats> {
    return this.patch({
      skipCount: this.stats.skipCount + 1,
      minutesSaved: Math.round((this.stats.minutesSaved + minutesSavedDelta) * 100) / 100
    });
  }
}
