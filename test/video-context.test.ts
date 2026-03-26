import { describe, expect, it } from "vitest";
import { avidToBvid } from "../src/utils/bvid";
import { extractAidFromUrl, extractBvidFromUrl, extractPageFromUrl, resolveVideoContext } from "../src/utils/video-context";

describe("video context resolution", () => {
  it("extracts bvid from standard URLs", () => {
    expect(extractBvidFromUrl("https://www.bilibili.com/video/BV1xx411c7mD?p=2")).toBe("BV1xx411c7mD");
  });

  it("extracts aid from av style URLs", () => {
    expect(extractAidFromUrl("https://www.bilibili.com/video/av170001")).toBe(170001);
    expect(extractAidFromUrl("https://www.bilibili.com/list/ml123?avid=170001")).toBe(170001);
  });

  it("extracts page numbers from query params", () => {
    expect(extractPageFromUrl("https://www.bilibili.com/video/BV1xx411c7mD?p=3")).toBe(3);
    expect(extractPageFromUrl("https://www.bilibili.com/video/BV1xx411c7mD")).toBe(1);
  });

  it("normalizes numeric cid values from page data", () => {
    const context = resolveVideoContext({
      url: "https://www.bilibili.com/video/BV1xx411c7mD?p=2",
      initialState: {
        videoData: {
          bvid: "BV1xx411c7mD",
          pages: [
            { page: 1, cid: 11 },
            { page: 2, cid: 22 }
          ]
        }
      },
      playerManifest: null,
      playInfo: null
    });

    expect(context?.cid).toBe("22");
  });

  it("converts aid-only snapshots into bvid context", () => {
    const context = resolveVideoContext({
      url: "https://www.bilibili.com/video/av170001?p=1",
      initialState: {
        aid: 170001,
        cid: 2468
      },
      playerManifest: null,
      playInfo: null
    });

    expect(context?.bvid).toBe(avidToBvid(170001));
    expect(context?.cid).toBe("2468");
  });

  it("resolves bangumi metadata from epInfo", () => {
    const context = resolveVideoContext({
      url: "https://www.bilibili.com/bangumi/play/ep123456",
      initialState: {
        epInfo: {
          bvid: "BV1xx411c7mD",
          cid: 9988,
          title: "第 1 话"
        }
      },
      playerManifest: null,
      playInfo: null
    });

    expect(context).toEqual({
      bvid: "BV1xx411c7mD",
      cid: "9988",
      page: 1,
      title: "第 1 话",
      href: "https://www.bilibili.com/bangumi/play/ep123456"
    });
  });

  it("supports medialist URLs with query bvid", () => {
    const context = resolveVideoContext({
      url: "https://www.bilibili.com/medialist/play/ml123?bvid=BV1xx411c7mD&cid=77",
      initialState: null,
      playerManifest: null,
      playInfo: null
    });

    expect(context?.bvid).toBe("BV1xx411c7mD");
    expect(context?.cid).toBe("77");
  });
});
