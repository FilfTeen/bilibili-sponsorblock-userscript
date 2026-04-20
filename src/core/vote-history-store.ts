import { VOTE_HISTORY_STORAGE_KEY } from "../constants";
import { gmGetValue, gmSetValue } from "../platform/gm";

const MAX_VOTE_HISTORY = 2000;

type VoteHistoryPayload = Record<string, number>;

function normalizePayload(input: unknown): Map<string, number> {
  const records = new Map<string, number>();
  if (!input || typeof input !== "object") {
    return records;
  }

  for (const [uuid, updatedAt] of Object.entries(input as VoteHistoryPayload)) {
    if (typeof uuid !== "string" || uuid.length === 0 || !Number.isFinite(updatedAt)) {
      continue;
    }
    records.set(uuid, Math.max(0, Number(updatedAt)));
  }

  return pruneRecords(records);
}

function pruneRecords(records: Map<string, number>): Map<string, number> {
  if (records.size <= MAX_VOTE_HISTORY) {
    return records;
  }

  const sorted = [...records.entries()].sort((left, right) => right[1] - left[1]);
  return new Map(sorted.slice(0, MAX_VOTE_HISTORY));
}

function serializeRecords(records: Map<string, number>): VoteHistoryPayload {
  return Object.fromEntries(records);
}

export class VoteHistoryStore {
  private records = new Map<string, number>();

  async load(): Promise<void> {
    this.records = normalizePayload(await gmGetValue<VoteHistoryPayload | null>(VOTE_HISTORY_STORAGE_KEY, null));
  }

  has(uuid: string): boolean {
    return this.records.has(uuid);
  }

  async remember(uuid: string): Promise<void> {
    if (!uuid) {
      return;
    }

    const previous = new Map(this.records);
    this.records.set(uuid, Date.now());
    this.records = pruneRecords(this.records);
    try {
      await gmSetValue(VOTE_HISTORY_STORAGE_KEY, serializeRecords(this.records));
    } catch (error) {
      this.records = previous;
      throw error;
    }
  }
}
