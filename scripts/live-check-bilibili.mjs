import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const rootDir = path.resolve(import.meta.dirname, "..");
const scriptPath = path.join(rootDir, "dist", "bilibili-qol-core.user.js");
const outputDir = path.join(rootDir, "output", "playwright");
const browserPath =
  process.env.BSB_SMOKE_BROWSER_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function installGmShims(page, initialConfig = {}) {
  await page.exposeFunction("__bsbNodeRequest", async (details) => {
    const response = await fetch(details.url, {
      method: details.method ?? "GET",
      headers: details.headers ?? {},
      body: details.body
    });

    return {
      status: response.status,
      responseText: await response.text()
    };
  });

  await page.addInitScript((seedConfig) => {
    const store = {
      bsb_tm_config_v1: {
        enabled: true,
        serverAddress: "https://www.bsbsb.top",
        enableCache: true,
        noticeDurationSec: 4,
        minDurationSec: 0,
        showPreviewBar: true,
        compactVideoHeader: true,
        thumbnailLabelMode: "overlay",
        categoryModes: {
          sponsor: "auto",
          selfpromo: "manual",
          interaction: "manual",
          intro: "manual",
          outro: "manual",
          preview: "notice",
          padding: "auto",
          music_offtopic: "auto",
          poi_highlight: "manual",
          exclusive_access: "notice"
        },
        categoryColorOverrides: {},
        dynamicFilterMode: "off",
        dynamicRegexPattern:
          "/618|11(?!1).11(?:日)?|双(?:11|十一|12|十二)|女神节|开学季|年货节|恰(?:个|了|到)?饭|金主|邀请码|好物推荐|(?:购买|使用|开箱)清单|(他|它|她)(?:们)?家(?:的)?|(?:评论区)?(?:领(?:取|张|到)?|抢|送|得|叠)(?:我的)?(?:神|优惠|红包|折扣|福利|无门槛|隐藏|秘密|专属|(?:超)?大(?:额)?|额外)+(?:券|卷|劵|q(?:uan)?)?(?:后|到手|价|使用|下单)?|(?:领|抢|得|送)(?:红包|优惠|券|福利)|(?:优惠|(?:券|卷|劵)后|到手|促销|活动|神)价|(?:淘宝|tb|京东|jd|狗东|拼多多|pdd|天猫|tmall)搜索|(?:随(便|时)|任意)(?:退|退货|换货)|(?:免费|无偿)(?:换(?:个)?新|替换|更换|试用)(?:商品|物品)?|(?:点(?:击)?|戳|来|我)评论区(?:置顶)?|(?:立即|蓝链|链接|🔗)(?:购买|下单)|(?:vx|wx|微信|软件)扫码(?:领)?(?:优惠|红包|券)?|(?:我的)?同款(?:[的]?(?:推荐|好物|商品|入手|购买|拥有|分享|安利)?)|满\\d+|大促|促销|折扣|特价|秒杀|广告|推广|低至|热卖|抢购|新品|豪礼|赠品|密令|(?:饿了么|美(?:团|団)|百度外卖|蜂鸟|达达|UU跑腿|(?:淘宝)?闪购)|(?:点|订|送|吃)(?:外卖|餐)|外卖(?:节|服务|平台|app)/gi",
        dynamicRegexKeywordMinMatches: 1,
        commentFilterMode: "hide",
        commentHideReplies: false,
        ...seedConfig
      }
    };

    window.GM_getValue = (key, fallback) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : fallback);
    window.GM_setValue = (key, value) => {
      store[key] = value;
    };
    window.GM_deleteValue = (key) => {
      delete store[key];
    };
    window.GM_addStyle = (css) => {
      const style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);
    };
    window.GM_registerMenuCommand = () => {};
    window.GM_xmlhttpRequest = (details) => {
      window
        .__bsbNodeRequest({
          method: details.method ?? "GET",
          url: details.url,
          headers: details.headers ?? {},
          body: details.data
        })
        .then((response) => {
          details.onload?.({
            status: response.status,
            responseText: response.responseText
          });
        })
        .catch((error) => {
          details.onerror?.(error);
        });

      return { abort() {} };
    };
  }, initialConfig);
}

async function injectUserscript(page) {
  const userscript = await readFile(scriptPath, "utf8");
  await page.addScriptTag({ content: userscript });
  await page.waitForTimeout(2200);
}

async function checkVideo(page, { url, name, revealComments = false }) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await injectUserscript(page);
  await page.waitForSelector("video", { timeout: 15000 });

  if (revealComments) {
    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight * 0.58, behavior: "instant" });
    });
    await page.waitForTimeout(7000);
  } else {
    await page.waitForTimeout(4000);
  }

  const pill = page.locator(".bsb-tm-title-pill").first();
  const pillVisible = await pill.isVisible().catch(() => false);
  if (pillVisible) {
    await pill.click();
    await page.waitForTimeout(500);
  }

  await mkdir(outputDir, { recursive: true });
  await page.screenshot({
    path: path.join(outputDir, `${name}.png`),
    fullPage: true
  });

  return await page.evaluate(() => {
    const popover = document.querySelector(".bsb-tm-title-popover");
    const buttons = Array.from(document.querySelectorAll(".bsb-tm-title-popover .bsb-tm-pill-action")).map((button) => ({
      text: button.textContent?.trim() ?? "",
      disabled: button instanceof HTMLButtonElement ? button.disabled : false
    }));

    return {
      title: document.querySelector("h1")?.textContent?.trim() ?? "",
      titlePillText: document.querySelector(".bsb-tm-title-pill")?.textContent?.trim() ?? null,
      titlePillCategory: document.querySelector(".bsb-tm-title-pill-wrap")?.getAttribute("data-category") ?? null,
      titlePillUuidPrefix:
        document.querySelector(".bsb-tm-title-pill-wrap")?.getAttribute("data-category") &&
        (window.document.querySelector(".bsb-tm-title-pill") ? "visible" : "hidden"),
      popoverVisible:
        popover instanceof HTMLElement ? !popover.hidden && popover.classList.contains("open") : false,
      popoverButtons: buttons,
      commentBadgeCount: document.querySelectorAll("[data-bsb-comment-badge]").length,
      commentToggleCount: document.querySelectorAll("[data-bsb-comment-toggle]").length
    };
  });
}

async function main() {
  const browser = await chromium.launch({
    executablePath: browserPath,
    headless: true
  });
  const context = await browser.newContext({
    viewport: {
      width: 1365,
      height: 900
    }
  });
  const page = await context.newPage();
  await installGmShims(page);

  try {
    const resultA = await checkVideo(page, {
      url: "https://www.bilibili.com/video/BV1pyAnz9Efb/",
      name: "live-check-be7200"
    });
    const resultB = await checkVideo(page, {
      url: "https://www.bilibili.com/video/BV13WXFBHE92/",
      name: "live-check-iphone15t",
      revealComments: true
    });
    const resultC = await checkVideo(page, {
      url: "https://www.bilibili.com/video/BV14vPfzMEwN/",
      name: "live-check-miclaw",
      revealComments: true
    });

    console.log(JSON.stringify({ resultA, resultB, resultC }, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
