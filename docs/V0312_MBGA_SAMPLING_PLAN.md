# v0.3.12 MBGA Safari Sampling Plan

本文件是 `v0.3.12 MBGA Reality Evidence Pass` 的 G1 采样方案。目标不是证明 MBGA 有用，而是让后续 Safari 主窗口采样线程能可重复地证明：

- 哪些能力有 Safari 主窗口 A/B 证据。
- 哪些能力只有部分证据或只能支持推断。
- 哪些 endpoint 属于登录、风控、播放器、评论、消息、直播或媒体路径，不能因为“看起来吵”就拦截。

## Scope

允许：

- 在已登录 Safari 主窗口采集 A/B 样本。
- 记录 `dist/bilibili-qol-core.user.js` 的 SHA-256。
- 通过 Tampermonkey 重新安装或更新目标 dist。
- 临时切换 MBGA off/on 进行采样，并恢复用户原配置。
- 写入本地原始证据到 `output/v0312-mbga-reality-evidence/`。

禁止：

- 不改 `src/`。
- 不改 `dist/`。
- 不改 `package.json`。
- 不新增 MBGA 规则。
- 不调整默认配置。
- 不把文档或 release wording 升级为更强 claim。
- 不碰 `codex/panel-choice-menu-version`。

## Evidence Standard

### Direct Proof vs Supportive Evidence

| Evidence | Can prove | Cannot prove |
| --- | --- | --- |
| `shasum -a 256 dist/bilibili-qol-core.user.js` | 当前工作树目标 dist 的字节级 digest | Tampermonkey 实际加载的就是这个文件 |
| Tampermonkey installed script export/copy hash equals dist hash | Tampermonkey 中安装的脚本文本等于目标 dist | 页面已经执行该脚本 |
| Tampermonkey update/install screenshot | 本次人工操作指向目标安装源 | 字节级一致性 |
| Diagnostic report `Version:` | 页面运行时报告的构建版本 | 不能单独证明目标 dist，因为不同 dist 可能同版本 |
| QoL Core panel plus diagnostic report on Bilibili page | 用户脚本在 Safari 主窗口页面运行 | 不能单独证明安装脚本来源 |
| Safari main-window `nav` API sanitized login proof | 当前 Safari 主窗口带 Bilibili 登录 cookie，且 `isLogin=true` | 不能证明其它标签页或其它浏览器已登录 |
| Account UI screenshot | 登录态的可视支持证据 | 不能替代 `nav` API 证明，且截图可能含个人信息 |
| Diagnostic MBGA decision telemetry | QoL Core 代码记录了 `observed`、`blocked`、`synthetic`、`rewritten`、`stubbed` 等内部动作 | 不能单独证明网络层最终发送或未发送 |
| Native guard snapshot | native request guard 自己的 enabled/support/action 状态 | 不能证明 endpoint 可安全拦截 |
| `PerformanceResourceTiming` | 页面可见资源在采样窗口内被浏览器记录 | “没有记录到”不能证明请求被阻断 |
| Safari Web Inspector HAR | 采样窗口内 Web Inspector 看到的网络请求、状态和 timing | 仍不能证明长期全量行为；HAR 缺失不能自动降为失败，但证据等级下降 |
| Web Inspector Network screenshot / copied rows | HAR 不可用时的替代网络观察 | 低于 HAR-grade；必须标为 alternative evidence |
| Page screenshot | 页面在该时刻无明显可视破坏 | 不能证明播放、评论、登录、搜索等完整功能无副作用 |

结论规则：

- `observed` 只表示 QoL Core 或 native guard 看到了请求尝试，不能写成 `blocked`。
- `blocked` / `synthetic` / `rewritten` / `stubbed` 必须来自 MBGA decision telemetry 或 native guard action 字段，不能由 Performance/HAR 中“少了某请求”反推。
- “A 组出现，B 组未出现”只能支持 `reduced/not observed in this sample`，除非同时有 MBGA action 记录和可复核网络证据。
- Login、passport、message、player、reply、gaia、live API、media host 默认 `Do Not Touch`。采样只能确认它们被允许或未被触碰，不能建议拦截。

## Raw Evidence Directory

所有原始证据写入本地 ignored 目录：

```text
output/v0312-mbga-reality-evidence/
  README.md
  environment.json
  sample-url-manifest.json
  summary.json
  dist/
    dist-sha256.txt
    dist-size.txt
    dist-head.txt
    tampermonkey-install-source.txt
    tampermonkey-update.png
    installed-userscript.txt
    installed-userscript-sha256.txt
    installed-hash-compare.txt
  login/
    safari-main-window-login-proof.json
    safari-account-ui.png
  config/
    original-config.json
    original-config.png
    set-mbga-off.json
    set-mbga-on-default.json
    set-mbga-on-pcdn-experiment.json
    restore-config.json
    restore-config.png
  pages/
    video/
      off/
      on-default/
      on-pcdn-experiment/
    bangumi/
      off/
      on-default/
      on-pcdn-experiment/
    home/
      off/
      on-default/
    search/
      off/
      on-default/
    dynamic/
      off/
      on-default/
    article/
      off/
      on-default/
    live-unsupported/
      off/
      on-default/
  endpoint-classification.csv
  endpoint-classification.md
```

Each page/state folder should contain, when available:

```text
diagnostic.txt
diagnostic.png
page-screenshot.png
performance-resources.json
page-state.json
web-inspector.har
web-inspector-network.png
side-effects.md
notes.md
```

If `web-inspector.har` cannot be exported, keep `web-inspector-network.png` plus `performance-resources.json` and mark the sample `below-har-grade`.

## Dist Identity Procedure

The sampling thread must prove two different facts: the target dist bytes, and the Tampermonkey installed script bytes.

1. From the repository root, before changing anything:

```bash
mkdir -p output/v0312-mbga-reality-evidence/dist
git status --short --branch
git rev-parse HEAD
if git merge-base --is-ancestor 69194bc HEAD; then
  echo "panel-choice-menu-ancestor=true"
else
  echo "panel-choice-menu-ancestor=false"
fi
shasum -a 256 dist/bilibili-qol-core.user.js | tee output/v0312-mbga-reality-evidence/dist/dist-sha256.txt
wc -c dist/bilibili-qol-core.user.js | tee output/v0312-mbga-reality-evidence/dist/dist-size.txt
sed -n '1,30p' dist/bilibili-qol-core.user.js > output/v0312-mbga-reality-evidence/dist/dist-head.txt
```

2. Serve the current repository dist from loopback. Record the command and port in `environment.json`.

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

3. In the same Safari profile that will run the evidence pass, open:

```text
http://127.0.0.1:8765/dist/bilibili-qol-core.user.js
```

Use Tampermonkey to install/update `Bilibili QoL Core`. Screenshot the Tampermonkey update page and save it as `dist/tampermonkey-update.png`.

4. Open Tampermonkey Dashboard -> `Bilibili QoL Core` -> editor. Export or copy the full installed script text to `dist/installed-userscript.txt`.

5. Hash the installed script copy:

```bash
shasum -a 256 output/v0312-mbga-reality-evidence/dist/installed-userscript.txt \
  | tee output/v0312-mbga-reality-evidence/dist/installed-userscript-sha256.txt
awk '{print $1}' output/v0312-mbga-reality-evidence/dist/dist-sha256.txt \
  > output/v0312-mbga-reality-evidence/dist/dist-sha256.hex
awk '{print $1}' output/v0312-mbga-reality-evidence/dist/installed-userscript-sha256.txt \
  > output/v0312-mbga-reality-evidence/dist/installed-userscript-sha256.hex
if cmp -s \
  output/v0312-mbga-reality-evidence/dist/dist-sha256.hex \
  output/v0312-mbga-reality-evidence/dist/installed-userscript-sha256.hex; then
  echo "installedEqualsDist=true" \
    | tee output/v0312-mbga-reality-evidence/dist/installed-hash-compare.txt
else
  echo "installedEqualsDist=false" \
    | tee output/v0312-mbga-reality-evidence/dist/installed-hash-compare.txt
fi
```

The digest text must match. If the installed script cannot be copied/exported and hashed, the capture must be marked `BLOCK: target dist not proven`.

6. On a supported Bilibili page, open QoL Core console -> `帮助 / 反馈` -> copy diagnostic report. Save it as the first page `diagnostic.txt`. This proves page runtime execution, not target dist by itself. The target dist proof requires steps 1-5 plus this page runtime report.

## Safari Main-Window Login Proof

Login proof must come from the real Safari main window, not Chrome, Playwright, Safari WebDriver, or a separate automation window.

Required proof:

1. Open any `www.bilibili.com` page in the Safari window used for sampling.
2. In Safari Web Inspector console, run:

```javascript
fetch("https://api.bilibili.com/x/web-interface/nav", { credentials: "include" })
  .then((response) => response.json())
  .then((payload) => {
    const data = payload && payload.data ? payload.data : {};
    console.log(JSON.stringify({
      code: payload && payload.code,
      isLogin: Boolean(data.isLogin),
      midPresent: Boolean(data.mid),
      unamePresent: Boolean(data.uname),
      vipStatusPresent: Object.prototype.hasOwnProperty.call(data, "vipStatus"),
      capturedAt: new Date().toISOString(),
      page: location.origin + location.pathname
    }, null, 2));
  });
```

3. Copy only the sanitized JSON output to `login/safari-main-window-login-proof.json`. Do not copy `mid`, `uname`, cookies, tokens, `SESSDATA`, `bili_jct`, or raw response bodies.
4. Take a screenshot of the visible account/avatar area and save it as `login/safari-account-ui.png`. This screenshot is supportive evidence and should stay local.

Passing criterion:

- `code === 0`
- `isLogin === true`
- `midPresent === true` or `unamePresent === true`

If this cannot be proven, stop. The evidence pass cannot proceed.

## Safe MBGA Toggle Procedure

The A/B pass temporarily changes user settings. It must restore the exact original MBGA-related state.

Config fields to preserve:

- `mbgaEnabled`
- `mbgaBlockTracking`
- `mbgaDisablePcdn`
- `mbgaCleanUrl`
- `mbgaSimplifyUi`

Required procedure:

1. Open QoL Core console -> `生态噪音压制 (MBGA)`.
2. Screenshot the original switch state as `config/original-config.png`.
3. Record the original boolean state into `config/original-config.json`. If the operator records it manually, include `recordingMethod: "manual-ui"`. If Tampermonkey storage is exported, include `recordingMethod: "tampermonkey-storage-export"` and only the five MBGA booleans.
4. Set `off` state:
   - `mbgaEnabled=false`
   - leave sub-switches in their original visible state if the UI allows this
   - reload page before capture
   - save `config/set-mbga-off.json`
5. Set `on-default` state:
   - `mbgaEnabled=true`
   - `mbgaBlockTracking=true`
   - `mbgaCleanUrl=true`
   - `mbgaSimplifyUi=true`
   - `mbgaDisablePcdn=false`
   - reload page before capture
   - save `config/set-mbga-on-default.json`
6. Optional, video and bangumi only: set `on-pcdn-experiment`:
   - same as `on-default`
   - `mbgaDisablePcdn=true`
   - record as experimental opt-in sample, not default evidence
   - save `config/set-mbga-on-pcdn-experiment.json`
7. Restore the exact original five booleans from `config/original-config.json`.
8. Screenshot the restored state as `config/restore-config.png`.
9. Save `config/restore-config.json` with `restoredMatchesOriginal=true`.

If original config cannot be captured or restore cannot be verified, stop and mark the run `BLOCK: configuration restore not proven`.

Important interpretation:

- `on-default` is the release-claim lane.
- `on-pcdn-experiment` is only evidence for the opt-in PCDN experiment and cannot upgrade default claims.
- Existing user explicit `mbgaDisablePcdn=true` must be preserved after sampling, but default release wording still treats PCDN/WebRTC as partial and experimental.

## Page Sampling Matrix

Before capture, write exact URLs to `sample-url-manifest.json`. URLs may change over time, so the manifest is the authority for a specific run.

| Sample ID | Page | Required URL shape | States | Primary evidence target | Claim eligibility |
| --- | --- | --- | --- | --- | --- |
| `video` | Normal video | `https://www.bilibili.com/video/BV.../?vd_source=v0312_sample&spm_id_from=v0312#reply...` when possible | `off`, `on-default`, optional `on-pcdn-experiment` | URL cleanup, telemetry host handling, native guard supported-page state, playback smoke, media host behavior | Eligible only for sampled video-page facts |
| `bangumi` | Bangumi playback | `https://www.bilibili.com/bangumi/play/...` | `off`, `on-default`, optional `on-pcdn-experiment` | playback smoke, telemetry handling, native guard supported-page state, media host behavior | Eligible only for sampled bangumi facts |
| `home` | Main feed | `https://www.bilibili.com/` | `off`, `on-default` | known-host telemetry, feed UI cleanup, no visible feed breakage | Eligible only as known-selector/best-effort UI and telemetry evidence |
| `search` | Search results | `https://search.bilibili.com/all?keyword=...` | `off`, `on-default` | query sanitization in diagnostics, thumbnail labels unaffected, telemetry decision records | Eligible for sampled search behavior only |
| `dynamic` | Dynamic feed | `https://t.bilibili.com/` or specific dynamic URL | `off`, `on-default` | dynamic wide mode marker, telemetry records, no obvious dynamic feed breakage | Eligible for sampled dynamic DOM state only |
| `article` | Article | `https://www.bilibili.com/read/cv...` with current article body DOM | `off`, `on-default` | article copy unlock marker if `.article-holder` exists, no reading breakage | Not Verified if current article DOM lacks target holder |
| `live-unsupported` | Live room negative/control sample | `https://live.bilibili.com/...` | `off`, `on-default` | prove current userscript support boundary; observe live network only as unsupported research | Excluded from v0.3.12 release claim |

Minimum side-effect checks per page:

| Page | Required side-effect check |
| --- | --- |
| `video` | video element exists, playback starts or remains playable, no `video.error`, comment area can load, account/avatar remains visible |
| `bangumi` | video element exists, no obvious player error, episode UI not broken |
| `home` | feed cards render, account/avatar remains visible, navigation/search still usable |
| `search` | result cards render, a result link is visible, no layout collapse |
| `dynamic` | dynamic items render, wide marker recorded only in on state, no empty-feed breakage |
| `article` | article text renders; if copy-unlock marker exists, record it; if absent, classify copy unlock `Not Verified` |
| `live-unsupported` | record whether QoL panel and MBGA flags are absent; do not test as supported MBGA |

## Per-Page Capture Steps

For each `Sample ID` and each state:

1. Set MBGA state according to the toggle procedure.
2. Open the exact URL from `sample-url-manifest.json` in the same logged-in Safari main window.
3. Open Safari Web Inspector -> Network before reload. Enable Preserve Log if available.
4. Hard reload the page.
5. Wait until primary content is loaded. Use a consistent wait budget, for example 20-30 seconds after first visible content.
6. Copy QoL Core diagnostic report from the panel and save `diagnostic.txt`.
7. Screenshot the diagnostic panel or copied report source as `diagnostic.png`.
8. Capture full page screenshot or visible viewport as `page-screenshot.png`.
9. Run the PerformanceResourceTiming snapshot snippet and save `performance-resources.json`.
10. Run the page-state snippet and save `page-state.json`.
11. Export Web Inspector HAR as `web-inspector.har` when Safari allows it. If not, screenshot/copy the Network table and save `web-inspector-network.png`.
12. Write `side-effects.md` with page-specific smoke results and any visible breakage.

PerformanceResourceTiming snapshot:

```javascript
(() => {
  const resources = performance.getEntriesByType("resource").map((entry) => {
    let url = null;
    try {
      const parsed = new URL(entry.name, location.href);
      url = {
        origin: parsed.origin,
        host: parsed.hostname,
        path: parsed.pathname
      };
    } catch (_error) {
      url = { origin: "[opaque]", host: "[opaque]", path: "[opaque]" };
    }
    return {
      name: url,
      initiatorType: entry.initiatorType,
      startTime: Math.round(entry.startTime),
      duration: Math.round(entry.duration),
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize
    };
  });
  console.log(JSON.stringify({
    capturedAt: new Date().toISOString(),
    page: location.origin + location.pathname,
    resourceCount: resources.length,
    resources
  }, null, 2));
})();
```

Page-state snapshot:

```javascript
(() => {
  const markNames = [
    "__BSB_MBGA_URL_CLEANER__",
    "__BSB_MBGA_BLOCK_TRACKING__",
    "__BSB_MBGA_PCDN_DISABLER__",
    "__BSB_MBGA_DYNAMIC_WIDE_SWITCH__",
    "__BSB_MBGA_ARTICLE_COPY_UNLOCK__",
    "__BSB_MBGA_VIDEO_FIT_MODE__",
    "__BSB_MBGA_GRAYSCALE_OBSERVER__"
  ];
  const marks = Object.fromEntries(markNames.map((name) => [name, Boolean(window[name])]));
  const video = document.querySelector("video");
  console.log(JSON.stringify({
    capturedAt: new Date().toISOString(),
    page: location.origin + location.pathname,
    title: document.title,
    hasQolPanel: Boolean(document.querySelector(".bsb-tm-panel, .bsb-tm-console, [data-bsb-panel]")),
    mbgaMarks: marks,
    htmlWide: document.documentElement.hasAttribute("wide"),
    articleCopyUnlocked: Boolean(document.querySelector("[data-bsb-mbga-copy-unlocked='true']")),
    video: video ? {
      present: true,
      readyState: video.readyState,
      paused: video.paused,
      error: video.error ? {
        code: video.error.code,
        message: video.error.message
      } : null
    } : { present: false },
    rtcPeerConnectionSource: typeof window.RTCPeerConnection === "function"
      ? String(window.RTCPeerConnection).slice(0, 160)
      : String(window.RTCPeerConnection)
  }, null, 2));
})();
```

The page-state snippet is supportive evidence. MBGA decision telemetry and native guard snapshot must come from `diagnostic.txt`.

## Endpoint Classification Table

`endpoint-classification.csv` and `endpoint-classification.md` must use these fields:

| Field | Meaning |
| --- | --- |
| `endpoint_id` | Stable row id, for example `ep-data-log-web` |
| `host_pattern` | Host or wildcard, for example `data.bilibili.com` |
| `path_pattern` | Path or wildcard, for example `/log/web` |
| `sample_pages` | Comma-separated sample IDs where seen or tested |
| `endpoint_role` | `telemetry-likely`, `player-required`, `login-required`, `message-required`, `comment-required`, `search-required`, `live-required`, `media-static`, `anti-abuse-risk`, `unknown` |
| `do_not_touch_basis` | Empty or reason such as `login`, `player`, `reply`, `passport`, `message`, `gaia`, `live`, `media` |
| `off_perf_count` | Count from PerformanceResourceTiming in off state |
| `on_perf_count` | Count from PerformanceResourceTiming in on-default state |
| `off_har_count` | Count from HAR in off state, or `missing` |
| `on_har_count` | Count from HAR in on-default state, or `missing` |
| `observed_by` | Evidence sources that observed or classified the endpoint, for example `performance`, `har`, `mbga-telemetry`, `native-guard`, `page-state`, `screenshot` |
| `mbga_actions` | Actions from diagnostics, for example `observed=3; synthetic=2`; empty if none |
| `native_guard_actions` | Native guard actions, for example `observed-fetch=5`; empty if none |
| `qol_rule_ids` | Rule IDs seen in MBGA telemetry, for example `block-telemetry-reporters` |
| `network_outcome` | `observed-on-wire`, `not-observed-in-sample`, `synthetic-by-qol`, `rewritten-by-qol`, `stubbed-by-qol`, `blocked-by-native-guard`, `unknown` |
| `evidence_grade` | `har-grade`, `diagnostic-plus-performance`, `performance-only`, `screenshot-only`, `not-sampled` |
| `classification` | `Verified`, `Partial`, `Not Verified`, `Do Not Touch` |
| `classification_reason` | Short reason tied to evidence, not guesswork |
| `side_effect_check` | `pass`, `caveat`, `fail`, or `not-tested`; cite playback, login, comments, dynamic, search, messages, or page-load checks when relevant |
| `allowed_release_claim` | Exact conservative wording allowed, or `none` |
| `evidence_files` | Relative paths under `output/v0312-mbga-reality-evidence/` |
| `review_notes` | Audit notes and unresolved questions |

Classification rules:

- `Verified`: requires direct action evidence when claiming QoL handling, and no obvious side effect in the sampled page. For network claims, prefer HAR plus diagnostic evidence.
- `Partial`: use when diagnostics show QoL action but HAR is missing, when counts differ but action evidence is incomplete, or when only one page shape is sampled.
- `Not Verified`: use when endpoint did not appear, page DOM did not expose target feature, or evidence depends on absence alone.
- `Do Not Touch`: use for login, passport, message, player, reply, gaia, live API, media/static, anti-abuse-risk, or unknown endpoints even if they appear noisy.

Do not merge `endpoint_role` and `classification`. Example: an endpoint can be `telemetry-likely` but still `Partial` or `Not Verified`; an endpoint can be `player-required` and therefore `Do Not Touch` even if it appears in MBGA/native guard observations.

## Observed vs Blocked Guardrails

Use these labels consistently:

| Situation | Allowed wording | Disallowed wording |
| --- | --- | --- |
| Performance/HAR saw the request | `observed on wire/in browser timing` | `blocked` |
| Native guard record says `observed-fetch` or `observed-xhr` | `native guard observed` | `native guard blocked` |
| MBGA telemetry says `observed` | `MBGA observed attempt` | `MBGA blocked` |
| MBGA telemetry says `synthetic` | `QoL returned synthetic response for this code path` | `network request was definitely absent` unless HAR/performance supports it |
| MBGA telemetry says `rewritten` | `QoL rewrote URL/input` | `original host was never contacted` unless HAR/performance supports it |
| Endpoint absent from on sample | `not observed in this on sample` | `blocked` |
| Endpoint is Do Not Touch and observed allowed | `observed and should remain allowed` | `candidate for blocklist` |

Any endpoint row that uses the word `blocked` must point to the exact diagnostic/native action and the evidence file containing it.

## Live Page Decision

For v0.3.12, `live.bilibili.com` is an unsupported negative/control sample and future-support research input.

Current release-claim rule:

- Live is excluded from v0.3.12 MBGA release claims.
- The live sample may prove that QoL Core does not currently run there, or that MBGA flags are absent there.
- Live network observations must not be used to claim live telemetry blocking, live PCDN handling, or live UI cleanup.
- Any future live support requires a separate implementation authorization, new `@match`/support-gate review, and fresh Safari A/B evidence.

Classification:

- `live.bilibili.com` page support: `Not Verified / unsupported`.
- `api.live.bilibili.com/*`: `Do Not Touch` until a dedicated live support plan exists.
- live media and chat/session resources: `Do Not Touch`.

## Summary JSON Requirements

`summary.json` should include:

```json
{
  "target": "v0.3.12 MBGA Reality Evidence Pass",
  "capturedAt": "ISO-8601",
  "repository": {
    "path": "/Users/dwight/Downloads/Experimental repository_For_Codex/bilibili-sponsorblock-userscript",
    "head": "git sha",
    "branch": "branch name",
    "panelChoiceMenuAncestor": false
  },
  "dist": {
    "path": "dist/bilibili-qol-core.user.js",
    "sha256": "hex",
    "installedScriptSha256": "hex",
    "installedEqualsDist": true
  },
  "safari": {
    "window": "main",
    "loggedIn": true,
    "loginProofFile": "login/safari-main-window-login-proof.json"
  },
  "config": {
    "originalConfigFile": "config/original-config.json",
    "restoredMatchesOriginal": true
  },
  "samples": [
    {
      "sampleId": "video",
      "states": ["off", "on-default", "on-pcdn-experiment"],
      "harGrade": true,
      "result": "PASS_WITH_CAVEAT"
    }
  ],
  "livePolicy": "unsupported-sample-future-support-research-excluded-from-release-claim",
  "blockingIssues": [],
  "caveats": []
}
```

## Stop Conditions

Stop the run and mark `summary.json` as `BLOCK` if any of these occur:

- Safari main-window login proof cannot show `isLogin=true`.
- Installed Tampermonkey script hash cannot be matched to target dist hash.
- QoL Core diagnostic report cannot be produced from the Safari main window.
- Original MBGA config cannot be captured.
- Original MBGA config cannot be restored after sampling.
- A/B evidence only contains `observed` records but the draft conclusion tries to claim `blocked`.
- Any sample shows P0/P1 breakage in playback, login, comments, dynamic, search, article reading, or account navigation.
- Endpoint classification proposes touching login, passport, message, player, reply, gaia, live API, media/static, anti-abuse-risk, or unknown endpoints without a separate main-thread decision.

## Expected Output For Audit Thread

The Safari capture thread should hand the audit thread:

- `summary.json`
- `sample-url-manifest.json`
- dist hash and installed-script hash evidence
- login proof JSON
- original/restore config evidence
- page folders with diagnostic reports, screenshots, performance snapshots, HAR or alternative network evidence
- `endpoint-classification.csv`
- `endpoint-classification.md`

The audit thread should be able to reproduce every `Verified`, `Partial`, `Not Verified`, and `Do Not Touch` row from local evidence paths without trusting the sampler's prose summary.
