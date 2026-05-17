# v0.3.12 Local Learning Safari Sampling Plan

本文件是 `v0.3.12 Local Learning Reality Closure` 的 G1 采样方案。目标不是提高识别率，而是让后续 Safari 主窗口采样线程能可复核地证明：

- 真实登录态 Safari 主窗口加载了目标 `dist/bilibili-qol-core.user.js`。
- 真实页面信号能进入本地学习写入链路。
- 写入后的记录能在控制台 `帮助 / 反馈` 中展示、删除、刷新，并能在采样后恢复用户原始本地状态。
- 普通负样本没有被错误持久化。

## Scope

允许：

- 在已登录 Safari 主窗口采集 Local Learning 真实闭环证据。
- 记录目标 dist、Tampermonkey installed script、登录态、页面运行态和本地存储脱敏摘要。
- 使用真实视频页、真实评论区、真实回复层样本。
- 写入本地原始证据到 `output/v0312-local-learning-reality/`。

禁止：

- 不改 `src/`、`dist/`、`package.json`。
- 不新增或扩大广告、托评、商业识别规则。
- 不调整默认配置。
- 不把本地启发式判断写成事实判决。
- 不采集评论原文、评论哈希明细、用户 ID、cookie、token 或可逆敏感标识。
- 不用 Chrome、Playwright、Safari WebDriver 或人工构造 DOM 代替最终 Safari 主窗口结论。
- 不把动态页样本计入主视频本地学习闭环结论。

## Evidence Standard

### Direct Proof vs Supportive Evidence

| Evidence | Can prove | Cannot prove |
| --- | --- | --- |
| `shasum -a 256 dist/bilibili-qol-core.user.js` | 当前工作树目标 dist 的字节级 digest | Tampermonkey 实际加载的是这个文件 |
| Tampermonkey installed script hash equals dist hash | Safari 使用的 Tampermonkey 安装文本等于目标 dist | 页面已经执行该脚本 |
| Tampermonkey update/install screenshot | 人工安装源指向当前本地 dist | 字节级一致性 |
| QoL Core panel and diagnostic report on Bilibili page | 用户脚本在当前 Safari 页面运行 | 单独证明不了 installed script 等于目标 dist |
| Safari main-window `nav` API sanitized login proof | 当前 Safari 主窗口带 Bilibili 登录态 | 其它窗口、其它浏览器、自动化窗口的登录态 |
| Account UI screenshot | 登录态的可视支持证据 | 替代 `nav` API 证明 |
| Storage summary before/after | 本地学习相关存储的脱敏状态变化 | 评论原文、反馈哈希明细、用户完整观看历史 |
| Raw storage digest equality | 恢复前后原始存储字节等价 | 不暴露原始内容时，审计不能从摘要还原原文 |
| Comment badge / feedback menu screenshot | 评论识别 UI 在真实页面出现 | 单独证明本地视频标签已经持久化 |
| Local learning manager screenshot | 面板展示、删除按钮、评论反馈锁摘要可见 | 单独证明写入是由哪个评论触发 |
| Page state JSON snippet | QoL DOM 标记、按钮数量、样本 BVID 是否在面板中出现 | 评论文本内容或完整用户数据 |

结论规则：

- `Verified` 必须能从本地证据链复核：登录态、目标 dist、写入前摘要、触发中证据、写入后摘要、面板展示、删除或恢复、最终摘要。
- `Partial` 用于只证明了 UI 标记、只证明了手动反馈写入、或缺少删除/恢复/刷新中的某一环。
- `Not Verified` 用于未触发、证据不足、样本不稳定或只能靠推断。
- `False Positive Risk` 用于普通负样本被错误标记或持久化，必须停止当前采样并交主线程裁决。

## Raw Evidence Directory

所有可交付证据写入本地 ignored 目录：

```text
output/v0312-local-learning-reality/
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
    safari-runtime-page-state.json
    diagnostic.txt
    diagnostic.png
  storage/
    original-summary.json
    before-sampling-summary.json
    after-write-summary.json
    after-delete-summary.json
    restored-summary.json
    restore-compare.json
  pages/
    goods-card-01/
      before/
      trigger/
      after-write/
      panel/
      delete-refresh/
      restore/
    cta-strong-01/
      before/
      trigger/
      after-write/
      panel/
      delete-refresh/
      restore/
    negative-ordinary-01/
      before/
      trigger/
      after-write/
      panel/
      restore/
    reply-layer-01/
      before/
      trigger/
      after-write/
      panel/
      delete-refresh/
      restore/
    dynamic-adjacent-01/
      trigger/
      notes.md
  sample-classification.csv
  sample-classification.md
```

Each sample phase folder should contain, when available:

```text
page-state.json
page-screenshot-redacted.png
diagnostic.txt
diagnostic.png
storage-summary.json
operator-notes.md
```

Screenshots must be cropped or redacted so that comment bodies, usernames, avatars, uid, cookies, tokens, and feedback hash details are not visible. It is acceptable to show QoL badges, buttons, the sample BVID, and the panel count text.

## Dist Identity Procedure

The sampling thread must prove two different facts: target dist bytes and Tampermonkey installed script bytes.

1. From the repository root, before changing anything:

```bash
mkdir -p output/v0312-local-learning-reality/dist
git status --short --branch
git rev-parse HEAD
shasum -a 256 dist/bilibili-qol-core.user.js | tee output/v0312-local-learning-reality/dist/dist-sha256.txt
wc -c dist/bilibili-qol-core.user.js | tee output/v0312-local-learning-reality/dist/dist-size.txt
sed -n '1,30p' dist/bilibili-qol-core.user.js > output/v0312-local-learning-reality/dist/dist-head.txt
```

2. Serve the current repository dist from loopback and record the command/port in `environment.json`.

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

3. In the same Safari profile used for sampling, open:

```text
http://127.0.0.1:8765/dist/bilibili-qol-core.user.js
```

Use Tampermonkey to install/update `Bilibili QoL Core`. Screenshot the update page as `dist/tampermonkey-update.png`.

4. Open Tampermonkey Dashboard -> `Bilibili QoL Core` -> editor. Export or copy the full installed script text to `dist/installed-userscript.txt`.

5. Hash and compare:

```bash
shasum -a 256 output/v0312-local-learning-reality/dist/installed-userscript.txt \
  | tee output/v0312-local-learning-reality/dist/installed-userscript-sha256.txt
awk '{print $1}' output/v0312-local-learning-reality/dist/dist-sha256.txt \
  > output/v0312-local-learning-reality/dist/dist-sha256.hex
awk '{print $1}' output/v0312-local-learning-reality/dist/installed-userscript-sha256.txt \
  > output/v0312-local-learning-reality/dist/installed-userscript-sha256.hex
if cmp -s \
  output/v0312-local-learning-reality/dist/dist-sha256.hex \
  output/v0312-local-learning-reality/dist/installed-userscript-sha256.hex; then
  echo "installedEqualsDist=true" \
    | tee output/v0312-local-learning-reality/dist/installed-hash-compare.txt
else
  echo "installedEqualsDist=false" \
    | tee output/v0312-local-learning-reality/dist/installed-hash-compare.txt
fi
```

If the installed script cannot be copied/exported and hashed, stop and mark `BLOCK: target dist not proven`.

6. On a supported Bilibili video page in the same Safari main window, open QoL Core console -> `帮助 / 反馈` -> copy diagnostic report to `login/diagnostic.txt` and screenshot it as `login/diagnostic.png`.

The target dist proof requires steps 1-5 plus page runtime evidence from step 6. A version string alone is not enough.

## Safari Main-Window Login Proof

Login proof must come from the real Safari main window that will run the sample pages.

1. Open any `https://www.bilibili.com/` page in the sampling window.
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
      page: location.origin + location.pathname,
      userAgentFamily: navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome") ? "Safari" : "other",
      webdriver: Boolean(navigator.webdriver)
    }, null, 2));
  });
```

3. Save only the sanitized JSON output to `login/safari-main-window-login-proof.json`.
4. Screenshot the visible account/avatar area as `login/safari-account-ui.png`, redacting nickname, avatar details, and any notifications if needed.

Passing criterion:

- `code === 0`
- `isLogin === true`
- `midPresent === true` or `unamePresent === true`
- `userAgentFamily === "Safari"`
- `webdriver === false`

If this cannot be proven, stop. The evidence pass cannot proceed.

## Runtime Page State Snippet

Use this snippet in Safari Web Inspector on every sampled page. It only records QoL UI state and labels, not comment text.

```javascript
(() => {
  const allDeep = (selector, root = document) => {
    const found = [];
    const visit = (node) => {
      if (!node) return;
      if (node.querySelectorAll) {
        found.push(...node.querySelectorAll(selector));
        for (const child of node.querySelectorAll("*")) {
          if (child.shadowRoot) visit(child.shadowRoot);
        }
      }
    };
    visit(root);
    return found;
  };
  const textList = (selector) =>
    allDeep(selector)
      .map((node) => (node.textContent || "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, 20);
  const bvid = location.pathname.match(/BV[a-zA-Z0-9]+/)?.[0] ?? null;
  console.log(JSON.stringify({
    capturedAt: new Date().toISOString(),
    page: location.origin + location.pathname,
    bvid,
    hasQolPanel: Boolean(document.querySelector(".bsb-tm-panel, .bsb-tm-console, [data-bsb-local-learning-manager='true']")),
    titlePillLabels: textList(".bsb-tm-title-pill-label"),
    commentBadgeTexts: textList("[data-bsb-comment-badge='true']"),
    commentBadgeCount: allDeep("[data-bsb-comment-badge='true']").length,
    feedbackMenuCount: allDeep("[data-bsb-comment-feedback-menu='true']").length,
    feedbackSubmittedCount: allDeep("[data-bsb-comment-feedback-menu='true']")
      .filter((node) => node.dataset && node.dataset.submitted === "true").length,
    localLearningManagerPresent: Boolean(document.querySelector("[data-bsb-local-learning-manager='true']")),
    sampleDeleteButtonPresent: bvid
      ? Boolean(document.querySelector(`[data-bsb-local-label-delete='${CSS.escape(bvid)}']`))
      : false
  }, null, 2));
})();
```

For the trigger phase, pair this JSON with a redacted screenshot showing only the QoL badge/feedback button area. Do not preserve comment body text.

## Storage Snapshot And Restore Protocol

The two keys in scope are:

- `bsb_tm_local_video_labels_v1`
- `bsb_tm_comment_feedback_v1`

Current code stores local video labels as a BVID keyed object and comment feedback locks as `BVID:hash` keyed timestamps. The feedback hash is a private implementation detail and must not appear in shareable evidence.

### Private Restore Backup

Before sampling, use Tampermonkey Dashboard -> `Bilibili QoL Core` -> Storage to copy the exact raw values for the two keys into a private local file outside the evidence handoff, for example:

```text
/tmp/bsb-v0312-local-learning-private/original-storage.json
```

Suggested shape:

```json
{
  "values": {
    "bsb_tm_local_video_labels_v1": {},
    "bsb_tm_comment_feedback_v1": {}
  },
  "sampleBvids": ["BV_SAMPLE_PLACEHOLDER"]
}
```

Rules:

- This private file may contain video IDs and feedback hash keys. It must not be copied into `docs/`, committed, or handed to the audit thread unless the user explicitly approves.
- Public evidence must contain only summaries and digests.
- If the operator refuses any private raw backup, the run may continue only if it avoids destructive storage changes; final restore proof must be downgraded to `Partial`.

### Public Summary Fields

`storage/*-summary.json` should include:

```json
{
  "capturedAt": "ISO-8601",
  "source": "tampermonkey-storage-export",
  "keys": {
    "bsb_tm_local_video_labels_v1": {
      "exists": true,
      "rawSha256": "hex",
      "recordCount": 0,
      "maxRecords": 400,
      "latestUpdatedAt": null,
      "categoryCounts": {},
      "sourceCounts": {},
      "manualDismissCount": 0,
      "sampleStates": [
        {
          "bvid": "BV...",
          "present": false,
          "category": null,
          "source": null,
          "confidenceBucket": null,
          "updatedAtPresent": false,
          "reasonClass": null
        }
      ]
    },
    "bsb_tm_comment_feedback_v1": {
      "exists": true,
      "rawSha256": "hex",
      "count": 0,
      "maxRecords": 1000,
      "latestUpdatedAt": null,
      "sampleBvidLockCounts": {
        "BV...": 0
      }
    }
  },
  "redaction": {
    "commentTextIncluded": false,
    "commentHashIncluded": false,
    "userIdentifiersIncluded": false
  }
}
```

For `confidenceBucket`, use coarse buckets: `0.70-0.79`, `0.80-0.89`, `0.90-1.00`. Do not expose full existing records outside the known sample BVIDs.

For `reasonClass`, use one of:

- `comment-goods`
- `comment-suspicion`
- `page-heuristic`
- `manual`
- `manual-dismiss`
- `unknown`
- `not-present`

Do not copy raw `reason` text for existing user records. For sample records, generic reason classes are enough.

### Summary Generator

After copying raw storage values to the private JSON file, generate a public summary. The script below reads the private file and writes only a redacted summary.

```bash
node - \
  /tmp/bsb-v0312-local-learning-private/original-storage.json \
  output/v0312-local-learning-reality/storage/original-summary.json <<'NODE'
const fs = require("fs");
const crypto = require("crypto");
const [inputPath, outputPath] = process.argv.slice(2);
const LOCAL = "bsb_tm_local_video_labels_v1";
const FEEDBACK = "bsb_tm_comment_feedback_v1";

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha(value) {
  return crypto.createHash("sha256").update(canonical(value)).digest("hex");
}

function asObject(value) {
  if (!value) return {};
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch (_error) { return {}; }
  }
  return typeof value === "object" ? value : {};
}

function bucket(confidence) {
  const value = Number(confidence);
  if (!Number.isFinite(value)) return null;
  if (value >= 0.9) return "0.90-1.00";
  if (value >= 0.8) return "0.80-0.89";
  if (value >= 0.7) return "0.70-0.79";
  return "below-0.70";
}

function reasonClass(record) {
  if (!record) return "not-present";
  if (record.source === "comment-goods") return "comment-goods";
  if (record.source === "comment-suspicion") return "comment-suspicion";
  if (record.source === "page-heuristic") return "page-heuristic";
  if (record.source === "manual") return "manual";
  if (record.source === "manual-dismiss") return "manual-dismiss";
  return "unknown";
}

const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const values = input.values || {};
const sampleBvids = input.sampleBvids || [];
const local = asObject(values[LOCAL]);
const feedback = asObject(values[FEEDBACK]);
const localEntries = Object.entries(local).filter(([bvid, record]) => /^BV/.test(bvid) && record && typeof record === "object");
const feedbackEntries = Object.entries(feedback).filter(([key, value]) => /^BV/.test(key) && Number.isFinite(Number(value)));
const categoryCounts = {};
const sourceCounts = {};
let latestLocal = null;
let manualDismissCount = 0;
for (const [, record] of localEntries) {
  if (record.category !== undefined && record.category !== null) categoryCounts[record.category] = (categoryCounts[record.category] || 0) + 1;
  if (record.source) sourceCounts[record.source] = (sourceCounts[record.source] || 0) + 1;
  if (record.source === "manual-dismiss") manualDismissCount += 1;
  if (Number.isFinite(Number(record.updatedAt))) latestLocal = Math.max(latestLocal || 0, Number(record.updatedAt));
}
const sampleBvidLockCounts = Object.fromEntries(sampleBvids.map((bvid) => [
  bvid,
  feedbackEntries.filter(([key]) => key.startsWith(`${bvid}:`)).length
]));
const latestFeedback = feedbackEntries.reduce((max, [, value]) => Math.max(max, Number(value)), 0) || null;
const summary = {
  capturedAt: new Date().toISOString(),
  source: "tampermonkey-storage-export",
  keys: {
    [LOCAL]: {
      exists: Object.prototype.hasOwnProperty.call(values, LOCAL),
      rawSha256: sha(local),
      recordCount: localEntries.length,
      maxRecords: 400,
      latestUpdatedAt: latestLocal,
      categoryCounts,
      sourceCounts,
      manualDismissCount,
      sampleStates: sampleBvids.map((bvid) => {
        const record = local[bvid] || null;
        return {
          bvid,
          present: Boolean(record),
          category: record?.category ?? null,
          source: record?.source ?? null,
          confidenceBucket: bucket(record?.confidence),
          updatedAtPresent: Number.isFinite(Number(record?.updatedAt)),
          reasonClass: reasonClass(record)
        };
      })
    },
    [FEEDBACK]: {
      exists: Object.prototype.hasOwnProperty.call(values, FEEDBACK),
      rawSha256: sha(feedback),
      count: feedbackEntries.length,
      maxRecords: 1000,
      latestUpdatedAt: latestFeedback,
      sampleBvidLockCounts
    }
  },
  redaction: {
    commentTextIncluded: false,
    commentHashIncluded: false,
    userIdentifiersIncluded: false
  }
};
fs.mkdirSync(require("path").dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
NODE
```

Repeat the same command for `before-sampling`, `after-write`, `after-delete`, and `restored` snapshots by changing input/output paths.

### Restore Procedure

1. After sampling, use the private original backup to restore the exact two key values in Tampermonkey Storage.
2. Reload the sampled Bilibili page.
3. Export the two raw values again into a private restore file, for example:

```text
/tmp/bsb-v0312-local-learning-private/restored-storage.json
```

4. Generate `storage/restored-summary.json`.
5. Compare original and restored summaries:

```bash
node - \
  output/v0312-local-learning-reality/storage/original-summary.json \
  output/v0312-local-learning-reality/storage/restored-summary.json \
  output/v0312-local-learning-reality/storage/restore-compare.json <<'NODE'
const fs = require("fs");
const [beforePath, afterPath, outputPath] = process.argv.slice(2);
const before = JSON.parse(fs.readFileSync(beforePath, "utf8"));
const after = JSON.parse(fs.readFileSync(afterPath, "utf8"));
const LOCAL = "bsb_tm_local_video_labels_v1";
const FEEDBACK = "bsb_tm_comment_feedback_v1";
const compare = {
  comparedAt: new Date().toISOString(),
  localRawDigestEqual: before.keys[LOCAL].rawSha256 === after.keys[LOCAL].rawSha256,
  commentFeedbackRawDigestEqual: before.keys[FEEDBACK].rawSha256 === after.keys[FEEDBACK].rawSha256,
  localRecordCountEqual: before.keys[LOCAL].recordCount === after.keys[LOCAL].recordCount,
  commentFeedbackCountEqual: before.keys[FEEDBACK].count === after.keys[FEEDBACK].count,
  sampleStatesRestored: after.keys[LOCAL].sampleStates.every((state, index) =>
    JSON.stringify(state) === JSON.stringify(before.keys[LOCAL].sampleStates[index])
  ),
  redactionStillClean: Boolean(
    after.redaction &&
    after.redaction.commentTextIncluded === false &&
    after.redaction.commentHashIncluded === false &&
    after.redaction.userIdentifiersIncluded === false
  )
};
fs.writeFileSync(outputPath, `${JSON.stringify(compare, null, 2)}\n`);
NODE
```

Passing restore criterion:

- `localRawDigestEqual === true`
- `commentFeedbackRawDigestEqual === true`
- `sampleStatesRestored === true`
- `redactionStillClean === true`

If raw digest equality cannot be proven, but sample BVIDs are absent and counts match, classify restore as `Partial`. If restore changes existing user records or feedback locks, stop and mark the run `BLOCK: storage restore not proven`.

## Sample Classification Table Fields

`sample-classification.csv` and `sample-classification.md` must use these fields:

| Field | Meaning |
| --- | --- |
| `sample_id` | Stable row id, for example `goods-card-01` |
| `sample_type` | `goods-card-strong`, `cta-strong`, `ordinary-negative`, `reply-layer`, `dynamic-adjacent` |
| `page_url_sanitized` | `origin + pathname`; query only if needed and sanitized |
| `bvid` | Sample BVID from the URL |
| `comment_layer` | `main-comment`, `reply`, `page-text`, `mixed`, `none` |
| `expected_trigger_path` | `automatic-main-comment`, `initial-comment-scan`, `reply-feedback-keep`, `page-heuristic`, `none` |
| `observed_trigger_path` | Actual path proven by evidence |
| `expected_category` | `sponsor`, `selfpromo`, `exclusive_access`, or `none` |
| `observed_category` | Category in storage summary or `none` |
| `observed_source` | `comment-goods`, `comment-suspicion`, `page-heuristic`, `manual`, `manual-dismiss`, or `none` |
| `before_storage_file` | Relative path under `output/v0312-local-learning-reality/` |
| `trigger_evidence_files` | Redacted screenshot, page-state JSON, diagnostic file paths |
| `after_storage_file` | Storage summary after trigger |
| `panel_evidence_files` | Help panel screenshot/page-state evidence |
| `delete_refresh_files` | Delete and refresh evidence paths |
| `restore_files` | Restore summary and compare files |
| `comment_text_captured` | Must be `false` |
| `comment_hash_captured` | Must be `false` |
| `user_sensitive_captured` | Must be `false` |
| `negative_guard_result` | `pass`, `fail`, or `not-applicable` |
| `classification` | `Verified`, `Partial`, `Not Verified`, `False Positive Risk` |
| `classification_reason` | Short reason tied to evidence paths |
| `allowed_release_claim` | Conservative wording allowed, or `none` |
| `review_notes` | Caveats and unresolved questions |

Do not merge `sample_type` and `classification`. A `goods-card-strong` sample can still be `Not Verified` if it lacks storage evidence; an `ordinary-negative` sample can become `False Positive Risk` if it is persisted.

## Sampling Matrix

Before capture, write exact URLs to `sample-url-manifest.json`. URLs may drift over time, so the manifest is the authority for a specific run.

| Sample ID | Required shape | Primary purpose | Minimum success |
| --- | --- | --- | --- |
| `goods-card-01` | Video page with a main comment containing structural goods card/link evidence | Prove strong goods-card path writes `comment-goods` local video label | Storage sample state present, category `sponsor`, source `comment-goods`, panel shows sample BVID, delete/restore proven |
| `cta-strong-01` | Video page with a main comment or page text containing explicit CTA, for example link/blue-link/coupon/purchase closure | Prove strong导流/商业闭环 path writes `comment-suspicion` or `page-heuristic` | Storage sample state present with expected category/source and no raw comment text captured |
| `negative-ordinary-01` | Video page with ordinary review/discussion comments and no goods card, coupon, purchase link, owned-action lead, or strong closure | Prove ordinary comments do not persist local commercial labels | No new sample state, no title pill commercial label, no comment badge tied to ordinary text |
| `reply-layer-01` | Video page with a reply, not top-level main comment, containing goods card or strong CTA evidence | Prove reply-layer UI and, if user clicks keep, feedback-to-local-label path | Badge/feedback visible on reply; storage write is `reply-feedback-keep` or initial reply scan, not assumed |
| `dynamic-adjacent-01` | Dynamic page or dynamic item with commercial text | Adjacent capability reference only | Must not enter main Local Learning closure classification |

Minimum sample count:

- At least one `goods-card-strong`.
- At least one `cta-strong`.
- At least one `ordinary-negative`.
- At least one `reply-layer`.

If the first three real positive candidates fail because comments did not load, login/API failed, or samples drifted, mark those rows `Not Verified` and ask the main thread for new URLs instead of weakening the standard.

## Manual Safari Runbook

### 1. Prepare Evidence Root

```bash
mkdir -p \
  output/v0312-local-learning-reality/{dist,login,storage,pages} \
  /tmp/bsb-v0312-local-learning-private
chmod 700 /tmp/bsb-v0312-local-learning-private
```

Record `environment.json` with:

- repository path
- current branch and HEAD
- macOS/Safari/Tampermonkey versions if available
- dist SHA-256
- installed script SHA-256
- sample operator notes

### 2. Prove Dist, Runtime, And Login

Complete `Dist Identity Procedure` and `Safari Main-Window Login Proof`.

Then, on the first sampled video page:

1. Open QoL Core console.
2. Open `帮助 / 反馈`.
3. Save diagnostic report.
4. Run `Runtime Page State Snippet`.

This proves target dist identity plus runtime execution in the logged-in Safari main window.

### 3. Snapshot Before Sampling

1. Export the two Tampermonkey storage keys into the private original backup.
2. Generate `storage/original-summary.json`.
3. Copy it also as `storage/before-sampling-summary.json` unless the run changes setup state before sampling.
4. Open QoL Core console -> `帮助 / 反馈` and screenshot the local learning card as the relevant sample `before/panel-before-redacted.png`.

The before proof must show:

- sample BVID not present unless it already existed before sampling
- comment feedback count before sampling
- no comment text/hash in evidence

If the sample BVID already exists before sampling, either restore/delete it before sampling with user approval, or mark that sample `Not Verified` for write-before/write-after causality.

### 4. Trigger Positive Sample

For `goods-card-01` or `cta-strong-01`:

1. Open the exact URL from `sample-url-manifest.json`.
2. Reload once after Web Inspector is open.
3. Wait for video context and comments to load.
4. Do not copy comment text.
5. Capture redacted screenshot showing QoL badge/feedback UI only.
6. Run `Runtime Page State Snippet` and save `trigger/page-state.json`.
7. Open QoL Core diagnostic report and save it.
8. Export storage and generate `after-write-summary.json`.

Expected direct write evidence:

- `bsb_tm_local_video_labels_v1.sampleStates[]` for the sample BVID changes from `present=false` to `present=true`, unless it existed before sampling.
- `observed_source` is `comment-goods`, `comment-suspicion`, or `page-heuristic`.
- `observed_category` matches the sample expectation.
- The title pill or panel reflects the same local label.

For a top-level main comment, runtime dispatch can write after the comment controller processes the comment. For initial page load, `scanCurrentPageCommentSignal()` can also write during local title resolution if comments are already present. Record which path is actually observed; do not infer it from source code alone.

### 5. Trigger Reply-Layer Sample

Reply-layer behavior has two valid evidence lanes:

| Lane | Meaning | Classification impact |
| --- | --- | --- |
| `initial-comment-scan-reply` | Storage writes after initial local title scan sees a reply match | Can be `Verified` if before/after storage, panel, delete, and restore are proven |
| `reply-feedback-keep` | Reply badge/menu appears, operator clicks `反馈 -> 保留`, storage then writes | Can be `Verified` for feedback-driven reply closure, but not for automatic runtime reply dispatch |

Procedure:

1. Open the reply-layer sample page.
2. Expand replies if Bilibili collapses them.
3. Capture only the reply badge/feedback controls, redacting reply text and user info.
4. Run `Runtime Page State Snippet`.
5. Export storage before any click.
6. If no local label appears yet, click `反馈`, then `保留` on the reply feedback menu.
7. Export storage again and generate `after-write-summary.json`.

Important interpretation:

- A reply badge alone proves reply-layer UI recognition, not local video persistence.
- A `保留` click proves user-confirmed feedback path.
- If the sample writes automatically before the click, record it as `initial-comment-scan-reply`.
- If neither badge nor storage appears, classify `Not Verified`.

### 6. Negative Sample

For `negative-ordinary-01`:

1. Open the exact URL.
2. Confirm the page is a normal video/comment context and comments load.
3. Capture a redacted page-state JSON and screenshot that show no QoL commercial badge or title pill. Do not show comment bodies.
4. Export storage and generate `after-write-summary.json`.

Passing negative evidence:

- sample BVID remains absent from `bsb_tm_local_video_labels_v1`, unless it was already present before sampling.
- no title pill label for local commercial category appears.
- no commercial comment badge appears on ordinary comments.
- comment feedback count does not increase without operator action.

If an ordinary negative sample is persisted as `comment-goods`, `comment-suspicion`, or `page-heuristic`, stop and mark `False Positive Risk`.

### 7. Panel Display

After a positive write:

1. Open QoL Core console -> `帮助 / 反馈`.
2. Save `panel/page-state.json`.
3. Screenshot the local learning card as `panel/local-learning-card-redacted.png`.

Panel proof must show:

- `本地学习记录` card exists.
- sample BVID appears in `本地视频标签`.
- category/source/confidence summary is visible.
- `评论反馈锁` displays count/latest summary only.
- text says or evidence shows comment original/hash details are not displayed.
- delete button for the sample BVID is present.

### 8. Delete And Refresh Closure

Do not treat deletion as a permanent suppression mechanism. The panel text explicitly warns that deleting a local record does not prevent future automatic inference. If the same triggering page is reloaded and the same signal still exists, the record may be recreated. Permanent suppression is the manual ignore path, not plain delete.

Delete proof:

1. In the local learning card, click `删除` for the sample BVID.
2. Capture button state `删除中` when possible.
3. Wait for the card to refresh.
4. Export storage and generate `after-delete-summary.json`.
5. Save a panel screenshot showing the sample BVID removed or the empty state.

Refresh proof:

- Preferred: navigate to a neutral Bilibili page or keep the Help panel open and refresh the local learning card state. The sample BVID should remain absent in `after-delete-summary.json`.
- If reloading the same positive sample page recreates the record, mark `refreshOutcome=retriggered-as-expected`, not delete failure, and immediately restore from the private backup.

Delete closure is `Verified` only when storage and panel both show the deleted sample BVID absent after the delete operation. Same-page re-trigger should be recorded separately.

### 9. Restore Original Storage

After all samples:

1. Restore exact original raw values for `bsb_tm_local_video_labels_v1` and `bsb_tm_comment_feedback_v1` from the private backup.
2. Reload the Bilibili page.
3. Export restored raw values to the private restore file.
4. Generate `storage/restored-summary.json`.
5. Generate `storage/restore-compare.json`.

The run can proceed to audit only if restore is `Verified` or explicitly downgraded with a clear caveat. If restore fails, do not continue sampling; hand the issue to the main thread.

## Classification Rules By Sample Type

### 商品卡 / 导流强信号

Classify as `goods-card-strong` when the evidence is structural goods evidence:

- Bilibili rich text link has goods/product/commodity/item data type.
- E-commerce host or visible price anchor is present.
- QoL badge text is `评论区商品广告`.
- Expected storage source is `comment-goods`.
- Expected category is `sponsor`.

Classify as `cta-strong` when the evidence is explicit commercial/action closure:

- comment/page text points to purchase link, blue link, coupon, product card, pinned comment, shop, owned channel, collection, official site, invitation code, or similar closure.
- QoL badge text is a generic suspicious ad/selfpromo/exclusive-access label.
- Expected storage source is `comment-suspicion` or `page-heuristic`.
- Expected category is `sponsor`, `selfpromo`, or `exclusive_access` depending on the observed local label.

Do not keep raw text to justify this. Use badge label, source/category in storage summary, and operator notes with short abstract labels such as `coupon-cta`, `pinned-link-cta`, `owned-channel-lead`.

### 普通负样本

Classify as `ordinary-negative` only when the sample is ordinary discussion/review/commentary and lacks:

- goods card or e-commerce structural link
- price/purchase/coupon/link closure
- owned-action lead such as shop/channel/homepage/collection guidance
- invitation code, discount code, or strong commercial call to action
- suspicious shill cluster with enough product-use and endorsement detail

Passing result is no local video label write and no commercial badge. If the sample has ambiguous wording, do not use it as a negative sample; mark `Not Verified` and choose a cleaner negative.

### 回复层样本

Classify as `reply-layer` when the matched node is inside `bili-comment-reply-renderer` or equivalent reply DOM.

Record one of:

- `reply_badge_only`: reply badge/menu appears, no local label write.
- `reply_feedback_keep`: operator clicks `反馈 -> 保留`, storage writes sample BVID.
- `initial_comment_scan_reply`: storage writes before click because initial local title scan picked up a reply signal.

Only the latter two can satisfy a write closure. `reply_badge_only` is useful UI evidence but cannot prove Local Learning persistence.

### 动态样本

Dynamic samples are adjacent capability references only. They may help explain content-recognition consistency, but they must not be counted as proof that video-page Local Learning write/manage/delete/refresh closure works.

## Stop Conditions And False Positive Risk

Stop the current sampling run and mark `summary.json.blockingIssues[]` if any of these occur:

- Safari main-window login proof cannot show `isLogin=true`.
- Installed Tampermonkey script hash cannot be matched to target dist hash.
- QoL Core diagnostic report cannot be produced from the Safari main window.
- Original storage summary cannot be captured.
- Restore cannot be proven or sample writes cannot be cleaned up.
- Any shareable evidence contains comment text, comment hash details, uid, cookie, token, or other reversible sensitive identifiers.

Mark the specific sample `False Positive Risk` and stop collecting more positive evidence if any of these occur:

- `ordinary-negative` sample is persisted in `bsb_tm_local_video_labels_v1` with source `comment-goods`, `comment-suspicion`, or `page-heuristic`.
- ordinary negative sample shows a local commercial title pill or panel label after reload.
- ordinary negative comment receives a commercial badge/feedback UI without goods card, strong CTA, shill cluster, or page heuristic basis.
- a disclaimer/anti-ad/warning context such as self-paid review, no purchase link, warning against buying, or mocking/quoting ad copy is persisted as commercial.
- the operator must copy raw comment text to make the classification convincing. That means the sample is not safe enough for this evidence pass.

False Positive Risk handling:

1. Save only redacted evidence.
2. Export storage summary.
3. Restore the two scoped storage keys from the private backup.
4. Write `operator-notes.md` with the abstract reason.
5. Stop and hand the row to the main thread. Do not continue hunting for successful positives to offset the risk.

## Summary JSON Requirements

`summary.json` should include:

```json
{
  "target": "v0.3.12 Local Learning Reality Closure",
  "capturedAt": "ISO-8601",
  "repository": {
    "path": "/Users/dwight/Downloads/Experimental repository_For_Codex/bilibili-sponsorblock-userscript",
    "head": "git sha",
    "branch": "branch name"
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
    "loginProofFile": "login/safari-main-window-login-proof.json",
    "diagnosticFile": "login/diagnostic.txt"
  },
  "storage": {
    "originalSummaryFile": "storage/original-summary.json",
    "restoredSummaryFile": "storage/restored-summary.json",
    "restoreCompareFile": "storage/restore-compare.json",
    "restoreVerified": true
  },
  "samples": [
    {
      "sampleId": "goods-card-01",
      "sampleType": "goods-card-strong",
      "result": "Verified",
      "observedSource": "comment-goods",
      "observedCategory": "sponsor",
      "evidenceFolder": "pages/goods-card-01"
    }
  ],
  "dynamicPolicy": "adjacent-reference-excluded-from-main-local-learning-closure",
  "blockingIssues": [],
  "falsePositiveRisks": [],
  "caveats": []
}
```

## Expected Output For Audit Thread

The Safari capture thread should hand the audit thread:

- `summary.json`
- `sample-url-manifest.json`
- dist hash and installed-script hash evidence
- login proof JSON and runtime diagnostic report
- storage summaries and restore compare
- sample folders with redacted screenshots, page-state JSON, diagnostic reports, and operator notes
- `sample-classification.csv`
- `sample-classification.md`

The audit thread should be able to reproduce every `Verified`, `Partial`, `Not Verified`, and `False Positive Risk` classification from local evidence paths without trusting the sampler's prose summary.
