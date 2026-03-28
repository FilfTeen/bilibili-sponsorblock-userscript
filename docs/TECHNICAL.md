# 技术文档

## 工程目标

本工程的技术目标是：

- 在 Tampermonkey 环境中复现核心 SponsorBlock 体验
- 尽量减少对原生页面布局的侵入
- 在 Safari 上稳定工作
- 用统一的本地知识和状态机支撑视频、评论、动态三类增强

## 目录结构

### `src/api`

- `sponsorblock-client.ts`
- `video-label-client.ts`

负责 SponsorBlock 与整视频标签接口访问。

### `src/core`

- 配置、缓存、控制器、整视频标签解析、本地标签与投票状态

其中 [controller.ts](../src/core/controller.ts) 是视频页片段逻辑核心。

### `src/features`

- `thumbnail-labels.ts`
- `comment-filter.ts`
- `dynamic-filter.ts`

负责页面级功能。

### `src/ui`

- 控制台
- 通知浮窗
- 标题胶囊
- 紧凑顶栏
- 预览条
- 样式

### `src/utils`

- 页面识别
- URL / BVID / 哈希
- 商业意图知识
- DOM 与导航工具

### `scripts`

- 构建
- Safari 验证
- 兼容性检查

### `test`

- vitest 单测与回归测试

## 运行模型

### 视频片段链路

1. 解析视频上下文
2. 拉取 SponsorBlock 片段
3. 过滤与分类映射
4. 进入统一状态机
5. 输出为自动跳过、手动提示、静音或高光提示

### 整视频标签链路

1. 尝试 SponsorBlock `full`
2. 尝试整视频标签接口
3. 结合本地页面/评论线索
4. 映射成标题胶囊和缩略图胶囊

### 评论 / 动态链路

1. 监听当前页面组件根节点
2. 抽取文本、商品卡、公开属地字段
3. 交给统一商业意图知识库和本地规则
4. 输出为标记、折叠或属地展示

## 低侵入策略

为避免破坏原生页面，当前工程采取这些约束：

- 尽量追加独立节点，不覆盖原生节点树
- 避免给原生卡片写 `overflow: visible`
- 尽量把定位锚点建立在封面几何信息上，而不是硬编码页面坐标
- 避免 `innerHTML`、`eval`、`new Function`
- 避免长期高频轮询，改用观察器和短时退避

## Safari 约束

Safari 是当前第一优先级环境，因此工程里有一些 Safari 定向策略：

- 支持 `pagehide/pageshow` 和 `BFCache`
- 对小卡片胶囊动画和宽度切换做 Safari 兼容
- 提供 [scripts/safari-validate.py](../scripts/safari-validate.py) 做本机 DOM 级验证

## 测试与发布

最小发布链路：

```bash
npm run check
npm test
npm run build
npm run validate:safari
```

发布产物：

- `dist/bilibili-sponsorblock.user.js`

非发布辅助产物：

- `output/safari/*`
- `output/playwright/*`
