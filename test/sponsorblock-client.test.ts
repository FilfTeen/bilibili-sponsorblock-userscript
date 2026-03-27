import { beforeEach, describe, expect, it, vi } from "vitest";
import { SponsorBlockClient } from "../src/api/sponsorblock-client";
import type { FetchResponse, StoredConfig, VideoContext } from "../src/types";
import { DEFAULT_CONFIG } from "../src/constants";

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
    client: new SponsorBlockClient(fakeCache as never),
    cache: fakeCache
  };
}

const video: VideoContext = {
  bvid: "BV17x411w7KC",
  cid: "111",
  page: 1,
  title: "test",
  href: "https://www.bilibili.com/video/BV17x411w7KC"
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.stubGlobal("fetch", vi.fn(async () => {
    throw new Error("disable fetch in sponsorblock-client tests");
  }));
});

describe("sponsorblock client", () => {
  it("returns empty segments on 404 and caches the response", async () => {
    vi.stubGlobal("GM_xmlhttpRequest", (options: { onload?: (response: { status: number; responseText: string }) => void }) => {
      options.onload?.({ status: 404, responseText: "" });
    });

    const { client, cache } = createClient();
    const result = await client.getSegments(video, DEFAULT_CONFIG as StoredConfig);

    expect(result).toEqual([]);
    expect(cache.set).toHaveBeenCalled();
  });

  it("throws a readable error on invalid JSON", async () => {
    vi.stubGlobal("GM_xmlhttpRequest", (options: { onload?: (response: { status: number; responseText: string }) => void }) => {
      options.onload?.({ status: 200, responseText: "not-json" });
    });

    const { client } = createClient();

    await expect(client.getSegments(video, DEFAULT_CONFIG as StoredConfig)).rejects.toThrow(
      "SponsorBlock API returned invalid JSON"
    );
  });

  it("uses cached responses before issuing a network request", async () => {
    const cachedResponse: FetchResponse = {
      ok: true,
      status: 200,
      responseText: JSON.stringify([
        {
          videoID: "BV17x411w7KC",
          segments: [
            {
              UUID: "cached-segment",
              category: "sponsor",
              actionType: "skip",
              segment: [0, 10]
            }
          ]
        }
      ])
    };

    vi.stubGlobal("GM_xmlhttpRequest", vi.fn());
    const { client } = createClient({
      get: vi.fn<() => Promise<FetchResponse | undefined>>().mockResolvedValue(cachedResponse)
    });

    const result = await client.getSegments(video, DEFAULT_CONFIG as StoredConfig);

    expect(result.map((segment) => segment.UUID)).toEqual(["cached-segment"]);
    expect((globalThis.GM_xmlhttpRequest as unknown as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });
});
