# v0.3.12 Local Learning Evidence Method Repair Decision

本文件是主线程对 `V0312 Local Learning Evidence Method Repair` 研究线程交付物的审核和下一步裁决。它不是采样结果，不授权代码改动，不授权 helper 实现，不授权 release prep。

## Verdict

G2R：`PASS - repair method accepted; G2 remains blocked until revised capture`

主线程接受 `docs/V0312_LOCAL_LEARNING_EVIDENCE_METHOD_REPAIR.md` 的方法修正。当前 G2 blocker 是证据方法和样本治理问题，不是已证明的运行时代码缺陷。上一轮 Safari 采样证明了目标 dist 身份、Safari 登录态和隐私边界执行，但没有证明正向 Local Learning 写入、面板展示、删除、刷新和恢复闭环。

因此：

- G2 仍为 `BLOCK`。
- 审计线程继续 `BLOCKED`，不得审计一个未通过 G2 的正向闭环结论。
- 实现线程继续 `NOT AUTHORIZED`。
- integration、release prep 继续 `NO ACTION`。

## Evidence Reviewed

- `docs/V0312_LOCAL_LEARNING_CAPTURE_G2_REVIEW.md`
- `docs/V0312_LOCAL_LEARNING_EVIDENCE_METHOD_REPAIR.md`
- `output/v0312-local-learning-reality/summary.json`
- `output/v0312-local-learning-reality/storage/restore-compare.json`
- `output/v0312-local-learning-reality/sample-classification.md`

主线程接受以下事实：

- 目标 dist 与 Tampermonkey installed script hash 一致。
- Safari 主窗口登录态证据成立。
- 现有 profile 中已有 71 条历史本地学习记录。
- 上一轮正样本候选存在预先污染，不能证明 clean positive causality。
- raw scoped storage export 未取得，`restoreVerified=false`，恢复证明只能是 `Partial`。
- 公开证据不能暴露非样本 BVID、评论 hash、评论原文、用户 ID、cookie 或 token。

## Main-Thread Audit Findings

### A1 - Repair thread correctly rejected weak proof

研究线程没有把面板可见性、record count 相等或 sample state 局部一致误写成 raw restore proof。主线程接受该边界：没有 raw digest 或等价 helper 输出时，不能声明 current-profile exact restore。

### A2 - Clean profile is the default next path

主线程选择 `clean-profile-closure` 作为下一步默认路径。理由：

- 它可以保护用户现有 71 条历史记录。
- before state 可预期为空，正向写入因果更容易审计。
- 不需要先实现 helper。
- 不要求把 current profile raw storage 导出给线程。

当前用户 profile 只允许作为 `current-profile-readonly` baseline，不允许在其中继续寻找正样本闭环。

### A3 - Same-profile private raw export requires explicit user approval

`current-profile-private-raw` 证据最强，但必须先由用户明确批准。线程不得自行导出、复制或保存 Tampermonkey scoped raw values。

如果未来选择该路径，公开证据只能包含：

- raw SHA-256 digest；
- record count；
- sample BVID states；
- sample feedback lock counts；
- non-sample projection digest；
- redaction proof。

非样本 BVID、评论 hash 和 raw JSON 不得进入 `docs/` 或 shareable `output/`。

### A4 - Diagnostic/export helper is not authorized

helper 当前不是默认路径。只有在以下条件同时成立时，主线程才会考虑另开实现线程：

- clean profile 不能完成正向闭环；
- 用户不批准或无法完成 private raw export；
- 主线程仍要求 same-profile 强恢复证明；
- 现有 Tampermonkey UI 无法稳定导出 scoped raw value。

helper 如需实现，必须是另一个极窄实现任务，且不得包含识别规则、默认配置、UI claim 或 release wording 变更。

## Revised Evidence Path Decision

主线程授权一个新的 Safari 采样线程准备启动：

`V0312 Local Learning Clean-Profile Capture`

创建状态：`APPROVED WITH PRECONDITIONS`

目标：在隔离 Safari/Tampermonkey profile 中证明 Local Learning 正样本写入、面板展示、删除、刷新和恢复闭环；同时保留当前用户 profile 的只读基线证据。

输出目录：

- `output/v0312-local-learning-reality-clean-profile/`

允许动作：

- 创建或使用干净 Safari/Tampermonkey profile。
- 在干净 profile 中安装目标 `dist/bilibili-qol-core.user.js`。
- 在干净 profile 中登录 Bilibili，并记录脱敏登录态证明。
- 记录 dist hash、installed script hash 和 installed equals dist 证明。
- 在 userscript disabled / scout 环境中预筛选候选 URL。
- 在干净 profile 中执行正样本和负样本闭环采样。
- 写 shareable evidence 到新的 output 目录。

禁止动作：

- 不得修改 `src/`、`dist/`、`package.json` 或默认配置。
- 不得扩大识别规则。
- 不得采集评论原文、评论 hash 明细、用户 ID、cookie、token 或可逆敏感标识。
- 不得清空、删除或重写当前用户 profile 的 71 条历史记录。
- 不得在当前用户 profile 中继续做正样本写入闭环。
- 不得把 clean profile 结论写成 current-profile exact restore。
- 不得自行 fallback 到 private raw export。

## Required Evidence For Revised Capture

新的采样包必须至少包含：

- `summary.json`
- `sample-url-manifest.json`
- `dist/installed-hash-compare.txt`
- `login/safari-main-window-login-proof.json`
- `storage/before-summary.json`
- `storage/after-write-summary.json`
- `storage/after-delete-summary.json`
- `storage/restore-compare.json`
- `sample-classification.csv`
- `sample-classification.md`
- Safari diagnostic report path(s)
- screenshots or diagnostic report paths for panel visibility and deletion/refresh evidence

`sample-classification.*` 必须增加或保留以下字段：

- `profile_scope`
- `storage_clean_before`
- `preexisting_source`
- `sample_feedback_locks_before`
- `write_observed`
- `panel_record_observed`
- `delete_observed`
- `refresh_state_observed`
- `raw_restore_equal`
- `positive_causality_grade`
- `false_positive_risk`
- `privacy_redaction_status`

## Stop Conditions

新的采样线程遇到任一条件必须停止并回报主线程：

- clean profile 无法创建、无法安装 Tampermonkey 或无法加载目标 dist；
- clean profile 无法登录，或登录态只能靠敏感截图证明；
- installed script hash 与目标 dist hash 不一致；
- 候选正样本在启用目标 dist 前已有 `manual`、`manual-dismiss`、automatic label 或 sample feedback lock；
- 普通负样本被持久化为商业/广告判断；
- 为证明样本必须复制评论原文；
- 线程需要 current-profile raw export；
- 线程认为必须实现 helper。

## Instructions To Threads

### To Safari Capture Thread

Stand by until assigned as `V0312 Local Learning Clean-Profile Capture`. Do not continue the old output directory. Do not resample in the current 71-record profile. Use the clean-profile path or return `BLOCKED`.

### To Audit Thread

Remain blocked. Audit only after the clean-profile capture produces a complete revised evidence package. The audit must explicitly separate `Verified in isolated profile` from `current-profile restore not exercised`.

### To Implementation Thread

No action. No helper, rules, defaults, storage changes or UI wording changes are authorized.

### To Strategy Planner

目标方向保持正确，但 G2 出口已调整：Local Learning Reality Closure 不能再把 current-profile closure 作为默认成功路径。当前默认成功定义改为：

`Verified in isolated Safari/Tampermonkey profile; existing user profile left untouched except read-only baseline.`

若 clean profile 无法取得，主线程再决定是请求用户批准 private raw export，还是将 release wording 降级为：

`Partial evidence only; positive closure not proven.`

## Main Thread Decision

`V0312 Local Learning Reality Closure` 继续推进，但不进入 G3 审计。下一步只允许 clean-profile revised capture。完成前不得开启实现线程、integration 或 release prep。
