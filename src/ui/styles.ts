import { inlineFeedbackStyles } from "./inline-feedback";

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
    0 10px 24px rgba(15, 23, 42, 0.06),
    inset 0 0 0 1px rgba(255, 255, 255, 0.28);
  transition:
    background 220ms var(--bsb-ease-swift),
    box-shadow 220ms var(--bsb-ease-swift),
    border-color 220ms var(--bsb-ease-swift),
    color 220ms var(--bsb-ease-swift),
    transform 260ms var(--bsb-ease-spring);
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
    0 12px 24px rgba(15, 23, 42, 0.08),
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
    0 18px 38px rgba(15, 23, 42, 0.08),
    inset 0 0 0 1px rgba(148, 163, 184, 0.12);
  backdrop-filter: blur(14px) saturate(140%);
  transition:
    box-shadow 220ms var(--bsb-ease-swift),
    border-color 220ms var(--bsb-ease-swift),
    background 220ms var(--bsb-ease-swift),
    transform 220ms var(--bsb-ease-fluid);
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
  gap: 10px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid var(--bsb-border-soft);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(243, 247, 251, 0.64)),
    rgba(248, 250, 252, 0.66);
  box-shadow:
    var(--bsb-glass-inner),
    inset 0 0 0 1px rgba(148, 163, 184, 0.08);
}

.bsb-tm-color-preview {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  border-radius: 999px;
  padding: 5px 10px;
  color: var(--bsb-text-primary);
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.96);
}

.bsb-tm-color-preview::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--bsb-color-preview, #0f172a);
}

.bsb-tm-color-controls {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  gap: 10px;
}

.bsb-tm-color-controls input[type="color"] {
  width: 46px;
  min-width: 46px;
  height: 38px;
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
    0 12px 24px rgba(15, 23, 42, 0.05),
    inset 0 0 0 1px rgba(148, 163, 184, 0.08);
  transition:
    box-shadow 220ms var(--bsb-ease-swift),
    border-color 220ms var(--bsb-ease-swift),
    background 220ms var(--bsb-ease-swift),
    transform 220ms var(--bsb-ease-fluid);
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
  appearance: auto;
  -webkit-appearance: checkbox;
  width: 18px;
  min-width: 18px;
  height: 18px;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 6px;
  background: none;
  box-shadow: none;
  accent-color: var(--bsb-brand-blue);
  align-self: center;
  cursor: pointer;
  transition: none;
}

.bsb-tm-panel input.bsb-tm-switch::before {
  display: none;
}

.bsb-tm-panel input.bsb-tm-switch:hover,
.bsb-tm-panel input.bsb-tm-switch:focus,
.bsb-tm-panel input.bsb-tm-switch:active,
.bsb-tm-panel input.bsb-tm-switch:checked {
  border: none;
  background: none;
  box-shadow: none;
  transform: none;
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
  top: 24px;
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
  right: 16px;
  bottom: 16px;
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

.bsb-tm-title-layout {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;
  overflow: visible;
}

.bsb-tm-title-accessories {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: none;
  overflow: visible;
}

.bsb-tm-title-text {
  min-width: 0;
  flex: 1 1 auto;
}

.bsb-tm-title-row {
  display: flex !important;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  overflow: visible;
}

.bsb-tm-title-pill-wrap {
  display: inline-flex;
  align-items: center;
  overflow: visible;
  position: relative;
  isolation: isolate;
  padding-block: 7px;
  margin-block: -7px;
}

.bsb-tm-title-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 999px;
  border: 1px solid var(--bsb-category-glass-border, rgba(255, 255, 255, 0.2));
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.18), transparent 34%),
    linear-gradient(180deg, var(--bsb-category-accent, #2f9e72), var(--bsb-category-accent-strong, #257e59));
  color: var(--bsb-category-contrast, #fff);
  padding: 7px 13px;
  font: 650 13px/1.1 var(--bsb-font-display);
  letter-spacing: 0.01em;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    0 6px 12px rgba(15, 23, 42, 0.06);
  transition:
    box-shadow 220ms var(--bsb-ease-swift),
    filter 220ms var(--bsb-ease-swift),
    background 220ms var(--bsb-ease-swift),
    border-color 220ms var(--bsb-ease-swift),
    transform 220ms var(--bsb-ease-fluid);
}

.bsb-tm-title-pill:hover,
.bsb-tm-title-pill[aria-expanded="true"] {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 10px 20px rgba(15, 23, 42, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.08);
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

.sponsorThumbnailLabel[data-placement="corner"] {
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

.bsb-tm-thumbnail-slot[data-placement="corner"] .sponsorThumbnailLabelVisible {
  --bsb-thumbnail-expanded-padding: 11px;
}

.sponsorThumbnailLabel::before {
  content: "";
  position: absolute;
  left: 9px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  opacity: 0.85;
  box-shadow: 0 0 4px color-mix(in srgb, currentColor 40%, transparent);
  flex-shrink: 0;
}

.sponsorThumbnailLabel[data-placement="corner"]::before {
  left: 7px;
}

.sponsorThumbnailLabel .bsb-tm-thumbnail-text-stack {
  --bsb-thumbnail-current-text-width: var(--bsb-thumbnail-collapsed-text-width, 1em);
  grid-column: 2;
  grid-row: 1;
  position: relative;
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
  transition:
    opacity 180ms var(--bsb-ease-swift),
    transform 280ms var(--bsb-ease-fluid);
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
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 10px;
  font-weight: 650;
  color: inherit;
  line-height: 1;
  white-space: nowrap;
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
.bsb-tm-panel input:not(.bsb-tm-switch):hover,
.bsb-tm-panel select:hover {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.28);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 14px 30px rgba(15, 23, 42, 0.09);
  transform: translateY(-1px);
}

.bsb-tm-field:hover,
.bsb-tm-category-row:hover {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.22);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 14px 28px rgba(15, 23, 42, 0.08),
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

.bsb-tm-panel input:not(.bsb-tm-switch):focus,
.bsb-tm-panel select:focus {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.3);
  box-shadow:
    0 0 0 4px rgba(var(--bsb-brand-blue-rgb), 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.68);
}

.bsb-tm-form-group:hover,
.bsb-tm-form-group:focus-within {
  border-color: rgba(255, 255, 255, 0.82);
  box-shadow:
    var(--bsb-glass-inner),
    0 24px 50px rgba(15, 23, 42, 0.12),
    inset 0 0 0 1px rgba(var(--bsb-brand-blue-rgb), 0.08);
}

.bsb-tm-link-card:hover {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.22);
  transform: translateY(-1px);
}

.bsb-tm-field:focus-within,
.bsb-tm-category-row:focus-within,
.bsb-tm-link-card:focus-visible {
  border-color: rgba(var(--bsb-brand-blue-rgb), 0.3);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    0 16px 34px rgba(15, 23, 42, 0.08),
    0 0 0 3px rgba(var(--bsb-brand-blue-rgb), 0.08);
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

.bsb-tm-video-header-compact .bili-header.fixed-header {
  opacity: 0 !important;
  pointer-events: none !important;
  height: 0 !important;
  overflow: hidden !important;
}

.bsb-tm-video-header-compact .bili-header__bar.mini-header {
  opacity: 0 !important;
  pointer-events: none !important;
}

.bsb-tm-video-header-shell,
.player-full-win .bsb-tm-video-header-shell,
.player-fullscreen .bsb-tm-video-header-shell {
  display: none;
}

.bsb-tm-video-header-compact .bsb-tm-video-header-shell {
  display: block;
  position: fixed;
  top: 6px;
  left: 50%;
  z-index: 1100;
  width: min(1160px, calc(100vw - 28px));
  transform: translateX(-50%);
  pointer-events: none;
}

.player-full-win .bsb-tm-video-header-shell,
.player-fullscreen .bsb-tm-video-header-shell {
  display: none !important;
}

.bsb-tm-video-header-compact .video-container-v1 {
  margin-top: 10px !important;
}

.player-full-win .video-container-v1,
.player-fullscreen .video-container-v1 {
  margin-top: 0 !important;
}

.bsb-tm-video-header-bar {
  position: relative;
  display: grid;
  grid-template-columns: minmax(320px, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 54px;
  padding: 7px 14px;
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
    width: calc(100vw - 20px);
  }

  .bsb-tm-video-header-bar {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    padding: 8px 12px;
  }
}

@media (max-width: 768px) {
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
    bottom: 160px;
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
    top: 6px;
    width: calc(100vw - 16px);
  }

  .bsb-tm-video-header-bar {
    min-height: 52px;
    padding: 6px 10px;
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

export const mbgaStyles = `
/* MBGA Simplify UI */
html, body { -webkit-filter: none !important; filter: none !important; }
.adblock-tips, .feed-card:has(.bili-video-card>div:empty) { display: none !important; }
.ad-report, a[href*="cm.bilibili.com"] { display: none !important; }
.feed2 .feed-card:has(a[href*="cm.bilibili.com"]), .feed2 .feed-card:has(.bili-video-card:empty) { display: none !important; }
.feed2 .container > * { margin-top: 0 !important; }

/* Dynamic Page Wide Mode */
html[wide] #app { display: flex; }
html[wide] .bili-dyn-home--member { box-sizing: border-box; padding: 0 10px; width: 100%; flex: 1; }
html[wide] .bili-dyn-content { width: initial; }
html[wide] main { margin: 0 8px; flex: 1; overflow: hidden; width: initial; }
.bili-dyn-list__item:has(.bili-dyn-card-goods), .bili-dyn-list__item:has(.bili-rich-text-module.goods) { display: none !important; }

/* Live Room Fixes */
div[data-cy=EvaRenderer_LayerWrapper]:has(.player) { z-index: 999999 !important; }
.fixedPageBackground_root { z-index: 999999 !important; }
#welcome-area-bottom-vm, .web-player-icon-roomStatus { display: none !important; }

/* Video Fit Mode */
body[video-fit] #bilibili-player video { object-fit: cover !important; }
.bpx-player-ctrl-setting-fit-mode { display: flex; width: 100%; height: 32px; line-height: 32px; }
.bpx-player-ctrl-setting-box .bui-panel-wrap, .bpx-player-ctrl-setting-box .bui-panel-item { min-height: 172px !important; }
`;
