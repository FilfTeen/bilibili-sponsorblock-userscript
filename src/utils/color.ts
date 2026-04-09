import type { Category, CategoryColorOverrides } from "../types";
import { CATEGORY_COLORS } from "../constants";

type RGB = {
  r: number;
  g: number;
  b: number;
};

export type TransparentGlassVariant = "dark" | "light";

const NEAR_WHITE_LUMINANCE_THRESHOLD = 0.82;
const NEAR_WHITE_MIN_CHANNEL = 232;

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function normalizeHexColor(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const input = value.trim();
  const shortHex = /^#([0-9a-f]{3})$/iu.exec(input);
  if (shortHex) {
    const [r, g, b] = shortHex[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  const fullHex = /^#([0-9a-f]{6})$/iu.exec(input);
  if (fullHex) {
    return `#${fullHex[1].toLowerCase()}`;
  }

  return null;
}

export function hexToRgb(hexColor: string): RGB {
  const normalized = normalizeHexColor(hexColor);
  if (!normalized) {
    throw new Error(`Invalid hex color: ${hexColor}`);
  }

  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16)
  };
}

export function rgba(hexColor: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hexColor);
  const normalizedAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha})`;
}

export function mixColors(hexColor: string, mixWith: string, ratio: number): string {
  const base = hexToRgb(hexColor);
  const mix = hexToRgb(mixWith);
  const normalizedRatio = Math.max(0, Math.min(1, ratio));
  const inverseRatio = 1 - normalizedRatio;

  const r = clampChannel(base.r * inverseRatio + mix.r * normalizedRatio);
  const g = clampChannel(base.g * inverseRatio + mix.g * normalizedRatio);
  const b = clampChannel(base.b * inverseRatio + mix.b * normalizedRatio);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
    .toString(16)
    .padStart(2, "0")}`;
}

function relativeLuminance({ r, g, b }: RGB): number {
  const channel = (value: number): number => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function getReadableTextColor(hexColor: string): string {
  return relativeLuminance(hexToRgb(hexColor)) > 0.56 ? "#0f172a" : "#ffffff";
}

export function isNearWhiteColor(hexColor: string): boolean {
  const rgb = hexToRgb(hexColor);
  return (
    relativeLuminance(rgb) > NEAR_WHITE_LUMINANCE_THRESHOLD &&
    Math.min(rgb.r, rgb.g, rgb.b) >= NEAR_WHITE_MIN_CHANNEL
  );
}

export function resolveTransparentGlassVariant(hexColor: string): TransparentGlassVariant {
  return isNearWhiteColor(hexColor) ? "light" : "dark";
}

export function resolveGlassDisplayAccent(hexColor: string): string {
  return isNearWhiteColor(hexColor) ? mixColors(hexColor, "#94a3b8", 0.72) : hexColor;
}

export type CategoryStyle = {
  accent: string;
  accentStrong: string;
  contrast: string;
  darkContrast: string;
  softSurface: string;
  softBorder: string;
  glassSurface: string;
  glassBorder: string;
  darkSurface: string;
  transparentVariant: TransparentGlassVariant;
  transparentDisplayAccent: string;
};

export function resolveCategoryAccent(category: Category, overrides?: CategoryColorOverrides): string {
  return normalizeHexColor(overrides?.[category]) ?? CATEGORY_COLORS[category];
}

export function resolveCategoryStyle(category: Category, overrides?: CategoryColorOverrides): CategoryStyle {
  const accent = resolveCategoryAccent(category, overrides);
  const accentStrong = mixColors(accent, "#0f172a", 0.12);
  const transparentVariant = resolveTransparentGlassVariant(accent);
  return {
    accent,
    accentStrong,
    contrast: getReadableTextColor(accent),
    darkContrast: getReadableTextColor(accentStrong),
    softSurface: rgba(accent, 0.16),
    softBorder: rgba(accent, 0.3),
    glassSurface: mixColors(accent, "#ffffff", 0.86),
    glassBorder: rgba(accent, 0.4),
    darkSurface: rgba(accentStrong, 0.88),
    transparentVariant,
    transparentDisplayAccent: resolveGlassDisplayAccent(accent)
  };
}
