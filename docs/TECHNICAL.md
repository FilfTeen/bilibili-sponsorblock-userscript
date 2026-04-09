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
-### UI 体系与交互加固

为了保证在 Tampermonkey 环境下的极致稳定性，脚本实现了一套响应式但“无感”的 UI 体系：

- **状态持久化反馈 (Active Feedbacks)**：使用 `activeFeedbacks` Map 跟踪各项异步操作（如清理缓存）的状态。状态信息跨越 UI 重绘周期（Re-render）持久存在，并在 3 秒后自动清理。
- **二阶段确认逻辑 (Safety Confirmation)**：针对具有破坏性的维护操作（如重置设置），引入了 `pendingConfirmations` 机制。首次点击进入“确认中”状态，配合 `bsb-pulse` 红色动效预警；只有再次点击才会执行实际逻辑，最大限度防止误触。
- **滚动位置保护 (Scroll Preservation)**：在 `SettingsPanel.render(preserveScroll = true)` 中，通过缓存和恢复 `scrollTop` 确保面板在状态更新后不会产生位置跳变，保证了连续操作时的视觉连贯性。
- **原子级样式隔离**：所有的维护工具按钮使用独立定义的 CSS 变量（如 `--bsb-danger-rgb`），确保即使在 B 站原生样式大幅变动时，维护工具依然拥有高对比度的清晰视觉表现。

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
- 紧凑视频顶部栏把“原生 placeholder 来源”“实际显示 placeholder”“空输入搜索 placeholder”拆成三层逻辑；显示和搜索各自有独立开关，避免出现用户看不见却仍被拿去搜索的反直觉行为

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
