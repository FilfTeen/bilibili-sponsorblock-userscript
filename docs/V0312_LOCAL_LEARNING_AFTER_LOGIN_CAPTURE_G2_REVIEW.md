# v0.3.12 Local Learning After-Login Clean-Profile Capture G2 Review

本文件是主线程对 `V0312 Local Learning Clean-Profile Capture` 登录后续跑证据包的 G2 审核记录。它不是最终 evidence report，不授权代码改动，不授权 release prep。

## Verdict

G2：`PASS_CANDIDATE WITH CAVEAT - advance to independent audit`

主线程接受该采样线程作为同一 `V0312 Local Learning Clean-Profile Capture` 的续跑结果，而不是新线程结果。前一轮 root-level `BLOCKED_NOT_LOGGED_IN` 证据已保留；登录后续跑证据全部写入 `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/`。

当前证据足以进入独立审计，但不足以作为最终 closure：

- 已证明 clean Safari/Tampermonkey profile 登录态和目标 dist 身份。
- 已证明隔离 profile 中一个 page-heuristic 正样本完成 write -> panel -> delete -> refresh/restore 的 panel-derived 闭环。
- 已证明一个普通负样本没有被持久化为商业/广告记录。
- storage restore 只能是 `Partial`，因为任务禁止 private raw storage export，未取得 raw equality。
- 当前证据不证明有机评论扫描闭环，不证明 current-profile exact restore，不证明评论反馈锁闭环。

## Evidence Reviewed

- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/summary.json`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/login/safari-main-window-login-proof-rerun.json`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/dist/installed-hash-compare.txt`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/sample-url-manifest.json`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/sample-classification.csv`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/sample-classification.md`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/storage/before-summary.json`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/storage/after-write-summary.json`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/storage/after-delete-first-summary.json`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/storage/after-delete-summary.json`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/storage/after-negative-summary.json`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/storage/after-refresh-summary.json`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/storage/restored-summary.json`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/storage/restore-compare.json`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/diagnostics/privacy-scan.txt`

## Main-Thread Review Findings

### F1 - Dist and login proof pass

`dist/bilibili-qol-core.user.js` SHA-256 and Tampermonkey installed script SHA-256 both equal:

`ec53876ecda67f51d92faa3d7af6679d4d3b3e04aa65ac48af6ac6f420ae7aa2`

`installedEqualsDist=true`.

Login proof is acceptable for G2 audit input:

- `navCode=0`
- `isLogin=true`
- `userAgentFamily=Safari`
- no UID value, username value, cookie, token, avatar or raw response captured.

### F2 - Positive page-heuristic closure is audit-worthy

Positive sample `BV1Bm421N7fb` produced:

- `recordCount=0` before capture;
- `recordCount=1` after write;
- local record source `page-heuristic`;
- category text `商单广告`;
- panel delete control present;
- first delete removed the record;
- final cleanup from a negative page restored panel-derived empty state.

This is enough for independent audit to review as `Verified in isolated profile` for page-heuristic local video label management.

### F3 - Negative sample did not become a local commercial/ad record

Negative sample `BV1Lx411i7FB` stayed absent as its own local record. `falsePositiveRisk=false` is plausible for audit input.

The audit must not misread the positive record reappearing during the negative sample check as a negative-sample false positive; the evidence says the positive page re-inferred itself before final cleanup.

### F4 - Restore remains Partial

`restore-compare.json` shows:

- `rawRestoreEqual=null`
- `rawRestoreProofAvailable=false`
- panel-derived before/restored counts both `0`
- positive and negative sample presence restored to absent
- classification `Partial`

This caveat is accepted because private raw storage export was forbidden. Final wording must not claim raw restore equality or current-profile exact restore.

### F5 - Scope is narrower than full Local Learning closure

The strongest current evidence is page-level heuristic -> local video label -> panel management. It does not yet prove:

- organic comment scanning writes stable local records;
- comment feedback lock write/delete/restore;
- same-profile 71-record exact restore;
- raw storage equality;
- broader recognition quality or more aggressive filtering.

## Decision

Advance to independent audit.

Authorized thread:

`V0312 Local Learning Evidence Audit - Clean Profile PASS Candidate`

创建状态：`APPROVED TO START`

Goal: independently verify whether the after-login clean-profile evidence supports `Verified in isolated profile` for page-heuristic local learning closure, and define final caveats.

Allowed writes:

- `docs/V0312_LOCAL_LEARNING_EVIDENCE_AUDIT.md`

Forbidden:

- no `src/` changes;
- no `dist/` changes;
- no `package.json` changes;
- no default config or recognition rule changes;
- no private raw storage export;
- no Safari resampling unless main thread explicitly requests it after audit.

Required audit checks:

- recompute or verify current dist hash against evidence hash;
- verify installed script proof is sufficient;
- verify login proof is Safari main window and privacy-preserving;
- verify sample classification rows match storage/page evidence;
- verify positive closure is only page-heuristic isolated-profile evidence;
- verify negative sample has no local record and no false-positive blocker;
- verify restore proof is correctly downgraded to `Partial`;
- verify privacy scan and evidence files do not expose comment text, comment hash, UID value, username value, cookie or token;
- verify old `BLOCKED_NOT_LOGGED_IN` evidence was preserved;
- identify any claim wording that must be forbidden.

Required verdict:

- `PASS`
- `PASS WITH CAVEAT`
- `BLOCK`
- `NOT REVIEWED`

The audit must explicitly separate:

- `Verified in isolated profile`
- `current-profile restore not exercised`
- `raw restore not verified`
- `organic comment scanning not verified`

## Current Main-Thread State

`v0.3.12 Local Learning Reality Closure` remains active. G2 has a `PASS_CANDIDATE WITH CAVEAT` evidence package and is now allowed to enter independent audit. Implementation, integration and release/preflight remain `NOT AUTHORIZED`.
