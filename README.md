# Bilibili SponsorBlock Core

一个面向 Tampermonkey 的 Bilibili SponsorBlock 核心脚本。  
它保留了日常最实用的能力: 读取 SponsorBlock 片段、自动或手动跳过、静音片段、整视频标签提示、首页/动态页广告过滤、评论区广告过滤、页内轻量设置面板，以及本地持久化配置。

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
- `full` 整视频标签 banner
- 首页、动态页和空间页的可疑带货动态识别
- 评论区商品卡广告和可疑广告评论识别
- 主页浮动入口按钮 + 视频页就近入口按钮
- 页内设置按钮与设置面板
- 本地配置、统计和 TTL 缓存
- 评论/动态过滤的 `隐藏并标记 / 仅标记 / 关闭`
- 单文件发布产物: `dist/bilibili-sponsorblock.user.js`

## 不包含的能力

- 片段投稿
- 投票
- 预览条复刻
- 弹幕跳转
- 快捷键
- popup/options 独立页面

## 安装

### Safari + Tampermonkey

1. 从 App Store 安装 Tampermonkey for Safari。
2. 打开最新发布文件:
   [bilibili-sponsorblock.user.js](https://github.com/FilfTeen/bilibili-sponsorblock-userscript/releases/latest/download/bilibili-sponsorblock.user.js)
3. 让 Tampermonkey 导入并启用脚本。
4. 打开任意支持的 Bilibili 视频页。
5. 在播放器附近或首页右下角使用 `BSB` 按钮打开设置面板。

### 其他支持 Tampermonkey 的浏览器

同样使用上面的 GitHub Release 链接安装即可。

## 支持页面

- `https://www.bilibili.com/*`
- `https://search.bilibili.com/*`
- `https://t.bilibili.com/*`
- `https://space.bilibili.com/*`

其中视频片段能力主要覆盖:

- `https://www.bilibili.com/video/*`
- `https://www.bilibili.com/list/*`
- `https://www.bilibili.com/bangumi/*` `best effort`
- `https://www.bilibili.com/festival/*` `best effort`

## 配置项

配置保存在 Tampermonkey 存储键 `bsb_tm_config_v1` 下:

- `enabled`
- `serverAddress`
- `enableCache`
- `noticeDurationSec`
- `minDurationSec`
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
| 设置入口 | popup / options 页面 | 播放器附近按钮 + 页内面板 |
| 投稿/投票 | 支持 | 不支持 |
| 评论/动态过滤 | 支持 | 支持核心过滤与标记 |
| 预览条 | 支持 | 不支持 |

## 过滤说明

- 评论区过滤目前支持两类信号: 商品卡链接，以及基于关键词/正则的可疑广告文案。
- 动态过滤同样基于商品卡和可疑广告文案两类信号。
- 这部分是启发式过滤，不保证零误判；建议先用 `仅标记` 模式观察，再决定是否启用 `隐藏并标记`。

## 本地构建

```bash
npm ci
npm run check
npm test
npm run build
npm run smoke:bilibili
```

构建输出:

- `dist/bilibili-sponsorblock.user.js`

## GitHub 发布

推送 `v*` 标签后，GitHub Actions 会自动:

1. 安装依赖
2. 运行类型检查
3. 运行测试
4. 构建 userscript
5. 把 `dist/bilibili-sponsorblock.user.js` 上传到 GitHub Release

## 许可证

本项目遵循 `GPL-3.0-only`。详见 [LICENSE](./LICENSE)。
