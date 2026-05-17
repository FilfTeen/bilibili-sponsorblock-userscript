# v0.3.12 Release Readiness G1 Decision

本文件是主线程对 `V0312 Release Readiness Preflight` 线程交付物的 G1 审核记录。它不是 release authorization，不授权 version bump、dist rebuild、tag、release、push 或 integration。

## Verdict

G1：`DOCS ALIGNMENT NEEDED`

主线程接受 `docs/V0312_RELEASE_READINESS_PREFLIGHT.md` 的只读预检结论。

当前 `main` 相对 `origin/main` 是 docs-only governance/evidence commits。runtime 仍是 `0.3.11`，因此不能把 v0.3.12 当作用户可见 runtime release，也不能创建 v0.3.12 release notes、Safari acceptance、tag 或 dist artifact。

但是，在 push docs-only main 前，顶层用户/工程文档应做极窄对齐：

- 给 V0312 MBGA 和 Local Learning evidence caveats 添加轻量入口；
- 修正“仍需 MBGA A/B evidence”这类已经被 V0312 `PASS WITH CAVEAT` 收束的旧措辞；
- 保持所有 wording 小于等于 MBGA G3 和 Local Learning G3。

## Evidence Reviewed

- `docs/V0312_RELEASE_READINESS_TARGET.md`
- `docs/V0312_RELEASE_READINESS_PREFLIGHT.md`
- `docs/V0312_MBGA_G3_DECISION.md`
- `docs/V0312_MBGA_REALITY_EVIDENCE.md`
- `docs/V0312_LOCAL_LEARNING_G3_DECISION.md`
- `docs/V0312_LOCAL_LEARNING_REALITY_EVIDENCE.md`
- `docs/ENGINEERING_FILE_INDEX.md`
- `README.md`
- `docs/CAPABILITIES.md`
- `docs/TECHNICAL.md`
- `docs/BLUEPRINT.md`
- `docs/RELIABILITY.md`

Main-thread spot checks:

- `package.json` version is `0.3.11`.
- `src/constants.ts` fallback version is `0.3.11`.
- `dist/bilibili-qol-core.user.js` metadata is `@version 0.3.11`.
- `@downloadURL` / `@updateURL` still point to `FilfTeen/bilibili-qol-core-userscript/main/dist/bilibili-qol-core.user.js`.
- `git diff --check origin/main..HEAD` passed.
- `git branch --contains 69194bc` returns only `codex/panel-choice-menu-version`.

## Main-Thread Decision

Authorize a narrow docs-only alignment thread.

Thread name:

`V0312 Release Readiness Docs Alignment`

创建状态：`APPROVED TO START`

Goal: align top-level docs with V0312 evidence caveats without changing runtime version, dist, release notes, Safari acceptance, defaults or claims.

Allowed files:

- `README.md`
- `docs/CAPABILITIES.md`
- `docs/TECHNICAL.md`
- `docs/BLUEPRINT.md`
- `docs/RELIABILITY.md`
- `docs/ENGINEERING_FILE_INDEX.md`, only if needed

Forbidden:

- no `src/`;
- no `dist/`;
- no `package.json`;
- no `package-lock.json`;
- no version bump;
- no dist rebuild;
- no release notes v0.3.12;
- no Safari acceptance v0.3.12;
- no tag;
- no release;
- no push;
- no integration branch changes;
- no claim upgrades.

Required alignment:

1. README must link V0312 MBGA and Local Learning evidence docs as docs-only evidence/caveat reports, not release notes.
2. CAPABILITIES must replace stale MBGA wording that says the v0.3.11 reality audit recommends future MBGA A/B evidence. The new wording must say V0312 Safari sampling closed as `PASS WITH CAVEAT`, evidence remains partial / below-HAR-grade, and no MBGA claim is upgraded.
3. Add a light Local Learning caveat pointer where useful: isolated Safari/Tampermonkey profile page-heuristic write/panel/delete/panel-derived refresh cleanup was verified; current-profile restore, raw restore, organic comment scanning, comment feedback lock closure and broad false-positive safety were not verified.
4. TECHNICAL / BLUEPRINT / RELIABILITY may receive brief evidence pointers only if they reduce ambiguity. Do not rewrite broad sections.
5. Do not present v0.3.12 as a runtime release.

Required checks:

- `git diff --check`
- `git branch --contains 69194bc`
- verify no `src/`, `dist/`, `package.json`, `package-lock.json` changes
- verify no forbidden wording from MBGA or Local Learning G3 appears as positive claim

Required report:

- files changed;
- exact wording changed;
- checks run;
- whether next exit should be `NO RELEASE / PUSH DOCS ONLY`;
- any caveat or blocker.

## Current Main-Thread State

`v0.3.12 Release Readiness Decision` remains active.

Implementation, integration, version bump, dist rebuild, tag, release and push remain `NOT AUTHORIZED`.
