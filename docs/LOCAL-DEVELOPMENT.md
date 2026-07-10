# Coda 本地开发和使用教程

本文档介绍如何在本地安装、开发和测试 Coda。

## 环境要求

- **Node.js 20+**
- **npm**（或 pnpm）
- **Git**
- **Windows PowerShell** 或 **Bash**（macOS/Linux）

## 本地安装

### 方式 1：全局安装（推荐用于开发）

```bash
# 进入 Coda 项目目录
cd D:\workSpaces\AIWorkSpaces\coda

# 安装依赖
npm install

# 构建项目
npm run build

# 全局链接（创建符号链接）
npm link

# 验证安装
coda --version
```

### 方式 2：全局安装（直接安装）

```bash
cd D:\workSpaces\AIWorkSpaces\coda
npm install -g .
coda --version
```

### 方式 3：从 npm 安装（发布后）

```bash
npm install -g @fenghuaxin/coda
```

## 开发工作流

### 1. 构建项目

```bash
# 构建 TypeScript 代码
npm run build

# 构建 Classic runtime
npm run build:classic-runtime

# 构建 dashboard
npm run build:dashboard
```

### 2. 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npx vitest run test/domains/coda-classic/coda-scripts.test.ts

# 运行 benchmark
node scripts/benchmark/classic-baseline-regression.mjs
node scripts/benchmark/coda-bundle-compatibility-benchmark.mjs
```

### 3. 代码质量检查

```bash
# Prettier 格式化检查
npm run format:check

# ESLint 检查
npm run lint

# 架构 lint
npm run lint:architecture
```

## 使用 Coda

### 初始化项目

```bash
# 创建测试项目
mkdir my-coda-project
cd my-coda-project

# 初始化 Coda
coda init
```

`coda init` 会引导你：
1. 选择 AI 平台（Claude Code、Cursor、OpenCode 等）
2. 选择安装作用域（project 或 global）
3. 选择语言（English 或 中文）
4. 选择要安装的依赖（OpenSpec、Superpowers、CodeGraph）

### 常用命令

```bash
# 查看当前状态
coda status

# 诊断安装问题
coda doctor

# 启动可视化仪表盘
coda dashboard

# 升级 Coda
coda update

# 卸载 Coda
coda uninstall
```

### Skill 管理

```bash
# 安装本地 Skill
coda skill add ./my-skill

# 查看 Skill 信息
coda skill show my-skill

# 运行 Skill
coda skill run my-skill

# 继续执行 Skill
coda skill continue

# 检查 Skill 状态
coda skill check
```

### Bundle 管理

```bash
# 查看候选 Skill
coda bundle candidates

# 创建 Bundle 草稿
coda bundle draft create my-bundle

# 编译 Bundle
coda bundle compile my-bundle --platform claude

# 发布 Bundle
coda bundle publish my-bundle --platform claude

# 分发 Bundle
coda bundle distribute my-bundle --platform claude --scope project
```

### 评估和发布

```bash
# 评估 Skill
coda eval ./Coda/eval.yaml --collect
coda eval ./Coda/eval.yaml --html

# 发布 Skill
coda publish list
coda publish status my-bundle
coda publish review my-bundle --platform claude
coda publish approve my-bundle --reviewer alice
coda publish distribute my-bundle --platform claude --scope project --preview
```

## 项目结构

```
coda/
├── app/                    # CLI 入口和命令
├── domains/                # 业务领域模块
│   ├── bundle/            # Bundle 管理
│   ├── coda-classic/      # Classic runtime
│   ├── dashboard/         # 仪表盘
│   ├── engine/            # Skill 引擎
│   ├── skill/             # Skill 管理
│   └── ...
├── platform/              # 平台适配层
├── assets/                # 静态资源
│   ├── manifest.json      # 资产清单
│   ├── skills/            # 英文 Skill
│   └── skills-zh/         # 中文 Skill
├── scripts/               # 构建和测试脚本
├── test/                  # 测试文件
└── docs/                  # 文档
```

## 关键文件

### 状态文件

- `.Coda.yaml` - Classic 工作流状态（大写 C）
- `.Coda/run-state.json` - Run 状态（大写 C 目录）
- `.openspec.yaml` - OpenSpec 状态

### Launcher 文件

- `Coda-state.mjs` - 状态管理
- `Coda-guard.mjs` - 阶段守护
- `Coda-handoff.mjs` - 设计交接
- `Coda-archive.mjs` - 归档
- `Coda-runtime.mjs` - 运行时

### 配置文件

- `config/repository-layout.json` - 仓库布局配置
- `assets/manifest.json` - 资产清单
- `package.json` - 项目配置

## 常见问题

### Q: `coda` 命令找不到？

A: 确保：
1. 已运行 `npm link` 或 `npm install -g .`
2. npm 全局 bin 目录在 PATH 中
3. 重新打开终端

### Q: 测试失败？

A: 运行以下命令：
```bash
npm run build
npm run build:classic-runtime
npm test
```

### Q: 如何添加新的 Skill？

A: 参考 `docs/operations/SKILL-CREATION.md`，使用 `/Coda-any` 工作流。

### Q: 如何调试 Classic runtime？

A: 使用 `Coda-state.mjs` 的 `--debug` 标志：
```bash
node assets/skills/coda/scripts/Coda-state.mjs get <change-name> phase --debug
```

## 发布流程

### 1. 更新版本号

```bash
npm version patch  # 或 minor / major
```

### 2. 运行所有检查

```bash
npm run format:check
npm run lint
npm test
npm run build
```

### 3. 发布到 npm

```bash
npm publish --access public
```

## 开发指南

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/my-feature`
3. 提交更改：`git commit -am 'Add my feature'`
4. 推送分支：`git push origin feature/my-feature`
5. 创建 Pull Request

## 许可证

MIT

## 参考

- [README.md](./README.md) - 项目介绍
- [CHANGELOG.md](./CHANGELOG.md) - 版本历史
- [docs/architecture/ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md) - 架构文档
