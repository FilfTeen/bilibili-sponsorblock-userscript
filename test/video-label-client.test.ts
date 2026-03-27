import { beforeEach, describe, expect, it, vi } from "vitest";
import { VideoLabelClient } from "../src/api/video-label-client";
import { DEFAULT_CONFIG } from "../src/constants";
import type { FetchResponse, StoredConfig } from "../src/types";

type CacheLike = {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

function createClient(cache?: Partial<CacheLike>) {
  const fakeCache = {
    get: vi.fn<() => Promise<FetchResponse | undefined>>().mockResolvedValue(undefined),
    set: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    ...cache
  };

  return {
    client: new VideoLabelClient(fakeCache as never),
    cache: fakeCache
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.stubGlobal("fetch", vi.fn(async () => {
    throw new Error("disable fetch in video-label-client tests");
  }));
});

describe("video label client", () => {
  it("returns null on 404 and caches the response", async () => {
    vi.stubGlobal("GM_xmlhttpRequest", (options: { onload?: (response: { status: number; responseText: string }) => void }) => {
      options.onload?.({ status: 404, responseText: "" });
    });

    const { client, cache } = createClient();
    const category = await client.getVideoLabel("BV17x411w7KC", DEFAULT_CONFIG as StoredConfig);

    expect(category).toBeNull();
    expect(cache.set).toHaveBeenCalled();
  });

  it("reads the first category from the label payload", async () => {
    vi.stubGlobal("GM_xmlhttpRequest", (options: { onload?: (response: { status: number; responseText: string }) => void }) => {
      options.onload?.({
        status: 200,
        responseText: JSON.stringify([
          {
            videoID: "BV17x411w7KC",
            segments: [{ category: "sponsor" }]
          }
        ])
      });
    });

    const { client } = createClient();
    const category = await client.getVideoLabel("BV17x411w7KC", DEFAULT_CONFIG as StoredConfig);

    expect(category).toBe("sponsor");
  });
});
