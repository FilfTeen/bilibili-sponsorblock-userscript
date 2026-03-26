import { describe, expect, it, vi } from "vitest";
import { createRuntimeLifecycle } from "../src/runtime/lifecycle";

describe("runtime lifecycle", () => {
  it("restarts after pagehide/pageshow", async () => {
    const startup = vi.fn(async () => {});
    const shutdown = vi.fn(() => {});
    const lifecycle = createRuntimeLifecycle(startup, shutdown);

    await lifecycle.start();
    expect(startup).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
    expect(shutdown).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    await Promise.resolve();

    expect(startup).toHaveBeenCalledTimes(2);
  });

  it("resets started state when startup throws", async () => {
    const startup = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(undefined);
    const shutdown = vi.fn(() => {});
    const lifecycle = createRuntimeLifecycle(startup, shutdown);

    await expect(lifecycle.start()).rejects.toThrow("boom");
    expect(shutdown).toHaveBeenCalledTimes(1);

    await lifecycle.start();
    expect(startup).toHaveBeenCalledTimes(2);
  });
});
