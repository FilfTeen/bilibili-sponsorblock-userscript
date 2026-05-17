# v0.3.12 Release Readiness G2 Decision

本文件是主线程对 `V0312 Release Readiness Docs Alignment` 交付物的 G2 审核和 release/readiness 裁决。它不授权 version bump、dist rebuild、tag、release、integration 或 runtime work。

## Verdict

G2：`NO RELEASE / PUSH DOCS ONLY`

主线程接受 docs alignment 结果。顶层文档已经轻量引用 V0312 MBGA / Local Learning evidence caveats，并保持 v0.3.12 为 docs-only evidence/governance milestone，不是用户可见 runtime release。

当前不需要：

- v0.3.12 release notes；
- v0.3.12 Safari acceptance；
- version bump；
- dist rebuild；
- tag；
- GitHub release；
- runtime target；
- integration branch work。

## Evidence Reviewed

Changed docs:

- `README.md`
- `docs/CAPABILITIES.md`
- `docs/TECHNICAL.md`
- `docs/BLUEPRINT.md`
- `docs/RELIABILITY.md`

Release/readiness docs:

- `docs/V0312_RELEASE_READINESS_TARGET.md`
- `docs/V0312_RELEASE_READINESS_PREFLIGHT.md`
- `docs/V0312_RELEASE_READINESS_G1_DECISION.md`

Spot checks:

- `package.json` remains `0.3.11`.
- `src/constants.ts` fallback remains `0.3.11`.
- `dist/bilibili-qol-core.user.js` remains `@version 0.3.11`.
- `@downloadURL` and `@updateURL` remain unchanged.
- `git diff --check` passed.
- `git diff --name-only -- src dist package.json package-lock.json` returned no output.
- `git branch --contains 69194bc` returns only `codex/panel-choice-menu-version`.

## Alignment Review

Accepted alignment:

- README links V0312 MBGA and Local Learning evidence reports as docs-only evidence caveats, not release notes.
- CAPABILITIES replaces stale MBGA "still need A/B evidence" wording with V0312 `PASS WITH CAVEAT` evidence boundary.
- CAPABILITIES adds Local Learning caveat: only isolated Safari/Tampermonkey profile page-heuristic write / panel / delete / panel-derived refresh cleanup is verified.
- TECHNICAL, BLUEPRINT and RELIABILITY add brief evidence-boundary pointers without broad rewrites.

Accepted claim boundary:

- MBGA remains best-effort / known-rule / partial cleanup.
- MBGA evidence remains partial / below-HAR-grade and does not upgrade claims.
- Local Learning does not claim current-profile restore, raw restore, organic comment scanning, comment feedback lock closure or broad false-positive safety.
- v0.3.12 is not presented as a runtime release.

## Decision

Current release/readiness exit:

`NO RELEASE / PUSH DOCS ONLY`

Meaning:

- The releasable userscript line remains `v0.3.11`.
- The v0.3.12 work should be treated as docs-only evidence/governance mainline work.
- It is appropriate to commit the release-readiness target and docs alignment package.
- After that commit, main may be pushed as docs-only governance/evidence updates if the user chooses.

## Next Authorized Thread

Thread name:

`V0312 Release Readiness Docs Commit Closure`

创建状态：`APPROVED TO START`

Goal: commit the release-readiness target, preflight, G1/G2 decisions and top-level docs alignment as one docs-only commit.

Allowed files:

- `README.md`
- `docs/BLUEPRINT.md`
- `docs/CAPABILITIES.md`
- `docs/TECHNICAL.md`
- `docs/RELIABILITY.md`
- `docs/ENGINEERING_FILE_INDEX.md`
- `docs/V0312_RELEASE_READINESS_TARGET.md`
- `docs/V0312_RELEASE_READINESS_PREFLIGHT.md`
- `docs/V0312_RELEASE_READINESS_G1_DECISION.md`
- `docs/V0312_RELEASE_READINESS_G2_DECISION.md`

Suggested commit message:

`docs(v0312): decide release readiness as docs-only`

Required checks before commit:

- `git diff --check`
- `git diff --name-only -- src dist package.json package-lock.json`
- `git branch --contains 69194bc`

Required checks after commit:

- `git status --short --branch`
- `git log --oneline --decorate --max-count=5`
- `git diff --check HEAD~1..HEAD`
- `git show --name-only --format='commit %H%nsubject %s' HEAD`
- `git branch --contains 69194bc`

Stop conditions:

- any runtime file appears in the commit;
- `git diff --check` fails;
- `69194bc` appears on `main`;
- wording presents v0.3.12 as runtime release;
- release notes / Safari acceptance / version bump / dist rebuild appears.

## Main-Thread Standing Decision

Implementation, integration, version bump, dist rebuild, tag, release and push remain `NOT AUTHORIZED`.
