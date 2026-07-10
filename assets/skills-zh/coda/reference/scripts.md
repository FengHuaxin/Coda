# 脚本定位与命令

规范路径：`Coda/reference/scripts.md`

本文件是 Coda 脚本定位和 state/guard/handoff/archive 命令面的单一事实来源。每会话加载一次，然后复用缓存的环境变量。

## 引导（每会话运行一次）

Coda 脚本随 skill 包分发在 `Coda/scripts/` 下。**不硬编码路径** — 定位一次，缓存到环境变量。此块为标准样板，在每个子 skill 中独立重复以确保可独立加载；修改时必须保持所有文件同步：

```bash
Coda_ENV="${Coda_ENV:-$(find . "$HOME"/.*/skills "$HOME/.config" "$HOME/.gemini" -path '*/Coda/scripts/Coda-env.mjs' -type f -print -quit 2>/dev/null)}"
if [ -z "$Coda_ENV" ]; then
  echo "ERROR: Coda-env.mjs not found. Ensure the Coda skill is installed." >&2
  return 1
fi
Coda_SCRIPTS_DIR="$(node "$Coda_ENV")"
Coda_STATE="$Coda_SCRIPTS_DIR/Coda-state.mjs"
Coda_GUARD="$Coda_SCRIPTS_DIR/Coda-guard.mjs"
Coda_HANDOFF="$Coda_SCRIPTS_DIR/Coda-handoff.mjs"
Coda_ARCHIVE="$Coda_SCRIPTS_DIR/Coda-archive.mjs"
Coda_RUNTIME="$Coda_SCRIPTS_DIR/Coda-runtime.mjs"

# 脚本定位失败时停止流程
if [ -z "$Coda_SCRIPTS_DIR" ]; then
  echo "ERROR: Coda scripts not found. Ensure the Coda skill is installed." >&2
  return 1
fi
```

加载 Coda 后，agent 应执行以上变量赋值一次，后续全程复用 `$Coda_GUARD`、`$Coda_STATE`、`$Coda_HANDOFF`、`$Coda_ARCHIVE`。

## 自动状态更新

guard 支持 `--apply` 参数，验证通过后自动更新 `.Coda.yaml` 状态字段：

```bash
node "$Coda_GUARD" <change-name> <phase> --apply
```

`--apply` 内部委托给 `Coda-state transition`。需要直接表达状态事件时使用：

```bash
node "$Coda_STATE" transition <change-name> open-complete
node "$Coda_STATE" transition <change-name> design-complete
node "$Coda_STATE" transition <change-name> build-complete
node "$Coda_STATE" transition <change-name> verify-pass
node "$Coda_STATE" transition <change-name> verify-fail
```

归档完成由 `node "$Coda_ARCHIVE" <change-name>` 负责；OpenSpec 会把 change 移到带日期前缀的归档目录，不要手动 transition 一个 `<archive-name>`。

## 解析下一步

阶段守卫推进 phase 后，用 `next` 子命令解析是否自动调用下一个 skill：

```bash
node "$Coda_STATE" next <change-name>
```

输出 `NEXT: auto|manual|done` + `SKILL: <skill-name>`（`done` 时省略）+ `HINT`（仅 `manual` 时）。`auto_transition: false` 时输出 `manual`，只暂停下一 skill 调用，不影响已发生的 phase 推进。

## 归档脚本

一键完成归档全部步骤：

```bash
node "$Coda_ARCHIVE" <change-name>
```
