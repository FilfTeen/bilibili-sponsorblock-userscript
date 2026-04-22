import { describe, expect, it } from "vitest";
import {
  getNativeRequestGuardSnapshot,
  sanitizeNativeRequestGuardSnapshot,
  shouldBlockNativeHeaderRequest
} from "../src/platform/native-request-guard";

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

  it("sanitizes exported guard records and preserves action classes", () => {
    const snapshot = sanitizeNativeRequestGuardSnapshot({
      enabled: true,
      supportedPage: true,
      compactHeaderReady: true,
      reason: "test",
      records: [
        {
          action: "blocked-fetch",
          url: "https://api.bilibili.com/x/msgfeed/unread?token=secret#frag",
          time: 1,
          reason: "ready"
        },
        {
          action: "would-block-xhr",
          url: "https://api.bilibili.com/x/web-interface/nav/stat?userId=secret",
          time: 2,
          reason: "ready"
        },
        {
          action: "observed-fetch",
          url: "https://api.bilibili.com/x/player/wbi/v2?spm_id_from=333.788",
          time: 3,
          reason: "ready"
        }
      ]
    });

    expect(snapshot?.records.map((record) => record.action)).toEqual([
      "blocked-fetch",
      "would-block-xhr",
      "observed-fetch"
    ]);
    expect(snapshot?.records[0]?.url).toBe("https://api.bilibili.com/x/msgfeed/unread");
    expect(JSON.stringify(snapshot)).not.toContain("secret");
    expect(JSON.stringify(snapshot)).not.toContain("spm_id_from");
    expect(JSON.stringify(snapshot)).not.toContain("#");
  });

  it("keeps exported guard records bounded", () => {
    const snapshot = sanitizeNativeRequestGuardSnapshot({
      records: Array.from({ length: 90 }, (_, index) => ({
        action: index % 2 === 0 ? "observed-xhr" : "observed-fetch",
        url: `https://api.bilibili.com/x/web-interface/nav?token=${index}`,
        time: index,
        reason: "test"
      }))
    });

    expect(snapshot?.records).toHaveLength(80);
    expect(snapshot?.records[0]?.time).toBe(10);
  });

  it("returns null when the page bridge snapshot is unavailable", () => {
    expect(getNativeRequestGuardSnapshot()).toBeNull();
  });

  it("exports a synchronous page-context snapshot when the bridge responds", () => {
    const handleRequest = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      document.dispatchEvent(
        new CustomEvent("bsb-tm:native-request-guard-snapshot-response", {
          detail: {
            id: detail.id,
            snapshot: {
              enabled: true,
              supportedPage: true,
              compactHeaderReady: true,
              reason: "test",
              records: [
                {
                  action: "blocked-fetch",
                  url: "https://api.bilibili.com/x/msgfeed/unread?token=secret",
                  time: 1,
                  reason: "test"
                }
              ]
            }
          }
        })
      );
    };
    document.addEventListener("bsb-tm:native-request-guard-snapshot-request", handleRequest);

    const snapshot = getNativeRequestGuardSnapshot();

    document.removeEventListener("bsb-tm:native-request-guard-snapshot-request", handleRequest);
    expect(snapshot?.enabled).toBe(true);
    expect(snapshot?.records[0]?.action).toBe("blocked-fetch");
    expect(snapshot?.records[0]?.url).toBe("https://api.bilibili.com/x/msgfeed/unread");
  });
});
