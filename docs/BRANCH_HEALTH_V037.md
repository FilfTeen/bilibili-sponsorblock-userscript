# v0.3.7 分支健康记录

本记录来自当前本地仓库的只读审计，用于避免把“未合并”“等价吸收”“脏工作树”混为一类问题。

## 当前基线

- `main`：干净，当前提交 `ed7ff31`。
- `codex/v0.3.7-integration`：干净，当前提交 `ed7ff31`，与 `main` 对齐。
- `codex/BSC_v0_3_7_final_tuning_and_improvement`：本轮活动分支，尚未合入 `main` 属预期。

## 已合入 main 的分支

- `codex/bsc-v037`
- `codex/bsc-v037-Fix_console_display_error`
- `codex/bsc-v037_investigation_of_anomalous_elements_behind_the_playback_window`
- `codex/c-comment-dynamic-recognition-guardrails`
- `codex/local-reasoning-phase1-eval-foundation`
- `codex/mbga-audit-fix`
- `codex/title-badge-long-title-stability`
- `codex/v0.3.7-compact-header-placeholder`
- `codex/v0.3.7-integration`

## 等价吸收但未显示 merged 的分支

这些分支 `git branch --no-merged main` 仍会列出，但 `git cherry main <branch>` 显示为 `-`，说明补丁内容已被 main 等价吸收：

- `codex/b-video-recognition-upgrade`
- `codex/bsc-v037_new_tag_transparency_effect`
- `codex/v0.3.7-console-fix-main-sync`

## 仍需主线程裁决的分支

以下分支存在未等价吸收提交，不能在本线程擅自删除或强行合并：

- `codex/main-docs-sidecar`：识别升级规划文档支线。
- `codex/v0.3.7-player-overlay-audit-fix`：播放器背后异常元素审计补丁。
- `codex/v0.3.7-transparency-audit-fix`：标签透明度审计补丁。

建议主线程后续逐一判断：合入、归档、或重建到当前 main 后重新验证。

## 脏工作树

`/Users/dwight/.codex/worktrees/c5ef/bilibili-sponsorblock-userscript` 当前存在未提交改动：

- `dist/bilibili-sponsorblock.user.js`
- `src/ui/compact-header.ts`
- `src/ui/styles.ts`
- `test/compact-header.test.ts`

这些改动不属于本轮可安全归因范围，因此未提交、未回退、未合并。后续应由主线程确认来源后再处理。

## 安全原则

- 不使用 `git reset --hard`。
- 不删除分支。
- 不丢弃未提交改动。
- 不把未知脏现场混入当前功能收口。
