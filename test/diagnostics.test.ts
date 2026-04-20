import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearDiagnostics,
  formatDiagnosticReport,
  getDiagnosticEvents,
  isDiagnosticDebugEnabled,
  reportDiagnostic,
  sanitizeDiagnosticDetail,
  setDiagnosticDebugEnabled,
  subscribeDiagnostics
} from "../src/utils/diagnostics";

afterEach(() => {
  setDiagnosticDebugEnabled(false);
  clearDiagnostics();
  vi.restoreAllMocks();
});

describe("developer diagnostics", () => {
  it("redacts sensitive fields and strips markup from details", () => {
    const detail = sanitizeDiagnosticDetail({
      userId: "secret-user-id",
      commentText: "这是一条评论原文",
      nested: {
        authorization: "Bearer secret-token",
        html: "<img src=x onerror=alert(1)>保存失败"
      }
    });

    expect(detail).toContain("[redacted]");
    expect(detail).toContain("保存失败");
    expect(detail).not.toContain("secret-user-id");
    expect(detail).not.toContain("secret-token");
    expect(detail).not.toContain("评论原文");
    expect(detail).not.toContain("<img");
    expect(detail).not.toContain("onerror");
  });

  it("keeps a bounded event buffer and notifies subscribers", () => {
    const seen: number[] = [];
    const unsubscribe = subscribeDiagnostics((events) => {
      seen.push(events.length);
    });

    for (let index = 0; index < 45; index += 1) {
      reportDiagnostic({
        severity: "warn",
        area: "storage",
        message: `issue-${index}`,
        detail: { index }
      });
    }

    unsubscribe();

    const events = getDiagnosticEvents();
    expect(events).toHaveLength(40);
    expect(events[0]?.message).toBe("issue-5");
    expect(events[39]?.message).toBe("issue-44");
    expect(seen.at(-1)).toBe(40);
  });

  it("formats a sanitized copyable report", () => {
    setDiagnosticDebugEnabled(true);
    reportDiagnostic({
      severity: "error",
      area: "upstream",
      message: "Vote failed",
      detail: {
        userId: "secret-user-id",
        status: 429
      }
    });

    const report = formatDiagnosticReport();

    expect(report).toContain("Bilibili QoL Core diagnostics");
    expect(report).toContain("Debug: enabled");
    expect(report).toContain("[error/upstream] Vote failed");
    expect(report).toContain("429");
    expect(report).not.toContain("secret-user-id");
  });

  it("toggles diagnostic debug mode without requiring console commands", () => {
    expect(isDiagnosticDebugEnabled()).toBe(false);

    const enabled = setDiagnosticDebugEnabled(true);

    expect(enabled).toBe(true);
    expect(isDiagnosticDebugEnabled()).toBe(true);

    const disabled = setDiagnosticDebugEnabled(false);

    expect(disabled).toBe(false);
    expect(isDiagnosticDebugEnabled()).toBe(false);
  });
});
