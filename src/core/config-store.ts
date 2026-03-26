import {
  CATEGORY_ORDER,
  CONFIG_STORAGE_KEY,
  DEFAULT_CONFIG,
  DEFAULT_STATS,
  STATS_STORAGE_KEY
} from "../constants";
import { gmDeleteValue, gmGetValue, gmSetValue } from "../platform/gm";
import type { CategoryMode, StoredConfig, StoredStats } from "../types";
import { clampNumber } from "../utils/number";
import { regexFromStoredPattern } from "../utils/pattern";
import { normalizeServerAddress } from "../utils/url";

type ConfigListener = (config: StoredConfig) => void;
type StatsListener = (stats: StoredStats) => void;

function isCategoryMode(value: string): value is CategoryMode {
  return value === "auto" || value === "manual" || value === "notice" || value === "off";
}

export function cloneDefaultConfig(): StoredConfig {
  return {
    ...DEFAULT_CONFIG,
    categoryModes: { ...DEFAULT_CONFIG.categoryModes }
  };
}

export function normalizeConfig(input: Partial<StoredConfig> | null | undefined): StoredConfig {
  const next = cloneDefaultConfig();
  if (!input) {
    return next;
  }

  next.enabled = input.enabled ?? next.enabled;
  next.enableCache = input.enableCache ?? next.enableCache;
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
  next.commentHideReplies = input.commentHideReplies ?? next.commentHideReplies;
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

  const serverAddress = normalizeServerAddress(input.serverAddress);
  if (serverAddress) {
    next.serverAddress = serverAddress;
  }

  for (const category of CATEGORY_ORDER) {
    const value = input.categoryModes?.[category];
    if (value && isCategoryMode(value)) {
      next.categoryModes[category] = value;
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
      categoryModes: { ...this.config.categoryModes }
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
    await gmDeleteValue(CONFIG_STORAGE_KEY);
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
