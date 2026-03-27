export const styles = `
:root {
  --bsb-brand-blue: #00aeec;
  --bsb-dark-surface: rgba(28, 28, 28, 0.92);
  --bsb-light-surface: rgba(255, 255, 255, 0.96);
  --bsb-shadow: 0 18px 44px rgba(15, 23, 42, 0.22);
}

.bsb-tm-panel-open {
  overflow: hidden;
}

.bsb-tm-panel-backdrop[hidden] {
  display: none !important;
}

.bsb-tm-panel-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483646;
  background: rgba(15, 23, 42, 0.32);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.bsb-tm-panel {
  width: min(720px, calc(100vw - 24px));
  max-height: min(88vh, 860px);
  overflow: auto;
  border-radius: 20px;
  background: var(--bsb-light-surface);
  color: #111827;
  box-shadow: 0 32px 72px rgba(15, 23, 42, 0.28);
  padding: 20px;
  font: 14px/1.5 "SF Pro Text", "PingFang SC", sans-serif;
}

.bsb-tm-panel-header,
.bsb-tm-field,
.bsb-tm-category-row,
.bsb-tm-summary-line,
.bsb-tm-notice-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.bsb-tm-panel-subtitle,
.bsb-tm-section-description,
.bsb-tm-field-help {
  color: #6b7280;
}

.bsb-tm-panel-subtitle {
  margin-top: 4px;
  font-size: 12px;
}

.bsb-tm-panel-section + .bsb-tm-panel-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.bsb-tm-section-heading {
  margin-bottom: 12px;
}

.bsb-tm-section-title,
.bsb-tm-section-label,
.bsb-tm-field-title {
  display: block;
  color: #111827;
}

.bsb-tm-section-description,
.bsb-tm-field-help,
.bsb-tm-validation-message {
  margin: 4px 0 0;
  font-size: 12px;
}

.bsb-tm-validation-message {
  color: #b91c1c;
}

.bsb-tm-stats,
.bsb-tm-form,
.bsb-tm-categories {
  display: grid;
  gap: 12px;
}

.bsb-tm-summary-line {
  align-items: baseline;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.04);
}

.bsb-tm-summary-line strong {
  font-size: 13px;
}

.bsb-tm-summary-line span {
  color: #374151;
  text-align: right;
}

.bsb-tm-field {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.04);
}

.bsb-tm-field.stacked {
  align-items: stretch;
  flex-direction: column;
}

.bsb-tm-field-copy,
.bsb-tm-input-label {
  display: grid;
  gap: 4px;
}

.bsb-tm-categories {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.bsb-tm-category-row {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.04);
}

.bsb-tm-button,
.bsb-tm-panel input,
.bsb-tm-panel select {
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #fff;
  color: inherit;
  padding: 9px 12px;
  font: inherit;
}

.bsb-tm-button {
  cursor: pointer;
}

.bsb-tm-button.compact {
  justify-self: start;
}

.bsb-tm-button.primary {
  background: var(--bsb-brand-blue);
  border-color: var(--bsb-brand-blue);
  color: #fff;
}

.bsb-tm-button.danger {
  background: #7f1d1d;
  border-color: #7f1d1d;
  color: #fff;
}

.bsb-tm-button.secondary {
  background: rgba(15, 23, 42, 0.05);
}

.bsb-tm-notice-root {
  position: absolute;
  right: 10px;
  bottom: 100px;
  z-index: 2147483645;
  display: grid;
  gap: 10px;
  width: min(360px, calc(100vw - 32px));
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
  pointer-events: auto;
  color: #fff;
  background: var(--bsb-dark-surface);
  border-radius: 8px;
  box-shadow: var(--bsb-shadow);
  overflow: hidden;
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
  color: rgba(255, 255, 255, 0.88);
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

.sponsorThumbnailLabel {
  display: none;
  position: absolute;
  top: 0;
  left: 0;
  margin: 8px;
  padding: 6px;
  border-radius: 999px;
  z-index: 5;
  background: var(--category-color, #000);
  opacity: 0.74;
  box-shadow: 0 0 8px 2px rgba(51, 51, 51, 0.45);
  font-size: 10px;
  align-items: center;
}

.sponsorThumbnailLabel.sponsorThumbnailLabelVisible {
  display: flex;
}

.sponsorThumbnailLabel svg {
  width: 18px;
  height: 18px;
  fill: var(--category-text-color, #fff);
}

.sponsorThumbnailLabel span {
  display: none;
  padding-left: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--category-text-color, #fff);
  white-space: nowrap;
}

.sponsorThumbnailLabel:hover {
  border-radius: 8px;
  opacity: 1;
}

.sponsorThumbnailLabel:hover span {
  display: inline;
}

@media (max-width: 768px) {
  .bsb-tm-panel {
    width: min(100vw - 16px, 720px);
    max-height: calc(100vh - 16px);
    padding: 16px;
  }

  .bsb-tm-categories {
    grid-template-columns: 1fr;
  }

  .bsb-tm-notice-root {
    width: min(340px, calc(100vw - 24px));
    right: 12px;
    bottom: 88px;
  }
}
`;
