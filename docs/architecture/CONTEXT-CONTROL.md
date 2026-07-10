# 上下文控制架构

> Coda 的上下文控制是一套多层阀门系统，精准决定 Agent 在每个阶段能"看到"什么，避免上下文膨胀。

## 问题

Agent 工作流的天然矛盾：

- **设计阶段**需要开放、发散的上下文来探索方案
- **构建阶段**需要精确、聚焦的上下文来执行代码
- **验证阶段**需要结构化的证据来确认完成度

如果 Agent 背着前几个阶段的全部对话历史进入下一阶段，上下文会不可控地膨胀，最终导致质量下降和 Token 浪费。

Coda 的方案：**不是把所有东西放进上下文，而是精确控制什么进、什么不进。** 上下文是缓存，不是内存——能引用就不嵌入，能截断就不全文，能分离就不耦合。

---

## 一、阶段隔离（最粗粒度）

每个阶段由独立的 Agent 调用执行，上下文不跨阶段携带：

```
/Coda-open  ──►  /Coda-design  ──►  /Coda-build  ──►  /Coda-verify  ──►  /Coda-archive
    │                  │                  │                  │
    │     手写设计文档       设计交接包           验证报告
    │    (长格式人类思考)    (SHA256 精炼)      (结构化的证据)
    ▼                  ▼                  ▼                  ▼
```

| 阶段 | Agent 看到的上下文 |
|------|-------------------|
| Open | 用户需求 → 生成 proposal / design / tasks |
| Design | proposal + design → 输出设计文档 + delta spec |
| Build | **交接包**（handoff context）+ 你的代码库 |
| Verify | 实现代码 + 测试结果 + 验证报告 |
| Archive | 变更状态 + spec 同步 |

阶段间的桥梁是**持久化文件**，不是 Agent 的对话历史。这是上下文控制的第一道闸门。

---

## 二、Handoff 交接包（Design → Build 的核心阀门）

`Coda-handoff.mjs` 在 Design 完成时生成，决定什么实际进入 Build Agent 的上下文。

### 源文件扫描

```
openspec/changes/<name>/
├── proposal.md       ← 必选
├── design.md         ← 必选
├── tasks.md          ← 必选
└── specs/<cap>/spec.md ← 可选（delta spec）
```

代码见 `handoffSourceFiles()`：

```typescript
async function handoffSourceFiles(changeDir: string): Promise<string[]> {
  const files = [`${changeDir}/proposal.md`, `${changeDir}/design.md`, `${changeDir}/tasks.md`];
  const specs = `${changeDir}/specs`;
  if (await exists(specs)) {
    for (const entry of (await fs.readdir(specs)).sort()) {
      // 加入所有 specs/<cap>/spec.md
    }
  }
  return files;
}
```

### 截断策略

`writeMarkdownContext()` 按文件行数决定嵌入多少：

```typescript
if (mode === 'full' || total <= 80) {
  // 全文嵌入
} else {
  // 截断到前 80 行 + SHA256 引用
  firstLines(content, 80)
}
```

超过 80 行的文件，Build Agent 只看到前 80 行。完整内容通过 SHA256 引用，需要时才去读原文。

### 输出文件

- `design-context.md` — 人类可读的上下文 markdown
- `design-context.json` — 机器可读的引用清单（含每个文件的 path + sha256）

---

## 三、Context Compression（Beta — ~25-30% Token 节省）

配置文件：`.Coda/config.yaml` 或 `.Coda.yaml` 中的 `context_compression` 字段。

| 模式 | 行为 | Token 节省 |
|------|------|-----------|
| `off` | 全部源文件嵌入（超 80 行截断） | 基准 |
| `beta` | 只嵌入 delta spec，其他设计文件只记录 SHA256 | ~25-30% |

### Beta 模式的具体行为

`context_compression: beta` 时，交接包写入不同文件：

```typescript
if (contextCompression === 'off') {
  contextJson = 'design-context.json';
  contextMd  = 'design-context.md';
} else if (contextCompression === 'beta') {
  contextJson = 'spec-context.json';   // ← 不同的文件名
  contextMd  = 'spec-context.md';
}
```

**`spec-context.md` 只包含**：

1. **源文件引用列表**——每个文件的 path + SHA256，不嵌入内容
2. **delta spec 的完整投影**——`specs/<cap>/spec.md` 全文嵌入
3. **一段说明**——"Full source files remain canonical..."

这种设计基于一个观察：Build Agent 最需要的是 delta spec（精确的验收条件），而 proposal 和 design 的主要价值是 SHA256 可追溯——需要时再读原文。

### 基准测试结论

| 指标 | off | beta | 差异 |
|------|-----|------|------|
| 测试通过率 | 100% | 100% | 无影响 |
| Spec 覆盖率 | 100% | 95% | 边缘细节有轻微损失 |
| 大任务节省 | 基准 | 最高 15,000 tokens | 任务越大越明显 |

详见 `scripts/benchmark/context-compression-benchmark.mjs`。

---

## 四、三层配置优先级

context_compression、auto_transition、review_mode 三个字段支持三层覆盖：

```
1. 环境变量         ← 最高优先级
2. 项目配置文件     ← .Coda/config.yaml
3. 变更配置         ← openspec/changes/<name>/.Coda.yaml
```

代码示例（`classic-state-command.ts`）：

```typescript
async function contextCompression(): Promise<string> {
  const value =
    process.env.CODA_CONTEXT_COMPRESSION ??          // 1. 环境变量
    (await projectConfigValue('context_compression')) ??  // 2. 项目配置
    'off';                                            // 3. 默认值
}
```

这意味着：
- **团队**可以在项目级 `config.yaml` 统一设置上下文策略
- **个人**可以用环境变量临时覆盖（如 `CODA_CONTEXT_COMPRESSION=off` 逐个检查细节）
- **变更**可以独立选择最适合自己的模式

---

## 五、状态分离

`.Coda.yaml` 和 `.Coda/run-state.json` 的分离本身是一种上下文控制手段：

```
.Coda.yaml           → YAML，用户可编辑，只含工作流字段（约 20 个字段）
.Coda/run-state.json → 自动管理的运行态（currentStep/pending/status 等）
```

为什么这控制了上下文：

1. **Agent 只需要读 `.Coda.yaml`**——它关心的只是 phase、build_mode、verify_result 等少量字段
2. `run-state.json` 的 currentStep、trajectoryRef 等字段是机器使用的，不进入 Agent 视野
3. **防止误改**——`Coda-state set` 拒绝写入 machine-owned 字段

旧格式（Run 字段嵌入 `.Coda.yaml`）在首次读取时自动迁移。

---

## 六、Trajectory 日志 — 事件流不膨胀上下文

`.Coda/trajectory.jsonl` 是 append-only 的事件日志：

```jsonl
{"sequence":1,"timestamp":"...","type":"run_started","data":{...}}
{"sequence":2,"timestamp":"...","type":"state_migrated","data":{...}}
{"sequence":3,"timestamp":"...","type":"state_transitioned","data":{...}}
```

关键设计：**trajectory 是持久化文件，不是 Agent prompt。** Agent 不加载 trajectory 进入上下文。

- 恢复时只验证 `trajectoryOffset`（检查点记录了应该有多少事件）
- 诊断时通过 `Coda status/doctor` 读取 trajectory——那是工具的输出，不是上下文的一部分

---

## 七、Checkpoint + SHA256 — 确定性恢复

`checkpoint.json` 记录：

```json
{
  "runId": "<uuid>",
  "trajectoryOffset": 42,
  "contextHash": "<sha256 of handoff context>",
  "artifactsHash": "<sha256 of artifacts>",
  "createdAt": "2026-06-29T..."
}
```

恢复时验证三步：

1. `contextHash` 和当前 handoff 上下文一致
2. `artifactsHash` 和 handoff 输出文件一致
3. `trajectoryOffset` 保证事件日志完整

**任何不一致 → 拒绝恢复**。不会用"差不多"的上下文继续。

代码见 `completedHandoffIsCurrent()`：

```typescript
async function completedHandoffIsCurrent(
  changeDir, run, contextHash, contextJson, contextMd
): Promise<boolean> {
  // 验证 handoff 文件存在
  // 验证上下文内容未改变
  // 验证 artifact 引用一致
  // 验证 checkpoint 的 runId + contextHash + artifactsHash 全部匹配
}
```

---

## 八、Skill 快照 — 版本锁定

每次 `run` 时冻结当前 Skill 包的不可变副本：

```
.Coda/skill-snapshots/<sha256>/
├── SKILL.md
├── package.json
└── sha256
```

恢复时验证："生成此上下文的 Skill 和现在要运行的 Skill 是同一个版本吗？"

- 版本不一致 → 拒绝恢复
- 防止 Skill 升级后同一段上下文产生不同行为
- 锁定的是内容哈希，不是版本号——确保确定性

---

## 九、各机制的控制效果

| 机制 | 控制什么 | 效果 |
|------|---------|------|
| 阶段隔离 | Agent 不跨阶段携带历史 | 根本性防止上下文膨胀 |
| Handoff 截断 | 大文件只嵌入前 80 行 | 文档大小不影响 Build 上下文 |
| Context Compression (beta) | 设计文档只引用 SHA256 | 大任务节省 25-30% Token |
| 状态分离 | Agent 只暴露少量字段 | 减少不必要的上下文负载 |
| Trajectory | 事件日志不在 prompt 中 | 上下文不随运行次数线性增长 |
| Checkpoint | 恢复前验证完整性 | 防止静默不一致 |
| Skill 快照 | 版本不一致时拒绝恢复 | 防止升级导致的行为漂移 |

---

## 相关文档

- [架构概览](ARCHITECTURE.md)
- [上下文压缩](../CONTEXT-COMPRESSION.md) — Design → Build 阶段交接的 Token 优化细节与基准报告
- [自动衔接](../AUTO-TRANSITION.md) — 阶段守卫推进后的下一 Skill 路由协议
