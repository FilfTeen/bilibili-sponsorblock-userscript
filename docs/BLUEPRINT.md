# Bilibili QoL Core v0.3.10 工程蓝图

本文件是后续开发、审计和派生线程接力的总索引。它描述当前真实能力、实现入口、数据边界、测试入口和验收重点。

`v0.3.10` 是控制台交互补丁之后的发布阻塞修复，清理诊断报告页面 URL 中的 query/hash 敏感信息，并确保 tag 构建生成不带 `v` 前缀的 userscript 版本号；当前发布产物为 `dist/bilibili-qol-core.user.js`。

## 1. 运行环境与启动

| 项目 | 当前实现 |
| --- | --- |
| 分发形态 | Tampermonkey 单文件 userscript |
| 真实验收环境 | Safari 主窗口，已登录，已安装当前构建产物 |
| 入口文件 | `src/main.ts` |
| 构建入口 | `scripts/build.mjs` |
| 产物 | `dist/bilibili-qol-core.user.js` |
| 菜单入口 | `src/runtime/menu.ts` 注册 `打开 QoL Core 控制台`、`打开 QoL Core 帮助`、`清理 QoL Core 缓存` |

启动顺序：

1. 在 document-start 安装页面桥接和原生请求 guard。
2. 检查 top-level window 和支持页面。
3. 注入主样式和页面桥接。
4. 加载配置、统计、缓存、本地标签、投票历史。
5. 挂载 MBGA。
6. 启动视频、评论、动态、缩略图控制器。
7. 注册 Tampermonkey 菜单。
8. 交给 lifecycle 管理 `pageshow/pagehide`。

## 2. 功能能力索引

| 能力 | 用户价值 | 主要实现 | 关键测试 | Safari 验收点 |
| --- | --- | --- | --- | --- |
| SponsorBlock 片段 | 跳过广告、静音、高光提示 | `src/core/controller.ts`、`src/api/sponsorblock-client.ts`、`src/core/segment-filter.ts` | `test/controller.test.ts`、`test/segment-filter.test.ts` | 片段跳过、撤销、保留本段、进度条标记 |
| 整视频标签 | 提示整支视频商业性质 | `src/core/whole-video-label.ts`、`src/api/video-label-client.ts`、`src/ui/title-badge.ts` | `test/whole-video-label.test.ts`、`test/title-badge.test.ts` | 标题胶囊唯一、popover 正常、反馈入口正确 |
| 缩略图标签 | 在信息流提前提示视频性质 | `src/features/thumbnail-labels.ts` | `test/thumbnail-labels.test.ts` | 首页/搜索/推荐卡片不挤压、不重复 |
| 评论识别 | 标记或折叠广告/托评 | `src/features/comment-filter.ts`、`src/utils/commercial-intent.ts` | `test/comment-filter.test.ts`、`test/commercial-intent.test.ts` | 商品卡、导流评论、回复层、恢复入口 |
| 评论属地 | 显示 payload 自带 IP 属地 | `src/features/comment-filter.ts`、`src/ui/inline-feedback.ts` | `test/comment-filter.test.ts`、`test/inline-feedback.test.ts` | 标签颜色、透明模式、无属地时不伪造 |
| 动态识别 | 标记或折叠商业动态 | `src/features/dynamic-filter.ts` | `test/dynamic-filter.test.ts` | 首页/动态页/空间页普通动态不误伤 |
| 本地推理 | 上游未命中时补充判断 | `src/utils/local-video-signal.ts`、`src/utils/local-learning.ts`、`src/core/local-label-store.ts` | `test/local-video-signal.test.ts`、`test/local-learning.test.ts`、`npm run evaluate:recognition` | 上游存在时短路，本地保留/忽略可持续 |
| QoL Core 控制台 | 配置和维护入口 | `src/ui/panel.ts`、`src/ui/styles.ts` | `test/panel.test.ts`、`test/styles.test.ts` | 颜色编辑、二阶段确认、滚动不跳动 |
| 紧凑顶栏 | 视频页搜索和账号入口 | `src/ui/compact-header.ts`、`src/platform/native-request-guard.ts`、`src/utils/page.ts` | `test/compact-header.test.ts`、`test/native-request-guard.test.ts`、`test/page.test.ts` | 网页全屏隐藏，搜索框不被重建打断，请求 guard 不破坏登录态 |
| 通知中心 | 低打扰提示和操作反馈 | `src/ui/notice-center.ts` | `test/notice-center.test.ts` | 出现/消失动画、播放器避让、无残留 |
| MBGA | 生态噪音压制（best-effort）和页面小修 | `src/features/mbga/core.ts` | `test/mbga.test.ts` | 播放/动态/专栏/直播页面无明显副作用；网络效果需 A/B 证据 |

## 3. 页面范围

| 页面 | 检测类型 | 支持能力 |
| --- | --- | --- |
| `www.bilibili.com/video/*` | `video` | 片段、标题标签、评论、缩略图、紧凑顶栏、MBGA |
| `www.bilibili.com/list/*` | `list` | 视频能力 best effort |
| `www.bilibili.com/medialist/play/*` | `list` | 视频能力 best effort |
| `www.bilibili.com/bangumi/*` | `anime` | 视频能力 best effort，紧凑顶栏需网页全屏隐藏 |
| `www.bilibili.com/festival/*` | `festival` | 视频能力 best effort |
| `www.bilibili.com/opus/*` | `opus` | 视频/评论能力 best effort |
| `search.bilibili.com/*` | `search` | 缩略图标签 |
| `t.bilibili.com/*` | `dynamic` | 动态识别、评论能力 best effort |
| `space.bilibili.com/*` | `channel` | 动态识别、评论能力 best effort、缩略图标签 |

## 4. 数据流与优先级

整视频判断优先级：

1. SponsorBlock `full` 标签。
2. 整视频标签接口。
3. 用户手动本地保留/忽略。
4. 本地页面信号。
5. 本地评论信号。

实际运行中，上游解析中或上游已命中时，本地推理短路。本地手动记录优先于自动信号，低置信度自动信号不持久化。

## 5. 配置与存储

配置源：`src/constants.ts` 的 `DEFAULT_CONFIG`。

主要存储键：

- `bsb_tm_config_v1`
- `bsb_tm_stats_v1`
- `bsb_tm_cache_v1`
- `bsb_tm_user_id_v1`
- `bsb_tm_local_video_labels_v1`
- `bsb_tm_comment_feedback_v1`
- `bsb_tm_vote_history_v1`

`bsb_tm_*` 是历史兼容前缀，不随用户可见名称迁移。

## 6. 网络与安全边界

网络入口：

- SponsorBlock 服务地址可配置，默认 `https://www.bsbsb.top`。
- 上游 API 请求带 `x-ext-version`，不手动伪造 `Origin`。
- 紧凑顶栏启用后，原生请求 guard 只对当前窄名单内的顶部栏 badge 请求返回合成响应；这些请求是否始终冗余仍需随 B 站实验流复核。guard 不阻断头像、搜索、登录态、播放、评论、动态和风控请求。
- 评论作者资料接口用于辅助托评判断，失败时无感回退。
- MBGA 只对少量已知页面网络/行为路径做 best-effort 处理，不能当成完整隐私防护或完整 PCDN 禁用能力。

安全边界：

- 运行时代码避免动态代码执行。
- DOM 输出优先使用 `createElement` 和 `textContent`。
- `@connect *` 来自可配置服务地址，是发布时需要透明说明的权限边界。
- `unsafeWindow` 仅限 MBGA 规则模块使用。
- 所有真实安全结论必须结合 Safari 主窗口采样。

## 7. 测试入口

基础验证：

```bash
npm run evaluate:recognition
npm test
npm run check
npm run build
npm run verify:compat
git diff --check
```

Safari 辅助验证：

```bash
npm run validate:safari
npm run investigate:safari-player -- --sample-id <id> --window-type existing_logged_in_window --login-state logged_in
```

Playwright smoke 只能作为辅助：

```bash
npm run smoke:bilibili
npm run capture:bilibili
```

## 8. 迭代注意事项

- 高冲突文件：`src/core/controller.ts`、`src/core/config-store.ts`、`src/types.ts`、`src/ui/styles.ts`、`src/ui/panel.ts`。
- 识别策略改动必须同步样本评估和误杀保护。
- UI 改动必须避免接管原生布局。
- 网络拦截必须先有请求归因和回退策略，不允许宽泛黑名单。
- `dist` 只由构建产生，不应手工编辑。
- 派生工作树产物先进入 integration，再统一回归和 Safari 验收。
