# QoL Core v0.3.11 Safari Diagnostics Sampling

Runtime baseline sampled: `codex/v0.3.7-integration` at `c8ec274`.

Sampling time: 2026-04-22 13:24-13:30 Asia/Shanghai.

Important setup note: the first Safari diagnostic copy showed `Version: 0.3.9`, so the installed Tampermonkey script was stale. I opened the integration worktree userscript through a local HTTP URL, used the Tampermonkey update page to update from `0.3.9` to `0.3.10`, then reloaded the Safari main window before collecting the evidence below.

## Verdict
- Diagnostics Usability: PASS. The diagnostic report was copied from the real Safari main window on all sampled pages.
- MBGA Summary: PASS. Reports include MBGA totals, action counts, recent rule IDs, and sample records. The video off/on contrast is clear.
- Native Guard Summary: PASS WITH GAP. Reports include native guard enabled/support state and action counts. This pass observed `observed-fetch` and `observed-xhr`; no `blocked-fetch` or `would-block-xhr` occurred in the sampled pages.
- Privacy: PASS. Report URLs did not include query or hash fragments; the scan did not find `token`, `userId`, `vd_source`, `spm_id_from`, cookie, or authorization leaks.
- Side Effects: PASS WITH LIMITED COVERAGE. No visible load failure or obvious playback/search/dynamic/bangumi breakage was detected. This was not a full interaction smoke for comments, search submission, live, or article pages.
- Recommendation: Allow the instrumentation candidate to proceed to main if the main thread accepts the remaining evidence gaps. Track a follow-up to trim or classify very long non-http(s) diagnostic sample URLs.

## Sampling Matrix
| Page | Window | Login | Version | MBGA State | Native Guard | Report Saved | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Normal video `/video/` | Safari main window | confirmed | confirmed `0.3.10` | on; PCDN experiment on in existing profile | enabled, supported page | `output/v0311-diagnostics-sampling/video-mbga-on.txt` | PASS |
| Normal video `/video/` | Safari main window | confirmed | confirmed `0.3.10` | off | enabled, supported page | `output/v0311-diagnostics-sampling/video-mbga-off.txt` | PASS |
| Normal video `/video/` | Safari main window | confirmed | confirmed `0.3.10` | restored on; PCDN experiment on in existing profile | enabled, supported page | `output/v0311-diagnostics-sampling/video-mbga-on-restored.txt` | PASS |
| Home feed `/` | Safari main window | confirmed | confirmed `0.3.10` | on | enabled, unsupported page / compact header inactive | `output/v0311-diagnostics-sampling/home-on.txt` | PASS |
| Search `search.bilibili.com/all?...` | Safari main window | confirmed | confirmed `0.3.10` | on | enabled, unsupported page / compact header inactive | `output/v0311-diagnostics-sampling/search-on.txt` | PASS WITH READABILITY GAP |
| Dynamic `t.bilibili.com` | Safari main window | confirmed | confirmed `0.3.10` | on | enabled, unsupported page / compact header inactive | `output/v0311-diagnostics-sampling/dynamic-on.txt` | PASS |
| Bangumi `/bangumi/play/ss41410?...` | Safari main window | confirmed | confirmed `0.3.10` | on; PCDN experiment on in existing profile | enabled, supported page | `output/v0311-diagnostics-sampling/bangumi-on.txt` | PASS |

Login was marked `confirmed` because the sampled pages exposed a logged-in Bilibili cookie signal in the real Safari main window. The cookie value was not copied into evidence.

## MBGA Report Findings
| Page | State | Total | Actions | Rule IDs | Sample Evidence | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Normal video | on | 80 | `blocked=26, observed=35, rewritten=2, synthetic=17` | `block-telemetry-reporters` | `data.bilibili.com/log/web`; `data.bilibili.com/v2/log/web`; video CDN records | PASS |
| Normal video | off | empty | n/a | n/a | MBGA report changed to `MBGA: empty` after main MBGA toggle off and page reload | PASS |
| Normal video | restored on | 80 | `blocked=25, observed=36, rewritten=2, synthetic=17` | `block-telemetry-reporters`, `disable-pcdn` | `data.bilibili.com/log/web`; rewritten `mcdn.bilivideo.cn` URL to non-MCDN URL | PASS |
| Home feed | on | 63 | `blocked=24, observed=31, synthetic=8` | `block-telemetry-reporters` | `data.bilibili.com/log/web`; `cm.bilibili.com/cm/api/fees/pc` | PASS |
| Search | on | 43 | `blocked=19, observed=20, rewritten=1, synthetic=3` | `block-telemetry-reporters` | telemetry samples plus one very long non-http(s) WASM/data-like resource string | PASS WITH READABILITY GAP |
| Dynamic | on | 45 | `blocked=6, observed=33, synthetic=6` | `block-telemetry-reporters` | `data.bilibili.com/log/web`; `api.bilibili.com/x/internal/gaia-gateway/*` observed as not matched | PASS |
| Bangumi | on | 80 | `observed=60, stubbed=2, synthetic=18` | `block-telemetry-reporters` | `data.bilibili.com/log/web`; bangumi video CDN samples | PASS |

The sampled actions covered `observed`, `blocked`, `synthetic`, `rewritten`, and `stubbed`. No `skipped` action appeared in this sampling pass.

The existing Safari profile had `mbgaDisablePcdn` checked on. The UI wording correctly states the PCDN/WebRTC experiment is "默认关闭", but this pass did not reset user configuration to prove the new-user default in Safari, to avoid destructive configuration changes. The static integration baseline already sets the default to `false`.

## Native Guard Report Findings
| Page | Enabled | Actions | Sample Evidence | Result |
| --- | --- | --- | --- | --- |
| Normal video on | `enabled=true`, `supportedPage=true`, `compactHeaderReady=true` | `observed-fetch=19`, `observed-xhr=50` | video page telemetry and CDN requests summarized with sanitized URLs | PASS |
| Normal video off | `enabled=true`, `supportedPage=true`, `compactHeaderReady=true` | `observed-fetch=27`, `observed-xhr=48` | native guard remained available while MBGA was off | PASS |
| Normal video restored | `enabled=true`, `supportedPage=true`, `compactHeaderReady=true` | `observed-fetch=21`, `observed-xhr=50` | native guard remained stable after MBGA restore | PASS |
| Home feed | `enabled=true`, `supportedPage=false`, `compactHeaderReady=false` | `observed-fetch=47`, `observed-xhr=10` | reason `compact-header-inactive` | PASS |
| Search | `enabled=true`, `supportedPage=false`, `compactHeaderReady=false` | `observed-fetch=28`, `observed-xhr=9` | reason `compact-header-inactive` | PASS |
| Dynamic | `enabled=true`, `supportedPage=false`, `compactHeaderReady=false` | `observed-fetch=30`, `observed-xhr=9` | reason `compact-header-inactive` | PASS |
| Bangumi | `enabled=true`, `supportedPage=true`, `compactHeaderReady=true` | `observed-fetch=9`, `observed-xhr=59` | bangumi page telemetry and CDN requests summarized with sanitized URLs | PASS |

No `blocked-fetch` or `would-block-xhr` was produced by the sampled pages. This does not prove those action labels in real traffic; it only proves the report can show native guard state and the observed action families seen in this pass.

## Privacy Check
- Query/hash leak: none found by scanning diagnostic report URLs in `*.txt`.
- Sensitive token leak: none found for `token`, `userId`, `DedeUserID`, `SESSDATA`, `bili_jct`, `vd_source`, `spm_id_from`, `authorization`, or `cookie`.
- User ID leak: none found.
- Comment text leak: none found in this sampling set.
- Result: PASS.

Search and bangumi were intentionally opened with query parameters. The diagnostic `Page:` lines were sanitized to `https://search.bilibili.com/all` and `https://www.bilibili.com/bangumi/play/ss41410`.

## Side Effects
- Playback: Normal video and bangumi both exposed one `video` element and no page error hint. No deep playback interaction was performed beyond page load.
- Login / avatar: Login signal was confirmed in the Safari main window; no visible login/avatar breakage was detected.
- Search: Search page loaded for keyword `测试`; query was removed from the diagnostic report.
- Comments: Not deeply exercised in this pass.
- Dynamic: Dynamic page loaded with dynamic-like DOM nodes and no page error hint.
- Bangumi: Bangumi page loaded with a video element, supported native guard state, and no page error hint.
- Article / live if sampled: not sampled in this pass.

## Evidence Files
- `output/v0311-diagnostics-sampling/summary.json`
- `output/v0311-diagnostics-sampling/video-mbga-on.txt`
- `output/v0311-diagnostics-sampling/video-mbga-on.json`
- `output/v0311-diagnostics-sampling/video-mbga-on.png`
- `output/v0311-diagnostics-sampling/video-mbga-off.txt`
- `output/v0311-diagnostics-sampling/video-mbga-off.json`
- `output/v0311-diagnostics-sampling/video-mbga-off.png`
- `output/v0311-diagnostics-sampling/video-mbga-on-restored.txt`
- `output/v0311-diagnostics-sampling/video-mbga-on-restored.json`
- `output/v0311-diagnostics-sampling/video-mbga-on-restored.png`
- `output/v0311-diagnostics-sampling/home-on.txt`
- `output/v0311-diagnostics-sampling/home-on.json`
- `output/v0311-diagnostics-sampling/home-on.png`
- `output/v0311-diagnostics-sampling/search-on.txt`
- `output/v0311-diagnostics-sampling/search-on.json`
- `output/v0311-diagnostics-sampling/search-on.png`
- `output/v0311-diagnostics-sampling/dynamic-on.txt`
- `output/v0311-diagnostics-sampling/dynamic-on.json`
- `output/v0311-diagnostics-sampling/dynamic-on.png`
- `output/v0311-diagnostics-sampling/bangumi-on.txt`
- `output/v0311-diagnostics-sampling/bangumi-on.json`
- `output/v0311-diagnostics-sampling/bangumi-on.png`

The `output/` directory is ignored and should not be committed.

## Blocking Issues
No P0/P1 issue was found in this sampling pass.

Non-blocking follow-ups:
- P2/P3: Diagnostic MBGA samples can include very long non-http(s) resource strings, observed on the search page with a WASM/data-like value. This does not leak query/hash, but it hurts report readability and should be truncated or normalized.
- P2: Native guard blocked actions were not naturally produced in this sample set. If the release claim depends on real `blocked-fetch` / `would-block-xhr` evidence, run a targeted A/B network scenario.
- P3: This pass did not reset the user profile to validate the new-user `mbgaDisablePcdn=false` default in Safari. The UI wording says default off, and code default was previously checked, but this existing profile retained an explicit checked state.

## Recommendation
- 是否建议 integration 进入 main: yes, for the instrumentation candidate, with the gaps above recorded as v0.3.11 follow-ups.
- 是否需要修复线程: not required before main for the sampled instrumentation, unless the main thread wants to block on the long non-http(s) diagnostic sample readability issue.
- 是否需要再做 A/B 网络采样: yes, if v0.3.11 wants stronger claims about actual request blocking, PCDN reduction, or native guard blocking behavior.
