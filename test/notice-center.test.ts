import { afterEach, describe, expect, it, vi } from "vitest";
import { NoticeCenter } from "../src/ui/notice-center";

describe("notice center", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stays detached until the first notice is shown and cleans itself up after the leave animation", () => {
    vi.useFakeTimers();
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
    expect(document.querySelector(".bsb-tm-notice-root")).toBeTruthy();
    expect(document.querySelector(".bsb-tm-notice")?.classList.contains("is-leaving")).toBe(true);
    vi.advanceTimersByTime(260);
    expect(document.querySelector(".bsb-tm-notice-root")).toBeNull();
  });

  it("keeps lower notices in the stack while a dismissed notice is leaving", () => {
    vi.useFakeTimers();
    const center = new NoticeCenter();
    center.show({ id: "first", title: "第一条", message: "测试", sticky: true });
    center.show({ id: "second", title: "第二条", message: "测试", sticky: true });

    center.dismiss("first");

    expect(document.querySelectorAll(".bsb-tm-notice")).toHaveLength(2);
    expect(document.querySelector(".bsb-tm-notice[data-notice-id='first']")?.classList.contains("is-leaving")).toBe(true);
    expect(document.querySelector(".bsb-tm-notice[data-notice-id='second']")?.classList.contains("is-leaving")).toBe(false);
    vi.advanceTimersByTime(260);
    expect(document.querySelectorAll(".bsb-tm-notice")).toHaveLength(1);
    expect(document.querySelector(".bsb-tm-notice")?.textContent).toContain("第二条");
  });

  it("removes the player-host class from the previous host when the notice host changes", () => {
    const center = new NoticeCenter();
    const firstHost = document.createElement("div");
    const secondHost = document.createElement("div");
    document.body.append(firstHost, secondHost);

    center.setHost(firstHost);
    expect(firstHost.classList.contains("bsb-tm-player-host")).toBe(true);

    center.setHost(secondHost);
    expect(firstHost.classList.contains("bsb-tm-player-host")).toBe(false);
    expect(secondHost.classList.contains("bsb-tm-player-host")).toBe(true);

    center.setHost(null);
    expect(secondHost.classList.contains("bsb-tm-player-host")).toBe(false);
  });
});
