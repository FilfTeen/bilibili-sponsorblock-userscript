# v0.3.12 Release Readiness Decision Target

本文件是 v0.3.12 第三个主线程跟踪目标的目标卡。它不是实现目标，不是版本 bump，不是 dist rebuild，不是 tag/release 授权。

## Main-Thread Initiation

状态：`G2 COMPLETE - NO RELEASE / PUSH DOCS ONLY; commit closure authorized`

立项日期：2026-05-16

目标启动时基线：

- 本地主线：`main` at `5e9939e`
- 目标启动时发布基线：tag `v0.3.11` at `2af59cb`
- 目标启动时远端主线：`origin/main`，当时与上一行发布基线同提交
- 当前 docs-only 提交：`6888edf`、`1456aae`、`5e9939e` 加上 v0.3.11 handoff docs commits
- 当前 runtime version：`0.3.11`
- 当前 dist：`dist/bilibili-qol-core.user.js` metadata `@version 0.3.11`
- 隔离实验：`codex/panel-choice-menu-version` contains `69194bc` and remains isolated

主线程接受 Strategy Planner 建议：不启动第三个功能/证据目标。当前 v0.3.12 进入 release/readiness decision。

## Target Card

| Item | Content |
| --- | --- |
| Target name | `v0.3.12 Release Readiness Decision` |
| Target type | release/preflight decision; non-implementation |
| Main-thread responsibility | Decide whether v0.3.12 should be a user-visible release, docs-only push, paused mainline milestone, docs alignment task, or new runtime target |
| Non-goals | No code changes; no version bump; no dist rebuild; no tag; no release |
| Inputs | MBGA G3/final evidence; Local Learning G3/final evidence; `ENGINEERING_FILE_INDEX`; v0.3.11 release baseline |
| Required checks | version/dist still `0.3.11`; docs-only commits suitability; user-facing docs caveat alignment; release/version semantic risk |
| Decision exits | `NO RELEASE / PUSH DOCS ONLY`; `DOCS ALIGNMENT NEEDED`; `RELEASE PREFLIGHT NEEDED`; `NEW RUNTIME TARGET REQUIRED` |

## Known Facts Before Preflight

- `package.json` version remains `0.3.11`.
- `src/constants.ts` fallback version remains `0.3.11`.
- `dist/bilibili-qol-core.user.js` metadata remains `@version 0.3.11`.
- README, BLUEPRINT, CAPABILITIES, TECHNICAL, RELEASE_NOTES and SAFARI_ACCEPTANCE remain v0.3.11 user-facing docs.
- v0.3.12 docs currently represent governance/evidence milestones, not runtime release changes.
- No implementation, integration or release/preflight work has been authorized by MBGA or Local Learning G3 decisions.

## Gate Design

| Gate | Condition | Exit |
| --- | --- | --- |
| G1 | Release/preflight thread read-only checks version, dist, README, release notes, capability wording and evidence docs | Recommend no-go / docs-only push / docs alignment / release preflight |
| G2 | Main thread decides whether docs alignment is needed | If needed, open docs-only narrow target |
| G3 | Only if user-visible release is justified | Authorize version/dist/release notes/preflight path |
| G4 | Before any publish/tag | Full release/preflight profile checks required |

## Thread Creation Signal

### Release / Preflight Thread: V0312 Release Readiness Preflight

创建状态：`COMPLETED - DOCS ALIGNMENT NEEDED`

Goal: read-only release/readiness assessment for current docs-only v0.3.12 mainline state.

Allowed writes:

- `docs/V0312_RELEASE_READINESS_PREFLIGHT.md`

Forbidden:

- no `src/` changes;
- no `dist/` changes;
- no `package.json` changes;
- no version bump;
- no dist rebuild;
- no tag;
- no release;
- no push;
- no integration branch changes;
- no claim upgrades.

Required checks:

- `git status --short --branch`
- `git log --oneline --decorate --max-count=10`
- `git rev-list --left-right --count origin/main...HEAD`
- `git diff --name-only origin/main..HEAD`
- `git diff --check origin/main..HEAD`
- `git branch --contains 69194bc`
- verify `package.json` version;
- verify `src/constants.ts` fallback version;
- verify dist metadata `@version`, `@downloadURL`, `@updateURL`;
- verify README / CAPABILITIES / TECHNICAL / BLUEPRINT / RELIABILITY do not overclaim MBGA or Local Learning evidence;
- verify whether README or engineering index should link V0312 evidence docs before pushing;
- verify whether release notes / Safari acceptance for v0.3.12 are needed or explicitly not needed.

Required output:

- `docs/V0312_RELEASE_READINESS_PREFLIGHT.md`

Required verdict:

- `NO RELEASE / PUSH DOCS ONLY`
- `DOCS ALIGNMENT NEEDED`
- `RELEASE PREFLIGHT NEEDED`
- `NEW RUNTIME TARGET REQUIRED`
- `BLOCK`

The report must include:

- current version/dist status;
- docs-only commit inventory;
- user-facing docs caveat assessment;
- release semantic risk;
- branch/integration assessment;
- exact next recommendation.

G1 review: `docs/V0312_RELEASE_READINESS_G1_DECISION.md`.

Result: main thread accepts `DOCS ALIGNMENT NEEDED`. No release path is authorized.

### Documentation Thread: V0312 Release Readiness Docs Alignment

创建状态：`COMPLETED - NO RELEASE / PUSH DOCS ONLY`

Goal: narrowly align top-level docs with V0312 evidence caveats before deciding whether docs-only commits can be pushed.

Allowed files:

- `README.md`
- `docs/CAPABILITIES.md`
- `docs/TECHNICAL.md`
- `docs/BLUEPRINT.md`
- `docs/RELIABILITY.md`
- `docs/ENGINEERING_FILE_INDEX.md`, only if needed

Forbidden:

- no runtime code changes;
- no dist changes;
- no package/version changes;
- no v0.3.12 release notes or Safari acceptance;
- no tag/release/push;
- no integration branch changes;
- no claim upgrades.

Expected exit after this thread:

`NO RELEASE / PUSH DOCS ONLY`, unless alignment uncovers a blocker.

G2 review: `docs/V0312_RELEASE_READINESS_G2_DECISION.md`.

Result: main thread accepts docs alignment and decides `NO RELEASE / PUSH DOCS ONLY`.

### Commit Thread: V0312 Release Readiness Docs Commit Closure

创建状态：`APPROVED TO START`

Goal: commit the release-readiness target, preflight, G1/G2 decisions and top-level docs alignment as a docs-only commit.

Suggested commit message:

`docs(v0312): decide release readiness as docs-only`

No release, tag, push, version bump, dist rebuild or runtime work is authorized.

## Main-Thread Standing Decision

No third functionality/evidence target is open.

Implementation, integration, version bump, dist rebuild, tag, release and push remain `NOT AUTHORIZED`.
