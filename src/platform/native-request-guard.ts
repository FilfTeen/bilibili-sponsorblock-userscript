export type NativeRequestGuardState = {
  enabled: boolean;
  supportedPage: boolean;
  compactHeaderReady: boolean;
};

export type NativeRequestGuardAction = "blocked-fetch" | "observed-fetch" | "would-block-xhr" | "observed-xhr";

export type NativeRequestGuardRecord = {
  url: string;
  action: NativeRequestGuardAction;
  time: number;
  reason: string;
};

export type NativeRequestGuardSnapshot = NativeRequestGuardState & {
  reason: string;
  records: NativeRequestGuardRecord[];
};

type NativeRequestGuardConfig = NativeRequestGuardState & {
  reason?: string;
};

const GUARD_FLAG = "__BSB_NATIVE_REQUEST_GUARD__";
const CONFIG_EVENT = "bsb-tm:native-request-guard-config";
const SNAPSHOT_REQUEST_EVENT = "bsb-tm:native-request-guard-snapshot-request";
const SNAPSHOT_RESPONSE_EVENT = "bsb-tm:native-request-guard-snapshot-response";
const REDUNDANT_TOPBAR_PATHS = ["/x/msgfeed/unread", "/x/web-interface/nav/stat"] as const;

let bridgeInjected = false;

function sanitizeNativeRequestUrl(input: unknown, baseHref = window.location.href): string {
  try {
    const raw = typeof input === "string" ? input : input && typeof (input as { url?: unknown }).url === "string" ? (input as { url: string }).url : "";
    if (!raw) {
      return "";
    }
    const parsed = new URL(raw, baseHref);
    return `${parsed.origin}${parsed.pathname}`;
  } catch (_error) {
    return String(input ?? "").split(/[?#]/u, 1)[0] ?? "";
  }
}

export function sanitizeNativeRequestGuardSnapshot(input: unknown): NativeRequestGuardSnapshot | null {
  if (!input || typeof input !== "object") {
    return null;
  }
  const snapshot = input as Partial<NativeRequestGuardSnapshot>;
  const records = Array.isArray(snapshot.records)
    ? snapshot.records
        .map((record): NativeRequestGuardRecord | null => {
          if (!record || typeof record !== "object") {
            return null;
          }
          const item = record as Partial<NativeRequestGuardRecord>;
          const action =
            item.action === "blocked-fetch" ||
            item.action === "observed-fetch" ||
            item.action === "would-block-xhr" ||
            item.action === "observed-xhr"
              ? item.action
              : null;
          if (!action) {
            return null;
          }
          return {
            action,
            url: sanitizeNativeRequestUrl(item.url),
            time: Number.isFinite(item.time) ? Number(item.time) : 0,
            reason: typeof item.reason === "string" ? item.reason : "unknown"
          };
        })
        .filter((record): record is NativeRequestGuardRecord => Boolean(record))
        .slice(-80)
    : [];

  return {
    enabled: Boolean(snapshot.enabled),
    supportedPage: Boolean(snapshot.supportedPage),
    compactHeaderReady: Boolean(snapshot.compactHeaderReady),
    reason: typeof snapshot.reason === "string" ? snapshot.reason : "unknown",
    records
  };
}

export function shouldBlockNativeHeaderRequest(url: string, state: NativeRequestGuardState): boolean {
  if (!state.enabled || !state.supportedPage || !state.compactHeaderReady) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(url, window.location.href);
  } catch (_error) {
    return false;
  }

  if (parsed.hostname !== "api.bilibili.com") {
    return false;
  }

  return REDUNDANT_TOPBAR_PATHS.some((path) => parsed.pathname === path);
}

function buildNativeRequestGuardSource(): string {
  return `
(() => {
  const flag = ${JSON.stringify(GUARD_FLAG)};
  if (window[flag]) {
    return;
  }

  const paths = ${JSON.stringify([...REDUNDANT_TOPBAR_PATHS])};
  const state = {
    enabled: false,
    supportedPage: false,
    compactHeaderReady: false,
    reason: "initial",
    records: []
  };

  function sanitizeUrl(input) {
    try {
      const raw = typeof input === "string" ? input : input && typeof input.url === "string" ? input.url : "";
      if (!raw) {
        return "";
      }
      const parsed = new URL(raw, window.location.href);
      return parsed.origin + parsed.pathname;
    } catch (_error) {
      return String(input || "").split(/[?#]/, 1)[0] || "";
    }
  }

  function remember(url, action) {
    state.records.push({ url: sanitizeUrl(url), action, time: Date.now(), reason: state.reason });
    if (state.records.length > 80) {
      state.records.shift();
    }
  }

  function shouldBlock(url) {
    if (!state.enabled || !state.supportedPage || !state.compactHeaderReady) {
      return false;
    }
    try {
      const parsed = new URL(String(url), window.location.href);
      return parsed.hostname === "api.bilibili.com" && paths.includes(parsed.pathname);
    } catch (_error) {
      return false;
    }
  }

  window[flag] = {
    configure(next) {
      state.enabled = Boolean(next && next.enabled);
      state.supportedPage = Boolean(next && next.supportedPage);
      state.compactHeaderReady = Boolean(next && next.compactHeaderReady);
      state.reason = next && typeof next.reason === "string" ? next.reason : "runtime";
    },
    snapshot() {
      return {
        enabled: state.enabled,
        supportedPage: state.supportedPage,
        compactHeaderReady: state.compactHeaderReady,
        reason: state.reason,
        records: state.records.slice()
      };
    }
  };

  const originalFetch = window.fetch;
  if (typeof originalFetch === "function") {
    window.fetch = function(input, init) {
      const url = typeof input === "string" ? input : input && typeof input.url === "string" ? input.url : "";
      if (shouldBlock(url)) {
        remember(url, "blocked-fetch");
        return Promise.resolve(new Response("", { status: 204, statusText: "Blocked by Bilibili QoL Core" }));
      }
      remember(url, "observed-fetch");
      return originalFetch.apply(this, arguments);
    };
  }

  const originalOpen = window.XMLHttpRequest && window.XMLHttpRequest.prototype.open;
  if (typeof originalOpen === "function") {
    window.XMLHttpRequest.prototype.open = function(method, url) {
      remember(url, shouldBlock(url) ? "would-block-xhr" : "observed-xhr");
      return originalOpen.apply(this, arguments);
    };
  }

  document.addEventListener(${JSON.stringify(CONFIG_EVENT)}, (event) => {
    window[flag].configure(event.detail || {});
  });

  document.addEventListener(${JSON.stringify(SNAPSHOT_REQUEST_EVENT)}, (event) => {
    document.dispatchEvent(new CustomEvent(${JSON.stringify(SNAPSHOT_RESPONSE_EVENT)}, {
      detail: {
        id: event && event.detail && event.detail.id,
        snapshot: window[flag].snapshot()
      }
    }));
  });
})();`;
}

export function installNativeRequestGuardBridge(): void {
  if (bridgeInjected) {
    return;
  }

  const script = document.createElement("script");
  script.id = "bsb-tm-native-request-guard";
  script.textContent = buildNativeRequestGuardSource();
  (document.head || document.documentElement).appendChild(script);
  script.remove();
  bridgeInjected = true;
}

export function configureNativeRequestGuard(config: NativeRequestGuardConfig): void {
  document.dispatchEvent(
    new CustomEvent(CONFIG_EVENT, {
      detail: config
    })
  );
}

export function getNativeRequestGuardSnapshot(): NativeRequestGuardSnapshot | null {
  try {
    const requestId = `native-guard-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let snapshot: NativeRequestGuardSnapshot | null = null;
    const handleResponse = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string; snapshot?: unknown }>).detail;
      if (detail?.id !== requestId) {
        return;
      }
      snapshot = sanitizeNativeRequestGuardSnapshot(detail.snapshot);
    };
    document.addEventListener(SNAPSHOT_RESPONSE_EVENT, handleResponse);
    document.dispatchEvent(
      new CustomEvent(SNAPSHOT_REQUEST_EVENT, {
        detail: {
          id: requestId
        }
      })
    );
    document.removeEventListener(SNAPSHOT_RESPONSE_EVENT, handleResponse);
    return snapshot;
  } catch (_error) {
    return null;
  }
}
