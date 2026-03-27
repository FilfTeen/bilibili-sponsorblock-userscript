import { describe, expect, it } from "vitest";
import { NoticeCenter } from "../src/ui/notice-center";

describe("notice center", () => {
  it("stays detached until the first notice is shown and cleans itself up when empty", () => {
    const center = new NoticeCenter();

    expect(document.querySelector(".bsb-tm-notice-root")).toBeNull();

    center.show({
      id: "smoke-notice",
      title: "自动跳过",
      message: "测试提示",
      sticky: true
    });

    const root = document.querySelector<HTMLElement>(".bsb-tm-notice-root");
    expect(root).toBeTruthy();
    expect(root?.textContent).toContain("自动跳过");

    center.dismiss("smoke-notice");
    expect(document.querySelector(".bsb-tm-notice-root")).toBeNull();
  });
});
