export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("");
}

export async function getHashPrefix(value: string, length = 4): Promise<string> {
  const digest = await sha256Hex(value);
  return digest.slice(0, length);
}
