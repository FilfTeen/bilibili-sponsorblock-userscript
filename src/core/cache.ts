import {
  CACHE_MAX_ENTRIES,
  CACHE_MAX_SIZE_BYTES,
  CACHE_STORAGE_KEY,
  CACHE_TTL_MS
} from "../constants";
import { gmGetValue, gmSetValue } from "../platform/gm";
import type { CacheEntry, CachePayload } from "../types";

function estimateSize(value: unknown): number {
  return JSON.stringify(value).length;
}

export class PersistentCache<T> {
  private payload: CachePayload<T> = { entries: {} };
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) {
      return;
    }

    const stored = await gmGetValue<CachePayload<T> | null>(CACHE_STORAGE_KEY, null);
    this.payload = normalizePayload(stored);
    this.loaded = true;
    await this.persist();
  }

  private async persist(): Promise<void> {
    this.cleanupExpired();
    this.evictOverflow();

    if (Object.keys(this.payload.entries).length === 0) {
      await gmSetValue(CACHE_STORAGE_KEY, null);
      return;
    }

    await gmSetValue(CACHE_STORAGE_KEY, this.payload);
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of Object.entries(this.payload.entries)) {
      if (entry.expiresAt <= now) {
        delete this.payload.entries[key];
      }
    }
  }

  private getTotalSize(): number {
    return Object.values(this.payload.entries).reduce((sum, entry) => sum + entry.size, 0);
  }

  private evictOverflow(): void {
    const sortedEntries = Object.entries(this.payload.entries).sort(
      (left, right) => left[1].updatedAt - right[1].updatedAt
    );
    let currentSize = this.getTotalSize();

    while (sortedEntries.length > CACHE_MAX_ENTRIES || currentSize > CACHE_MAX_SIZE_BYTES) {
      const oldest = sortedEntries.shift();
      if (!oldest) {
        break;
      }
      currentSize -= oldest[1].size;
      delete this.payload.entries[oldest[0]];
    }
  }

  async get(key: string): Promise<T | undefined> {
    await this.load();
    const entry = this.payload.entries[key];
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      delete this.payload.entries[key];
      await this.persist();
      return undefined;
    }
    return entry.value;
  }

  async set(key: string, value: T): Promise<void> {
    await this.load();
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + CACHE_TTL_MS,
      updatedAt: Date.now(),
      size: estimateSize(value)
    };
    this.payload.entries[key] = entry;
    await this.persist();
  }

  async delete(key: string): Promise<void> {
    await this.load();
    delete this.payload.entries[key];
    await this.persist();
  }

  async clear(): Promise<void> {
    this.payload = { entries: {} };
    this.loaded = true;
    await gmSetValue(CACHE_STORAGE_KEY, null);
  }

  async getStats(): Promise<{ entryCount: number; sizeBytes: number }> {
    await this.load();
    return {
      entryCount: Object.keys(this.payload.entries).length,
      sizeBytes: this.getTotalSize()
    };
  }
}

function normalizePayload<T>(input: CachePayload<T> | null): CachePayload<T> {
  if (!input || typeof input !== "object" || typeof input.entries !== "object" || input.entries === null) {
    return { entries: {} };
  }

  // Cache data may come from older script versions or manual tampering; normalize before reuse.
  const now = Date.now();
  const entries: Record<string, CacheEntry<T>> = {};

  for (const [key, value] of Object.entries(input.entries)) {
    if (typeof value !== "object" || value === null) {
      continue;
    }

    const entry = value as Partial<CacheEntry<T>>;
    const rawSize = entry.size;
    const size = typeof rawSize === "number" && Number.isFinite(rawSize) && rawSize > 0 ? rawSize : estimateSize(entry.value);
    if (
      typeof entry.updatedAt !== "number" ||
      typeof entry.expiresAt !== "number" ||
      entry.expiresAt <= now
    ) {
      continue;
    }

    entries[key] = {
      value: entry.value as T,
      updatedAt: entry.updatedAt,
      expiresAt: entry.expiresAt,
      size
    };
  }

  return { entries };
}
