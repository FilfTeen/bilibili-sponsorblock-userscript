# 致谢与 Attribution

感谢原项目作者 `hanydd` 提供了清晰、实用且开源的 Bilibili SponsorBlock 扩展实现:

- 上游项目: [hanydd/BilibiliSponsorBlock](https://github.com/hanydd/BilibiliSponsorBlock)
- 上游许可证: `GPL-3.0`

本仓库是基于上游项目思路进行的派生重写，保留并参考了以下核心方向:

- Bilibili SponsorBlock 的使用目标与问题域
- 主要分类语义
- 基于 `bvid` 哈希前缀请求片段的总体思路
- 片段动作类型和用户交互模式的基本含义

评论区属地显示（开盒）能力另行参考了以下公开 userscript:

- 脚本名称: [B站评论区开盒](https://greasyfork.org/zh-CN/scripts/448434-b%E7%AB%99%E8%AF%84%E8%AE%BA%E5%8C%BA%E5%BC%80%E7%9B%92)
- 原作者: `mscststs`
- 原许可证: `ISC`

本仓库没有将该脚本作为独立依赖直接打包，而是在当前工程内按现有评论增强架构做了适配性整合，主要复用了以下公开思路:

- 优先读取评论 payload 内的 `reply_control.location`
- 对 Bilibili 评论系统中不同实现分支的属地展示入口做兼容
- 在评论时间/操作区附近展示页面已公开提供的属地文本

本仓库与上游的主要差异:

- 运行时从浏览器扩展改写为 Tampermonkey userscript
- 不包含 background script
- 不包含 popup / options 独立页面
- 不包含片段投稿、撤销投票、分类投票、portVideo 等完整扩展生态功能
- 仅对真实社区 `full` 标签提供有限的正确/有误投票入口
- 保留了面向 Tampermonkey 的核心视频跳过能力，并补上了缩略图角标、进度条标记、首页/动态/评论区的核心过滤场景
- 在不引入额外远程依赖的前提下，整合了评论区属地显示（开盒）能力

再次感谢原作者 `hanydd` 与 `mscststs` 对开源社区的贡献。
