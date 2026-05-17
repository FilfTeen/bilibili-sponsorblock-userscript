# v0.3.12 Local Learning Reality Closure Target

本文件是 v0.3.12 第二个主线程跟踪目标的目标卡。它不是识别规则扩展计划，不授权提高过滤攻击性，也不把本地判断升级为事实判决。

## 主线程立项裁决

状态：`CLOSED - PASS WITH CAVEAT; docs package ready to commit`

立项日期：2026-05-15

目标启动时基线：

- 本地主线：`main` at `6888edf`
- 上一目标：`v0.3.12 MBGA Reality Evidence Pass` 已完成并提交为 `6888edf`
- 目标启动时发布基线：tag `v0.3.11` at `2af59cb`
- 目标启动时远端主线：`origin/main`，当时与上一行发布基线同提交
- integration：`codex/qol-core-integration` at `6c3e555`
- 隔离实验：`codex/panel-choice-menu-version` at `69194bc`，不得进入本目标祖先链

主线程接受 Strategy Planner 提出的方向，并做如下约束：

- 目标名称固定为 `v0.3.12 Local Learning Reality Closure`。
- 本阶段只做现实触发链路取证、样本治理、审计和主线程裁决。
- 禁止新增或扩大广告/托评/商业识别规则。
- 禁止提高过滤攻击性。
- 禁止把本地启发式判断写成事实判决。
- 禁止为了造样本而污染用户真实本地学习记录；采样必须可逆、可恢复。

## 目标卡

| 项目 | 内容 |
| --- | --- |
| 目标名称 | `v0.3.12 Local Learning Reality Closure` |
| 目标类型 | 现实证据补全 / 样本治理 / 本地学习闭环验证 |
| 主线程职责 | 跟踪评论扫描、本地推理、本地写入、控制台管理之间的真实闭环证据 |
| 目标价值 | 证明本地学习不是只有面板管理可用，而是真实页面/评论信号能稳定进入可管理学习链路 |
| 非目标 | 不新增识别规则；不扩大广告/托评规则；不把本地判断说成事实判决 |
| 核心问题 | 真实 Safari 登录态下，评论扫描或页面信号能否稳定触发本地标签写入、展示、管理、删除和后续刷新 |
| 必须证据 | Safari 主窗口、已登录、目标 dist 已加载、真实样本、写入前后本地记录变化 |
| 样本范围 | 普通视频评论、回复层、商品卡/导流强信号、普通负样本；动态样本只作为相邻能力参考 |
| 目标产物 | `docs/V0312_LOCAL_LEARNING_SAMPLING_PLAN.md`、样本分类表、最终 evidence report |
| 验收标准 | 能区分 `Verified` / `Partial` / `Not Verified` / `False Positive Risk` |
| 决策出口 | 主线程决定是否需要补样本、补测试、调整文案，或派发极窄实现修复任务 |

## 既有证据输入

本目标必须先消化 v0.3.11 的事实，而不是重做旧功能验收：

- `docs/MAIN_THREAD_HANDOFF_V0311.md`
- `docs/BLUEPRINT.md`
- `docs/SAFARI_ACCEPTANCE_V0311.md`
- `docs/RELEASE_NOTES_V0311.md`
- `docs/V0311_FUNCTION_COMPLETENESS_MATRIX.md`
- `docs/V0311_SAFARI_ACCEPTANCE_GAPS.md`
- `src/utils/local-video-signal.ts`
- `src/utils/local-learning.ts`
- `src/core/local-label-store.ts`
- `src/features/comment-filter.ts`
- `src/core/controller.ts`
- `src/ui/panel.ts`
- `test/local-video-signal.test.ts`
- `test/local-learning.test.ts`
- `test/local-label-store.test.ts`
- `test/controller.test.ts`
- `test/panel.test.ts`

v0.3.11 的有效起点：

- Local Learning Management 已进入主线。
- 控制台 `帮助 / 反馈` 页可显示、删除、清空本地视频学习记录。
- 评论反馈锁只显示数量和更新时间，不暴露评论文本或哈希。
- 自动本地学习写入成功后应刷新 Help 页记录。
- Safari 主窗口最终 Local Learning 小验收为 `PASS WITH CAVEAT`。
- caveat 是有机评论扫描触发自动写入仍缺更多稳定真实评论样本。

## 隐私与数据保护协议

采样方案必须满足：

- 不采集评论原文。
- 不采集用户 ID、cookie、token、评论哈希明细或可逆敏感标识。
- 样本表只能记录脱敏分类、页面类型、触发路径、证据文件路径和可复核状态。
- 采样前必须快照本地学习相关存储摘要。
- 采样后必须恢复或清理采样写入，证明用户真实本地学习记录未被不可逆污染。
- 若使用真实评论样本，只能保留最小脱敏上下文，不保留完整文本。
- 删除/清空验证必须证明记录可逆管理，不得把用户既有记录误删作为采样手段。

## 分类规则

采样和审计必须把样本分成以下类别：

| 类别 | 含义 | 决策默认值 |
| --- | --- | --- |
| `Verified` | Safari 主窗口证据证明触发、写入、展示、管理和刷新闭环成立，且未发现误伤 | 可作为现实能力证据，但 wording 仍需保守 |
| `Partial` | 链路部分成立，但缺触发、写入、展示、删除、刷新或稳定性中的一环 | 只能作为 caveat 证据 |
| `Not Verified` | 样本未触发、证据不足或依赖推断 | 不得作为 release claim |
| `False Positive Risk` | 负样本或普通评论被错误持久化，或本地判断越过保守边界 | 必须主线程裁决，可能进入修复或文案降级 |

## 第一轮线程创建信号

### 研究线程：V0312 Local Learning Sampling Design

创建状态：`APPROVED TO START`

目标：设计 v0.3.12 Local Learning Reality Closure 的 Safari 真实闭环采样方案和样本分类表结构。

边界：

- 默认只读。
- 可以写采样方案草案到 `docs/`。
- 不改运行时代码。
- 不新增识别规则。
- 不调整默认配置。
- 不做发布决策。

必须回答：

- 如何证明 Safari 主窗口已登录并加载目标 dist。
- 如何证明写入前、触发中、写入后、本地学习面板展示、删除/恢复、刷新链路。
- 如何快照和恢复 `bsb_tm_local_video_labels_v1` 与 `bsb_tm_comment_feedback_v1` 的脱敏摘要。
- 如何避免采集评论原文、评论哈希明细和用户敏感信息。
- 商品卡/导流强信号、普通评论负样本、回复层样本分别如何分类。
- 何时应停止采样并标记 `False Positive Risk`。
- 动态样本是否只作为相邻能力参考，不进入主闭环结论。

交付物：

- `docs/V0312_LOCAL_LEARNING_SAMPLING_PLAN.md`
- 样本分类表字段建议
- Safari 手工步骤
- 原始证据目录约定，建议为 `output/v0312-local-learning-reality/`

### Safari 验收线程：V0312 Local Learning Main-Window Capture

创建状态：`COMPLETED - G2 BLOCK`

批准依据：G1 采样方案 `docs/V0312_LOCAL_LEARNING_SAMPLING_PLAN.md` 已提交并经主线程审核；G1 review 见 `docs/V0312_LOCAL_LEARNING_G1_REVIEW.md`。

G2 审核：`docs/V0312_LOCAL_LEARNING_CAPTURE_G2_REVIEW.md`。

结果：目标 dist 身份和 Safari 登录态通过，但正向 Local Learning 写入闭环未验证，raw storage restore proof 不成立。

目标：在 Safari 主窗口执行采样方案。

硬约束：

- 必须使用已登录 Safari 主窗口。
- 必须重载目标 `dist/bilibili-qol-core.user.js`。
- 必须记录 dist SHA-256，并证明 Tampermonkey installed script 与目标 dist 一致。
- 必须记录采样前后本地学习相关存储摘要。
- 必须证明采样后用户真实数据未被不可逆污染。
- 不得采集评论原文或敏感标识。

### 审计线程：V0312 Local Learning Evidence Audit

创建状态：`COMPLETED - PASS WITH CAVEAT`

目标：不信任采样线程结论，独立复核真实闭环、误判风险、隐私边界和证据充分性。

边界：

- 默认只读。
- 可以写审计报告到 `docs/`。
- 不直接修复代码或改样本。
- 不把采样线程的 PASS 当最终真相。

当前审计输入：`docs/V0312_LOCAL_LEARNING_AFTER_LOGIN_CAPTURE_G2_REVIEW.md` 和 `output/v0312-local-learning-reality-clean-profile/after-user-login-capture/`。

审计必须明确区分 `Verified in isolated profile`、`current-profile restore not exercised`、`raw restore not verified` 和 `organic comment scanning not verified`。

审计结果：`docs/V0312_LOCAL_LEARNING_EVIDENCE_AUDIT.md`。

主线程 G3 裁决：`docs/V0312_LOCAL_LEARNING_G3_DECISION.md`。

最终 evidence report：`docs/V0312_LOCAL_LEARNING_REALITY_EVIDENCE.md`。

### 实现线程

创建状态：`NOT AUTHORIZED`

在主线程完成证据裁决前，禁止实现线程处理识别规则、默认配置、存储逻辑或 UI 变更。

### 研究线程：V0312 Local Learning Evidence Method Repair

创建状态：`COMPLETED - G2R PASS`

目标：修复 G2 证据方法，而不是修代码。研究如何在不暴露用户历史本地学习记录、不清空用户数据的前提下，证明 scoped storage before/after/restore，并如何取得干净正样本。

必须回答：

- 是否能通过 Tampermonkey UI、用户批准的私有导出、Safari profile 隔离或其它非破坏性方法取得 raw digest 证据。
- 如果用户已有 71 条历史记录，如何证明 sample BVID 的写入/删除/恢复而不暴露非样本 BVID。
- 如何预筛选正样本，避免 `manual-dismiss` 或历史记录污染写入因果。
- 是否需要一个极窄的 diagnostics/export helper；如果需要，必须说明为何不是采样流程问题，并等待主线程另行授权实现线程。
- 若无法取得强证据，应如何降级最终目标和 release wording。

交付物建议：

- `docs/V0312_LOCAL_LEARNING_EVIDENCE_METHOD_REPAIR.md`

主线程审核：`docs/V0312_LOCAL_LEARNING_G2_REPAIR_DECISION.md`。

结果：方法修正被接受。G2 仍为 `BLOCK`，但下一步证据路径已收窄为 clean-profile revised capture。current profile 只允许作为 71 条历史记录的只读基线；same-profile private raw export 需要用户另行明确批准；diagnostic/export helper 未授权。

### Safari 验收线程：V0312 Local Learning Clean-Profile Capture

创建状态：`COMPLETED - BLOCKED_NOT_LOGGED_IN`

批准依据：`docs/V0312_LOCAL_LEARNING_G2_REPAIR_DECISION.md`。

目标：在隔离 Safari/Tampermonkey profile 中证明 Local Learning 正样本写入、面板展示、删除、刷新和恢复闭环，同时保护当前用户 profile 的 71 条历史记录。

输出目录：

- `output/v0312-local-learning-reality-clean-profile/`

硬约束：

- 必须使用干净 Safari/Tampermonkey profile。
- 必须安装并证明目标 `dist/bilibili-qol-core.user.js` 与 Tampermonkey installed script hash 一致。
- 必须记录脱敏 Safari 登录态证明。
- 必须先在 userscript disabled / scout 环境中预筛选候选 URL。
- 必须证明 clean profile 的 before state、write state、panel state、delete/refresh state 和 restore state。
- 不得采集评论原文、评论 hash 明细、用户 ID、cookie、token 或可逆敏感标识。
- 不得在当前 71 条历史记录 profile 中继续做正样本写入闭环。
- 不得把 clean profile 结论写成 current-profile exact restore。
- 若 clean profile 不可行，必须停止并回报主线程，不得自行 fallback 到 private raw export 或 helper。

G2C 审核：`docs/V0312_LOCAL_LEARNING_CLEAN_PROFILE_G2C_REVIEW.md`。

结果：clean profile、Tampermonkey installed script 和 dist hash 证明成立，但 clean profile Bilibili 登录态为 `isLogin=false`，采样线程按停止条件返回 `BLOCKED`，未进入 before/write/panel/delete/refresh/restore 链路。

### Safari 验收线程：V0312 Local Learning Clean-Profile Capture - Login Retry

创建状态：`COMPLETED - PASS_CANDIDATE`

批准依据：`docs/V0312_LOCAL_LEARNING_CLEAN_PROFILE_G2C_REVIEW.md`。

目标：用户先在 `Codex V0312 LL Clean` Safari profile 中完成 Bilibili 登录；如需验收线程辅助，只能在用户明确授权且不接触凭据的前提下操作。登录态脱敏证明为 `isLogin=true` 后，继续同一 clean-profile revised capture 链路。

硬约束：

- 必须先重跑 login proof。
- 若仍为 `isLogin=false`，必须再次返回 `BLOCKED_NOT_LOGGED_IN`。
- 不得覆盖或删除前一次 clean-profile BLOCKED 证据。
- 不得自行 fallback 到 current-profile private raw export 或 helper。
- 登录成功不等于 G2 通过；仍需完整 before/write/panel/delete/refresh/restore 证据。

登录后续跑审核：`docs/V0312_LOCAL_LEARNING_AFTER_LOGIN_CAPTURE_G2_REVIEW.md`。

结果：目标 dist、登录态、page-heuristic 正样本写入/面板/删除/刷新、负样本非误伤和 panel-derived restore 证据成立到 `PASS_CANDIDATE WITH CAVEAT`，允许进入独立审计。该结果不证明 raw restore、current-profile exact restore 或 organic comment scanning closure。

### 文档治理线程：V0312 Local Learning Docs Governance Closure

创建状态：`COMPLETED - PASS`

批准依据：`docs/V0312_LOCAL_LEARNING_G3_DECISION.md`。

目标：确认 Local Learning v0.3.12 docs-only 证据包索引完整、状态措辞不误导、claim boundary 不超过 G3，并给出提交建议。

主线程审核：`docs/V0312_LOCAL_LEARNING_DOCS_GOVERNANCE_CLOSURE.md`。

结果：docs governance closed。Local Learning 证据包已达到可提交状态；实现线程、integration 和 release/preflight 仍未授权。

## 主线程阶段门

| Gate | 条件 | 主线程动作 |
| --- | --- | --- |
| G0 | MBGA docs-only 治理包已提交，避免目标资产混杂 | 已通过，commit `6888edf` |
| G1 | 采样方案清楚、可复核、不采集评论隐私、不污染用户本地学习记录 | 已通过，带 caveat；允许 Safari 采样 |
| G2 | 原始证据能证明写入前、触发中、写入后、面板可管理、删除/刷新链路 | PASS_CANDIDATE WITH CAVEAT；进入独立审计 |
| G3 | 审计确认闭环证据等级和误判风险 | PASS WITH CAVEAT；证据目标完成，不授权实现 |
| G4 | 只有发现真实 blocker | 派发极窄实现线程 |
| G5 | 修复后通过 integration、审计、Safari 验收 | 决定是否进入 release prep |

## 停止条件

任一条件触发时，目标不得进入实现阶段：

- 无法证明 Safari 主窗口加载的是目标 dist。
- 无法证明登录态。
- 无法证明采样前后本地学习相关存储摘要。
- 无法证明采样写入可管理、可删除或可恢复。
- 样本证据包含评论原文、评论哈希明细、用户 ID、cookie、token 或可逆敏感标识。
- 普通负样本被持久化为商业/广告判断。
- 评论扫描只能靠人工构造 DOM 或非真实页面上下文成立。
- 采样线程试图把“识别更多广告”当作成功标准。

## 当前主线程结论

本目标可以启动形成，且是 v0.3.12 MBGA Reality Evidence Pass 之后的下一个跟踪目标。

当前目标已关闭。证据目标以 `PASS WITH CAVEAT` 收束：只支持 isolated Safari/Tampermonkey profile 中 page-heuristic 本地视频标签 write / panel / delete / panel-derived refresh cleanup。实现线程、integration 和 release prep 仍未授权；Local Learning docs-only 证据包已准备提交。
