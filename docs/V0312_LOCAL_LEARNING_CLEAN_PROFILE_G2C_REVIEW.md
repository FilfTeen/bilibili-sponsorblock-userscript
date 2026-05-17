# v0.3.12 Local Learning Clean-Profile Capture G2C Review

本文件是主线程对 `V0312 Local Learning Clean-Profile Capture` 采样线程交付物的审核记录。它不授权代码改动，不授权 private raw export，不授权 helper，不授权 release prep。

## Verdict

G2C：`BLOCKED - clean profile not logged in`

主线程接受采样线程按停止条件返回 `BLOCKED`。该线程证明了隔离 Safari profile、Tampermonkey 安装目标 dist、installed script hash 与 dist hash 一致，以及 userscript disabled scout 状态；但 clean profile 的 Bilibili 脱敏登录态证明返回 `isLogin=false`，因此未进入 before/write/panel/delete/refresh/restore 链路。

这不是 Local Learning 运行时代码缺陷证据，也不是正向闭环失败证据。它是验收环境前置条件未满足。

## Evidence Reviewed

- `output/v0312-local-learning-reality-clean-profile/summary.json`
- `output/v0312-local-learning-reality-clean-profile/BLOCKED.md`
- `output/v0312-local-learning-reality-clean-profile/login/safari-main-window-login-proof.json`
- `output/v0312-local-learning-reality-clean-profile/scout/tampermonkey-disabled-scout-state.json`
- `output/v0312-local-learning-reality-clean-profile/dist/installed-hash-compare.txt`
- `output/v0312-local-learning-reality-clean-profile/sample-classification.csv`
- `output/v0312-local-learning-reality-clean-profile/sample-classification.md`
- `output/v0312-local-learning-reality-clean-profile/storage/restore-compare.json`

主线程复核结果：

- `installedEqualsDist=true`。
- dist SHA-256 与 installed script SHA-256 一致：`ec53876ecda67f51d92faa3d7af6679d4d3b3e04aa65ac48af6ac6f420ae7aa2`。
- clean profile 名称记录为 `Codex V0312 LL Clean`。
- scout 状态显示 Tampermonkey script 存在，并在 scout 阶段 disabled。
- login proof 为 Safari main window，脱敏字段显示 `isLogin=false`、`navCode=-101`、`loginProofResult=BLOCKED_NOT_LOGGED_IN`。
- required chain 中 before/write/panel/delete/refresh/restore 均未执行。
- sample classification 将样本标记为 `Blocked` / `not-proven`，未误写成 `Not Verified` 的正向采样结果。
- privacy flags 均为 false；未采集评论原文、评论 hash、用户 ID、cookie 或 token。

## Main-Thread Findings

### F1 - Stop condition was correctly applied

采样线程没有在未登录 clean profile 中继续做评论采样，也没有自行 fallback 到 private raw export 或 helper。主线程接受该停止行为。

### F2 - G2 remains blocked

当前证据不能支撑 Local Learning 正向闭环。不能声明：

- clean profile positive closure verified；
- current profile exact restore verified；
- real comments reliably write to local learning；
- panel/delete/refresh/restore chain verified。

### F3 - This is an environment prerequisite blocker

阻塞原因是 clean profile 未登录，不是代码行为已失败。下一步应优先补齐 clean profile 登录态，而不是启动实现线程。

## Decision

`v0.3.12 Local Learning Reality Closure` 继续保持 `ACTIVE`，但仍停在 G2。

下一步授权：

`V0312 Local Learning Clean-Profile Capture - Login Retry`

创建状态：`APPROVED AFTER USER LOGS IN CLEAN PROFILE`

硬条件：

- 用户先在 `Codex V0312 LL Clean` Safari profile 中完成 Bilibili 登录；如需验收线程辅助，只能在用户明确授权且不接触凭据的前提下操作。
- 只能用脱敏 `x/web-interface/nav` 或等价非敏感证明验证登录态。
- 登录成功后可以继续原 clean-profile capture 链路。
- 输出仍写入 `output/v0312-local-learning-reality-clean-profile/`，但必须保留本次 BLOCKED 记录，不得覆盖或删除。

仍然禁止：

- 不得在 current 71-record profile 中做正样本写入闭环。
- 不得自行导出 private raw storage。
- 不得实现 helper。
- 不得修改 `src/`、`dist/`、`package.json`、默认配置或识别规则。
- 不得把 login retry 成功写成 G2 pass；完整 before/write/panel/delete/refresh/restore 链路仍需采样和后续审计。

## Instructions To Threads

### To Safari Capture Thread

Stand by until the user completes clean profile login. If explicit user authorization is given for assistance, do not handle credentials. After login, rerun login proof first. If `isLogin=true`, continue clean-profile closure capture. If `isLogin=false`, return `BLOCKED_NOT_LOGGED_IN` again without fallback.

### To Audit Thread

Remain blocked. This evidence package proves correct stopping behavior, not Local Learning closure.

### To Implementation Thread

No action. No runtime defect has been proven.

### To Strategy Planner

Planning direction remains valid, but the target is now blocked on clean-profile login logistics. Do not open implementation or release wording work from this result.

## Current Main-Thread State

G2 remains `BLOCKED`. The only approved next step is login retry in the clean Safari/Tampermonkey profile, followed by the same clean-profile revised capture plan.
