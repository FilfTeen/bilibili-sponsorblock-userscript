# 致谢与 Attribution

感谢原项目作者 `hanydd` 提供了清晰、实用且开源的 Bilibili SponsorBlock 扩展实现:

- 上游项目: [hanydd/BilibiliSponsorBlock](https://github.com/hanydd/BilibiliSponsorBlock)
- 上游许可证: `GPL-3.0`

本仓库是基于上游项目思路进行的派生重写，保留并参考了以下核心方向:

- Bilibili SponsorBlock 的使用目标与问题域
- 主要分类语义
- 基于 `bvid` 哈希前缀请求片段的总体思路
- 片段动作类型和用户交互模式的基本含义

本仓库与上游的主要差异:

- 运行时从浏览器扩展改写为 Tampermonkey userscript
- 不包含 background script
- 不包含 popup / options 独立页面
- 不包含投稿、投票、评论/动态过滤、预览条等扩展专属功能

再次感谢原作者 `hanydd` 对开源社区的贡献。
