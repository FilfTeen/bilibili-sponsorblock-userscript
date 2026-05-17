# v0.3.12 Local Learning Evidence Method Repair

本文件是 `V0312 Local Learning Evidence Method Repair` 研究线程交付物。它只修复取证方法，不授权代码改动、重新采样、实现 helper、清空用户数据或进入 release prep。

## Verdict

当前 G2 blocker 是证据方法和样本治理问题，不是已证明的运行时代码缺陷。

强证据可行，但必须满足以下任一取证路径：

1. 推荐路径：使用干净 Safari/Tampermonkey profile 做正样本闭环，当前含 71 条历史记录的 profile 只做只读基线证明。
2. 同 profile 路径：用户明确批准私有 raw export，取 `bsb_tm_local_video_labels_v1` / `bsb_tm_comment_feedback_v1` 的精确原值，公开证据只输出 digest、计数、样本 BVID 状态和非样本投影 digest。
3. 备选路径：如果 Tampermonkey UI 无法稳定导出 scoped raw value，且主线程仍要求同 profile 强恢复证明，需要另开实现线程做极窄 diagnostic/export helper。当前线程不得实现。

若三者都不可用，最终目标只能降级为 `Partial`：可以声明 Safari 目标 dist、登录态、隐私边界和管理 UI 可见性，但不能声明真实正样本写入/删除/恢复闭环已验证。

## Code Facts Used

当前实现事实：

- `bsb_tm_local_video_labels_v1` 是 BVID keyed object。
- 本地视频标签记录包含 `category`、`source`、`confidence`、`updatedAt`、可选 `reason`。
- `manual` 和 `manual-dismiss` 是高优先级本地人工决策；自动信号不得覆盖它们。
- `bsb_tm_comment_feedback_v1` 是 `BVID:hash` keyed timestamp object。
- 评论反馈 hash 是私有实现细节，不得进入公开证据。
- 控制台 Local Learning 卡片会展示视频记录和评论反馈锁摘要，但不能证明 full raw restore。

G2 的关键失败点：

- 现有 profile 面板已有 71 条历史记录。
- 当前公开 summary 只有 redacted panel-derived state，`rawSha256=null`。
- 一个正样本 BVID 已经是 `manual-dismiss`，所以写入因果不可证明。
- 没有正样本完成 before/write/panel/delete/restore 全链路。

## Non-Destructive Before / After / Restore Proof

### Strong same-profile proof

同一个 Safari/Tampermonkey profile 中证明两把 scoped key 的 before/after/restore，需要私有 raw export 或等价 helper 输出。

私有文件只放在本机临时目录，例如：

```text
/tmp/bsb-v0312-local-learning-private/original-storage.json
/tmp/bsb-v0312-local-learning-private/before-sampling-storage.json
/tmp/bsb-v0312-local-learning-private/after-write-storage.json
/tmp/bsb-v0312-local-learning-private/after-delete-storage.json
/tmp/bsb-v0312-local-learning-private/restored-storage.json
```

公开证据只允许写入：

```text
output/v0312-local-learning-reality/storage/original-summary.json
output/v0312-local-learning-reality/storage/before-sampling-summary.json
output/v0312-local-learning-reality/storage/after-write-summary.json
output/v0312-local-learning-reality/storage/after-delete-summary.json
output/v0312-local-learning-reality/storage/restored-summary.json
output/v0312-local-learning-reality/storage/restore-compare.json
```

每个 public summary 必须包含：

- `rawSha256`：对完整 scoped raw object 的 canonical SHA-256。
- `recordCount` / `count`：总记录数。
- `sampleStates[]`：只列 manifest 中的样本 BVID。
- `sampleBvidLockCounts`：只列样本 BVID 的 feedback lock 数量。
- `nonSampleSha256`：移除所有样本 BVID 及 `${sampleBvid}:*` feedback lock 后，对剩余对象做 canonical SHA-256。
- `redaction.existingNonSampleBvidsIncluded=false`。

判定标准：

| Step | `bsb_tm_local_video_labels_v1` | `bsb_tm_comment_feedback_v1` | Required result |
| --- | --- | --- | --- |
| before | 正样本 `present=false` | 正样本 lock count 为 0 | 样本干净，非样本只以 count/digest 出现 |
| after-write | 自动写入样本 BVID，source/category 符合样本目标 | 若是 feedback path，样本 lock count 增加 | `nonSampleSha256` 与 before 相等 |
| after-delete | local 样本 BVID 不存在 | feedback lock 可仍存在，按实际路径记录 | local 的 `nonSampleSha256` 与 before 相等 |
| restored | 两把 key 的 `rawSha256` 等于 original | 两把 key 的 `rawSha256` 等于 original | restore `Verified` |

注意：面板“删除”只证明 local label 可删除，不保证删除 `bsb_tm_comment_feedback_v1` 的 feedback lock。feedback lock 的恢复必须靠最终 raw restore 证明。

### Why panel evidence alone is insufficient

面板证据可以证明：

- Local Learning 卡片存在。
- 样本 BVID 是否出现在可管理列表。
- 删除按钮是否可用。
- 评论反馈锁只显示 count/latest，不展示评论原文或 hash。

面板证据不能证明：

- 71 条非样本记录没有变化。
- 两把 scoped key 完整恢复到采样前。
- sample BVID 以外没有被写入、裁剪或覆盖。

因此，只有 panel-derived summary 时，restore 最高只能是 `Partial`。

## Proving Sample BVID Changes With 71 Existing Records

已有 71 条历史记录时，不能截图或导出完整列表。证明方式必须是“样本可见，非样本不可见”：

1. 私有 raw export 中读取完整对象，但不进入仓库、不进入 docs、不进入公开 evidence handoff。
2. 公开 summary 只保留：
   - 总数。
   - 全量 raw digest。
   - 非样本投影 digest。
   - 每个 sample BVID 的状态。
3. 写入证明：
   - before：`sampleStates[].present=false`，feedback lock count 为 0。
   - after-write：同一 sample BVID 变为 `present=true`，source/category/confidence bucket 符合预期。
   - local record count 对新写入应增加 1；若没有增加，必须解释为替换已有样本记录，否则不算 clean write。
   - `nonSampleSha256` 必须不变，证明非样本投影未变化。
4. 删除证明：
   - after-delete：local sample BVID `present=false`。
   - local record count 回到 before。
   - local `nonSampleSha256` 不变。
   - 若 same-page reload 重新触发写入，应标记 `retriggered-as-expected`，不是删除失败，但不能用它作为 clean delete closure。
5. 恢复证明：
   - restored 的两把 key `rawSha256` 必须等于 original。
   - sample states 必须等于 original。
   - feedback lock count 必须等于 original。

如果某个 sample BVID before 已存在，尤其是 `manual` 或 `manual-dismiss`，该样本不能证明正向写入因果。不得删除用户既有记录来制造干净样本。

## Clean Positive Sample Pre-Screen

正样本预筛必须避免“打开页面即触发写入”的污染。推荐流程：

1. Scout 阶段使用禁用 userscript 的 Safari profile、无 Tampermonkey 的浏览器，或 Tampermonkey 暂停状态，只确认候选页面形态。
2. Scout evidence 只记录脱敏形态：
   - `goods-card-structural`
   - `purchase-link-cta`
   - `coupon-cta`
   - `owned-channel-lead`
   - `reply-layer-visible`
   - `ordinary-discussion`
3. 禁止复制评论原文。若必须靠原文才能说服审计，样本不够干净，应弃用。
4. 在启用目标 dist 前，先用私有 raw export 或等价 helper 检查 manifest BVID：
   - local key 中不存在该 BVID。
   - feedback key 中没有 `${bvid}:*`。
   - panel 不显示该 BVID。
   - 没有 `manual` / `manual-dismiss` 历史状态。
5. 只有 `storageClean=true` 且 `contentShapeClean=true` 的候选才能进入正样本 capture。
6. 每个正样本 capture 只能在 before snapshot 之后首次用目标 dist 打开该 URL。

样本 reject 规则：

| Condition | Action |
| --- | --- |
| before 已有 `manual-dismiss` | Reject for positive causality |
| before 已有 `manual` | Reject for positive causality |
| before 已有 automatic local label | Reject unless the target is replacement behavior, not clean write |
| before 已有 sample feedback lock | Reject for feedback path causality |
| 评论/回复未加载 | `Not Verified`，不要降低标准 |
| 需要评论原文解释 | Reject for privacy |
| 普通负样本出现商业 badge 或 local write | Stop as `False Positive Risk` |

## Clean Profile vs Private Raw Export vs Helper

### Clean Safari/Tampermonkey profile

推荐用于下一次正样本闭环。

优点：

- 避免污染 71 条真实历史记录。
- 消除 pre-existing `manual-dismiss` 对因果的污染。
- before state 可预期为空，正样本写入/删除更容易审计。

限制：

- 它证明的是隔离 profile 下的功能闭环。
- 它不能单独证明当前真实 profile 的 71 条记录被恢复，因为真实 profile 根本不参与正样本写入。

建议 wording：`Verified in isolated Safari/Tampermonkey profile; existing user profile left untouched except read-only baseline.`

### User-approved private raw export

若主线程要求在当前含 71 条记录的 profile 中完成强恢复证明，则需要用户批准私有 raw export。

优点：

- 可证明真实 profile 的 scoped key 完整 before/after/restore。
- 不需要运行时代码改动。
- 非样本 BVID 不进入公开证据。

要求：

- 用户明确批准导出两把 scoped key 的 raw value 到私有本地路径。
- 私有 raw 不提交、不写 docs、不发给 release evidence，除非用户另行批准。
- 公开证据使用 digest、count、sample states、non-sample projection digest。

### Extremely narrow diagnostic/export helper

当前不建议立即实现 helper。只有在以下条件同时成立时才需要：

- Tampermonkey UI 无法稳定导出 scoped raw value，或复制过程不可复核。
- 主线程仍要求同 profile 强恢复证明。
- 用户不愿把 raw value 暴露给任何公开证据，但允许脚本在本地计算不可逆 digest 和样本状态。

为什么采样流程无法解决：

- 采样截图和 panel summary 天然看不到完整 raw object。
- 不暴露非样本 BVID 时，公开证据无法独立排除“非样本被改动”。
- 没有 raw digest 或同等脚本内 digest，就无法证明 restore 是 exact restore。

helper 必须另开实现线程授权后才可做。范围应极窄：

- 只读取 `bsb_tm_local_video_labels_v1` / `bsb_tm_comment_feedback_v1`。
- 只输出 canonical digest、record count、sample state、sample lock count、non-sample digest。
- 不输出非样本 BVID、评论 hash、评论原文、uid、cookie、token。
- 默认隐藏在 diagnostics/debug export，不进入普通用户 UI。

## Recommended Next Capture Plan

下一轮 capture 仍需等待主线程授权。若授权，推荐使用两段式：

1. Current profile baseline, read-only:
   - 证明目标 dist、Safari 登录态。
   - 导出或截图 redacted summary：存在 71 条历史记录，非样本 BVID 不暴露。
   - 不打开正样本，不删除，不清空。
2. Clean profile positive closure:
   - 安装同一 dist，证明 installed hash 等于 target hash。
   - 使用 scout 过的干净 positive/negative URLs。
   - before raw summary 为空或只含样本允许状态。
   - 执行 positive write、panel display、delete、restore。
   - 执行 ordinary negative guard。

如果主线程坚持同 profile 证明，则必须先拿到用户批准的私有 raw export；否则不要重采。

## Evidence Classification Updates

建议补充以下字段到下一轮 `sample-classification.*`：

| Field | Meaning |
| --- | --- |
| `profile_scope` | `current-profile-readonly` / `clean-profile-closure` / `current-profile-closure` |
| `storage_clean_before` | sample BVID before 是否不存在于 local 与 feedback scoped keys |
| `preexisting_source` | `none` / `manual` / `manual-dismiss` / `automatic` |
| `sample_feedback_locks_before` | before 中 `${bvid}:*` lock 数量 |
| `non_sample_digest_equal_after_write` | after-write 是否只影响样本投影 |
| `non_sample_digest_equal_after_delete` | after-delete 是否只影响样本投影 |
| `raw_restore_equal` | restored raw digest 是否等于 original |
| `positive_causality_grade` | `clean` / `polluted` / `not-proven` |

强 `Verified` positive sample 必须满足：

- `storage_clean_before=true`
- `preexisting_source=none`
- `sample_feedback_locks_before=0`
- after-write 样本状态从 absent 到 present
- `non_sample_digest_equal_after_write=true`
- panel 只展示样本所需信息或截图已裁切
- after-delete local 样本 absent
- `raw_restore_equal=true`

## Release Wording If Strong Evidence Is Not Available

若没有 raw/equivalent restore proof：

- 允许：`Safari 采样确认目标 dist、登录态和隐私保护流程；Local Learning 管理 UI 可读取并脱敏展示本地记录摘要。`
- 禁止：`已验证真实评论会稳定写入本地学习并可完整恢复。`
- 状态：`Partial evidence only; positive closure not proven.`

若只有 clean profile positive closure：

- 允许：`在隔离 Safari/Tampermonkey profile 中验证了 Local Learning 正样本写入、面板展示、删除和恢复闭环；真实历史 profile 未用于破坏性采样。`
- 禁止：`已在用户现有 71 条历史记录 profile 中验证 exact restore。`
- 状态：`Verified in isolated profile; current-profile restore not exercised.`

若 current profile private raw export 完成并通过：

- 允许：`在用户批准的私有 raw digest 流程下，验证了 scoped local learning storage 的 before/after/restore，公开证据未暴露非样本 BVID 或评论 hash。`
- 仍需保守：`本地学习为启发式辅助判断，不代表事实广告判决。`

## Main Thread Recommendation

不要让 Safari 采样线程直接重采。先由主线程选择证据路径：

1. `clean-profile-closure`：推荐，风险最低。
2. `current-profile-private-raw`：证据最强，但需要用户明确批准私有 raw export。
3. `diagnostic-helper`：仅当 1/2 都不能满足主线程证据目标时，另开极窄实现线程。
4. `docs-only-downgrade`：如果用户不批准 private raw，也不接受 clean profile，则降级目标和 release wording。

在主线程选定路径前，审计线程继续 blocked，Safari 采样线程继续 standby，实现线程继续 not authorized。
