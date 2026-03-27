import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const rootDir = path.resolve(import.meta.dirname, "..");
const scriptPath = path.join(rootDir, "dist", "bilibili-sponsorblock.user.js");
const browserPath =
  process.env.BSB_SMOKE_BROWSER_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const captureDir = process.env.BSB_SMOKE_CAPTURE_DIR ? path.resolve(rootDir, process.env.BSB_SMOKE_CAPTURE_DIR) : null;

const FIXTURE_SEGMENT_PREFIX = "ba5f";
const FIXTURE_LABEL_PREFIX = "f0f6";

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
    await locator.screenshot({
      path: path.join(captureDir, `${name}.png`)
    });
  } catch (error) {
    console.warn(`Skipping locator capture for ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function installGmShims(page, options = {}) {
  const { failSegmentRequests = false, initialStore = {} } = options;

  await page.exposeFunction("__bsbNodeRequest", async (details) => {
    if (details.url.includes(`/api/skipSegments/${FIXTURE_SEGMENT_PREFIX}`)) {
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
              }
            ]
          }
        ])
      };
    }

    if (details.url.includes(`/api/videoLabels/${FIXTURE_LABEL_PREFIX}`)) {
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
    section.innerHTML = `
      <div class="container">
        <article class="bili-video-card" data-bsb-smoke-card="home">
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
  await captureLocator(page.locator("[data-bsb-smoke-card='home']").first(), "home-thumbnail-label-card");

  const result = await page.evaluate(() => ({
    overlayCount: document.querySelectorAll(".sponsorThumbnailLabelVisible").length,
    requestCount: (window.__bsbRequestLog ?? []).filter((entry) => entry.url.includes("/api/videoLabels/")).length,
    hasLegacyButton: Boolean(document.querySelector(".bsb-tm-entry-button")),
    panelMounted: Boolean(document.querySelector(".bsb-tm-panel-backdrop")),
    panelOpen: document.documentElement.classList.contains("bsb-tm-panel-open")
  }));

  assert(result.overlayCount > 0, "Home page did not render any thumbnail labels.");
  assert(result.requestCount > 0, "Home page did not request thumbnail label data.");
  assert(!result.hasLegacyButton, "Legacy floating button is still being rendered.");
  assert(!result.panelMounted, "Home page mounted the settings panel before the user explicitly opened it.");
  assert(!result.panelOpen, "Home page left the document in panel-open mode.");
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
      const card = document.createElement("article");
      card.className = "bili-video-card";
      card.setAttribute("data-bsb-smoke-card", "search");
      card.innerHTML = `
        <a class="bili-video-card__cover" href="https://www.bilibili.com/video/BV17x411w7KC/">
          <img src="https://example.com/search-fixture.jpg" alt="search cover">
        </a>
        <div class="bili-video-card__info">
          <h3>搜索页测试卡片</h3>
        </div>
      `;

      const wrapper = document.querySelector(".search-page-wrapper");
      if (wrapper) {
        wrapper.prepend(card);
        return;
      }

      const fallback = document.createElement("section");
      fallback.className = "search-page-wrapper";
      fallback.appendChild(card);
      document.body.prepend(fallback);
    });
    await page.waitForTimeout(900);
    await capture(page, "search-thumbnail-labels");
    await captureLocator(page.locator("[data-bsb-smoke-card='search']").first(), "search-thumbnail-label-card");

    const result = await page.evaluate(() => {
      return {
        visibleLabelCount: document.querySelectorAll(".search-page-wrapper .sponsorThumbnailLabelVisible").length,
        requestCount: (window.__bsbRequestLog ?? []).filter((entry) => entry.url.includes("/api/videoLabels/")).length,
        panelMounted: Boolean(document.querySelector(".bsb-tm-panel-backdrop")),
        fixtureExists: Boolean(document.querySelector("[data-bsb-smoke-card='search']"))
      };
    });

    assert(result.fixtureExists, "Search page fixture card was not inserted.");
    assert(result.visibleLabelCount > 0, "Search page did not render any thumbnail labels.");
    assert(result.requestCount > 0, "Search page did not request thumbnail label data.");
    assert(!result.panelMounted, "Search page mounted the settings panel before user interaction.");
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
  const context = await browser.newContext();
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

    const result = await page.evaluate(() => ({
      bridgeReady: Boolean(window.__BSB_TM_PAGE_BRIDGE__),
      previewBarCount: document.querySelectorAll("#previewbar .previewbar").length,
      requestCount: (window.__bsbRequestLog ?? []).filter((entry) => entry.url.includes("/api/skipSegments/")).length,
      currentTime: document.querySelector("video")?.currentTime ?? 0,
      noticeTitles: Array.from(document.querySelectorAll(".bsb-tm-notice-title")).map((node) => node.textContent ?? ""),
      commentBadgeCount:
        document.querySelector("#bsb-smoke-comments")?.shadowRoot?.querySelectorAll("[data-bsb-comment-processed='true']").length ?? 0,
      replyBadgeCount:
        document
          .querySelector("#bsb-smoke-comments")
          ?.shadowRoot?.querySelector("bili-comment-thread-renderer")
          ?.shadowRoot?.querySelector("bili-comment-replies-renderer")
          ?.shadowRoot?.querySelectorAll("[data-bsb-comment-reply-processed='true']").length ?? 0
    }));

    assert(result.bridgeReady, "Page bridge was not initialized on the video page.");
    assert(result.previewBarCount > 0, "Video page did not render preview bar segments.");
    assert(result.requestCount > 0, "Video page did not request SponsorBlock segments.");
    assert(result.currentTime > 86, "Video page did not auto-skip the fixture sponsor segment.");
    assert(
      result.noticeTitles.some((title) => title.includes("自动跳过")),
      "Video page did not surface the player skip notice."
    );
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
