# v0.3.12 MBGA Reality Evidence

本文件是 `v0.3.12 MBGA Reality Evidence Pass` 的最终主线程证据报告。它汇总研究线程、Safari 主窗口采样线程、独立审计线程和主线程裁决后的稳定结论。

本报告不授权实现，不授权发布，不扩大 MBGA claim。

## Verdict

`PASS WITH CAVEAT`

MBGA 的现实能力边界已经被钉牢到足以指导后续版本决策：

- 可以继续把 MBGA 描述为 sampled known-host best-effort / partial cleanup。
- 不能把 MBGA 描述为完整隐私保护、完整遥测阻断、完整 PCDN/WebRTC 禁用或 live 支持能力。
- 当前证据不支持新增拦截规则、不支持改默认策略、不支持扩大公开文案。

## Evidence Chain

| Check | Result |
| --- | --- |
| Safari 主窗口 | Pass |
| 登录态 | Pass，使用脱敏 `x/web-interface/nav` proof |
| 目标 dist 身份 | Pass |
| Tampermonkey installed script | Pass，与目标 dist SHA-256 一致 |
| SHA-256 | `ec53876ecda67f51d92faa3d7af6679d4d3b3e04aa65ac48af6ac6f420ae7aa2` |
| Script size | `562044` bytes |
| MBGA 配置恢复 | Pass，五个 MBGA 配置值恢复一致 |
| HAR | Not available；network evidence is below-HAR-grade |
| Endpoint table | Pass after correction，12 endpoint rows |
| PCDN/WebRTC row | Split out as rule-level opt-in experiment |
| Invalid account screenshot | Marked do-not-cite in `summary.json` |

Primary local evidence bundle:

- `output/v0312-mbga-reality-evidence/summary.json`
- `output/v0312-mbga-reality-evidence/endpoint-classification.csv`
- `output/v0312-mbga-reality-evidence/endpoint-classification.md`

Supporting docs:

- `docs/V0312_MBGA_SAMPLING_PLAN.md`
- `docs/V0312_MBGA_CAPTURE_G2_REVIEW.md`
- `docs/V0312_MBGA_EVIDENCE_AUDIT.md`
- `docs/V0312_MBGA_G3_DECISION.md`

## Final Classification

| Area | Classification | Decision |
| --- | --- | --- |
| `data-log-web` / `data.bilibili.com` telemetry-like paths | `Partial` | Keep known-host best-effort wording only. |
| `cm-api` / `cm.bilibili.com` telemetry-like paths | `Partial` | Keep sampled home-page best-effort wording only. |
| Login / passport / account paths | `Do Not Touch` | No release claim. |
| Message / session paths | `Do Not Touch` | No release claim. |
| Player / danmaku APIs | `Do Not Touch` | No release claim. |
| Comment / reply APIs | `Do Not Touch` | No release claim. |
| Search-required APIs | `Do Not Touch` | No release claim. |
| Gaia / anti-abuse / risk paths | `Do Not Touch` | No release claim. |
| Media/static hosts | `Do Not Touch` | No release claim. |
| Live | `Not Verified / Unsupported Surface` | No live MBGA claim. |
| Article copy unlock | `Not Verified` | No verification claim for this pass. |
| PCDN/WebRTC | Rule-level opt-in experiment, `Partial` at most | No default claim; WebRTC disablement not verified. |

## Default Strategy Decision

No default change is authorized.

Current default posture remains:

- `mbgaEnabled=true`
- `mbgaBlockTracking=true`
- `mbgaCleanUrl=true`
- `mbgaSimplifyUi=true`
- `mbgaDisablePcdn=false`

Existing explicit user settings must be preserved. The Safari sample used a profile whose original `mbgaDisablePcdn` was `true`; sampling restored that value, but release/default wording still treats PCDN/WebRTC as opt-in experimental.

## Public Wording Boundary

Allowed wording:

- "MBGA attempts sampled known-host best-effort cleanup."
- "Telemetry-like `data.bilibili.com` / `cm.bilibili.com` paths showed partial QoL diagnostic handling in Safari samples."
- "PCDN/WebRTC remains opt-in experimental; this pass did not verify WebRTC disablement."
- "Live is currently unsupported for MBGA evidence and excluded from release claims."

Disallowed wording:

- "Complete telemetry blocking."
- "Privacy protection."
- "Full PCDN/WebRTC disablement."
- "Live MBGA support."
- "Article copy unlock verified by this pass."
- "Do Not Touch endpoints are safe to block."

## Residual Caveats

- HAR export was unavailable, so network conclusions remain below-HAR-grade.
- `PerformanceResourceTiming` absence is not proof of blocking.
- MBGA diagnostic actions prove QoL code-path decisions, not full browser/network-layer absence.
- `login/safari-account-ui.png` is not valid account UI evidence and must not be cited.
- Article sample redirected to an opus page and did not expose the expected article holder.
- Live sample is unsupported negative/control only.

## Main Thread Closure

`v0.3.12 MBGA Reality Evidence Pass` is complete as an evidence objective.

No implementation, integration, release-prep, default-change, or new MBGA-rule thread is authorized from this evidence alone.

If the next product goal is to ship a v0.3.12 artifact, the only currently justified implementation work is docs-only wording/report alignment. Any code or default change requires a separate main-thread decision and a new task brief.
