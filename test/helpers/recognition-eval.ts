import { DEFAULT_DYNAMIC_REGEX_PATTERN } from "../../src/constants";
import { LocalVideoLabelStore } from "../../src/core/local-label-store";
import { classifyCommentRenderer } from "../../src/features/comment-filter";
import { classifyDynamicItem } from "../../src/features/dynamic-filter";
import type { LocalVideoLabelRecord, LocalVideoSignal } from "../../src/types";
import {
  pickPreferredLocalVideoSignal,
  shouldPersistLocalVideoSignal,
  shouldReplaceAutomaticLocalLabel
} from "../../src/utils/local-learning";
import { inferLocalVideoSignal } from "../../src/utils/local-video-signal";
import type {
  CommentRecognitionSample,
  DynamicRecognitionSample,
  LocalLearningRecognitionSample,
  RecognitionSample,
  VideoRecognitionSample
} from "../fixtures/recognition-samples";

type EvalIssue = "false-positive" | "false-negative" | "boundary-drift" | "local-learning-regression" | "trap-pending";

export type RecognitionEvaluationCaseResult = {
  id: string;
  domain: RecognitionSample["domain"];
  caseType: RecognitionSample["caseType"];
  expectedCategory: string | null;
  actualCategory: string | null;
  pass: boolean;
  issue: EvalIssue | null;
  notes?: string;
};

export type RecognitionEvaluationSummary = {
  totalApproved: number;
  totalPassed: number;
  totalFailed: number;
  falsePositives: RecognitionEvaluationCaseResult[];
  falseNegatives: RecognitionEvaluationCaseResult[];
  boundaryDrift: RecognitionEvaluationCaseResult[];
  localLearningFailures: RecognitionEvaluationCaseResult[];
  pendingTrapSamples: Array<Pick<RecognitionSample, "id" | "domain" | "notes">>;
  domainStats: Record<string, { total: number; passed: number; failed: number }>;
};

function createCommentRenderer(sample: CommentRecognitionSample): HTMLElement & { shadowRoot: ShadowRoot } {
  const renderer = document.createElement("bili-comment-renderer") as HTMLElement & { shadowRoot: ShadowRoot };
  const rendererRoot = renderer.attachShadow({ mode: "open" });
  const richText = document.createElement("bili-rich-text");
  const richRoot = richText.attachShadow({ mode: "open" });
  const textNode = document.createElement("span");
  textNode.textContent = sample.input.text;
  richRoot.appendChild(textNode);
  if (sample.input.hasGoodsLink) {
    const link = document.createElement("a");
    link.textContent = "商品卡";
    link.setAttribute("data-type", "goods");
    richRoot.appendChild(link);
  }

  const userInfo = document.createElement("bili-comment-user-info");
  userInfo.attachShadow({ mode: "open" }).appendChild(document.createElement("span"));
  const content = document.createElement("div");
  content.id = "content";
  content.textContent = sample.input.text;
  const main = document.createElement("div");
  main.id = "main";
  const actions = document.createElement("bili-comment-action-buttons-renderer");
  actions.attachShadow({ mode: "open" }).appendChild(document.createElement("div"));
  main.appendChild(actions);
  rendererRoot.append(userInfo, richText, content, main);
  return renderer;
}

function createDynamicElement(sample: DynamicRecognitionSample): HTMLElement {
  const element = document.createElement("div");
  const fragments: string[] = [];
  if (sample.input.isForwardGoodsCard) {
    fragments.push(`<div class="bili-dyn-card-goods hide-border"></div>`);
  } else if (sample.input.hasGoodsCard) {
    fragments.push(`<div class="bili-dyn-card-goods"></div>`);
  }
  fragments.push(`<div class="bili-rich-text__content"><span>${sample.input.text}</span></div>`);
  element.innerHTML = fragments.join("");
  return element;
}

function setVideoDom(sample: VideoRecognitionSample): void {
  const description = sample.input.description
    ? `<div class="video-desc-container">${sample.input.description}</div>`
    : "";
  const tags =
    sample.input.tags && sample.input.tags.length > 0
      ? `<div class="video-tag-container">${sample.input.tags.map((tag) => `<a class="tag-link">${tag}</a>`).join("")}</div>`
      : "";
  document.body.innerHTML = `${description}${tags}`;
}

function evaluateClassification(
  sample: RecognitionSample,
  actualCategory: string | null
): RecognitionEvaluationCaseResult {
  const base = {
    id: sample.id,
    domain: sample.domain,
    caseType: sample.caseType,
    expectedCategory: sample.expectedCategory,
    actualCategory
  };

  if (sample.caseType === "must-pass") {
    if (actualCategory !== null) {
      return { ...base, pass: false, issue: "false-positive", notes: "误杀保护样本不应被分类。" };
    }
    return { ...base, pass: true, issue: null };
  }

  if (sample.caseType === "must-hit") {
    if (actualCategory !== sample.expectedCategory) {
      return { ...base, pass: false, issue: "false-negative", notes: "明确应命中样本未命中预期分类。" };
    }
    return { ...base, pass: true, issue: null };
  }

  if (sample.caseType === "boundary") {
    if (actualCategory !== sample.expectedCategory) {
      return { ...base, pass: false, issue: "boundary-drift", notes: "边界样本输出偏离当前锁定口径。" };
    }
    return { ...base, pass: true, issue: null };
  }

  return { ...base, pass: true, issue: "trap-pending", notes: sample.notes };
}

export function evaluateVideoRecognitionSample(sample: VideoRecognitionSample): RecognitionEvaluationCaseResult {
  setVideoDom(sample);
  const actual = inferLocalVideoSignal({ title: sample.input.title })?.category ?? null;
  return evaluateClassification(sample, actual);
}

export function evaluateCommentRecognitionSample(sample: CommentRecognitionSample): RecognitionEvaluationCaseResult {
  const match = classifyCommentRenderer(createCommentRenderer(sample), {
    dynamicRegexPattern: sample.input.regexPattern ?? DEFAULT_DYNAMIC_REGEX_PATTERN,
    dynamicRegexKeywordMinMatches: sample.input.regexKeywordMinMatches ?? 1
  });
  return evaluateClassification(sample, match?.category ?? null);
}

export function evaluateDynamicRecognitionSample(sample: DynamicRecognitionSample): RecognitionEvaluationCaseResult {
  const match = classifyDynamicItem(createDynamicElement(sample), {
    dynamicRegexPattern: sample.input.regexPattern ?? DEFAULT_DYNAMIC_REGEX_PATTERN,
    dynamicRegexKeywordMinMatches: sample.input.regexKeywordMinMatches ?? 1
  });
  return evaluateClassification(sample, match?.category ?? null);
}

function createStoreWithExistingRecord(existingRecord: LocalVideoLabelRecord | null | undefined, videoId: string): LocalVideoLabelStore {
  const store = new LocalVideoLabelStore();
  const records = new Map<string, LocalVideoLabelRecord>();
  if (existingRecord) {
    records.set(videoId, existingRecord);
  }
  Reflect.set(store as unknown as Record<string, unknown>, "records", records);
  return store;
}

function applyIncomingSignal(store: LocalVideoLabelStore, videoId: string, signal: LocalVideoSignal): void {
  const records = Reflect.get(store as unknown as Record<string, unknown>, "records") as Map<string, LocalVideoLabelRecord>;
  const existing = records.get(videoId);
  if (!shouldReplaceAutomaticLocalLabel(existing, signal)) {
    return;
  }

  records.set(videoId, {
    category: signal.category,
    source: signal.source,
    confidence: signal.confidence,
    updatedAt: Date.now(),
    reason: signal.reason
  });
}

export async function evaluateLocalLearningRecognitionSample(
  sample: LocalLearningRecognitionSample
): Promise<RecognitionEvaluationCaseResult> {
  const { videoId, existingRecord, incomingSignal, userDecision } = sample.input;
  const base = {
    id: sample.id,
    domain: sample.domain,
    caseType: sample.caseType,
    expectedCategory: sample.expectedCategory,
    actualCategory: null as string | null
  };

  if (sample.expectedBehavior === "prefer-comment-signal") {
    const preferred = pickPreferredLocalVideoSignal(existingRecord as LocalVideoSignal | null, incomingSignal ?? null);
    return {
      ...base,
      actualCategory: preferred?.category ?? null,
      pass: preferred?.source === "comment-suspicion",
      issue: preferred?.source === "comment-suspicion" ? null : "local-learning-regression",
      notes: "相等置信度时应保持评论信号优先。"
    };
  }

  if (!videoId.startsWith("BV")) {
    return {
      ...base,
      pass: sample.expectedBehavior === "do-not-persist",
      issue: sample.expectedBehavior === "do-not-persist" ? null : "local-learning-regression",
      notes: "非法视频 ID 不应进入持久化。"
    };
  }

  const store = createStoreWithExistingRecord(existingRecord, videoId);
  const records = Reflect.get(store as unknown as Record<string, unknown>, "records") as Map<string, LocalVideoLabelRecord>;

  if (userDecision === "confirm" && sample.expectedCategory) {
    records.set(videoId, {
      category: sample.expectedCategory,
      source: "manual",
      confidence: 1,
      updatedAt: Date.now(),
      reason: "手动确认本地标签"
    });
  } else if (userDecision === "dismiss") {
    records.set(videoId, {
      category: null,
      source: "manual-dismiss",
      confidence: 1,
      updatedAt: Date.now(),
      reason: "手动忽略本地标签"
    });
  } else if (incomingSignal && shouldPersistLocalVideoSignal(incomingSignal)) {
    applyIncomingSignal(store, videoId, incomingSignal);
  }

  const resolved = store.getResolved(videoId);
  const dismissed = store.isDismissed(videoId);
  const actualCategory = resolved?.category ?? null;

  switch (sample.expectedBehavior) {
    case "persist":
      return {
        ...base,
        actualCategory,
        pass: actualCategory === sample.expectedCategory,
        issue: actualCategory === sample.expectedCategory ? null : "local-learning-regression",
        notes: "高置信度自动信号应进入本地学习存储。"
      };
    case "do-not-persist":
      return {
        ...base,
        actualCategory,
        pass: actualCategory === null && !dismissed,
        issue: actualCategory === null && !dismissed ? null : "local-learning-regression",
        notes: "低置信度或非法输入不应落盘。"
      };
    case "manual-keep-wins":
      return {
        ...base,
        actualCategory,
        pass: resolved?.source === "manual" && actualCategory === sample.expectedCategory,
        issue: resolved?.source === "manual" && actualCategory === sample.expectedCategory ? null : "local-learning-regression",
        notes: "手动保留必须压过后续自动信号。"
      };
    case "manual-dismiss-wins":
      return {
        ...base,
        actualCategory,
        pass: dismissed && actualCategory === null,
        issue: dismissed && actualCategory === null ? null : "local-learning-regression",
        notes: "手动忽略必须屏蔽后续自动信号。"
      };
    default:
      return {
        ...base,
        actualCategory,
        pass: true,
        issue: null
      };
  }
}

export async function runRecognitionEvaluation(
  approvedSamples: readonly RecognitionSample[],
  pendingTrapSamples: readonly RecognitionSample[]
): Promise<RecognitionEvaluationSummary> {
  const results: RecognitionEvaluationCaseResult[] = [];

  for (const sample of approvedSamples) {
    if (sample.domain === "video") {
      results.push(evaluateVideoRecognitionSample(sample));
      continue;
    }
    if (sample.domain === "comment") {
      results.push(evaluateCommentRecognitionSample(sample));
      continue;
    }
    if (sample.domain === "dynamic") {
      results.push(evaluateDynamicRecognitionSample(sample));
      continue;
    }
    results.push(await evaluateLocalLearningRecognitionSample(sample));
  }

  const falsePositives = results.filter((result) => result.issue === "false-positive");
  const falseNegatives = results.filter((result) => result.issue === "false-negative");
  const boundaryDrift = results.filter((result) => result.issue === "boundary-drift");
  const localLearningFailures = results.filter((result) => result.issue === "local-learning-regression");
  const domainStats = results.reduce<RecognitionEvaluationSummary["domainStats"]>((stats, result) => {
    const current = stats[result.domain] ?? { total: 0, passed: 0, failed: 0 };
    current.total += 1;
    current.passed += result.pass ? 1 : 0;
    current.failed += result.pass ? 0 : 1;
    stats[result.domain] = current;
    return stats;
  }, {});

  return {
    totalApproved: approvedSamples.length,
    totalPassed: results.filter((result) => result.pass).length,
    totalFailed: results.filter((result) => !result.pass).length,
    falsePositives,
    falseNegatives,
    boundaryDrift,
    localLearningFailures,
    pendingTrapSamples: pendingTrapSamples.map((sample) => ({
      id: sample.id,
      domain: sample.domain,
      notes: sample.notes
    })),
    domainStats
  };
}
