import type { LocalVideoSignal } from "../types";

export const LOCAL_VIDEO_SIGNAL_PERSISTENCE_THRESHOLD = 0.72;

export function shouldPersistLocalVideoSignal(signal: Pick<LocalVideoSignal, "confidence">): boolean {
  return signal.confidence >= LOCAL_VIDEO_SIGNAL_PERSISTENCE_THRESHOLD;
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
