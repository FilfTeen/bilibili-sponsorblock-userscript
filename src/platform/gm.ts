import type { FetchResponse } from "../types";

function assertFunction<T extends (...args: never[]) => unknown>(name: string): T {
  const fn = Reflect.get(globalThis, name);
  if (typeof fn !== "function") {
    throw new Error(`${name} is not available in this environment`);
  }
  return fn as T;
}

export async function gmGetValue<T>(key: string, defaultValue: T): Promise<T> {
  const fn = assertFunction<typeof GM_getValue>("GM_getValue");
  return fn(key, defaultValue);
}

export async function gmSetValue<T>(key: string, value: T): Promise<void> {
  const fn = assertFunction<typeof GM_setValue>("GM_setValue");
  fn(key, value);
}

export async function gmDeleteValue(key: string): Promise<void> {
  const fn = assertFunction<typeof GM_deleteValue>("GM_deleteValue");
  fn(key);
}

export function gmAddStyle(css: string): void {
  const fn = assertFunction<typeof GM_addStyle>("GM_addStyle");
  fn(css);
}

export function gmRegisterMenuCommand(label: string, handler: () => void): void {
  const fn = Reflect.get(globalThis, "GM_registerMenuCommand");
  if (typeof fn === "function") {
    (fn as typeof GM_registerMenuCommand)(label, handler);
  }
}

export async function gmXmlHttpRequest(options: {
  method: string;
  url: string;
  data?: string;
  headers?: Record<string, string>;
  timeout?: number;
}): Promise<FetchResponse> {
  const fn = assertFunction<typeof GM_xmlhttpRequest>("GM_xmlhttpRequest");

  return new Promise<FetchResponse>((resolve, reject) => {
    fn({
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
}
