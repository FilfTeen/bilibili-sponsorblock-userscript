import { describe, expect, it } from "vitest";
import { styles } from "../src/ui/styles";

describe("shared glass contexts", () => {
  it("preserves the overlay glass blur for thumbnail labels", () => {
    expect(styles).toMatch(
      /\.sponsorThumbnailLabel\[data-transparent="true"\]\[data-glass-context="overlay"\]::after[\s\S]*backdrop-filter: blur\(4px\) saturate\(162%\) brightness\(1\.04\);/
    );
  });

  it("keeps the surface title pill on the shared frosted glass material", () => {
    expect(styles).toContain('.bsb-tm-title-pill-wrap[data-transparent="true"][data-glass-context="surface"] .bsb-tm-title-pill');
    expect(styles).toContain("border: 1px solid color-mix(in srgb, var(--bsb-category-accent, #2f9e72) 16%, rgba(255, 255, 255, 0.12));");
    expect(styles).toContain("inset 0 1px 0 rgba(255, 255, 255, 0.16)");
    expect(styles).toContain("backdrop-filter: none;");
  });

  it("uses the original category accent for the surface title pill tint", () => {
    expect(styles).toMatch(
      /\.bsb-tm-title-pill-wrap\[data-transparent="true"\]\[data-glass-context="surface"\] \.bsb-tm-title-pill::before[\s\S]*radial-gradient\(circle at 18% 8%,[\s\S]*var\(--bsb-category-accent, #2f9e72\) 22%, rgba\(255, 255, 255, 0\.26\)/
    );
  });

  it("does not force displayAccent-driven tinting onto the surface title pill", () => {
    expect(styles).toMatch(
      /\.bsb-tm-title-pill-wrap\[data-transparent="true"\]\[data-glass-context="surface"\] \.bsb-tm-title-pill::before[\s\S]*var\(--bsb-category-accent, #2f9e72\)[\s\S]*mix-blend-mode: screen;/
    );
  });

  it("removes the extra title-edge highlight layer in transparent surface mode", () => {
    expect(styles).toMatch(
      /\.bsb-tm-title-pill-wrap\[data-transparent="true"\]\[data-glass-context="surface"\] \.bsb-tm-title-pill::after \{[\s\S]*content: none;/
    );
  });

  it("keeps title badge accessories on a non-shrinking single-line layout contract", () => {
    expect(styles).toMatch(
      /\.bsb-tm-title-accessories \{[\s\S]*flex-shrink: 0;[\s\S]*float: left;[\s\S]*inline-size: max-content;[\s\S]*white-space: nowrap;/
    );
    expect(styles).toMatch(
      /\.bsb-tm-title-pill-wrap \{[\s\S]*flex-shrink: 0;[\s\S]*inline-size: max-content;[\s\S]*min-width: max-content;[\s\S]*white-space: nowrap;/
    );
    expect(styles).toMatch(
      /\.bsb-tm-title-pill \{[\s\S]*flex-shrink: 0;[\s\S]*inline-size: max-content;[\s\S]*min-width: max-content;[\s\S]*white-space: nowrap;/
    );
  });

  it("prevents title badge label text from collapsing into vertical wrapping", () => {
    expect(styles).toMatch(
      /\.bsb-tm-title-pill-label \{[\s\S]*overflow-wrap: normal;[\s\S]*white-space: nowrap;[\s\S]*word-break: keep-all;/
    );
  });

  it("uses optical dot sizing so default thumbnail labels read like the right-rail circle", () => {
    expect(styles).toMatch(
      /\.sponsorThumbnailLabel \{[\s\S]*--bsb-thumbnail-dot-size: 5px;[\s\S]*--bsb-thumbnail-dot-stroke: 1\.5px;[\s\S]*--bsb-thumbnail-dot-left: 10px;/
    );
    expect(styles).toMatch(
      /\.sponsorThumbnailLabel::before \{[\s\S]*top: 50%;[\s\S]*left: var\(--bsb-thumbnail-dot-left\);[\s\S]*transform: translateY\(-50%\);/
    );
    expect(styles).toMatch(
      /\.sponsorThumbnailLabel\[data-placement="corner"\] \{[\s\S]*--bsb-thumbnail-dot-size: 4px;[\s\S]*--bsb-thumbnail-dot-left: 7px;/
    );
  });

  it("removes the edge highlight treatment from default overlay thumbnail pills only", () => {
    expect(styles).toContain('.sponsorThumbnailLabel[data-placement="default"][data-transparent="true"][data-glass-context="overlay"] {');
    expect(styles).toContain("border-color: color-mix(in srgb, var(--category-accent, #ffffff) 20%, rgba(255, 255, 255, 0.12));");
    expect(styles).toContain("inset 0 1px 0 rgba(255, 255, 255, 0.18)");
    expect(styles).toContain("0 6px 14px rgba(15, 23, 42, 0.08)");
    expect(styles).toMatch(
      /\.sponsorThumbnailLabel\[data-placement="default"\]\[data-transparent="true"\]\[data-glass-context="overlay"\]::after \{[\s\S]*radial-gradient\(circle at 18% 12%,[\s\S]*mix-blend-mode: normal;/
    );
    expect(styles).toMatch(
      /\.sponsorThumbnailLabel\[data-placement="corner"\]\[data-transparent="true"\]\[data-glass-context="overlay"\] \{[\s\S]*inset 0 1px 0 rgba\(255, 255, 255, 0\.24\)/
    );
  });
});
