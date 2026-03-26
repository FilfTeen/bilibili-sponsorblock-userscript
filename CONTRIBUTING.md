# Contributing

## 开发目标

这个仓库的目标不是把原扩展逐按钮搬到 userscript，而是在 Tampermonkey 约束下，稳定交付最常用、最有价值的 Bilibili SponsorBlock 体验。

开发时优先级:

1. 真实页面能稳定识别视频上下文并正确处理片段。
2. 首页、动态页、评论区等高频场景不因 Bilibili 的 SPA 和 shadow DOM 而漏处理。
3. 误判和误伤要可恢复，交互必须留有显式开关和回退路径。
4. 任何新增能力都必须附带对应测试或 smoke 覆盖。

## 本地开发

```bash
npm ci
npm run check
npm test
npm run build
```

生成产物:

- `dist/bilibili-sponsorblock.user.js`

## 真实页面回归

本仓库保留一个本地 smoke:

```bash
npm run smoke:bilibili
```

默认会调用本机 Chrome:

- `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

如果要换浏览器路径，可设置:

- `BSB_SMOKE_BROWSER_PATH`

当前 smoke 至少覆盖:

- 首页浮动入口按钮
- 首页/动态样式内容过滤
- 视频页 SponsorBlock 请求链路
- 评论主楼过滤
- 评论回复过滤

## 测试要求

- `test/video-context.test.ts`
  负责视频 ID / `cid` / `page` 解析场景
- `test/navigation.test.ts`
  负责 SPA 路由变化监听
- `test/comment-filter.test.ts`
  负责主评论和回复评论过滤
- `test/dynamic-filter.test.ts`
  负责动态广告识别

提交前至少应通过:

```bash
npm run check
npm test
npm run build
```

涉及真实页面逻辑、Bilibili DOM 结构、评论区或播放器改动时，额外要求:

```bash
npm run smoke:bilibili
```

## 发布流程

1. 确认 `main` 上 `check/test/build` 全绿。
2. 更新版本号。
3. 构建 `dist/bilibili-sponsorblock.user.js`。
4. 打 `v*` tag。
5. 推送 tag 触发 GitHub Actions release。

## 代码风格

- 优先写可测试的纯函数，再接 DOM 控制器。
- 涉及 Bilibili 页面结构时，优先通过小范围 helper 隔离选择器和 shadow DOM 访问。
- 对网络数据一律做显式白名单校验，不信任远端 payload。
- 对误判风险高的功能，优先提供 `label` 模式，再考虑 `hide`。
