const XOR_CODE = BigInt("23442827791579");
const MASK_CODE = BigInt("2251799813685247");
const MAX_AVID = BigInt(1) << BigInt(51);
const BASE = BigInt(58);
const ALPHABET = "FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf";
const BVID_REGEX = /^BV1[a-zA-Z0-9]{9}$/u;

export function isBvid(value: string | null | undefined): value is string {
  return typeof value === "string" && BVID_REGEX.test(value);
}

export function avidToBvid(avid: number | string): string | null {
  const parsedAvid =
    typeof avid === "string"
      ? Number.parseInt(avid.replace(/^av/iu, ""), 10)
      : Number.isFinite(avid)
        ? avid
        : Number.NaN;

  if (!Number.isInteger(parsedAvid) || parsedAvid <= 0) {
    return null;
  }

  const buffer = ["B", "V", "1", "0", "0", "0", "0", "0", "0", "0", "0", "0"];
  let index = buffer.length - 1;
  let value = (MAX_AVID | BigInt(parsedAvid)) ^ XOR_CODE;

  while (value > BigInt(0) && index >= 0) {
    buffer[index] = ALPHABET[Number(value % BASE)];
    value /= BASE;
    index -= 1;
  }

  [buffer[3], buffer[9]] = [buffer[9], buffer[3]];
  [buffer[4], buffer[7]] = [buffer[7], buffer[4]];

  const bvid = buffer.join("");
  return isBvid(bvid) ? bvid : null;
}
