# v0.3.7 / v0.3.8 / v0.3.9 分支健康记录

本记录来自发布后分支健康复核，用于区分“当前发布状态”和“v0.3.7 功能版审计过程中的历史现场”。

## 当前基线

- `main`：已包含 QoL Core final tuning、`v0.3.7` 功能版、`v0.3.8` 仓库重命名迁移，以及 `v0.3.9` 控制台交互补丁。
- `v0.3.7`：功能版发布 tag，指向提交 `2847455`。
- `v0.3.8`：仓库重命名和 Tampermonkey 更新链路迁移 tag，指向提交 `510717f`。
- `v0.3.9`：控制台 pointer focus / 诊断交互补丁版本。
- 当前仓库 slug：`FilfTeen/bilibili-qol-core-userscript`。
- 当前发布产物：`dist/bilibili-qol-core.user.js`。

## 已进入 main 历史的关键分支

- `codex/v0.3.7-integration`
- `codex/BSC_v0_3_7_final_tuning_and_improvement`
- `codex/repo-rename-qol-core-migration`
- `codex/b-video-recognition-upgrade`
- `codex/c-comment-dynamic-recognition-guardrails`
- `codex/local-reasoning-phase1-eval-foundation`
- `codex/mbga-audit-fix`
- `codex/title-badge-long-title-stability`

## 历史说明

早期审计曾记录 `main` 落后、integration 领先、若干分支显示未 merged、以及旧工作树存在脏现场。这些描述属于 `v0.3.7` 发布前的过程状态，不再代表当前发布状态。

仍保留历史分支或工作树时，应按以下原则处理：

- 不用 `git reset --hard` 或强删未知现场。
- 不把历史脏工作树混入当前发布线。
- 如需复用旧分支内容，先基于当前 `main` 重新审计、重放、验证，再决定是否合入。

## 版本边界

- `v0.3.7` 是功能版：包含 QoL Core final tuning、识别能力、本地推理、UI 稳定性和生态净化能力。
- `v0.3.8` 是迁移版：修正仓库 slug、发布 URL、Tampermonkey `@downloadURL` / `@updateURL` 和工程版本标注。
- `v0.3.9` 是补丁版：修复 QoL Core 控制台的 pointer focus 残留和诊断开关交互反馈，不改变 SponsorBlock / 本地推理 / MBGA 业务口径。

## 安全原则

- 保留 `bsb_tm_*` 存储键作为兼容前缀，不做破坏性迁移。
- 保留 `V037` 文件名作为历史归档，不机械重命名。
- 当前工程说明、安装路径、发布路径和 userscript metadata 必须以 `v0.3.9` / `bilibili-qol-core-userscript` 为准。
