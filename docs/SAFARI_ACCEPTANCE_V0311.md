# Safari 验收清单 v0.3.11

## 前提

- 必须在已登录 Safari 主窗口中验收。
- 必须在 Tampermonkey 中重载当前 `dist/bilibili-qol-core.user.js`。
- 不能只看 userscript `@version` 判断 integration dist 是否正确；必须验证页面行为、控制台内容和诊断报告。
- Chrome、Playwright、Safari WebDriver 和新开的自动化 Safari 窗口只能作为辅助证据。
- 验收时不要移动、重写或复用旧 tag；`v0.3.11` 应是新发布线。

## 版本与产物

- Tampermonkey 脚本显示 `Bilibili QoL Core`。
- 诊断报告显示 `Version: 0.3.11`。
- `dist/bilibili-qol-core.user.js` 是实际重载产物。
- 旧产物 `dist/bilibili-sponsorblock.user.js` 不存在。
- `@downloadURL` 和 `@updateURL` 指向 `FilfTeen/bilibili-qol-core-userscript/main/dist/bilibili-qol-core.user.js`。

## Local Learning Management

- 打开 QoL Core 控制台的 `帮助 / 反馈` 页。
- 本地学习管理卡片可以显示本地视频学习记录，包括手动保留、手动忽略和自动信号。
- 删除单条本地视频学习记录后，列表立即刷新，不泄露评论原文。
- 清空视频记录需要二次确认，取消或失败时不能丢失可见记录。
- 评论反馈锁只显示数量和更新时间，不展示评论文本、哈希或用户敏感信息。
- 清空评论反馈锁需要二次确认，失败时应有可恢复状态。
- 删除本地记录后，确认不会写入新的永久压制标记；后续自动推理仍可按现有规则再次命中。
- 保留 caveat：评论扫描触发自动写入仍需更多稳定真实评论样本验证。

## MBGA 与诊断

- 关闭 MBGA 后重载页面，诊断报告应显示 MBGA empty 或无新增 MBGA records。
- 开启 MBGA 后重载视频页，诊断报告应包含 MBGA decision telemetry 摘要。
- 诊断报告里的 MBGA sample URL 只保留脱敏、归一化后的可读信息，不包含 query/hash、token、cookie、authorization、用户 ID 或评论原文。
- Native request guard snapshot 能区分 supported page、compact header readiness 和最近记录。
- MBGA 文案必须保持 best-effort / partial / experimental，不得宣称完整隐私防护、完整遥测阻断或完整 PCDN/WebRTC 禁用。
- PCDN / WebRTC 子项作为实验能力验证，重点确认开启后不破坏播放、弹幕、直播、互动或登录态。

## 核心页面抽查

- 普通 `/video/`：标题胶囊、popover、评论标签、评论反馈入口、紧凑顶栏、通知浮窗正常。
- `/bangumi/`：网页全屏时紧凑顶栏隐藏；退出后恢复。
- `search.bilibili.com`：缩略图标签不挤压卡片，不挂载紧凑顶栏。
- `t.bilibili.com` 与 `space.bilibili.com`：动态标签与折叠/恢复入口不误伤普通内容。
- `/read/cv*`：文章复制解锁若页面 DOM 支持，应按 best-effort 生效；不支持时不能破坏阅读。
- `live.bilibili.com`：当前不要把 live MBGA 当成已完整支持；只记录是否有明显副作用。

## 控制台与 UI

- Tampermonkey 菜单只显示 QoL Core 相关入口。
- Native select、输入框、颜色预览、透明度开关和诊断开关没有持续卡住的点击态。
- 控制台滚动、二阶段确认、删除动画和 reduced-motion 场景正常。
- 诊断报告复制可用，页面 URL 不包含 query/hash。

## 通过标准

- 自动验证链全绿。
- Safari 主窗口没有 P0/P1 交互或隐私问题。
- Local Learning Management 能完成查看、删除、清空和失败恢复路径。
- MBGA 诊断证据存在，但 release notes 仍保持保守 caveat。
- 若无法完成真实评论有机扫描样本，必须在 release 结论中保留 caveat。
