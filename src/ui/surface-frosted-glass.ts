type SurfaceFrostedGlassOptions = {
  accentExpression: string;
  textVariable?: string;
};

export function createSurfaceFrostedGlassMaterial(options: SurfaceFrostedGlassOptions): {
  base: string;
  overlay: string;
} {
  const { accentExpression, textVariable } = options;
  const textAssignment = textVariable ? `  ${textVariable}: #0f172a;\n` : "";

  return {
    base:
      `${textAssignment}` +
      `  background: linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.035));\n` +
      `  border: 1px solid color-mix(in srgb, ${accentExpression} 28%, rgba(255, 255, 255, 0.42));\n` +
      `  box-shadow:\n` +
      `    inset 0 1px 0 rgba(255, 255, 255, 0.74),\n` +
      `    inset 0 -1px 0 color-mix(in srgb, ${accentExpression} 18%, rgba(148, 163, 184, 0.05)),\n` +
      `    0 2px 6px rgba(15, 23, 42, 0.035),\n` +
      `    0 0 0 1px rgba(255, 255, 255, 0.08);\n` +
      `  backdrop-filter: none;`,
    overlay:
      `  content: "";\n` +
      `  position: absolute;\n` +
      `  inset: 0;\n` +
      `  border-radius: inherit;\n` +
      `  pointer-events: none;\n` +
      `  background:\n` +
      `    radial-gradient(circle at 16% -12%, color-mix(in srgb, ${accentExpression} 28%, rgba(255, 255, 255, 0.44)) 0%, transparent 32%),\n` +
      `    radial-gradient(circle at 82% 120%, color-mix(in srgb, ${accentExpression} 18%, rgba(15, 23, 42, 0.14)) 0%, transparent 46%),\n` +
      `    linear-gradient(180deg, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0.05) 32%, transparent 56%),\n` +
      `    linear-gradient(\n` +
      `      180deg,\n` +
      `      color-mix(in srgb, ${accentExpression} 14%, rgba(255, 255, 255, 0.1)),\n` +
      `      color-mix(in srgb, ${accentExpression} 22%, rgba(231, 238, 245, 0.07))\n` +
      `    ),\n` +
      `    linear-gradient(112deg, transparent 22%, rgba(255, 255, 255, 0.18) 30%, transparent 44%);\n` +
      `  opacity: 0.76;\n` +
      `  backdrop-filter: saturate(144%) brightness(1.03);\n` +
      `  mix-blend-mode: screen;`
  };
}
