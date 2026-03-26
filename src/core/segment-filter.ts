import type { SegmentRecord, SponsorTime, StoredConfig } from "../types";

export function normalizeSegments(segments: SponsorTime[], config: StoredConfig, currentCid: string | null = null): SegmentRecord[] {
  const seen = new Set<string>();
  const normalized: SegmentRecord[] = [];

  for (const segment of segments) {
    if (seen.has(segment.UUID)) {
      continue;
    }
    seen.add(segment.UUID);

    const mode = config.categoryModes[segment.category] ?? "off";
    if (mode === "off") {
      continue;
    }

    const start = segment.segment[0];
    const end = segment.segment.length > 1 ? (segment.segment[1] ?? null) : null;
    const duration = typeof end === "number" ? Math.max(0, end - start) : null;
    const segmentCid = typeof segment.cid === "string" && segment.cid.length > 0 ? segment.cid : null;

    if (currentCid && segmentCid && segmentCid !== currentCid) {
      continue;
    }

    if (segment.actionType !== "poi" && segment.actionType !== "full" && duration !== null && duration < config.minDurationSec) {
      continue;
    }

    if (!Number.isFinite(start)) {
      continue;
    }

    normalized.push({
      ...segment,
      start,
      end,
      duration,
      mode
    });
  }

  return normalized.sort((left, right) => left.start - right.start);
}
