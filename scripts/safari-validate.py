from __future__ import annotations

import json
import os
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.safari.options import Options

REPO_ROOT = Path(__file__).resolve().parents[1]
DIST_PATH = REPO_ROOT / "dist" / "bilibili-sponsorblock.user.js"
OUTPUT_DIR = REPO_ROOT / "output" / "safari"

TARGETS = [
    ("video-main", "https://www.bilibili.com/video/BV1HDcMz5Ep3/"),
    ("video-comments", "https://www.bilibili.com/video/BV14vPfzMEwN/"),
    ("search", "https://search.bilibili.com/all?keyword=%E6%9E%81%E5%AE%A2%E6%B9%BE"),
]

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
          thumbnailLabels: document.querySelectorAll(".sponsorThumbnailLabelVisible").length,
          sidebarLabels: document.querySelectorAll(".right-container .sponsorThumbnailLabelVisible, .rec-list .sponsorThumbnailLabelVisible, .next-play-list .sponsorThumbnailLabelVisible").length,
          commentLocationBadges: document.querySelectorAll("[data-bsb-comment-location='true']").length,
          commentBadges: document.querySelectorAll("[data-bsb-comment-badge='true']").length
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
            driver.execute_script(runtime)
            wait_for_script_activity(driver)
            time.sleep(3)
            results[slug] = collect_snapshot(driver)
            driver.save_screenshot(str(OUTPUT_DIR / f"{slug}.png"))
    finally:
        driver.quit()

    (OUTPUT_DIR / "safari-validate.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )


if __name__ == "__main__":
    os.chdir(REPO_ROOT)
    main()
