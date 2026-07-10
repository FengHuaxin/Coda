# Security Red Lines（安全红线）

> 适用范围：所有 Coda 阶段、所有提交到主分支的代码。
> 来源：BMW DX Workflow v2.1（融合精华）。

## [SECURITY RED LINES — MUST NOT DO]

以下任一出现，立即 Block，要求修复后复检：

- **硬编码密钥**：`const API_KEY = "sk-xxx"`
- **SQL 拼接**：`SELECT * FROM users WHERE id = ${userId}`
- **命令注入**：`` exec(`rm -rf ${userPath}`) ``
- **类型绕过**：`as any` / `@ts-ignore` / `@ts-expect-error`
- **空 catch 块**：`catch(e) {}`
- **删除测试**以"通过"验证
- **Mock/Fallback** 实现替代真实功能
- **明文存储**用户敏感数据（密码、token、PII）

## [MUST DO]

- **环境变量**：`process.env.API_KEY`
- **参数化查询**：`WHERE id = $1` 或 ORM
- **输入验证**：所有外部输入必须验证（类型、长度、范围、白名单）
- **审计日志**：关键操作（登录、权限变更、数据导出、支付）必须记录
- **多端点写在独立文件**
- **测试和实现分不同 commit**
- **密钥/令牌使用密管服务**（Vault / KMS / Keychain）

## [CODE QUALITY GATE]

- TypeScript strict mode，ESLint 0 errors
- Python：mypy strict，ruff/flake8 0 errors
- 测试覆盖 >80% 核心逻辑
- 禁止 `test.skip` / `@pytest.mark.skip`

---

## Coda 项目的具体红线

- 禁止在 `app/`、`domains/`、`platform/` 中使用 `as any`（ESLint 已配置）
- 禁止在 `app/commands/*.ts` 中处理未验证的路径输入
- 禁止在 `domains/coda-classic/` 中跳过 YAML 校验
- 禁止在 `assets/skills/` 中硬编码任何用户凭据
- 所有平台 Skill 安装必须使用 `domains/skill/platform-install.ts` 的统一接口，禁止散落实现
