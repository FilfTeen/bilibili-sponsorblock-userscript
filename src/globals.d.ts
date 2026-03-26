declare const __BUILD_REPOSITORY_URL__: string;
declare const __BUILD_VERSION__: string;

declare function GM_getValue<T>(key: string, defaultValue?: T): T;
declare function GM_setValue<T>(key: string, value: T): void;
declare function GM_deleteValue(key: string): void;
declare function GM_addStyle(css: string): void;
declare function GM_registerMenuCommand(caption: string, onClick: () => void): void;

declare function GM_xmlhttpRequest(details: {
  method: string;
  url: string;
  data?: string;
  headers?: Record<string, string>;
  timeout?: number;
  onload: (response: {
    status: number;
    responseText: string;
  }) => void;
  onerror: () => void;
  ontimeout?: () => void;
}): void;
