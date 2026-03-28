import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/constants";
import { resolveWholeVideoLabels } from "../src/core/whole-video-label";
import type { SegmentRecord, StoredConfig } from "../src/types";

function buildSegment(overrides: Partial<SegmentRecord>): SegmentRecord {
  return {
    UUID: "segment-1",
    category: "sponsor",
    actionType: "skip",
    segment: [0, 10],
    start: 0,
    end: 10,
    duration: 10,
    mode: "auto",
    ...overrides
  };
}

describe("whole video label resolution", () => {
  it("prefers full-segment labels over /api/videoLabels fallback", () => {
    const labels = resolveWholeVideoLabels(
      "BV17x411w7KC",
      [
        buildSegment({
          UUID: "full-1",
          category: "exclusive_access",
          actionType: "full",
          segment: [0, 0],
          end: 0,
          duration: 0
        })
      ],
      "sponsor",
      DEFAULT_CONFIG as StoredConfig
    );

    expect(labels).toHaveLength(1);
    expect(labels[0]?.UUID).toBe("full-1");
    expect(labels[0]?.category).toBe("exclusive_access");
  });

  it("falls back to /api/videoLabels when there is no full-segment tag", () => {
    const labels = resolveWholeVideoLabels("BV17x411w7KC", [], "sponsor", DEFAULT_CONFIG as StoredConfig);

    expect(labels).toHaveLength(1);
    expect(labels[0]?.UUID).toBe("video-label:BV17x411w7KC:sponsor");
    expect(labels[0]?.category).toBe("sponsor");
  });

  it("returns nothing when the fallback category is disabled", () => {
    const config: StoredConfig = {
      ...(DEFAULT_CONFIG as StoredConfig),
      categoryModes: {
        ...(DEFAULT_CONFIG as StoredConfig).categoryModes,
        sponsor: "off"
      }
    };

    const labels = resolveWholeVideoLabels("BV17x411w7KC", [], "sponsor", config);
    expect(labels).toHaveLength(0);
  });
});
