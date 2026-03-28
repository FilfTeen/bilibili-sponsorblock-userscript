import { USER_ID_STORAGE_KEY } from "../constants";
import { gmGetValue, gmSetValue } from "../platform/gm";

function generateUserId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const random = Math.random().toString(36).slice(2);
  return `bsb-${Date.now().toString(36)}-${random}`;
}

export async function ensureUserId(): Promise<string> {
  const existing = await gmGetValue<string | null>(USER_ID_STORAGE_KEY, null);
  if (typeof existing === "string" && existing.trim().length > 0) {
    return existing;
  }

  const created = generateUserId();
  await gmSetValue(USER_ID_STORAGE_KEY, created);
  return created;
}
