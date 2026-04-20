# 上游对接审计

本报告记录 Bilibili QoL Core v0.3.8 与上游 BilibiliSponsorBlock / SponsorBlock API 的对接差异、已修复问题和保留边界。`v0.3.8` 没有改变上游 API 行为口径，主要用于仓库重命名和 Tampermonkey 更新链路迁移。

## 结论

上游服务当前不是整体不可用。整视频标签反馈失败主要来自来源差异：

- `skipSegments` 返回的 `actionType: "full"` 片段带真实 `UUID`，可以通过 `/api/voteOnSponsorTime` 投票。
- `videoLabels` 返回的是分类摘要，当前只含 `category` 等信息，没有可投票 `UUID`，因此只能展示，不能提交上游反馈。
- 本地推理标签是 `local-signal:*`，只写本地学习，不发送到上游。

## 当前 API 对接

| 能力 | 当前路径 | 上游接口 | 反馈能力 |
| --- | --- | --- | --- |
| 时间片段 | `SponsorBlockClient.getSegments()` | `GET /api/skipSegments/{hashPrefix}` | 片段本身可被处理 |
| 社区 full 标签 | `resolveWholeVideoLabels()` 从 `skipSegments` 选出 `actionType: "full"` | 同上 | 可通过真实 UUID 投票 |
| 整视频标签摘要 | `VideoLabelClient.getVideoLabel()` | `GET /api/videoLabels/{hashPrefix}` | 不可直接投票 |
| 上游投票 | `SponsorBlockClient.vote()` | `POST /api/voteOnSponsorTime?UUID=...&userID=...&type=...` | 仅真实 full UUID |

## 本轮修复

- `429` 不再被当作成功提交；它会作为限流/稍后重试错误处理，且不写入本地投票历史。
- API 请求统一带 `x-ext-version`，便于上游识别客户端版本。
- 不手动设置 `Origin`；这是浏览器控制头，Safari + Tampermonkey 需实机确认。
- 新生成的 userID 改为 36 位 base62，贴近上游扩展形态；已有 UUID 风格 userID 保留不迁移。
- 标题胶囊文案明确区分 `社区 full 标签`、`整视频标签接口结果` 和 `本地推理标签`。

## 保留差异

QoL Core 当前不实现以下上游完整生态能力：

- 片段投稿。
- category vote。
- 撤销投票 `type=20`。
- `/api/viewedVideoSponsorTime` 跳过观看数上报。
- portVideo 搬运视频绑定及投票。

这些差异不影响当前片段跳过和真实 full 标签投票，但如果未来目标是“完整上游扩展能力”，需要另开任务。

## Safari 验收要求

真实投票会改变社区数据，不能由自动化线程擅自执行。人工验收时：

1. 找到一个真实社区 `full` 标签视频。
2. 确认标题胶囊显示可投票按钮。
3. 用户明确允许后点击一次 `标记正确` 或 `标记有误`。
4. 记录通知结果和 HTTP 状态。
5. 找一个 `video-label:*` 或本地推理标签，确认 UI 明确说明不可上游投票。

## 参考源

- [BilibiliSponsorBlock API Wiki](https://github.com/hanydd/BilibiliSponsorBlock/wiki/API)
- [SponsorBlock API Docs](https://wiki.sponsor.ajay.app/w/API_Docs)
- [BilibiliSponsorBlock voteRequest.ts](https://raw.githubusercontent.com/hanydd/BilibiliSponsorBlock/master/src/requests/background/voteRequest.ts)
- [BilibiliSponsorBlock videoLabelRequest.ts](https://raw.githubusercontent.com/hanydd/BilibiliSponsorBlock/master/src/requests/background/videoLabelRequest.ts)
- [BilibiliSponsorBlock background-request-proxy.ts](https://raw.githubusercontent.com/hanydd/BilibiliSponsorBlock/master/src/requests/background-request-proxy.ts)
