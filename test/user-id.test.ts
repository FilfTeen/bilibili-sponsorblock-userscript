import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureUserId } from "../src/core/user-id";

describe("ensureUserId", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("preserves an existing legacy UUID-style user id", async () => {
    vi.stubGlobal("GM_getValue", vi.fn(async () => "550e8400-e29b-41d4-a716-446655440000"));
    const setValue = vi.fn(async () => {});
    vi.stubGlobal("GM_setValue", setValue);

    await expect(ensureUserId()).resolves.toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(setValue).not.toHaveBeenCalled();
  });

  it("creates new user ids in the upstream-compatible 36-character base62 shape", async () => {
    vi.stubGlobal("GM_getValue", vi.fn(async () => null));
    const setValue = vi.fn(async () => {});
    vi.stubGlobal("GM_setValue", setValue);
    vi.stubGlobal("crypto", {
      getRandomValues: (array: Uint8Array) => {
        array.fill(61);
        return array;
      }
    });

    const created = await ensureUserId();

    expect(created).toMatch(/^[A-Za-z0-9]{36}$/u);
    expect(created).toHaveLength(36);
    expect(setValue).toHaveBeenCalledWith("bsb_tm_user_id_v1", created);
  });
});
