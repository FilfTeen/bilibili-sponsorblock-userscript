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

  it("keeps title pill shadows soft enough for bright surfaces", () => {
    expect(styles).toMatch(
      /\.bsb-tm-title-pill \{[\s\S]*0 5px 10px rgba\(15, 23, 42, 0\.045\);[\s\S]*box-shadow 180ms var\(--bsb-ease-swift\),[\s\S]*filter 180ms var\(--bsb-ease-swift\),/
    );
    expect(styles).toMatch(
      /\.bsb-tm-title-pill-wrap\[data-transparent="true"\]\[data-glass-context="surface"\] \.bsb-tm-title-pill \{[\s\S]*0 4px 10px rgba\(15, 23, 42, 0\.03\),[\s\S]*0 8px 16px rgba\(15, 23, 42, 0\.012\);/
    );
    expect(styles).toMatch(
      /\.bsb-tm-title-pill-wrap\[data-transparent="true"\]\[data-glass-context="surface"\] \.bsb-tm-title-pill:hover,[\s\S]*\.bsb-tm-title-pill-wrap\[data-transparent="true"\]\[data-glass-context="surface"\] \.bsb-tm-title-pill\[aria-expanded="true"\] \{[\s\S]*0 6px 14px rgba\(15, 23, 42, 0\.04\),[\s\S]*0 11px 20px rgba\(15, 23, 42, 0\.018\);[\s\S]*filter: saturate\(1\.025\) brightness\(1\.01\);/
    );
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

  it("uses separate shadow budgets for console navigation and cards", () => {
    expect(styles).toMatch(
      /\.bsb-tm-tab-button \{[\s\S]*0 8px 18px rgba\(15, 23, 42, 0\.045\),[\s\S]*box-shadow 170ms var\(--bsb-ease-swift\),/
    );
    expect(styles).toMatch(
      /\.bsb-tm-form-group \{[\s\S]*0 16px 34px rgba\(15, 23, 42, 0\.07\),[\s\S]*box-shadow 180ms var\(--bsb-ease-swift\),/
    );
    expect(styles).toMatch(
      /\.bsb-tm-summary-line,[\s\S]*\.bsb-tm-link-card \{[\s\S]*0 10px 22px rgba\(15, 23, 42, 0\.045\),[\s\S]*box-shadow 170ms var\(--bsb-ease-swift\),/
    );
    expect(styles).toMatch(
      /\.bsb-tm-form-group:hover,[\s\S]*\.bsb-tm-form-group:not\(\[data-pointer-focus="true"\]\):focus-within \{[\s\S]*0 18px 38px rgba\(15, 23, 42, 0\.095\),/
    );
  });

  it("aligns color cards with the panel card selection feedback", () => {
    expect(styles).toMatch(
      /\.bsb-tm-color-field \{[\s\S]*transition:[\s\S]*box-shadow 170ms var\(--bsb-ease-swift\),[\s\S]*border-color 170ms var\(--bsb-ease-swift\),[\s\S]*background 190ms var\(--bsb-ease-swift\),[\s\S]*transform 190ms var\(--bsb-ease-fluid\);/
    );
    expect(styles).toMatch(
      /\.bsb-tm-color-field:hover,[\s\S]*\.bsb-tm-color-field:focus-within \{[\s\S]*border-color: rgba\(var\(--bsb-brand-blue-rgb\), 0\.22\);[\s\S]*0 10px 22px rgba\(15, 23, 42, 0\.055\),[\s\S]*transform: translateY\(-1px\);/
    );
    expect(styles).toMatch(
      /\.bsb-tm-color-field\.compact:hover,[\s\S]*\.bsb-tm-color-field\.compact:focus-within \{[\s\S]*0 8px 18px rgba\(15, 23, 42, 0\.045\);/
    );
    expect(styles).toMatch(
      /\.bsb-tm-color-field:hover \.bsb-tm-color-controls input:not\(:focus\),[\s\S]*\.bsb-tm-color-field:focus-within \.bsb-tm-color-controls input:not\(:focus\) \{[\s\S]*border-color: rgba\(var\(--bsb-brand-blue-rgb\), 0\.22\);[\s\S]*0 8px 18px rgba\(15, 23, 42, 0\.055\);/
    );
    expect(styles).toMatch(
      /\.bsb-tm-color-field\.compact:hover \.bsb-tm-color-controls input:not\(:focus\),[\s\S]*\.bsb-tm-color-field\.compact:focus-within \.bsb-tm-color-controls input:not\(:focus\) \{[\s\S]*0 6px 14px rgba\(15, 23, 42, 0\.045\);/
    );
  });

  it("does not keep pointer-origin focus as a persistent selected card state", () => {
    expect(styles).toMatch(
      /\.bsb-tm-field:not\(\[data-pointer-focus="true"\]\):focus-within,[\s\S]*\.bsb-tm-category-row:not\(\[data-pointer-focus="true"\]\):focus-within,[\s\S]*\.bsb-tm-link-card:focus-visible \{/
    );
    expect(styles).toMatch(
      /\.bsb-tm-panel input:not\(\.bsb-tm-switch\):not\(\[data-pointer-focus="true"\]\):focus,[\s\S]*\.bsb-tm-panel select:not\(\[data-pointer-focus="true"\]\):focus \{/
    );
    expect(styles).toMatch(
      /\.bsb-tm-panel input:not\(\.bsb-tm-switch\):hover,[\s\S]*\.bsb-tm-panel select:hover \{/
    );
    expect(styles).toMatch(
      /\.bsb-tm-field:hover,[\s\S]*\.bsb-tm-category-row:hover \{/
    );
    expect(styles).toMatch(
      /\.bsb-tm-form-group:hover,[\s\S]*\.bsb-tm-form-group:not\(\[data-pointer-focus="true"\]\):focus-within \{/
    );
    expect(styles).not.toContain(".bsb-tm-field:focus-within,\n.bsb-tm-category-row:focus-within");
    expect(styles).not.toContain(".bsb-tm-panel select:focus {");
    expect(styles).not.toContain(".bsb-tm-panel input.bsb-tm-switch:focus,");
  });

  it("styles developer diagnostics without promoting them to global alerts", () => {
    expect(styles).toContain(".bsb-tm-diagnostics-card");
    expect(styles).toContain(".bsb-tm-diagnostics-debug-toggle");
    expect(styles).toContain(".bsb-tm-diagnostics-empty");
    expect(styles).toContain(".bsb-tm-diagnostics-item[data-severity=\"warn\"]");
    expect(styles).toContain(".bsb-tm-diagnostics-item[data-severity=\"error\"]");
    expect(styles).toContain(".bsb-tm-field[data-control-error=\"true\"]");
    expect(styles).toMatch(
      /\.bsb-tm-diagnostics-debug-toggle:hover,[\s\S]*\.bsb-tm-diagnostics-debug-toggle:not\(\[data-pointer-focus="true"\]\):focus-within \{[\s\S]*border-color: rgba\(var\(--bsb-brand-blue-rgb\), 0\.22\);/
    );
  });

  it("uses a custom stable switch surface instead of Safari native checkbox painting", () => {
    const switchBlock = styles.match(/\.bsb-tm-panel input\.bsb-tm-switch \{[\s\S]*?\n\}/)?.[0] ?? "";
    const checkmarkBlock = styles.match(/\.bsb-tm-panel input\.bsb-tm-switch::before \{[\s\S]*?\n\}/)?.[0] ?? "";
    const checkedCheckmarkBlock =
      styles.match(/\.bsb-tm-panel input\.bsb-tm-switch:checked::before \{[\s\S]*?\n\}/)?.[0] ?? "";

    expect(switchBlock).toContain("appearance: none;");
    expect(switchBlock).toContain("-webkit-appearance: none;");
    expect(switchBlock).not.toContain("-webkit-appearance: checkbox;");
    expect(switchBlock).not.toContain("appearance: auto;");
    expect(switchBlock).toContain("contain: paint;");
    expect(switchBlock).toContain("inline-size: 28px;");
    expect(switchBlock).toContain("block-size: 28px;");
    expect(switchBlock).toContain("box-shadow 170ms var(--bsb-ease-swift)");
    expect(checkmarkBlock).toContain('content: "";');
    expect(checkmarkBlock).toContain("opacity: 0;");
    expect(checkmarkBlock).toContain("border-width: 0 2px 2px 0;");
    expect(checkedCheckmarkBlock).toContain("opacity: 1;");
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
