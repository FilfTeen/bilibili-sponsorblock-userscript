# QoL Core v0.3.11 Release Notes

## Summary

v0.3.11 is a release-candidate update focused on Local Learning Management and evidence quality. It does not expand SponsorBlock upstream behavior, MBGA blocking claims, or local inference aggressiveness.

## Highlights

- Local Learning Management is now exposed in the QoL Core console `帮助 / 反馈` page.
- Users can inspect local video learning records, delete individual records, or clear all local video learning records after confirmation.
- The console shows comment feedback lock counts and can clear those locks after confirmation without exposing comment text or hashes.
- The local learning panel refreshes after manual record actions and after automatic local signals are persisted.
- MBGA now records bounded decision telemetry for diagnostics, including action counts and recent rule samples.
- Native request guard diagnostics expose bounded snapshots so release sampling can distinguish observed, synthetic, blocked, rewritten, stubbed, skipped, and error-like behavior.
- Diagnostic sample resource URLs are normalized for readability and privacy.
- Safari evidence documents were added for MBGA A/B sampling, diagnostics sampling, reality audit gaps, and release acceptance planning.

## Caveats

- MBGA remains best-effort / known-rule / partial cleanup. It is not a complete privacy product, complete telemetry blocker, or complete Bilibili ecosystem cleanup tool.
- PCDN / WebRTC handling remains partial and experimental. New users keep this sub-feature default-off; existing explicit user settings are preserved.
- Native request guard remains a narrow topbar-badge guard, not a general request blocker.
- Local inference and comment shill detection remain conservative heuristics, not model-grade semantic judgment.
- Local Learning Management only manages local records in the current browser/script instance. It cannot delete upstream SponsorBlock or video label records.
- Organic comment scanning that automatically writes local learning records still needs more stable real-comment Safari samples before it should be treated as fully validated.

## Release Validation Requirements

- Rebuild and reload `dist/bilibili-qol-core.user.js` in Tampermonkey before Safari acceptance.
- Do not judge the integration dist only by `@version`; verify the loaded behavior and diagnostics output after reloading.
- Keep `codex/panel-choice-menu-version` isolated. It is an archived experiment, not part of v0.3.11.
- Confirm `dist/bilibili-sponsorblock.user.js` does not reappear.

## Recommended Release Message

QoL Core v0.3.11 adds Local Learning Management and improves MBGA diagnostics/evidence. The release keeps MBGA claims conservative: best-effort, partial, and experimental where appropriate. Safari main-window acceptance is still required before publishing.
