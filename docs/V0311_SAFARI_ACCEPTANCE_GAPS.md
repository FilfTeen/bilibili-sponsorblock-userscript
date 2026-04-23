# QoL Core v0.3.11 Safari Acceptance Gaps

## Summary

v0.3.10 had automated and Safari WebDriver evidence, but the v0.3.11 release candidate still requires a final logged-in Safari main-window acceptance pass before publishing.

This document separates real evidence from auxiliary evidence.

## Evidence Classes

| Class | Meaning | Can Ship By Itself |
| --- | --- | --- |
| Main-window Safari evidence | User's normal Safari window, logged in, Tampermonkey running installed dist. | Yes, for feature acceptance. |
| Safari WebDriver evidence | Automation-controlled Safari context with script/shims injected. | No, auxiliary only. |
| JSDOM/unit evidence | Node/Vitest tests. | No, logic evidence only. |
| Chrome/Playwright evidence | Chromium smoke or screenshots. | No, reference only. |

## Completed In This Audit

- Safari WebDriver validation completed.
- Safari front-window metadata/probe completed on one normal video page.
- Automated tests, build, compat, recognition evaluation, and diff check passed.

## Not Completed

| Area | Missing Main-Window Check | Risk |
| --- | --- | --- |
| Tampermonkey menu | Open QoL Core console/help/clear cache from real menu. | Menu registration can differ from injected automation. |
| Panel native select | Open panel, use select/input/color controls in Safari native UI. | JSDOM cannot model native select menu lifecycle. |
| Diagnostics | Enable debug, copy report, confirm URL query/hash redaction in real page. | Privacy claim depends on real report output. |
| SponsorBlock skip | Real playback skip, undo, keep segment, mute and POI. | Core playback path not sampled in this pass. |
| Upstream vote | Real full UUID feedback path and rate-limit/duplicate behavior. | Upstream integration can fail outside mocks. |
| Local learning | Keep/ignore local label, reload, verify persistence and correction. | Wrong local records can persist invisibly. |
| Comment feedback | Confirm comment feedback entry appears only when local feedback is available. | Feedback UI depends on current Bilibili comment DOM. |
| Dynamic filters | Sample dynamic and space pages with normal and commercial content. | DOM drift and false positives. |
| Bangumi web fullscreen | Confirm compact header hides in web fullscreen on `/bangumi/`. | Regression target from previous fixes. |
| MBGA network | A/B Network capture with MBGA on/off. | Current MBGA claims are only partially proven. |
| Article copy unlock | `/read/cv*` real article copy behavior. | DOM drift can make rule ineffective. |
| Live cleanup | `live.bilibili.com` overlays and PCDN fallback behavior. | High page-specific breakage risk. |

## Minimum v0.3.11 Safari Main-Window Checklist

1. Confirm Tampermonkey loads the v0.3.11 candidate dist, and do not rely only on the `@version` metadata without behavior checks.
2. Open normal `/video/` page while logged in.
3. Verify title pill, popover, compact header, notice center, and comments.
4. Use panel native select/input/color controls.
5. Copy diagnostics report from a URL with query/hash and confirm query/hash is absent.
6. Toggle MBGA off and on, reload, and export Network evidence for the same page.
7. Open `/bangumi/` page and test web fullscreen compact header suppression.
8. Open `search.bilibili.com` and verify thumbnail labels only.
9. Open `t.bilibili.com` and `space.bilibili.com` for dynamic/comment behavior.
10. Open `/read/cv*` for article copy unlock.
11. Open `live.bilibili.com` for live cleanup and playback stability.

## Evidence Naming Convention

Use:

```text
output/v0.3.11-reality-audit/<YYYYMMDD-HHMM>-<page>-<feature>-<state>.<ext>
```

Examples:

- `20260421-2200-video-mbga-on-network.har`
- `20260421-2200-video-mbga-off-network.har`
- `20260421-2210-bangumi-webfullscreen-compact-header.png`
- `20260421-2220-panel-native-select.mov`

Do not commit large media files unless the main thread explicitly asks.

## Current Evidence Files

- `output/safari/safari-validate.json`
- `output/safari/video-main.png`
- `output/safari/video-main-placeholder-enabled.png`
- `output/safari/video-comments.png`
- `output/safari/search.png`
- `output/safari-investigation/20260421-215223-v0311-front-video-main.json`

These files are useful audit evidence but should remain untracked unless main thread requests otherwise.
