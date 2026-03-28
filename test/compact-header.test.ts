import { afterEach, describe, expect, it, vi } from "vitest";
import { CompactVideoHeader } from "../src/ui/compact-header";

describe("compact video header", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    window.history.replaceState({}, "", "/");
    vi.restoreAllMocks();
  });

  it("opens search results in a new tab", () => {
    document.body.innerHTML = `
      <div class="bili-header__bar mini-header">
        <input class="nav-search-input" type="search" value="极客湾">
      </div>
    `;

    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const header = new CompactVideoHeader();
    header.mount();

    const form = document.querySelector<HTMLFormElement>(".bsb-tm-video-header-fallback-search");
    expect(form).toBeTruthy();
    form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(openSpy).toHaveBeenCalledWith(
      "https://search.bilibili.com/all?keyword=%E6%9E%81%E5%AE%A2%E6%B9%BE",
      "_blank",
      "noopener,noreferrer"
    );
    header.destroy();
  });

  it("keeps the last authoritative avatar instead of regressing to a fallback", () => {
    document.body.innerHTML = `
      <div class="bili-header__bar mini-header">
        <div class="right-entry">
          <div class="header-entry-avatar">
            <a href="https://space.bilibili.com/123">
              <img src="https://example.com/avatar.png" alt="测试用户">
            </a>
          </div>
        </div>
      </div>
    `;
    Reflect.set(window as unknown as Record<string, unknown>, "__BILI_USER_INFO__", {
      mid: 123,
      uname: "测试用户",
      face: "https://example.com/avatar.png"
    });

    const header = new CompactVideoHeader();
    header.mount();
    header.sync();

    const avatar = document.querySelector<HTMLImageElement>(".bsb-tm-video-header-avatar");
    expect(avatar?.src).toContain("avatar.png");

    document.querySelector(".header-entry-avatar")?.remove();
    header.sync();

    const persistedAvatar = document.querySelector<HTMLImageElement>(".bsb-tm-video-header-avatar");
    expect(persistedAvatar?.src).toContain("avatar.png");
    expect(document.querySelector(".bsb-tm-video-header-profile-fallback")).toBeNull();
    header.destroy();
    Reflect.deleteProperty(window as unknown as Record<string, unknown>, "__BILI_USER_INFO__");
  });

  it("does not render a text fallback when only a generic profile link is available", () => {
    document.body.innerHTML = `
      <div class="bili-header__bar mini-header">
        <div class="right-entry">
          <a href="https://space.bilibili.com/">个人主页</a>
        </div>
      </div>
    `;

    const header = new CompactVideoHeader();
    header.mount();
    header.sync();

    expect(document.querySelector(".bsb-tm-video-header-profile-label")).toBeNull();
    expect(document.querySelector(".bsb-tm-video-header-profile-fallback svg")).toBeTruthy();
    header.destroy();
  });

  it("ignores non-header page avatars such as the current video UP avatar", () => {
    document.body.innerHTML = `
      <div class="up-info-container">
        <div class="bili-avatar">
          <img src="https://example.com/up-avatar.png" alt="视频 UP">
        </div>
      </div>
      <div class="bili-header__bar mini-header">
        <div class="right-entry">
          <a href="https://space.bilibili.com/">个人主页</a>
        </div>
      </div>
    `;

    const header = new CompactVideoHeader();
    header.mount();
    header.sync();

    expect(document.querySelector<HTMLImageElement>(".bsb-tm-video-header-avatar")).toBeNull();
    expect(document.querySelector(".bsb-tm-video-header-profile-fallback svg")).toBeTruthy();
    header.destroy();
  });

  it("hydrates the real avatar from the nav API when header DOM has not rendered it yet", async () => {
    document.body.innerHTML = `
      <div class="bili-header__bar mini-header">
        <div class="right-entry">
          <a href="https://space.bilibili.com/">个人主页</a>
        </div>
      </div>
    `;

    const fetchSpy = vi.spyOn(window, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 0,
          data: {
            mid: 123,
            uname: "测试用户",
            face: "https://example.com/nav-avatar.png"
          }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      )
    );

    const header = new CompactVideoHeader();
    header.mount();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    const avatar = document.querySelector<HTMLImageElement>(".bsb-tm-video-header-avatar");
    expect(fetchSpy).toHaveBeenCalledWith("https://api.bilibili.com/x/web-interface/nav", expect.objectContaining({
      credentials: "include"
    }));
    expect(avatar?.src).toContain("nav-avatar.png");
    expect(document.querySelector<HTMLAnchorElement>(".bsb-tm-video-header-profile-link")?.href).toContain("/123");
    header.destroy();
  });

  it("replaces a mismatched DOM avatar with the logged-in avatar from the nav API", async () => {
    document.body.innerHTML = `
      <div class="bili-header__bar mini-header">
        <div class="right-entry">
          <div class="header-entry-avatar">
            <a href="https://space.bilibili.com/999">
              <img src="https://example.com/up-avatar.png" alt="视频 UP">
            </a>
          </div>
        </div>
      </div>
    `;

    vi.spyOn(window, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 0,
          data: {
            mid: 123,
            uname: "测试用户",
            face: "https://example.com/nav-avatar.png"
          }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      )
    );

    const header = new CompactVideoHeader();
    header.mount();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    const avatar = document.querySelector<HTMLImageElement>(".bsb-tm-video-header-avatar");
    const profileLink = document.querySelector<HTMLAnchorElement>(".bsb-tm-video-header-profile-link");
    expect(avatar?.src).toContain("nav-avatar.png");
    expect(profileLink?.href).toContain("/123");
    header.destroy();
  });
});
