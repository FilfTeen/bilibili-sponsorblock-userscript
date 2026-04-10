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
      `  background: linear-gradient(\n` +
      `    180deg,\n` +
      `    color-mix(in srgb, ${accentExpression} 7%, rgba(255, 255, 255, 0.18)),\n` +
      `    color-mix(in srgb, ${accentExpression} 10%, rgba(255, 255, 255, 0.04))\n` +
      `  );\n` +
      `  border: 1px solid color-mix(in srgb, ${accentExpression} 16%, rgba(255, 255, 255, 0.12));\n` +
      `  box-shadow:\n` +
      `    inset 0 1px 0 rgba(255, 255, 255, 0.16),\n` +
      `    inset 0 -1px 0 color-mix(in srgb, ${accentExpression} 8%, rgba(15, 23, 42, 0.05)),\n` +
      `    0 5px 12px rgba(15, 23, 42, 0.04),\n` +
      `    0 10px 20px rgba(15, 23, 42, 0.018);\n` +
      `  backdrop-filter: none;`,
    overlay:
      `  content: "";\n` +
      `  position: absolute;\n` +
      `  inset: 0;\n` +
      `  border-radius: inherit;\n` +
      `  pointer-events: none;\n` +
      `  background:\n` +
      `    radial-gradient(circle at 18% 8%, color-mix(in srgb, ${accentExpression} 22%, rgba(255, 255, 255, 0.26)) 0%, transparent 36%),\n` +
      `    radial-gradient(circle at 78% 120%, color-mix(in srgb, ${accentExpression} 14%, rgba(15, 23, 42, 0.1)) 0%, transparent 46%),\n` +
      `    linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.035) 34%, transparent 62%),\n` +
      `    linear-gradient(\n` +
      `      180deg,\n` +
      `      color-mix(in srgb, ${accentExpression} 14%, rgba(255, 255, 255, 0.28)),\n` +
      `      color-mix(in srgb, ${accentExpression} 22%, rgba(231, 238, 245, 0.12))\n` +
      `    ),\n` +
      `    linear-gradient(112deg, transparent 14%, rgba(255, 255, 255, 0.14) 24%, rgba(255, 255, 255, 0.03) 32%, transparent 42%);\n` +
      `  opacity: 0.82;\n` +
      `  backdrop-filter: blur(7px) saturate(148%) brightness(1.04);\n` +
      `  mix-blend-mode: screen;`
  };
}
