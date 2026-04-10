import { describe, expect, it } from "vitest";
import { pickPreferredLocalVideoSignal, shouldPersistLocalVideoSignal } from "../src/utils/local-learning";
import { LOCAL_LEARNING_RECOGNITION_SAMPLES } from "./fixtures/recognition-samples";
import { evaluateLocalLearningRecognitionSample } from "./helpers/recognition-eval";

describe("local learning heuristics", () => {
  it("uses the shared persistence threshold contract", () => {
    expect(
      shouldPersistLocalVideoSignal({
        confidence: 0.72
      })
    ).toBe(true);

    expect(
      shouldPersistLocalVideoSignal({
        confidence: 0.71
      })
    ).toBe(false);
  });

  it("prefers comment signals when confidence ties", () => {
    const preferred = pickPreferredLocalVideoSignal(
      {
        category: "sponsor",
        source: "comment-suspicion",
        confidence: 0.87,
        reason: "评论区命中商业线索"
      },
      {
        category: "sponsor",
        source: "page-heuristic",
        confidence: 0.87,
        reason: "页面文本出现本地商业线索"
      }
    );

    expect(preferred?.source).toBe("comment-suspicion");
  });

  it("evaluates shared local-learning samples", async () => {
    const samples = LOCAL_LEARNING_RECOGNITION_SAMPLES.filter((sample) => sample.humanVerdict === "confirmed");
    const results = await Promise.all(samples.map((sample) => evaluateLocalLearningRecognitionSample(sample)));

    expect(results.map((result) => result.pass)).toEqual(samples.map(() => true));
  });
});
