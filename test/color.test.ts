import { describe, expect, it } from "vitest";
import {
  isNearWhiteColor,
  resolveCategoryStyle,
  resolveTransparentGlassVariant
} from "../src/utils/color";

describe("transparent glass color helpers", () => {
  it("detects near-white colors for transparent label fallback", () => {
    expect(isNearWhiteColor("#ffffff")).toBe(true);
    expect(isNearWhiteColor("#f3f8ff")).toBe(true);
    expect(isNearWhiteColor("#60a5fa")).toBe(false);
  });

  it("uses a light transparent variant only for near-white colors", () => {
    expect(resolveTransparentGlassVariant("#ffffff")).toBe("light");
    expect(resolveTransparentGlassVariant("#f3f8ff")).toBe("light");
    expect(resolveTransparentGlassVariant("#60a5fa")).toBe("dark");
  });

  it("propagates transparent glass metadata through category styles", () => {
    const lightStyle = resolveCategoryStyle("exclusive_access", { exclusive_access: "#ffffff" });
    const darkStyle = resolveCategoryStyle("exclusive_access", { exclusive_access: "#60a5fa" });

    expect(lightStyle.transparentVariant).toBe("light");
    expect(darkStyle.transparentVariant).toBe("dark");
    expect(darkStyle.accent).toBe("#60a5fa");
  });
});
