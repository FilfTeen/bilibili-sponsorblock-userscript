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

  it("submits votes through the SponsorBlock API with duplicate-vote handling", async () => {
    vi.stubGlobal("GM_getValue", vi.fn(async () => "user-123"));
    vi.stubGlobal("GM_setValue", vi.fn());
    const gmRequest = vi.fn((options: { url: string; onload?: (response: { status: number; responseText: string }) => void }) => {
      options.onload?.({ status: 405, responseText: "duplicate vote" });
    });
    vi.stubGlobal("GM_xmlhttpRequest", gmRequest);

    const { client } = createClient();
    const response = await client.vote("segment-1", 0, DEFAULT_CONFIG as StoredConfig);

    expect(response.successType).toBe(0);
    expect(response.statusCode).toBe(405);
    expect(gmRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: expect.stringContaining("/api/voteOnSponsorTime?UUID=segment-1&userID=user-123&type=0"),
        headers: expect.objectContaining({
          "x-ext-version": expect.any(String)
        })
      })
    );
  });

  it("does not treat upstream rate limiting as a successful vote", async () => {
    vi.stubGlobal("GM_getValue", vi.fn(async () => "user-123"));
    vi.stubGlobal("GM_setValue", vi.fn());
    vi.stubGlobal("GM_xmlhttpRequest", (options: { onload?: (response: { status: number; responseText: string }) => void }) => {
      options.onload?.({ status: 429, responseText: "rate limited" });
    });

    const { client } = createClient();
    const response = await client.vote("segment-1", 1, DEFAULT_CONFIG as StoredConfig);

    expect(response.successType).toBe(-1);
    expect(response.statusCode).toBe(429);
    expect(response.responseText).toBe("rate limited");
  });

  it("sends the upstream extension version header on segment reads", async () => {
    const gmRequest = vi.fn((options: { onload?: (response: { status: number; responseText: string }) => void }) => {
      options.onload?.({
        status: 404,
        responseText: ""
      });
    });
    vi.stubGlobal("GM_xmlhttpRequest", gmRequest);

    const { client } = createClient();
    await client.getSegments(video, DEFAULT_CONFIG as StoredConfig);

    expect(gmRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/json",
          "x-ext-version": expect.any(String)
        })
      })
    );
  });
});
