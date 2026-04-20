import { describe, expect, it } from "vitest";
import { shouldBlockNativeHeaderRequest } from "../src/platform/native-request-guard";

describe("native request guard", () => {
  it("does not block anything until compact header guard is explicitly enabled", () => {
    expect(
      shouldBlockNativeHeaderRequest("https://api.bilibili.com/x/msgfeed/unread", {
        enabled: false,
        supportedPage: true,
        compactHeaderReady: true
      })
    ).toBe(false);
  });

  it("blocks only confirmed redundant topbar badge requests when compact header is ready", () => {
    const state = {
      enabled: true,
      supportedPage: true,
      compactHeaderReady: true
    };

    expect(shouldBlockNativeHeaderRequest("https://api.bilibili.com/x/msgfeed/unread", state)).toBe(true);
    expect(shouldBlockNativeHeaderRequest("https://api.bilibili.com/x/web-interface/nav/stat", state)).toBe(true);
    expect(shouldBlockNativeHeaderRequest("https://api.bilibili.com/x/web-interface/nav", state)).toBe(false);
    expect(shouldBlockNativeHeaderRequest("https://api.bilibili.com/x/player/wbi/v2", state)).toBe(false);
    expect(shouldBlockNativeHeaderRequest("https://api.bilibili.com/x/v2/reply/wbi/main", state)).toBe(false);
  });

  it("keeps the guard open until the compact header has an independent render seed", () => {
    expect(
      shouldBlockNativeHeaderRequest("https://api.bilibili.com/x/msgfeed/unread", {
        enabled: true,
        supportedPage: true,
        compactHeaderReady: false
      })
    ).toBe(false);
  });
});
