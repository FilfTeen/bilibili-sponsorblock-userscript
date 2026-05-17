# V0312 Local Learning Evidence Audit

Thread: `V0312 Local Learning Evidence Audit - Clean Profile PASS Candidate`

Evidence root: `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/`

## Verdict

`PASS WITH CAVEAT`

The evidence supports `Verified in isolated profile` for one page-heuristic local video label closure in the clean Safari/Tampermonkey profile `Codex V0312 LL Clean`.

This verdict is intentionally narrow:

- `Verified in isolated profile`: yes, for `BV1Bm421N7fb` page-heuristic local label write, panel visibility, delete control, final cleanup, and refresh/panel-derived empty state.
- `current-profile restore not exercised`: yes. The existing user profile with historical records was not used for destructive closure.
- `raw restore not verified`: yes. `restore-compare.json` is correctly limited to `Partial`.
- `organic comment scanning not verified`: yes. No evidence proves comment-originated local learning write stability.

## Independent Checks

### Dist and installed script

Pass.

- Current repo dist: `dist/bilibili-qol-core.user.js`
- Current dist SHA-256: `ec53876ecda67f51d92faa3d7af6679d4d3b3e04aa65ac48af6ac6f420ae7aa2`
- Evidence dist SHA-256: `ec53876ecda67f51d92faa3d7af6679d4d3b3e04aa65ac48af6ac6f420ae7aa2`
- Installed script SHA-256: `ec53876ecda67f51d92faa3d7af6679d4d3b3e04aa65ac48af6ac6f420ae7aa2`
- `diff -q dist/bilibili-qol-core.user.js .../installed-userscript-after-user-login.txt` returned no differences.

This is sufficient to prove the Tampermonkey installed script equals the target dist file in this worktree. It proves file identity, not release semver intent or build provenance beyond the checked dist artifact.

### Login proof

Pass.

`login/safari-main-window-login-proof-rerun.json` records:

- profile `Codex V0312 LL Clean`;
- source `Safari main window nav API body text`;
- sanitized URL `https://api.bilibili.com/x/web-interface/nav`;
- `userAgentFamily=Safari`;
- `navStatus=200`, `navCode=0`, `isLogin=true`;
- only boolean `hasUname=true` and `midPresent=true`, with no UID value, username value, cookie, token, avatar, or raw response captured.

This is sufficient for the audit input's clean-profile login gate. It is not a credentials or account identity proof and should not be worded as one.

### Positive sample `BV1Bm421N7fb`

Pass with caveat.

The evidence is internally consistent:

- `storage/before-summary.json`: `recordCount=0`, positive sample absent.
- `storage/after-write-summary.json` and `pages/positive-page-heuristic-02/write/page-state.json`: `recordCount=1`, sample present, `source=page-heuristic`, `categoryText=商单广告`, delete control present.
- `storage/after-delete-first-summary.json` and `pages/positive-page-heuristic-02/delete/page-state.json`: delete clicked and panel-derived records become empty.
- `storage/after-negative-summary.json`: while checking the negative page, the prior positive record is present again; this matches the sampler caveat that same-page page-heuristic re-inferred the positive record.
- `storage/after-delete-summary.json` and `pages/positive-page-heuristic-02/final-delete/page-state.json`: final cleanup deletes `BV1Bm421N7fb` from the negative page context and returns `recordCount=0`.
- `storage/after-refresh-summary.json` and `storage/restored-summary.json`: both positive and negative sample states are absent after refresh.

The supported claim is page-heuristic local video label closure in an isolated profile. The evidence does not support a claim that the first same-page delete remained stable without re-trigger, or that raw scoped storage was restored exactly.

### Negative sample `BV1Lx411i7FB`

Pass.

`pages/negative-ordinary-01/trigger/page-state.json` and `storage/after-negative-summary.json` show the negative page's own `sampleState.present=false`, no source/category for that BVID, and `falsePositiveRisk=false`.

The remaining visible record during this step belongs to the positive sample `BV1Bm421N7fb`, not to `BV1Lx411i7FB`, so it is not a negative-sample false positive blocker. `pages/negative-ordinary-01/refresh/page-state.json` then shows both samples absent after final cleanup and refresh.

### Restore evidence

Pass with required downgrade.

`storage/restore-compare.json` correctly records:

- `rawRestoreEqual=null`;
- `rawRestoreProofAvailable=false`;
- panel-derived before/restored counts both `0`;
- positive and negative sample presence restored to absent;
- `classification=Partial`.

Because private raw storage export was forbidden, this file must stay `Partial`. It cannot be upgraded to `Verified`.

### Privacy scan and evidence exposure

Pass.

I did not rely only on the sampler's summary. A read-only structured scan over the evidence files, excluding full installed userscript source extracts, found no structured privacy-value issues for UID, username, cookie, token, avatar, raw response, raw storage, comment text, or comment hash fields.

Observed privacy boundary:

- Evidence stores BVIDs and sanitized URLs.
- Scout evidence stores abstract signals, keyword match categories, lengths, and short classifier match tokens such as `商品卡`, `优惠券`, `广告`, not raw titles, descriptions, comments, comment hashes, UID values, usernames, cookies, or tokens.
- `diagnostics/privacy-scan.txt` is too sparse to be strong by itself, but the evidence JSON files and the independent scan did not show prohibited private values.
- Full installed userscript extracts are source-code identity evidence, not private browsing/storage export.

### Preserved blocked evidence

Pass.

The older root-level `BLOCKED_NOT_LOGGED_IN` evidence remains present:

- `output/v0312-local-learning-reality-clean-profile/BLOCKED.md`
- `output/v0312-local-learning-reality-clean-profile/summary.json`
- `output/v0312-local-learning-reality-clean-profile/login/safari-main-window-login-proof.json`

The after-login retry was written under `after-user-login-capture/` and did not overwrite the old blocked result.

## Evidence Gaps

- `scout/negative-ordinary-01-scout.json`, `scout/positive-page-heuristic-01-scout.json`, and `pages/positive-page-heuristic-01/trigger/page-state.json` are empty files. This does not block the final verdict because `positive-page-heuristic-01` is explicitly `Not Verified`, and the negative verdict is supported by later page/storage evidence. These empty files should not be cited as substantive proof.
- The proof is panel-derived. It cannot prove non-sample raw storage invariance.
- The proof does not exercise the user's current profile restore path.
- The proof does not cover comment feedback lock write/delete/restore.
- The proof does not cover organic comment scanning as the triggering source.

## Forbidden Wording

Do not claim any of the following:

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

Allowed narrow wording:

`Verified in isolated Safari/Tampermonkey profile for page-heuristic local video label write, panel visibility, delete, and panel-derived refresh cleanup. Current-profile restore was not exercised; raw restore and organic comment scanning were not verified.`
