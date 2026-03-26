import { describe, expect, it } from "vitest";
import { extractBvidFromUrl, extractPageFromUrl, resolveVideoContext } from "../src/utils/video-context";

describe("video context resolution", () => {
  it("extracts bvid from standard URLs", () => {
    expect(extractBvidFromUrl("https://www.bilibili.com/video/BV1xx411c7mD?p=2")).toBe("BV1xx411c7mD");
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
});
