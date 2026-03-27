export function normalizeServerAddress(rawValue: string | null | undefined): string | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = new URL(rawValue.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    parsed.username = "";
    parsed.password = "";
    parsed.hash = "";
    parsed.search = "";

    return parsed.toString().replace(/\/+$/u, "");
  } catch (_error) {
    return null;
  }
}
