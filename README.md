# Bilibili SponsorBlock Core

一个面向 Tampermonkey 的 Bilibili SponsorBlock 核心脚本。  
它保留了日常最实用的能力: 读取 SponsorBlock 片段、自动或手动跳过、静音片段、整视频标签提示、页内轻量设置面板，以及本地持久化配置。

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
- 页内设置按钮与设置面板
- 本地配置、统计和 TTL 缓存
- 单文件发布产物: `dist/bilibili-sponsorblock.user.js`

## 不包含的能力

- 片段投稿
- 投票
- 评论区/动态广告过滤
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
5. 在播放器附近使用 `BSB` 按钮打开设置面板。

### 其他支持 Tampermonkey 的浏览器

同样使用上面的 GitHub Release 链接安装即可。

## 支持页面

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
| 评论/动态过滤 | 支持 | 不支持 |
| 预览条 | 支持 | 不支持 |

## 本地构建

```bash
npm ci
npm run check
npm run build
```

构建输出:

- `dist/bilibili-sponsorblock.user.js`

## GitHub 发布

推送 `v*` 标签后，GitHub Actions 会自动:

1. 安装依赖
2. 运行类型检查
3. 构建 userscript
4. 把 `dist/bilibili-sponsorblock.user.js` 上传到 GitHub Release

## 许可证

本项目遵循 `GPL-3.0-only`。详见 [LICENSE](./LICENSE)。
