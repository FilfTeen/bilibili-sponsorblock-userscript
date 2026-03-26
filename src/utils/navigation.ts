type UrlChangeListener = (nextHref: string, previousHref: string) => void;

const listeners = new Set<UrlChangeListener>();
const originalHistoryMethods = new Map<"pushState" | "replaceState", History["pushState"]>();
let currentHref = window.location.href;
let fallbackIntervalId: number | null = null;
let navigationListener: EventListener | null = null;

function emitUrlChange(): void {
  const nextHref = window.location.href;
  if (nextHref === currentHref) {
    return;
  }

  const previousHref = currentHref;
  currentHref = nextHref;
  for (const listener of listeners) {
    listener(nextHref, previousHref);
  }
}

function patchHistoryMethod(name: "pushState" | "replaceState"): void {
  if (originalHistoryMethods.has(name)) {
    return;
  }

  const original = history[name];
  originalHistoryMethods.set(name, original);

  history[name] = function patchedHistoryMethod(this: History, ...args: Parameters<History["pushState"]>) {
    const result = original.apply(this, args);
    queueMicrotask(() => {
      emitUrlChange();
    });
    return result;
  };
}

function restoreHistoryMethods(): void {
  for (const [name, original] of originalHistoryMethods) {
    history[name] = original;
  }
  originalHistoryMethods.clear();
}

function ensureStarted(): void {
  if (listeners.size !== 1) {
    return;
  }

  currentHref = window.location.href;
  patchHistoryMethod("pushState");
  patchHistoryMethod("replaceState");
  window.addEventListener("popstate", emitUrlChange);
  window.addEventListener("hashchange", emitUrlChange);

  if ("navigation" in window) {
    navigationListener = () => {
      queueMicrotask(() => {
        emitUrlChange();
      });
    };
    (window as unknown as { navigation: EventTarget }).navigation.addEventListener("navigate", navigationListener);
  }

  // Keep a low-frequency fallback because some Bilibili flows mutate the URL
  // through opaque internal routers that do not always surface browser events.
  fallbackIntervalId = window.setInterval(() => {
    emitUrlChange();
  }, 1200);
}

function maybeStop(): void {
  if (listeners.size > 0) {
    return;
  }

  if (fallbackIntervalId !== null) {
    window.clearInterval(fallbackIntervalId);
    fallbackIntervalId = null;
  }

  window.removeEventListener("popstate", emitUrlChange);
  window.removeEventListener("hashchange", emitUrlChange);
  if ("navigation" in window && navigationListener) {
    (window as unknown as { navigation: EventTarget }).navigation.removeEventListener("navigate", navigationListener);
    navigationListener = null;
  }
  restoreHistoryMethods();
}

export function observeUrlChanges(listener: UrlChangeListener): () => void {
  listeners.add(listener);
  ensureStarted();

  return () => {
    listeners.delete(listener);
    maybeStop();
  };
}
