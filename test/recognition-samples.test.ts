import { describe, expect, it } from "vitest";
import {
  APPROVED_RECOGNITION_SAMPLES,
  COMMENT_RECOGNITION_SAMPLES,
  DYNAMIC_RECOGNITION_SAMPLES,
  LOCAL_LEARNING_RECOGNITION_SAMPLES,
  PENDING_TRAP_RECOGNITION_SAMPLES,
  VIDEO_RECOGNITION_SAMPLES
} from "./fixtures/recognition-samples";

describe("recognition sample corpus", () => {
  it("keeps stable ids and required fields across approved samples", () => {
    const ids = new Set<string>();

    for (const sample of APPROVED_RECOGNITION_SAMPLES) {
      expect(sample.id.length).toBeGreaterThan(3);
      expect(ids.has(sample.id)).toBe(false);
      ids.add(sample.id);
      expect(sample.humanVerdict).toBe("confirmed");
      expect(sample.expectedBehavior.length).toBeGreaterThan(3);
      expect(sample.source.length).toBeGreaterThan(3);
      expect(sample.riskTag.length).toBeGreaterThan(3);
    }
  });

  it("keeps pending trap samples out of the approved regression set", () => {
    for (const sample of PENDING_TRAP_RECOGNITION_SAMPLES) {
      expect(sample.caseType).toBe("trap");
      expect(sample.humanVerdict).toBe("pending");
      expect(APPROVED_RECOGNITION_SAMPLES.find((candidate) => candidate.id === sample.id)).toBeUndefined();
    }
  });

  it("covers video, comment, dynamic, and local-learning domains", () => {
    expect(VIDEO_RECOGNITION_SAMPLES.length).toBeGreaterThan(0);
    expect(COMMENT_RECOGNITION_SAMPLES.length).toBeGreaterThan(0);
    expect(DYNAMIC_RECOGNITION_SAMPLES.length).toBeGreaterThan(0);
    expect(LOCAL_LEARNING_RECOGNITION_SAMPLES.length).toBeGreaterThan(0);
  });
});
