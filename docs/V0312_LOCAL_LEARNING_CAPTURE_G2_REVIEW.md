# v0.3.12 Local Learning Safari Capture G2 Review

本文件是主线程对 `V0312 Local Learning Main-Window Capture` Safari 采样线程交付物的 G2 gate 审核记录。它不是最终 evidence report，不授权代码改动，也不授权发布。

## Verdict

G2：`BLOCK - positive local learning closure not proven`

主线程接受采样线程的失败结论。当前证据足以证明目标 dist 身份、Safari 主窗口登录态和隐私保护执行情况，但不足以证明 Local Learning 写入、面板展示、删除/刷新和恢复的真实闭环。

## Reviewed Evidence

原始证据目录：

- `output/v0312-local-learning-reality/`

重点文件：

- `output/v0312-local-learning-reality/summary.json`
- `output/v0312-local-learning-reality/sample-classification.csv`
- `output/v0312-local-learning-reality/sample-classification.md`
- `output/v0312-local-learning-reality/dist/installed-hash-compare.txt`
- `output/v0312-local-learning-reality/login/safari-main-window-login-proof.json`
- `output/v0312-local-learning-reality/storage/restore-compare.json`

## Gate Checks

| Check | Result | Evidence |
| --- | --- | --- |
| `sample-url-manifest.json` first | Pass | Manifest exists and records candidate URLs plus drift policy. |
| Safari main window login | Pass | Sanitized login proof has `code=0`, `isLogin=true`, `userAgentFamily=Safari`, `webdriver=false`. |
| Target dist identity | Pass | Target dist hash equals Tampermonkey installed script hash. |
| Runtime diagnostics | Pass | Safari diagnostic report exists from the same evidence run. |
| Privacy / redaction | Pass with caveat | Shareable evidence marks `commentTextIncluded=false`, `commentHashIncluded=false`, and avoids non-sample BVID lists. |
| Raw storage restore proof | Block | Raw Tampermonkey storage export was not obtained; raw digest equality is unavailable. |
| Positive write closure | Block | No positive sample produced a clean before/write/panel/delete/restore chain. |
| Negative ordinary sample | Partial | No visible title pill, badge, feedback menu, or panel record; raw storage digest unavailable. |

## Findings

### P1 - G2 cannot pass without raw or equivalent storage proof

The scoped storage keys were not exported as raw values:

- `bsb_tm_local_video_labels_v1`
- `bsb_tm_comment_feedback_v1`

`restore-compare.json` records `restoreVerified=false` and `restoreClassification=Partial`. The sampler correctly avoided destructive cleanup because the panel already contained 71 historical local learning records.

Main-thread interpretation: protecting user data was correct. But without raw digest equality or an equivalent non-sensitive script-readable proof, the run cannot establish reversible storage closure.

### P1 - No positive sample proved write causality

Positive candidates did not produce a verified closure:

- `goods-card-01`: `Not Verified`; no comment badge, feedback menu, title pill, or sample BVID local-learning record appeared.
- `cta-strong-01`: `Not Verified`; sample BVID already existed as `manual-dismiss`, so write causality cannot be proven.
- `reply-layer-01`: `Not Verified`; reply layer was not exposed and no reply badge or feedback-driven write was proven.

Main-thread interpretation: do not weaken the standard. Candidate drift and pre-existing user records mean this run failed G2.

### P2 - Negative sample is useful but not sufficient

`negative-ordinary-01` is `Partial`: it did not show a title pill, comment badge, feedback menu, or sample BVID panel record. This is useful support for the false-positive boundary, but it does not close the Local Learning write/manage/delete loop.

### P2 - Privacy handling was correct

The evidence package intentionally avoids comment text, comment hash details, cookies, tokens, uid, and full non-sample local record lists. The sampler also removed a transient panel capture that could have exposed non-sample records.

Main-thread interpretation: this protects the project boundary and should be preserved in the next sampling design.

## Main Thread Decision

Do not proceed to independent audit yet. The audit thread is still blocked because G2 did not produce the required raw evidence and sample table for a positive closure claim.

Do not open implementation or integration work. The failure is currently evidence-method and sample-governance related, not a proven runtime defect.

## Required Next Step

Start a repair research thread:

`V0312 Local Learning Evidence Method Repair`

Goal:

- Find a non-destructive way to prove scoped local learning storage before/after/restore without exposing the user's 71 historical records.
- Define how to obtain clean positive samples whose BVIDs are absent from local learning before sampling.
- Decide whether the next capture needs a clean Safari/Tampermonkey profile, a user-approved private raw export, a safe in-page diagnostic helper, or a docs-only downgrade.

The repair thread must remain read-only or docs-only. It must not change runtime code unless the main thread later creates a separate implementation task.

## Instructions To Capture Thread

Stand by. Do not resample until the repair plan is accepted.

Do not delete existing local learning records. Do not clear the 71 historical records. Do not try to manufacture positive samples by weakening the sample standard.

## Current Target State

`v0.3.12 Local Learning Reality Closure` remains active but blocked at G2.
