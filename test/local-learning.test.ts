import { describe, expect, it } from "vitest";
import {
  pickPreferredLocalVideoSignal,
  shouldPersistLocalVideoSignal,
  shouldReplaceAutomaticLocalLabel
} from "../src/utils/local-learning";
import { LOCAL_LEARNING_RECOGNITION_SAMPLES } from "./fixtures/recognition-samples";
import { evaluateLocalLearningRecognitionSample } from "./helpers/recognition-eval";

describe("local learning heuristics", () => {
  it("uses the shared persistence threshold contract", () => {
    expect(
      shouldPersistLocalVideoSignal({
        category: "sponsor",
        source: "page-heuristic",
        confidence: 0.72
      })
    ).toBe(true);

    expect(
      shouldPersistLocalVideoSignal({
        category: "sponsor",
        source: "page-heuristic",
        confidence: 0.71
      })
    ).toBe(false);
  });

  it("uses stricter thresholds for comment suspicion and goods shortcuts", () => {
    expect(
      shouldPersistLocalVideoSignal({
        category: "sponsor",
        source: "comment-suspicion",
        confidence: 0.83
      })
    ).toBe(false);
    expect(
      shouldPersistLocalVideoSignal({
        category: "sponsor",
        source: "comment-suspicion",
        confidence: 0.84
      })
    ).toBe(true);
    expect(
      shouldPersistLocalVideoSignal({
        category: "sponsor",
        source: "comment-goods",
        confidence: 0.89
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

  it("does not let lower-priority auto signals replace stronger learned labels", () => {
    expect(
      shouldReplaceAutomaticLocalLabel(
        {
          category: "sponsor",
          source: "comment-suspicion",
          confidence: 0.87,
          updatedAt: 1,
          reason: "评论区命中商业线索"
        },
        {
          category: "sponsor",
          source: "page-heuristic",
          confidence: 0.87,
          reason: "页面文本出现本地商业线索"
        }
      )
    ).toBe(false);

    expect(
      shouldReplaceAutomaticLocalLabel(
        {
          category: "sponsor",
          source: "page-heuristic",
          confidence: 0.75,
          updatedAt: 1,
          reason: "页面文本出现本地商业线索"
        },
        {
          category: "sponsor",
          source: "comment-goods",
          confidence: 0.96,
          reason: "评论区命中商品卡广告"
        }
      )
    ).toBe(true);
  });

  it("evaluates shared local-learning samples", async () => {
    const samples = LOCAL_LEARNING_RECOGNITION_SAMPLES.filter((sample) => sample.humanVerdict === "confirmed");
    const results = await Promise.all(samples.map((sample) => evaluateLocalLearningRecognitionSample(sample)));

    expect(results.map((result) => result.pass)).toEqual(samples.map(() => true));
  });
});
