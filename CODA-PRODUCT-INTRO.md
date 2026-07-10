# Coda — AI 编码的工程化工作流平台

> 一句话：**把 AI 编码从"开盲盒"变成工程流水线。**

---

## 这产品是干什么的？

现在每个人都在用 AI 编码（Claude Code、Cursor、Copilot、Gemini CLI……），但用的人都知道一个问题：**AI 生成的代码质量不可控、长任务中途断了就要从头来、项目一复杂它就"忘记"之前说了什么。**

Coda 就是来解决这些问题的。

它是一个**面向 AI 编码的可恢复工作流与 Skill 平台**。说白了就是给 AI 编码上了个"工程化流程"：

- 不再让 Agent 自由发挥 → 五阶段流水线把关
- 不再怕中间断了 → 自动保存进度，随时恢复
- 不再重复造轮子 → 把好的工作流打包成 Skill 复用

---

## 谁需要这个产品？

| 角色 | 痛点 | Coda 能做什么 |
|------|------|--------------|
| **AI 编码重度用户** | 长任务中断后失去上下文、Token 浪费、输出不稳定 | 可恢复工作流 + 上下文压缩，省 25-30% Token，断了不慌 |
| **研发团队/企业** | Agent 行为不可控、代码质量不稳定、团队没有统一的 AI 编码规范 | 工程化流水线 + Guard 护栏 + 验证证据机制，让 AI 产出可预期 |
| **Skill 开发者** | 写了一堆好用的 AI 提示词但没法打包共享、没法跨平台用 | Skill 工厂 + Bundle 分发系统，一套 Skill 发布到 31 个平台 |
| **AI 工具构建者** | 需要为自己的平台集成工作流能力、管理 Agent 行为 | 完整的工作流契约 + Engine 运行时，可直接嵌入 |

---

## 核心解决的问题

### 1. AI 编码没有流程管理

现状：写代码 → 让 AI 改 → 手动作 code review → 手动归档。没有工程化。

Coda 的 **五阶段流水线**：

```
提案 (Open) → 设计 (Design) → 构建 (Build) → 验证 (Verify) → 归档 (Archive)
```

每个阶段有：
- **明确的入口条件**（上一阶段必须完成）
- **明确的产出**（提案文档、设计文档、代码、验证报告……）
- **自动化状态推进**（Guard 自动校验、自动推进）

这不是流程绑架，是工程化保障。就像 CI/CD 管线一样，每步都验证，不会跳过。

### 2. 长任务中断后要从零开始重建

这是 AI 编码最大的痛点。一个复杂功能改到一半，Agent 对话超时或者中断，回来就要重新解释一遍。

Coda 做的：
- **阶段隔离**：每阶段是独立的 Agent 调用，不跨阶段携带历史
- **SHA256 Checkpoint**：记录精确到哪一步、用了什么版本的 Skill、上下文是否一致
- **状态分离**：用户关心的配置（`.Coda.yaml`）和引擎自动管理的运行状态（`run-state.json`）分开，不混淆

恢复时三步校验：上下文一致 → 产物一致 → 事件日志完整 → **任一不一致拒绝恢复**。精确、不靠猜。

### 3. Agent 上下文越走越重、Token 越来越贵

Agent 对话一长，上下文膨胀，质量下降，Token 烧钱。

Coda 的多层上下文控制：

| 机制 | 效果 |
|------|------|
| 阶段隔离 | Agent 不跨阶段携带历史，从根上防止膨胀 |
| Handoff 截断 | 大文档只嵌入前 80 行，全文 SHA256 引用 |
| Context Compression | Beta 模式只引用 + 保留关键 Spec，省 25-30% Token |
| 状态分离 | Agent 只暴露约 20 个字段，不加载运行态细节 |
| Trajectory 日志 | 事件日志持久化文件，不在 Prompt 里 |
| Checkpoint 校验 | 恢复前三验证，防止静默不一致 |

测试结论：**Context Compression 开启后，测试通过率 100%，大任务最多省 15,000 Token。**

### 4. AI 编码平台碎片化

现在市面上几十个 AI 编码平台，每个有自己的 Skill 目录、配置格式。一套工作流换平台就得重写。

Coda 的答案：**一套 Skill 分发给 31 个平台。**

```bash
coda init  # 一次配置，全平台部署
```

Claude Code、Cursor、Copilot、Gemini CLI、OpenCode、Windsurf、Cline、RooCode……31 个平台全部覆盖。不只是安装，还有 `coda update` 统一升级、`coda uninstall` 安全移除。

### 5. 写好的工作流没法打包、分发、复用

每个人都在积累自己的 AI 编码"配方"，但这些配方要么在脑子里、要么在聊天记录里、要么在零散的提示词文件里。

Coda 建立了完整的 **Skill 生命周期**：

```
创建 → 评估 → 审批 → 发布 → 分发
```

- `/Coda-any`：描述你想要的工作流，Coda 生成 Skill Bundle
- `coda eval`：跑基准测试，看 Skill 质量
- `coda publish`：人工审批 → 发布 → 分发到各平台
- `coda skill run/continue`：执行和恢复 Skill Run

**从消费者到创作者**：你不再只是用别人写好的提示词，你可以造自己的 Skill，分发给团队。

### 6. Agent 执行不可控、不敢交给 AI

很多团队不敢让 AI 直接操作代码，因为没有"护栏"。

Coda 的 Guard 系统：

| 保护机制 | 作用 |
|----------|------|
| 入口校验 | 每阶段检查前置条件，不满足直接 [HARD STOP] |
| Schema 校验 | `.Coda.yaml` 字段校验，防拼写错误 |
| 构建决策强制 | 不能跳过 isolation / build_mode 选择 |
| 验证证据 | 推进前必须存在验证报告 + 分支已处理 |
| Hook Guard | PreToolUse 钩子，阻止设计/归档阶段写代码 |
| 构建命令安全扫描 | 拒绝 `;`、管道、`$`、反引号等危险语法 |

**这不是束缚，是授权。** 有了护栏，团队才敢让 Agent 真正执行。

---

## 技术亮点（工程师关心的）

### 纯 Node.js 运行时，不依赖 Bash

7 个 Bash 脚本全部替换为 Node.js 单进程运行时。

```text
0.3.x                        0.4.0
Coda-state.sh                Coda-state.mjs ─┐
Coda-guard.sh      ──►       Coda-guard.mjs ─┤ import
Coda-archive.sh              Coda-archive.mjs┘ Coda-runtime.mjs
```

- **Windows 原生可用**：不再需要 Git Bash / WSL
- **不用再面对** `sed -i` 的 BSD/GNU 兼容、`sha256sum` 找不到、`pipefail` 不可用
- **只依赖 Node.js 20+**，跨平台行为一致

### 状态机从 YAML 文本规则升级为程序化控制

把状态规则写在 Skill 文本里，靠 Agent 自由理解。0.4.0 用 TypeScript 状态机 + 7 个自动化脚本精确控制。

```
.Coda.yaml（用户字段）+ .Coda/run-state.json（引擎字段）
← 分离、自动迁移、防误改
```

### Skill 引擎：确定性执行 + 不可变快照

- Run 前冻结 Skill 包（内容哈希锁定版本）
- Checkpoint 记录 trajectoryOffset + contextHash + artifactsHash
- 恢复时版本校验：Skill 升级后的旧上下文不能继续跑

### Dashboard 可视化

内置 Web 仪表盘（React + Vite + Tailwind CSS），随时查看：
- 活动变更和阶段状态
- 任务进度
- 归档历史

```bash
coda dashboard  # 一键启动
```

### 扎实的质量保障

| 指标 | 覆盖 |
|------|------|
| 语言 | TypeScript（全量类型安全） |
| 构建 | esbuild（单文件 bundle） |
| 测试 | Vitest（源码分层对应） |
| 代码质量 | ESLint + Prettier + Husky |
| 架构约束 | 自定义 linter（目录白名单 + 引用规则） |
| 基准测试 | Context 压缩、执行性能、Classic 回归、Bundle 兼容性 |
| CI | GitHub Actions + 全量检查 |

---

## 与竞品的差异

| 维度 | 直接用 AI 编码工具 | 加上 Coda |
|------|-------------------|-----------|
| 工作流 | Agent 自由发挥 | 五阶段工程化流水线 |
| 长任务 | 断了从头来 | SHA256 Checkpoint 可恢复 |
| 上下文 | 越走越重、Token 白花 | 多层压缩 + 截断，省 25-30% |
| 跨平台 | 换平台重配 | 31 个平台一套配置 |
| Skill | 零散提示词文件 | 完整生命周期 + Bundle 分发 |
| 护栏 | 全靠自觉 | Guard 自动化检查 + Hook 保护 |
| 可观测 | 对话历史里翻 | `status` / `doctor` / `dashboard` |

---

## 快速体验

```bash
# 安装
npm install -g @fenghuaxin/coda

# 初始化（自动检测已有平台）
cd your-project
coda init

# 开始工作流
/Coda  # 在你的 AI 工具中调用

# 随时查看状态
coda status
coda dashboard
```

---

## 总结

Coda 不是又一个 AI 编码工具，它是**给 AI 编码上工程化的平台**。

当前 AI 编码的最大瓶颈已经不是模型能力不够，而是**工程化缺失**——没有流程、不可恢复、不可管控、不可复用。Coda 用 Node.js 运行时 + 五阶段工作流 + Guard 护栏 + Skill 工厂 + 31 平台分发，把 AI 编码从"开盲盒"变成工程流水线。

对于个人用户：省 Token、可恢复、不怕断。
对于团队：可管控、可审计、可复用。
对于 Skill 创作者：一条工具链完成创作→评估→发布→分发。

---

*版本：0.1.1 | 许可证：MIT
