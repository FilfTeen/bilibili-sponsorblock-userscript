export const styles = `
.bsb-tm-entry-button {
  z-index: 2147483645;
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  background: rgba(25, 25, 25, 0.86);
  color: #fff;
  font: 600 12px/1.2 "SF Pro Display", "PingFang SC", sans-serif;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.bsb-tm-entry-button.is-inline {
  position: absolute;
  top: 16px;
  right: 16px;
}

.bsb-tm-entry-button.is-floating {
  position: fixed;
  right: 24px;
  bottom: 24px;
}

.bsb-tm-panel {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 2147483646;
  width: min(420px, calc(100vw - 32px));
  max-height: calc(100vh - 48px);
  overflow: auto;
  border-radius: 18px;
  background: rgba(17, 19, 27, 0.96);
  color: #f8f8f8;
  padding: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(18px);
  display: none;
  font: 14px/1.45 "SF Pro Text", "PingFang SC", sans-serif;
}

.bsb-tm-panel.is-open {
  display: block;
}

.bsb-tm-panel-header,
.bsb-tm-field,
.bsb-tm-category-row,
.bsb-tm-notice-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.bsb-tm-field.stacked {
  align-items: stretch;
  flex-direction: column;
}

.bsb-tm-panel-section + .bsb-tm-panel-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.bsb-tm-form,
.bsb-tm-categories {
  display: grid;
  gap: 12px;
}

.bsb-tm-section-label {
  display: block;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.88);
}

.bsb-tm-button,
.bsb-tm-panel input,
.bsb-tm-panel select {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  padding: 8px 10px;
  font: inherit;
}

.bsb-tm-button {
  cursor: pointer;
}

.bsb-tm-button.compact {
  justify-self: start;
}

.bsb-tm-button.primary {
  background: #00a1d6;
  border-color: #00a1d6;
}

.bsb-tm-button.danger {
  background: #8b2131;
  border-color: #8b2131;
}

.bsb-tm-button.secondary {
  background: rgba(255, 255, 255, 0.08);
}

.bsb-tm-banner {
  margin-bottom: 10px;
  border-radius: 14px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(0, 161, 214, 0.12), rgba(255, 102, 153, 0.18));
  border: 1px solid rgba(0, 161, 214, 0.24);
  color: #0f172a;
  font: 600 13px/1.3 "SF Pro Text", "PingFang SC", sans-serif;
}

.bsb-tm-notice-root {
  position: fixed;
  top: 24px;
  left: 24px;
  z-index: 2147483647;
  display: grid;
  gap: 12px;
  max-width: min(360px, calc(100vw - 32px));
}

.bsb-tm-notice {
  border-radius: 16px;
  padding: 14px;
  background: rgba(11, 15, 23, 0.94);
  color: #fff;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(18px);
}

.bsb-tm-notice-title {
  font-weight: 700;
}

.bsb-tm-notice-message {
  margin-top: 6px;
  opacity: 0.85;
}

@media (max-width: 768px) {
  .bsb-tm-entry-button.is-floating {
    right: 16px;
    bottom: 16px;
  }

  .bsb-tm-panel {
    top: 12px;
    right: 12px;
    width: min(420px, calc(100vw - 24px));
    max-height: calc(100vh - 24px);
  }

  .bsb-tm-notice-root {
    top: 16px;
    left: 16px;
    max-width: calc(100vw - 32px);
  }
}
`;
