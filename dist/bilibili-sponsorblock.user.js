// ==UserScript==
// @name         Bilibili SponsorBlock Core
// @namespace    https://github.com/FilfTeen/bilibili-sponsorblock-userscript
// @version      0.3.7
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
      yield fn(key, value);
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
      const fn = resolveGrantedFunction("GM_xmlhttpRequest");
      if (typeof fn === "function") {
        try {
          return yield new Promise((resolve, reject) => {
            fn(__spreadProps(__spreadValues({}, options), {
              onload: (response) => {
                resolve({
                  responseText: response.responseText,
                  status: response.status,
                  ok: response.status >= 200 && response.status < 300
                });
              },
              onerror: () => reject(new Error(`Request failed: ${options.method} ${options.url}`)),
              ontimeout: () => reject(new Error(`Request timed out: ${options.method} ${options.url}`))
            }));
          });
        } catch (error) {
          if (typeof fetch === "function") {
            return fetchViaWindow(options);
          }
          throw error;
        }
      }
      return fetchViaWindow(options);
    });
  }

  // src/constants.ts
  var SCRIPT_NAME = "Bilibili SponsorBlock Core";
  var CONFIG_STORAGE_KEY = "bsb_tm_config_v1";
  var STATS_STORAGE_KEY = "bsb_tm_stats_v1";
  var CACHE_STORAGE_KEY = "bsb_tm_cache_v1";
  var USER_ID_STORAGE_KEY = "bsb_tm_user_id_v1";
  var LOCAL_LABEL_STORAGE_KEY = "bsb_tm_local_video_labels_v1";
  var VOTE_HISTORY_STORAGE_KEY = "bsb_tm_vote_history_v1";
  var BRIDGE_FLAG = "__BSB_TM_PAGE_BRIDGE__";
  var REQUEST_TIMEOUT_MS = 8e3;
  var CACHE_TTL_MS = 60 * 60 * 1e3;
  var CACHE_MAX_ENTRIES = 1e3;
  var CACHE_MAX_SIZE_BYTES = 500 * 1024;
  var TICK_INTERVAL_MS = 200;
  var POI_NOTICE_LEAD_SEC = 6;
  var SEGMENT_REWIND_RESET_SEC = 0.5;
  var DEFAULT_DYNAMIC_REGEX_PATTERN = "/618|11(?!1).11(?:\u65E5)?|\u53CC(?:11|\u5341\u4E00|12|\u5341\u4E8C)|\u5973\u795E\u8282|\u5F00\u5B66\u5B63|\u5E74\u8D27\u8282|\u6070(?:\u4E2A|\u4E86|\u5230)?\u996D|\u91D1\u4E3B|\u9080\u8BF7\u7801|\u597D\u7269\u63A8\u8350|(?:\u8D2D\u4E70|\u4F7F\u7528|\u5F00\u7BB1)\u6E05\u5355|(\u4ED6|\u5B83|\u5979)(?:\u4EEC)?\u5BB6(?:\u7684)?|(?:\u8BC4\u8BBA\u533A)?(?:\u9886(?:\u53D6|\u5F20|\u5230)?|\u62A2|\u9001|\u5F97|\u53E0)(?:\u6211\u7684)?(?:\u795E|\u4F18\u60E0|\u7EA2\u5305|\u6298\u6263|\u798F\u5229|\u65E0\u95E8\u69DB|\u9690\u85CF|\u79D8\u5BC6|\u4E13\u5C5E|(?:\u8D85)?\u5927(?:\u989D)?|\u989D\u5916)+(?:\u5238|\u5377|\u52B5|q(?:uan)?)?(?:\u540E|\u5230\u624B|\u4EF7|\u4F7F\u7528|\u4E0B\u5355)?|(?:\u9886|\u62A2|\u5F97|\u9001)(?:\u7EA2\u5305|\u4F18\u60E0|\u5238|\u798F\u5229)|(?:\u4F18\u60E0|(?:\u5238|\u5377|\u52B5)\u540E|\u5230\u624B|\u4FC3\u9500|\u6D3B\u52A8|\u795E)\u4EF7|(?:\u6DD8\u5B9D|tb|\u4EAC\u4E1C|jd|\u72D7\u4E1C|\u62FC\u591A\u591A|pdd|\u5929\u732B|tmall)\u641C\u7D22|(?:\u968F(\u4FBF|\u65F6)|\u4EFB\u610F)(?:\u9000|\u9000\u8D27|\u6362\u8D27)|(?:\u514D\u8D39|\u65E0\u507F)(?:\u6362(?:\u4E2A)?\u65B0|\u66FF\u6362|\u66F4\u6362|\u8BD5\u7528)(?:\u5546\u54C1|\u7269\u54C1)?|(?:\u70B9(?:\u51FB)?|\u6233|\u6765|\u6211)\u8BC4\u8BBA\u533A(?:\u7F6E\u9876)?|(?:\u7ACB\u5373|\u84DD\u94FE|\u94FE\u63A5|\u{1F517})(?:\u8D2D\u4E70|\u4E0B\u5355)|(?:vx|wx|\u5FAE\u4FE1|\u8F6F\u4EF6)\u626B\u7801(?:\u9886)?(?:\u4F18\u60E0|\u7EA2\u5305|\u5238)?|(?:\u6211\u7684)?\u540C\u6B3E(?:[\u7684]?(?:\u63A8\u8350|\u597D\u7269|\u5546\u54C1|\u5165\u624B|\u8D2D\u4E70|\u62E5\u6709|\u5206\u4EAB|\u5B89\u5229)?)|\u6EE1\\d+|\u5927\u4FC3|\u4FC3\u9500|\u6298\u6263|\u7279\u4EF7|\u79D2\u6740|\u5E7F\u544A|\u63A8\u5E7F|\u4F4E\u81F3|\u70ED\u5356|\u62A2\u8D2D|\u65B0\u54C1|\u8C6A\u793C|\u8D60\u54C1|\u5BC6\u4EE4|(?:\u997F\u4E86\u4E48|\u7F8E(?:\u56E2|\u56E3)|\u767E\u5EA6\u5916\u5356|\u8702\u9E1F|\u8FBE\u8FBE|UU\u8DD1\u817F|(?:\u6DD8\u5B9D)?\u95EA\u8D2D)|(?:\u70B9|\u8BA2|\u9001|\u5403)(?:\u5916\u5356|\u9910)|\u5916\u5356(?:\u8282|\u670D\u52A1|\u5E73\u53F0|app)/gi";
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
    sponsor: "\u5546\u5355\u5E7F\u544A",
    selfpromo: "\u81EA\u8350/\u5BFC\u6D41",
    interaction: "\u4E92\u52A8\u5F15\u5BFC",
    intro: "\u7247\u5934",
    outro: "\u7247\u5C3E",
    preview: "\u9884\u544A/\u56DE\u653E",
    padding: "\u586B\u5145\u7A7A\u6BB5",
    music_offtopic: "\u97F3\u4E50\u65E0\u5173\u6BB5",
    poi_highlight: "\u9AD8\u5149\u70B9",
    exclusive_access: "\u72EC\u5BB6\u8BBF\u95EE/\u62A2\u5148\u4F53\u9A8C"
  };
  var CATEGORY_SHORT_LABELS = {
    sponsor: "\u5546",
    selfpromo: "\u8350",
    interaction: "\u4E92",
    intro: "\u5934",
    outro: "\u5C3E",
    preview: "\u9884",
    padding: "\u7A7A",
    music_offtopic: "\u4E50",
    poi_highlight: "\u9AD8",
    exclusive_access: "\u4EAB"
  };
  var CATEGORY_DESCRIPTIONS = {
    sponsor: "\u7B2C\u4E09\u65B9\u5546\u5355\u3001\u63A8\u5E7F\u53E3\u64AD\u3001\u5E26\u8D27\u6216\u660E\u786E\u5546\u4E1A\u5408\u4F5C\u5185\u5BB9\u3002",
    selfpromo: "\u4F5C\u8005\u4E3A\u81EA\u5DF1\u7684\u9891\u9053\u3001\u5E97\u94FA\u3001\u6D3B\u52A8\u6216\u4F5C\u54C1\u5BFC\u6D41\uFF0C\u901A\u5E38\u4E0D\u662F\u7B2C\u4E09\u65B9\u5546\u5355\u3002",
    interaction: "\u5F15\u5BFC\u70B9\u8D5E\u3001\u6295\u5E01\u3001\u5173\u6CE8\u3001\u8BC4\u8BBA\u6216\u4E09\u8FDE\u7684\u4E92\u52A8\u63D0\u9192\u3002",
    intro: "\u6B63\u5F0F\u5185\u5BB9\u5F00\u59CB\u524D\u7684\u7247\u5934\u3001\u54C1\u724C\u7247\u5934\u6216\u5F00\u573A\u52A8\u753B\u3002",
    outro: "\u89C6\u9891\u7ED3\u675F\u540E\u7684\u7247\u5C3E\u3001\u9E23\u8C22\u3001\u7ED3\u5C3E\u52A8\u753B\u6216\u5F15\u5BFC\u6536\u5C3E\u3002",
    preview: "\u4E0B\u671F\u9884\u544A\u3001\u56DE\u653E\u63D0\u793A\u6216\u548C\u4E3B\u5185\u5BB9\u5173\u7CFB\u8F83\u5F31\u7684\u9884\u89C8\u6BB5\u843D\u3002",
    padding: "\u4E3A\u62FC\u63A5\u65F6\u957F\u800C\u4FDD\u7559\u7684\u7A7A\u6BB5\u3001\u9759\u5E27\u3001\u65E0\u4FE1\u606F\u586B\u5145\u5185\u5BB9\u3002",
    music_offtopic: "\u97F3\u4E50\u3001MV \u6216\u548C\u4E3B\u8BDD\u9898\u660E\u663E\u65E0\u5173\u7684\u63D2\u5165\u6BB5\u843D\u3002",
    poi_highlight: "\u9002\u5408\u76F4\u63A5\u8DF3\u5230\u7684\u9AD8\u5149\u65F6\u523B\u6216\u91CD\u70B9\u65F6\u95F4\u70B9\u3002",
    exclusive_access: "\u6574\u652F\u89C6\u9891\u56F4\u7ED5\u514D\u8D39\u6837\u673A\u3001\u62A2\u5148\u4F53\u9A8C\u6216\u72EC\u5BB6\u8BBF\u95EE\u5C55\u5F00\u3002"
  };
  var CATEGORY_COLORS = {
    sponsor: "#d14b45",
    selfpromo: "#d7a43c",
    interaction: "#7c4dff",
    intro: "#2aaecb",
    outro: "#4f46e5",
    preview: "#2f80ed",
    padding: "#64748b",
    music_offtopic: "#e67e22",
    poi_highlight: "#d946ef",
    exclusive_access: "#2f9e72"
  };
  var MODE_LABELS = {
    auto: "\u81EA\u52A8",
    manual: "\u624B\u52A8",
    notice: "\u4EC5\u63D0\u793A",
    off: "\u5173\u95ED"
  };
  var CONTENT_FILTER_MODE_LABELS = {
    hide: "\u9690\u85CF\u5185\u5BB9\u5E76\u4FDD\u7559\u63D0\u793A",
    label: "\u4EC5\u6807\u8BB0\uFF0C\u4E0D\u9690\u85CF",
    off: "\u5173\u95ED"
  };
  var THUMBNAIL_LABEL_MODE_LABELS = {
    overlay: "\u663E\u793A\u5C01\u9762\u9876\u90E8\u77ED\u6807\u7B7E",
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
  var DEFAULT_LABEL_TRANSPARENCY = {
    titleBadge: false,
    thumbnailLabel: false,
    commentBadge: false,
    commentLocation: false,
    dynamicBadge: false
  };
  var DEFAULT_CONFIG = {
    enabled: true,
    serverAddress: "https://www.bsbsb.top",
    enableCache: true,
    noticeDurationSec: 4,
    minDurationSec: 0,
    showPreviewBar: true,
    compactVideoHeader: true,
    compactHeaderPlaceholderVisible: false,
    compactHeaderSearchPlaceholderEnabled: false,
    thumbnailLabelMode: "overlay",
    categoryModes: DEFAULT_CATEGORY_MODES,
    categoryColorOverrides: {},
    labelTransparency: DEFAULT_LABEL_TRANSPARENCY,
    dynamicFilterMode: "off",
    dynamicRegexPattern: DEFAULT_DYNAMIC_REGEX_PATTERN,
    dynamicRegexKeywordMinMatches: 1,
    commentFilterMode: "off",
    commentLocationEnabled: true,
    commentHideReplies: false,
    commentIpColor: "#60a5fa",
    commentAdColor: "#ff6b66",
    mbgaEnabled: true,
    mbgaBlockTracking: true,
    mbgaDisablePcdn: true,
    mbgaCleanUrl: true,
    mbgaSimplifyUi: true
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

  // src/utils/commercial-intent.ts
  var BENIGN_CONTEXT_PATTERN = /广告位|广告学|推广曲|推广大使|同款(?:bgm|BGM|音乐|滤镜)|团购课|营销课|(?:分享|讨论)广告/iu;
  var VIDEO_BENIGN_TOPIC_PATTERN = /(?:普通)?(?:测评|评测)|体验(?:记录|分享|感受)|发布会|展会|开放日|媒体日|活动记录|现场(?:体验|直击)?|新品(?:解析|说明)|技术说明|参数对比/iu;
  var DISCLAIMER_PATTERN = /(?:不是|并非|完全不算|真不是)(?:广告|商单|恰饭)|(?:无广|无广告|无赞助|非商单|非广告|自费购买|自费购入|自己买的|个人自费|无商业合作|没收钱|未收钱|没有接广告|自己花钱买的|自掏腰包)/iu;
  var NEGATED_MATCH_PREFIX_PATTERN = /(?:无|没|没有|非|不是|并非|不算|并不是|未|并无|别|勿)$/u;
  var SPONSOR_STRONG_RULES = [
    { token: "\u5546\u5355", pattern: /商单|恰饭|金主/iu, weight: 4.2 },
    { token: "\u8D5E\u52A9", pattern: /本期视频由|由.+赞助|感谢.+赞助|赞助播出|品牌支持|官方支持|合作伙伴/iu, weight: 4.1 },
    { token: "\u5546\u52A1\u5408\u4F5C", pattern: /商务合作|商业合作|品牌合作|联合出品|合作推广/iu, weight: 3.9 },
    { token: "\u5546\u54C1\u5361", pattern: /商品卡|店铺橱窗|购物车|蓝链|专属链接/iu, weight: 3.8 },
    { token: "\u4F18\u60E0\u5238", pattern: /优惠(?:券|卷|劵)|折扣码|密令|红包|返利|返现/iu, weight: 3.4 },
    {
      token: "\u8D2D\u4E70\u6307\u5F15",
      pattern: /(?:立即|直接|马上|点击|戳|去)[^。！？\n]{0,6}(?:下单|购买)|(?:下单|购买)(?:链接|入口|方式|清单)|购买链接|购买清单|使用清单|开箱清单|评论区(?:置顶)?[^。！？\n]{0,10}(?:链接|蓝链|商品卡|领券|购买|下单)/iu,
      weight: 3.3
    }
  ];
  var SPONSOR_SUPPORT_RULES = [
    { token: "\u5E7F\u544A", pattern: /广告|推广|促销|大促|特价|秒杀|热卖/iu, weight: 1.2 },
    { token: "\u9886\u5238", pattern: /领(?:券|红包|福利)|抢(?:券|红包|福利)|满\d+|低至|到手价/iu, weight: 1.35 },
    { token: "\u7535\u5546\u5E73\u53F0", pattern: /淘宝|天猫|京东|拼多多|pdd|闲鱼|得物|抖音商城/iu, weight: 1.25 },
    { token: "\u5BFC\u8D2D\u8BCD", pattern: /同款|安利|好物推荐|购物清单|推荐清单|入手建议/iu, weight: 1.05 },
    { token: "\u5916\u5356\u5BFC\u6D41", pattern: /(?:饿了么|美团|闪购|外卖)(?:红包|优惠|福利|券|平台|活动|服务)?/iu, weight: 0.95 }
  ];
  var SELFPROMO_RULES = [
    { token: "\u81EA\u5BB6\u5E97\u94FA", pattern: /(?:我的|本)?(?:店铺|小店|橱窗|闲鱼店|店里|群里)/iu, weight: 2.3 },
    { token: "\u81EA\u5BB6\u9891\u9053", pattern: /(?:我的|本)?(?:频道|直播间|主页|专栏|播客|作品|活动)/iu, weight: 1.9 },
    { token: "\u81EA\u8350\u5BFC\u6D41", pattern: /自荐|导流|安利|收藏夹|合集|置顶看(?:我|简介)|主页见/iu, weight: 1.7 },
    { token: "\u9080\u8BF7\u7801", pattern: /邀请码|体验码|兑换码|注册码/iu, weight: 1.8 }
  ];
  var EXCLUSIVE_RULES = [
    { token: "\u72EC\u5BB6\u8BBF\u95EE", pattern: /独家(?:访问|探访|体验)?|独家首发/iu, weight: 3.2 },
    { token: "\u62A2\u5148\u4F53\u9A8C", pattern: /抢先体验|提前体验|抢先上手|首批体验|先行版/iu, weight: 3 },
    { token: "\u9996\u53D1", pattern: /首发|首批|首个|最先/iu, weight: 2.1 },
    { token: "\u5DE5\u7A0B\u673A", pattern: /工程机|样机|内测|beta|试玩|预览版|体验版/iu, weight: 2.4 }
  ];
  var CTA_ACTION_PATTERN = /点击|点开|点进|戳|打开|去|领取|领|抢|下单|购买|买|入手|搜索|看我|看主页|主页见|置顶看我/iu;
  var CTA_SURFACE_PATTERN = /评论区(?:置顶)?|蓝链|链接|商品卡|店铺|橱窗|主页|频道|直播间|专栏|收藏夹|合集/iu;
  var CTA_BENEFIT_PATTERN = /优惠(?:券|卷|劵)|红包|福利|返利|返现|折扣|到手价|密令/iu;
  var CTA_PURCHASE_PATTERN = /下单|购买|买|入手/u;
  var CTA_OWNED_SURFACE_PATTERN = /(?:我的|本)?(?:店铺|小店|橱窗|主页|频道|直播间|专栏|收藏夹|合集)/iu;
  var QUOTED_OR_MOCKING_CONTEXT_PATTERN = /玩梗|整活|反串|阴阳怪气|吐槽|调侃|引用|复读|照搬|原话|话术|文案|笑死|绷不住|尬|土味|逆天|离谱|“[^”]{0,24}(?:广告|推广|优惠券|购买|下单|链接)[^”]{0,24}”|"[^"]{0,24}(?:广告|推广|优惠券|购买|下单|链接)[^"]{0,24}"/iu;
  function normalizeText(text) {
    return text.replace(/\s+/gu, " ").trim();
  }
  function unique(values) {
    return [...new Set([...values].map((value) => value.trim()).filter(Boolean))];
  }
  function hasNonNegatedPattern(text, pattern) {
    var _a;
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const globalPattern = new RegExp(pattern.source, flags);
    for (const result of text.matchAll(globalPattern)) {
      const matchedText = result[0];
      const startIndex = (_a = result.index) != null ? _a : text.indexOf(matchedText);
      if (startIndex < 0 || isNegatedMatch(text, startIndex)) {
        continue;
      }
      return true;
    }
    return false;
  }
  function isNegatedMatch(text, startIndex) {
    const prefix = text.slice(Math.max(0, startIndex - 8), startIndex).replace(/\s+/gu, "");
    return NEGATED_MATCH_PREFIX_PATTERN.test(prefix);
  }
  function inspectCommercialActionability(text) {
    const normalized = normalizeText(text);
    if (!normalized) {
      return {
        hasActionVerb: false,
        hasCommerceSurface: false,
        hasBenefitCue: false,
        hasPurchaseCue: false,
        hasOwnedSurface: false,
        hasOwnedActionLead: false,
        hasStrongClosure: false,
        hasQuotedOrMockingContext: false
      };
    }
    const hasActionVerb = hasNonNegatedPattern(normalized, CTA_ACTION_PATTERN);
    const hasCommerceSurface = hasNonNegatedPattern(normalized, CTA_SURFACE_PATTERN);
    const hasBenefitCue = hasNonNegatedPattern(normalized, CTA_BENEFIT_PATTERN);
    const hasPurchaseCue = hasNonNegatedPattern(normalized, CTA_PURCHASE_PATTERN);
    const hasOwnedSurface = hasNonNegatedPattern(normalized, CTA_OWNED_SURFACE_PATTERN);
    const hasOwnedActionLead = hasOwnedSurface && (hasActionVerb || /主页见|置顶看我/iu.test(normalized));
    const hasStrongClosure = hasActionVerb && hasCommerceSurface || hasBenefitCue && (hasCommerceSurface || hasPurchaseCue) || hasPurchaseCue && hasCommerceSurface || hasOwnedActionLead;
    return {
      hasActionVerb,
      hasCommerceSurface,
      hasBenefitCue,
      hasPurchaseCue,
      hasOwnedSurface,
      hasOwnedActionLead,
      hasStrongClosure,
      hasQuotedOrMockingContext: QUOTED_OR_MOCKING_CONTEXT_PATTERN.test(normalized)
    };
  }
  function collectRuleHits(text, rules) {
    const matches = [];
    let score = 0;
    for (const rule of rules) {
      if (hasNonNegatedPattern(text, rule.pattern)) {
        matches.push(rule.token);
        score += rule.weight;
      }
    }
    return {
      score,
      matches
    };
  }
  function deriveReason(category, matches) {
    const joined = matches.slice(0, 4).join(" / ");
    if (category === "exclusive_access") {
      return joined ? `\u9875\u9762\u51FA\u73B0\u62A2\u5148\u4F53\u9A8C\u7EBF\u7D22\uFF1A${joined}` : "\u9875\u9762\u51FA\u73B0\u62A2\u5148\u4F53\u9A8C\u7EBF\u7D22";
    }
    if (category === "selfpromo") {
      return joined ? `\u9875\u9762\u51FA\u73B0\u81EA\u8350\u5BFC\u6D41\u7EBF\u7D22\uFF1A${joined}` : "\u9875\u9762\u51FA\u73B0\u81EA\u8350\u5BFC\u6D41\u7EBF\u7D22";
    }
    return joined ? `\u9875\u9762\u51FA\u73B0\u5546\u4E1A\u5408\u4F5C\u7EBF\u7D22\uFF1A${joined}` : "\u9875\u9762\u51FA\u73B0\u5546\u4E1A\u5408\u4F5C\u7EBF\u7D22";
  }
  function clampConfidence(score) {
    return Math.min(0.96, Math.max(0.56, 0.58 + score * 0.045));
  }
  function analyzeCommercialIntent(text, options = {}) {
    var _a, _b;
    const normalized = normalizeText(text);
    if (!normalized) {
      return {
        category: null,
        confidence: 0,
        reason: null,
        matches: [],
        sponsorScore: 0,
        selfpromoScore: 0,
        exclusiveScore: 0
      };
    }
    const minMatches = Math.max(1, (_a = options.minMatches) != null ? _a : 1);
    const storedMatches = unique((_b = options.storedMatches) != null ? _b : []);
    const sponsorStrong = collectRuleHits(normalized, SPONSOR_STRONG_RULES);
    const sponsorSupport = collectRuleHits(normalized, SPONSOR_SUPPORT_RULES);
    const selfpromo = collectRuleHits(normalized, SELFPROMO_RULES);
    const exclusive = collectRuleHits(normalized, EXCLUSIVE_RULES);
    let sponsorScore = sponsorStrong.score + sponsorSupport.score;
    let selfpromoScore = selfpromo.score;
    let exclusiveScore = exclusive.score;
    const hasExplicitCTA = /评论区(?:置顶)?|(?:购买|下单|点击|打开).{0,8}(?:链接|蓝链)|(?:领|抢)(?:券|红包|福利)|优惠(?:券|卷|劵)|商品卡/iu.test(
      normalized
    );
    const hasOwnedSurface = /(?:我的|本)?(?:频道|店铺|小店|橱窗|直播间|主页|作品|活动|课程|专栏)/iu.test(normalized);
    const benignContext = BENIGN_CONTEXT_PATTERN.test(normalized);
    const benignVideoTopic = VIDEO_BENIGN_TOPIC_PATTERN.test(normalized);
    if (benignContext && sponsorStrong.score === 0 && exclusive.score === 0 && !hasExplicitCTA && !hasOwnedSurface) {
      return {
        category: null,
        confidence: 0,
        reason: null,
        matches: storedMatches,
        sponsorScore: 0,
        selfpromoScore: 0,
        exclusiveScore: 0
      };
    }
    if (storedMatches.length >= minMatches) {
      sponsorScore += 1.05 + Math.min(1.2, storedMatches.length * 0.24);
      selfpromoScore += 0.72 + Math.min(0.9, storedMatches.length * 0.18);
    }
    if (hasExplicitCTA) {
      sponsorScore += 1.45;
    }
    if (hasOwnedSurface && /(?:评论区|置顶|链接|主页|店铺|橱窗|直播间)/iu.test(normalized)) {
      selfpromoScore += 1.4;
    }
    if (DISCLAIMER_PATTERN.test(normalized) && sponsorStrong.score < 4.1) {
      sponsorScore = Math.max(0, sponsorScore - 2.8);
      selfpromoScore = Math.max(0, selfpromoScore - 1.1);
    }
    if (benignContext && sponsorStrong.score === 0 && selfpromoScore < 2.8) {
      sponsorScore = Math.max(0, sponsorScore - 1.8);
      selfpromoScore = Math.max(0, selfpromoScore - 1.5);
    }
    if (benignVideoTopic && sponsorStrong.score === 0 && !hasExplicitCTA) {
      sponsorScore = Math.max(0, sponsorScore - 1.9);
      selfpromoScore = Math.max(0, selfpromoScore - 0.9);
    }
    let category = null;
    if (exclusiveScore >= 2.2 && exclusiveScore >= sponsorScore + 0.35 && exclusiveScore >= selfpromoScore + 0.2) {
      category = "exclusive_access";
    } else if (sponsorScore >= 3.1 || sponsorScore >= 2.35 && storedMatches.length >= minMatches) {
      category = "sponsor";
    } else if (selfpromoScore >= 2.2 || selfpromoScore >= 1.85 && storedMatches.length >= minMatches) {
      category = sponsorScore >= selfpromoScore + 0.7 ? "sponsor" : "selfpromo";
    }
    if (!category) {
      return {
        category: null,
        confidence: 0,
        reason: null,
        matches: unique([...storedMatches, ...sponsorStrong.matches, ...sponsorSupport.matches, ...selfpromo.matches, ...exclusive.matches]),
        sponsorScore,
        selfpromoScore,
        exclusiveScore
      };
    }
    const categoryMatches = category === "exclusive_access" ? unique([...exclusive.matches, ...storedMatches]) : category === "selfpromo" ? unique([...selfpromo.matches, ...storedMatches, ...sponsorSupport.matches.filter((value) => value !== "\u5E7F\u544A")]) : unique([...sponsorStrong.matches, ...sponsorSupport.matches, ...storedMatches]);
    const strongestScore = category === "exclusive_access" ? exclusiveScore : category === "selfpromo" ? selfpromoScore : sponsorScore;
    return {
      category,
      confidence: clampConfidence(strongestScore),
      reason: deriveReason(category, categoryMatches),
      matches: categoryMatches,
      sponsorScore,
      selfpromoScore,
      exclusiveScore
    };
  }
  function isBenignCommercialContext(text) {
    return BENIGN_CONTEXT_PATTERN.test(normalizeText(text));
  }

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
    if (isBenignCommercialContext(normalizedText)) {
      return false;
    }
    const effectiveThreshold = Math.max(1, minMatches);
    const assessment = analyzeCommercialIntent(normalizedText, {
      storedMatches: matches,
      minMatches: effectiveThreshold
    });
    return Boolean(assessment.category);
  }

  // src/utils/color.ts
  var NEAR_WHITE_LUMINANCE_THRESHOLD = 0.82;
  var NEAR_WHITE_MIN_CHANNEL = 232;
  function clampChannel(value) {
    return Math.max(0, Math.min(255, Math.round(value)));
  }
  function normalizeHexColor(value) {
    if (typeof value !== "string") {
      return null;
    }
    const input = value.trim();
    const shortHex = /^#([0-9a-f]{3})$/iu.exec(input);
    if (shortHex) {
      const [r, g, b] = shortHex[1].split("");
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    const fullHex = /^#([0-9a-f]{6})$/iu.exec(input);
    if (fullHex) {
      return `#${fullHex[1].toLowerCase()}`;
    }
    return null;
  }
  function hexToRgb(hexColor) {
    const normalized = normalizeHexColor(hexColor);
    if (!normalized) {
      throw new Error(`Invalid hex color: ${hexColor}`);
    }
    return {
      r: Number.parseInt(normalized.slice(1, 3), 16),
      g: Number.parseInt(normalized.slice(3, 5), 16),
      b: Number.parseInt(normalized.slice(5, 7), 16)
    };
  }
  function rgba(hexColor, alpha) {
    const { r, g, b } = hexToRgb(hexColor);
    const normalizedAlpha = Math.max(0, Math.min(1, alpha));
    return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha})`;
  }
  function mixColors(hexColor, mixWith, ratio) {
    const base = hexToRgb(hexColor);
    const mix = hexToRgb(mixWith);
    const normalizedRatio = Math.max(0, Math.min(1, ratio));
    const inverseRatio = 1 - normalizedRatio;
    const r = clampChannel(base.r * inverseRatio + mix.r * normalizedRatio);
    const g = clampChannel(base.g * inverseRatio + mix.g * normalizedRatio);
    const b = clampChannel(base.b * inverseRatio + mix.b * normalizedRatio);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }
  function relativeLuminance({ r, g, b }) {
    const channel = (value) => {
      const normalized = value / 255;
      return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  }
  function getReadableTextColor(hexColor) {
    return relativeLuminance(hexToRgb(hexColor)) > 0.56 ? "#0f172a" : "#ffffff";
  }
  function isNearWhiteColor(hexColor) {
    const rgb = hexToRgb(hexColor);
    return relativeLuminance(rgb) > NEAR_WHITE_LUMINANCE_THRESHOLD && Math.min(rgb.r, rgb.g, rgb.b) >= NEAR_WHITE_MIN_CHANNEL;
  }
  function resolveTransparentGlassVariant(hexColor) {
    return isNearWhiteColor(hexColor) ? "light" : "dark";
  }
  function resolveGlassDisplayAccent(hexColor) {
    return isNearWhiteColor(hexColor) ? mixColors(hexColor, "#94a3b8", 0.72) : hexColor;
  }
  function resolveCategoryAccent(category, overrides) {
    var _a;
    return (_a = normalizeHexColor(overrides == null ? void 0 : overrides[category])) != null ? _a : CATEGORY_COLORS[category];
  }
  function resolveCategoryStyle(category, overrides) {
    const accent = resolveCategoryAccent(category, overrides);
    const accentStrong = mixColors(accent, "#0f172a", 0.12);
    const transparentVariant = resolveTransparentGlassVariant(accent);
    return {
      accent,
      accentStrong,
      contrast: getReadableTextColor(accent),
      darkContrast: getReadableTextColor(accentStrong),
      softSurface: rgba(accent, 0.16),
      softBorder: rgba(accent, 0.3),
      glassSurface: mixColors(accent, "#ffffff", 0.86),
      glassBorder: rgba(accent, 0.4),
      darkSurface: rgba(accentStrong, 0.88),
      transparentVariant,
      transparentDisplayAccent: resolveGlassDisplayAccent(accent)
    };
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
      categoryModes: __spreadValues({}, DEFAULT_CONFIG.categoryModes),
      categoryColorOverrides: __spreadValues({}, DEFAULT_CONFIG.categoryColorOverrides),
      labelTransparency: __spreadValues({}, DEFAULT_CONFIG.labelTransparency)
    });
  }
  function normalizeConfig(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A;
    const next = cloneDefaultConfig();
    if (!input) {
      return next;
    }
    const migratedFromOlderBuild = typeof input.showPreviewBar !== "boolean" || typeof input.thumbnailLabelMode !== "string";
    next.enabled = (_a = input.enabled) != null ? _a : next.enabled;
    next.enableCache = (_b = input.enableCache) != null ? _b : next.enableCache;
    next.showPreviewBar = (_c = input.showPreviewBar) != null ? _c : next.showPreviewBar;
    next.compactVideoHeader = (_d = input.compactVideoHeader) != null ? _d : next.compactVideoHeader;
    next.compactHeaderPlaceholderVisible = (_e = input.compactHeaderPlaceholderVisible) != null ? _e : next.compactHeaderPlaceholderVisible;
    next.compactHeaderSearchPlaceholderEnabled = (_f = input.compactHeaderSearchPlaceholderEnabled) != null ? _f : next.compactHeaderSearchPlaceholderEnabled;
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
    next.commentLocationEnabled = (_g = input.commentLocationEnabled) != null ? _g : next.commentLocationEnabled;
    next.commentHideReplies = (_h = input.commentHideReplies) != null ? _h : next.commentHideReplies;
    next.commentIpColor = (_i = normalizeHexColor(input.commentIpColor)) != null ? _i : next.commentIpColor;
    next.commentAdColor = (_j = normalizeHexColor(input.commentAdColor)) != null ? _j : next.commentAdColor;
    next.labelTransparency = {
      titleBadge: (_l = (_k = input.labelTransparency) == null ? void 0 : _k.titleBadge) != null ? _l : next.labelTransparency.titleBadge,
      thumbnailLabel: (_n = (_m = input.labelTransparency) == null ? void 0 : _m.thumbnailLabel) != null ? _n : next.labelTransparency.thumbnailLabel,
      commentBadge: (_p = (_o = input.labelTransparency) == null ? void 0 : _o.commentBadge) != null ? _p : next.labelTransparency.commentBadge,
      commentLocation: (_r = (_q = input.labelTransparency) == null ? void 0 : _q.commentLocation) != null ? _r : next.labelTransparency.commentLocation,
      dynamicBadge: (_t = (_s = input.labelTransparency) == null ? void 0 : _s.dynamicBadge) != null ? _t : next.labelTransparency.dynamicBadge
    };
    next.mbgaEnabled = (_u = input.mbgaEnabled) != null ? _u : next.mbgaEnabled;
    next.mbgaBlockTracking = (_v = input.mbgaBlockTracking) != null ? _v : next.mbgaBlockTracking;
    next.mbgaDisablePcdn = (_w = input.mbgaDisablePcdn) != null ? _w : next.mbgaDisablePcdn;
    next.mbgaCleanUrl = (_x = input.mbgaCleanUrl) != null ? _x : next.mbgaCleanUrl;
    next.mbgaSimplifyUi = (_y = input.mbgaSimplifyUi) != null ? _y : next.mbgaSimplifyUi;
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
      const value = (_z = input.categoryModes) == null ? void 0 : _z[category];
      if (value && isCategoryMode(value)) {
        next.categoryModes[category] = value;
      }
      const categoryColor = normalizeHexColor((_A = input.categoryColorOverrides) == null ? void 0 : _A[category]);
      if (categoryColor) {
        next.categoryColorOverrides[category] = categoryColor;
      }
    }
    return next;
  }
  var ConfigStore = class {
    constructor() {
      __publicField(this, "config", cloneDefaultConfig());
      __publicField(this, "listeners", /* @__PURE__ */ new Set());
    }
    notifyListeners() {
      const snapshot = this.getSnapshot();
      for (const listener of this.listeners) {
        listener(snapshot);
      }
    }
    load() {
      return __async(this, null, function* () {
        this.config = normalizeConfig(yield gmGetValue(CONFIG_STORAGE_KEY, null));
        return this.getSnapshot();
      });
    }
    getSnapshot() {
      return __spreadProps(__spreadValues({}, this.config), {
        categoryModes: __spreadValues({}, this.config.categoryModes),
        categoryColorOverrides: __spreadValues({}, this.config.categoryColorOverrides),
        labelTransparency: __spreadValues({}, this.config.labelTransparency)
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
        const previous = this.getSnapshot();
        const next = normalizeConfig(updater(previous));
        this.config = next;
        this.notifyListeners();
        try {
          yield gmSetValue(CONFIG_STORAGE_KEY, this.config);
        } catch (error) {
          this.config = previous;
          this.notifyListeners();
          throw error;
        }
        return this.getSnapshot();
      });
    }
    reset() {
      return __async(this, null, function* () {
        const previous = this.getSnapshot();
        this.config = cloneDefaultConfig();
        this.notifyListeners();
        try {
          yield gmSetValue(CONFIG_STORAGE_KEY, null);
        } catch (error) {
          this.config = previous;
          this.notifyListeners();
          throw error;
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
      __publicField(this, "persistPromise", null);
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
        if (this.persistPromise) {
          return this.persistPromise;
        }
        this.persistPromise = new Promise((resolve) => {
          window.setTimeout(() => __async(this, null, function* () {
            this.persistPromise = null;
            this.cleanupExpired();
            this.evictOverflow();
            if (Object.keys(this.payload.entries).length === 0) {
              yield gmSetValue(CACHE_STORAGE_KEY, null);
            } else {
              yield gmSetValue(CACHE_STORAGE_KEY, this.payload);
            }
            resolve();
          }), 200);
        });
        return this.persistPromise;
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

  // src/core/local-label-store.ts
  var MAX_LOCAL_VIDEO_LABELS = 400;
  function isCategory(value) {
    return value === "sponsor" || value === "selfpromo" || value === "interaction" || value === "intro" || value === "outro" || value === "preview" || value === "padding" || value === "music_offtopic" || value === "poi_highlight" || value === "exclusive_access";
  }
  function isSource(value) {
    return value === "comment-goods" || value === "comment-suspicion" || value === "page-heuristic" || value === "manual" || value === "manual-dismiss";
  }
  function normalizeRecord(input) {
    if (!input || typeof input !== "object") {
      return null;
    }
    const category = input.category === null ? null : typeof input.category === "string" && isCategory(input.category) ? input.category : null;
    const source = typeof input.source === "string" && isSource(input.source) ? input.source : null;
    const confidence = Number.isFinite(input.confidence) ? Math.min(1, Math.max(0, Number(input.confidence))) : 0.5;
    const updatedAt = Number.isFinite(input.updatedAt) ? Math.max(0, Number(input.updatedAt)) : Date.now();
    const reason = typeof input.reason === "string" && input.reason.trim().length > 0 ? input.reason.trim() : void 0;
    if (!source) {
      return null;
    }
    return {
      category,
      source,
      confidence,
      updatedAt,
      reason
    };
  }
  function normalizePayload2(input) {
    const records = /* @__PURE__ */ new Map();
    if (!input || typeof input !== "object") {
      return records;
    }
    for (const [videoId, rawRecord] of Object.entries(input)) {
      if (!videoId.startsWith("BV")) {
        continue;
      }
      const record = normalizeRecord(rawRecord);
      if (record) {
        records.set(videoId, record);
      }
    }
    return pruneRecords(records);
  }
  function pruneRecords(records) {
    if (records.size <= MAX_LOCAL_VIDEO_LABELS) {
      return records;
    }
    const sorted = [...records.entries()].sort((left, right) => right[1].updatedAt - left[1].updatedAt);
    return new Map(sorted.slice(0, MAX_LOCAL_VIDEO_LABELS));
  }
  function serializeRecords(records) {
    return Object.fromEntries(records);
  }
  var LocalVideoLabelStore = class {
    constructor() {
      __publicField(this, "records", /* @__PURE__ */ new Map());
    }
    load() {
      return __async(this, null, function* () {
        this.records = normalizePayload2(yield gmGetValue(LOCAL_LABEL_STORAGE_KEY, null));
      });
    }
    getResolved(videoId) {
      const record = this.records.get(videoId);
      if (!record || !record.category || record.source === "manual-dismiss") {
        return null;
      }
      return __spreadValues({}, record);
    }
    isDismissed(videoId) {
      const record = this.records.get(videoId);
      return Boolean(record && record.category === null && record.source === "manual-dismiss");
    }
    rememberSignal(videoId, signal) {
      return __async(this, null, function* () {
        if (!videoId.startsWith("BV")) {
          return;
        }
        const existing = this.records.get(videoId);
        if ((existing == null ? void 0 : existing.source) === "manual-dismiss") {
          return;
        }
        if ((existing == null ? void 0 : existing.source) === "manual" && existing.category) {
          return;
        }
        if ((existing == null ? void 0 : existing.category) === signal.category && existing.source === signal.source && existing.confidence >= signal.confidence) {
          return;
        }
        this.records.set(videoId, {
          category: signal.category,
          source: signal.source,
          confidence: signal.confidence,
          updatedAt: Date.now(),
          reason: signal.reason
        });
        this.records = pruneRecords(this.records);
        yield gmSetValue(LOCAL_LABEL_STORAGE_KEY, serializeRecords(this.records));
      });
    }
    rememberManual(videoId, category, reason = "\u624B\u52A8\u786E\u8BA4\u672C\u5730\u6807\u7B7E") {
      return __async(this, null, function* () {
        if (!videoId.startsWith("BV")) {
          return;
        }
        this.records.set(videoId, {
          category,
          source: "manual",
          confidence: 1,
          updatedAt: Date.now(),
          reason
        });
        this.records = pruneRecords(this.records);
        yield gmSetValue(LOCAL_LABEL_STORAGE_KEY, serializeRecords(this.records));
      });
    }
    dismiss(videoId, reason = "\u624B\u52A8\u5FFD\u7565\u672C\u5730\u6807\u7B7E") {
      return __async(this, null, function* () {
        if (!videoId.startsWith("BV")) {
          return;
        }
        this.records.set(videoId, {
          category: null,
          source: "manual-dismiss",
          confidence: 1,
          updatedAt: Date.now(),
          reason
        });
        this.records = pruneRecords(this.records);
        yield gmSetValue(LOCAL_LABEL_STORAGE_KEY, serializeRecords(this.records));
      });
    }
  };

  // src/core/vote-history-store.ts
  var MAX_VOTE_HISTORY = 2e3;
  function normalizePayload3(input) {
    const records = /* @__PURE__ */ new Map();
    if (!input || typeof input !== "object") {
      return records;
    }
    for (const [uuid, updatedAt] of Object.entries(input)) {
      if (typeof uuid !== "string" || uuid.length === 0 || !Number.isFinite(updatedAt)) {
        continue;
      }
      records.set(uuid, Math.max(0, Number(updatedAt)));
    }
    return pruneRecords2(records);
  }
  function pruneRecords2(records) {
    if (records.size <= MAX_VOTE_HISTORY) {
      return records;
    }
    const sorted = [...records.entries()].sort((left, right) => right[1] - left[1]);
    return new Map(sorted.slice(0, MAX_VOTE_HISTORY));
  }
  function serializeRecords2(records) {
    return Object.fromEntries(records);
  }
  var VoteHistoryStore = class {
    constructor() {
      __publicField(this, "records", /* @__PURE__ */ new Map());
    }
    load() {
      return __async(this, null, function* () {
        this.records = normalizePayload3(yield gmGetValue(VOTE_HISTORY_STORAGE_KEY, null));
      });
    }
    has(uuid) {
      return this.records.has(uuid);
    }
    remember(uuid) {
      return __async(this, null, function* () {
        if (!uuid) {
          return;
        }
        this.records.set(uuid, Date.now());
        this.records = pruneRecords2(this.records);
        yield gmSetValue(VOTE_HISTORY_STORAGE_KEY, serializeRecords2(this.records));
      });
    }
  };

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

  // src/core/user-id.ts
  function generateUserId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    const random = Math.random().toString(36).slice(2);
    return `bsb-${Date.now().toString(36)}-${random}`;
  }
  function ensureUserId() {
    return __async(this, null, function* () {
      const existing = yield gmGetValue(USER_ID_STORAGE_KEY, null);
      if (typeof existing === "string" && existing.trim().length > 0) {
        return existing;
      }
      const created = generateUserId();
      yield gmSetValue(USER_ID_STORAGE_KEY, created);
      return created;
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
    vote(uuid, type, config) {
      return __async(this, null, function* () {
        var _a;
        const normalizedServer = (_a = normalizeServerAddress(config.serverAddress)) != null ? _a : config.serverAddress;
        const userId = yield ensureUserId();
        const url = buildUrl(
          normalizedServer,
          `/api/voteOnSponsorTime?UUID=${encodeURIComponent(uuid)}&userID=${encodeURIComponent(userId)}&type=${type}`
        );
        try {
          const response = yield gmXmlHttpRequest({
            method: "POST",
            url,
            timeout: REQUEST_TIMEOUT_MS
          });
          if (response.ok || response.status === 429) {
            return {
              successType: 1,
              statusCode: response.status,
              responseText: response.responseText
            };
          }
          if (response.status === 405) {
            return {
              successType: 0,
              statusCode: response.status,
              responseText: response.responseText
            };
          }
          return {
            successType: -1,
            statusCode: response.status,
            responseText: response.responseText
          };
        } catch (error) {
          return {
            successType: -1,
            statusCode: -1,
            responseText: error instanceof Error ? error.message : "Vote request failed"
          };
        }
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

  // src/core/whole-video-label.ts
  function buildWholeVideoLabelSegment(bvid, category, config) {
    return {
      UUID: `video-label:${bvid}:${category}`,
      category,
      actionType: "full",
      segment: [0, 0],
      start: 0,
      end: 0,
      duration: 0,
      mode: config.categoryModes[category]
    };
  }
  function resolveWholeVideoLabels(bvid, segments, labelCategory, config) {
    const fullSegments = segments.filter((segment) => segment.actionType === "full");
    if (fullSegments.length > 0) {
      return fullSegments;
    }
    if (!labelCategory || config.categoryModes[labelCategory] === "off") {
      return [];
    }
    return [buildWholeVideoLabelSegment(bvid, labelCategory, config)];
  }
  function resolveWholeVideoCategory(bvid, segments, labelCategory, config) {
    var _a, _b;
    return (_b = (_a = resolveWholeVideoLabels(bvid, segments, labelCategory, config)[0]) == null ? void 0 : _a.category) != null ? _b : null;
  }

  // src/ui/icons.ts
  var SVG_NS = "http://www.w3.org/2000/svg";
  function createSvg(viewBox) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", viewBox);
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    return svg;
  }
  function createPath(pathData) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", pathData);
    return path;
  }
  function createCircle(cx, cy, radius) {
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", String(cx));
    circle.setAttribute("cy", String(cy));
    circle.setAttribute("r", String(radius));
    return circle;
  }
  function createPolyline(points) {
    const polyline = document.createElementNS(SVG_NS, "polyline");
    polyline.setAttribute("points", points);
    return polyline;
  }
  function createSponsorShieldIcon() {
    const svg = createSvg("0 0 24 24");
    const outer = createPath(
      "M12 2.2c3.88 0 7.26 2.62 8.2 6.37.66 2.66-.06 5.55-1.95 7.59a9.83 9.83 0 0 1-6.25 3.16 9.7 9.7 0 0 1-8.46-3.64 9.42 9.42 0 0 1-1.76-7.17A9.87 9.87 0 0 1 12 2.2Z"
    );
    outer.setAttribute("fill", "none");
    outer.setAttribute("stroke", "currentColor");
    outer.setAttribute("stroke-width", "1.7");
    outer.setAttribute("stroke-linejoin", "round");
    const play = createPath("M10.1 8.4 15.6 12l-5.5 3.6Z");
    play.setAttribute("fill", "currentColor");
    const orbit = createCircle(17.55, 17.1, 2.15);
    orbit.setAttribute("fill", "none");
    orbit.setAttribute("stroke", "currentColor");
    orbit.setAttribute("stroke-width", "1.7");
    const spark = createPolyline("17.55 15.95 17.55 18.25 17.55 15.95 15.95 17.1 19.15 17.1");
    spark.setAttribute("fill", "none");
    spark.setAttribute("stroke", "currentColor");
    spark.setAttribute("stroke-width", "1.45");
    spark.setAttribute("stroke-linecap", "round");
    spark.setAttribute("stroke-linejoin", "round");
    svg.append(outer, play, orbit, spark);
    return svg;
  }
  function createThumbIcon(direction) {
    const svg = createSvg("0 0 24 24");
    if (direction === "up") {
      svg.appendChild(
        createPath(
          "M2 21h4V9H2v12Zm20-11.5c0-1.1-.9-2-2-2h-6.3l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L13.17 1 6.59 7.59C6.22 7.95 6 8.45 6 9v10c0 1.1.9 2 2 2h9c.82 0 1.53-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2.5Z"
        )
      );
    } else {
      svg.appendChild(
        createPath(
          "M15 3H6c-.82 0-1.53.5-1.84 1.22L1.14 11.27C1.05 11.5 1 11.74 1 12v2.5c0 1.1.9 2 2 2h6.3l-.95 4.57-.03.32c0 .41.17.79.44 1.06L10.83 23l6.58-6.59c.37-.36.59-.86.59-1.41V5c0-1.1-.9-2-2-2Zm4 0v12h4V3h-4Z"
        )
      );
    }
    return svg;
  }
  function createCogIcon() {
    const svg = createSvg("0 0 24 24");
    svg.appendChild(
      createPath(
        "M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.65l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.17 7.17 0 0 0-1.63-.94l-.36-2.54A.49.49 0 0 0 13.89 2h-3.78a.49.49 0 0 0-.49.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.61.22L2.71 8.48a.5.5 0 0 0 .12.65l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.65l1.92 3.32c.13.22.39.31.61.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54c.05.24.25.42.49.42h3.78c.24 0 .44-.18.49-.42l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96c.22.09.48 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.65l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"
      )
    );
    return svg;
  }
  function createProfileIcon() {
    const svg = createSvg("0 0 24 24");
    const head = createCircle(12, 8.2, 3.2);
    head.setAttribute("fill", "none");
    head.setAttribute("stroke", "currentColor");
    head.setAttribute("stroke-width", "1.8");
    const shoulders = createPath("M5.2 19.4c.75-3.55 3.53-5.4 6.8-5.4 3.26 0 6.04 1.85 6.8 5.4");
    shoulders.setAttribute("fill", "none");
    shoulders.setAttribute("stroke", "currentColor");
    shoulders.setAttribute("stroke-width", "1.8");
    shoulders.setAttribute("stroke-linecap", "round");
    shoulders.setAttribute("stroke-linejoin", "round");
    svg.append(head, shoulders);
    return svg;
  }
  function createCloseIcon() {
    const svg = createSvg("0 0 24 24");
    const left = document.createElementNS(SVG_NS, "line");
    left.setAttribute("x1", "18");
    left.setAttribute("y1", "6");
    left.setAttribute("x2", "6");
    left.setAttribute("y2", "18");
    left.setAttribute("stroke", "currentColor");
    left.setAttribute("stroke-width", "2.5");
    left.setAttribute("stroke-linecap", "round");
    left.setAttribute("stroke-linejoin", "round");
    const right = document.createElementNS(SVG_NS, "line");
    right.setAttribute("x1", "6");
    right.setAttribute("y1", "6");
    right.setAttribute("x2", "18");
    right.setAttribute("y2", "18");
    right.setAttribute("stroke", "currentColor");
    right.setAttribute("stroke-width", "2.5");
    right.setAttribute("stroke-linecap", "round");
    right.setAttribute("stroke-linejoin", "round");
    svg.append(left, right);
    return svg;
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
      const closeBtn = document.createElement("button");
      closeBtn.className = "bsb-tm-notice-close";
      closeBtn.appendChild(createCloseIcon());
      closeBtn.addEventListener("click", () => this.dismiss(options.id));
      notice.appendChild(closeBtn);
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
  var TAB_LABELS = {
    overview: "\u6982\u89C8",
    behavior: "\u7247\u6BB5\u4E0E\u6807\u7B7E",
    transparency: "\u6807\u7B7E\u900F\u660E\u5EA6",
    filters: "\u52A8\u6001 / \u8BC4\u8BBA",
    mbga: "\u751F\u6001\u51C0\u5316 (MBGA)",
    help: "\u5E2E\u52A9 / \u53CD\u9988"
  };
  var TAB_DESCRIPTIONS = {
    overview: "\u72B6\u6001\u3001\u6458\u8981\u4E0E\u7EF4\u62A4\u5DE5\u5177",
    behavior: "\u7247\u6BB5\u3001\u6807\u7B7E\u4E0E\u663E\u793A\u7B56\u7565",
    transparency: "\u80F6\u56CA\u900F\u660E\u5EA6\u4E0E\u964D\u566A\u7B56\u7565",
    filters: "\u52A8\u6001\u548C\u8BC4\u8BBA\u533A\u589E\u5F3A",
    mbga: "\u5C4F\u853D\u8FFD\u8E2A\u3001\u539F\u753B\u9501\u5B9A\u4E0E\u6C89\u6D78\u5316",
    help: "\u5E2E\u52A9\u94FE\u63A5\u4E0E\u4F7F\u7528\u8BF4\u660E"
  };
  var SettingsPanel = class {
    constructor(config, stats, callbacks) {
      this.callbacks = callbacks;
      __publicField(this, "backdrop", document.createElement("div"));
      __publicField(this, "panel", document.createElement("aside"));
      __publicField(this, "body", document.createElement("div"));
      __publicField(this, "nav", document.createElement("nav"));
      __publicField(this, "content", document.createElement("div"));
      __publicField(this, "statsEl", document.createElement("div"));
      __publicField(this, "form", document.createElement("div"));
      __publicField(this, "transparencyForm", document.createElement("div"));
      __publicField(this, "filterForm", document.createElement("div"));
      __publicField(this, "categoryForm", document.createElement("div"));
      __publicField(this, "mbgaForm", document.createElement("div"));
      __publicField(this, "sections", /* @__PURE__ */ new Map());
      __publicField(this, "panelId", "bsb-tm-panel");
      __publicField(this, "contentScrollByTab", {});
      __publicField(this, "activeTab", "overview");
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
      __publicField(this, "activeFeedbacks", /* @__PURE__ */ new Map());
      // id -> originalText
      __publicField(this, "pendingConfirmations", /* @__PURE__ */ new Set());
      // id
      __publicField(this, "handleKeydown", (event) => {
        if (event.key === "Escape" && !this.backdrop.hidden) {
          this.close("user");
        }
      });
      __publicField(this, "handleViewportResize", () => {
        this.syncViewportMetrics();
      });
      __publicField(this, "viewportListenersAttached", false);
      this.config = config;
      this.stats = stats;
      this.backdrop.className = "bsb-tm-panel-backdrop";
      this.backdrop.hidden = true;
      this.backdrop.addEventListener("click", (event) => {
        if (event.target === this.backdrop) {
          this.close("user");
        }
      });
      this.panel.className = "bsb-tm-panel";
      this.panel.id = this.panelId;
      this.panel.setAttribute("role", "dialog");
      this.panel.setAttribute("aria-modal", "true");
      this.panel.setAttribute("aria-labelledby", "bsb-tm-panel-title");
      this.body.className = "bsb-tm-panel-body";
      this.nav.className = "bsb-tm-panel-nav";
      this.content.className = "bsb-tm-panel-content";
      this.statsEl.className = "bsb-tm-stats";
      this.form.className = "bsb-tm-form";
      this.transparencyForm.className = "bsb-tm-form";
      this.filterForm.className = "bsb-tm-form";
      this.categoryForm.className = "bsb-tm-categories";
      this.mbgaForm.className = "bsb-tm-form";
      this.panel.append(this.createHeader(), this.body);
      this.body.append(this.nav, this.content);
      for (const tab of Object.keys(TAB_LABELS)) {
        this.nav.appendChild(this.createTabButton(tab));
        const section = this.createSection(tab);
        this.sections.set(tab, section);
        this.content.appendChild(section);
      }
      this.backdrop.appendChild(this.panel);
      this.render();
      this.setActiveTab("overview");
    }
    mount() {
      if (!this.backdrop.isConnected) {
        document.documentElement.appendChild(this.backdrop);
      }
      this.syncViewportMetrics();
    }
    toggle() {
      if (this.backdrop.hidden) {
        this.open();
        return;
      }
      this.close("user");
    }
    isOpen() {
      return !this.backdrop.hidden;
    }
    getActiveTab() {
      return this.activeTab;
    }
    open(tab = this.activeTab) {
      this.mount();
      this.attachViewportListeners();
      this.syncViewportMetrics();
      this.setActiveTab(tab);
      this.backdrop.hidden = false;
      document.documentElement.classList.add("bsb-tm-panel-open");
      document.addEventListener("keydown", this.handleKeydown);
    }
    close(reason = "user") {
      var _a, _b;
      const wasOpen = !this.backdrop.hidden;
      this.backdrop.hidden = true;
      this.detachViewportListeners();
      document.documentElement.classList.remove("bsb-tm-panel-open");
      document.removeEventListener("keydown", this.handleKeydown);
      if (wasOpen) {
        (_b = (_a = this.callbacks).onClose) == null ? void 0 : _b.call(_a, reason);
      }
    }
    unmount() {
      this.close("system");
      this.backdrop.remove();
    }
    updateConfig(config) {
      this.rememberActiveScroll();
      this.config = config;
      this.filterValidationMessage = null;
      this.render(true);
    }
    updateStats(stats) {
      this.rememberActiveScroll();
      this.stats = stats;
      this.renderOverview();
      this.restoreActiveScroll();
    }
    updateRuntimeStatus(status) {
      this.rememberActiveScroll();
      this.runtimeStatus = status;
      this.renderOverview();
      this.restoreActiveScroll();
    }
    setFullVideoLabels(segments) {
      this.rememberActiveScroll();
      this.fullVideoLabels = [...new Set(segments.map((segment) => CATEGORY_LABELS[segment.category]))];
      this.renderOverview();
      this.restoreActiveScroll();
    }
    render(preserveScroll = false) {
      var _a;
      const nextScrollTop = preserveScroll ? (_a = this.contentScrollByTab[this.activeTab]) != null ? _a : this.content.scrollTop : 0;
      this.renderOverview();
      this.renderBehavior();
      this.renderTransparency();
      this.renderFilters();
      this.renderMbga();
      this.renderHelp();
      this.setActiveTab(this.activeTab, { preserveScroll, scrollTop: nextScrollTop });
    }
    renderOverview() {
      var _a;
      const labels = this.fullVideoLabels.length > 0 ? this.fullVideoLabels.join(" / ") : "\u5F53\u524D\u89C6\u9891\u65E0\u6574\u89C6\u9891\u6807\u7B7E";
      const thumbnailStatus = this.config.thumbnailLabelMode === "off" ? "\u5DF2\u5173\u95ED" : "\u5DF2\u5F00\u542F";
      const titleLabelStatus = this.fullVideoLabels.length > 0 ? "\u5DF2\u8BC6\u522B" : "\u7B49\u5F85\u4E2D";
      const compactHeaderStatus = this.config.compactVideoHeader ? "\u5DF2\u5F00\u542F" : "\u5DF2\u5173\u95ED";
      const commentFilterStatus = this.config.commentFilterMode === "off" ? "\u5DF2\u5173\u95ED" : "\u5DF2\u5F00\u542F";
      const commentLocationStatus = this.config.commentLocationEnabled ? "\u5DF2\u5F00\u542F" : "\u5DF2\u5173\u95ED";
      this.statsEl.replaceChildren(
        this.createSummaryLine("\u811A\u672C\u72B6\u6001", this.config.enabled ? "\u5DF2\u542F\u7528" : "\u5DF2\u505C\u7528"),
        this.createSummaryLine("\u5F53\u524D\u89C6\u9891", (_a = this.runtimeStatus.bvid) != null ? _a : "\u5F53\u524D\u4E0D\u662F\u89C6\u9891\u9875"),
        this.createSummaryLine("\u7247\u6BB5\u72B6\u6001", this.runtimeStatus.message),
        this.createSummaryLine("\u6574\u89C6\u9891\u6807\u7B7E", labels),
        this.createSummaryLine("\u7D2F\u8BA1\u8DF3\u8FC7", `${this.stats.skipCount} \u6B21`),
        this.createSummaryLine("\u7D2F\u8BA1\u8282\u7701", `${this.stats.minutesSaved.toFixed(2)} \u5206\u949F`)
      );
      const section = this.sections.get("overview");
      if (!section) {
        return;
      }
      section.replaceChildren(
        this.createSectionHeading(
          "\u5F53\u524D\u72B6\u6001",
          "\u8FD9\u4E00\u9875\u96C6\u4E2D\u5C55\u793A\u811A\u672C\u662F\u5426\u751F\u6548\u3001\u5F53\u524D\u89C6\u9891\u8BC6\u522B\u7ED3\u679C\uFF0C\u4EE5\u53CA\u4F60\u5728\u7AD9\u5185\u4F1A\u770B\u5230\u54EA\u4E9B\u589E\u5F3A\u5143\u7D20\u3002"
        ),
        this.statsEl,
        this.createFeatureGrid(
          [
            {
              title: "\u9996\u9875 / \u641C\u7D22\u5361\u7247\u6807\u7B7E",
              value: thumbnailStatus,
              description: "\u5728\u6574\u89C6\u9891\u88AB\u6807\u8BB0\u4E3A\u5546\u4E1A\u5185\u5BB9\u65F6\uFF0C\u4E8E\u5C01\u9762\u4E0A\u65B9\u5C45\u4E2D\u663E\u793A\u7B80\u5199\u6807\u7B7E\uFF0C\u60AC\u505C\u540E\u5C55\u5F00\u5B8C\u6574\u5206\u7C7B\u540D\u3002"
            },
            {
              title: "\u89C6\u9891\u6807\u9898\u5546\u4E1A\u6807\u7B7E",
              value: titleLabelStatus,
              description: "\u5728\u89C6\u9891\u6807\u9898\u524D\u663E\u793A\u5206\u7C7B\u80F6\u56CA\uFF0C\u5E76\u63D0\u4F9B\u201C\u6807\u8BB0\u6B63\u786E / \u6807\u8BB0\u6709\u8BEF\u201D\u7684\u53CD\u9988\u5165\u53E3\u3002"
            },
            {
              title: "\u7D27\u51D1\u89C6\u9891\u9876\u90E8\u680F",
              value: compactHeaderStatus,
              description: "\u4EC5\u5728\u89C6\u9891\u64AD\u653E\u9875\u6536\u8D77\u5DE6\u4FA7\u5BFC\u822A\uFF0C\u4FDD\u7559\u641C\u7D22\u4E0E\u4E2A\u4EBA\u5165\u53E3\uFF0C\u51CF\u5C11\u9876\u90E8\u5360\u9AD8\u3002"
            },
            {
              title: "\u8BC4\u8BBA\u533A\u5546\u54C1\u8FC7\u6EE4",
              value: commentFilterStatus,
              description: "\u8BC6\u522B\u5E26\u8D27\u8BC4\u8BBA\u65F6\uFF0C\u4F1A\u7ED9\u51FA\u66F4\u660E\u786E\u7684\u9690\u85CF / \u663E\u793A\u53CD\u9988\uFF0C\u800C\u4E0D\u662F\u76F4\u63A5\u9759\u9ED8\u5904\u7406\u3002"
            },
            {
              title: "\u8BC4\u8BBA\u533A\u5C5E\u5730\u663E\u793A\uFF08\u5F00\u76D2\uFF09",
              value: commentLocationStatus,
              description: "\u9ED8\u8BA4\u5F00\u542F\uFF0C\u76F4\u63A5\u663E\u793A B \u7AD9\u8BC4\u8BBA payload \u81EA\u5E26\u7684 IP \u5C5E\u5730\u4FE1\u606F\uFF0C\u5E76\u517C\u5BB9\u65B0\u7248\u8BC4\u8BBA\u7ED3\u6784\u3002"
            }
          ],
          "bsb-tm-overview-grid"
        ),
        this.createFormGroup(
          "\u7EF4\u62A4\u5DE5\u5177",
          "\u6392\u969C\u6216\u60F3\u56DE\u5230\u521D\u59CB\u72B6\u6001\u65F6\uFF0C\u518D\u4F7F\u7528\u8FD9\u4E9B\u52A8\u4F5C\u3002\u7F13\u5B58\u6E05\u7406\u53EA\u4F1A\u5F71\u54CD SponsorBlock \u6570\u636E\uFF0C\u4E0D\u4F1A\u5220\u9664\u4F60\u7684\u5176\u4ED6\u811A\u672C\u8BBE\u7F6E\u3002",
          this.createActionRow(
            this.createActionButton("\u6E05\u7406\u7F13\u5B58", "secondary", () => __async(this, null, function* () {
              yield this.callbacks.onClearCache();
            }), { id: "clear-cache" }),
            this.createActionButton("\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E", "danger", () => __async(this, null, function* () {
              yield this.callbacks.onReset();
            }), { id: "reset-settings", confirmText: "\u786E\u5B9A\u6062\u590D\u5417\uFF1F" })
          )
        )
      );
    }
    renderBehavior() {
      this.form.replaceChildren(
        this.createFormGroup(
          "\u57FA\u7840\u5F00\u5173",
          "\u5148\u51B3\u5B9A\u811A\u672C\u662F\u5426\u5DE5\u4F5C\uFF0C\u518D\u63A7\u5236\u7F13\u5B58\u548C\u64AD\u653E\u5668\u53EF\u89C6\u5316\u589E\u5F3A\u3002",
          this.createFieldGrid(
            [
              this.createCheckbox(
                "\u542F\u7528 Bilibili SponsorBlock",
                "\u5173\u95ED\u540E\u5C06\u505C\u6B62\u7247\u6BB5\u8BF7\u6C42\u3001\u6807\u9898\u6807\u7B7E\u3001\u7F29\u7565\u56FE\u6807\u7B7E\u548C\u64AD\u653E\u5668\u589E\u5F3A\u3002",
                this.config.enabled,
                (checked) => __async(this, null, function* () {
                  yield this.callbacks.onPatchConfig({ enabled: checked });
                })
              ),
              this.createCheckbox(
                "\u542F\u7528\u7F13\u5B58",
                "\u7F13\u5B58 SponsorBlock \u7247\u6BB5\u548C\u6574\u89C6\u9891\u6807\u7B7E\uFF0C\u51CF\u5C11\u91CD\u590D\u8BF7\u6C42\u5E76\u63D0\u5347\u9875\u9762\u5207\u6362\u901F\u5EA6\u3002",
                this.config.enableCache,
                (checked) => __async(this, null, function* () {
                  yield this.callbacks.onPatchConfig({ enableCache: checked });
                })
              ),
              this.createCheckbox(
                "\u663E\u793A\u64AD\u653E\u5668\u8FDB\u5EA6\u6761\u6807\u7B7E",
                "\u5728\u8FDB\u5EA6\u6761\u4E0A\u663E\u793A\u4E0D\u540C\u7C7B\u522B\u7684\u5F69\u8272\u7247\u6BB5\u6807\u8BB0\u3002",
                this.config.showPreviewBar,
                (checked) => __async(this, null, function* () {
                  yield this.callbacks.onPatchConfig({ showPreviewBar: checked });
                })
              ),
              this.createCheckbox(
                "\u542F\u7528\u7D27\u51D1\u89C6\u9891\u9876\u90E8\u680F",
                "\u4EC5\u5728\u89C6\u9891\u64AD\u653E\u9875\u4FDD\u7559\u641C\u7D22\u680F\u548C\u4E2A\u4EBA\u5165\u53E3\uFF0C\u6536\u8D77\u5DE6\u4FA7\u5BFC\u822A\u5E76\u51CF\u5C11\u9876\u90E8\u7A7A\u767D\u3002",
                this.config.compactVideoHeader,
                (checked) => __async(this, null, function* () {
                  yield this.callbacks.onPatchConfig({ compactVideoHeader: checked });
                })
              ),
              this.createCheckbox(
                "\u663E\u793A\u7070\u5B57\u5E7F\u544A\u6587\u6848",
                "\u9ED8\u8BA4\u5173\u95ED\u3002\u5173\u95ED\u540E\uFF0C\u7D27\u51D1\u9876\u90E8\u680F\u53EA\u663E\u793A\u901A\u7528\u5360\u4F4D\u63D0\u793A\uFF0C\u4E0D\u5C55\u793A\u539F\u751F\u641C\u7D22\u6846\u91CC\u7684\u7070\u5B57\u5E7F\u544A\u5185\u5BB9\u3002",
                this.config.compactHeaderPlaceholderVisible,
                (checked) => __async(this, null, function* () {
                  yield this.callbacks.onPatchConfig({ compactHeaderPlaceholderVisible: checked });
                })
              ),
              this.createCheckbox(
                "\u5141\u8BB8\u641C\u7D22\u7070\u5B57\u5E7F\u544A\u6587\u6848",
                "\u9ED8\u8BA4\u5173\u95ED\u3002\u5F00\u542F\u540E\uFF0C\u82E5\u7D27\u51D1\u9876\u90E8\u680F\u641C\u7D22\u6846\u4E3A\u7A7A\uFF0C\u4E14\u5F53\u524D\u5B9E\u9645\u663E\u793A\u7684\u662F\u975E\u901A\u7528\u7070\u5B57\u5E7F\u544A\u6587\u6848\uFF0C\u70B9\u51FB\u641C\u7D22\u6216\u6309\u56DE\u8F66\u4F1A\u76F4\u63A5\u641C\u7D22\u8BE5\u6587\u6848\u3002",
                this.config.compactHeaderSearchPlaceholderEnabled,
                (checked) => __async(this, null, function* () {
                  yield this.callbacks.onPatchConfig({ compactHeaderSearchPlaceholderEnabled: checked });
                })
              )
            ],
            "single-column"
          )
        ),
        this.createFormGroup(
          "\u663E\u793A\u4E0E\u8BC6\u522B",
          "\u8FD9\u91CC\u7684\u9009\u9879\u51B3\u5B9A\u5361\u7247\u6807\u7B7E\u3001\u63D0\u793A\u7B56\u7565\u548C SponsorBlock \u8BF7\u6C42\u7684\u57FA\u7840\u884C\u4E3A\u3002",
          this.createFieldGrid([
            this.createSelect(
              "\u9996\u9875 / \u5217\u8868\u5361\u7247\u6807\u7B7E",
              this.config.thumbnailLabelMode,
              THUMBNAIL_LABEL_MODE_LABELS,
              (value) => __async(this, null, function* () {
                yield this.callbacks.onPatchConfig({ thumbnailLabelMode: value });
              }),
              "\u6574\u89C6\u9891\u88AB\u6807\u8BB0\u4E3A\u5546\u4E1A\u5185\u5BB9\u65F6\uFF0C\u5982\u4F55\u5728\u63A8\u8350\u5361\u7247\u4E0A\u5C55\u793A\u3002"
            ),
            this.createInput(
              "SponsorBlock \u670D\u52A1\u5668\u5730\u5740",
              "\u9ED8\u8BA4\u4FDD\u6301 https://www.bsbsb.top \u5373\u53EF\u3002\u53EA\u6709\u5728\u4F60\u660E\u786E\u77E5\u9053\u5907\u7528\u670D\u52A1\u53EF\u7528\u65F6\u518D\u4FEE\u6539\u3002",
              this.config.serverAddress,
              (value) => __async(this, null, function* () {
                yield this.callbacks.onPatchConfig({ serverAddress: value });
              })
            ),
            this.createNumberInput(
              "\u63D0\u793A\u505C\u7559\u65F6\u95F4\uFF08\u79D2\uFF09",
              "\u81EA\u52A8\u8DF3\u8FC7\u3001\u9519\u8BEF\u63D0\u793A\u548C\u9AD8\u5149\u70B9\u63D0\u793A\u7684\u9ED8\u8BA4\u505C\u7559\u65F6\u95F4\u3002",
              this.config.noticeDurationSec,
              (value) => __async(this, null, function* () {
                yield this.callbacks.onPatchConfig({ noticeDurationSec: value });
              })
            ),
            this.createNumberInput(
              "\u6700\u77ED\u5904\u7406\u65F6\u957F\uFF08\u79D2\uFF09",
              "\u77ED\u4E8E\u8BE5\u957F\u5EA6\u7684\u666E\u901A\u7247\u6BB5\u4E0D\u4F1A\u81EA\u52A8\u5904\u7406\uFF0C\u53EF\u7528\u4E8E\u51CF\u5C11\u8BEF\u89E6\u53D1\u3002",
              this.config.minDurationSec,
              (value) => __async(this, null, function* () {
                yield this.callbacks.onPatchConfig({ minDurationSec: value });
              })
            )
          ])
        )
      );
      this.categoryForm.replaceChildren();
      for (const category of CATEGORY_ORDER) {
        const row = document.createElement("label");
        row.className = "bsb-tm-category-row";
        const copy = document.createElement("div");
        copy.className = "bsb-tm-field-copy";
        const label = document.createElement("span");
        label.className = "bsb-tm-field-title";
        label.textContent = CATEGORY_LABELS[category];
        const help = document.createElement("small");
        help.className = "bsb-tm-field-help";
        help.textContent = CATEGORY_DESCRIPTIONS[category];
        copy.append(label, help);
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
        row.append(copy, select);
        this.categoryForm.appendChild(row);
      }
      const section = this.sections.get("behavior");
      if (!section) {
        return;
      }
      section.replaceChildren(
        this.createSectionHeading("\u7247\u6BB5\u4E0E\u6807\u7B7E", "\u8FD9\u91CC\u7684\u9009\u9879\u51B3\u5B9A\u89C6\u9891\u9875\u3001\u8FDB\u5EA6\u6761\u548C\u9996\u9875\u5361\u7247\u5982\u4F55\u5C55\u793A SponsorBlock \u6570\u636E\u3002"),
        this.form,
        this.createFormGroup(
          "\u6807\u7B7E\u914D\u8272",
          "\u9ED8\u8BA4\u914D\u8272\u5C3D\u91CF\u8D34\u8FD1\u4EBA\u7684\u76F4\u89C9\uFF1A\u7EA2\u8272\u504F\u8B66\u793A\u3001\u7EFF\u8272\u504F\u5B89\u5FC3\u3001\u9EC4\u8272\u504F\u81EA\u8350\u3002\u4F60\u53EF\u4EE5\u6309\u81EA\u5DF1\u7684\u5224\u65AD\u5FAE\u8C03\u3002",
          this.createColorPalette(this.config.categoryColorOverrides)
        ),
        this.createFormGroup(
          "\u7247\u6BB5\u5206\u7C7B\u7B56\u7565",
          "\u4FDD\u6301\u4E0A\u6E38\u5E38\u89C1\u8BED\u4E49\uFF1A\u81EA\u52A8\u3001\u624B\u52A8\u3001\u4EC5\u63D0\u793A\u3001\u5173\u95ED\u3002\u6574\u89C6\u9891\u6807\u7B7E\u4F1A\u540C\u6B65\u5F71\u54CD\u6807\u9898\u80F6\u56CA\u4E0E\u5C01\u9762\u9876\u90E8\u77ED\u6807\u7B7E\u3002",
          this.categoryForm
        )
      );
    }
    renderFilters() {
      var _a, _b, _c;
      const dynamicFields = [
        this.createSelect(
          "\u52A8\u6001\u8FC7\u6EE4\u6A21\u5F0F",
          this.config.dynamicFilterMode,
          CONTENT_FILTER_MODE_LABELS,
          (value) => __async(this, null, function* () {
            yield this.callbacks.onPatchConfig({ dynamicFilterMode: value });
          }),
          "\u9009\u62E9\u662F\u9690\u85CF\u52A8\u6001\u5185\u5BB9\u3001\u4EC5\u4FDD\u7559\u6807\u7B7E\u63D0\u793A\uFF0C\u8FD8\u662F\u5B8C\u5168\u5173\u95ED\u8FD9\u90E8\u5206\u589E\u5F3A\u3002"
        ),
        this.createRegexPatternInput(),
        this.createNumberInput(
          "\u52A8\u6001\u6700\u5C11\u547D\u4E2D\u6570",
          "\u4EC5\u5F53\u7591\u4F3C\u5E7F\u544A\u8BCD\u547D\u4E2D\u6570\u8FBE\u5230\u8FD9\u4E2A\u9608\u503C\u65F6\uFF0C\u624D\u5BF9\u5185\u5BB9\u505A\u6807\u8BB0\u6216\u9690\u85CF\u3002",
          this.config.dynamicRegexKeywordMinMatches,
          (value) => __async(this, null, function* () {
            yield this.callbacks.onPatchConfig({ dynamicRegexKeywordMinMatches: value });
          })
        )
      ];
      if (this.filterValidationMessage) {
        dynamicFields.splice(2, 0, this.createValidationMessage(this.filterValidationMessage));
      }
      const commentFields = [
        this.createCheckbox(
          "\u663E\u793A\u8BC4\u8BBA\u533A\u5C5E\u5730\uFF08\u5F00\u76D2\uFF09",
          "\u9ED8\u8BA4\u5F00\u542F\u3002\u590D\u523B\u81EA\u300CB\u7AD9\u8BC4\u8BBA\u533A\u5F00\u76D2\u300D\u7684\u6838\u5FC3\u80FD\u529B\uFF0C\u76F4\u63A5\u5C55\u793A\u8BC4\u8BBA payload \u81EA\u5E26\u7684 IP \u5C5E\u5730\u4FE1\u606F\u3002",
          this.config.commentLocationEnabled,
          (checked) => __async(this, null, function* () {
            yield this.callbacks.onPatchConfig({ commentLocationEnabled: checked });
          })
        ),
        this.createCheckbox(
          "\u540C\u65F6\u9690\u85CF\u547D\u4E2D\u8BC4\u8BBA\u7684\u56DE\u590D",
          "\u5F00\u542F\u540E\uFF0C\u5982\u679C\u4E3B\u8BC4\u8BBA\u547D\u4E2D\u5E7F\u544A\u89C4\u5219\uFF0C\u5176\u56DE\u590D\u697C\u5C42\u4E5F\u4F1A\u4E00\u5E76\u9690\u85CF\u3002",
          this.config.commentHideReplies,
          (checked) => __async(this, null, function* () {
            yield this.callbacks.onPatchConfig({ commentHideReplies: checked });
          })
        ),
        this.createSelect(
          "\u8BC4\u8BBA\u8FC7\u6EE4\u6A21\u5F0F",
          this.config.commentFilterMode,
          CONTENT_FILTER_MODE_LABELS,
          (value) => __async(this, null, function* () {
            yield this.callbacks.onPatchConfig({ commentFilterMode: value });
          }),
          "\u9009\u62E9\u662F\u9690\u85CF\u547D\u4E2D\u8BC4\u8BBA\u3001\u4EC5\u4FDD\u7559\u8BC4\u8BBA\u6807\u7B7E\u63D0\u793A\uFF0C\u8FD8\u662F\u5B8C\u5168\u5173\u95ED\u8BC4\u8BBA\u8FC7\u6EE4\u3002"
        ),
        this.createCustomColorInput(
          "IP \u5C5E\u5730\u6807\u7B7E\u989C\u8272",
          "\u81EA\u5B9A\u4E49\u8BC4\u8BBA\u533A IP \u5C5E\u5730\u80F6\u56CA\u6807\u7B7E\u7684\u4E3B\u9898\u989C\u8272\u3002",
          (_a = this.config.commentIpColor) != null ? _a : "#60a5fa",
          (value) => __async(this, null, function* () {
            yield this.callbacks.onPatchConfig({ commentIpColor: value });
          })
        ),
        this.createCustomColorInput(
          "\u8BC4\u8BBA\u5E7F\u544A\u6807\u7B7E\u989C\u8272",
          "\u81EA\u5B9A\u4E49\u8BC4\u8BBA\u533A\u8BC6\u522B\u5230\u7684\u5E7F\u544A\u3001\u5E26\u8D27\u6216\u53EF\u7591\u4FC3\u9500\u6807\u7B7E\u7684\u4E3B\u9898\u989C\u8272\u3002",
          (_b = this.config.commentAdColor) != null ? _b : "#ff6b66",
          (value) => __async(this, null, function* () {
            yield this.callbacks.onPatchConfig({ commentAdColor: value });
          })
        )
      ];
      this.filterForm.replaceChildren(
        this.createFormGroup(
          "\u52A8\u6001\u9875\u5546\u4E1A\u5185\u5BB9\u8FC7\u6EE4",
          "\u9ED8\u8BA4\u5173\u95ED\uFF0C\u907F\u514D\u8BEF\u4F24\u6B63\u5E38\u52A8\u6001\u3002\u53EA\u6709\u5728\u4F60\u786E\u5B9E\u9700\u8981\u5C4F\u853D\u5546\u4E1A\u52A8\u6001\u65F6\u518D\u542F\u7528\u3002",
          this.createFieldGrid(dynamicFields)
        ),
        this.createFormGroup(
          "\u8BC4\u8BBA\u533A\u5546\u54C1 / \u5E26\u8D27\u8FC7\u6EE4",
          "\u7528\u4E8E\u8BC6\u522B\u8BC4\u8BBA\u533A\u5546\u54C1\u5361\u5E7F\u544A\u3001\u5E26\u8D27\u7559\u8A00\u548C\u53EF\u7591\u4FC3\u9500\u8BC4\u8BBA\u3002",
          this.createFieldGrid(commentFields)
        )
      );
      (_c = this.sections.get("filters")) == null ? void 0 : _c.replaceChildren(
        this.createSectionHeading("\u52A8\u6001 / \u8BC4\u8BBA\u589E\u5F3A", "\u8FD9\u90E8\u5206\u4E0D\u662F SponsorBlock \u539F\u59CB\u7247\u6BB5\u63A5\u53E3\uFF0C\u800C\u662F\u5BF9 B \u7AD9\u7AD9\u5185\u5546\u4E1A\u5185\u5BB9\u7684\u9644\u52A0\u589E\u5F3A\u3002"),
        this.filterForm
      );
    }
    renderTransparency() {
      const transparency = this.config.labelTransparency;
      const section = this.sections.get("transparency");
      if (!section) {
        return;
      }
      this.transparencyForm.replaceChildren(
        this.createFormGroup(
          "\u89C6\u9891\u4E3B\u7EBF\u6807\u7B7E",
          "\u8FD9\u4E24\u7C7B\u6807\u7B7E\u5C5E\u4E8E BSC \u4E3B\u7EBF\u80FD\u529B\u3002\u900F\u660E\u6A21\u5F0F\u4F1A\u4ECE\u9AD8\u7EAF\u5EA6\u80F6\u56CA\u6539\u6210\u66F4\u514B\u5236\u7684 Liquid Glass \u8868\u73B0\uFF0C\u9ED8\u8BA4\u4FDD\u6301\u5173\u95ED\uFF0C\u786E\u4FDD\u5347\u7EA7\u540E\u73B0\u6709\u89C6\u89C9\u4E0D\u53D8\u3002",
          this.createFieldGrid([
            this.createCheckbox(
              "\u6807\u9898\u5546\u4E1A\u6807\u7B7E\u4F7F\u7528\u900F\u660E\u6A21\u5F0F",
              "\u7528\u4E8E\u89C6\u9891\u6807\u9898\u524D\u7684\u6574\u89C6\u9891\u80F6\u56CA\u3002\u5F00\u542F\u540E\u4F1A\u4FDD\u7559\u5206\u7C7B\u8272\u503E\u5411\uFF0C\u4F46\u628A\u7EAF\u8272\u586B\u5145\u6539\u4E3A\u66F4\u8F7B\u7684\u73BB\u7483\u67D3\u8272\uFF0C\u51CF\u5C11\u5BF9\u6807\u9898\u9605\u8BFB\u7684\u5E72\u6270\u3002",
              transparency.titleBadge,
              (checked) => __async(this, null, function* () {
                yield this.callbacks.onPatchConfig({
                  labelTransparency: __spreadProps(__spreadValues({}, this.config.labelTransparency), {
                    titleBadge: checked
                  })
                });
              })
            ),
            this.createCheckbox(
              "\u5C01\u9762\u80F6\u56CA\u6807\u7B7E\u4F7F\u7528\u900F\u660E\u6A21\u5F0F",
              "\u7528\u4E8E\u9996\u9875\u3001\u641C\u7D22\u3001\u4FA7\u680F\u5361\u7247\u4E0A\u7684\u6574\u89C6\u9891\u6807\u7B7E\u3002\u5F00\u542F\u540E\u4ECD\u4FDD\u7559\u60AC\u6D6E\u5C55\u5F00\u4E0E\u53EF\u8BFB\u6027\uFF0C\u4F46\u4F1A\u964D\u4F4E\u5BF9\u5C01\u9762\u4E3B\u4F53\u7684\u89C6\u89C9\u538B\u5236\u3002",
              transparency.thumbnailLabel,
              (checked) => __async(this, null, function* () {
                yield this.callbacks.onPatchConfig({
                  labelTransparency: __spreadProps(__spreadValues({}, this.config.labelTransparency), {
                    thumbnailLabel: checked
                  })
                });
              })
            )
          ])
        ),
        this.createFormGroup(
          "\u7AD9\u5185\u589E\u5F3A\u6807\u7B7E",
          "\u8FD9\u4E09\u7C7B\u6807\u7B7E\u66F4\u504F\u63D0\u793A\u6027\u8D28\uFF0C\u4E0D\u5EFA\u8BAE\u5F3A\u7ED1\u6210\u4E00\u4E2A\u603B\u5F00\u5173\u3002\u5206\u9879\u63A7\u5236\u53EF\u4EE5\u8BA9\u4F60\u53EA\u7ED9\u201C\u8FC7\u4E8E\u663E\u773C\u201D\u7684\u6807\u7B7E\u964D\u566A\uFF0C\u800C\u4E0D\u727A\u7272\u5176\u4ED6\u63D0\u9192\u80FD\u529B\u3002",
          this.createFieldGrid([
            this.createCheckbox(
              "\u8BC4\u8BBA\u5E7F\u544A\u6807\u7B7E\u4F7F\u7528\u900F\u660E\u6A21\u5F0F",
              "\u7528\u4E8E\u8BC4\u8BBA\u533A\u5E26\u8D27\u3001\u4FC3\u9500\u3001\u7591\u4F3C\u5E7F\u544A\u7B49\u6807\u7B7E\u3002\u5F00\u542F\u540E\u4F1A\u5F31\u5316\u6574\u5757\u80CC\u666F\u5B58\u5728\u611F\uFF0C\u628A\u6CE8\u610F\u529B\u66F4\u591A\u8FD8\u7ED9\u8BC4\u8BBA\u6B63\u6587\u3002",
              transparency.commentBadge,
              (checked) => __async(this, null, function* () {
                yield this.callbacks.onPatchConfig({
                  labelTransparency: __spreadProps(__spreadValues({}, this.config.labelTransparency), {
                    commentBadge: checked
                  })
                });
              })
            ),
            this.createCheckbox(
              "\u8BC4\u8BBA\u5C5E\u5730\u6807\u7B7E\u4F7F\u7528\u900F\u660E\u6A21\u5F0F",
              "\u7528\u4E8E\u8BC4\u8BBA\u53D1\u5E03\u65F6\u95F4\u65C1\u7684 IP \u5C5E\u5730\u80F6\u56CA\u3002\u8FD9\u4E2A\u573A\u666F\u6700\u5BB9\u6613\u6253\u65AD\u6B63\u6587\u9605\u8BFB\uFF0C\u6240\u4EE5\u5355\u72EC\u7ED9\u5F00\u5173\uFF0C\u9ED8\u8BA4\u5173\u95ED\u3002",
              transparency.commentLocation,
              (checked) => __async(this, null, function* () {
                yield this.callbacks.onPatchConfig({
                  labelTransparency: __spreadProps(__spreadValues({}, this.config.labelTransparency), {
                    commentLocation: checked
                  })
                });
              })
            ),
            this.createCheckbox(
              "\u52A8\u6001\u9875\u5546\u4E1A\u6807\u7B7E\u4F7F\u7528\u900F\u660E\u6A21\u5F0F",
              "\u7528\u4E8E\u52A8\u6001\u9875\u201C\u5E26\u8D27\u52A8\u6001 / \u7591\u4F3C\u5E7F\u544A\u201D\u7B49\u6807\u7B7E\u3002\u5F00\u542F\u540E\u4ECD\u4FDD\u7559\u5F3A\u8C03\u70B9\u4E0E\u8F6E\u5ED3\uFF0C\u4F46\u4F1A\u660E\u663E\u964D\u4F4E\u7EAF\u8272\u5757\u5E26\u6765\u7684\u62A2\u773C\u611F\u3002",
              transparency.dynamicBadge,
              (checked) => __async(this, null, function* () {
                yield this.callbacks.onPatchConfig({
                  labelTransparency: __spreadProps(__spreadValues({}, this.config.labelTransparency), {
                    dynamicBadge: checked
                  })
                });
              })
            )
          ])
        ),
        this.createInfoBox(
          "\u8BBE\u8BA1\u8BF4\u660E",
          "\u8FD9\u91CC\u7684\u201C\u900F\u660E\u201D\u4E0D\u662F\u7B80\u5355\u8C03\u4F4E opacity\uFF0C\u800C\u662F\u6539\u4E3A\u66F4\u4F4E\u4FB5\u5165\u7684 Liquid Glass\uFF1A\u8F7B\u67D3\u8272\u3001\u9AD8\u5149\u3001\u8FB9\u7F18\u63CF\u7EBF\u3001\u53D7\u63A7\u6A21\u7CCA\uFF0C\u5E76\u4F18\u5148\u4FDD\u8BC1\u6587\u5B57\u53EF\u8BFB\u6027\u3002"
        )
      );
      section.replaceChildren(
        this.createSectionHeading(
          "\u6807\u7B7E\u900F\u660E\u5EA6",
          "\u96C6\u4E2D\u7BA1\u7406\u6240\u6709\u80F6\u56CA\u6807\u7B7E\u7684\u900F\u660E\u6A21\u5F0F\u3002\u9ED8\u8BA4\u5168\u90E8\u5173\u95ED\uFF0C\u4FDD\u8BC1\u73B0\u6709\u7528\u6237\u5347\u7EA7\u540E\u4E0D\u4F1A\u88AB\u5F3A\u5236\u6539\u53D8\u89C6\u89C9\u98CE\u683C\u3002"
        ),
        this.transparencyForm
      );
    }
    renderMbga() {
      const mbgaFields = [
        this.createCheckbox(
          "\u542F\u7528\u751F\u6001\u51C0\u5316 (MBGA)",
          "\u603B\u5F00\u5173\u3002\u5F00\u542F\u540E\u5C06\u6CE8\u5165\u7F51\u7EDC\u62E6\u622A\u5C42\u53CA\u6837\u5F0F\u4F18\u5316\u8865\u4E01\uFF0C\u8FD8\u4F60\u4E00\u4E2A\u66F4\u5E72\u51C0\u3001\u9AD8\u6548\u7684 B \u7AD9\u3002",
          this.config.mbgaEnabled,
          (checked) => __async(this, null, function* () {
            yield this.callbacks.onPatchConfig({ mbgaEnabled: checked });
          }),
          true
        ),
        this.createCheckbox(
          "\u5C4F\u853D\u9690\u79C1\u8FFD\u8E2A\u4E0E\u884C\u4E3A\u4E0A\u62A5",
          "\u62E6\u622A data.bilibili.com / cm.bilibili.com \u7B49\u9065\u6D4B\u8BF7\u6C42\uFF0C\u4FDD\u62A4\u4E2A\u4EBA\u9690\u79C1\u3002",
          this.config.mbgaBlockTracking,
          (checked) => __async(this, null, function* () {
            yield this.callbacks.onPatchConfig({ mbgaBlockTracking: checked });
          }),
          true
        ),
        this.createCheckbox(
          "\u9501\u5B9A\u6700\u9AD8\u753B\u8D28\u4E0E\u76F4\u8FDE\u5B98\u65B9\u6E90",
          "\u5F3A\u5236\u76F4\u64AD\u539F\u753B\uFF0C\u5E76\u7981\u7528 Mcdn / P2P \u6280\u672F\uFF0C\u51CF\u5C11\u672C\u5730\u8D44\u6E90\u5360\u7528\u4E0E\u53D1\u70ED\u3002",
          this.config.mbgaDisablePcdn,
          (checked) => __async(this, null, function* () {
            yield this.callbacks.onPatchConfig({ mbgaDisablePcdn: checked });
          }),
          true
        ),
        this.createCheckbox(
          "\u6E05\u7406\u5730\u5740\u680F\u8FFD\u8E2A\u53C2\u6570",
          "\u81EA\u52A8\u79FB\u9664 URL \u4E2D spm_id_from, vd_source \u7B49\u8FFD\u8E2A\u53C2\u6570\u3002",
          this.config.mbgaCleanUrl,
          (checked) => __async(this, null, function* () {
            yield this.callbacks.onPatchConfig({ mbgaCleanUrl: checked });
          }),
          true
        ),
        this.createCheckbox(
          "\u6DF1\u5EA6\u7F51\u9875\u51C0\u5316\u4E0E\u7B80\u5316",
          "\u79FB\u9664\u5E7F\u544A\u63D0\u793A\u3001\u9ED1\u767D\u6EE4\u955C\u3001\u89E3\u9664\u590D\u5236\u9650\u5236\u3001\u52A8\u6001\u5BBD\u5C4F\u9002\u914D\u7B49 UI \u8865\u4E01\u3002",
          this.config.mbgaSimplifyUi,
          (checked) => __async(this, null, function* () {
            yield this.callbacks.onPatchConfig({ mbgaSimplifyUi: checked });
          }),
          true
        )
      ];
      const section = this.sections.get("mbga");
      if (!section) {
        return;
      }
      section.replaceChildren(
        this.createSectionHeading(
          "\u751F\u6001\u51C0\u5316 (MBGA)",
          "\u590D\u523B\u81EA\u7ECF\u5178\u7684 MBGA \u811A\u672C\uFF0C\u65E8\u5728\u901A\u8FC7\u7F51\u7EDC\u5C42\u52AB\u6301\u4E0E\u539F\u751F\u7F51\u9875\u91CD\u6784\uFF0C\u8FD8\u4F60\u4E00\u4E2A\u5E72\u51C0\u3001\u9AD8\u6548\u4E14\u79C1\u5BC6\u7684 B \u7AD9\u3002"
        ),
        this.createFormGroup(
          "\u529F\u80FD\u5F00\u5173",
          "\u6240\u6709\u6539\u52A8\u5747\u7ECF\u8FC7\u5B89\u5168\u5BA1\u8BA1\uFF0C\u65E8\u5728\u4FDD\u8BC1 BSB \u6838\u5FC3\u529F\u80FD\u4E0D\u88AB\u5E72\u6270\u7684\u524D\u63D0\u4E0B\uFF0C\u6700\u5927\u9650\u5EA6\u91CA\u653E\u672C\u5730\u7B97\u529B\u3002\u5F00\u542F\u540E\u8BF7\u5237\u65B0\u9875\u9762\u4EE5\u5B8C\u5168\u751F\u6548\u3002",
          this.createFieldGrid(mbgaFields)
        )
      );
    }
    renderHelp() {
      var _a;
      (_a = this.sections.get("help")) == null ? void 0 : _a.replaceChildren(
        this.createSectionHeading("\u5E2E\u52A9\u4E0E\u53CD\u9988", "\u8FD9\u91CC\u8BF4\u660E\u811A\u672C\u5728\u9875\u9762\u4E0A\u4F1A\u770B\u5230\u4EC0\u4E48\uFF0C\u4EE5\u53CA\u5982\u4F55\u5224\u65AD\u6807\u7B7E\u662F\u5426\u5DE5\u4F5C\u6B63\u5E38\u3002"),
        this.createFeatureGrid(
          [
            {
              title: "\u6807\u9898\u524D\u5546\u4E1A\u6807\u7B7E",
              value: "\u89C6\u9891\u9875",
              description: "\u5F53\u6574\u4E2A\u89C6\u9891\u88AB\u793E\u533A\u6807\u8BB0\u4E3A\u8D5E\u52A9\u3001\u81EA\u8350\u6216\u72EC\u5BB6\u8BBF\u95EE\u7B49\u6574\u89C6\u9891\u6807\u7B7E\u65F6\uFF0C\u4F1A\u5728\u6807\u9898\u524D\u663E\u793A\u5F69\u8272\u80F6\u56CA\u3002\u70B9\u51FB\u80F6\u56CA\u53EF\u6253\u5F00\u201C\u6807\u8BB0\u6B63\u786E / \u6807\u8BB0\u6709\u8BEF\u201D\u53CD\u9988\u3002"
            },
            {
              title: "\u7F29\u7565\u56FE\u9876\u90E8\u5C45\u4E2D\u6807\u7B7E",
              value: "\u9996\u9875 / \u641C\u7D22 / \u4FA7\u680F",
              description: "\u5BF9\u6574\u89C6\u9891\u5546\u4E1A\u6807\u7B7E\u7684\u89C6\u9891\u5361\u7247\u663E\u793A\u77ED\u6807\u7B7E\uFF0C\u60AC\u6D6E\u65F6\u4EE5\u66F4\u5B8C\u6574\u7684\u80F6\u56CA\u5F62\u5F0F\u5C55\u5F00\u3002"
            },
            {
              title: "\u7D27\u51D1\u89C6\u9891\u9876\u90E8\u680F",
              value: "\u89C6\u9891\u9875",
              description: "\u7528\u4E8E\u5728\u89C6\u9891\u9875\u4FDD\u7559\u641C\u7D22\u4E0E\u4E2A\u4EBA\u5165\u53E3\uFF0C\u907F\u514D\u539F\u751F\u9876\u90E8\u680F\u8FC7\u9AD8\u6216\u7559\u51FA\u4E0D\u5FC5\u8981\u7684\u7A7A\u767D\u3002"
            },
            {
              title: "\u8BC4\u8BBA\u533A\u5C5E\u5730\u663E\u793A\uFF08\u5F00\u76D2\uFF09",
              value: "\u8BC4\u8BBA\u533A",
              description: "\u5F53\u8BC4\u8BBA\u6570\u636E\u672C\u8EAB\u643A\u5E26 IP \u5C5E\u5730\u65F6\uFF0C\u4F1A\u5728\u8BC4\u8BBA\u53D1\u5E03\u65F6\u95F4\u65C1\u76F4\u63A5\u5C55\u793A\u3002\u8BE5\u529F\u80FD\u57FA\u4E8E mscststs \u7684\u300CB\u7AD9\u8BC4\u8BBA\u533A\u5F00\u76D2\u300D\u601D\u8DEF\u9002\u914D\u3002"
            }
          ],
          "bsb-tm-help-grid"
        ),
        this.createLinkGroup([
          {
            label: "\u5F53\u524D\u811A\u672C\u4ED3\u5E93",
            href: "https://github.com/FilfTeen/bilibili-sponsorblock-userscript"
          },
          {
            label: "\u4E0A\u6E38\u9879\u76EE hanydd/BilibiliSponsorBlock",
            href: "https://github.com/hanydd/BilibiliSponsorBlock"
          },
          {
            label: "\u53C2\u8003\u811A\u672C mscststs/B\u7AD9\u8BC4\u8BBA\u533A\u5F00\u76D2",
            href: "https://greasyfork.org/zh-CN/scripts/448434-b\u7AD9\u8BC4\u8BBA\u533A\u5F00\u76D2"
          },
          {
            label: "SponsorBlock \u670D\u52A1\u5668",
            href: "https://www.bsbsb.top"
          }
        ]),
        this.createInfoBox(
          "\u81F4\u8C22\u4E0E\u514D\u8D23\u58F0\u660E",
          "\u672C\u811A\u672C\u57FA\u4E8E GPL-3.0 \u7684 BilibiliSponsorBlock \u4E0A\u6E38\u5B9E\u73B0\u601D\u8DEF\u79FB\u690D\u800C\u6765\uFF1B\u8BC4\u8BBA\u533A\u5C5E\u5730\u663E\u793A\u529F\u80FD\u53C2\u8003\u5E76\u9002\u914D\u4E86 mscststs \u7684 ISC \u811A\u672C\u300CB\u7AD9\u8BC4\u8BBA\u533A\u5F00\u76D2\u300D\u3002\u6240\u6709\u7247\u6BB5\u548C\u6574\u89C6\u9891\u6807\u7B7E\u90FD\u6765\u81EA\u793E\u533A\u63D0\u4EA4\u4E0E\u6295\u7968\uFF0C\u8BC4\u8BBA\u5C5E\u5730\u5219\u4EE5 B \u7AD9\u8BC4\u8BBA payload \u81EA\u5E26\u4FE1\u606F\u4E3A\u51C6\uFF0C\u7ED3\u679C\u4EC5\u4F9B\u53C2\u8003\u3002"
        )
      );
    }
    setActiveTab(tab, options) {
      var _a, _b;
      this.rememberActiveScroll();
      this.activeTab = tab;
      for (const button of this.nav.querySelectorAll("[data-tab]")) {
        const active = button.dataset.tab === tab;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
      }
      for (const [sectionTab, section] of this.sections) {
        const active = sectionTab === tab;
        section.hidden = !active;
        section.setAttribute("aria-hidden", String(!active));
        section.dataset.active = String(active);
      }
      this.content.scrollTop = (options == null ? void 0 : options.preserveScroll) ? (_b = (_a = options.scrollTop) != null ? _a : this.contentScrollByTab[tab]) != null ? _b : 0 : 0;
    }
    createTabButton(tab) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "bsb-tm-tab-button";
      button.dataset.tab = tab;
      button.setAttribute("aria-controls", `${this.panelId}-section-${tab}`);
      const title = document.createElement("strong");
      title.className = "bsb-tm-tab-title";
      title.textContent = TAB_LABELS[tab];
      const description = document.createElement("small");
      description.className = "bsb-tm-tab-description";
      description.textContent = TAB_DESCRIPTIONS[tab];
      button.append(title, description);
      button.addEventListener("click", () => {
        var _a;
        this.setActiveTab(tab, { preserveScroll: true, scrollTop: (_a = this.contentScrollByTab[tab]) != null ? _a : 0 });
      });
      return button;
    }
    createCheckbox(labelText, helpText, checked, onChange, needsRefresh = false) {
      const label = document.createElement("label");
      label.className = "bsb-tm-field bsb-tm-field-toggle";
      label.dataset.controlState = checked ? "on" : "off";
      const copy = document.createElement("div");
      copy.className = "bsb-tm-field-copy";
      const title = document.createElement("span");
      title.className = "bsb-tm-field-title";
      title.textContent = labelText;
      if (needsRefresh) {
        const hint = document.createElement("span");
        hint.className = "bsb-tm-refresh-hint";
        hint.textContent = "\u9700\u5237\u65B0";
        title.appendChild(hint);
      }
      const help = document.createElement("small");
      help.className = "bsb-tm-field-help";
      help.textContent = helpText;
      const input = document.createElement("input");
      input.type = "checkbox";
      input.className = "bsb-tm-switch";
      input.setAttribute("role", "switch");
      input.checked = checked;
      input.addEventListener("change", () => __async(null, null, function* () {
        const nextChecked = input.checked;
        const previousChecked = !nextChecked;
        label.dataset.controlState = nextChecked ? "on" : "off";
        input.disabled = true;
        try {
          yield onChange(nextChecked);
        } catch (_error) {
          input.checked = previousChecked;
          label.dataset.controlState = previousChecked ? "on" : "off";
        } finally {
          input.disabled = false;
        }
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
      wrapper.append(
        this.createInputLabel("\u52A8\u6001\u5173\u952E\u8BCD\u6B63\u5219", "\u7528\u4E8E\u8BC6\u522B\u5E26\u8D27\u3001\u4FC3\u9500\u6216\u7591\u4F3C\u5E7F\u544A\u63AA\u8F9E\u3002\u4FDD\u7559\u9ED8\u8BA4\u503C\u901A\u5E38\u66F4\u7A33\u3002")
      );
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
    createSelect(labelText, value, options, onCommit, helpText) {
      const wrapper = document.createElement("label");
      wrapper.className = "bsb-tm-field stacked";
      wrapper.append(this.createInputLabel(labelText, helpText));
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
    createColorPalette(overrides) {
      const grid = document.createElement("div");
      grid.className = "bsb-tm-color-grid";
      for (const category of CATEGORY_ORDER) {
        grid.appendChild(this.createColorInput(category, resolveCategoryAccent(category, overrides)));
      }
      return grid;
    }
    createColorInput(category, value) {
      const field = document.createElement("label");
      field.className = "bsb-tm-color-field";
      const preview = document.createElement("span");
      preview.className = "bsb-tm-color-preview";
      preview.style.setProperty("--bsb-color-preview", value);
      preview.textContent = CATEGORY_LABELS[category];
      const controls = document.createElement("div");
      controls.className = "bsb-tm-color-controls";
      const swatch = document.createElement("input");
      swatch.type = "color";
      swatch.value = value;
      swatch.setAttribute("aria-label", `${CATEGORY_LABELS[category]}\u989C\u8272`);
      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.value = value;
      textInput.spellcheck = false;
      const commit = (nextValue) => __async(this, null, function* () {
        var _a;
        const normalized = (_a = normalizeHexColor(nextValue)) != null ? _a : CATEGORY_COLORS[category];
        swatch.value = normalized;
        textInput.value = normalized;
        preview.style.setProperty("--bsb-color-preview", normalized);
        yield this.callbacks.onPatchConfig({
          categoryColorOverrides: __spreadProps(__spreadValues({}, this.config.categoryColorOverrides), {
            [category]: normalized
          })
        });
      });
      swatch.addEventListener("input", () => __async(this, null, function* () {
        yield commit(swatch.value);
      }));
      textInput.addEventListener("change", () => __async(this, null, function* () {
        yield commit(textInput.value);
      }));
      controls.append(swatch, textInput);
      field.append(preview, controls);
      return field;
    }
    createCustomColorInput(labelText, helpText, value, onCommit) {
      const wrapper = document.createElement("label");
      wrapper.className = "bsb-tm-field stacked";
      wrapper.append(this.createInputLabel(labelText, helpText));
      const colorField = document.createElement("div");
      colorField.className = "bsb-tm-color-field";
      colorField.style.padding = "0";
      colorField.style.border = "none";
      colorField.style.background = "transparent";
      colorField.style.boxShadow = "none";
      const controls = document.createElement("div");
      controls.className = "bsb-tm-color-controls";
      controls.style.width = "100%";
      const swatch = document.createElement("input");
      swatch.type = "color";
      swatch.value = value;
      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.value = value;
      textInput.spellcheck = false;
      const commit = (nextValue) => __async(this, null, function* () {
        var _a;
        const normalized = (_a = normalizeHexColor(nextValue)) != null ? _a : value;
        swatch.value = normalized;
        textInput.value = normalized;
        yield onCommit(normalized);
      });
      swatch.addEventListener("input", () => __async(this, null, function* () {
        return commit(swatch.value);
      }));
      textInput.addEventListener("change", () => __async(this, null, function* () {
        return commit(textInput.value);
      }));
      controls.append(swatch, textInput);
      colorField.append(controls);
      wrapper.append(colorField);
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
      titleWrap.className = "bsb-tm-panel-header-copy";
      const eyebrow = document.createElement("div");
      eyebrow.className = "bsb-tm-panel-eyebrow";
      const eyebrowIcon = document.createElement("span");
      eyebrowIcon.className = "bsb-tm-panel-eyebrow-icon";
      eyebrowIcon.appendChild(createSponsorShieldIcon());
      const eyebrowText = document.createElement("span");
      eyebrowText.textContent = "Video Quality of Life";
      eyebrow.append(eyebrowIcon, eyebrowText);
      const title = document.createElement("strong");
      title.id = "bsb-tm-panel-title";
      title.textContent = SCRIPT_NAME;
      const subtitle = document.createElement("div");
      subtitle.className = "bsb-tm-panel-subtitle";
      subtitle.textContent = "\u5C3D\u91CF\u8D34\u8FD1\u4E0A\u6E38\u4F53\u9A8C\uFF0C\u5728 B \u7AD9\u9875\u9762\u4E0A\u505A\u6700\u5C11\u91CF\u3001\u6700\u53EF\u89E3\u91CA\u7684\u589E\u5F3A\u3002";
      titleWrap.append(eyebrow, title, subtitle);
      const actions = document.createElement("div");
      actions.className = "bsb-tm-panel-header-actions";
      const helpButton = document.createElement("button");
      helpButton.type = "button";
      helpButton.className = "bsb-tm-button secondary bsb-tm-header-action";
      helpButton.textContent = "\u5E2E\u52A9";
      helpButton.addEventListener("click", () => {
        this.setActiveTab("help");
      });
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "bsb-tm-button secondary bsb-tm-header-action bsb-tm-panel-close";
      closeButton.textContent = "\u5173\u95ED";
      closeButton.addEventListener("click", () => {
        this.close("user");
      });
      actions.append(helpButton, closeButton);
      header.append(titleWrap, actions);
      return header;
    }
    createSection(name) {
      const section = document.createElement("section");
      section.className = "bsb-tm-panel-section";
      section.dataset.section = name;
      section.dataset.active = "false";
      section.id = `${this.panelId}-section-${name}`;
      section.setAttribute("aria-hidden", "true");
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
    createInlineHeading(titleText, descriptionText) {
      const wrapper = document.createElement("div");
      wrapper.className = "bsb-tm-inline-heading";
      const title = document.createElement("strong");
      title.className = "bsb-tm-section-label";
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
    createFeatureGrid(items, className) {
      const grid = document.createElement("div");
      grid.className = className;
      for (const item of items) {
        const card = document.createElement("article");
        card.className = "bsb-tm-feature-card";
        const title = document.createElement("strong");
        title.className = "bsb-tm-feature-title";
        title.textContent = item.title;
        const value = document.createElement("span");
        value.className = "bsb-tm-feature-value";
        value.textContent = item.value;
        const description = document.createElement("p");
        description.className = "bsb-tm-section-description";
        description.textContent = item.description;
        card.append(title, value, description);
        grid.appendChild(card);
      }
      return grid;
    }
    createFieldGrid(items, variant = "default") {
      const grid = document.createElement("div");
      grid.className = "bsb-tm-field-grid";
      if (variant === "single-column") {
        grid.classList.add("single-column");
      }
      for (const item of items) {
        grid.appendChild(item);
      }
      return grid;
    }
    createFormGroup(titleText, descriptionText, ...children) {
      const group = document.createElement("section");
      group.className = "bsb-tm-form-group";
      const header = document.createElement("div");
      header.className = "bsb-tm-form-group-header";
      const title = document.createElement("strong");
      title.className = "bsb-tm-section-label";
      title.textContent = titleText;
      const description = document.createElement("p");
      description.className = "bsb-tm-section-description";
      description.textContent = descriptionText;
      header.append(title, description);
      const body = document.createElement("div");
      body.className = "bsb-tm-form-group-body";
      body.append(...children);
      group.append(header, body);
      return group;
    }
    createActionRow(...actions) {
      const row = document.createElement("div");
      row.className = "bsb-tm-actions-row";
      row.append(...actions);
      return row;
    }
    createActionButton(text, variant = "primary", onClick, options) {
      const { id, confirmText } = options != null ? options : {};
      const button = document.createElement("button");
      const originalText = text;
      button.type = "button";
      if (id && this.activeFeedbacks.has(id)) {
        button.className = "bsb-tm-button success";
        button.textContent = "\u5DF2\u5B8C\u6210";
        button.disabled = true;
      } else {
        button.className = `bsb-tm-button ${variant}`;
        if (id && confirmText && this.pendingConfirmations.has(id)) {
          button.textContent = confirmText;
          button.classList.add("confirming");
        } else {
          button.textContent = text;
        }
      }
      button.addEventListener("click", () => __async(this, null, function* () {
        if (button.disabled) return;
        if (id && confirmText && !this.pendingConfirmations.has(id)) {
          this.pendingConfirmations.add(id);
          button.textContent = confirmText;
          button.classList.add("confirming");
          setTimeout(() => {
            if (this.pendingConfirmations.has(id) && !this.activeFeedbacks.has(id)) {
              this.pendingConfirmations.delete(id);
              this.render(true);
            }
          }, 3e3);
          return;
        }
        button.disabled = true;
        try {
          yield onClick();
          if (id) {
            this.pendingConfirmations.delete(id);
            this.activeFeedbacks.set(id, originalText);
            this.render(true);
            setTimeout(() => {
              this.activeFeedbacks.delete(id);
              this.render(true);
            }, 3e3);
          } else {
            button.textContent = "\u5DF2\u5B8C\u6210";
            button.classList.add("success");
            setTimeout(() => {
              button.textContent = originalText;
              button.classList.remove("success");
              button.disabled = false;
            }, 3e3);
          }
        } catch (e) {
          button.disabled = false;
          button.textContent = originalText;
          if (id) this.pendingConfirmations.delete(id);
        }
      }));
      return button;
    }
    createLinkGroup(links) {
      const group = document.createElement("div");
      group.className = "bsb-tm-link-group";
      for (const entry of links) {
        const anchor = document.createElement("a");
        anchor.className = "bsb-tm-link-card";
        anchor.href = entry.href;
        anchor.target = "_blank";
        anchor.rel = "noreferrer";
        anchor.textContent = entry.label;
        group.appendChild(anchor);
      }
      return group;
    }
    createInfoBox(titleText, bodyText) {
      const box = document.createElement("div");
      box.className = "bsb-tm-info-box";
      const title = document.createElement("strong");
      title.textContent = titleText;
      const body = document.createElement("p");
      body.className = "bsb-tm-section-description";
      body.textContent = bodyText;
      box.append(title, body);
      return box;
    }
    attachViewportListeners() {
      var _a, _b;
      if (this.viewportListenersAttached) {
        return;
      }
      window.addEventListener("resize", this.handleViewportResize);
      (_a = window.visualViewport) == null ? void 0 : _a.addEventListener("resize", this.handleViewportResize);
      (_b = window.visualViewport) == null ? void 0 : _b.addEventListener("scroll", this.handleViewportResize);
      this.viewportListenersAttached = true;
    }
    detachViewportListeners() {
      var _a, _b;
      if (!this.viewportListenersAttached) {
        return;
      }
      window.removeEventListener("resize", this.handleViewportResize);
      (_a = window.visualViewport) == null ? void 0 : _a.removeEventListener("resize", this.handleViewportResize);
      (_b = window.visualViewport) == null ? void 0 : _b.removeEventListener("scroll", this.handleViewportResize);
      this.viewportListenersAttached = false;
    }
    syncViewportMetrics() {
      var _a, _b, _c, _d;
      const viewportWidth = Math.max(Math.floor((_b = (_a = window.visualViewport) == null ? void 0 : _a.width) != null ? _b : window.innerWidth), 360);
      const viewportHeight = Math.max(Math.floor((_d = (_c = window.visualViewport) == null ? void 0 : _c.height) != null ? _d : window.innerHeight), 360);
      const availableHeight = Math.max(viewportHeight - 24, 320);
      const preferredHeight = Math.min(860, Math.max(640, Math.round(viewportHeight * 0.82)));
      const stablePanelHeight = Math.min(availableHeight, preferredHeight);
      this.backdrop.style.setProperty("--bsb-tm-panel-vw", `${viewportWidth}px`);
      this.backdrop.style.setProperty("--bsb-tm-panel-vh", `${viewportHeight}px`);
      this.backdrop.style.setProperty("--bsb-tm-panel-height", `${stablePanelHeight}px`);
    }
    rememberActiveScroll() {
      if (!this.content.isConnected) {
        return;
      }
      this.contentScrollByTab[this.activeTab] = this.content.scrollTop;
    }
    restoreActiveScroll() {
      var _a;
      if (!this.content.isConnected) {
        return;
      }
      this.content.scrollTop = (_a = this.contentScrollByTab[this.activeTab]) != null ? _a : 0;
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
      __publicField(this, "categoryColorOverrides", {});
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
    setCategoryColorOverrides(overrides) {
      this.categoryColorOverrides = __spreadValues({}, overrides);
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
      bar.style.backgroundColor = resolveCategoryAccent(segment.category, this.categoryColorOverrides);
      bar.style.opacity = segment.actionType === "poi" ? "0.9" : "0.7";
      return bar;
    }
  };

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
      if (parsed.pathname.startsWith("/account/history") || parsed.pathname.startsWith("/history")) {
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
    return pageType === "video" || pageType === "list" || pageType === "festival" || pageType === "anime" || pageType === "opus";
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
  var VIDEO_TITLE_SELECTORS = [
    ".video-info-container h1",
    ".video-title-container h1",
    ".media-right h1",
    "h1.video-title",
    ".video-title"
  ];
  var TITLE_ACCESSORY_ATTR = "data-bsb-title-accessories";
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
  function findVideoTitleElement() {
    for (const selector of VIDEO_TITLE_SELECTORS) {
      const found = document.querySelector(selector);
      if (found) {
        return found;
      }
    }
    return null;
  }
  function ensureVideoTitleAccessoryHost() {
    var _a;
    const title = findVideoTitleElement();
    if (!title) {
      return null;
    }
    const parent = title.parentElement;
    if (!parent) {
      return null;
    }
    title.classList.remove("bsb-tm-title-row", "bsb-tm-title-text");
    parent.classList.remove("bsb-tm-title-layout");
    let accessories = (_a = Array.from(parent.children).find(
      (child) => child instanceof HTMLElement && child.getAttribute(TITLE_ACCESSORY_ATTR) === "true"
    )) != null ? _a : null;
    if (!accessories) {
      accessories = document.createElement("span");
      accessories.className = "bsb-tm-title-accessories";
      accessories.setAttribute(TITLE_ACCESSORY_ATTR, "true");
      parent.insertBefore(accessories, title);
    }
    return accessories;
  }
  function cleanupVideoTitleAccessoryHost(host) {
    if (!host || host.getAttribute(TITLE_ACCESSORY_ATTR) !== "true") {
      return;
    }
    const parent = host.parentElement instanceof HTMLElement ? host.parentElement : null;
    const title = host.nextElementSibling instanceof HTMLElement ? host.nextElementSibling : null;
    if (host.childElementCount === 0) {
      host.remove();
    }
    title == null ? void 0 : title.classList.remove("bsb-tm-title-row", "bsb-tm-title-text");
    parent == null ? void 0 : parent.classList.remove("bsb-tm-title-layout");
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

  // src/ui/title-badge.ts
  var DEFAULT_COPY = "\u6574\u4E2A\u89C6\u9891\u90FD\u88AB\u793E\u533A\u6807\u8BB0\u4E3A\u8FD9\u4E00\u7C7B\u5185\u5BB9\u3002\u6807\u7B7E\u4EC5\u7528\u4E8E\u8F85\u52A9\u5224\u65AD\uFF0C\u4E0D\u5E94\u66FF\u4EE3\u4F60\u81EA\u5DF1\u7684\u89C2\u770B\u5224\u65AD\u3002";
  var LABEL_ONLY_COPY = "\u8FD9\u4E2A\u6807\u7B7E\u6765\u81EA\u6574\u89C6\u9891\u6807\u7B7E\u7ED3\u679C\uFF0C\u4F46\u5F53\u524D\u6CA1\u6709\u53EF\u76F4\u63A5\u53CD\u9988\u7684\u6295\u7968\u8BB0\u5F55\u3002";
  var LOCAL_SIGNAL_COPY = "\u8FD9\u4E2A\u6807\u7B7E\u6765\u81EA\u672C\u5730\u9875\u9762\u7EBF\u7D22\uFF0C\u800C\u4E0D\u662F SponsorBlock \u793E\u533A\u5DF2\u6536\u5F55\u7684\u6574\u89C6\u9891\u8BB0\u5F55\u3002";
  var LOCKED_COPY = "\u8FD9\u6761\u6574\u89C6\u9891\u6807\u7B7E\u7684\u53CD\u9988\u5DF2\u5728\u672C\u673A\u63D0\u4EA4\u3002\u4E3A\u907F\u514D\u91CD\u590D\u6295\u7968\uFF0C\u5F53\u524D\u6309\u94AE\u5DF2\u9501\u5B9A\u3002";
  function resolveCopy(segment, votingAvailable) {
    var _a;
    const base = (_a = CATEGORY_DESCRIPTIONS[segment.category]) != null ? _a : DEFAULT_COPY;
    if (segment.UUID.startsWith("local-signal:")) {
      return `${base} ${LOCAL_SIGNAL_COPY}`;
    }
    if (!votingAvailable) {
      return `${base} ${LABEL_ONLY_COPY}`;
    }
    return base;
  }
  var TitleBadge = class {
    constructor(callbacks) {
      this.callbacks = callbacks;
      __publicField(this, "root", document.createElement("span"));
      __publicField(this, "pillButton", document.createElement("button"));
      __publicField(this, "titleText", document.createElement("span"));
      __publicField(this, "popover", document.createElement("div"));
      __publicField(this, "description", document.createElement("p"));
      __publicField(this, "actions", document.createElement("div"));
      __publicField(this, "feedbackHint", document.createElement("p"));
      __publicField(this, "upvoteButton", document.createElement("button"));
      __publicField(this, "downvoteButton", document.createElement("button"));
      __publicField(this, "settingsButton", document.createElement("button"));
      __publicField(this, "currentSegment", null);
      __publicField(this, "mountedHost", null);
      __publicField(this, "isOpen", false);
      __publicField(this, "closeTimer", null);
      __publicField(this, "positionFrame", null);
      __publicField(this, "categoryColorOverrides", {});
      __publicField(this, "transparencyEnabled", false);
      __publicField(this, "votingAvailable", true);
      __publicField(this, "localActionsAvailable", false);
      __publicField(this, "voteLocked", false);
      __publicField(this, "handleDocumentPointerDown", (event) => {
        const target = event.target;
        if (!target) {
          return;
        }
        if (this.root.contains(target) || this.popover.contains(target)) {
          return;
        }
        this.closePopover();
      });
      __publicField(this, "handleViewportChange", () => {
        if (this.isOpen) {
          this.schedulePopoverPosition();
        }
      });
      this.root.className = "bsb-tm-title-pill-wrap";
      this.root.dataset.glassContext = "surface";
      this.root.hidden = true;
      this.pillButton.type = "button";
      this.pillButton.className = "bsb-tm-title-pill";
      this.pillButton.setAttribute("aria-expanded", "false");
      this.pillButton.append(createSponsorShieldIcon(), this.titleText);
      this.pillButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.isOpen ? this.closePopover() : this.openPopover();
      });
      this.popover.className = "bsb-tm-title-popover";
      this.popover.hidden = true;
      this.description.className = "bsb-tm-title-popover-copy";
      this.description.textContent = DEFAULT_COPY;
      this.actions.className = "bsb-tm-title-popover-actions";
      this.feedbackHint.className = "bsb-tm-title-popover-hint";
      this.feedbackHint.hidden = true;
      this.upvoteButton.type = "button";
      this.upvoteButton.className = "bsb-tm-pill-action positive";
      this.upvoteButton.append(createThumbIcon("up"), document.createTextNode("\u6807\u8BB0\u6B63\u786E"));
      this.upvoteButton.addEventListener("click", (event) => __async(this, null, function* () {
        event.preventDefault();
        event.stopPropagation();
        yield this.handleVote(1);
      }));
      this.downvoteButton.type = "button";
      this.downvoteButton.className = "bsb-tm-pill-action negative";
      this.downvoteButton.append(createThumbIcon("down"), document.createTextNode("\u6807\u8BB0\u6709\u8BEF"));
      this.downvoteButton.addEventListener("click", (event) => __async(this, null, function* () {
        event.preventDefault();
        event.stopPropagation();
        yield this.handleVote(0);
      }));
      this.settingsButton.type = "button";
      this.settingsButton.className = "bsb-tm-pill-action subtle";
      this.settingsButton.append(createCogIcon(), document.createTextNode("\u8BBE\u7F6E"));
      this.settingsButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.callbacks.onOpenSettings();
        this.closePopover();
      });
      this.actions.append(this.upvoteButton, this.downvoteButton, this.settingsButton);
      this.popover.append(this.description, this.actions, this.feedbackHint);
      this.root.append(this.pillButton);
    }
    setColorOverrides(overrides) {
      this.categoryColorOverrides = __spreadValues({}, overrides);
      if (this.currentSegment) {
        this.applyAppearance(this.currentSegment);
      }
    }
    setTransparencyEnabled(enabled) {
      this.transparencyEnabled = enabled;
      this.root.dataset.transparent = String(enabled);
      if (this.currentSegment) {
        this.applyAppearance(this.currentSegment);
      }
    }
    setSegment(segment, options) {
      var _a;
      this.currentSegment = segment;
      this.voteLocked = (_a = options == null ? void 0 : options.voteLocked) != null ? _a : false;
      if (!segment) {
        this.closePopover();
        this.root.hidden = true;
        return;
      }
      this.ensureMounted();
      this.ensurePopoverMounted();
      this.root.hidden = false;
      this.applyAppearance(segment);
    }
    clear() {
      this.setSegment(null);
    }
    destroy() {
      this.clear();
      this.detachPopoverListeners();
      if (this.closeTimer !== null) {
        window.clearTimeout(this.closeTimer);
        this.closeTimer = null;
      }
      if (this.positionFrame !== null) {
        window.cancelAnimationFrame(this.positionFrame);
        this.positionFrame = null;
      }
      const host = this.root.parentElement;
      this.root.remove();
      cleanupVideoTitleAccessoryHost(host);
      this.popover.remove();
      this.mountedHost = null;
    }
    applyAppearance(segment) {
      const style = resolveCategoryStyle(segment.category, this.categoryColorOverrides);
      const glassVariant = this.transparencyEnabled ? style.transparentVariant : "dark";
      const transparentContrast = "#0f172a";
      const transparentSurface = style.glassSurface;
      this.votingAvailable = segment.actionType === "full" && segment.UUID.length > 0 && !segment.UUID.startsWith("video-label:") && !segment.UUID.startsWith("local-signal:");
      this.localActionsAvailable = segment.UUID.startsWith("local-signal:");
      this.root.dataset.category = segment.category;
      this.root.dataset.transparent = String(this.transparencyEnabled);
      this.root.dataset.glassContext = "surface";
      this.root.dataset.glassVariant = glassVariant;
      this.root.style.setProperty("--bsb-category-accent", style.accent);
      this.root.style.setProperty("--bsb-category-accent-strong", style.accentStrong);
      this.root.style.setProperty("--bsb-category-display-accent", style.transparentDisplayAccent);
      this.root.style.setProperty(
        "--bsb-category-contrast",
        this.transparencyEnabled ? transparentContrast : style.contrast
      );
      this.root.style.setProperty("--bsb-category-soft-surface", style.softSurface);
      this.root.style.setProperty("--bsb-category-soft-border", style.softBorder);
      this.root.style.setProperty("--bsb-category-glass-surface", this.transparencyEnabled ? transparentSurface : style.glassSurface);
      this.root.style.setProperty("--bsb-category-glass-border", style.glassBorder);
      this.titleText.textContent = CATEGORY_LABELS[segment.category];
      this.description.textContent = resolveCopy(segment, this.votingAvailable);
      this.upvoteButton.disabled = !this.localActionsAvailable && (!this.votingAvailable || this.voteLocked);
      this.downvoteButton.disabled = !this.localActionsAvailable && (!this.votingAvailable || this.voteLocked);
      this.upvoteButton.hidden = false;
      this.downvoteButton.hidden = false;
      this.upvoteButton.title = this.votingAvailable ? this.voteLocked ? "\u8FD9\u6761\u6574\u89C6\u9891\u6807\u7B7E\u7684\u53CD\u9988\u5DF2\u63D0\u4EA4" : "\u628A\u8FD9\u6761\u6574\u89C6\u9891\u6807\u7B7E\u6807\u8BB0\u4E3A\u6B63\u786E" : this.localActionsAvailable ? "\u628A\u8FD9\u6761\u672C\u5730\u6807\u7B7E\u8BB0\u4E3A\u53EF\u4FE1\uFF0C\u5E76\u5728\u540E\u7EED\u7EE7\u7EED\u4FDD\u7559" : "\u5F53\u524D\u6CA1\u6709\u53EF\u76F4\u63A5\u53CD\u9988\u7684 SponsorBlock \u6295\u7968\u8BB0\u5F55";
      this.downvoteButton.title = this.votingAvailable ? this.voteLocked ? "\u8FD9\u6761\u6574\u89C6\u9891\u6807\u7B7E\u7684\u53CD\u9988\u5DF2\u63D0\u4EA4" : "\u628A\u8FD9\u6761\u6574\u89C6\u9891\u6807\u7B7E\u6807\u8BB0\u4E3A\u6709\u8BEF" : this.localActionsAvailable ? "\u5FFD\u7565\u8FD9\u6761\u672C\u5730\u6807\u7B7E\uFF0C\u5E76\u505C\u6B62\u7EE7\u7EED\u63D0\u793A\u5F53\u524D\u89C6\u9891" : "\u5F53\u524D\u6CA1\u6709\u53EF\u76F4\u63A5\u53CD\u9988\u7684 SponsorBlock \u6295\u7968\u8BB0\u5F55";
      this.upvoteButton.lastChild && (this.upvoteButton.lastChild.textContent = this.votingAvailable ? "\u6807\u8BB0\u6B63\u786E" : this.localActionsAvailable ? "\u4FDD\u7559\u672C\u5730\u6807\u7B7E" : "\u6807\u8BB0\u6B63\u786E");
      this.downvoteButton.lastChild && (this.downvoteButton.lastChild.textContent = this.votingAvailable ? "\u6807\u8BB0\u6709\u8BEF" : this.localActionsAvailable ? "\u5FFD\u7565\u6B64\u89C6\u9891" : "\u6807\u8BB0\u6709\u8BEF");
      this.feedbackHint.hidden = this.votingAvailable && !this.localActionsAvailable && !this.voteLocked;
      this.feedbackHint.textContent = this.localActionsAvailable ? "\u8FD9\u6761\u63D0\u793A\u6765\u81EA\u672C\u5730\u8BC4\u8BBA\u6216\u9875\u9762\u7EBF\u7D22\u3002\u4F60\u53EF\u4EE5\u4FDD\u7559\u5B83\uFF0C\u4E5F\u53EF\u4EE5\u5FFD\u7565\u5E76\u963B\u6B62\u5F53\u524D\u89C6\u9891\u7EE7\u7EED\u89E6\u53D1\u672C\u5730\u63D0\u793A\u3002" : this.voteLocked ? LOCKED_COPY : "\u8FD9\u6761\u6807\u7B7E\u76EE\u524D\u53EA\u6709\u6574\u89C6\u9891\u6807\u7B7E\u7ED3\u679C\uFF0C\u6CA1\u6709\u53EF\u76F4\u63A5\u6295\u7968\u7684 SponsorBlock UUID\u3002";
      this.actions.classList.toggle("vote-unavailable", !this.votingAvailable);
      this.pillButton.setAttribute(
        "aria-label",
        this.votingAvailable ? this.voteLocked ? `${CATEGORY_LABELS[segment.category]}\uFF0C\u70B9\u51FB\u67E5\u770B\u8BF4\u660E\uFF0C\u53CD\u9988\u5DF2\u63D0\u4EA4` : `${CATEGORY_LABELS[segment.category]}\uFF0C\u70B9\u51FB\u67E5\u770B\u8BF4\u660E\u548C\u53CD\u9988\u6309\u94AE` : this.localActionsAvailable ? `${CATEGORY_LABELS[segment.category]}\uFF0C\u70B9\u51FB\u67E5\u770B\u672C\u5730\u5B66\u4E60\u6309\u94AE` : `${CATEGORY_LABELS[segment.category]}\uFF0C\u70B9\u51FB\u67E5\u770B\u8BF4\u660E\u548C\u4E0D\u53EF\u7528\u53CD\u9988\u6309\u94AE`
      );
    }
    ensureMounted() {
      const host = ensureVideoTitleAccessoryHost();
      if (!host) {
        return;
      }
      if (this.mountedHost !== host || this.root.parentElement !== host) {
        host.append(this.root);
        this.mountedHost = host;
      }
    }
    ensurePopoverMounted() {
      if (!this.popover.isConnected) {
        document.body.appendChild(this.popover);
      }
    }
    openPopover() {
      if (!this.currentSegment) {
        return;
      }
      if (this.closeTimer !== null) {
        window.clearTimeout(this.closeTimer);
        this.closeTimer = null;
      }
      this.ensureMounted();
      this.ensurePopoverMounted();
      this.isOpen = true;
      this.pillButton.setAttribute("aria-expanded", "true");
      this.popover.hidden = false;
      this.schedulePopoverPosition();
      requestAnimationFrame(() => {
        this.popover.classList.add("open");
      });
      this.attachPopoverListeners();
    }
    closePopover() {
      this.isOpen = false;
      this.pillButton.setAttribute("aria-expanded", "false");
      this.popover.classList.remove("open");
      this.detachPopoverListeners();
      if (this.closeTimer !== null) {
        window.clearTimeout(this.closeTimer);
      }
      this.closeTimer = window.setTimeout(() => {
        if (!this.isOpen) {
          this.popover.hidden = true;
        }
      }, 160);
    }
    positionPopover() {
      var _a, _b, _c, _d;
      this.positionFrame = null;
      const viewport = window.visualViewport;
      const viewportWidth = Math.max(320, Math.floor((_a = viewport == null ? void 0 : viewport.width) != null ? _a : window.innerWidth));
      const viewportHeight = Math.max(240, Math.floor((_b = viewport == null ? void 0 : viewport.height) != null ? _b : window.innerHeight));
      const viewportLeft = Math.floor((_c = viewport == null ? void 0 : viewport.offsetLeft) != null ? _c : 0);
      const viewportTop = Math.floor((_d = viewport == null ? void 0 : viewport.offsetTop) != null ? _d : 0);
      const maxWidth = Math.min(348, viewportWidth - 24);
      this.popover.style.maxWidth = `${maxWidth}px`;
      this.popover.style.width = `${maxWidth}px`;
      const triggerRect = this.pillButton.getBoundingClientRect();
      const popoverRect = this.popover.getBoundingClientRect();
      let left = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2;
      left = Math.max(12, Math.min(left, viewportWidth - popoverRect.width - 12));
      let top = triggerRect.bottom + 12;
      let placement = "bottom";
      if (top + popoverRect.height > viewportHeight - 12 && triggerRect.top - popoverRect.height - 12 >= 12) {
        top = triggerRect.top - popoverRect.height - 12;
        placement = "top";
      }
      this.popover.dataset.placement = placement;
      this.popover.style.left = `${viewportLeft + Math.round(left)}px`;
      this.popover.style.top = `${viewportTop + Math.round(top)}px`;
    }
    schedulePopoverPosition() {
      if (!this.isOpen || this.positionFrame !== null) {
        return;
      }
      this.positionFrame = window.requestAnimationFrame(() => {
        if (!this.isOpen) {
          this.positionFrame = null;
          return;
        }
        this.positionPopover();
      });
    }
    attachPopoverListeners() {
      var _a, _b;
      document.addEventListener("pointerdown", this.handleDocumentPointerDown);
      window.addEventListener("resize", this.handleViewportChange);
      window.addEventListener("scroll", this.handleViewportChange, true);
      (_a = window.visualViewport) == null ? void 0 : _a.addEventListener("resize", this.handleViewportChange);
      (_b = window.visualViewport) == null ? void 0 : _b.addEventListener("scroll", this.handleViewportChange);
    }
    detachPopoverListeners() {
      var _a, _b;
      document.removeEventListener("pointerdown", this.handleDocumentPointerDown);
      window.removeEventListener("resize", this.handleViewportChange);
      window.removeEventListener("scroll", this.handleViewportChange, true);
      (_a = window.visualViewport) == null ? void 0 : _a.removeEventListener("resize", this.handleViewportChange);
      (_b = window.visualViewport) == null ? void 0 : _b.removeEventListener("scroll", this.handleViewportChange);
    }
    handleVote(type) {
      return __async(this, null, function* () {
        if (!this.currentSegment || this.voteLocked && this.votingAvailable) {
          return;
        }
        this.setBusy(true);
        try {
          if (this.votingAvailable) {
            const result = yield this.callbacks.onVote(this.currentSegment, type);
            if (result !== "error") {
              this.voteLocked = true;
              this.applyAppearance(this.currentSegment);
            }
          } else if (this.localActionsAvailable) {
            yield this.callbacks.onLocalDecision(this.currentSegment, type === 1 ? "confirm" : "dismiss");
          } else {
            return;
          }
          this.closePopover();
        } finally {
          this.setBusy(false);
        }
      });
    }
    setBusy(busy) {
      for (const button of [this.upvoteButton, this.downvoteButton, this.settingsButton]) {
        if (button === this.upvoteButton || button === this.downvoteButton) {
          button.disabled = busy || (this.localActionsAvailable ? false : !this.votingAvailable || this.voteLocked);
        } else {
          button.disabled = busy;
        }
      }
      this.root.classList.toggle("is-busy", busy);
    }
  };

  // src/ui/compact-header.ts
  var NATIVE_HEADER_HIDDEN_ATTR = "data-bsb-native-header-hidden";
  var NATIVE_HEADER_ROOT_SELECTORS = [
    "#biliMainHeader",
    ".bili-header.fixed-header",
    ".bili-header__bar.mini-header"
  ];
  var GENERIC_PROFILE_LABELS = /* @__PURE__ */ new Set([
    "",
    "\u4E2A\u4EBA\u4E3B\u9875",
    "\u4E2A\u4EBA\u7A7A\u95F4",
    "\u5927\u4F1A\u5458",
    "\u6D88\u606F",
    "\u52A8\u6001",
    "\u6536\u85CF",
    "\u5386\u53F2",
    "\u521B\u4F5C\u4E2D\u5FC3",
    "\u6295\u7A3F"
  ]);
  var SEARCH_INPUT_SELECTORS = [
    ".bili-header__bar.mini-header .nav-search-input",
    ".bili-header__bar.mini-header input[type='search']",
    ".nav-search-input",
    "input[type='search']"
  ];
  var GENERIC_SEARCH_PLACEHOLDERS = /* @__PURE__ */ new Set([
    "",
    "\u641C\u7D22 B \u7AD9\u5185\u5BB9",
    "\u641C\u7D22b\u7AD9\u5185\u5BB9",
    "\u641C\u7D22\u5185\u5BB9",
    "\u641C\u7D22\u89C6\u9891\u3001\u756A\u5267\u6216 up \u4E3B",
    "\u641C\u7D22"
  ]);
  var DEFAULT_SEARCH_PLACEHOLDER = "\u641C\u7D22 B \u7AD9\u5185\u5BB9";
  var PROFILE_ROOT_SELECTORS = [
    ".bili-header__bar.mini-header .right-entry",
    ".bili-header .right-entry",
    ".mini-header .right-entry"
  ];
  var PROFILE_SELECTORS = [
    ".header-entry-avatar a",
    ".header-avatar-wrap a",
    ".header-entry-mini a",
    ".right-entry-item--profile a"
  ];
  function normalizeAvatarUrl(value) {
    if (typeof value !== "string") {
      return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    if (trimmed.startsWith("//")) {
      return `https:${trimmed}`;
    }
    return trimmed;
  }
  function coerceProfileSeed(candidate) {
    if (!candidate || typeof candidate !== "object") {
      return null;
    }
    const record = candidate;
    const avatarSrc = normalizeAvatarUrl(
      typeof record.face === "string" ? record.face : typeof record.avatar === "string" ? record.avatar : typeof record.avatarUrl === "string" ? record.avatarUrl : typeof record.img_url === "string" ? record.img_url : null
    );
    if (!avatarSrc) {
      return null;
    }
    const uid = typeof record.mid === "number" || typeof record.mid === "string" ? String(record.mid) : typeof record.uid === "number" || typeof record.uid === "string" ? String(record.uid) : "";
    const label = typeof record.uname === "string" ? record.uname.trim() : typeof record.name === "string" ? record.name.trim() : typeof record.nickname === "string" ? record.nickname.trim() : "\u4E2A\u4EBA\u4E3B\u9875";
    return {
      href: uid ? `https://space.bilibili.com/${uid}` : "https://space.bilibili.com/",
      label: label || "\u4E2A\u4EBA\u4E3B\u9875",
      avatarSrc
    };
  }
  function resolveProfileSeedFromGlobals() {
    var _a, _b, _c, _d;
    const scopedWindow = window;
    const candidates = [
      scopedWindow.__BILI_USER_INFO__,
      scopedWindow.__BILI_LOGIN_USER__,
      scopedWindow.__BILI_HEADER_LOGIN_USER_INFO__,
      (_a = scopedWindow.__INITIAL_STATE__) == null ? void 0 : _a.headerInfo,
      (_b = scopedWindow.__INITIAL_STATE__) == null ? void 0 : _b.loginInfo,
      (_c = scopedWindow.__NAV__) == null ? void 0 : _c.userInfo,
      (_d = scopedWindow.__NAV__) == null ? void 0 : _d.user
    ];
    for (const candidate of candidates) {
      const seed = coerceProfileSeed(candidate);
      if (seed) {
        return seed;
      }
    }
    return null;
  }
  function resolveSearchSeed() {
    var _a, _b;
    for (const selector of SEARCH_INPUT_SELECTORS) {
      const input = document.querySelector(selector);
      if (input instanceof HTMLInputElement) {
        return {
          placeholder: ((_a = input.placeholder) == null ? void 0 : _a.trim()) || DEFAULT_SEARCH_PLACEHOLDER,
          value: ((_b = input.value) == null ? void 0 : _b.trim()) || ""
        };
      }
    }
    return {
      placeholder: DEFAULT_SEARCH_PLACEHOLDER,
      value: ""
    };
  }
  function resolveDisplayedPlaceholder(seed, placeholderVisible) {
    const rawPlaceholder = seed.placeholder.trim();
    if (placeholderVisible && rawPlaceholder) {
      return rawPlaceholder;
    }
    return DEFAULT_SEARCH_PLACEHOLDER;
  }
  function resolveSearchKeyword(seed, options) {
    const directKeyword = seed.value.trim();
    if (directKeyword) {
      return directKeyword;
    }
    if (!options.searchPlaceholderEnabled) {
      return "";
    }
    const placeholder = resolveDisplayedPlaceholder(seed, options.placeholderVisible).trim();
    if (!placeholder || GENERIC_SEARCH_PLACEHOLDERS.has(placeholder)) {
      return "";
    }
    return placeholder;
  }
  function resolveProfileSeed() {
    var _a, _b;
    for (const rootSelector of PROFILE_ROOT_SELECTORS) {
      const root = document.querySelector(rootSelector);
      if (!(root instanceof HTMLElement)) {
        continue;
      }
      for (const selector of PROFILE_SELECTORS) {
        const anchor = root.querySelector(selector);
        if (!(anchor instanceof HTMLAnchorElement)) {
          continue;
        }
        const label = ((_a = anchor.getAttribute("aria-label")) == null ? void 0 : _a.trim()) || ((_b = anchor.textContent) == null ? void 0 : _b.trim()) || "\u4E2A\u4EBA\u4E3B\u9875";
        if (GENERIC_PROFILE_LABELS.has(label)) {
          continue;
        }
        return {
          href: anchor.href || "https://www.bilibili.com/",
          label,
          avatarSrc: null
        };
      }
    }
    return {
      href: "https://www.bilibili.com/",
      label: "\u4E2A\u4EBA\u4E3B\u9875",
      avatarSrc: null
    };
  }
  function createSearchForm(seed, options) {
    const form = document.createElement("form");
    form.className = "bsb-tm-video-header-fallback-search";
    const input = document.createElement("input");
    input.type = "search";
    input.placeholder = resolveDisplayedPlaceholder(seed, options.placeholderVisible);
    input.value = seed.value;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("aria-label", "\u641C\u7D22 B \u7AD9\u5185\u5BB9");
    const button = document.createElement("button");
    button.type = "submit";
    button.textContent = "\u641C\u7D22";
    button.setAttribute("aria-label", "\u6267\u884C\u641C\u7D22");
    form.append(input, button);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const keyword = resolveSearchKeyword(
        {
          placeholder: input.placeholder,
          value: input.value
        },
        options
      );
      if (!keyword) {
        return;
      }
      window.open(
        `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`,
        "_blank",
        "noopener,noreferrer"
      );
    });
    return form;
  }
  function createProfileLink(seed) {
    const link = document.createElement("a");
    link.className = "bsb-tm-video-header-profile-link";
    link.href = seed.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", seed.label);
    link.title = seed.label;
    if (seed.avatarSrc) {
      const image = document.createElement("img");
      image.className = "bsb-tm-video-header-avatar";
      image.alt = seed.label;
      image.src = seed.avatarSrc;
      link.appendChild(image);
      return link;
    }
    const fallback = document.createElement("span");
    fallback.className = "bsb-tm-video-header-profile-fallback";
    fallback.appendChild(createProfileIcon());
    link.appendChild(fallback);
    return link;
  }
  var CompactVideoHeader = class {
    constructor() {
      __publicField(this, "root", document.createElement("div"));
      __publicField(this, "bar", document.createElement("div"));
      __publicField(this, "searchSlot", document.createElement("div"));
      __publicField(this, "profileSlot", document.createElement("div"));
      __publicField(this, "retryTimerId", null);
      __publicField(this, "retriesRemaining", 0);
      __publicField(this, "mounted", false);
      __publicField(this, "profileObserver", null);
      __publicField(this, "lastResolvedProfileSeed", null);
      __publicField(this, "remoteProfileSeed", null);
      __publicField(this, "remoteProfilePromise", null);
      __publicField(this, "options", {
        placeholderVisible: false,
        searchPlaceholderEnabled: false
      });
      this.root.className = "bsb-tm-video-header-shell";
      this.bar.className = "bsb-tm-video-header-bar";
      this.searchSlot.className = "bsb-tm-video-header-search";
      this.profileSlot.className = "bsb-tm-video-header-profile";
      this.bar.append(this.searchSlot, this.profileSlot);
      this.root.appendChild(this.bar);
    }
    mount() {
      this.mounted = true;
      if (!this.root.isConnected) {
        document.body.prepend(this.root);
      }
      document.documentElement.classList.add("bsb-tm-video-header-compact");
      this.applyNativeHeaderState(true);
      this.retriesRemaining = 10;
      this.sync();
    }
    setOptions(next) {
      this.options = __spreadValues(__spreadValues({}, this.options), next);
      if (this.mounted) {
        this.sync();
      }
    }
    sync() {
      var _a, _b;
      if (!this.mounted) {
        return;
      }
      this.applyNativeHeaderState(true);
      const searchSeed = resolveSearchSeed();
      const resolvedProfileSeed = resolveProfileSeed();
      const globalProfileSeed = resolveProfileSeedFromGlobals();
      const authoritativeProfileSeed = (globalProfileSeed == null ? void 0 : globalProfileSeed.avatarSrc) ? globalProfileSeed : ((_a = this.remoteProfileSeed) == null ? void 0 : _a.avatarSrc) ? this.remoteProfileSeed : null;
      if (authoritativeProfileSeed == null ? void 0 : authoritativeProfileSeed.avatarSrc) {
        this.lastResolvedProfileSeed = authoritativeProfileSeed;
      }
      const profileSeed = (_b = authoritativeProfileSeed != null ? authoritativeProfileSeed : this.lastResolvedProfileSeed) != null ? _b : resolvedProfileSeed;
      this.searchSlot.replaceChildren(createSearchForm(searchSeed, this.options));
      this.profileSlot.replaceChildren(createProfileLink(profileSeed));
      this.syncProfileObserver(profileSeed);
      void this.ensureRemoteProfileSeed();
      this.scheduleRetry();
    }
    unmount() {
      var _a;
      this.mounted = false;
      if (this.retryTimerId !== null) {
        window.clearTimeout(this.retryTimerId);
        this.retryTimerId = null;
      }
      (_a = this.profileObserver) == null ? void 0 : _a.disconnect();
      this.profileObserver = null;
      this.lastResolvedProfileSeed = null;
      this.remoteProfileSeed = null;
      this.remoteProfilePromise = null;
      this.root.remove();
      document.documentElement.classList.remove("bsb-tm-video-header-compact");
      this.applyNativeHeaderState(false);
    }
    destroy() {
      this.unmount();
    }
    scheduleRetry() {
      if (!this.mounted || this.retriesRemaining <= 0 || this.retryTimerId !== null) {
        return;
      }
      this.retriesRemaining -= 1;
      this.retryTimerId = window.setTimeout(() => {
        this.retryTimerId = null;
        if (!this.mounted) {
          return;
        }
        this.sync();
      }, 400);
    }
    applyNativeHeaderState(hidden) {
      const roots = this.resolveNativeHeaderRoots();
      for (const root of roots) {
        if (hidden) {
          root.setAttribute(NATIVE_HEADER_HIDDEN_ATTR, "true");
        } else {
          root.removeAttribute(NATIVE_HEADER_HIDDEN_ATTR);
        }
      }
      if (!hidden) {
        for (const orphaned of document.querySelectorAll(`[${NATIVE_HEADER_HIDDEN_ATTR}="true"]`)) {
          orphaned.removeAttribute(NATIVE_HEADER_HIDDEN_ATTR);
        }
      }
    }
    resolveNativeHeaderRoots() {
      const found = /* @__PURE__ */ new Set();
      for (const selector of NATIVE_HEADER_ROOT_SELECTORS) {
        for (const node of document.querySelectorAll(selector)) {
          found.add(node);
        }
      }
      return Array.from(found);
    }
    syncProfileObserver(profileSeed) {
      var _a;
      if (!this.mounted) {
        return;
      }
      if (profileSeed.avatarSrc) {
        (_a = this.profileObserver) == null ? void 0 : _a.disconnect();
        this.profileObserver = null;
        return;
      }
      if (this.profileObserver) {
        return;
      }
      this.profileObserver = new MutationObserver(() => {
        var _a2, _b, _c, _d;
        if (!this.mounted) {
          return;
        }
        const nextSeed = resolveProfileSeed();
        const mergedSeed = nextSeed.avatarSrc ? nextSeed : (_c = (_b = (_a2 = resolveProfileSeedFromGlobals()) != null ? _a2 : this.remoteProfileSeed) != null ? _b : this.lastResolvedProfileSeed) != null ? _c : nextSeed;
        if (!(mergedSeed == null ? void 0 : mergedSeed.avatarSrc)) {
          return;
        }
        (_d = this.profileObserver) == null ? void 0 : _d.disconnect();
        this.profileObserver = null;
        this.lastResolvedProfileSeed = mergedSeed;
        this.profileSlot.replaceChildren(createProfileLink(mergedSeed));
      });
      this.profileObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["src", "href", "aria-label", "alt"]
      });
    }
    ensureRemoteProfileSeed() {
      return __async(this, null, function* () {
        var _a;
        if (((_a = this.remoteProfileSeed) == null ? void 0 : _a.avatarSrc) || this.remoteProfilePromise || !this.mounted || typeof fetch !== "function") {
          return;
        }
        this.remoteProfilePromise = (() => __async(this, null, function* () {
          try {
            const response = yield fetch("https://api.bilibili.com/x/web-interface/nav", {
              credentials: "include",
              headers: {
                Accept: "application/json"
              }
            });
            if (!response.ok) {
              return;
            }
            const payload = yield response.json();
            if (payload.code !== 0) {
              return;
            }
            const seed = coerceProfileSeed(payload.data);
            if (!(seed == null ? void 0 : seed.avatarSrc)) {
              return;
            }
            this.remoteProfileSeed = seed;
            this.lastResolvedProfileSeed = seed;
            if (!this.mounted) {
              return;
            }
            const currentSeed = resolveProfileSeed();
            const currentAvatar = normalizeAvatarUrl(currentSeed.avatarSrc);
            const remoteAvatar = normalizeAvatarUrl(seed.avatarSrc);
            if (!currentAvatar || !remoteAvatar || currentAvatar !== remoteAvatar) {
              this.profileSlot.replaceChildren(createProfileLink(seed));
            }
          } catch (_error) {
          } finally {
            this.remoteProfilePromise = null;
          }
        }))();
        yield this.remoteProfilePromise;
      });
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

  // src/ui/surface-frosted-glass.ts
  function createSurfaceFrostedGlassMaterial(options) {
    const { accentExpression, textVariable } = options;
    const textAssignment = textVariable ? `  ${textVariable}: #0f172a;
` : "";
    return {
      base: `${textAssignment}  background: linear-gradient(
    180deg,
    color-mix(in srgb, ${accentExpression} 7%, rgba(255, 255, 255, 0.18)),
    color-mix(in srgb, ${accentExpression} 10%, rgba(255, 255, 255, 0.04))
  );
  border: 1px solid color-mix(in srgb, ${accentExpression} 16%, rgba(255, 255, 255, 0.12));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 -1px 0 color-mix(in srgb, ${accentExpression} 8%, rgba(15, 23, 42, 0.05)),
    0 5px 12px rgba(15, 23, 42, 0.04),
    0 10px 20px rgba(15, 23, 42, 0.018);
  backdrop-filter: none;`,
      overlay: `  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% 8%, color-mix(in srgb, ${accentExpression} 22%, rgba(255, 255, 255, 0.26)) 0%, transparent 36%),
    radial-gradient(circle at 78% 120%, color-mix(in srgb, ${accentExpression} 14%, rgba(15, 23, 42, 0.1)) 0%, transparent 46%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.035) 34%, transparent 62%),
    linear-gradient(
      180deg,
      color-mix(in srgb, ${accentExpression} 14%, rgba(255, 255, 255, 0.28)),
      color-mix(in srgb, ${accentExpression} 22%, rgba(231, 238, 245, 0.12))
    ),
    linear-gradient(112deg, transparent 14%, rgba(255, 255, 255, 0.14) 24%, rgba(255, 255, 255, 0.03) 32%, transparent 42%);
  opacity: 0.82;
  backdrop-filter: blur(7px) saturate(148%) brightness(1.04);
  mix-blend-mode: screen;`
    };
  }

  // src/ui/inline-feedback.ts
  var INLINE_STYLE_ATTR = "data-bsb-inline-feedback-style";
  var DEFAULT_TONE_ACCENTS = {
    danger: "#ff6b66",
    warning: "#ffd56a",
    success: "#4ade80",
    info: "#60a5fa"
  };
  var inlineSurfaceFrostedGlass = createSurfaceFrostedGlassMaterial({
    accentExpression: "var(--bsb-inline-accent)",
    textVariable: "--bsb-inline-text"
  });
  var inlineFeedbackStyles = `
.bsb-tm-inline-chip,
.bsb-tm-inline-toggle {
  font-family: "SF Pro Text", "PingFang SC", sans-serif;
  font-kerning: normal;
  font-feature-settings: "kern" 1;
  font-synthesis-weight: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

.bsb-tm-inline-chip {
  --bsb-inline-accent: #ff6b6b;
  --bsb-inline-surface: rgba(45, 55, 72, 0.94);
  --bsb-inline-surface-strong: rgba(29, 37, 52, 0.98);
  --bsb-inline-text: #f8fafc;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  max-width: min(100%, 24rem);
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background:
    radial-gradient(circle at 20% 18%, rgba(255, 255, 255, 0.18), transparent 38%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.09), transparent 52%),
    linear-gradient(180deg, var(--bsb-inline-surface), var(--bsb-inline-surface-strong));
  color: var(--bsb-inline-text);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    inset 0 -1px 0 rgba(15, 23, 42, 0.22),
    0 10px 20px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(16px) saturate(155%);
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.01em;
  line-height: 1.1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bsb-tm-inline-chip[data-appearance="glass"] {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.bsb-tm-inline-chip[data-appearance="glass"][data-glass-context="surface"] {
${inlineSurfaceFrostedGlass.base}
}

.bsb-tm-inline-chip[data-appearance="glass"][data-glass-context="surface"]::after {
${inlineSurfaceFrostedGlass.overlay}
  z-index: 0;
}

.bsb-tm-inline-chip::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 999px;
  flex: none;
  background: var(--bsb-inline-accent);
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.14),
    0 0 14px color-mix(in srgb, var(--bsb-inline-accent) 72%, transparent);
  position: relative;
  z-index: 1;
}

.bsb-tm-inline-chip[data-appearance="glass"][data-glass-context="surface"]::before {
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.24),
    0 0 10px color-mix(in srgb, var(--bsb-inline-accent) 38%, transparent);
}

.bsb-tm-inline-chip__label {
  position: relative;
  z-index: 1;
}

.bsb-tm-inline-chip--inline,
.bsb-tm-inline-toggle--inline {
  margin-inline-start: 8px;
}

.bsb-tm-inline-chip--stack,
.bsb-tm-inline-toggle--stack {
  margin-top: 8px;
}

.bsb-tm-inline-chip[data-tone="danger"] {
  --bsb-inline-accent: #ff6b66;
  --bsb-inline-surface: rgba(130, 41, 41, 0.94);
  --bsb-inline-surface-strong: rgba(104, 28, 28, 0.98);
}

.bsb-tm-inline-chip[data-tone="warning"] {
  --bsb-inline-accent: #ffd56a;
  --bsb-inline-surface: rgba(109, 74, 20, 0.94);
  --bsb-inline-surface-strong: rgba(82, 53, 13, 0.98);
}

.bsb-tm-inline-chip[data-tone="success"] {
  --bsb-inline-accent: #4ade80;
  --bsb-inline-surface: rgba(25, 101, 73, 0.94);
  --bsb-inline-surface-strong: rgba(18, 76, 55, 0.98);
}

.bsb-tm-inline-chip[data-tone="info"] {
  --bsb-inline-accent: #60a5fa;
  --bsb-inline-surface: rgba(30, 88, 153, 0.94);
  --bsb-inline-surface-strong: rgba(21, 66, 118, 0.98);
}

.bsb-tm-inline-toggle {
  appearance: none;
  -webkit-appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 8px 13px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(245, 248, 252, 0.78)),
    rgba(247, 250, 252, 0.84);
  color: #0f172a;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    0 8px 18px rgba(15, 23, 42, 0.08);
  font-size: 12px;
  font-weight: 650;
  line-height: 1.1;
  letter-spacing: 0.01em;
  text-align: center;
  cursor: pointer;
  transition:
    box-shadow 200ms cubic-bezier(0.2, 0.8, 0.2, 1),
    background 200ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 200ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1),
    color 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bsb-tm-inline-toggle[data-state="hidden"] {
  border-color: rgba(59, 130, 246, 0.2);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(247, 250, 252, 0.84)),
    rgba(59, 130, 246, 0.08);
}

.bsb-tm-inline-toggle[data-state="shown"] {
  border-color: rgba(239, 68, 68, 0.22);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(252, 246, 246, 0.86)),
    rgba(239, 68, 68, 0.08);
}

.bsb-tm-inline-toggle:hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 12px 22px rgba(15, 23, 42, 0.1);
  transform: translateY(-1px);
}

.bsb-tm-inline-toggle:active {
  transform: scale(0.985);
}

.bsb-tm-inline-toggle:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(0, 174, 236, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}
`;
  function ensureInlineFeedbackStyles(root) {
    if (root.querySelector(`style[${INLINE_STYLE_ATTR}]`)) {
      return;
    }
    const style = document.createElement("style");
    style.setAttribute(INLINE_STYLE_ATTR, "true");
    style.textContent = inlineFeedbackStyles;
    root.prepend(style);
  }
  function createInlineBadge(attrName, text, tone, layout, customColor, appearance = "solid") {
    const badge = document.createElement("div");
    const label = document.createElement("span");
    const accent = customColor != null ? customColor : DEFAULT_TONE_ACCENTS[tone];
    badge.className = `bsb-tm-inline-chip bsb-tm-inline-chip--${layout}`;
    badge.setAttribute(attrName, "true");
    badge.dataset.tone = tone;
    badge.dataset.appearance = appearance;
    badge.dataset.glassVariant = resolveTransparentGlassVariant(accent);
    if (appearance === "glass") {
      badge.dataset.glassContext = "surface";
    }
    badge.title = text;
    label.className = "bsb-tm-inline-chip__label";
    label.textContent = text;
    badge.append(label);
    if (customColor) {
      badge.style.setProperty("--bsb-inline-accent", customColor);
      badge.style.setProperty("--bsb-inline-surface", `color-mix(in srgb, ${customColor} 20%, rgba(45, 55, 72, 0.94))`);
      badge.style.setProperty("--bsb-inline-surface-strong", `color-mix(in srgb, ${customColor} 28%, rgba(29, 37, 52, 0.98))`);
    }
    return badge;
  }
  function createInlineToggle(attrName, onClick, layout) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `bsb-tm-inline-toggle bsb-tm-inline-toggle--${layout}`;
    button.setAttribute(attrName, "true");
    button.addEventListener("click", onClick);
    return button;
  }
  function setInlineToggleState(button, state, labels) {
    button.dataset.state = state;
    button.setAttribute("aria-pressed", String(state === "shown"));
    button.textContent = state === "shown" ? labels.shown : labels.hidden;
  }

  // src/features/comment-filter.ts
  var THREAD_PROCESSED_ATTR = "data-bsb-comment-processed";
  var REPLY_PROCESSED_ATTR = "data-bsb-comment-reply-processed";
  var BADGE_ATTR = "data-bsb-comment-badge";
  var TOGGLE_ATTR = "data-bsb-comment-toggle";
  var LOCATION_ATTR = "data-bsb-comment-location";
  var HIDDEN_ATTR = "data-bsb-comment-hidden";
  var REPLIES_HIDDEN_ATTR = "data-bsb-comment-replies-hidden";
  var LOCATION_STATE_ATTR = "data-bsb-comment-location-state";
  var VUE_LOCATION_MARK_ATTR = "data-bsb-comment-location-settled";
  var NO_LOCATION_MARK = "__empty__";
  var ROOT_SWEEP_DELAYS_MS = [120, 240, 420, 760, 1200, 1800];
  var VIDEO_SIGNAL_EVENT = "bsb:video-signal";
  var COMMENT_RELEVANT_SELECTORS = [
    "bili-comments",
    "bili-comment-thread-renderer",
    "bili-comment-renderer",
    "bili-comment-reply-renderer",
    "bili-comment-replies-renderer",
    "bili-rich-text",
    ".browser-pc",
    ".reply-item",
    ".sub-reply-item",
    ".reply-time",
    ".sub-reply-time"
  ];
  var COMMENT_IGNORED_SELECTORS = [`[${BADGE_ATTR}]`, `[${TOGGLE_ATTR}]`, `[${LOCATION_ATTR}]`];
  var currentInlineBadgeAppearance = {
    commentBadge: false,
    commentLocation: false
  };
  var COMMENT_STRONG_MATCHES = /* @__PURE__ */ new Set(["\u8D5E\u52A9", "\u5546\u52A1\u5408\u4F5C", "\u5546\u54C1\u5361", "\u4F18\u60E0\u5238", "\u8D2D\u4E70\u6307\u5F15"]);
  var COMMENT_INVITATION_PATTERN = /邀请码|体验码|兑换码|注册码/iu;
  function getActionRendererNode(commentRenderer) {
    var _a, _b, _c, _d, _e, _f;
    return (_f = (_e = (_c = (_a = commentRenderer.shadowRoot) == null ? void 0 : _a.querySelector("bili-comment-action-buttons-renderer")) != null ? _c : (_b = commentRenderer.shadowRoot) == null ? void 0 : _b.querySelector("#main bili-comment-action-buttons-renderer")) != null ? _e : (_d = commentRenderer.shadowRoot) == null ? void 0 : _d.querySelector("#footer bili-comment-action-buttons-renderer")) != null ? _f : null;
  }
  function getReplyRendererHost(replyHost) {
    var _a;
    const nestedRenderer = (_a = replyHost.shadowRoot) == null ? void 0 : _a.querySelector("bili-comment-renderer");
    if (nestedRenderer instanceof HTMLElement && nestedRenderer.shadowRoot) {
      return nestedRenderer;
    }
    const replyRoot = replyHost.shadowRoot;
    if (!replyRoot) {
      return null;
    }
    const looksLikeFlatReplyRenderer = Boolean(
      replyRoot.querySelector("bili-comment-user-info") && replyRoot.querySelector("bili-rich-text") && getActionRendererNode(replyHost)
    );
    return looksLikeFlatReplyRenderer ? replyHost : null;
  }
  function normalizeCommentLocationText(location) {
    const value = String(location != null ? location : "").replace(/\s+/gu, " ").trim();
    if (!value) {
      return null;
    }
    if (/^IP\s*属地/iu.test(value)) {
      return value.replace(/^IP\s*属地\s*[:：]?\s*/iu, "IP\u5C5E\u5730\uFF1A");
    }
    return `IP\u5C5E\u5730\uFF1A${value}`;
  }
  function extractCommentLocation(reply) {
    var _a, _b;
    return normalizeCommentLocationText((_b = (_a = reply == null ? void 0 : reply.reply_control) == null ? void 0 : _a.location) != null ? _b : null);
  }
  var GOODS_STRUCTURAL_PATTERNS = {
    pricePattern: /[¥￥]\s*\d+(?:\.\d+)?/u,
    ecomDomains: /(?:jd\.com|taobao\.com|tmall\.com|pinduoduo\.com|pdd\.com|item\.m\.jd\.com)/iu,
    dataAttrKeywords: /goods|product|commodity|item/iu
  };
  function hasSponsoredGoodsLink(commentRenderer) {
    var _a, _b;
    const richTextRoot = (_b = (_a = commentRenderer.shadowRoot) == null ? void 0 : _a.querySelector("bili-rich-text")) == null ? void 0 : _b.shadowRoot;
    if (!richTextRoot) {
      return false;
    }
    for (const link of richTextRoot.querySelectorAll("a")) {
      if (link.dataset.type === "goods" || link.getAttribute("data-type") === "goods") {
        return true;
      }
      const href = link.href || link.getAttribute("href") || "";
      if (href && GOODS_STRUCTURAL_PATTERNS.ecomDomains.test(href)) {
        return true;
      }
      const dataType = link.dataset.type || link.getAttribute("data-type") || link.dataset.jumpType || link.getAttribute("data-jump-type") || "";
      if (dataType && GOODS_STRUCTURAL_PATTERNS.dataAttrKeywords.test(dataType)) {
        return true;
      }
      if (GOODS_STRUCTURAL_PATTERNS.pricePattern.test(link.textContent || "")) {
        return true;
      }
    }
    return false;
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
        category: "sponsor",
        matches: []
      };
    }
    const pattern = regexFromStoredPattern(config.dynamicRegexPattern);
    const text = extractCommentText(commentRenderer);
    const storedMatches = pattern ? collectPatternMatches(text, pattern) : [];
    const assessment = analyzeCommercialIntent(text, {
      storedMatches,
      minMatches: config.dynamicRegexKeywordMinMatches
    });
    if (!assessment.category) {
      return null;
    }
    const actionability = inspectCommercialActionability(text);
    const hasStrongToken = assessment.matches.some((match) => COMMENT_STRONG_MATCHES.has(match));
    const hasInvitationLead = COMMENT_INVITATION_PATTERN.test(text);
    const hasStrongEvidence = actionability.hasStrongClosure || hasStrongToken || hasInvitationLead;
    if (actionability.hasQuotedOrMockingContext) {
      return null;
    }
    if (pattern && !isLikelyPromoText(text, storedMatches, config.dynamicRegexKeywordMinMatches) && !hasStrongEvidence && assessment.category !== "selfpromo") {
      return null;
    }
    if (assessment.category === "sponsor" && !hasStrongEvidence) {
      return null;
    }
    if (assessment.category === "selfpromo" && !actionability.hasOwnedActionLead && assessment.selfpromoScore < 2.6) {
      return null;
    }
    if (assessment.category === "exclusive_access" && !actionability.hasStrongClosure && assessment.exclusiveScore < 3.2) {
      return null;
    }
    return {
      reason: "suspicion",
      category: assessment.category,
      matches: storedMatches.length > 0 ? storedMatches : assessment.matches
    };
  }
  function commentMatchToVideoSignal(match) {
    return {
      source: match.reason === "goods" ? "comment-goods" : "comment-suspicion",
      category: match.category,
      confidence: match.reason === "goods" ? 0.96 : match.category === "sponsor" ? 0.87 : match.category === "exclusive_access" ? 0.8 : 0.79,
      reason: match.reason === "goods" ? "\u8BC4\u8BBA\u533A\u547D\u4E2D\u5546\u54C1\u5361\u5E7F\u544A" : `\u8BC4\u8BBA\u533A\u547D\u4E2D\u5546\u4E1A\u7EBF\u7D22\uFF1A${match.matches.join(" / ")}`
    };
  }
  function getBadgeText(match) {
    if (match.reason === "goods") {
      return "\u8BC4\u8BBA\u533A\u5546\u54C1\u5E7F\u544A";
    }
    if (match.category === "selfpromo") {
      return `\u7591\u4F3C\u5BFC\u6D41\u8BC4\u8BBA: ${match.matches.join(" / ")}`;
    }
    if (match.category === "exclusive_access") {
      return `\u7591\u4F3C\u62A2\u5148\u4F53\u9A8C\u8BC4\u8BBA: ${match.matches.join(" / ")}`;
    }
    return `\u7591\u4F3C\u5E7F\u544A\u8BC4\u8BBA: ${match.matches.join(" / ")}`;
  }
  function getBadgeTone(match) {
    if (match.reason === "goods" || match.category === "sponsor") {
      return "danger";
    }
    if (match.category === "exclusive_access") {
      return "info";
    }
    return "warning";
  }
  function dispatchVideoSignal(match) {
    const detail = __spreadProps(__spreadValues({}, commentMatchToVideoSignal(match)), {
      matches: match.matches
    });
    window.dispatchEvent(
      new CustomEvent(VIDEO_SIGNAL_EVENT, {
        detail
      })
    );
  }
  function getBadgeRoot(commentRenderer) {
    var _a, _b, _c;
    return (_c = (_b = (_a = commentRenderer.shadowRoot) == null ? void 0 : _a.querySelector("bili-comment-user-info")) == null ? void 0 : _b.shadowRoot) != null ? _c : null;
  }
  function getActionRoot(commentRenderer) {
    var _a, _b;
    return (_b = (_a = getActionRendererNode(commentRenderer)) == null ? void 0 : _a.shadowRoot) != null ? _b : null;
  }
  function scanCurrentPageCommentSignal(config) {
    const host = document.querySelector("bili-comments");
    const root = host == null ? void 0 : host.shadowRoot;
    if (!root) {
      return null;
    }
    for (const thread of root.querySelectorAll("bili-comment-thread-renderer")) {
      const mainRenderer = getMainCommentRenderer(thread);
      if (mainRenderer) {
        const match = classifyCommentRenderer(mainRenderer, config);
        if (match) {
          return commentMatchToVideoSignal(match);
        }
      }
      for (const replyTarget of getReplyTargets(thread)) {
        const match = classifyCommentRenderer(replyTarget.renderer, config);
        if (match) {
          return commentMatchToVideoSignal(match);
        }
      }
    }
    return null;
  }
  function createBadge(text, tone, color) {
    return createInlineBadge(
      BADGE_ATTR,
      text,
      tone,
      "inline",
      color,
      currentInlineBadgeAppearance.commentBadge ? "glass" : "solid"
    );
  }
  function createToggleButton(onClick) {
    const button = createInlineToggle(TOGGLE_ATTR, onClick, "inline");
    return button;
  }
  function createLocationBadge(text, color) {
    return createInlineBadge(
      LOCATION_ATTR,
      text,
      "info",
      "inline",
      color,
      currentInlineBadgeAppearance.commentLocation ? "glass" : "solid"
    );
  }
  function getMainCommentRenderer(thread) {
    var _a;
    const renderer = (_a = thread.shadowRoot) == null ? void 0 : _a.querySelector("bili-comment-renderer");
    return renderer instanceof HTMLElement && renderer.shadowRoot ? renderer : null;
  }
  function getReplyTargets(thread) {
    var _a;
    const repliesRenderer = (_a = thread.shadowRoot) == null ? void 0 : _a.querySelector("bili-comment-replies-renderer");
    const repliesRoot = repliesRenderer == null ? void 0 : repliesRenderer.shadowRoot;
    if (!repliesRoot) {
      return [];
    }
    const targets = [];
    for (const reply of repliesRoot.querySelectorAll("bili-comment-reply-renderer")) {
      const renderer = getReplyRendererHost(reply);
      if (!renderer) {
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
    var _a, _b, _c, _d, _e, _f;
    return (_f = (_e = (_c = (_a = commentRenderer.shadowRoot) == null ? void 0 : _a.querySelector("#content")) != null ? _c : (_b = commentRenderer.shadowRoot) == null ? void 0 : _b.querySelector(".reply-content")) != null ? _e : (_d = commentRenderer.shadowRoot) == null ? void 0 : _d.querySelector("bili-rich-text")) != null ? _f : null;
  }
  function getActionAnchor(commentRenderer) {
    var _a, _b;
    return (_b = (_a = getActionRoot(commentRenderer)) == null ? void 0 : _a.querySelector("#reply")) != null ? _b : getContentBody(commentRenderer);
  }
  function getLocationAnchor(commentRenderer) {
    var _a, _b;
    return (_b = (_a = getActionRoot(commentRenderer)) == null ? void 0 : _a.getElementById("pubdate")) != null ? _b : getActionAnchor(commentRenderer);
  }
  function cleanupActionRootLocationNodes(actionRoot) {
    actionRoot.querySelectorAll(`[${LOCATION_ATTR}='true'], #location, .reply-location`).forEach((node) => node.remove());
  }
  function resolveCommentRendererLocation(commentRenderer) {
    var _a, _b, _c, _d;
    const fromReplyData = extractCommentLocation(commentRenderer.data);
    if (fromReplyData) {
      return fromReplyData;
    }
    const actionRoot = getActionRoot(commentRenderer);
    const legacyText = (_d = (_c = (_a = actionRoot == null ? void 0 : actionRoot.getElementById("location")) == null ? void 0 : _a.textContent) != null ? _c : (_b = actionRoot == null ? void 0 : actionRoot.querySelector(".reply-location")) == null ? void 0 : _b.textContent) != null ? _d : null;
    return normalizeCommentLocationText(legacyText);
  }
  function injectCommentLocation(commentRenderer, color) {
    var _a;
    const actionRoot = getActionRoot(commentRenderer);
    const anchor = getLocationAnchor(commentRenderer);
    if (!actionRoot || !anchor) {
      return;
    }
    const text = resolveCommentRendererLocation(commentRenderer);
    const locationState = text != null ? text : NO_LOCATION_MARK;
    if (commentRenderer.getAttribute(LOCATION_STATE_ATTR) === locationState) {
      return;
    }
    const existing = actionRoot.querySelector(`[${LOCATION_ATTR}='true']`);
    if (existing && ((_a = existing.textContent) == null ? void 0 : _a.trim()) === text) {
      commentRenderer.setAttribute(LOCATION_STATE_ATTR, locationState);
      return;
    }
    cleanupActionRootLocationNodes(actionRoot);
    if (!text) {
      commentRenderer.setAttribute(LOCATION_STATE_ATTR, NO_LOCATION_MARK);
      return;
    }
    ensureInlineFeedbackStyles(actionRoot);
    insertAfter(anchor, createLocationBadge(text, color));
    commentRenderer.setAttribute(LOCATION_STATE_ATTR, text);
  }
  function extractVueReplyPayload(node) {
    var _a, _b, _c, _d;
    const component = Reflect.get(node, "__vueParentComponent");
    return (_d = (_c = (_a = component == null ? void 0 : component.props) == null ? void 0 : _a.reply) != null ? _c : (_b = component == null ? void 0 : component.props) == null ? void 0 : _b.subReply) != null ? _d : null;
  }
  function resolveVueCommentLocation(node) {
    var _a, _b, _c;
    const fromReply = extractCommentLocation(extractVueReplyPayload(node));
    if (fromReply) {
      return fromReply;
    }
    const legacyText = (_c = (_b = (_a = node.parentElement) == null ? void 0 : _a.querySelector(".reply-location")) == null ? void 0 : _b.textContent) != null ? _c : null;
    return normalizeCommentLocationText(legacyText);
  }
  function cleanupVueLocationNodes(scope = document) {
    scope.querySelectorAll(`.reply-location, [${LOCATION_ATTR}='true']`).forEach((node) => node.remove());
    scope.querySelectorAll(`[${VUE_LOCATION_MARK_ATTR}]`).forEach((node) => node.removeAttribute(VUE_LOCATION_MARK_ATTR));
  }
  function injectVueCommentLocation(node, color) {
    var _a, _b;
    const text = resolveVueCommentLocation(node);
    const nextMarker = text != null ? text : NO_LOCATION_MARK;
    const currentMarker = node.getAttribute(VUE_LOCATION_MARK_ATTR);
    if (currentMarker && currentMarker === nextMarker) {
      return;
    }
    const siblingLocations = Array.from((_b = (_a = node.parentElement) == null ? void 0 : _a.children) != null ? _b : []).filter((child) => {
      if (!(child instanceof HTMLElement) || child === node) {
        return false;
      }
      return child.classList.contains("reply-location") || child.getAttribute(LOCATION_ATTR) === "true";
    });
    siblingLocations.forEach((child) => child.remove());
    if (!text) {
      node.setAttribute(VUE_LOCATION_MARK_ATTR, NO_LOCATION_MARK);
      return;
    }
    const badge = createLocationBadge(text, color);
    node.insertAdjacentElement("afterend", badge);
    node.setAttribute(VUE_LOCATION_MARK_ATTR, text);
  }
  function removeInjectedDecorations(commentRenderer) {
    var _a, _b;
    (_a = getBadgeRoot(commentRenderer)) == null ? void 0 : _a.querySelectorAll(`[${BADGE_ATTR}='true']`).forEach((node) => node.remove());
    (_b = getActionRoot(commentRenderer)) == null ? void 0 : _b.querySelectorAll(`[${TOGGLE_ATTR}='true'], [${LOCATION_ATTR}='true'], #location, .reply-location`).forEach((node) => node.remove());
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
    content.setAttribute(HIDDEN_ATTR, String(hidden));
    toggle.setAttribute("data-bsb-comment-hidden", String(hidden));
    setInlineToggleState(toggle, hidden ? "hidden" : "shown", {
      hidden: "\u663E\u793A\u8BC4\u8BBA\u5185\u5BB9",
      shown: "\u518D\u6B21\u9690\u85CF\u8BC4\u8BBA"
    });
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
      __publicField(this, "rootSweepTimerId", null);
      __publicField(this, "rootSweepAttempt", 0);
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
      currentInlineBadgeAppearance.commentBadge = this.currentConfig.labelTransparency.commentBadge;
      currentInlineBadgeAppearance.commentLocation = this.currentConfig.labelTransparency.commentLocation;
      this.configStore.subscribe((config) => {
        this.currentConfig = config;
        currentInlineBadgeAppearance.commentBadge = config.labelTransparency.commentBadge;
        currentInlineBadgeAppearance.commentLocation = config.labelTransparency.commentLocation;
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
      this.scheduleRootSweep(true);
      this.stopObservingUrl = observeUrlChanges(() => {
        this.resetProcessedThreads();
        this.rootSweepAttempt = 0;
        this.scheduleRefresh();
        this.scheduleRootSweep(true);
      });
      this.documentObserver = new MutationObserver((records) => {
        if (!mutationsTouchSelectors(records, COMMENT_RELEVANT_SELECTORS, COMMENT_IGNORED_SELECTORS)) {
          return;
        }
        this.scheduleRefresh();
        this.scheduleRootSweep(true);
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
      if (this.rootSweepTimerId !== null) {
        window.clearTimeout(this.rootSweepTimerId);
        this.rootSweepTimerId = null;
      }
      if (this.refreshTimerId !== null) {
        window.clearTimeout(this.refreshTimerId);
        this.refreshTimerId = null;
      }
      (_a = this.documentObserver) == null ? void 0 : _a.disconnect();
      this.documentObserver = null;
      this.disconnectRootObservers();
      this.pendingVisibleRefresh = false;
      this.rootSweepAttempt = 0;
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
      this.resetProcessedThreads();
    }
    scheduleRootSweep(force = false) {
      if (!this.started) {
        return;
      }
      if (force) {
        this.rootSweepAttempt = 0;
        if (this.rootSweepTimerId !== null) {
          window.clearTimeout(this.rootSweepTimerId);
          this.rootSweepTimerId = null;
        }
      } else if (this.rootSweepTimerId !== null) {
        return;
      }
      const index = Math.min(this.rootSweepAttempt, ROOT_SWEEP_DELAYS_MS.length - 1);
      const delay = ROOT_SWEEP_DELAYS_MS[index];
      this.rootSweepTimerId = window.setTimeout(() => {
        this.rootSweepTimerId = null;
        if (!this.started || document.hidden) {
          this.pendingVisibleRefresh = true;
          return;
        }
        this.refresh();
        this.rootSweepAttempt += 1;
      }, delay);
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
        const schedule = typeof requestIdleCallback === "function" ? requestIdleCallback : (cb) => window.setTimeout(cb, 0);
        schedule(() => {
          this.refresh();
        });
      }, 160);
    }
    refresh() {
      if (document.hidden) {
        this.pendingVisibleRefresh = true;
        return;
      }
      if (!this.currentConfig.enabled || this.currentConfig.commentFilterMode === "off" && !this.currentConfig.commentLocationEnabled || !supportsCommentFilters(window.location.href)) {
        this.disconnectRootObservers();
        this.resetProcessedThreads();
        return;
      }
      const roots = Array.from(document.querySelectorAll("bili-comments"));
      if (roots.length === 0) {
        this.scheduleRootSweep();
      } else {
        this.rootSweepAttempt = 0;
        if (this.rootSweepTimerId !== null) {
          window.clearTimeout(this.rootSweepTimerId);
          this.rootSweepTimerId = null;
        }
      }
      this.syncRootObservers(roots);
      for (const root of roots) {
        try {
          this.scanCommentRoot(root);
        } catch (error) {
          debugLog("Failed to process comment root", error);
        }
      }
      this.processVueComments();
    }
    syncRootObservers(roots) {
      const liveRoots = new Set(roots);
      const subRoots = /* @__PURE__ */ new Set();
      for (const root of roots) {
        const feedRoot = root.shadowRoot;
        if (!feedRoot) continue;
        feedRoot.querySelectorAll("bili-comment-thread-renderer").forEach((thread) => {
          var _a;
          const repliesRenderer = (_a = thread.shadowRoot) == null ? void 0 : _a.querySelector("bili-comment-replies-renderer");
          if (repliesRenderer == null ? void 0 : repliesRenderer.shadowRoot) {
            subRoots.add(repliesRenderer);
          }
        });
      }
      const allTargetRoots = /* @__PURE__ */ new Set([...liveRoots, ...subRoots]);
      for (const [root, observer] of this.rootObservers) {
        if (!allTargetRoots.has(root) || !document.contains(root)) {
          observer.disconnect();
          this.rootObservers.delete(root);
        }
      }
      for (const root of allTargetRoots) {
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
      if (this.currentConfig.commentLocationEnabled) {
        injectCommentLocation(target.renderer, this.currentConfig.commentIpColor);
      }
      if (target.host.getAttribute(target.processedAttr) === "true") {
        return;
      }
      const match = classifyCommentRenderer(target.renderer, this.currentConfig);
      if (!match) {
        return;
      }
      if (target.kind === "comment") {
        dispatchVideoSignal(match);
      }
      const badgeAnchor = getBadgeAnchor(target.renderer);
      if (!badgeAnchor) {
        return;
      }
      target.host.setAttribute(target.processedAttr, "true");
      const badgeRoot = getBadgeRoot(target.renderer);
      if (badgeRoot) {
        ensureInlineFeedbackStyles(badgeRoot);
      }
      const badge = createBadge(getBadgeText(match), getBadgeTone(match), this.currentConfig.commentAdColor);
      if (!insertAfter(badgeAnchor, badge)) {
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
      const actionRoot = getActionRoot(target.renderer);
      if (actionRoot) {
        ensureInlineFeedbackStyles(actionRoot);
      }
      const toggle = createToggleButton(() => {
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
      if (!insertAfter(actionAnchor, toggle)) {
        return;
      }
      if (target.kind === "comment" && this.currentConfig.commentHideReplies) {
        hideReplies(target.thread);
      }
    }
    processVueComments() {
      if (!this.currentConfig.commentLocationEnabled) {
        cleanupVueLocationNodes(document);
        return;
      }
      const nodes = document.querySelectorAll(".browser-pc .reply-item .reply-time, .browser-pc .sub-reply-item .sub-reply-time");
      for (const node of nodes) {
        try {
          injectVueCommentLocation(node, this.currentConfig.commentIpColor);
        } catch (error) {
          debugLog("Failed to inject Vue comment location", error);
        }
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
          if (mainRenderer) {
            removeInjectedDecorations(mainRenderer);
            mainRenderer.removeAttribute(LOCATION_STATE_ATTR);
          }
          if (thread.getAttribute(THREAD_PROCESSED_ATTR) === "true" && mainRenderer) {
            thread.removeAttribute(THREAD_PROCESSED_ATTR);
            const content = getContentBody(mainRenderer);
            if (content) {
              content.style.display = "";
              content.removeAttribute(HIDDEN_ATTR);
            }
          }
          for (const replyTarget of getReplyTargets(thread)) {
            removeInjectedDecorations(replyTarget.renderer);
            replyTarget.renderer.removeAttribute(LOCATION_STATE_ATTR);
            if (replyTarget.host.getAttribute(REPLY_PROCESSED_ATTR) !== "true") {
              continue;
            }
            replyTarget.host.removeAttribute(REPLY_PROCESSED_ATTR);
            const content = getContentBody(replyTarget.renderer);
            if (content) {
              content.style.display = "";
              content.removeAttribute(HIDDEN_ATTR);
            }
          }
          restoreReplies(thread);
        }
      }
      cleanupVueLocationNodes(document);
      debugLog("Comment sponsor state reset");
    }
  };

  // src/utils/local-video-signal.ts
  var DESCRIPTION_SELECTORS = [
    ".video-desc-container",
    ".desc-info-text",
    ".video-desc",
    ".basic-desc-info",
    "#v_desc"
  ];
  var TAG_SELECTORS = [".video-tag-container .tag-link", ".tag-panel .tag", ".video-info-tag a", ".video-tag a"];
  function collectTextFromSelectors(selectors) {
    var _a;
    const values = /* @__PURE__ */ new Set();
    for (const selector of selectors) {
      for (const node of document.querySelectorAll(selector)) {
        const text = (_a = node.textContent) == null ? void 0 : _a.replace(/\s+/gu, " ").trim();
        if (text) {
          values.add(text);
        }
      }
    }
    return [...values].join(" ");
  }
  var TITLE_STRONG_SPONSOR_MATCHES = /* @__PURE__ */ new Set(["\u8D5E\u52A9", "\u5546\u52A1\u5408\u4F5C", "\u5546\u54C1\u5361", "\u4F18\u60E0\u5238", "\u8D2D\u4E70\u6307\u5F15"]);
  var TITLE_STRONG_SELFPROMO_MATCHES = /* @__PURE__ */ new Set(["\u81EA\u5BB6\u5E97\u94FA", "\u81EA\u5BB6\u9891\u9053"]);
  function analyzeSurface(text) {
    if (!text) {
      return null;
    }
    return analyzeCommercialIntent(text, {
      minMatches: 1
    });
  }
  function hasStrongTitleSponsorEvidence(assessment) {
    return Boolean(
      assessment && assessment.sponsorScore >= 4.1 && assessment.matches.some((match) => TITLE_STRONG_SPONSOR_MATCHES.has(match))
    );
  }
  function hasStrongTitleSelfpromoEvidence(assessment) {
    return Boolean(
      assessment && assessment.selfpromoScore >= 2.3 && assessment.matches.some((match) => TITLE_STRONG_SELFPROMO_MATCHES.has(match))
    );
  }
  function hasStrongTitleExclusiveEvidence(assessment) {
    return Boolean(assessment && (assessment.exclusiveScore >= 4.5 || assessment.matches.includes("\u62A2\u5148\u4F53\u9A8C")));
  }
  function hasStrongNonTitleEvidence(category, assessments) {
    return assessments.some((assessment) => {
      if (!assessment) {
        return false;
      }
      if (category === "sponsor") {
        return assessment.sponsorScore >= 3.3;
      }
      if (category === "selfpromo") {
        return assessment.selfpromoScore >= 2.3;
      }
      return assessment.exclusiveScore >= 3;
    });
  }
  function resolveVideoAssessment(titleAssessment, descriptionAssessment, tagAssessment, combinedAssessment) {
    if (!combinedAssessment.category) {
      return null;
    }
    const nonTitleAssessments = [descriptionAssessment, tagAssessment];
    const hasNonTitleEvidence = hasStrongNonTitleEvidence(combinedAssessment.category, nonTitleAssessments);
    if (combinedAssessment.category === "sponsor") {
      if (!hasNonTitleEvidence && !hasStrongTitleSponsorEvidence(titleAssessment)) {
        return null;
      }
    } else if (combinedAssessment.category === "selfpromo") {
      if (!hasNonTitleEvidence && !hasStrongTitleSelfpromoEvidence(titleAssessment)) {
        return null;
      }
    } else if (!hasNonTitleEvidence && !hasStrongTitleExclusiveEvidence(titleAssessment)) {
      return null;
    }
    return combinedAssessment;
  }
  function inferLocalVideoSignal(context) {
    var _a, _b, _c;
    const title = (_b = (_a = context.title) == null ? void 0 : _a.replace(/\s+/gu, " ").trim()) != null ? _b : "";
    const description = collectTextFromSelectors(DESCRIPTION_SELECTORS);
    const tags = collectTextFromSelectors(TAG_SELECTORS);
    const combined = [title, description, tags].filter(Boolean).join(" ");
    const titleAssessment = analyzeSurface(title);
    const descriptionAssessment = analyzeSurface(description);
    const tagAssessment = analyzeSurface(tags);
    const combinedAssessment = analyzeCommercialIntent(combined, {
      minMatches: 1
    });
    const assessment = resolveVideoAssessment(titleAssessment, descriptionAssessment, tagAssessment, combinedAssessment);
    if (!assessment || !assessment.category) {
      return null;
    }
    return {
      category: assessment.category,
      source: "page-heuristic",
      confidence: assessment.confidence,
      reason: (_c = assessment.reason) != null ? _c : "\u9875\u9762\u6587\u672C\u51FA\u73B0\u672C\u5730\u5546\u4E1A\u7EBF\u7D22"
    };
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
  var SKIP_GRACE_WINDOW_MS = 1e4;
  var ScriptController = class {
    constructor(configStore, statsStore, cache, localVideoLabelStore, voteHistoryStore) {
      this.configStore = configStore;
      this.statsStore = statsStore;
      this.cache = cache;
      this.localVideoLabelStore = localVideoLabelStore;
      this.voteHistoryStore = voteHistoryStore;
      __publicField(this, "started", false);
      __publicField(this, "currentConfig");
      __publicField(this, "currentStats");
      __publicField(this, "segmentStates", /* @__PURE__ */ new Map());
      __publicField(this, "notices", new NoticeCenter());
      __publicField(this, "client");
      __publicField(this, "videoLabelClient");
      __publicField(this, "panel");
      __publicField(this, "previewBar", new PreviewBar());
      __publicField(this, "titleBadge");
      __publicField(this, "compactHeader", new CompactVideoHeader());
      __publicField(this, "tickIntervalId", null);
      __publicField(this, "domObserver", null);
      __publicField(this, "domStructureDirty", true);
      __publicField(this, "stopObservingUrl", null);
      __publicField(this, "currentContext", null);
      __publicField(this, "currentVideo", null);
      __publicField(this, "currentSignature", "");
      __publicField(this, "currentSegments", []);
      __publicField(this, "currentFullVideoLabels", []);
      __publicField(this, "currentTitleLabel", null);
      __publicField(this, "activeMuteOwners", /* @__PURE__ */ new Set());
      __publicField(this, "previousMutedState", false);
      __publicField(this, "refreshing", false);
      __publicField(this, "refreshScheduled", false);
      __publicField(this, "refreshTimerId", null);
      __publicField(this, "pendingRefresh", false);
      __publicField(this, "pendingForceFetch", false);
      __publicField(this, "pendingVisibleRefresh", false);
      __publicField(this, "pendingPanelOpenTab", null);
      __publicField(this, "panelRestoreArmed", false);
      __publicField(this, "lastTickTime", null);
      __publicField(this, "lastAnnouncedSignature", "");
      __publicField(this, "handleVisibilityChange", () => {
        if (!document.hidden && this.pendingVisibleRefresh) {
          this.pendingVisibleRefresh = false;
          const nextForceFetch = this.pendingForceFetch;
          this.pendingForceFetch = false;
          this.scheduleRefresh(nextForceFetch);
        }
        if (!document.hidden) {
          this.restorePendingPanelOpen();
        }
      });
      __publicField(this, "handleVideoSignal", (event) => {
        var _a, _b;
        if (!(event instanceof CustomEvent) || !this.started || !this.currentConfig.enabled || !this.currentContext) {
          return;
        }
        const detail = event.detail;
        if (!(detail == null ? void 0 : detail.category) || this.currentConfig.categoryModes[detail.category] === "off") {
          return;
        }
        if (this.currentFullVideoLabels.length > 0 || this.localVideoLabelStore.isDismissed(this.currentContext.bvid)) {
          return;
        }
        const existing = this.currentTitleLabel;
        if (existing && !existing.UUID.startsWith("local-signal:")) {
          return;
        }
        const signal = {
          category: detail.category,
          source: detail.source === "comment-goods" || detail.source === "comment-suspicion" ? detail.source : "page-heuristic",
          confidence: (_a = detail.confidence) != null ? _a : 0.76,
          reason: (_b = detail.reason) != null ? _b : "\u9875\u9762\u51FA\u73B0\u672C\u5730\u5546\u4E1A\u7EBF\u7D22"
        };
        const signalLabel = this.buildLocalSignalSegment(this.currentContext.bvid, signal);
        this.currentTitleLabel = signalLabel;
        this.updateTitleBadge(signalLabel);
        this.panel.setFullVideoLabels([signalLabel]);
        this.updateRuntimeStatus({
          kind: "loaded",
          message: "\u5DF2\u6839\u636E\u672C\u5730\u9875\u9762\u7EBF\u7D22\u8865\u5145\u6574\u89C6\u9891\u6807\u7B7E",
          bvid: this.currentContext.bvid,
          segmentCount: this.currentSegments.length
        });
        void this.localVideoLabelStore.rememberSignal(this.currentContext.bvid, signal);
      });
      __publicField(this, "handleMbgaLiveFallback", () => {
        this.notices.show({
          id: "mbga-live-fallback",
          title: "MBGA \u76F4\u64AD\u589E\u5F3A",
          message: "\u68C0\u6D4B\u5230\u6700\u9AD8\u6E05\u6670\u5EA6\u53EF\u80FD\u4E0D\u53EF\u7528\uFF0C\u5DF2\u4E3A\u60A8\u81EA\u52A8\u5207\u6362\u81F3\u64AD\u653E\u5668\u4E0A\u9009\u62E9\u7684\u6E05\u6670\u5EA6\u3002",
          durationMs: 4e3
        });
      });
      __publicField(this, "userMuteListener", null);
      this.currentConfig = this.configStore.getSnapshot();
      this.currentStats = this.statsStore.getSnapshot();
      this.client = new SponsorBlockClient(this.cache);
      this.videoLabelClient = new VideoLabelClient(this.cache);
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
        onClearCache: () => __async(this, null, function* () {
          yield this.clearCache();
          this.notices.show({
            id: "bsb-tm-maintenance-feedback",
            title: "\u7EF4\u62A4\u5DE5\u5177",
            message: "\u7F13\u5B58\u6E05\u7406\u5DF2\u5B8C\u6210\uFF0C\u76F8\u5173\u6570\u636E\u5DF2\u91CD\u7F6E\u3002",
            durationMs: 3e3
          });
        }),
        onReset: () => __async(this, null, function* () {
          yield this.configStore.reset();
          this.notices.show({
            id: "bsb-tm-maintenance-feedback",
            title: "\u7EF4\u62A4\u5DE5\u5177",
            message: "\u6240\u6709\u811A\u672C\u8BBE\u7F6E\u5DF2\u6062\u590D\u4E3A\u521D\u59CB\u9ED8\u8BA4\u503C\u3002",
            durationMs: 4e3
          });
        }),
        onClose: (reason) => {
          if (reason === "user") {
            this.panelRestoreArmed = false;
            this.pendingPanelOpenTab = null;
            return;
          }
          if (this.panelRestoreArmed) {
            this.pendingPanelOpenTab = this.panel.getActiveTab();
          }
        }
      });
      this.titleBadge = new TitleBadge({
        onVote: (segment, type) => __async(this, null, function* () {
          return yield this.submitVote(segment, type);
        }),
        onLocalDecision: (segment, decision) => __async(this, null, function* () {
          yield this.handleLocalBadgeDecision(segment, decision);
        }),
        onOpenSettings: () => {
          this.panel.open("help");
        }
      });
      this.titleBadge.setColorOverrides(this.currentConfig.categoryColorOverrides);
      this.titleBadge.setTransparencyEnabled(this.currentConfig.labelTransparency.titleBadge);
      this.previewBar.setCategoryColorOverrides(this.currentConfig.categoryColorOverrides);
      this.configStore.subscribe((config) => {
        this.currentConfig = config;
        this.panel.updateConfig(config);
        this.previewBar.setEnabled(config.enabled && config.showPreviewBar);
        this.previewBar.setCategoryColorOverrides(config.categoryColorOverrides);
        this.titleBadge.setColorOverrides(config.categoryColorOverrides);
        this.titleBadge.setTransparencyEnabled(config.labelTransparency.titleBadge);
        this.syncCompactVideoHeader();
        if (!config.enabled) {
          this.notices.clear();
          this.restoreMuteState();
          this.titleBadge.clear();
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
        this.syncCompactVideoHeader();
        this.updateRuntimeStatus(this.buildIdleStatus());
        document.addEventListener("visibilitychange", this.handleVisibilityChange);
        this.panel.mount();
        window.addEventListener(VIDEO_SIGNAL_EVENT, this.handleVideoSignal);
        window.addEventListener("bsb_mbga_live_fallback", this.handleMbgaLiveFallback);
        yield this.refreshCurrentVideo(true);
        this.restorePendingPanelOpen();
        this.stopObservingUrl = observeUrlChanges(() => {
          this.syncCompactVideoHeader();
          this.scheduleRefresh(true);
        });
        this.tickIntervalId = window.setInterval(() => {
          this.tick();
        }, TICK_INTERVAL_MS);
        this.domObserver = new MutationObserver((records) => {
          if (!mutationsTouchSelectors(records, VIDEO_RELEVANT_SELECTORS, VIDEO_IGNORED_SELECTORS)) {
            return;
          }
          this.domStructureDirty = true;
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
      });
    }
    togglePanel() {
      this.panelRestoreArmed = false;
      this.pendingPanelOpenTab = null;
      this.panel.toggle();
    }
    openPanel() {
      this.openPanelWithIntent("overview");
    }
    openHelp() {
      this.openPanelWithIntent("help");
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
      window.removeEventListener(VIDEO_SIGNAL_EVENT, this.handleVideoSignal);
      this.syncCompactVideoHeader();
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
    openPanelWithIntent(tab) {
      this.panelRestoreArmed = true;
      this.pendingPanelOpenTab = tab;
      this.restorePendingPanelOpen();
    }
    restorePendingPanelOpen() {
      if (!this.pendingPanelOpenTab || !this.started || document.hidden) {
        return;
      }
      const tab = this.pendingPanelOpenTab;
      this.pendingPanelOpenTab = null;
      this.panel.open(tab);
    }
    refreshCurrentVideo(forceFetch = false) {
      return __async(this, null, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        let resolvedContext = null;
        if (this.refreshing) {
          this.pendingRefresh = true;
          this.pendingForceFetch = this.pendingForceFetch || forceFetch;
          return;
        }
        this.refreshing = true;
        try {
          this.syncCompactVideoHeader();
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
            this.panel.setFullVideoLabels(this.currentFullVideoLabels);
            this.updateTitleBadge(this.currentTitleLabel);
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
            this.titleBadge.clear();
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
          const [segments, videoLabelCategory] = yield Promise.all([
            this.client.getSegments(context, this.currentConfig),
            this.videoLabelClient.getVideoLabel(context.bvid, this.currentConfig)
          ]);
          this.currentSegments = normalizeSegments(segments, this.currentConfig, context.cid);
          this.currentFullVideoLabels = resolveWholeVideoLabels(
            context.bvid,
            this.currentSegments,
            videoLabelCategory,
            this.currentConfig
          );
          const localTitleLabel = yield this.resolveLocalTitleLabel(context);
          this.currentTitleLabel = (_d = this.currentFullVideoLabels[0]) != null ? _d : localTitleLabel;
          this.panel.setFullVideoLabels(
            this.currentFullVideoLabels.length > 0 ? this.currentFullVideoLabels : this.currentTitleLabel ? [this.currentTitleLabel] : []
          );
          this.updateTitleBadge(this.currentTitleLabel);
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
          } else if (this.currentFullVideoLabels.length > 0) {
            this.updateRuntimeStatus({
              kind: "loaded",
              message: `\u5DF2\u8BC6\u522B ${this.currentFullVideoLabels.length} \u4E2A\u6574\u89C6\u9891\u6807\u7B7E`,
              bvid: context.bvid,
              segmentCount: 0
            });
          } else if (this.currentTitleLabel) {
            this.updateRuntimeStatus({
              kind: "loaded",
              message: "\u5DF2\u6839\u636E\u672C\u5730\u9875\u9762\u7EBF\u7D22\u8865\u5145\u6574\u89C6\u9891\u6807\u7B7E",
              bvid: context.bvid,
              segmentCount: 0
            });
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
            bvid: (_g = (_f = resolvedContext == null ? void 0 : resolvedContext.bvid) != null ? _f : (_e = this.currentContext) == null ? void 0 : _e.bvid) != null ? _g : null,
            segmentCount: null
          });
          this.notices.show({
            id: "bsb-fetch-error",
            title: "\u7247\u6BB5\u8BFB\u53D6\u5931\u8D25",
            message: error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF",
            durationMs: 4e3
          });
          this.titleBadge.clear();
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
      if (this.domStructureDirty) {
        this.domStructureDirty = false;
        if (this.currentConfig.showPreviewBar) {
          this.previewBar.bind(this.currentVideo);
          this.previewBar.setSegments(this.currentSegments);
        }
        this.syncCompactVideoHeader();
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
        const withinSegment = segment.end !== null && currentTime >= segment.start && currentTime < segment.end;
        if (this.shouldResetSegmentState(currentTime, state)) {
          const rewoundIntoAutoSkippedSegment = segment.actionType === "skip" && segment.mode === "auto" && state.actionConsumed && withinSegment;
          const rewoundWithinKeptSegment = segment.actionType === "skip" && segment.mode === "auto" && state.suppressedUntilExit && withinSegment;
          if (rewoundIntoAutoSkippedSegment) {
            this.rearmSegmentState(segment.UUID, state, state.manualSkipGraceShown);
            this.startSkipGrace(segment, state, "\u68C0\u6D4B\u5230\u4F60\u56DE\u5230\u4E86\u8BE5\u7247\u6BB5\uFF0C10 \u79D2\u5185\u4E0D\u4F1A\u518D\u6B21\u81EA\u52A8\u8DF3\u8FC7\u3002");
          } else if (rewoundWithinKeptSegment) {
            this.dismissSkipGrace(segment);
          } else {
            this.resetSegmentState(segment.UUID, state);
          }
        }
        if (!state.actionConsumed && state.lastObservedTime !== null) {
          const jumpedIntoAd = withinSegment && Math.abs(currentTime - state.lastObservedTime) > 1.5 && (segment.end === null || state.lastObservedTime < segment.start || state.lastObservedTime >= segment.end);
          if (jumpedIntoAd && !state.suppressedUntilExit) {
            this.startSkipGrace(segment, state, "\u68C0\u6D4B\u5230\u4F60\u4E3B\u52A8\u8DF3\u8F6C\u81F3\u8BE5\u7247\u6BB5\uFF0C10\u79D2\u5185\u4E0D\u4F1A\u81EA\u52A8\u8DF3\u8FC7\u3002");
          }
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
        this.dismissSkipGrace(segment);
        if (state.mutedByScript) {
          this.deactivateMute(segment.UUID);
          state.mutedByScript = false;
        }
        state.actionConsumed = false;
        state.noticeShown = false;
        state.suppressedUntilExit = false;
        state.poiShown = false;
        state.manualSkipGraceUntil = null;
        state.manualSkipGraceShown = false;
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
          this.dismissSkipGrace(segment);
          state.noticeShown = true;
          state.suppressedUntilExit = false;
          state.manualSkipGraceUntil = null;
          state.manualSkipGraceShown = false;
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
      if (state.manualSkipGraceUntil !== null && Date.now() >= state.manualSkipGraceUntil) {
        state.manualSkipGraceUntil = null;
        this.dismissSkipGrace(segment);
      }
      if (this.isSkipGraceActive(state)) {
        return;
      }
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
      this.dismissSkipGrace(segment);
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
              const state = this.getSegmentState(segment.UUID);
              this.rearmSegmentState(segment.UUID, state, state.manualSkipGraceShown);
              this.currentVideo.currentTime = start;
              this.startSkipGrace(segment, state, "\u5DF2\u56DE\u5230\u5E7F\u544A\u5F00\u59CB\u5904\uFF0C10 \u79D2\u5185\u4E0D\u4F1A\u518D\u6B21\u81EA\u52A8\u8DF3\u8FC7\u3002");
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
        this.attachUserMuteListener();
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
        this.detachUserMuteListener();
        this.currentVideo.muted = this.previousMutedState;
      }
    }
    restoreMuteState() {
      this.detachUserMuteListener();
      if (this.currentVideo && this.activeMuteOwners.size > 0) {
        this.currentVideo.muted = this.previousMutedState;
      }
      this.activeMuteOwners.clear();
    }
    attachUserMuteListener() {
      if (this.userMuteListener || !this.currentVideo) {
        return;
      }
      const video = this.currentVideo;
      this.userMuteListener = () => {
        if (this.activeMuteOwners.size > 0 && !video.muted) {
          this.previousMutedState = false;
        } else if (this.activeMuteOwners.size > 0 && video.muted) {
          this.previousMutedState = true;
        }
      };
      video.addEventListener("volumechange", this.userMuteListener);
    }
    detachUserMuteListener() {
      var _a;
      if (!this.userMuteListener) {
        return;
      }
      (_a = this.currentVideo) == null ? void 0 : _a.removeEventListener("volumechange", this.userMuteListener);
      this.userMuteListener = null;
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
        lastObservedTime: null,
        manualSkipGraceUntil: null,
        manualSkipGraceShown: false
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
    skipGraceNoticeIdForSegment(segment) {
      return `segment-grace:${segment.UUID}`;
    }
    updateTitleBadge(segment) {
      if (!segment) {
        this.titleBadge.clear();
        return;
      }
      this.titleBadge.setSegment(segment, {
        voteLocked: this.voteHistoryStore.has(segment.UUID)
      });
    }
    clearRuntimeState(detachUi = false) {
      this.restoreMuteState();
      this.notices.clear();
      this.segmentStates.clear();
      this.lastTickTime = null;
      this.currentSegments = [];
      this.currentFullVideoLabels = [];
      this.currentTitleLabel = null;
      this.currentSignature = "";
      this.currentContext = null;
      this.currentVideo = null;
      this.panel.setFullVideoLabels([]);
      this.previewBar.clear();
      this.previewBar.bind(null);
      this.titleBadge.clear();
      this.notices.setHost(null);
      if (detachUi) {
        this.panel.unmount();
        this.titleBadge.destroy();
        this.compactHeader.destroy();
      } else {
        this.syncCompactVideoHeader();
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
    syncCompactVideoHeader() {
      this.compactHeader.setOptions({
        placeholderVisible: this.currentConfig.compactHeaderPlaceholderVisible,
        searchPlaceholderEnabled: this.currentConfig.compactHeaderSearchPlaceholderEnabled
      });
      const shouldCompact = this.started && this.currentConfig.enabled && this.currentConfig.compactVideoHeader && supportsVideoFeatures(window.location.href);
      if (shouldCompact) {
        this.compactHeader.mount();
        return;
      }
      this.compactHeader.unmount();
    }
    resolveFullVideoSegment() {
      return this.currentTitleLabel;
    }
    buildLocalSignalSegment(bvid, signal) {
      var _a;
      const category = (_a = signal.category) != null ? _a : "sponsor";
      return {
        UUID: `local-signal:${bvid}:${signal.source}:${category}`,
        category,
        actionType: "full",
        segment: [0, 0],
        start: 0,
        end: 0,
        duration: 0,
        mode: this.currentConfig.categoryModes[category]
      };
    }
    resolveLocalTitleLabel(context) {
      return __async(this, null, function* () {
        const learned = this.localVideoLabelStore.getResolved(context.bvid);
        if ((learned == null ? void 0 : learned.category) && this.currentConfig.categoryModes[learned.category] !== "off") {
          return this.buildLocalSignalSegment(context.bvid, learned);
        }
        if (this.localVideoLabelStore.isDismissed(context.bvid)) {
          return null;
        }
        const commentSignal = scanCurrentPageCommentSignal(this.currentConfig);
        const pageSignal = inferLocalVideoSignal(context);
        const localSignal = this.pickPreferredLocalSignal(commentSignal, pageSignal);
        if (!localSignal || this.currentConfig.categoryModes[localSignal.category] === "off") {
          return null;
        }
        if (localSignal.confidence >= 0.72) {
          yield this.localVideoLabelStore.rememberSignal(context.bvid, localSignal);
        }
        return this.buildLocalSignalSegment(context.bvid, localSignal);
      });
    }
    pickPreferredLocalSignal(commentSignal, pageSignal) {
      if (commentSignal && pageSignal) {
        return commentSignal.confidence >= pageSignal.confidence ? commentSignal : pageSignal;
      }
      return commentSignal != null ? commentSignal : pageSignal;
    }
    handleLocalBadgeDecision(segment, decision) {
      return __async(this, null, function* () {
        if (!this.currentContext || !segment.UUID.startsWith("local-signal:")) {
          return;
        }
        if (decision === "confirm") {
          yield this.localVideoLabelStore.rememberManual(this.currentContext.bvid, segment.category, `\u624B\u52A8\u4FDD\u7559 ${CATEGORY_LABELS[segment.category]}`);
          this.currentTitleLabel = this.buildLocalSignalSegment(this.currentContext.bvid, {
            category: segment.category,
            source: "manual",
            reason: `\u624B\u52A8\u4FDD\u7559 ${CATEGORY_LABELS[segment.category]}`
          });
          this.updateTitleBadge(this.currentTitleLabel);
          this.panel.setFullVideoLabels([this.currentTitleLabel]);
          this.notices.show({
            id: `local-label-confirm:${this.currentContext.bvid}`,
            title: "\u5DF2\u4FDD\u7559\u672C\u5730\u6807\u7B7E",
            message: `\u540E\u7EED\u4F1A\u7EE7\u7EED\u628A\u8FD9\u4E2A\u89C6\u9891\u89C6\u4F5C\u201C${CATEGORY_LABELS[segment.category]}\u201D\u3002`,
            durationMs: 2800
          });
          return;
        }
        yield this.localVideoLabelStore.dismiss(this.currentContext.bvid, `\u624B\u52A8\u5FFD\u7565 ${CATEGORY_LABELS[segment.category]}`);
        this.currentTitleLabel = null;
        this.titleBadge.clear();
        this.panel.setFullVideoLabels([]);
        this.updateRuntimeStatus({
          kind: this.currentSegments.length > 0 ? "loaded" : "empty",
          message: this.currentSegments.length > 0 ? `\u5DF2\u52A0\u8F7D ${this.currentSegments.length} \u4E2A\u53EF\u5904\u7406\u7247\u6BB5` : "\u5F53\u524D\u89C6\u9891\u6682\u65E0\u53EF\u663E\u793A\u7684\u6574\u89C6\u9891\u6807\u7B7E",
          bvid: this.currentContext.bvid,
          segmentCount: this.currentSegments.length
        });
        this.notices.show({
          id: `local-label-dismiss:${this.currentContext.bvid}`,
          title: "\u5DF2\u5FFD\u7565\u672C\u5730\u6807\u7B7E",
          message: "\u5F53\u524D\u89C6\u9891\u540E\u7EED\u4E0D\u4F1A\u7EE7\u7EED\u663E\u793A\u8FD9\u6761\u672C\u5730\u5546\u4E1A\u63D0\u793A\u3002",
          durationMs: 2800
        });
      });
    }
    submitVote(segment, type) {
      return __async(this, null, function* () {
        var _a, _b;
        const response = yield this.client.vote(segment.UUID, type, this.currentConfig);
        if (response.successType === 1) {
          yield this.voteHistoryStore.remember(segment.UUID);
          if (((_a = this.currentTitleLabel) == null ? void 0 : _a.UUID) === segment.UUID) {
            this.updateTitleBadge(this.currentTitleLabel);
          }
          this.notices.show({
            id: `segment-vote:${segment.UUID}:${type}`,
            title: "\u53CD\u9988\u5DF2\u63D0\u4EA4",
            message: type === 1 ? "\u5DF2\u6807\u8BB0\u4E3A\u201C\u6B63\u786E\u201D\uFF0C\u611F\u8C22\u53CD\u9988\u3002" : "\u5DF2\u6807\u8BB0\u4E3A\u201C\u6709\u8BEF\u201D\uFF0C\u611F\u8C22\u53CD\u9988\u3002",
            durationMs: 2600
          });
          return "submitted";
        }
        if (response.successType === 0) {
          yield this.voteHistoryStore.remember(segment.UUID);
          if (((_b = this.currentTitleLabel) == null ? void 0 : _b.UUID) === segment.UUID) {
            this.updateTitleBadge(this.currentTitleLabel);
          }
          this.notices.show({
            id: `segment-vote-duplicate:${segment.UUID}:${type}`,
            title: "\u5DF2\u63D0\u4EA4\u8FC7\u53CD\u9988",
            message: "\u8FD9\u4E2A\u6574\u89C6\u9891\u6807\u7B7E\u4F60\u4E4B\u524D\u5DF2\u7ECF\u6295\u8FC7\u7968\u4E86\u3002",
            durationMs: 2800
          });
          return "duplicate";
        }
        this.notices.show({
          id: `segment-vote-error:${segment.UUID}:${type}`,
          title: "\u53CD\u9988\u63D0\u4EA4\u5931\u8D25",
          message: response.statusCode === 403 ? "\u670D\u52A1\u7AEF\u62D2\u7EDD\u4E86\u8FD9\u6B21\u53CD\u9988\uFF0C\u7A0D\u540E\u53EF\u518D\u8BD5\u4E00\u6B21\u3002" : response.statusCode === -1 ? "\u8BF7\u6C42\u6CA1\u6709\u9001\u8FBE SponsorBlock \u670D\u52A1\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u6216 Tampermonkey \u6388\u6743\u3002" : response.responseText || `SponsorBlock API returned ${response.statusCode}`,
          durationMs: 3600
        });
        return "error";
      });
    }
    shouldResetSegmentState(currentTime, state) {
      return state.lastObservedTime !== null && currentTime < state.lastObservedTime - SEGMENT_REWIND_RESET_SEC;
    }
    isSkipGraceActive(state) {
      return state.manualSkipGraceUntil !== null && Date.now() < state.manualSkipGraceUntil;
    }
    dismissSkipGrace(segment) {
      this.notices.dismiss(this.skipGraceNoticeIdForSegment(segment));
    }
    suppressAutoSkipForCurrentSegment(segment) {
      const state = this.getSegmentState(segment.UUID);
      state.manualSkipGraceUntil = null;
      state.manualSkipGraceShown = true;
      state.suppressedUntilExit = true;
      state.noticeShown = true;
      this.dismissSkipGrace(segment);
    }
    startSkipGrace(segment, state, message) {
      state.manualSkipGraceUntil = Date.now() + SKIP_GRACE_WINDOW_MS;
      if (state.manualSkipGraceShown) {
        return;
      }
      state.manualSkipGraceShown = true;
      this.notices.show({
        id: this.skipGraceNoticeIdForSegment(segment),
        title: `${CATEGORY_LABELS[segment.category]}\u7247\u6BB5`,
        message,
        durationMs: SKIP_GRACE_WINDOW_MS,
        actions: [
          {
            label: "\u4FDD\u7559\u672C\u6BB5",
            variant: "secondary",
            onClick: () => {
              this.suppressAutoSkipForCurrentSegment(segment);
            }
          },
          {
            label: "\u7ACB\u5373\u8DF3\u8FC7",
            variant: "primary",
            onClick: () => {
              const nextState = this.getSegmentState(segment.UUID);
              nextState.manualSkipGraceUntil = null;
              this.dismissSkipGrace(segment);
              this.performSkip(segment, "\u7EE7\u7EED\u8DF3\u8FC7");
              nextState.actionConsumed = true;
              nextState.noticeShown = true;
              nextState.suppressedUntilExit = true;
            }
          }
        ]
      });
    }
    rearmSegmentState(id, state, preserveSkipGraceShown = false) {
      this.notices.dismiss(`segment:${id}`);
      this.notices.dismiss(`segment-result:${id}`);
      if (!preserveSkipGraceShown) {
        this.notices.dismiss(`segment-grace:${id}`);
      }
      if (state.mutedByScript) {
        this.deactivateMute(id);
      }
      state.actionConsumed = false;
      state.noticeShown = false;
      state.suppressedUntilExit = false;
      state.mutedByScript = false;
      state.poiShown = false;
      state.lastObservedTime = null;
      state.manualSkipGraceUntil = null;
      if (!preserveSkipGraceShown) {
        state.manualSkipGraceShown = false;
      }
    }
    resetSegmentState(id, state) {
      this.rearmSegmentState(id, state);
    }
  };

  // src/features/dynamic-filter.ts
  var PROCESSED_ATTR = "data-bsb-dynamic-processed";
  var BADGE_SELECTOR = "[data-bsb-dynamic-badge]";
  var TOGGLE_SELECTOR = "[data-bsb-dynamic-toggle]";
  var HIDDEN_ATTR2 = "data-bsb-dynamic-hidden";
  var DYNAMIC_RELEVANT_SELECTORS = [
    ".bili-dyn-item",
    ".bili-dyn-card-goods",
    ".bili-rich-text__content",
    ".dyn-card-opus",
    ".dyn-card-opus__title"
  ];
  var DYNAMIC_IGNORED_SELECTORS = [BADGE_SELECTOR, TOGGLE_SELECTOR];
  var currentInlineBadgeAppearance2 = {
    dynamicBadge: false
  };
  var DYNAMIC_STRONG_MATCHES = /* @__PURE__ */ new Set(["\u8D5E\u52A9", "\u5546\u52A1\u5408\u4F5C", "\u5546\u54C1\u5361", "\u4F18\u60E0\u5238", "\u8D2D\u4E70\u6307\u5F15"]);
  var DYNAMIC_INVITATION_PATTERN = /邀请码|体验码|兑换码|注册码/iu;
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
    const text = [
      ...element.querySelectorAll(".bili-rich-text__content span:not(.bili-dyn-item__interaction *), .opus-paragraph-children span, .dyn-card-opus__title")
    ].map((node) => {
      var _a;
      return (_a = node.textContent) != null ? _a : "";
    }).join(" ");
    const storedMatches = pattern ? collectPatternMatches(text, pattern) : [];
    const assessment = analyzeCommercialIntent(text, {
      storedMatches,
      minMatches: config.dynamicRegexKeywordMinMatches
    });
    if (!assessment.category) {
      return null;
    }
    const actionability = inspectCommercialActionability(text);
    const hasStrongToken = assessment.matches.some((match) => DYNAMIC_STRONG_MATCHES.has(match));
    const hasInvitationLead = DYNAMIC_INVITATION_PATTERN.test(text);
    const hasStrongEvidence = actionability.hasStrongClosure || hasStrongToken || hasInvitationLead;
    if (actionability.hasQuotedOrMockingContext) {
      return null;
    }
    if (pattern && !isLikelyPromoText(text, storedMatches, config.dynamicRegexKeywordMinMatches) && !hasStrongEvidence && assessment.category !== "selfpromo") {
      return null;
    }
    if (assessment.category === "sponsor" && !hasStrongEvidence) {
      return null;
    }
    if (assessment.category === "selfpromo" && !actionability.hasOwnedActionLead) {
      return null;
    }
    if (assessment.category === "exclusive_access" && !actionability.hasStrongClosure && assessment.exclusiveScore < 3.2) {
      return null;
    }
    return {
      category: assessment.category === "selfpromo" ? "dynamicSponsor_forward_sponsor" : "dynamicSponsor_suspicion_sponsor",
      matches: storedMatches.length > 0 ? storedMatches : assessment.matches
    };
  }
  function getBadgeText2(match) {
    if (match.category === "dynamicSponsor_forward_sponsor") {
      return "\u8F6C\u53D1\u5E26\u8D27";
    }
    if (match.category === "dynamicSponsor_sponsor") {
      return "\u5E26\u8D27\u52A8\u6001";
    }
    return match.matches.length > 0 ? `\u7591\u4F3C\u5E7F\u544A: ${match.matches.join(" / ")}` : "\u7591\u4F3C\u5E7F\u544A";
  }
  function getBadgeTone2(match) {
    switch (match.category) {
      case "dynamicSponsor_forward_sponsor":
        return "warning";
      case "dynamicSponsor_suspicion_sponsor":
        return "warning";
      default:
        return "danger";
    }
  }
  function resolveBadgeAnchor(element) {
    var _a, _b, _c;
    return (_c = (_b = (_a = element.querySelector(".bili-dyn-title__text")) != null ? _a : element.querySelector(".dyn-card-opus__title")) != null ? _b : element.querySelector(".bili-dyn-item__header")) != null ? _c : element.querySelector(".bili-dyn-item__main");
  }
  function resolveContentBody(element) {
    var _a, _b;
    return (_b = (_a = element.querySelector(".bili-dyn-content")) != null ? _a : element.querySelector(".dyn-card-opus")) != null ? _b : element.querySelector(".bili-dyn-item__main");
  }
  function createBadge2(text, tone) {
    return createInlineBadge(
      "data-bsb-dynamic-badge",
      text,
      tone,
      "stack",
      void 0,
      currentInlineBadgeAppearance2.dynamicBadge ? "glass" : "solid"
    );
  }
  function createToggleButton2(onClick) {
    return createInlineToggle("data-bsb-dynamic-toggle", onClick, "stack");
  }
  function setDynamicHidden(body, button, hidden) {
    body.style.display = hidden ? "none" : "";
    body.setAttribute(HIDDEN_ATTR2, String(hidden));
    setInlineToggleState(button, hidden ? "hidden" : "shown", {
      hidden: "\u663E\u793A\u52A8\u6001\u5185\u5BB9",
      shown: "\u518D\u6B21\u9690\u85CF\u52A8\u6001"
    });
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
      currentInlineBadgeAppearance2.dynamicBadge = this.currentConfig.labelTransparency.dynamicBadge;
      this.configStore.subscribe((config) => {
        this.currentConfig = config;
        currentInlineBadgeAppearance2.dynamicBadge = config.labelTransparency.dynamicBadge;
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
      const badge = createBadge2(getBadgeText2(match), getBadgeTone2(match));
      anchor.parentElement.insertBefore(badge, anchor.nextSibling);
      if (this.currentConfig.dynamicFilterMode !== "hide") {
        return;
      }
      const body = resolveContentBody(element);
      if (!body || body.getAttribute(HIDDEN_ATTR2) === "true") {
        return;
      }
      const toggle = createToggleButton2(() => {
        const hidden = body.style.display === "none";
        setDynamicHidden(body, toggle, !hidden);
      });
      setDynamicHidden(body, toggle, true);
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
          body.removeAttribute(HIDDEN_ATTR2);
        }
      }
      debugLog("Dynamic sponsor state reset");
    }
  };

  // src/features/thumbnail-labels.ts
  var PROCESSED_ATTR2 = "data-bsb-thumbnail-processed";
  var RELEVANT_SELECTORS = [
    ".bili-video-card",
    ".video-page-card-small",
    ".video-page-card",
    ".video-page-special-card-small",
    ".pop-live-card",
    ".video-card",
    ".video-episode-card",
    ".history-card",
    ".bili-cover-card",
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
      itemSelector: "a.header-history-card",
      labelAnchorSelector: ".cover, .header-history-card__cover, .bili-cover-card__thumbnail",
      placement: "corner"
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
        itemSelector: ".history-card, .bili-cover-card, .history-video-card",
        labelAnchorSelector: ".bili-cover-card__thumbnail"
      }
    ],
    search: [...COMMON_THUMBNAIL_TARGETS, { containerSelector: ".search-page-wrapper", itemSelector: ".bili-video-card" }],
    video: [
      ...COMMON_THUMBNAIL_TARGETS,
      {
        containerSelector: ".right-container, .rec-list, .rec-list-container, .next-play-list",
        itemSelector: ".video-page-card-small, .video-page-card, .video-page-special-card-small, .rec-list .video-page-card-small, .rec-list .video-page-card, .rec-list .video-page-special-card-small",
        labelAnchorSelector: ".pic-box, .pic, .b-img, .cover, .cover-picture, .cover-picture__image, .bili-cover-card__thumbnail, .card-box",
        placement: "corner"
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
        labelAnchorSelector: ".activity-image-card"
      }
    ]
  };
  var DEFAULT_LINK_SELECTOR = "a[href]";
  var DEFAULT_LINK_ATTRIBUTE = "href";
  var DEFAULT_LABEL_ANCHOR_SELECTOR = ".bili-video-card__cover, .bili-cover-card__thumbnail, .activity-image-card, .activity-image-card__image, .header-history-card__cover, .b-img, .pic-box, .pic, .cover, .cover-picture, .cover-picture__image, .v-img, a[href*='/video/'], picture";
  var CANDIDATE_LINK_ATTRIBUTES = [
    "href",
    "data-target-url",
    "data-url",
    "data-link",
    "data-href",
    "data-video-id",
    "data-bvid"
  ];
  var GENERIC_THUMBNAIL_TARGETS = [
    { containerSelector: "body", itemSelector: ".bili-video-card" },
    {
      containerSelector: "body",
      itemSelector: ".video-page-card-small",
      labelAnchorSelector: ".pic-box, .pic, .b-img",
      placement: "corner"
    },
    {
      containerSelector: "body",
      itemSelector: ".video-page-card",
      labelAnchorSelector: ".pic-box, .pic, .b-img",
      placement: "corner"
    },
    { containerSelector: "body", itemSelector: ".pop-live-card" },
    { containerSelector: "body", itemSelector: ".video-card" },
    { containerSelector: "body", itemSelector: ".video-episode-card", labelAnchorSelector: ".activity-image-card" },
    { containerSelector: "body", itemSelector: ".history-card", labelAnchorSelector: ".bili-cover-card__thumbnail" },
    { containerSelector: "body", itemSelector: ".bili-cover-card", labelAnchorSelector: ".bili-cover-card__thumbnail" },
    {
      containerSelector: "body",
      itemSelector: ".header-history-card",
      labelAnchorSelector: ".cover, .header-history-card__cover, .bili-cover-card__thumbnail",
      placement: "corner"
    },
    { containerSelector: "body", itemSelector: ".bili-dyn-content" }
  ];
  var GENERIC_VIDEO_LINK_SELECTOR = "a[href*='/video/BV'], a[href*='bilibili.com/video/BV'], [data-bvid^='BV'], [data-video-id^='BV']";
  function extractBvidFromAttributeValue(value) {
    if (!value) {
      return null;
    }
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }
    if (isBvid(normalized)) {
      return normalized;
    }
    return extractBvidFromUrl(normalized);
  }
  function collectCardLinks(card, target) {
    var _a, _b, _c, _d;
    const linkSelector = (_a = target.linkSelector) != null ? _a : DEFAULT_LINK_SELECTOR;
    const linkAttribute = (_b = target.linkAttribute) != null ? _b : DEFAULT_LINK_ATTRIBUTE;
    const urls = /* @__PURE__ */ new Set();
    const candidates = card.matches(linkSelector) ? [card] : [];
    candidates.push(...Array.from(card.querySelectorAll(linkSelector)));
    for (const link of candidates) {
      const bvid = (_d = (_c = extractBvidFromAttributeValue(link.getAttribute(linkAttribute))) != null ? _c : CANDIDATE_LINK_ATTRIBUTES.map((attribute) => extractBvidFromAttributeValue(link.getAttribute(attribute))).find(Boolean)) != null ? _d : null;
      if (bvid) {
        urls.add(bvid);
      }
    }
    if (urls.size === 0) {
      const nodes = [card, ...Array.from(card.querySelectorAll("[data-bvid], [data-video-id], [data-target-url], [data-url], [data-link], [data-href]"))];
      for (const node of nodes) {
        for (const attribute of CANDIDATE_LINK_ATTRIBUTES) {
          const bvid = extractBvidFromAttributeValue(node.getAttribute(attribute));
          if (bvid) {
            urls.add(bvid);
          }
        }
      }
    }
    return [...urls];
  }
  function resolveLabelAnchor(card, target) {
    var _a, _b;
    const coverAnchor = (_b = (_a = target.labelAnchorSelector ? card.querySelector(target.labelAnchorSelector) : null) != null ? _a : card.querySelector(DEFAULT_LABEL_ANCHOR_SELECTOR)) != null ? _b : card.lastElementChild instanceof HTMLElement ? card.lastElementChild : null;
    const normalizedCoverAnchor = (coverAnchor == null ? void 0 : coverAnchor.matches("img, picture")) ? coverAnchor.parentElement : coverAnchor;
    normalizedCoverAnchor == null ? void 0 : normalizedCoverAnchor.classList.add("bsb-tm-thumbnail-cover-anchor");
    return normalizedCoverAnchor != null ? normalizedCoverAnchor : null;
  }
  function ensureCardHost(card) {
    card.classList.add("bsb-tm-thumbnail-card-host");
    return card;
  }
  function ensureOverlayHost(card) {
    const host = card;
    ensureCardHost(card);
    host.classList.add("bsb-tm-thumbnail-host");
    if (getComputedStyle(host).position === "static") {
      host.style.position = "relative";
    }
    return host;
  }
  function positionOverlay(host, card, anchor, overlay) {
    var _a;
    const slot = overlay.parentElement instanceof HTMLElement ? overlay.parentElement : overlay;
    const placement = slot.dataset.placement === "corner" ? "corner" : "default";
    const hostRect = host.getBoundingClientRect();
    const anchorRect = (_a = anchor == null ? void 0 : anchor.getBoundingClientRect()) != null ? _a : null;
    if (placement === "corner") {
      const anchorWidth2 = anchorRect && Number.isFinite(anchorRect.width) ? anchorRect.width : hostRect.width || card.getBoundingClientRect().width;
      const anchorLeft2 = anchorRect && Number.isFinite(anchorRect.left) ? Math.max(0, anchorRect.left - hostRect.left + 6) : 6;
      const anchorTop2 = anchorRect && Number.isFinite(anchorRect.top) ? Math.max(0, anchorRect.top - hostRect.top + 6) : 6;
      slot.style.setProperty("--bsb-thumbnail-anchor-left", `${Math.round(anchorLeft2)}px`);
      slot.style.setProperty("--bsb-thumbnail-anchor-top", `${Math.round(anchorTop2)}px`);
      slot.style.setProperty("--bsb-thumbnail-anchor-width", `${Math.round(anchorWidth2)}px`);
      return;
    }
    const anchorLeft = anchorRect && host !== anchor && Number.isFinite(anchorRect.left) ? anchorRect.left - hostRect.left + anchorRect.width / 2 : hostRect.width / 2;
    const anchorTop = anchorRect && host !== anchor && Number.isFinite(anchorRect.top) ? Math.max(0, anchorRect.top - hostRect.top) : 0;
    const anchorWidth = anchorRect && Number.isFinite(anchorRect.width) ? anchorRect.width : hostRect.width || card.getBoundingClientRect().width;
    slot.style.setProperty("--bsb-thumbnail-anchor-left", `${Math.round(anchorLeft)}px`);
    slot.style.setProperty("--bsb-thumbnail-anchor-top", `${Math.round(anchorTop)}px`);
    slot.style.setProperty("--bsb-thumbnail-anchor-width", `${Math.round(anchorWidth)}px`);
  }
  function estimateTextWidth(text, fontSize, isCorner, multiplier) {
    var _a;
    const normalized = text.trim();
    if (!normalized) {
      return Math.round(fontSize);
    }
    const probe = document.createElement("span");
    probe.textContent = normalized;
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    probe.style.whiteSpace = "nowrap";
    probe.style.setProperty("-webkit-font-smoothing", "antialiased");
    probe.style.textRendering = "optimizeLegibility";
    probe.style.font = `650 ${fontSize}px -apple-system, BlinkMacSystemFont, "PingFang SC", "SF Pro Text", sans-serif`;
    probe.style.letterSpacing = isCorner ? "0" : "0.01em";
    ((_a = document.body) != null ? _a : document.documentElement).appendChild(probe);
    const measured = probe.getBoundingClientRect().width;
    probe.remove();
    return Math.max(Math.ceil(measured * multiplier + 2), Math.round(fontSize));
  }
  function syncOverlayMetrics(overlay, shortLabel, fullLabel) {
    const placement = overlay.dataset.placement || "default";
    const isCorner = placement === "corner";
    const fontSize = isCorner ? 9.5 : 10;
    const padding = isCorner ? 7 : 9;
    const dotAndGap = isCorner ? 9 : 11;
    const minCollapsed = isCorner ? 19 : 38;
    const maxExpanded = 180;
    const multiplier = isCorner ? 1.08 : 1;
    const mainSafety = isCorner ? 4 : 8;
    const measuredShort = estimateTextWidth(shortLabel, fontSize, isCorner, multiplier);
    const measuredFull = estimateTextWidth(fullLabel, fontSize, isCorner, multiplier);
    const collapsedTextWidth = measuredShort;
    const expandedTextWidth = Math.max(collapsedTextWidth, measuredFull);
    const leftOffset = padding + dotAndGap;
    const collapsedWidth = Math.max(minCollapsed, Math.round(collapsedTextWidth + leftOffset * 2));
    const baseExpandedWidth = Math.round(expandedTextWidth + leftOffset * 2 + mainSafety);
    const expandedWidth = Math.min(maxExpanded, Math.max(collapsedWidth + 4, baseExpandedWidth));
    overlay.style.setProperty("--bsb-thumbnail-collapsed-width", `${collapsedWidth}px`);
    overlay.style.setProperty("--bsb-thumbnail-expanded-width", `${expandedWidth}px`);
    overlay.style.setProperty("--bsb-thumbnail-collapsed-text-width", `${collapsedTextWidth}px`);
    overlay.style.setProperty("--bsb-thumbnail-expanded-text-width", `${expandedTextWidth}px`);
  }
  function bindOverlayHoverState(host, anchor, slot, overlay) {
    if (slot.dataset.hoverBound === "true") {
      return;
    }
    slot.dataset.hoverBound = "true";
    const trigger = anchor != null ? anchor : host;
    let pendingFrame = 0;
    const setExpanded = (expanded) => {
      if (expanded) {
        host.dataset.bsbHover = "true";
        slot.dataset.bsbExpanded = "true";
        overlay.dataset.bsbExpanded = "true";
        return;
      }
      host.removeAttribute("data-bsb-hover");
      slot.removeAttribute("data-bsb-expanded");
      overlay.removeAttribute("data-bsb-expanded");
    };
    const isActive = (node) => {
      if (!node) {
        return false;
      }
      return node.matches(":hover") || node.matches(":focus-within");
    };
    const syncState = () => {
      pendingFrame = 0;
      setExpanded(isActive(host) || isActive(trigger) || isActive(slot));
    };
    const scheduleSync = () => {
      if (pendingFrame) {
        cancelAnimationFrame(pendingFrame);
      }
      pendingFrame = requestAnimationFrame(syncState);
    };
    const activate = () => {
      if (pendingFrame) {
        cancelAnimationFrame(pendingFrame);
        pendingFrame = 0;
      }
      setExpanded(true);
    };
    for (const node of /* @__PURE__ */ new Set([host, trigger, slot])) {
      node.addEventListener("pointerenter", activate);
      node.addEventListener("mouseenter", activate);
      node.addEventListener("mouseover", activate);
      node.addEventListener("focusin", activate);
      node.addEventListener("pointerleave", scheduleSync);
      node.addEventListener("mouseleave", scheduleSync);
      node.addEventListener("mouseout", scheduleSync);
      node.addEventListener("focusout", scheduleSync);
    }
  }
  function getOrCreateOverlay(card, target) {
    var _a, _b, _c, _d;
    const anchor = resolveLabelAnchor(card, target);
    const host = ensureOverlayHost(card);
    const existing = card.querySelector(".sponsorThumbnailLabel");
    if (existing) {
      const textStack2 = existing.querySelector(".bsb-tm-thumbnail-text-stack");
      const shortText2 = existing.querySelector(".bsb-tm-thumbnail-short-label");
      const text2 = existing.querySelector(".bsb-tm-thumbnail-label");
      const slot2 = existing.parentElement instanceof HTMLElement ? existing.parentElement : null;
      if (textStack2 instanceof HTMLElement && shortText2 instanceof HTMLElement && text2 instanceof HTMLElement && (slot2 == null ? void 0 : slot2.classList.contains("bsb-tm-thumbnail-slot")) && slot2.parentElement === host) {
        slot2.dataset.placement = (_a = target.placement) != null ? _a : "default";
        existing.dataset.placement = (_b = target.placement) != null ? _b : "default";
        existing.dataset.glassContext = "overlay";
        bindOverlayHoverState(host, anchor, slot2, existing);
        positionOverlay(host, card, anchor, existing);
        return { slot: slot2, overlay: existing, shortText: shortText2, text: text2, anchor };
      }
      slot2 == null ? void 0 : slot2.remove();
      existing.remove();
    }
    const slot = document.createElement("div");
    slot.className = "bsb-tm-thumbnail-slot";
    slot.dataset.placement = (_c = target.placement) != null ? _c : "default";
    const overlay = document.createElement("div");
    overlay.className = "sponsorThumbnailLabel";
    overlay.dataset.placement = (_d = target.placement) != null ? _d : "default";
    overlay.dataset.glassContext = "overlay";
    const textStack = document.createElement("span");
    textStack.className = "bsb-tm-thumbnail-text-stack";
    const shortText = document.createElement("span");
    shortText.className = "bsb-tm-thumbnail-short-label";
    shortText.appendChild(document.createElement("span"));
    textStack.appendChild(shortText);
    const text = document.createElement("span");
    text.className = "bsb-tm-thumbnail-label";
    text.appendChild(document.createElement("span"));
    textStack.appendChild(text);
    overlay.appendChild(textStack);
    slot.appendChild(overlay);
    host.appendChild(slot);
    bindOverlayHoverState(host, anchor, slot, overlay);
    positionOverlay(host, card, anchor, overlay);
    return { slot, overlay, shortText, text, anchor };
  }
  function hideOverlay(card) {
    const overlay = card.querySelector(".sponsorThumbnailLabel");
    if (!overlay) {
      return;
    }
    overlay.classList.remove("sponsorThumbnailLabelVisible");
    overlay.removeAttribute("data-category");
    card.removeAttribute("data-bsb-hover");
    card.removeAttribute(PROCESSED_ATTR2);
  }
  function applyCategoryLabel(card, target, videoId, category, config) {
    const { overlay, shortText, text, anchor } = getOrCreateOverlay(card, target);
    const transparencyEnabled = config.labelTransparency.thumbnailLabel;
    const host = overlay.parentElement instanceof HTMLElement && overlay.parentElement.parentElement instanceof HTMLElement ? overlay.parentElement.parentElement : card;
    const style = resolveCategoryStyle(category, config.categoryColorOverrides);
    const glassVariant = transparencyEnabled ? style.transparentVariant : "dark";
    card.setAttribute(PROCESSED_ATTR2, videoId);
    overlay.dataset.category = category;
    overlay.dataset.glassContext = "overlay";
    overlay.dataset.glassVariant = glassVariant;
    overlay.style.setProperty("--category-accent", style.accent);
    overlay.style.setProperty("--category-display-accent", style.transparentDisplayAccent);
    overlay.style.setProperty("--category-contrast", glassVariant === "light" ? style.contrast : style.darkContrast);
    overlay.style.setProperty("--category-glass-surface", glassVariant === "light" ? style.glassSurface : style.darkSurface);
    overlay.style.setProperty("--category-glass-border", style.glassBorder);
    overlay.dataset.transparent = String(transparencyEnabled);
    overlay.setAttribute("aria-label", `\u6574\u89C6\u9891\u6807\u7B7E\uFF1A${CATEGORY_LABELS[category]}`);
    const shortTextNode = shortText.firstElementChild instanceof HTMLElement ? shortText.firstElementChild : shortText;
    const textNode = text.firstElementChild instanceof HTMLElement ? text.firstElementChild : text;
    shortTextNode.textContent = CATEGORY_SHORT_LABELS[category];
    textNode.textContent = CATEGORY_LABELS[category];
    syncOverlayMetrics(overlay, CATEGORY_SHORT_LABELS[category], CATEGORY_LABELS[category]);
    positionOverlay(host, card, anchor, overlay);
    overlay.classList.add("sponsorThumbnailLabelVisible");
  }
  var WholeVideoLabelClient = class {
    constructor(cache) {
      __publicField(this, "segmentClient");
      __publicField(this, "labelClient");
      __publicField(this, "rawLabelRequests", /* @__PURE__ */ new Map());
      this.segmentClient = new SponsorBlockClient(cache);
      this.labelClient = new VideoLabelClient(cache);
    }
    getWholeVideoLabel(videoId, config) {
      return __async(this, null, function* () {
        const normalizedServer = config.serverAddress.replace(/\/+$/u, "");
        const cacheKey = `${normalizedServer}:${videoId}`;
        const existing = this.rawLabelRequests.get(cacheKey);
        const context = {
          bvid: videoId,
          cid: null,
          page: 1,
          title: null,
          href: window.location.href
        };
        const request = existing != null ? existing : Promise.all([
          this.segmentClient.getSegments(context, config),
          this.labelClient.getVideoLabel(videoId, config)
        ]).then(([segments2, labelCategory2]) => ({
          segments: segments2,
          labelCategory: labelCategory2
        })).finally(() => {
          this.rawLabelRequests.delete(cacheKey);
        });
        if (!existing) {
          this.rawLabelRequests.set(cacheKey, request);
        }
        const { segments, labelCategory } = yield request;
        return resolveWholeVideoCategory(videoId, normalizeSegments(segments, config), labelCategory, config);
      });
    }
  };
  var ThumbnailLabelController = class {
    constructor(configStore, cache, localVideoLabelStore) {
      this.configStore = configStore;
      this.localVideoLabelStore = localVideoLabelStore;
      __publicField(this, "started", false);
      __publicField(this, "refreshing", false);
      __publicField(this, "pendingRefresh", false);
      __publicField(this, "refreshTimerId", null);
      __publicField(this, "domObserver", null);
      __publicField(this, "stopObservingUrl", null);
      __publicField(this, "currentConfig");
      __publicField(this, "client");
      __publicField(this, "handleWindowLayoutChange", () => {
        this.scheduleRefresh();
      });
      __publicField(this, "handleVisibilityChange", () => {
        if (!document.hidden) {
          this.scheduleRefresh();
        }
      });
      this.currentConfig = this.configStore.getSnapshot();
      this.client = new WholeVideoLabelClient(cache);
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
      window.addEventListener("resize", this.handleWindowLayoutChange);
      window.addEventListener("load", this.handleWindowLayoutChange, { once: true });
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
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
      window.removeEventListener("resize", this.handleWindowLayoutChange);
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
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
        const schedule = typeof requestIdleCallback === "function" ? requestIdleCallback : (cb) => window.setTimeout(cb, 0);
        schedule(() => {
          void this.refresh();
        });
      }, 180);
    }
    refresh() {
      return __async(this, null, function* () {
        var _a, _b;
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
          const targets = [...(_a = THUMBNAIL_TARGETS[pageType]) != null ? _a : [], ...GENERIC_THUMBNAIL_TARGETS];
          if (targets.length === 0) {
            return;
          }
          const processedCards = /* @__PURE__ */ new Set();
          const jobs = [];
          for (const target of targets) {
            const containers = document.querySelectorAll(target.containerSelector);
            for (const container of containers) {
              const cards = container.querySelectorAll(target.itemSelector);
              for (const card of cards) {
                if (processedCards.has(card) || !card.isConnected || this.isCoveredByProcessedCard(card, processedCards)) {
                  continue;
                }
                processedCards.add(card);
                jobs.push(
                  this.processCard(card, target).catch((error) => {
                    debugLog("Failed to label thumbnail", error);
                  })
                );
              }
            }
          }
          for (const node of document.querySelectorAll(GENERIC_VIDEO_LINK_SELECTOR)) {
            const card = (_b = node.closest(RELEVANT_SELECTORS.join(", "))) != null ? _b : node.matches("a, [data-bvid], [data-video-id]") ? node : null;
            if (!card || processedCards.has(card) || !card.isConnected || this.isCoveredByProcessedCard(card, processedCards)) {
              continue;
            }
            processedCards.add(card);
            jobs.push(
              this.processCard(card, {
                containerSelector: "body",
                itemSelector: GENERIC_VIDEO_LINK_SELECTOR,
                linkSelector: GENERIC_VIDEO_LINK_SELECTOR
              }).catch((error) => {
                debugLog("Failed to label generic thumbnail", error);
              })
            );
          }
          if (jobs.length > 0) {
            yield Promise.allSettled(jobs);
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
    isCoveredByProcessedCard(card, processedCards) {
      for (const processed of processedCards) {
        if (processed.contains(card) || card.contains(processed)) {
          return true;
        }
      }
      return false;
    }
    processCard(card, target) {
      return __async(this, null, function* () {
        var _a, _b, _c, _d;
        const videoIds = collectCardLinks(card, target);
        const videoId = (_a = videoIds[0]) != null ? _a : null;
        if (!videoId) {
          hideOverlay(card);
          return;
        }
        const lastProcessed = card.getAttribute(PROCESSED_ATTR2);
        if (lastProcessed === videoId) {
          const overlay = card.querySelector(".sponsorThumbnailLabel");
          if (overlay) {
            const anchor = resolveLabelAnchor(card, target);
            const host = ensureOverlayHost(card);
            positionOverlay(host, card, anchor, overlay);
          }
          return;
        }
        const category = (_d = (_c = yield this.client.getWholeVideoLabel(videoId, this.currentConfig)) != null ? _c : (_b = this.localVideoLabelStore.getResolved(videoId)) == null ? void 0 : _b.category) != null ? _d : null;
        if (!category) {
          hideOverlay(card);
          return;
        }
        applyCategoryLabel(card, target, videoId, category, this.currentConfig);
      });
    }
    reset() {
      for (const overlay of document.querySelectorAll(".sponsorThumbnailLabel")) {
        overlay.classList.remove("sponsorThumbnailLabelVisible");
        overlay.removeAttribute("data-category");
      }
      for (const host of document.querySelectorAll(".bsb-tm-thumbnail-host[data-bsb-hover]")) {
        host.removeAttribute("data-bsb-hover");
      }
      for (const card of document.querySelectorAll(`[${PROCESSED_ATTR2}]`)) {
        card.removeAttribute(PROCESSED_ATTR2);
      }
    }
  };

  // src/features/mbga/core.ts
  var MBGA_MARKS = {
    urlCleaner: "__BSB_MBGA_URL_CLEANER__",
    blockTracking: "__BSB_MBGA_BLOCK_TRACKING__",
    pcdnDisabler: "__BSB_MBGA_PCDN_DISABLER__",
    dynamicWideSwitch: "__BSB_MBGA_DYNAMIC_WIDE_SWITCH__",
    articleCopyUnlock: "__BSB_MBGA_ARTICLE_COPY_UNLOCK__",
    videoFitMode: "__BSB_MBGA_VIDEO_FIT_MODE__",
    grayscaleObserver: "__BSB_MBGA_GRAYSCALE_OBSERVER__"
  };
  var USELESS_URL_PARAMS = [
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
  ];
  var TELEMETRY_HOST_RULES = [
    { host: "cm.bilibili.com", reason: "cm telemetry" },
    { host: "data.bilibili.com", reason: "data telemetry" }
  ];
  function getUnsafeWindow() {
    return typeof window.unsafeWindow !== "undefined" ? window.unsafeWindow : window;
  }
  function createMbgaContext(config, win = getUnsafeWindow(), doc = document) {
    const url = new URL(win.location.href);
    return {
      config,
      doc,
      win,
      url
    };
  }
  function isSameOrSubdomain(hostname, expectedHost) {
    return hostname === expectedHost || hostname.endsWith(`.${expectedHost}`);
  }
  function normalizeRequestUrl(input, baseHref) {
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
  function defineWritableValue(target, key, value) {
    try {
      Object.defineProperty(target, key, {
        configurable: true,
        enumerable: false,
        writable: true,
        value
      });
    } catch (_error) {
    }
  }
  function createNoopCallable() {
    const callable = (() => void 0);
    return new Proxy(callable, {
      get(target, property) {
        var _a;
        if (property === Symbol.toPrimitive) {
          return () => "";
        }
        if (property === "then") {
          return void 0;
        }
        return (_a = Reflect.get(target, property)) != null ? _a : createNoopCallable();
      },
      apply() {
        return void 0;
      },
      construct() {
        return createNoopCallable();
      }
    });
  }
  function installGlobalValue(win, key, value) {
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
  function installSentryShim(win) {
    var _a, _b, _c, _d, _e;
    const hub = { bindClient() {
    } };
    const noop = () => void 0;
    const sentry = typeof win.Sentry === "object" && win.Sentry ? win.Sentry : {};
    (_a = sentry.BrowserClient) != null ? _a : sentry.BrowserClient = class {
    };
    (_b = sentry.Hub) != null ? _b : sentry.Hub = class {
      bindClient() {
      }
    };
    (_c = sentry.Integrations) != null ? _c : sentry.Integrations = {
      Vue: class {
      },
      GlobalHandlers: class {
      },
      InboundFilters: class {
      }
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
    (_d = sentry.SDK_NAME) != null ? _d : sentry.SDK_NAME = "sentry.javascript.browser";
    (_e = sentry.SDK_VERSION) != null ? _e : sentry.SDK_VERSION = "0.0.0-bsb";
    sentry.getCurrentHub = () => hub;
    win.Sentry = sentry;
  }
  function completeBlockedXhr(xhr, win, url, decision) {
    var _a, _b;
    const status = (_a = decision.syntheticStatus) != null ? _a : 204;
    const body = (_b = decision.syntheticBody) != null ? _b : "";
    defineWritableValue(xhr, "readyState", 4);
    defineWritableValue(xhr, "status", status);
    defineWritableValue(xhr, "statusText", "No Content");
    defineWritableValue(xhr, "responseText", body);
    defineWritableValue(xhr, "response", body);
    defineWritableValue(xhr, "responseURL", url);
    const fire = (type, handlerKey) => {
      const event = typeof win.Event === "function" ? new win.Event(type) : void 0;
      const handler = xhr[handlerKey];
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
  function createSyntheticFetchResponse(win, decision) {
    var _a, _b;
    const status = (_a = decision.syntheticStatus) != null ? _a : 204;
    const body = status === 204 || status === 205 || status === 304 ? null : (_b = decision.syntheticBody) != null ? _b : "";
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
  function ensureScopedStyle(doc, id, css) {
    if (doc.querySelector(`style[data-bsb-mbga-style="${id}"]`)) {
      return;
    }
    const style = doc.createElement("style");
    style.setAttribute("data-bsb-mbga-style", id);
    style.textContent = css;
    (doc.head || doc.documentElement).appendChild(style);
  }
  function isVideoPage(url) {
    return url.hostname === "www.bilibili.com" && (url.pathname.startsWith("/video/") || url.pathname.startsWith("/bangumi/play/"));
  }
  function isArticlePage(url) {
    return url.hostname === "www.bilibili.com" && url.pathname.startsWith("/read/cv");
  }
  function isDynamicPage(url) {
    return url.hostname === "t.bilibili.com";
  }
  function isLivePage(url) {
    return url.hostname === "live.bilibili.com";
  }
  function isMainFeedPage(url) {
    return url.hostname === "www.bilibili.com" && (url.pathname === "/" || url.pathname.startsWith("/?"));
  }
  function ensurePageFilterNeutralized(doc) {
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
  function mountGrayscaleCleanup(ctx) {
    const win = ctx.win;
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
  function removeTracking(url, baseHref = window.location.href) {
    if (!url) {
      return url != null ? url : "";
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
  function resolveMbgaNetworkDecision(input, baseHref = window.location.href) {
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
  function mountUrlCleaner(ctx) {
    const win = ctx.win;
    if (win[MBGA_MARKS.urlCleaner] || typeof win.history === "undefined") {
      return;
    }
    win[MBGA_MARKS.urlCleaner] = true;
    win.history.replaceState(void 0, "", removeTracking(win.location.href, win.location.href));
    const originalPushState = win.history.pushState;
    win.history.pushState = function(state, unused, url) {
      const nextUrl = typeof url === "undefined" || url === null ? url : removeTracking(String(url), win.location.href);
      return originalPushState.call(this, state, unused, nextUrl);
    };
    const originalReplaceState = win.history.replaceState;
    win.history.replaceState = function(state, unused, url) {
      const nextUrl = typeof url === "undefined" || url === null ? url : removeTracking(String(url), win.location.href);
      return originalReplaceState.call(this, state, unused, nextUrl);
    };
  }
  function mountBlockTracking(ctx) {
    var _a;
    const win = ctx.win;
    if (win[MBGA_MARKS.blockTracking]) {
      return;
    }
    win[MBGA_MARKS.blockTracking] = true;
    try {
      class StubPeerConnection {
        addEventListener() {
        }
        createDataChannel() {
        }
      }
      class StubDataChannel {
      }
      installGlobalValue(win, "RTCPeerConnection", StubPeerConnection);
      installGlobalValue(win, "RTCDataChannel", StubDataChannel);
      installGlobalValue(win, "webkitRTCPeerConnection", StubPeerConnection);
      installGlobalValue(win, "webkitRTCDataChannel", StubDataChannel);
    } catch (_error) {
    }
    if (typeof win.fetch === "function") {
      const originalFetch = win.fetch.bind(win);
      win.fetch = function(input, init) {
        const decision = resolveMbgaNetworkDecision(input, win.location.href);
        if (decision.action === "block") {
          return Promise.resolve(createSyntheticFetchResponse(win, decision));
        }
        return originalFetch(input, init);
      };
    }
    if ((_a = win.XMLHttpRequest) == null ? void 0 : _a.prototype) {
      const originalOpen = win.XMLHttpRequest.prototype.open;
      const originalSend = win.XMLHttpRequest.prototype.send;
      const decisionKey = "__bsbMbgaDecision";
      const urlKey = "__bsbMbgaUrl";
      win.XMLHttpRequest.prototype.open = function(method, url, async, username, password) {
        const decision = resolveMbgaNetworkDecision(url, win.location.href);
        defineWritableValue(this, decisionKey, decision);
        defineWritableValue(this, urlKey, String(url));
        return originalOpen.call(this, method, String(url), async != null ? async : true, username != null ? username : null, password != null ? password : null);
      };
      win.XMLHttpRequest.prototype.send = function(body) {
        var _a2;
        const decision = Reflect.get(this, decisionKey);
        if ((decision == null ? void 0 : decision.action) === "block") {
          const requestUrl = String((_a2 = Reflect.get(this, urlKey)) != null ? _a2 : "");
          queueMicrotask(() => completeBlockedXhr(this, win, requestUrl, decision));
          return;
        }
        return originalSend.call(this, body != null ? body : null);
      };
    }
    if (win.navigator && typeof win.navigator.sendBeacon === "function") {
      const originalSendBeacon = win.navigator.sendBeacon.bind(win.navigator);
      win.navigator.sendBeacon = function(url, data) {
        const decision = resolveMbgaNetworkDecision(url, win.location.href);
        if (decision.action === "block") {
          return true;
        }
        return originalSendBeacon(url, data);
      };
    } else if (win.navigator) {
      win.navigator.sendBeacon = function(url) {
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
            init() {
            },
            queryUserLog() {
              return [];
            }
          };
        },
        set() {
        }
      });
      Object.defineProperty(win, "__USER_FP_CONFIG__", {
        configurable: true,
        enumerable: false,
        get() {
          return void 0;
        },
        set() {
        }
      });
      Object.defineProperty(win, "__MIRROR_CONFIG__", {
        configurable: true,
        enumerable: false,
        get() {
          return void 0;
        },
        set() {
        }
      });
    } catch (_error) {
    }
  }
  function mountPcdnDisabler(ctx) {
    var _a, _b;
    const win = ctx.win;
    if (win[MBGA_MARKS.pcdnDisabler]) {
      return;
    }
    win[MBGA_MARKS.pcdnDisabler] = true;
    installGlobalValue(win, "PCDNLoader", class {
    });
    installGlobalValue(
      win,
      "BPP2PSDK",
      class {
        on() {
        }
      }
    );
    installGlobalValue(win, "SeederSDK", class {
    });
    if (isVideoPage(ctx.url)) {
      let cdnDomain;
      const replaceP2PUrl = (input) => {
        var _a2;
        cdnDomain || (cdnDomain = (_a2 = ctx.doc.head.innerHTML.match(/up[\w-]+\.bilivideo\.com/u)) == null ? void 0 : _a2[0]);
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
      const replaceP2PUrlDeep = (value) => {
        if (!value || typeof value !== "object") {
          return;
        }
        for (const key of Object.keys(value)) {
          const current = value[key];
          if (typeof current === "string") {
            value[key] = replaceP2PUrl(current);
          } else if (current && typeof current === "object") {
            replaceP2PUrlDeep(current);
          }
        }
      };
      if (win.__playinfo__) {
        replaceP2PUrlDeep(win.__playinfo__);
      }
      if ((_a = win.HTMLMediaElement) == null ? void 0 : _a.prototype) {
        const descriptor = Object.getOwnPropertyDescriptor(win.HTMLMediaElement.prototype, "src");
        if (descriptor == null ? void 0 : descriptor.set) {
          Object.defineProperty(win.HTMLMediaElement.prototype, "src", __spreadProps(__spreadValues({}, descriptor), {
            set(value) {
              var _a2;
              (_a2 = descriptor.set) == null ? void 0 : _a2.call(this, replaceP2PUrl(value));
            }
          }));
        }
      }
      if ((_b = win.XMLHttpRequest) == null ? void 0 : _b.prototype) {
        const originalOpen = win.XMLHttpRequest.prototype.open;
        win.XMLHttpRequest.prototype.open = function(...args) {
          if (typeof args[1] === "string") {
            args[1] = replaceP2PUrl(args[1]);
          }
          return originalOpen.apply(this, args);
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
      }, 1e4);
      if (typeof win.fetch === "function") {
        const originalFetch = win.fetch.bind(win);
        win.fetch = function(input, init) {
          var _a2;
          try {
            const url = normalizeRequestUrl(input, ctx.win.location.href);
            const urlString = (_a2 = url == null ? void 0 : url.toString()) != null ? _a2 : "";
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
  function mountMainFeedCleanup(ctx) {
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
  function mountDynamicWideMode(ctx) {
    const win = ctx.win;
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
      switchButton.textContent = "\u5BBD\u5C4F\u6A21\u5F0F";
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
    win.setTimeout(injectWideSwitch, 2e3);
  }
  function mountArticleCopyUnlock(ctx) {
    const win = ctx.win;
    if (win[MBGA_MARKS.articleCopyUnlock]) {
      return;
    }
    win[MBGA_MARKS.articleCopyUnlock] = true;
    if (win.original) {
      win.original.reprint = "1";
    }
    const holder = ctx.doc.querySelector(".article-holder");
    if (!(holder instanceof HTMLElement)) {
      return;
    }
    holder.classList.remove("unable-reprint");
    holder.addEventListener(
      "copy",
      (event) => {
        event.stopImmediatePropagation();
      },
      true
    );
  }
  function mountLiveUiCleanup(ctx) {
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
  function mountVideoFitMode(ctx) {
    const win = ctx.win;
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
      item.innerHTML = '<input class="bui-switch-input" type="checkbox"><label class="bui-switch-label"><span class="bui-switch-name">\u88C1\u5207\u6A21\u5F0F</span><span class="bui-switch-body"><span class="bui-switch-dot"><span></span></span></span></label>';
      const moreLink = ctx.doc.querySelector(".bpx-player-ctrl-setting-more");
      if (moreLink instanceof HTMLElement) {
        parent.insertBefore(item, moreLink);
      } else {
        parent.appendChild(item);
      }
      const input = item.querySelector("input");
      if (input instanceof HTMLInputElement) {
        input.addEventListener("change", (event) => {
          const checked = event.currentTarget.checked;
          if (checked) {
            ctx.doc.body.setAttribute("video-fit", "");
          } else {
            ctx.doc.body.removeAttribute("video-fit");
          }
        });
      }
    };
    const timer = win.setInterval(() => {
      if (ctx.doc.querySelector(".bpx-player-ctrl-setting-menu-left")) {
        injectFitButton();
        win.clearInterval(timer);
      }
    }, 1e3);
    win.setTimeout(() => win.clearInterval(timer), 1e4);
  }
  var MBGA_RULES = [
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
      safetyNotes: "Only rewrites known P2P/CDN hosts for video and live pages.",
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
  var MBGA_CORE_RULE_IDS = /* @__PURE__ */ new Set(["clean-url-params", "block-telemetry-reporters", "disable-pcdn"]);
  var MBGA_UI_RULE_IDS = /* @__PURE__ */ new Set([
    "neutralize-page-grayscale",
    "main-feed-cleanup",
    "dynamic-wide-mode",
    "article-copy-unlock",
    "live-room-ui-cleanup",
    "video-fit-mode"
  ]);
  function applyMbgaRules(config, shouldApply) {
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
  function mountMbga(config) {
    applyMbgaRules(config, (rule) => MBGA_CORE_RULE_IDS.has(rule.id));
  }
  function mountMbgaUi(config) {
    applyMbgaRules(config, (rule) => MBGA_UI_RULE_IDS.has(rule.id));
  }

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
  var titleSurfaceFrostedGlass = createSurfaceFrostedGlassMaterial({
    accentExpression: "var(--bsb-category-accent, #2f9e72)"
  });
  var styles = `
:root {
  --bsb-brand-blue: #00aeec;
  --bsb-brand-blue-rgb: 0, 174, 236;
  --bsb-ease-fluid: cubic-bezier(0.22, 1, 0.36, 1);
  --bsb-ease-swift: cubic-bezier(0.2, 0.8, 0.2, 1);
  --bsb-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --bsb-dark-surface: rgba(24, 29, 38, 0.94);
  --bsb-light-surface: rgba(255, 255, 255, 0.98);
  --bsb-text-primary: #0f172a;
  --bsb-text-secondary: rgba(15, 23, 42, 0.76);
  --bsb-text-tertiary: rgba(71, 85, 105, 0.9);
  --bsb-border: rgba(100, 116, 139, 0.3);
  --bsb-border-soft: rgba(148, 163, 184, 0.22);
  --bsb-border-strong: rgba(148, 163, 184, 0.38);
  --bsb-subtle: rgba(51, 65, 85, 0.86);
  --bsb-shadow: 0 18px 44px rgba(15, 23, 42, 0.22);
  --bsb-glass-white: rgba(255, 255, 255, 0.74);
  --bsb-glass-stroke: rgba(255, 255, 255, 0.62);
  --bsb-glass-inner: inset 0 1px 0 rgba(255, 255, 255, 0.64);
  --bsb-glass-shadow: 0 22px 48px rgba(15, 23, 42, 0.14);
  --bsb-panel-surface: rgba(233, 239, 247, 0.9);
  --bsb-panel-surface-strong: rgba(250, 252, 255, 0.98);
  --bsb-panel-muted: rgba(241, 245, 251, 0.84);
  --bsb-panel-stroke: rgba(100, 116, 139, 0.22);
  --bsb-panel-divider: rgba(191, 201, 214, 0.88);
  --bsb-panel-shadow:
    0 44px 108px rgba(15, 23, 42, 0.24),
    0 18px 42px rgba(15, 23, 42, 0.12);
  --bsb-font-ui: "SF Pro Text", "PingFang SC", sans-serif;
  --bsb-font-display: "SF Pro Display", "SF Pro Text", "PingFang SC", sans-serif;
  --bsb-danger: #ff4d4f;
  --bsb-danger-rgb: 255, 77, 79;
  --bsb-success: #52c41a;
  --bsb-success-rgb: 82, 196, 26;
}

.bsb-tm-panel,
.bsb-tm-button,
.bsb-tm-tab-button,
.bsb-tm-pill-action,
.bsb-tm-title-pill,
.bsb-tm-player-button,
.sponsorThumbnailLabel,
.bsb-tm-link-card,
.bsb-tm-feature-value {
  font-kerning: normal;
  font-feature-settings: "kern" 1;
  font-synthesis-weight: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

.bsb-tm-panel-open {
  overflow: hidden;
}

.bsb-tm-panel-backdrop[hidden] {
  display: none !important;
}

.bsb-tm-panel-backdrop {
  --bsb-tm-panel-vh: 100vh;
  --bsb-tm-panel-vw: 100vw;
  position: fixed;
  inset: 0;
  z-index: 2147483646;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.22), transparent 42%),
    linear-gradient(180deg, rgba(226, 232, 240, 0.18), rgba(15, 23, 42, 0.32)),
    rgba(15, 23, 42, 0.46);
  backdrop-filter: blur(24px) saturate(165%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow: auto;
  padding: clamp(12px, 2vh, 24px) 16px;
}

.bsb-tm-panel {
  display: flex;
  flex-direction: column;
  width: min(1080px, calc(var(--bsb-tm-panel-vw) - 24px));
  height: min(var(--bsb-tm-panel-height, 820px), calc(var(--bsb-tm-panel-vh) - 24px));
  max-height: min(calc(var(--bsb-tm-panel-vh) - 24px), 920px);
  margin: auto 0;
  overflow: hidden;
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.94), transparent 28%),
    linear-gradient(180deg, rgba(252, 253, 255, 0.98), rgba(233, 239, 247, 0.94)),
    var(--bsb-panel-surface);
  color: var(--bsb-text-primary);
  box-shadow:
    var(--bsb-panel-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    inset 0 0 0 1px rgba(148, 163, 184, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(28px) saturate(160%);
  font: 14px/1.5 var(--bsb-font-ui);
}

.bsb-tm-panel-header,
.bsb-tm-panel-header-actions,
.bsb-tm-field,
.bsb-tm-category-row,
.bsb-tm-summary-line,
.bsb-tm-notice-actions,
.bsb-tm-title-popover-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.bsb-tm-panel-header {
  flex-wrap: wrap;
  align-items: flex-start;
  padding: 18px 24px 16px;
  border-bottom: 1px solid var(--bsb-panel-divider);
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(245, 248, 252, 0.66)),
    rgba(255, 255, 255, 0.46);
  box-shadow:
    inset 0 -1px 0 rgba(255, 255, 255, 0.44),
    inset 0 1px 0 rgba(255, 255, 255, 0.56),
    0 12px 26px rgba(15, 23, 42, 0.04);
  backdrop-filter: blur(18px);
}

.bsb-tm-panel-body {
  display: grid;
  grid-template-columns: 236px minmax(0, 1fr);
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.bsb-tm-panel-nav {
  display: grid;
  align-content: start;
  gap: 8px;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 20px 16px 24px;
  border-right: 1px solid var(--bsb-panel-divider);
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.76), transparent 30%),
    linear-gradient(180deg, rgba(243, 247, 252, 0.96), rgba(230, 237, 245, 0.9)),
    rgba(233, 239, 247, 0.82);
}

.bsb-tm-tab-button {
  display: grid;
  gap: 4px;
  width: 100%;
  text-align: left;
  border: 1px solid var(--bsb-border-soft);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(245, 248, 252, 0.76)),
    rgba(255, 255, 255, 0.58);
  color: var(--bsb-text-primary);
  font: inherit;
  line-height: 1.25;
  padding: 12px 14px;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.74),
    0 10px 24px rgba(15, 23, 42, 0.06),
    inset 0 0 0 1px rgba(255, 255, 255, 0.28);
  transition:
    background 220ms var(--bsb-ease-swift),
    box-shadow 220ms var(--bsb-ease-swift),
    border-color 220ms var(--bsb-ease-swift),
    color 220ms var(--bsb-ease-swift),
    transform 260ms var(--bsb-ease-spring);
}

.bsb-tm-tab-title {
  font-size: 14px;
  line-height: 1.2;
  font-weight: 650;
}

.bsb-tm-tab-description {
  color: var(--bsb-subtle);
  font-size: 12px;
  line-height: 1.3;
}

.bsb-tm-tab-button.active {
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.86), transparent 38%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(241, 246, 251, 0.88)),
    rgba(var(--bsb-brand-blue-rgb), 0.08);
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.22);
  color: var(--bsb-text-primary);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    inset 0 0 0 1px rgba(var(--bsb-brand-blue-rgb), 0.1),
    0 12px 24px rgba(15, 23, 42, 0.08),
    0 0 0 1px rgba(var(--bsb-brand-blue-rgb), 0.06);
}

.bsb-tm-tab-button.active .bsb-tm-tab-description {
  color: var(--bsb-text-secondary);
}

.bsb-tm-panel-content {
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 24px 28px 30px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.06)),
    transparent;
}

.bsb-tm-panel-nav,
.bsb-tm-panel-content {
  scrollbar-gutter: stable both-edges;
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.48) transparent;
}

.bsb-tm-panel-nav::-webkit-scrollbar,
.bsb-tm-panel-content::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.bsb-tm-panel-nav::-webkit-scrollbar-thumb,
.bsb-tm-panel-content::-webkit-scrollbar-thumb {
  border-radius: 999px;
  border: 2px solid transparent;
  background: rgba(100, 116, 139, 0.48);
  background-clip: padding-box;
}

.bsb-tm-panel-subtitle,
.bsb-tm-section-description,
.bsb-tm-field-help {
  color: var(--bsb-subtle);
}

.bsb-tm-panel-subtitle {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.45;
}

.bsb-tm-panel-section {
  display: grid;
  gap: 20px;
  align-content: start;
  min-height: 100%;
  box-sizing: border-box;
  padding-bottom: 16px;
}

.bsb-tm-panel-section[hidden] {
  display: none !important;
}

.bsb-tm-section-heading {
  display: grid;
  gap: 6px;
}

.bsb-tm-inline-heading {
  display: grid;
  gap: 6px;
  margin-top: 6px;
}

.bsb-tm-section-title,
.bsb-tm-section-label,
.bsb-tm-field-title {
  display: block;
  color: var(--bsb-text-primary);
  letter-spacing: -0.01em;
}

.bsb-tm-section-description,
.bsb-tm-field-help,
.bsb-tm-validation-message {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
}

.bsb-tm-validation-message {
  color: #b91c1c;
}

.bsb-tm-stats,
.bsb-tm-form,
.bsb-tm-categories,
.bsb-tm-overview-grid,
.bsb-tm-help-grid,
.bsb-tm-field-grid,
.bsb-tm-color-grid,
.bsb-tm-form-group,
.bsb-tm-form-group-body {
  display: grid;
  gap: 12px;
}

.bsb-tm-form-group {
  gap: 18px;
  padding: 20px;
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.88), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(242, 246, 250, 0.78)),
    rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow:
    var(--bsb-glass-inner),
    0 18px 38px rgba(15, 23, 42, 0.08),
    inset 0 0 0 1px rgba(148, 163, 184, 0.12);
  backdrop-filter: blur(14px) saturate(140%);
  transition:
    box-shadow 220ms var(--bsb-ease-swift),
    border-color 220ms var(--bsb-ease-swift),
    background 220ms var(--bsb-ease-swift),
    transform 220ms var(--bsb-ease-fluid);
}

.bsb-tm-form-group-header {
  display: grid;
  gap: 8px;
}

.bsb-tm-field-grid {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.bsb-tm-field-grid.single-column {
  grid-template-columns: 1fr;
}

.bsb-tm-color-grid {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.bsb-tm-color-field {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid var(--bsb-border-soft);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(243, 247, 251, 0.64)),
    rgba(248, 250, 252, 0.66);
  box-shadow:
    var(--bsb-glass-inner),
    inset 0 0 0 1px rgba(148, 163, 184, 0.08);
}

.bsb-tm-color-preview {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  border-radius: 999px;
  padding: 5px 10px;
  color: var(--bsb-text-primary);
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.96);
}

.bsb-tm-color-preview::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--bsb-color-preview, #0f172a);
}

.bsb-tm-color-controls {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  gap: 10px;
}

.bsb-tm-color-controls input[type="color"] {
  width: 46px;
  min-width: 46px;
  height: 38px;
  padding: 4px;
}

.bsb-tm-overview-grid,
.bsb-tm-help-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.bsb-tm-actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.bsb-tm-summary-line,
.bsb-tm-field,
.bsb-tm-category-row,
.bsb-tm-feature-card,
.bsb-tm-info-box,
.bsb-tm-link-card {
  padding: 16px 18px;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(244, 247, 251, 0.74)),
    rgba(241, 245, 249, 0.74);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow:
    var(--bsb-glass-inner),
    0 12px 24px rgba(15, 23, 42, 0.05),
    inset 0 0 0 1px rgba(148, 163, 184, 0.08);
  transition:
    box-shadow 220ms var(--bsb-ease-swift),
    border-color 220ms var(--bsb-ease-swift),
    background 220ms var(--bsb-ease-swift),
    transform 220ms var(--bsb-ease-fluid);
}

.bsb-tm-summary-line {
  align-items: baseline;
}

.bsb-tm-summary-line strong {
  font-size: 13px;
  font-weight: 650;
}

.bsb-tm-summary-line span {
  color: var(--bsb-text-secondary);
  text-align: right;
  font-weight: 600;
}

.bsb-tm-field {
  min-width: 0;
  align-items: flex-start;
}

.bsb-tm-field-toggle {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
}

.bsb-tm-field-toggle[data-control-state="on"] {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.22);
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), transparent 38%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(243, 248, 252, 0.84)),
    rgba(var(--bsb-brand-blue-rgb), 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 12px 24px rgba(15, 23, 42, 0.06),
    inset 0 0 0 1px rgba(var(--bsb-brand-blue-rgb), 0.08);
}

.bsb-tm-field-toggle[data-control-state="on"] .bsb-tm-field-title {
  color: var(--bsb-text-primary);
}

.bsb-tm-field-toggle[data-control-state="on"] .bsb-tm-field-help {
  color: rgba(30, 41, 59, 0.78);
}

.bsb-tm-field.stacked {
  align-items: stretch;
  flex-direction: column;
}

.bsb-tm-field-toggle .bsb-tm-switch {
  justify-self: end;
  align-self: center;
  margin-top: 2px;
}

.bsb-tm-field-copy,
.bsb-tm-input-label {
  display: grid;
  gap: 6px;
}

.bsb-tm-categories {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.bsb-tm-category-row {
  align-items: center;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
}

.bsb-tm-category-row select {
  min-width: 88px;
  justify-self: end;
}

.bsb-tm-feature-card {
  display: grid;
  gap: 10px;
  align-content: start;
  justify-items: stretch;
}

.bsb-tm-feature-title {
  font-size: 14px;
  line-height: 1.35;
  font-weight: 650;
  justify-self: start;
  text-align: left;
}

.bsb-tm-feature-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: center;
  width: fit-content;
  max-width: min(100%, 204px);
  min-width: 64px;
  min-height: 28px;
  border-radius: 999px;
  padding: 5px 12px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.24), transparent 46%),
    linear-gradient(180deg, rgba(33, 43, 58, 0.96), rgba(15, 23, 42, 0.9));
  color: #f8fafc;
  font-size: 11px;
  font-weight: 650;
  line-height: 1.15;
  letter-spacing: 0.01em;
  white-space: normal;
  text-align: center;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    0 8px 18px rgba(15, 23, 42, 0.14);
}

.bsb-tm-feature-card .bsb-tm-section-description {
  margin: 0;
  text-align: left;
}

.bsb-tm-link-group {
  display: grid;
  gap: 10px;
}

.bsb-tm-link-card {
  display: block;
  color: #0f172a;
  text-decoration: none;
  transition: box-shadow 180ms ease, background 180ms ease, border-color 180ms ease;
}

.bsb-tm-info-box {
  display: grid;
  gap: 8px;
  background:
    linear-gradient(180deg, rgba(245, 250, 255, 0.94), rgba(234, 243, 252, 0.76)),
    rgba(0, 174, 236, 0.08);
}

.bsb-tm-button,
.bsb-tm-panel input,
.bsb-tm-panel select,
.bsb-tm-pill-action {
  appearance: none;
  -webkit-appearance: none;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.74);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(242, 246, 251, 0.82)),
    rgba(255, 255, 255, 0.84);
  color: inherit;
  padding: 10px 14px;
  font: inherit;
  line-height: 1.1;
  background-clip: padding-box;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 10px 20px rgba(15, 23, 42, 0.07),
    inset 0 0 0 1px rgba(148, 163, 184, 0.06);
  transition:
    box-shadow 220ms var(--bsb-ease-swift),
    background 220ms var(--bsb-ease-swift),
    border-color 220ms var(--bsb-ease-swift),
    filter 180ms var(--bsb-ease-swift),
    transform 260ms var(--bsb-ease-spring);
}

.bsb-tm-button,
.bsb-tm-pill-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  white-space: nowrap;
  min-height: 40px;
  font-size: 13px;
  font-weight: 650;
  letter-spacing: 0.01em;
}

.bsb-tm-panel input,
.bsb-tm-panel select {
  min-height: 42px;
  font-size: 13px;
}

.bsb-tm-panel select {
  text-align: center;
  text-align-last: center;
  padding-inline: 14px;
}

.bsb-tm-panel input.bsb-tm-switch {
  appearance: auto;
  -webkit-appearance: checkbox;
  width: 18px;
  min-width: 18px;
  height: 18px;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 6px;
  background: none;
  box-shadow: none;
  accent-color: var(--bsb-brand-blue);
  align-self: center;
  cursor: pointer;
  transition: none;
}

.bsb-tm-panel input.bsb-tm-switch::before {
  display: none;
}

.bsb-tm-panel input.bsb-tm-switch:hover,
.bsb-tm-panel input.bsb-tm-switch:focus,
.bsb-tm-panel input.bsb-tm-switch:active,
.bsb-tm-panel input.bsb-tm-switch:checked {
  border: none;
  background: none;
  box-shadow: none;
  transform: none;
}

.bsb-tm-button,
.bsb-tm-pill-action,
.bsb-tm-player-button,
.bsb-tm-title-pill,
.sponsorThumbnailLabel {
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.bsb-tm-button.compact {
  justify-self: start;
}

.bsb-tm-action-button {
  min-width: 118px;
  padding-inline: 16px;
}

.bsb-tm-button.primary {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.05)),
    var(--bsb-brand-blue);
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.72);
  color: #fff;
}

.bsb-tm-button.danger {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.02)),
    #8f2a2a;
  border-color: rgba(127, 29, 29, 0.56);
  color: #fff7f7;
}

.bsb-tm-button.secondary {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.72)),
    rgba(15, 23, 42, 0.05);
}

.bsb-tm-notice-root {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 2147483647;
  display: grid;
  gap: 12px;
  max-width: 380px;
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
  position: relative;
  pointer-events: auto;
  color: #0f172a;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(255, 255, 255, 0.72)),
    rgba(255, 255, 255, 0.64);
  border: 1px solid rgba(255, 255, 255, 0.52);
  border-radius: 18px;
  box-shadow:
    var(--bsb-glass-inner),
    0 14px 30px rgba(15, 23, 42, 0.12);
  overflow: hidden;
  backdrop-filter: blur(20px) saturate(160%);
  animation: bsbNoticeIn 220ms ease;
}

.bsb-tm-notice-close {
  position: absolute;
  top: 10px;
  right: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgba(15, 23, 42, 0.4);
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    color 180ms var(--bsb-ease-swift),
    background 180ms var(--bsb-ease-swift);
}

.bsb-tm-notice-close:hover {
  color: rgba(15, 23, 42, 0.8);
  background: rgba(15, 23, 42, 0.06);
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
  color: rgba(15, 23, 42, 0.74);
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

.bsb-tm-title-accessories {
  display: inline-flex;
  align-items: center;
  gap: 0;
  float: left;
  margin-right: 8px;
  overflow: visible;
}

.bsb-tm-title-pill-wrap {
  display: inline-flex;
  align-items: center;
  overflow: visible;
  position: relative;
  isolation: isolate;
}

.bsb-tm-title-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 999px;
  border: 1px solid var(--bsb-category-glass-border, rgba(255, 255, 255, 0.2));
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.18), transparent 34%),
    linear-gradient(180deg, var(--bsb-category-accent, #2f9e72), var(--bsb-category-accent-strong, #257e59));
  color: var(--bsb-category-contrast, #fff);
  padding: 7px 13px;
  font: 650 13px/1.1 var(--bsb-font-display);
  letter-spacing: 0.01em;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    0 6px 12px rgba(15, 23, 42, 0.06);
  transition:
    box-shadow 220ms var(--bsb-ease-swift),
    filter 220ms var(--bsb-ease-swift),
    background 220ms var(--bsb-ease-swift),
    border-color 220ms var(--bsb-ease-swift),
    transform 220ms var(--bsb-ease-fluid);
}

.bsb-tm-title-pill-wrap[data-transparent="true"][data-glass-context="surface"] .bsb-tm-title-pill {
${titleSurfaceFrostedGlass.base}
}

.bsb-tm-title-pill-wrap[data-transparent="true"][data-glass-context="surface"] .bsb-tm-title-pill::before {
  z-index: 0;
${titleSurfaceFrostedGlass.overlay}
}

.bsb-tm-title-pill-wrap[data-transparent="true"][data-glass-context="surface"] .bsb-tm-title-pill::after {
  content: none;
}

.bsb-tm-title-pill-wrap[data-transparent="true"][data-glass-context="surface"] .bsb-tm-title-pill > * {
  position: relative;
  z-index: 2;
}

.bsb-tm-title-pill:hover,
.bsb-tm-title-pill[aria-expanded="true"] {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 10px 20px rgba(15, 23, 42, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.bsb-tm-title-pill-wrap[data-transparent="true"][data-glass-context="surface"] .bsb-tm-title-pill:hover,
.bsb-tm-title-pill-wrap[data-transparent="true"][data-glass-context="surface"] .bsb-tm-title-pill[aria-expanded="true"] {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    inset 0 -1px 0 color-mix(in srgb, var(--bsb-category-accent, #2f9e72) 12%, rgba(15, 23, 42, 0.06)),
    0 8px 18px rgba(15, 23, 42, 0.06),
    0 16px 28px rgba(15, 23, 42, 0.03);
  filter: saturate(1.04) brightness(1.02);
}

.bsb-tm-title-pill svg,
.bsb-tm-player-button svg,
.bsb-tm-pill-action svg,
.sponsorThumbnailLabel svg {
  width: 15px;
  height: 15px;
  fill: currentColor;
}

.bsb-tm-player-button[data-placement="header"] svg {
  width: 13px;
  height: 13px;
}

.sponsorThumbnailLabel svg {
  width: 12px;
  height: 12px;
}

.bsb-tm-title-popover {
  position: fixed;
  z-index: 2147483646;
  width: min(400px, calc(100vw - 32px));
  padding: 14px;
  border-radius: 20px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.88), transparent 36%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(243, 247, 251, 0.82)),
    rgba(255, 255, 255, 0.84);
  color: var(--bsb-text-primary);
  border: 1px solid rgba(255, 255, 255, 0.58);
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.64),
    inset 0 0 0 1px rgba(148, 163, 184, 0.08);
  backdrop-filter: blur(18px) saturate(150%);
  opacity: 0;
  transform: scale(0.992);
  pointer-events: none;
  transition:
    opacity 160ms ease,
    transform 180ms ease;
  will-change: transform, top, left;
}

.bsb-tm-title-popover.open {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

.bsb-tm-title-popover-copy {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--bsb-text-secondary);
}

.bsb-tm-title-popover-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
  align-items: stretch;
}

.bsb-tm-title-popover-actions.vote-unavailable {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.bsb-tm-title-popover-hint {
  margin: 10px 0 0;
  color: var(--bsb-text-tertiary);
  font-size: 12px;
}

.bsb-tm-pill-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 14px;
  min-width: 0;
  width: 100%;
}

.bsb-tm-pill-action:disabled {
  cursor: default;
  opacity: 0.52;
  filter: saturate(0.78);
}

.bsb-tm-pill-action.positive {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.24);
  color: #166534;
}

.bsb-tm-pill-action.negative {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.24);
  color: #991b1b;
}

.bsb-tm-pill-action.subtle {
  background: rgba(15, 23, 42, 0.04);
  border-color: rgba(15, 23, 42, 0.08);
  color: #1f2937;
  grid-column: 1 / -1;
  justify-self: start;
  width: auto;
  min-width: 128px;
}

.bsb-tm-title-pill-wrap.is-busy {
  opacity: 0.7;
}

.bsb-tm-player-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.8)),
    rgba(255, 255, 255, 0.72);
  color: #475569;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.62),
    0 6px 16px rgba(15, 23, 42, 0.07);
  opacity: 1;
  line-height: 1;
  transition:
    box-shadow 180ms ease,
    background 180ms ease,
    filter 160ms ease;
}

.bsb-tm-player-button[data-placement="header"] {
  width: 26px;
  height: 26px;
  border-color: rgba(15, 23, 42, 0.07);
}

.bsb-tm-player-button[data-placement="player"] {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  box-shadow: none;
  opacity: 0.9;
}

.bsb-tm-player-button:hover {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.84)),
    rgba(255, 255, 255, 0.82);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 6px 14px rgba(15, 23, 42, 0.08);
  filter: saturate(1.01);
}

.bsb-tm-title-pill:hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 8px 16px rgba(15, 23, 42, 0.08);
  filter: saturate(1.02) brightness(1.01);
}

.bsb-tm-player-button[data-placement="player"]:hover {
  background: transparent;
  box-shadow: none;
  opacity: 1;
}

.bsb-tm-thumbnail-host {
  position: relative !important;
  overflow: visible !important;
  isolation: isolate;
}

.bsb-tm-thumbnail-slot {
  position: absolute;
  top: var(--bsb-thumbnail-anchor-top, 0px);
  left: var(--bsb-thumbnail-anchor-left, 50%);
  width: min(156px, max(72px, calc(var(--bsb-thumbnail-anchor-width, 96px) + 2px)));
  height: 28px;
  transform: translate(-50%, calc(-100% - 1px));
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: visible;
  z-index: 8;
  pointer-events: auto;
}

.bsb-tm-thumbnail-slot[data-placement="corner"] {
  top: var(--bsb-thumbnail-anchor-top, 6px);
  left: var(--bsb-thumbnail-anchor-left, 6px);
  width: 1px;
  min-width: 1px;
  height: 24px;
  transform: translate(0, 0);
  align-items: flex-start;
  justify-content: flex-start;
  z-index: 10;
  overflow: visible !important;
}

.sponsorThumbnailLabel {
  --bsb-thumbnail-dot-size: 5px;
  --bsb-thumbnail-dot-stroke: 1.5px;
  --bsb-thumbnail-dot-left: 10px;
  --bsb-thumbnail-dot-opacity: 0.85;
  --bsb-thumbnail-dot-glow: 5px;
  --bsb-thumbnail-current-width: var(--bsb-thumbnail-collapsed-width, 38px);
  --bsb-thumbnail-current-padding: 9px;
  display: flex;
  position: relative;
  justify-content: center;
  align-items: center;
  gap: 6px;
  min-width: var(--bsb-thumbnail-current-width);
  width: max-content;
  height: 22px;
  padding-inline: var(--bsb-thumbnail-current-padding);
  border-radius: 999px;
  background:
    radial-gradient(circle at 22% 18%, rgba(255, 255, 255, 0.22), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent 52%),
    linear-gradient(180deg, color-mix(in srgb, var(--category-glass-surface, rgba(15, 23, 42, 0.86)) 92%, rgba(15, 23, 42, 0.12)), var(--category-glass-surface, rgba(15, 23, 42, 0.86)));
  color: var(--category-contrast, #ffffff);
  border: 1px solid color-mix(in srgb, var(--category-glass-border, rgba(255, 255, 255, 0.48)) 78%, rgba(255, 255, 255, 0.24));
  opacity: 1;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 -1px 0 rgba(15, 23, 42, 0.12),
    0 8px 18px rgba(15, 23, 42, 0.18),
    0 0 0 1px rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(22px) saturate(185%);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.01em;
  line-height: 1;
  white-space: nowrap;
  text-align: center;
  isolation: isolate;
  backface-visibility: hidden;
  transform: translateZ(0);
  text-rendering: geometricPrecision;
  will-change: min-width, padding, opacity;
  pointer-events: none;
  overflow: hidden;
  transition:
    box-shadow 220ms var(--bsb-ease-swift),
    background 220ms var(--bsb-ease-swift),
    opacity 160ms var(--bsb-ease-swift),
    border-color 220ms var(--bsb-ease-swift),
    filter 220ms var(--bsb-ease-swift),
    min-width 280ms var(--bsb-ease-fluid),
    padding 280ms var(--bsb-ease-fluid);
}

.sponsorThumbnailLabel[data-transparent="true"][data-glass-context="overlay"] {
  border: 1px solid color-mix(in srgb, var(--category-accent, #ffffff) 34%, rgba(255, 255, 255, 0.3));
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.015));
  backdrop-filter: none;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.34),
    inset 0 -1px 0 color-mix(in srgb, var(--category-accent, #ffffff) 18%, rgba(15, 23, 42, 0.06)),
    0 4px 10px rgba(15, 23, 42, 0.075),
    0 0 0 1px rgba(255, 255, 255, 0.06);
}

.sponsorThumbnailLabel[data-placement="default"][data-transparent="true"][data-glass-context="overlay"] {
  border-color: color-mix(in srgb, var(--category-accent, #ffffff) 20%, rgba(255, 255, 255, 0.12));
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--category-accent, #ffffff) 8%, rgba(255, 255, 255, 0.1)),
    color-mix(in srgb, var(--category-accent, #ffffff) 12%, rgba(255, 255, 255, 0.03))
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 -1px 0 color-mix(in srgb, var(--category-accent, #ffffff) 10%, rgba(15, 23, 42, 0.04)),
    0 6px 14px rgba(15, 23, 42, 0.08),
    0 12px 22px rgba(15, 23, 42, 0.04);
}

.sponsorThumbnailLabel[data-transparent="true"][data-glass-context="overlay"]::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  pointer-events: none;
  background:
    radial-gradient(circle at 22% -16%, color-mix(in srgb, var(--category-accent, #ffffff) 38%, rgba(255, 255, 255, 0.34)) 0%, transparent 34%),
    radial-gradient(circle at 82% 130%, color-mix(in srgb, var(--category-accent, #ffffff) 32%, rgba(15, 23, 42, 0.2)) 0%, transparent 50%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0.04) 34%, transparent 58%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--category-accent, #ffffff) 22%, rgba(255, 255, 255, 0.1)),
      color-mix(in srgb, var(--category-accent, #ffffff) 48%, rgba(15, 23, 42, 0.14))
    ),
    linear-gradient(110deg, transparent 18%, rgba(255, 255, 255, 0.24) 28%, transparent 42%);
  opacity: 0.94;
  backdrop-filter: blur(4px) saturate(162%) brightness(1.04);
  mix-blend-mode: screen;
}

.sponsorThumbnailLabel[data-placement="default"][data-transparent="true"][data-glass-context="overlay"]::after {
  background:
    radial-gradient(circle at 18% 12%, color-mix(in srgb, var(--category-accent, #ffffff) 20%, rgba(255, 255, 255, 0.18)) 0%, transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.03) 34%, transparent 62%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--category-accent, #ffffff) 18%, rgba(255, 255, 255, 0.2)),
      color-mix(in srgb, var(--category-accent, #ffffff) 30%, rgba(15, 23, 42, 0.08))
    ),
    linear-gradient(112deg, transparent 18%, rgba(255, 255, 255, 0.08) 28%, transparent 42%);
  opacity: 0.92;
  backdrop-filter: blur(4px) saturate(150%) brightness(1.02);
  mix-blend-mode: normal;
}

.sponsorThumbnailLabel[data-transparent="true"][data-glass-context="overlay"][data-glass-variant="light"] {
  border: 1px solid color-mix(
    in srgb,
    var(--category-display-accent, var(--category-accent, #ffffff)) 28%,
    rgba(255, 255, 255, 0.46)
  );
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 10%, rgba(255, 255, 255, 0.92)),
    color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 16%, rgba(241, 245, 249, 0.74))
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    inset 0 -1px 0 color-mix(
      in srgb,
      var(--category-display-accent, var(--category-accent, #ffffff)) 16%,
      rgba(148, 163, 184, 0.08)
    ),
    0 3px 8px rgba(15, 23, 42, 0.04),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.sponsorThumbnailLabel[data-placement="default"][data-transparent="true"][data-glass-context="overlay"][data-glass-variant="light"] {
  border-color: color-mix(
    in srgb,
    var(--category-display-accent, var(--category-accent, #ffffff)) 18%,
    rgba(255, 255, 255, 0.2)
  );
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 9%, rgba(255, 255, 255, 0.14)),
    color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 14%, rgba(241, 245, 249, 0.05))
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 color-mix(
      in srgb,
      var(--category-display-accent, var(--category-accent, #ffffff)) 8%,
      rgba(15, 23, 42, 0.04)
    ),
    0 5px 12px rgba(15, 23, 42, 0.045),
    0 10px 18px rgba(15, 23, 42, 0.025);
}

.sponsorThumbnailLabel[data-transparent="true"][data-glass-context="overlay"][data-glass-variant="light"]::after {
  background:
    radial-gradient(
      circle at 18% -10%,
      color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 22%, rgba(255, 255, 255, 0.44)) 0%,
      transparent 34%
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.05) 32%, transparent 56%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 10%, rgba(255, 255, 255, 0.12)),
      color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 18%, rgba(231, 238, 245, 0.08))
    ),
    linear-gradient(112deg, transparent 24%, rgba(255, 255, 255, 0.2) 32%, transparent 46%);
  opacity: 0.82;
  backdrop-filter: saturate(144%) brightness(1.03);
}

.sponsorThumbnailLabel[data-placement="default"][data-transparent="true"][data-glass-context="overlay"][data-glass-variant="light"]::after {
  background:
    radial-gradient(
      circle at 18% 12%,
      color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 16%, rgba(255, 255, 255, 0.22)) 0%,
      transparent 42%
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.03) 34%, transparent 62%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 14%, rgba(255, 255, 255, 0.18)),
      color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 18%, rgba(231, 238, 245, 0.08))
    ),
    linear-gradient(112deg, transparent 18%, rgba(255, 255, 255, 0.08) 28%, transparent 42%);
  opacity: 0.88;
  backdrop-filter: blur(4px) saturate(142%) brightness(1.02);
  mix-blend-mode: normal;
}

.sponsorThumbnailLabel[data-placement="corner"] {
  --bsb-thumbnail-dot-size: 4px;
  --bsb-thumbnail-dot-left: 7px;
  --bsb-thumbnail-dot-glow: 4px;
  height: 19px;
  min-width: var(--bsb-thumbnail-current-width, 19px);
  max-width: 180px;
  --bsb-thumbnail-current-padding: 7px;
  gap: 5px;
  font-size: 9.5px;
  letter-spacing: 0;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 -1px 0 rgba(15, 23, 42, 0.1),
    0 6px 14px rgba(15, 23, 42, 0.16),
    0 0 0 1px rgba(255, 255, 255, 0.06);
}

.sponsorThumbnailLabel[data-placement="corner"][data-transparent="true"][data-glass-context="overlay"] {
  border-color: color-mix(in srgb, var(--category-accent, #ffffff) 28%, rgba(255, 255, 255, 0.28));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 -1px 0 color-mix(in srgb, var(--category-accent, #ffffff) 12%, rgba(15, 23, 42, 0.05)),
    0 3px 8px rgba(15, 23, 42, 0.055),
    0 0 0 1px rgba(255, 255, 255, 0.06);
}

.sponsorThumbnailLabel[data-placement="corner"][data-transparent="true"][data-glass-context="overlay"][data-glass-variant="light"] {
  border-color: color-mix(
    in srgb,
    var(--category-display-accent, var(--category-accent, #ffffff)) 24%,
    rgba(255, 255, 255, 0.44)
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    inset 0 -1px 0 color-mix(
      in srgb,
      var(--category-display-accent, var(--category-accent, #ffffff)) 14%,
      rgba(148, 163, 184, 0.08)
    ),
    0 2px 6px rgba(15, 23, 42, 0.035),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.bsb-tm-thumbnail-slot[data-placement="corner"] .sponsorThumbnailLabelVisible {
  --bsb-thumbnail-expanded-padding: 11px;
}

.sponsorThumbnailLabel::before {
  content: "";
  position: absolute;
  top: 50%;
  left: var(--bsb-thumbnail-dot-left);
  width: var(--bsb-thumbnail-dot-size);
  height: var(--bsb-thumbnail-dot-size);
  border-radius: 50%;
  border: var(--bsb-thumbnail-dot-stroke) solid currentColor;
  opacity: var(--bsb-thumbnail-dot-opacity);
  box-shadow: 0 0 var(--bsb-thumbnail-dot-glow) color-mix(in srgb, currentColor 40%, transparent);
  flex-shrink: 0;
  z-index: 2;
  transform: translateY(-50%);
}

.sponsorThumbnailLabel[data-transparent="true"][data-glass-context="overlay"][data-glass-variant="light"]::before {
  border-color: var(--category-display-accent, currentColor);
  box-shadow: 0 0 4px color-mix(in srgb, var(--category-display-accent, currentColor) 40%, transparent);
}

.sponsorThumbnailLabel .bsb-tm-thumbnail-text-stack {
  --bsb-thumbnail-current-text-width: var(--bsb-thumbnail-collapsed-text-width, 1em);
  grid-column: 2;
  grid-row: 1;
  position: relative;
  z-index: 2;
  width: var(--bsb-thumbnail-current-text-width);
  min-width: 0;
  height: 1em;
  transform: translateZ(0);
  will-change: width;
  transition: width 280ms var(--bsb-ease-fluid);
}

.sponsorThumbnailLabel .bsb-tm-thumbnail-short-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: inherit;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
  white-space: nowrap;
  text-shadow:
    0 0.5px 1px rgba(15, 23, 42, 0.36),
    0 0 10px rgba(15, 23, 42, 0.1);
  transition:
    opacity 180ms var(--bsb-ease-swift),
    transform 280ms var(--bsb-ease-fluid);
}

.sponsorThumbnailLabel[data-transparent="true"][data-glass-context="overlay"][data-glass-variant="light"] .bsb-tm-thumbnail-short-label,
.sponsorThumbnailLabel[data-transparent="true"][data-glass-context="overlay"][data-glass-variant="light"] .bsb-tm-thumbnail-label {
  text-shadow: none;
}

.sponsorThumbnailLabel .bsb-tm-thumbnail-short-label > span {
  display: block;
  min-width: 0;
  overflow: visible;
}

.sponsorThumbnailLabel.sponsorThumbnailLabelVisible {
  display: inline-grid;
}

.bsb-tm-field-title {
  display: block;
  font-size: 13.5px;
  font-weight: 650;
  color: var(--bsb-text-primary);
  line-height: 1.3;
}

.bsb-tm-refresh-hint {
  display: inline-block;
  margin-left: 6px;
  font-size: 9px;
  font-weight: 600;
  color: var(--bsb-brand-blue);
  background: rgba(var(--bsb-brand-blue-rgb), 0.1);
  padding: 1px 5px;
  border-radius: 4px;
  vertical-align: middle;
  pointer-events: none;
  border: 1px solid rgba(var(--bsb-brand-blue-rgb), 0.15);
}

.sponsorThumbnailLabel .bsb-tm-thumbnail-label {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 10px;
  font-weight: 650;
  color: inherit;
  line-height: 1;
  white-space: nowrap;
  text-shadow:
    0 0.5px 1px rgba(15, 23, 42, 0.36),
    0 0 10px rgba(15, 23, 42, 0.1);
  opacity: 0;
  transform: translateY(1px);
  transition:
    opacity 180ms var(--bsb-ease-swift),
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.sponsorThumbnailLabel .bsb-tm-thumbnail-label > span {
  display: block;
  min-width: 0;
  overflow: visible;
}

.bsb-tm-thumbnail-host:hover .sponsorThumbnailLabelVisible,
.bsb-tm-thumbnail-host:focus-within .sponsorThumbnailLabelVisible,
.bsb-tm-thumbnail-host[data-bsb-hover="true"] .sponsorThumbnailLabelVisible,
.bsb-tm-thumbnail-slot[data-bsb-expanded="true"] .sponsorThumbnailLabelVisible,
.sponsorThumbnailLabelVisible[data-bsb-expanded="true"],
.bsb-tm-thumbnail-slot:hover .sponsorThumbnailLabelVisible,
.bsb-tm-thumbnail-slot:focus-within .sponsorThumbnailLabelVisible {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 10px 20px rgba(15, 23, 42, 0.22),
    0 0 0 1px rgba(255, 255, 255, 0.12);
  filter: saturate(1.05) brightness(1.02);
  --bsb-thumbnail-current-width: var(--bsb-thumbnail-expanded-width, 120px);
  --bsb-thumbnail-current-padding: var(--bsb-thumbnail-expanded-padding, 10px);
}

.bsb-tm-thumbnail-slot[data-placement="corner"] .sponsorThumbnailLabelVisible {
  padding-inline: 6px 8px;
}

.bsb-tm-thumbnail-host:hover .sponsorThumbnailLabel .bsb-tm-thumbnail-short-label,
.bsb-tm-thumbnail-host:focus-within .sponsorThumbnailLabel .bsb-tm-thumbnail-short-label,
.bsb-tm-thumbnail-host[data-bsb-hover="true"] .sponsorThumbnailLabel .bsb-tm-thumbnail-short-label,
.bsb-tm-thumbnail-slot[data-bsb-expanded="true"] .sponsorThumbnailLabel .bsb-tm-thumbnail-short-label,
.sponsorThumbnailLabel[data-bsb-expanded="true"] .bsb-tm-thumbnail-short-label,
.bsb-tm-thumbnail-slot:hover .sponsorThumbnailLabel .bsb-tm-thumbnail-short-label,
.bsb-tm-thumbnail-slot:focus-within .sponsorThumbnailLabel .bsb-tm-thumbnail-short-label {
  opacity: 0;
  transform: translateY(-1px);
}

.bsb-tm-thumbnail-host:hover .sponsorThumbnailLabel .bsb-tm-thumbnail-text-stack,
.bsb-tm-thumbnail-host:focus-within .sponsorThumbnailLabel .bsb-tm-thumbnail-text-stack,
.bsb-tm-thumbnail-host[data-bsb-hover="true"] .sponsorThumbnailLabel .bsb-tm-thumbnail-text-stack,
.bsb-tm-thumbnail-slot[data-bsb-expanded="true"] .sponsorThumbnailLabel .bsb-tm-thumbnail-text-stack,
.sponsorThumbnailLabel[data-bsb-expanded="true"] .bsb-tm-thumbnail-text-stack,
.bsb-tm-thumbnail-slot:hover .sponsorThumbnailLabel .bsb-tm-thumbnail-text-stack,
.bsb-tm-thumbnail-slot:focus-within .sponsorThumbnailLabel .bsb-tm-thumbnail-text-stack {
  --bsb-thumbnail-current-text-width: var(--bsb-thumbnail-expanded-text-width, 72px);
}

.bsb-tm-thumbnail-host:hover .sponsorThumbnailLabel .bsb-tm-thumbnail-label,
.bsb-tm-thumbnail-host:focus-within .sponsorThumbnailLabel .bsb-tm-thumbnail-label,
.bsb-tm-thumbnail-host[data-bsb-hover="true"] .sponsorThumbnailLabel .bsb-tm-thumbnail-label,
.bsb-tm-thumbnail-slot[data-bsb-expanded="true"] .sponsorThumbnailLabel .bsb-tm-thumbnail-label,
.sponsorThumbnailLabel[data-bsb-expanded="true"] .bsb-tm-thumbnail-label,
.bsb-tm-thumbnail-slot:hover .sponsorThumbnailLabel .bsb-tm-thumbnail-label,
.bsb-tm-thumbnail-slot:focus-within .sponsorThumbnailLabel .bsb-tm-thumbnail-label {
  opacity: 1;
  transform: translateY(0);
}

.bsb-tm-panel-header-copy {
  display: grid;
  gap: 6px;
}

.bsb-tm-panel-eyebrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: fit-content;
  padding: 5px 10px 5px 6px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(243, 246, 250, 0.6)),
    rgba(var(--bsb-brand-blue-rgb), 0.08);
  color: var(--bsb-text-secondary);
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
  box-shadow: var(--bsb-glass-inner);
}

.bsb-tm-panel-eyebrow-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: rgba(var(--bsb-brand-blue-rgb), 0.12);
  color: #0369a1;
}

.bsb-tm-panel-eyebrow-icon svg {
  width: 11px;
  height: 11px;
}

.bsb-tm-panel-header-actions {
  padding: 6px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.94), transparent 52%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 250, 0.76)),
    rgba(255, 255, 255, 0.58);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    0 16px 34px rgba(15, 23, 42, 0.08),
    0 0 0 1px rgba(148, 163, 184, 0.06);
  backdrop-filter: blur(12px) saturate(135%);
}

.bsb-tm-header-action {
  min-width: 84px;
  min-height: 42px;
  font-weight: 650;
  line-height: 1;
  color: var(--bsb-text-primary);
  border-color: rgba(148, 163, 184, 0.3);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    0 10px 22px rgba(15, 23, 42, 0.06);
}

.bsb-tm-tab-button:hover,
.bsb-tm-link-card:hover,
.bsb-tm-button:hover,
.bsb-tm-panel input:not(.bsb-tm-switch):hover,
.bsb-tm-panel select:hover {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.28);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 14px 30px rgba(15, 23, 42, 0.09);
  transform: translateY(-1px);
}

.bsb-tm-field:hover,
.bsb-tm-category-row:hover {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.22);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 14px 28px rgba(15, 23, 42, 0.08),
    inset 0 0 0 1px rgba(var(--bsb-brand-blue-rgb), 0.06);
  transform: translateY(-1px);
}

.bsb-tm-tab-button:active,
.bsb-tm-button:active,
.bsb-tm-link-card:active {
  transform: translateY(0) scale(0.985);
}

.bsb-tm-button.success {
  background: linear-gradient(180deg, #dcfce7, #bbf7d0) !important;
  border-color: #86efac !important;
  color: #166534 !important;
  box-shadow: 0 4px 12px rgba(22, 101, 52, 0.12) !important;
}

.bsb-tm-button.confirming {
  background: var(--bsb-danger) !important;
  color: #fff !important;
  border-color: rgba(0, 0, 0, 0.1) !important;
  animation: bsb-pulse 2s infinite;
  box-shadow: 0 0 0 0 rgba(var(--bsb-danger-rgb), 0.42);
}

.bsb-tm-button.confirming:hover {
  background: color-mix(in srgb, var(--bsb-danger) 90%, black) !important;
}

@keyframes bsb-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--bsb-danger-rgb), 0.52);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(var(--bsb-danger-rgb), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--bsb-danger-rgb), 0);
  }
}

.bsb-tm-panel input:not(.bsb-tm-switch):focus,
.bsb-tm-panel select:focus {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.3);
  box-shadow:
    0 0 0 4px rgba(var(--bsb-brand-blue-rgb), 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.68);
}

.bsb-tm-form-group:hover,
.bsb-tm-form-group:focus-within {
  border-color: rgba(255, 255, 255, 0.82);
  box-shadow:
    var(--bsb-glass-inner),
    0 24px 50px rgba(15, 23, 42, 0.12),
    inset 0 0 0 1px rgba(var(--bsb-brand-blue-rgb), 0.08);
}

.bsb-tm-link-card:hover {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.22);
  transform: translateY(-1px);
}

.bsb-tm-field:focus-within,
.bsb-tm-category-row:focus-within,
.bsb-tm-link-card:focus-visible {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.3);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    0 16px 34px rgba(15, 23, 42, 0.08),
    0 0 0 3px rgba(var(--bsb-brand-blue-rgb), 0.08);
}

${inlineFeedbackStyles}

@keyframes bsbNoticeIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.bsb-tm-title-pill:focus-visible,
.bsb-tm-player-button:focus-visible,
.bsb-tm-pill-action:focus-visible,
.sponsorThumbnailLabel:focus-visible,
.bsb-tm-tab-button:focus-visible,
.bsb-tm-button:focus-visible {
  box-shadow:
    0 0 0 3px rgba(var(--bsb-brand-blue-rgb), 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

[data-bsb-native-header-hidden="true"] {
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
  user-select: none !important;
}

.bsb-tm-video-header-shell,
.player-full-win .bsb-tm-video-header-shell,
.player-fullscreen .bsb-tm-video-header-shell {
  display: none;
}

.bsb-tm-video-header-compact .bsb-tm-video-header-shell {
  display: block;
  position: fixed;
  top: 0;
  left: 50%;
  z-index: 1100;
  width: min(1160px, calc(100vw - 28px));
  transform: translateX(-50%);
  pointer-events: none;
}

.player-full-win .bsb-tm-video-header-shell,
.player-fullscreen .bsb-tm-video-header-shell {
  display: none !important;
}

.player-full-win .video-container-v1,
.player-fullscreen .video-container-v1 {
  margin-top: 0 !important;
}

.bsb-tm-video-header-bar {
  position: relative;
  display: grid;
  grid-template-columns: minmax(320px, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 54px;
  padding: 4px 14px;
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(248, 250, 252, 0.56)),
    rgba(255, 255, 255, 0.46);
  box-shadow:
    0 18px 42px rgba(15, 23, 42, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.76),
    inset 0 -1px 0 rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(24px) saturate(165%);
  pointer-events: auto;
  transition:
    box-shadow 220ms var(--bsb-ease-swift),
    transform 260ms var(--bsb-ease-spring),
    border-color 220ms var(--bsb-ease-swift);
}

.bsb-tm-video-header-bar::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.42), transparent 48%);
  pointer-events: none;
}

.bsb-tm-video-header-search,
.bsb-tm-video-header-profile {
  min-width: 0;
}

.bsb-tm-video-header-profile {
  display: flex;
  justify-content: flex-end;
}

.bsb-tm-video-header-fallback-search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.bsb-tm-video-header-fallback-search input,
.bsb-tm-video-header-fallback-search button,
.bsb-tm-video-header-profile-link {
  appearance: none;
  -webkit-appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.7)),
    rgba(255, 255, 255, 0.52);
  color: #0f172a;
  font: inherit;
  text-decoration: none;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.76),
    0 10px 24px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(18px) saturate(150%);
  transition:
    box-shadow 220ms var(--bsb-ease-swift),
    transform 260ms var(--bsb-ease-spring),
    border-color 220ms var(--bsb-ease-swift),
    background 220ms var(--bsb-ease-swift),
    filter 180ms var(--bsb-ease-swift);
}

.bsb-tm-video-header-fallback-search input {
  min-width: 0;
  padding: 11px 14px;
  font: 500 15px/1.2 "SF Pro Text", "PingFang SC", sans-serif;
}

.bsb-tm-video-header-fallback-search button {
  padding: 11px 14px;
  font: 600 13px/1 "SF Pro Text", "PingFang SC", sans-serif;
}

.bsb-tm-video-header-profile-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  min-height: 42px;
  padding: 0 10px;
  border-radius: 999px;
}

.bsb-tm-video-header-fallback-search input:hover,
.bsb-tm-video-header-fallback-search button:hover,
.bsb-tm-video-header-profile-link:hover,
.bsb-tm-video-header-fallback-search input:focus,
.bsb-tm-video-header-fallback-search button:focus,
.bsb-tm-video-header-profile-link:focus {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.24);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 14px 30px rgba(15, 23, 42, 0.1),
    0 0 0 3px rgba(var(--bsb-brand-blue-rgb), 0.08);
  transform: translateY(-1px);
}

.bsb-tm-video-header-fallback-search button:active,
.bsb-tm-video-header-profile-link:active {
  transform: scale(0.98);
}

.bsb-tm-video-header-profile-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bsb-tm-video-header-avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  object-fit: cover;
  display: block;
}

.bsb-tm-video-header-profile-fallback svg {
  width: 18px;
  height: 18px;
}

@media (max-width: 900px) {
  .bsb-tm-panel {
    width: min(calc(var(--bsb-tm-panel-vw) - 12px), 920px);
    height: min(var(--bsb-tm-panel-height, calc(var(--bsb-tm-panel-vh) - 12px)), calc(var(--bsb-tm-panel-vh) - 12px));
    max-height: calc(var(--bsb-tm-panel-vh) - 12px);
  }

  .bsb-tm-panel-body {
    grid-template-columns: 1fr;
  }

  .bsb-tm-panel-nav {
    grid-auto-flow: column;
    grid-auto-columns: minmax(140px, 1fr);
    overflow: auto;
    border-right: none;
    border-bottom: 1px solid var(--bsb-border);
    padding: 14px 16px;
  }

  .bsb-tm-video-header-shell {
    width: calc(100vw - 20px);
  }

  .bsb-tm-video-header-bar {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    padding: 4px 12px;
  }
}

@media (max-width: 768px) {
  .bsb-tm-panel-header {
    padding: 16px 18px 14px;
  }

  .bsb-tm-panel-header-actions {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .bsb-tm-panel-content {
    padding: 16px;
  }

  .bsb-tm-form-group,
  .bsb-tm-summary-line,
  .bsb-tm-field,
  .bsb-tm-category-row,
  .bsb-tm-feature-card,
  .bsb-tm-info-box,
  .bsb-tm-link-card {
    padding: 12px 14px;
  }

  .bsb-tm-categories,
  .bsb-tm-overview-grid,
  .bsb-tm-help-grid,
  .bsb-tm-field-grid {
    grid-template-columns: 1fr;
  }

  .bsb-tm-notice-root {
    width: min(340px, calc(100vw - 24px));
    right: 12px;
    bottom: 160px;
  }

  .bsb-tm-title-popover {
    width: min(320px, calc(100vw - 24px));
  }

  .sponsorThumbnailLabel {
    height: 24px;
    min-width: 24px;
    font-size: 10px;
  }

  .sponsorThumbnailLabel .bsb-tm-thumbnail-short-label,
  .sponsorThumbnailLabel .bsb-tm-thumbnail-label {
    font-size: 10px;
  }

  .bsb-tm-video-header-shell {
    top: 0;
    width: calc(100vw - 16px);
  }

  .bsb-tm-video-header-bar {
    min-height: 48px;
    padding: 4px 10px;
    border-radius: 18px;
  }

  .bsb-tm-video-header-profile-link {
    min-width: 38px;
    min-height: 38px;
    padding: 0 8px;
  }

  .bsb-tm-video-header-avatar {
    width: 30px;
    height: 30px;
  }
}
`;
  var mbgaStyles = ``;

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
      const localVideoLabelStore = new LocalVideoLabelStore();
      const voteHistoryStore = new VoteHistoryStore();
      yield Promise.all([configStore.load(), statsStore.load(), localVideoLabelStore.load(), voteHistoryStore.load()]);
      const currentConfig = configStore.getSnapshot();
      mountMbga(currentConfig);
      if (currentConfig.mbgaEnabled && currentConfig.mbgaSimplifyUi) {
        gmAddStyle(mbgaStyles);
        mountMbgaUi(currentConfig);
      }
      const controller = new ScriptController(configStore, statsStore, cache, localVideoLabelStore, voteHistoryStore);
      const dynamicSponsorController = new DynamicSponsorController(configStore);
      const commentSponsorController = new CommentSponsorController(configStore);
      const thumbnailLabelController = new ThumbnailLabelController(configStore, cache, localVideoLabelStore);
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
      gmRegisterMenuCommand("\u6253\u5F00 BSB \u63A7\u5236\u53F0", () => controller.openPanel());
      gmRegisterMenuCommand("\u6253\u5F00 BSB \u5E2E\u52A9", () => controller.openHelp());
      gmRegisterMenuCommand("\u5207\u6362 BSB \u63A7\u5236\u53F0", () => controller.togglePanel());
      gmRegisterMenuCommand("\u6E05\u7406 BSB \u7F13\u5B58", () => {
        void controller.clearCache();
      });
      yield runtime.start();
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
