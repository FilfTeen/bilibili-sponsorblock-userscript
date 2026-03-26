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

export type ActionType = "skip" | "mute" | "full" | "poi";

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
  categoryModes: Record<Category, CategoryMode>;
}

export interface StoredStats {
  skipCount: number;
  minutesSaved: number;
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
