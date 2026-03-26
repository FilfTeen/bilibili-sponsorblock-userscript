import { describe, expect, it } from "vitest";
import { avidToBvid, isBvid } from "../src/utils/bvid";

describe("bvid helpers", () => {
  it("converts aid values to bvid", () => {
    expect(avidToBvid(170001)).toBe("BV17x411w7KC");
  });

  it("validates bvid format", () => {
    expect(isBvid("BV17x411w7KC")).toBe(true);
    expect(isBvid("av170001")).toBe(false);
  });
});
