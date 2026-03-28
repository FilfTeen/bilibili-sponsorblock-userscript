import { describe, expect, it, vi } from "vitest";
import { gmXmlHttpRequest } from "../src/platform/gm";

describe("gmXmlHttpRequest", () => {
  it("prefers the granted Tampermonkey request API over window.fetch", async () => {
    const fetchSpy = vi.fn(async () => {
      throw new Error("fetch should not be used when GM_xmlhttpRequest exists");
    });
    vi.stubGlobal("fetch", fetchSpy);

    const gmSpy = vi.fn((options: { onload?: (response: { status: number; responseText: string }) => void }) => {
      options.onload?.({
        status: 200,
        responseText: "{\"ok\":true}"
      });
    });
    vi.stubGlobal("GM_xmlhttpRequest", gmSpy);

    const response = await gmXmlHttpRequest({
      method: "POST",
      url: "https://www.bsbsb.top/api/voteOnSponsorTime?UUID=test"
    });

    expect(response.status).toBe(200);
    expect(gmSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
