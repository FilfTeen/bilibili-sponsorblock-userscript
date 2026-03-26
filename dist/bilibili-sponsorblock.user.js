// ==UserScript==
// @name         Bilibili SponsorBlock Core
// @namespace    https://github.com/FilfTeen/bilibili-sponsorblock-userscript
// @version      0.3.0
// @description  Tampermonkey core script for skipping sponsor segments on Bilibili.
// @author       FilfTeen
// @license      GPL-3.0-only
// @match        https://www.bilibili.com/*
// @match        https://search.bilibili.com/*
// @match        https://t.bilibili.com/*
// @match        https://space.bilibili.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @connect      *
// @run-at       document-start
// @noframes
// @downloadURL  https://github.com/FilfTeen/bilibili-sponsorblock-userscript/releases/latest/download/bilibili-sponsorblock.user.js
// @updateURL    https://github.com/FilfTeen/bilibili-sponsorblock-userscript/releases/latest/download/bilibili-sponsorblock.user.js
// ==/UserScript==
"use strict";
(() => {
  // src/platform/gm.ts
  function assertFunction(name) {
    const fn = Reflect.get(globalThis, name);
    if (typeof fn !== "function") {
      throw new Error(`${name} is not available in this environment`);
    }
    return fn;
  }
  async function gmGetValue(key, defaultValue) {
    const fn = assertFunction("GM_getValue");
    return fn(key, defaultValue);
  }
  async function gmSetValue(key, value) {
    const fn = assertFunction("GM_setValue");
    fn(key, value);
  }
  async function gmDeleteValue(key) {
    const fn = assertFunction("GM_deleteValue");
    fn(key);
  }
  function gmAddStyle(css) {
    const fn = assertFunction("GM_addStyle");
    fn(css);
  }
  function gmRegisterMenuCommand(label, handler) {
    const fn = Reflect.get(globalThis, "GM_registerMenuCommand");
    if (typeof fn === "function") {
      fn(label, handler);
    }
  }
  async function gmXmlHttpRequest(options) {
    const fn = assertFunction("GM_xmlhttpRequest");
    return new Promise((resolve, reject) => {
      fn({
        ...options,
        onload: (response) => {
          resolve({
            responseText: response.responseText,
            status: response.status,
            ok: response.status >= 200 && response.status < 300
          });
        },
        onerror: () => reject(new Error(`Request failed: ${options.method} ${options.url}`)),
        ontimeout: () => reject(new Error(`Request timed out: ${options.method} ${options.url}`))
      });
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
    categoryModes: DEFAULT_CATEGORY_MODES,
    dynamicFilterMode: "hide",
    dynamicRegexPattern: DEFAULT_DYNAMIC_REGEX_PATTERN,
    dynamicRegexKeywordMinMatches: 1,
    commentFilterMode: "hide",
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
      initialState = window.__INITIAL_STATE__ ?? null;
    } catch {}

    try {
      playInfo = window.__playinfo__ ?? null;
    } catch {}

    try {
      const manifest = window.player?.getManifest?.();
      if (manifest) {
        playerManifest = {
          aid: manifest.aid ?? null,
          cid: manifest.cid ?? null,
          bvid: manifest.bvid ?? null,
          p: manifest.p ?? null
        };
      }
    } catch {}

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
  async function requestPageSnapshot() {
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
        resolve(data.payload ?? null);
      }
      document.addEventListener(RESPONSE_EVENT, onMessage);
      document.dispatchEvent(
        new CustomEvent(REQUEST_EVENT, {
          detail: { id }
        })
      );
    });
  }

  // src/utils/number.ts
  function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  function roundMinutes(seconds) {
    return Math.round(seconds / 60 * 100) / 100;
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
    } catch {
      return null;
    }
  }

  // src/core/config-store.ts
  function isCategoryMode(value) {
    return value === "auto" || value === "manual" || value === "notice" || value === "off";
  }
  function cloneDefaultConfig() {
    return {
      ...DEFAULT_CONFIG,
      categoryModes: { ...DEFAULT_CONFIG.categoryModes }
    };
  }
  function normalizeConfig(input) {
    const next = cloneDefaultConfig();
    if (!input) {
      return next;
    }
    next.enabled = input.enabled ?? next.enabled;
    next.enableCache = input.enableCache ?? next.enableCache;
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
    next.commentHideReplies = input.commentHideReplies ?? next.commentHideReplies;
    next.dynamicRegexPattern = typeof input.dynamicRegexPattern === "string" && input.dynamicRegexPattern.trim().length > 0 ? input.dynamicRegexPattern.trim() : next.dynamicRegexPattern;
    next.dynamicRegexKeywordMinMatches = clampNumber(
      Number.isFinite(input.dynamicRegexKeywordMinMatches) ? Number(input.dynamicRegexKeywordMinMatches) : next.dynamicRegexKeywordMinMatches,
      1,
      10
    );
    const serverAddress = normalizeServerAddress(input.serverAddress);
    if (serverAddress) {
      next.serverAddress = serverAddress;
    }
    for (const category of CATEGORY_ORDER) {
      const value = input.categoryModes?.[category];
      if (value && isCategoryMode(value)) {
        next.categoryModes[category] = value;
      }
    }
    return next;
  }
  var ConfigStore = class {
    config = cloneDefaultConfig();
    listeners = /* @__PURE__ */ new Set();
    async load() {
      this.config = normalizeConfig(await gmGetValue(CONFIG_STORAGE_KEY, null));
      return this.getSnapshot();
    }
    getSnapshot() {
      return {
        ...this.config,
        categoryModes: { ...this.config.categoryModes }
      };
    }
    subscribe(listener) {
      this.listeners.add(listener);
      return () => {
        this.listeners.delete(listener);
      };
    }
    async update(updater) {
      this.config = normalizeConfig(updater(this.getSnapshot()));
      await gmSetValue(CONFIG_STORAGE_KEY, this.config);
      for (const listener of this.listeners) {
        listener(this.getSnapshot());
      }
      return this.getSnapshot();
    }
    async reset() {
      await gmDeleteValue(CONFIG_STORAGE_KEY);
      this.config = cloneDefaultConfig();
      for (const listener of this.listeners) {
        listener(this.getSnapshot());
      }
      return this.getSnapshot();
    }
  };
  var StatsStore = class {
    stats = { ...DEFAULT_STATS };
    listeners = /* @__PURE__ */ new Set();
    async load() {
      const stored = await gmGetValue(STATS_STORAGE_KEY, null);
      this.stats = {
        skipCount: Number.isFinite(stored?.skipCount) ? Number(stored?.skipCount) : DEFAULT_STATS.skipCount,
        minutesSaved: Number.isFinite(stored?.minutesSaved) ? Math.max(0, Number(stored?.minutesSaved)) : DEFAULT_STATS.minutesSaved
      };
      return this.getSnapshot();
    }
    getSnapshot() {
      return { ...this.stats };
    }
    subscribe(listener) {
      this.listeners.add(listener);
      return () => {
        this.listeners.delete(listener);
      };
    }
    async patch(update) {
      this.stats = {
        skipCount: update.skipCount ?? this.stats.skipCount,
        minutesSaved: update.minutesSaved ?? this.stats.minutesSaved
      };
      await gmSetValue(STATS_STORAGE_KEY, this.stats);
      for (const listener of this.listeners) {
        listener(this.getSnapshot());
      }
      return this.getSnapshot();
    }
    async recordSkip(minutesSavedDelta) {
      return this.patch({
        skipCount: this.stats.skipCount + 1,
        minutesSaved: Math.round((this.stats.minutesSaved + minutesSavedDelta) * 100) / 100
      });
    }
  };

  // src/core/cache.ts
  function estimateSize(value) {
    return JSON.stringify(value).length;
  }
  var PersistentCache = class {
    payload = { entries: {} };
    loaded = false;
    async load() {
      if (this.loaded) {
        return;
      }
      const stored = await gmGetValue(CACHE_STORAGE_KEY, null);
      this.payload = normalizePayload(stored);
      this.loaded = true;
      await this.persist();
    }
    async persist() {
      this.cleanupExpired();
      this.evictOverflow();
      if (Object.keys(this.payload.entries).length === 0) {
        await gmDeleteValue(CACHE_STORAGE_KEY);
        return;
      }
      await gmSetValue(CACHE_STORAGE_KEY, this.payload);
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
    async get(key) {
      await this.load();
      const entry = this.payload.entries[key];
      if (!entry) {
        return void 0;
      }
      if (entry.expiresAt <= Date.now()) {
        delete this.payload.entries[key];
        await this.persist();
        return void 0;
      }
      return entry.value;
    }
    async set(key, value) {
      await this.load();
      const entry = {
        value,
        expiresAt: Date.now() + CACHE_TTL_MS,
        updatedAt: Date.now(),
        size: estimateSize(value)
      };
      this.payload.entries[key] = entry;
      await this.persist();
    }
    async delete(key) {
      await this.load();
      delete this.payload.entries[key];
      await this.persist();
    }
    async clear() {
      this.payload = { entries: {} };
      this.loaded = true;
      await gmDeleteValue(CACHE_STORAGE_KEY);
    }
    async getStats() {
      await this.load();
      return {
        entryCount: Object.keys(this.payload.entries).length,
        sizeBytes: this.getTotalSize()
      };
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
  async function sha256Hex(value) {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map((part) => part.toString(16).padStart(2, "0")).join("");
  }
  async function getHashPrefix(value, length = 4) {
    const digest = await sha256Hex(value);
    return digest.slice(0, length);
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
      if (typeof entry !== "object" || entry === null) {
        return false;
      }
      const candidate = entry;
      const secondPoint = candidate.segment?.[1];
      return typeof candidate.UUID === "string" && typeof candidate.category === "string" && VALID_CATEGORIES.has(candidate.category) && typeof candidate.actionType === "string" && VALID_ACTION_TYPES.has(candidate.actionType) && Array.isArray(candidate.segment) && (candidate.segment.length === 1 || candidate.segment.length === 2) && Number.isFinite(candidate.segment[0]) && (secondPoint === void 0 || Number.isFinite(secondPoint) && secondPoint >= candidate.segment[0]);
    });
  }
  var SponsorBlockClient = class {
    constructor(cache) {
      this.cache = cache;
    }
    async getSegments(video, config) {
      const hashPrefix = await getHashPrefix(video.bvid, 4);
      const normalizedServer = normalizeServerAddress(config.serverAddress) ?? config.serverAddress;
      const cacheKey = `segments:${normalizedServer}:${hashPrefix}`;
      let response;
      if (config.enableCache) {
        response = await this.cache.get(cacheKey);
      }
      if (!response) {
        response = await this.fetchWithRetry(buildUrl(normalizedServer, `/api/skipSegments/${hashPrefix}`));
        if (config.enableCache && (response.status === 200 || response.status === 404)) {
          await this.cache.set(cacheKey, response);
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
      } catch {
        throw new Error("SponsorBlock API returned invalid JSON");
      }
      if (!Array.isArray(payload)) {
        throw new Error("SponsorBlock API returned an unexpected payload shape");
      }
      const records = payload.filter(isSegmentRecord);
      const record = records.find((entry) => entry.videoID === video.bvid);
      return sanitizeSegments(record?.segments ?? []);
    }
    async fetchWithRetry(url) {
      const attempts = 2;
      let lastError = null;
      for (let index = 0; index < attempts; index += 1) {
        try {
          const response = await gmXmlHttpRequest({
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
      throw lastError ?? new Error("Request failed");
    }
  };

  // src/core/segment-filter.ts
  function normalizeSegments(segments, config) {
    const seen = /* @__PURE__ */ new Set();
    const normalized = [];
    for (const segment of segments) {
      if (seen.has(segment.UUID)) {
        continue;
      }
      seen.add(segment.UUID);
      const mode = config.categoryModes[segment.category] ?? "off";
      if (mode === "off") {
        continue;
      }
      const start = segment.segment[0];
      const end = segment.segment.length > 1 ? segment.segment[1] ?? null : null;
      const duration = typeof end === "number" ? Math.max(0, end - start) : null;
      if (segment.actionType !== "poi" && segment.actionType !== "full" && duration !== null && duration < config.minDurationSec) {
        continue;
      }
      if (!Number.isFinite(start)) {
        continue;
      }
      normalized.push({
        ...segment,
        start,
        end,
        duration,
        mode
      });
    }
    return normalized.sort((left, right) => left.start - right.start);
  }

  // src/ui/notice-center.ts
  var NoticeCenter = class {
    root;
    notices = /* @__PURE__ */ new Map();
    timers = /* @__PURE__ */ new Map();
    constructor() {
      this.root = document.createElement("div");
      this.root.className = "bsb-tm-notice-root";
      document.documentElement.appendChild(this.root);
    }
    show(options) {
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
      const actions = document.createElement("div");
      actions.className = "bsb-tm-notice-actions";
      for (const action of options.actions ?? []) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `bsb-tm-button ${action.variant ?? "secondary"}`;
        button.textContent = action.label;
        button.addEventListener("click", () => action.onClick());
        actions.appendChild(button);
      }
      notice.append(title, message);
      if (actions.childElementCount > 0) {
        notice.appendChild(actions);
      }
      this.root.appendChild(notice);
      this.notices.set(options.id, notice);
      if (!options.sticky) {
        const duration = options.durationMs ?? 4e3;
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
      this.config = config;
      this.stats = stats;
      this.button.className = "bsb-tm-entry-button";
      this.button.type = "button";
      this.button.textContent = "BSB";
      this.button.setAttribute("aria-label", `${SCRIPT_NAME} panel`);
      this.button.setAttribute("aria-controls", this.panelId);
      this.button.setAttribute("aria-expanded", "false");
      this.button.addEventListener("click", () => {
        this.toggle();
      });
      this.banner.className = "bsb-tm-banner";
      this.banner.hidden = true;
      this.panel.className = "bsb-tm-panel";
      this.panel.id = this.panelId;
      this.panel.append(
        this.createHeader(),
        this.createSection("summary"),
        this.createSection("form"),
        this.createSection("filters"),
        this.createSection("categories")
      );
      this.panel.querySelector(".bsb-tm-panel-close")?.addEventListener("click", () => {
        this.close();
      });
      this.statsEl.className = "bsb-tm-stats";
      this.form.className = "bsb-tm-form";
      this.filterForm.className = "bsb-tm-form";
      this.render();
    }
    button = document.createElement("button");
    panel = document.createElement("aside");
    banner = document.createElement("div");
    statsEl = document.createElement("div");
    form = document.createElement("div");
    filterForm = document.createElement("div");
    panelId = "bsb-tm-panel";
    config;
    stats;
    mount(playerHost) {
      if (!this.panel.isConnected) {
        document.documentElement.appendChild(this.panel);
      }
      if (!this.button.isConnected) {
        document.documentElement.appendChild(this.button);
      }
      if (playerHost) {
        if (getComputedStyle(playerHost).position === "static") {
          playerHost.style.position = "relative";
        }
        this.button.classList.remove("is-floating");
        this.button.classList.add("is-inline");
        playerHost.appendChild(this.button);
        const container = playerHost.parentElement;
        if (container) {
          container.insertBefore(this.banner, playerHost);
        }
        return;
      }
      this.banner.remove();
      this.button.classList.remove("is-inline");
      this.button.classList.add("is-floating");
      document.documentElement.appendChild(this.button);
    }
    toggle() {
      this.panel.classList.toggle("is-open");
      this.button.setAttribute("aria-expanded", String(this.panel.classList.contains("is-open")));
    }
    close() {
      this.panel.classList.remove("is-open");
      this.button.setAttribute("aria-expanded", "false");
    }
    unmount() {
      this.close();
      this.banner.remove();
      this.panel.remove();
      this.button.remove();
    }
    updateConfig(config) {
      this.config = config;
      this.render();
    }
    updateStats(stats) {
      this.stats = stats;
      this.renderSummary();
    }
    setFullVideoLabels(segments) {
      if (segments.length === 0) {
        this.banner.hidden = true;
        this.banner.textContent = "";
        return;
      }
      const labels = [...new Set(segments.map((segment) => CATEGORY_LABELS[segment.category]))];
      this.banner.hidden = false;
      this.banner.textContent = `\u6574\u89C6\u9891\u6807\u7B7E\uFF1A${labels.join(" / ")}`;
    }
    render() {
      this.renderSummary();
      this.renderForm();
      this.renderFilters();
      this.renderCategories();
    }
    renderSummary() {
      this.statsEl.replaceChildren(
        this.createSummaryLine("\u72B6\u6001", this.config.enabled ? "\u542F\u7528" : "\u505C\u7528"),
        this.createSummaryLine("\u8DF3\u8FC7\u6B21\u6570", String(this.stats.skipCount)),
        this.createSummaryLine("\u8282\u7701\u65F6\u957F", `${this.stats.minutesSaved.toFixed(2)} \u5206\u949F`)
      );
      this.panel.querySelector("[data-section='summary']")?.replaceChildren(this.statsEl);
    }
    renderForm() {
      this.form.replaceChildren(
        this.createCheckbox("\u811A\u672C\u542F\u7528", this.config.enabled, async (checked) => {
          await this.callbacks.onPatchConfig({ enabled: checked });
        }),
        this.createCheckbox("\u542F\u7528\u7F13\u5B58", this.config.enableCache, async (checked) => {
          await this.callbacks.onPatchConfig({ enableCache: checked });
        }),
        this.createInput("\u670D\u52A1\u5668\u5730\u5740", this.config.serverAddress, async (value) => {
          await this.callbacks.onPatchConfig({ serverAddress: value });
        }),
        this.createNumberInput("\u63D0\u793A\u65F6\u957F\uFF08\u79D2\uFF09", this.config.noticeDurationSec, async (value) => {
          await this.callbacks.onPatchConfig({ noticeDurationSec: value });
        }),
        this.createNumberInput("\u6700\u77ED\u7247\u6BB5\uFF08\u79D2\uFF09", this.config.minDurationSec, async (value) => {
          await this.callbacks.onPatchConfig({ minDurationSec: value });
        }),
        this.createResetButton(false)
      );
      this.panel.querySelector("[data-section='form']")?.replaceChildren(this.form);
    }
    renderFilters() {
      this.filterForm.replaceChildren(
        this.createSectionLabel("\u52A8\u6001\u9875\u5E7F\u544A\u8FC7\u6EE4"),
        this.createSelect("\u52A8\u6001\u8FC7\u6EE4\u6A21\u5F0F", this.config.dynamicFilterMode, CONTENT_FILTER_MODE_LABELS, async (value) => {
          await this.callbacks.onPatchConfig({ dynamicFilterMode: value });
        }),
        this.createInput("\u52A8\u6001\u5173\u952E\u8BCD\u6B63\u5219", this.config.dynamicRegexPattern, async (value) => {
          await this.callbacks.onPatchConfig({ dynamicRegexPattern: value });
        }),
        this.createNumberInput("\u52A8\u6001\u6700\u5C11\u547D\u4E2D\u6570", this.config.dynamicRegexKeywordMinMatches, async (value) => {
          await this.callbacks.onPatchConfig({ dynamicRegexKeywordMinMatches: value });
        }),
        this.createSectionLabel("\u8BC4\u8BBA\u533A\u5E7F\u544A\u8FC7\u6EE4"),
        this.createSelect("\u8BC4\u8BBA\u8FC7\u6EE4\u6A21\u5F0F", this.config.commentFilterMode, CONTENT_FILTER_MODE_LABELS, async (value) => {
          await this.callbacks.onPatchConfig({ commentFilterMode: value });
        }),
        this.createCheckbox("\u9690\u85CF\u5339\u914D\u8BC4\u8BBA\u7684\u56DE\u590D", this.config.commentHideReplies, async (checked) => {
          await this.callbacks.onPatchConfig({ commentHideReplies: checked });
        }),
        this.createResetButton(true)
      );
      this.panel.querySelector("[data-section='filters']")?.replaceChildren(this.filterForm);
    }
    renderCategories() {
      const wrapper = document.createElement("div");
      wrapper.className = "bsb-tm-categories";
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
        select.addEventListener("change", async () => {
          await this.callbacks.onCategoryModeChange(category, select.value);
        });
        row.append(label, select);
        wrapper.appendChild(row);
      }
      this.panel.querySelector("[data-section='categories']")?.replaceChildren(wrapper);
    }
    createCheckbox(labelText, checked, onChange) {
      const label = document.createElement("label");
      label.className = "bsb-tm-field";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = checked;
      input.addEventListener("change", async () => {
        await onChange(input.checked);
      });
      const text = document.createElement("span");
      text.textContent = labelText;
      label.append(input, text);
      return label;
    }
    createInput(labelText, value, onCommit) {
      const wrapper = document.createElement("label");
      wrapper.className = "bsb-tm-field stacked";
      const label = document.createElement("span");
      label.textContent = labelText;
      const input = document.createElement("input");
      input.type = "text";
      input.value = value;
      input.spellcheck = false;
      input.addEventListener("change", async () => {
        await onCommit(input.value.trim());
      });
      wrapper.append(label, input);
      return wrapper;
    }
    createSelect(labelText, value, options, onCommit) {
      const wrapper = document.createElement("label");
      wrapper.className = "bsb-tm-field stacked";
      const label = document.createElement("span");
      label.textContent = labelText;
      const select = document.createElement("select");
      for (const [optionValue, optionLabel] of Object.entries(options)) {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionLabel;
        option.selected = optionValue === value;
        select.appendChild(option);
      }
      select.addEventListener("change", async () => {
        await onCommit(select.value);
      });
      wrapper.append(label, select);
      return wrapper;
    }
    createNumberInput(labelText, value, onCommit) {
      const wrapper = document.createElement("label");
      wrapper.className = "bsb-tm-field stacked";
      const label = document.createElement("span");
      label.textContent = labelText;
      const input = document.createElement("input");
      input.type = "number";
      input.value = String(value);
      input.min = "0";
      input.step = "1";
      input.addEventListener("change", async () => {
        await onCommit(Number(input.value));
      });
      wrapper.append(label, input);
      return wrapper;
    }
    createResetButton(compact) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `bsb-tm-button danger${compact ? " compact" : ""}`;
      button.textContent = "\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E";
      button.addEventListener("click", async () => {
        await this.callbacks.onReset();
      });
      return button;
    }
    createHeader() {
      const header = document.createElement("div");
      header.className = "bsb-tm-panel-header";
      const title = document.createElement("strong");
      title.textContent = SCRIPT_NAME;
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "bsb-tm-button secondary bsb-tm-panel-close";
      closeButton.textContent = "\u5173\u95ED";
      header.append(title, closeButton);
      return header;
    }
    createSection(name) {
      const section = document.createElement("div");
      section.className = "bsb-tm-panel-section";
      section.dataset.section = name;
      return section;
    }
    createSectionLabel(text) {
      const label = document.createElement("strong");
      label.className = "bsb-tm-section-label";
      label.textContent = text;
      return label;
    }
    createSummaryLine(labelText, valueText) {
      const line = document.createElement("div");
      const label = document.createElement("strong");
      label.textContent = `${labelText}\uFF1A`;
      const value = document.createElement("span");
      value.textContent = valueText;
      line.append(label, value);
      return line;
    }
  };

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
    while (value > 0n && index >= 0) {
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
    const videoData = asRecord(initialState?.videoData);
    const videoInfo = asRecord(initialState?.videoInfo);
    const rawPages = videoData?.pages ?? videoInfo?.pages;
    if (!Array.isArray(rawPages)) {
      return [];
    }
    return rawPages.map((entry) => asRecord(entry)).filter((entry) => Boolean(entry));
  }
  function extractBvidFromUrl(url) {
    try {
      const parsed = new URL(url);
      const pathMatch = parsed.pathname.match(/BV1[a-zA-Z0-9]{9}/u);
      if (pathMatch?.[0] && isBvid(pathMatch[0])) {
        return pathMatch[0];
      }
      const searchParam = parsed.searchParams.get("bvid");
      return readBvid(searchParam);
    } catch {
      return null;
    }
  }
  function extractAidFromUrl(url) {
    try {
      const parsed = new URL(url);
      const pathMatch = parsed.pathname.match(/(?:^|\/)av(\d+)(?:\/|$)/iu);
      if (pathMatch?.[1]) {
        return readAid(pathMatch[1]);
      }
      return firstNonNull(readAid(parsed.searchParams.get("aid")), readAid(parsed.searchParams.get("avid")));
    } catch {
      return null;
    }
  }
  function extractPageFromUrl(url) {
    try {
      const parsed = new URL(url);
      const rawPage = Number(parsed.searchParams.get("p") ?? "1");
      return Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    } catch {
      return 1;
    }
  }
  function extractCidFromUrl(url) {
    try {
      const parsed = new URL(url);
      return readIdentifier(parsed.searchParams.get("cid"));
    } catch {
      return null;
    }
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
    return firstNonNull(
      readString(initialState?.h1Title),
      readString(asRecord(initialState?.videoData)?.title),
      readString(asRecord(initialState?.videoInfo)?.title),
      readString(asRecord(initialState?.epInfo)?.title),
      readString(asRecord(initialState?.epInfo)?.longTitle),
      readString(asRecord(initialState?.mediaInfo)?.title)
    );
  }
  function resolvePage(snapshot, initialState) {
    const fromUrl = extractPageFromUrl(snapshot.url);
    if (fromUrl > 1) {
      return fromUrl;
    }
    return firstNonNull(
      readNumber(snapshot.playerManifest?.p),
      readNumber(asRecord(initialState?.videoData)?.p),
      readNumber(asRecord(initialState?.videoInfo)?.p),
      1
    );
  }
  function resolveBvid(snapshot, initialState) {
    const directBvid = firstNonNull(
      readBvid(initialState?.bvid),
      readBvid(asRecord(initialState?.videoData)?.bvid),
      readBvid(asRecord(initialState?.videoInfo)?.bvid),
      readBvid(asRecord(initialState?.epInfo)?.bvid),
      readBvid(snapshot.playerManifest?.bvid),
      extractBvidFromUrl(snapshot.url)
    );
    if (directBvid) {
      return directBvid;
    }
    const aid = firstNonNull(
      readAid(initialState?.aid),
      readAid(asRecord(initialState?.videoData)?.aid),
      readAid(asRecord(initialState?.videoInfo)?.aid),
      readAid(asRecord(initialState?.epInfo)?.aid),
      readAid(snapshot.playerManifest?.aid),
      readAid(asRecord(snapshot.playInfo)?.aid),
      readAid(asRecord(asRecord(snapshot.playInfo)?.data)?.aid),
      extractAidFromUrl(snapshot.url)
    );
    return aid ? avidToBvid(aid) : null;
  }
  function resolveCid(snapshot, initialState, page) {
    return firstNonNull(
      readIdentifier(initialState?.cid),
      readIdentifier(asRecord(initialState?.videoData)?.cid),
      readIdentifier(asRecord(initialState?.videoInfo)?.cid),
      readIdentifier(asRecord(initialState?.epInfo)?.cid),
      readIdentifier(snapshot.playerManifest?.cid),
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
    } catch {
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
    for (const selector of PLAYER_HOST_SELECTORS) {
      const found = video.closest(selector);
      if (found) {
        return found;
      }
    }
    return video.parentElement ?? video;
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
  var ScriptController = class {
    constructor(configStore, statsStore) {
      this.configStore = configStore;
      this.statsStore = statsStore;
      this.currentConfig = this.configStore.getSnapshot();
      this.currentStats = this.statsStore.getSnapshot();
      this.panel = new SettingsPanel(this.currentConfig, this.currentStats, {
        onPatchConfig: async (patch) => {
          await this.configStore.update((config) => ({
            ...config,
            ...patch,
            categoryModes: {
              ...config.categoryModes,
              ...patch.categoryModes ?? {}
            }
          }));
        },
        onCategoryModeChange: async (category, mode) => {
          await this.configStore.update((config) => ({
            ...config,
            categoryModes: {
              ...config.categoryModes,
              [category]: mode
            }
          }));
        },
        onReset: async () => {
          await this.configStore.reset();
        }
      });
      this.configStore.subscribe((config) => {
        this.currentConfig = config;
        this.panel.updateConfig(config);
        if (!config.enabled) {
          this.notices.clear();
          this.restoreMuteState();
        }
        void this.refreshCurrentVideo(true);
      });
      this.statsStore.subscribe((stats) => {
        this.currentStats = stats;
        this.panel.updateStats(stats);
      });
    }
    currentConfig;
    currentStats;
    segmentStates = /* @__PURE__ */ new Map();
    notices = new NoticeCenter();
    cache = new PersistentCache();
    client = new SponsorBlockClient(this.cache);
    panel;
    tickIntervalId = null;
    domObserver = null;
    stopObservingUrl = null;
    currentContext = null;
    currentVideo = null;
    currentSignature = "";
    currentSegments = [];
    activeMuteOwners = /* @__PURE__ */ new Set();
    previousMutedState = false;
    refreshing = false;
    refreshScheduled = false;
    refreshTimerId = null;
    pendingRefresh = false;
    pendingForceFetch = false;
    async start() {
      await this.cache.load();
      this.panel.mount();
      await this.refreshCurrentVideo(true);
      this.stopObservingUrl = observeUrlChanges(() => {
        void this.refreshCurrentVideo(true);
      });
      this.tickIntervalId = window.setInterval(() => {
        this.tick();
      }, TICK_INTERVAL_MS);
      this.domObserver = new MutationObserver(() => {
        this.scheduleRefresh();
      });
      this.domObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
      window.addEventListener(
        "pagehide",
        () => {
          this.stop();
        },
        { once: true }
      );
    }
    togglePanel() {
      this.panel.toggle();
    }
    async clearCache() {
      await this.cache.clear();
      this.notices.show({
        id: "bsb-cache-cleared",
        title: "\u7F13\u5B58\u5DF2\u6E05\u7406",
        message: "\u4E0B\u6B21\u8FDB\u5165\u89C6\u9891\u65F6\u4F1A\u91CD\u65B0\u8BF7\u6C42\u7247\u6BB5\u6570\u636E\u3002",
        durationMs: 2800
      });
      await this.refreshCurrentVideo(true);
    }
    stop() {
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
      this.domObserver?.disconnect();
      this.domObserver = null;
      this.clearRuntimeState(true);
    }
    scheduleRefresh(forceFetch = false) {
      this.pendingForceFetch = this.pendingForceFetch || forceFetch;
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
    async refreshCurrentVideo(forceFetch = false) {
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
        const snapshot = await requestPageSnapshot();
        const context = resolveVideoContext(snapshot);
        const video = findVideoElement();
        if (!context || !video) {
          this.clearRuntimeState();
          return;
        }
        const signature = `${context.bvid}+${context.cid ?? ""}`;
        if (!forceFetch && signature === this.currentSignature && this.currentVideo === video) {
          return;
        }
        this.clearRuntimeState();
        this.currentContext = context;
        this.currentVideo = video;
        this.currentSignature = signature;
        const playerHost = resolvePlayerHost(video);
        this.panel.mount(playerHost);
        if (!this.currentConfig.enabled) {
          return;
        }
        const segments = await this.client.getSegments(context, this.currentConfig);
        this.currentSegments = normalizeSegments(segments, this.currentConfig);
        this.panel.setFullVideoLabels(this.currentSegments.filter((segment) => segment.actionType === "full"));
        debugLog("Loaded segments", {
          signature,
          count: this.currentSegments.length
        });
      } catch (error) {
        debugLog("Failed to refresh video context", error);
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
    }
    tick() {
      if (!this.currentConfig.enabled || !this.currentVideo || !this.currentContext) {
        return;
      }
      const currentTime = this.currentVideo.currentTime;
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
      this.currentVideo.currentTime = Math.max(end, this.currentVideo.currentTime);
      void this.statsStore.recordSkip(roundMinutes(end - start));
      this.notices.show({
        id: this.noticeIdForSegment(segment),
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
    clearRuntimeState(detachUi = false) {
      this.restoreMuteState();
      this.notices.clear();
      this.segmentStates.clear();
      this.currentSegments = [];
      this.currentSignature = "";
      this.currentContext = null;
      this.currentVideo = null;
      this.panel.setFullVideoLabels([]);
      if (detachUi) {
        this.panel.unmount();
      } else {
        this.panel.mount();
      }
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

  // src/utils/pattern.ts
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
    } catch {
      return null;
    }
  }
  function collectPatternMatches(text, pattern, minLength = 2) {
    const globalPattern = pattern.global ? pattern : new RegExp(pattern.source, `${pattern.flags}g`);
    const matches = text.match(globalPattern) ?? [];
    return [...new Set(matches.map((entry) => entry.trim()).filter((entry) => entry.length >= minLength))];
  }

  // src/features/dynamic-filter.ts
  var PROCESSED_ATTR = "data-bsb-dynamic-processed";
  var BADGE_SELECTOR = "[data-bsb-dynamic-badge]";
  var TOGGLE_SELECTOR = "[data-bsb-dynamic-toggle]";
  var HIDDEN_ATTR = "data-bsb-dynamic-hidden";
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
    ].map((node) => node.textContent ?? "").join(" ");
    const matches = collectPatternMatches(text, pattern);
    if (matches.length < config.dynamicRegexKeywordMinMatches) {
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
    return element.querySelector(".bili-dyn-title__text") ?? element.querySelector(".dyn-card-opus__title") ?? element.querySelector(".bili-dyn-item__header") ?? element.querySelector(".bili-dyn-item__main");
  }
  function resolveContentBody(element) {
    return element.querySelector(".bili-dyn-content") ?? element.querySelector(".dyn-card-opus") ?? element.querySelector(".bili-dyn-item__main");
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
      this.currentConfig = this.configStore.getSnapshot();
      this.configStore.subscribe((config) => {
        this.currentConfig = config;
        this.resetProcessedItems();
        this.scheduleRefresh();
      });
    }
    currentConfig;
    domObserver = null;
    refreshTimerId = null;
    stopObservingUrl = null;
    start() {
      this.scheduleRefresh();
      this.stopObservingUrl = observeUrlChanges(() => {
        this.resetProcessedItems();
        this.scheduleRefresh();
      });
      this.domObserver = new MutationObserver(() => {
        this.scheduleRefresh();
      });
      this.domObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
      window.addEventListener(
        "pagehide",
        () => {
          this.stop();
        },
        { once: true }
      );
    }
    stop() {
      if (this.stopObservingUrl) {
        this.stopObservingUrl();
        this.stopObservingUrl = null;
      }
      if (this.refreshTimerId !== null) {
        window.clearTimeout(this.refreshTimerId);
        this.refreshTimerId = null;
      }
      this.domObserver?.disconnect();
      this.domObserver = null;
      this.resetProcessedItems();
    }
    scheduleRefresh() {
      if (this.refreshTimerId !== null) {
        return;
      }
      this.refreshTimerId = window.setTimeout(() => {
        this.refreshTimerId = null;
        this.refresh();
      }, 120);
    }
    refresh() {
      if (!this.currentConfig.enabled || this.currentConfig.dynamicFilterMode === "off" || !supportsDynamicFilters(window.location.href)) {
        this.resetProcessedItems();
        return;
      }
      for (const element of document.querySelectorAll(".bili-dyn-item")) {
        this.processDynamicItem(element);
      }
    }
    processDynamicItem(element) {
      if (element.getAttribute(PROCESSED_ATTR) === "true") {
        return;
      }
      const match = classifyDynamicItem(element, this.currentConfig);
      if (!match) {
        return;
      }
      const anchor = resolveBadgeAnchor(element);
      if (!anchor?.parentElement) {
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
      badge.parentElement?.insertBefore(toggle, badge.nextSibling);
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
  function hasSponsoredGoodsLink(commentRenderer) {
    const links = commentRenderer.shadowRoot?.querySelector("bili-rich-text")?.shadowRoot?.querySelectorAll("a[data-type='goods']");
    return Boolean(links && links.length > 0);
  }
  function extractCommentText(commentRenderer) {
    const richTextNodes = [
      ...commentRenderer.shadowRoot?.querySelector("bili-rich-text")?.shadowRoot?.querySelectorAll("span, a") ?? []
    ];
    const nodes = [
      ...richTextNodes,
      ...commentRenderer.shadowRoot?.querySelectorAll("#content, .reply-content") ?? []
    ];
    return nodes.map((node) => node.textContent?.trim() ?? "").filter(Boolean).join(" ");
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
    const matches = collectPatternMatches(extractCommentText(commentRenderer), pattern);
    if (matches.length < config.dynamicRegexKeywordMinMatches) {
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
    const renderer = thread.shadowRoot?.querySelector("bili-comment-renderer");
    return renderer instanceof HTMLElement && renderer.shadowRoot ? renderer : null;
  }
  function getReplyTargets(thread) {
    const repliesRenderer = thread.shadowRoot?.querySelector("bili-comment-replies-renderer");
    const repliesRoot = repliesRenderer?.shadowRoot;
    if (!repliesRoot) {
      return [];
    }
    const targets = [];
    for (const reply of repliesRoot.querySelectorAll("bili-comment-reply-renderer")) {
      const renderer = reply.shadowRoot?.querySelector("bili-comment-renderer");
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
    const userInfo = commentRenderer.shadowRoot?.querySelector("bili-comment-user-info");
    const infoRoot = userInfo?.shadowRoot;
    return infoRoot?.querySelector("#user-up") ?? infoRoot?.querySelector("#user-level") ?? null;
  }
  function getContentBody(commentRenderer) {
    return commentRenderer.shadowRoot?.querySelector("#content") ?? null;
  }
  function getActionAnchor(commentRenderer) {
    const actionRenderer = commentRenderer.shadowRoot?.querySelector("#main")?.querySelector("bili-comment-action-buttons-renderer");
    return actionRenderer?.shadowRoot?.querySelector("#reply") ?? getContentBody(commentRenderer);
  }
  function removeInjectedDecorations(commentRenderer) {
    commentRenderer.shadowRoot?.querySelector("bili-comment-user-info")?.shadowRoot?.querySelectorAll(`[${BADGE_ATTR}='true']`).forEach((node) => node.remove());
    commentRenderer.shadowRoot?.querySelector("#main")?.querySelector("bili-comment-action-buttons-renderer")?.shadowRoot?.querySelectorAll(`[${TOGGLE_ATTR}='true']`).forEach((node) => node.remove());
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
    const repliesRenderer = thread.shadowRoot?.querySelector("bili-comment-replies-renderer");
    const repliesRoot = repliesRenderer?.shadowRoot;
    if (!repliesRoot) {
      return;
    }
    repliesRoot.querySelectorAll("bili-comment-reply-renderer").forEach((reply) => {
      reply.style.display = "none";
      reply.setAttribute(REPLIES_HIDDEN_ATTR, "true");
    });
  }
  function restoreReplies(thread) {
    const repliesRenderer = thread.shadowRoot?.querySelector("bili-comment-replies-renderer");
    const repliesRoot = repliesRenderer?.shadowRoot;
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
      this.currentConfig = this.configStore.getSnapshot();
      this.configStore.subscribe((config) => {
        this.currentConfig = config;
        this.resetProcessedThreads();
        this.scheduleRefresh();
      });
    }
    currentConfig;
    rootSweepIntervalId = null;
    documentObserver = null;
    refreshTimerId = null;
    stopObservingUrl = null;
    rootObservers = /* @__PURE__ */ new Map();
    start() {
      this.scheduleRefresh();
      this.stopObservingUrl = observeUrlChanges(() => {
        this.resetProcessedThreads();
        this.scheduleRefresh();
      });
      this.rootSweepIntervalId = window.setInterval(() => {
        this.refresh();
      }, ROOT_REFRESH_INTERVAL_MS);
      this.documentObserver = new MutationObserver(() => {
        this.scheduleRefresh();
      });
      this.documentObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
      window.addEventListener(
        "pagehide",
        () => {
          this.stop();
        },
        { once: true }
      );
    }
    stop() {
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
      this.documentObserver?.disconnect();
      this.documentObserver = null;
      this.disconnectRootObservers();
      this.resetProcessedThreads();
    }
    scheduleRefresh() {
      if (this.refreshTimerId !== null) {
        return;
      }
      this.refreshTimerId = window.setTimeout(() => {
        this.refreshTimerId = null;
        this.refresh();
      }, 160);
    }
    refresh() {
      if (!this.currentConfig.enabled || this.currentConfig.commentFilterMode === "off" || !supportsCommentFilters(window.location.href)) {
        this.disconnectRootObservers();
        this.resetProcessedThreads();
        return;
      }
      const roots = Array.from(document.querySelectorAll("bili-comments"));
      this.syncRootObservers(roots);
      for (const root of roots) {
        this.scanCommentRoot(root);
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
        const observer = new MutationObserver(() => {
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

  // src/ui/styles.ts
  var styles = `
.bsb-tm-entry-button {
  z-index: 2147483645;
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  background: rgba(25, 25, 25, 0.86);
  color: #fff;
  font: 600 12px/1.2 "SF Pro Display", "PingFang SC", sans-serif;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.bsb-tm-entry-button.is-inline {
  position: absolute;
  top: 16px;
  right: 16px;
}

.bsb-tm-entry-button.is-floating {
  position: fixed;
  right: 24px;
  bottom: 24px;
}

.bsb-tm-panel {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 2147483646;
  width: min(420px, calc(100vw - 32px));
  max-height: calc(100vh - 48px);
  overflow: auto;
  border-radius: 18px;
  background: rgba(17, 19, 27, 0.96);
  color: #f8f8f8;
  padding: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(18px);
  display: none;
  font: 14px/1.45 "SF Pro Text", "PingFang SC", sans-serif;
}

.bsb-tm-panel.is-open {
  display: block;
}

.bsb-tm-panel-header,
.bsb-tm-field,
.bsb-tm-category-row,
.bsb-tm-notice-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.bsb-tm-field.stacked {
  align-items: stretch;
  flex-direction: column;
}

.bsb-tm-panel-section + .bsb-tm-panel-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.bsb-tm-form,
.bsb-tm-categories {
  display: grid;
  gap: 12px;
}

.bsb-tm-section-label {
  display: block;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.88);
}

.bsb-tm-button,
.bsb-tm-panel input,
.bsb-tm-panel select {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  padding: 8px 10px;
  font: inherit;
}

.bsb-tm-button {
  cursor: pointer;
}

.bsb-tm-button.compact {
  justify-self: start;
}

.bsb-tm-button.primary {
  background: #00a1d6;
  border-color: #00a1d6;
}

.bsb-tm-button.danger {
  background: #8b2131;
  border-color: #8b2131;
}

.bsb-tm-button.secondary {
  background: rgba(255, 255, 255, 0.08);
}

.bsb-tm-banner {
  margin-bottom: 10px;
  border-radius: 14px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(0, 161, 214, 0.12), rgba(255, 102, 153, 0.18));
  border: 1px solid rgba(0, 161, 214, 0.24);
  color: #0f172a;
  font: 600 13px/1.3 "SF Pro Text", "PingFang SC", sans-serif;
}

.bsb-tm-notice-root {
  position: fixed;
  top: 24px;
  left: 24px;
  z-index: 2147483647;
  display: grid;
  gap: 12px;
  max-width: min(360px, calc(100vw - 32px));
}

.bsb-tm-notice {
  border-radius: 16px;
  padding: 14px;
  background: rgba(11, 15, 23, 0.94);
  color: #fff;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(18px);
}

.bsb-tm-notice-title {
  font-weight: 700;
}

.bsb-tm-notice-message {
  margin-top: 6px;
  opacity: 0.85;
}

@media (max-width: 768px) {
  .bsb-tm-entry-button.is-floating {
    right: 16px;
    bottom: 16px;
  }

  .bsb-tm-panel {
    top: 12px;
    right: 12px;
    width: min(420px, calc(100vw - 24px));
    max-height: calc(100vh - 24px);
  }

  .bsb-tm-notice-root {
    top: 16px;
    left: 16px;
    max-width: calc(100vw - 32px);
  }
}
`;

  // src/main.ts
  async function bootstrap() {
    if (!isSupportedLocation(window.location.href)) {
      return;
    }
    gmAddStyle(styles);
    ensurePageBridge();
    const configStore = new ConfigStore();
    const statsStore = new StatsStore();
    await Promise.all([configStore.load(), statsStore.load()]);
    const controller = new ScriptController(configStore, statsStore);
    const dynamicSponsorController = new DynamicSponsorController(configStore);
    const commentSponsorController = new CommentSponsorController(configStore);
    dynamicSponsorController.start();
    commentSponsorController.start();
    await controller.start();
    gmRegisterMenuCommand("Toggle BSB panel", () => controller.togglePanel());
    gmRegisterMenuCommand("Clear BSB cache", () => {
      void controller.clearCache();
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
