# v0.3.12 MBGA Safari Capture G2 Review

本文件是主线程对 `V0312 MBGA Main-Window Capture` Safari 验收线程交付物的 G2 gate 审核记录。它不是最终 MBGA 现实能力裁决；最终裁决必须等待独立审计线程完成。

## Verdict

G2：`PASS WITH CAVEAT`

主线程允许进入独立审计阶段。当前证据足以证明采样线程完成了 G2 的身份、登录态、配置恢复和页面采样要求，但网络证据低于 HAR-grade，不能直接升级任何 MBGA claim。

## Reviewed Evidence

原始证据目录：

- `output/v0312-mbga-reality-evidence/`

重点文件：

- `output/v0312-mbga-reality-evidence/summary.json`
- `output/v0312-mbga-reality-evidence/endpoint-classification.csv`
- `output/v0312-mbga-reality-evidence/endpoint-classification.md`
- `output/v0312-mbga-reality-evidence/login/safari-main-window-login-proof.json`
- `output/v0312-mbga-reality-evidence/config/original-config.json`
- `output/v0312-mbga-reality-evidence/config/restore-config.json`
- `output/v0312-mbga-reality-evidence/dist/installed-hash-compare.txt`

## Gate Checks

| Check | Result | Evidence |
| --- | --- | --- |
| Safari main window | Pass | `summary.json` records `safari.window=main` and Safari UA evidence. |
| Logged in | Pass | Sanitized nav proof has `code=0`, `isLogin=true`, `midPresent=true`, `unamePresent=true`. |
| Target dist identity | Pass | `dist/bilibili-qol-core.user.js` SHA-256 matches installed Tampermonkey script SHA-256. |
| Installed equals dist | Pass | `installedEqualsDist=true`; hash `ec53876ecda67f51d92faa3d7af6679d4d3b3e04aa65ac48af6ac6f420ae7aa2`. |
| Panel choice experiment isolation | Pass | `summary.json` records `panelChoiceMenuAncestor=false`; `git branch --contains 69194bc` still only shows `codex/panel-choice-menu-version`. |
| Config restore | Pass | Original and restored MBGA booleans match exactly; `restoredMatchesOriginal=true`. |
| Page samples | Pass with caveat | Video, bangumi, home, search, dynamic, article, and live unsupported/control folders exist with required evidence files. |
| Endpoint table contract | Pass with caveat | Table includes `observed_by` and `side_effect_check`; sensitive endpoint rows remain `Do Not Touch`. |
| Network evidence grade | Caveat | HAR export unavailable; evidence is diagnostic plus PerformanceResourceTiming and Web Inspector substitute notes. |

## Main Findings

### F1 - No P0/P1 gate blocker found

The core G2 requirements are met: target dist is proven, Tampermonkey installed script hash matches target dist, Safari login is proven without copying sensitive identifiers, MBGA config was restored, and sampled pages have evidence folders.

### F2 - Network conclusions remain below HAR-grade

`summary.json` explicitly records `harExported=false` and `harGrade=false`. This is acceptable for G2, but it constrains downstream conclusions:

- `block-telemetry-reporters` may be described only as sampled known-host best-effort handling.
- `data.bilibili.com` / `cm.bilibili.com` rows remain `Partial`, not `Verified`.
- Absence from PerformanceResourceTiming must not be interpreted as blocking.

### F3 - `pcdn-webrtc-opt-in-experiment` is a rule-level caveat, not a normal endpoint clearance

The endpoint table includes `pcdn-webrtc-opt-in-experiment` with:

- `endpoint_role=unknown`
- `do_not_touch_basis=experiment`
- `classification=Partial`
- `network_outcome=stubbed-by-qol`

Main-thread interpretation: this row is acceptable as an opt-in rule evidence row, but not as ordinary endpoint classification evidence. It must not be used to relax the default `Do Not Touch` posture for unknown network endpoints. The audit thread must decide whether this row should be split out of the endpoint table or relabeled in the final evidence report.

### F4 - Live remains unsupported/control only

Live page state shows QoL Core panel absent and all MBGA marks false. The live sample supports only `Not Verified / Unsupported Surface`; live network observations must not be used to infer MBGA live support.

### F5 - Article copy unlock remains not verified

The article sample redirected to an opus page and did not expose the expected article holder. This is useful negative evidence, but it cannot support an article-copy-unlock verification claim.

## Instructions To Audit Thread

`V0312 MBGA Evidence Audit` is now authorized to start.

Audit must independently verify:

- The G2 evidence chain from target dist hash to Tampermonkey installed script hash to Safari runtime diagnostics.
- The login proof is non-sensitive and sufficient.
- Original and restored MBGA configs match exactly.
- Endpoint classification does not promote `observed` to `blocked`.
- `data-log-web` and `cm-api` remain `Partial` unless audit finds stronger evidence in the files.
- `pcdn-webrtc-opt-in-experiment` is not treated as a normal endpoint clearance.
- Live is kept as unsupported/control only.
- Article copy unlock remains `Not Verified` unless the evidence proves otherwise.
- Public release wording remains conservative and does not claim complete privacy protection, complete telemetry blocking, full PCDN/WebRTC disablement, or live support.

## Instructions To Safari Capture Thread

No immediate resampling is required.

Remain on standby for audit-requested corrections. If asked to revise without resampling, the only allowed changes are to `output/v0312-mbga-reality-evidence/endpoint-classification.csv` and `.md` to clarify classification labels; do not alter raw page evidence.

## Main Thread Decision

G2 passes with caveats. Proceed to independent audit. No implementation, integration, or release-prep thread is authorized yet.
