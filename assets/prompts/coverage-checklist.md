# Test Coverage Checklist（测试覆盖清单）

> 适用范围：Coda Build 阶段产出、Coda Verify 阶段验收。
> 来源：BMW DX Workflow v2.1（融合精华）。

## [TEST COVERAGE CHECKLIST — 每个端点 / 每个业务函数]

完成下述全部 5 类才视为本 Story 测试覆盖通过：

- [ ] **正常输入** → 预期输出
- [ ] **异常输入** → 预期错误码 / 错误信息
- [ ] **边界条件**（空值 / 超长 / 特殊字符 / 极值 / 类型错误）
- [ ] **权限校验**（无 token / 错误角色 / 越权访问）
- [ ] **审计日志**（关键操作必须有日志记录测试）

## [覆盖率门槛]

- 核心业务逻辑覆盖率 >= 80%
- 关键路径（支付、认证、权限、数据写）覆盖率 >= 95%
- 新增代码 100% 覆盖

## [验证命令]

```bash
pnpm test:coverage   # vitest run --coverage
```

## [反模式]

- 只测正常路径，不测异常
- 测试断言只有 `assert response.status_code == 200`，没断言数据正确性
- 测试使用全量 mock，不验证真实集成
- 测试之间存在顺序依赖

---

## Coda 项目的测试目录规范

- `test/app/` — `app/commands/*.ts` 的命令行为
- `test/domains/<domain>/` — `domains/<domain>/*.ts` 的业务逻辑
- `test/platform/` — `platform/**/*.ts` 的平台适配
- `test/scripts/` — `scripts/**/*.mjs` 的自动化脚本
- `test/repository/` — 跨层约束（README、CI、仓库布局）
- `test/fixtures/` 和 `test/helpers/` — 测试数据与工具

新功能必须有单元测试，通过后才能找用户确认。测试覆盖率作为 Build → Verify 转换的硬门槛之一。
