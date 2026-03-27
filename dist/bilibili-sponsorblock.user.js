// ==UserScript==
// @name         Bilibili SponsorBlock Core
// @namespace    https://github.com/FilfTeen/bilibili-sponsorblock-userscript
// @version      0.3.5
// @description  Tampermonkey core script for skipping sponsor segments on Bilibili.
// @author       FilfTeen
// @license      GPL-3.0-only
// @match        https://www.bilibili.com/*
// @match        https://search.bilibili.com/*
// @match        https://t.bilibili.com/*
// @match        https://space.bilibili.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @connect      *
// @run-at       document-start
// @homepageURL  https://github.com/FilfTeen/bilibili-sponsorblock-userscript
// @supportURL   https://github.com/FilfTeen/bilibili-sponsorblock-userscript/issues
// @downloadURL  https://raw.githubusercontent.com/FilfTeen/bilibili-sponsorblock-userscript/main/dist/bilibili-sponsorblock.user.js
// @updateURL    https://raw.githubusercontent.com/FilfTeen/bilibili-sponsorblock-userscript/main/dist/bilibili-sponsorblock.user.js
// ==/UserScript==
"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/platform/gm.ts
  function resolveWindowFunction(name) {
    if (typeof window === "undefined") {
      return void 0;
    }
    return Reflect.get(window, name);
  }
  function resolveGrantedFunction(name) {
    switch (name) {
      case "GM_getValue":
        if (typeof GM_getValue === "function") {
          return GM_getValue;
        }
        break;
      case "GM_setValue":
        if (typeof GM_setValue === "function") {
          return GM_setValue;
        }
        break;
      case "GM_addStyle":
        if (typeof GM_addStyle === "function") {
          return GM_addStyle;
        }
        break;
      case "GM_registerMenuCommand":
        if (typeof GM_registerMenuCommand === "function") {
          return GM_registerMenuCommand;
        }
        break;
      case "GM_xmlhttpRequest":
        if (typeof GM_xmlhttpRequest === "function") {
          return GM_xmlhttpRequest;
        }
        break;
      default:
        break;
    }
    const fallback = resolveWindowFunction(name);
    return typeof fallback === "function" ? fallback : void 0;
  }
  function assertFunction(name) {
    const fn = resolveGrantedFunction(name);
    if (typeof fn !== "function") {
      throw new Error(`${name} is not available in this environment`);
    }
    return fn;
  }
  function gmGetValue(key, defaultValue) {
    return __async(this, null, function* () {
      const fn = assertFunction("GM_getValue");
      return fn(key, defaultValue);
    });
  }
  function gmSetValue(key, value) {
    return __async(this, null, function* () {
      const fn = assertFunction("GM_setValue");
      fn(key, value);
    });
  }
  function gmAddStyle(css) {
    const fn = assertFunction("GM_addStyle");
    fn(css);
  }
  function gmRegisterMenuCommand(label, handler) {
    const fn = resolveGrantedFunction("GM_registerMenuCommand");
    if (typeof fn === "function") {
      fn(label, handler);
    }
  }
  function fetchViaWindow(options) {
    return __async(this, null, function* () {
      if (typeof fetch !== "function") {
        throw new Error("fetch is not available in this environment");
      }
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const timeoutId = controller && typeof options.timeout === "number" && Number.isFinite(options.timeout) ? window.setTimeout(() => controller.abort(), options.timeout) : null;
      try {
        const response = yield fetch(options.url, {
          method: options.method,
          headers: options.headers,
          body: options.data,
          mode: "cors",
          credentials: "omit",
          signal: controller == null ? void 0 : controller.signal
        });
        return {
          responseText: yield response.text(),
          status: response.status,
          ok: response.ok
        };
      } catch (error) {
        if (controller == null ? void 0 : controller.signal.aborted) {
          throw new Error(`Request timed out: ${options.method} ${options.url}`);
        }
        throw error instanceof Error ? error : new Error(`Request failed: ${options.method} ${options.url}`);
      } finally {
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }
      }
    });
  }
  function gmXmlHttpRequest(options) {
    return __async(this, null, function* () {
      try {
        return yield fetchViaWindow(options);
      } catch (fetchError) {
        const fn = assertFunction("GM_xmlhttpRequest");
        return new Promise((resolve, reject) => {
          fn(__spreadProps(__spreadValues({}, options), {
            onload: (response) => {
              resolve({
                responseText: response.responseText,
                status: response.status,
                ok: response.status >= 200 && response.status < 300
              });
            },
            onerror: () => reject(fetchError instanceof Error ? fetchError : new Error(`Request failed: ${options.method} ${options.url}`)),
            ontimeout: () => reject(new Error(`Request timed out: ${options.method} ${options.url}`))
          }));
        });
      }
    });
  }

  // src/constants.ts
  var SCRIPT_NAME = "Bilibili SponsorBlock Core";
  var CONFIG_STORAGE_KEY = "bsb_tm_config_v1";
  var STATS_STORAGE_KEY = "bsb_tm_stats_v1";
  var CACHE_STORAGE_KEY = "bsb_tm_cache_v1";
  var BRIDGE_FLAG = "__BSB_TM_PAGE_BRIDGE__";
  var REQUEST_TIMEOUT_MS = 8e3;
  var CACHE_TTL_MS = 60 * 60 * 1e3;
  var CACHE_MAX_ENTRIES = 1e3;
  var CACHE_MAX_SIZE_BYTES = 500 * 1024;
  var TICK_INTERVAL_MS = 200;
  var POI_NOTICE_LEAD_SEC = 6;
  var SEGMENT_REWIND_RESET_SEC = 0.5;
  var DEFAULT_DYNAMIC_REGEX_PATTERN = "/618|11(?!1).11(?:\u65E5)?|\u53CC(?:11|\u5341\u4E00|12|\u5341\u4E8C)|\u5973\u795E\u8282|\u5F00\u5B66\u5B63|\u5E74\u8D27\u8282|\u6070(?:\u4E2A|\u4E86|\u5230)?\u996D|\u91D1\u4E3B|(\u4ED6|\u5B83|\u5979)(?:\u4EEC)?\u5BB6(?:\u7684)?|(?:\u8BC4\u8BBA\u533A)?(?:\u9886(?:\u53D6|\u5F20|\u5230)?|\u62A2|\u9001|\u5F97|\u53E0)(?:\u6211\u7684)?(?:\u795E|\u4F18\u60E0|\u7EA2\u5305|\u6298\u6263|\u798F\u5229|\u65E0\u95E8\u69DB|\u9690\u85CF|\u79D8\u5BC6|\u4E13\u5C5E|(?:\u8D85)?\u5927(?:\u989D)?|\u989D\u5916)+(?:\u5238|\u5377|\u52B5|q(?:uan)?)?(?:\u540E|\u5230\u624B|\u4EF7|\u4F7F\u7528|\u4E0B\u5355)?|(?:\u9886|\u62A2|\u5F97|\u9001)(?:\u7EA2\u5305|\u4F18\u60E0|\u5238|\u798F\u5229)|(?:\u4F18\u60E0|(?:\u5238|\u5377|\u52B5)\u540E|\u5230\u624B|\u4FC3\u9500|\u6D3B\u52A8|\u795E)\u4EF7|(?:\u6DD8\u5B9D|tb|\u4EAC\u4E1C|jd|\u72D7\u4E1C|\u62FC\u591A\u591A|pdd|\u5929\u732B|tmall)\u641C\u7D22|(?:\u968F(\u4FBF|\u65F6)|\u4EFB\u610F)(?:\u9000|\u9000\u8D27|\u6362\u8D27)|(?:\u514D\u8D39|\u65E0\u507F)(?:\u6362(?:\u4E2A)?\u65B0|\u66FF\u6362|\u66F4\u6362|\u8BD5\u7528)(?:\u5546\u54C1|\u7269\u54C1)?|(?:\u70B9(?:\u51FB)?|\u6233|\u6765|\u6211)\u8BC4\u8BBA\u533A(?:\u7F6E\u9876)?|(?:\u7ACB\u5373|\u84DD\u94FE|\u94FE\u63A5|\u{1F517})(?:\u8D2D\u4E70|\u4E0B\u5355)|(?:vx|wx|\u5FAE\u4FE1|\u8F6F\u4EF6)\u626B\u7801(?:\u9886)?(?:\u4F18\u60E0|\u7EA2\u5305|\u5238)?|(?:\u6211\u7684)?\u540C\u6B3E(?:[\u7684]?(?:\u63A8\u8350|\u597D\u7269|\u5546\u54C1|\u5165\u624B|\u8D2D\u4E70|\u62E5\u6709|\u5206\u4EAB|\u5B89\u5229)?)|\u6EE1\\d+|\u5927\u4FC3|\u4FC3\u9500|\u6298\u6263|\u7279\u4EF7|\u79D2\u6740|\u5E7F\u544A|\u63A8\u5E7F|\u4F4E\u81F3|\u70ED\u5356|\u62A2\u8D2D|\u65B0\u54C1|\u8C6A\u793C|\u8D60\u54C1|\u5BC6\u4EE4|(?:\u997F\u4E86\u4E48|\u7F8E(?:\u56E2|\u56E3)|\u767E\u5EA6\u5916\u5356|\u8702\u9E1F|\u8FBE\u8FBE|UU\u8DD1\u817F|(?:\u6DD8\u5B9D)?\u95EA\u8D2D)|(?:\u70B9|\u8BA2|\u9001|\u5403)(?:\u5916\u5356|\u9910)|\u5916\u5356(?:\u8282|\u670D\u52A1|\u5E73\u53F0|app)/gi";
  var CATEGORY_ORDER = [
    "sponsor",
    "selfpromo",
    "interaction",
    "intro",
    "outro",
    "preview",
    "padding",
    "music_offtopic",
    "poi_highlight",
    "exclusive_access"
  ];
  var CATEGORY_LABELS = {
    sponsor: "\u5E7F\u544A",
    selfpromo: "\u81EA\u8350",
    interaction: "\u4E92\u52A8\u63D0\u9192",
    intro: "\u7247\u5934",
    outro: "\u7247\u5C3E",
    preview: "\u9884\u544A/\u56DE\u653E",
    padding: "\u586B\u5145\u7A7A\u6BB5",
    music_offtopic: "\u97F3\u4E50\u65E0\u5173\u6BB5",
    poi_highlight: "\u9AD8\u5149\u70B9",
    exclusive_access: "\u6574\u89C6\u9891\u6807\u7B7E"
  };
  var CATEGORY_COLORS = {
    sponsor: "#00d400",
    selfpromo: "#ffff00",
    interaction: "#cc00ff",
    intro: "#00ffff",
    outro: "#0202ed",
    preview: "#008fd6",
    padding: "#222222",
    music_offtopic: "#ff9900",
    poi_highlight: "#ff1684",
    exclusive_access: "#008a5c"
  };
  var CATEGORY_TEXT_COLORS = {
    sponsor: "#ffffff",
    selfpromo: "#111111",
    interaction: "#ffffff",
    intro: "#111111",
    outro: "#ffffff",
    preview: "#ffffff",
    padding: "#ffffff",
    music_offtopic: "#111111",
    poi_highlight: "#ffffff",
    exclusive_access: "#ffffff"
  };
  var MODE_LABELS = {
    auto: "\u81EA\u52A8",
    manual: "\u624B\u52A8",
    notice: "\u4EC5\u63D0\u793A",
    off: "\u5173\u95ED"
  };
  var CONTENT_FILTER_MODE_LABELS = {
    hide: "\u9690\u85CF\u5E76\u6807\u8BB0",
    label: "\u4EC5\u6807\u8BB0",
    off: "\u5173\u95ED"
  };
  var THUMBNAIL_LABEL_MODE_LABELS = {
    overlay: "\u7F29\u7565\u56FE\u89D2\u6807",
    off: "\u5173\u95ED"
  };
  var DEFAULT_CATEGORY_MODES = {
    sponsor: "auto",
    selfpromo: "manual",
    interaction: "manual",
    intro: "manual",
    outro: "manual",
    preview: "notice",
    padding: "auto",
    music_offtopic: "auto",
    poi_highlight: "manual",
    exclusive_access: "notice"
  };
  var DEFAULT_CONFIG = {
    enabled: true,
    serverAddress: "https://www.bsbsb.top",
    enableCache: true,
    noticeDurationSec: 4,
    minDurationSec: 0,
    showPreviewBar: true,
    thumbnailLabelMode: "overlay",
    categoryModes: DEFAULT_CATEGORY_MODES,
    dynamicFilterMode: "off",
    dynamicRegexPattern: DEFAULT_DYNAMIC_REGEX_PATTERN,
    dynamicRegexKeywordMinMatches: 1,
    commentFilterMode: "off",
    commentHideReplies: false
  };
  var DEFAULT_STATS = {
    skipCount: 0,
    minutesSaved: 0
  };

  // src/platform/page-bridge.ts
  var bridgeToken = `bsb-tm-${Math.random().toString(36).slice(2)}`;
  var REQUEST_EVENT = `bsb-tm:request:${bridgeToken}`;
  var RESPONSE_EVENT = `bsb-tm:response:${bridgeToken}`;
  var bridgeInjected = false;
  function buildBridgeSource() {
    return `
(() => {
  if (window[${JSON.stringify(BRIDGE_FLAG)}]) {
    return;
  }

  window[${JSON.stringify(BRIDGE_FLAG)}] = true;
  // Use a document-scoped event channel so the userscript only talks to the bridge it created.
  document.addEventListener(${JSON.stringify(REQUEST_EVENT)}, (event) => {
    const data = event.detail;
    if (!data || typeof data.id !== "string") {
      return;
    }

    let initialState = null;
    let playInfo = null;
    let playerManifest = null;

    try {
      initialState = typeof window.__INITIAL_STATE__ === "undefined" ? null : window.__INITIAL_STATE__;
    } catch (_error) {}

    try {
      playInfo = typeof window.__playinfo__ === "undefined" ? null : window.__playinfo__;
    } catch (_error) {}

    try {
      const player = window.player;
      const manifest = player && typeof player.getManifest === "function" ? player.getManifest() : null;
      if (manifest && typeof manifest === "object") {
        playerManifest = {
          aid: typeof manifest.aid === "undefined" ? null : manifest.aid,
          cid: typeof manifest.cid === "undefined" ? null : manifest.cid,
          bvid: typeof manifest.bvid === "undefined" ? null : manifest.bvid,
          p: typeof manifest.p === "undefined" ? null : manifest.p
        };
      }
    } catch (_error) {}

    document.dispatchEvent(new CustomEvent(${JSON.stringify(RESPONSE_EVENT)}, {
      detail: {
        id: data.id,
        payload: {
          url: window.location.href,
          initialState,
          playInfo,
          playerManifest
        }
      }
    }));
  });
})();`;
  }
  function ensurePageBridge() {
    if (bridgeInjected) {
      return;
    }
    const script = document.createElement("script");
    script.id = "bsb-tm-page-bridge";
    script.textContent = buildBridgeSource();
    (document.head || document.documentElement).appendChild(script);
    script.remove();
    bridgeInjected = true;
  }
  function requestPageSnapshot() {
    return __async(this, null, function* () {
      ensurePageBridge();
      return new Promise((resolve) => {
        const id = `bsb-tm-${Math.random().toString(36).slice(2)}`;
        const timeoutId = window.setTimeout(() => {
          document.removeEventListener(RESPONSE_EVENT, onMessage);
          resolve(null);
        }, REQUEST_TIMEOUT_MS);
        function onMessage(event) {
          const data = event.detail;
          if (!data || data.id !== id) {
            return;
          }
          window.clearTimeout(timeoutId);
          document.removeEventListener(RESPONSE_EVENT, onMessage);
          resolve(typeof data.payload === "undefined" ? null : data.payload);
        }
        document.addEventListener(RESPONSE_EVENT, onMessage);
        document.dispatchEvent(
          new CustomEvent(REQUEST_EVENT, {
            detail: { id }
          })
        );
      });
    });
  }

  // src/utils/number.ts
  function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  function roundMinutes(seconds) {
    return Math.round(seconds / 60 * 100) / 100;
  }

  // src/utils/pattern.ts
  var STRONG_PROMO_INTENT_PATTERN = /评论区(?:置顶)?|优惠(?:券|卷|劵)|无门槛|折扣|下单|购买|蓝链|链接|扫码|同款|密令|红包|福利|领(?:取|券|红包)|抢(?:券|红包)?|淘宝|京东|拼多多|天猫|满\d+|大促|金主|恰饭|商品卡/iu;
  var BENIGN_PROMO_CONTEXT_PATTERN = /广告位|广告学|推广曲|推广大使|外卖(?:到了|真香|好吃|骑手)|同款(?:bgm|BGM|音乐|滤镜)/iu;
  function regexFromStoredPattern(input) {
    const trimmed = input.trim();
    if (!trimmed) {
      return null;
    }
    const match = trimmed.match(/^\/(.*)\/([a-z]*)$/iu);
    try {
      if (match) {
        return new RegExp(match[1], match[2]);
      }
      return new RegExp(trimmed, "giu");
    } catch (_error) {
      return null;
    }
  }
  function collectPatternMatches(text, pattern, minLength = 2) {
    var _a;
    const globalPattern = pattern.global ? pattern : new RegExp(pattern.source, `${pattern.flags}g`);
    const matches = (_a = text.match(globalPattern)) != null ? _a : [];
    return [...new Set(matches.map((entry) => entry.trim()).filter((entry) => entry.length >= minLength))];
  }
  function validateStoredPattern(input) {
    const trimmed = input.trim();
    if (!trimmed) {
      return {
        valid: false,
        error: "\u6B63\u5219\u4E0D\u80FD\u4E3A\u7A7A"
      };
    }
    const compiled = regexFromStoredPattern(trimmed);
    if (!compiled) {
      return {
        valid: false,
        error: "\u6B63\u5219\u683C\u5F0F\u65E0\u6548"
      };
    }
    return {
      valid: true,
      error: null
    };
  }
  function isLikelyPromoText(text, matches, minMatches) {
    const normalizedText = text.replace(/\s+/gu, " ").trim();
    if (!normalizedText || matches.length === 0) {
      return false;
    }
    if (BENIGN_PROMO_CONTEXT_PATTERN.test(normalizedText)) {
      return false;
    }
    const strongIntent = STRONG_PROMO_INTENT_PATTERN.test(normalizedText);
    const effectiveThreshold = strongIntent ? Math.max(1, minMatches) : Math.max(2, minMatches);
    return matches.length >= effectiveThreshold;
  }

  // src/utils/url.ts
  function normalizeServerAddress(rawValue) {
    if (!rawValue) {
      return null;
    }
    try {
      const parsed = new URL(rawValue.trim());
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return null;
      }
      parsed.username = "";
      parsed.password = "";
      parsed.hash = "";
      parsed.search = "";
      return parsed.toString().replace(/\/+$/u, "");
    } catch (_error) {
      return null;
    }
  }

  // src/core/config-store.ts
  function isCategoryMode(value) {
    return value === "auto" || value === "manual" || value === "notice" || value === "off";
  }
  function isThumbnailLabelMode(value) {
    return value === "overlay" || value === "off";
  }
  function cloneDefaultConfig() {
    return __spreadProps(__spreadValues({}, DEFAULT_CONFIG), {
      categoryModes: __spreadValues({}, DEFAULT_CONFIG.categoryModes)
    });
  }
  function normalizeConfig(input) {
    var _a, _b, _c, _d, _e;
    const next = cloneDefaultConfig();
    if (!input) {
      return next;
    }
    const migratedFromOlderBuild = typeof input.showPreviewBar !== "boolean" || typeof input.thumbnailLabelMode !== "string";
    next.enabled = (_a = input.enabled) != null ? _a : next.enabled;
    next.enableCache = (_b = input.enableCache) != null ? _b : next.enableCache;
    next.showPreviewBar = (_c = input.showPreviewBar) != null ? _c : next.showPreviewBar;
    next.noticeDurationSec = clampNumber(
      Number.isFinite(input.noticeDurationSec) ? Number(input.noticeDurationSec) : next.noticeDurationSec,
      1,
      15
    );
    next.minDurationSec = clampNumber(
      Number.isFinite(input.minDurationSec) ? Number(input.minDurationSec) : next.minDurationSec,
      0,
      300
    );
    next.dynamicFilterMode = input.dynamicFilterMode === "hide" || input.dynamicFilterMode === "label" || input.dynamicFilterMode === "off" ? input.dynamicFilterMode : next.dynamicFilterMode;
    next.commentFilterMode = input.commentFilterMode === "hide" || input.commentFilterMode === "label" || input.commentFilterMode === "off" ? input.commentFilterMode : next.commentFilterMode;
    next.commentHideReplies = (_d = input.commentHideReplies) != null ? _d : next.commentHideReplies;
    if (typeof input.thumbnailLabelMode === "string" && isThumbnailLabelMode(input.thumbnailLabelMode)) {
      next.thumbnailLabelMode = input.thumbnailLabelMode;
    }
    const regexPattern = typeof input.dynamicRegexPattern === "string" && input.dynamicRegexPattern.trim().length > 0 ? input.dynamicRegexPattern.trim() : null;
    if (regexPattern && regexFromStoredPattern(regexPattern)) {
      next.dynamicRegexPattern = regexPattern;
    }
    next.dynamicRegexKeywordMinMatches = clampNumber(
      Number.isFinite(input.dynamicRegexKeywordMinMatches) ? Number(input.dynamicRegexKeywordMinMatches) : next.dynamicRegexKeywordMinMatches,
      1,
      10
    );
    if (migratedFromOlderBuild) {
      if (next.dynamicFilterMode === "hide") {
        next.dynamicFilterMode = "off";
      }
      if (next.commentFilterMode === "hide") {
        next.commentFilterMode = "off";
      }
    }
    const serverAddress = normalizeServerAddress(input.serverAddress);
    if (serverAddress) {
      next.serverAddress = serverAddress;
    }
    for (const category of CATEGORY_ORDER) {
      const value = (_e = input.categoryModes) == null ? void 0 : _e[category];
      if (value && isCategoryMode(value)) {
        next.categoryModes[category] = value;
      }
    }
    return next;
  }
  var ConfigStore = class {
    constructor() {
      __publicField(this, "config", cloneDefaultConfig());
      __publicField(this, "listeners", /* @__PURE__ */ new Set());
    }
    load() {
      return __async(this, null, function* () {
        this.config = normalizeConfig(yield gmGetValue(CONFIG_STORAGE_KEY, null));
        return this.getSnapshot();
      });
    }
    getSnapshot() {
      return __spreadProps(__spreadValues({}, this.config), {
        categoryModes: __spreadValues({}, this.config.categoryModes)
      });
    }
    subscribe(listener) {
      this.listeners.add(listener);
      return () => {
        this.listeners.delete(listener);
      };
    }
    update(updater) {
      return __async(this, null, function* () {
        this.config = normalizeConfig(updater(this.getSnapshot()));
        yield gmSetValue(CONFIG_STORAGE_KEY, this.config);
        for (const listener of this.listeners) {
          listener(this.getSnapshot());
        }
        return this.getSnapshot();
      });
    }
    reset() {
      return __async(this, null, function* () {
        yield gmSetValue(CONFIG_STORAGE_KEY, null);
        this.config = cloneDefaultConfig();
        for (const listener of this.listeners) {
          listener(this.getSnapshot());
        }
        return this.getSnapshot();
      });
    }
  };
  var StatsStore = class {
    constructor() {
      __publicField(this, "stats", __spreadValues({}, DEFAULT_STATS));
      __publicField(this, "listeners", /* @__PURE__ */ new Set());
    }
    load() {
      return __async(this, null, function* () {
        const stored = yield gmGetValue(STATS_STORAGE_KEY, null);
        this.stats = {
          skipCount: Number.isFinite(stored == null ? void 0 : stored.skipCount) ? Number(stored == null ? void 0 : stored.skipCount) : DEFAULT_STATS.skipCount,
          minutesSaved: Number.isFinite(stored == null ? void 0 : stored.minutesSaved) ? Math.max(0, Number(stored == null ? void 0 : stored.minutesSaved)) : DEFAULT_STATS.minutesSaved
        };
        return this.getSnapshot();
      });
    }
    getSnapshot() {
      return __spreadValues({}, this.stats);
    }
    subscribe(listener) {
      this.listeners.add(listener);
      return () => {
        this.listeners.delete(listener);
      };
    }
    patch(update) {
      return __async(this, null, function* () {
        var _a, _b;
        this.stats = {
          skipCount: (_a = update.skipCount) != null ? _a : this.stats.skipCount,
          minutesSaved: (_b = update.minutesSaved) != null ? _b : this.stats.minutesSaved
        };
        yield gmSetValue(STATS_STORAGE_KEY, this.stats);
        for (const listener of this.listeners) {
          listener(this.getSnapshot());
        }
        return this.getSnapshot();
      });
    }
    recordSkip(minutesSavedDelta) {
      return __async(this, null, function* () {
        return this.patch({
          skipCount: this.stats.skipCount + 1,
          minutesSaved: Math.round((this.stats.minutesSaved + minutesSavedDelta) * 100) / 100
        });
      });
    }
  };

  // src/core/cache.ts
  function estimateSize(value) {
    return JSON.stringify(value).length;
  }
  var PersistentCache = class {
    constructor() {
      __publicField(this, "payload", { entries: {} });
      __publicField(this, "loaded", false);
    }
    load() {
      return __async(this, null, function* () {
        if (this.loaded) {
          return;
        }
        const stored = yield gmGetValue(CACHE_STORAGE_KEY, null);
        this.payload = normalizePayload(stored);
        this.loaded = true;
        yield this.persist();
      });
    }
    persist() {
      return __async(this, null, function* () {
        this.cleanupExpired();
        this.evictOverflow();
        if (Object.keys(this.payload.entries).length === 0) {
          yield gmSetValue(CACHE_STORAGE_KEY, null);
          return;
        }
        yield gmSetValue(CACHE_STORAGE_KEY, this.payload);
      });
    }
    cleanupExpired() {
      const now = Date.now();
      for (const [key, entry] of Object.entries(this.payload.entries)) {
        if (entry.expiresAt <= now) {
          delete this.payload.entries[key];
        }
      }
    }
    getTotalSize() {
      return Object.values(this.payload.entries).reduce((sum, entry) => sum + entry.size, 0);
    }
    evictOverflow() {
      const sortedEntries = Object.entries(this.payload.entries).sort(
        (left, right) => left[1].updatedAt - right[1].updatedAt
      );
      let currentSize = this.getTotalSize();
      while (sortedEntries.length > CACHE_MAX_ENTRIES || currentSize > CACHE_MAX_SIZE_BYTES) {
        const oldest = sortedEntries.shift();
        if (!oldest) {
          break;
        }
        currentSize -= oldest[1].size;
        delete this.payload.entries[oldest[0]];
      }
    }
    get(key) {
      return __async(this, null, function* () {
        yield this.load();
        const entry = this.payload.entries[key];
        if (!entry) {
          return void 0;
        }
        if (entry.expiresAt <= Date.now()) {
          delete this.payload.entries[key];
          yield this.persist();
          return void 0;
        }
        return entry.value;
      });
    }
    set(key, value) {
      return __async(this, null, function* () {
        yield this.load();
        const entry = {
          value,
          expiresAt: Date.now() + CACHE_TTL_MS,
          updatedAt: Date.now(),
          size: estimateSize(value)
        };
        this.payload.entries[key] = entry;
        yield this.persist();
      });
    }
    delete(key) {
      return __async(this, null, function* () {
        yield this.load();
        delete this.payload.entries[key];
        yield this.persist();
      });
    }
    clear() {
      return __async(this, null, function* () {
        this.payload = { entries: {} };
        this.loaded = true;
        yield gmSetValue(CACHE_STORAGE_KEY, null);
      });
    }
    getStats() {
      return __async(this, null, function* () {
        yield this.load();
        return {
          entryCount: Object.keys(this.payload.entries).length,
          sizeBytes: this.getTotalSize()
        };
      });
    }
  };
  function normalizePayload(input) {
    if (!input || typeof input !== "object" || typeof input.entries !== "object" || input.entries === null) {
      return { entries: {} };
    }
    const now = Date.now();
    const entries = {};
    for (const [key, value] of Object.entries(input.entries)) {
      if (typeof value !== "object" || value === null) {
        continue;
      }
      const entry = value;
      const rawSize = entry.size;
      const size = typeof rawSize === "number" && Number.isFinite(rawSize) && rawSize > 0 ? rawSize : estimateSize(entry.value);
      if (typeof entry.updatedAt !== "number" || typeof entry.expiresAt !== "number" || entry.expiresAt <= now) {
        continue;
      }
      entries[key] = {
        value: entry.value,
        updatedAt: entry.updatedAt,
        expiresAt: entry.expiresAt,
        size
      };
    }
    return { entries };
  }

  // src/utils/hash.ts
  function sha256Hex(value) {
    return __async(this, null, function* () {
      const data = new TextEncoder().encode(value);
      const digest = yield crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(digest)).map((part) => part.toString(16).padStart(2, "0")).join("");
    });
  }
  function getHashPrefix(value, length = 4) {
    return __async(this, null, function* () {
      const digest = yield sha256Hex(value);
      return digest.slice(0, length);
    });
  }

  // src/api/sponsorblock-client.ts
  var VALID_CATEGORIES = /* @__PURE__ */ new Set([
    "sponsor",
    "selfpromo",
    "interaction",
    "intro",
    "outro",
    "preview",
    "padding",
    "music_offtopic",
    "poi_highlight",
    "exclusive_access"
  ]);
  var VALID_ACTION_TYPES = /* @__PURE__ */ new Set(["skip", "mute", "full", "poi"]);
  function buildUrl(serverAddress, path) {
    return `${serverAddress.replace(/\/+$/u, "")}${path}`;
  }
  function isSegmentRecord(value) {
    return typeof value === "object" && value !== null && typeof value.videoID === "string" && Array.isArray(value.segments);
  }
  function sanitizeSegments(value) {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((entry) => {
      var _a;
      if (typeof entry !== "object" || entry === null) {
        return false;
      }
      const candidate = entry;
      const secondPoint = (_a = candidate.segment) == null ? void 0 : _a[1];
      return typeof candidate.UUID === "string" && typeof candidate.category === "string" && VALID_CATEGORIES.has(candidate.category) && typeof candidate.actionType === "string" && VALID_ACTION_TYPES.has(candidate.actionType) && Array.isArray(candidate.segment) && (candidate.segment.length === 1 || candidate.segment.length === 2) && Number.isFinite(candidate.segment[0]) && (secondPoint === void 0 || Number.isFinite(secondPoint) && secondPoint >= candidate.segment[0]);
    });
  }
  var SponsorBlockClient = class {
    constructor(cache) {
      this.cache = cache;
      __publicField(this, "inFlightRequests", /* @__PURE__ */ new Map());
    }
    getSegments(video, config) {
      return __async(this, null, function* () {
        var _a, _b;
        const hashPrefix = yield getHashPrefix(video.bvid, 4);
        const normalizedServer = (_a = normalizeServerAddress(config.serverAddress)) != null ? _a : config.serverAddress;
        const cacheKey = `segments:${normalizedServer}:${hashPrefix}`;
        let response;
        if (config.enableCache) {
          response = yield this.cache.get(cacheKey);
        }
        if (!response) {
          response = yield this.fetchWithDedup(
            cacheKey,
            buildUrl(normalizedServer, `/api/skipSegments/${hashPrefix}`)
          );
          if (config.enableCache && (response.status === 200 || response.status === 404)) {
            yield this.cache.set(cacheKey, response);
          }
        }
        if (response.status === 404) {
          return [];
        }
        if (!response.ok) {
          throw new Error(`SponsorBlock API returned ${response.status}`);
        }
        let payload;
        try {
          payload = JSON.parse(response.responseText);
        } catch (_error) {
          throw new Error("SponsorBlock API returned invalid JSON");
        }
        if (!Array.isArray(payload)) {
          throw new Error("SponsorBlock API returned an unexpected payload shape");
        }
        const records = payload.filter(isSegmentRecord);
        const record = records.find((entry) => entry.videoID === video.bvid);
        return sanitizeSegments((_b = record == null ? void 0 : record.segments) != null ? _b : []);
      });
    }
    fetchWithDedup(cacheKey, url) {
      return __async(this, null, function* () {
        const existing = this.inFlightRequests.get(cacheKey);
        if (existing) {
          return existing;
        }
        const request = this.fetchWithRetry(url).finally(() => {
          this.inFlightRequests.delete(cacheKey);
        });
        this.inFlightRequests.set(cacheKey, request);
        return request;
      });
    }
    fetchWithRetry(url) {
      return __async(this, null, function* () {
        const attempts = 2;
        let lastError = null;
        for (let index = 0; index < attempts; index += 1) {
          try {
            const response = yield gmXmlHttpRequest({
              method: "GET",
              url,
              headers: {
                Accept: "application/json"
              },
              timeout: REQUEST_TIMEOUT_MS
            });
            if (response.ok || response.status === 404 || response.status < 500 || index === attempts - 1) {
              return response;
            }
          } catch (error) {
            lastError = error instanceof Error ? error : new Error("Unknown request error");
            if (index === attempts - 1) {
              throw lastError;
            }
          }
        }
        throw lastError != null ? lastError : new Error("Request failed");
      });
    }
  };

  // src/core/segment-filter.ts
  function normalizeSegments(segments, config, currentCid = null) {
    var _a, _b;
    const seen = /* @__PURE__ */ new Set();
    const normalized = [];
    for (const segment of segments) {
      if (seen.has(segment.UUID)) {
        continue;
      }
      seen.add(segment.UUID);
      const mode = (_a = config.categoryModes[segment.category]) != null ? _a : "off";
      if (mode === "off") {
        continue;
      }
      const start = segment.segment[0];
      const end = segment.segment.length > 1 ? (_b = segment.segment[1]) != null ? _b : null : null;
      const duration = typeof end === "number" ? Math.max(0, end - start) : null;
      const segmentCid = typeof segment.cid === "string" && segment.cid.length > 0 ? segment.cid : null;
      if (currentCid && segmentCid && segmentCid !== currentCid) {
        continue;
      }
      if (segment.actionType !== "poi" && segment.actionType !== "full" && duration !== null && duration < config.minDurationSec) {
        continue;
      }
      if (!Number.isFinite(start)) {
        continue;
      }
      normalized.push(__spreadProps(__spreadValues({}, segment), {
        start,
        end,
        duration,
        mode
      }));
    }
    return normalized.sort((left, right) => left.start - right.start);
  }

  // src/ui/notice-center.ts
  var NoticeCenter = class {
    constructor() {
      __publicField(this, "root");
      __publicField(this, "notices", /* @__PURE__ */ new Map());
      __publicField(this, "timers", /* @__PURE__ */ new Map());
      __publicField(this, "host", null);
      this.root = document.createElement("div");
      this.root.className = "bsb-tm-notice-root is-floating";
    }
    ensureAttached() {
      var _a;
      const parent = ((_a = this.host) == null ? void 0 : _a.isConnected) ? this.host : document.documentElement;
      if (this.root.parentElement !== parent) {
        parent.appendChild(this.root);
      }
      this.root.classList.toggle("is-floating", parent === document.documentElement);
    }
    setHost(host) {
      this.host = host;
      if (host) {
        host.classList.add("bsb-tm-player-host");
      }
      if (this.root.isConnected && this.notices.size > 0) {
        this.ensureAttached();
      }
    }
    show(options) {
      var _a, _b, _c;
      this.ensureAttached();
      this.dismiss(options.id);
      const notice = document.createElement("div");
      notice.className = "bsb-tm-notice";
      notice.dataset.noticeId = options.id;
      const title = document.createElement("div");
      title.className = "bsb-tm-notice-title";
      title.textContent = options.title;
      const message = document.createElement("div");
      message.className = "bsb-tm-notice-message";
      message.textContent = options.message;
      const body = document.createElement("div");
      body.className = "bsb-tm-notice-body";
      body.append(title, message);
      const actions = document.createElement("div");
      actions.className = "bsb-tm-notice-actions";
      for (const action of (_a = options.actions) != null ? _a : []) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `bsb-tm-button ${(_b = action.variant) != null ? _b : "secondary"}`;
        button.textContent = action.label;
        button.addEventListener("click", () => action.onClick());
        actions.appendChild(button);
      }
      notice.appendChild(body);
      if (actions.childElementCount > 0) {
        notice.appendChild(actions);
      }
      this.root.appendChild(notice);
      this.notices.set(options.id, notice);
      if (!options.sticky) {
        const duration = (_c = options.durationMs) != null ? _c : 4e3;
        const timerId = window.setTimeout(() => {
          this.dismiss(options.id);
        }, duration);
        this.timers.set(options.id, timerId);
      }
    }
    dismiss(id) {
      const timerId = this.timers.get(id);
      if (timerId) {
        window.clearTimeout(timerId);
        this.timers.delete(id);
      }
      const notice = this.notices.get(id);
      if (!notice) {
        return;
      }
      notice.remove();
      this.notices.delete(id);
      if (this.notices.size === 0) {
        this.root.remove();
      }
    }
    clear() {
      for (const id of [...this.notices.keys()]) {
        this.dismiss(id);
      }
    }
  };

  // src/ui/panel.ts
  var SettingsPanel = class {
    constructor(config, stats, callbacks) {
      this.callbacks = callbacks;
      __publicField(this, "backdrop", document.createElement("div"));
      __publicField(this, "panel", document.createElement("aside"));
      __publicField(this, "statsEl", document.createElement("div"));
      __publicField(this, "form", document.createElement("div"));
      __publicField(this, "filterForm", document.createElement("div"));
      __publicField(this, "categoryForm", document.createElement("div"));
      __publicField(this, "panelId", "bsb-tm-panel");
      __publicField(this, "filterValidationMessage", null);
      __publicField(this, "config");
      __publicField(this, "stats");
      __publicField(this, "fullVideoLabels", []);
      __publicField(this, "runtimeStatus", {
        kind: "idle",
        message: "\u7B49\u5F85\u9875\u9762\u5339\u914D",
        bvid: null,
        segmentCount: null
      });
      __publicField(this, "handleKeydown", (event) => {
        if (event.key === "Escape" && !this.backdrop.hidden) {
          this.close();
        }
      });
      var _a;
      this.config = config;
      this.stats = stats;
      this.backdrop.className = "bsb-tm-panel-backdrop";
      this.backdrop.hidden = true;
      this.backdrop.addEventListener("click", (event) => {
        if (event.target === this.backdrop) {
          this.close();
        }
      });
      this.panel.className = "bsb-tm-panel";
      this.panel.id = this.panelId;
      this.panel.setAttribute("role", "dialog");
      this.panel.setAttribute("aria-modal", "true");
      this.panel.setAttribute("aria-labelledby", "bsb-tm-panel-title");
      this.panel.append(
        this.createHeader(),
        this.createSection("summary"),
        this.createSection("form"),
        this.createSection("filters"),
        this.createSection("categories")
      );
      (_a = this.panel.querySelector(".bsb-tm-panel-close")) == null ? void 0 : _a.addEventListener("click", () => {
        this.close();
      });
      this.statsEl.className = "bsb-tm-stats";
      this.form.className = "bsb-tm-form";
      this.filterForm.className = "bsb-tm-form";
      this.categoryForm.className = "bsb-tm-categories";
      this.backdrop.appendChild(this.panel);
      this.render();
    }
    mount() {
      if (!this.backdrop.isConnected) {
        document.documentElement.appendChild(this.backdrop);
      }
    }
    toggle() {
      if (this.backdrop.hidden) {
        this.open();
        return;
      }
      this.close();
    }
    open() {
      this.mount();
      this.backdrop.hidden = false;
      document.documentElement.classList.add("bsb-tm-panel-open");
      document.addEventListener("keydown", this.handleKeydown);
    }
    close() {
      this.backdrop.hidden = true;
      document.documentElement.classList.remove("bsb-tm-panel-open");
      document.removeEventListener("keydown", this.handleKeydown);
    }
    unmount() {
      this.close();
      this.backdrop.remove();
    }
    updateConfig(config) {
      this.config = config;
      this.filterValidationMessage = null;
      this.render();
    }
    updateStats(stats) {
      this.stats = stats;
      this.renderSummary();
    }
    updateRuntimeStatus(status) {
      this.runtimeStatus = status;
      this.renderSummary();
    }
    setFullVideoLabels(segments) {
      this.fullVideoLabels = [...new Set(segments.map((segment) => CATEGORY_LABELS[segment.category]))];
      this.renderSummary();
    }
    render() {
      this.renderSummary();
      this.renderForm();
      this.renderFilters();
      this.renderCategories();
    }
    renderSummary() {
      var _a, _b;
      const labels = this.fullVideoLabels.length > 0 ? this.fullVideoLabels.join(" / ") : "-";
      this.statsEl.replaceChildren(
        this.createSummaryLine("\u8FD0\u884C\u72B6\u6001", this.config.enabled ? "\u5DF2\u542F\u7528" : "\u5DF2\u505C\u7528"),
        this.createSummaryLine("\u5F53\u524D\u89C6\u9891", (_a = this.runtimeStatus.bvid) != null ? _a : "-"),
        this.createSummaryLine("\u7247\u6BB5\u72B6\u6001", this.runtimeStatus.message),
        this.createSummaryLine("\u6574\u89C6\u9891\u6807\u7B7E", labels),
        this.createSummaryLine("\u7D2F\u8BA1\u8DF3\u8FC7", `${this.stats.skipCount} \u6B21`),
        this.createSummaryLine("\u8282\u7701\u65F6\u957F", `${this.stats.minutesSaved.toFixed(2)} \u5206\u949F`)
      );
      (_b = this.panel.querySelector("[data-section='summary']")) == null ? void 0 : _b.replaceChildren(
        this.createSectionHeading("\u72B6\u6001\u603B\u89C8", "\u811A\u672C\u9ED8\u8BA4\u4E0D\u6539\u52A8\u9875\u9762\u5E03\u5C40\uFF0C\u8BBE\u7F6E\u4EC5\u5728\u4F60\u4E3B\u52A8\u6253\u5F00\u65F6\u51FA\u73B0\u3002"),
        this.statsEl
      );
    }
    renderForm() {
      var _a;
      this.form.replaceChildren(
        this.createCheckbox("\u542F\u7528\u811A\u672C", "\u603B\u5F00\u5173\u3002\u5173\u95ED\u540E\u4E0D\u518D\u8BF7\u6C42\u7247\u6BB5\u3001\u6E32\u67D3\u89D2\u6807\u6216\u8FC7\u6EE4\u5185\u5BB9\u3002", this.config.enabled, (checked) => __async(this, null, function* () {
          yield this.callbacks.onPatchConfig({ enabled: checked });
        })),
        this.createCheckbox("\u542F\u7528\u7F13\u5B58", "\u7F13\u5B58 SponsorBlock \u548C\u7F29\u7565\u56FE\u6807\u7B7E\u7ED3\u679C\uFF0C\u51CF\u5C11\u91CD\u590D\u8BF7\u6C42\u3002", this.config.enableCache, (checked) => __async(this, null, function* () {
          yield this.callbacks.onPatchConfig({ enableCache: checked });
        })),
        this.createCheckbox("\u663E\u793A\u64AD\u653E\u5668\u9884\u89C8\u6761", "\u5728\u89C6\u9891\u8FDB\u5EA6\u6761\u4E0A\u53E0\u52A0\u4E0A\u6E38\u540C\u7C7B\u7684\u7247\u6BB5\u989C\u8272\u6807\u8BB0\u3002", this.config.showPreviewBar, (checked) => __async(this, null, function* () {
          yield this.callbacks.onPatchConfig({ showPreviewBar: checked });
        })),
        this.createSelect(
          "\u7F29\u7565\u56FE\u6574\u89C6\u9891\u6807\u7B7E",
          this.config.thumbnailLabelMode,
          THUMBNAIL_LABEL_MODE_LABELS,
          (value) => __async(this, null, function* () {
            yield this.callbacks.onPatchConfig({ thumbnailLabelMode: value });
          })
        ),
        this.createInput("\u670D\u52A1\u5668\u5730\u5740", "SponsorBlock API \u670D\u52A1\u5730\u5740\u3002\u901A\u5E38\u4FDD\u6301\u9ED8\u8BA4\u5373\u53EF\u3002", this.config.serverAddress, (value) => __async(this, null, function* () {
          yield this.callbacks.onPatchConfig({ serverAddress: value });
        })),
        this.createNumberInput("\u63D0\u793A\u505C\u7559\u65F6\u95F4\uFF08\u79D2\uFF09", "\u81EA\u52A8\u8DF3\u8FC7\u3001\u9519\u8BEF\u548C\u9AD8\u5149\u63D0\u793A\u7684\u505C\u7559\u65F6\u95F4\u3002", this.config.noticeDurationSec, (value) => __async(this, null, function* () {
          yield this.callbacks.onPatchConfig({ noticeDurationSec: value });
        })),
        this.createNumberInput("\u5FFD\u7565\u77ED\u7247\u6BB5\uFF08\u79D2\uFF09", "\u4F4E\u4E8E\u6B64\u957F\u5EA6\u7684\u666E\u901A\u7247\u6BB5\u4E0D\u5904\u7406\u3002", this.config.minDurationSec, (value) => __async(this, null, function* () {
          yield this.callbacks.onPatchConfig({ minDurationSec: value });
        })),
        this.createResetButton(false)
      );
      (_a = this.panel.querySelector("[data-section='form']")) == null ? void 0 : _a.replaceChildren(
        this.createSectionHeading("\u57FA\u7840\u9009\u9879", "\u4F18\u5148\u8D34\u8FD1\u539F\u63D2\u4EF6\u4F53\u9A8C\uFF0C\u4E0D\u505A\u989D\u5916\u9875\u9762\u6539\u9020\u3002"),
        this.form
      );
    }
    renderFilters() {
      var _a;
      const children = [
        this.createSectionLabel("\u52A8\u6001\u9875\u5E7F\u544A\u8FC7\u6EE4"),
        this.createSelect("\u52A8\u6001\u8FC7\u6EE4\u6A21\u5F0F", this.config.dynamicFilterMode, CONTENT_FILTER_MODE_LABELS, (value) => __async(this, null, function* () {
          yield this.callbacks.onPatchConfig({ dynamicFilterMode: value });
        })),
        this.createRegexPatternInput(),
        this.createNumberInput("\u52A8\u6001\u6700\u5C11\u547D\u4E2D\u6570", "\u4EC5\u5BF9\u7591\u4F3C\u5E7F\u544A\u8BCD\u547D\u4E2D\u8FBE\u5230\u8BE5\u6570\u91CF\u7684\u5185\u5BB9\u91C7\u53D6\u52A8\u4F5C\u3002", this.config.dynamicRegexKeywordMinMatches, (value) => __async(this, null, function* () {
          yield this.callbacks.onPatchConfig({ dynamicRegexKeywordMinMatches: value });
        })),
        this.createSectionLabel("\u8BC4\u8BBA\u533A\u5E7F\u544A\u8FC7\u6EE4"),
        this.createSelect("\u8BC4\u8BBA\u8FC7\u6EE4\u6A21\u5F0F", this.config.commentFilterMode, CONTENT_FILTER_MODE_LABELS, (value) => __async(this, null, function* () {
          yield this.callbacks.onPatchConfig({ commentFilterMode: value });
        })),
        this.createCheckbox("\u540C\u65F6\u5904\u7406\u547D\u4E2D\u8BC4\u8BBA\u7684\u56DE\u590D", "\u5F00\u542F\u540E\uFF0C\u547D\u4E2D\u4E3B\u8BC4\u8BBA\u65F6\u53EF\u540C\u6B65\u9690\u85CF\u5176\u56DE\u590D\u697C\u5C42\u3002", this.config.commentHideReplies, (checked) => __async(this, null, function* () {
          yield this.callbacks.onPatchConfig({ commentHideReplies: checked });
        })),
        this.createResetButton(true)
      ];
      if (this.filterValidationMessage) {
        children.splice(3, 0, this.createValidationMessage(this.filterValidationMessage));
      }
      this.filterForm.replaceChildren(...children);
      (_a = this.panel.querySelector("[data-section='filters']")) == null ? void 0 : _a.replaceChildren(
        this.createSectionHeading("\u52A8\u6001\u4E0E\u8BC4\u8BBA", "\u9ED8\u8BA4\u5173\u95ED\uFF0C\u907F\u514D\u8BEF\u4F24\u6B63\u5E38\u5185\u5BB9\u3002\u9700\u8981\u65F6\u518D\u5355\u72EC\u5F00\u542F\u3002"),
        this.filterForm
      );
    }
    renderCategories() {
      var _a;
      this.categoryForm.replaceChildren();
      for (const category of CATEGORY_ORDER) {
        const row = document.createElement("label");
        row.className = "bsb-tm-category-row";
        const label = document.createElement("span");
        label.textContent = CATEGORY_LABELS[category];
        const select = document.createElement("select");
        for (const mode of Object.keys(MODE_LABELS)) {
          const option = document.createElement("option");
          option.value = mode;
          option.textContent = MODE_LABELS[mode];
          option.selected = this.config.categoryModes[category] === mode;
          select.appendChild(option);
        }
        select.addEventListener("change", () => __async(this, null, function* () {
          yield this.callbacks.onCategoryModeChange(category, select.value);
        }));
        row.append(label, select);
        this.categoryForm.appendChild(row);
      }
      (_a = this.panel.querySelector("[data-section='categories']")) == null ? void 0 : _a.replaceChildren(
        this.createSectionHeading("\u5206\u7C7B\u5904\u7406", "\u6CBF\u7528\u539F\u9879\u76EE\u7684\u81EA\u52A8/\u624B\u52A8/\u4EC5\u63D0\u793A/\u5173\u95ED\u8BED\u4E49\u3002"),
        this.categoryForm
      );
    }
    createCheckbox(labelText, helpText, checked, onChange) {
      const label = document.createElement("label");
      label.className = "bsb-tm-field";
      const copy = document.createElement("div");
      copy.className = "bsb-tm-field-copy";
      const title = document.createElement("span");
      title.className = "bsb-tm-field-title";
      title.textContent = labelText;
      const help = document.createElement("small");
      help.className = "bsb-tm-field-help";
      help.textContent = helpText;
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = checked;
      input.addEventListener("change", () => __async(null, null, function* () {
        yield onChange(input.checked);
      }));
      copy.append(title, help);
      label.append(copy, input);
      return label;
    }
    createInput(labelText, helpText, value, onCommit) {
      const wrapper = document.createElement("label");
      wrapper.className = "bsb-tm-field stacked";
      wrapper.append(this.createInputLabel(labelText, helpText));
      const input = document.createElement("input");
      input.type = "text";
      input.value = value;
      input.spellcheck = false;
      input.addEventListener("change", () => __async(this, null, function* () {
        yield onCommit(input.value.trim());
      }));
      wrapper.append(input);
      return wrapper;
    }
    createRegexPatternInput() {
      const wrapper = document.createElement("label");
      wrapper.className = "bsb-tm-field stacked";
      wrapper.append(this.createInputLabel("\u52A8\u6001\u5173\u952E\u8BCD\u6B63\u5219", "\u7528\u4E8E\u8BC6\u522B\u53EF\u7591\u5E7F\u544A\u63AA\u8F9E\u3002\u4FDD\u7559\u9ED8\u8BA4\u503C\u901A\u5E38\u66F4\u7A33\u3002"));
      const input = document.createElement("input");
      input.type = "text";
      input.value = this.config.dynamicRegexPattern;
      input.spellcheck = false;
      if (this.filterValidationMessage) {
        input.setAttribute("aria-invalid", "true");
      }
      input.addEventListener("change", () => __async(this, null, function* () {
        var _a;
        const nextValue = input.value.trim();
        const validation = validateStoredPattern(nextValue);
        if (!validation.valid) {
          this.filterValidationMessage = (_a = validation.error) != null ? _a : "\u6B63\u5219\u683C\u5F0F\u65E0\u6548";
          this.renderFilters();
          return;
        }
        this.filterValidationMessage = null;
        try {
          yield this.callbacks.onPatchConfig({ dynamicRegexPattern: nextValue });
        } catch (_error) {
          this.filterValidationMessage = "\u6B63\u5219\u4FDD\u5B58\u5931\u8D25";
          this.renderFilters();
        }
      }));
      wrapper.append(input);
      return wrapper;
    }
    createSelect(labelText, value, options, onCommit) {
      const wrapper = document.createElement("label");
      wrapper.className = "bsb-tm-field stacked";
      wrapper.append(this.createInputLabel(labelText));
      const select = document.createElement("select");
      for (const [optionValue, optionLabel] of Object.entries(options)) {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionLabel;
        option.selected = optionValue === value;
        select.appendChild(option);
      }
      select.addEventListener("change", () => __async(this, null, function* () {
        yield onCommit(select.value);
      }));
      wrapper.append(select);
      return wrapper;
    }
    createNumberInput(labelText, helpText, value, onCommit) {
      const wrapper = document.createElement("label");
      wrapper.className = "bsb-tm-field stacked";
      wrapper.append(this.createInputLabel(labelText, helpText));
      const input = document.createElement("input");
      input.type = "number";
      input.value = String(value);
      input.min = "0";
      input.step = "1";
      input.addEventListener("change", () => __async(this, null, function* () {
        yield onCommit(Number(input.value));
      }));
      wrapper.append(input);
      return wrapper;
    }
    createResetButton(compact) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `bsb-tm-button danger${compact ? " compact" : ""}`;
      button.textContent = "\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E";
      button.addEventListener("click", () => __async(this, null, function* () {
        yield this.callbacks.onReset();
      }));
      return button;
    }
    createHeader() {
      const header = document.createElement("div");
      header.className = "bsb-tm-panel-header";
      const titleWrap = document.createElement("div");
      const title = document.createElement("strong");
      title.id = "bsb-tm-panel-title";
      title.textContent = SCRIPT_NAME;
      const subtitle = document.createElement("div");
      subtitle.className = "bsb-tm-panel-subtitle";
      subtitle.textContent = "\u6309\u4E0A\u6E38\u4F53\u9A8C\u505A\u8F7B\u91CF\u589E\u5F3A\uFF0C\u4E0D\u6539\u5199 B \u7AD9\u539F\u6709\u5E03\u5C40\u3002";
      titleWrap.append(title, subtitle);
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "bsb-tm-button secondary bsb-tm-panel-close";
      closeButton.textContent = "\u5173\u95ED";
      header.append(titleWrap, closeButton);
      return header;
    }
    createSection(name) {
      const section = document.createElement("section");
      section.className = "bsb-tm-panel-section";
      section.dataset.section = name;
      return section;
    }
    createSectionHeading(titleText, descriptionText) {
      const wrapper = document.createElement("div");
      wrapper.className = "bsb-tm-section-heading";
      const title = document.createElement("strong");
      title.className = "bsb-tm-section-title";
      title.textContent = titleText;
      wrapper.appendChild(title);
      if (descriptionText) {
        const description = document.createElement("p");
        description.className = "bsb-tm-section-description";
        description.textContent = descriptionText;
        wrapper.appendChild(description);
      }
      return wrapper;
    }
    createSectionLabel(text) {
      const label = document.createElement("strong");
      label.className = "bsb-tm-section-label";
      label.textContent = text;
      return label;
    }
    createInputLabel(titleText, helpText) {
      const wrapper = document.createElement("div");
      wrapper.className = "bsb-tm-input-label";
      const title = document.createElement("span");
      title.className = "bsb-tm-field-title";
      title.textContent = titleText;
      wrapper.appendChild(title);
      if (helpText) {
        const help = document.createElement("small");
        help.className = "bsb-tm-field-help";
        help.textContent = helpText;
        wrapper.appendChild(help);
      }
      return wrapper;
    }
    createSummaryLine(labelText, valueText) {
      const line = document.createElement("div");
      line.className = "bsb-tm-summary-line";
      const label = document.createElement("strong");
      label.textContent = labelText;
      const value = document.createElement("span");
      value.textContent = valueText;
      line.append(label, value);
      return line;
    }
    createValidationMessage(text) {
      const message = document.createElement("p");
      message.className = "bsb-tm-validation-message";
      message.textContent = text;
      return message;
    }
  };

  // src/ui/preview-bar.ts
  function resolvePreviewParents(video) {
    var _a, _b, _c, _d;
    const scope = (_a = video == null ? void 0 : video.closest(".bpx-player-control-wrap, .bpx-player-control-entity")) != null ? _a : document;
    const main = (_b = scope.querySelector(".bpx-player-progress")) != null ? _b : scope.querySelector(".bpx-player-progress-wrap");
    const shadow = (_d = (_c = scope.querySelector(".bpx-player-shadow-progress-area")) != null ? _c : scope.querySelector(".bpx-player-progress")) != null ? _d : scope.querySelector(".bpx-player-progress-wrap");
    if (!main || !shadow) {
      return null;
    }
    return { main, shadow };
  }
  function createContainer(id) {
    const container = document.createElement("ul");
    container.id = id;
    return container;
  }
  var PreviewBar = class {
    constructor() {
      __publicField(this, "mainContainer", createContainer("previewbar"));
      __publicField(this, "shadowContainer", createContainer("shadowPreviewbar"));
      __publicField(this, "boundVideo", null);
      __publicField(this, "boundParents", null);
      __publicField(this, "segments", []);
      __publicField(this, "enabled", true);
      __publicField(this, "handleDurationChange", () => {
        this.render();
      });
    }
    bind(video) {
      if (this.boundVideo === video) {
        if (!this.boundParents || !this.boundParents.main.isConnected || !this.boundParents.shadow.isConnected) {
          this.boundParents = resolvePreviewParents(video);
        }
        this.ensureMounted();
        this.render();
        return;
      }
      this.unbind();
      this.boundVideo = video;
      this.boundParents = resolvePreviewParents(video);
      if (!this.boundVideo) {
        return;
      }
      this.boundVideo.addEventListener("loadedmetadata", this.handleDurationChange);
      this.boundVideo.addEventListener("durationchange", this.handleDurationChange);
      this.ensureMounted();
      this.render();
    }
    setEnabled(enabled) {
      this.enabled = enabled;
      this.render();
    }
    setSegments(segments) {
      this.segments = segments.filter((segment) => segment.actionType !== "full");
      this.render();
    }
    clear() {
      this.segments = [];
      this.render();
    }
    destroy() {
      this.unbind();
      this.mainContainer.remove();
      this.shadowContainer.remove();
    }
    unbind() {
      if (this.boundVideo) {
        this.boundVideo.removeEventListener("loadedmetadata", this.handleDurationChange);
        this.boundVideo.removeEventListener("durationchange", this.handleDurationChange);
      }
      this.boundVideo = null;
      this.boundParents = null;
    }
    ensureMounted() {
      if (!this.boundParents) {
        return;
      }
      if (getComputedStyle(this.boundParents.main).position === "static") {
        this.boundParents.main.style.position = "relative";
      }
      if (getComputedStyle(this.boundParents.shadow).position === "static") {
        this.boundParents.shadow.style.position = "relative";
      }
      if (this.mainContainer.parentElement !== this.boundParents.main) {
        this.boundParents.main.prepend(this.mainContainer);
      }
      if (this.shadowContainer.parentElement !== this.boundParents.shadow) {
        this.boundParents.shadow.prepend(this.shadowContainer);
      }
    }
    render() {
      this.mainContainer.replaceChildren();
      this.shadowContainer.replaceChildren();
      if (!this.enabled || !this.boundVideo || !this.boundParents) {
        return;
      }
      this.ensureMounted();
      const duration = Number.isFinite(this.boundVideo.duration) ? this.boundVideo.duration : 0;
      if (duration <= 0) {
        return;
      }
      const segments = [...this.segments].sort((left, right) => {
        var _a, _b;
        const leftDuration = ((_a = left.end) != null ? _a : left.start) - left.start;
        const rightDuration = ((_b = right.end) != null ? _b : right.start) - right.start;
        return rightDuration - leftDuration;
      });
      for (const segment of segments) {
        const bar = this.createBar(segment, duration);
        if (!bar) {
          continue;
        }
        this.mainContainer.appendChild(bar);
        this.shadowContainer.appendChild(bar.cloneNode(true));
      }
    }
    createBar(segment, duration) {
      var _a;
      const start = Math.max(0, Math.min(duration, segment.start));
      const end = segment.actionType === "poi" ? Math.min(duration, start + Math.max(0.6, duration * 25e-4)) : Math.max(start, Math.min(duration, (_a = segment.end) != null ? _a : start));
      if (end <= start) {
        return null;
      }
      const bar = document.createElement("li");
      bar.className = "previewbar";
      bar.dataset.category = segment.category;
      bar.dataset.actionType = segment.actionType;
      bar.style.left = `${start / duration * 100}%`;
      bar.style.right = `${100 - end / duration * 100}%`;
      bar.style.backgroundColor = CATEGORY_COLORS[segment.category];
      bar.style.opacity = segment.actionType === "poi" ? "0.9" : "0.7";
      return bar;
    }
  };

  // src/utils/mutation.ts
  function asRelevantElement(node) {
    if (!node) {
      return null;
    }
    if (node instanceof Element) {
      return node;
    }
    return node.parentElement;
  }
  function matchesDeep(element, selectors) {
    return selectors.some((selector) => element.matches(selector) || element.querySelector(selector));
  }
  function isIgnored(element, selectors) {
    return selectors.some((selector) => element.matches(selector) || element.closest(selector));
  }
  function nodeListTouchesSelectors(nodes, relevantSelectors, ignoredSelectors) {
    for (const node of Array.from(nodes)) {
      const element = asRelevantElement(node);
      if (!element || isIgnored(element, ignoredSelectors)) {
        continue;
      }
      if (matchesDeep(element, relevantSelectors)) {
        return true;
      }
    }
    return false;
  }
  function mutationsTouchSelectors(records, relevantSelectors, ignoredSelectors = []) {
    return records.some(
      (record) => nodeListTouchesSelectors(record.addedNodes, relevantSelectors, ignoredSelectors) || nodeListTouchesSelectors(record.removedNodes, relevantSelectors, ignoredSelectors)
    );
  }

  // src/utils/bvid.ts
  var XOR_CODE = BigInt("23442827791579");
  var MASK_CODE = BigInt("2251799813685247");
  var MAX_AVID = BigInt(1) << BigInt(51);
  var BASE = BigInt(58);
  var ALPHABET = "FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf";
  var BVID_REGEX = /^BV1[a-zA-Z0-9]{9}$/u;
  function isBvid(value) {
    return typeof value === "string" && BVID_REGEX.test(value);
  }
  function avidToBvid(avid) {
    const parsedAvid = typeof avid === "string" ? Number.parseInt(avid.replace(/^av/iu, ""), 10) : Number.isFinite(avid) ? avid : Number.NaN;
    if (!Number.isInteger(parsedAvid) || parsedAvid <= 0) {
      return null;
    }
    const buffer = ["B", "V", "1", "0", "0", "0", "0", "0", "0", "0", "0", "0"];
    let index = buffer.length - 1;
    let value = (MAX_AVID | BigInt(parsedAvid)) ^ XOR_CODE;
    while (value > BigInt(0) && index >= 0) {
      buffer[index] = ALPHABET[Number(value % BASE)];
      value /= BASE;
      index -= 1;
    }
    [buffer[3], buffer[9]] = [buffer[9], buffer[3]];
    [buffer[4], buffer[7]] = [buffer[7], buffer[4]];
    const bvid = buffer.join("");
    return isBvid(bvid) ? bvid : null;
  }

  // src/utils/video-context.ts
  function asRecord(value) {
    return typeof value === "object" && value !== null ? value : null;
  }
  function readString(value) {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
  }
  function readIdentifier(value) {
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
    return null;
  }
  function readNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }
  function readAid(value) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return Math.floor(value);
    }
    if (typeof value === "string") {
      const normalized = value.replace(/^av/iu, "");
      const parsed = Number.parseInt(normalized, 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
    return null;
  }
  function readBvid(value) {
    const bvid = readString(value);
    return bvid && isBvid(bvid) ? bvid : null;
  }
  function firstNonNull(...values) {
    for (const value of values) {
      if (value !== null) {
        return value;
      }
    }
    return null;
  }
  function resolvePages(initialState) {
    var _a;
    const videoData = asRecord(initialState == null ? void 0 : initialState.videoData);
    const videoInfo = asRecord(initialState == null ? void 0 : initialState.videoInfo);
    const rawPages = (_a = videoData == null ? void 0 : videoData.pages) != null ? _a : videoInfo == null ? void 0 : videoInfo.pages;
    if (!Array.isArray(rawPages)) {
      return [];
    }
    return rawPages.map((entry) => asRecord(entry)).filter((entry) => Boolean(entry));
  }
  function parseUrl(url) {
    try {
      return new URL(url, window.location.origin);
    } catch (_error) {
      return null;
    }
  }
  function extractBvidFromUrl(url) {
    const parsed = parseUrl(url);
    if (!parsed) {
      return null;
    }
    const pathMatch = parsed.pathname.match(/BV1[a-zA-Z0-9]{9}/u);
    if ((pathMatch == null ? void 0 : pathMatch[0]) && isBvid(pathMatch[0])) {
      return pathMatch[0];
    }
    const searchParam = parsed.searchParams.get("bvid");
    return readBvid(searchParam);
  }
  function extractAidFromUrl(url) {
    const parsed = parseUrl(url);
    if (!parsed) {
      return null;
    }
    const pathMatch = parsed.pathname.match(/(?:^|\/)av(\d+)(?:\/|$)/iu);
    if (pathMatch == null ? void 0 : pathMatch[1]) {
      return readAid(pathMatch[1]);
    }
    return firstNonNull(readAid(parsed.searchParams.get("aid")), readAid(parsed.searchParams.get("avid")));
  }
  function extractPageFromUrl(url) {
    var _a;
    const parsed = parseUrl(url);
    if (!parsed) {
      return 1;
    }
    const rawPage = Number((_a = parsed.searchParams.get("p")) != null ? _a : "1");
    return Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  }
  function extractCidFromUrl(url) {
    const parsed = parseUrl(url);
    if (!parsed) {
      return null;
    }
    return readIdentifier(parsed.searchParams.get("cid"));
  }
  function resolveCidFromPages(initialState, page) {
    for (const entry of resolvePages(initialState)) {
      const pageNumber = readNumber(entry.page);
      const cid = readIdentifier(entry.cid);
      if (pageNumber === page && cid) {
        return cid;
      }
    }
    return null;
  }
  function resolveTitle(initialState) {
    var _a, _b, _c, _d, _e;
    return firstNonNull(
      readString(initialState == null ? void 0 : initialState.h1Title),
      readString((_a = asRecord(initialState == null ? void 0 : initialState.videoData)) == null ? void 0 : _a.title),
      readString((_b = asRecord(initialState == null ? void 0 : initialState.videoInfo)) == null ? void 0 : _b.title),
      readString((_c = asRecord(initialState == null ? void 0 : initialState.epInfo)) == null ? void 0 : _c.title),
      readString((_d = asRecord(initialState == null ? void 0 : initialState.epInfo)) == null ? void 0 : _d.longTitle),
      readString((_e = asRecord(initialState == null ? void 0 : initialState.mediaInfo)) == null ? void 0 : _e.title)
    );
  }
  function resolvePage(snapshot, initialState) {
    var _a, _b, _c;
    const fromUrl = extractPageFromUrl(snapshot.url);
    if (fromUrl > 1) {
      return fromUrl;
    }
    return firstNonNull(
      readNumber((_a = snapshot.playerManifest) == null ? void 0 : _a.p),
      readNumber((_b = asRecord(initialState == null ? void 0 : initialState.videoData)) == null ? void 0 : _b.p),
      readNumber((_c = asRecord(initialState == null ? void 0 : initialState.videoInfo)) == null ? void 0 : _c.p),
      1
    );
  }
  function resolveBvid(snapshot, initialState) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    const directBvid = firstNonNull(
      readBvid(initialState == null ? void 0 : initialState.bvid),
      readBvid((_a = asRecord(initialState == null ? void 0 : initialState.videoData)) == null ? void 0 : _a.bvid),
      readBvid((_b = asRecord(initialState == null ? void 0 : initialState.videoInfo)) == null ? void 0 : _b.bvid),
      readBvid((_c = asRecord(initialState == null ? void 0 : initialState.epInfo)) == null ? void 0 : _c.bvid),
      readBvid((_d = snapshot.playerManifest) == null ? void 0 : _d.bvid),
      extractBvidFromUrl(snapshot.url)
    );
    if (directBvid) {
      return directBvid;
    }
    const aid = firstNonNull(
      readAid(initialState == null ? void 0 : initialState.aid),
      readAid((_e = asRecord(initialState == null ? void 0 : initialState.videoData)) == null ? void 0 : _e.aid),
      readAid((_f = asRecord(initialState == null ? void 0 : initialState.videoInfo)) == null ? void 0 : _f.aid),
      readAid((_g = asRecord(initialState == null ? void 0 : initialState.epInfo)) == null ? void 0 : _g.aid),
      readAid((_h = snapshot.playerManifest) == null ? void 0 : _h.aid),
      readAid((_i = asRecord(snapshot.playInfo)) == null ? void 0 : _i.aid),
      readAid((_k = asRecord((_j = asRecord(snapshot.playInfo)) == null ? void 0 : _j.data)) == null ? void 0 : _k.aid),
      extractAidFromUrl(snapshot.url)
    );
    return aid ? avidToBvid(aid) : null;
  }
  function resolveCid(snapshot, initialState, page) {
    var _a, _b, _c, _d;
    return firstNonNull(
      readIdentifier(initialState == null ? void 0 : initialState.cid),
      readIdentifier((_a = asRecord(initialState == null ? void 0 : initialState.videoData)) == null ? void 0 : _a.cid),
      readIdentifier((_b = asRecord(initialState == null ? void 0 : initialState.videoInfo)) == null ? void 0 : _b.cid),
      readIdentifier((_c = asRecord(initialState == null ? void 0 : initialState.epInfo)) == null ? void 0 : _c.cid),
      readIdentifier((_d = snapshot.playerManifest) == null ? void 0 : _d.cid),
      extractCidFromUrl(snapshot.url),
      resolveCidFromPages(initialState, page)
    );
  }
  function resolveVideoContext(snapshot) {
    if (!snapshot) {
      return null;
    }
    const initialState = asRecord(snapshot.initialState);
    const page = resolvePage(snapshot, initialState);
    const bvid = resolveBvid(snapshot, initialState);
    if (!bvid) {
      return null;
    }
    return {
      bvid,
      cid: resolveCid(snapshot, initialState, page),
      page,
      title: resolveTitle(initialState),
      href: snapshot.url
    };
  }

  // src/utils/page.ts
  var SUPPORTED_HOSTS = /* @__PURE__ */ new Set([
    "www.bilibili.com",
    "search.bilibili.com",
    "t.bilibili.com",
    "space.bilibili.com"
  ]);
  function detectPageType(url) {
    try {
      const parsed = new URL(url);
      if (!SUPPORTED_HOSTS.has(parsed.hostname)) {
        return "unsupported";
      }
      if (parsed.hostname === "search.bilibili.com") {
        return "search";
      }
      if (parsed.hostname === "t.bilibili.com") {
        return "dynamic";
      }
      if (parsed.hostname === "space.bilibili.com") {
        return "channel";
      }
      if (parsed.pathname.startsWith("/account/history")) {
        return "history";
      }
      if (parsed.pathname.startsWith("/video/")) {
        return "video";
      }
      if (parsed.pathname.startsWith("/list/") || parsed.pathname.startsWith("/medialist/play/")) {
        return "list";
      }
      if (parsed.pathname.startsWith("/festival/")) {
        return "festival";
      }
      if (parsed.pathname.startsWith("/bangumi/")) {
        return "anime";
      }
      if (parsed.pathname.startsWith("/opus/")) {
        return "opus";
      }
      return "main";
    } catch (_error) {
      return "unknown";
    }
  }
  function isSupportedLocation(url) {
    const pageType = detectPageType(url);
    return pageType !== "unknown" && pageType !== "unsupported";
  }
  function supportsVideoFeatures(url) {
    const pageType = detectPageType(url);
    return pageType === "video" || pageType === "list" || pageType === "festival" || pageType === "anime" || pageType === "opus" || extractBvidFromUrl(url) !== null || extractAidFromUrl(url) !== null;
  }
  function supportsDynamicFilters(url) {
    const pageType = detectPageType(url);
    return pageType === "main" || pageType === "dynamic" || pageType === "channel";
  }
  function supportsCommentFilters(url) {
    const pageType = detectPageType(url);
    return pageType === "video" || pageType === "list" || pageType === "festival" || pageType === "anime" || pageType === "opus" || pageType === "dynamic" || pageType === "channel";
  }

  // src/utils/dom.ts
  var PLAYER_HOST_SELECTORS = [
    "#bilibili-player",
    ".bpx-player-container",
    ".bpx-player-video-area",
    ".player-container",
    ".bili-video-player"
  ];
  function findVideoElement() {
    return document.querySelector("video");
  }
  function resolvePlayerHost(video) {
    var _a;
    for (const selector of PLAYER_HOST_SELECTORS) {
      const found = video.closest(selector);
      if (found) {
        return found;
      }
    }
    return (_a = video.parentElement) != null ? _a : video;
  }
  function formatSegmentTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(total / 60).toString().padStart(2, "0");
    const secs = (total % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }
  function formatDurationLabel(start, end) {
    if (end === null) {
      return formatSegmentTime(start);
    }
    return `${formatSegmentTime(start)} - ${formatSegmentTime(end)}`;
  }
  function debugLog(message, ...extra) {
    console.debug(`[${SCRIPT_NAME}] ${message}`, ...extra);
  }

  // src/utils/navigation.ts
  var listeners = /* @__PURE__ */ new Set();
  var originalHistoryMethods = /* @__PURE__ */ new Map();
  var currentHref = window.location.href;
  var fallbackIntervalId = null;
  var navigationListener = null;
  function emitUrlChange() {
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
  function patchHistoryMethod(name) {
    if (originalHistoryMethods.has(name)) {
      return;
    }
    const original = history[name];
    originalHistoryMethods.set(name, original);
    history[name] = function patchedHistoryMethod(...args) {
      const result = original.apply(this, args);
      queueMicrotask(() => {
        emitUrlChange();
      });
      return result;
    };
  }
  function restoreHistoryMethods() {
    for (const [name, original] of originalHistoryMethods) {
      history[name] = original;
    }
    originalHistoryMethods.clear();
  }
  function ensureStarted() {
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
      window.navigation.addEventListener("navigate", navigationListener);
    }
    fallbackIntervalId = window.setInterval(() => {
      emitUrlChange();
    }, 1200);
  }
  function maybeStop() {
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
      window.navigation.removeEventListener("navigate", navigationListener);
      navigationListener = null;
    }
    restoreHistoryMethods();
  }
  function observeUrlChanges(listener) {
    listeners.add(listener);
    ensureStarted();
    return () => {
      listeners.delete(listener);
      maybeStop();
    };
  }

  // src/core/controller.ts
  var VIDEO_RELEVANT_SELECTORS = [
    "video",
    "#bilibili-player",
    "#playerWrap",
    ".bpx-player-container",
    ".bpx-player-video-wrap",
    ".bilibili-player",
    ".video-container",
    ".player-container"
  ];
  var VIDEO_IGNORED_SELECTORS = [
    ".bsb-tm-panel",
    ".bsb-tm-entry-button",
    ".bsb-tm-banner",
    ".bsb-tm-notice-root",
    ".bsb-tm-notice"
  ];
  var ScriptController = class {
    constructor(configStore, statsStore, cache) {
      this.configStore = configStore;
      this.statsStore = statsStore;
      this.cache = cache;
      __publicField(this, "started", false);
      __publicField(this, "currentConfig");
      __publicField(this, "currentStats");
      __publicField(this, "segmentStates", /* @__PURE__ */ new Map());
      __publicField(this, "notices", new NoticeCenter());
      __publicField(this, "client");
      __publicField(this, "panel");
      __publicField(this, "previewBar", new PreviewBar());
      __publicField(this, "tickIntervalId", null);
      __publicField(this, "domObserver", null);
      __publicField(this, "stopObservingUrl", null);
      __publicField(this, "currentContext", null);
      __publicField(this, "currentVideo", null);
      __publicField(this, "currentSignature", "");
      __publicField(this, "currentSegments", []);
      __publicField(this, "activeMuteOwners", /* @__PURE__ */ new Set());
      __publicField(this, "previousMutedState", false);
      __publicField(this, "refreshing", false);
      __publicField(this, "refreshScheduled", false);
      __publicField(this, "refreshTimerId", null);
      __publicField(this, "pendingRefresh", false);
      __publicField(this, "pendingForceFetch", false);
      __publicField(this, "pendingVisibleRefresh", false);
      __publicField(this, "lastTickTime", null);
      __publicField(this, "lastAnnouncedSignature", "");
      __publicField(this, "handleVisibilityChange", () => {
        if (!document.hidden && this.pendingVisibleRefresh) {
          this.pendingVisibleRefresh = false;
          const nextForceFetch = this.pendingForceFetch;
          this.pendingForceFetch = false;
          this.scheduleRefresh(nextForceFetch);
        }
      });
      this.currentConfig = this.configStore.getSnapshot();
      this.currentStats = this.statsStore.getSnapshot();
      this.client = new SponsorBlockClient(this.cache);
      this.panel = new SettingsPanel(this.currentConfig, this.currentStats, {
        onPatchConfig: (patch) => __async(this, null, function* () {
          yield this.configStore.update((config) => {
            var _a;
            return __spreadProps(__spreadValues(__spreadValues({}, config), patch), {
              categoryModes: __spreadValues(__spreadValues({}, config.categoryModes), (_a = patch.categoryModes) != null ? _a : {})
            });
          });
        }),
        onCategoryModeChange: (category, mode) => __async(this, null, function* () {
          yield this.configStore.update((config) => __spreadProps(__spreadValues({}, config), {
            categoryModes: __spreadProps(__spreadValues({}, config.categoryModes), {
              [category]: mode
            })
          }));
        }),
        onReset: () => __async(this, null, function* () {
          yield this.configStore.reset();
        })
      });
      this.configStore.subscribe((config) => {
        this.currentConfig = config;
        this.panel.updateConfig(config);
        this.previewBar.setEnabled(config.enabled && config.showPreviewBar);
        if (!config.enabled) {
          this.notices.clear();
          this.restoreMuteState();
        }
        this.scheduleRefresh(true);
      });
      this.statsStore.subscribe((stats) => {
        this.currentStats = stats;
        this.panel.updateStats(stats);
      });
    }
    start() {
      return __async(this, null, function* () {
        if (this.started) {
          return;
        }
        this.started = true;
        yield this.cache.load();
        this.previewBar.setEnabled(this.currentConfig.enabled && this.currentConfig.showPreviewBar);
        this.updateRuntimeStatus(this.buildIdleStatus());
        yield this.refreshCurrentVideo(true);
        this.stopObservingUrl = observeUrlChanges(() => {
          this.scheduleRefresh(true);
        });
        this.tickIntervalId = window.setInterval(() => {
          this.tick();
        }, TICK_INTERVAL_MS);
        this.domObserver = new MutationObserver((records) => {
          if (!mutationsTouchSelectors(records, VIDEO_RELEVANT_SELECTORS, VIDEO_IGNORED_SELECTORS)) {
            return;
          }
          this.scheduleRefresh();
        });
        this.domObserver.observe(document.documentElement, {
          childList: true,
          subtree: true
        });
        document.addEventListener("visibilitychange", this.handleVisibilityChange);
        window.addEventListener(
          "pagehide",
          () => {
            this.stop();
          },
          { once: true }
        );
      });
    }
    togglePanel() {
      this.panel.toggle();
    }
    openPanel() {
      this.panel.open();
    }
    clearCache() {
      return __async(this, null, function* () {
        yield this.cache.clear();
        this.notices.show({
          id: "bsb-cache-cleared",
          title: "\u7F13\u5B58\u5DF2\u6E05\u7406",
          message: "\u4E0B\u6B21\u8FDB\u5165\u89C6\u9891\u65F6\u4F1A\u91CD\u65B0\u8BF7\u6C42\u7247\u6BB5\u6570\u636E\u3002",
          durationMs: 2800
        });
        yield this.refreshCurrentVideo(true);
      });
    }
    stop() {
      var _a;
      if (!this.started) {
        return;
      }
      this.started = false;
      if (this.stopObservingUrl) {
        this.stopObservingUrl();
        this.stopObservingUrl = null;
      }
      if (this.tickIntervalId !== null) {
        window.clearInterval(this.tickIntervalId);
        this.tickIntervalId = null;
      }
      if (this.refreshTimerId !== null) {
        window.clearTimeout(this.refreshTimerId);
        this.refreshTimerId = null;
      }
      this.refreshScheduled = false;
      this.pendingRefresh = false;
      this.pendingForceFetch = false;
      this.pendingVisibleRefresh = false;
      this.lastTickTime = null;
      (_a = this.domObserver) == null ? void 0 : _a.disconnect();
      this.domObserver = null;
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
      this.clearRuntimeState(true);
    }
    scheduleRefresh(forceFetch = false) {
      this.pendingForceFetch = this.pendingForceFetch || forceFetch;
      if (document.hidden) {
        this.pendingVisibleRefresh = true;
        return;
      }
      if (this.refreshScheduled) {
        return;
      }
      this.refreshScheduled = true;
      this.refreshTimerId = window.setTimeout(() => {
        this.refreshScheduled = false;
        this.refreshTimerId = null;
        const nextForceFetch = this.pendingForceFetch;
        this.pendingForceFetch = false;
        void this.refreshCurrentVideo(nextForceFetch);
      }, 120);
    }
    refreshCurrentVideo(forceFetch = false) {
      return __async(this, null, function* () {
        var _a, _b, _c, _d, _e, _f;
        let resolvedContext = null;
        if (this.refreshing) {
          this.pendingRefresh = true;
          this.pendingForceFetch = this.pendingForceFetch || forceFetch;
          return;
        }
        this.refreshing = true;
        try {
          if (!supportsVideoFeatures(window.location.href)) {
            this.clearRuntimeState();
            return;
          }
          const snapshot = (_a = yield requestPageSnapshot()) != null ? _a : {
            url: window.location.href,
            initialState: null,
            playerManifest: null,
            playInfo: null
          };
          const context = resolveVideoContext(snapshot);
          resolvedContext = context;
          const video = findVideoElement();
          if (!context || !video) {
            this.updateRuntimeStatus({
              kind: "pending",
              message: "\u7B49\u5F85\u64AD\u653E\u5668\u548C\u9875\u9762\u4FE1\u606F",
              bvid: (_b = context == null ? void 0 : context.bvid) != null ? _b : null,
              segmentCount: null
            });
            if (video && supportsVideoFeatures(window.location.href)) {
              this.notices.show({
                id: "bsb-context-pending",
                title: "\u7B49\u5F85\u9875\u9762\u4FE1\u606F",
                message: "\u6682\u65F6\u65E0\u6CD5\u8BC6\u522B\u5F53\u524D\u89C6\u9891\uFF0C\u811A\u672C\u4F1A\u7EE7\u7EED\u81EA\u52A8\u91CD\u8BD5\u3002",
                durationMs: 2600
              });
            }
            this.clearRuntimeState();
            return;
          }
          const signature = `${context.bvid}+${(_c = context.cid) != null ? _c : ""}`;
          if (!forceFetch && signature === this.currentSignature && this.currentVideo === video) {
            const playerHost2 = resolvePlayerHost(video);
            this.notices.setHost(playerHost2);
            this.previewBar.bind(video);
            this.previewBar.setEnabled(this.currentConfig.enabled && this.currentConfig.showPreviewBar);
            if (this.currentSegments.length > 0) {
              this.previewBar.setSegments(this.currentSegments);
            }
            return;
          }
          this.clearRuntimeState();
          this.currentContext = context;
          this.currentVideo = video;
          this.currentSignature = signature;
          const playerHost = resolvePlayerHost(video);
          this.notices.setHost(playerHost);
          this.previewBar.bind(video);
          this.previewBar.setEnabled(this.currentConfig.enabled && this.currentConfig.showPreviewBar);
          if (!this.currentConfig.enabled) {
            this.updateRuntimeStatus({
              kind: "idle",
              message: "\u811A\u672C\u5DF2\u505C\u7528",
              bvid: context.bvid,
              segmentCount: null
            });
            return;
          }
          this.updateRuntimeStatus({
            kind: "pending",
            message: "\u6B63\u5728\u52A0\u8F7D SponsorBlock \u7247\u6BB5",
            bvid: context.bvid,
            segmentCount: null
          });
          const segments = yield this.client.getSegments(context, this.currentConfig);
          this.currentSegments = normalizeSegments(segments, this.currentConfig, context.cid);
          this.panel.setFullVideoLabels(this.currentSegments.filter((segment) => segment.actionType === "full"));
          this.previewBar.setSegments(this.currentSegments);
          if (this.currentSegments.length > 0) {
            this.updateRuntimeStatus({
              kind: "loaded",
              message: `\u5DF2\u52A0\u8F7D ${this.currentSegments.length} \u4E2A\u53EF\u5904\u7406\u7247\u6BB5`,
              bvid: context.bvid,
              segmentCount: this.currentSegments.length
            });
            if (this.lastAnnouncedSignature !== signature) {
              this.lastAnnouncedSignature = signature;
              this.notices.show({
                id: `segments-ready:${signature}`,
                title: "SponsorBlock \u5DF2\u5C31\u7EEA",
                message: `\u5F53\u524D\u89C6\u9891\u5DF2\u8F7D\u5165 ${this.currentSegments.length} \u4E2A\u53EF\u5904\u7406\u7247\u6BB5\u3002`,
                durationMs: 2400
              });
            }
          } else if (segments.length > 0) {
            this.updateRuntimeStatus({
              kind: "empty",
              message: `\u5DF2\u8BFB\u53D6 ${segments.length} \u4E2A\u7247\u6BB5\uFF0C\u4F46\u5F53\u524D\u8BBE\u7F6E\u672A\u542F\u7528\u5BF9\u5E94\u5206\u7C7B`,
              bvid: context.bvid,
              segmentCount: 0
            });
          } else {
            this.updateRuntimeStatus({
              kind: "empty",
              message: "\u5F53\u524D\u89C6\u9891\u6682\u65E0 SponsorBlock \u6570\u636E",
              bvid: context.bvid,
              segmentCount: 0
            });
          }
          debugLog("Loaded segments", {
            signature,
            count: this.currentSegments.length
          });
        } catch (error) {
          debugLog("Failed to refresh video context", error);
          this.updateRuntimeStatus({
            kind: "error",
            message: error instanceof Error ? `\u7247\u6BB5\u8BFB\u53D6\u5931\u8D25\uFF1A${error.message}` : "\u7247\u6BB5\u8BFB\u53D6\u5931\u8D25",
            bvid: (_f = (_e = resolvedContext == null ? void 0 : resolvedContext.bvid) != null ? _e : (_d = this.currentContext) == null ? void 0 : _d.bvid) != null ? _f : null,
            segmentCount: null
          });
          this.notices.show({
            id: "bsb-fetch-error",
            title: "\u7247\u6BB5\u8BFB\u53D6\u5931\u8D25",
            message: error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF",
            durationMs: 4e3
          });
        } finally {
          this.refreshing = false;
          if (this.pendingRefresh) {
            const nextForceFetch = this.pendingForceFetch;
            this.pendingRefresh = false;
            this.pendingForceFetch = false;
            this.scheduleRefresh(nextForceFetch);
          }
        }
      });
    }
    tick() {
      if (!this.currentConfig.enabled || !this.currentVideo || !this.currentContext || this.currentSegments.length === 0) {
        return;
      }
      if (this.currentConfig.showPreviewBar) {
        this.previewBar.bind(this.currentVideo);
        this.previewBar.setSegments(this.currentSegments);
      }
      const currentTime = this.currentVideo.currentTime;
      if (this.lastTickTime !== null && currentTime === this.lastTickTime && this.currentVideo.paused && !this.currentVideo.seeking) {
        return;
      }
      this.lastTickTime = currentTime;
      for (const segment of this.currentSegments) {
        if (segment.actionType === "full") {
          continue;
        }
        const state = this.getSegmentState(segment.UUID);
        if (this.shouldResetSegmentState(currentTime, state)) {
          this.resetSegmentState(segment.UUID, state);
        }
        this.processSegment(segment, currentTime);
        state.lastObservedTime = currentTime;
      }
    }
    processSegment(segment, currentTime) {
      const state = this.getSegmentState(segment.UUID);
      const resetThreshold = segment.start - SEGMENT_REWIND_RESET_SEC;
      if (currentTime < resetThreshold) {
        this.dismissSegmentNotice(segment);
        if (state.mutedByScript) {
          this.deactivateMute(segment.UUID);
          state.mutedByScript = false;
        }
        state.actionConsumed = false;
        state.noticeShown = false;
        state.suppressedUntilExit = false;
        state.poiShown = false;
        return;
      }
      if (segment.actionType === "poi") {
        this.processPoiSegment(segment, currentTime, state);
        return;
      }
      if (segment.end === null) {
        return;
      }
      const active = currentTime >= segment.start && currentTime < segment.end;
      if (!active) {
        if (currentTime >= segment.end) {
          this.dismissSegmentNotice(segment);
          state.noticeShown = true;
          state.suppressedUntilExit = false;
          if (state.mutedByScript) {
            this.deactivateMute(segment.UUID);
            state.mutedByScript = false;
            state.actionConsumed = true;
          }
        }
        return;
      }
      if (segment.actionType === "mute") {
        this.processMuteSegment(segment, state);
        return;
      }
      this.processSkipSegment(segment, state);
    }
    processSkipSegment(segment, state) {
      if (segment.mode === "auto") {
        if (!state.actionConsumed && !state.suppressedUntilExit) {
          this.performSkip(segment, "\u81EA\u52A8\u8DF3\u8FC7");
          state.actionConsumed = true;
          state.noticeShown = true;
          state.suppressedUntilExit = true;
        }
        return;
      }
      if (segment.mode === "manual" && !state.noticeShown) {
        state.noticeShown = true;
        this.notices.show({
          id: this.noticeIdForSegment(segment),
          title: `${CATEGORY_LABELS[segment.category]}\u7247\u6BB5`,
          message: `\u5F53\u524D\u7247\u6BB5 ${formatDurationLabel(segment.start, segment.end)}\uFF0C\u53EF\u624B\u52A8\u8DF3\u8FC7\u3002`,
          sticky: true,
          actions: [
            {
              label: "\u8DF3\u8FC7",
              variant: "primary",
              onClick: () => {
                this.performSkip(segment, "\u624B\u52A8\u8DF3\u8FC7");
                state.actionConsumed = true;
                state.suppressedUntilExit = true;
              }
            }
          ]
        });
        return;
      }
      if (segment.mode === "notice" && !state.noticeShown) {
        state.noticeShown = true;
        this.notices.show({
          id: this.noticeIdForSegment(segment),
          title: `${CATEGORY_LABELS[segment.category]}\u7247\u6BB5`,
          message: `\u5F53\u524D\u7247\u6BB5 ${formatDurationLabel(segment.start, segment.end)}\u3002`,
          sticky: true
        });
      }
    }
    processMuteSegment(segment, state) {
      if (segment.mode === "auto") {
        if (!state.mutedByScript && !state.suppressedUntilExit) {
          this.activateMute(segment.UUID);
          state.mutedByScript = true;
          state.actionConsumed = true;
          this.notices.show({
            id: this.noticeIdForSegment(segment),
            title: `${CATEGORY_LABELS[segment.category]}\u7247\u6BB5`,
            message: `\u5DF2\u81EA\u52A8\u9759\u97F3\uFF0C\u8303\u56F4 ${formatDurationLabel(segment.start, segment.end)}\u3002`,
            sticky: true,
            actions: [
              {
                label: "\u6062\u590D\u58F0\u97F3",
                variant: "secondary",
                onClick: () => {
                  this.deactivateMute(segment.UUID);
                  state.mutedByScript = false;
                  state.suppressedUntilExit = true;
                }
              }
            ]
          });
        }
        return;
      }
      if (segment.mode === "manual" && !state.noticeShown) {
        state.noticeShown = true;
        this.notices.show({
          id: this.noticeIdForSegment(segment),
          title: `${CATEGORY_LABELS[segment.category]}\u7247\u6BB5`,
          message: `\u5F53\u524D\u7247\u6BB5 ${formatDurationLabel(segment.start, segment.end)}\uFF0C\u53EF\u624B\u52A8\u9759\u97F3\u3002`,
          sticky: true,
          actions: [
            {
              label: "\u9759\u97F3\u6B64\u6BB5",
              variant: "primary",
              onClick: () => {
                this.activateMute(segment.UUID);
                state.mutedByScript = true;
                state.actionConsumed = true;
              }
            }
          ]
        });
        return;
      }
      if (segment.mode === "notice" && !state.noticeShown) {
        state.noticeShown = true;
        this.notices.show({
          id: this.noticeIdForSegment(segment),
          title: `${CATEGORY_LABELS[segment.category]}\u7247\u6BB5`,
          message: `\u5F53\u524D\u7247\u6BB5 ${formatDurationLabel(segment.start, segment.end)}\uFF0C\u5EFA\u8BAE\u7559\u610F\u97F3\u91CF\u3002`,
          sticky: true
        });
      }
    }
    processPoiSegment(segment, currentTime, state) {
      const visibleStart = Math.max(0, segment.start - POI_NOTICE_LEAD_SEC);
      const visibleEnd = segment.start + 3;
      if (currentTime > visibleEnd) {
        this.dismissSegmentNotice(segment);
        state.poiShown = true;
        return;
      }
      if (currentTime < visibleStart) {
        state.poiShown = false;
        return;
      }
      if (state.poiShown || segment.mode === "off") {
        return;
      }
      state.poiShown = true;
      this.notices.show({
        id: this.noticeIdForSegment(segment),
        title: `${CATEGORY_LABELS[segment.category]}\u63D0\u793A`,
        message: `\u5728 ${formatDurationLabel(segment.start, null)} \u6709\u4E00\u4E2A\u9AD8\u5149\u70B9\u3002`,
        durationMs: this.currentConfig.noticeDurationSec * 1e3,
        sticky: segment.mode !== "notice",
        actions: segment.mode === "notice" ? [] : [
          {
            label: "\u8DF3\u5230\u9AD8\u5149",
            variant: "primary",
            onClick: () => {
              if (this.currentVideo) {
                this.currentVideo.currentTime = segment.start;
              }
            }
          }
        ]
      });
    }
    performSkip(segment, verb) {
      if (!this.currentVideo || segment.end === null) {
        return;
      }
      const start = segment.start;
      const end = segment.end;
      this.dismissSegmentNotice(segment);
      this.currentVideo.currentTime = Math.max(end, this.currentVideo.currentTime);
      void this.statsStore.recordSkip(roundMinutes(end - start));
      this.notices.show({
        id: this.resultNoticeIdForSegment(segment),
        title: `${verb}\uFF1A${CATEGORY_LABELS[segment.category]}`,
        message: `\u8303\u56F4 ${formatDurationLabel(start, end)}\u3002`,
        durationMs: this.currentConfig.noticeDurationSec * 1e3,
        actions: [
          {
            label: "\u64A4\u9500",
            variant: "secondary",
            onClick: () => {
              if (!this.currentVideo) {
                return;
              }
              this.currentVideo.currentTime = Math.max(0, start);
              const state = this.getSegmentState(segment.UUID);
              state.suppressedUntilExit = true;
            }
          }
        ]
      });
    }
    activateMute(owner) {
      if (!this.currentVideo) {
        return;
      }
      if (this.activeMuteOwners.size === 0) {
        this.previousMutedState = this.currentVideo.muted;
      }
      this.activeMuteOwners.add(owner);
      this.currentVideo.muted = true;
    }
    deactivateMute(owner) {
      if (!this.currentVideo) {
        return;
      }
      this.activeMuteOwners.delete(owner);
      if (this.activeMuteOwners.size === 0) {
        this.currentVideo.muted = this.previousMutedState;
      }
    }
    restoreMuteState() {
      if (this.currentVideo && this.activeMuteOwners.size > 0) {
        this.currentVideo.muted = this.previousMutedState;
      }
      this.activeMuteOwners.clear();
    }
    getSegmentState(id) {
      const existing = this.segmentStates.get(id);
      if (existing) {
        return existing;
      }
      const created = {
        actionConsumed: false,
        noticeShown: false,
        suppressedUntilExit: false,
        mutedByScript: false,
        poiShown: false,
        lastObservedTime: null
      };
      this.segmentStates.set(id, created);
      return created;
    }
    dismissSegmentNotice(segment) {
      this.notices.dismiss(this.noticeIdForSegment(segment));
    }
    noticeIdForSegment(segment) {
      return `segment:${segment.UUID}`;
    }
    resultNoticeIdForSegment(segment) {
      return `segment-result:${segment.UUID}`;
    }
    clearRuntimeState(detachUi = false) {
      this.restoreMuteState();
      this.notices.clear();
      this.segmentStates.clear();
      this.lastTickTime = null;
      this.currentSegments = [];
      this.currentSignature = "";
      this.currentContext = null;
      this.currentVideo = null;
      this.panel.setFullVideoLabels([]);
      this.previewBar.clear();
      this.previewBar.bind(null);
      this.notices.setHost(null);
      if (detachUi) {
        this.panel.unmount();
      } else {
        this.updateRuntimeStatus(this.buildIdleStatus());
      }
    }
    buildIdleStatus() {
      var _a, _b, _c, _d;
      if (!this.currentConfig.enabled) {
        return {
          kind: "idle",
          message: "\u811A\u672C\u5DF2\u505C\u7528",
          bvid: (_b = (_a = this.currentContext) == null ? void 0 : _a.bvid) != null ? _b : null,
          segmentCount: null
        };
      }
      if (supportsVideoFeatures(window.location.href)) {
        return {
          kind: "pending",
          message: "\u7B49\u5F85\u64AD\u653E\u5668\u548C\u9875\u9762\u4FE1\u606F",
          bvid: (_d = (_c = this.currentContext) == null ? void 0 : _c.bvid) != null ? _d : null,
          segmentCount: null
        };
      }
      return {
        kind: "idle",
        message: "\u5F53\u524D\u9875\u9762\u53EF\u4F7F\u7528\u7F29\u7565\u56FE\u6807\u7B7E\u4E0E\u5185\u5BB9\u589E\u5F3A",
        bvid: null,
        segmentCount: null
      };
    }
    updateRuntimeStatus(status) {
      this.panel.updateRuntimeStatus(status);
    }
    shouldResetSegmentState(currentTime, state) {
      return state.lastObservedTime !== null && currentTime < state.lastObservedTime - SEGMENT_REWIND_RESET_SEC;
    }
    resetSegmentState(id, state) {
      this.notices.dismiss(`segment:${id}`);
      if (state.mutedByScript) {
        this.deactivateMute(id);
      }
      state.actionConsumed = false;
      state.noticeShown = false;
      state.suppressedUntilExit = false;
      state.mutedByScript = false;
      state.poiShown = false;
      state.lastObservedTime = null;
    }
  };

  // src/features/dynamic-filter.ts
  var PROCESSED_ATTR = "data-bsb-dynamic-processed";
  var BADGE_SELECTOR = "[data-bsb-dynamic-badge]";
  var TOGGLE_SELECTOR = "[data-bsb-dynamic-toggle]";
  var HIDDEN_ATTR = "data-bsb-dynamic-hidden";
  var DYNAMIC_RELEVANT_SELECTORS = [
    ".bili-dyn-item",
    ".bili-dyn-card-goods",
    ".bili-rich-text__content",
    ".dyn-card-opus",
    ".dyn-card-opus__title"
  ];
  var DYNAMIC_IGNORED_SELECTORS = [BADGE_SELECTOR, TOGGLE_SELECTOR];
  function classifyDynamicItem(element, config) {
    if (element.querySelector(".bili-dyn-card-goods.hide-border")) {
      return {
        category: "dynamicSponsor_forward_sponsor",
        matches: []
      };
    }
    if (element.querySelector(".bili-dyn-card-goods")) {
      return {
        category: "dynamicSponsor_sponsor",
        matches: []
      };
    }
    const pattern = regexFromStoredPattern(config.dynamicRegexPattern);
    if (!pattern) {
      return null;
    }
    const text = [
      ...element.querySelectorAll(".bili-rich-text__content span:not(.bili-dyn-item__interaction *), .opus-paragraph-children span, .dyn-card-opus__title")
    ].map((node) => {
      var _a;
      return (_a = node.textContent) != null ? _a : "";
    }).join(" ");
    const matches = collectPatternMatches(text, pattern);
    if (!isLikelyPromoText(text, matches, config.dynamicRegexKeywordMinMatches)) {
      return null;
    }
    return {
      category: "dynamicSponsor_suspicion_sponsor",
      matches
    };
  }
  function getBadgeText(match) {
    if (match.category === "dynamicSponsor_forward_sponsor") {
      return "\u8F6C\u53D1\u5E26\u8D27";
    }
    if (match.category === "dynamicSponsor_sponsor") {
      return "\u5E26\u8D27\u52A8\u6001";
    }
    return match.matches.length > 0 ? `\u7591\u4F3C\u5E7F\u544A: ${match.matches.join(" / ")}` : "\u7591\u4F3C\u5E7F\u544A";
  }
  function resolveBadgeAnchor(element) {
    var _a, _b, _c;
    return (_c = (_b = (_a = element.querySelector(".bili-dyn-title__text")) != null ? _a : element.querySelector(".dyn-card-opus__title")) != null ? _b : element.querySelector(".bili-dyn-item__header")) != null ? _c : element.querySelector(".bili-dyn-item__main");
  }
  function resolveContentBody(element) {
    var _a, _b;
    return (_b = (_a = element.querySelector(".bili-dyn-content")) != null ? _a : element.querySelector(".dyn-card-opus")) != null ? _b : element.querySelector(".bili-dyn-item__main");
  }
  function createBadge(text) {
    const badge = document.createElement("div");
    badge.dataset.bsbDynamicBadge = "true";
    badge.style.cssText = "display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:6px 10px;border-radius:999px;background:rgba(255,102,153,.14);border:1px solid rgba(255,102,153,.28);color:#c2185b;font:600 12px/1.2 'SF Pro Text','PingFang SC',sans-serif;";
    badge.textContent = text;
    return badge;
  }
  function createToggleButton(onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.bsbDynamicToggle = "true";
    button.style.cssText = "margin-top:8px;border:0;border-radius:999px;padding:7px 12px;background:rgba(15,23,42,.08);color:#0f172a;font:600 12px/1.2 'SF Pro Text','PingFang SC',sans-serif;cursor:pointer;";
    button.textContent = "\u663E\u793A\u5185\u5BB9";
    button.addEventListener("click", onClick);
    return button;
  }
  function setDynamicHidden(body, button, hidden) {
    body.style.display = hidden ? "none" : "";
    button.textContent = hidden ? "\u663E\u793A\u5185\u5BB9" : "\u9690\u85CF\u5185\u5BB9";
  }
  var DynamicSponsorController = class {
    constructor(configStore) {
      this.configStore = configStore;
      __publicField(this, "started", false);
      __publicField(this, "currentConfig");
      __publicField(this, "domObserver", null);
      __publicField(this, "refreshTimerId", null);
      __publicField(this, "stopObservingUrl", null);
      __publicField(this, "pendingVisibleRefresh", false);
      __publicField(this, "handleVisibilityChange", () => {
        if (!document.hidden && this.pendingVisibleRefresh) {
          this.pendingVisibleRefresh = false;
          this.scheduleRefresh();
        }
      });
      this.currentConfig = this.configStore.getSnapshot();
      this.configStore.subscribe((config) => {
        this.currentConfig = config;
        this.resetProcessedItems();
        this.scheduleRefresh();
      });
    }
    start() {
      if (this.started) {
        return;
      }
      this.started = true;
      this.scheduleRefresh();
      this.stopObservingUrl = observeUrlChanges(() => {
        this.resetProcessedItems();
        this.scheduleRefresh();
      });
      this.domObserver = new MutationObserver((records) => {
        if (!mutationsTouchSelectors(records, DYNAMIC_RELEVANT_SELECTORS, DYNAMIC_IGNORED_SELECTORS)) {
          return;
        }
        this.scheduleRefresh();
      });
      this.domObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
      window.addEventListener(
        "pagehide",
        () => {
          this.stop();
        },
        { once: true }
      );
    }
    stop() {
      var _a;
      if (!this.started) {
        return;
      }
      this.started = false;
      if (this.stopObservingUrl) {
        this.stopObservingUrl();
        this.stopObservingUrl = null;
      }
      if (this.refreshTimerId !== null) {
        window.clearTimeout(this.refreshTimerId);
        this.refreshTimerId = null;
      }
      (_a = this.domObserver) == null ? void 0 : _a.disconnect();
      this.domObserver = null;
      this.pendingVisibleRefresh = false;
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
      this.resetProcessedItems();
    }
    scheduleRefresh() {
      if (document.hidden) {
        this.pendingVisibleRefresh = true;
        return;
      }
      if (this.refreshTimerId !== null) {
        return;
      }
      this.refreshTimerId = window.setTimeout(() => {
        this.refreshTimerId = null;
        this.refresh();
      }, 120);
    }
    refresh() {
      if (document.hidden) {
        this.pendingVisibleRefresh = true;
        return;
      }
      if (!this.currentConfig.enabled || this.currentConfig.dynamicFilterMode === "off" || !supportsDynamicFilters(window.location.href)) {
        this.resetProcessedItems();
        return;
      }
      for (const element of document.querySelectorAll(".bili-dyn-item")) {
        try {
          this.processDynamicItem(element);
        } catch (error) {
          debugLog("Failed to process dynamic item", error);
        }
      }
    }
    processDynamicItem(element) {
      var _a;
      if (element.getAttribute(PROCESSED_ATTR) === "true") {
        return;
      }
      const match = classifyDynamicItem(element, this.currentConfig);
      if (!match) {
        return;
      }
      const anchor = resolveBadgeAnchor(element);
      if (!(anchor == null ? void 0 : anchor.parentElement)) {
        return;
      }
      element.setAttribute(PROCESSED_ATTR, "true");
      const badge = createBadge(getBadgeText(match));
      anchor.parentElement.insertBefore(badge, anchor.nextSibling);
      if (this.currentConfig.dynamicFilterMode !== "hide") {
        return;
      }
      const body = resolveContentBody(element);
      if (!body || body.getAttribute(HIDDEN_ATTR) === "true") {
        return;
      }
      const toggle = createToggleButton(() => {
        const hidden = body.style.display === "none";
        setDynamicHidden(body, toggle, !hidden);
      });
      setDynamicHidden(body, toggle, true);
      body.setAttribute(HIDDEN_ATTR, "true");
      (_a = badge.parentElement) == null ? void 0 : _a.insertBefore(toggle, badge.nextSibling);
    }
    resetProcessedItems() {
      for (const element of document.querySelectorAll(`.bili-dyn-item[${PROCESSED_ATTR}='true']`)) {
        element.removeAttribute(PROCESSED_ATTR);
        element.querySelectorAll(BADGE_SELECTOR).forEach((node) => node.remove());
        element.querySelectorAll(TOGGLE_SELECTOR).forEach((node) => node.remove());
        const body = resolveContentBody(element);
        if (body) {
          body.style.display = "";
          body.removeAttribute(HIDDEN_ATTR);
        }
      }
      debugLog("Dynamic sponsor state reset");
    }
  };

  // src/features/comment-filter.ts
  var THREAD_PROCESSED_ATTR = "data-bsb-comment-processed";
  var REPLY_PROCESSED_ATTR = "data-bsb-comment-reply-processed";
  var BADGE_ATTR = "data-bsb-comment-badge";
  var TOGGLE_ATTR = "data-bsb-comment-toggle";
  var HIDDEN_ATTR2 = "data-bsb-comment-hidden";
  var REPLIES_HIDDEN_ATTR = "data-bsb-comment-replies-hidden";
  var ROOT_REFRESH_INTERVAL_MS = 900;
  var COMMENT_RELEVANT_SELECTORS = [
    "bili-comments",
    "bili-comment-thread-renderer",
    "bili-comment-renderer",
    "bili-comment-reply-renderer",
    "bili-comment-replies-renderer",
    "bili-rich-text"
  ];
  var COMMENT_IGNORED_SELECTORS = [`[${BADGE_ATTR}]`, `[${TOGGLE_ATTR}]`];
  function hasSponsoredGoodsLink(commentRenderer) {
    var _a, _b, _c;
    const links = (_c = (_b = (_a = commentRenderer.shadowRoot) == null ? void 0 : _a.querySelector("bili-rich-text")) == null ? void 0 : _b.shadowRoot) == null ? void 0 : _c.querySelectorAll("a[data-type='goods']");
    return Boolean(links && links.length > 0);
  }
  function extractCommentText(commentRenderer) {
    var _a, _b, _c, _d, _e, _f;
    const richTextNodes = [
      ...(_d = (_c = (_b = (_a = commentRenderer.shadowRoot) == null ? void 0 : _a.querySelector("bili-rich-text")) == null ? void 0 : _b.shadowRoot) == null ? void 0 : _c.querySelectorAll("span, a")) != null ? _d : []
    ];
    const nodes = [
      ...richTextNodes,
      ...(_f = (_e = commentRenderer.shadowRoot) == null ? void 0 : _e.querySelectorAll("#content, .reply-content")) != null ? _f : []
    ];
    return nodes.map((node) => {
      var _a2, _b2;
      return (_b2 = (_a2 = node.textContent) == null ? void 0 : _a2.trim()) != null ? _b2 : "";
    }).filter(Boolean).join(" ");
  }
  function classifyCommentRenderer(commentRenderer, config) {
    if (hasSponsoredGoodsLink(commentRenderer)) {
      return {
        reason: "goods",
        matches: []
      };
    }
    const pattern = regexFromStoredPattern(config.dynamicRegexPattern);
    if (!pattern) {
      return null;
    }
    const text = extractCommentText(commentRenderer);
    const matches = collectPatternMatches(text, pattern);
    if (!isLikelyPromoText(text, matches, config.dynamicRegexKeywordMinMatches)) {
      return null;
    }
    return {
      reason: "suspicion",
      matches
    };
  }
  function getBadgeText2(match) {
    return match.reason === "goods" ? "\u8BC4\u8BBA\u533A\u5546\u54C1\u5E7F\u544A" : `\u7591\u4F3C\u5E7F\u544A\u8BC4\u8BBA: ${match.matches.join(" / ")}`;
  }
  function createBadge2(text) {
    const badge = document.createElement("div");
    badge.setAttribute(BADGE_ATTR, "true");
    badge.style.cssText = "display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;background:rgba(255,102,153,.15);border:1px solid rgba(255,102,153,.28);color:#c2185b;font:600 11px/1.2 'SF Pro Text','PingFang SC',sans-serif;";
    badge.textContent = text;
    return badge;
  }
  function createToggleButton2(onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute(TOGGLE_ATTR, "true");
    button.style.cssText = "margin-left:8px;border:0;border-radius:999px;padding:6px 10px;background:rgba(15,23,42,.08);color:#0f172a;font:600 12px/1.2 'SF Pro Text','PingFang SC',sans-serif;cursor:pointer;";
    button.textContent = "\u663E\u793A\u8BC4\u8BBA\u5185\u5BB9";
    button.addEventListener("click", onClick);
    return button;
  }
  function getMainCommentRenderer(thread) {
    var _a;
    const renderer = (_a = thread.shadowRoot) == null ? void 0 : _a.querySelector("bili-comment-renderer");
    return renderer instanceof HTMLElement && renderer.shadowRoot ? renderer : null;
  }
  function getReplyTargets(thread) {
    var _a, _b;
    const repliesRenderer = (_a = thread.shadowRoot) == null ? void 0 : _a.querySelector("bili-comment-replies-renderer");
    const repliesRoot = repliesRenderer == null ? void 0 : repliesRenderer.shadowRoot;
    if (!repliesRoot) {
      return [];
    }
    const targets = [];
    for (const reply of repliesRoot.querySelectorAll("bili-comment-reply-renderer")) {
      const renderer = (_b = reply.shadowRoot) == null ? void 0 : _b.querySelector("bili-comment-renderer");
      if (!(renderer instanceof HTMLElement) || !renderer.shadowRoot) {
        continue;
      }
      targets.push({
        host: reply,
        renderer,
        processedAttr: REPLY_PROCESSED_ATTR,
        thread,
        kind: "reply"
      });
    }
    return targets;
  }
  function getBadgeAnchor(commentRenderer) {
    var _a, _b, _c;
    const userInfo = (_a = commentRenderer.shadowRoot) == null ? void 0 : _a.querySelector("bili-comment-user-info");
    const infoRoot = userInfo == null ? void 0 : userInfo.shadowRoot;
    return (_c = (_b = infoRoot == null ? void 0 : infoRoot.querySelector("#user-up")) != null ? _b : infoRoot == null ? void 0 : infoRoot.querySelector("#user-level")) != null ? _c : null;
  }
  function getContentBody(commentRenderer) {
    var _a, _b;
    return (_b = (_a = commentRenderer.shadowRoot) == null ? void 0 : _a.querySelector("#content")) != null ? _b : null;
  }
  function getActionAnchor(commentRenderer) {
    var _a, _b, _c, _d;
    const actionRenderer = (_b = (_a = commentRenderer.shadowRoot) == null ? void 0 : _a.querySelector("#main")) == null ? void 0 : _b.querySelector("bili-comment-action-buttons-renderer");
    return (_d = (_c = actionRenderer == null ? void 0 : actionRenderer.shadowRoot) == null ? void 0 : _c.querySelector("#reply")) != null ? _d : getContentBody(commentRenderer);
  }
  function removeInjectedDecorations(commentRenderer) {
    var _a, _b, _c, _d, _e, _f, _g;
    (_c = (_b = (_a = commentRenderer.shadowRoot) == null ? void 0 : _a.querySelector("bili-comment-user-info")) == null ? void 0 : _b.shadowRoot) == null ? void 0 : _c.querySelectorAll(`[${BADGE_ATTR}='true']`).forEach((node) => node.remove());
    (_g = (_f = (_e = (_d = commentRenderer.shadowRoot) == null ? void 0 : _d.querySelector("#main")) == null ? void 0 : _e.querySelector("bili-comment-action-buttons-renderer")) == null ? void 0 : _f.shadowRoot) == null ? void 0 : _g.querySelectorAll(`[${TOGGLE_ATTR}='true']`).forEach((node) => node.remove());
  }
  function insertAfter(anchor, node) {
    const parent = anchor.parentNode;
    if (!parent) {
      return false;
    }
    parent.insertBefore(node, anchor.nextSibling);
    return true;
  }
  function setCommentHidden(content, toggle, hidden) {
    content.style.display = hidden ? "none" : "";
    toggle.textContent = hidden ? "\u663E\u793A\u8BC4\u8BBA\u5185\u5BB9" : "\u9690\u85CF\u8BC4\u8BBA\u5185\u5BB9";
  }
  function hideReplies(thread) {
    var _a;
    const repliesRenderer = (_a = thread.shadowRoot) == null ? void 0 : _a.querySelector("bili-comment-replies-renderer");
    const repliesRoot = repliesRenderer == null ? void 0 : repliesRenderer.shadowRoot;
    if (!repliesRoot) {
      return;
    }
    repliesRoot.querySelectorAll("bili-comment-reply-renderer").forEach((reply) => {
      reply.style.display = "none";
      reply.setAttribute(REPLIES_HIDDEN_ATTR, "true");
    });
  }
  function restoreReplies(thread) {
    var _a;
    const repliesRenderer = (_a = thread.shadowRoot) == null ? void 0 : _a.querySelector("bili-comment-replies-renderer");
    const repliesRoot = repliesRenderer == null ? void 0 : repliesRenderer.shadowRoot;
    if (!repliesRoot) {
      return;
    }
    repliesRoot.querySelectorAll(`bili-comment-reply-renderer[${REPLIES_HIDDEN_ATTR}='true']`).forEach((reply) => {
      reply.style.display = "";
      reply.removeAttribute(REPLIES_HIDDEN_ATTR);
    });
  }
  var CommentSponsorController = class {
    constructor(configStore) {
      this.configStore = configStore;
      __publicField(this, "started", false);
      __publicField(this, "currentConfig");
      __publicField(this, "rootSweepIntervalId", null);
      __publicField(this, "documentObserver", null);
      __publicField(this, "refreshTimerId", null);
      __publicField(this, "stopObservingUrl", null);
      __publicField(this, "rootObservers", /* @__PURE__ */ new Map());
      __publicField(this, "pendingVisibleRefresh", false);
      __publicField(this, "handleVisibilityChange", () => {
        if (!document.hidden && this.pendingVisibleRefresh) {
          this.pendingVisibleRefresh = false;
          this.scheduleRefresh();
        }
      });
      this.currentConfig = this.configStore.getSnapshot();
      this.configStore.subscribe((config) => {
        this.currentConfig = config;
        this.resetProcessedThreads();
        this.scheduleRefresh();
      });
    }
    start() {
      if (this.started) {
        return;
      }
      this.started = true;
      this.scheduleRefresh();
      this.stopObservingUrl = observeUrlChanges(() => {
        this.resetProcessedThreads();
        this.scheduleRefresh();
      });
      this.rootSweepIntervalId = window.setInterval(() => {
        if (document.hidden) {
          this.pendingVisibleRefresh = true;
          return;
        }
        this.refresh();
      }, ROOT_REFRESH_INTERVAL_MS);
      this.documentObserver = new MutationObserver((records) => {
        if (!mutationsTouchSelectors(records, COMMENT_RELEVANT_SELECTORS, COMMENT_IGNORED_SELECTORS)) {
          return;
        }
        this.scheduleRefresh();
      });
      this.documentObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
      window.addEventListener(
        "pagehide",
        () => {
          this.stop();
        },
        { once: true }
      );
    }
    stop() {
      var _a;
      if (!this.started) {
        return;
      }
      this.started = false;
      if (this.stopObservingUrl) {
        this.stopObservingUrl();
        this.stopObservingUrl = null;
      }
      if (this.rootSweepIntervalId !== null) {
        window.clearInterval(this.rootSweepIntervalId);
        this.rootSweepIntervalId = null;
      }
      if (this.refreshTimerId !== null) {
        window.clearTimeout(this.refreshTimerId);
        this.refreshTimerId = null;
      }
      (_a = this.documentObserver) == null ? void 0 : _a.disconnect();
      this.documentObserver = null;
      this.disconnectRootObservers();
      this.pendingVisibleRefresh = false;
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
      this.resetProcessedThreads();
    }
    scheduleRefresh() {
      if (document.hidden) {
        this.pendingVisibleRefresh = true;
        return;
      }
      if (this.refreshTimerId !== null) {
        return;
      }
      this.refreshTimerId = window.setTimeout(() => {
        this.refreshTimerId = null;
        this.refresh();
      }, 160);
    }
    refresh() {
      if (document.hidden) {
        this.pendingVisibleRefresh = true;
        return;
      }
      if (!this.currentConfig.enabled || this.currentConfig.commentFilterMode === "off" || !supportsCommentFilters(window.location.href)) {
        this.disconnectRootObservers();
        this.resetProcessedThreads();
        return;
      }
      const roots = Array.from(document.querySelectorAll("bili-comments"));
      this.syncRootObservers(roots);
      for (const root of roots) {
        try {
          this.scanCommentRoot(root);
        } catch (error) {
          debugLog("Failed to process comment root", error);
        }
      }
    }
    syncRootObservers(roots) {
      const liveRoots = new Set(roots);
      for (const [root, observer] of this.rootObservers) {
        if (!liveRoots.has(root) || !document.contains(root)) {
          observer.disconnect();
          this.rootObservers.delete(root);
        }
      }
      for (const root of roots) {
        if (this.rootObservers.has(root) || !root.shadowRoot) {
          continue;
        }
        const observer = new MutationObserver((records) => {
          if (!mutationsTouchSelectors(records, COMMENT_RELEVANT_SELECTORS, COMMENT_IGNORED_SELECTORS)) {
            return;
          }
          this.scheduleRefresh();
        });
        observer.observe(root.shadowRoot, {
          childList: true,
          subtree: true
        });
        this.rootObservers.set(root, observer);
      }
    }
    disconnectRootObservers() {
      for (const observer of this.rootObservers.values()) {
        observer.disconnect();
      }
      this.rootObservers.clear();
    }
    scanCommentRoot(root) {
      const feedRoot = root.shadowRoot;
      if (!feedRoot) {
        return;
      }
      for (const thread of feedRoot.querySelectorAll("bili-comment-thread-renderer")) {
        const mainRenderer = getMainCommentRenderer(thread);
        if (mainRenderer) {
          this.processTarget({
            host: thread,
            renderer: mainRenderer,
            processedAttr: THREAD_PROCESSED_ATTR,
            thread,
            kind: "comment"
          });
        }
        for (const replyTarget of getReplyTargets(thread)) {
          this.processTarget(replyTarget);
        }
      }
    }
    processTarget(target) {
      if (target.host.getAttribute(target.processedAttr) === "true") {
        return;
      }
      const match = classifyCommentRenderer(target.renderer, this.currentConfig);
      if (!match) {
        return;
      }
      const badgeAnchor = getBadgeAnchor(target.renderer);
      if (!badgeAnchor) {
        return;
      }
      target.host.setAttribute(target.processedAttr, "true");
      if (!insertAfter(badgeAnchor, createBadge2(getBadgeText2(match)))) {
        target.host.removeAttribute(target.processedAttr);
        return;
      }
      if (this.currentConfig.commentFilterMode !== "hide") {
        return;
      }
      const content = getContentBody(target.renderer);
      const actionAnchor = getActionAnchor(target.renderer);
      if (!content || !actionAnchor) {
        return;
      }
      const toggle = createToggleButton2(() => {
        const hidden = content.style.display === "none";
        setCommentHidden(content, toggle, !hidden);
        if (target.kind === "comment" && this.currentConfig.commentHideReplies) {
          if (hidden) {
            restoreReplies(target.thread);
          } else {
            hideReplies(target.thread);
          }
        }
      });
      setCommentHidden(content, toggle, true);
      content.setAttribute(HIDDEN_ATTR2, "true");
      if (!insertAfter(actionAnchor, toggle)) {
        return;
      }
      if (target.kind === "comment" && this.currentConfig.commentHideReplies) {
        hideReplies(target.thread);
      }
    }
    resetProcessedThreads() {
      for (const root of document.querySelectorAll("bili-comments")) {
        const feedRoot = root.shadowRoot;
        if (!feedRoot) {
          continue;
        }
        for (const thread of feedRoot.querySelectorAll("bili-comment-thread-renderer")) {
          const mainRenderer = getMainCommentRenderer(thread);
          if (thread.getAttribute(THREAD_PROCESSED_ATTR) === "true" && mainRenderer) {
            thread.removeAttribute(THREAD_PROCESSED_ATTR);
            removeInjectedDecorations(mainRenderer);
            const content = getContentBody(mainRenderer);
            if (content) {
              content.style.display = "";
              content.removeAttribute(HIDDEN_ATTR2);
            }
          }
          for (const replyTarget of getReplyTargets(thread)) {
            if (replyTarget.host.getAttribute(REPLY_PROCESSED_ATTR) !== "true") {
              continue;
            }
            replyTarget.host.removeAttribute(REPLY_PROCESSED_ATTR);
            removeInjectedDecorations(replyTarget.renderer);
            const content = getContentBody(replyTarget.renderer);
            if (content) {
              content.style.display = "";
              content.removeAttribute(HIDDEN_ATTR2);
            }
          }
          restoreReplies(thread);
        }
      }
      debugLog("Comment sponsor state reset");
    }
  };

  // src/api/video-label-client.ts
  var VALID_CATEGORIES2 = /* @__PURE__ */ new Set([
    "sponsor",
    "selfpromo",
    "interaction",
    "intro",
    "outro",
    "preview",
    "padding",
    "music_offtopic",
    "poi_highlight",
    "exclusive_access"
  ]);
  function buildUrl2(serverAddress, path) {
    return `${serverAddress.replace(/\/+$/u, "")}${path}`;
  }
  var VideoLabelClient = class {
    constructor(cache) {
      this.cache = cache;
      __publicField(this, "inFlightRequests", /* @__PURE__ */ new Map());
    }
    getVideoLabel(videoId, config) {
      return __async(this, null, function* () {
        var _a, _b, _c;
        const hashPrefix = yield getHashPrefix(videoId, 4);
        const normalizedServer = (_a = normalizeServerAddress(config.serverAddress)) != null ? _a : config.serverAddress;
        const cacheKey = `labels:${normalizedServer}:${hashPrefix}`;
        let response;
        if (config.enableCache) {
          response = yield this.cache.get(cacheKey);
        }
        if (!response) {
          response = yield this.fetchWithDedup(cacheKey, buildUrl2(normalizedServer, `/api/videoLabels/${hashPrefix}`));
          if (config.enableCache && (response.status === 200 || response.status === 404)) {
            yield this.cache.set(cacheKey, response);
          }
        }
        if (response.status === 404 || !response.ok) {
          return null;
        }
        let payload;
        try {
          payload = JSON.parse(response.responseText);
        } catch (_error) {
          return null;
        }
        if (!Array.isArray(payload)) {
          return null;
        }
        const record = payload.find((entry) => entry.videoID === videoId);
        const category = (_c = (_b = record == null ? void 0 : record.segments) == null ? void 0 : _b[0]) == null ? void 0 : _c.category;
        return typeof category === "string" && VALID_CATEGORIES2.has(category) ? category : null;
      });
    }
    fetchWithDedup(cacheKey, url) {
      return __async(this, null, function* () {
        const existing = this.inFlightRequests.get(cacheKey);
        if (existing) {
          return existing;
        }
        const request = gmXmlHttpRequest({
          method: "GET",
          url,
          headers: {
            Accept: "application/json"
          },
          timeout: REQUEST_TIMEOUT_MS
        }).finally(() => {
          this.inFlightRequests.delete(cacheKey);
        });
        this.inFlightRequests.set(cacheKey, request);
        return request;
      });
    }
  };

  // src/features/thumbnail-labels.ts
  var PROCESSED_ATTR2 = "data-bsb-thumbnail-processed";
  var RELEVANT_SELECTORS = [
    ".bili-video-card",
    ".video-page-card-small",
    ".video-card",
    ".video-episode-card",
    ".history-card",
    ".bili-dyn-content",
    ".header-history-card"
  ];
  var IGNORED_SELECTORS = [".sponsorThumbnailLabel"];
  var COMMON_THUMBNAIL_TARGETS = [
    {
      containerSelector: ".bili-header .right-entry .v-popover-wrap:nth-of-type(3)",
      itemSelector: "a[data-mod='top_right_bar_window_dynamic']"
    },
    {
      containerSelector: ".bili-header .right-entry .v-popover-wrap:nth-of-type(4)",
      itemSelector: "a[data-mod='top_right_bar_window_default_collection']"
    },
    {
      containerSelector: ".bili-header .right-entry .v-popover-wrap:nth-of-type(5)",
      itemSelector: "a.header-history-card"
    }
  ];
  var THUMBNAIL_TARGETS = {
    main: [
      ...COMMON_THUMBNAIL_TARGETS,
      { containerSelector: ".recommended-container_floor-aside .container", itemSelector: ".bili-video-card" },
      { containerSelector: ".feed-card", itemSelector: ".bili-video-card" }
    ],
    history: [
      ...COMMON_THUMBNAIL_TARGETS,
      {
        containerSelector: ".main-content",
        itemSelector: ".history-card",
        labelAnchorSelector: ".bili-cover-card__thumbnail > img"
      }
    ],
    search: [...COMMON_THUMBNAIL_TARGETS, { containerSelector: ".search-page-wrapper", itemSelector: ".bili-video-card" }],
    video: [
      ...COMMON_THUMBNAIL_TARGETS,
      {
        containerSelector: ".right-container",
        itemSelector: ".video-page-card-small",
        labelAnchorSelector: ".b-img img"
      }
    ],
    list: [...COMMON_THUMBNAIL_TARGETS, { containerSelector: ".recommend-list-container", itemSelector: ".video-card" }],
    channel: [
      ...COMMON_THUMBNAIL_TARGETS,
      { containerSelector: ".space-home", itemSelector: ".bili-video-card" },
      { containerSelector: ".space-main", itemSelector: ".bili-video-card" },
      { containerSelector: ".bili-dyn-list", itemSelector: ".bili-dyn-content" }
    ],
    dynamic: [...COMMON_THUMBNAIL_TARGETS, { containerSelector: ".bili-dyn-list", itemSelector: ".bili-dyn-content" }],
    festival: [
      ...COMMON_THUMBNAIL_TARGETS,
      {
        containerSelector: ".video-sections",
        itemSelector: ".video-episode-card",
        labelAnchorSelector: ".activity-image-card__image"
      }
    ]
  };
  var DEFAULT_LINK_SELECTOR = "a[href]";
  var DEFAULT_LINK_ATTRIBUTE = "href";
  var DEFAULT_LABEL_ANCHOR_SELECTOR = "div:not(.b-img--face) > picture img:not(.bili-avatar-img), .bili-cover-card__thumbnail > img, .activity-image-card__image, .b-img img";
  function createSbIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 565.15 568");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#SponsorBlockIcon");
    svg.appendChild(use);
    return svg;
  }
  function ensureSbIconDefinition(root) {
    if (root.querySelector("#SponsorBlockIcon")) {
      return;
    }
    const SVG_NS = "http://www.w3.org/2000/svg";
    const container = document.createElement("span");
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 565.15 568");
    svg.style.display = "none";
    const defs = document.createElementNS(SVG_NS, "defs");
    const group = document.createElementNS(SVG_NS, "g");
    group.id = "SponsorBlockIcon";
    const firstPath = document.createElementNS(SVG_NS, "path");
    firstPath.setAttribute(
      "d",
      "M282.58,568a65,65,0,0,1-34.14-9.66C95.41,463.94,2.54,300.46,0,121A64.91,64.91,0,0,1,34,62.91a522.56,522.56,0,0,1,497.16,0,64.91,64.91,0,0,1,34,58.12c-2.53,179.43-95.4,342.91-248.42,437.3A65,65,0,0,1,282.58,568Zm0-548.31A502.24,502.24,0,0,0,43.4,80.22a45.27,45.27,0,0,0-23.7,40.53c2.44,172.67,91.81,330,239.07,420.83a46.19,46.19,0,0,0,47.61,0C453.64,450.73,543,293.42,545.45,120.75a45.26,45.26,0,0,0-23.7-40.54A502.26,502.26,0,0,0,282.58,19.69Z"
    );
    const secondPath = document.createElementNS(SVG_NS, "path");
    secondPath.setAttribute(
      "d",
      "M 284.70508 42.693359 A 479.9 479.9 0 0 0 54.369141 100.41992 A 22.53 22.53 0 0 0 42.669922 120.41992 C 45.069922 290.25992 135.67008 438.63977 270.83008 522.00977 A 22.48 22.48 0 0 0 294.32031 522.00977 C 429.48031 438.63977 520.08047 290.25992 522.48047 120.41992 A 22.53 22.53 0 0 0 510.7793 100.41992 A 479.9 479.9 0 0 0 284.70508 42.693359 z M 220.41016 145.74023 L 411.2793 255.93945 L 220.41016 366.14062 L 220.41016 145.74023 z "
    );
    group.append(firstPath, secondPath);
    defs.appendChild(group);
    svg.appendChild(defs);
    container.appendChild(svg);
    if (root instanceof Element) {
      root.appendChild(container);
    } else {
      document.body.appendChild(container);
    }
  }
  function collectCardLinks(card, target) {
    var _a, _b, _c;
    const linkSelector = (_a = target.linkSelector) != null ? _a : DEFAULT_LINK_SELECTOR;
    const linkAttribute = (_b = target.linkAttribute) != null ? _b : DEFAULT_LINK_ATTRIBUTE;
    const urls = /* @__PURE__ */ new Set();
    const candidates = card.matches(linkSelector) ? [card] : [];
    candidates.push(...Array.from(card.querySelectorAll(linkSelector)));
    for (const link of candidates) {
      const bvid = extractBvidFromUrl((_c = link.getAttribute(linkAttribute)) != null ? _c : "");
      if (bvid) {
        urls.add(bvid);
      }
    }
    return [...urls];
  }
  function insertAfter2(anchor, node) {
    const parent = anchor.parentNode;
    if (!parent) {
      return false;
    }
    parent.insertBefore(node, anchor.nextSibling);
    return true;
  }
  function dispatchThumbnailHover(card, entering) {
    card.dispatchEvent(
      new PointerEvent(entering ? "pointerenter" : "pointerleave", {
        bubbles: true
      })
    );
  }
  function resolveLabelAnchor(card, target) {
    var _a, _b, _c;
    return (_c = (_b = (_a = target.labelAnchorSelector ? card.querySelector(target.labelAnchorSelector) : null) != null ? _a : card.querySelector(DEFAULT_LABEL_ANCHOR_SELECTOR)) != null ? _b : card.lastElementChild instanceof HTMLElement ? card.lastElementChild : null) != null ? _c : card;
  }
  function getOrCreateOverlay(card, target) {
    const existing = card.querySelector(".sponsorThumbnailLabel");
    if (existing) {
      const text2 = existing.querySelector("span");
      if (text2 instanceof HTMLElement) {
        return { overlay: existing, text: text2 };
      }
    }
    const overlay = document.createElement("div");
    overlay.className = "sponsorThumbnailLabel";
    overlay.addEventListener("pointerenter", (event) => {
      event.stopPropagation();
      dispatchThumbnailHover(card, false);
    });
    overlay.addEventListener("pointerleave", (event) => {
      event.stopPropagation();
      dispatchThumbnailHover(card, true);
    });
    overlay.appendChild(createSbIcon());
    const text = document.createElement("span");
    overlay.appendChild(text);
    const anchor = resolveLabelAnchor(card, target);
    if (!anchor || !insertAfter2(anchor, overlay)) {
      card.appendChild(overlay);
    }
    return { overlay, text };
  }
  function hideOverlay(card) {
    const overlay = card.querySelector(".sponsorThumbnailLabel");
    if (!overlay) {
      return;
    }
    overlay.classList.remove("sponsorThumbnailLabelVisible");
    overlay.removeAttribute("data-category");
    card.removeAttribute(PROCESSED_ATTR2);
  }
  function applyCategoryLabel(card, target, videoId, category) {
    const { overlay, text } = getOrCreateOverlay(card, target);
    card.setAttribute(PROCESSED_ATTR2, videoId);
    overlay.dataset.category = category;
    overlay.style.setProperty("--category-color", CATEGORY_COLORS[category]);
    overlay.style.setProperty("--category-text-color", CATEGORY_TEXT_COLORS[category]);
    text.textContent = CATEGORY_LABELS[category];
    overlay.classList.add("sponsorThumbnailLabelVisible");
  }
  var ThumbnailLabelController = class {
    constructor(configStore, cache) {
      this.configStore = configStore;
      __publicField(this, "started", false);
      __publicField(this, "refreshing", false);
      __publicField(this, "pendingRefresh", false);
      __publicField(this, "refreshTimerId", null);
      __publicField(this, "domObserver", null);
      __publicField(this, "stopObservingUrl", null);
      __publicField(this, "currentConfig");
      __publicField(this, "client");
      this.currentConfig = this.configStore.getSnapshot();
      this.client = new VideoLabelClient(cache);
      this.configStore.subscribe((config) => {
        this.currentConfig = config;
        this.reset();
        this.scheduleRefresh();
      });
    }
    start() {
      if (this.started) {
        return;
      }
      this.started = true;
      ensureSbIconDefinition(document.body);
      this.scheduleRefresh();
      this.stopObservingUrl = observeUrlChanges(() => {
        this.reset();
        this.scheduleRefresh();
      });
      this.domObserver = new MutationObserver((records) => {
        if (!mutationsTouchSelectors(records, RELEVANT_SELECTORS, IGNORED_SELECTORS)) {
          return;
        }
        this.scheduleRefresh();
      });
      this.domObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
    stop() {
      var _a, _b;
      if (!this.started) {
        return;
      }
      this.started = false;
      (_a = this.stopObservingUrl) == null ? void 0 : _a.call(this);
      this.stopObservingUrl = null;
      if (this.refreshTimerId !== null) {
        window.clearTimeout(this.refreshTimerId);
        this.refreshTimerId = null;
      }
      (_b = this.domObserver) == null ? void 0 : _b.disconnect();
      this.domObserver = null;
      this.reset();
    }
    scheduleRefresh() {
      if (this.refreshTimerId !== null) {
        return;
      }
      this.refreshTimerId = window.setTimeout(() => {
        this.refreshTimerId = null;
        void this.refresh();
      }, 180);
    }
    refresh() {
      return __async(this, null, function* () {
        var _a;
        if (this.refreshing) {
          this.pendingRefresh = true;
          return;
        }
        this.refreshing = true;
        try {
          if (!this.currentConfig.enabled || this.currentConfig.thumbnailLabelMode === "off") {
            this.reset();
            return;
          }
          const pageType = detectPageType(window.location.href);
          const targets = (_a = THUMBNAIL_TARGETS[pageType]) != null ? _a : [];
          if (targets.length === 0) {
            return;
          }
          for (const target of targets) {
            const containers = document.querySelectorAll(target.containerSelector);
            for (const container of containers) {
              const cards = container.querySelectorAll(target.itemSelector);
              for (const card of cards) {
                try {
                  yield this.processCard(card, target);
                } catch (error) {
                  debugLog("Failed to label thumbnail", error);
                }
              }
            }
          }
        } finally {
          this.refreshing = false;
          if (this.pendingRefresh) {
            this.pendingRefresh = false;
            this.scheduleRefresh();
          }
        }
      });
    }
    processCard(card, target) {
      return __async(this, null, function* () {
        const videoIds = collectCardLinks(card, target);
        if (videoIds.length !== 1) {
          hideOverlay(card);
          return;
        }
        const [videoId] = videoIds;
        const lastProcessed = card.getAttribute(PROCESSED_ATTR2);
        if (lastProcessed === videoId) {
          return;
        }
        const category = yield this.client.getVideoLabel(videoId, this.currentConfig);
        if (!category) {
          hideOverlay(card);
          return;
        }
        applyCategoryLabel(card, target, videoId, category);
      });
    }
    reset() {
      for (const overlay of document.querySelectorAll(".sponsorThumbnailLabel")) {
        overlay.classList.remove("sponsorThumbnailLabelVisible");
        overlay.removeAttribute("data-category");
      }
      for (const card of document.querySelectorAll(`[${PROCESSED_ATTR2}]`)) {
        card.removeAttribute(PROCESSED_ATTR2);
      }
    }
  };

  // src/runtime/lifecycle.ts
  function createRuntimeLifecycle(startup, shutdown) {
    let started = false;
    let starting = null;
    function start() {
      return __async(this, null, function* () {
        if (started) {
          return;
        }
        if (starting) {
          return starting;
        }
        starting = (() => __async(null, null, function* () {
          started = true;
          try {
            yield startup();
          } catch (error) {
            started = false;
            shutdown();
            throw error;
          } finally {
            starting = null;
          }
        }))();
        return starting;
      });
    }
    function stop() {
      if (!started && !starting) {
        return;
      }
      started = false;
      starting = null;
      shutdown();
    }
    window.addEventListener("pageshow", () => {
      void start();
    });
    window.addEventListener("pagehide", () => {
      stop();
    });
    return {
      start,
      stop
    };
  }

  // src/ui/styles.ts
  var styles = `
:root {
  --bsb-brand-blue: #00aeec;
  --bsb-dark-surface: rgba(28, 28, 28, 0.92);
  --bsb-light-surface: rgba(255, 255, 255, 0.96);
  --bsb-shadow: 0 18px 44px rgba(15, 23, 42, 0.22);
}

.bsb-tm-panel-open {
  overflow: hidden;
}

.bsb-tm-panel-backdrop[hidden] {
  display: none !important;
}

.bsb-tm-panel-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483646;
  background: rgba(15, 23, 42, 0.32);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.bsb-tm-panel {
  width: min(720px, calc(100vw - 24px));
  max-height: min(88vh, 860px);
  overflow: auto;
  border-radius: 20px;
  background: var(--bsb-light-surface);
  color: #111827;
  box-shadow: 0 32px 72px rgba(15, 23, 42, 0.28);
  padding: 20px;
  font: 14px/1.5 "SF Pro Text", "PingFang SC", sans-serif;
}

.bsb-tm-panel-header,
.bsb-tm-field,
.bsb-tm-category-row,
.bsb-tm-summary-line,
.bsb-tm-notice-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.bsb-tm-panel-subtitle,
.bsb-tm-section-description,
.bsb-tm-field-help {
  color: #6b7280;
}

.bsb-tm-panel-subtitle {
  margin-top: 4px;
  font-size: 12px;
}

.bsb-tm-panel-section + .bsb-tm-panel-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.bsb-tm-section-heading {
  margin-bottom: 12px;
}

.bsb-tm-section-title,
.bsb-tm-section-label,
.bsb-tm-field-title {
  display: block;
  color: #111827;
}

.bsb-tm-section-description,
.bsb-tm-field-help,
.bsb-tm-validation-message {
  margin: 4px 0 0;
  font-size: 12px;
}

.bsb-tm-validation-message {
  color: #b91c1c;
}

.bsb-tm-stats,
.bsb-tm-form,
.bsb-tm-categories {
  display: grid;
  gap: 12px;
}

.bsb-tm-summary-line {
  align-items: baseline;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.04);
}

.bsb-tm-summary-line strong {
  font-size: 13px;
}

.bsb-tm-summary-line span {
  color: #374151;
  text-align: right;
}

.bsb-tm-field {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.04);
}

.bsb-tm-field.stacked {
  align-items: stretch;
  flex-direction: column;
}

.bsb-tm-field-copy,
.bsb-tm-input-label {
  display: grid;
  gap: 4px;
}

.bsb-tm-categories {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.bsb-tm-category-row {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.04);
}

.bsb-tm-button,
.bsb-tm-panel input,
.bsb-tm-panel select {
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #fff;
  color: inherit;
  padding: 9px 12px;
  font: inherit;
}

.bsb-tm-button {
  cursor: pointer;
}

.bsb-tm-button.compact {
  justify-self: start;
}

.bsb-tm-button.primary {
  background: var(--bsb-brand-blue);
  border-color: var(--bsb-brand-blue);
  color: #fff;
}

.bsb-tm-button.danger {
  background: #7f1d1d;
  border-color: #7f1d1d;
  color: #fff;
}

.bsb-tm-button.secondary {
  background: rgba(15, 23, 42, 0.05);
}

.bsb-tm-notice-root {
  position: absolute;
  right: 10px;
  bottom: 100px;
  z-index: 2147483645;
  display: grid;
  gap: 10px;
  width: min(360px, calc(100vw - 32px));
  pointer-events: none;
}

.bsb-tm-notice-root:empty {
  display: none !important;
}

.bsb-tm-notice-root.is-floating {
  position: fixed;
  right: 16px;
  bottom: 16px;
}

.bsb-tm-notice {
  pointer-events: auto;
  color: #fff;
  background: var(--bsb-dark-surface);
  border-radius: 8px;
  box-shadow: var(--bsb-shadow);
  overflow: hidden;
}

.bsb-tm-notice-body {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
}

.bsb-tm-notice-title {
  font-weight: 700;
}

.bsb-tm-notice-message {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.88);
}

.bsb-tm-notice-actions {
  justify-content: flex-end;
  padding: 0 14px 12px;
}

#previewbar,
#shadowPreviewbar {
  overflow: hidden;
  padding: 0;
  margin: 0;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.previewbar {
  display: inline-block;
  position: absolute;
  top: 0;
  bottom: 0;
  min-width: 2px;
  height: 100%;
}

.previewbar[data-action-type="poi"] {
  min-width: 3px;
}

.bsb-tm-player-host {
  position: relative;
}

.sponsorThumbnailLabel {
  display: none;
  position: absolute;
  top: 0;
  left: 0;
  margin: 8px;
  padding: 6px;
  border-radius: 999px;
  z-index: 5;
  background: var(--category-color, #000);
  opacity: 0.74;
  box-shadow: 0 0 8px 2px rgba(51, 51, 51, 0.45);
  font-size: 10px;
  align-items: center;
}

.sponsorThumbnailLabel.sponsorThumbnailLabelVisible {
  display: flex;
}

.sponsorThumbnailLabel svg {
  width: 18px;
  height: 18px;
  fill: var(--category-text-color, #fff);
}

.sponsorThumbnailLabel span {
  display: none;
  padding-left: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--category-text-color, #fff);
  white-space: nowrap;
}

.sponsorThumbnailLabel:hover {
  border-radius: 8px;
  opacity: 1;
}

.sponsorThumbnailLabel:hover span {
  display: inline;
}

@media (max-width: 768px) {
  .bsb-tm-panel {
    width: min(100vw - 16px, 720px);
    max-height: calc(100vh - 16px);
    padding: 16px;
  }

  .bsb-tm-categories {
    grid-template-columns: 1fr;
  }

  .bsb-tm-notice-root {
    width: min(340px, calc(100vw - 24px));
    right: 12px;
    bottom: 88px;
  }
}
`;

  // src/main.ts
  function isTopLevelWindow() {
    try {
      return window.top === window.self;
    } catch (_error) {
      return false;
    }
  }
  function safeRun(label, task) {
    return __async(this, null, function* () {
      try {
        yield task();
      } catch (error) {
        debugLog(`${label} failed`, error);
      }
    });
  }
  function bootstrap() {
    return __async(this, null, function* () {
      if (!isTopLevelWindow()) {
        return;
      }
      if (!isSupportedLocation(window.location.href)) {
        return;
      }
      gmAddStyle(styles);
      ensurePageBridge();
      const configStore = new ConfigStore();
      const statsStore = new StatsStore();
      const cache = new PersistentCache();
      yield Promise.all([configStore.load(), statsStore.load()]);
      const controller = new ScriptController(configStore, statsStore, cache);
      const dynamicSponsorController = new DynamicSponsorController(configStore);
      const commentSponsorController = new CommentSponsorController(configStore);
      const thumbnailLabelController = new ThumbnailLabelController(configStore, cache);
      const runtime = createRuntimeLifecycle(
        () => __async(null, null, function* () {
          yield safeRun("dynamic controller startup", () => {
            dynamicSponsorController.start();
          });
          yield safeRun("comment controller startup", () => {
            commentSponsorController.start();
          });
          yield safeRun("thumbnail controller startup", () => {
            thumbnailLabelController.start();
          });
          yield safeRun("video controller startup", () => __async(null, null, function* () {
            yield controller.start();
          }));
        }),
        () => {
          void safeRun("dynamic controller shutdown", () => {
            dynamicSponsorController.stop();
          });
          void safeRun("comment controller shutdown", () => {
            commentSponsorController.stop();
          });
          void safeRun("thumbnail controller shutdown", () => {
            thumbnailLabelController.stop();
          });
          void safeRun("video controller shutdown", () => {
            controller.stop();
          });
        }
      );
      yield runtime.start();
      gmRegisterMenuCommand("Open BSB settings", () => controller.openPanel());
      gmRegisterMenuCommand("Toggle BSB settings", () => controller.togglePanel());
      gmRegisterMenuCommand("Clear BSB cache", () => {
        void controller.clearCache();
      });
    });
  }
  function ready() {
    if (document.readyState === "loading") {
      return new Promise((resolve) => {
        document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
      });
    }
    return Promise.resolve();
  }
  void ready().then(() => bootstrap()).catch((error) => {
    debugLog("Bootstrap failed", error);
  });
})();
