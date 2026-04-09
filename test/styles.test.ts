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
    expect(styles).toMatch(
      /\.bsb-tm-title-pill-wrap\[data-transparent="true"\]\[data-glass-context="surface"\] \.bsb-tm-title-pill \{[\s\S]*border: 1px solid color-mix\(in srgb, var\(--bsb-category-accent, #2f9e72\) 28%, rgba\(255, 255, 255, 0\.42\)\);[\s\S]*backdrop-filter: none;/
    );
  });

  it("uses the original category accent for the surface title pill tint", () => {
    expect(styles).toMatch(
      /\.bsb-tm-title-pill-wrap\[data-transparent="true"\]\[data-glass-context="surface"\] \.bsb-tm-title-pill::before[\s\S]*var\(--bsb-category-accent, #2f9e72\) 28%, rgba\(255, 255, 255, 0\.44\)/
    );
  });

  it("does not force displayAccent-driven tinting onto the surface title pill", () => {
    expect(styles).toMatch(
      /\.bsb-tm-title-pill-wrap\[data-transparent="true"\]\[data-glass-context="surface"\] \.bsb-tm-title-pill::before[\s\S]*var\(--bsb-category-accent, #2f9e72\)[\s\S]*mix-blend-mode: screen;/
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
});
