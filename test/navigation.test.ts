import { afterEach, describe, expect, it, vi } from "vitest";
import { observeUrlChanges } from "../src/utils/navigation";

describe("navigation observer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
  });

  it("emits when pushState changes the URL", async () => {
    const listener = vi.fn();
    const stop = observeUrlChanges(listener);

    try {
      window.history.pushState({}, "", "/video/BV1xx411c7mD");
      await Promise.resolve();

      expect(listener).toHaveBeenCalledWith(
        "https://www.bilibili.com/video/BV1xx411c7mD",
        "https://www.bilibili.com/"
      );
    } finally {
      stop();
    }
  });

  it("stops emitting after unsubscribe", async () => {
    const listener = vi.fn();
    const stop = observeUrlChanges(listener);
    stop();

    window.history.pushState({}, "", "/list/ml123?bvid=BV1xx411c7mD");
    await Promise.resolve();

    expect(listener).not.toHaveBeenCalled();
  });
});
