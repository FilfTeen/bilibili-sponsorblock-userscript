# QoL Core v0.3.11 Reality Audit

## Verdict

PASS WITH v0.3.11 GAPS.

QoL Core v0.3.10 can remain published. The release blockers from v0.3.9 were fixed, the automated validation chain is green, and the current mainline does not include the archived choice menu experiment.

This audit does not support calling QoL Core "complete" yet. The largest gap is MBGA: code and unit tests prove narrow rules exist, but real Safari evidence is not yet strong enough to claim complete telemetry blocking, privacy protection, PCDN disabling, or broad "ecosystem cleanup".

## Executive Summary

- No P0 release disaster was found in the v0.3.10 baseline.
- No confirmed P1 code defect was found during this evidence pass.
- Multiple P2 gaps remain: MBGA default-on network interception lacks Safari A/B evidence, several UI/DOM cleanup rules are only JSDOM-tested, and documentation still contains stronger wording than the evidence can support.
- Safari WebDriver validation passed as page-level auxiliary evidence, but it is not equivalent to a logged-in Safari main-window Tampermonkey acceptance pass.
- A front Safari tab probe showed QoL Core UI mounted and native request guard active on a real Bilibili video tab, but login state and exact loaded userscript version could not be independently proven from the page.

## P2 Findings

| ID | Area | Finding | Evidence | Risk | Recommendation |
| --- | --- | --- | --- | --- | --- |
| V0311-P2-001 | MBGA truthfulness | MBGA is default enabled but only has narrow automated evidence for real network cleanup. | `src/features/mbga/core.ts`, `test/mbga.test.ts`, Safari front-tab probe records. | Users may believe QoL Core blocks Bilibili privacy-invasive behavior more completely than it does. | Keep v0.3.10 published, but make v0.3.11 start with real Safari A/B network sampling before adding rules. |
| V0311-P2-002 | Native request guard | The guard blocks only two topbar badge paths and records XHR as `would-block-xhr`/observed behavior; current evidence does not prove these requests are always redundant in Bilibili experiments. | `src/platform/native-request-guard.ts`, `test/native-request-guard.test.ts`, front-tab `nativeGuard.records`. | Possible future breakage if Bilibili reuses those endpoints for more than badge state. | Keep narrow allow/deny list, but add main-window A/B network evidence and document exact scope. |
| V0311-P2-003 | PCDN/WebRTC | `disable-pcdn` stubs WebRTC and rewrites known hosts, but no real Safari evidence proves lower PCDN/MCDN usage or no playback/live side effects. | `mountPcdnDisabler()`, `test/mbga.test.ts`, front-tab resource hosts include bilivideo/upOS hosts. | "禁用 PCDN" would overclaim; default-on stubs can affect player/interactive features if Bilibili changes. | Rename claim to "known PCDN/WebRTC suppression"; consider defaulting this sub-rule off until A/B evidence exists. |
| V0311-P2-004 | Safari reality | Existing Safari validation uses WebDriver with injected shims, not the user's logged-in Tampermonkey main window. | `scripts/safari-validate.py`, `output/safari/safari-validate.json`. | A feature can pass automation while failing in the real extension/menu/login environment. | Add a v0.3.11 manual Safari acceptance checklist and evidence folder convention. |
| V0311-P2-005 | Documentation | Some docs still use "净化 / 阻断 / 禁用 / 压制" language without always saying partial, known-rule, best-effort. | README, `docs/CAPABILITIES.md`, `docs/USER_GUIDE.md`, `docs/SAFARI_ACCEPTANCE_V037.md`. | Product promise can exceed real evidence. | Update public docs before v0.3.11 to separate verified features from experimental cleanup. |
| V0311-P2-006 | Local learning completeness | The learning loop supports keep/ignore and feedback, but has no full management UI to inspect, edit, or revoke learned records per video/comment. | `src/core/local-label-store.ts`, `src/features/comment-filter.ts`, `test/local-learning.test.ts`. | Wrong feedback can persist invisibly and be hard for users to correct. | Add a local learning management surface in v0.3.11 or v0.3.12. |
| V0311-P2-007 | UI visual reality | Panel/select/color focus behavior is heavily tested by DOM/CSS assertions, but Safari native control lifecycle remains only manually validated by user reports. | `test/panel.test.ts`, `test/styles.test.ts`. | JSDOM cannot model macOS native select menus or pointer disappearance behavior. | Keep native select path; add explicit manual Safari checks for select/input/color cards. |

## No P0/P1 Findings

No confirmed P0/P1 issue was found in this pass. The absence of P0/P1 is conditional: it assumes public claims stay conservative and MBGA is described as best-effort partial cleanup, not as a complete privacy or anti-PCDN system.

If public documentation or release notes claim complete privacy protection, complete telemetry blocking, or complete PCDN disabling, V0311-P2-001 should be escalated to P1 documentation truthfulness.

## Evidence Collected

### Required Commands

- `git status --short --branch`: clean on `codex/v0.3.11-reality-audit-evidence`.
- `git log --oneline --decorate --max-count=20`: baseline is `99580b3`, tagged `v0.3.10`.
- `git branch --contains 69194bc`: only `codex/panel-choice-menu-version`.
- `git tag --points-at HEAD`: `v0.3.10`.
- `npm run evaluate:recognition`: passed, 43/43 approved samples, 6 pending traps.
- `npm test`: passed, 39 files / 277 tests.
- `npm run check`: passed.
- `npm run build`: passed, rebuilt `dist/bilibili-qol-core.user.js`.
- `npm run verify:compat`: passed.
- `git diff --check`: passed.

### Scans

The required wording scan found public MBGA language in README and docs, plus expected internal compatibility identifiers using `BSB`/`bsb_tm_*`. No old `dist/bilibili-sponsorblock.user.js` artifact was found.

### Safari Evidence

- `npm run validate:safari` completed and generated `output/safari/safari-validate.json` plus screenshots.
- Safari WebDriver evidence showed compact header, title pill, and thumbnail labels on sampled video/search pages.
- Safari front-window probe was run against `https://www.bilibili.com/video/BV1q1QYBHEQ5/`.
- Front-window probe observed QoL Core panel, compact header, title pill, MBGA flags, and native request guard records.
- Login state was not independently verified.
- The exact Tampermonkey script version could not be read from a stable exposed runtime variable.

## What Not To Claim Publicly

- Do not claim QoL Core completely blocks Bilibili telemetry.
- Do not claim QoL Core fully disables PCDN/WebRTC/MCDN behavior.
- Do not claim MBGA is a privacy product.
- Do not claim Chrome/Playwright/Safari WebDriver evidence equals Safari main-window acceptance.
- Do not claim local inference is a factual commercial-content judgment.
- Do not claim comment shill detection has model-level semantic understanding.

## Recommended v0.3.11 Task Breakdown

1. MBGA Reality Audit Implementation Track: add a Safari main-window network sampling harness and compare MBGA on/off evidence.
2. MBGA Policy Track: decide which MBGA sub-rules should remain default-on, default-off, or be relabeled experimental.
3. Documentation Truthfulness Track: downgrade public wording to "best-effort, known-rule, partial cleanup" where appropriate.
4. Local Learning Management Track: add user-visible management for manual keep/ignore and comment feedback records.
5. Safari Acceptance Track: create a v0.3.11 acceptance checklist that distinguishes main-window, WebDriver, and Chrome evidence.

## Files Changed

- `docs/V0311_REALITY_AUDIT.md`
- `docs/V0311_FUNCTION_COMPLETENESS_MATRIX.md`
- `docs/V0311_MBGA_NETWORK_EVIDENCE.md`
- `docs/V0311_SAFARI_ACCEPTANCE_GAPS.md`

## Residual Risks

- No full manual Safari main-window A/B network capture was completed.
- No Safari Web Inspector Network export was collected.
- No live-room, article, dynamic, or bangumi page was fully manually sampled in this pass.
- The evidence here is sufficient for v0.3.11 planning, not for declaring QoL Core "complete".
