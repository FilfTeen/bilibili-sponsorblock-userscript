import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const rootDir = path.resolve(import.meta.dirname, "..");
const scriptPath = path.join(rootDir, "dist", "bilibili-qol-core.user.js");
const browserPath =
  process.env.BSB_SMOKE_BROWSER_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const captureDir = process.env.BSB_SMOKE_CAPTURE_DIR ? path.resolve(rootDir, process.env.BSB_SMOKE_CAPTURE_DIR) : null;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function capture(page, name) {
  if (!captureDir) {
    return;
  }

  await mkdir(captureDir, { recursive: true });
  await page.screenshot({
    path: path.join(captureDir, `${name}.png`),
    fullPage: true
  });
}

async function captureLocator(locator, name) {
  if (!captureDir) {
    return;
  }

  await mkdir(captureDir, { recursive: true });
  try {
    await locator.waitFor({
      state: "visible",
      timeout: 2500
    });
    await locator.screenshot({
      path: path.join(captureDir, `${name}.png`),
      timeout: 2500
    });
  } catch (error) {
    console.warn(`Skipping locator capture for ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function installGmShims(page, options = {}) {
  const { failSegmentRequests = false, initialStore = {} } = options;

  await page.exposeFunction("__bsbNodeRequest", async (details) => {
    if (details.url.includes("/api/skipSegments/")) {
      if (failSegmentRequests) {
        return {
          status: 500,
          responseText: "{\"error\":\"forced-smoke-failure\"}"
        };
      }

      return {
        status: 200,
        responseText: JSON.stringify([
          {
            videoID: "BV1Wx2TBrE8X",
            segments: [
              {
                UUID: "fixture-segment",
                category: "sponsor",
                actionType: "skip",
                segment: [65.7, 86.1]
              },
              {
                UUID: "fixture-full-video",
                category: "exclusive_access",
                actionType: "full",
                segment: [0, 120]
              }
            ]
          }
        ])
      };
    }

    if (details.url.includes("/api/videoLabels/")) {
      return {
        status: 200,
        responseText: JSON.stringify([
          {
            videoID: "BV17x411w7KC",
            segments: [{ category: "sponsor" }]
          }
        ])
      };
    }

    if (details.url.includes("/api/voteOnSponsorTime")) {
      return {
        status: 200,
        responseText: JSON.stringify({ ok: true })
      };
    }

    const response = await fetch(details.url, {
      method: details.method ?? "GET",
      headers: details.headers ?? {}
    });

    return {
      status: response.status,
      responseText: await response.text()
    };
  });

  await page.addInitScript((seedStore) => {
    const requestLog = [];
    const store = { ...seedStore };
    const originalFetch = window.fetch.bind(window);

    window.__bsbRequestLog = requestLog;
    window.__bsbGmStore = store;
    window.GM_getValue = (key, fallback) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : fallback);
    window.GM_setValue = (key, value) => {
      store[key] = value;
    };
    window.GM_deleteValue = (key) => {
      delete store[key];
    };
    window.GM_addStyle = (css) => {
      const style = document.createElement("style");
      style.dataset.bsbInjected = "true";
      style.textContent = css;
      document.head.appendChild(style);
    };
    window.GM_registerMenuCommand = () => {};
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input?.url;
      if (!url?.includes("/api/skipSegments/") && !url?.includes("/api/videoLabels/")) {
        return originalFetch(input, init);
      }

      const method = init?.method ?? (typeof input === "string" ? "GET" : input.method ?? "GET");
      const headers = Object.fromEntries(
        new Headers(init?.headers ?? (typeof input === "string" ? undefined : input.headers)).entries()
      );
      requestLog.push({ via: "fetch", method, url });
      const response = await window.__bsbNodeRequest({ method, url, headers });
      return new Response(response.responseText, {
        status: response.status,
        headers: {
          "content-type": "application/json"
        }
      });
    };
    window.GM_xmlhttpRequest = (details) => {
      requestLog.push({ via: "gm", method: details.method ?? "GET", url: details.url });
      window
        .__bsbNodeRequest({
          method: details.method ?? "GET",
          url: details.url,
          headers: details.headers ?? {}
        })
        .then((response) => {
          details.onload?.({
            status: response.status,
            responseText: response.responseText
          });
        })
        .catch(() => {
          details.onerror?.({});
        });
      return { abort() {} };
    };
  }, initialStore);
}

async function injectUserscript(page, userscript) {
  await page.addScriptTag({ content: userscript });
  await page.waitForTimeout(1600);
}

async function verifyHomePage(page) {
  await page.goto("https://www.bilibili.com/", { waitUntil: "domcontentloaded" });
  const userscript = await readFile(scriptPath, "utf8");
  await injectUserscript(page, userscript);

  await page.evaluate(() => {
    const section = document.createElement("section");
    section.className = "recommended-container_floor-aside";
    section.style.position = "fixed";
    section.style.top = "96px";
    section.style.left = "24px";
    section.style.zIndex = "9999";
    section.style.padding = "12px";
    section.style.background = "rgba(255,255,255,0.94)";
    section.style.borderRadius = "20px";
    section.style.boxShadow = "0 20px 40px rgba(15,23,42,0.12)";
    section.innerHTML = `
      <div class="container">
        <article class="bili-video-card" data-bsb-smoke-card="home" style="width:280px;">
          <a class="bili-video-card__cover" href="//www.bilibili.com/video/BV17x411w7KC/">
            <img src="https://example.com/a.jpg" alt="cover">
          </a>
        </article>
      </div>
    `;
    document.body.prepend(section);
  });
  await page.waitForTimeout(900);
  await capture(page, "home-thumbnail-labels");
  await captureLocator(
    page.locator("[data-bsb-smoke-card='home'] .sponsorThumbnailLabelVisible").first(),
    "home-thumbnail-label-badge"
  );
  await page.evaluate(() => {
    document.querySelector("[data-bsb-smoke-card='home']")?.setAttribute("data-bsb-hover", "true");
  });
  await page.waitForTimeout(160);
  await captureLocator(
    page.locator("[data-bsb-smoke-card='home'] .sponsorThumbnailLabelVisible").first(),
    "home-thumbnail-label-badge-expanded"
  );

  const result = await page.evaluate(() => {
    const overlay = document.querySelector("[data-bsb-smoke-card='home'] .sponsorThumbnailLabelVisible");
    const cover = document.querySelector("[data-bsb-smoke-card='home'] .bili-video-card__cover");
    const overlayRect = overlay?.getBoundingClientRect();
    const coverRect = cover?.getBoundingClientRect();
    return {
      overlayCount: document.querySelectorAll(".sponsorThumbnailLabelVisible").length,
      requestCount: (window.__bsbRequestLog ?? []).filter((entry) => entry.url.includes("/api/videoLabels/")).length,
      hasLegacyButton: Boolean(document.querySelector(".bsb-tm-entry-button")),
      panelMounted: Boolean(document.querySelector(".bsb-tm-panel-backdrop")),
      panelOpen: document.documentElement.classList.contains("bsb-tm-panel-open"),
      overlayCenterOffset:
        overlayRect && coverRect
          ? Math.abs(overlayRect.left + overlayRect.width / 2 - (coverRect.left + coverRect.width / 2))
          : 999,
      overlayAboveCard:
        overlayRect && coverRect
          ? overlayRect.top + overlayRect.height / 2 < coverRect.top + 12
          : false
    };
  });

  assert(result.overlayCount > 0, "Home page did not render any thumbnail labels.");
  assert(result.requestCount > 0, "Home page did not request thumbnail label data.");
  assert(!result.hasLegacyButton, "Legacy floating button is still being rendered.");
  assert(!result.panelMounted, "Home page mounted the settings panel before the user explicitly opened it.");
  assert(!result.panelOpen, "Home page left the document in panel-open mode.");
  assert(result.overlayCenterOffset <= 18, "Home page thumbnail label is no longer centered above the cover.");
  assert(result.overlayAboveCard, "Home page thumbnail label did not sit above the cover area.");
}

async function verifySearchPage(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await installGmShims(page);

  try {
    await page.goto("https://search.bilibili.com/all?keyword=%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan", {
      waitUntil: "domcontentloaded"
    });
    const userscript = await readFile(scriptPath, "utf8");
    await injectUserscript(page, userscript);

    await page.evaluate(() => {
      const wrapper = document.createElement("section");
      wrapper.className = "search-page-wrapper";
      wrapper.style.position = "fixed";
      wrapper.style.top = "96px";
      wrapper.style.left = "24px";
      wrapper.style.zIndex = "9999";
      wrapper.style.padding = "12px";
      wrapper.style.background = "rgba(255,255,255,0.94)";
      wrapper.style.borderRadius = "20px";
      wrapper.style.boxShadow = "0 20px 40px rgba(15,23,42,0.12)";

      const card = document.createElement("article");
      card.className = "bili-video-card";
      card.setAttribute("data-bsb-smoke-card", "search");
      card.style.width = "280px";
      card.innerHTML = `
        <a class="bili-video-card__cover" href="https://www.bilibili.com/video/BV17x411w7KC/">
          <img src="https://example.com/search-fixture.jpg" alt="search cover">
        </a>
        <div class="bili-video-card__info">
          <h3>搜索页测试卡片</h3>
        </div>
      `;

      wrapper.appendChild(card);
      document.body.prepend(wrapper);
    });
    await page.waitForTimeout(900);
    await capture(page, "search-thumbnail-labels");
    await captureLocator(page.locator("[data-bsb-smoke-card='search'] .sponsorThumbnailLabelVisible").first(), "search-thumbnail-label-badge");

    const result = await page.evaluate(() => {
      const card = document.querySelector("[data-bsb-smoke-card='search']");
      const cover = document.querySelector("[data-bsb-smoke-card='search'] .bili-video-card__cover");
      const label = document.querySelector("[data-bsb-smoke-card='search'] .sponsorThumbnailLabelVisible");
      const coverRect = cover?.getBoundingClientRect();
      const labelRect = label?.getBoundingClientRect();
      return {
        visibleLabelCount: card instanceof Element ? card.querySelectorAll(".sponsorThumbnailLabelVisible").length : 0,
        requestCount: (window.__bsbRequestLog ?? []).filter((entry) => entry.url.includes("/api/videoLabels/")).length,
        panelMounted: Boolean(document.querySelector(".bsb-tm-panel-backdrop")),
        fixtureExists: Boolean(document.querySelector("[data-bsb-smoke-card='search']")),
        centered:
          coverRect && labelRect
            ? Math.abs(labelRect.left + labelRect.width / 2 - (coverRect.left + coverRect.width / 2)) <= 18
            : false,
        aboveCover:
          coverRect && labelRect
            ? labelRect.top + labelRect.height / 2 < coverRect.top + 12
            : false
      };
    });

    assert(result.fixtureExists, "Search page fixture card was not inserted.");
    assert(result.visibleLabelCount > 0, "Search page did not render any thumbnail labels.");
    assert(result.requestCount > 0, "Search page did not request thumbnail label data.");
    assert(!result.panelMounted, "Search page mounted the settings panel before user interaction.");
    assert(result.centered, "Search page thumbnail label is no longer centered above the cover.");
    assert(result.aboveCover, "Search page thumbnail label did not stay above the cover.");
  } finally {
    await context.close();
  }
}

async function verifyHistoryMenuBadge(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await installGmShims(page);

  try {
    await page.goto("https://www.bilibili.com/", { waitUntil: "domcontentloaded" });
    const userscript = await readFile(scriptPath, "utf8");
    await injectUserscript(page, userscript);

    await page.evaluate(() => {
      const wrapper = document.createElement("section");
      wrapper.className = "bsb-history-fixture";
      wrapper.style.position = "fixed";
      wrapper.style.top = "96px";
      wrapper.style.right = "24px";
      wrapper.style.zIndex = "9999";
      wrapper.style.padding = "12px";
      wrapper.style.background = "rgba(255,255,255,0.94)";
      wrapper.style.borderRadius = "20px";
      wrapper.style.boxShadow = "0 20px 40px rgba(15,23,42,0.12)";
      wrapper.innerHTML = `
        <a class="header-history-card" data-bsb-smoke-card="history" href="https://www.bilibili.com/video/BV17x411w7KC/" style="display:grid;gap:10px;width:220px;text-decoration:none;color:inherit;">
          <span class="header-history-card__cover" style="display:block;position:relative;width:220px;height:124px;border-radius:18px;overflow:hidden;background:#111827;">
            <img src="https://example.com/history-fixture.jpg" alt="history cover" style="width:100%;height:100%;object-fit:cover;">
          </span>
          <span>历史记录场景卡片</span>
        </a>
      `;
      document.body.prepend(wrapper);
    });
    await page.waitForTimeout(900);
    await capture(page, "history-thumbnail-labels");
    await captureLocator(page.locator("[data-bsb-smoke-card='history'] .sponsorThumbnailLabelVisible").first(), "history-thumbnail-label-badge");

    const result = await page.evaluate(() => {
      const cover = document.querySelector("[data-bsb-smoke-card='history'] .header-history-card__cover");
      const label = document.querySelector("[data-bsb-smoke-card='history'] .sponsorThumbnailLabelVisible");
      const coverRect = cover?.getBoundingClientRect();
      const labelRect = label?.getBoundingClientRect();
      return {
        visibleLabelCount: document.querySelectorAll("[data-bsb-smoke-card='history'] .sponsorThumbnailLabelVisible").length,
        centered:
          coverRect && labelRect
            ? Math.abs(labelRect.left + labelRect.width / 2 - (coverRect.left + coverRect.width / 2)) <= 18
            : false,
        aboveCover:
          coverRect && labelRect
            ? labelRect.top + labelRect.height / 2 < coverRect.top + 14
            : false
      };
    });

    assert(result.visibleLabelCount > 0, "History-like cards did not render any thumbnail labels.");
    assert(result.centered, "History-like thumbnail label is no longer centered on the cover anchor.");
    assert(result.aboveCover, "History-like thumbnail label did not stay above the cover anchor.");
  } finally {
    await context.close();
  }
}

async function verifyDynamicLabelMode(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await installGmShims(page, {
    initialStore: {
      bsb_tm_config_v1: {
        dynamicFilterMode: "label"
      }
    }
  });

  try {
    await page.goto("https://www.bilibili.com/", { waitUntil: "domcontentloaded" });
    const userscript = await readFile(scriptPath, "utf8");
    await injectUserscript(page, userscript);

    await page.evaluate(() => {
      const item = document.createElement("div");
      item.className = "bili-dyn-item";
      item.innerHTML = `
        <div class="bili-dyn-item__main">
          <div class="bili-dyn-title__text">测试动态</div>
          <div class="bili-dyn-content">
            <div class="bili-rich-text__content"><span>点评论区置顶领取优惠券</span></div>
          </div>
        </div>
      `;
      document.body.appendChild(item);
    });
    await page.waitForTimeout(700);
    await capture(page, "home-dynamic-label-mode");

    const result = await page.evaluate(() => ({
      dynamicBadgeCount: document.querySelectorAll("[data-bsb-dynamic-badge]").length,
      dynamicToggleCount: document.querySelectorAll("[data-bsb-dynamic-toggle]").length,
      hiddenContentCount: document.querySelectorAll(".bili-dyn-content[style*='display: none']").length
    }));

    assert(result.dynamicBadgeCount > 0, "Dynamic label mode did not label injected promo content.");
    assert(result.dynamicToggleCount === 0, "Dynamic label mode should not add reveal toggles.");
    assert(result.hiddenContentCount === 0, "Dynamic label mode should not hide content.");
  } finally {
    await context.close();
  }
}

async function verifyVideoPage(browser) {
  const context = await browser.newContext({
    viewport: {
      width: 1180,
      height: 640
    }
  });
  const page = await context.newPage();
  await installGmShims(page, {
    initialStore: {
      bsb_tm_config_v1: {
        commentFilterMode: "hide",
        showPreviewBar: true,
        thumbnailLabelMode: "overlay"
      }
    }
  });

  try {
    await page.goto("https://www.bilibili.com/video/BV1Wx2TBrE8X/", { waitUntil: "domcontentloaded" });
    const userscript = await readFile(scriptPath, "utf8");
    await injectUserscript(page, userscript);
    await page.waitForSelector("video", { timeout: 15000 });

    await page.evaluate(() => {
      const root = document.createElement("bili-comments");
      root.id = "bsb-smoke-comments";
      const rootShadow = root.shadowRoot ?? root.attachShadow({ mode: "open" });
      document.body.appendChild(root);

      window.setTimeout(() => {
        const thread = document.createElement("bili-comment-thread-renderer");
        const threadShadow = thread.shadowRoot ?? thread.attachShadow({ mode: "open" });
        const renderer = document.createElement("bili-comment-renderer");
        const rendererShadow = renderer.shadowRoot ?? renderer.attachShadow({ mode: "open" });

        const userInfo = document.createElement("bili-comment-user-info");
        const userInfoShadow = userInfo.shadowRoot ?? userInfo.attachShadow({ mode: "open" });
        const up = document.createElement("span");
        up.id = "user-up";
        up.textContent = "UP";
        userInfoShadow.appendChild(up);

        const content = document.createElement("div");
        content.id = "content";
        content.textContent = "点评论区置顶领取优惠券";
        const richText = document.createElement("bili-rich-text");
        const richTextShadow = richText.shadowRoot ?? richText.attachShadow({ mode: "open" });
        const promoText = document.createElement("span");
        promoText.textContent = "点评论区置顶领取优惠券";
        richTextShadow.appendChild(promoText);
        const goodsLink = document.createElement("a");
        goodsLink.setAttribute("data-type", "goods");
        goodsLink.textContent = "商品卡";
        richTextShadow.appendChild(goodsLink);

        const main = document.createElement("div");
        main.id = "main";
        const actions = document.createElement("bili-comment-action-buttons-renderer");
        const actionsShadow = actions.shadowRoot ?? actions.attachShadow({ mode: "open" });
        const reply = document.createElement("button");
        reply.id = "reply";
        reply.textContent = "回复";
        actionsShadow.appendChild(reply);
        main.appendChild(actions);

        rendererShadow.append(userInfo, richText, content, main);
        threadShadow.appendChild(renderer);

        const repliesRenderer = document.createElement("bili-comment-replies-renderer");
        const repliesRoot = repliesRenderer.shadowRoot ?? repliesRenderer.attachShadow({ mode: "open" });
        const replyRenderer = document.createElement("bili-comment-reply-renderer");
        const replyRendererRoot = replyRenderer.shadowRoot ?? replyRenderer.attachShadow({ mode: "open" });
        const replyComment = document.createElement("bili-comment-renderer");
        const replyCommentRoot = replyComment.shadowRoot ?? replyComment.attachShadow({ mode: "open" });
        const replyUserInfo = document.createElement("bili-comment-user-info");
        const replyUserInfoRoot = replyUserInfo.shadowRoot ?? replyUserInfo.attachShadow({ mode: "open" });
        const replyLevel = document.createElement("span");
        replyLevel.id = "user-level";
        replyLevel.textContent = "LV6";
        replyUserInfoRoot.appendChild(replyLevel);
        const replyRichText = document.createElement("bili-rich-text");
        const replyRichTextRoot = replyRichText.shadowRoot ?? replyRichText.attachShadow({ mode: "open" });
        const replyPromo = document.createElement("span");
        replyPromo.textContent = "立即购买同款";
        replyRichTextRoot.appendChild(replyPromo);
        const replyContent = document.createElement("div");
        replyContent.id = "content";
        replyContent.textContent = "立即购买同款";
        const replyMain = document.createElement("div");
        replyMain.id = "main";
        const replyActions = document.createElement("bili-comment-action-buttons-renderer");
        const replyActionsRoot = replyActions.shadowRoot ?? replyActions.attachShadow({ mode: "open" });
        const replyButton = document.createElement("button");
        replyButton.id = "reply";
        replyButton.textContent = "回复";
        replyActionsRoot.appendChild(replyButton);
        replyMain.appendChild(replyActions);
        replyCommentRoot.append(replyUserInfo, replyRichText, replyContent, replyMain);
        replyRendererRoot.appendChild(replyComment);
        repliesRoot.appendChild(replyRenderer);
        threadShadow.appendChild(repliesRenderer);
        rootShadow.appendChild(thread);
      }, 260);
    });
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      const fixtureRoot = document.createElement("section");
      fixtureRoot.className = "right-container";
      fixtureRoot.setAttribute("data-bsb-sidebar-fixture", "true");
      fixtureRoot.style.position = "fixed";
      fixtureRoot.style.top = "176px";
      fixtureRoot.style.right = "24px";
      fixtureRoot.style.zIndex = "9999";
      fixtureRoot.style.width = "240px";
      fixtureRoot.innerHTML = `
        <article class="video-page-card-small" data-bsb-smoke-card="video-sidebar" style="position:relative;">
          <a class="b-img" href="https://www.bilibili.com/video/BV17x411w7KC/" style="display:block;position:relative;width:168px;height:94px;border-radius:16px;overflow:hidden;background:#111827;">
            <img src="https://example.com/sidebar-cover.jpg" alt="sidebar cover" style="width:100%;height:100%;object-fit:cover;">
          </a>
        </article>
      `;
      document.body.appendChild(fixtureRoot);
    });
    await page.waitForTimeout(700);
    await page.waitForFunction(
      () => (document.querySelector(".bsb-tm-title-pill")?.textContent ?? "").trim().length > 0,
      undefined,
      { timeout: 12000 }
    );
    const longTitleText =
      "【从劣到优】锐评2026热门男士内裤：10-200全价位覆盖，真人上身实测，多维度对比，给兄弟们把长标题胶囊稳定性一次测透";
    await page.evaluate((titleText) => {
      const title = document.querySelector(
        ".video-info-container h1, .video-title-container h1, .media-right h1, h1.video-title, .video-title"
      );
      if (title instanceof HTMLElement) {
        title.textContent = titleText;
      }
    }, longTitleText);
    await page.waitForTimeout(180);
    await page.evaluate(() => {
      document.querySelector(".bsb-tm-title-pill")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await page.waitForTimeout(450);
    await captureLocator(page.locator(".bsb-tm-video-header-shell").first(), "video-compact-header");
    await captureLocator(page.locator(".bsb-tm-title-popover").first(), "video-title-popover");
    await captureLocator(page.locator(".video-info-container, .video-title-container").first(), "video-title-area");
    const titleLayoutWideState = await page.evaluate(() => {
      const title = document.querySelector(
        ".video-info-container h1, .video-title-container h1, .media-right h1, h1.video-title, .video-title"
      );
      const titleContainer = document.querySelector(".video-info-container, .video-title-container, .media-right");
      const pill = document.querySelector(".bsb-tm-title-pill");
      const pillRect = pill?.getBoundingClientRect();
      const titleRect = title?.getBoundingClientRect();
      const titleContainerRect = titleContainer?.getBoundingClientRect();
      return {
        accessoryHostCount: document.querySelectorAll("[data-bsb-title-accessories='true']").length,
        pillCount: document.querySelectorAll(".bsb-tm-title-pill-wrap").length,
        pillRect: pillRect
          ? { width: pillRect.width, height: pillRect.height, top: pillRect.top, left: pillRect.left }
          : null,
        titleRect: titleRect ? { width: titleRect.width, height: titleRect.height, top: titleRect.top, left: titleRect.left } : null,
        titleContainerRect: titleContainerRect
          ? { width: titleContainerRect.width, height: titleContainerRect.height, top: titleContainerRect.top, left: titleContainerRect.left }
          : null,
        titleClientRectCount: title instanceof HTMLElement ? title.getClientRects().length : 0
      };
    });
    await page.setViewportSize({ width: 980, height: 720 });
    await page.waitForTimeout(220);
    await captureLocator(page.locator(".video-info-container, .video-title-container").first(), "video-title-area-narrow");
    const titleLayoutNarrowState = await page.evaluate(() => {
      const title = document.querySelector(
        ".video-info-container h1, .video-title-container h1, .media-right h1, h1.video-title, .video-title"
      );
      const pill = document.querySelector(".bsb-tm-title-pill");
      const pillRect = pill?.getBoundingClientRect();
      return {
        accessoryHostCount: document.querySelectorAll("[data-bsb-title-accessories='true']").length,
        pillCount: document.querySelectorAll(".bsb-tm-title-pill-wrap").length,
        pillRect: pillRect ? { width: pillRect.width, height: pillRect.height } : null,
        titleClientRectCount: title instanceof HTMLElement ? title.getClientRects().length : 0
      };
    });
    const titlePopoverState = await page.evaluate(() => ({
      titlePopoverVisible: (() => {
        const popover = document.querySelector(".bsb-tm-title-popover");
        return popover instanceof HTMLElement && !popover.hidden && popover.classList.contains("open");
      })(),
      titlePopoverButtonLabels: Array.from(
        document.querySelectorAll(".bsb-tm-title-popover .bsb-tm-pill-action:not([hidden])")
      ).map((node) => node.textContent ?? "")
    }));

    await page.evaluate(() => {
      const button = document.querySelector(".bsb-tm-pill-action.positive");
      if (button instanceof HTMLButtonElement) {
        button.click();
      }
    });
    await page.waitForTimeout(350);

    await page.evaluate(async () => {
      const video = document.querySelector("video");
      if (!video) {
        return;
      }
      video.muted = true;
      try {
        await video.play();
      } catch (_error) {}
      video.currentTime = 66;
    });
    await page.waitForTimeout(2200);
    await capture(page, "video-preview-and-comment-filter");
    await captureLocator(page.locator(".bpx-player-container, #bilibili-player, #playerWrap").first(), "video-player-notice");
    await captureLocator(page.locator(".bsb-tm-title-pill-wrap").first(), "video-title-pill");
    await captureLocator(page.locator("[data-bsb-smoke-card='video-sidebar'] .sponsorThumbnailLabelVisible").first(), "video-sidebar-thumbnail-label");
    const skipNoticeSeen = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".bsb-tm-notice-title")).some((node) => {
        return (node.textContent ?? "").includes("自动跳过");
      });
    });

    await page.setViewportSize({ width: 1100, height: 540 });
    await page.evaluate(() => {
      document
        .querySelector(".bsb-tm-pill-action.subtle")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await page.waitForTimeout(300);
    await page.click("[data-tab='behavior']");
    await page.waitForTimeout(200);
    const behaviorTabWasActive = await page.locator("[data-tab='behavior']").evaluate((element) =>
      element.classList.contains("active")
    );
    const behaviorPanelHeight = await page.locator(".bsb-tm-panel").first().evaluate((element) => element.getBoundingClientRect().height);
    await captureLocator(page.locator(".bsb-tm-panel").first(), "video-settings-panel");
    await page.evaluate(() => {
      const content = document.querySelector(".bsb-tm-panel-content");
      if (content instanceof HTMLElement) {
        content.scrollTop = content.scrollHeight;
      }
    });
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      const lastSelect = Array.from(document.querySelectorAll(".bsb-tm-category-row select")).at(-1);
      if (!(lastSelect instanceof HTMLSelectElement)) {
        return;
      }
      lastSelect.value = lastSelect.value === "off" ? "notice" : "off";
      lastSelect.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(260);
    await captureLocator(page.locator(".bsb-tm-panel").first(), "video-settings-panel-bottom");
    await page.click("[data-tab='filters']");
    await page.waitForTimeout(180);
    const filtersPanelHeight = await page.locator(".bsb-tm-panel").first().evaluate((element) => element.getBoundingClientRect().height);
    await page.click("[data-tab='help']");
    await page.waitForTimeout(180);
    const helpPanelHeight = await page.locator(".bsb-tm-panel").first().evaluate((element) => element.getBoundingClientRect().height);

    const result = await page.evaluate(() => ({
      bridgeReady: Boolean(window.__BSB_TM_PAGE_BRIDGE__),
      previewBarCount: document.querySelectorAll("#previewbar .previewbar").length,
      requestCount: (window.__bsbRequestLog ?? []).filter((entry) => entry.url.includes("/api/skipSegments/")).length,
      currentTime: document.querySelector("video")?.currentTime ?? 0,
      noticeTitles: Array.from(document.querySelectorAll(".bsb-tm-notice-title")).map((node) => node.textContent ?? ""),
      titlePillText: document.querySelector(".bsb-tm-title-pill")?.textContent ?? "",
      titlePillActions: Array.from(document.querySelectorAll(".bsb-tm-pill-action")).map((node) => node.textContent ?? ""),
      playerButtonCount: document.querySelectorAll(".bsb-tm-player-button").length,
      headerButtonCount: document.querySelectorAll(".bsb-tm-title-accessories .bsb-tm-player-button").length,
      playerAreaButtonCount:
        document.querySelectorAll(
          ".bpx-player-control-bottom-right .bsb-tm-player-button, .bpx-player-control-bottom-center-right .bsb-tm-player-button"
        ).length,
      voteRequestCount: (window.__bsbRequestLog ?? []).filter((entry) => entry.url.includes("/api/voteOnSponsorTime")).length,
      panelOpen: document.documentElement.classList.contains("bsb-tm-panel-open"),
      panelHeight: document.querySelector(".bsb-tm-panel")?.getBoundingClientRect().height ?? 0,
      viewportHeight: window.innerHeight,
      panelContentClientHeight: (() => {
        const content = document.querySelector(".bsb-tm-panel-content");
        return content instanceof HTMLElement ? content.clientHeight : 0;
      })(),
      panelContentScrollHeight: (() => {
        const content = document.querySelector(".bsb-tm-panel-content");
        return content instanceof HTMLElement ? content.scrollHeight : 0;
      })(),
      panelContentScrollTop: (() => {
        const content = document.querySelector(".bsb-tm-panel-content");
        if (!(content instanceof HTMLElement)) {
          return 0;
        }
        content.scrollTop = content.scrollHeight;
        return content.scrollTop;
      })(),
      panelScrollTopAfterConfigChange: (() => {
        const content = document.querySelector(".bsb-tm-panel-content");
        return content instanceof HTMLElement ? content.scrollTop : 0;
      })(),
      commentBadgeCount:
        document.querySelector("#bsb-smoke-comments")?.shadowRoot?.querySelectorAll("[data-bsb-comment-processed='true']").length ?? 0,
      replyBadgeCount:
        document
          .querySelector("#bsb-smoke-comments")
          ?.shadowRoot?.querySelector("bili-comment-thread-renderer")
          ?.shadowRoot?.querySelector("bili-comment-replies-renderer")
          ?.shadowRoot?.querySelectorAll("[data-bsb-comment-reply-processed='true']").length ?? 0
      ,
      compactHeaderClass: document.documentElement.classList.contains("bsb-tm-video-header-compact"),
      compactHeaderLeftHidden: (() => {
        const nativeHeader = document.querySelector(".bili-header.fixed-header");
        if (!(nativeHeader instanceof HTMLElement)) {
          return true;
        }
        const style = getComputedStyle(nativeHeader);
        return style.opacity === "0" || style.visibility === "hidden" || style.pointerEvents === "none";
      })(),
      compactHeaderSearchWidth: (() => {
        const element =
          document.querySelector(".bsb-tm-video-header-search") ??
          document.querySelector(".bsb-tm-video-header-fallback-search");
        return element instanceof HTMLElement ? element.getBoundingClientRect().width : 0;
      })(),
      compactHeaderShellCount: document.querySelectorAll(".bsb-tm-video-header-shell").length,
      compactHeaderAvatarCount: document.querySelectorAll(".bsb-tm-video-header-avatar").length,
      compactHeaderProfileCount: (() => {
        const profile = document.querySelector(".bsb-tm-video-header-profile");
        if (!(profile instanceof HTMLElement)) {
          return 0;
        }
        return Array.from(profile.children).filter((node) => {
          return node instanceof HTMLElement && getComputedStyle(node).display !== "none";
        }).length;
      })(),
      compactHeaderGapToTitle: (() => {
        const header = document.querySelector(".bsb-tm-video-header-shell");
        const title = document.querySelector(".video-info-container, .video-title-container");
        if (!(header instanceof HTMLElement) || !(title instanceof HTMLElement)) {
          return 0;
        }
        return title.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
      })(),
      sidebarBadgeState: (() => {
        const cover = document.querySelector("[data-bsb-smoke-card='video-sidebar'] .b-img");
        const label = document.querySelector("[data-bsb-smoke-card='video-sidebar'] .sponsorThumbnailLabelVisible");
        const coverRect = cover?.getBoundingClientRect();
        const labelRect = label?.getBoundingClientRect();
        return {
          visibleLabelCount: document.querySelectorAll("[data-bsb-smoke-card='video-sidebar'] .sponsorThumbnailLabelVisible").length,
          centered:
            coverRect && labelRect
              ? Math.abs(labelRect.left + labelRect.width / 2 - (coverRect.left + coverRect.width / 2)) <= 18
              : false,
          aboveCover:
            coverRect && labelRect
              ? labelRect.top + labelRect.height / 2 < coverRect.top + 12
              : false
        };
      })()
    }));

    assert(result.bridgeReady, "Page bridge was not initialized on the video page.");
    assert(result.previewBarCount > 0, "Video page did not render preview bar segments.");
    assert(result.requestCount > 0, "Video page did not request SponsorBlock segments.");
    assert(result.currentTime > 86, "Video page did not auto-skip the fixture sponsor segment.");
    assert(result.titlePillText.trim().length > 0, "Video page did not render any title pill.");
    assert(titleLayoutWideState.accessoryHostCount === 1, "Video page created duplicate title accessory hosts under a long title.");
    assert(titleLayoutWideState.pillCount === 1, "Video page rendered duplicate title pills under a long title.");
    assert(titleLayoutWideState.pillRect !== null, "Video page could not measure the title pill under a long title.");
    assert(titleLayoutWideState.titleRect !== null, "Video page could not measure the title text under a long title.");
    assert(titleLayoutWideState.titleContainerRect !== null, "Video page could not measure the title container under a long title.");
    assert(titleLayoutWideState.pillRect.height <= 48, "Video page title pill collapsed into an abnormally tall block under a long title.");
    assert(
      titleLayoutWideState.pillRect.width > titleLayoutWideState.pillRect.height * 1.4,
      "Video page title pill lost its horizontal pill shape under a long title."
    );
    assert(titleLayoutWideState.titleClientRectCount <= 2, "Video page title text expanded into too many lines under a long title.");
    assert(titleLayoutNarrowState.accessoryHostCount === 1, "Video page duplicated accessory hosts after a narrow-width resize.");
    assert(titleLayoutNarrowState.pillCount === 1, "Video page duplicated title pills after a narrow-width resize.");
    assert(titleLayoutNarrowState.pillRect !== null, "Video page could not measure the title pill after a narrow-width resize.");
    assert(titleLayoutNarrowState.pillRect.height <= 52, "Video page title pill collapsed into a tall block after a narrow-width resize.");
    assert(
      titleLayoutNarrowState.pillRect.width > titleLayoutNarrowState.pillRect.height * 1.2,
      "Video page title pill lost horizontal stability after a narrow-width resize."
    );
    assert(titleLayoutNarrowState.titleClientRectCount <= 2, "Video page title text expanded into too many lines after a narrow-width resize.");
    assert(titlePopoverState.titlePopoverVisible, "Video page did not keep the title-pill popover visibly open.");
    const hasVoteAction = result.titlePillActions.some((text) => text.includes("标记正确"));
    const hasLocalLearningAction = result.titlePillActions.some((text) => text.includes("保留本地标签"));
    assert(
      hasVoteAction || hasLocalLearningAction,
      "Video page did not expose title-pill feedback or local-learning actions."
    );
    assert(
      titlePopoverState.titlePopoverButtonLabels.some(
        (text) => text.includes("标记正确") || text.includes("保留本地标签")
      ),
      "Video page did not visibly render the primary title-pill action."
    );
    assert(result.playerButtonCount === 0, "Video page still rendered a standalone quick-access button when a title pill exists.");
    assert(result.headerButtonCount === 0, "Video page should not place a duplicate quick-access button beside the title pill.");
    assert(result.playerAreaButtonCount === 0, "Video page still rendered the quick-access button inside the player controls.");
    if (hasVoteAction) {
      assert(result.voteRequestCount > 0, "Video page did not submit a vote request from the title badge.");
    }
    assert(result.panelOpen, "Video page did not open the settings panel from the title-pill settings action.");
    assert(behaviorTabWasActive, "Video page did not switch the settings panel to the behavior tab.");
    assert(result.panelHeight <= result.viewportHeight - 8, "Settings panel exceeded the reduced viewport height.");
    assert(
      result.panelContentScrollHeight > result.panelContentClientHeight + 32,
      "Settings panel content did not become scrollable under a reduced viewport."
    );
    assert(result.panelContentScrollTop > 0, "Settings panel content could not scroll to the lower settings.");
    assert(result.panelScrollTopAfterConfigChange > 0, "Changing a setting reset the settings panel back to the top.");
    assert(
      Math.max(behaviorPanelHeight, filtersPanelHeight, helpPanelHeight) -
        Math.min(behaviorPanelHeight, filtersPanelHeight, helpPanelHeight) <=
        2,
      "Settings panel height still jumps between tabs."
    );
    assert(result.compactHeaderClass, "Video page did not enable the compact header class.");
    assert(result.compactHeaderLeftHidden, "Video page compact header still exposed extra personal-area entries.");
    assert(result.compactHeaderShellCount === 1, "Video page rendered duplicate compact header shells.");
    assert(result.compactHeaderSearchWidth > 220, "Video page compact header did not keep the search bar visible.");
    assert(result.compactHeaderProfileCount > 0, "Video page compact header did not keep a personal-area entry.");
    assert(result.compactHeaderGapToTitle < 36, "Video page compact header still leaves an oversized blank gap above the title area.");
    assert(result.sidebarBadgeState.visibleLabelCount > 0, "Video sidebar cards did not render thumbnail labels.");
    assert(result.sidebarBadgeState.centered, "Video sidebar badge is no longer centered above the cover.");
    assert(result.sidebarBadgeState.aboveCover, "Video sidebar badge did not stay above the cover.");
    assert(skipNoticeSeen, "Video page did not surface the player skip notice.");
    assert(result.commentBadgeCount > 0, "Comment filter did not process injected sponsored comment.");
    assert(result.replyBadgeCount > 0, "Comment filter did not process injected sponsored reply.");
  } finally {
    await context.close();
  }
}

async function verifyFailureHandling(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await installGmShims(page, { failSegmentRequests: true });

  try {
    await page.goto("https://www.bilibili.com/video/BV1Wx2TBrE8X/", { waitUntil: "domcontentloaded" });
    const userscript = await readFile(scriptPath, "utf8");
    await injectUserscript(page, userscript);
    await page.waitForSelector("video", { timeout: 15000 });
    await page.waitForTimeout(1200);
    await capture(page, "video-error-notice");

    const result = await page.evaluate(() => ({
      noticeTitles: Array.from(document.querySelectorAll(".bsb-tm-notice-title")).map((node) => node.textContent ?? ""),
      noticeMessages: Array.from(document.querySelectorAll(".bsb-tm-notice-message")).map((node) => node.textContent ?? "")
    }));

    assert(result.noticeTitles.includes("片段读取失败"), "Failure path did not surface a user-facing error title.");
    assert(
      result.noticeMessages.some((message) => message.includes("SponsorBlock API returned 500")),
      "Failure path did not surface the API error details."
    );
  } finally {
    await context.close();
  }
}

async function main() {
  const browser = await chromium.launch({
    executablePath: browserPath,
    headless: true
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await installGmShims(page);
    await verifyHomePage(page);
    await context.close();
    await verifySearchPage(browser);
    await verifyHistoryMenuBadge(browser);
    await verifyDynamicLabelMode(browser);
    await verifyVideoPage(browser);
    await verifyFailureHandling(browser);
    console.log("Bilibili smoke test passed.");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
