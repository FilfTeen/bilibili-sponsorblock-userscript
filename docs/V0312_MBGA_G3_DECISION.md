# v0.3.12 MBGA Reality Evidence G3 Decision

本文件是主线程在研究、Safari 主窗口采样和独立审计之后的 G3 裁决记录。它不是实现任务，不授权代码改动，不授权发布，也不提升任何 MBGA public claim。

## Verdict

G3：`PASS WITH CAVEAT - evidence objective complete`

主线程接受 `docs/V0312_MBGA_EVIDENCE_AUDIT.md` 的 `PASS WITH CAVEAT` 结论。当前证据足以完成现实能力边界裁决。Safari 采样线程已经按要求修正 `output/v0312-mbga-reality-evidence/endpoint-classification.*` 中 `pcdn-webrtc-opt-in-experiment` 的表述形态，并修正 `summary.json` 中无效账号截图字段。

## Evidence Reviewed

- `docs/V0312_MBGA_REALITY_EVIDENCE_TARGET.md`
- `docs/V0312_MBGA_SAMPLING_PLAN.md`
- `docs/V0312_MBGA_CAPTURE_G2_REVIEW.md`
- `docs/V0312_MBGA_EVIDENCE_AUDIT.md`
- `output/v0312-mbga-reality-evidence/summary.json`
- `output/v0312-mbga-reality-evidence/endpoint-classification.csv`
- `output/v0312-mbga-reality-evidence/endpoint-classification.md`

主线程复核结果：

- `dist/bilibili-qol-core.user.js` SHA-256 与 Tampermonkey installed script copy SHA-256 一致：`ec53876ecda67f51d92faa3d7af6679d4d3b3e04aa65ac48af6ac6f420ae7aa2`。
- 两个脚本文本均为 `562044` bytes。
- Safari login proof JSON 足够且脱敏。
- `login/safari-account-ui.png` 不是有效账号 UI 截图，不得引用为账号 UI 证据。
- Original / restored MBGA 五个配置值完全一致。
- HAR 未导出，网络证据保持 below-HAR-grade。
- 采样没有产生允许升级 MBGA claim 的证据。

## Main-Thread Classification

| Area | Decision | Allowed wording |
| --- | --- | --- |
| `block-telemetry-reporters` | `Partial` | sampled known-host best-effort handling only |
| `data.bilibili.com` telemetry-like rows | `Partial` | sampled data telemetry paths showed QoL diagnostic actions; not complete blocking |
| `cm.bilibili.com` telemetry-like rows | `Partial` | sampled home cm paths showed QoL diagnostic actions; not complete blocking |
| Login / passport / account paths | `Do Not Touch` | none |
| Message / session paths | `Do Not Touch` | none |
| Player / danmaku / media hosts | `Do Not Touch` | none |
| Comment / reply paths | `Do Not Touch` | none |
| Search-required paths | `Do Not Touch` | none |
| Gaia / anti-abuse / risk paths | `Do Not Touch` | none |
| Live | `Not Verified / Unsupported Surface` | no live MBGA claim |
| Article copy unlock | `Not Verified` | no verification claim for this pass |
| PCDN / WebRTC | rule-level opt-in experiment, `Partial` at most | opt-in disable-pcdn rule showed limited sampled activity; WebRTC disablement is not verified; no default-release claim |

## Evidence Freeze Result

Safari capture thread already revised:

- `output/v0312-mbga-reality-evidence/endpoint-classification.csv`
- `output/v0312-mbga-reality-evidence/endpoint-classification.md`

Accepted changes:

1. `pcdn-webrtc-opt-in-experiment` no longer appears as an endpoint CSV row.
2. Markdown evidence moved it to a `Rule-Level Opt-In Experiment` section.
3. The evidence now states that no WebRTC disablement was verified.
4. Default release claim is `none / no-default-claim`.
5. Login rows cite sanitized nav proof and state that `login/safari-account-ui.png` must not be cited.

Accepted summary correction:

- `summary.json` now uses `accountUiScreenshotFile`, `accountUiScreenshotValid=false`, `accountUiScreenshotDoNotCite=true`, and `accountUiScreenshotInvalidReason`.
- The invalid screenshot is no longer represented as ordinary account UI proof.
- Narrow audit recheck passed.

## Implementation Decision

No implementation thread is authorized.

The current evidence does not justify:

- expanding MBGA block lists;
- enabling or promoting PCDN/WebRTC behavior;
- adding live support;
- changing defaults;
- upgrading privacy, telemetry, PCDN, WebRTC, or live wording.

Potential future implementation tasks, if the user wants a v0.3.12 release artifact, are limited to conservative documentation/reporting changes after the evidence table is corrected and rechecked.

## Next Gate

Current gate: `G3 complete`

Completed step:

1. Safari capture thread performed endpoint table correction.
2. Safari capture thread performed summary metadata correction.
3. Audit thread performed narrow recheck.
4. Main thread froze `docs/V0312_MBGA_REALITY_EVIDENCE.md` as the final evidence report.

No implementation thread is authorized by this gate.
