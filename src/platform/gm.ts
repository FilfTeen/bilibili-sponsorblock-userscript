import type { FetchResponse } from "../types";

function resolveWindowFunction(name: string): unknown {
  if (typeof window === "undefined") {
    return undefined;
  }

  return Reflect.get(window as unknown as Record<string, unknown>, name);
}

type KnownGrantedFunction =
  | typeof GM_getValue
  | typeof GM_setValue
  | typeof GM_addStyle
  | typeof GM_registerMenuCommand
  | typeof GM_xmlhttpRequest;

function resolveGrantedFunction(name: string): KnownGrantedFunction | undefined {
  switch (name) {
    case "GM_getValue":
      if (typeof GM_getValue === "function") {
        return GM_getValue;
      }
      break;
    case "GM_setValue":
      if (typeof GM_setValue === "function") {
        return GM_setValue;
      }
      break;
    case "GM_addStyle":
      if (typeof GM_addStyle === "function") {
        return GM_addStyle;
      }
      break;
    case "GM_registerMenuCommand":
      if (typeof GM_registerMenuCommand === "function") {
        return GM_registerMenuCommand;
      }
      break;
    case "GM_xmlhttpRequest":
      if (typeof GM_xmlhttpRequest === "function") {
        return GM_xmlhttpRequest;
      }
      break;
    default:
      break;
  }

  const fallback = resolveWindowFunction(name);
  return typeof fallback === "function" ? (fallback as unknown as KnownGrantedFunction) : undefined;
}

function assertFunction<T extends (...args: never[]) => unknown>(name: string): T {
  const fn = resolveGrantedFunction(name);
  if (typeof fn !== "function") {
    throw new Error(`${name} is not available in this environment`);
  }
  return fn as unknown as T;
}

export async function gmGetValue<T>(key: string, defaultValue: T): Promise<T> {
  const fn = assertFunction<typeof GM_getValue>("GM_getValue");
  return fn(key, defaultValue);
}

export async function gmSetValue<T>(key: string, value: T): Promise<void> {
  const fn = assertFunction<typeof GM_setValue>("GM_setValue");
  fn(key, value);
}

export function gmAddStyle(css: string): void {
  const fn = assertFunction<typeof GM_addStyle>("GM_addStyle");
  fn(css);
}

export function gmRegisterMenuCommand(label: string, handler: () => void): void {
  const fn = resolveGrantedFunction("GM_registerMenuCommand");
  if (typeof fn === "function") {
    (fn as typeof GM_registerMenuCommand)(label, handler);
  }
}

async function fetchViaWindow(options: {
  method: string;
  url: string;
  data?: string;
  headers?: Record<string, string>;
  timeout?: number;
}): Promise<FetchResponse> {
  if (typeof fetch !== "function") {
    throw new Error("fetch is not available in this environment");
  }

  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId =
    controller && typeof options.timeout === "number" && Number.isFinite(options.timeout)
      ? window.setTimeout(() => controller.abort(), options.timeout)
      : null;

  try {
    const response = await fetch(options.url, {
      method: options.method,
      headers: options.headers,
      body: options.data,
      mode: "cors",
      credentials: "omit",
      signal: controller?.signal
    });

    return {
      responseText: await response.text(),
      status: response.status,
      ok: response.ok
    };
  } catch (error) {
    if (controller?.signal.aborted) {
      throw new Error(`Request timed out: ${options.method} ${options.url}`);
    }
    throw error instanceof Error ? error : new Error(`Request failed: ${options.method} ${options.url}`);
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }
}

export async function gmXmlHttpRequest(options: {
  method: string;
  url: string;
  data?: string;
  headers?: Record<string, string>;
  timeout?: number;
}): Promise<FetchResponse> {
  const fn = resolveGrantedFunction("GM_xmlhttpRequest");
  if (typeof fn === "function") {
    try {
      return await new Promise<FetchResponse>((resolve, reject) => {
        (fn as typeof GM_xmlhttpRequest)({
          ...options,
          onload: (response) => {
            resolve({
              responseText: response.responseText,
              status: response.status,
              ok: response.status >= 200 && response.status < 300
            });
          },
          onerror: () => reject(new Error(`Request failed: ${options.method} ${options.url}`)),
          ontimeout: () => reject(new Error(`Request timed out: ${options.method} ${options.url}`))
        });
      });
    } catch (error) {
      if (typeof fetch === "function") {
        return fetchViaWindow(options);
      }
      throw error;
    }
  }

  return fetchViaWindow(options);
}
