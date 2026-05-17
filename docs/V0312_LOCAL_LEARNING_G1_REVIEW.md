# v0.3.12 Local Learning Sampling Plan G1 Review

本文件是主线程对 `V0312 Local Learning Sampling Design` 研究线程交付物的 G1 审核记录。它不是采样结果，不授权代码改动，也不授权识别规则扩展。

## Verdict

G1：`PASS WITH CAVEAT`

主线程允许进入 Safari 主窗口采样阶段。`docs/V0312_LOCAL_LEARNING_SAMPLING_PLAN.md` 已覆盖目标 dist 身份、Safari 登录态、本地学习存储脱敏摘要、私有恢复备份、样本分类表、负样本保护、回复层解释、动态样本排除和 `False Positive Risk` 停止条件。

## Accepted Plan

采样方案：

- `docs/V0312_LOCAL_LEARNING_SAMPLING_PLAN.md`

目标原始证据目录：

- `output/v0312-local-learning-reality/`

计划要求 Safari 采样线程证明：

- 已登录 Safari 主窗口。
- Tampermonkey installed script hash 等于目标 `dist/bilibili-qol-core.user.js` hash。
- 写入前、触发中、写入后、面板展示、删除/刷新和最终恢复都有证据。
- `bsb_tm_local_video_labels_v1` 与 `bsb_tm_comment_feedback_v1` 只以脱敏摘要和 digest 进入 shareable evidence。
- 私有 raw backup 只保存在 `/tmp/bsb-v0312-local-learning-private/`，不得进入 docs 或交付证据包。
- 评论原文、评论哈希明细、用户 ID、cookie、token 和可逆敏感标识不得进入 shareable evidence。

## G1 Caveats

### C1 - URL sample quality controls the run

Safari 采样线程必须先写 `sample-url-manifest.json`。如果真实候选样本漂移、评论不加载、负样本不够干净，线程不得降低标准或复制评论原文来证明分类；应将样本标记为 `Not Verified`，或回到主线程请求新 URL。

### C2 - Restore proof is release-critical

如果原始/恢复 storage digest 不一致，或无法证明 sample BVIDs 被清理，采样不得进入 G2。若用户拒绝私有 raw backup，只能采集非破坏性证据，最终 restore 等级必须降为 `Partial`。

### C3 - Negative sample is a blocker, not an inconvenience

普通负样本若被持久化为 `comment-goods`、`comment-suspicion` 或 `page-heuristic`，必须停止正样本采集并进入 `False Positive Risk`。不得继续寻找正样本来抵消该风险。

### C4 - Reply-layer evidence must not be overread

回复层 badge 只能证明 UI 识别，不自动证明本地学习持久化。只有 `initial-comment-scan-reply` 或 `reply-feedback-keep` 加上存储、面板、删除/恢复证据，才能支撑闭环结论。

### C5 - Dynamic is adjacent only

动态页证据只能作为相邻能力参考，不进入主视频 Local Learning closure 结论。

## Instructions To Safari Capture Thread

`V0312 Local Learning Main-Window Capture` is authorized to start.

The capture thread must follow `docs/V0312_LOCAL_LEARNING_SAMPLING_PLAN.md` and this G1 review. It may write only under:

- `output/v0312-local-learning-reality/`
- private raw backup path `/tmp/bsb-v0312-local-learning-private/`

It must not modify:

- `src/`
- `dist/`
- `package.json`
- `docs/`

No implementation, integration, release-prep, default-change, or rule-change work is authorized.

## Main Thread Decision

G1 passes with caveats. Proceed to Safari main-window sampling. Audit remains blocked until `summary.json`, storage summaries, restore compare, sample folders, and `sample-classification.*` exist.
