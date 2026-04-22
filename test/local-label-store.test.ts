import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalVideoLabelStore } from "../src/core/local-label-store";
import { LOCAL_LABEL_STORAGE_KEY } from "../src/constants";

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

  it("lists records from newest to oldest", async () => {
    vi.stubGlobal(
      "GM_getValue",
      vi.fn(async () => ({
        BV17x411w7KC: {
          category: "sponsor",
          source: "manual",
          confidence: 1,
          updatedAt: 1000,
          reason: "手动确认"
        },
        BV1xx411c7mD: {
          category: "selfpromo",
          source: "page-heuristic",
          confidence: 0.8,
          updatedAt: 3000
        },
        invalid: {
          category: "sponsor",
          source: "manual",
          confidence: 1,
          updatedAt: 4000
        }
      }))
    );
    vi.stubGlobal("GM_setValue", vi.fn(async () => {}));

    const store = new LocalVideoLabelStore();
    await store.load();

    expect(store.listRecords().map((record) => record.videoId)).toEqual(["BV1xx411c7mD", "BV17x411w7KC"]);
  });

  it("deletes one record without touching other records", async () => {
    let payload = {
      BV17x411w7KC: {
        category: "sponsor",
        source: "manual",
        confidence: 1,
        updatedAt: 1000
      },
      BV1xx411c7mD: {
        category: "selfpromo",
        source: "page-heuristic",
        confidence: 0.8,
        updatedAt: 3000
      }
    };
    vi.stubGlobal("GM_getValue", vi.fn(async () => payload));
    vi.stubGlobal(
      "GM_setValue",
      vi.fn(async (key, value) => {
        expect(key).toBe(LOCAL_LABEL_STORAGE_KEY);
        payload = value;
      })
    );

    const store = new LocalVideoLabelStore();
    await store.load();
    await store.deleteRecord("BV17x411w7KC");

    expect(store.listRecords().map((record) => record.videoId)).toEqual(["BV1xx411c7mD"]);
    expect(payload).not.toHaveProperty("BV17x411w7KC");
    expect(payload).toHaveProperty("BV1xx411c7mD");
  });

  it("clears all records", async () => {
    let payload = {
      BV17x411w7KC: {
        category: "sponsor",
        source: "manual",
        confidence: 1,
        updatedAt: 1000
      }
    };
    vi.stubGlobal("GM_getValue", vi.fn(async () => payload));
    vi.stubGlobal(
      "GM_setValue",
      vi.fn(async (_key, value) => {
        payload = value;
      })
    );

    const store = new LocalVideoLabelStore();
    await store.load();
    await store.clearRecords();

    expect(store.listRecords()).toEqual([]);
    expect(payload).toEqual({});
  });

  it("rolls deletes and clears back when persistence fails", async () => {
    vi.stubGlobal(
      "GM_getValue",
      vi.fn(async () => ({
        BV17x411w7KC: {
          category: "sponsor",
          source: "manual",
          confidence: 1,
          updatedAt: 1000
        }
      }))
    );
    vi.stubGlobal("GM_setValue", vi.fn(async () => {
      throw new Error("local label save failed");
    }));

    const store = new LocalVideoLabelStore();
    await store.load();

    await expect(store.deleteRecord("BV17x411w7KC")).rejects.toThrow("local label save failed");
    expect(store.listRecords()).toHaveLength(1);

    await expect(store.clearRecords()).rejects.toThrow("local label save failed");
    expect(store.listRecords()).toHaveLength(1);
  });

  it("keeps legacy payloads compatible through normalization defaults", async () => {
    vi.stubGlobal(
      "GM_getValue",
      vi.fn(async () => ({
        BV17x411w7KC: {
          category: "sponsor",
          source: "manual",
          updatedAt: 0
        },
        BV1xx411c7mD: {
          category: null,
          source: "manual-dismiss",
          confidence: 9,
          updatedAt: 2000
        }
      }))
    );
    vi.stubGlobal("GM_setValue", vi.fn(async () => {}));

    const store = new LocalVideoLabelStore();
    await store.load();

    const records = store.listRecords();
    expect(records).toHaveLength(2);
    expect(records.find((record) => record.videoId === "BV17x411w7KC")?.confidence).toBe(0.5);
    expect(records.find((record) => record.videoId === "BV1xx411c7mD")?.confidence).toBe(1);
    expect(store.isDismissed("BV1xx411c7mD")).toBe(true);
  });
});
