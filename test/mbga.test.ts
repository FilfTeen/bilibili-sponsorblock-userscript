import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MbgaContext } from "../src/types";
import {
  MBGA_RULES,
  clearMbgaDecisionRecords,
  getMbgaDecisionRecords,
  mountMbga,
  mountMbgaUi,
  removeTracking,
  resolveMbgaNetworkDecision
} from "../src/features/mbga/core";
import { cloneDefaultConfig } from "../src/core/config-store";

function createContext(url: string): MbgaContext {
  const config = cloneDefaultConfig();
  return {
    config,
    doc: document,
    win: window,
    url: new URL(url)
  };
}

function getRule(id: string) {
  const rule = MBGA_RULES.find((item) => item.id === id);
  if (!rule) {
    throw new Error(`Missing MBGA rule: ${id}`);
  }
  return rule;
}

class FakeXmlHttpRequest extends EventTarget {
  readyState = 0;
  status = 0;
  statusText = "";
  responseText = "";
  response = "";
  responseURL = "";
  onreadystatechange: ((event?: Event) => void) | null = null;
  onload: ((event?: Event) => void) | null = null;
  onloadend: ((event?: Event) => void) | null = null;
  lastOpenUrl = "";
  sent = false;

  open(_method: string, url: string): void {
    this.lastOpenUrl = url;
    this.readyState = 1;
  }

  send(): void {
    this.sent = true;
  }
}

function installLocalStorageStub(): Storage {
  const store = new Map<string, string>();
  const stub = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    }
  } satisfies Storage;
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: stub
  });
  return stub;
}

function createFakeLocation(href: string): Location {
  const url = new URL(href);
  return {
    ancestorOrigins: {} as DOMStringList,
    assign: vi.fn(),
    hash: url.hash,
    host: url.host,
    hostname: url.hostname,
    href: url.href,
    origin: url.origin,
    pathname: url.pathname,
    port: url.port,
    protocol: url.protocol,
    reload: vi.fn(),
    replace: vi.fn(),
    search: url.search,
    toString() {
      return url.href;
    }
  } as unknown as Location;
}

function defineConfigurableValue(target: object, key: PropertyKey, value: unknown): void {
  Object.defineProperty(target, key, {
    configurable: true,
    writable: true,
    value
  });
}

function createFakeWindow(href: string) {
  const fakeWindow = Object.create(window) as Window & typeof globalThis & Record<string, unknown>;
  Object.defineProperty(fakeWindow, "location", {
    configurable: true,
    value: createFakeLocation(href)
  });
  Object.defineProperty(fakeWindow, "navigator", {
    configurable: true,
    value: {
      ...window.navigator,
      sendBeacon: vi.fn(() => true)
    }
  });
  Object.defineProperty(fakeWindow, "localStorage", {
    configurable: true,
    value: installLocalStorageStub()
  });
  return fakeWindow;
}

function stubWindowLocation(href: string): () => void {
  const original = Object.getOwnPropertyDescriptor(window, "location");
  Object.defineProperty(window, "location", {
    configurable: true,
    value: createFakeLocation(href)
  });

  return () => {
    if (original) {
      Object.defineProperty(window, "location", original);
    }
  };
}

beforeEach(() => {
  clearMbgaDecisionRecords();
  installLocalStorageStub().clear();
  (window as Window & typeof globalThis & Record<string, unknown>).__BSB_MBGA_URL_CLEANER__ = undefined;
  (window as Window & typeof globalThis & Record<string, unknown>).__BSB_MBGA_BLOCK_TRACKING__ = undefined;
  (window as Window & typeof globalThis & Record<string, unknown>).__BSB_MBGA_PCDN_DISABLER__ = undefined;
  (window as Window & typeof globalThis & Record<string, unknown>).__BSB_MBGA_DYNAMIC_WIDE_SWITCH__ = undefined;
  (window as Window & typeof globalThis & Record<string, unknown>).__BSB_MBGA_ARTICLE_COPY_UNLOCK__ = undefined;
  (window as Window & typeof globalThis & Record<string, unknown>).__BSB_MBGA_VIDEO_FIT_MODE__ = undefined;
  (window as Window & typeof globalThis & Record<string, unknown>).__BSB_MBGA_GRAYSCALE_OBSERVER__ = undefined;
});

describe("MBGA helpers", () => {
  it("removes only explicit tracking params and keeps hash", () => {
    expect(
      removeTracking(
        "https://www.bilibili.com/video/BV1xx/?spm_id_from=333.1007.tianma.1-1-1.click&mid=7&foo=bar#reply"
      )
    ).toBe("https://www.bilibili.com/video/BV1xx/?foo=bar#reply");
  });

  it("blocks only explicit telemetry hosts", () => {
    expect(resolveMbgaNetworkDecision("https://data.bilibili.com/log/web")).toMatchObject({
      action: "block",
      syntheticStatus: 204
    });
    expect(resolveMbgaNetworkDecision("https://api.bilibili.com/x/web-interface/nav")).toMatchObject({
      action: "allow"
    });
  });
});

describe("MBGA network interception", () => {
  it("returns a synthetic fetch response instead of hanging", async () => {
    const rule = getRule("block-telemetry-reporters");
    const fetchSpy = vi.fn(async () => new Response("ok", { status: 200 }));
    const fakeWindow = createFakeWindow("https://www.bilibili.com/");
    const sendBeaconSpy = fakeWindow.navigator.sendBeacon as ReturnType<typeof vi.fn>;
    fakeWindow.fetch = fetchSpy;
    fakeWindow.XMLHttpRequest = FakeXmlHttpRequest as unknown as typeof XMLHttpRequest;
    const ctx: MbgaContext = {
      config: cloneDefaultConfig(),
      doc: document,
      win: fakeWindow,
      url: new URL(fakeWindow.location.href)
    };

    rule.apply(ctx);

    const blocked = await fakeWindow.fetch("https://data.bilibili.com/log/web");
    const allowed = await fakeWindow.fetch("https://api.bilibili.com/x/web-interface/nav");

    expect(blocked.status).toBe(204);
    expect(blocked.ok).toBe(true);
    expect(await blocked.text()).toBe("");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(allowed.status).toBe(200);
    expect(fakeWindow.navigator.sendBeacon?.("https://cm.bilibili.com/trace")).toBe(true);
    expect(sendBeaconSpy).not.toHaveBeenCalled();

    const records = getMbgaDecisionRecords();
    expect(records.map((record) => record.action)).toEqual(expect.arrayContaining(["synthetic", "observed", "blocked"]));
    expect(records.some((record) => record.url.includes("?") || record.url.includes("#"))).toBe(false);
    expect(records.some((record) => record.url === "https://data.bilibili.com/log/web")).toBe(true);
  });

  it("allows non-telemetry sendBeacon calls to pass through", () => {
    const rule = getRule("block-telemetry-reporters");
    const fakeWindow = createFakeWindow("https://www.bilibili.com/");
    const sendBeaconSpy = fakeWindow.navigator.sendBeacon as ReturnType<typeof vi.fn>;
    fakeWindow.fetch = vi.fn(async () => new Response("ok", { status: 200 }));
    fakeWindow.XMLHttpRequest = FakeXmlHttpRequest as unknown as typeof XMLHttpRequest;

    rule.apply({
      config: cloneDefaultConfig(),
      doc: document,
      win: fakeWindow,
      url: new URL(fakeWindow.location.href)
    });

    expect(fakeWindow.navigator.sendBeacon?.("https://api.bilibili.com/x/report")).toBe(true);
    expect(sendBeaconSpy).toHaveBeenCalledTimes(1);
  });

  it("short-circuits blocked xhr requests with load semantics", async () => {
    const rule = getRule("block-telemetry-reporters");
    const fakeWindow = createFakeWindow("https://www.bilibili.com/");
    fakeWindow.fetch = vi.fn(async () => new Response("ok", { status: 200 }));
    fakeWindow.XMLHttpRequest = FakeXmlHttpRequest as unknown as typeof XMLHttpRequest;
    const ctx: MbgaContext = {
      config: cloneDefaultConfig(),
      doc: document,
      win: fakeWindow,
      url: new URL(fakeWindow.location.href)
    };

    rule.apply(ctx);

    const xhr = new fakeWindow.XMLHttpRequest() as unknown as FakeXmlHttpRequest;
    const onLoad = vi.fn();
    const onLoadEnd = vi.fn();
    xhr.onload = onLoad;
    xhr.onloadend = onLoadEnd;
    xhr.open("GET", "https://cm.bilibili.com/cm/api");
    xhr.send();
    await Promise.resolve();

    expect(xhr.status).toBe(204);
    expect(xhr.readyState).toBe(4);
    expect(xhr.sent).toBe(false);
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onLoadEnd).toHaveBeenCalledTimes(1);
  });

  it("does not install WebRTC stubs for the telemetry blocking rule", () => {
    const rule = getRule("block-telemetry-reporters");
    const fakeWindow = createFakeWindow("https://www.bilibili.com/");
    defineConfigurableValue(fakeWindow, "RTCPeerConnection", undefined);
    defineConfigurableValue(fakeWindow, "RTCDataChannel", undefined);
    defineConfigurableValue(fakeWindow, "webkitRTCPeerConnection", undefined);
    defineConfigurableValue(fakeWindow, "webkitRTCDataChannel", undefined);
    fakeWindow.fetch = vi.fn(async () => new Response("ok", { status: 200 }));
    fakeWindow.XMLHttpRequest = FakeXmlHttpRequest as unknown as typeof XMLHttpRequest;

    rule.apply({
      config: cloneDefaultConfig(),
      doc: document,
      win: fakeWindow,
      url: new URL(fakeWindow.location.href)
    });

    expect(fakeWindow.RTCPeerConnection).toBeUndefined();
    expect(fakeWindow.RTCDataChannel).toBeUndefined();
    expect(fakeWindow.webkitRTCPeerConnection).toBeUndefined();
    expect(fakeWindow.webkitRTCDataChannel).toBeUndefined();
  });

  it("keeps MBGA decision records bounded", async () => {
    const rule = getRule("block-telemetry-reporters");
    const fakeWindow = createFakeWindow("https://www.bilibili.com/");
    fakeWindow.fetch = vi.fn(async () => new Response("ok", { status: 200 }));
    fakeWindow.XMLHttpRequest = FakeXmlHttpRequest as unknown as typeof XMLHttpRequest;

    rule.apply({
      config: cloneDefaultConfig(),
      doc: document,
      win: fakeWindow,
      url: new URL(fakeWindow.location.href)
    });

    for (let index = 0; index < 90; index += 1) {
      await fakeWindow.fetch(`https://api.bilibili.com/x/web-interface/nav?token=secret-${index}`);
    }

    const records = getMbgaDecisionRecords();
    expect(records).toHaveLength(80);
    expect(records[0]?.url).toBe("https://api.bilibili.com/x/web-interface/nav");
    expect(records[0]?.url).not.toContain("secret");
  });
});

describe("MBGA page guards", () => {
  it("keeps mountMbga and mountMbgaUi responsibilities separated", () => {
    const originalFetch = window.fetch;
    const baseConfig = cloneDefaultConfig();

    mountMbga(baseConfig);
    expect(window.fetch).not.toBe(originalFetch);

    mountMbgaUi(baseConfig);
    expect(window.fetch).not.toBe(originalFetch);

    window.fetch = originalFetch;
    (window as Window & typeof globalThis & Record<string, unknown>).__BSB_MBGA_BLOCK_TRACKING__ = undefined;
  });

  it("does not install WebRTC stubs when disable-pcdn is enabled on non-video pages", () => {
    const config = cloneDefaultConfig();
    config.mbgaBlockTracking = false;
    config.mbgaCleanUrl = false;
    config.mbgaDisablePcdn = true;

    const restoreLocation = stubWindowLocation("https://www.bilibili.com/read/cv123456");
    const originalPeerConnection = Object.getOwnPropertyDescriptor(window, "RTCPeerConnection");
    const originalDataChannel = Object.getOwnPropertyDescriptor(window, "RTCDataChannel");
    const originalWebkitPeerConnection = Object.getOwnPropertyDescriptor(window, "webkitRTCPeerConnection");
    const originalWebkitDataChannel = Object.getOwnPropertyDescriptor(window, "webkitRTCDataChannel");
    defineConfigurableValue(window, "RTCPeerConnection", undefined);
    defineConfigurableValue(window, "RTCDataChannel", undefined);
    defineConfigurableValue(window, "webkitRTCPeerConnection", undefined);
    defineConfigurableValue(window, "webkitRTCDataChannel", undefined);

    mountMbga(config);

    expect((window as Window & typeof globalThis & Record<string, unknown>).RTCPeerConnection).toBeUndefined();
    expect((window as Window & typeof globalThis & Record<string, unknown>).RTCDataChannel).toBeUndefined();
    expect((window as Window & typeof globalThis & Record<string, unknown>).webkitRTCPeerConnection).toBeUndefined();
    expect((window as Window & typeof globalThis & Record<string, unknown>).webkitRTCDataChannel).toBeUndefined();

    restoreLocation();
    if (originalPeerConnection) {
      Object.defineProperty(window, "RTCPeerConnection", originalPeerConnection);
    }
    if (originalDataChannel) {
      Object.defineProperty(window, "RTCDataChannel", originalDataChannel);
    }
    if (originalWebkitPeerConnection) {
      Object.defineProperty(window, "webkitRTCPeerConnection", originalWebkitPeerConnection);
    }
    if (originalWebkitDataChannel) {
      Object.defineProperty(window, "webkitRTCDataChannel", originalWebkitDataChannel);
    }
  });

  it("does not collect MBGA records when the MBGA master switch is off", () => {
    const config = cloneDefaultConfig();
    config.mbgaEnabled = false;

    mountMbga(config);

    expect(getMbgaDecisionRecords()).toHaveLength(0);
  });

  it("installs WebRTC stubs through disable-pcdn on video pages", () => {
    const rule = getRule("disable-pcdn");
    const fakeWindow = createFakeWindow("https://www.bilibili.com/video/BV1xx/");
    defineConfigurableValue(fakeWindow, "RTCPeerConnection", undefined);
    defineConfigurableValue(fakeWindow, "RTCDataChannel", undefined);
    defineConfigurableValue(fakeWindow, "webkitRTCPeerConnection", undefined);
    defineConfigurableValue(fakeWindow, "webkitRTCDataChannel", undefined);
    defineConfigurableValue(fakeWindow, "PCDNLoader", undefined);
    defineConfigurableValue(fakeWindow, "BPP2PSDK", undefined);
    defineConfigurableValue(fakeWindow, "SeederSDK", undefined);
    fakeWindow.XMLHttpRequest = FakeXmlHttpRequest as unknown as typeof XMLHttpRequest;
    defineConfigurableValue(fakeWindow, "HTMLMediaElement", class {});

    const ctx: MbgaContext = {
      config: cloneDefaultConfig(),
      doc: document,
      win: fakeWindow,
      url: new URL(fakeWindow.location.href)
    };

    expect(rule.match(ctx)).toBe(true);
    rule.apply(ctx);

    expect(typeof fakeWindow.RTCPeerConnection).toBe("function");
    expect(typeof fakeWindow.RTCDataChannel).toBe("function");
    expect(typeof fakeWindow.webkitRTCPeerConnection).toBe("function");
    expect(typeof fakeWindow.webkitRTCDataChannel).toBe("function");
    expect(typeof fakeWindow.PCDNLoader).toBe("function");
    expect(typeof fakeWindow.BPP2PSDK).toBe("function");
    expect(typeof fakeWindow.SeederSDK).toBe("function");
    expect(getMbgaDecisionRecords().some((record) => record.action === "stubbed")).toBe(true);
  });

  it("records PCDN URL rewrites without leaking query strings", () => {
    const rule = getRule("disable-pcdn");
    const fakeWindow = createFakeWindow("https://www.bilibili.com/video/BV1xx/");
    fakeWindow.XMLHttpRequest = FakeXmlHttpRequest as unknown as typeof XMLHttpRequest;
    defineConfigurableValue(fakeWindow, "HTMLMediaElement", class {});

    rule.apply({
      config: cloneDefaultConfig(),
      doc: document,
      win: fakeWindow,
      url: new URL(fakeWindow.location.href)
    });

    const xhr = new fakeWindow.XMLHttpRequest() as unknown as FakeXmlHttpRequest;
    xhr.open("GET", "https://abc.mcdn.bilivideo.cn:4483/upgcxcode/path.m4s?token=secret#frag");

    const rewrite = getMbgaDecisionRecords().find((record) => record.action === "rewritten");
    expect(rewrite?.url).toBe("https://abc.mcdn.bilivideo.cn:4483/upgcxcode/path.m4s");
    expect(rewrite?.url).not.toContain("secret");
    expect(rewrite?.url).not.toContain("#");
  });

  it("injects the dynamic wide mode toggle and persists opt-out", () => {
    const rule = getRule("dynamic-wide-mode");
    document.body.innerHTML = '<div class="bili-dyn-list-tabs__list"></div>';

    const ctx = createContext("https://t.bilibili.com/");
    expect(rule.match(ctx)).toBe(true);

    rule.apply(ctx);
    window.dispatchEvent(new Event("load"));

    const button = document.getElementById("wide-mode-switch");
    expect(document.documentElement.getAttribute("wide")).toBe("wide");
    expect(button?.textContent).toContain("宽屏模式");

    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(window.localStorage.getItem("WIDE_OPT_OUT")).toBe("1");
    expect(document.documentElement.hasAttribute("wide")).toBe(false);
  });

  it("injects video fit mode only on video pages and toggles body state", () => {
    vi.useFakeTimers();
    const rule = getRule("video-fit-mode");
    expect(rule.match(createContext("https://www.bilibili.com/read/cv123"))).toBe(false);

    document.body.innerHTML =
      '<div class="bpx-player-ctrl-setting-menu-left"><div class="bpx-player-ctrl-setting-more"></div></div>';
    const ctx = createContext("https://www.bilibili.com/video/BV1xx/");
    rule.apply(ctx);
    vi.advanceTimersByTime(1_000);

    const checkbox = document.querySelector(".bpx-player-ctrl-setting-fit-mode input") as HTMLInputElement | null;
    expect(checkbox).not.toBeNull();
    checkbox!.checked = true;
    checkbox!.dispatchEvent(new Event("change", { bubbles: true }));
    expect(document.body.hasAttribute("video-fit")).toBe(true);
    vi.useRealTimers();
  });

  it("only unlocks article copy behavior on article pages", () => {
    const rule = getRule("article-copy-unlock");
    expect(rule.match(createContext("https://www.bilibili.com/video/BV1xx/"))).toBe(false);

    document.body.innerHTML = '<div class="article-holder unable-reprint"></div>';
    (window as Window & typeof globalThis & { original?: { reprint?: string } }).original = { reprint: "0" };

    const ctx = createContext("https://www.bilibili.com/read/cv123456");
    expect(rule.match(ctx)).toBe(true);
    rule.apply(ctx);

    expect(document.querySelector(".article-holder")?.classList.contains("unable-reprint")).toBe(false);
    expect((window as Window & typeof globalThis & { original?: { reprint?: string } }).original?.reprint).toBe("1");
  });

  it("unlocks article copy behavior when the article holder mounts late", async () => {
    const rule = getRule("article-copy-unlock");
    (window as Window & typeof globalThis & { original?: { reprint?: string } }).original = { reprint: "0" };

    const ctx = createContext("https://www.bilibili.com/read/cv123456");
    rule.apply(ctx);

    const holder = document.createElement("div");
    holder.className = "article-holder unable-reprint";
    document.body.appendChild(holder);
    await Promise.resolve();

    expect(holder.classList.contains("unable-reprint")).toBe(false);
    expect(holder.getAttribute("data-bsb-mbga-copy-unlocked")).toBe("true");
    expect((window as Window & typeof globalThis & { original?: { reprint?: string } }).original?.reprint).toBe("1");
  });

  it("neutralizes grayscale only when the page is actually gray", () => {
    const rule = getRule("neutralize-page-grayscale");
    document.documentElement.style.filter = "";
    rule.apply(createContext("https://www.bilibili.com/video/BV1xx/"));
    expect(document.documentElement.style.filter).toBe("");

    document.documentElement.style.filter = "grayscale(1)";
    rule.apply(createContext("https://www.bilibili.com/video/BV1xx/"));
    expect(document.documentElement.style.getPropertyValue("filter")).toBe("none");
  });
});
