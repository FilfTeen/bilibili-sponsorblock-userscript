import { beforeEach, describe, expect, it, vi } from "vitest";
import { gmXmlHttpRequest } from "../src/platform/gm";

describe("gm transport", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("prefers fetch when CORS is available", async () => {
    const fetchMock = vi.fn(async () => ({
      status: 200,
      ok: true,
      text: async () => "fetch-ok"
    }));

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("GM_xmlhttpRequest", vi.fn());

    const response = await gmXmlHttpRequest({
      method: "GET",
      url: "https://example.com/api",
      headers: {
        Accept: "application/json"
      },
      timeout: 5000
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(response).toEqual({
      responseText: "fetch-ok",
      status: 200,
      ok: true
    });
  });

  it("falls back to GM_xmlhttpRequest when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("fetch failed");
    }));

    const gmRequestMock = vi.fn((details: {
      onload: (response: { responseText: string; status: number }) => void;
    }) => {
      details.onload({
        responseText: "gm-ok",
        status: 200
      });
    });

    vi.stubGlobal("GM_xmlhttpRequest", gmRequestMock);

    const response = await gmXmlHttpRequest({
      method: "GET",
      url: "https://example.com/api",
      timeout: 5000
    });

    expect(gmRequestMock).toHaveBeenCalledOnce();
    expect(response).toEqual({
      responseText: "gm-ok",
      status: 200,
      ok: true
    });
  });
});
