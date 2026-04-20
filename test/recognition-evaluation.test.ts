import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { describe, expect, it } from "vitest";
import { APPROVED_RECOGNITION_SAMPLES, PENDING_TRAP_RECOGNITION_SAMPLES } from "./fixtures/recognition-samples";
import { runRecognitionEvaluation } from "./helpers/recognition-eval";

describe("recognition evaluation summary", () => {
  it("passes the approved local reasoning regression corpus", async () => {
    const summary = await runRecognitionEvaluation(APPROVED_RECOGNITION_SAMPLES, PENDING_TRAP_RECOGNITION_SAMPLES);

    if (process.env.BSB_RECOGNITION_EVAL_OUTPUT === "1") {
      console.log(`BSB_RECOGNITION_EVAL_SUMMARY=${JSON.stringify(summary)}`);
    }
    if (process.env.BSB_RECOGNITION_EVAL_OUTPUT_FILE) {
      mkdirSync(dirname(process.env.BSB_RECOGNITION_EVAL_OUTPUT_FILE), { recursive: true });
      writeFileSync(process.env.BSB_RECOGNITION_EVAL_OUTPUT_FILE, JSON.stringify(summary, null, 2));
    }

    expect(summary.totalApproved).toBe(APPROVED_RECOGNITION_SAMPLES.length);
    expect(summary.totalFailed).toBe(0);
    expect(summary.falsePositives).toEqual([]);
    expect(summary.falseNegatives).toEqual([]);
    expect(summary.localLearningFailures).toEqual([]);
    expect(summary.domainStats.video?.total).toBeGreaterThan(0);
    expect(summary.domainStats.comment?.total).toBeGreaterThan(0);
    expect(summary.domainStats.dynamic?.total).toBeGreaterThan(0);
    expect(summary.domainStats["local-learning"]?.total).toBeGreaterThan(0);
    expect(summary.pendingTrapSamples.length).toBeGreaterThan(0);
  });
});
