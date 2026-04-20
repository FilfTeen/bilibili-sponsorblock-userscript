import { USER_ID_STORAGE_KEY } from "../constants";
import { gmGetValue, gmSetValue } from "../platform/gm";

const USER_ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const USER_ID_LENGTH = 36;

function generateUserId(): string {
  const bytes = new Uint8Array(USER_ID_LENGTH);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, (byte) => USER_ID_ALPHABET[byte % USER_ID_ALPHABET.length]).join("");
}

export async function ensureUserId(): Promise<string> {
  const existing = await gmGetValue<string | null>(USER_ID_STORAGE_KEY, null);
  if (typeof existing === "string" && existing.trim().length > 0) {
    // Existing IDs are part of the user's upstream voting identity; keep legacy UUIDs stable.
    return existing;
  }

  const created = generateUserId();
  await gmSetValue(USER_ID_STORAGE_KEY, created);
  return created;
}
