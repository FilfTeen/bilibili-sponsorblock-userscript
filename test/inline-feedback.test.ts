import { describe, expect, it } from "vitest";
import { createInlineBadge, inlineFeedbackStyles } from "../src/ui/inline-feedback";

describe("inline feedback badge appearance", () => {
  it("defaults to solid appearance", () => {
    const badge = createInlineBadge("data-test-badge", "测试标签", "info", "inline");
    expect(badge.dataset.appearance).toBe("solid");
  });

  it("can render glass appearance explicitly", () => {
    const badge = createInlineBadge("data-test-badge", "测试标签", "warning", "stack", "#60a5fa", "glass");
    expect(badge.dataset.appearance).toBe("glass");
    expect(badge.style.getPropertyValue("--bsb-inline-accent")).toBe("#60a5fa");
  });

  it("keeps glass inline chips clear instead of stacking blur on the host", () => {
    expect(inlineFeedbackStyles).toContain('.bsb-tm-inline-chip[data-appearance="glass"]');
    expect(inlineFeedbackStyles).toContain("backdrop-filter: none;");
    expect(inlineFeedbackStyles).toContain("backdrop-filter: saturate(144%) brightness(1.03);");
  });
});
