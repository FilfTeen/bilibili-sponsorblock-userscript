# 工程文件索引

本文件用于帮助后续主线程、审计线程和发布线程判断“应该看哪份工程文件”。它不是功能说明本身，而是工程资产地图。

运行时发布基线：tag `v0.3.11` 指向 `2af59cb`，仍是当前 runtime release baseline。

当前 docs-only 主线：`origin/main` / `main` 的实时 HEAD 必须由后续线程运行 `git rev-parse main origin/main` 核对；该状态只代表 governance / evidence 文档状态。未授权新的 runtime release、tag、version bump 或 dist rebuild。接力时以 `git status`、最新 `git log`，以及分别核对 `main` / `origin/main` 和 release tag 的 `git rev-parse` 结果为准。

## 当前入口文件

| 文件 | 用途 | 当前性 |
| --- | --- | --- |
| `README.md` | 面向用户和 GitHub 首页的总说明、安装入口、文档导航。 | 当前主入口。 |
| `CONTRIBUTING.md` | 开发、测试、Safari 验收和发布流程说明。 | 当前开发入口。 |
| `docs/BLUEPRINT.md` | 工程蓝图、能力索引、模块入口、数据边界和测试入口。 | 当前工程总索引。 |
| `docs/MAIN_THREAD_HANDOFF_V0311.md` | 本轮主线程交接手册，给下一任主线程使用。 | 当前接力入口。 |
| `docs/ENGINEERING_FILE_INDEX.md` | 工程文件地图和当前/历史状态说明。 | 当前索引。 |
| `docs/RELEASE_NOTES_V0311.md` | v0.3.11 发布说明和 caveats。 | 当前版本说明。 |
| `docs/SAFARI_ACCEPTANCE_V0311.md` | v0.3.11 Safari 主窗口验收清单。 | 当前验收标准。 |
| `docs/CAPABILITIES.md` | 用户可见能力边界。 | 当前能力说明。 |
| `docs/TECHNICAL.md` | 技术结构、运行链路、存储和安全边界。 | 当前技术说明。 |
| `docs/USER_GUIDE.md` | 面向用户的安装、配置和使用手册。 | 当前用户手册。 |
| `docs/RELIABILITY.md` | 误差、可靠性和本地推理边界。 | 当前可靠性说明。 |
| `docs/UPSTREAM_ALIGNMENT_AUDIT.md` | 与上游 BilibiliSponsorBlock / SponsorBlock API 的差异。 | 当前上游边界说明。 |

## v0.3.12 当前跟踪目标

`v0.3.12` 在当前主线中只是 docs-only evidence / governance milestone，不是 runtime release。运行时代码和发布产物仍以 `v0.3.11` tag `2af59cb` 为发布基线。

| 文件 | 用途 | 当前性 |
| --- | --- | --- |
| `docs/V0312_MBGA_REALITY_EVIDENCE_TARGET.md` | v0.3.12 MBGA Reality Evidence Pass 目标卡、阶段门和线程创建信号。 | 当前主线程跟踪目标。 |
| `docs/V0312_MBGA_SAMPLING_PLAN.md` | v0.3.12 MBGA Safari 主窗口 A/B 采样方案、证据目录和 endpoint 分类表契约。 | G1 已接受，供 Safari 验收线程执行。 |
| `docs/V0312_MBGA_CAPTURE_G2_REVIEW.md` | 主线程对 Safari 主窗口采样交付物的 G2 gate 审核记录。 | G2 已接受，带 caveat，供审计线程复核。 |
| `docs/V0312_MBGA_EVIDENCE_AUDIT.md` | 独立审计线程对 G2 证据链、endpoint 分类和 claim 边界的复核报告。 | PASS WITH CAVEAT。 |
| `docs/V0312_MBGA_G3_DECISION.md` | 主线程 G3 裁决记录，定义默认策略、claim 边界和证据冻结结果。 | G3 已完成，不授权实现。 |
| `docs/V0312_MBGA_REALITY_EVIDENCE.md` | v0.3.12 MBGA Reality Evidence Pass 最终证据报告。 | 当前最终结论，PASS WITH CAVEAT。 |
| `docs/V0312_LOCAL_LEARNING_REALITY_TARGET.md` | v0.3.12 Local Learning Reality Closure 目标卡、隐私边界和线程创建信号。 | G3 已完成的目标卡。 |
| `docs/V0312_LOCAL_LEARNING_SAMPLING_PLAN.md` | v0.3.12 Local Learning Safari 主窗口真实闭环采样方案、存储恢复协议和样本分类表契约。 | G1 已接受，供 Safari 采样线程执行。 |
| `docs/V0312_LOCAL_LEARNING_G1_REVIEW.md` | 主线程对 Local Learning 采样方案的 G1 审核记录和采样 caveats。 | G1 PASS WITH CAVEAT。 |
| `docs/V0312_LOCAL_LEARNING_CAPTURE_G2_REVIEW.md` | 主线程对 Local Learning Safari 采样包的 G2 审核记录。 | G2 BLOCK，需 evidence method repair。 |
| `docs/V0312_LOCAL_LEARNING_EVIDENCE_METHOD_REPAIR.md` | 研究线程对 Local Learning G2 失败后的证据方法修正，定义 clean profile、private raw export、helper 和 downgrade 路径。 | G2 repair 研究交付物，已被主线程接受。 |
| `docs/V0312_LOCAL_LEARNING_G2_REPAIR_DECISION.md` | 主线程对 evidence method repair 的审核和下一步 clean-profile revised capture 裁决。 | 历史 G2R 决策，已被 G3 收束。 |
| `docs/V0312_LOCAL_LEARNING_CLEAN_PROFILE_G2C_REVIEW.md` | 主线程对 clean-profile capture `BLOCKED_NOT_LOGGED_IN` 证据包的审核记录。 | 历史 G2C 阻塞记录，后续已登录重试。 |
| `docs/V0312_LOCAL_LEARNING_AFTER_LOGIN_CAPTURE_G2_REVIEW.md` | 主线程对 clean-profile 登录后续跑 `PASS_CANDIDATE` 证据包的审核记录。 | G2 PASS_CANDIDATE WITH CAVEAT，后续已独立审计。 |
| `docs/V0312_LOCAL_LEARNING_EVIDENCE_AUDIT.md` | 独立审计线程对 clean-profile PASS_CANDIDATE 证据包的复核报告。 | PASS WITH CAVEAT。 |
| `docs/V0312_LOCAL_LEARNING_G3_DECISION.md` | 主线程 G3 裁决记录，定义 Local Learning 证据边界、claim 边界和实现决策。 | G3 已完成，不授权实现。 |
| `docs/V0312_LOCAL_LEARNING_REALITY_EVIDENCE.md` | v0.3.12 Local Learning Reality Closure 最终证据报告。 | 当前最终结论，PASS WITH CAVEAT。 |
| `docs/V0312_LOCAL_LEARNING_DOCS_GOVERNANCE_CLOSURE.md` | 主线程对 Local Learning docs-only 证据包的收尾审核和提交建议。 | Docs governance closed，建议提交。 |
| `docs/V0312_RELEASE_READINESS_TARGET.md` | v0.3.12 Release Readiness Decision 目标卡，判断 docs-only mainline 是否 push、暂停或进入 release/preflight。 | 当前主线程跟踪目标。 |
| `docs/V0312_RELEASE_READINESS_PREFLIGHT.md` | release/preflight 线程对当前 docs-only v0.3.12 主线的只读发布面判断报告。 | DOCS ALIGNMENT NEEDED。 |
| `docs/V0312_RELEASE_READINESS_G1_DECISION.md` | 主线程对 release readiness preflight 的 G1 裁决，授权极窄 docs alignment。 | 当前 release readiness 决策入口。 |
| `docs/V0312_RELEASE_READINESS_G2_DECISION.md` | 主线程对 release readiness docs alignment 的 G2 裁决，决定不发布运行时版本、只提交/推送 docs-only。 | NO RELEASE / PUSH DOCS ONLY。 |

## v0.3.11 证据与现实能力文档

| 文件 | 用途 | 当前性 |
| --- | --- | --- |
| `docs/V0311_REALITY_AUDIT.md` | v0.3.11 现实能力审计起点，标出 MBGA、Safari、Local Learning gaps。 | 历史审计，仍有 gap 价值。 |
| `docs/V0311_FUNCTION_COMPLETENESS_MATRIX.md` | 功能完整性矩阵。 | 历史矩阵，Local Learning 行已被后续实现推进；MBGA gaps 仍有效。 |
| `docs/V0311_MBGA_NETWORK_EVIDENCE.md` | MBGA 网络证据缺口和 A/B 采样计划。 | 当前 MBGA 后续参考。 |
| `docs/V0311_MBGA_AB_CAPTURE.md` | Safari 主窗口 MBGA A/B 采样报告。 | 当前证据，结论仍是 partial。 |
| `docs/V0311_SAFARI_DIAGNOSTICS_SAMPLING.md` | Safari 主窗口诊断采样报告。 | 当前证据，记录了旧脚本重载风险。 |
| `docs/V0311_DOCS_TRUTHFULNESS_PASS.md` | 文档真实性修复记录。 | 当前文案边界参考。 |
| `docs/V0311_SAFARI_ACCEPTANCE_GAPS.md` | v0.3.11 早期 Safari gap 清单。 | 历史 gap 清单，不代表当前 blocker。 |

## 历史归档

| 文件 | 用途 | 当前性 |
| --- | --- | --- |
| `docs/AUDIT_V037.md` | v0.3.7 功能版审计记录。 | 历史归档。 |
| `docs/SAFARI_ACCEPTANCE_V037.md` | v0.3.7 / v0.3.8 Safari 历史验收清单。 | 历史归档。 |
| `docs/BRANCH_HEALTH_V037.md` | v0.3.7 至 v0.3.11 分支健康记录。 | 当前分支状态 + 历史记录。 |
| `docs/FINAL_AUDIT_V039.md` | v0.3.9 BLOCK 审计。 | 历史阻塞记录，P1 已由 v0.3.10 修复。 |
| `docs/SAFARI_PLAYER_OVERLAY_INVESTIGATION.md` | Safari 播放器覆盖层/文本选区调查手册。 | 专项历史/复用手册。 |

## 根目录与构建文件

| 文件 | 用途 |
| --- | --- |
| `package.json` / `package-lock.json` | 包名、版本、脚本和依赖锁定。 |
| `tsconfig.json` | TypeScript 严格检查配置。 |
| `vitest.config.ts` | Vitest + jsdom 测试环境配置。 |
| `scripts/build.mjs` | userscript 构建和 metadata 生成。 |
| `scripts/verify-compat.mjs` | dist 兼容性禁止项检查。 |
| `scripts/evaluate-recognition.mjs` | 识别样本和本地学习评估入口。 |
| `scripts/safari-validate.py` | Safari WebDriver 辅助验证。 |
| `scripts/safari-investigate-player-overlay.py` | Safari 主窗口专项取证。 |
| `scripts/smoke-bilibili.mjs` / `scripts/live-check-bilibili.mjs` | Chromium/Playwright 辅助 smoke，不是 Safari 最终验收。 |

## 当前发布面核对点

- `package.json` version：`0.3.11`
- `src/constants.ts` fallback version：`0.3.11`
- `dist/bilibili-qol-core.user.js` metadata：`@version 0.3.11`
- `@downloadURL` / `@updateURL`：`FilfTeen/bilibili-qol-core-userscript/main/dist/bilibili-qol-core.user.js`
- 旧产物 `dist/bilibili-sponsorblock.user.js`：不应存在
- 内部 `bsb_tm_*`、`BSB_*`、`__BSB_*`：兼容前缀，不是用户可见命名问题

## 维护规则

- 新版本必须更新 `README.md`、`docs/BLUEPRINT.md`、`docs/RELEASE_NOTES_*`、`docs/SAFARI_ACCEPTANCE_*`、`package.json`、`src/constants.ts` 和 dist metadata。
- 审计报告必须明确是当前结论还是历史快照。
- Safari 相关结论必须说明是主窗口、WebDriver、Chrome/Playwright 还是 JSDOM 证据。
- 大型原始证据留在 ignored `output/`，长期结论提炼进 `docs/`。
- 不要机械重命名历史文件；需要改当前性时，在文件顶部加 status note。
