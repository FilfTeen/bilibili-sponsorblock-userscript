# Bilibili SponsorBlock Userscript (v0.3.6)

> [!TIP]
> **最新更新 v0.3.6**: 强化了维护工具的安全性（二阶段确认、醒目色彩预警）并修复了网页全屏下的 UI 遮挡问题。

这是一个受 [SponsorBlock](https://sponsor.ajay.app/) 启发，专为 Bilibili 打造的跳过视频广告片段、标记商业内容的 Tampermonkey 脚本。

## 核心特性

- **广告跳过**：自动或手动跳过 SponsorBlock 数据库中已有的 B 站视频广告片段。
- **整视频标签**：在视频标题前显示商业性质标签（如：商单、导流、互动视频等）。
- **缩略图标记**：在首页、搜索页、历史记录及推荐列表的视频封面通过“胶囊标签”直观标记。
- **维护工具硬化 (New)**：清理缓存与重置设置支持二阶段安全确认，界面操作更稳健，防止误触。
- **全屏优化**：紧凑型顶部栏在网页全屏/全屏模式下自动隐藏，提供零干扰观影。

## 文档导航

- 项目概览与安装: [README.md](./README.md)
- 使用手册: [docs/USER_GUIDE.md](./docs/USER_GUIDE.md)
- 能力说明: [docs/CAPABILITIES.md](./docs/CAPABILITIES.md)
- 技术文档: [docs/TECHNICAL.md](./docs/TECHNICAL.md)
- 误差与可靠性说明: [docs/RELIABILITY.md](./docs/RELIABILITY.md)
- 免责声明: [DISCLAIMER.md](./DISCLAIMER.md)
- Attribution: [NOTICE.md](./NOTICE.md)

## 致谢

本项目是对 [hanydd/BilibiliSponsorBlock](https://github.com/hanydd/BilibiliSponsorBlock) 的派生实现，并额外吸收了其他开源 userscript 的单点能力。

- 原项目作者: `hanydd`
- 原项目许可证: `GPL-3.0`
- 本项目沿用了原项目的分类语义、片段请求思路和核心使用场景，但将运行时重写为 Tampermonkey userscript
- 评论区属地显示（开盒）功能参考并适配了 [mscststs / B站评论区开盒](https://greasyfork.org/zh-CN/scripts/448434-b%E7%AB%99%E8%AF%84%E8%AE%BA%E5%8C%BA%E5%BC%80%E7%9B%92) 的公开实现思路，原脚本许可证为 `ISC`

更多 attribution 请见 [NOTICE.md](./NOTICE.md)。

## 免责声明

使用前请先阅读 [DISCLAIMER.md](./DISCLAIMER.md)。

简要说明:

- 这是非官方派生脚本，不隶属于原作者、Bilibili、SponsorBlock 或 Tampermonkey
- 评论区属地显示功能只会读取 Bilibili 当前评论 payload 或页面已经公开提供的属地字段，不会额外探测或推断用户真实地理位置
- 脚本可能因 Bilibili 页面结构、接口、第三方服务或浏览器策略变化而失效
- 脚本只会根据配置访问 SponsorBlock 服务地址并在本地保存配置/缓存
- 由此脚本造成的误跳过、误静音、兼容性问题或账号/浏览体验风险，需要由使用者自行判断和承担

## 当前功能

- 按 `bvid` 请求 SponsorBlock 片段
- 分类级别的 `自动 / 手动 / 仅提示 / 关闭`
- `skip` 片段自动或手动跳过
- `mute` 片段自动或手动静音
- `poi_highlight` 高光点提示与跳转
- 视频页进度条片段预览条
- 首页、搜索页、播放页推荐区等位置的整视频缩略图角标
- 视频页标题前的 `full` 整视频标签胶囊
- 整视频标签的 `标记正确 / 标记有误` 反馈入口
- 播放器控制栏内的 SponsorBlock 盾牌按钮
- 首页、动态页和空间页的可疑带货动态识别
- 评论区商品卡广告、可疑广告评论和可疑广告回复识别
- 评论区属地显示（开盒），默认开启
- 统一商业意图知识库驱动的页面/评论/动态本地识别与本地学习
- 分栏式设置 / 帮助控制台
- 本地配置、统计和 TTL 缓存
- 评论/动态过滤的 `隐藏并标记 / 仅标记 / 关闭`
- 单文件发布产物: `dist/bilibili-sponsorblock.user.js`

## 不包含的能力

- 片段投稿
- 通用片段投票和投稿
- 弹幕跳转
- 快捷键
- 浏览器扩展专属的 popup/options 独立页面

## 安装

### Safari + Tampermonkey

1. 从 App Store 安装 Tampermonkey for Safari。
2. 优先打开这个安装入口:
   [bilibili-sponsorblock.user.js](https://github.com/FilfTeen/bilibili-sponsorblock-userscript/raw/main/dist/bilibili-sponsorblock.user.js)
3. 当 Tampermonkey 弹出安装确认页时，点击 `Install`。
4. 打开任意支持的 Bilibili 视频页。
5. 进入视频页后，可以通过播放器控制栏里的 SponsorBlock 盾牌按钮，或 Tampermonkey 菜单里的 `打开 BSB 控制台` 进入设置。

如果 Safari 直接把脚本当作普通文本页打开，没有弹出安装确认页:

1. 打开 `Tampermonkey Dashboard -> Utilities`。
2. 在 `Import from URL` 中粘贴:
   `https://raw.githubusercontent.com/FilfTeen/bilibili-sponsorblock-userscript/main/dist/bilibili-sponsorblock.user.js`
3. 手动导入并启用。

### 其他支持 Tampermonkey 的浏览器

同样使用上面的 raw GitHub 链接安装即可。Release 页面仍保留构建产物，便于版本归档。

## 支持页面

- `https://www.bilibili.com/*`
- `https://search.bilibili.com/*`
- `https://t.bilibili.com/*`
- `https://space.bilibili.com/*`

其中视频片段能力主要覆盖:

- `https://www.bilibili.com/video/*`
- `https://www.bilibili.com/list/*`
- `https://www.bilibili.com/medialist/play/*`
- `https://www.bilibili.com/bangumi/*` `best effort`
- `https://www.bilibili.com/festival/*` `best effort`
- `https://www.bilibili.com/opus/*` `best effort`

URL 解析额外兼容:

- `BV` 直链
- `av` 直链
- `list / medialist` 场景下的 `bvid / aid / cid` 查询参数

## 配置项

配置保存在 Tampermonkey 存储键 `bsb_tm_config_v1` 下:

- `enabled`
- `serverAddress`
- `enableCache`
- `noticeDurationSec`
- `minDurationSec`
- `showPreviewBar`
- `thumbnailLabelMode`
- `categoryModes`
- `dynamicFilterMode`
- `dynamicRegexPattern`
- `dynamicRegexKeywordMinMatches`
- `commentFilterMode`
- `commentHideReplies`
- `commentLocationEnabled`

更完整的配置解释见 [docs/USER_GUIDE.md](./docs/USER_GUIDE.md)。

统计单独保存在 `bsb_tm_stats_v1`:

- `skipCount`
- `minutesSaved`

## 与原扩展的主要差异

| 项目 | 原扩展 | 本项目 |
| --- | --- | --- |
| 分发形式 | 浏览器扩展 | Tampermonkey 单文件脚本 |
| 运行模型 | background + content scripts | 页内脚本 + 页面桥接 |
| 设置入口 | popup / options 页面 | Tampermonkey 菜单 + 分栏式控制台 + 播放器按钮 |
| 投稿/投票 | 支持 | 支持整视频标签反馈，暂不支持完整投稿工作流 |
| 评论/动态过滤 | 支持 | 支持核心过滤与标记 |
| 预览条 | 支持 | 支持核心进度条标记 |
| 缩略图整视频角标 | 支持 | 支持核心角标模式 |
| 标题区商业标签 | 支持 | 支持 |

## 过滤说明

- 评论区过滤目前支持两类信号: 商品卡链接，以及基于关键词/正则的可疑广告文案。
- 评论区属地显示默认开启，但只会在 Bilibili 当前评论数据本身包含属地字段时显示；如果页面返回里没有该字段，脚本不会伪造或猜测属地信息。
- 当 Bilibili 当前评论组件结构允许时，回复楼层也会沿用同样的识别与隐藏逻辑。
- 动态过滤同样基于商品卡和可疑广告文案两类信号。
- 这部分是启发式过滤，不保证零误判；建议先用 `仅标记` 模式观察，再决定是否启用 `隐藏并标记`。
- 本地判断、自学习记录、评论/动态线索与 SponsorBlock 社区标签之间可能出现阶段性不一致，详见 [docs/RELIABILITY.md](./docs/RELIABILITY.md)。

## 当前 UI 说明

- 首页、搜索页和视频页右侧推荐区的整视频商业标签，会以左上角 SponsorBlock 盾牌角标的形式出现。
- 当整个视频被社区标记为某个商业分类时，视频标题前会显示彩色胶囊。点击胶囊可以打开说明和反馈按钮。
- 视频播放器控制栏会插入 SponsorBlock 盾牌按钮，用于快速打开当前脚本的设置 / 帮助控制台。
- 评论区和动态过滤默认关闭，建议先在控制台中切到 `仅标记，不隐藏` 观察效果，再决定是否启用隐藏。

## 工程说明

- URL 变化监听同时使用 `history` patch、`popstate/hashchange`、`Navigation API` 和低频 fallback，尽量兼容 Bilibili 的 SPA 路由。
- 评论区和回复区大量使用 `shadow DOM`，脚本内部对 `bili-comments` 根节点做增量监听，并在根节点尚未出现时使用短时退避补扫，避免长期高频轮询。
- 运行时额外处理了 `pagehide/pageshow` 生命周期，避免 Safari `BFCache` 恢复后脚本失活。
- 运行时代码避免 `innerHTML`、`eval`、`new Function` 这类高风险路径，主要通过 DOM API 和 Tampermonkey 授权接口工作。
- CI 默认跑 `tsc + vitest + build`，Safari 本机回归额外提供 `validate:safari` 脚本。

更完整的开发/测试约定见 [CONTRIBUTING.md](./CONTRIBUTING.md) 和 [docs/TECHNICAL.md](./docs/TECHNICAL.md)。

## 本地构建

```bash
npm ci
npm run check
npm test
npm run build
npm run smoke:bilibili
npm run capture:bilibili
npm run validate:safari
```

构建输出:

- `dist/bilibili-sponsorblock.user.js`
- `output/playwright/*.png` `仅当运行 capture 命令时生成`
- `output/safari/*` `仅当运行 Safari 验证命令时生成`

## GitHub 发布

推送 `v*` 标签后，GitHub Actions 会自动:

1. 安装依赖
2. 运行类型检查
3. 运行测试
4. 构建 userscript
5. 把 `dist/bilibili-sponsorblock.user.js` 上传到 GitHub Release

## 许可证

本项目遵循 `GPL-3.0-only`。详见 [LICENSE](./LICENSE)。
