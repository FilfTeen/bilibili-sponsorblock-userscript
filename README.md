# Bilibili SponsorBlock Core

一个面向 Tampermonkey 的 Bilibili SponsorBlock 核心脚本。  
它保留了日常最实用的能力: 读取 SponsorBlock 片段、自动或手动跳过、静音片段、播放器进度条标记、缩略图整视频角标、首页/动态页广告过滤、评论区广告过滤，以及本地持久化配置。

## 致谢

本项目是对 [hanydd/BilibiliSponsorBlock](https://github.com/hanydd/BilibiliSponsorBlock) 的派生实现。

- 原项目作者: `hanydd`
- 原项目许可证: `GPL-3.0`
- 本项目沿用了原项目的分类语义、片段请求思路和核心使用场景，但将运行时重写为 Tampermonkey userscript

更多 attribution 请见 [NOTICE.md](./NOTICE.md)。

## 免责声明

使用前请先阅读 [DISCLAIMER.md](./DISCLAIMER.md)。

简要说明:

- 这是非官方派生脚本，不隶属于原作者、Bilibili、SponsorBlock 或 Tampermonkey
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
- `full` 整视频标签提示
- 首页、动态页和空间页的可疑带货动态识别
- 评论区商品卡广告、可疑广告评论和可疑广告回复识别
- Tampermonkey 菜单打开的轻量设置面板
- 本地配置、统计和 TTL 缓存
- 评论/动态过滤的 `隐藏并标记 / 仅标记 / 关闭`
- 单文件发布产物: `dist/bilibili-sponsorblock.user.js`

## 不包含的能力

- 片段投稿
- 投票
- 弹幕跳转
- 快捷键
- popup/options 独立页面

## 安装

### Safari + Tampermonkey

1. 从 App Store 安装 Tampermonkey for Safari。
2. 优先打开这个安装入口:
   [bilibili-sponsorblock.user.js](https://github.com/FilfTeen/bilibili-sponsorblock-userscript/raw/main/dist/bilibili-sponsorblock.user.js)
3. 当 Tampermonkey 弹出安装确认页时，点击 `Install`。
4. 打开任意支持的 Bilibili 视频页。
5. 如需修改设置，在 Tampermonkey 菜单中选择 `Open BSB settings`。

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

统计单独保存在 `bsb_tm_stats_v1`:

- `skipCount`
- `minutesSaved`

## 与原扩展的主要差异

| 项目 | 原扩展 | 本项目 |
| --- | --- | --- |
| 分发形式 | 浏览器扩展 | Tampermonkey 单文件脚本 |
| 运行模型 | background + content scripts | 页内脚本 + 页面桥接 |
| 设置入口 | popup / options 页面 | Tampermonkey 菜单 + 轻量设置面板 |
| 投稿/投票 | 支持 | 不支持 |
| 评论/动态过滤 | 支持 | 支持核心过滤与标记 |
| 预览条 | 支持 | 支持核心进度条标记 |
| 缩略图整视频角标 | 支持 | 支持核心角标模式 |

## 过滤说明

- 评论区过滤目前支持两类信号: 商品卡链接，以及基于关键词/正则的可疑广告文案。
- 当 Bilibili 当前评论组件结构允许时，回复楼层也会沿用同样的识别与隐藏逻辑。
- 动态过滤同样基于商品卡和可疑广告文案两类信号。
- 这部分是启发式过滤，不保证零误判；建议先用 `仅标记` 模式观察，再决定是否启用 `隐藏并标记`。

## 工程说明

- URL 变化监听同时使用 `history` patch、`popstate/hashchange`、`Navigation API` 和低频 fallback，尽量兼容 Bilibili 的 SPA 路由。
- 评论区和回复区大量使用 `shadow DOM`，脚本内部对 `bili-comments` 根节点做增量监听和周期补扫，避免漏处理延迟渲染内容。
- 运行时额外处理了 `pagehide/pageshow` 生命周期，避免 Safari `BFCache` 恢复后脚本失活。
- CI 默认跑 `tsc + vitest + build`，真实页面 smoke test 保留为本地回归命令。

更完整的开发/测试约定见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 本地构建

```bash
npm ci
npm run check
npm test
npm run build
npm run smoke:bilibili
npm run capture:bilibili
```

构建输出:

- `dist/bilibili-sponsorblock.user.js`
- `output/playwright/*.png` `仅当运行 capture 命令时生成`

## GitHub 发布

推送 `v*` 标签后，GitHub Actions 会自动:

1. 安装依赖
2. 运行类型检查
3. 运行测试
4. 构建 userscript
5. 把 `dist/bilibili-sponsorblock.user.js` 上传到 GitHub Release

## 许可证

本项目遵循 `GPL-3.0-only`。详见 [LICENSE](./LICENSE)。
