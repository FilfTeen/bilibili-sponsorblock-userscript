import type { StoredConfig } from "../../types";
import { debugLog } from "../../utils/dom";

function getUnsafeWindow(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof (window as any).unsafeWindow !== "undefined" ? (window as any).unsafeWindow : window;
}

const uselessUrlParams = [
  "buvid",
  "is_story_h5",
  "launch_id",
  "live_from",
  "mid",
  "session_id",
  "timestamp",
  "up_id",
  "vd_source",
  /^share/,
  /^spm/
];

function removeTracking(url: string | null | undefined): string {
  if (!url) return url ?? "";
  try {
    const urlObj = new URL(url, window.location.href);
    if (!urlObj.search) return url;
    const searchParams = urlObj.searchParams;
    const keys = Array.from(searchParams.keys());
    for (const key of keys) {
      uselessUrlParams.forEach((item) => {
        if (typeof item === "string") {
          if (item === key) searchParams.delete(key);
        } else if (item instanceof RegExp) {
          if (item.test(key)) searchParams.delete(key);
        }
      });
    }
    urlObj.search = searchParams.toString();
    return urlObj.toString();
  } catch (_e) {
    return url;
  }
}

function mountUrlCleaner(win: any) {
  if (typeof win.history === "undefined") return;

  win.history.replaceState(undefined, undefined, removeTracking(window.location.href));
  const pushState = win.history.pushState;
  win.history.pushState = function (state: any, unused: any, url: any) {
    return pushState.apply(this, [state, unused, removeTracking(url)]);
  };
  const replaceState = win.history.replaceState;
  win.history.replaceState = function (state: any, unused: any, url: any) {
    return replaceState.apply(this, [state, unused, removeTracking(url)]);
  };
}

function mountBlockTracking(win: any) {
  // Block WebRTC
  try {
    class _RTCPeerConnection {
      addEventListener() {}
      createDataChannel() {}
    }
    class _RTCDataChannel {}
    Object.defineProperty(win, "RTCPeerConnection", { value: _RTCPeerConnection, enumerable: false, writable: false });
    Object.defineProperty(win, "RTCDataChannel", { value: _RTCDataChannel, enumerable: false, writable: false });
    Object.defineProperty(win, "webkitRTCPeerConnection", {
      value: _RTCPeerConnection,
      enumerable: false,
      writable: false
    });
    Object.defineProperty(win, "webkitRTCDataChannel", { value: _RTCDataChannel, enumerable: false, writable: false });
  } catch (_e) {}

  // Fetch interceptor to drop cm.bilibili.com / data.bilibili.com
  if (win.fetch) {
    const oldFetch = win.fetch;
    win.fetch = function (url: string | URL | Request, init?: RequestInit) {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
      if (typeof urlStr === "string" && urlStr.match(/(?:cm|data)\.bilibili\.com/)) {
        return new Promise(() => {}); // forever pending to swallow the request
      }
      return oldFetch.apply(this, arguments as any);
    };
  }

  // XHR interceptor
  if (win.XMLHttpRequest) {
    const oldOpen = win.XMLHttpRequest.prototype.open;
    win.XMLHttpRequest.prototype.open = function (method: string, url: string | URL) {
      const urlStr = typeof url === "string" ? url : url.toString();
      if (typeof urlStr === "string" && urlStr.match(/(?:cm|data)\.bilibili\.com/)) {
        this.send = function () {};
      }
      return oldOpen.apply(this, arguments as any);
    };
  }

  if (win.navigator) {
    win.navigator.sendBeacon = () => Promise.resolve(true);
  }

  // Silence dummy reporters
  win.MReporterInstance = new Proxy(
    function () {},
    {
      get() {
        return () => {};
      }
    }
  );

  win.MReporter = new Proxy(
    function () {},
    {
      construct() {
        return win.MReporterInstance;
      },
      get() {
        return () => {};
      }
    }
  );

  const SentryHub = class {
    bindClient() {}
  };
  const fakeSentry = {
    SDK_NAME: "sentry.javascript.browser",
    SDK_VERSION: "0.0.0",
    BrowserClient: class {},
    Hub: SentryHub,
    Integrations: {
      Vue: class {},
      GlobalHandlers: class {},
      InboundFilters: class {}
    },
    init() {},
    configureScope() {},
    getCurrentHub: () => new SentryHub(),
    setContext() {},
    setExtra() {},
    setExtras() {},
    setTag() {},
    setTags() {},
    setUser() {},
    wrap() {}
  };

  if (!win.Sentry || win.Sentry.SDK_VERSION !== fakeSentry.SDK_VERSION) {
    if (win.Sentry) {
      delete win.Sentry;
    }
    Object.defineProperty(win, "Sentry", { value: fakeSentry, enumerable: false, writable: false });
  }

  win.ReporterPbInstance = new Proxy(
    function () {},
    {
      get() {
        return () => {};
      }
    }
  );
  win.ReporterPb = new Proxy(
    function () {},
    {
      construct() {
        return win.ReporterPbInstance;
      }
    }
  );

  Object.defineProperty(win, "__biliUserFp__", {
    get() {
      return { init() {}, queryUserLog() { return []; } };
    },
    set() {}
  });

  Object.defineProperty(win, "__USER_FP_CONFIG__", {
    get() {
      return undefined;
    },
    set() {}
  });
  Object.defineProperty(win, "__MIRROR_CONFIG__", {
    get() {
      return undefined;
    },
    set() {}
  });
}

function mountPcdnDisabler(win: any) {
  Object.defineProperty(win, "PCDNLoader", { value: class {}, enumerable: false, writable: false });
  Object.defineProperty(win, "BPP2PSDK", { value: class { on() {} }, enumerable: false, writable: false });
  Object.defineProperty(win, "SeederSDK", { value: class {}, enumerable: false, writable: false });

  if (
    window.location.href.startsWith("https://www.bilibili.com/video/") ||
    window.location.href.startsWith("https://www.bilibili.com/bangumi/play/")
  ) {
    let cdnDomain: string | undefined;

    const replaceP2PUrl = (url: string) => {
      cdnDomain ||= document.head.innerHTML.match(/up[\w-]+\.bilivideo\.com/)?.[0];
      try {
        const urlObj = new URL(url);
        const hostName = urlObj.hostname;
        if (urlObj.hostname.endsWith(".mcdn.bilivideo.cn")) {
          urlObj.host = cdnDomain || "upos-sz-mirrorcoso1.bilivideo.com";
          urlObj.port = "443";
          return urlObj.toString();
        } else if (urlObj.hostname.endsWith(".szbdyd.com")) {
          const uSource = urlObj.searchParams.get("xy_usource");
          if (uSource) {
            urlObj.host = uSource;
            urlObj.port = "443";
          }
          return urlObj.toString();
        }
        return url;
      } catch (_e) {
        return url;
      }
    };

    const replaceP2PUrlDeep = (obj: any) => {
      if (!obj) return;
      for (const key in obj) {
        if (typeof obj[key] === "string") {
          obj[key] = replaceP2PUrl(obj[key]);
        } else if (Array.isArray(obj[key]) || typeof obj[key] === "object") {
          replaceP2PUrlDeep(obj[key]);
        }
      }
    };

    if (win.__playinfo__) {
      replaceP2PUrlDeep(win.__playinfo__);
    }

    if (win.HTMLMediaElement && win.HTMLMediaElement.prototype) {
      const descriptor = Object.getOwnPropertyDescriptor(win.HTMLMediaElement.prototype, "src");
      if (descriptor) {
        Object.defineProperty(win.HTMLMediaElement.prototype, "src", {
          ...descriptor,
          set: function (value: string) {
            if (descriptor.set) {
              descriptor.set.call(this, replaceP2PUrl(value));
            }
          }
        });
      }
    }

    if (win.XMLHttpRequest && win.XMLHttpRequest.prototype) {
      const open = win.XMLHttpRequest.prototype.open;
      win.XMLHttpRequest.prototype.open = function () {
        try {
          if (arguments[1] && typeof arguments[1] === "string") {
            arguments[1] = replaceP2PUrl(arguments[1]);
          }
        } finally {
          return open.apply(this, arguments as any);
        }
      };
    }
  }

  // Live stream High Quality override
  if (window.location.href.startsWith("https://live.bilibili.com/")) {
    win.disableMcdn = true;
    win.disableSmtcdns = true;
    win.forceHighestQuality = true; // Hardcoded default based on MBGA
    let recentErrors = 0;
    setInterval(() => {
      if (recentErrors > 0) recentErrors = Math.floor(recentErrors / 2);
    }, 10000);

    const oldFetch = win.fetch;
    if (oldFetch) {
      win.fetch = function (url: string | URL | Request) {
        try {
          const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
          const mcdnRegexp = /[xy0-9]+\.mcdn\.bilivideo\.cn:\d+/;
          const smtcdnsRegexp = /[\w.]+\.smtcdns\.net\/([\w-]+\.bilivideo\.com\/)/;
          const qualityRegexp = /(live-bvc\/\d+\/live_\d+_\d+)_\w+/;
          let newUrlStr = urlStr;
          let modified = false;

          if (mcdnRegexp.test(urlStr) && win.disableMcdn) {
            return Promise.reject(new Error("MCDN Disabled by MBGA"));
          }
          if (smtcdnsRegexp.test(urlStr) && win.disableSmtcdns) {
            newUrlStr = urlStr.replace(smtcdnsRegexp, "$1");
            modified = true;
          }
          if (qualityRegexp.test(urlStr) && win.forceHighestQuality) {
            newUrlStr = newUrlStr.replace(qualityRegexp, "$1").replace(/(\d+)_(mini|pro)hevc/g, "$1");
            modified = true;
          }

          if (modified && arguments.length > 0) {
            if (typeof arguments[0] === "string" || arguments[0] instanceof URL) {
              arguments[0] = newUrlStr;
            }
          }

          const promise = oldFetch.apply(this, arguments as any);
          promise.then((response: Response) => {
            if (!urlStr.match(/\.(m3u8|m4s)/)) return;
            if ([403, 404].includes(response.status)) recentErrors++;
            if (recentErrors >= 5 && win.forceHighestQuality) {
              recentErrors = 0;
              win.forceHighestQuality = false;
              debugLog("MBGA Live: Dropping forceHighestQuality due to multi-error.");
              // Trigger a DOM event so the UI layer can catch it and show NoticeCenter
              window.dispatchEvent(new CustomEvent("bsb_mbga_live_fallback"));
            }
          });
          return promise;
        } catch (_e) {}
        return oldFetch.apply(this, arguments as any);
      };
    }
  }
}

export function mountMbga(config: StoredConfig): void {
  if (!config.mbgaEnabled) {
    return;
  }

  const win = getUnsafeWindow();

  if (config.mbgaBlockTracking) {
    mountBlockTracking(win);
  }

  if (config.mbgaDisablePcdn) {
    mountPcdnDisabler(win);
  }

  if (config.mbgaCleanUrl) {
    mountUrlCleaner(win);
  }
}

export function mountMbgaUi(config: StoredConfig): void {
  if (!config.mbgaEnabled || !config.mbgaSimplifyUi) {
    return;
  }

  // Remove HarmonyOS or other injected fonts
  const removeFonts = () => {
    Array.from(document.querySelectorAll("link[href*='/jinkela/long/font/']")).forEach((x) => x.remove());
    document.body.style.fontFamily = "initial";
  };
  removeFonts();

  // Article area fix reprint
  if (window.location.href.startsWith("https://www.bilibili.com/read/cv")) {
    const win = getUnsafeWindow();
    if (win.original) {
      win.original.reprint = "1";
    }
    const holder = document.querySelector(".article-holder");
    if (holder) {
      holder.classList.remove("unable-reprint");
      holder.addEventListener("copy", (e) => e.stopImmediatePropagation(), true);
    }
  }

  // Dynamic page wide mode
  if (window.location.host === "t.bilibili.com") {
    const isOptOut = localStorage.getItem("WIDE_OPT_OUT");
    if (!isOptOut) {
      document.documentElement.setAttribute("wide", "wide");
    }

    const injectWideSwitch = () => {
      const tabContainer = document.querySelector(".bili-dyn-list-tabs__list");
      if (!tabContainer || document.getElementById("wide-mode-switch")) return;

      const placeHolder = document.createElement("div");
      placeHolder.style.flex = "1";
      const switchButton = document.createElement("a");
      switchButton.id = "wide-mode-switch";
      switchButton.className = "bili-dyn-list-tabs__item";
      switchButton.textContent = "宽屏模式";
      switchButton.addEventListener("click", (e) => {
        e.preventDefault();
        const optOut = localStorage.getItem("WIDE_OPT_OUT");
        if (optOut) {
          localStorage.removeItem("WIDE_OPT_OUT");
          document.documentElement.setAttribute("wide", "wide");
        } else {
          localStorage.setItem("WIDE_OPT_OUT", "1");
          document.documentElement.removeAttribute("wide");
        }
      });
      tabContainer.appendChild(placeHolder);
      tabContainer.appendChild(switchButton);
    };

    window.addEventListener("load", injectWideSwitch);
    setTimeout(injectWideSwitch, 2000); // Fail-safe
  }

  // Video fit mode
  if (window.location.href.startsWith("https://www.bilibili.com/video/")) {
    const injectFitButton = () => {
      if (document.querySelector(".bpx-player-ctrl-setting-fit-mode")) return;
      const parent = document.querySelector(".bpx-player-ctrl-setting-menu-left");
      if (!parent) return;

      const item = document.createElement("div");
      item.className = "bpx-player-ctrl-setting-fit-mode bui bui-switch";
      item.innerHTML =
        '<input class="bui-switch-input" type="checkbox"><label class="bui-switch-label"><span class="bui-switch-name">裁切模式</span><span class="bui-switch-body"><span class="bui-switch-dot"><span></span></span></span></label>';
      const moreLink = document.querySelector(".bpx-player-ctrl-setting-more");
      if (moreLink) {
        parent.insertBefore(item, moreLink);
      } else {
        parent.appendChild(item);
      }

      const input = item.querySelector("input");
      if (input) {
        input.addEventListener("change", (e: any) => {
          if (e.target.checked) {
            document.body.setAttribute("video-fit", "");
          } else {
            document.body.removeAttribute("video-fit");
          }
        });
      }
    };

    const timer = setInterval(() => {
      if (document.querySelector(".bpx-player-ctrl-setting-menu-left")) {
        injectFitButton();
        clearInterval(timer);
      }
    }, 1000);
    setTimeout(() => clearInterval(timer), 10000);
  }
}
