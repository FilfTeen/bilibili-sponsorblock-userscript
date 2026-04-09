# Safari 主窗口播放器背后文本调查

这份文档用于调查 bilibili 视频页“播放器背后可选中文本”问题，目标是拿到可复核的 Safari 真实环境证据，而不是凭感觉猜。

## 原则

- 真实登录态样本优先复用你当前已登录的 Safari 主窗口或已打开窗口。
- 新开的自动化 Safari 窗口默认不继承登录态，不能直接当主结论依据。
- 在根因确认前，不修改业务代码。
- 单测、Playwright、自动化脚本只能辅助定位，不能替代 Safari 真机结论。

## 准备

1. Safari 打开你要采样的视频页。
2. 若要读取当前页 DOM 证据，先开启 Safari 的 `Allow JavaScript from Apple Events`。
3. 确认当前样本的窗口类型：
   - `existing_logged_in_window`
   - `new_automation_window_logged_in`
   - `new_automation_window_guest`
4. 确认本轮 BSC 配置，尤其是 `compactVideoHeader` 是开还是关。

## 每个样本的固定动作

1. 在播放器顶部区域尝试拖拽，确认是否能选中文字。
2. 如果复现：
   - 保留 1 张整体截图
   - 保留 1 张选区或元素高亮截图
   - 尽量保留 1 段录屏
3. 在当前 Safari 前台标签页执行取证脚本：

```bash
python3 ./scripts/safari-investigate-player-overlay.py \
  --sample-id login-video-main-on \
  --window-type existing_logged_in_window \
  --login-state logged_in \
  --compact-header on \
  --note "selected text reproduced near top edge of player"
```

4. 如果要做同视频对照，切换 `compactVideoHeader` 后重新采一次，只改 `sample-id` 和 `compact-header`。

## 产物

脚本会把证据写到：

```text
output/safari-investigation/*.json
```

每份 JSON 至少包含：

- 当前前台 Safari 窗口名和标签页 URL
- 是否命中 `.bsb-tm-video-header-shell`
- 原生头部、mini-header、自定义 compact header、播放器容器的几何和计算样式
- 当前选区文本、选区矩形、锚点路径、公共祖先路径
- 顶部若干命中点的 `elementFromPoint` 结果

## 结论判定

更像 BSC 需负责：

- 只在 `compactVideoHeader=on` 时出现，关闭后消失或明显减弱
- 选中的节点属于原生头部/标题层，但暴露与 BSC 的隐藏或位移策略直接相关
- `.bili-header__bar.mini-header` 在 BSC 开启后仍参与可选中文本链路

更像 B 站原生：

- BSC 关闭后仍稳定出现
- 原生节点在 BSC 开关前后几何和可选中性几乎不变
- 现象主要随登录态、AB、原生结构变化，而不是随 BSC 紧凑顶栏变化

如果结论是“原生层存在，但被 BSC 暴露或放大”，仍按 BSC 缺陷处理，因为用户面对的是最终行为，而不是责任切割。
