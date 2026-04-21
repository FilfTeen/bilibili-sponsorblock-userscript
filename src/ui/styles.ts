import { inlineFeedbackStyles } from "./inline-feedback";
import { createSurfaceFrostedGlassMaterial } from "./surface-frosted-glass";

const titleSurfaceFrostedGlass = createSurfaceFrostedGlassMaterial({
  accentExpression: "var(--bsb-category-accent, #2f9e72)"
});

export const styles = `
:root {
  --bsb-brand-blue: #00aeec;
  --bsb-brand-blue-rgb: 0, 174, 236;
  --bsb-ease-fluid: cubic-bezier(0.22, 1, 0.36, 1);
  --bsb-ease-swift: cubic-bezier(0.2, 0.8, 0.2, 1);
  --bsb-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --bsb-dark-surface: rgba(24, 29, 38, 0.94);
  --bsb-light-surface: rgba(255, 255, 255, 0.98);
  --bsb-text-primary: #0f172a;
  --bsb-text-secondary: rgba(15, 23, 42, 0.76);
  --bsb-text-tertiary: rgba(71, 85, 105, 0.9);
  --bsb-border: rgba(100, 116, 139, 0.3);
  --bsb-border-soft: rgba(148, 163, 184, 0.22);
  --bsb-border-strong: rgba(148, 163, 184, 0.38);
  --bsb-subtle: rgba(51, 65, 85, 0.86);
  --bsb-shadow: 0 18px 44px rgba(15, 23, 42, 0.22);
  --bsb-glass-white: rgba(255, 255, 255, 0.74);
  --bsb-glass-stroke: rgba(255, 255, 255, 0.62);
  --bsb-glass-inner: inset 0 1px 0 rgba(255, 255, 255, 0.64);
  --bsb-glass-shadow: 0 22px 48px rgba(15, 23, 42, 0.14);
  --bsb-panel-surface: rgba(233, 239, 247, 0.9);
  --bsb-panel-surface-strong: rgba(250, 252, 255, 0.98);
  --bsb-panel-muted: rgba(241, 245, 251, 0.84);
  --bsb-panel-stroke: rgba(100, 116, 139, 0.22);
  --bsb-panel-divider: rgba(191, 201, 214, 0.88);
  --bsb-panel-shadow:
    0 44px 108px rgba(15, 23, 42, 0.24),
    0 18px 42px rgba(15, 23, 42, 0.12);
  --bsb-font-ui: "SF Pro Text", "PingFang SC", sans-serif;
  --bsb-font-display: "SF Pro Display", "SF Pro Text", "PingFang SC", sans-serif;
  --bsb-danger: #ff4d4f;
  --bsb-danger-rgb: 255, 77, 79;
  --bsb-success: #52c41a;
  --bsb-success-rgb: 82, 196, 26;
  --bsb-compact-header-gap: 8px;
  --bsb-compact-header-padding: 8px;
  --bsb-compact-header-estimated-height: 60px;
  --bsb-notice-top: 24px;
}

.bsb-tm-panel,
.bsb-tm-button,
.bsb-tm-tab-button,
.bsb-tm-pill-action,
.bsb-tm-title-pill,
.bsb-tm-player-button,
.sponsorThumbnailLabel,
.bsb-tm-link-card,
.bsb-tm-feature-value {
  font-kerning: normal;
  font-feature-settings: "kern" 1;
  font-synthesis-weight: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

.bsb-tm-panel-open {
  overflow: hidden;
}

.bsb-tm-panel-backdrop[hidden] {
  display: none !important;
}

.bsb-tm-panel-backdrop {
  --bsb-tm-panel-vh: 100vh;
  --bsb-tm-panel-vw: 100vw;
  position: fixed;
  inset: 0;
  z-index: 2147483646;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.22), transparent 42%),
    linear-gradient(180deg, rgba(226, 232, 240, 0.18), rgba(15, 23, 42, 0.32)),
    rgba(15, 23, 42, 0.46);
  backdrop-filter: blur(24px) saturate(165%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow: auto;
  padding: clamp(12px, 2vh, 24px) 16px;
}

.bsb-tm-panel {
  display: flex;
  flex-direction: column;
  width: min(1080px, calc(var(--bsb-tm-panel-vw) - 24px));
  height: min(var(--bsb-tm-panel-height, 820px), calc(var(--bsb-tm-panel-vh) - 24px));
  max-height: min(calc(var(--bsb-tm-panel-vh) - 24px), 920px);
  margin: auto 0;
  overflow: hidden;
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.94), transparent 28%),
    linear-gradient(180deg, rgba(252, 253, 255, 0.98), rgba(233, 239, 247, 0.94)),
    var(--bsb-panel-surface);
  color: var(--bsb-text-primary);
  box-shadow:
    var(--bsb-panel-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    inset 0 0 0 1px rgba(148, 163, 184, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(28px) saturate(160%);
  font: 14px/1.5 var(--bsb-font-ui);
}

.bsb-tm-panel-header,
.bsb-tm-panel-header-actions,
.bsb-tm-field,
.bsb-tm-category-row,
.bsb-tm-summary-line,
.bsb-tm-notice-actions,
.bsb-tm-title-popover-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.bsb-tm-panel-header {
  flex-wrap: wrap;
  align-items: flex-start;
  padding: 18px 24px 16px;
  border-bottom: 1px solid var(--bsb-panel-divider);
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(245, 248, 252, 0.66)),
    rgba(255, 255, 255, 0.46);
  box-shadow:
    inset 0 -1px 0 rgba(255, 255, 255, 0.44),
    inset 0 1px 0 rgba(255, 255, 255, 0.56),
    0 12px 26px rgba(15, 23, 42, 0.04);
  backdrop-filter: blur(18px);
}

.bsb-tm-panel-body {
  display: grid;
  grid-template-columns: 236px minmax(0, 1fr);
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.bsb-tm-panel-nav {
  display: grid;
  align-content: start;
  gap: 8px;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 20px 16px 24px;
  border-right: 1px solid var(--bsb-panel-divider);
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.76), transparent 30%),
    linear-gradient(180deg, rgba(243, 247, 252, 0.96), rgba(230, 237, 245, 0.9)),
    rgba(233, 239, 247, 0.82);
}

.bsb-tm-tab-button {
  display: grid;
  gap: 4px;
  width: 100%;
  text-align: left;
  border: 1px solid var(--bsb-border-soft);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(245, 248, 252, 0.76)),
    rgba(255, 255, 255, 0.58);
  color: var(--bsb-text-primary);
  font: inherit;
  line-height: 1.25;
  padding: 12px 14px;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.74),
    0 8px 18px rgba(15, 23, 42, 0.045),
    inset 0 0 0 1px rgba(255, 255, 255, 0.28);
  transition:
    background 190ms var(--bsb-ease-swift),
    box-shadow 170ms var(--bsb-ease-swift),
    border-color 170ms var(--bsb-ease-swift),
    color 170ms var(--bsb-ease-swift),
    transform 230ms var(--bsb-ease-spring);
}

.bsb-tm-tab-title {
  font-size: 14px;
  line-height: 1.2;
  font-weight: 650;
}

.bsb-tm-tab-description {
  color: var(--bsb-subtle);
  font-size: 12px;
  line-height: 1.3;
}

.bsb-tm-tab-button.active {
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.86), transparent 38%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(241, 246, 251, 0.88)),
    rgba(var(--bsb-brand-blue-rgb), 0.08);
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.22);
  color: var(--bsb-text-primary);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.88),
    inset 0 0 0 1px rgba(var(--bsb-brand-blue-rgb), 0.1),
    0 10px 22px rgba(15, 23, 42, 0.065),
    0 0 0 1px rgba(var(--bsb-brand-blue-rgb), 0.06);
}

.bsb-tm-tab-button.active .bsb-tm-tab-description {
  color: var(--bsb-text-secondary);
}

.bsb-tm-panel-content {
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 24px 28px 30px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.06)),
    transparent;
}

.bsb-tm-panel-nav,
.bsb-tm-panel-content {
  scrollbar-gutter: stable both-edges;
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.48) transparent;
}

.bsb-tm-panel-nav::-webkit-scrollbar,
.bsb-tm-panel-content::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.bsb-tm-panel-nav::-webkit-scrollbar-thumb,
.bsb-tm-panel-content::-webkit-scrollbar-thumb {
  border-radius: 999px;
  border: 2px solid transparent;
  background: rgba(100, 116, 139, 0.48);
  background-clip: padding-box;
}

.bsb-tm-panel-subtitle,
.bsb-tm-section-description,
.bsb-tm-field-help {
  color: var(--bsb-subtle);
}

.bsb-tm-panel-subtitle {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.45;
}

.bsb-tm-panel-section {
  display: grid;
  gap: 20px;
  align-content: start;
  min-height: 100%;
  box-sizing: border-box;
  padding-bottom: 16px;
}

.bsb-tm-panel-section[hidden] {
  display: none !important;
}

.bsb-tm-section-heading {
  display: grid;
  gap: 6px;
}

.bsb-tm-inline-heading {
  display: grid;
  gap: 6px;
  margin-top: 6px;
}

.bsb-tm-section-title,
.bsb-tm-section-label,
.bsb-tm-field-title {
  display: block;
  color: var(--bsb-text-primary);
  letter-spacing: -0.01em;
}

.bsb-tm-section-description,
.bsb-tm-field-help,
.bsb-tm-validation-message {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
}

.bsb-tm-validation-message {
  color: #b91c1c;
}

.bsb-tm-stats,
.bsb-tm-form,
.bsb-tm-categories,
.bsb-tm-overview-grid,
.bsb-tm-help-grid,
.bsb-tm-field-grid,
.bsb-tm-color-grid,
.bsb-tm-form-group,
.bsb-tm-form-group-body {
  display: grid;
  gap: 12px;
}

.bsb-tm-form-group {
  gap: 18px;
  padding: 20px;
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.88), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(242, 246, 250, 0.78)),
    rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow:
    var(--bsb-glass-inner),
    0 16px 34px rgba(15, 23, 42, 0.07),
    inset 0 0 0 1px rgba(148, 163, 184, 0.12);
  backdrop-filter: blur(14px) saturate(140%);
  transition:
    box-shadow 180ms var(--bsb-ease-swift),
    border-color 180ms var(--bsb-ease-swift),
    background 200ms var(--bsb-ease-swift),
    transform 200ms var(--bsb-ease-fluid);
}

.bsb-tm-form-group-header {
  display: grid;
  gap: 8px;
}

.bsb-tm-field-grid {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.bsb-tm-field-grid.single-column {
  grid-template-columns: 1fr;
}

.bsb-tm-color-grid {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.bsb-tm-color-field {
  display: grid;
  gap: 9px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid var(--bsb-border-soft);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(243, 247, 251, 0.64)),
    rgba(248, 250, 252, 0.66);
  box-shadow:
    var(--bsb-glass-inner),
    inset 0 0 0 1px rgba(148, 163, 184, 0.08);
  transition:
    box-shadow 170ms var(--bsb-ease-swift),
    border-color 170ms var(--bsb-ease-swift),
    background 190ms var(--bsb-ease-swift),
    transform 190ms var(--bsb-ease-fluid);
}

.bsb-tm-color-field.compact {
  padding: 10px 12px;
  border-color: rgba(148, 163, 184, 0.16);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.66), rgba(247, 250, 252, 0.42)),
    rgba(255, 255, 255, 0.32);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.38);
}

.bsb-tm-color-field:hover,
.bsb-tm-color-field:focus-within {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.22);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(244, 248, 252, 0.72)),
    rgba(248, 250, 252, 0.74);
  box-shadow:
    var(--bsb-glass-inner),
    0 10px 22px rgba(15, 23, 42, 0.055),
    inset 0 0 0 1px rgba(var(--bsb-brand-blue-rgb), 0.06);
  transform: translateY(-1px);
}

.bsb-tm-color-field.compact:hover,
.bsb-tm-color-field.compact:focus-within {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.2);
  box-shadow:
    inset 0 0 0 1px rgba(var(--bsb-brand-blue-rgb), 0.08),
    0 8px 18px rgba(15, 23, 42, 0.045);
}

.bsb-tm-color-field:hover .bsb-tm-color-controls input:not(:focus),
.bsb-tm-color-field:focus-within .bsb-tm-color-controls input:not(:focus) {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.22);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 250, 253, 0.86)),
    rgba(255, 255, 255, 0.84);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 8px 18px rgba(15, 23, 42, 0.055);
}

.bsb-tm-color-field.compact:hover .bsb-tm-color-controls input:not(:focus),
.bsb-tm-color-field.compact:focus-within .bsb-tm-color-controls input:not(:focus) {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    0 6px 14px rgba(15, 23, 42, 0.045);
}

.bsb-tm-color-preview-card {
  display: grid;
  justify-items: start;
  gap: 7px;
  min-width: 0;
}

.bsb-tm-color-preview-badge {
  display: inline-flex;
  align-items: center;
  flex: none;
}

.bsb-tm-color-preview-card .bsb-tm-inline-chip,
.bsb-tm-color-preview-card .bsb-tm-title-pill-wrap {
  margin-inline-start: 0;
}

.bsb-tm-color-preview-description {
  display: block;
  min-width: 0;
  color: var(--bsb-text-secondary);
  font-size: 12px;
  line-height: 1.35;
}

.bsb-tm-color-preview-title-pill {
  min-height: 24px;
  padding: 5px 10px;
  font-size: 12px;
}

.bsb-tm-color-preview-invalid {
  color: #b91c1c;
  font-size: 12px;
  font-weight: 650;
}

.bsb-tm-color-editor-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}

.bsb-tm-color-controls {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 8px;
}

.bsb-tm-color-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.bsb-tm-color-actions[hidden] {
  display: none !important;
}

.bsb-tm-color-action {
  appearance: none;
  -webkit-appearance: none;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(245, 248, 252, 0.76)),
    rgba(255, 255, 255, 0.62);
  color: var(--bsb-text-primary);
  font: 650 12px/1 var(--bsb-font-ui);
  cursor: pointer;
  transition:
    background 160ms var(--bsb-ease-swift),
    border-color 160ms var(--bsb-ease-swift),
    color 160ms var(--bsb-ease-swift),
    opacity 160ms var(--bsb-ease-swift);
}

.bsb-tm-color-action.primary {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.26);
  background: rgba(var(--bsb-brand-blue-rgb), 0.1);
  color: #0369a1;
}

.bsb-tm-color-action:disabled {
  cursor: default;
  opacity: 0.46;
}

.bsb-tm-color-controls input[type="color"] {
  width: 42px;
  min-width: 42px;
  height: 34px;
  padding: 4px;
}

.bsb-tm-overview-grid,
.bsb-tm-help-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.bsb-tm-actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.bsb-tm-summary-line,
.bsb-tm-field,
.bsb-tm-category-row,
.bsb-tm-feature-card,
.bsb-tm-info-box,
.bsb-tm-link-card {
  padding: 16px 18px;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(244, 247, 251, 0.74)),
    rgba(241, 245, 249, 0.74);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow:
    var(--bsb-glass-inner),
    0 10px 22px rgba(15, 23, 42, 0.045),
    inset 0 0 0 1px rgba(148, 163, 184, 0.08);
  transition:
    box-shadow 170ms var(--bsb-ease-swift),
    border-color 170ms var(--bsb-ease-swift),
    background 190ms var(--bsb-ease-swift),
    transform 190ms var(--bsb-ease-fluid);
}

.bsb-tm-summary-line {
  align-items: baseline;
}

.bsb-tm-summary-line strong {
  font-size: 13px;
  font-weight: 650;
}

.bsb-tm-summary-line span {
  color: var(--bsb-text-secondary);
  text-align: right;
  font-weight: 600;
}

.bsb-tm-field {
  min-width: 0;
  align-items: flex-start;
}

.bsb-tm-field-toggle {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
}

.bsb-tm-field-toggle[data-control-state="on"] {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.22);
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), transparent 38%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(243, 248, 252, 0.84)),
    rgba(var(--bsb-brand-blue-rgb), 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 12px 24px rgba(15, 23, 42, 0.06),
    inset 0 0 0 1px rgba(var(--bsb-brand-blue-rgb), 0.08);
}

.bsb-tm-field-toggle[data-control-state="on"] .bsb-tm-field-title {
  color: var(--bsb-text-primary);
}

.bsb-tm-field-toggle[data-control-state="on"] .bsb-tm-field-help {
  color: rgba(30, 41, 59, 0.78);
}

.bsb-tm-field.stacked {
  align-items: stretch;
  flex-direction: column;
}

.bsb-tm-field-toggle .bsb-tm-switch {
  justify-self: end;
  align-self: center;
  margin-top: 2px;
}

.bsb-tm-field-copy,
.bsb-tm-input-label {
  display: grid;
  gap: 6px;
}

.bsb-tm-categories {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.bsb-tm-category-row {
  align-items: center;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
}

.bsb-tm-category-row select {
  min-width: 88px;
  justify-self: end;
}

.bsb-tm-feature-card {
  display: grid;
  gap: 10px;
  align-content: start;
  justify-items: stretch;
}

.bsb-tm-feature-title {
  font-size: 14px;
  line-height: 1.35;
  font-weight: 650;
  justify-self: start;
  text-align: left;
}

.bsb-tm-feature-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: center;
  width: fit-content;
  max-width: min(100%, 204px);
  min-width: 64px;
  min-height: 28px;
  border-radius: 999px;
  padding: 5px 12px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.24), transparent 46%),
    linear-gradient(180deg, rgba(33, 43, 58, 0.96), rgba(15, 23, 42, 0.9));
  color: #f8fafc;
  font-size: 11px;
  font-weight: 650;
  line-height: 1.15;
  letter-spacing: 0.01em;
  white-space: normal;
  text-align: center;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    0 8px 18px rgba(15, 23, 42, 0.14);
}

.bsb-tm-feature-card .bsb-tm-section-description {
  margin: 0;
  text-align: left;
}

.bsb-tm-link-group {
  display: grid;
  gap: 10px;
}

.bsb-tm-link-card {
  display: block;
  color: #0f172a;
  text-decoration: none;
  transition: box-shadow 180ms ease, background 180ms ease, border-color 180ms ease;
}

.bsb-tm-info-box {
  display: grid;
  gap: 8px;
  background:
    linear-gradient(180deg, rgba(245, 250, 255, 0.94), rgba(234, 243, 252, 0.76)),
    rgba(0, 174, 236, 0.08);
}

.bsb-tm-button,
.bsb-tm-panel input,
.bsb-tm-panel select,
.bsb-tm-pill-action {
  appearance: none;
  -webkit-appearance: none;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.74);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(242, 246, 251, 0.82)),
    rgba(255, 255, 255, 0.84);
  color: inherit;
  padding: 10px 14px;
  font: inherit;
  line-height: 1.1;
  background-clip: padding-box;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 10px 20px rgba(15, 23, 42, 0.07),
    inset 0 0 0 1px rgba(148, 163, 184, 0.06);
  transition:
    box-shadow 220ms var(--bsb-ease-swift),
    background 220ms var(--bsb-ease-swift),
    border-color 220ms var(--bsb-ease-swift),
    filter 180ms var(--bsb-ease-swift),
    transform 260ms var(--bsb-ease-spring);
}

.bsb-tm-button,
.bsb-tm-pill-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  white-space: nowrap;
  min-height: 40px;
  font-size: 13px;
  font-weight: 650;
  letter-spacing: 0.01em;
}

.bsb-tm-panel input,
.bsb-tm-panel select {
  min-height: 42px;
  font-size: 13px;
}

.bsb-tm-panel select {
  text-align: center;
  text-align-last: center;
  padding-inline: 14px;
}

.bsb-tm-panel input.bsb-tm-switch {
  appearance: none;
  -webkit-appearance: none;
  position: relative;
  display: grid;
  place-items: center;
  inline-size: 28px;
  min-inline-size: 28px;
  block-size: 28px;
  min-height: 28px;
  padding: 0;
  margin: 0;
  border: 1px solid rgba(var(--bsb-brand-blue-rgb), 0.18);
  border-radius: 9px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(242, 247, 252, 0.84)),
    rgba(255, 255, 255, 0.86);
  background-clip: padding-box;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 8px 18px rgba(15, 23, 42, 0.055),
    inset 0 0 0 1px rgba(148, 163, 184, 0.06);
  align-self: center;
  color: #fff;
  contain: paint;
  cursor: pointer;
  transform: translateZ(0);
  transition:
    background 170ms var(--bsb-ease-swift),
    border-color 170ms var(--bsb-ease-swift),
    box-shadow 170ms var(--bsb-ease-swift),
    filter 150ms var(--bsb-ease-swift);
}

.bsb-tm-panel input.bsb-tm-switch::before {
  content: "";
  inline-size: 6px;
  block-size: 11px;
  border: solid currentColor;
  border-width: 0 2px 2px 0;
  opacity: 0;
  transform: translateY(-1px) rotate(45deg) scale(0.82);
  transform-origin: 58% 58%;
  transition:
    opacity 110ms var(--bsb-ease-swift),
    transform 150ms var(--bsb-ease-swift);
}

.bsb-tm-panel input.bsb-tm-switch:hover,
.bsb-tm-panel input.bsb-tm-switch:focus,
.bsb-tm-panel input.bsb-tm-switch:active {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.3);
  filter: saturate(1.035) brightness(1.012);
  transform: translateZ(0);
}

.bsb-tm-panel input.bsb-tm-switch:focus-visible {
  outline: 2px solid rgba(var(--bsb-brand-blue-rgb), 0.24);
  outline-offset: 3px;
}

.bsb-tm-panel input.bsb-tm-switch:checked {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.72);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.04)),
    var(--bsb-brand-blue);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.42),
    0 8px 18px rgba(var(--bsb-brand-blue-rgb), 0.18),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  transform: translateZ(0);
}

.bsb-tm-panel input.bsb-tm-switch:checked::before {
  opacity: 1;
  transform: translateY(-1px) rotate(45deg) scale(1);
}

.bsb-tm-panel input.bsb-tm-switch:disabled {
  cursor: progress;
  filter: saturate(0.95) brightness(0.98);
}

.bsb-tm-button,
.bsb-tm-pill-action,
.bsb-tm-player-button,
.bsb-tm-title-pill,
.sponsorThumbnailLabel {
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.bsb-tm-button.compact {
  justify-self: start;
}

.bsb-tm-action-button {
  min-width: 118px;
  padding-inline: 16px;
}

.bsb-tm-button.primary {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.05)),
    var(--bsb-brand-blue);
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.72);
  color: #fff;
}

.bsb-tm-button.danger {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.02)),
    #8f2a2a;
  border-color: rgba(127, 29, 29, 0.56);
  color: #fff7f7;
}

.bsb-tm-button.secondary {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.72)),
    rgba(15, 23, 42, 0.05);
}

.bsb-tm-notice-root {
  position: fixed;
  top: var(--bsb-notice-top);
  right: 24px;
  z-index: 2147483647;
  display: grid;
  gap: 12px;
  max-width: 380px;
  pointer-events: none;
}

.bsb-tm-notice-root:empty {
  display: none !important;
}

.bsb-tm-notice-root.is-floating {
  position: fixed;
  top: var(--bsb-notice-top);
  right: 16px;
  bottom: auto;
}

.bsb-tm-notice {
  position: relative;
  pointer-events: auto;
  color: #0f172a;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(255, 255, 255, 0.72)),
    rgba(255, 255, 255, 0.64);
  border: 1px solid rgba(255, 255, 255, 0.52);
  border-radius: 18px;
  box-shadow:
    var(--bsb-glass-inner),
    0 14px 30px rgba(15, 23, 42, 0.12);
  overflow: hidden;
  backdrop-filter: blur(20px) saturate(160%);
  animation: bsbNoticeIn 220ms ease;
}

.bsb-tm-notice.is-leaving {
  pointer-events: none;
  animation: bsbNoticeOut 220ms var(--bsb-ease-swift) forwards;
}

.bsb-tm-notice-close {
  position: absolute;
  top: 10px;
  right: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgba(15, 23, 42, 0.4);
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    color 180ms var(--bsb-ease-swift),
    background 180ms var(--bsb-ease-swift);
}

.bsb-tm-notice-close:hover {
  color: rgba(15, 23, 42, 0.8);
  background: rgba(15, 23, 42, 0.06);
}

.bsb-tm-notice-body {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
}

.bsb-tm-notice-title {
  font-weight: 700;
}

.bsb-tm-notice-message {
  font-size: 13px;
  color: rgba(15, 23, 42, 0.74);
}

.bsb-tm-notice-actions {
  justify-content: flex-end;
  padding: 0 14px 12px;
}

#previewbar,
#shadowPreviewbar {
  overflow: hidden;
  padding: 0;
  margin: 0;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.previewbar {
  display: inline-block;
  position: absolute;
  top: 0;
  bottom: 0;
  min-width: 2px;
  height: 100%;
}

.previewbar[data-action-type="poi"] {
  min-width: 3px;
}

.bsb-tm-player-host {
  position: relative;
}

.bsb-tm-title-accessories {
  display: inline-flex;
  align-items: center;
  flex: none;
  flex-shrink: 0;
  gap: 0;
  float: left;
  inline-size: max-content;
  margin-right: 8px;
  max-width: max-content;
  white-space: nowrap;
  overflow: visible;
}

.bsb-tm-title-pill-wrap {
  display: inline-flex;
  align-items: center;
  flex: none;
  flex-shrink: 0;
  inline-size: max-content;
  max-width: max-content;
  min-width: max-content;
  overflow: visible;
  position: relative;
  isolation: isolate;
  white-space: nowrap;
}

.bsb-tm-title-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  flex-shrink: 0;
  gap: 6px;
  inline-size: max-content;
  max-width: max-content;
  min-width: max-content;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 999px;
  border: 1px solid var(--bsb-category-glass-border, rgba(255, 255, 255, 0.2));
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.18), transparent 34%),
    linear-gradient(180deg, var(--bsb-category-accent, #2f9e72), var(--bsb-category-accent-strong, #257e59));
  color: var(--bsb-category-contrast, #fff);
  padding: 7px 13px;
  font: 650 13px/1.1 var(--bsb-font-display);
  letter-spacing: 0.01em;
  white-space: nowrap;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    0 5px 10px rgba(15, 23, 42, 0.045);
  transition:
    box-shadow 180ms var(--bsb-ease-swift),
    filter 180ms var(--bsb-ease-swift),
    background 200ms var(--bsb-ease-swift),
    border-color 180ms var(--bsb-ease-swift),
    transform 200ms var(--bsb-ease-fluid);
}

.bsb-tm-title-pill-label {
  display: block;
  min-width: 0;
  overflow-wrap: normal;
  white-space: nowrap;
  word-break: keep-all;
}

.bsb-tm-title-pill-wrap[data-transparent="true"][data-glass-context="surface"] .bsb-tm-title-pill {
${titleSurfaceFrostedGlass.base}
}

.bsb-tm-title-pill-wrap[data-transparent="true"][data-glass-context="surface"] .bsb-tm-title-pill::before {
  z-index: 0;
${titleSurfaceFrostedGlass.overlay}
}

.bsb-tm-title-pill-wrap[data-transparent="true"][data-glass-context="surface"] .bsb-tm-title-pill::after {
  content: none;
}

.bsb-tm-title-pill-wrap[data-transparent="true"][data-glass-context="surface"] .bsb-tm-title-pill > * {
  position: relative;
  z-index: 2;
}

.bsb-tm-title-pill-wrap[data-transparent="true"][data-glass-context="surface"] .bsb-tm-title-pill {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 -1px 0 color-mix(in srgb, var(--bsb-category-accent, #2f9e72) 7%, rgba(15, 23, 42, 0.035)),
    0 4px 10px rgba(15, 23, 42, 0.03),
    0 8px 16px rgba(15, 23, 42, 0.012);
}

.bsb-tm-title-pill:hover,
.bsb-tm-title-pill[aria-expanded="true"] {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 8px 16px rgba(15, 23, 42, 0.085),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.bsb-tm-title-pill-wrap[data-transparent="true"][data-glass-context="surface"] .bsb-tm-title-pill:hover,
.bsb-tm-title-pill-wrap[data-transparent="true"][data-glass-context="surface"] .bsb-tm-title-pill[aria-expanded="true"] {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 -1px 0 color-mix(in srgb, var(--bsb-category-accent, #2f9e72) 9%, rgba(15, 23, 42, 0.045)),
    0 6px 14px rgba(15, 23, 42, 0.04),
    0 11px 20px rgba(15, 23, 42, 0.018);
  filter: saturate(1.025) brightness(1.01);
}

.bsb-tm-title-pill svg,
.bsb-tm-player-button svg,
.bsb-tm-pill-action svg,
.sponsorThumbnailLabel svg {
  width: 15px;
  height: 15px;
  fill: currentColor;
}

.bsb-tm-player-button[data-placement="header"] svg {
  width: 13px;
  height: 13px;
}

.sponsorThumbnailLabel svg {
  width: 12px;
  height: 12px;
}

.bsb-tm-title-popover {
  position: fixed;
  z-index: 2147483646;
  width: min(400px, calc(100vw - 32px));
  padding: 14px;
  border-radius: 20px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.88), transparent 36%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(243, 247, 251, 0.82)),
    rgba(255, 255, 255, 0.84);
  color: var(--bsb-text-primary);
  border: 1px solid rgba(255, 255, 255, 0.58);
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.64),
    inset 0 0 0 1px rgba(148, 163, 184, 0.08);
  backdrop-filter: blur(18px) saturate(150%);
  opacity: 0;
  transform: scale(0.992);
  pointer-events: none;
  transition:
    opacity 160ms ease,
    transform 180ms ease;
  will-change: transform, top, left;
}

.bsb-tm-title-popover.open {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

.bsb-tm-title-popover-copy {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--bsb-text-secondary);
}

.bsb-tm-title-popover-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
  align-items: stretch;
}

.bsb-tm-title-popover-actions.vote-unavailable {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.bsb-tm-title-popover-hint {
  margin: 10px 0 0;
  color: var(--bsb-text-tertiary);
  font-size: 12px;
}

.bsb-tm-pill-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 14px;
  min-width: 0;
  width: 100%;
}

.bsb-tm-pill-action:disabled {
  cursor: default;
  opacity: 0.52;
  filter: saturate(0.78);
}

.bsb-tm-pill-action.positive {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.24);
  color: #166534;
}

.bsb-tm-pill-action.negative {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.24);
  color: #991b1b;
}

.bsb-tm-pill-action.subtle {
  background: rgba(15, 23, 42, 0.04);
  border-color: rgba(15, 23, 42, 0.08);
  color: #1f2937;
  grid-column: 1 / -1;
  justify-self: start;
  width: auto;
  min-width: 128px;
}

.bsb-tm-title-pill-wrap.is-busy {
  opacity: 0.7;
}

.bsb-tm-player-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.8)),
    rgba(255, 255, 255, 0.72);
  color: #475569;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.62),
    0 6px 16px rgba(15, 23, 42, 0.07);
  opacity: 1;
  line-height: 1;
  transition:
    box-shadow 180ms ease,
    background 180ms ease,
    filter 160ms ease;
}

.bsb-tm-player-button[data-placement="header"] {
  width: 26px;
  height: 26px;
  border-color: rgba(15, 23, 42, 0.07);
}

.bsb-tm-player-button[data-placement="player"] {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  box-shadow: none;
  opacity: 0.9;
}

.bsb-tm-player-button:hover {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.84)),
    rgba(255, 255, 255, 0.82);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 6px 14px rgba(15, 23, 42, 0.08);
  filter: saturate(1.01);
}

.bsb-tm-title-pill:hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 8px 16px rgba(15, 23, 42, 0.08);
  filter: saturate(1.02) brightness(1.01);
}

.bsb-tm-player-button[data-placement="player"]:hover {
  background: transparent;
  box-shadow: none;
  opacity: 1;
}

.bsb-tm-thumbnail-host {
  position: relative !important;
  overflow: visible !important;
  isolation: isolate;
}

.bsb-tm-thumbnail-slot {
  position: absolute;
  top: var(--bsb-thumbnail-anchor-top, 0px);
  left: var(--bsb-thumbnail-anchor-left, 50%);
  width: min(156px, max(72px, calc(var(--bsb-thumbnail-anchor-width, 96px) + 2px)));
  height: 28px;
  transform: translate(-50%, calc(-100% - 1px));
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: visible;
  z-index: 8;
  pointer-events: auto;
}

.bsb-tm-thumbnail-slot[data-placement="corner"] {
  top: var(--bsb-thumbnail-anchor-top, 6px);
  left: var(--bsb-thumbnail-anchor-left, 6px);
  width: 1px;
  min-width: 1px;
  height: 24px;
  transform: translate(0, 0);
  align-items: flex-start;
  justify-content: flex-start;
  z-index: 10;
  overflow: visible !important;
}

.sponsorThumbnailLabel {
  --bsb-thumbnail-dot-size: 5px;
  --bsb-thumbnail-dot-stroke: 1.5px;
  --bsb-thumbnail-dot-left: 10px;
  --bsb-thumbnail-dot-opacity: 0.85;
  --bsb-thumbnail-dot-glow: 5px;
  --bsb-thumbnail-current-width: var(--bsb-thumbnail-collapsed-width, 38px);
  --bsb-thumbnail-current-padding: 9px;
  display: flex;
  position: relative;
  justify-content: center;
  align-items: center;
  gap: 6px;
  min-width: var(--bsb-thumbnail-current-width);
  width: max-content;
  height: 22px;
  padding-inline: var(--bsb-thumbnail-current-padding);
  border-radius: 999px;
  background:
    radial-gradient(circle at 22% 18%, rgba(255, 255, 255, 0.22), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent 52%),
    linear-gradient(180deg, color-mix(in srgb, var(--category-glass-surface, rgba(15, 23, 42, 0.86)) 92%, rgba(15, 23, 42, 0.12)), var(--category-glass-surface, rgba(15, 23, 42, 0.86)));
  color: var(--category-contrast, #ffffff);
  border: 1px solid color-mix(in srgb, var(--category-glass-border, rgba(255, 255, 255, 0.48)) 78%, rgba(255, 255, 255, 0.24));
  opacity: 1;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 -1px 0 rgba(15, 23, 42, 0.12),
    0 8px 18px rgba(15, 23, 42, 0.18),
    0 0 0 1px rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(22px) saturate(185%);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.01em;
  line-height: 1;
  white-space: nowrap;
  text-align: center;
  isolation: isolate;
  backface-visibility: hidden;
  transform: translateZ(0);
  text-rendering: geometricPrecision;
  will-change: min-width, padding, opacity;
  pointer-events: none;
  overflow: hidden;
  transition:
    box-shadow 220ms var(--bsb-ease-swift),
    background 220ms var(--bsb-ease-swift),
    opacity 160ms var(--bsb-ease-swift),
    border-color 220ms var(--bsb-ease-swift),
    filter 220ms var(--bsb-ease-swift),
    min-width 280ms var(--bsb-ease-fluid),
    padding 280ms var(--bsb-ease-fluid);
}

.sponsorThumbnailLabel[data-transparent="true"][data-glass-context="overlay"] {
  border: 1px solid color-mix(in srgb, var(--category-accent, #ffffff) 34%, rgba(255, 255, 255, 0.3));
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.015));
  backdrop-filter: none;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.34),
    inset 0 -1px 0 color-mix(in srgb, var(--category-accent, #ffffff) 18%, rgba(15, 23, 42, 0.06)),
    0 4px 10px rgba(15, 23, 42, 0.075),
    0 0 0 1px rgba(255, 255, 255, 0.06);
}

.sponsorThumbnailLabel[data-placement="default"][data-transparent="true"][data-glass-context="overlay"] {
  border-color: color-mix(in srgb, var(--category-accent, #ffffff) 20%, rgba(255, 255, 255, 0.12));
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--category-accent, #ffffff) 8%, rgba(255, 255, 255, 0.1)),
    color-mix(in srgb, var(--category-accent, #ffffff) 12%, rgba(255, 255, 255, 0.03))
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 -1px 0 color-mix(in srgb, var(--category-accent, #ffffff) 10%, rgba(15, 23, 42, 0.04)),
    0 6px 14px rgba(15, 23, 42, 0.08),
    0 12px 22px rgba(15, 23, 42, 0.04);
}

.sponsorThumbnailLabel[data-transparent="true"][data-glass-context="overlay"]::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  pointer-events: none;
  background:
    radial-gradient(circle at 22% -16%, color-mix(in srgb, var(--category-accent, #ffffff) 38%, rgba(255, 255, 255, 0.34)) 0%, transparent 34%),
    radial-gradient(circle at 82% 130%, color-mix(in srgb, var(--category-accent, #ffffff) 32%, rgba(15, 23, 42, 0.2)) 0%, transparent 50%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0.04) 34%, transparent 58%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--category-accent, #ffffff) 22%, rgba(255, 255, 255, 0.1)),
      color-mix(in srgb, var(--category-accent, #ffffff) 48%, rgba(15, 23, 42, 0.14))
    ),
    linear-gradient(110deg, transparent 18%, rgba(255, 255, 255, 0.24) 28%, transparent 42%);
  opacity: 0.94;
  backdrop-filter: blur(4px) saturate(162%) brightness(1.04);
  mix-blend-mode: screen;
}

.sponsorThumbnailLabel[data-placement="default"][data-transparent="true"][data-glass-context="overlay"]::after {
  background:
    radial-gradient(circle at 18% 12%, color-mix(in srgb, var(--category-accent, #ffffff) 20%, rgba(255, 255, 255, 0.18)) 0%, transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.03) 34%, transparent 62%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--category-accent, #ffffff) 18%, rgba(255, 255, 255, 0.2)),
      color-mix(in srgb, var(--category-accent, #ffffff) 30%, rgba(15, 23, 42, 0.08))
    ),
    linear-gradient(112deg, transparent 18%, rgba(255, 255, 255, 0.08) 28%, transparent 42%);
  opacity: 0.92;
  backdrop-filter: blur(4px) saturate(150%) brightness(1.02);
  mix-blend-mode: normal;
}

.sponsorThumbnailLabel[data-transparent="true"][data-glass-context="overlay"][data-glass-variant="light"] {
  border: 1px solid color-mix(
    in srgb,
    var(--category-display-accent, var(--category-accent, #ffffff)) 28%,
    rgba(255, 255, 255, 0.46)
  );
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 10%, rgba(255, 255, 255, 0.92)),
    color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 16%, rgba(241, 245, 249, 0.74))
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    inset 0 -1px 0 color-mix(
      in srgb,
      var(--category-display-accent, var(--category-accent, #ffffff)) 16%,
      rgba(148, 163, 184, 0.08)
    ),
    0 3px 8px rgba(15, 23, 42, 0.04),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.sponsorThumbnailLabel[data-placement="default"][data-transparent="true"][data-glass-context="overlay"][data-glass-variant="light"] {
  border-color: color-mix(
    in srgb,
    var(--category-display-accent, var(--category-accent, #ffffff)) 18%,
    rgba(255, 255, 255, 0.2)
  );
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 9%, rgba(255, 255, 255, 0.14)),
    color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 14%, rgba(241, 245, 249, 0.05))
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 color-mix(
      in srgb,
      var(--category-display-accent, var(--category-accent, #ffffff)) 8%,
      rgba(15, 23, 42, 0.04)
    ),
    0 5px 12px rgba(15, 23, 42, 0.045),
    0 10px 18px rgba(15, 23, 42, 0.025);
}

.sponsorThumbnailLabel[data-transparent="true"][data-glass-context="overlay"][data-glass-variant="light"]::after {
  background:
    radial-gradient(
      circle at 18% -10%,
      color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 22%, rgba(255, 255, 255, 0.44)) 0%,
      transparent 34%
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.05) 32%, transparent 56%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 10%, rgba(255, 255, 255, 0.12)),
      color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 18%, rgba(231, 238, 245, 0.08))
    ),
    linear-gradient(112deg, transparent 24%, rgba(255, 255, 255, 0.2) 32%, transparent 46%);
  opacity: 0.82;
  backdrop-filter: saturate(144%) brightness(1.03);
}

.sponsorThumbnailLabel[data-placement="default"][data-transparent="true"][data-glass-context="overlay"][data-glass-variant="light"]::after {
  background:
    radial-gradient(
      circle at 18% 12%,
      color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 16%, rgba(255, 255, 255, 0.22)) 0%,
      transparent 42%
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.03) 34%, transparent 62%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 14%, rgba(255, 255, 255, 0.18)),
      color-mix(in srgb, var(--category-display-accent, var(--category-accent, #ffffff)) 18%, rgba(231, 238, 245, 0.08))
    ),
    linear-gradient(112deg, transparent 18%, rgba(255, 255, 255, 0.08) 28%, transparent 42%);
  opacity: 0.88;
  backdrop-filter: blur(4px) saturate(142%) brightness(1.02);
  mix-blend-mode: normal;
}

.sponsorThumbnailLabel[data-placement="corner"] {
  --bsb-thumbnail-dot-size: 4px;
  --bsb-thumbnail-dot-left: 7px;
  --bsb-thumbnail-dot-glow: 4px;
  height: 19px;
  min-width: var(--bsb-thumbnail-current-width, 19px);
  max-width: 180px;
  --bsb-thumbnail-current-padding: 7px;
  gap: 5px;
  font-size: 9.5px;
  letter-spacing: 0;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 -1px 0 rgba(15, 23, 42, 0.1),
    0 6px 14px rgba(15, 23, 42, 0.16),
    0 0 0 1px rgba(255, 255, 255, 0.06);
}

.sponsorThumbnailLabel[data-placement="corner"][data-transparent="true"][data-glass-context="overlay"] {
  border-color: color-mix(in srgb, var(--category-accent, #ffffff) 28%, rgba(255, 255, 255, 0.28));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 -1px 0 color-mix(in srgb, var(--category-accent, #ffffff) 12%, rgba(15, 23, 42, 0.05)),
    0 3px 8px rgba(15, 23, 42, 0.055),
    0 0 0 1px rgba(255, 255, 255, 0.06);
}

.sponsorThumbnailLabel[data-placement="corner"][data-transparent="true"][data-glass-context="overlay"][data-glass-variant="light"] {
  border-color: color-mix(
    in srgb,
    var(--category-display-accent, var(--category-accent, #ffffff)) 24%,
    rgba(255, 255, 255, 0.44)
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    inset 0 -1px 0 color-mix(
      in srgb,
      var(--category-display-accent, var(--category-accent, #ffffff)) 14%,
      rgba(148, 163, 184, 0.08)
    ),
    0 2px 6px rgba(15, 23, 42, 0.035),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.bsb-tm-thumbnail-slot[data-placement="corner"] .sponsorThumbnailLabelVisible {
  --bsb-thumbnail-expanded-padding: 11px;
}

.sponsorThumbnailLabel::before {
  content: "";
  position: absolute;
  top: 50%;
  left: var(--bsb-thumbnail-dot-left);
  width: var(--bsb-thumbnail-dot-size);
  height: var(--bsb-thumbnail-dot-size);
  border-radius: 50%;
  border: var(--bsb-thumbnail-dot-stroke) solid currentColor;
  opacity: var(--bsb-thumbnail-dot-opacity);
  box-shadow: 0 0 var(--bsb-thumbnail-dot-glow) color-mix(in srgb, currentColor 40%, transparent);
  flex-shrink: 0;
  z-index: 2;
  transform: translateY(-50%);
}

.sponsorThumbnailLabel[data-transparent="true"][data-glass-context="overlay"][data-glass-variant="light"]::before {
  border-color: var(--category-display-accent, currentColor);
  box-shadow: 0 0 4px color-mix(in srgb, var(--category-display-accent, currentColor) 40%, transparent);
}

.sponsorThumbnailLabel .bsb-tm-thumbnail-text-stack {
  --bsb-thumbnail-current-text-width: var(--bsb-thumbnail-collapsed-text-width, 1em);
  grid-column: 2;
  grid-row: 1;
  position: relative;
  z-index: 2;
  width: var(--bsb-thumbnail-current-text-width);
  min-width: 0;
  height: 1em;
  transform: translateZ(0);
  will-change: width;
  transition: width 280ms var(--bsb-ease-fluid);
}

.sponsorThumbnailLabel .bsb-tm-thumbnail-short-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: inherit;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
  white-space: nowrap;
  text-shadow:
    0 0.5px 1px rgba(15, 23, 42, 0.36),
    0 0 10px rgba(15, 23, 42, 0.1);
  transition:
    opacity 180ms var(--bsb-ease-swift),
    transform 280ms var(--bsb-ease-fluid);
}

.sponsorThumbnailLabel[data-transparent="true"][data-glass-context="overlay"][data-glass-variant="light"] .bsb-tm-thumbnail-short-label,
.sponsorThumbnailLabel[data-transparent="true"][data-glass-context="overlay"][data-glass-variant="light"] .bsb-tm-thumbnail-label {
  text-shadow: none;
}

.sponsorThumbnailLabel .bsb-tm-thumbnail-short-label > span {
  display: block;
  min-width: 0;
  overflow: visible;
}

.sponsorThumbnailLabel.sponsorThumbnailLabelVisible {
  display: inline-grid;
}

.bsb-tm-field-title {
  display: block;
  font-size: 13.5px;
  font-weight: 650;
  color: var(--bsb-text-primary);
  line-height: 1.3;
}

.bsb-tm-refresh-hint {
  display: inline-block;
  margin-left: 6px;
  font-size: 9px;
  font-weight: 600;
  color: var(--bsb-brand-blue);
  background: rgba(var(--bsb-brand-blue-rgb), 0.1);
  padding: 1px 5px;
  border-radius: 4px;
  vertical-align: middle;
  pointer-events: none;
  border: 1px solid rgba(var(--bsb-brand-blue-rgb), 0.15);
}

.sponsorThumbnailLabel .bsb-tm-thumbnail-label {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 10px;
  font-weight: 650;
  color: inherit;
  line-height: 1;
  white-space: nowrap;
  text-shadow:
    0 0.5px 1px rgba(15, 23, 42, 0.36),
    0 0 10px rgba(15, 23, 42, 0.1);
  opacity: 0;
  transform: translateY(1px);
  transition:
    opacity 180ms var(--bsb-ease-swift),
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.sponsorThumbnailLabel .bsb-tm-thumbnail-label > span {
  display: block;
  min-width: 0;
  overflow: visible;
}

.bsb-tm-thumbnail-host:hover .sponsorThumbnailLabelVisible,
.bsb-tm-thumbnail-host:focus-within .sponsorThumbnailLabelVisible,
.bsb-tm-thumbnail-host[data-bsb-hover="true"] .sponsorThumbnailLabelVisible,
.bsb-tm-thumbnail-slot[data-bsb-expanded="true"] .sponsorThumbnailLabelVisible,
.sponsorThumbnailLabelVisible[data-bsb-expanded="true"],
.bsb-tm-thumbnail-slot:hover .sponsorThumbnailLabelVisible,
.bsb-tm-thumbnail-slot:focus-within .sponsorThumbnailLabelVisible {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 10px 20px rgba(15, 23, 42, 0.22),
    0 0 0 1px rgba(255, 255, 255, 0.12);
  filter: saturate(1.05) brightness(1.02);
  --bsb-thumbnail-current-width: var(--bsb-thumbnail-expanded-width, 120px);
  --bsb-thumbnail-current-padding: var(--bsb-thumbnail-expanded-padding, 10px);
}

.bsb-tm-thumbnail-slot[data-placement="corner"] .sponsorThumbnailLabelVisible {
  padding-inline: 6px 8px;
}

.bsb-tm-thumbnail-host:hover .sponsorThumbnailLabel .bsb-tm-thumbnail-short-label,
.bsb-tm-thumbnail-host:focus-within .sponsorThumbnailLabel .bsb-tm-thumbnail-short-label,
.bsb-tm-thumbnail-host[data-bsb-hover="true"] .sponsorThumbnailLabel .bsb-tm-thumbnail-short-label,
.bsb-tm-thumbnail-slot[data-bsb-expanded="true"] .sponsorThumbnailLabel .bsb-tm-thumbnail-short-label,
.sponsorThumbnailLabel[data-bsb-expanded="true"] .bsb-tm-thumbnail-short-label,
.bsb-tm-thumbnail-slot:hover .sponsorThumbnailLabel .bsb-tm-thumbnail-short-label,
.bsb-tm-thumbnail-slot:focus-within .sponsorThumbnailLabel .bsb-tm-thumbnail-short-label {
  opacity: 0;
  transform: translateY(-1px);
}

.bsb-tm-thumbnail-host:hover .sponsorThumbnailLabel .bsb-tm-thumbnail-text-stack,
.bsb-tm-thumbnail-host:focus-within .sponsorThumbnailLabel .bsb-tm-thumbnail-text-stack,
.bsb-tm-thumbnail-host[data-bsb-hover="true"] .sponsorThumbnailLabel .bsb-tm-thumbnail-text-stack,
.bsb-tm-thumbnail-slot[data-bsb-expanded="true"] .sponsorThumbnailLabel .bsb-tm-thumbnail-text-stack,
.sponsorThumbnailLabel[data-bsb-expanded="true"] .bsb-tm-thumbnail-text-stack,
.bsb-tm-thumbnail-slot:hover .sponsorThumbnailLabel .bsb-tm-thumbnail-text-stack,
.bsb-tm-thumbnail-slot:focus-within .sponsorThumbnailLabel .bsb-tm-thumbnail-text-stack {
  --bsb-thumbnail-current-text-width: var(--bsb-thumbnail-expanded-text-width, 72px);
}

.bsb-tm-thumbnail-host:hover .sponsorThumbnailLabel .bsb-tm-thumbnail-label,
.bsb-tm-thumbnail-host:focus-within .sponsorThumbnailLabel .bsb-tm-thumbnail-label,
.bsb-tm-thumbnail-host[data-bsb-hover="true"] .sponsorThumbnailLabel .bsb-tm-thumbnail-label,
.bsb-tm-thumbnail-slot[data-bsb-expanded="true"] .sponsorThumbnailLabel .bsb-tm-thumbnail-label,
.sponsorThumbnailLabel[data-bsb-expanded="true"] .bsb-tm-thumbnail-label,
.bsb-tm-thumbnail-slot:hover .sponsorThumbnailLabel .bsb-tm-thumbnail-label,
.bsb-tm-thumbnail-slot:focus-within .sponsorThumbnailLabel .bsb-tm-thumbnail-label {
  opacity: 1;
  transform: translateY(0);
}

.bsb-tm-panel-header-copy {
  display: grid;
  gap: 6px;
}

.bsb-tm-panel-eyebrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: fit-content;
  padding: 5px 10px 5px 6px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(243, 246, 250, 0.6)),
    rgba(var(--bsb-brand-blue-rgb), 0.08);
  color: var(--bsb-text-secondary);
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
  box-shadow: var(--bsb-glass-inner);
}

.bsb-tm-panel-eyebrow-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: rgba(var(--bsb-brand-blue-rgb), 0.12);
  color: #0369a1;
}

.bsb-tm-panel-eyebrow-icon svg {
  width: 11px;
  height: 11px;
}

.bsb-tm-panel-header-actions {
  padding: 6px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.94), transparent 52%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 250, 0.76)),
    rgba(255, 255, 255, 0.58);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    0 16px 34px rgba(15, 23, 42, 0.08),
    0 0 0 1px rgba(148, 163, 184, 0.06);
  backdrop-filter: blur(12px) saturate(135%);
}

.bsb-tm-header-action {
  min-width: 84px;
  min-height: 42px;
  font-weight: 650;
  line-height: 1;
  color: var(--bsb-text-primary);
  border-color: rgba(148, 163, 184, 0.3);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    0 10px 22px rgba(15, 23, 42, 0.06);
}

.bsb-tm-tab-button:hover,
.bsb-tm-link-card:hover,
.bsb-tm-button:hover,
.bsb-tm-panel input:not(.bsb-tm-switch):not([data-pointer-focus="true"]):hover,
.bsb-tm-panel select:not([data-pointer-focus="true"]):hover {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.28);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 10px 22px rgba(15, 23, 42, 0.065);
  transform: translateY(-1px);
}

.bsb-tm-field:not([data-pointer-focus="true"]):hover,
.bsb-tm-category-row:not([data-pointer-focus="true"]):hover {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.22);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 10px 22px rgba(15, 23, 42, 0.06),
    inset 0 0 0 1px rgba(var(--bsb-brand-blue-rgb), 0.06);
  transform: translateY(-1px);
}

.bsb-tm-tab-button:active,
.bsb-tm-button:active,
.bsb-tm-link-card:active {
  transform: translateY(0) scale(0.985);
}

.bsb-tm-button.success {
  background: linear-gradient(180deg, #dcfce7, #bbf7d0) !important;
  border-color: #86efac !important;
  color: #166534 !important;
  box-shadow: 0 4px 12px rgba(22, 101, 52, 0.12) !important;
}

.bsb-tm-button.confirming {
  background: var(--bsb-danger) !important;
  color: #fff !important;
  border-color: rgba(0, 0, 0, 0.1) !important;
  animation: bsb-pulse 2s infinite;
  box-shadow: 0 0 0 0 rgba(var(--bsb-danger-rgb), 0.42);
}

.bsb-tm-button.confirming:hover {
  background: color-mix(in srgb, var(--bsb-danger) 90%, black) !important;
}

@keyframes bsb-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--bsb-danger-rgb), 0.52);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(var(--bsb-danger-rgb), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--bsb-danger-rgb), 0);
  }
}

.bsb-tm-panel input:not(.bsb-tm-switch):not([data-pointer-focus="true"]):focus,
.bsb-tm-panel select:not([data-pointer-focus="true"]):focus {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.3);
  box-shadow:
    0 0 0 4px rgba(var(--bsb-brand-blue-rgb), 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.68);
}

.bsb-tm-form-group:not([data-pointer-focus="true"]):hover,
.bsb-tm-form-group:not([data-pointer-focus="true"]):focus-within {
  border-color: rgba(255, 255, 255, 0.82);
  box-shadow:
    var(--bsb-glass-inner),
    0 18px 38px rgba(15, 23, 42, 0.095),
    inset 0 0 0 1px rgba(var(--bsb-brand-blue-rgb), 0.08);
}

.bsb-tm-link-card:hover {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.22);
  transform: translateY(-1px);
}

.bsb-tm-field:not([data-pointer-focus="true"]):focus-within,
.bsb-tm-category-row:not([data-pointer-focus="true"]):focus-within,
.bsb-tm-link-card:focus-visible {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.3);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    0 12px 26px rgba(15, 23, 42, 0.065),
    0 0 0 3px rgba(var(--bsb-brand-blue-rgb), 0.08);
}

.bsb-tm-field[data-control-error="true"],
.bsb-tm-category-row[data-control-error="true"],
.bsb-tm-color-field[data-control-error="true"] {
  border-color: rgba(var(--bsb-danger-rgb), 0.32);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 12px 26px rgba(var(--bsb-danger-rgb), 0.1),
    0 0 0 3px rgba(var(--bsb-danger-rgb), 0.08);
}

.bsb-tm-diagnostics-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 20px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.84), transparent 34%),
    linear-gradient(180deg, rgba(248, 251, 255, 0.94), rgba(236, 243, 251, 0.82));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 12px 28px rgba(15, 23, 42, 0.06);
}

.bsb-tm-diagnostics-heading,
.bsb-tm-diagnostics-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.bsb-tm-diagnostics-count {
  padding: 4px 9px;
  border-radius: 999px;
  color: var(--bsb-text-secondary);
  background: rgba(var(--bsb-brand-blue-rgb), 0.1);
  font-size: 12px;
  font-weight: 650;
}

.bsb-tm-diagnostics-debug-toggle {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(244, 248, 252, 0.5)),
    rgba(255, 255, 255, 0.36);
  cursor: pointer;
  transition:
    background 190ms var(--bsb-ease-swift),
    border-color 170ms var(--bsb-ease-swift),
    box-shadow 170ms var(--bsb-ease-swift),
    transform 190ms var(--bsb-ease-fluid);
}

.bsb-tm-diagnostics-debug-toggle:hover,
.bsb-tm-diagnostics-debug-toggle:not([data-pointer-focus="true"]):focus-within {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.22);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(244, 248, 252, 0.68)),
    rgba(var(--bsb-brand-blue-rgb), 0.05);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 10px 22px rgba(15, 23, 42, 0.055),
    inset 0 0 0 1px rgba(var(--bsb-brand-blue-rgb), 0.06);
  transform: translateY(-1px);
}

.bsb-tm-diagnostics-debug-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.bsb-tm-diagnostics-debug-copy small,
.bsb-tm-diagnostics-empty {
  margin: 0;
  color: var(--bsb-subtle);
  font-size: 12px;
  line-height: 1.45;
}

.bsb-tm-diagnostics-list {
  display: grid;
  gap: 8px;
  max-height: 260px;
  overflow: auto;
  padding-right: 2px;
}

.bsb-tm-diagnostics-empty {
  padding: 10px 12px;
  border: 1px dashed rgba(148, 163, 184, 0.28);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.42);
}

.bsb-tm-diagnostics-item {
  display: grid;
  gap: 5px;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.58);
}

.bsb-tm-diagnostics-item[data-severity="warn"] {
  border-color: rgba(217, 119, 6, 0.22);
}

.bsb-tm-diagnostics-item[data-severity="error"] {
  border-color: rgba(var(--bsb-danger-rgb), 0.24);
}

.bsb-tm-diagnostics-item small {
  color: var(--bsb-subtle);
  font-size: 11px;
  letter-spacing: 0.01em;
}

.bsb-tm-diagnostics-item code {
  overflow-wrap: anywhere;
  color: var(--bsb-text-secondary);
  font: 11px/1.45 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

${inlineFeedbackStyles}

@keyframes bsbNoticeIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes bsbNoticeOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  to {
    opacity: 0;
    transform: translateY(-8px) scale(0.985);
  }
}

.bsb-tm-title-pill:focus-visible,
.bsb-tm-player-button:focus-visible,
.bsb-tm-pill-action:focus-visible,
.sponsorThumbnailLabel:focus-visible,
.bsb-tm-tab-button:focus-visible,
.bsb-tm-button:focus-visible {
  box-shadow:
    0 0 0 3px rgba(var(--bsb-brand-blue-rgb), 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

[data-bsb-native-header-hidden="true"] {
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
  user-select: none !important;
}

.bsb-tm-video-header-shell,
.player-full-win .bsb-tm-video-header-shell,
.player-fullscreen .bsb-tm-video-header-shell {
  display: none;
}

.bsb-tm-video-header-compact {
  --bsb-notice-top: calc(
    var(--bsb-compact-header-gap) + var(--bsb-compact-header-estimated-height) + var(--bsb-compact-header-padding)
  );
}

.bsb-tm-video-header-compact .bsb-tm-video-header-shell {
  display: block;
  position: fixed;
  top: var(--bsb-compact-header-gap);
  left: 50%;
  z-index: 1100;
  width: min(1160px, calc(100vw - (var(--bsb-compact-header-gap) * 2)));
  transform: translateX(-50%);
  pointer-events: none;
}

.player-full-win .bsb-tm-video-header-shell,
.player-fullscreen .bsb-tm-video-header-shell {
  display: none !important;
}

.bsb-tm-video-header-compact.player-full-win .bsb-tm-video-header-shell,
.bsb-tm-video-header-compact.player-fullscreen .bsb-tm-video-header-shell,
.bsb-tm-video-header-compact.bpx-state-webfull .bsb-tm-video-header-shell,
.bsb-tm-video-header-compact.bpx-state-webscreen .bsb-tm-video-header-shell,
.bsb-tm-video-header-compact:has(.player-full-win) .bsb-tm-video-header-shell,
.bsb-tm-video-header-compact:has(.player-fullscreen) .bsb-tm-video-header-shell,
.bsb-tm-video-header-compact:has(.bpx-state-webfull) .bsb-tm-video-header-shell,
.bsb-tm-video-header-compact:has(.bpx-state-webscreen) .bsb-tm-video-header-shell,
.bsb-tm-video-header-compact:has(.bpx-player-container[data-screen="web"]) .bsb-tm-video-header-shell,
.bsb-tm-video-header-compact:has(.bpx-player-container[data-screen="webscreen"]) .bsb-tm-video-header-shell,
.bsb-tm-video-header-compact:has(.bpx-player-container[data-screen="full"]) .bsb-tm-video-header-shell,
.bsb-tm-video-header-compact:has(#bilibili-player-wrap[class*="playerFullScreen"]) .bsb-tm-video-header-shell,
.bsb-tm-video-header-compact:has(.squirtle-video-pagefullscreen) .bsb-tm-video-header-shell,
.bsb-tm-video-header-compact:has(.squirtle-video-fullscreen) .bsb-tm-video-header-shell,
.bsb-tm-video-header-compact:has(.player-mode-webfullscreen) .bsb-tm-video-header-shell,
.bsb-tm-video-header-compact:has(.mode-webscreen) .bsb-tm-video-header-shell {
  display: none !important;
}

.player-full-win .video-container-v1,
.player-fullscreen .video-container-v1 {
  margin-top: 0 !important;
}

.bsb-tm-video-header-bar {
  position: relative;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(320px, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 54px;
  padding: var(--bsb-compact-header-padding);
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(248, 250, 252, 0.56)),
    rgba(255, 255, 255, 0.46);
  box-shadow:
    0 18px 42px rgba(15, 23, 42, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.76),
    inset 0 -1px 0 rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(24px) saturate(165%);
  pointer-events: auto;
  transition:
    box-shadow 220ms var(--bsb-ease-swift),
    transform 260ms var(--bsb-ease-spring),
    border-color 220ms var(--bsb-ease-swift);
}

.bsb-tm-video-header-bar::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.42), transparent 48%);
  pointer-events: none;
}

.bsb-tm-video-header-search,
.bsb-tm-video-header-profile {
  min-width: 0;
}

.bsb-tm-video-header-profile {
  display: flex;
  justify-content: flex-end;
}

.bsb-tm-video-header-fallback-search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.bsb-tm-video-header-fallback-search input,
.bsb-tm-video-header-fallback-search button,
.bsb-tm-video-header-profile-link {
  appearance: none;
  -webkit-appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.7)),
    rgba(255, 255, 255, 0.52);
  color: #0f172a;
  font: inherit;
  text-decoration: none;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.76),
    0 10px 24px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(18px) saturate(150%);
  transition:
    box-shadow 220ms var(--bsb-ease-swift),
    transform 260ms var(--bsb-ease-spring),
    border-color 220ms var(--bsb-ease-swift),
    background 220ms var(--bsb-ease-swift),
    filter 180ms var(--bsb-ease-swift);
}

.bsb-tm-video-header-fallback-search input {
  min-width: 0;
  padding: 11px 14px;
  font: 500 15px/1.2 "SF Pro Text", "PingFang SC", sans-serif;
}

.bsb-tm-video-header-fallback-search button {
  padding: 11px 14px;
  font: 600 13px/1 "SF Pro Text", "PingFang SC", sans-serif;
}

.bsb-tm-video-header-profile-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  min-height: 42px;
  padding: 0 10px;
  border-radius: 999px;
}

.bsb-tm-video-header-fallback-search input:hover,
.bsb-tm-video-header-fallback-search button:hover,
.bsb-tm-video-header-profile-link:hover,
.bsb-tm-video-header-fallback-search input:focus,
.bsb-tm-video-header-fallback-search button:focus,
.bsb-tm-video-header-profile-link:focus {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.24);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 14px 30px rgba(15, 23, 42, 0.1),
    0 0 0 3px rgba(var(--bsb-brand-blue-rgb), 0.08);
  transform: translateY(-1px);
}

.bsb-tm-video-header-fallback-search button:active,
.bsb-tm-video-header-profile-link:active {
  transform: scale(0.98);
}

.bsb-tm-video-header-profile-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bsb-tm-video-header-avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  object-fit: cover;
  display: block;
}

.bsb-tm-video-header-profile-fallback svg {
  width: 18px;
  height: 18px;
}

@media (max-width: 900px) {
  .bsb-tm-video-header-compact {
    --bsb-compact-header-gap: 8px;
    --bsb-compact-header-padding: 8px;
    --bsb-compact-header-estimated-height: 58px;
  }

  .bsb-tm-panel {
    width: min(calc(var(--bsb-tm-panel-vw) - 12px), 920px);
    height: min(var(--bsb-tm-panel-height, calc(var(--bsb-tm-panel-vh) - 12px)), calc(var(--bsb-tm-panel-vh) - 12px));
    max-height: calc(var(--bsb-tm-panel-vh) - 12px);
  }

  .bsb-tm-panel-body {
    grid-template-columns: 1fr;
  }

  .bsb-tm-panel-nav {
    grid-auto-flow: column;
    grid-auto-columns: minmax(140px, 1fr);
    overflow: auto;
    border-right: none;
    border-bottom: 1px solid var(--bsb-border);
    padding: 14px 16px;
  }

  .bsb-tm-video-header-shell {
    width: calc(100vw - (var(--bsb-compact-header-gap) * 2));
  }

  .bsb-tm-video-header-bar {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    padding: var(--bsb-compact-header-padding);
  }
}

@media (max-width: 768px) {
  .bsb-tm-video-header-compact {
    --bsb-compact-header-gap: 8px;
    --bsb-compact-header-padding: 8px;
    --bsb-compact-header-estimated-height: 54px;
  }

  .bsb-tm-panel-header {
    padding: 16px 18px 14px;
  }

  .bsb-tm-panel-header-actions {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .bsb-tm-panel-content {
    padding: 16px;
  }

  .bsb-tm-form-group,
  .bsb-tm-summary-line,
  .bsb-tm-field,
  .bsb-tm-category-row,
  .bsb-tm-feature-card,
  .bsb-tm-info-box,
  .bsb-tm-link-card {
    padding: 12px 14px;
  }

  .bsb-tm-categories,
  .bsb-tm-overview-grid,
  .bsb-tm-help-grid,
  .bsb-tm-field-grid {
    grid-template-columns: 1fr;
  }

  .bsb-tm-notice-root {
    width: min(340px, calc(100vw - 24px));
    right: 12px;
    top: var(--bsb-notice-top);
    bottom: auto;
  }

  .bsb-tm-title-popover {
    width: min(320px, calc(100vw - 24px));
  }

  .sponsorThumbnailLabel {
    height: 24px;
    min-width: 24px;
    font-size: 10px;
  }

  .sponsorThumbnailLabel .bsb-tm-thumbnail-short-label,
  .sponsorThumbnailLabel .bsb-tm-thumbnail-label {
    font-size: 10px;
  }

  .bsb-tm-video-header-shell {
    top: var(--bsb-compact-header-gap);
    width: calc(100vw - (var(--bsb-compact-header-gap) * 2));
  }

  .bsb-tm-video-header-bar {
    min-height: 48px;
    padding: var(--bsb-compact-header-padding);
    border-radius: 18px;
  }

  .bsb-tm-video-header-profile-link {
    min-width: 38px;
    min-height: 38px;
    padding: 0 8px;
  }

  .bsb-tm-video-header-avatar {
    width: 30px;
    height: 30px;
  }
}

`;

export const mbgaStyles = ``;
