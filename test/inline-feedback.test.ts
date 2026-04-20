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
    expect(badge.dataset.glassContext).toBe("surface");
    expect(badge.dataset.glassVariant).toBe("dark");
    expect(badge.style.getPropertyValue("--bsb-inline-accent")).toBe("#60a5fa");
    expect(badge.querySelector(".bsb-tm-inline-chip__label")?.textContent).toBe("测试标签");
  });

  it("keeps surface inline chips on the frosted glass material", () => {
    expect(inlineFeedbackStyles).toContain('.bsb-tm-inline-chip[data-appearance="glass"][data-glass-context="surface"]');
    expect(inlineFeedbackStyles).toContain("--bsb-inline-text: #0f172a;");
    expect(inlineFeedbackStyles).toMatch(
      /\.bsb-tm-inline-chip\[data-appearance="glass"\]\[data-glass-context="surface"\]::after[\s\S]*radial-gradient\(circle at 18% 8%,[\s\S]*linear-gradient\(112deg, transparent 14%, rgba\(255, 255, 255, 0\.14\) 24%, rgba\(255, 255, 255, 0\.03\) 32%, transparent 42%\);[\s\S]*backdrop-filter: blur\(7px\) saturate\(148%\) brightness\(1\.04\);[\s\S]*mix-blend-mode: screen;/
    );
  });

  it("uses the original inline accent directly for frosted surface chips", () => {
    expect(inlineFeedbackStyles).toMatch(
      /\.bsb-tm-inline-chip\[data-appearance="glass"\]\[data-glass-context="surface"\] \{[\s\S]*var\(--bsb-inline-accent\) 16%, rgba\(255, 255, 255, 0\.12\)[\s\S]*inset 0 1px 0 rgba\(255, 255, 255, 0\.16\)/
    );
  });

  it("keeps the glass layer behind the inline chip text", () => {
    expect(inlineFeedbackStyles).toMatch(
      /\.bsb-tm-inline-chip\[data-appearance="glass"\]\[data-glass-context="surface"\]::after[\s\S]*z-index: 0;/
    );
    expect(inlineFeedbackStyles).toMatch(
      /\.bsb-tm-inline-chip__label \{[\s\S]*z-index: 1;/
    );
  });

  it("switches near-white custom colors into the light glass variant", () => {
    const badge = createInlineBadge("data-test-badge", "测试标签", "info", "inline", "#ffffff", "glass");
    expect(badge.dataset.glassContext).toBe("surface");
    expect(badge.dataset.glassVariant).toBe("light");
    expect(badge.style.getPropertyValue("--bsb-inline-accent")).toBe("#ffffff");
  });
});
