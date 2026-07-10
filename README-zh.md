# @fenghuaxin/coda

**Coda 是面向 AI 编码的可恢复工作流与 Skill 平台。**

它通过一个跨平台运行时，把 OpenSpec 制品、Superpowers 方法、Skill 创建、评估和发布串成一条闭环，
让你从一条工具链启动变更、中途恢复、诊断偏离、发布可复用 Skill。

## 为什么选 Coda

Coda 把公共工作流做简单，把脆弱的部分搬到共享运行时里：

- **纯 Node 运行时** — 所有内置 Coda 脚本都跑在 Node.js 上，macOS、Linux、Windows 行为一致，
  无需 Bash、Git Bash 或 WSL。
- **可恢复工作流** — `/Coda` 和 Classic 状态投影记录变更停在哪一阶段，长任务可以从当前阶段
  恢复，agent 无需从零重建进度。
- **Skill 平台** — Coda 安装工作流 Skill、可以创作可复用 Skill 包，并通过 `/Coda-any` 把它
  们打包成分发级的 Bundle。
- **带诊断的护栏** — `status`、`doctor`、guard/verify 流程共享同一套运行时证据路径，
  错误的状态和缺失的工作流证据会以用户可见的诊断信息暴露出来，不会静默跑偏。

## 安装

环境要求：

- Node.js 20+
- npm/npx
- Git

```bash
npm install -g @fenghuaxin/coda
```

## 快速开始

```bash
cd your-project
Coda init
```

`Coda init` 会：

1. 提示选择 AI 平台（自动检测已存在的配置）
2. 选择安装作用域：项目级（当前目录）或全局（home 目录）
3. 选择 Coda Skill 的语言：English 或 中文
4. 选择要安装/升级的 npm 依赖 — [OpenSpec](https://github.com/Fission-AI/OpenSpec) CLI、
   [Superpowers](https://github.com/obra/superpowers)（通过 `npx skills add`）、
   [CodeGraph](https://github.com/colbymchenry/codegraph) CLI。尚未检测到的项默认勾选；已检测
   到的项默认不勾选，由你主动选择是否升级。
5. 安装所选依赖并部署它们的 Skill
6. 把 Coda Skill（按你选择的语言）部署到选中的平台
7. 为项目级安装创建 `docs/superpowers/specs/` 和 `docs/superpowers/plans/` 工作目录

> [!TIP]
> 建议使用 Superpowers v6.0.0+ — 比旧版本快约 2 倍，省约 50% token。
> 之后升级 Coda 本身：`Coda update` 或 `npm install -g @fenghuaxin/coda@latest`。

## 任务路径

- **启动 Coda 工作流** — `Coda init` 安装运行时和 Skill，然后在你的 agent 界面调用 `/Coda`。
- **创建或优化可复用 Skill** — `/Coda-any` 是普通用户主路径。它现在生成的是稳定组合 Skill Bundle，
  不再只是一个 `SKILL.md`，常规路径是 `/Coda-any -> Coda eval -> Coda publish review/approve/run -> Coda publish distribute --preview -> Coda publish distribute`。
  平时用 `Coda publish status` 或 `Coda publish review` 看发布就绪情况；任何实际写入平台前先跑
  `Coda publish distribute --preview`；只有直接调试后端状态时才使用 `Coda bundle` 高级 Bundle 后端。
  详细示例见 [docs/operations/SKILL-CREATION.md](docs/operations/SKILL-CREATION.md)。
- **评估本地或生成的 Skill** — 先用 `Coda eval ./Coda/eval.yaml --collect` 发现目标，
  再用 `Coda eval ./Coda/eval.yaml --html` 真跑一次并生成可浏览的摘要。
- **诊断卡住的工作流** — `Coda status` 看当前阶段和下一步命令；状态、运行时证据或安装健康
  异常时用 `Coda doctor` 排查。
- **恢复确定性 Skill Run** — `Coda skill run`，按输出的 `Pending action` 行事，再用
  `Coda skill continue` 或 `Coda skill check` 配合 `Next:` 提示推进。

## 支持 OpenClaw、Hermes 等其他 AI 平台

对于直接使用通用 `skills` CLI 的平台，可以这样安装 Coda Skill 包：

```bash
npx skills add huaxin/Coda
```

## 命令

<details>
<summary><code>Coda init [path]</code> — 初始化 Coda 工作流</summary>

为选中的 AI 编码平台初始化 OpenSpec、Superpowers 和 Coda Skill。

| 选项                | 说明                                                                            |
| ------------------- | ------------------------------------------------------------------------------ |
| `--yes`             | 非交互模式，自动选中已检测到的平台（未检测到时全选）                            |
| `--scope <scope>`   | 安装作用域：`project` 或 `global`                                              |
| `--language <lang>` | Skill 语言：`en` 或 `zh`（跳过交互式语言提示）                                 |
| `--skip-existing`   | 跳过已安装的组件                                                                |
| `--overwrite`       | 覆盖已安装的组件                                                                |
| `--json`            | 以 JSON 结构化输出                                                              |

当同一平台上检测到多个已存在组件时，交互式 init 会一次性询问：全部覆盖、全部跳过或逐项选择。

</details>

<details>
<summary><code>Coda status [path]</code> — 显示活动变更和下一步工作流命令</summary>

显示活动变更、任务进度、推荐的下一条 Coda 工作流命令、当前步骤、运行时模式；变更格式异常或
缺失必备证据时给出诊断恢复提示。

| 选项      | 说明                                                              |
| --------- | ----------------------------------------------------------------- |
| `--json`  | 以 JSON 形式输出活动变更，含 `nextCommand`、`currentStep` 等运行时数据 |

</details>

<details>
<summary><code>Coda dashboard [path]</code> — 启动本地只读仪表盘服务</summary>

启动本地 HTTP 服务，提供可视化仪表盘，展示活动变更、阶段状态、任务进度和归档历史。默认自动在
浏览器中打开。

| 选项        | 说明                                                       |
| ----------- | --------------------------------------------------------- |
| `--port`    | 服务端口（默认：自动选择可用端口）                        |
| `--no-open` | 不自动在浏览器中打开仪表盘                                |
| `--json`    | 采集单次快照并以 JSON 打印到 stdout（用于脚本化/检查）    |

</details>

<details>
<summary><code>Coda doctor [path]</code> — 诊断 Coda 安装健康</summary>

检查项目/全局安装健康、工作目录、已安装 Skill、脚本和活动变更诊断。`Coda doctor` 会报告
`.Coda.yaml` 文件格式异常、合法变更的当前步骤/运行时模式，以及阻断安全恢复的运行时证据缺口。

| 选项              | 说明                                                      |
| ----------------- | -------------------------------------------------------- |
| `--json`          | 以 JSON 输出结构化诊断结果                               |
| `--scope <scope>` | 诊断 `auto`、`project` 或 `global` 作用域（默认 `auto`）|

</details>

<details>
<summary><code>Coda update [path]</code> — 升级 Coda 包和 Skill</summary>

升级 npm 包，并刷新检测到的项目/全局目标中已安装的 Coda Skill。

| 选项                | 说明                                       |
| ------------------- | ----------------------------------------- |
| `--json`            | 以 JSON 输出 npm 和 Skill 升级结果        |
| `--language <lang>` | 覆盖检测到的 Skill 语言（`en`、`zh`）     |
| `--scope <scope>`   | 只升级 `global` 或 `project` 作用域       |

</details>

<details>
<summary><code>Coda uninstall [path]</code> — 移除 Coda Skill、规则和钩子</summary>

安全移除所有检测到的平台中由 Coda 分发的 Skill、规则和钩子。保留用户自定义的钩子和非 Coda 配置。

| 选项              | 说明                                       |
| ----------------- | ----------------------------------------- |
| `--force`         | 跳过确认提示                               |
| `--scope <scope>` | 只卸载 `global` 或 `project` 作用域       |
| `--json`          | 以 JSON 输出卸载结果                       |

```bash
Coda uninstall              # 交互式 — 展示目标，请求确认
Coda uninstall --force      # 非交互式 — 立即移除全部
Coda uninstall --scope project  # 只移除项目级安装
```

</details>

<details>
<summary><code>Coda skill &lt;command&gt;</code> — 安装、检查和运行本地 Skill 包</summary>

发现显式 Skill 目录、`/.Coda/skills/` 下的项目覆盖和内置 Skill。手动 Run 会持久化一份不可变
Skill 快照和待处理动作；当前 Agent 或平台执行该动作后通过 `resume` 提交结果。

```bash
Coda skill add ./my-skill --project .
Coda skill show my-skill --json
Coda skill run my-skill --change ./changes/demo
Coda skill run my-skill --run-id demo-run --project .
Coda skill continue --change ./changes/demo
Coda skill continue --run-id demo-run --project .
Coda skill continue --change ./changes/demo --status succeeded --summary "Done" --artifact report=report.md
Coda skill check --change ./changes/demo --scope completion
Coda skill continue --change ./changes/demo --upgrade my-skill --project .
```

常用子命令支持 `--json`。Run 可以绑定 `--change` 目录，或在 `.Coda/runs/<run-id>` 下用
`--run-id`。`run` 在 Plan 3 中支持确定性 Skill；自适应执行需要 Agent 候选。项目 Skill 按名
称覆盖内置 Skill，无效覆盖采取"失败关闭"策略，不会静默回退。文本模式还会直接打印
`Pending action` 和 `Next:` 恢复提示，用户无需自己推断 Run 暂停或运行时检查失败后的下一步。

</details>

<details>
<summary><code>Coda eval [target]</code> — 通过共享 eval 评估框架对 Skill 跑基准</summary>

为本地 Skill 和 `Coda/eval.yaml` 提供一个稳定的 CLI 入口，始终从仓库的 `eval/` 根目录启动，
用户无需手动 cd、重组 pytest 参数或记忆 `--collect-only`。

```bash
Coda eval ./Coda/eval.yaml --collect
Coda eval ./Coda/eval.yaml --html
Coda eval ./assets/skills/Coda-any --quick
```

`--collect` 只用于发现和预检；省略它才会执行真正的本地基准。以 `Coda/eval.yaml` 结尾的目标
按清单处理；Skill 目录或 `SKILL.md` 按本地 Skill 处理。`--quick` 让本地 Skill 目标默认走
`generic-skill-smoke` 低成本冒烟路径。

</details>

<details>
<summary><code>Coda publish &lt;command&gt;</code> — <code>/Coda-any</code> 输出的用户面发布路径</summary>

`Coda publish` 是面向普通用户的发布门面，复用现有的 Bundle 状态和就绪度契约，不引入第二套状
态模型。对 `/Coda-any` 生成的 Skill，先跑 `Coda eval`，再用这些命令走就绪度、人工审批、发
布、分发预览和确认分发。完整用户路径见 [docs/operations/SKILL-CREATION.md](docs/operations/SKILL-CREATION.md)。

```bash
Coda publish list --project . --json
Coda publish status my-bundle --project . --json
Coda publish review my-bundle --platform claude --json
Coda publish approve my-bundle --reviewer alice --json
Coda publish run my-bundle --platform claude --json
Coda publish distribute my-bundle --platform claude --scope project --preview --json
Coda publish distribute my-bundle --platform claude --scope project --confirm-executables --json
```

设计心智模型：

- `/Coda-any` 创建、恢复和优化 Skill
- `Coda eval` 验证生成的产出
- `Coda publish` 处理就绪度、人工审批、发布和分发

</details>

<details>
<summary><code>Coda bundle &lt;command&gt;</code> — <code>/Coda-any</code> 和 Bundle 发布运维的高级 Bundle 后端</summary>

从新目标或已有候选 Skill 创建平台无关的 Skill Bundle。Bundle 草稿是确定性的：会编译成原生
平台的 Skill/rule/hook 安装方案，可携带可选的 Engine 元数据，需要结构化的基准证据，且必须
经人工审批才能发布或分发。

对大多数用户来说，`/Coda-any` 是普通用户主路径。只有在审查后端状态、修复被阻断的草稿，或主
动手工跑发布流水线时，才直接使用 Bundle CLI。

```bash
Coda bundle candidates --project . --json
Coda bundle list --project . --json
Coda bundle factory-propose my-bundle --file ./plan.json --json
Coda bundle factory-init my-bundle --file ./plan.json --json
Coda bundle factory-resolve my-bundle --candidate review-flow --source ./skills/review-flow --json
Coda bundle factory-init my-bundle --file ./plan.json --confirmed-proposal --json
Coda bundle factory-generate my-bundle --json
Coda bundle draft create my-bundle --project .
Coda bundle draft optimize ./bundle-source --project .
Coda bundle status my-bundle --json
Coda bundle compile my-bundle --platform claude --json
Coda bundle benchmark-plan my-bundle --level quick --json
Coda bundle benchmark-record my-bundle --result ./benchmark.json --json
Coda bundle review-summary my-bundle --platform claude --json
Coda bundle review my-bundle --approve --reviewer alice --json
Coda bundle publish my-bundle --platform claude --json
Coda bundle distribute my-bundle --platform claude --scope project --preview --json
Coda bundle distribute my-bundle --platform claude --scope project --confirm-executables --json
```

`/Coda-any` 是 Coda Skill 创建文档：用户描述想创建或优化的工作流，Coda 从 `.Coda/skill-preferences.yaml`
读取项目级偏好，扫描真实本地 Skill，展示组合提案让用户确认，再把请求转成可审查的稳定组合 Skill
Bundle 草稿。Factory 元数据会记录 `preferenceHash`、已解析的 Skill 证据和偏离原因，然后由 CLI
后端处理校验、Eval、发布和可选分发；详细控制面契约见 Skill 创建文档。缺失或含糊的候选会先暂停
等待 `factory-resolve`；审批和发布由结构化证据把关；分发同时支持 `project` 和 `global` 作用域。
`Coda bundle list` 列出可恢复的创作状态；`Coda bundle status` 在文本模式下打印 `Next action`、
原因和建议命令；JSON 输出包含 `nextAction`，`/Coda-any`、`Coda publish` 和其他自动化可以确定
性地恢复正确的下一步。请把上面的完整命令清单当作高级后端参考，而不是 `/Coda-any` 的常规首
次运行路径。

</details>

| 命令                | 说明       |
| ------------------- | --------- |
| `Coda --help`       | 显示帮助   |
| `Coda --version`    | 显示版本   |

## 支持的平台

`Coda init` 支持 31 个 AI 编码平台：

<details>
<summary>查看完整平台列表</summary>

| 平台                | Skill 目录  | 平台        | Skill 目录  |
| ------------------ | ----------- | ----------- | ----------- |
| Claude Code        | `.claude/`  | Cursor      | `.cursor/`  |
| Codex              | `.codex/`   | OpenCode    | `.opencode/`|
| Windsurf           | `.windsurf/`| Cline       | `.cline/`   |
| RooCode            | `.roo/`     | Continue    | `.continue/`|
| GitHub Copilot     | `.github/`  | Gemini CLI  | `.gemini/`  |
| Amazon Q Developer | `.amazonq/` | Qwen Code   | `.qwen/`    |
| Kilo Code          | `.kilocode/`| Auggie      | `.augment/` |
| Kimi Code          | `.kimi-code/`| Kiro       | `.kiro/`    |
| Lingma             | `.lingma/`  | Junie       | `.junie/`   |
| CodeBuddy          | `.codebuddy/`| CoStrict   | `.cospec/`  |
| Crush              | `.crush/`   | Factory Droid| `.factory/`|
| iFlow              | `.iflow/`   | Pi          | `.pi/`      |
| Qoder              | `.qoder/`   | Antigravity | `.agents/`  |
| Bob Shell          | `.bob/`     | ForgeCode   | `.forge/`   |
| Trae               | `.trae/`    | Trae CN     | `.trae-cn/` |
| ZCode              | `.zcode/`   | MimoCode    | `.mimocode/`|

</details>

部分平台的项目目录和全局目录不同。例如 OpenCode 全局安装用 `.config/opencode`，
MimoCode 全局安装用 `.config/mimocode`，Lingma 全局安装用 `.lingma`，Antigravity 全局
安装用 `.gemini/antigravity`。ZCode 和 MimoCode 基于 OpenCode，从各自目录读取 Skill；安
装时 OpenSpec 产物会从 `.opencode/` 镜像到对应目录。

## Skill

执行 `Coda init` 后，三组 Skill 会被安装到所选平台的 `skills/` 目录：

### Coda Skill

<details>
<summary>查看 Coda Skill</summary>

| Skill           | 说明                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------|
| `/Coda`         | 主入口 — 自动检测阶段并分派到子命令                                                                |
| `/Coda-open`    | 阶段 1：开启变更（提案、设计、任务拆分）                                                          |
| `/Coda-design`  | 阶段 2：深度设计（头脑风暴、设计文档）                                                            |
| `/Coda-build`   | 阶段 3：规划与构建（实现计划、代码提交）                                                          |
| `/Coda-verify`  | 阶段 4：验证与收尾（测试、验证报告）                                                              |
| `/Coda-archive` | 阶段 5：归档（delta 规范同步、状态标注）                                                          |
| `/Coda-hotfix`  | 预设：快速修复（跳过头脑风暴）                                                                    |
| `/Coda-tweak`   | 预设：OpenSpec 链式中等变更（delta 规范优先，跳过头脑风暴和完整计划）                              |
| `/Coda-any`     | Coda Skill 工厂 — 创建/优化可分发的 Coda 原生 Skill                                              |

</details>

### 守护与自动化脚本

<details>
<summary>查看脚本列表</summary>

| 脚本                     | 用途                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| `Coda-env.mjs`          | 脚本发现助手 — 打印内置脚本目录，便于 Skill 解析同级启动器路径                                  |
| `Coda-guard.mjs`         | 阶段转换守护 — 校验退出条件，`--apply` 自动更新 `.Coda.yaml`                                    |
| `Coda-handoff.mjs`      | 设计交接 — 基于 OpenSpec 制品生成带 SHA256 追溯的确定性上下文包                                  |
| `Coda-archive.mjs`       | 一键归档 — 校验状态、同步规范、移动到归档、更新状态                                              |
| `Coda-yaml-validate.mjs` | Schema 校验器 — 校验 `.Coda.yaml` 结构和字段值                                                    |
| `Coda-hook-guard.mjs`    | 阶段写入守护 — PreToolUse 钩子，阻止 open/design/archive 阶段写入文件                             |
| `Coda-state.mjs`         | 统一状态管理 — init/set/get/check/scale，是 Agent 操作 YAML 的独占入口                           |

所有脚本都是薄壳的 Node.js 启动器，背后是被编译到 `Coda-runtime.mjs`（由 TypeScript 生成）
的同一份运行时。它们通过 `node` 在所有平台运行，因此 Coda 只需要 Node.js — 不需要 Bash、
Git Bash 或 WSL。

</details>

### OpenSpec Skill

规范生命周期管理：propose、explore、sync、verify、archive 等。

### Superpowers Skill

开发方法论：头脑风暴、TDD、subagent-driven development、code review、plan writing 等。

0.4.0 运行时模型、状态拆分、诊断路径、Bundle/Skill 架构细节见
[docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)。

## 工作流

```
/Coda
  ↓ auto-detect
/Coda-open  -->  /Coda-design  -->  /Coda-build  -->  /Coda-verify  -->  /Coda-archive
(OpenSpec)         (Superpowers)       (Superpowers)       (Both)           (OpenSpec)

/Coda-hotfix（预设路径，跳过头脑风暴）
  open  -->  build  -->  verify  -->  archive

/Coda-tweak（轻量预设，链式 OpenSpec，delta 规范优先）
  open  -->  build  -->  verify  -->  archive
```

### 五个阶段

| 阶段         | 命令            | 所有者         | 产物                                |
| ------------ | --------------- | -------------- | ----------------------------------- |
| 1. Open      | `/Coda-open`    | OpenSpec       | proposal.md, design.md, tasks.md    |
| 2. Deep Design | `/Coda-design` | Superpowers    | Design Doc, delta spec              |
| 3. Plan & Build | `/Coda-build` | Superpowers    | 实现计划、代码提交                  |
| 4. Verify & Finish | `/Coda-verify` | 两者        | 验证报告、分支处理                  |
| 5. Archive   | `/Coda-archive` | OpenSpec       | delta→main 规范同步、归档           |

### 核心原则

- **头脑风暴不可跳过** — 每个变更必须经过深度设计（hotfix/tweak 除外）
- **Delta 规范是活文档** — 阶段 3 期间可自由编辑，归档时同步
- **保持 tasks.md 同步** — 每完成一项任务就勾选
- **频繁提交** — 每项任务一次 commit，消息体现设计意图
- **归档前必须验证** — 必须先通过 `/Coda-verify` 再 `/Coda-archive`

### 状态管理

Coda 使用解耦的状态架构，文件分别存储：

| 文件                     | 所有者   | 用途                                              |
| ------------------------ | -------- | ------------------------------------------------- |
| `.openspec.yaml`         | OpenSpec | 规范生命周期、变更元数据                         |
| `.Coda.yaml`            | Coda     | 工作流阶段、执行模式、验证状态                    |
| `.Coda/run-state.json`  | Engine   | Run 身份和执行状态（机器拥有）                    |

`.Coda.yaml` 保存所有用户面的 Classic 工作流字段和 `run_id` 链接。Engine 把 Run 字段
（`current_step`、`skill`、`iteration`、`run_status` 等）单独存到 `.Coda/run-state.json`
（camelCase JSON）。老版本把 Run 字段内嵌在 `.Coda.yaml` 的变更会在首次读取时自动迁移。

所有状态和执行阶段都通过脚本更新，每个阶段都会验证任务是否真正完成才推进。相比把复杂状态规
则只写进 Skill 文本，脚本支撑的状态机让 Coda 的阶段转换更可靠、YAML 更正确、断点恢复更容
易；Agent 可以通过 Coda 内置命令读到当前的 Spec 状态。

<details>
<summary>查看 .Coda.yaml 关键字段</summary>

**`.Coda.yaml` 关键字段：**

```yaml
workflow: full
auto_transition: true
phase: build
skill: Coda-classic # 已解析的 Skill 包名
run_id: <uuid> # 链接到 .Coda/run-state.json
review_mode: standard # off | standard | thorough
build_mode: subagent-driven-development
build_pause: null
isolation: branch
verify_mode: null
tdd_mode: null
subagent_dispatch: null
design_doc: docs/superpowers/specs/YYYY-MM-DD-topic-design.md
plan: docs/superpowers/plans/YYYY-MM-DD-feature.md
verify_result: pending
verification_report: null
branch_status: pending
verified_at: null
archived: false
direct_override: false
build_command: null
verify_command: null
handoff_context: openspec/changes/<name>/.Coda/handoff/design-context.json
handoff_hash: <sha256>
```

在全工作流中，`build_mode`、`build_pause`、`isolation`、`verify_mode`、`tdd_mode`、
`subagent_dispatch` 暂时可以是 `null`；`build_mode` 和 `isolation` 必须在 `build → verify`
之前确定。`auto_transition` 控制阶段完成后自动调用还是手动调用下一个 Skill — 见
[AUTO-TRANSITION.md](docs/AUTO-TRANSITION.md)。`build_pause` 记录 build 阶段内部暂停点：
`null` 表示无暂停，`plan-ready` 表示 plan 已生成，用户在选择 isolation 和执行模式前暂停。
它不是执行模式，绝不能写到 `build_mode` 里。`verification_report` 在验证写报告前一直保持
`null`，`verify-pass` 要求该报告存在且 `branch_status: handled`。`archived` 之后字段是可选
或脚本派生的：`direct_override` 只在 full-workflow 直接构建时需要；项目级命令除非配置否则
可能缺失；`handoff_context` / `handoff_hash` 由 `Coda-handoff.mjs` 在离开 design 阶段时
写入。项目可以在变更或仓库根配置 `build_command` / `verify_command`，guard 会先跑这些命令
并打印失败输出。配置的命令使用受限的 shell 语法：允许命令字、引用、路径以及 `&&` 表示顺序
步骤；`;`、管道、裸 `&`、`$`、反引号都被拒绝。`review_mode` 控制 Build/Verify 期间是否
自动代码评审（`off` 跳过，`standard` 评审关键改动，`thorough` 评审全部）；可在项目级
`.Coda/config.yaml` 设置。

</details>

### 可靠性保障

Coda 通过自动状态转换确保 Agent 执行的可靠性：

<details>
<summary>查看可靠性保障</summary>

1. **入口校验** — 每个阶段在执行前校验前置条件
   - 检查文件存在、状态一致性、阶段转换
   - 校验失败时输出 `[HARD STOP]` 并给出可操作的建议

2. **自动状态转换** — `Coda-guard.mjs --apply` 自动更新 `.Coda.yaml`
   - 所有阶段转换（open → design/build → verify → archive）都走 `guard --apply`
   - 无需手动改状态 — 消除"写入—验证"错误
   - `Coda-state.mjs` 是 Agent 操作状态的独占入口
   - guard 和 archive 脚本内部都使用 `Coda-state.mjs`

3. **Schema 校验** — `Coda-yaml-validate.mjs` 保证数据完整性
   - 校验必填和可选字段
   - 校验枚举值，包括 `direct_override`
   - 校验 `design_doc`、`plan`、`handoff_context` 路径存在，以及 `handoff_hash` 格式
   - 检测未知/拼写错误字段

4. **构建决策强制** — guard 和状态转换都会阻止跳过构建选项
   - `isolation` 必须是 `branch` 或 `worktree`
   - 离开 build 前必须选定 `build_mode`
   - `build_pause: plan-ready` 是 plan 生成后的可恢复暂停，不是 `build_mode`
   - 全工作流 `build_mode: direct` 要求 `direct_override: true`

5. **验证证据** — guard 在阶段推进前强制要求证据
   - `verify-pass` 转换要求 `verification_report` 指向已存在的报告文件
   - `branch_status` 必须在 verify 通过前为 `handled`
   - guard 把 `verification_report exists` 和 `branch_status=handled` 作为硬前置
   - 防止验证或分支处理被跳过时错误推进阶段

6. **归档自动化** — `Coda-archive.mjs` 一条命令完成完整归档流程
   - 校验入口状态，通过 OpenSpec 把 delta 规范合入主规范
   - 给设计文档和计划 frontmatter 加注
   - 把变更移到归档目录并更新 `archived: true`
   - 支持 `--dry-run` 预览

</details>

## 项目结构

```
your-project/
├── .Coda/
│   └── config.yaml              # 项目级全局配置（context_compression、review_mode、auto_transition）
├── .claude/skills/              # 平台 Skill 目录（Coda + OpenSpec + Superpowers）
│   ├── Coda/SKILL.md
│   │   └── scripts/
│   │       ├── Coda-guard.mjs       # 阶段转换守护（--apply 自动更新状态）
│   │       ├── Coda-env.mjs         # 脚本发现助手
│   │       ├── Coda-handoff.mjs     # 设计交接（OpenSpec → Superpowers 上下文追溯）
│   │       ├── Coda-archive.mjs     # 一键归档自动化
│   │       ├── Coda-yaml-validate.mjs # Schema 校验器
│   │       ├── Coda-hook-guard.mjs   # 阶段写入守护（PreToolUse 钩子）
│   │       └── Coda-state.mjs       # 统一状态管理（init/set/get/check/scale）
│   ├── Coda-*/SKILL.md
│   ├── openspec-*/SKILL.md
│   └── brainstorming/SKILL.md
├── openspec/                    # OpenSpec — WHAT
│   ├── config.yaml
│   └── changes/
│       └── <name>/
│           ├── .openspec.yaml       # OpenSpec 状态
│           ├── .Coda.yaml          # Coda 工作流状态（Classic 字段 + run_id 链接）
│           ├── .Coda/
│           │   └── run-state.json   # Engine Run 状态（机器拥有，自动迁移）
│           ├── proposal.md
│           ├── design.md
│           ├── specs/<capability>/spec.md
│           └── tasks.md
└── docs/superpowers/            # Superpowers — HOW
    ├── specs/                   # 设计文档
    └── plans/                   # 实现计划
```

<details>
<summary>上下文压缩（Beta）</summary>

Coda 在 Design → Build 交接时支持上下文压缩。开启后，`Coda-handoff.mjs` 会生成更紧凑的上下
文包，Build 阶段输入 token 减少 **25–30%**，不影响实现正确性。

| 模式    | 行为                              | 节省 Token |
| ------- | --------------------------------- | --------- |
| `off`   | 交接上下文中包含完整规范摘录      | 基线       |
| `beta`  | 仅含设计文档 + SHA256 哈希引用     | ~25–30%   |

基准测试的关键结论：

- **测试通过率**：各档位 100%（压缩不影响正确性）
- **规范覆盖率**：`off` 100% 对 `beta` 95% — 边缘细节略有损失
- **规模效应**：任务越大，绝对节省越多（最高档任务可省 15,000 token）

在 `.Coda/config.yaml` 启用：`context_compression: beta`

完整基准报告、压缩原理和复现步骤见 [CONTEXT-COMPRESSION.md](docs/CONTEXT-COMPRESSION.md)。

</details>

<details>
<summary>自动转换</summary>

`auto_transition` 控制 Coda 在阶段完成后是自动调用下一个 Skill，还是暂停等用户手工交接。
阶段推进本身总是发生 — 这个设置只影响 Skill 调用。

| 值      | 行为                                                       |
| ------- | --------------------------------------------------------- |
| `true`  | 阶段完成后自动调用下一个 Skill（默认）                     |
| `false` | 阶段完成后暂停，用户手动触发下一个 Skill                   |

三层配置优先级：`Coda_AUTO_TRANSITION` 环境变量 > `.Coda/config.yaml`（项目）> `.Coda.yaml`（变更）。

配置细节、工作流映射和 FAQ 见 [AUTO-TRANSITION.md](docs/AUTO-TRANSITION.md)。

</details>

## 开发

开发搭建、提交约定、PR 流程、分支工作流，以及新增平台、Skill、脚本、Changelog 条目的指导见
[CONTRIBUTING.md](CONTRIBUTING.md) | [中文版](CONTRIBUTING-zh.md)。

版本历史见 [CHANGELOG.md](CHANGELOG.md)。

## 路线图

在 [Coda 路线图](https://github.com/orgs/rpamis/projects/1) 跟踪开发进展和即将推出的功能。

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=rpamis/Coda&type=Date)](https://star-history.com/#rpamis/Coda&Date)

## 贡献者

<a href="https://github.com/rpamis/Coda/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=rpamis/Coda&columns=12&anon=1" />
</a>

## 许可证

[MIT](LICENSE)

## 社区

<table align="center">
  <tr>
    <td align="center" width="180">
      <img src="https://github.com/rpamis/Coda/blob/master/img/douyin.png" width="120" height="120"><br>
      <b>抖音（推荐）</b>
    </td>
    <td align="center" width="180">
      <img src="https://github.com/rpamis/Coda/blob/master/img/wechat.jpg" width="120" height="120"><br>
      <b>微信</b>
    </td>
    <td align="center" width="180">
      <img src="https://github.com/rpamis/Coda/blob/master/img/qq.jpg" width="120" height="120"><br>
      <b>QQ</b>
    </td>
  </tr>
</table>

## 参考

[LINUX DO - 新的理想型社区](https://linux.do/)
