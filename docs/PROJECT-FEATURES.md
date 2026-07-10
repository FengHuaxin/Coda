# Coda 项目功能概览

> 扫描时间：2026-06-29 | 版本：0.1.0

## 一句话定位

**Coda 是一个面向 AI 编码的可恢复工作流与 Skill 平台**，将 OpenSpec 规范、Superpowers 方法论、Skill 创建/评估/发布统一到一个跨平台 Node.js 运行时中。

---

## 核心能力

### 1. 五阶段可恢复工作流

| 阶段 | 命令 | 职责 | 产出 |
|------|------|------|------|
| 1. Open | `/Coda-open` | 提案、设计、任务拆分 | proposal.md, design.md, tasks.md |
| 2. Design | `/Coda-design` | 深度设计（头脑风暴、设计文档） | Design Doc, delta spec |
| 3. Build | `/Coda-build` | 实现计划、代码提交 | 实现计划、代码 |
| 4. Verify | `/Coda-verify` | 测试验证、分支处理 | 验证报告 |
| 5. Archive | `/Coda-archive` | delta spec 同步、归档 | 归档记录 |

**预设快捷路径：**
- `/Coda-hotfix` — 快速修复（跳过头脑风暴）
- `/Coda-tweak` — 轻量变更（OpenSpec 链式，delta spec 优先）

### 2. Skill 平台

- **安装/管理 Skill**：`Coda skill add/show/run/continue/check`
- **创建可分发 Skill**：`/Coda-any` → `Coda eval` → `Coda publish` 完整流程
- **Bundle 系统**：将 Skill 编译为跨平台可分发的 Bundle 包
- **评估系统**：`Coda eval` 对 Skill 进行基准测试和质量验证

### 3. 31 个 AI 平台支持

Claude Code、Cursor、Codex、OpenCode、Windsurf、Cline、RooCode、Continue、GitHub Copilot、Gemini CLI、Amazon Q、Qwen Code、Kilo Code、Auggie、Kimi Code、Kiro、Lingma、Junie、CodeBuddy、CoStrict、Crush、Factory Droid、iFlow、Pi、Qoder、Antigravity、Bob Shell、ForgeCode、Trae、Trae CN、ZCode、MimoCode

---

## CLI 命令清单

### 基础命令

| 命令 | 功能 |
|------|------|
| `Coda init [path]` | 初始化工作流，选择平台、作用域、语言 |
| `Coda status [path]` | 显示活动变更和下一步工作流命令 |
| `Coda dashboard [path]` | 启动本地可视化仪表盘（HTTP 服务） |
| `Coda doctor [path]` | 诊断安装健康状态 |
| `Coda update [path]` | 更新 Coda 包和已安装的 Skill |
| `Coda uninstall [path]` | 移除 Coda Skill、规则和钩子 |

### Skill 命令 (`Coda skill <sub>`)

| 子命令 | 功能 |
|--------|------|
| `skill add <path>` | 安装 Skill 到项目 Skill 池 |
| `skill show <skill>` | 显示 Skill 身份、验证状态、运行时元数据 |
| `skill run <skill>` | 启动确定性 Skill Run |
| `skill continue` | 恢复 Run 或提交待处理动作结果 |
| `skill check` | 检查 Engine Run 运行时检查 |

### 发布命令 (`Coda publish <sub>`)

| 子命令 | 功能 |
|--------|------|
| `publish list` | 列出可恢复的 Skill Maker 候选 |
| `publish status <name>` | 显示验证就绪状态和下一步动作 |
| `publish review <name>` | 构建审批前的验证摘要 |
| `publish approve <name>` | 验证后批准候选 |
| `publish run <name>` | 生成安装候选到 .coda/bundles |
| `publish distribute <name>` | 预览或安装生成的候选 |

### Bundle 命令 (`Coda bundle <sub>`)

| 子命令 | 功能 |
|--------|------|
| `bundle candidates` | 发现 Skill 候选 |
| `bundle draft create/optimize` | 管理 Bundle 草稿 |
| `bundle factory-*` | Factory 流程（propose/init/resolve/generate/guide） |
| `bundle compile` | 针对单平台干运行编译 |
| `bundle benchmark-plan/record` | 基准测试计划和记录 |
| `bundle review-summary/review` | 审查摘要和审批 |
| `bundle publish/distribute` | 发布和分发 |

### 评估命令

| 命令 | 功能 |
|------|------|
| `Coda eval [target]` | 基准测试 Skill 或 eval 清单 |
| `--collect` | 仅发现，不执行 |
| `--html` | 生成 HTML 报告 |
| `--quick` | 使用快速烟雾测试 |

---

## 领域模块架构

```
domains/
├── bundle/          # Bundle 创作、编译、分发、评估
├── coda-classic/    # Classic 运行时（状态机、guard、handoff、archive）
├── dashboard/       # 可视化仪表盘（Web 服务、数据收集、风险检测）
├── engine/          # Skill Run 引擎（循环、状态、解析器、运行存储）
├── factory/         # Skill 打包和工件管理
├── integrations/    # 外部集成（CodeGraph、OpenSpec、Superpowers）
├── skill/           # Skill 发现、安装、加载、卸载、验证
└── workflow-contract/ # 工作流契约（类型、验证、规范化）
```

### 关键领域能力

| 模块 | 核心能力 |
|------|----------|
| **bundle** | 候选发现、草稿创建、Factory 流程、编译、基准测试、审查、发布、分发 |
| **coda-classic** | 状态命令、guard 验证、handoff 上下文、archive 自动化、YAML 校验、迁移 |
| **dashboard** | 数据收集、Git 集成、风险检测、任务解析、验证解析、YAML 处理 |
| **engine** | Run 循环、状态管理、解析器、手动运行、独立运行、运行时类型 |
| **skill** | Skill 发现、安装、加载、快照、偏好、卸载、验证 |
| **integrations** | CodeGraph 集成、OpenSpec 集成、Superpowers 集成 |

---

## 平台适配层

```
platform/
├── fs/              # 文件系统操作
├── install/         # 平台检测和安装
├── paths/           # 仓库布局管理
├── process/         # 进程和 shell 处理
└── version/         # 版本管理
```

---

## 脚本与自动化

| 脚本 | 用途 |
|------|------|
| `Coda-env.mjs` | 脚本发现助手 |
| `Coda-guard.mjs` | 阶段转换守卫（--apply 自动更新状态） |
| `Coda-handoff.mjs` | 设计交接（OpenSpec → Superpowers 上下文追踪） |
| `Coda-archive.mjs` | 一键归档 |
| `Coda-yaml-validate.mjs` | Schema 校验器 |
| `Coda-hook-guard.mjs` | 阶段写入守卫（PreToolUse 钩子） |
| `Coda-state.mjs` | 统一状态管理（init/set/get/check/scale） |

---

## 状态管理架构

| 文件 | 所有者 | 用途 |
|------|--------|------|
| `.openspec.yaml` | OpenSpec | 规范生命周期、变更元数据 |
| `.Coda.yaml` | Coda | 工作流阶段、执行模式、验证状态 |
| `.Coda/run-state.json` | Engine | Run 身份和执行状态（机器拥有） |

---

## 关键特性

### 可靠性保障

1. **入口验证** — 每个阶段验证前置条件
2. **自动状态转换** — `guard --apply` 自动更新状态
3. **Schema 校验** — 确保数据完整性
4. **构建决策强制** — 阻止跳过构建选择
5. **验证证据** — 阶段推进前需要证明
6. **归档自动化** — 一键完成完整归档流程

### 上下文压缩（Beta）

| 模式 | 行为 | Token 节省 |
|------|------|-----------|
| `off` | 完整 Spec 摘录 | 基线 |
| `beta` | 仅设计文档 + SHA256 哈希引用 | ~25-30% |

### 自动转换

| 值 | 行为 |
|----|------|
| `true` | 阶段完成后自动调用下一个 Skill（默认） |
| `false` | 阶段完成后暂停，用户手动触发 |

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 运行时 | Node.js 20+ |
| 语言 | TypeScript |
| 构建 | esbuild |
| 测试 | Vitest |
| CLI 框架 | Commander.js |
| 交互提示 | Inquirer.js |
| 配置解析 | yaml |
| 代码质量 | ESLint + Prettier + Husky |
| 前端（仪表盘） | React + Vite + Tailwind CSS |

---

## 项目结构

```
coda/
├── app/              # CLI 入口和命令编排
├── domains/          # 业务领域模块
├── platform/         # 平台适配层
├── assets/           # 发布资产和内置 Skill
├── scripts/          # 构建、发布、benchmark、lint 脚本
├── test/             # 测试（跟随源码分层）
├── bin/              # CLI 入口脚本
└── docs/             # 文档
```

---

## 总结

Coda 是一个**完整的 AI 编码工作流平台**，核心解决三个问题：

1. **可恢复性** — 长任务中断后可从当前阶段恢复，无需从头重建
2. **跨平台** — 统一的 Node.js 运行时，支持 31 个 AI 编码平台
3. **Skill 生态** — 创建、评估、发布可复用的 Skill 包

通过五阶段工作流（Open → Design → Build → Verify → Archive）和脚本化状态机，确保 AI 代理执行的可靠性和可追溯性。
