import { BRIDGE_FLAG, REQUEST_TIMEOUT_MS } from "../constants";
import type { PageSnapshot } from "../types";

const bridgeToken = `bsb-tm-${Math.random().toString(36).slice(2)}`;
const REQUEST_EVENT = `bsb-tm:request:${bridgeToken}`;
const RESPONSE_EVENT = `bsb-tm:response:${bridgeToken}`;
let bridgeInjected = false;

function buildBridgeSource(): string {
  return `
(() => {
  if (window[${JSON.stringify(BRIDGE_FLAG)}]) {
    return;
  }

  window[${JSON.stringify(BRIDGE_FLAG)}] = true;
  // Use a document-scoped event channel so the userscript only talks to the bridge it created.
  document.addEventListener(${JSON.stringify(REQUEST_EVENT)}, (event) => {
    const data = event.detail;
    if (!data || typeof data.id !== "string") {
      return;
    }

    let initialState = null;
    let playInfo = null;
    let playerManifest = null;

    try {
      initialState = typeof window.__INITIAL_STATE__ === "undefined" ? null : window.__INITIAL_STATE__;
    } catch (_error) {}

    try {
      playInfo = typeof window.__playinfo__ === "undefined" ? null : window.__playinfo__;
    } catch (_error) {}

    try {
      const player = window.player;
      const manifest = player && typeof player.getManifest === "function" ? player.getManifest() : null;
      if (manifest && typeof manifest === "object") {
        playerManifest = {
          aid: typeof manifest.aid === "undefined" ? null : manifest.aid,
          cid: typeof manifest.cid === "undefined" ? null : manifest.cid,
          bvid: typeof manifest.bvid === "undefined" ? null : manifest.bvid,
          p: typeof manifest.p === "undefined" ? null : manifest.p
        };
      }
    } catch (_error) {}

    document.dispatchEvent(new CustomEvent(${JSON.stringify(RESPONSE_EVENT)}, {
      detail: {
        id: data.id,
        payload: {
          url: window.location.href,
          initialState,
          playInfo,
          playerManifest
        }
      }
    }));
  });
})();`;
}

export function ensurePageBridge(): void {
  if (bridgeInjected) {
    return;
  }

  // Inject once per page lifetime; subsequent refreshes only reuse the event channel.
  const script = document.createElement("script");
  script.id = "bsb-tm-page-bridge";
  script.textContent = buildBridgeSource();
  (document.head || document.documentElement).appendChild(script);
  script.remove();
  bridgeInjected = true;
}

export async function requestPageSnapshot(): Promise<PageSnapshot | null> {
  ensurePageBridge();

  return new Promise<PageSnapshot | null>((resolve) => {
    const id = `bsb-tm-${Math.random().toString(36).slice(2)}`;
    const timeoutId = window.setTimeout(() => {
      document.removeEventListener(RESPONSE_EVENT, onMessage as EventListener);
      resolve(null);
    }, REQUEST_TIMEOUT_MS);

    function onMessage(event: Event) {
      const data = (event as CustomEvent).detail;
      if (!data || data.id !== id) {
        return;
      }
      window.clearTimeout(timeoutId);
      document.removeEventListener(RESPONSE_EVENT, onMessage as EventListener);
      resolve((typeof data.payload === "undefined" ? null : data.payload) as PageSnapshot | null);
    }

    document.addEventListener(RESPONSE_EVENT, onMessage as EventListener);
    document.dispatchEvent(
      new CustomEvent(REQUEST_EVENT, {
        detail: { id }
      })
    );
  });
}
