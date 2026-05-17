# v0.3.12 Local Learning Reality Evidence

本文件是 `v0.3.12 Local Learning Reality Closure` 的最终证据报告。它总结主线程 G3 裁决后的现实能力边界，不授权实现，不授权发布，也不扩大 Local Learning claim。

## Final Verdict

`PASS WITH CAVEAT`

本轮证据目标完成。证据支持一个窄范围结论：

`Verified in isolated Safari/Tampermonkey profile for page-heuristic local video label write, panel visibility, delete, and panel-derived refresh cleanup.`

该结论不等于完整 Local Learning closure。当前未验证 organic comment scanning、comment feedback lock closure、raw restore 或 current-profile restore。

## Evidence Roots

Primary docs:

- `docs/V0312_LOCAL_LEARNING_REALITY_TARGET.md`
- `docs/V0312_LOCAL_LEARNING_SAMPLING_PLAN.md`
- `docs/V0312_LOCAL_LEARNING_G1_REVIEW.md`
- `docs/V0312_LOCAL_LEARNING_CAPTURE_G2_REVIEW.md`
- `docs/V0312_LOCAL_LEARNING_EVIDENCE_METHOD_REPAIR.md`
- `docs/V0312_LOCAL_LEARNING_G2_REPAIR_DECISION.md`
- `docs/V0312_LOCAL_LEARNING_CLEAN_PROFILE_G2C_REVIEW.md`
- `docs/V0312_LOCAL_LEARNING_AFTER_LOGIN_CAPTURE_G2_REVIEW.md`
- `docs/V0312_LOCAL_LEARNING_EVIDENCE_AUDIT.md`
- `docs/V0312_LOCAL_LEARNING_G3_DECISION.md`

Primary evidence:

- `output/v0312-local-learning-reality/summary.json`
- `output/v0312-local-learning-reality-clean-profile/summary.json`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/summary.json`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/sample-classification.csv`
- `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/storage/restore-compare.json`

## What Was Verified

### Target dist identity

`dist/bilibili-qol-core.user.js` and the installed Tampermonkey script used for clean-profile after-login capture have the same SHA-256:

`ec53876ecda67f51d92faa3d7af6679d4d3b3e04aa65ac48af6ac6f420ae7aa2`

### Clean Safari login proof

The clean profile `Codex V0312 LL Clean` produced sanitized login proof:

- `navCode=0`
- `isLogin=true`
- Safari main-window source
- no UID value, username value, cookie, token, avatar or raw response captured

### Page-heuristic local label closure

Positive sample `BV1Bm421N7fb` showed:

- before state with `recordCount=0`;
- write state with `recordCount=1`;
- local record source `page-heuristic`;
- category text `商单广告`;
- panel delete control present;
- delete action observed;
- final cleanup from negative-page context;
- panel-derived refresh empty state.

### Negative sampled BVID

Negative sample `BV1Lx411i7FB` did not become its own local commercial/ad record, and the sampled evidence reports `falsePositiveRisk=false`.

This does not prove broad false-positive safety.

## Partial Evidence

Storage restore is `Partial`.

Reason:

- private raw storage export was forbidden;
- `rawRestoreEqual=null`;
- `rawRestoreProofAvailable=false`;
- panel-derived before/restored record counts both `0`;
- sampled BVID states restored to absent.

This supports panel-derived cleanup in the isolated profile, not raw storage equality.

## Not Verified

The following are not verified by this pass:

- current-profile restore;
- raw restore;
- organic comment scanning writes stable local records;
- comment feedback lock write/delete/restore;
- broader classifier quality;
- broad false-positive safety;
- user's existing 71-record profile exact restore.

## Privacy Boundary

Accepted privacy boundary:

- no comment text captured;
- no comment hash detail captured;
- no UID value captured;
- no username value captured;
- no cookie captured;
- no token captured;
- no private raw storage export;
- BVIDs and sanitized URLs are present as sample identifiers.

The audit notes that full installed userscript extracts are source-code identity evidence, not private browsing/storage export.

## Allowed Wording

Use this wording if the result must be summarized:

`Verified in an isolated Safari/Tampermonkey profile for page-heuristic local video label write, panel visibility, delete, and panel-derived refresh cleanup. Current-profile restore was not exercised; raw restore, organic comment scanning, and comment feedback lock closure were not verified.`

## Forbidden Wording

Do not claim:

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

## Main-Thread Decision

No implementation is authorized by this evidence pass.

No integration or release/preflight is authorized by this evidence pass.

If stronger evidence is desired, it should be opened as a new evidence target rather than silently extending this one.
