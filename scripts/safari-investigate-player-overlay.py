from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = REPO_ROOT / "output" / "safari-investigation"

TARGET_SELECTORS = [
    ".bili-header.fixed-header",
    ".bili-header__bar.mini-header",
    ".bsb-tm-video-header-shell",
    ".video-container-v1",
]

JAVASCRIPT_PROBE = r"""
(function () {
  function toPath(node) {
    if (!node) {
      return null;
    }
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!(element instanceof Element)) {
      return null;
    }
    const segments = [];
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE && segments.length < 8) {
      let segment = current.tagName.toLowerCase();
      if (current.id) {
        segment += "#" + current.id;
        segments.unshift(segment);
        break;
      }
      if (current.classList.length > 0) {
        segment += "." + Array.from(current.classList).slice(0, 3).join(".");
      }
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((child) => child.tagName === current.tagName);
        if (siblings.length > 1) {
          segment += `:nth-of-type(${siblings.indexOf(current) + 1})`;
        }
      }
      segments.unshift(segment);
      current = parent;
    }
    return segments.join(" > ");
  }

  function rectToObject(rect) {
    if (!rect) {
      return null;
    }
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      right: rect.right,
      bottom: rect.bottom
    };
  }

  function readNode(selector) {
    const element = document.querySelector(selector);
    if (!(element instanceof Element)) {
      return {
        selector,
        present: false
      };
    }
    const style = window.getComputedStyle(element);
    return {
      selector,
      present: true,
      path: toPath(element),
      text: (element.textContent || "").trim().slice(0, 200),
      rect: rectToObject(element.getBoundingClientRect()),
      style: {
        display: style.display,
        opacity: style.opacity,
        visibility: style.visibility,
        pointerEvents: style.pointerEvents,
        userSelect: style.userSelect,
        zIndex: style.zIndex,
        height: style.height,
        overflow: style.overflow
      }
    };
  }

  function collectSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return {
        present: false,
        text: "",
        sourceKind: null,
        rect: null,
        clientRects: [],
        anchorPath: null,
        focusPath: null,
        commonAncestorPath: null
      };
    }

    const range = selection.getRangeAt(0);
    const ancestor =
      range.commonAncestorContainer?.nodeType === Node.ELEMENT_NODE
        ? range.commonAncestorContainer
        : range.commonAncestorContainer?.parentElement ?? null;
    const ancestorElement = ancestor instanceof Element ? ancestor : null;
    const sourceKind = ancestorElement?.closest(".bili-header, .bili-header__bar, .nav-search-input")
      ? "native-header"
      : ancestorElement?.closest(".video-info-container, .video-title-container, h1.video-title, .video-title")
        ? "native-title"
        : ancestorElement?.closest(".bsb-tm-video-header-shell")
          ? "bsb-compact-header"
          : "other";

    return {
      present: true,
      text: selection.toString(),
      sourceKind,
      rect: rectToObject(range.getBoundingClientRect()),
      clientRects: Array.from(range.getClientRects()).slice(0, 8).map(rectToObject),
      anchorPath: toPath(selection.anchorNode),
      focusPath: toPath(selection.focusNode),
      commonAncestorPath: toPath(ancestorElement)
    };
  }

  function sampleHitTargets() {
    const yValues = [8, 18, 28, 42, 56, 72, 92, 116];
    const xValues = [120, Math.round(window.innerWidth / 2), Math.max(window.innerWidth - 120, 0)];
    const points = [];
    for (const y of yValues) {
      for (const x of xValues) {
        const node = document.elementFromPoint(x, y);
        points.push({
          x,
          y,
          path: toPath(node),
          text: node instanceof Element ? (node.textContent || "").trim().slice(0, 80) : ""
        });
      }
    }
    return points;
  }

  return JSON.stringify({
    capturedAt: new Date().toISOString(),
    href: location.href,
    title: document.title,
    readyState: document.readyState,
    compactHeaderClass: document.documentElement.classList.contains("bsb-tm-video-header-compact"),
    compactHeaderMounted: Boolean(document.querySelector(".bsb-tm-video-header-shell")),
    nodes: [
      readNode(".bili-header.fixed-header"),
      readNode(".bili-header__bar.mini-header"),
      readNode(".bsb-tm-video-header-shell"),
      readNode(".video-container-v1"),
      readNode(".video-info-container"),
      readNode(".video-title-container")
    ],
    selection: collectSelection(),
    hitTargets: sampleHitTargets()
  });
})();
"""


def run_osascript(source: str) -> str:
    result = subprocess.run(
        ["osascript", "-e", source],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        message = (result.stderr or result.stdout).strip()
        raise RuntimeError(message or "osascript failed")
    return result.stdout.strip()


def get_front_window_context() -> dict[str, str]:
    return {
        "window_name": run_osascript('tell application "Safari" to get name of front window'),
        "tab_url": run_osascript('tell application "Safari" to get URL of current tab of front window'),
    }


def probe_front_tab() -> dict[str, object]:
    script = f'tell application "Safari" to do JavaScript {json.dumps(JAVASCRIPT_PROBE)} in current tab of front window'
    raw = run_osascript(script)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as error:
        raise RuntimeError(f"Could not decode Safari probe JSON: {error}") from error


def write_report(payload: dict[str, object], sample_id: str) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    filename = f"{timestamp}-{sample_id}.json"
    destination = OUTPUT_DIR / filename
    destination.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return destination


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Capture DOM and selection evidence from the current Safari front tab for the player-overlay investigation."
    )
    parser.add_argument("--sample-id", required=True, help="Short stable label such as login-video-main-on")
    parser.add_argument("--window-type", required=True, help="existing_logged_in_window / new_automation_window_logged_in / new_automation_window_guest")
    parser.add_argument("--login-state", required=True, help="logged_in / guest / unknown")
    parser.add_argument("--compact-header", required=True, help="on / off / unknown")
    parser.add_argument("--note", default="", help="Optional free-form note stored in the report.")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    try:
        context = get_front_window_context()
        probe = probe_front_tab()
    except RuntimeError as error:
        message = str(error)
        if "Allow JavaScript from Apple Events" in message:
            print(
                "Safari front-tab probing is blocked. Enable 'Allow JavaScript from Apple Events' in Safari Settings > Developer, then rerun.",
                file=sys.stderr,
            )
            return 2
        print(message, file=sys.stderr)
        return 1

    payload = {
        "investigation": {
            "sampleId": args.sample_id,
            "windowType": args.window_type,
            "loginState": args.login_state,
            "compactHeader": args.compact_header,
            "note": args.note,
            "requiredSelectors": TARGET_SELECTORS,
        },
        "frontWindow": context,
        "probe": probe,
    }
    destination = write_report(payload, args.sample_id)
    print(destination)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
