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

  it("keeps title badge selection feedback fast without removing the shadow effect", () => {
    expect(styles).toContain("--bsb-shadow-fast: 120ms;");
    expect(styles).toContain("--bsb-selection-fast: 90ms;");
    expect(styles).toMatch(
      /\.bsb-tm-title-pill-wrap::after \{[\s\S]*box-shadow:[\s\S]*0 10px 22px rgba\(15, 23, 42, 0\.13\),[\s\S]*transition:[\s\S]*opacity 110ms var\(--bsb-ease-swift\),[\s\S]*transform 140ms var\(--bsb-ease-fluid\);[\s\S]*will-change: opacity, transform;/
    );
    expect(styles).toMatch(
      /\.bsb-tm-title-pill-wrap:hover::after,[\s\S]*\.bsb-tm-title-pill-wrap:focus-within::after,[\s\S]*\.bsb-tm-title-pill-wrap\.is-open::after \{[\s\S]*opacity: 1;/
    );
    expect(styles).toMatch(
      /\.bsb-tm-title-pill \{[\s\S]*z-index: 1;[\s\S]*box-shadow var\(--bsb-selection-fast\) var\(--bsb-ease-swift\),[\s\S]*filter var\(--bsb-selection-fast\) var\(--bsb-ease-swift\),/
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

  it("keeps compact video header offset from the viewport and uses equal padding", () => {
    expect(styles).toContain("--bsb-compact-header-gap: 8px;");
    expect(styles).toContain("--bsb-compact-header-padding: 8px;");
    expect(styles).toMatch(
      /\.bsb-tm-video-header-compact \.bsb-tm-video-header-shell \{[\s\S]*top: var\(--bsb-compact-header-gap\);[\s\S]*width: min\(1160px, calc\(100vw - \(var\(--bsb-compact-header-gap\) \* 2\)\)\);/
    );
    expect(styles).toMatch(
      /\.bsb-tm-video-header-bar \{[\s\S]*box-sizing: border-box;[\s\S]*padding: var\(--bsb-compact-header-padding\);/
    );
    expect(styles).toContain(".bsb-tm-video-header-compact:has(.bpx-state-webscreen) .bsb-tm-video-header-shell");
    expect(styles).toContain('.bsb-tm-video-header-compact:has(.bpx-player-container[data-screen="web"]) .bsb-tm-video-header-shell');
    expect(styles).toContain('.bsb-tm-video-header-compact:has(#bilibili-player-wrap[class*="playerFullScreen"]) .bsb-tm-video-header-shell');
    expect(styles).toContain(".bsb-tm-video-header-compact:has(.squirtle-video-pagefullscreen) .bsb-tm-video-header-shell");
  });

  it("places notices below the compact video header and animates dismissal", () => {
    expect(styles).toMatch(
      /\.bsb-tm-video-header-compact \{[\s\S]*--bsb-notice-top: calc\([\s\S]*var\(--bsb-compact-header-gap\)[\s\S]*var\(--bsb-compact-header-estimated-height\)[\s\S]*var\(--bsb-compact-header-padding\)/
    );
    expect(styles).toMatch(
      /\.bsb-tm-notice-root\.is-floating \{[\s\S]*top: var\(--bsb-notice-top\);[\s\S]*bottom: auto;/
    );
    expect(styles).toContain(".bsb-tm-notice.is-leaving");
    expect(styles).toContain("@keyframes bsbNoticeOut");
  });

  it("keeps the title popover on the original top-left positioned scale transition", () => {
    expect(styles).toMatch(
      /\.bsb-tm-title-popover \{[\s\S]*transform: scale\(0\.992\);[\s\S]*transition:[\s\S]*opacity 160ms ease,[\s\S]*transform 180ms ease;[\s\S]*will-change: transform, top, left;/
    );
    expect(styles).toMatch(
      /\.bsb-tm-title-popover\.open \{[\s\S]*opacity: 1;[\s\S]*transform: scale\(1\);/
    );
    expect(styles).not.toContain("--bsb-title-popover-x");
  });

  it("preserves thumbnail label glow and shape transitions instead of removing them", () => {
    const labelBlock = Array.from(styles.matchAll(/\.sponsorThumbnailLabel \{[\s\S]*?\n\}/g))
      .map((match) => match[0])
      .find((block) => block.includes("--bsb-thumbnail-dot-size")) ?? "";
    const textStackBlock = styles.match(/\.sponsorThumbnailLabel \.bsb-tm-thumbnail-text-stack \{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(labelBlock).toContain("backdrop-filter: blur(22px) saturate(185%);");
    expect(labelBlock).toContain("transform: translateZ(0);");
    expect(labelBlock).toContain("will-change: min-width, padding, opacity;");
    expect(labelBlock).toContain("min-width 280ms var(--bsb-ease-fluid)");
    expect(labelBlock).toContain("padding 280ms var(--bsb-ease-fluid)");
    expect(textStackBlock).toContain("transform: translateZ(0);");
    expect(textStackBlock).toContain("will-change: width;");
    expect(textStackBlock).toContain("transition: width 280ms var(--bsb-ease-fluid);");
  });

  it("keeps color editing previews inside the panel instead of a floating duplicate", () => {
    expect(styles).not.toContain(".bsb-tm-color-floating-preview");
    expect(styles).toMatch(
      /\.bsb-tm-color-preview-card \{[\s\S]*display: grid;[\s\S]*justify-items: start;[\s\S]*gap: 7px;/
    );
    expect(styles).toMatch(
      /\.bsb-tm-color-preview-card \.bsb-tm-inline-chip,[\s\S]*\.bsb-tm-color-preview-card \.bsb-tm-title-pill-wrap \{[\s\S]*margin-inline-start: 0;/
    );
  });

  it("uses compact dirty-only actions for color editing", () => {
    expect(styles).toMatch(
      /\.bsb-tm-color-editor-row \{[\s\S]*grid-template-columns: minmax\(0, 1fr\) auto;[\s\S]*gap: 8px;/
    );
    expect(styles).toMatch(
      /\.bsb-tm-color-actions\[hidden\] \{[\s\S]*display: none !important;/
    );
    expect(styles).toMatch(
      /\.bsb-tm-color-action \{[\s\S]*min-height: 30px;[\s\S]*padding: 0 10px;[\s\S]*font: 650 12px\/1 var\(--bsb-font-ui\);/
    );
  });

  it("does not globally strip UI motion as a performance shortcut", () => {
    expect(styles).not.toContain("transition-duration: 1ms !important;");
    expect(styles).not.toContain("animation-duration: 1ms !important;");
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
