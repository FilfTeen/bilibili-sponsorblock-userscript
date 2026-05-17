# v0.3.12 Local Learning Reality Closure G3 Decision

本文件是主线程在采样方案、Safari clean-profile 采样、证据方法修正和独立审计之后的 G3 裁决记录。它不是实现任务，不授权代码改动，不授权 release prep，也不升级 Local Learning public claim。

## Verdict

G3：`PASS WITH CAVEAT - evidence objective complete`

主线程接受 `docs/V0312_LOCAL_LEARNING_EVIDENCE_AUDIT.md` 的 `PASS WITH CAVEAT` 结论。当前证据足以完成本轮 Local Learning Reality Closure 的现实边界裁决，但结论必须保持窄范围。

当前支持：

`Verified in isolated Safari/Tampermonkey profile for page-heuristic local video label write, panel visibility, delete, final cleanup, and panel-derived refresh empty state.`

当前不支持：

- current-profile restore；
- raw restore；
- organic comment scanning；
- comment feedback lock closure；
- broad recognition quality；
- broad false-positive safety；
- release-ready without caveat。

## Evidence Reviewed

- `docs/V0312_LOCAL_LEARNING_REALITY_TARGET.md`
- `docs/V0312_LOCAL_LEARNING_SAMPLING_PLAN.md`
- `docs/V0312_LOCAL_LEARNING_G1_REVIEW.md`
- `docs/V0312_LOCAL_LEARNING_CAPTURE_G2_REVIEW.md`
- `docs/V0312_LOCAL_LEARNING_EVIDENCE_METHOD_REPAIR.md`
- `docs/V0312_LOCAL_LEARNING_G2_REPAIR_DECISION.md`
- `docs/V0312_LOCAL_LEARNING_CLEAN_PROFILE_G2C_REVIEW.md`
- `docs/V0312_LOCAL_LEARNING_AFTER_LOGIN_CAPTURE_G2_REVIEW.md`
- `docs/V0312_LOCAL_LEARNING_EVIDENCE_AUDIT.md`
- `output/v0312-local-learning-reality/summary.json`
- `output/v0312-local-learning-reality-clean-profile/summary.json`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/summary.json`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/sample-classification.csv`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/storage/restore-compare.json`

主线程复核要点：

- `dist/bilibili-qol-core.user.js` equals the installed Tampermonkey script used in after-login capture.
- SHA-256: `ec53876ecda67f51d92faa3d7af6679d4d3b3e04aa65ac48af6ac6f420ae7aa2`.
- Clean profile login proof is `isLogin=true` and privacy-preserving.
- The old root-level `BLOCKED_NOT_LOGGED_IN` evidence remains preserved.
- The after-login retry evidence lives under `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/`.
- The positive sample `BV1Bm421N7fb` supports page-heuristic local video label closure.
- The negative sample `BV1Lx411i7FB` did not become its own local commercial/ad record.
- `restore-compare.json` correctly remains `Partial` because raw storage export was forbidden.
- The audit found no prohibited privacy value exposure in shareable evidence.

## Final Classification

| Area | Decision | Main-Thread Boundary |
| --- | --- | --- |
| Clean profile dist identity | `Verified` | Installed Tampermonkey script hash equals target dist hash. |
| Clean profile login | `Verified` | Sanitized Safari main-window nav proof only; no account identity claim. |
| Positive page-heuristic local video label closure | `Verified in isolated profile` | One sampled BVID wrote a `page-heuristic` local label, appeared in panel, deleted, and returned to panel-derived empty state after final cleanup/refresh. |
| Negative ordinary sample | `Verified for sampled BVID` | Sample did not become its own local commercial/ad record; not broad false-positive proof. |
| Storage restore | `Partial` | Panel-derived before/restored counts and sample absence match; raw storage equality not available. |
| Current user profile restore | `Not Verified` | Existing 71-record profile was not destructively exercised. |
| Organic comment scanning | `Not Verified` | No evidence proves comment-originated local learning write stability. |
| Comment feedback lock closure | `Not Verified` | Not exercised in this pass. |
| Recognition quality | `Not Verified` | This pass does not evaluate broad classifier quality. |

## Claim Boundary

Allowed narrow wording:

`Verified in an isolated Safari/Tampermonkey profile for page-heuristic local video label write, panel visibility, delete, and panel-derived refresh cleanup. Current-profile restore was not exercised; raw restore, organic comment scanning, and comment feedback lock closure were not verified.`

Forbidden wording:

- `Local Learning closure fully verified`
- `raw restore verified`
- `exact restore verified`
- `current-profile restore verified`
- `verified in the user's existing 71-record profile`
- `organic comment scanning verified`
- `comment feedback lock closure verified`
- `real comments stably write local learning records`
- `commercial/ad fact confirmed`
- `recognition quality broadly verified`
- `false positives ruled out broadly`
- `release-ready without caveat`

## Implementation Decision

No implementation thread is authorized.

The current evidence does not prove a runtime blocker that requires code changes. It also does not justify:

- expanding local learning rules;
- increasing filtering aggressiveness;
- changing defaults;
- adding a private raw storage export helper;
- upgrading Local Learning release wording beyond the narrow isolated-profile claim.

Potential future targets, if the user wants stronger evidence, must be new evidence targets:

- organic comment scanning closure;
- comment feedback lock closure;
- current-profile private raw restore proof, only with explicit user approval;
- broader false-positive sampling.

## Next Gate

Current gate: `G3 complete`

Allowed next thread:

`V0312 Local Learning Docs Governance Closure`

创建状态：`APPROVED TO START`

Goal: verify all Local Learning v0.3.12 docs are internally consistent, indexed, docs-only, and ready for a commit recommendation.

Required checks:

- verify `docs/ENGINEERING_FILE_INDEX.md` lists all Local Learning governance docs;
- verify final evidence wording does not exceed this G3 decision;
- verify no `src/`, `dist/`, `package.json`, default config or recognition rule changes are included;
- run `git diff --check`;
- verify `git branch --contains 69194bc` still isolates the experiment branch;
- report whether the docs package is ready to commit.

Implementation, integration and release/preflight remain `NOT AUTHORIZED`.
