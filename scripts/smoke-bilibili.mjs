import { readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const rootDir = path.resolve(import.meta.dirname, "..");
const scriptPath = path.join(rootDir, "dist", "bilibili-sponsorblock.user.js");
const browserPath =
  process.env.BSB_SMOKE_BROWSER_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function installGmShims(page, options = {}) {
  const { failSegmentRequests = false, initialStore = {} } = options;
  await page.exposeFunction("__bsbNodeRequest", async (details) => {
    if (failSegmentRequests && details.url.includes("/api/skipSegments/")) {
      return {
        status: 500,
        responseText: "{\"error\":\"forced-smoke-failure\"}"
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
    window.GM_xmlhttpRequest = (details) => {
      requestLog.push({ method: details.method ?? "GET", url: details.url });
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
  await page.waitForTimeout(1500);
}

async function verifyHomePage(page) {
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
  await page.waitForTimeout(600);

  const result = await page.evaluate(() => ({
    hasButton: Boolean(document.querySelector(".bsb-tm-entry-button.is-floating")),
    dynamicBadgeCount: document.querySelectorAll("[data-bsb-dynamic-badge]").length,
    dynamicToggleCount: document.querySelectorAll("[data-bsb-dynamic-toggle]").length,
    hiddenContentCount: document.querySelectorAll(".bili-dyn-content[style*='display: none']").length
  }));

  assert(result.hasButton, "Home page did not render the floating BSB button.");
  assert(result.dynamicBadgeCount > 0, "Dynamic filter did not label injected promo content.");
  assert(result.dynamicToggleCount > 0, "Dynamic filter did not add a reveal toggle.");
  assert(result.hiddenContentCount > 0, "Dynamic filter did not hide injected promo content.");
}

async function verifyHomePageLabelMode(browser) {
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
    await page.waitForTimeout(600);

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

async function verifyVideoPage(page) {
  await page.goto("https://www.bilibili.com/video/BV1hyQoBgEGs", { waitUntil: "domcontentloaded" });
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
  await page.waitForTimeout(1600);

  const result = await page.evaluate(() => ({
    hasInlineButton: Boolean(document.querySelector(".bsb-tm-entry-button")),
    requestCount: (window.__bsbRequestLog ?? []).filter((entry) => entry.url.includes("/api/skipSegments/")).length,
    bridgeReady: Boolean(window.__BSB_TM_PAGE_BRIDGE__),
    commentBadgeCount:
      document.querySelector("#bsb-smoke-comments")?.shadowRoot?.querySelectorAll("[data-bsb-comment-processed='true']").length ?? 0,
    commentToggleCount:
      document
        .querySelector("#bsb-smoke-comments")
        ?.shadowRoot?.querySelector("bili-comment-thread-renderer")
        ?.shadowRoot?.querySelector("bili-comment-renderer")
        ?.shadowRoot?.querySelector("#main")
        ?.querySelector("bili-comment-action-buttons-renderer")
        ?.shadowRoot?.querySelectorAll("[data-bsb-comment-toggle='true']").length ?? 0,
    replyBadgeCount:
      document
        .querySelector("#bsb-smoke-comments")
        ?.shadowRoot?.querySelector("bili-comment-thread-renderer")
        ?.shadowRoot?.querySelector("bili-comment-replies-renderer")
        ?.shadowRoot?.querySelectorAll("[data-bsb-comment-reply-processed='true']").length ?? 0
  }));

  assert(result.hasInlineButton, "Video page did not render the BSB button.");
  assert(result.bridgeReady, "Page bridge was not initialized on the video page.");
  assert(result.requestCount > 0, "Video page did not request SponsorBlock segments.");
  assert(result.commentBadgeCount > 0, "Comment filter did not process injected sponsored comment.");
  assert(result.commentToggleCount > 0, "Comment filter did not add a sponsored-comment toggle.");
  assert(result.replyBadgeCount > 0, "Comment filter did not process injected sponsored reply.");
}

async function verifyFailureHandling(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await installGmShims(page, { failSegmentRequests: true });

  try {
    await page.goto("https://www.bilibili.com/video/BV1hyQoBgEGs", { waitUntil: "domcontentloaded" });
    const userscript = await readFile(scriptPath, "utf8");
    await injectUserscript(page, userscript);
    await page.waitForSelector("video", { timeout: 15000 });
    await page.waitForTimeout(1200);

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
    await verifyVideoPage(page);
    await context.close();
    await verifyHomePageLabelMode(browser);
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
