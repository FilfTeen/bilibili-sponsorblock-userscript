import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/constants";
import { normalizeSegments } from "../src/core/segment-filter";
import type { SponsorTime } from "../src/types";

const baseSegment: SponsorTime = {
  UUID: "seg-1",
  category: "sponsor",
  actionType: "skip",
  segment: [10, 20]
};

describe("segment normalization", () => {
  it("filters segments to the active cid when provided", () => {
    const segments = normalizeSegments(
      [
        {
          ...baseSegment,
          UUID: "same-cid",
          cid: "111"
        },
        {
          ...baseSegment,
          UUID: "other-cid",
          cid: "222"
        },
        {
          ...baseSegment,
          UUID: "cid-agnostic"
        }
      ],
      DEFAULT_CONFIG,
      "111"
    );

    expect(segments.map((segment) => segment.UUID)).toEqual(["same-cid", "cid-agnostic"]);
  });
});
