import { PRODUCT_NAME, SCRIPT_VERSION } from "../constants";
import { getMbgaDecisionRecords, type MbgaDecisionRecord } from "../features/mbga/core";
import {
  getNativeRequestGuardSnapshot,
  type NativeRequestGuardRecord,
  type NativeRequestGuardSnapshot
} from "../platform/native-request-guard";

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

function countByAction(records: Array<{ action: string }>): string {
  if (records.length === 0) {
    return "empty";
  }
  const counts = new Map<string, number>();
  for (const record of records) {
    counts.set(record.action, (counts.get(record.action) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([action, count]) => `${action}=${count}`)
    .join(", ");
}

function summarizeMbgaRecords(records: MbgaDecisionRecord[]): string[] {
  if (records.length === 0) {
    return ["MBGA: empty"];
  }
  const recent = records.slice(-10);
  const recentRuleIds = [...new Set(recent.map((record) => record.ruleId))].join(", ") || "none";
  const lines = [
    `MBGA: total=${records.length}`,
    `MBGA actions: ${countByAction(records)}`,
    `MBGA recent rules: ${recentRuleIds}`,
    "MBGA samples:"
  ];
  for (const record of recent) {
    lines.push(
      `  - ${new Date(record.at).toISOString()} ${record.action} ${record.ruleId} ${sanitizeDiagnosticPageUrl(
        record.url
      )} (${cleanString(record.reason)} / ${cleanString(record.source)})`
    );
  }
  return lines;
}

function summarizeNativeGuard(snapshot: NativeRequestGuardSnapshot | null): string[] {
  if (!snapshot) {
    return ["Native guard: unavailable"];
  }
  const records: NativeRequestGuardRecord[] = snapshot.records ?? [];
  const lines = [
    `Native guard: enabled=${snapshot.enabled}, supportedPage=${snapshot.supportedPage}, compactHeaderReady=${snapshot.compactHeaderReady}, reason=${cleanString(
      snapshot.reason
    )}`,
    `Native guard actions: ${countByAction(records)}`
  ];
  if (records.length === 0) {
    lines.push("Native guard samples: empty");
    return lines;
  }
  lines.push("Native guard samples:");
  for (const record of records.slice(-10)) {
    lines.push(
      `  - ${new Date(record.time).toISOString()} ${record.action} ${sanitizeDiagnosticPageUrl(record.url)} (${cleanString(
        record.reason
      )})`
    );
  }
  return lines;
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
  lines.push(...summarizeMbgaRecords(getMbgaDecisionRecords()));
  lines.push(...summarizeNativeGuard(getNativeRequestGuardSnapshot()));
  for (const event of diagnosticEvents) {
    lines.push(
      `- ${new Date(event.at).toISOString()} [${event.severity}/${event.area}] ${event.message}${
        event.detail ? ` | ${event.detail}` : ""
      }`
    );
  }
  return lines.join("\n");
}
