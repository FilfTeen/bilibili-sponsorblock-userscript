export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundMinutes(seconds: number): number {
  return Math.round((seconds / 60) * 100) / 100;
}
