# Bilibili QoL Core (v0.3.8)

> 面向 Safari + Tampermonkey 的 Bilibili 低侵入增强 userscript：整合 SponsorBlock 片段、整视频性质标签、评论/动态识别、本地推理学习、MBGA 生态净化和 Apple 风格控制台。

Bilibili QoL Core 的目标不是接管 B 站页面，而是在尽量少改动原生 DOM/CSS 的前提下补充实用能力。所有本地推理都保持纯本地、可解释、可回退；真实验收环境以已登录的 Safari 主窗口为准。

`v0.3.8` 是仓库重命名和 Tampermonkey 更新链路迁移版本：项目仓库与脚本更新地址已迁移到 `FilfTeen/bilibili-qol-core-userscript`，功能基线继承 `v0.3.7`。

## 核心能力

- **SponsorBlock 片段处理**：按 BVID hash-prefix 请求片段，支持自动跳过、手动提示、静音、高光点和进度条预览。
- **整视频标签**：综合社区 `full` 片段、整视频标签接口、本地页面/评论信号和用户反馈，在标题与缩略图上显示胶囊标签。
- **评论区增强**：识别商品卡、导流话术、可疑托评和回复层广告，支持仅标记或折叠，并显示 B 站 payload 自带 IP 属地。
- **动态页增强**：对首页、动态页、空间页中的可疑商业动态进行标记或折叠，优先降低误杀。
- **本地推理与学习**：上游无整视频记录时补充本地判断；用户可保留或忽略本地判断。
- **低侵入 UI**：标题胶囊、缩略图胶囊、紧凑视频顶栏、通知浮窗和 QoL Core 控制台尽量不破坏原生布局。
- **MBGA 生态净化**：可选压制部分遥测/PCDN 行为，清理追踪参数，并补充低侵入页面小修。

## 安装

### Safari + Tampermonkey

1. 从 App Store 安装 Tampermonkey for Safari。
2. 打开安装链接：[bilibili-qol-core.user.js](https://github.com/FilfTeen/bilibili-qol-core-userscript/raw/main/dist/bilibili-qol-core.user.js)。
3. 在 Tampermonkey 安装确认页点击 `Install`。
4. 打开支持的 Bilibili 页面，并确认脚本已启用。
5. 通过 Tampermonkey 菜单的 `打开 QoL Core 控制台`、视频页标题胶囊或播放器盾牌按钮进入设置。

如果 Safari 只把脚本打开成文本页，可以在 `Tampermonkey Dashboard -> Utilities -> Import from URL` 手动导入 raw 链接。

### 其他 Tampermonkey 浏览器

Chrome 等浏览器可使用同一 userscript 安装链接。当前真实验收环境以 Safari 为准，Chrome 只作为兼容目标。

## 支持页面

- `https://www.bilibili.com/*`
- `https://search.bilibili.com/*`
- `https://t.bilibili.com/*`
- `https://space.bilibili.com/*`

视频能力重点覆盖 `/video/*`、`/list/*`、`/medialist/play/*`、`/bangumi/*`、`/festival/*` 和 `/opus/*`，其中非常规视频页按 best effort 处理。

## 文档导航

- [工程蓝图](./docs/BLUEPRINT.md)：功能、实现、状态、风险和验收入口的总索引。
- [使用手册](./docs/USER_GUIDE.md)：面向用户的安装、配置和操作说明。
- [能力说明](./docs/CAPABILITIES.md)：QoL Core 已实现能力和不提供能力。
- [技术文档](./docs/TECHNICAL.md)：模块结构、运行链路和工程约束。
- [上游对接审计](./docs/UPSTREAM_ALIGNMENT_AUDIT.md)：与 BilibiliSponsorBlock / SponsorBlock API 的差异和修复点。
- [误差与可靠性说明](./docs/RELIABILITY.md)：哪些判断可靠，哪些必须谨慎。
- [v0.3.7 历史审计记录](./docs/AUDIT_V037.md)：`v0.3.7` 功能版发布前的代码、安全、UI 和分支健康审计结果。
- [v0.3.7 / v0.3.8 分支健康记录](./docs/BRANCH_HEALTH_V037.md)：发布后 main、tag、integration 和历史分支状态。
- [v0.3.7 历史 Safari 验收清单](./docs/SAFARI_ACCEPTANCE_V037.md)：功能版真实 Safari 主窗口验收要求；`v0.3.8` 需额外确认更新 URL 迁移。

## 配置与本地数据

主要配置保存在 Tampermonkey 存储键 `bsb_tm_config_v1`。`bsb_tm_*` 是历史兼容前缀，升级到 Bilibili QoL Core 后不会迁移，以免破坏已有用户数据。

配置覆盖：

- SponsorBlock 服务地址、缓存、提示时长、最短处理时长。
- 分类处理模式和分类配色。
- 标题、缩略图、评论、动态标签透明度。
- 评论过滤、评论属地、动态过滤。
- 紧凑视频顶栏和灰字搜索行为。
- MBGA 网络净化、PCDN 压制、URL 清理和 UI 简化。

其他本地数据包括统计、TTL 缓存、本地整视频标签、评论反馈锁定和整视频投票历史。详见 [docs/BLUEPRINT.md](./docs/BLUEPRINT.md)。

## 与原扩展的主要差异

| 项目 | 原扩展 | Bilibili QoL Core |
| --- | --- | --- |
| 分发形式 | 浏览器扩展 | Tampermonkey 单文件 userscript |
| 运行模型 | background + content scripts | 页内脚本 + 页面桥接 |
| 设置入口 | popup / options 页面 | QoL Core 控制台、标题胶囊、播放器按钮、Tampermonkey 菜单 |
| 片段投稿 | 支持 | 暂不支持 |
| 投票 | 支持完整流程 | 仅真实社区 `full` 标签可投票；整视频标签接口结果只展示 |
| Bilibili 评论/动态增强 | 非核心 | 支持本地启发式识别和标记/折叠 |
| MBGA 生态净化 | 不适用 | 可选启用 |

## 开发与验证

```bash
npm ci
npm run evaluate:recognition
npm test
npm run check
npm run build
npm run verify:compat
npm run validate:safari
```

构建产物：

- `dist/bilibili-qol-core.user.js`

辅助采样产物：

- `output/playwright/*`
- `output/safari/*`

真实验收必须在已登录 Safari 主窗口中重载脚本后进行。Playwright、Chrome 或 Safari 自动化窗口只能作为辅助证据。

## 免责声明

使用前请阅读 [DISCLAIMER.md](./DISCLAIMER.md)。简要说明：

- 本项目不是 Bilibili、SponsorBlock、Tampermonkey 或上游扩展的官方产品。
- 评论属地只展示 Bilibili 当前页面或 payload 已公开提供的字段，不推断真实位置。
- 本地商业判断是辅助信号，不代表 SponsorBlock 社区共识或 Bilibili 官方结论。
- 页面结构、接口、登录态、权限、实验流和浏览器策略变化都可能影响脚本表现。

## 致谢

Bilibili QoL Core 由 Hush_ 维护。本项目参考并派生自 [hanydd/BilibiliSponsorBlock](https://github.com/hanydd/BilibiliSponsorBlock)，并适配了公开 userscript 的部分思路。详细来源与许可证见 [NOTICE.md](./NOTICE.md)。

## 许可证

`GPL-3.0-only`。详见 [LICENSE](./LICENSE)。
