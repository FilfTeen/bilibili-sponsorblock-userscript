# 技术文档

## 工程目标

Bilibili QoL Core v0.3.11 是运行在 Tampermonkey 中的 Bilibili 增强 userscript。`v0.3.11` 以 Local Learning Management 为主功能，并补充 MBGA / native request guard 诊断证据、诊断样本 URL 归一化和 Safari 证据文档。技术目标：

- 在 Safari 上稳定复现 SponsorBlock 核心体验。
- 用低侵入方式增强视频页、评论区、动态页和缩略图卡片。
- 用可解释的本地推理补充商业性质判断。
- 在证据明确且命中窄规则时，减少少量已知原生请求噪音。
- 避免把自动化测试通过误当成真实 Safari 可用。

## 目录结构

- `src/api`：SponsorBlock 片段接口和整视频标签接口。
- `src/core`：配置、缓存、控制器、整视频标签解析、本地标签、投票历史和片段状态机。
- `src/features`：评论区、动态页、缩略图标签和 MBGA。
- `src/platform`：Tampermonkey 授权 API、页面桥接和原生请求 guard。
- `src/runtime`：生命周期和 Tampermonkey 菜单注册。
- `src/ui`：控制台、通知、标题胶囊、紧凑顶栏、预览条、inline 反馈和样式系统。
- `src/utils`：页面识别、BVID、URL、DOM、导航、商业意图、本地学习和视频上下文。
- `test`：Vitest 单元测试、回归测试和识别样本评估。
- `scripts`：构建、兼容检查、识别评估、Playwright smoke、Safari 验证和 Safari 取证脚本。

## 运行模型

### 启动链路

1. `src/main.ts` 在 `document-start` 运行。
2. 只在 top-level window 和支持页面中启动。
3. 先安装原生请求 guard 桥接，默认只观察、不阻断。
4. 注入样式和页面桥接。
5. 加载配置、统计、缓存、本地标签和投票历史。
6. 按配置启用 MBGA、视频、评论、动态、缩略图控制器。
7. 注册 Tampermonkey 菜单。
8. 通过 `createRuntimeLifecycle()` 处理 start/stop、`pageshow/pagehide` 和 Safari BFCache。

### 视频片段链路

1. 解析 URL、页面初始状态和播放器数据，得到 `VideoContext`。
2. 请求 SponsorBlock 片段。
3. `normalizeSegments()` 按分类模式、`cid` 和最短时长过滤。
4. `ScriptController` 绑定 video 元素并按时间驱动 skip/mute/notice/poi。
5. `PreviewBar` 输出进度条片段标记。
6. `NoticeCenter` 输出跳过、撤销、保留本段等提示。

### 整视频标签链路

1. SponsorBlock `full` 片段优先。
2. 整视频标签接口次之；该接口只提供分类摘要，不提供可投票 UUID。
3. 上游无结果时，才允许本地页面/评论信号参与。
4. 本地学习层决定是否持久化和是否覆盖旧自动信号。
5. 标题胶囊和缩略图胶囊分别展示结果。

### 上游投票链路

1. 只有真实 `full` segment UUID 可走 `POST /api/voteOnSponsorTime`。
2. `2xx` 记为提交成功，`405` 记为重复提交。
3. `429`、`400/403`、`5xx` 和网络失败都不写投票历史。
4. 请求带 `x-ext-version`；不手动设置 `Origin`。
5. 新生成的用户 ID 使用 36 位 base62；旧 UUID 用户 ID 保留不迁移。

### 原生请求 guard

`src/platform/native-request-guard.ts` 通过页面脚本在 fetch/XHR 层做轻量观察。只有在以下条件都满足时，才会对当前窄名单内的顶部栏 badge 请求返回合成响应：

- QoL Core 已启用。
- 当前页面支持紧凑视频顶栏。
- 紧凑顶栏已经挂载。
- 请求命中窄白名单，例如 `/x/msgfeed/unread`、`/x/web-interface/nav/stat`。

guard 不阻断 `/x/web-interface/nav`、搜索、播放、评论、动态、登录、风控等请求。

这些 guard 规则不是通用隐私防护；它们只覆盖当前代码明确列出的路径。`v0.3.11` 起 guard 会保留 bounded page-context records，并通过 userscript 侧 snapshot 暴露给开发者诊断报告。snapshot 只保留脱敏 URL、动作类型、时间和原因；如果页面桥不可用，诊断报告显示 unavailable，而不是抛错。

### 评论/动态链路

1. 页面控制器监听支持页面的 DOM 变化。
2. 评论区抽取 Shadow DOM 评论 renderer、商品卡、文本、作者信息和属地。
3. 动态页抽取动态文本、商品结构和转发上下文。
4. 文本信号进入统一商业意图判定层，页面结构信号由接入层补强。
5. 输出 inline 标签、折叠提示、恢复按钮或本地视频反馈事件。

### MBGA 链路

MBGA 使用规则表 `MBGA_RULES`，按配置和页面类型启用网络、UI 或行为规则。它会访问 `unsafeWindow` 来拦截页面侧能力，因此所有规则都必须保持明确边界和可测试性。

MBGA 当前应被理解为 best-effort 的已知规则集合，不应被描述为完整遥测阻断、完整 PCDN 禁用或完整隐私保护。

MBGA 会在当前页面内存中记录最近有限数量的 decision telemetry，覆盖 `observed`、`blocked`、`synthetic`、`rewritten`、`stubbed`、`skipped` 和 `error`。每条记录包含规则、动作、脱敏 URL、页面类型、来源和原因；记录不写入 GM storage，不持久化，不记录 cookie、token、authorization、评论原文或用户 ID。MBGA 主开关关闭后不会继续新增记录。

`disable-pcdn` 是实验子项。新用户默认关闭；旧用户配置中显式保存的 `true` 或 `false` 会保留。该规则只代表部分已知 PCDN / WebRTC / CDN 路径的 best-effort 压制，不代表完整禁用。

## 数据与存储

Tampermonkey 存储键：

- `bsb_tm_config_v1`：用户配置。
- `bsb_tm_stats_v1`：跳过次数和节省分钟数。
- `bsb_tm_cache_v1`：SponsorBlock/整视频标签 TTL 缓存。
- `bsb_tm_user_id_v1`：整视频反馈用户标识。
- `bsb_tm_local_video_labels_v1`：本地整视频标签。
- `bsb_tm_comment_feedback_v1`：评论反馈锁定记录。
- `bsb_tm_vote_history_v1`：整视频标签投票历史。

控制台 `帮助 / 反馈` 页的本地学习管理只读展示 `bsb_tm_local_video_labels_v1` 的脱敏摘要，并允许单条删除或清空；`bsb_tm_comment_feedback_v1` 只显示数量和更新时间，不展示评论原文或哈希明细。删除本地视频记录后不会写入新的压制标记，后续自动推理仍可按现有规则再次命中。

缓存限制：

- 默认 TTL：1 小时。
- 最大条目：1000。
- 最大大小：500 KiB。

## 低侵入策略

- 追加独立节点，避免重写原生标题、评论和卡片内容。
- 不给大面积原生容器强行写 layout CSS。
- 缩略图胶囊按封面几何锚定，不依赖固定坐标。
- 评论/动态只在命中节点附近插入 inline 标签或提示。
- 紧凑顶栏在网页全屏、原生全屏和播放器全屏状态下隐藏。
- 控制台使用独立 fixed overlay，不污染 B 站原生设置。

## 安全策略

- 运行时代码默认使用 `textContent`、`createElement` 和事件监听，不使用动态代码执行。
- Tampermonkey 网络请求优先使用 `GM_xmlhttpRequest`，fetch 仅作为兼容 fallback。
- 页面桥接只处理内部请求事件，并使用随机 request id 对应响应。
- 原生请求 guard 使用窄白名单，不做宽泛网络黑名单。
- `@connect *` 是 SponsorBlock 服务地址可配置导致的当前分发约束，需要在发布说明中保持透明。
- MBGA 的 `unsafeWindow` 访问只允许出现在规则模块内，并由规则 id、配置开关和测试约束。

## Safari 约束

Safari 是唯一真实验收环境：

- Safari 自动化窗口可能没有用户登录态，不能替代主窗口验收。
- 每次构建后必须重载 Tampermonkey 脚本，避免采样旧代码。
- 与登录态、接口权限、实验流有关的问题必须先排除环境因素。

## 验证链路

推荐顺序：

```bash
npm run evaluate:recognition
npm test
npm run check
npm run build
npm run verify:compat
git diff --check
npm run validate:safari
```

发布前还需要 Safari 主窗口人工验收，覆盖至少视频页、评论区、动态页、首页/搜索卡片、控制台和上游投票反馈。
