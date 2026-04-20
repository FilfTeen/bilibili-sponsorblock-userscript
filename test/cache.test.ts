import { afterEach, describe, expect, it, vi } from "vitest";
import { PersistentCache } from "../src/core/cache";

describe("persistent cache", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("does not block load on a failed normalization write-back", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("GM_getValue", vi.fn(async () => ({
      entries: {
        cached: {
          value: "ok",
          expiresAt: Date.now() + 10_000,
          updatedAt: Date.now(),
          size: 2
        }
      }
    })));
    const setValue = vi.fn(async () => {
      throw new Error("cache write failed");
    });
    vi.stubGlobal("GM_setValue", setValue);

    const cache = new PersistentCache<string>();

    await expect(cache.load()).resolves.toBeUndefined();
    await vi.advanceTimersByTimeAsync(200);

    expect(setValue).toHaveBeenCalled();
    await expect(cache.get("cached")).resolves.toBe("ok");
  });

  it("settles cache writes when persistence fails", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("GM_getValue", vi.fn(async (_key, fallback) => fallback));
    vi.stubGlobal("GM_setValue", vi.fn(async () => {
      throw new Error("cache write failed");
    }));

    const cache = new PersistentCache<string>();
    const pending = cache.set("video", "payload").catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(200);

    const error = await pending;
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("cache write failed");
  });
});
