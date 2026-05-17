# v0.3.12 MBGA Reality Evidence Pass Target

本文件是 v0.3.12 第一个主线程跟踪目标的目标卡。它不是实现计划，不授权扩大 MBGA 拦截规则，也不把 MBGA 升级为隐私保护能力。

## 主线程立项裁决

状态：`COMPLETE - evidence objective closed; no implementation authorized`

立项日期：2026-05-14

目标启动时基线：

- 本地主线：`main` at `f578f4d`
- 目标启动时发布基线：tag `v0.3.11` at `2af59cb`
- 目标启动时远端主线：`origin/main`，当时与上一行发布基线同提交
- integration：`codex/qol-core-integration` at `6c3e555`
- 隔离实验：`codex/panel-choice-menu-version` at `69194bc`，不得进入本目标祖先链

主线程接受 Strategy Planner 提出的方向，但做如下约束：

- 目标名称固定为 `v0.3.12 MBGA Reality Evidence Pass`。
- 本阶段只做取证、分类、审计和主线程裁决。
- 禁止新增 MBGA 拦截规则。
- 禁止扩大隐私、遥测、PCDN、WebRTC、live 支持宣称。
- 后续任何配置、文档或运行时代码修正，必须等主线程裁决后另行派实现线程。

## 目标卡

| 项目 | 内容 |
| --- | --- |
| 目标名称 | `v0.3.12 MBGA Reality Evidence Pass` |
| 目标类型 | 现实能力证据、endpoint 分类、默认策略裁决 |
| 主线程职责 | 跟踪生命周期、裁决证据是否足够、决定默认策略和公开文档边界 |
| 目标价值 | 防止 MBGA 被过度宣传；明确哪些规则保留、降级、默认关闭或移除 |
| 非目标 | 不扩大拦截表；不承诺隐私保护；不直接实现 live / PCDN / WebRTC 新能力 |
| 核心问题 | 当前 MBGA 到底处理了什么、没处理什么、是否影响播放、登录、评论、动态、搜索 |
| 必须证据 | Safari 主窗口、已登录、Tampermonkey 已重载目标 dist、MBGA on/off 对照 |
| 样本页面 | 普通视频、番剧、首页、动态、文章、搜索；live 只作为当前是否支持的研究样本 |
| 目标产物 | `docs/V0312_MBGA_REALITY_EVIDENCE.md` 草案、endpoint 分类表、默认策略建议 |
| 验收标准 | 能清楚区分 `Verified` / `Partial` / `Not Verified` / `Do Not Touch` |
| 决策出口 | 主线程决定保留默认、改默认、降级文案、移除 claim 或派发后续实现任务 |

## 既有证据输入

本目标必须先消化 v0.3.11 的现实证据，而不是重复旧结论：

- `docs/V0311_REALITY_AUDIT.md`
- `docs/V0311_MBGA_NETWORK_EVIDENCE.md`
- `docs/V0311_MBGA_AB_CAPTURE.md`
- `docs/V0311_SAFARI_DIAGNOSTICS_SAMPLING.md`
- `docs/V0311_DOCS_TRUTHFULNESS_PASS.md`
- `docs/SAFARI_ACCEPTANCE_V0311.md`
- `docs/RELEASE_NOTES_V0311.md`

v0.3.11 的有效起点：

- `clean-url-params`：已有样本级验证，但仍需覆盖分享链接、锚点和 query 场景。
- `block-telemetry-reporters`：只能算 known-host best-effort / partial，不能宣称完整遥测阻断。
- `disable-pcdn`：实验能力，默认继续按新用户 default-off 处理，除非新证据推翻。
- `native-request-guard`：目标路径很窄，真实 blocked action 仍需补证。
- `live-room-ui-cleanup`：当前不要写成已支持能力；先研究 userscript support gate 和真实副作用。

## Endpoint 分类规则

采样线程必须把 endpoint 分成以下类别之一：

| 类别 | 含义 | 决策默认值 |
| --- | --- | --- |
| `Verified` | 当前规则在 Safari 主窗口 A/B 中有可复核证据，且未发现明显副作用 | 可保留，但仍需限定 wording |
| `Partial` | 有迹象，但证据不足以证明完整处理或长期安全 | 只能保守表述；不得扩大规则 |
| `Not Verified` | 未命中样本、证据不可用或结论依赖推断 | 不得作为 release claim |
| `Do Not Touch` | 登录、消息、风控、播放器、评论、passport、media host 或反作弊相关路径 | 默认禁止拦截或重写 |

默认 `Do Not Touch` 范围：

- `passport.bilibili.com/*`
- `message.bilibili.com/*`
- `api.bilibili.com/x/web-interface/nav`
- `api.bilibili.com/x/player/*`
- `api.bilibili.com/x/v2/reply/*`
- `api.bilibili.com/x/internal/gaia-gateway/*`
- `api.vc.bilibili.com/x/im/*`
- `api.vc.bilibili.com/session_svr/*`
- `api.live.bilibili.com/*`
- `*.bilivideo.com`、`upos-*`、`*.hdslb.com` media/static assets

任何把上述范围改出 `Do Not Touch` 的建议，都必须提供独立 Safari A/B 证据和副作用验证，且必须经主线程单独裁决。

Endpoint 分类表必须显式记录：

- `Observed By` / `observed_by`：区分 PerformanceResourceTiming、native guard snapshot、MBGA decision telemetry、HAR、页面运行时快照或截图。
- `Side Effect Check` / `side_effect_check`：标明播放、登录、评论、动态、搜索、消息、页面加载是否被检查，以及结果是 pass、caveat、fail 还是 not-tested。

## G1 / G2 硬要求

G1 采样方案必须包含配置保护协议：

- 采样前快照 MBGA 相关配置。
- 采样中只按方案切换 MBGA off / on-default / 可选 on-pcdn-experiment。
- 采样后恢复用户原配置。
- 必须对 `mbgaEnabled`、`mbgaBlockTracking`、`mbgaDisablePcdn`、`mbgaCleanUrl`、`mbgaSimplifyUi` 记录 original / set / restore 证据。
- 若无法证明 restore 后与 original 一致，采样不得进入 G2。

G2 原始证据必须包含：

- 当前页面确实加载目标 dist 的证明。
- Tampermonkey 已重载或重新安装目标 dist 的证明。
- `dist/bilibili-qol-core.user.js` SHA-256 与已安装脚本文本 SHA-256 对比。
- Safari 主窗口登录态的非敏感证明。
- MBGA on/off 状态的运行时快照。
- 页面 URL、页面类型、采样时间、截图或诊断报告路径。

live 样本只用于判断 QoL Core 是否运行、MBGA 是否可达。若 QoL Core panel 不存在或脚本不在 `live.bilibili.com` 运行，live 直接归为 `Not Verified / Unsupported Surface`；不得用 live 网络观察推导 MBGA 能力。

## 第一轮线程创建信号

### 研究线程：V0312 MBGA Sampling Design

创建状态：`APPROVED TO START`

目标：设计 v0.3.12 MBGA Reality Evidence 的 Safari A/B 采样方案和 endpoint 分类表结构。

边界：

- 默认只读。
- 可以写采样方案草案到 `docs/`，但不改运行时代码。
- 不做发布决策。
- 不新增 MBGA 规则。

必须回答：

- 每个样本页面如何证明登录态、脚本版本和目标 dist 已加载。
- 如何可靠切换 MBGA off/on 并恢复用户原配置。
- 诊断报告、截图、PerformanceResourceTiming、native guard snapshot、MBGA decision telemetry、Web Inspector HAR 各自能证明什么，不能证明什么。
- endpoint 分类表需要哪些字段，如何避免把 observed 请求误判为 blocked。
- live 页面到底是 unsupported sample、future-support research，还是应排除出 v0.3.12 release claim。

交付物：

- `docs/V0312_MBGA_SAMPLING_PLAN.md`
- endpoint 分类表字段建议
- Safari 手工步骤
- 原始证据目录约定，建议为 `output/v0312-mbga-reality-evidence/`

### Safari 验收线程：V0312 MBGA Main-Window Capture

创建状态：`APPROVED TO START`

批准依据：G1 采样方案 `docs/V0312_MBGA_SAMPLING_PLAN.md` 已提交并经主线程收口，满足配置保护、脚本身份、登录态证明、endpoint 分类和 live unsupported 边界要求。

目标：在 Safari 主窗口执行采样方案。

硬约束：

- 必须使用已登录 Safari 主窗口。
- 必须重载目标 `dist/bilibili-qol-core.user.js`。
- 必须记录 dist SHA-256。
- 不能只看 `@version`。
- 必须做 MBGA off/on 对照，并恢复原设置。
- 不能把 Chrome、Playwright、Safari WebDriver 当作最终验收。

交付物：

- `output/v0312-mbga-reality-evidence/summary.json`
- 页面级 JSON、截图、诊断报告文本
- 可行时附 Safari Web Inspector HAR 或等价网络导出
- 明确 PASS / BLOCK / CAVEAT

### 审计线程：V0312 MBGA Evidence Audit

创建状态：`COMPLETED - PASS WITH CAVEAT`

批准依据：Safari 主窗口采样线程已提交 `output/v0312-mbga-reality-evidence/summary.json`、原始证据目录和 endpoint 分类表；主线程 G2 review 见 `docs/V0312_MBGA_CAPTURE_G2_REVIEW.md`。

审计报告：`docs/V0312_MBGA_EVIDENCE_AUDIT.md`。

主线程 G3 裁决：`docs/V0312_MBGA_G3_DECISION.md`。

目标：不信任采样线程结论，独立复核 endpoint 分类、claim 边界、默认策略建议和证据充分性。

边界：

- 默认只读。
- 可以写审计报告到 `docs/`。
- 不直接修复代码或文档 claim。
- 不把采样线程的 PASS 当最终真相。

交付物：

- `PASS` / `BLOCK` / `PASS WITH CAVEAT`
- findings，按严重度排序
- 对 `Verified` / `Partial` / `Not Verified` / `Do Not Touch` 分类的异议
- 是否需要实现线程介入的主线程建议

### 实现线程

创建状态：`NOT AUTHORIZED`

在主线程完成证据裁决前，禁止实现线程处理 MBGA 规则扩展、默认策略变化、文档宣传升级或 live 支持。

## 主线程阶段门

| Gate | 条件 | 主线程动作 |
| --- | --- | --- |
| G1 | 采样方案清楚、可复核，包含配置保护协议和脚本身份/登录态证据标准 | 已通过；允许 Safari 验收线程采集 |
| G2 | 原始证据齐全，能证明 dist、Tampermonkey 安装文本、登录态、MBGA 状态、页面样本和配置 restore | 已通过，带 caveat；允许审计线程复核 |
| G3 | 审计给出 PASS / CAVEAT / BLOCK，并列出证据缺口 | 已完成；最终证据报告见 `docs/V0312_MBGA_REALITY_EVIDENCE.md` |
| G4 | 裁决需要代码或文档变化 | 派发最小范围实现线程 |
| G5 | 实现完成且通过 integration、审计、Safari 验收 | 决定是否进入 v0.3.12 release prep |

## 停止条件

任一条件触发时，目标不得进入实现阶段：

- 无法证明 Safari 主窗口加载的是目标 dist。
- 无法证明登录态。
- 无法恢复 MBGA 原配置。
- A/B 证据只显示 observed 请求，无法证明 blocked、synthetic、rewritten 或副作用。
- 采样中发现播放、登录、评论、动态、搜索、文章阅读存在 P0/P1 副作用。
- 审计线程认为 endpoint 分类把登录、风控、播放器或 media host 错判为可触碰。

## 当前主线程结论

本目标可以启动形成，且是 v0.3.12 的第一个跟踪目标。

当前证据目标已完成并关闭。任何实现线程仍未授权；后续代码、默认值、release 或文档发布面变化必须由主线程另行立项和派发。
