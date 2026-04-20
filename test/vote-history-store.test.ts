import { afterEach, describe, expect, it, vi } from "vitest";
import { VoteHistoryStore } from "../src/core/vote-history-store";

describe("vote history store", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("rolls vote history back when persistence fails", async () => {
    vi.stubGlobal("GM_getValue", vi.fn(async (_key, fallback) => fallback));
    vi.stubGlobal("GM_setValue", vi.fn(async () => {
      throw new Error("vote history save failed");
    }));

    const store = new VoteHistoryStore();
    await store.load();

    await expect(store.remember("segment-uuid")).rejects.toThrow("vote history save failed");

    expect(store.has("segment-uuid")).toBe(false);
  });
});
