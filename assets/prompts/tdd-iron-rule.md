# TDD Iron Rule（TDD 铁律）

> 适用范围：Coda Build 阶段（`/Coda-build`）、所有测试驱动实现。
> 来源：BMW DX Workflow v2.1（融合精华）。

## [TDD IRON RULE — NON-NEGOTIABLE]

**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.**

### RED → GREEN → REFACTOR 循环

- **RED**：先写测试，运行确认失败，确认失败原因正确（功能缺失，不是语法错误）
- **GREEN**：最小实现让测试通过，不超过 50 行
- **REFACTOR**：必须执行，至少做一项（提取常量 / 重命名 / 提取函数 / 消除重复 / 简化条件）

### 强制顺序

- 每个 Story 完成完整 RED→GREEN→REFACTOR 循环后才能进入下一个
- 测试与实现分不同 commit
- 先写测试（RED），确认失败后再写实现（GREEN）

### 文件隔离

- 每个 Story 独立文件，禁止多个 Story 共享同一文件
- 分层：routes/ → services/ → models/
- 业务逻辑必须在 service 层，不在 route 层

### 禁止

- `test.skip` / `@pytest.mark.skip` / `@pytest.mark.xfail`
- 先写实现后补测试
- 删除测试以"通过"验证
- Mock/Fallback 实现替代真实功能

---

## 与 Coda 字段的对应

| Coda 字段 | TDD 铁律中的含义 |
|----------|----------------|
| `tdd_mode: strict` | 强制 RED→GREEN→REFACTOR，禁止跳过 REFACTOR |
| `tdd_mode: red-green` | 允许跳过 REFACTOR（仅紧急修复）|
| `tdd_mode: null` | 不强制 TDD，由 Agent 自行决定 |
| `verify_mode: tdd` | verify 阶段必须跑测试 + 覆盖率检查 |
