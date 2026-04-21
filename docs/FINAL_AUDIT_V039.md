# QoL Core v0.3.9 Final Audit

## Verdict
BLOCK

## Branch And Release State
- main: local `main` points at `d4f62ec` and contains `codex/v0.3.7-integration`.
- integration: `codex/v0.3.7-integration` points at `22176c8` and contains `codex/panel-focus-state-followup`.
- choice menu branch: `codex/panel-choice-menu-version` is the only branch containing `69194bc`; it is not in the mainline release path.
- dist artifact: only `dist/bilibili-qol-core.user.js` exists; old `dist/bilibili-sponsorblock.user.js` is absent.
- version / metadata: `package.json`, build banner, README install link, and dist metadata are aligned on `0.3.9` and `FilfTeen/bilibili-qol-core-userscript`.
- tag state: remote/local tag `v0.3.9` already points at `7edb05b`, while current local `main` is `d4f62ec` and is 14 commits ahead.

## Findings
| Severity | Area | Evidence | Problem | Risk | Suggested Fix | Release Blocking |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | Security / diagnostics privacy | `src/utils/diagnostics.ts:174` writes `Page: ${cleanString(window.location.href)}` directly. `test/diagnostics.test.ts` covers sensitive detail redaction, but not URL query/hash redaction. | Copyable diagnostics redact structured detail fields, but the page URL can still include `token`, `vd_source`, `spm_id_from`, share tracking, or other sensitive query/hash parameters. | Users may copy a diagnostic report that leaks identifying or sensitive URL parameters. This contradicts the user-facing diagnostic promise that reports clean token-like sensitive fields. | Add a dedicated URL sanitizer for `formatDiagnosticReport()` that preserves origin/path and redacts or removes sensitive query/hash parameters. Add tests covering `token`, `authorization`, `userId`, `vd_source`, `spm_id_from`, and unknown suspicious `*token*` params. | Yes |
| P1 | Release versioning | `git ls-remote --tags origin v0.3.9` returned `7edb05b`; current `main` is `d4f62ec`; `package.json`, `src/constants.ts`, docs, and dist still say `0.3.9`. `scripts/build.mjs` prefers `GITHUB_REF_NAME`, so a tag build from `v0.3.x` would emit `@version v0.3.x` instead of the package-style `0.3.x`. | The intended release changes are newer than the already existing `v0.3.9` tag, but the project version is still `0.3.9`; CI tag builds can also generate a `v`-prefixed userscript version. | Tampermonkey users already on `0.3.9` may not receive the new script as an update, and GitHub release artifacts can disagree with local/package metadata. Retagging a published tag is risky and should not be the default. | Bump the release to the next patch version, update all version markers and docs consistently, fix build version normalization to strip a leading tag `v`, rebuild, rerun validation, then create a fresh tag. | Yes |
| P2 | Release hygiene | `git rev-list --left-right --count origin/main...main` returned `0 14`; `git tag --points-at HEAD` returned no tag. | Local `main` is ahead of `origin/main` and current HEAD is not tagged. | Code can be audited locally, but release is not yet represented on GitHub. | After P1 fixes and final validation pass, push `main`, create the intended new release tag only through the approved release flow, and verify GitHub raw URL serves `dist/bilibili-qol-core.user.js`. | No |
| P2 | Validation workflow | `scripts/smoke-bilibili.mjs` and `scripts/live-check-bilibili.mjs` default to `/Applications/Google Chrome.app/...`. | Smoke scripts can be misread as real acceptance despite Safari being the only QoL Core real runtime. | A future worker may accidentally cite Chrome smoke as acceptance evidence. | Document that these scripts are reference/smoke only, or add a Safari-first smoke alias for release validation. | No |
| P3 | Documentation | `docs/SAFARI_ACCEPTANCE_V037.md` is explicitly historical and still centers v0.3.7/v0.3.8 checks. | There is no dedicated v0.3.9 Safari acceptance checklist covering native select focus state, diagnostics URL redaction, and final QoL Core release behavior. | Not a code bug, but release review has to reconstruct v0.3.9-specific Safari checks from scattered docs. | Add a short v0.3.9 release acceptance appendix after P1 is fixed. | No |

## Audited Areas With No Blocking Findings
- Git containment: `69194bc` is contained only by `codex/panel-choice-menu-version`; `9547514` is contained by mainline branches. Choice menu did not leak into mainline.
- Release artifact: `dist/` contains only `bilibili-qol-core.user.js`; metadata name, version, download URL, and update URL match `0.3.9`.
- Native select mainline: code and tests show native `<select>` remains in `src/ui/panel.ts`; choice menu implementation is not present in release files.
- CodeRabbit: `coderabbit review --agent --base origin/main` completed with 0 findings.
- Panel focus tests: `npm test -- test/panel.test.ts test/styles.test.ts` passed with 63 tests.
- Recognition baseline: `npm run evaluate:recognition` passed 43/43 approved samples with 6 pending traps and no false positives or false negatives.
- Build and compat: `npm run build` rebuilt `dist/bilibili-qol-core.user.js`; `npm run verify:compat` passed and did not produce a tracked diff.

## Validation Results
- `npm ci`: passed; installed missing local dependencies for this audit worktree.
- `git status --short --branch`: initial and final tracked state was clean, shown as detached `HEAD (no branch)` at local main commit.
- `git log --oneline --decorate --max-count=20`: confirmed `HEAD` and `main` at `d4f62ec`.
- `git branch --contains 69194bc`: only `codex/panel-choice-menu-version`.
- `git branch --contains 9547514`: detached HEAD, `codex/panel-choice-menu-version`, `codex/panel-focus-state-followup`, `codex/v0.3.7-integration`, and `main`.
- `git ls-remote --tags origin v0.3.9`: confirmed remote tag `v0.3.9` points at `7edb05b`, not current `d4f62ec`.
- `git log --oneline --decorate origin/main..main`: confirmed 14 local commits after `origin/main` / `v0.3.9`.
- `rg -n "/Users/dwight|\\.codex/worktrees|Experimental repository|bilibili-sponsorblock.user.js|Bilibili SponsorBlock|BSC|BSB" README.md docs src test scripts package.json dist || true`: only expected historical/internal BSB/BSC compatibility references and no local absolute paths.
- `coderabbit auth status --agent`: authenticated as `FilfTeen`.
- `coderabbit review --agent --base origin/main`: completed, CodeRabbit found 0 findings.
- `npm test -- test/panel.test.ts test/styles.test.ts`: passed, 2 files and 63 tests.
- `npm run evaluate:recognition`: passed, 43/43 approved samples, 6 pending traps.
- `npm test`: passed, 39 files and 274 tests.
- `npm run check`: passed.
- `npm run build`: passed, rebuilt `dist/bilibili-qol-core.user.js` at 505.8kb.
- `npm run verify:compat`: passed.
- `git diff --check`: passed.

## Safari Reality Check
- Completed: `npm run validate:safari` passed using Safari WebDriver and generated page-level snapshots under ignored `output/safari`.
- Completed evidence: video pages mounted compact header and title pill; search page mounted thumbnail labels and no compact header.
- Not completed: logged-in Safari main-window Tampermonkey menu, panel native select interaction, diagnostic copy report, upstream vote, and real account-dependent comment feedback were not manually exercised.
- Limitation: Safari WebDriver opens an automation-controlled browser session and does not prove behavior in the user's already logged-in main Safari window.

## Residual Risks
- The P1 diagnostics URL leak must be fixed before release.
- The release version must move beyond the already published `v0.3.9` line, or the release process must explicitly and safely justify retagging. The safer path is a new patch version.
- Safari native select behavior still requires human main-window validation because JSDOM and WebDriver cannot fully model macOS native select menu lifecycle.
- `pending traps: 6` remain non-blocking recognition observation samples, not confirmed failures.
- `@connect *` remains broad by design and should be treated as documented userscript permission risk.

## Recommendation To Main Thread
- Do not release current `d4f62ec` as-is.
- Open a narrow fix task for diagnostics URL sanitization plus tests.
- Treat the next real release as a new patch version after `v0.3.9`, and fix tag-name version normalization in the build script before tagging.
- After the fix, rerun the full validation chain and do a logged-in Safari main-window check of diagnostics copy output and panel native select focus state.
- Keep `codex/panel-choice-menu-version` archived only; do not merge it.
