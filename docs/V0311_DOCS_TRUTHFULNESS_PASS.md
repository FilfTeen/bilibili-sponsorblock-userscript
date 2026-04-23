# QoL Core v0.3.11 Docs Truthfulness Pass

## Scope

This pass aligns public documentation with the v0.3.11 reality audit evidence. It does not change runtime code, tests, build output, package metadata, release tags, or the isolated `codex/panel-choice-menu-version` branch.

This pass was written while QoL Core v0.3.10 was the published baseline. The v0.3.11 release candidate keeps these conservative boundaries and turns the evidence-hardening work into release documentation.

## What Changed

- Downgraded MBGA wording from broad "生态净化" language to "生态噪音压制（best-effort）".
- Replaced broad "阻断 / 禁用 / 隐私保护" implications with "尝试减少 / 已知规则 / 部分路径 / 需要 Safari A/B 证据".
- Clarified that PCDN / WebRTC handling is partial suppression of known paths, not complete disabling.
- Clarified that native request guard only covers a narrow topbar badge path list and must be revalidated against Bilibili experiments.
- Marked `docs/SAFARI_ACCEPTANCE_V037.md` and `docs/AUDIT_V037.md` as historical evidence, not current release proof.
- Added links from README to the v0.3.11 reality audit and this truthfulness pass.

## Downgraded Terms

| Previous wording | Current boundary |
| --- | --- |
| MBGA 生态净化 | MBGA 生态噪音压制（best-effort） |
| 阻断遥测/追踪请求 | 尝试减少部分已知遥测/追踪请求 |
| 禁用 / 压制 PCDN | 对部分已知 PCDN / WebRTC 路径做 best-effort 压制 |
| 隐私保护 | 减少部分已知页面噪音与追踪参数 |
| 验收通过 | 区分自动化验证、Safari WebDriver 辅助验证和已登录 Safari 主窗口验收 |
| 广告识别准确 | 保守启发式识别，优先降低误杀 |

## Still Requires Safari Evidence

- MBGA on/off network A/B captures for video, bangumi, home feed, dynamic, article, and live pages.
- Proof that native request guard paths remain redundant under current Bilibili experiments.
- Evidence that PCDN / WebRTC suppression does not break playback, live rooms, danmaku, or interactive features.
- Real article copy unlock, dynamic wide mode, live cleanup, and video-fit mode samples.
- Main-window Safari panel checks for native select, input, color preview, diagnostics report, and menu entry behavior.

## Historical Documents

The following documents remain useful but should not be treated as current release acceptance proof:

- `docs/SAFARI_ACCEPTANCE_V037.md`
- `docs/AUDIT_V037.md`
- `docs/FINAL_AUDIT_V039.md`
- `docs/BRANCH_HEALTH_V037.md`

When these documents mention "fixed" or older "净化" wording, read it as historical project state. Current MBGA truthfulness should be judged by `docs/V0311_REALITY_AUDIT.md`, `docs/V0311_MBGA_NETWORK_EVIDENCE.md`, and future Safari A/B evidence.

## Preserved Boundaries

- `bsb_tm_*` remains the internal compatibility key prefix and does not need user-visible renaming.
- `codex/panel-choice-menu-version` remains an isolated experiment branch, not part of the release mainline.
- v0.3.11 release prep preserves the same conservative MBGA boundaries; publication still depends on final Safari acceptance and release validation.
- QoL Core remains a low-intrusion userscript, not a complete privacy, anti-tracking, or anti-PCDN product.
