# QoL Core v0.3.11 MBGA Network Evidence

## Summary

MBGA currently has useful engineering structure but insufficient real-network proof.

The code is narrow in several places, which is good. The evidence is still incomplete because most assertions come from unit tests or a single Safari front-tab probe, not from controlled Safari main-window A/B captures with MBGA on/off.

## Evidence Inventory

### Static Rules

| Rule | Code Entry | Current Match | Evidence Level | Default-On Recommendation |
| --- | --- | --- | --- | --- |
| `clean-url-params` | `mountUrlCleaner`, `removeTracking` | explicit params: `buvid`, `vd_source`, `spm*`, etc. | Partially Verified | Keep default-on, but verify anchors/share links. |
| `block-telemetry-reporters` | `mountBlockTracking`, `resolveMbgaNetworkDecision` | `cm.bilibili.com`, `data.bilibili.com` and subdomains. | Partially Verified | Keep only if documented as known-host best-effort. |
| `disable-pcdn` | `mountPcdnDisabler` | video/bangumi/live pages only. | Risky / Partially Verified | Consider default-off or clearer sub-toggle after A/B sampling. |
| `neutralize-page-grayscale` | `mountGrayscaleCleanup` | all pages, only when grayscale detected. | Partially Verified | Keep default-on; low blast radius. |
| `main-feed-cleanup` | CSS in `mountMainFeedCleanup` | main feed ad selectors and `cm.bilibili.com` links. | Not Verified | Keep only if visual sample proves no feed breakage. |
| `dynamic-wide-mode` | `mountDynamicWideMode` | `t.bilibili.com`. | Not Verified | Consider experimental label. |
| `article-copy-unlock` | `mountArticleCopyUnlock` | `/read/cv*`. | Partially Verified | Keep optional; sample real article. |
| `live-room-ui-cleanup` | `mountLiveUiCleanup` | live pages. | Not Verified / Risky | Do not expand before live sampling. |
| `video-fit-mode` | `mountVideoFitMode` | video/bangumi player settings. | Partially Verified | Keep optional; verify current player DOM. |

## Safari Front-Tab Probe

Probe target:

- URL: `https://www.bilibili.com/video/BV1q1QYBHEQ5/`
- Window type requested: existing Safari front window.
- Login state: unknown.
- Evidence file: `output/safari-investigation/20260421-215223-v0311-front-video-main.json`

Observed:

- QoL Core panel present.
- Compact header present.
- Title pill present, text `商单广告`.
- MBGA flags present: block tracking, PCDN, clean URL, grayscale observer.
- Native request guard active with `enabled=true`, `supportedPage=true`, `compactHeaderReady=true`.
- Native guard records showed many `observed-xhr` / `observed-fetch` entries, including player online totals, session unread, Gaia gateway, and a `data.bilibili.com/log/web` URL.

Interpretation:

- This proves QoL Core runtime hooks were active on a real Safari Bilibili tab.
- This does not prove MBGA blocked the `data.bilibili.com` request at send time, because native guard records XHR open events and MBGA can still synthesize completion later.
- This does not prove login state.
- This does not compare MBGA on vs off.

## Safari WebDriver Evidence

Command:

```bash
npm run validate:safari
```

Generated:

- `output/safari/safari-validate.json`
- `output/safari/video-main.png`
- `output/safari/video-main-placeholder-enabled.png`
- `output/safari/video-comments.png`
- `output/safari/search.png`

Observed:

- Video sample mounted compact header and title pill.
- Search sample showed thumbnail labels.
- Comment badges and comment location badges were zero in sampled pages.

Limitations:

- WebDriver opens an automation browser context.
- GM APIs are shimmed by the script.
- This is not logged-in Tampermonkey main-window evidence.
- This does not inspect Web Inspector Network or compare MBGA on/off.

## Rule-Level Findings

### block-telemetry-reporters

Automated tests prove:

- `https://data.bilibili.com/log/web` returns synthetic 204.
- `https://cm.bilibili.com/cm/api` XHR is short-circuited with load semantics.
- non-telemetry `sendBeacon` passes through.
- WebRTC stubs are not installed by this rule.

Missing real evidence:

- Whether current Bilibili telemetry still uses only `cm.bilibili.com` and `data.bilibili.com`.
- Whether other active endpoints, such as `api.vc.bilibili.com/session_svr/...`, `i1.hdslb.com/.../event.cnf`, `x/internal/gaia-gateway/*`, or broadcast/chat resources, are telemetry, functional, or anti-abuse.
- Whether blocking only `cm`/`data` has measurable effect.

Recommendation:

- Do not expand by guessing.
- Add A/B capture with MBGA on/off.
- Classify endpoints as functional, telemetry, anti-abuse, player-required, or unknown before adding rules.

### native-request-guard

Automated tests prove:

- Nothing is blocked until enabled, supported page, and compact header ready.
- Only `/x/msgfeed/unread` and `/x/web-interface/nav/stat` return true.
- `/x/web-interface/nav`, player, and reply endpoints return false.

Missing real evidence:

- Current Bilibili experiments may use topbar badge endpoints for broader notification state.
- No captured before/after proves user-visible behavior remains identical when these two requests are blocked.

Recommendation:

- Keep the path list narrow.
- Add a native guard snapshot UI or diagnostic report section for blocked records.
- Verify login avatar, message badge, search, player, comments, and dynamic pages in Safari main window.

### disable-pcdn

Automated tests prove:

- WebRTC stubs install on video pages.
- WebRTC stubs do not install on non-video pages.
- known MCDN/SMTCDNS URL rewrite code exists.
- live fallback can disable forced highest quality after repeated errors.

Missing real evidence:

- Whether Bilibili currently uses WebRTC/PCDN through these globals in Safari.
- Whether stubbing these objects affects player, live, danmaku, or interactive features.
- Whether resource host patterns are complete.

Recommendation:

- Treat as risky until proven.
- For v0.3.11, sample `RTCPeerConnection` construction, resource host list, playback errors, and live room behavior with rule on/off.
- Consider making this sub-rule opt-in if A/B evidence remains weak.

## Required A/B Capture Plan For v0.3.11

For each target page, capture two sessions:

- MBGA off.
- MBGA on with current defaults.

Pages:

- normal video.
- bangumi video.
- home feed.
- dynamic page.
- article page.
- live room.

For each session record:

- URL.
- login state.
- script version.
- whether Safari main window or automation.
- native guard snapshot.
- performance resource hosts.
- Web Inspector Network export if possible.
- screenshot path.
- visible breakage notes.

Endpoint classification:

- Blocked by QoL Core.
- Rewritten by QoL Core.
- Observed but allowed.
- Unknown and not touched.
- Must never block.

## Public Wording Boundary

Allowed wording:

- "尝试减少部分已知遥测/PCDN/追踪噪音。"
- "基于窄规则、best-effort 的生态小修。"
- "真实效果依赖当前 B 站页面和接口实现。"

Disallowed wording:

- "禁止 B 站 PCDN。"
- "阻断 B 站隐私侵犯。"
- "完整净化 B 站生态。"
- "全面屏蔽追踪/遥测。"
