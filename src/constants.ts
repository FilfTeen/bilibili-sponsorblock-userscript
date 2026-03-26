import type { Category, CategoryMode, StoredConfig } from "./types";

export const SCRIPT_NAME = "Bilibili SponsorBlock Core";
export const CONFIG_STORAGE_KEY = "bsb_tm_config_v1";
export const STATS_STORAGE_KEY = "bsb_tm_stats_v1";
export const CACHE_STORAGE_KEY = "bsb_tm_cache_v1";
export const BRIDGE_FLAG = "__BSB_TM_PAGE_BRIDGE__";
export const REQUEST_TIMEOUT_MS = 8000;
export const CACHE_TTL_MS = 60 * 60 * 1000;
export const CACHE_MAX_ENTRIES = 1000;
export const CACHE_MAX_SIZE_BYTES = 500 * 1024;
export const VIDEO_SCAN_INTERVAL_MS = 700;
export const TICK_INTERVAL_MS = 200;
export const POI_NOTICE_LEAD_SEC = 6;
export const SEGMENT_REWIND_RESET_SEC = 0.5;

export const CATEGORY_ORDER: Category[] = [
  "sponsor",
  "selfpromo",
  "interaction",
  "intro",
  "outro",
  "preview",
  "padding",
  "music_offtopic",
  "poi_highlight",
  "exclusive_access"
];

export const CATEGORY_LABELS: Record<Category, string> = {
  sponsor: "广告",
  selfpromo: "自荐",
  interaction: "互动提醒",
  intro: "片头",
  outro: "片尾",
  preview: "预告/回放",
  padding: "填充空段",
  music_offtopic: "音乐无关段",
  poi_highlight: "高光点",
  exclusive_access: "整视频标签"
};

export const MODE_LABELS: Record<CategoryMode, string> = {
  auto: "自动",
  manual: "手动",
  notice: "仅提示",
  off: "关闭"
};

export const DEFAULT_CATEGORY_MODES: Record<Category, CategoryMode> = {
  sponsor: "auto",
  selfpromo: "manual",
  interaction: "manual",
  intro: "manual",
  outro: "manual",
  preview: "notice",
  padding: "auto",
  music_offtopic: "auto",
  poi_highlight: "manual",
  exclusive_access: "notice"
};

export const DEFAULT_CONFIG: StoredConfig = {
  enabled: true,
  serverAddress: "https://www.bsbsb.top",
  enableCache: true,
  noticeDurationSec: 4,
  minDurationSec: 0,
  categoryModes: DEFAULT_CATEGORY_MODES
};

export const DEFAULT_STATS = {
  skipCount: 0,
  minutesSaved: 0
};
