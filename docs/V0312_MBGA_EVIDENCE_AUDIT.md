# v0.3.12 MBGA Evidence Audit

Thread: `V0312 MBGA Evidence Audit`

Verdict: `PASS WITH CAVEAT`

This audit reviewed the G2 handoff in `docs/V0312_MBGA_CAPTURE_G2_REVIEW.md`, the target card, the sampling plan, and raw evidence under `output/v0312-mbga-reality-evidence/`. It did not perform new Safari sampling and did not change runtime code.

## Scope Result

The core G2 evidence chain is sufficient for main-thread G3 adjudication:

- Local target dist hash independently recalculated as `ec53876ecda67f51d92faa3d7af6679d4d3b3e04aa65ac48af6ac6f420ae7aa2`.
- Captured Tampermonkey installed script copy independently recalculated as the same hash.
- Both files are `562044` bytes.
- `dist/installed-hash-compare.txt` records `installedEqualsDist=true`.
- `dist/tampermonkey-install-source.txt` records loopback source `http://127.0.0.1:8765/dist/bilibili-qol-core.user.js`.
- Safari runtime diagnostics exist on supported Bilibili pages and show Safari UA plus QoL Core diagnostics. `Version: 0.3.11` is supportive only and was not used as the identity proof.

Network evidence remains below HAR grade. No endpoint row should be upgraded to a complete network/privacy/telemetry/PCDN/WebRTC claim from this run.

## Findings

### P1 - `pcdn-webrtc-opt-in-experiment` is not a normal endpoint row

The current endpoint table keeps the row as `Partial`, which is directionally conservative, but its shape is still misleading for final evidence:

- It is a rule-level experiment, not an endpoint classification.
- `on-pcdn-experiment` page-state has `__BSB_MBGA_PCDN_DISABLER__=true`, but `rtcPeerConnectionSource` remains native on both video and bangumi samples.
- `on-default` page-state has `__BSB_MBGA_PCDN_DISABLER__=false`; its non-native `RTCPeerConnection` source should not be read as QoL WebRTC stubbing.
- The diagnostic aggregate `stubbed=5` supports only limited opt-in rule activity. It does not prove complete WebRTC disablement or default behavior.

Required correction before freezing public evidence: split this out of the endpoint table or relabel it as a rule-level opt-in experiment. Wording should be limited to "opt-in disable-pcdn rule showed partial stub activity in sampled video/bangumi pages; WebRTC disablement is not verified; no default-release claim."

No resampling is required unless the main thread wants a real WebRTC/PCDN claim.

### P2 - Login JSON is sufficient, but the account UI screenshot is not valid account UI evidence

`login/safari-main-window-login-proof.json` is sanitized and sufficient for login proof:

- `code=0`
- `isLogin=true`
- `midPresent=true`
- `unamePresent=true`
- no raw `mid`, `uname`, cookies, tokens, `SESSDATA`, `bili_jct`, or raw response body

However, `login/safari-account-ui.png` shows the Codex app window rather than a Bilibili account/avatar area. It should not be cited as account UI proof. It also contains local workspace/thread UI, so it should not be published outside the local evidence bundle without redaction or replacement.

This does not block G3 because the sanitized Safari `nav` proof meets the sampling plan's passing criterion.

### P2 - `data-log-web` and `cm-api` must remain `Partial`

The table correctly keeps both telemetry-likely rows as `Partial`:

- `data-log-web` has MBGA diagnostic actions including `blocked`/`synthetic`, but HAR export was unavailable and PerformanceResourceTiming cannot prove absence on the wire.
- `cm-api` has `observed=2; synthetic=2` from the home sample only, plus native/performance observations that remain supportive rather than conclusive.

Allowed wording must stay at sampled known-host best-effort handling only. Do not claim complete telemetry blocking.

### P2 - Article copy unlock remains `Not Verified`

The article sample redirected to `https://www.bilibili.com/opus/931273893350473737`. `pages/article/on-default/page-state.json` records:

- `articleHolderPresent=false`
- `articleCopyUnlocked=false`
- `__BSB_MBGA_ARTICLE_COPY_UNLOCK__=false`

The endpoint table does not need an endpoint row for this, but the final reality evidence report should explicitly classify `article-copy-unlock` as `Not Verified` for this pass.

### P3 - Observed requests were not promoted to blocked

The endpoint table passes this guardrail:

- observed-only sensitive/functional rows remain `Do Not Touch` with `observed-on-wire` or `none` release claim.
- `message-vc`, `media-hosts`, and `hdslb-static-assets` are not promoted to block candidates.
- `data-log-web` and `cm-api` use `synthetic-by-qol` only where diagnostics show synthetic action evidence.

Keep the distinction in final wording: `observed` means seen/allowed/attempted, not blocked.

## Other Checks

Config restore: pass. `config/original-config.json` values equal both `restore-config.json.restoredValues` and `restore-config.json.after.values` for all five MBGA keys:

- `mbgaEnabled=true`
- `mbgaBlockTracking=true`
- `mbgaDisablePcdn=true`
- `mbgaCleanUrl=true`
- `mbgaSimplifyUi=true`

Live: pass as unsupported/control only. `pages/live-unsupported/*/page-state.json` records `hasQolPanel=false` and all MBGA marks false. `pages/live-unsupported/on-default/diagnostic.txt` explicitly says live is unsupported negative/control evidence only. No live MBGA capability claim is allowed.

Public wording: pass with caveat. Current V0312 wording is conservative: no complete privacy protection, complete telemetry blocking, complete PCDN/WebRTC disablement, or live support claim found in the V0312 evidence outputs. The final public text must preserve these limits.

## Required Follow-up

Ask the Safari capture thread to revise `output/v0312-mbga-reality-evidence/endpoint-classification.csv` and `.md` without altering raw page evidence:

- split or relabel `pcdn-webrtc-opt-in-experiment` as rule-level opt-in experiment evidence;
- remove any implication that WebRTC disablement was verified;
- keep default-release claim as `none` or equivalent no-default-claim wording;
- optionally note that the current account UI screenshot is invalid and must not be cited.

No additional Safari sampling is required for G3 unless the main thread wants HAR-grade network evidence, a valid account UI screenshot, or a stronger PCDN/WebRTC claim.

## G3 Recommendation

Main thread may enter G3 adjudication with caveats. G3 should not authorize implementation or public claim upgrades from this evidence alone. The safe decision envelope is:

- `block-telemetry-reporters`: sampled known-host best-effort / `Partial`.
- `data-log-web`: `Partial`.
- `cm-api`: `Partial`.
- sensitive/account/player/comment/live/media/risk endpoints: `Do Not Touch`.
- live: unsupported/control only.
- article copy unlock: `Not Verified`.
- PCDN/WebRTC: opt-in experimental, rule-level partial evidence only; no default or complete disablement claim.
