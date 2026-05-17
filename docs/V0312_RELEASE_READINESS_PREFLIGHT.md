# v0.3.12 Release Readiness Preflight

本文件是 `V0312 Release Readiness Preflight` 线程的只读发布面判断报告。它不授权实现、不授权 version bump、不授权 dist rebuild、不授权 tag/release/push，也不升级 MBGA / Local Learning claim。

## Verdict

`DOCS ALIGNMENT NEEDED`

当前 `main` 相对 `origin/main` 的已提交差异是文档/治理资产，不是运行时代码变更。它机械上可以作为 docs-only 变更审查：没有 `src/`、`dist/`、`package.json` 变更，`git diff --check origin/main..HEAD` 通过，实验提交 `69194bc` 仍只在 `codex/panel-choice-menu-version`。

但在推送 main 前，建议先做一个极窄 docs alignment：README / CAPABILITIES / TECHNICAL / BLUEPRINT / RELIABILITY 至少应轻量引用 V0312 evidence caveats，尤其是 MBGA 已完成 Safari sampling 但结论仍是 `PASS WITH CAVEAT`、below-HAR-grade、no claim upgrade，以及 Local Learning 只验证 isolated-profile page-heuristic closure。这样可以避免顶层文档继续只指向 v0.3.11 reality gaps，而新提交的 V0312 证据包已经给出更精确的 caveat 边界。

## Current Version And Dist Status

| Check | Result |
| --- | --- |
| `package.json` | `0.3.11` |
| `src/constants.ts` fallback | `0.3.11` |
| `dist/bilibili-qol-core.user.js` metadata | `@version 0.3.11` |
| `@downloadURL` | `https://raw.githubusercontent.com/FilfTeen/bilibili-qol-core-userscript/main/dist/bilibili-qol-core.user.js` |
| `@updateURL` | `https://raw.githubusercontent.com/FilfTeen/bilibili-qol-core-userscript/main/dist/bilibili-qol-core.user.js` |
| old dist artifact | `dist/bilibili-sponsorblock.user.js` not tracked / absent |

Command evidence:

- `node -p "require('./package.json').version"` -> `0.3.11`
- `rg -n "VERSION|0\\.3\\.11|0\\.3\\.12" src/constants.ts dist/bilibili-qol-core.user.js package.json` found only `0.3.11` version markers.
- `rg -n "@version|@downloadURL|@updateURL" dist/bilibili-qol-core.user.js` confirmed the metadata above.

Conclusion: a user-visible `v0.3.12` release is not currently coherent. Publishing or tagging `v0.3.12` without a version bump and rebuilt dist would create version/dist semantic mismatch.

## Git And Branch Status

`git status --short --branch` at preflight start:

```text
## main
 M docs/ENGINEERING_FILE_INDEX.md
?? docs/V0312_RELEASE_READINESS_TARGET.md
```

The worktree already had the release target card and engineering index docs changes before this report. This thread only adds this report file.

`git rev-list --left-right --count origin/main...HEAD`:

```text
0	5
```

`git log --oneline --decorate origin/main..HEAD`:

```text
5e9939e (HEAD -> main) docs(v0312): close local learning evidence governance
6888edf docs: close v0.3.12 MBGA reality evidence pass
f578f4d docs: clarify handoff baseline state
f782fbf docs: add v0.3.11 main thread handoff
```

`git branch --contains 69194bc`:

```text
  codex/panel-choice-menu-version
```

Conclusion: the archived panel-choice experiment remains isolated from `main`.

## Docs-Only Commit Inventory

The committed range `origin/main..HEAD` changes only documentation / governance files:

- `README.md`
- `CONTRIBUTING.md`
- `docs/BLUEPRINT.md`
- `docs/BRANCH_HEALTH_V037.md`
- `docs/ENGINEERING_FILE_INDEX.md`
- `docs/FINAL_AUDIT_V039.md`
- `docs/MAIN_THREAD_HANDOFF_V0311.md`
- `docs/RELEASE_NOTES_V0311.md`
- `docs/V0311_DOCS_TRUTHFULNESS_PASS.md`
- `docs/V0311_FUNCTION_COMPLETENESS_MATRIX.md`
- `docs/V0311_SAFARI_ACCEPTANCE_GAPS.md`
- V0312 MBGA evidence docs
- V0312 Local Learning evidence docs

`git diff --name-only origin/main..HEAD | rg -v '^(README\\.md|CONTRIBUTING\\.md|docs/)'` returned no non-documentation paths.

Validation:

- `git diff --check origin/main..HEAD` passed.
- Supplemental `git diff --check` for the tracked worktree diff passed.

Conclusion: the current committed range is docs-only and mechanically suitable for a docs-only path.

## User-Facing Docs Caveat Assessment

Reviewed:

- `README.md`
- `docs/CAPABILITIES.md`
- `docs/TECHNICAL.md`
- `docs/BLUEPRINT.md`
- `docs/RELIABILITY.md`

Current state:

- The files remain framed around `v0.3.11`, which matches the runtime and dist.
- MBGA language is mostly conservative: best-effort, known-rule, partial cleanup, not complete privacy protection, not complete telemetry blocking, not complete PCDN/WebRTC disablement.
- Local Learning language does not claim broad classifier quality or full real-comment closure.
- The engineering index now routes readers to V0312 MBGA and Local Learning final evidence docs.

Alignment gap:

- README does not surface V0312 evidence docs in the main navigation.
- CAPABILITIES still says the `v0.3.11` reality audit recommends further MBGA on/off A/B evidence; that was a valid historical gap, but the new V0312 evidence package has now closed that target as `PASS WITH CAVEAT`, not as a claim upgrade.
- TECHNICAL / BLUEPRINT / RELIABILITY can remain conservative, but they should include a light pointer to the V0312 caveat boundary so future readers do not treat the V0312 docs as release evidence or as stronger runtime claims.

Recommended docs alignment scope:

1. Add README navigation links to `docs/V0312_MBGA_REALITY_EVIDENCE.md` and `docs/V0312_LOCAL_LEARNING_REALITY_EVIDENCE.md`, explicitly labeled as docs-only evidence caveats, not release notes.
2. Update CAPABILITIES MBGA caveat from "still need A/B evidence" to "V0312 Safari sampling closed as PASS WITH CAVEAT; evidence remains partial/below-HAR-grade and does not upgrade MBGA claims."
3. Add one light Local Learning caveat pointer where appropriate: isolated Safari/Tampermonkey profile page-heuristic write/panel/delete/refresh cleanup was verified; current-profile restore, raw restore, organic comment scanning, comment feedback lock closure and broad false-positive safety were not verified.
4. Keep all wording under the existing G3 boundaries. Do not present V0312 as a user-visible release.

## Release Notes And Safari Acceptance

No `docs/RELEASE_NOTES_V0312.md` or `docs/SAFARI_ACCEPTANCE_V0312.md` exists.

This is correct for the current path:

- There is no runtime `v0.3.12` artifact.
- There is no version bump.
- There is no rebuilt dist.
- The V0312 docs are evidence/governance milestones.

Creating v0.3.12 release notes or Safari acceptance now would imply a release candidate that does not exist. Those files should only be created if the main thread opens a real `RELEASE PREFLIGHT NEEDED` path with version/dist/release authorization.

## Release Semantic Risk

Do not tag or release `v0.3.12` from the current state.

Risk:

- Tampermonkey metadata still reports `0.3.11`.
- Runtime diagnostic version still reports `0.3.11`.
- README and release docs still frame the public release as `v0.3.11`.
- V0312 evidence docs do not authorize implementation, default changes, claim upgrades, or release prep.

Safe interpretation:

- `v0.3.12` is currently a docs-only evidence/governance milestone label.
- The releasable userscript line remains `v0.3.11`.

## Decision Matrix

| Exit | Decision | Reason |
| --- | --- | --- |
| `NO RELEASE / PUSH DOCS ONLY` | Not yet | Mechanically plausible, but push should wait for light top-level docs alignment to route V0312 caveats. |
| `DOCS ALIGNMENT NEEDED` | Yes | Required to reconcile top-level docs with V0312 final evidence caveats without changing runtime claims. |
| `RELEASE PREFLIGHT NEEDED` | No | No runtime `0.3.12` candidate exists. |
| `NEW RUNTIME TARGET REQUIRED` | No | MBGA and Local Learning G3 decisions found no runtime blocker requiring code/default/rule changes. |
| `BLOCK` | No | No non-doc path pollution, diff-check failure, experiment branch leak, or version metadata contamination found. |

## Exact Next Recommendation

Open a narrow docs-only alignment task before pushing main:

- allowed files: README / CAPABILITIES / TECHNICAL / BLUEPRINT / RELIABILITY and the engineering index if needed;
- forbidden: `src/`, `dist/`, `package.json`, version bump, rebuild, tag, release, integration branch changes;
- goal: add light V0312 caveat links and replace stale "needs A/B evidence" wording with "V0312 evidence completed as PASS WITH CAVEAT, no claim upgrade."

After that alignment passes `git diff --check`, the appropriate route should become:

`NO RELEASE / PUSH DOCS ONLY`
