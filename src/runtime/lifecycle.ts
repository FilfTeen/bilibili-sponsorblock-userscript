type RuntimeLifecycle = {
  start: () => Promise<void>;
  stop: () => void;
};

export function createRuntimeLifecycle(startup: () => Promise<void>, shutdown: () => void): RuntimeLifecycle {
  let started = false;
  let starting: Promise<void> | null = null;

  async function start(): Promise<void> {
    if (started) {
      return;
    }

    if (starting) {
      return starting;
    }

    starting = (async () => {
      started = true;
      try {
        await startup();
      } catch (error) {
        started = false;
        shutdown();
        throw error;
      } finally {
        starting = null;
      }
    })();

    return starting;
  }

  function stop(): void {
    if (!started && !starting) {
      return;
    }

    started = false;
    starting = null;
    shutdown();
  }

  window.addEventListener("pageshow", () => {
    void start();
  });
  window.addEventListener("pagehide", () => {
    stop();
  });

  return {
    start,
    stop
  };
}
