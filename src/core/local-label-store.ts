import { LOCAL_LABEL_STORAGE_KEY } from "../constants";
import { gmGetValue, gmSetValue } from "../platform/gm";
import type { Category, LocalVideoLabelRecord, LocalVideoLabelSource, LocalVideoSignal } from "../types";

const MAX_LOCAL_VIDEO_LABELS = 400;

type LocalLabelPayload = Record<string, LocalVideoLabelRecord>;

function isCategory(value: string | null): value is Category {
  return (
    value === "sponsor" ||
    value === "selfpromo" ||
    value === "interaction" ||
    value === "intro" ||
    value === "outro" ||
    value === "preview" ||
    value === "padding" ||
    value === "music_offtopic" ||
    value === "poi_highlight" ||
    value === "exclusive_access"
  );
}

function isSource(value: string): value is LocalVideoLabelSource {
  return (
    value === "comment-goods" ||
    value === "comment-suspicion" ||
    value === "page-heuristic" ||
    value === "manual" ||
    value === "manual-dismiss"
  );
}

function normalizeRecord(input: Partial<LocalVideoLabelRecord> | null | undefined): LocalVideoLabelRecord | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const category =
    input.category === null ? null : typeof input.category === "string" && isCategory(input.category) ? input.category : null;
  const source = typeof input.source === "string" && isSource(input.source) ? input.source : null;
  const confidence = Number.isFinite(input.confidence) ? Math.min(1, Math.max(0, Number(input.confidence))) : 0.5;
  const updatedAt = Number.isFinite(input.updatedAt) ? Math.max(0, Number(input.updatedAt)) : Date.now();
  const reason = typeof input.reason === "string" && input.reason.trim().length > 0 ? input.reason.trim() : undefined;

  if (!source) {
    return null;
  }

  return {
    category,
    source,
    confidence,
    updatedAt,
    reason
  };
}

function normalizePayload(input: unknown): Map<string, LocalVideoLabelRecord> {
  const records = new Map<string, LocalVideoLabelRecord>();
  if (!input || typeof input !== "object") {
    return records;
  }

  for (const [videoId, rawRecord] of Object.entries(input as LocalLabelPayload)) {
    if (!videoId.startsWith("BV")) {
      continue;
    }
    const record = normalizeRecord(rawRecord);
    if (record) {
      records.set(videoId, record);
    }
  }

  return pruneRecords(records);
}

function pruneRecords(records: Map<string, LocalVideoLabelRecord>): Map<string, LocalVideoLabelRecord> {
  if (records.size <= MAX_LOCAL_VIDEO_LABELS) {
    return records;
  }

  const sorted = [...records.entries()].sort((left, right) => right[1].updatedAt - left[1].updatedAt);
  return new Map(sorted.slice(0, MAX_LOCAL_VIDEO_LABELS));
}

function serializeRecords(records: Map<string, LocalVideoLabelRecord>): LocalLabelPayload {
  return Object.fromEntries(records);
}

export class LocalVideoLabelStore {
  private records = new Map<string, LocalVideoLabelRecord>();

  async load(): Promise<void> {
    this.records = normalizePayload(await gmGetValue<LocalLabelPayload | null>(LOCAL_LABEL_STORAGE_KEY, null));
  }

  getResolved(videoId: string): LocalVideoLabelRecord | null {
    const record = this.records.get(videoId);
    if (!record || !record.category || record.source === "manual-dismiss") {
      return null;
    }
    return { ...record };
  }

  isDismissed(videoId: string): boolean {
    const record = this.records.get(videoId);
    return Boolean(record && record.category === null && record.source === "manual-dismiss");
  }

  async rememberSignal(videoId: string, signal: LocalVideoSignal): Promise<void> {
    if (!videoId.startsWith("BV")) {
      return;
    }

    const existing = this.records.get(videoId);
    if (existing?.source === "manual-dismiss") {
      return;
    }
    if (existing?.source === "manual" && existing.category) {
      return;
    }
    if (
      existing?.category === signal.category &&
      existing.source === signal.source &&
      existing.confidence >= signal.confidence
    ) {
      return;
    }

    this.records.set(videoId, {
      category: signal.category,
      source: signal.source,
      confidence: signal.confidence,
      updatedAt: Date.now(),
      reason: signal.reason
    });
    this.records = pruneRecords(this.records);
    await gmSetValue(LOCAL_LABEL_STORAGE_KEY, serializeRecords(this.records));
  }

  async rememberManual(videoId: string, category: Category, reason = "手动确认本地标签"): Promise<void> {
    if (!videoId.startsWith("BV")) {
      return;
    }
    this.records.set(videoId, {
      category,
      source: "manual",
      confidence: 1,
      updatedAt: Date.now(),
      reason
    });
    this.records = pruneRecords(this.records);
    await gmSetValue(LOCAL_LABEL_STORAGE_KEY, serializeRecords(this.records));
  }

  async dismiss(videoId: string, reason = "手动忽略本地标签"): Promise<void> {
    if (!videoId.startsWith("BV")) {
      return;
    }
    this.records.set(videoId, {
      category: null,
      source: "manual-dismiss",
      confidence: 1,
      updatedAt: Date.now(),
      reason
    });
    this.records = pruneRecords(this.records);
    await gmSetValue(LOCAL_LABEL_STORAGE_KEY, serializeRecords(this.records));
  }
}
