import { PRODUCT_NAME, SCRIPT_VERSION } from "../constants";

export type DiagnosticSeverity = "info" | "warn" | "error";
export type DiagnosticArea = "storage" | "network" | "ui" | "lifecycle" | "upstream" | "runtime";

export type DiagnosticEvent = {
  id: string;
  at: number;
  severity: DiagnosticSeverity;
  area: DiagnosticArea;
  message: string;
  detail?: string;
};

type DiagnosticInput = {
  severity: DiagnosticSeverity;
  area: DiagnosticArea;
  message: string;
  detail?: unknown;
};

const MAX_DIAGNOSTIC_EVENTS = 40;
const SENSITIVE_KEY_PATTERN = /user.?id|token|cookie|authorization|comment.?text|reply.?text|raw.?text|feedback.?token/iu;
const diagnosticEvents: DiagnosticEvent[] = [];
const listeners = new Set<(events: DiagnosticEvent[]) => void>();
let nextDiagnosticId = 1;
let diagnosticDebugOverride: boolean | null = null;

function isNodeRuntime(): boolean {
  return typeof process !== "undefined" && process.release?.name === "node";
}

function cleanString(input: string): string {
  return input
    .replace(/<[^>]*>/gu, "")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 1200);
}

export function sanitizeDiagnosticPageUrl(input: string): string {
  try {
    const url = new URL(input);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("unsupported diagnostic URL protocol");
    }
    return cleanString(`${url.origin}${url.pathname}`);
  } catch (_error) {
    const withoutQueryOrHash = input.split(/[?#]/u, 1)[0] ?? "";
    return cleanString(withoutQueryOrHash);
  }
}

function sanitizeValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return "[redacted]";
  }
  if (value instanceof Error) {
    return `${value.name}: ${cleanString(value.message)}`;
  }
  if (typeof value === "string") {
    return cleanString(value);
  }
  return value;
}

export function sanitizeDiagnosticDetail(input: unknown): string | undefined {
  if (input === null || typeof input === "undefined") {
    return undefined;
  }
  if (input instanceof Error) {
    return `${input.name}: ${cleanString(input.message)}`;
  }
  if (typeof input === "string") {
    return cleanString(input);
  }

  try {
    return cleanString(
      JSON.stringify(input, (key, value) => sanitizeValue(key, value))
    );
  } catch (_error) {
    return "[unserializable diagnostic detail]";
  }
}

export function getDiagnosticEvents(): DiagnosticEvent[] {
  return diagnosticEvents.map((event) => ({ ...event }));
}

function notifyDiagnosticsChanged(): void {
  const snapshot = getDiagnosticEvents();
  for (const listener of listeners) {
    listener(snapshot);
  }
}

export function subscribeDiagnostics(listener: (events: DiagnosticEvent[]) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearDiagnostics(): void {
  diagnosticEvents.splice(0, diagnosticEvents.length);
  notifyDiagnosticsChanged();
}

export function isDiagnosticDebugEnabled(): boolean {
  if (diagnosticDebugOverride !== null) {
    return diagnosticDebugOverride;
  }
  if (isNodeRuntime()) {
    return false;
  }

  try {
    const stored = window.localStorage.getItem("qol_core_debug");
    if (stored === "1" || stored === "true") {
      return true;
    }
  } catch (_error) {
    // localStorage can be blocked; diagnostics must remain best-effort.
  }

  try {
    const locationText = `${window.location.search}${window.location.hash}`;
    return /(?:[?&#])qol_core_debug(?:=1|=true|(?=&|$))/iu.test(locationText);
  } catch (_error) {
    return false;
  }
}

export function setDiagnosticDebugEnabled(enabled: boolean): boolean {
  diagnosticDebugOverride = enabled;
  if (!isNodeRuntime()) {
    try {
      if (enabled) {
        window.localStorage.setItem("qol_core_debug", "1");
      } else {
        window.localStorage.removeItem("qol_core_debug");
      }
    } catch (error) {
      reportDiagnostic({
        severity: "warn",
        area: "storage",
        message: "诊断调试开关持久化失败，仅在当前页面生效",
        detail: error
      });
    }
  }
  return isDiagnosticDebugEnabled();
}

export function reportDiagnostic(input: DiagnosticInput): DiagnosticEvent {
  const event: DiagnosticEvent = {
    id: `diag-${nextDiagnosticId}`,
    at: Date.now(),
    severity: input.severity,
    area: input.area,
    message: cleanString(input.message),
    detail: sanitizeDiagnosticDetail(input.detail)
  };
  nextDiagnosticId += 1;
  diagnosticEvents.push(event);
  while (diagnosticEvents.length > MAX_DIAGNOSTIC_EVENTS) {
    diagnosticEvents.shift();
  }
  notifyDiagnosticsChanged();

  const prefix = `[${PRODUCT_NAME}] ${event.message}`;
  if (event.severity === "error") {
    console.error(prefix, event.detail ?? "");
  } else if (isDiagnosticDebugEnabled()) {
    console.warn(prefix, event.detail ?? "");
  }
  return { ...event };
}

export function formatDiagnosticReport(): string {
  const lines = [
    `${PRODUCT_NAME} diagnostics`,
    `Version: ${SCRIPT_VERSION}`,
    `Generated: ${new Date().toISOString()}`,
    `Debug: ${isDiagnosticDebugEnabled() ? "enabled" : "disabled"}`,
    `Page: ${sanitizeDiagnosticPageUrl(window.location.href)}`,
    `UserAgent: ${cleanString(navigator.userAgent)}`,
    `Events: ${diagnosticEvents.length}`
  ];
  for (const event of diagnosticEvents) {
    lines.push(
      `- ${new Date(event.at).toISOString()} [${event.severity}/${event.area}] ${event.message}${
        event.detail ? ` | ${event.detail}` : ""
      }`
    );
  }
  return lines.join("\n");
}
