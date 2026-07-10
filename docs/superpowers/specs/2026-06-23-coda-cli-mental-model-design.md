# Coda CLI 心智模型重构 Spec

**日期：** 2026-06-23
**状态：** 草案，待用户确认后进入 implementation plan
**范围：** 重新梳理 `Coda skill`、`Coda eval`、`Coda bundle` 与 `/Coda-any` 的用户心智边界

## 1. 背景

当前 Coda 已经具备三条关键能力：

- `/Coda-any` 能生成或优化 Skill，并通过 Bundle authoring state 保存中间状态。
- `Coda eval` 能评估本地 Skill 或 `Coda/eval.yaml`，并产出可浏览报告。
- `Coda bundle` 能处理 factory、draft、eval evidence、review、publish、distribute。

问题不在能力缺失，而在 CLI 心智边界不清。用户看到的是 `skill`、`eval`、`bundle` 三组命令，但它们混合了不同层级的对象：

- `Coda skill` 同时表示 Skill 包管理和 deterministic Skill Run。
- `Coda skill eval` 听起来像通用 Skill 评估，但实际是 Engine Run runtime eval。
- `Coda bundle` 同时是 `/Coda-any` 的内部状态后端、发布检查入口和分发入口。
- `/Coda-any` 是用户真正想用的 Skill Factory，但文档和命令输出仍会暴露较多 Bundle 子命令。

用户因此很难判断：“我现在是在操作 Skill 本体、一次 eval、一个待发布产物，还是一个内部 workflow state？”

## 2. 当前事实

当前 CLI 在 `app/cli/index.ts` 中注册了这些相关入口：

- `Coda eval collect/run`
- `Coda skill install/validate/inspect/run/resume/eval`
- `Coda bundle candidates/draft/list/status/factory-init/factory-generate/factory-resolve/compile/eval-plan/eval-record/review-summary/review/publish/distribute`

这些命令背后的实现已经比较完整：

- `app/commands/skill.ts` 的 `install/validate/inspect` 操作 Skill 包。
- `app/commands/skill.ts` 的 `run/resume/eval` 操作 deterministic Skill Run。
- `app/commands/bundle.ts` 操作 Bundle authoring state，并能给出 next action。
- `Coda eval` 已是面向用户的 eval harness 封装。

因此重构方向应是 **重新分层和包装**，不是推翻现有后端。

## 3. 目标

- 让用户用任务判断入口，而不是用内部对象判断入口。
- 把 `/Coda-any` 生成物的主路径收敛为：创建/恢复、评估、发布。
- 让 `Coda eval` 成为唯一通用 Skill 评估入口。
- 让 `Coda bundle` 退为高级/内部后端命令，保留兼容但不作为 README 主路径。
- 为旧命令提供兼容期、清晰 help、明确 alias 或 deprecation 文案。
- 保持 JSON 输出和现有自动化调用稳定，避免一次性破坏 `/Coda-any` 和测试。

## 4. 非目标

- 不删除现有 `Coda bundle *` 命令。
- 不重写 Bundle authoring state、publish、distribute 或 eval harness。
- 不把 publish 变成无确认的自动动作。
- 不把 `Coda skill run/resume/eval` 当作普通用户主路径推广。
- 不修改 Superpowers 或 OpenSpec 原始 Skill。

## 5. 用户对象模型

用户应该只需要理解四类对象：

| 用户对象          | 用户理解                                    | 推荐入口                           | 当前后端           |
| ----------------- | ------------------------------------------- | ---------------------------------- | ------------------ |
| Skill             | 一个可安装、可检查、可评估的能力包          | `Coda skill`                      | `domains/skill/*`  |
| Eval              | 一次对 Skill 的评估运行和报告               | `Coda eval`                       | `eval/` harness    |
| Publish candidate | `/Coda-any` 生成、等待评估/审核/发布的产物 | `/Coda-any`、未来 `Coda publish` | `domains/bundle/*` |
| Engine Run        | deterministic Skill 的一次受控运行          | 高级命令，未来可归入 `Coda run`   | `domains/engine/*` |

`Bundle` 不应是普通用户必须理解的第一层概念。它更适合作为发布和分发后端术语，只在高级命令和内部文档中出现。

## 6. 推荐 CLI 分层

### 6.1 公开任务层

公开任务层面向普通用户和 README quickstart。

```text
Coda skill    管理 Skill 本体：install / inspect / validate
Coda eval     评估 Skill：collect / run
Coda publish  处理 /Coda-any 产物：status / review / publish / distribute
Coda status   查看当前 Coda 工作流状态
Coda doctor   诊断安装和环境
```

其中 `Coda publish` 是建议新增的门面命令。它不需要引入新状态，只封装现有 Bundle 后端。

### 6.2 高级机制层

高级机制层保留给维护者、自动化和 `/Coda-any` 内部使用。

```text
Coda bundle   Bundle authoring / compile / review / distribute 后端
Coda skill run/resume/eval   deterministic Engine Run 后端
```

这些命令仍可用，但不应该作为新用户文档的主入口。

## 7. `Coda skill` 设计

`Coda skill` 应只表达“Skill 本体管理”：

```bash
Coda skill install <path>
Coda skill inspect <skill>
Coda skill validate <skill>
```

需要避免的心智混淆：

- 不再把通用评估放在 `Coda skill eval`。
- 不再把 deterministic run 作为 `Coda skill` 文档主路径。

兼容策略：

- 保留 `Coda skill run/resume/eval`，但 help 文案明确标注为 Engine Run。
- `Coda skill eval --help` 第一屏必须说明：这不是通用 Skill benchmark；通用评估请用 `Coda eval run`。
- README 中只展示 `install/inspect/validate`，Engine Run 入口放到高级章节或单独文档。

## 8. `Coda eval` 设计

`Coda eval` 是唯一通用 Skill 评估入口。

推荐用户主路径：

```bash
Coda eval collect --manifest ./generated-skill/Coda/eval.yaml
Coda eval run --manifest ./generated-skill/Coda/eval.yaml --html
```

原则：

- `collect` 只做发现预检查。
- `run` 执行真实评估。
- `--html` 是用户报告主路径。
- `--skill-path --quick` 只作为早期本地 smoke，不作为发布前完整证据。

文档中不再引导普通用户直接拼 pytest 参数。pytest harness 保留为维护者路径。

## 9. `Coda publish` 设计

新增 `Coda publish` 作为 `/Coda-any` 生成物的用户门面。

第一阶段建议只封装现有 Bundle 后端，不新增状态：

```bash
Coda publish list
Coda publish status <name>
Coda publish review <name> --platform <id>
Coda publish approve <name> --reviewer <name>
Coda publish run <name> --platform <id>
Coda publish distribute <name> --platform <id> --scope project
```

语义映射：

| 新入口                            | 后端调用                               |
| --------------------------------- | -------------------------------------- |
| `Coda publish list`              | `Coda bundle list`                    |
| `Coda publish status <name>`     | `Coda bundle status <name>`           |
| `Coda publish review <name>`     | `Coda bundle review-summary <name>`   |
| `Coda publish approve <name>`    | `Coda bundle review <name> --approve` |
| `Coda publish run <name>`        | `Coda bundle publish <name>`          |
| `Coda publish distribute <name>` | `Coda bundle distribute <name>`       |

命名上，`publish run` 可以在实现阶段再确认是否改成 `publish finalize` 或 `publish create`。关键原则是：用户看到的是“发布候选产物”，不是“Bundle 内部生命周期”。

## 10. `Coda bundle` 设计

`Coda bundle` 保持现有能力，但定位调整为高级后端。

第一阶段不删除、不隐藏，避免破坏 `/Coda-any` 和现有测试。只做三类收敛：

- help 文案增加 “advanced Bundle backend” 语义。
- README 主路径改为 `/Coda-any`、`Coda eval`、未来 `Coda publish`。
- `bundle status/list/review-summary` 继续提供 JSON next action，供 `/Coda-any` 和 `Coda publish` 复用。

第二阶段可以考虑：

- 把低层 factory 命令从普通 help 中隐藏，但仍可调用。
- 在非 JSON 文本输出中提示对应的 `Coda publish` 门面命令。
- 文档里把 Bundle 解释为 distribution package format，而不是用户工作流入口。

## 11. `/Coda-any` 关系

`/Coda-any` 应继续是创建和优化 Skill 的主要入口。

用户心智应变成：

```text
/Coda-any 创建或恢复生成流程
  -> Coda eval collect/run 验证生成物
  -> Coda publish status/review/run 处理发布 readiness
  -> Coda publish distribute 分发到平台
```

`/Coda-any` 内部仍可以调用 `Coda bundle *`，但面向用户的提示应优先说任务，不优先说内部命令。

例如当前输出如果建议：

```text
Coda bundle review-summary my-skill --platform codex
```

未来更适合显示为：

```text
Coda publish review my-skill --platform codex
```

同时 JSON 保留原始 next action，方便自动化使用。

## 12. 兼容策略

兼容是这次重构的硬约束。

- 所有现有 `Coda bundle *` 命令继续可用。
- 所有现有 JSON 字段保持稳定，新增字段只能向后兼容。
- `Coda publish` 初期作为门面调用现有 command 函数，不复制业务逻辑。
- `Coda skill eval` 不删除，只改 help 和文档定位。
- `/Coda-any` 可分阶段迁移：先继续读 `bundle status --json`，再逐步把用户提示换成 `publish` 门面。

## 13. 文档策略

README 应按用户任务组织：

- 创建/优化 Skill：`/Coda-any`
- 评估 Skill：`Coda eval`
- 发布生成物：`Coda publish`
- 高级 Bundle 后端：链接到高级文档，不放在 quickstart 主线
- Engine Run：单独说明 deterministic run，不和通用 Skill eval 混写

`docs/operations/SKILL-CREATION-ZH.md` 和 `docs/operations/EVAL-USAGE-ZH.md` 需要跟随更新：

- Skill 创建文档不再要求用户理解 Bundle 命令。
- Eval 文档继续坚持 `Coda eval` 是通用评估入口。
- 新增或扩展发布文档，说明 `publish candidate`、readiness、review、publish、distribute 的关系。

## 14. 验收标准

- [ ] README-zh 的用户主路径不再把 `Coda bundle` 当作普通用户必须理解的流程。
- [ ] README 和中文 docs 明确区分 `Coda eval` 与 `Coda skill eval`。
- [ ] `Coda skill eval --help` 明确提示通用 Skill 评估应使用 `Coda eval run`。
- [ ] `Coda bundle --help` 或子命令说明标注其高级/后端定位。
- [ ] 新增 `Coda publish` 门面命令，至少覆盖 `list/status/review/approve/run/distribute` 的第一阶段映射。
- [ ] `Coda publish status <name> --json` 复用 Bundle next action，不引入第二套状态。
- [ ] `/Coda-any` 中文 Skill 优先向用户展示 `Coda publish` 和 `Coda eval` 主路径。
- [ ] 英文 Skill/docs 在中文确认后同步。
- [ ] 测试覆盖新门面命令与旧 Bundle 命令输出的一致性。

## 15. 实施顺序建议

1. 调整 CLI help 和 README/docs 文案，先降低误导。
2. 新增 `Coda publish` 门面命令，内部调用现有 Bundle command 函数。
3. 为 `Coda publish` 增加 CLI e2e 和 command 单元测试。
4. 更新 `/Coda-any` 中文 Skill，让用户提示使用 `publish` 门面。
5. 用户确认中文行为后，同步英文 Skill/docs。
6. 视反馈决定是否隐藏部分低层 `bundle factory-*` help。

## 16. 风险

- `publish` 这个词可能让用户误以为会立即写入或分发。实现时必须把 `review/status` 和真正写入动作区分清楚。
- `Coda publish run` 的命名可能不够直观，implementation plan 中需要最终确认动词。
- 过早隐藏 `bundle` 可能影响维护者排障；第一阶段只调整定位，不删除能力。
- `/Coda-any` 如果直接切到新门面而测试未覆盖，会导致恢复流程和 readiness 判断漂移。
- 文档必须避免把 `gate` 生硬翻译成“门”，中文应使用“检查”“阻塞点”“readiness”等更自然表达。

## 17. 完成定义

这次 CLI 心智重构完成后，普通用户应能用下面路径理解 Coda：

```text
我要创建 Skill：/Coda-any
我要看 Skill 本体：Coda skill inspect/validate
我要评估 Skill：Coda eval collect/run
我要发布生成物：Coda publish status/review/run
我要分发到平台：Coda publish distribute
我在维护底层包格式：Coda bundle
我在跑 deterministic Engine：Coda skill run/resume/eval
```

用户不再需要先理解 Bundle 生命周期，才能完成 `/Coda-any` 生成 Skill 的评估和发布。
