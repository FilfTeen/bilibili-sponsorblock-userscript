import { afterEach, describe, expect, it, vi } from "vitest";
import { CompactVideoHeader } from "../src/ui/compact-header";
import { styles } from "../src/ui/styles";

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

  it("does not search with a generic placeholder when the input is empty", () => {
    document.body.innerHTML = `
      <div class="bili-header__bar mini-header">
        <input class="nav-search-input" type="search" placeholder="搜索 B 站内容" value="">
      </div>
    `;

    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const header = new CompactVideoHeader();
    header.setOptions({ searchPlaceholderEnabled: true });
    header.mount();

    const form = document.querySelector<HTMLFormElement>(".bsb-tm-video-header-fallback-search");
    form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(openSpy).not.toHaveBeenCalled();
    header.destroy();
  });

  it("shows the generic placeholder when ad placeholder display is disabled", () => {
    document.body.innerHTML = `
      <div class="bili-header__bar mini-header">
        <input class="nav-search-input" type="search" placeholder="橘鸦Juya · 6小时前更新" value="">
      </div>
    `;

    const header = new CompactVideoHeader();
    header.mount();

    const input = document.querySelector<HTMLInputElement>(".bsb-tm-video-header-fallback-search input");
    expect(input?.placeholder).toBe("搜索 B 站内容");
    header.destroy();
  });

  it("shows the original ad placeholder when display is enabled", () => {
    document.body.innerHTML = `
      <div class="bili-header__bar mini-header">
        <input class="nav-search-input" type="search" placeholder="橘鸦Juya · 6小时前更新" value="">
      </div>
    `;

    const header = new CompactVideoHeader();
    header.setOptions({ placeholderVisible: true });
    header.mount();

    const input = document.querySelector<HTMLInputElement>(".bsb-tm-video-header-fallback-search input");
    expect(input?.placeholder).toBe("橘鸦Juya · 6小时前更新");
    header.destroy();
  });

  it("updates the mounted placeholder immediately when options change", () => {
    document.body.innerHTML = `
      <div class="bili-header__bar mini-header">
        <input class="nav-search-input" type="search" placeholder="橘鸦Juya · 6小时前更新" value="">
      </div>
    `;

    const header = new CompactVideoHeader();
    header.mount();

    const inputBefore = document.querySelector<HTMLInputElement>(".bsb-tm-video-header-fallback-search input");
    expect(inputBefore?.placeholder).toBe("搜索 B 站内容");

    header.setOptions({ placeholderVisible: true });

    const inputAfter = document.querySelector<HTMLInputElement>(".bsb-tm-video-header-fallback-search input");
    expect(inputAfter?.placeholder).toBe("橘鸦Juya · 6小时前更新");
    header.destroy();
  });

  it("keeps the compact search input stable during retry sync while the user is editing", () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div class="bili-header__bar mini-header">
        <input class="nav-search-input" type="search" placeholder="搜索 B 站内容" value="">
      </div>
    `;

    const header = new CompactVideoHeader();
    header.mount();

    const inputBefore = document.querySelector<HTMLInputElement>(".bsb-tm-video-header-fallback-search input");
    expect(inputBefore).toBeTruthy();
    inputBefore!.focus();
    inputBefore!.value = "用户正在输入";

    vi.advanceTimersByTime(400);

    const inputAfter = document.querySelector<HTMLInputElement>(".bsb-tm-video-header-fallback-search input");
    expect(inputAfter).toBe(inputBefore);
    expect(inputAfter?.value).toBe("用户正在输入");
    expect(document.activeElement).toBe(inputBefore);
    header.destroy();
    vi.useRealTimers();
  });

  it("searches with an advertising placeholder when enabled and the input is empty", () => {
    document.body.innerHTML = `
      <div class="bili-header__bar mini-header">
        <input class="nav-search-input" type="search" placeholder="橘鸦Juya · 6小时前更新" value="">
      </div>
    `;

    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const header = new CompactVideoHeader();
    header.setOptions({ placeholderVisible: true, searchPlaceholderEnabled: true });
    header.mount();

    const form = document.querySelector<HTMLFormElement>(".bsb-tm-video-header-fallback-search");
    form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(openSpy).toHaveBeenCalledWith(
      "https://search.bilibili.com/all?keyword=%E6%A9%98%E9%B8%A6Juya%20%C2%B7%206%E5%B0%8F%E6%97%B6%E5%89%8D%E6%9B%B4%E6%96%B0",
      "_blank",
      "noopener,noreferrer"
    );
    header.destroy();
  });

  it("does not search with an advertising placeholder when the option is disabled", () => {
    document.body.innerHTML = `
      <div class="bili-header__bar mini-header">
        <input class="nav-search-input" type="search" placeholder="橘鸦Juya · 6小时前更新" value="">
      </div>
    `;

    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const header = new CompactVideoHeader();
    header.mount();

    const form = document.querySelector<HTMLFormElement>(".bsb-tm-video-header-fallback-search");
    form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(openSpy).not.toHaveBeenCalled();
    header.destroy();
  });

  it("does not search a hidden advertising placeholder even when placeholder search is enabled", () => {
    document.body.innerHTML = `
      <div class="bili-header__bar mini-header">
        <input class="nav-search-input" type="search" placeholder="橘鸦Juya · 6小时前更新" value="">
      </div>
    `;

    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const header = new CompactVideoHeader();
    header.setOptions({ placeholderVisible: false, searchPlaceholderEnabled: true });
    header.mount();

    const input = document.querySelector<HTMLInputElement>(".bsb-tm-video-header-fallback-search input");
    const form = document.querySelector<HTMLFormElement>(".bsb-tm-video-header-fallback-search");
    expect(input?.placeholder).toBe("搜索 B 站内容");
    form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(openSpy).not.toHaveBeenCalled();
    header.destroy();
  });

  it("prefers manually entered text even when placeholder searching is enabled", () => {
    document.body.innerHTML = `
      <div class="bili-header__bar mini-header">
        <input class="nav-search-input" type="search" placeholder="橘鸦Juya · 6小时前更新" value="极客湾">
      </div>
    `;

    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const header = new CompactVideoHeader();
    header.setOptions({ placeholderVisible: true, searchPlaceholderEnabled: true });
    header.mount();

    const form = document.querySelector<HTMLFormElement>(".bsb-tm-video-header-fallback-search");
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

  it("hides and restores native header roots across current and legacy selectors", () => {
    document.body.innerHTML = `
      <div id="biliMainHeader">主站顶栏</div>
      <div class="bili-header fixed-header">旧顶栏</div>
      <div class="bili-header__bar mini-header">
        <input class="nav-search-input" type="search" value="">
      </div>
    `;

    const header = new CompactVideoHeader();
    header.mount();

    expect(document.documentElement.classList.contains("bsb-tm-video-header-compact")).toBe(true);
    expect(document.querySelector("#biliMainHeader")?.getAttribute("data-bsb-native-header-hidden")).toBe("true");
    expect(document.querySelector(".bili-header.fixed-header")?.getAttribute("data-bsb-native-header-hidden")).toBe("true");
    expect(document.querySelector(".bili-header__bar.mini-header")?.getAttribute("data-bsb-native-header-hidden")).toBe("true");

    header.unmount();

    expect(document.documentElement.classList.contains("bsb-tm-video-header-compact")).toBe(false);
    expect(document.querySelector("#biliMainHeader")?.hasAttribute("data-bsb-native-header-hidden")).toBe(false);
    expect(document.querySelector(".bili-header.fixed-header")?.hasAttribute("data-bsb-native-header-hidden")).toBe(false);
    expect(document.querySelector(".bili-header__bar.mini-header")?.hasAttribute("data-bsb-native-header-hidden")).toBe(false);
    expect(document.querySelector(".bsb-tm-video-header-shell")).toBeNull();
  });

  it("preserves the native header slot instead of removing it from layout", () => {
    const hiddenBlock = styles.match(/\[data-bsb-native-header-hidden="true"\]\s*\{[^}]+\}/)?.[0] ?? "";
    expect(hiddenBlock).toContain('[data-bsb-native-header-hidden="true"] {');
    expect(hiddenBlock).toContain("visibility: hidden !important;");
    expect(hiddenBlock).toContain("opacity: 0 !important;");
    expect(hiddenBlock).not.toContain("display: none !important;");
    expect(hiddenBlock).not.toContain("height: 0 !important;");
    expect(hiddenBlock).not.toContain("overflow: hidden !important;");
  });

  it("keeps the compact header shell inside the native header slot", () => {
    expect(styles).toContain(".bsb-tm-video-header-compact .bsb-tm-video-header-shell {");
    expect(styles).toContain("top: 0;");
    expect(styles).toContain(".bsb-tm-video-header-bar {");
    expect(styles).toContain("min-height: 54px;");
    expect(styles).not.toContain(".bsb-tm-video-header-compact .video-container-v1 {");
  });
});
