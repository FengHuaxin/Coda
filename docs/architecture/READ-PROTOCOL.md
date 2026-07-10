# Read Protocol（读取与会话纪律）

> 适用范围：所有 Coda 阶段、所有跨平台代理（Claude Code / OpenCode / Copilot）。
> 来源：BMW DX Workflow v2.1（融合精华）。

## [READ PROTOCOL — NON-NEGOTIABLE]

读取上游工件时强制四步：

1. **Read 上游文件** `offset=0 limit=40` → 拿到 `## Index` 段
2. 根据当前任务，从 Index 选出需要的段落 ID
3. **Grep** `"^## <ID>"` 或 `"^- <ID>:"` 定位行号
4. **Read 上游文件** `offset=<行号> limit=80` 拿目标段

### 禁止

- 一次性 Read 上游工件全文
- 跳过 Index 直接猜内容
- 引用上游时不带 ID（必须写 `@PRD-F-001` 形式）

### 例外

仅当 Index 显示 `[critical]` 标签的段落，加载上游时强制随附（无论本次任务是否直接需要）。

---

## [SESSION DISCIPLINE — NON-NEGOTIABLE]

- 一个会话只承担一个 Coda 阶段的职责（open / design / build / verify / archive）
- 阶段完成 → 落盘 → 提示用户启动新会话执行下一步
- 工具调用产生的大输出（pytest log / coverage report / build log）分析完即存 `evidence/`，会话内只保留结论，不保留原始
- 同一工件反复迭代超过 5 轮 → 主动建议落盘 + 启动新会话
- 跨阶段不在同一会话内连跑（避免上下文累积爆炸）

---

## [STATE RECOVERY — COLD START]

任何新会话冷启动时强制：

1. `Glob openspec/changes/*/.Coda.yaml` → 知道已有哪些变更
2. 对每个变更 `Read .Coda.yaml offset=0 limit=40` → 拿到当前 phase
3. 不读任何上游全文，按需 grep + offset 拉
4. 不依赖任何"上次会话说了什么"——**磁盘是唯一事实源**

---

## [INDEX FORMAT]

每个工件文件顶部必须包含以下结构（适用于 `proposal.md` / `design.md` / `tasks.md`）：

```markdown
## Index

> ID prefix: `<前缀>-*`（如 PRD-、TDD-、KB- 等）
> [critical] 标签的段落在引用此工件时强制随附

version: <整数，每次重大修订 +1>
derived_from: [<上游工件名>@v<版本>, ...]

- <ID>: <1 行摘要>  [tags: ...]  [critical?]
- <ID>: <1 行摘要>  [tags: ...]
...
```

正文段落用 `## <ID>: <标题>` 或在表格行首列填入 `<ID>` 与 Index 对齐。

---

## [ID 命名规则]

- 工件前缀（2-3 字符）+ 类型字母（可选）+ 序号
- 例：`PRD-F-001`（PRD 功能 001）、`KB-R-003`（知识库规则 003）、`TDD-S-002`（TDD Story 002）
- ID 全局唯一、永不复用、永不修改
- 段落删除时 ID 标记 `[DEPRECATED]`，不释放

---

## 与 Coda 工作流的整合

| Coda 阶段 | 应用 Read Protocol 的工件 |
|----------|-------------------------|
| 1. Open   | `proposal.md`、`tasks.md` |
| 2. Design | `design.md`、`specs/<capability>/spec.md` |
| 3. Build  | `tasks.md`（按 Story ID 推进）|
| 4. Verify | `verification-report.md` |
| 5. Archive | `archive-summary.md` |

当 `.Coda.yaml` 的 `context_compression: beta` 时，handoff 阶段强制使用 Index 协议替代全文 Spec 摘录。
