import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PRODUCT_NAME } from "../src/constants";

describe("userscript banner source", () => {
  it("uses the public QoL Core naming and Hush_ author credit", () => {
    const buildScript = readFileSync("scripts/build.mjs", "utf8");

    expect(PRODUCT_NAME).toBe("Bilibili QoL Core");
    expect(buildScript).toContain("// @name         Bilibili QoL Core");
    expect(buildScript).toContain("// @author       Hush_");
    expect(buildScript).toContain("bilibili-qol-core.user.js");
    expect(buildScript).not.toContain("dist/bilibili-sponsorblock.user.js");
  });
});
