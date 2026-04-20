import type { MbgaContext, MbgaNetworkDecision, MbgaRule, StoredConfig } from "../../types";
import { debugLog } from "../../utils/dom";

const MBGA_MARKS = {
  urlCleaner: "__BSB_MBGA_URL_CLEANER__",
  blockTracking: "__BSB_MBGA_BLOCK_TRACKING__",
  pcdnDisabler: "__BSB_MBGA_PCDN_DISABLER__",
  dynamicWideSwitch: "__BSB_MBGA_DYNAMIC_WIDE_SWITCH__",
  articleCopyUnlock: "__BSB_MBGA_ARTICLE_COPY_UNLOCK__",
  videoFitMode: "__BSB_MBGA_VIDEO_FIT_MODE__",
  grayscaleObserver: "__BSB_MBGA_GRAYSCALE_OBSERVER__"
} as const;
const ARTICLE_COPY_UNLOCKED_ATTR = "data-bsb-mbga-copy-unlocked";
const ARTICLE_COPY_UNLOCK_TIMEOUT_MS = 10_000;

const USELESS_URL_PARAMS = [
  "buvid",
  "is_story_h5",
  "launch_id",
  "live_from",
  "mid",
  "session_id",
  "timestamp",
  "up_id",
  "vd_source",
  /^share/u,
  /^spm/u
] as const;

const TELEMETRY_HOST_RULES = [
  { host: "cm.bilibili.com", reason: "cm telemetry" },
  { host: "data.bilibili.com", reason: "data telemetry" }
] as const;

type UnsafeWindow = Window &
  typeof globalThis & {
    unsafeWindow?: Window;
    [MBGA_MARKS.urlCleaner]?: boolean;
    [MBGA_MARKS.blockTracking]?: boolean;
    [MBGA_MARKS.pcdnDisabler]?: boolean;
    [MBGA_MARKS.dynamicWideSwitch]?: boolean;
    [MBGA_MARKS.articleCopyUnlock]?: boolean;
    [MBGA_MARKS.videoFitMode]?: boolean;
    [MBGA_MARKS.grayscaleObserver]?: MutationObserver;
    disableMcdn?: boolean;
    disableSmtcdns?: boolean;
    forceHighestQuality?: boolean;
    __playinfo__?: Record<string, unknown>;
    __INITIAL_STATE__?: Record<string, unknown>;
    original?: { reprint?: string };
    PCDNLoader?: unknown;
    BPP2PSDK?: unknown;
    SeederSDK?: unknown;
    MReporter?: unknown;
    MReporterInstance?: unknown;
    ReporterPb?: unknown;
    ReporterPbInstance?: unknown;
    Sentry?: Record<string, unknown>;
    __biliUserFp__?: unknown;
    __USER_FP_CONFIG__?: unknown;
    __MIRROR_CONFIG__?: unknown;
  };

type NoopCallable = ((...args: unknown[]) => undefined) & Record<PropertyKey, unknown>;

function getUnsafeWindow(): UnsafeWindow {
  return typeof (window as UnsafeWindow).unsafeWindow !== "undefined"
    ? ((window as UnsafeWindow).unsafeWindow as UnsafeWindow)
    : (window as UnsafeWindow);
}

function createMbgaContext(config: StoredConfig, win = getUnsafeWindow(), doc = document): MbgaContext {
  const url = new URL(win.location.href);
  return {
    config,
    doc,
    win: win as Window & typeof globalThis,
    url
  };
}

function isSameOrSubdomain(hostname: string, expectedHost: string): boolean {
  return hostname === expectedHost || hostname.endsWith(`.${expectedHost}`);
}

function normalizeRequestUrl(input: string | URL | Request, baseHref: string): URL | null {
  try {
    if (typeof input === "string") {
      return new URL(input, baseHref);
    }
    if (input instanceof URL) {
      return new URL(input.toString());
    }
    if (typeof input.url === "string") {
      return new URL(input.url, baseHref);
    }
  } catch (_error) {
    return null;
  }
  return null;
}

function defineWritableValue(target: object, key: PropertyKey, value: unknown): void {
  try {
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: false,
      writable: true,
      value
    });
  } catch (_error) {
    // Ignore readonly host object failures and continue with best effort semantics.
  }
}

function createNoopCallable(): NoopCallable {
  const callable = (() => undefined) as NoopCallable;
  return new Proxy(callable, {
    get(target, property) {
      if (property === Symbol.toPrimitive) {
        return () => "";
      }
      if (property === "then") {
        return undefined;
      }
      return Reflect.get(target, property) ?? createNoopCallable();
    },
    apply() {
      return undefined;
    },
    construct() {
      return createNoopCallable();
    }
  });
}

function installGlobalValue(win: UnsafeWindow, key: PropertyKey, value: unknown): void {
  const current = Reflect.get(win, key);
  if (typeof current !== "undefined") {
    return;
  }
  try {
    Object.defineProperty(win, key, {
      configurable: true,
      enumerable: false,
      writable: true,
      value
    });
  } catch (_error) {
    Reflect.set(win, key, value);
  }
}

function installSentryShim(win: UnsafeWindow): void {
  const hub = { bindClient() {} };
  const noop = () => undefined;
  const sentry = (typeof win.Sentry === "object" && win.Sentry ? win.Sentry : {}) as Record<string, unknown>;
  sentry.BrowserClient ??= class {};
  sentry.Hub ??= class {
    bindClient(): void {}
  };
  sentry.Integrations ??= {
    Vue: class {},
    GlobalHandlers: class {},
    InboundFilters: class {}
  };
  for (const method of [
    "init",
    "configureScope",
    "captureException",
    "captureMessage",
    "captureEvent",
    "setContext",
    "setExtra",
    "setExtras",
    "setTag",
    "setTags",
    "setUser",
    "wrap"
  ]) {
    sentry[method] = noop;
  }
  sentry.SDK_NAME ??= "sentry.javascript.browser";
  sentry.SDK_VERSION ??= "0.0.0-bsb";
  sentry.getCurrentHub = () => hub;
  win.Sentry = sentry;
}

function installWebRtcStubs(win: UnsafeWindow): void {
  try {
    class StubPeerConnection {
      addEventListener(): void {}
      createDataChannel(): void {}
    }
    class StubDataChannel {}
    installGlobalValue(win, "RTCPeerConnection", StubPeerConnection);
    installGlobalValue(win, "RTCDataChannel", StubDataChannel);
    installGlobalValue(win, "webkitRTCPeerConnection", StubPeerConnection);
    installGlobalValue(win, "webkitRTCDataChannel", StubDataChannel);
  } catch (_error) {
    // WebRTC is best-effort only.
  }
}

function findHeadBilivideoDomain(doc: Document): string | undefined {
  const domainPattern = /up[\w-]+\.bilivideo\.com/u;
  const attributeCandidates = doc.head.querySelectorAll("[src], [href], [content]");
  for (const node of attributeCandidates) {
    for (const attributeName of ["src", "href", "content"]) {
      const value = node.getAttribute(attributeName);
      const match = value?.match(domainPattern)?.[0];
      if (match) {
        return match;
      }
    }
  }

  return doc.head.textContent?.match(domainPattern)?.[0];
}

function completeBlockedXhr(xhr: XMLHttpRequest, win: UnsafeWindow, url: string, decision: MbgaNetworkDecision): void {
  const status = decision.syntheticStatus ?? 204;
  const body = decision.syntheticBody ?? "";
  defineWritableValue(xhr, "readyState", 4);
  defineWritableValue(xhr, "status", status);
  defineWritableValue(xhr, "statusText", "No Content");
  defineWritableValue(xhr, "responseText", body);
  defineWritableValue(xhr, "response", body);
  defineWritableValue(xhr, "responseURL", url);

  const fire = (type: string, handlerKey: "onreadystatechange" | "onload" | "onloadend") => {
    const event = typeof win.Event === "function" ? new win.Event(type) : undefined;
    const handler = xhr[handlerKey] as ((event?: Event) => void) | null;
    if (typeof handler === "function") {
      handler.call(xhr, event);
    }
    if (typeof xhr.dispatchEvent === "function" && event) {
      xhr.dispatchEvent(event);
    }
  };

  fire("readystatechange", "onreadystatechange");
  fire("load", "onload");
  fire("loadend", "onloadend");
}

function createSyntheticFetchResponse(win: UnsafeWindow, decision: MbgaNetworkDecision): Response {
  const status = decision.syntheticStatus ?? 204;
  const body = status === 204 || status === 205 || status === 304 ? null : (decision.syntheticBody ?? "");
  if (typeof win.Response === "function") {
    return new win.Response(body, {
      status,
      statusText: "No Content",
      headers: {
        "content-type": "text/plain;charset=UTF-8",
        "x-bsb-mbga": decision.reason
      }
    });
  }
  return new Response(body, {
    status,
    statusText: "No Content",
    headers: {
      "content-type": "text/plain;charset=UTF-8",
      "x-bsb-mbga": decision.reason
    }
  });
}

function ensureScopedStyle(doc: Document, id: string, css: string): void {
  if (doc.querySelector(`style[data-bsb-mbga-style="${id}"]`)) {
    return;
  }
  const style = doc.createElement("style");
  style.setAttribute("data-bsb-mbga-style", id);
  style.textContent = css;
  (doc.head || doc.documentElement).appendChild(style);
}

function isVideoPage(url: URL): boolean {
  return (
    url.hostname === "www.bilibili.com" &&
    (url.pathname.startsWith("/video/") || url.pathname.startsWith("/bangumi/play/"))
  );
}

function isArticlePage(url: URL): boolean {
  return url.hostname === "www.bilibili.com" && url.pathname.startsWith("/read/cv");
}

function isDynamicPage(url: URL): boolean {
  return url.hostname === "t.bilibili.com";
}

function isLivePage(url: URL): boolean {
  return url.hostname === "live.bilibili.com";
}

function isMainFeedPage(url: URL): boolean {
  return url.hostname === "www.bilibili.com" && (url.pathname === "/" || url.pathname.startsWith("/?"));
}

function ensurePageFilterNeutralized(doc: Document): void {
  for (const element of [doc.documentElement, doc.body]) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }
    const inlineFilter = [element.style.filter, element.style.webkitFilter].join(" ");
    const computedStyle = typeof getComputedStyle === "function" ? getComputedStyle(element) : null;
    const computedFilter = computedStyle ? computedStyle.filter : "";
    if (!/grayscale/iu.test(`${inlineFilter} ${computedFilter}`)) {
      continue;
    }
    element.style.setProperty("filter", "none", "important");
    element.style.setProperty("-webkit-filter", "none", "important");
  }
}

function mountGrayscaleCleanup(ctx: MbgaContext): void {
  const win = ctx.win as UnsafeWindow;
  ensurePageFilterNeutralized(ctx.doc);
  if (win[MBGA_MARKS.grayscaleObserver]) {
    return;
  }
  const observer = new MutationObserver(() => {
    ensurePageFilterNeutralized(ctx.doc);
  });
  observer.observe(ctx.doc.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style"],
    subtree: false
  });
  if (ctx.doc.body) {
    observer.observe(ctx.doc.body, {
      attributes: true,
      attributeFilter: ["class", "style"],
      subtree: false
    });
  }
  win[MBGA_MARKS.grayscaleObserver] = observer;
}

export function removeTracking(url: string | null | undefined, baseHref = window.location.href): string {
  if (!url) {
    return url ?? "";
  }

  try {
    const urlObj = new URL(url, baseHref);
    if (!urlObj.search) {
      return url;
    }

    const searchParams = urlObj.searchParams;
    for (const key of [...searchParams.keys()]) {
      for (const matcher of USELESS_URL_PARAMS) {
        const matched = typeof matcher === "string" ? matcher === key : matcher.test(key);
        if (matched) {
          searchParams.delete(key);
          break;
        }
      }
    }

    urlObj.search = searchParams.toString();
    return urlObj.toString();
  } catch (_error) {
    return url;
  }
}

export function resolveMbgaNetworkDecision(
  input: string | URL | Request,
  baseHref = window.location.href
): MbgaNetworkDecision {
  const url = normalizeRequestUrl(input, baseHref);
  if (!url) {
    return {
      action: "allow",
      reason: "invalid-url"
    };
  }

  for (const rule of TELEMETRY_HOST_RULES) {
    if (isSameOrSubdomain(url.hostname, rule.host)) {
      return {
        action: "block",
        reason: rule.reason,
        matchedUrl: url.toString(),
        syntheticStatus: 204,
        syntheticBody: ""
      };
    }
  }

  return {
    action: "allow",
    reason: "not-matched",
    matchedUrl: url.toString()
  };
}

function mountUrlCleaner(ctx: MbgaContext): void {
  const win = ctx.win as UnsafeWindow;
  if (win[MBGA_MARKS.urlCleaner] || typeof win.history === "undefined") {
    return;
  }

  win[MBGA_MARKS.urlCleaner] = true;
  win.history.replaceState(undefined, "", removeTracking(win.location.href, win.location.href));

  const originalPushState = win.history.pushState;
  win.history.pushState = function (state: unknown, unused: string, url?: string | URL | null) {
    const nextUrl = typeof url === "undefined" || url === null ? url : removeTracking(String(url), win.location.href);
    return originalPushState.call(this, state, unused, nextUrl);
  };

  const originalReplaceState = win.history.replaceState;
  win.history.replaceState = function (state: unknown, unused: string, url?: string | URL | null) {
    const nextUrl = typeof url === "undefined" || url === null ? url : removeTracking(String(url), win.location.href);
    return originalReplaceState.call(this, state, unused, nextUrl);
  };
}

function mountBlockTracking(ctx: MbgaContext): void {
  const win = ctx.win as UnsafeWindow;
  if (win[MBGA_MARKS.blockTracking]) {
    return;
  }
  win[MBGA_MARKS.blockTracking] = true;

  if (typeof win.fetch === "function") {
    const originalFetch = win.fetch.bind(win);
    win.fetch = function (input: string | URL | Request, init?: RequestInit): Promise<Response> {
      const decision = resolveMbgaNetworkDecision(input, win.location.href);
      if (decision.action === "block") {
        return Promise.resolve(createSyntheticFetchResponse(win, decision));
      }
      return originalFetch(input, init);
    };
  }

  if (win.XMLHttpRequest?.prototype) {
    const originalOpen = win.XMLHttpRequest.prototype.open;
    const originalSend = win.XMLHttpRequest.prototype.send;
    const decisionKey = "__bsbMbgaDecision";
    const urlKey = "__bsbMbgaUrl";

    win.XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async?: boolean,
      username?: string | null,
      password?: string | null
    ) {
      const decision = resolveMbgaNetworkDecision(url, win.location.href);
      defineWritableValue(this as object, decisionKey, decision);
      defineWritableValue(this as object, urlKey, String(url));
      return originalOpen.call(this, method, String(url), async ?? true, username ?? null, password ?? null);
    };

    win.XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      const decision = Reflect.get(this as object, decisionKey) as MbgaNetworkDecision | undefined;
      if (decision?.action === "block") {
        const requestUrl = String(Reflect.get(this as object, urlKey) ?? "");
        queueMicrotask(() => completeBlockedXhr(this, win, requestUrl, decision));
        return;
      }
      return originalSend.call(this, body ?? null);
    };
  }

  if (win.navigator && typeof win.navigator.sendBeacon === "function") {
    const originalSendBeacon = win.navigator.sendBeacon.bind(win.navigator);
    win.navigator.sendBeacon = function (url: string | URL, data?: BodyInit | null): boolean {
      const decision = resolveMbgaNetworkDecision(url, win.location.href);
      if (decision.action === "block") {
        return true;
      }
      return originalSendBeacon(url, data);
    };
  } else if (win.navigator) {
    win.navigator.sendBeacon = function (url: string | URL): boolean {
      const decision = resolveMbgaNetworkDecision(url, win.location.href);
      return decision.action === "block" ? true : false;
    };
  }

  installGlobalValue(win, "MReporterInstance", createNoopCallable());
  installGlobalValue(win, "MReporter", createNoopCallable());
  installGlobalValue(win, "ReporterPbInstance", createNoopCallable());
  installGlobalValue(win, "ReporterPb", createNoopCallable());
  installSentryShim(win);

  try {
    Object.defineProperty(win, "__biliUserFp__", {
      configurable: true,
      enumerable: false,
      get() {
        return {
          init() {},
          queryUserLog() {
            return [];
          }
        };
      },
      set() {}
    });
    Object.defineProperty(win, "__USER_FP_CONFIG__", {
      configurable: true,
      enumerable: false,
      get() {
        return undefined;
      },
      set() {}
    });
    Object.defineProperty(win, "__MIRROR_CONFIG__", {
      configurable: true,
      enumerable: false,
      get() {
        return undefined;
      },
      set() {}
    });
  } catch (_error) {
    // Some globals are not configurable in all runtimes.
  }
}

function mountPcdnDisabler(ctx: MbgaContext): void {
  const win = ctx.win as UnsafeWindow;
  if (win[MBGA_MARKS.pcdnDisabler]) {
    return;
  }
  win[MBGA_MARKS.pcdnDisabler] = true;

  installWebRtcStubs(win);
  installGlobalValue(win, "PCDNLoader", class {});
  installGlobalValue(
    win,
    "BPP2PSDK",
    class {
      on(): void {}
    }
  );
  installGlobalValue(win, "SeederSDK", class {});

  if (isVideoPage(ctx.url)) {
    let cdnDomain: string | undefined;

    const replaceP2PUrl = (input: string) => {
      cdnDomain ||= findHeadBilivideoDomain(ctx.doc);
      try {
        const url = new URL(input);
        if (url.hostname.endsWith(".mcdn.bilivideo.cn")) {
          url.host = cdnDomain || "upos-sz-mirrorcoso1.bilivideo.com";
          url.port = "443";
          return url.toString();
        }
        if (url.hostname.endsWith(".szbdyd.com")) {
          const source = url.searchParams.get("xy_usource");
          if (source) {
            url.host = source;
            url.port = "443";
          }
          return url.toString();
        }
        return input;
      } catch (_error) {
        return input;
      }
    };

    const replaceP2PUrlDeep = (value: unknown): void => {
      if (!value || typeof value !== "object") {
        return;
      }
      for (const key of Object.keys(value)) {
        const current = (value as Record<string, unknown>)[key];
        if (typeof current === "string") {
          (value as Record<string, unknown>)[key] = replaceP2PUrl(current);
        } else if (current && typeof current === "object") {
          replaceP2PUrlDeep(current);
        }
      }
    };

    if (win.__playinfo__) {
      replaceP2PUrlDeep(win.__playinfo__);
    }

    if (win.HTMLMediaElement?.prototype) {
      const descriptor = Object.getOwnPropertyDescriptor(win.HTMLMediaElement.prototype, "src");
      if (descriptor?.set) {
        Object.defineProperty(win.HTMLMediaElement.prototype, "src", {
          ...descriptor,
          set(value: string) {
            descriptor.set?.call(this, replaceP2PUrl(value));
          }
        });
      }
    }

    if (win.XMLHttpRequest?.prototype) {
      const originalOpen = win.XMLHttpRequest.prototype.open;
      win.XMLHttpRequest.prototype.open = function (...args: unknown[]) {
        if (typeof args[1] === "string") {
          args[1] = replaceP2PUrl(args[1]);
        }
        return originalOpen.apply(this, args as never);
      };
    }
  }

  if (isLivePage(ctx.url)) {
    win.disableMcdn = true;
    win.disableSmtcdns = true;
    win.forceHighestQuality = true;
    let recentErrors = 0;
    win.setInterval(() => {
      if (recentErrors > 0) {
        recentErrors = Math.floor(recentErrors / 2);
      }
    }, 10_000);

    if (typeof win.fetch === "function") {
      const originalFetch = win.fetch.bind(win);
      win.fetch = function (input: string | URL | Request, init?: RequestInit): Promise<Response> {
        try {
          const url = normalizeRequestUrl(input, ctx.win.location.href);
          const urlString = url?.toString() ?? "";
          const mcdnPattern = /[xy0-9]+\.mcdn\.bilivideo\.cn:\d+/u;
          const smtcdnsPattern = /[\w.]+\.smtcdns\.net\/([\w-]+\.bilivideo\.com\/)/u;
          const qualityPattern = /(live-bvc\/\d+\/live_\d+_\d+)_\w+/u;
          let nextUrl = urlString;
          let modified = false;

          if (mcdnPattern.test(urlString) && win.disableMcdn) {
            return Promise.reject(new Error("MCDN Disabled by MBGA"));
          }
          if (smtcdnsPattern.test(urlString) && win.disableSmtcdns) {
            nextUrl = nextUrl.replace(smtcdnsPattern, "$1");
            modified = true;
          }
          if (qualityPattern.test(urlString) && win.forceHighestQuality) {
            nextUrl = nextUrl.replace(qualityPattern, "$1").replace(/(\d+)_(mini|pro)hevc/gu, "$1");
            modified = true;
          }

          const requestInput = modified ? nextUrl : input;
          const promise = originalFetch(requestInput, init);
          promise.then((response) => {
            if (!urlString.match(/\.(m3u8|m4s)/u)) {
              return;
            }
            if ([403, 404].includes(response.status)) {
              recentErrors += 1;
            }
            if (recentErrors >= 5 && win.forceHighestQuality) {
              recentErrors = 0;
              win.forceHighestQuality = false;
              debugLog("MBGA Live: Dropping forceHighestQuality due to multi-error.");
              window.dispatchEvent(new CustomEvent("bsb_mbga_live_fallback"));
            }
          });
          return promise;
        } catch (_error) {
          return originalFetch(input, init);
        }
      };
    }
  }
}

function mountMainFeedCleanup(ctx: MbgaContext): void {
  ensureScopedStyle(
    ctx.doc,
    "main-feed-cleanup",
    `
.adblock-tips,
.feed-card:has(.bili-video-card > div:empty),
.feed2 .feed-card:has(a[href*="cm.bilibili.com"]),
.feed2 .feed-card:has(.bili-video-card:empty) {
  display: none !important;
}

.feed2 .container > * {
  margin-top: 0 !important;
}

.ad-report,
a[href*="cm.bilibili.com"] {
  display: none !important;
}
`
  );
}

function mountDynamicWideMode(ctx: MbgaContext): void {
  const win = ctx.win as UnsafeWindow;
  ensureScopedStyle(
    ctx.doc,
    "dynamic-wide-mode",
    `
html[wide] #app { display: flex; }
html[wide] .bili-dyn-home--member { box-sizing: border-box; padding: 0 10px; width: 100%; flex: 1; }
html[wide] .bili-dyn-content { width: initial; }
html[wide] main { margin: 0 8px; flex: 1; overflow: hidden; width: initial; }
.bili-dyn-list__item:has(.bili-dyn-card-goods),
.bili-dyn-list__item:has(.bili-rich-text-module.goods) {
  display: none !important;
}
`
  );

  if (win[MBGA_MARKS.dynamicWideSwitch]) {
    return;
  }
  win[MBGA_MARKS.dynamicWideSwitch] = true;

  if (!win.localStorage.getItem("WIDE_OPT_OUT")) {
    ctx.doc.documentElement.setAttribute("wide", "wide");
  }

  const injectWideSwitch = () => {
    const tabContainer = ctx.doc.querySelector(".bili-dyn-list-tabs__list");
    if (!(tabContainer instanceof HTMLElement) || ctx.doc.getElementById("wide-mode-switch")) {
      return;
    }

    const spacer = ctx.doc.createElement("div");
    spacer.style.flex = "1";
    const switchButton = ctx.doc.createElement("a");
    switchButton.id = "wide-mode-switch";
    switchButton.className = "bili-dyn-list-tabs__item";
    switchButton.textContent = "宽屏模式";
    switchButton.addEventListener("click", (event) => {
      event.preventDefault();
      if (ctx.win.localStorage.getItem("WIDE_OPT_OUT")) {
        win.localStorage.removeItem("WIDE_OPT_OUT");
        ctx.doc.documentElement.setAttribute("wide", "wide");
      } else {
        win.localStorage.setItem("WIDE_OPT_OUT", "1");
        ctx.doc.documentElement.removeAttribute("wide");
      }
    });
    tabContainer.append(spacer, switchButton);
  };

  win.addEventListener("load", injectWideSwitch, { once: true });
  win.setTimeout(injectWideSwitch, 2_000);
}

function mountArticleCopyUnlock(ctx: MbgaContext): void {
  const win = ctx.win as UnsafeWindow;
  if (win[MBGA_MARKS.articleCopyUnlock]) {
    return;
  }
  win[MBGA_MARKS.articleCopyUnlock] = true;

  if (win.original) {
    win.original.reprint = "1";
  }

  const unlockArticleHolder = (holder: HTMLElement): boolean => {
    if (holder.getAttribute(ARTICLE_COPY_UNLOCKED_ATTR) === "true") {
      return true;
    }
    holder.classList.remove("unable-reprint");
    holder.setAttribute(ARTICLE_COPY_UNLOCKED_ATTR, "true");
    holder.addEventListener(
      "copy",
      (event) => {
        event.stopImmediatePropagation();
      },
      true
    );
    return true;
  };

  const existingHolder = ctx.doc.querySelector(".article-holder");
  if (existingHolder instanceof HTMLElement) {
    unlockArticleHolder(existingHolder);
    return;
  }

  let timeoutId: number | null = null;
  const observer = new MutationObserver(() => {
    const holder = ctx.doc.querySelector(".article-holder");
    if (!(holder instanceof HTMLElement)) {
      return;
    }
    unlockArticleHolder(holder);
    observer.disconnect();
    if (timeoutId !== null) {
      win.clearTimeout(timeoutId);
      timeoutId = null;
    }
  });

  observer.observe(ctx.doc.documentElement, {
    childList: true,
    subtree: true
  });
  timeoutId = win.setTimeout(() => {
    observer.disconnect();
    timeoutId = null;
  }, ARTICLE_COPY_UNLOCK_TIMEOUT_MS);
}

function mountLiveUiCleanup(ctx: MbgaContext): void {
  ensureScopedStyle(
    ctx.doc,
    "live-room-cleanup",
    `
div[data-cy=EvaRenderer_LayerWrapper]:has(.player) { z-index: 999999 !important; }
.fixedPageBackground_root { z-index: 999999 !important; }
#welcome-area-bottom-vm,
.web-player-icon-roomStatus { display: none !important; }
`
  );
}

function mountVideoFitMode(ctx: MbgaContext): void {
  const win = ctx.win as UnsafeWindow;
  ensureScopedStyle(
    ctx.doc,
    "video-fit-mode",
    `
body[video-fit] #bilibili-player video { object-fit: cover !important; }
.bpx-player-ctrl-setting-fit-mode { display: flex; width: 100%; height: 32px; line-height: 32px; }
.bpx-player-ctrl-setting-box .bui-panel-wrap,
.bpx-player-ctrl-setting-box .bui-panel-item { min-height: 172px !important; }
`
  );

  if (win[MBGA_MARKS.videoFitMode]) {
    return;
  }
  win[MBGA_MARKS.videoFitMode] = true;

  const injectFitButton = () => {
    if (ctx.doc.querySelector(".bpx-player-ctrl-setting-fit-mode")) {
      return;
    }
    const parent = ctx.doc.querySelector(".bpx-player-ctrl-setting-menu-left");
    if (!(parent instanceof HTMLElement)) {
      return;
    }

    const item = ctx.doc.createElement("div");
    item.className = "bpx-player-ctrl-setting-fit-mode bui bui-switch";

    const input = ctx.doc.createElement("input");
    input.className = "bui-switch-input";
    input.type = "checkbox";

    const label = ctx.doc.createElement("label");
    label.className = "bui-switch-label";

    const name = ctx.doc.createElement("span");
    name.className = "bui-switch-name";
    name.textContent = "裁切模式";

    const body = ctx.doc.createElement("span");
    body.className = "bui-switch-body";

    const dot = ctx.doc.createElement("span");
    dot.className = "bui-switch-dot";
    dot.appendChild(ctx.doc.createElement("span"));
    body.appendChild(dot);
    label.append(name, body);
    item.append(input, label);

    const moreLink = ctx.doc.querySelector(".bpx-player-ctrl-setting-more");
    if (moreLink instanceof HTMLElement) {
      parent.insertBefore(item, moreLink);
    } else {
      parent.appendChild(item);
    }

    input.addEventListener("change", (event) => {
      const checked = (event.currentTarget as HTMLInputElement).checked;
      if (checked) {
        ctx.doc.body.setAttribute("video-fit", "");
      } else {
        ctx.doc.body.removeAttribute("video-fit");
      }
    });
  };

  const timer = win.setInterval(() => {
    if (ctx.doc.querySelector(".bpx-player-ctrl-setting-menu-left")) {
      injectFitButton();
      win.clearInterval(timer);
    }
  }, 1_000);
  win.setTimeout(() => win.clearInterval(timer), 10_000);
}

export const MBGA_RULES: MbgaRule[] = [
  {
    id: "clean-url-params",
    kind: "behavior",
    safetyNotes: "Only strips explicit tracking params and preserves unrelated query keys.",
    enabled: (config) => config.mbgaEnabled && config.mbgaCleanUrl,
    match: () => true,
    apply: mountUrlCleaner
  },
  {
    id: "block-telemetry-reporters",
    kind: "network",
    safetyNotes: "Blocks only explicit telemetry hosts and returns predictable success semantics to callers.",
    enabled: (config) => config.mbgaEnabled && config.mbgaBlockTracking,
    match: () => true,
    apply: mountBlockTracking
  },
  {
    id: "disable-pcdn",
    kind: "network",
    safetyNotes: "Only rewrites known P2P/CDN hosts and installs transport stubs on video and live pages.",
    enabled: (config) => config.mbgaEnabled && config.mbgaDisablePcdn,
    match: (ctx) => isVideoPage(ctx.url) || isLivePage(ctx.url),
    apply: mountPcdnDisabler
  },
  {
    id: "neutralize-page-grayscale",
    kind: "ui",
    safetyNotes: "Only removes page-level grayscale when such filters are actually present.",
    enabled: (config) => config.mbgaEnabled && config.mbgaSimplifyUi,
    match: () => true,
    apply: mountGrayscaleCleanup
  },
  {
    id: "main-feed-cleanup",
    kind: "ui",
    safetyNotes: "Only hides explicit ad affordances on the main feed.",
    enabled: (config) => config.mbgaEnabled && config.mbgaSimplifyUi,
    match: (ctx) => isMainFeedPage(ctx.url),
    apply: mountMainFeedCleanup
  },
  {
    id: "dynamic-wide-mode",
    kind: "ui",
    safetyNotes: "Only runs on dynamic pages and preserves user opt-out in localStorage.",
    enabled: (config) => config.mbgaEnabled && config.mbgaSimplifyUi,
    match: (ctx) => isDynamicPage(ctx.url),
    apply: mountDynamicWideMode
  },
  {
    id: "article-copy-unlock",
    kind: "behavior",
    safetyNotes: "Only unlocks copy behavior on article pages and leaves other pages untouched.",
    enabled: (config) => config.mbgaEnabled && config.mbgaSimplifyUi,
    match: (ctx) => isArticlePage(ctx.url),
    apply: mountArticleCopyUnlock
  },
  {
    id: "live-room-ui-cleanup",
    kind: "ui",
    safetyNotes: "Only applies targeted live-room overlay cleanup selectors on live pages.",
    enabled: (config) => config.mbgaEnabled && config.mbgaSimplifyUi,
    match: (ctx) => isLivePage(ctx.url),
    apply: mountLiveUiCleanup
  },
  {
    id: "video-fit-mode",
    kind: "behavior",
    safetyNotes: "Only injects the fit toggle on video and bangumi player pages.",
    enabled: (config) => config.mbgaEnabled && config.mbgaSimplifyUi,
    match: (ctx) => isVideoPage(ctx.url),
    apply: mountVideoFitMode
  }
];

const MBGA_CORE_RULE_IDS = new Set(["clean-url-params", "block-telemetry-reporters", "disable-pcdn"]);
const MBGA_UI_RULE_IDS = new Set([
  "neutralize-page-grayscale",
  "main-feed-cleanup",
  "dynamic-wide-mode",
  "article-copy-unlock",
  "live-room-ui-cleanup",
  "video-fit-mode"
]);

function applyMbgaRules(config: StoredConfig, shouldApply: (rule: MbgaRule) => boolean): void {
  const ctx = createMbgaContext(config);
  for (const rule of MBGA_RULES) {
    if (!shouldApply(rule)) {
      continue;
    }
    if (!rule.enabled(config) || !rule.match(ctx)) {
      continue;
    }
    try {
      rule.apply(ctx);
    } catch (error) {
      debugLog(`MBGA rule failed: ${rule.id}`, error);
    }
  }
}

export function mountMbga(config: StoredConfig): void {
  applyMbgaRules(config, (rule) => MBGA_CORE_RULE_IDS.has(rule.id));
}

export function mountMbgaUi(config: StoredConfig): void {
  applyMbgaRules(config, (rule) => MBGA_UI_RULE_IDS.has(rule.id));
}
