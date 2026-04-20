export type NativeRequestGuardState = {
  enabled: boolean;
  supportedPage: boolean;
  compactHeaderReady: boolean;
};

type NativeRequestGuardConfig = NativeRequestGuardState & {
  reason?: string;
};

const GUARD_FLAG = "__BSB_NATIVE_REQUEST_GUARD__";
const CONFIG_EVENT = "bsb-tm:native-request-guard-config";
const REDUNDANT_TOPBAR_PATHS = ["/x/msgfeed/unread", "/x/web-interface/nav/stat"] as const;

let bridgeInjected = false;

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

  function remember(url, action) {
    state.records.push({ url: String(url), action, time: Date.now(), reason: state.reason });
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
