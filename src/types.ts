export type Category =
  | "sponsor"
  | "selfpromo"
  | "interaction"
  | "intro"
  | "outro"
  | "preview"
  | "padding"
  | "music_offtopic"
  | "poi_highlight"
  | "exclusive_access";

export type CategoryMode = "auto" | "manual" | "notice" | "off";
export type ContentFilterMode = "hide" | "label" | "off";
export type ThumbnailLabelMode = "overlay" | "off";
export type CategoryColorOverrides = Partial<Record<Category, string>>;
export type LocalVideoLabelSource =
  | "comment-goods"
  | "comment-suspicion"
  | "page-heuristic"
  | "manual"
  | "manual-dismiss";

export type ActionType = "skip" | "mute" | "full" | "poi";
export type PageType =
  | "unknown"
  | "unsupported"
  | "main"
  | "history"
  | "video"
  | "list"
  | "festival"
  | "anime"
  | "opus"
  | "search"
  | "dynamic"
  | "channel";

export interface SponsorTime {
  segment: [number] | [number, number];
  cid?: string;
  UUID: string;
  locked?: number;
  category: Category;
  actionType: ActionType;
  hidden?: number;
  source?: number;
  videoDuration?: number;
}

export interface SponsorTimeHashedID {
  videoID: string;
  segments: SponsorTime[];
}

export interface VideoContext {
  bvid: string;
  cid: string | null;
  page: number;
  title: string | null;
  href: string;
}

export interface PageSnapshot {
  url: string;
  initialState: Record<string, unknown> | null;
  playerManifest: Record<string, unknown> | null;
  playInfo: Record<string, unknown> | null;
}

export interface SegmentRecord extends SponsorTime {
  start: number;
  end: number | null;
  duration: number | null;
  mode: CategoryMode;
}

export interface StoredConfig {
  enabled: boolean;
  serverAddress: string;
  enableCache: boolean;
  noticeDurationSec: number;
  minDurationSec: number;
  showPreviewBar: boolean;
  compactVideoHeader: boolean;
  compactHeaderPlaceholderVisible: boolean;
  compactHeaderSearchPlaceholderEnabled: boolean;
  thumbnailLabelMode: ThumbnailLabelMode;
  categoryModes: Record<Category, CategoryMode>;
  categoryColorOverrides: CategoryColorOverrides;
  dynamicFilterMode: ContentFilterMode;
  dynamicRegexPattern: string;
  dynamicRegexKeywordMinMatches: number;
  commentFilterMode: ContentFilterMode;
  commentLocationEnabled: boolean;
  commentHideReplies: boolean;
  commentIpColor?: string;
  commentAdColor?: string;
  mbgaEnabled: boolean;
  mbgaBlockTracking: boolean;
  mbgaDisablePcdn: boolean;
  mbgaCleanUrl: boolean;
  mbgaSimplifyUi: boolean;
}

export interface StoredStats {
  skipCount: number;
  minutesSaved: number;
}

export interface RuntimeStatus {
  kind: "idle" | "pending" | "loaded" | "empty" | "error";
  message: string;
  bvid: string | null;
  segmentCount: number | null;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  updatedAt: number;
  size: number;
}

export interface CachePayload<T> {
  entries: Record<string, CacheEntry<T>>;
}

export interface FetchResponse {
  responseText: string;
  status: number;
  ok: boolean;
}

export interface VoteResponse {
  successType: number;
  statusCode: number;
  responseText: string;
}

export interface NoticeAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
}

export interface NoticeOptions {
  id: string;
  title: string;
  message: string;
  durationMs?: number;
  actions?: NoticeAction[];
  sticky?: boolean;
}

export interface DynamicSponsorMatch {
  category: "dynamicSponsor_sponsor" | "dynamicSponsor_forward_sponsor" | "dynamicSponsor_suspicion_sponsor";
  matches: string[];
}

export interface LocalVideoLabelRecord {
  category: Category | null;
  source: LocalVideoLabelSource;
  confidence: number;
  updatedAt: number;
  reason?: string;
}

export interface LocalVideoSignal {
  category: Category;
  source: Exclude<LocalVideoLabelSource, "manual" | "manual-dismiss">;
  confidence: number;
  reason: string;
}

export type MbgaRuleKind = "network" | "ui" | "behavior";

export interface MbgaContext {
  config: StoredConfig;
  doc: Document;
  win: Window & typeof globalThis;
  url: URL;
}

export interface MbgaNetworkDecision {
  action: "allow" | "block";
  reason: string;
  matchedUrl?: string;
  syntheticStatus?: number;
  syntheticBody?: string;
}

export interface MbgaRule {
  id: string;
  kind: MbgaRuleKind;
  safetyNotes: string;
  enabled: (config: StoredConfig) => boolean;
  match: (context: MbgaContext) => boolean;
  apply: (context: MbgaContext) => void;
}
