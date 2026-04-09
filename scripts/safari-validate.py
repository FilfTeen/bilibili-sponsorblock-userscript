from __future__ import annotations

import json
import os
import time
from pathlib import Path

from selenium import webdriver
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.safari.options import Options

REPO_ROOT = Path(__file__).resolve().parents[1]
DIST_PATH = REPO_ROOT / "dist" / "bilibili-sponsorblock.user.js"
OUTPUT_DIR = REPO_ROOT / "output" / "safari"

TARGETS = [
    ("video-main", "https://www.bilibili.com/video/BV1HDcMz5Ep3/"),
    ("video-main-placeholder-enabled", "https://www.bilibili.com/video/BV1HDcMz5Ep3/"),
    ("video-comments", "https://www.bilibili.com/video/BV14vPfzMEwN/"),
    ("search", "https://search.bilibili.com/all?keyword=%E6%9E%81%E5%AE%A2%E6%B9%BE"),
]

CONFIG_STORAGE_KEY = "bsb_tm_config_v1"
PLACEHOLDER_SEARCH_TEXT = "橘鸦Juya · 6小时前更新"

SHIMS = r"""
window.__BSB_TM_TEST_STORE__ = window.__BSB_TM_TEST_STORE__ || {};
window.GM_getValue = async function(key, fallback) {
  return Object.prototype.hasOwnProperty.call(window.__BSB_TM_TEST_STORE__, key)
    ? window.__BSB_TM_TEST_STORE__[key]
    : fallback;
};
window.GM_setValue = async function(key, value) {
  window.__BSB_TM_TEST_STORE__[key] = value;
};
window.GM_addStyle = function(css) {
  const style = document.createElement("style");
  style.setAttribute("data-bsb-safari-validate-style", "true");
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
};
window.GM_registerMenuCommand = function() {};
window.GM_xmlhttpRequest = function(options) {
  fetch(options.url, {
    method: options.method || "GET",
    headers: options.headers || {},
    body: options.data,
    mode: "cors",
    credentials: "omit"
  }).then(async function(response) {
    const text = await response.text();
    if (typeof options.onload === "function") {
      options.onload({
        responseText: text,
        status: response.status
      });
    }
  }).catch(function(error) {
    if (typeof options.onerror === "function") {
      options.onerror(error);
    }
  });
};
"""


def load_runtime() -> str:
    text = DIST_PATH.read_text(encoding="utf-8")
    marker = '"use strict";'
    marker_index = text.find(marker)
    if marker_index == -1:
        raise RuntimeError("Could not find script runtime marker in dist output")
    return text[marker_index:]


def wait_for_ready_state(driver: webdriver.Safari, timeout_seconds: float = 15) -> None:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        state = driver.execute_script("return document.readyState;")
        if state == "complete":
            return
        time.sleep(0.2)


def wait_for_script_activity(driver: webdriver.Safari, timeout_seconds: float = 10) -> None:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        active = driver.execute_script(
            """
            return Boolean(
              document.querySelector(".bsb-tm-video-header-shell, .bsb-tm-title-pill, .sponsorThumbnailLabel, .bsb-tm-panel-shell")
            );
            """
        )
        if active:
            return
        time.sleep(0.25)


def collect_snapshot(driver: webdriver.Safari) -> dict[str, object]:
    return driver.execute_script(
        """
        return {
          title: document.title,
          titlePill: document.querySelector(".bsb-tm-title-pill")?.textContent?.trim() ?? null,
          compactHeader: Boolean(document.querySelector(".bsb-tm-video-header-shell")),
          compactHeaderAvatar: document.querySelector(".bsb-tm-video-header-avatar")?.getAttribute("src") ?? null,
          compactHeaderFallback: Boolean(document.querySelector(".bsb-tm-video-header-profile-fallback")),
          compactHeaderPlaceholder: document.querySelector(".bsb-tm-video-header-fallback-search input")?.getAttribute("placeholder") ?? null,
          thumbnailLabels: document.querySelectorAll(".sponsorThumbnailLabelVisible").length,
          sidebarLabels: document.querySelectorAll(".right-container .sponsorThumbnailLabelVisible, .rec-list .sponsorThumbnailLabelVisible, .next-play-list .sponsorThumbnailLabelVisible").length,
          commentLocationBadges: document.querySelectorAll("[data-bsb-comment-location='true']").length,
          commentBadges: document.querySelectorAll("[data-bsb-comment-badge='true']").length
        };
        """
    )


def prepare_placeholder_search_validation(driver: webdriver.Safari) -> None:
    driver.execute_script(
        f"""
        window.__BSB_TM_TEST_STORE__ = window.__BSB_TM_TEST_STORE__ || {{}};
        window.__BSB_TM_TEST_STORE__[{json.dumps(CONFIG_STORAGE_KEY)}] = {{
          compactHeaderSearchPlaceholderEnabled: true
        }};
        const nativeInput = document.querySelector(".bili-header__bar.mini-header .nav-search-input, .bili-header__bar.mini-header input[type='search'], .nav-search-input, input[type='search']");
        if (nativeInput instanceof HTMLInputElement) {{
          nativeInput.value = "";
          nativeInput.placeholder = {json.dumps(PLACEHOLDER_SEARCH_TEXT)};
        }}
        window.__BSB_LAST_OPEN__ = null;
        window.open = function(url) {{
          window.__BSB_LAST_OPEN__ = url;
          return null;
        }};
        """
    )


def collect_placeholder_search_validation(driver: webdriver.Safari) -> dict[str, object]:
    return driver.execute_script(
        """
        const form = document.querySelector(".bsb-tm-video-header-fallback-search");
        const input = form?.querySelector("input");
        const button = form?.querySelector("button");
        const genericPlaceholder = "搜索 B 站内容";
        if (input instanceof HTMLInputElement) {
          input.value = "";
          input.placeholder = "橘鸦Juya · 6小时前更新";
        }
        const hiddenPlaceholderBeforeSubmit = input instanceof HTMLInputElement ? input.placeholder : null;
        if (form instanceof HTMLFormElement) {
          if (typeof form.requestSubmit === "function") {
            form.requestSubmit(button instanceof HTMLButtonElement ? button : undefined);
          } else if (button instanceof HTMLButtonElement) {
            button.click();
          } else {
            form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
          }
        }
        return {
          compactHeaderSearchPlaceholder: hiddenPlaceholderBeforeSubmit,
          compactHeaderSearchValue: input instanceof HTMLInputElement ? input.value : null,
          compactHeaderLastOpenedUrl: window.__BSB_LAST_OPEN__ ?? null
        };
        """
    )


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    runtime = load_runtime()
    options = Options()
    driver = webdriver.Safari(options=options)
    results: dict[str, object] = {}

    try:
        for slug, url in TARGETS:
            driver.get(url)
            wait_for_ready_state(driver)
            driver.execute_script(SHIMS)
            if slug == "video-main":
                driver.execute_script(
                    """
                    window.__BSB_TM_TEST_STORE__ = window.__BSB_TM_TEST_STORE__ || {};
                    window.__BSB_TM_TEST_STORE__["bsb_tm_config_v1"] = {
                      compactHeaderPlaceholderVisible: false,
                      compactHeaderSearchPlaceholderEnabled: false
                    };
                    """
                )
            if slug == "video-main-placeholder-enabled":
                prepare_placeholder_search_validation(driver)
            driver.execute_script(runtime)
            wait_for_script_activity(driver)
            time.sleep(3)
            snapshot = collect_snapshot(driver)
            if slug == "video-main-placeholder-enabled":
                snapshot["placeholderSearch"] = collect_placeholder_search_validation(driver)
            results[slug] = snapshot
            try:
                driver.save_screenshot(str(OUTPUT_DIR / f"{slug}.png"))
            except WebDriverException:
                snapshot["screenshotError"] = True
    finally:
        driver.quit()

    (OUTPUT_DIR / "safari-validate.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )


if __name__ == "__main__":
    os.chdir(REPO_ROOT)
    main()
