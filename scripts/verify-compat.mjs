import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distFile = path.join(rootDir, "dist", "bilibili-qol-core.user.js");

const source = await readFile(distFile, "utf8");
const bannedChecks = [
  { name: "optional chaining", failed: source.includes("?.") },
  { name: "nullish coalescing", failed: source.includes("??") },
  { name: "globalThis", failed: source.includes("globalThis") },
  { name: "async function", failed: source.includes("async function") },
  { name: "await keyword", failed: source.includes("await ") },
  { name: "unsupported GM_deleteValue grant", failed: source.includes("GM_deleteValue") },
  {
    name: "logical assignment",
    failed: source.includes("??=") || source.includes("||=") || source.includes("&&=")
  },
  { name: "bigint literal", failed: /(^|[^\w$])\d+n([^\w$]|$)/u.test(source) }
];

const failures = bannedChecks.filter((entry) => entry.failed);

if (failures.length > 0) {
  const labels = failures.map((entry) => entry.name).join(", ");
  throw new Error(`Compatibility regression detected in dist bundle: ${labels}`);
}

console.log(`Compatibility check passed for ${distFile}`);
