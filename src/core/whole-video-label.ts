import type { Category, SegmentRecord, StoredConfig } from "../types";

export function buildWholeVideoLabelSegment(bvid: string, category: Category, config: StoredConfig): SegmentRecord {
  return {
    UUID: `video-label:${bvid}:${category}`,
    category,
    actionType: "full",
    segment: [0, 0],
    start: 0,
    end: 0,
    duration: 0,
    mode: config.categoryModes[category]
  };
}

export function resolveWholeVideoLabels(
  bvid: string,
  segments: SegmentRecord[],
  labelCategory: Category | null,
  config: StoredConfig
): SegmentRecord[] {
  const fullSegments = segments.filter((segment) => segment.actionType === "full");
  if (fullSegments.length > 0) {
    return fullSegments;
  }

  if (!labelCategory || config.categoryModes[labelCategory] === "off") {
    return [];
  }

  return [buildWholeVideoLabelSegment(bvid, labelCategory, config)];
}

export function resolveWholeVideoCategory(
  bvid: string,
  segments: SegmentRecord[],
  labelCategory: Category | null,
  config: StoredConfig
): Category | null {
  return resolveWholeVideoLabels(bvid, segments, labelCategory, config)[0]?.category ?? null;
}
