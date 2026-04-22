# QoL Core v0.3.11 MBGA Safari A/B Capture

## Verdict

- MBGA Overall: Partially Verified.
- Default-On Recommendation: keep only low-risk, narrow rules as default-on; reconsider `disable-pcdn` as experimental or default-off until stronger evidence exists.
- Release Risk: no v0.3.10 rollback signal was found, but current evidence does not support strong claims such as complete telemetry blocking, privacy protection, or complete PCDN disabling.
- Implementation Recommendation: do not expand the block list yet. First add decision telemetry for MBGA rules and repeat HAR/Web Inspector A/B capture.

This pass used Safari main-window AppleScript page probes, PerformanceResourceTiming, QoL runtime flags, native guard snapshots, and screenshots. It did not use Chrome. It did not export Safari Web Inspector HAR files, so network conclusions remain below HAR-grade certainty.

## Evidence Summary

| Page | MBGA Off Evidence | MBGA On Evidence | Login | Version | Result |
| --- | --- | --- | --- | --- | --- |
| normal video | MBGA flags all false; `vd_source` remained in URL; `cm.bilibili.com` and `mcdn.bilivideo.cn` resources observed; native guard active but no blocked records. | MBGA core flags true; URL query cleaned; no `mcdn.bilivideo.cn` resource in Performance entries; bilivideo direct resources still present; no video errors. | likely logged in | not independently exposed by page; expected v0.3.10 from installed main dist | Partial pass. Clean URL verified; PCDN/CDN rewrite partially verified; tracking block not HAR-verified. |
| bangumi | MBGA flags false; bilivideo resources and many `data.bilibili.com` guard records observed. | MBGA core flags true; no `data.bilibili.com` Performance entries; bilivideo direct resources still present; no video errors. | likely logged in | not independently exposed | Partial pass. Playback not broken in sample; telemetry/PCDN effects remain partial. |
| home feed | MBGA flags false; multiple `cm.bilibili.com` resource entries observed. | MBGA block flags true; one `cm.bilibili.com` resource entry still observed; no obvious page breakage. | likely logged in | not independently exposed | Partial. Current rule reduces/affects some `cm` traffic but does not prove complete blocking. |
| dynamic | MBGA flags false; normal dynamic page. | `dynamicWideSwitch` true and `html[wide]` present; no obvious page breakage. | likely logged in | not independently exposed | Verified for dynamic-wide DOM state in this sample. |
| article | MBGA flags false; article URL redirected to `?opus_fallback=1`; no `.article-holder` detected. | `articleCopyUnlock` flag true, but no `.article-holder` and no unlocked marker. | likely logged in | not independently exposed | Not Verified for copy unlock because the sampled article did not expose the expected holder DOM. |
| live | QoL Core panel absent; MBGA flags false; live video resources, `data.bilibili.com`, and `mcdn.bilivideo.cn` observed. | Same as off: QoL Core panel absent and MBGA flags false. | likely logged in | not independently exposed | Not Verified. Current userscript support gate does not run on `live.bilibili.com`, so live MBGA claims are unsupported by this baseline. |

## Endpoint Classification

| Endpoint / Host | Page | Off | On | Classification | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| `cm.bilibili.com/cm/api/*` | home, video | observed in Performance and native guard records | reduced but still observed once on home; no HAR synthetic status | telemetry-likely / partially handled | `off-home.json`, `on-home.json`, `off-video.json` | Keep as known-host best-effort. Do not claim complete blocking. Add explicit MBGA decision records. |
| `data.bilibili.com/v2/log/web` | video, bangumi, dynamic, article | many native guard `observed-fetch/xhr` records; live Performance entries | Performance entries mostly absent on supported pages, but native guard still observes some attempts; live unchanged | telemetry-likely / partially handled | `off-bangumi.json`, `on-bangumi.json`, `off-video.json`, `on-video.json`, `off-live.json`, `on-live.json` | Treat as partial. Need HAR or in-page MBGA blocked-record logging to prove synthetic responses. |
| `data.bilibili.com/gol/postweb` | live | observed | observed | telemetry-likely but unsupported by script | `off-live.json`, `on-live.json` | Do not claim live telemetry blocking. Decide whether live should become supported before adding rules. |
| `api.bilibili.com/x/msgfeed/unread` | sampled pages | not observed | not observed | Not Verified | Native guard records show `api.vc.bilibili.com/x/im/web/msgfeed/unread`, not the guarded path. | Do not claim guard verified. Keep path list narrow until target endpoint appears in A/B. |
| `api.bilibili.com/x/web-interface/nav/stat` | sampled pages | not observed | not observed | Not Verified | No matching native guard record. | Do not claim redundancy proven in this sample. |
| `api.bilibili.com/x/web-interface/nav` | video, bangumi, home, article | observed allowed | observed allowed | functional-required | Present in records; guard does not block it. | Must not block. |
| `api.vc.bilibili.com/x/im/web/msgfeed/unread` | video, bangumi, home, dynamic, article | observed allowed | observed allowed | anti-abuse-or-login-risk / functional-required | Login/message path is separate from native guard target. | Do not touch without separate evidence. |
| `api.vc.bilibili.com/session_svr/v1/session_svr/single_unread` | multiple pages | observed allowed | observed allowed | anti-abuse-or-login-risk / functional-required | Present in native guard records. | Do not touch. |
| `api.bilibili.com/x/player/*` | video, bangumi | observed allowed | observed allowed | player-required | Player metadata and online totals. | Must not block. |
| `api.bilibili.com/x/v2/reply/*` | video, bangumi | observed allowed | observed allowed | functional-required | Comment/reply endpoints. | Must not block. |
| `api.bilibili.com/x/internal/gaia-gateway/*` | supported pages | observed allowed | observed allowed | anti-abuse-or-login-risk / unknown-do-not-touch | Appears in guard records. | Do not touch. |
| `*.mcdn.bilivideo.cn` | normal video, live | observed on video off and live both sides | absent on normal video on; still present on live because script unsupported | player-required / rewritten-by-qol-core on supported video | `off-video.json`, `on-video.json`, `off-live.json`, `on-live.json` | Partial evidence for video CDN rewrite. Do not claim live PCDN handling. |
| `*.bilivideo.com` / `upos-*` | video, bangumi, live | observed | observed | player-required | Core video media hosts. | Must not block. |
| `*.smtcdns.net` | sampled pages | not observed | not observed | Not Verified | No sample. | Keep existing rewrite code unexpanded. |
| `RTCPeerConnection` | video, bangumi, live | native or Bilibili-wrapped function | still native on sampled supported pages | Not Verified for WebRTC disabling | `on-video.json`, `on-bangumi.json` show `RTCPeerConnection` remains native. | Current Safari evidence does not support "WebRTC disabled". Rework or relabel. |

## Rule-Level Results

| Rule | Result | Evidence | Risk | Recommendation |
| --- | --- | --- | --- | --- |
| `clean-url-params` | Verified for sampled video URL | Off video retained `?vd_source=...`; on video URL became clean path. | Low. Need more anchor/share-link coverage. | Keep default-on. Add tests or Safari samples for comment anchors and share links. |
| `block-telemetry-reporters` | Partially Verified | Off samples show `cm.bilibili.com` and `data.bilibili.com`; on supported pages show reduced Performance evidence, but native guard still observes data/cm attempts and no HAR synthetic status was captured. | Medium. Public wording can overclaim. | Keep as best-effort known-host rule; add MBGA block records or HAR export before expanding. |
| `disable-pcdn` | Partially Verified / Risky | Normal video off had `mcdn.bilivideo.cn`; on video did not. However `RTCPeerConnection` stayed native and live was unsupported. | Medium-high because "disable PCDN/WebRTC" is not proven and may affect playback if expanded incorrectly. | Consider default-off or split into "known CDN URL rewrite" and "WebRTC suppression"; do not claim complete PCDN disable. |
| `native-request-guard` | Not Verified | Guard was active on video/bangumi, but no `blocked-fetch`/`would-block-xhr` records and target paths were not observed. | Low immediate risk due narrow list, but evidence does not prove value. | Keep narrow; add diagnostic blocked record exposure and repeat when target endpoints appear. |
| `dynamic-wide-mode` | Verified for sampled dynamic page | On dynamic had `mbgaDynamicWideSwitch=true` and `html[wide]`. | Medium UI compatibility risk across Bilibili DOM changes. | Keep optional/default-on only if docs call it UI best-effort. |
| `article-copy-unlock` | Not Verified | On article had rule flag true, but sampled page lacked `.article-holder` and no unlocked marker. | Unknown. | Need a known article with current holder DOM. Do not claim verified. |
| `live-room-ui-cleanup` | Not Verified / currently unreachable | On live had no QoL panel and all MBGA flags false. | Documentation mismatch if live cleanup is claimed. | Either support `live.bilibili.com` explicitly or remove/downgrade live MBGA claims. |
| `video-fit-mode` | Partially Verified | On video/bangumi flag true; no manual settings-menu interaction was performed. | Low-to-medium UI drift risk. | Needs manual player settings sample. |
| `neutralize-page-grayscale` | Partially Verified | Flag true on supported pages; no real grayscale page sampled. | Low. | Keep as best-effort low-risk rule. |
| `main-feed-cleanup` | Partially Verified | Home page sampled with no obvious breakage, but no visual selector-level proof. | Medium if Bilibili changes feed classes. | Keep documented as known-selector UI cleanup, not broad ad blocking. |

## Functional Side Effects

- Playback: video and bangumi samples loaded media resources and reported no `video.error`. This is not a full playback QA pass.
- Login / avatar: login state was inferred as likely logged in from page hints, not independently confirmed through Tampermonkey or account UI.
- Search: not explicitly exercised.
- Comments: reply endpoints were observed and allowed; comment UI was not deeply exercised.
- Dynamic: dynamic page loaded and wide mode toggled on in the MBGA-on sample.
- Live: QoL Core did not run on `live.bilibili.com`, so live MBGA side effects cannot be assessed from this baseline.
- Article: sampled article did not expose the expected `.article-holder`; copy unlock not verified.
- Bangumi: loaded without obvious error; no web-fullscreen or settings-menu interaction was exercised.

## Unknown / Do Not Touch

- `api.vc.bilibili.com/x/im/web/msgfeed/unread`
- `api.vc.bilibili.com/session_svr/v1/session_svr/single_unread`
- `api.bilibili.com/x/web-interface/nav`
- `api.bilibili.com/x/player/*`
- `api.bilibili.com/x/v2/reply/*`
- `api.bilibili.com/x/internal/gaia-gateway/*`
- `passport.bilibili.com/*`
- `message.bilibili.com/*`
- `api.live.bilibili.com/*`
- `*.bilivideo.com` and `upos-*` media hosts
- `i*.hdslb.com` static/media assets
- `data.bilivideo.com` live/player adjacent telemetry-like endpoints
- `impression.biligame.com` ad/impression endpoint, observed but not enough evidence to block safely.

These endpoints may look noisy, but the current evidence does not prove they are safe to block. Treat them as functional, anti-abuse, login-risk, player-required, or unknown until separately classified.

## Evidence Files

Generated but not committed:

- `output/v0311-mbga-ab/summary.json`
- `output/v0311-mbga-ab/initial-mbga-switches.json`
- `output/v0311-mbga-ab/set-mbga-off.json`
- `output/v0311-mbga-ab/set-mbga-on.json`
- `output/v0311-mbga-ab/restore-mbga-switches.json`
- `output/v0311-mbga-ab/off-video.json`
- `output/v0311-mbga-ab/on-video.json`
- `output/v0311-mbga-ab/off-bangumi.json`
- `output/v0311-mbga-ab/on-bangumi.json`
- `output/v0311-mbga-ab/off-home.json`
- `output/v0311-mbga-ab/on-home.json`
- `output/v0311-mbga-ab/off-dynamic.json`
- `output/v0311-mbga-ab/on-dynamic.json`
- `output/v0311-mbga-ab/off-article.json`
- `output/v0311-mbga-ab/on-article.json`
- `output/v0311-mbga-ab/off-live.json`
- `output/v0311-mbga-ab/on-live.json`
- matching screenshots: `output/v0311-mbga-ab/*.png`

The `output/` directory is git-ignored; the JSON and screenshots are local evidence only.

## Recommended v0.3.11 Actions

- Default setting changes: consider making `mbgaDisablePcdn` default-off or explicitly experimental until WebRTC and live behavior are proven. Keep `mbgaCleanUrl` default-on. Keep `mbgaBlockTracking` only as best-effort known-host filtering.
- Rule changes: add internal MBGA decision records for blocked fetch/XHR/beacon events so future diagnostics can distinguish "observed" from "synthetic response". Do not expand the host/path block list from this sample alone.
- Documentation changes: remove or downgrade claims that MBGA protects privacy, fully blocks telemetry, disables WebRTC, disables PCDN, or cleans live pages.
- Further sampling: export Safari Web Inspector HAR with MBGA off/on; sample a known article with `.article-holder`; sample a live page only after deciding whether QoL Core should support `live.bilibili.com`; interact with the player settings menu for `video-fit-mode`.

## Commands / Tools Used

- `git status --short --branch`
- `git log --oneline --decorate --max-count=8`
- `rg` scans for MBGA/native-guard/config/panel code
- Safari AppleScript `do JavaScript` in the existing Safari front window
- Safari main-window page tabs opened through AppleScript
- in-page PerformanceResourceTiming snapshot
- QoL runtime flag snapshot from page globals
- native request guard `snapshot()` when available
- `screencapture -x` for local screenshot evidence

## Sampling Limitations

- No Safari Web Inspector HAR was exported.
- QoL Core version could not be independently read from a stable page runtime variable; version is inferred from this worktree/release baseline.
- Login state is inferred as likely logged in, not proven by account API.
- PerformanceResourceTiming does not prove blocking or synthetic responses by itself.
- "No request observed" is not treated as proof of blocking.
- The A/B runs were sequential and may be affected by Bilibili cache, recommendations, AB tests, and timing.
