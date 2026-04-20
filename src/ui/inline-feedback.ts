import { resolveTransparentGlassVariant } from "../utils/color";
import { createSurfaceFrostedGlassMaterial } from "./surface-frosted-glass";

export type InlineTone = "danger" | "warning" | "success" | "info";
export type InlineLayout = "inline" | "stack";
export type InlineToggleState = "hidden" | "shown";
export type InlineBadgeAppearance = "solid" | "glass";

type InlineToggleLabels = {
  hidden: string;
  shown: string;
};

const INLINE_STYLE_ATTR = "data-bsb-inline-feedback-style";
const DEFAULT_TONE_ACCENTS: Record<InlineTone, string> = {
  danger: "#ff6b66",
  warning: "#ffd56a",
  success: "#4ade80",
  info: "#60a5fa"
};

const inlineSurfaceFrostedGlass = createSurfaceFrostedGlassMaterial({
  accentExpression: "var(--bsb-inline-accent)",
  textVariable: "--bsb-inline-text"
});

export const inlineFeedbackStyles = `
.bsb-tm-inline-chip,
.bsb-tm-inline-toggle {
  font-family: "SF Pro Text", "PingFang SC", sans-serif;
  font-kerning: normal;
  font-feature-settings: "kern" 1;
  font-synthesis-weight: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

.bsb-tm-inline-chip {
  --bsb-inline-accent: #ff6b6b;
  --bsb-inline-surface: rgba(45, 55, 72, 0.94);
  --bsb-inline-surface-strong: rgba(29, 37, 52, 0.98);
  --bsb-inline-text: #f8fafc;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  max-width: min(100%, 24rem);
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background:
    radial-gradient(circle at 20% 18%, rgba(255, 255, 255, 0.18), transparent 38%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.09), transparent 52%),
    linear-gradient(180deg, var(--bsb-inline-surface), var(--bsb-inline-surface-strong));
  color: var(--bsb-inline-text);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    inset 0 -1px 0 rgba(15, 23, 42, 0.22),
    0 10px 20px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(16px) saturate(155%);
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.01em;
  line-height: 1.1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bsb-tm-inline-chip[data-appearance="glass"] {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.bsb-tm-inline-chip[data-appearance="glass"][data-glass-context="surface"] {
${inlineSurfaceFrostedGlass.base}
}

.bsb-tm-inline-chip[data-appearance="glass"][data-glass-context="surface"]::after {
${inlineSurfaceFrostedGlass.overlay}
  z-index: 0;
}

.bsb-tm-inline-chip::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 999px;
  flex: none;
  background: var(--bsb-inline-accent);
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.14),
    0 0 14px color-mix(in srgb, var(--bsb-inline-accent) 72%, transparent);
  position: relative;
  z-index: 1;
}

.bsb-tm-inline-chip[data-appearance="glass"][data-glass-context="surface"]::before {
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.24),
    0 0 10px color-mix(in srgb, var(--bsb-inline-accent) 38%, transparent);
}

.bsb-tm-inline-chip__label {
  position: relative;
  z-index: 1;
}

.bsb-tm-inline-chip--inline,
.bsb-tm-inline-toggle--inline {
  margin-inline-start: 8px;
}

.bsb-tm-inline-chip--stack,
.bsb-tm-inline-toggle--stack {
  margin-top: 8px;
}

.bsb-tm-inline-chip[data-tone="danger"] {
  --bsb-inline-accent: #ff6b66;
  --bsb-inline-surface: rgba(130, 41, 41, 0.94);
  --bsb-inline-surface-strong: rgba(104, 28, 28, 0.98);
}

.bsb-tm-inline-chip[data-tone="warning"] {
  --bsb-inline-accent: #ffd56a;
  --bsb-inline-surface: rgba(109, 74, 20, 0.94);
  --bsb-inline-surface-strong: rgba(82, 53, 13, 0.98);
}

.bsb-tm-inline-chip[data-tone="success"] {
  --bsb-inline-accent: #4ade80;
  --bsb-inline-surface: rgba(25, 101, 73, 0.94);
  --bsb-inline-surface-strong: rgba(18, 76, 55, 0.98);
}

.bsb-tm-inline-chip[data-tone="info"] {
  --bsb-inline-accent: #60a5fa;
  --bsb-inline-surface: rgba(30, 88, 153, 0.94);
  --bsb-inline-surface-strong: rgba(21, 66, 118, 0.98);
}

.bsb-tm-inline-toggle {
  appearance: none;
  -webkit-appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  min-height: 30px;
  padding: 8px 13px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(245, 248, 252, 0.78)),
    rgba(247, 250, 252, 0.84);
  color: #0f172a;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    0 8px 18px rgba(15, 23, 42, 0.08);
  font-size: 12px;
  font-weight: 650;
  line-height: 1.1;
  letter-spacing: 0.01em;
  text-align: center;
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
  cursor: pointer;
  transition:
    box-shadow 200ms cubic-bezier(0.2, 0.8, 0.2, 1),
    background 200ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 200ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1),
    color 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bsb-tm-inline-toggle[data-state="hidden"] {
  border-color: rgba(59, 130, 246, 0.2);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(247, 250, 252, 0.84)),
    rgba(59, 130, 246, 0.08);
}

.bsb-tm-inline-toggle[data-state="shown"] {
  border-color: rgba(239, 68, 68, 0.22);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(252, 246, 246, 0.86)),
    rgba(239, 68, 68, 0.08);
}

.bsb-tm-inline-toggle:hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 12px 22px rgba(15, 23, 42, 0.1);
  transform: translateY(-1px);
}

.bsb-tm-inline-toggle:active {
  transform: scale(0.985);
}

.bsb-tm-inline-toggle:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(0, 174, 236, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.bsb-tm-inline-toggle:disabled {
  cursor: default;
  opacity: 0.72;
  transform: none;
}

.bsb-tm-inline-toggle:disabled:hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    0 8px 18px rgba(15, 23, 42, 0.08);
  transform: none;
}

.bsb-tm-inline-feedback-menu {
  --bsb-inline-feedback-menu-accent: #60a5fa;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-inline-start: 8px;
  padding: 2px;
  border: 1px solid transparent;
  border-radius: 999px;
  vertical-align: middle;
  white-space: nowrap;
  isolation: isolate;
  transition:
    background 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bsb-tm-inline-feedback-menu[data-open="true"] {
  background:
    radial-gradient(circle at 16% 10%, color-mix(in srgb, var(--bsb-inline-feedback-menu-accent) 16%, rgba(255, 255, 255, 0.34)), transparent 44%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.68), rgba(244, 248, 255, 0.42));
  border-color: color-mix(in srgb, var(--bsb-inline-feedback-menu-accent) 16%, rgba(148, 163, 184, 0.22));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 8px 18px rgba(15, 23, 42, 0.08);
}

.bsb-tm-inline-feedback-menu[data-disabled="true"] {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(245, 248, 252, 0.48)),
    rgba(148, 163, 184, 0.08);
  border-color: rgba(148, 163, 184, 0.2);
}

.bsb-tm-inline-feedback-menu .bsb-tm-inline-toggle {
  min-height: 24px;
  padding: 5px 9px;
  font-size: 11px;
}

.bsb-tm-inline-feedback-menu .bsb-tm-inline-toggle--inline {
  margin-inline-start: 0;
}

.bsb-tm-inline-feedback-menu__choices {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-inline-size: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  transform: translateX(-6px) scale(0.96);
  transform-origin: left center;
  clip-path: inset(0 100% 0 0 round 999px);
  transition:
    max-inline-size 260ms cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 180ms ease,
    transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1),
    clip-path 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bsb-tm-inline-feedback-menu[data-open="true"] .bsb-tm-inline-feedback-menu__choices {
  max-inline-size: 96px;
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0) scale(1);
  clip-path: inset(0 0 0 0 round 999px);
}
`;

export function ensureInlineFeedbackStyles(root: ShadowRoot): void {
  if (root.querySelector(`style[${INLINE_STYLE_ATTR}]`)) {
    return;
  }

  const style = document.createElement("style");
  style.setAttribute(INLINE_STYLE_ATTR, "true");
  style.textContent = inlineFeedbackStyles;
  root.prepend(style);
}

export function createInlineBadge(
  attrName: string,
  text: string,
  tone: InlineTone,
  layout: InlineLayout,
  customColor?: string,
  appearance: InlineBadgeAppearance = "solid"
): HTMLDivElement {
  const badge = document.createElement("div");
  const label = document.createElement("span");
  const accent = customColor ?? DEFAULT_TONE_ACCENTS[tone];
  badge.className = `bsb-tm-inline-chip bsb-tm-inline-chip--${layout}`;
  badge.setAttribute(attrName, "true");
  badge.dataset.tone = tone;
  badge.dataset.appearance = appearance;
  badge.dataset.glassVariant = resolveTransparentGlassVariant(accent);
  if (appearance === "glass") {
    badge.dataset.glassContext = "surface";
  }
  badge.title = text;
  label.className = "bsb-tm-inline-chip__label";
  label.textContent = text;
  badge.append(label);
  if (customColor) {
    badge.style.setProperty("--bsb-inline-accent", customColor);
    // Use color-mix to derive surfaces for glassmorphism
    badge.style.setProperty("--bsb-inline-surface", `color-mix(in srgb, ${customColor} 20%, rgba(45, 55, 72, 0.94))`);
    badge.style.setProperty("--bsb-inline-surface-strong", `color-mix(in srgb, ${customColor} 28%, rgba(29, 37, 52, 0.98))`);
  }
  return badge;
}

export function createInlineToggle(
  attrName: string,
  onClick: () => void,
  layout: InlineLayout
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `bsb-tm-inline-toggle bsb-tm-inline-toggle--${layout}`;
  button.setAttribute(attrName, "true");
  button.addEventListener("click", onClick);
  return button;
}

export function setInlineToggleState(
  button: HTMLButtonElement,
  state: InlineToggleState,
  labels: InlineToggleLabels
): void {
  button.dataset.state = state;
  button.setAttribute("aria-pressed", String(state === "shown"));
  button.textContent = state === "shown" ? labels.shown : labels.hidden;
}
