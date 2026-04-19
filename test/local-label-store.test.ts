import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalVideoLabelStore } from "../src/core/local-label-store";

describe("local video label store", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("rolls manual labels back when persistence fails", async () => {
    vi.stubGlobal("GM_getValue", vi.fn(async (_key, fallback) => fallback));
    vi.stubGlobal("GM_setValue", vi.fn(async () => {
      throw new Error("local label save failed");
    }));

    const store = new LocalVideoLabelStore();
    await store.load();

    await expect(store.rememberManual("BV17x411w7KC", "sponsor")).rejects.toThrow("local label save failed");

    expect(store.getResolved("BV17x411w7KC")).toBeNull();
  });
});
