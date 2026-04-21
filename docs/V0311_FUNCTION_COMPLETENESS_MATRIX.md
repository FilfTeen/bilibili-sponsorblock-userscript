# QoL Core v0.3.11 Function Completeness Matrix

Evidence levels:

- Verified: covered by automated tests and at least some current Safari evidence.
- Partially Verified: code and tests exist, but real Safari evidence is incomplete.
- Not Verified: code exists, but current audit found no real evidence.
- Misleading: public claim would exceed implementation.
- Risky: implementation can affect native page behavior and needs stronger evidence before expanding/defaulting.

| Capability | Claim | Implementation | Automated Evidence | Safari Evidence | Gaps | Risk | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SponsorBlock segment skip | Skip configured segments and allow undo/keep. | `src/core/controller.ts`, `src/core/segment-filter.ts`, `src/api/sponsorblock-client.ts`. | `test/controller.test.ts`, `test/segment-filter.test.ts`. | Not manually sampled in this pass. | Needs current logged-in Safari playback check. | P2 if playback controls regress. | Keep; add release smoke for skip/undo/keep. |
| Mute / POI / preview bar | Mute, highlight POI, show preview bar. | `ScriptController`, `PreviewBar`. | Unit tests cover state, less visual reality. | Not sampled. | Need real playback and progress bar sampling. | Visual/behavior drift. | Keep; add Safari scenario. |
| Whole-video upstream labels | Show SponsorBlock `full` and video-label API labels. | `resolveWholeVideoLabels`, `VideoLabelClient`, `TitleBadge`. | `test/whole-video-label.test.ts`, `test/title-badge.test.ts`. | WebDriver saw title pill; front tab saw title pill. | Source distinction not manually verified in Safari. | Users may confuse local/API/upstream source. | Keep; improve popover source wording if needed. |
| Upstream feedback | Only real full UUID votes upstream; 405/429/2xx handled. | `SponsorBlockClient.vote`, controller vote handling. | `test/sponsorblock-client.test.ts`, `test/controller.test.ts`. | Not sampled against real upstream in this pass. | Needs real network status handling check. | Wrong vote semantics can pollute user history. | Keep; add manual upstream vote dry-run policy. |
| Local video inference | Infer video nature from title/desc/tags/comments when upstream absent. | `local-video-signal`, `local-learning`, controller. | `npm run evaluate:recognition`, local tests. | Front tab title pill exists, but source not proven. | More real samples and trap promotion needed. | False positives if over-trusted. | Keep conservative; expand sample suite. |
| Local learning | Manual keep/ignore and feedback override automatic signals. | `LocalVideoLabelStore`, `local-learning`, controller. | `test/local-learning.test.ts`, controller tests. | Not manually sampled. | No management UI for learned records. | Hard-to-reverse wrong local choices. | Add local learning manager. |
| Comment advertising and shill detection | Mark/hide goods cards, ad text, suspicious shill comments, replies, locations. | `src/features/comment-filter.ts`. | `test/comment-filter.test.ts`, recognition eval. | WebDriver sample found 0 comment badges; not enough. | Needs logged-in comments and reply-layer sampling. | Misclassification or missing current DOM. | Keep default off for filtering; add Safari samples. |
| Dynamic commercial detection | Mark/hide goods and promotional dynamics. | `src/features/dynamic-filter.ts`. | `test/dynamic-filter.test.ts`, recognition eval. | Not sampled. | Need t.bilibili.com / space page real DOM evidence. | False positives on normal activity posts. | Keep conservative; collect samples. |
| Thumbnail labels | Show whole-video labels on home/search/history/recommend/sidebar cards. | `src/features/thumbnail-labels.ts`. | `test/thumbnail-labels.test.ts`. | WebDriver saw search thumbnail labels and video sidebar labels. | History/home logged-in feed not manually sampled. | Layout drift from Bilibili card changes. | Keep; sample logged-in home/history. |
| Title badge | Stable long-title pill, popover and feedback. | `src/ui/title-badge.ts`, styles. | `test/title-badge.test.ts`, `test/styles.test.ts`. | User previously manually accepted; front tab saw title pill. | Current pass did not recheck long-title behavior. | Visual regression in Safari. | Keep; include long-title Safari check. |
| Compact header | Low-intrusion header on video/bangumi/list/opus; hide in web fullscreen. | `src/ui/compact-header.ts`, `utils/page.ts`. | `test/compact-header.test.ts`, `test/page.test.ts`, styles tests. | WebDriver and front tab saw compact header. | Bangumi web fullscreen not sampled in this pass. | Overlay can remain over player. | Keep; sample bangumi web fullscreen again. |
| Native request guard | Block redundant topbar badge requests only when compact header ready. | `src/platform/native-request-guard.ts`. | `test/native-request-guard.test.ts`. | Front tab showed active guard records, but no A/B. | Need prove blocked paths are redundant in current Bilibili. | Endpoint semantics can change. | Keep narrow; document as partial. |
| Settings panel | Native select, inputs, colors, diagnostics, two-step actions. | `src/ui/panel.ts`, `styles.ts`. | `test/panel.test.ts`, `test/styles.test.ts`. | Not re-sampled manually in this pass. | JSDOM cannot model native select lifecycle. | Safari visual/focus drift. | Keep native select; require manual checklist. |
| Diagnostics | Copy sanitized report and debug toggle. | `src/utils/diagnostics.ts`, panel. | `test/diagnostics.test.ts`. | Not manually copied in Safari. | Need confirm report output in Tampermonkey main window. | Privacy leakage if new details bypass sanitizer. | Keep; add string-value token tests later. |
| Notice center | Stack, dismiss, avoid compact header. | `src/ui/notice-center.ts`. | `test/notice-center.test.ts`, styles tests. | Not sampled. | Real animation/position not proven. | Visual overlap. | Keep; include manual sample. |
| Persistence failure rollback | Config, stats, cache, labels, feedback and vote history handle failures. | stores under `src/core`. | store tests and controller tests. | Not directly Safari-sampled. | Tampermonkey storage quota/failure not simulated in Safari. | State divergence. | Keep; add forced GM failure acceptance scenario. |
| Lifecycle | SPA URL changes, pagehide/pageshow, observer/timer cleanup. | `runtime/lifecycle`, controllers. | unit tests cover stop/start and late callbacks. | Not manually sampled. | BFCache and Bilibili SPA transitions need real evidence. | Duplicate DOM or stale observers. | Keep; sample SPA navigation. |
| Release chain | Correct dist, metadata, version, update URLs. | `scripts/build.mjs`, dist. | build/compat/tag build validation. | GitHub release verified before this audit baseline. | None for v0.3.10. | Low. | Keep. |
| MBGA clean URL | Remove selected tracking params. | `removeTracking`, history wrappers. | `test/mbga.test.ts`. | Not manually sampled with share/comment anchors. | Need real Bilibili share URL and comment anchor checks. | Could remove useful query if overbroad. | Keep; document explicit params only. |
| MBGA telemetry blocking | Block known telemetry hosts. | `mountBlockTracking`, `resolveMbgaNetworkDecision`. | `test/mbga.test.ts`. | Front tab observed data.bilibili.com open record but not definitive blocked send proof. | Need on/off Network export. | Misleading if called complete. | Rework evidence before expanding. |
| MBGA PCDN/WebRTC | Stub PCDN/WebRTC and rewrite known CDN hosts. | `mountPcdnDisabler`. | `test/mbga.test.ts`. | No A/B proof of reduced PCDN behavior. | Need WebRTC/MCDN resource evidence on video/live. | Potential playback side effects. | Consider default-off or clearer label. |
| MBGA article copy | Unlock article copy restrictions. | `mountArticleCopyUnlock`. | `test/mbga.test.ts`. | Not sampled on `/read/cv`. | Need current article DOM check. | Could interfere with article behavior. | Keep as optional, verify. |
| MBGA dynamic wide | Add dynamic wide mode. | `mountDynamicWideMode`. | one JSDOM test. | Not sampled. | Current dynamic DOM may differ. | Layout breakage. | Verify or mark experimental. |
| MBGA live cleanup | Hide live-room overlays and fallback live quality. | `mountLiveUiCleanup`, live part of `mountPcdnDisabler`. | Limited tests. | Not sampled. | Current live page may differ. | Player/live breakage. | Treat as risky until sampled. |
| MBGA grayscale cleanup | Remove page-level grayscale only when present. | `mountGrayscaleCleanup`. | `test/mbga.test.ts`. | Not sampled on real gray page. | Rare event; hard to verify. | Low. | Keep, document best-effort. |

## Priority For v0.3.11

1. MBGA real evidence and default policy.
2. Safari main-window acceptance matrix.
3. Local learning management and correction UI.
4. Documentation wording correction.
5. Additional real samples for comment/dynamic/thumbnail surfaces.
