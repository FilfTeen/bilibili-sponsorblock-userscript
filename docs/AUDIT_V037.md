# BSC v0.3.7 审计记录

本记录基于 `codex/BSC_v0_3_7_final_tuning_and_improvement` 分支当前实现。审计范围包括菜单入口、功能蓝图、代码结构、安全边界、UI 一致性和测试链路。

## 结论摘要

- Tampermonkey 菜单重复控制台入口已修复，状态：`fixed`。
- 文档体系已从过期 v0.3.6 说明更新为 v0.3.7 蓝图索引，状态：`fixed`。
- 运行时未发现 `eval`、`new Function`、字符串定时器或外部数据写入 HTML 的动态代码执行路径，状态：`false-positive`。
- `@connect *` 仍是必要但宽泛的 Tampermonkey 权限，状态：`documented-risk`。
- MBGA 使用 `unsafeWindow` 和少量页面侧 monkey patch，属于能力边界内的高敏区域，状态：`documented-risk`。
- Safari 主窗口人工验收尚未由本线程完成，状态：`needs-main-thread-decision`。

## A-001 Tampermonkey 菜单重复控制台入口

- Rule ID: UI-MENU-001
- Severity: Low
- Location: `src/main.ts`
- Status: `fixed`
- Evidence: 旧实现同时注册 `打开 BSB 控制台` 和 `切换 BSB 控制台`，在 Tampermonkey 菜单中形成两个控制台入口。
- Impact: 用户无法判断哪个入口是正确控制台入口，截图中已出现重复感知。
- Fix: 抽出 `src/runtime/menu.ts`，仅注册 `打开 BSB 控制台`、`打开 BSB 帮助`、`清理 BSB 缓存`，保留 controller 的 `togglePanel()` 供站内入口使用。
- Verification: `test/menu.test.ts` 锁定菜单标签数量、顺序和回调。

## A-002 文档版本和能力描述漂移

- Rule ID: DOC-001
- Severity: Medium
- Location: `README.md`、`docs/CAPABILITIES.md`、`docs/TECHNICAL.md`、`docs/USER_GUIDE.md`、`docs/RELIABILITY.md`
- Status: `fixed`
- Evidence: README 标题仍为 v0.3.6；能力说明编号错乱；低侵入 UI 段落重复；维护工具说明和当前功能混杂。
- Impact: 后续派生线程可能基于过期文档做错误实现或错误验收。
- Fix: 新增 `docs/BLUEPRINT.md` 作为总索引，并重写核心说明文档。
- Verification: 人工核对文档和源码入口；全量测试保证文档改动未影响构建。

## A-003 DOM 注入安全

- Rule ID: JS-XSS-001
- Severity: Low
- Location: `src/ui/*`、`src/features/comment-filter.ts`、`src/features/dynamic-filter.ts`、`src/features/thumbnail-labels.ts`
- Status: `false-positive`
- Evidence: 运行时 UI 主要通过 `document.createElement`、`textContent`、`append` 和事件监听构建。搜索未发现运行时把外部数据写入 HTML sink 的主链路。
- Impact: 当前未发现可证明的 DOM XSS 路径。
- Fix: 无需修复；继续要求新增 UI 使用 DOM API。
- False positive notes: 测试和 smoke fixture 使用 `innerHTML` 构造测试 DOM，不属于运行时注入。

## A-004 MBGA 静态 HTML 片段

- Rule ID: JS-XSS-001
- Severity: Low
- Location: `src/features/mbga/core.ts`
- Status: `fixed`
- Evidence: MBGA 视频裁切按钮曾使用静态 `innerHTML` 模板构造 B 站样式开关。
- Impact: 模板为固定字符串，当前没有外部输入流入，实际安全风险低；但与工程“运行时尽量避免 innerHTML”的规范不一致。
- Fix: 已改成 `createElement`、`textContent` 和 `append` 显式构造。
- Verification: `test/mbga.test.ts` 覆盖裁切按钮注入和 `video-fit` 状态切换。

## A-005 MBGA head 扫描读取 HTML 字符串

- Rule ID: JS-XSS-001
- Severity: Low
- Location: `src/features/mbga/core.ts`
- Status: `fixed`
- Evidence: MBGA PCDN URL 替换逻辑曾通过读取 `document.head.innerHTML` 搜索 bilivideo CDN 域名。
- Impact: 这是只读路径，不会执行 HTML，但会让安全审计持续命中 HTML sink 关键词。
- Fix: 已改为扫描 head 中 `src`、`href`、`content` 属性和 `textContent`，不再读取 HTML 字符串。
- Verification: `test/mbga.test.ts` 覆盖 PCDN 规则基础行为。

## A-006 `@connect *` 权限

- Rule ID: NET-001
- Severity: Medium
- Location: `scripts/build.mjs`
- Status: `documented-risk`
- Evidence: userscript banner 声明 `@connect *`。
- Impact: Tampermonkey 网络授权范围较宽。原因是 SponsorBlock 服务地址可由用户配置，静态列举域名会破坏可配置性。
- Fix: 本轮不直接收窄，避免破坏备用服务能力。
- Mitigation: README 和技术文档已说明网络请求范围；后续如固定服务地址，可改成域名白名单。

## A-007 页面桥接和 `unsafeWindow`

- Rule ID: BRIDGE-001
- Severity: Medium
- Location: `src/platform/page-bridge.ts`、`src/features/mbga/core.ts`
- Status: `documented-risk`
- Evidence: 页面桥接注入脚本读取页面状态；MBGA 使用 `unsafeWindow` 修改页面侧 API。
- Impact: 这是 userscript 与页面上下文交互的高敏边界，错误实现可能影响页面行为。
- Fix: 本轮不改变能力边界。
- Mitigation: 保持桥接事件命名私有化、request id 对应响应、MBGA 规则化开关和测试覆盖。

## A-008 UI 一致性

- Rule ID: UI-001
- Severity: Low
- Status: `fixed`
- Evidence: 最近调优已对颜色卡、真实胶囊预览、动画恢复、阴影预算和内部控件 hover 反馈做了收口。
- Impact: 当前代码层未发现明显重复浮窗、常驻取消按钮或两个控制台入口问题。
- Fix: 本轮仅补菜单入口和文档，不继续扩展视觉改动。
- Verification: `test/styles.test.ts`、`test/panel.test.ts`、`test/menu.test.ts`。

## A-009 Safari 实机验收缺口

- Rule ID: SAFARI-001
- Severity: Medium
- Status: `needs-main-thread-decision`
- Evidence: 本线程可运行自动化和 Safari 辅助校验，但未直接完成用户主窗口手动截图/录屏验收。
- Impact: 菜单截图问题必须在 Safari 主窗口中重载脚本后复验，自动化无法完全替代。
- Required acceptance: Tampermonkey 菜单只显示 `打开 BSB 控制台` 一个控制台入口；控制台、标题胶囊、评论标签、动态标签、紧凑顶栏、MBGA 不出现明显 UI 打架。

## 后续建议

- 评估是否将 `@connect *` 收窄为默认服务域名和用户显式备用域名策略。
- 发布前按 `docs/SAFARI_ACCEPTANCE_V037.md` 补齐 Safari 主窗口截图或录屏证据。
