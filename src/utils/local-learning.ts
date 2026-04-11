import type { LocalVideoLabelRecord, LocalVideoLabelSource, LocalVideoSignal } from "../types";

export const LOCAL_VIDEO_SIGNAL_PERSISTENCE_THRESHOLD = 0.72;

function sourcePriority(source: LocalVideoLabelSource): number {
  switch (source) {
    case "manual":
    case "manual-dismiss":
      return 100;
    case "comment-goods":
      return 30;
    case "comment-suspicion":
      return 20;
    case "page-heuristic":
      return 10;
    default:
      return 0;
  }
}

export function resolveLocalVideoSignalPersistenceThreshold(signal: Pick<LocalVideoSignal, "source" | "category">): number {
  if (signal.source === "comment-goods") {
    return 0.9;
  }
  if (signal.source === "comment-suspicion") {
    return signal.category === "sponsor" ? 0.84 : 0.79;
  }
  if (signal.category === "exclusive_access") {
    return 0.8;
  }
  return LOCAL_VIDEO_SIGNAL_PERSISTENCE_THRESHOLD;
}

export function shouldPersistLocalVideoSignal(signal: Pick<LocalVideoSignal, "confidence" | "source" | "category">): boolean {
  return signal.confidence >= resolveLocalVideoSignalPersistenceThreshold(signal);
}

export function pickPreferredLocalVideoSignal(
  commentSignal: LocalVideoSignal | null,
  pageSignal: LocalVideoSignal | null
): LocalVideoSignal | null {
  if (commentSignal && pageSignal) {
    return commentSignal.confidence >= pageSignal.confidence ? commentSignal : pageSignal;
  }

  return commentSignal ?? pageSignal;
}

export function shouldReplaceAutomaticLocalLabel(
  existing: LocalVideoLabelRecord | null | undefined,
  incoming: LocalVideoSignal
): boolean {
  if (!existing) {
    return true;
  }

  if (existing.source === "manual-dismiss") {
    return false;
  }

  if (existing.source === "manual" && existing.category) {
    return false;
  }

  if (existing.category === incoming.category && existing.source === incoming.source && existing.confidence >= incoming.confidence) {
    return false;
  }

  const existingPriority = sourcePriority(existing.source);
  const incomingPriority = sourcePriority(incoming.source);

  if (incomingPriority < existingPriority && existing.confidence >= incoming.confidence - 0.04) {
    return false;
  }

  if (incomingPriority === existingPriority && existing.confidence >= incoming.confidence) {
    return false;
  }

  return true;
}

export function shouldBypassLocalReasoning(options: {
  hasUpstreamWholeVideoLabel: boolean;
  isUpstreamLabelPending?: boolean;
}): boolean {
  return Boolean(options.hasUpstreamWholeVideoLabel || options.isUpstreamLabelPending);
}
