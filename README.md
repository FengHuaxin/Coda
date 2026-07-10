# @fenghuaxin/Coda

**Coda is a resumable workflow and Skill platform for AI coding.**

It uses one cross-platform runtime to keep OpenSpec artifacts, Superpowers methods, Skill creation, evaluation, and
publishing in one loop, so you can start a change, resume it later, diagnose drift, and ship reusable Skills from one
toolchain.

## Why Coda

Coda keeps the public workflow simple while moving the fragile parts into a shared runtime:

- **Node-only runtime** — all bundled Coda scripts run through Node.js, so the same workflow works on macOS, Linux,
  and Windows without Bash, Git Bash, or WSL.
- **Resumable workflow** — `/Coda` and the Classic state projection track where a change stopped, so long-running work
  resumes from the current phase instead of forcing the agent to reconstruct progress from scratch.
- **Skill platform** — Coda installs workflow Skills, can author reusable Skill packages, and can turn them into
  distributable Bundles through `/Coda-any`.
- **Diagnostics-aware guardrails** — `status`, `doctor`, and guard/verify flows share the same runtime evidence path, so
  malformed state and missing workflow evidence are surfaced as user-visible diagnostics instead of silent drift.

## Install

Requirements:

- Node.js 20+
- npm/npx
- Git

### From npm

```bash
npm install -g @fenghuaxin/coda
```

### Local development

```bash
git clone <repo-url>
cd coda
npm install
npm run build
npm link
```

See [docs/LOCAL-DEVELOPMENT.md](docs/LOCAL-DEVELOPMENT.md) for detailed development guide.

## Quick Start

```bash
cd your-project
coda init
```

`coda init` will:

1. Prompt you to select AI platforms (auto-detects existing configs)
2. Choose install scope: project-level (current directory) or global (home directory)
3. Select language for Coda skills: English or 中文
4. Select npm dependencies to install/upgrade — [OpenSpec](https://github.com/Fission-AI/OpenSpec) CLI, [Superpowers](https://github.com/obra/superpowers) (via `npx skills add`), and [CodeGraph](https://github.com/colbymchenry/codegraph) CLI. Items not yet detected default to checked; already-installed items default to unchecked so you can opt in to upgrades.
5. Install the selected dependencies and deploy their skills
6. Deploy Coda skills (in your chosen language) to selected platforms
7. Create `docs/superpowers/specs/` and `docs/superpowers/plans/` working directories for project-scope installs

> [!TIP]
> Superpowers v6.0.0+ is recommended — about 2× faster and ~50% fewer tokens than older versions.
> To upgrade Coda itself later: `coda update` or `npm install -g @fenghuaxin/coda@latest`.

## Task Paths

- **Start a Coda workflow** — `coda init` to install the runtime and Skills, then invoke `/Coda` from your agent surface.
- **Create or optimize a reusable Skill** — `/Coda-any` is the main user path. It now generates a stable composed Skill Bundle rather than only a `SKILL.md`, and the ordinary path is `/Coda-any -> coda eval -> coda publish review/approve/run -> coda publish distribute --preview -> coda publish distribute`. Use `coda publish status` or `coda publish review` for normal release readiness, run `coda publish distribute --preview` before any real platform writes, and reach for the `coda bundle` Advanced Bundle backend only when you are debugging the backend state directly. Detailed examples live in [docs/operations/SKILL-CREATION.md](docs/operations/SKILL-CREATION.md).
- **Evaluate a local or generated Skill** — `coda eval ./Coda/eval.yaml --collect` for discovery, then `coda eval ./Coda/eval.yaml --html` for a real run with a browsable summary.
- **Diagnose a stuck workflow** — `coda status` for the current phase and next command, then `coda doctor` when state, runtime evidence, or install health looks wrong.
- **Resume a deterministic Skill Run** — `coda skill run`, follow the printed `Pending action`, then `coda skill continue` or `coda skill check` using the `Next:` hint.

## Support for OpenClaw and Hermes, and other AI platforms

For platforms that use the generic `skills` CLI directly, you can install the coda skill package with:

```bash
npx skills add huaxin/Coda
```

## Commands

<details>
<summary><code>coda init [path]</code> — Initialize Coda workflow</summary>

Initializes OpenSpec, Superpowers, and coda skills for selected AI coding platforms.

| Option              | Description                                                                    |
| ------------------- | ------------------------------------------------------------------------------ |
| `--yes`             | Non-interactive mode, auto-select detected platforms (or all if none detected) |
| `--scope <scope>`   | Install scope: `project` or `global`                                           |
| `--language <lang>` | Skill language: `en` or `zh` (skips interactive language prompt)               |
| `--skip-existing`   | Skip already installed components                                              |
| `--overwrite`       | Overwrite already installed components                                         |
| `--json`            | Output structured JSON                                                         |

When multiple existing components are found on the same platform, interactive init offers one bulk choice: overwrite
all, skip all, or choose per component.

</details>

<details>
<summary><code>coda status [path]</code> — Show active changes and next workflow command</summary>

Displays active changes, task progress, the recommended next Coda workflow command, the current step, runtime mode,
and diagnostic recovery hints when a change is malformed or missing required evidence.

| Option   | Description                                                               |
| -------- | ------------------------------------------------------------------------- |
| `--json` | Output active changes with `nextCommand`, `currentStep`, and runtime data |

</details>

<details>
<summary><code>coda dashboard [path]</code> — Launch local read-only dashboard server</summary>

Starts a local HTTP server that displays a visual dashboard with active changes, phase status, task progress, and archive history. Auto-opens in your browser by default.

| Option      | Description                                                                 |
| ----------- | --------------------------------------------------------------------------- |
| `--port`    | Server port (default: auto-selects available port)                          |
| `--no-open` | Don't auto-open the dashboard in browser                                    |
| `--json`    | Collect single snapshot and print JSON to stdout (for scripting/inspection) |

</details>

<details>
<summary><code>coda doctor [path]</code> — Diagnose Coda installation health</summary>

Checks project/global installation health, working directories, installed skills, scripts, and active change
diagnostics. `coda doctor` reports diagnostic status for malformed `.Coda.yaml` files, current step / runtime mode
for valid changes, and runtime evidence gaps that block safe resume.

| Option            | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| `--json`          | Output structured diagnostic results                            |
| `--scope <scope>` | Diagnose `auto`, `project`, or `global` scope (default: `auto`) |

</details>

<details>
<summary><code>coda update [path]</code> — Update Coda package and skills</summary>

Updates the npm package and refreshes installed coda skills in detected project/global targets.

| Option              | Description                                   |
| ------------------- | --------------------------------------------- |
| `--json`            | Output npm and skill update results as JSON   |
| `--language <lang>` | Override detected skill language (`en`, `zh`) |
| `--scope <scope>`   | Update only `global` or `project` scope       |

</details>

<details>
<summary><code>coda uninstall [path]</code> — Remove coda skills, rules, and hooks</summary>

Safely removes Coda-distributed skills, rules, and hooks from all detected platforms. Preserves user-defined hooks and non-Coda configuration.

| Option            | Description                                |
| ----------------- | ------------------------------------------ |
| `--force`         | Skip confirmation prompt                   |
| `--scope <scope>` | Uninstall only `global` or `project` scope |
| `--json`          | Output removal results as JSON             |

```bash
coda uninstall              # Interactive — shows targets, asks for confirmation
coda uninstall --force      # Non-interactive — removes everything immediately
coda uninstall --scope project  # Only remove project-level installations
```

</details>

<details>
<summary><code>coda skill &lt;command&gt;</code> — Install, inspect, and run local Skill packages</summary>

Discovers explicit Skill directories, project overrides under `.Coda/skills/`, and built-in Skills. Manual Runs
persist an immutable Skill snapshot and pending action; the current Agent or platform executes that action and submits
its outcome through `resume`.

```bash
coda skill add ./my-skill --project .
coda skill show my-skill --json
coda skill run my-skill --change ./changes/demo
coda skill run my-skill --run-id demo-run --project .
coda skill continue --change ./changes/demo
coda skill continue --run-id demo-run --project .
coda skill continue --change ./changes/demo --status succeeded --summary "Done" --artifact report=report.md
coda skill check --change ./changes/demo --scope completion
coda skill continue --change ./changes/demo --upgrade my-skill --project .
```

The common subcommands support `--json`. Runs can bind to a `--change` directory or use `--run-id` under
`.Coda/runs/<run-id>`. `run` supports deterministic Skills in Plan 3; adaptive execution requires an Agent candidate.
Project Skills override built-ins by name, and invalid overrides fail closed instead of silently falling back. Text mode
also prints direct `Pending action` and `Next:` recovery hints so users do not have to infer what to do after a paused
Run or failed runtime check.

</details>

<details>
<summary><code>coda eval [target]</code> — Benchmark Skills through the shared eval harness</summary>

Provides one stable CLI entry point for local Skills and `Coda/eval.yaml`, always launching from the repository
`eval/` root so users do not have to cd manually, reconstruct pytest arguments, or remember `--collect-only`.

```bash
coda eval ./Coda/eval.yaml --collect
coda eval ./Coda/eval.yaml --html
coda eval ./assets/skills/Coda-any --quick
```

Use `--collect` for discovery and preflight only; omit it for actual local benchmark execution. A target ending in
`Coda/eval.yaml` is treated as a manifest, while a Skill directory or `SKILL.md` is treated as a local Skill. `--quick`
defaults local Skill targets to `generic-skill-smoke` for a low-cost smoke path first.

</details>

<details>
<summary><code>coda publish &lt;command&gt;</code> — User-facing release path for <code>/Coda-any</code> outputs</summary>

`coda publish` is the ordinary user-facing release facade. It reuses the existing Bundle state and readiness contract without introducing a second state model.
For Skills generated by `/Coda-any`, run `coda eval` first, then use these commands for readiness, human approval, publish, distribution preview, and confirmed distribution. See [docs/operations/SKILL-CREATION.md](docs/operations/SKILL-CREATION.md) for the full user path.

```bash
coda publish list --project . --json
coda publish status my-bundle --project . --json
coda publish review my-bundle --platform claude --json
coda publish approve my-bundle --reviewer alice --json
coda publish run my-bundle --platform claude --json
coda publish distribute my-bundle --platform claude --scope project --preview --json
coda publish distribute my-bundle --platform claude --scope project --confirm-executables --json
```

The intended mental model is:

- `/Coda-any` creates, resumes, and optimizes the Skill
- `coda eval` validates the generated output
- `coda publish` handles readiness, human approval, publish, and distribution

</details>

<details>
<summary><code>coda bundle &lt;command&gt;</code> — Advanced Bundle backend for <code>/Coda-any</code> and Bundle release operators</summary>

Creates platform-independent Skill Bundles from new goals or existing candidate Skills. Bundle drafts are deterministic:
they compile into native platform Skill/rule/hook install plans, can carry optional Engine metadata, require structured
benchmark evidence, and must receive human approval before publishing or distribution.

For most users, `/Coda-any` is the main user path. Use the Bundle CLI directly when you are auditing backend state,
repairing a blocked draft, or intentionally operating the release pipeline by hand.

```bash
coda bundle candidates --project . --json
coda bundle list --project . --json
coda bundle factory-propose my-bundle --file ./plan.json --json
coda bundle factory-init my-bundle --file ./plan.json --json
coda bundle factory-resolve my-bundle --candidate review-flow --source ./skills/review-flow --json
coda bundle factory-init my-bundle --file ./plan.json --confirmed-proposal --json
coda bundle factory-generate my-bundle --json
coda bundle draft create my-bundle --project .
coda bundle draft optimize ./bundle-source --project .
coda bundle status my-bundle --json
coda bundle compile my-bundle --platform claude --json
coda bundle benchmark-plan my-bundle --level quick --json
coda bundle benchmark-record my-bundle --result ./benchmark.json --json
coda bundle review-summary my-bundle --platform claude --json
coda bundle review my-bundle --approve --reviewer alice --json
coda bundle publish my-bundle --platform claude --json
coda bundle distribute my-bundle --platform claude --scope project --preview --json
coda bundle distribute my-bundle --platform claude --scope project --confirm-executables --json
```

`/Coda-any` is the Coda Skill creation guide: users describe the workflow they want to create or optimize, and Coda
reads project-level preferences from `.Coda/skill-preferences.yaml`, scans real local Skills, shows a composition
proposal for confirmation, then turns the request into a reviewable stable composed Skill Bundle draft. Factory metadata
records `preferenceHash`, resolved Skill evidence, and deviation reasons before CLI backends handle validation, Eval,
publishing, and optional distribution; see the Skill creation guide for the detailed control-plane contract. Missing or ambiguous candidates pause for `factory-resolve` first, review and
publish stay gated by structured evidence, and distribution supports both `project` and `global` scopes. `coda bundle list`
lists recoverable authoring states; `coda bundle status` prints `Next action`, the reason, and a suggested command in
text mode; JSON output includes `nextAction` so `/Coda-any`, `coda publish`, and other automation can resume the correct next step
deterministically. Treat the full command list above as an advanced backend reference, not the ordinary first-run path for
`/Coda-any`.

</details>

| Command           | Description  |
| ----------------- | ------------ |
| `coda --help`     | Show help    |
| `coda --version`  | Show version |

## Supported Platforms

`coda init` supports 31 AI coding platforms:

<details>
<summary>View full platform list</summary>

| Platform           | Skills Dir    | Platform      | Skills Dir   |
| ------------------ | ------------- | ------------- | ------------ |
| Claude Code        | `.claude/`    | Cursor        | `.cursor/`   |
| Codex              | `.codex/`     | OpenCode      | `.opencode/` |
| Windsurf           | `.windsurf/`  | Cline         | `.cline/`    |
| RooCode            | `.roo/`       | Continue      | `.continue/` |
| GitHub Copilot     | `.github/`    | Gemini CLI    | `.gemini/`   |
| Amazon Q Developer | `.amazonq/`   | Qwen Code     | `.qwen/`     |
| Kilo Code          | `.kilocode/`  | Auggie        | `.augment/`  |
| Kimi Code          | `.kimi-code/` | Kiro          | `.kiro/`     |
| Lingma             | `.lingma/`    | Junie         | `.junie/`    |
| CodeBuddy          | `.codebuddy/` | CoStrict      | `.cospec/`   |
| Crush              | `.crush/`     | Factory Droid | `.factory/`  |
| iFlow              | `.iflow/`     | Pi            | `.pi/`       |
| Qoder              | `.qoder/`     | Antigravity   | `.agents/`   |
| Bob Shell          | `.bob/`       | ForgeCode     | `.forge/`    |
| Trae               | `.trae/`      | Trae CN       | `.trae-cn/`  |
| ZCode              | `.zcode/`     | MimoCode      | `.mimocode/` |

</details>

Some platforms use different project and global directories. For example, OpenCode global installs use
`.config/opencode`, MimoCode global installs use `.config/mimocode`, Lingma global installs use `.lingma`, and
Antigravity global installs use `.gemini/antigravity`. ZCode and MimoCode are built on OpenCode and read skills
from their own directories; OpenSpec output is mirrored from `.opencode/` into the matching directory during install.

## Skills

After `coda init`, three groups of skills are installed to the selected platform's `skills/` directory:

### Coda Skills

<details>
<summary>View coda skills</summary>

| Skill            | Description                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| `/Coda`         | Main entry — auto-detects phase and dispatches to sub-commands                                        |
| `/Coda-open`    | Phase 1: Open a change (proposal, design, task breakdown)                                             |
| `/Coda-design`  | Phase 2: Deep design (brainstorming, Design Doc)                                                      |
| `/Coda-build`   | Phase 3: Plan and build (implementation plan, code commits)                                           |
| `/Coda-verify`  | Phase 4: Verify and finish (testing, verification report)                                             |
| `/Coda-archive` | Phase 5: Archive (delta spec sync, status annotation)                                                 |
| `/Coda-hotfix`  | Preset: Quick bug fix (skips brainstorming)                                                           |
| `/Coda-tweak`   | Preset: OpenSpec-chained medium change (delta spec is first-class, skips brainstorming and full plan) |
| `/Coda-any`     | Coda Skill Factory — create/optimize distributable Coda-native Skills                               |

</details>

### Guard & Automation Scripts

<details>
<summary>View script list</summary>

| Script                    | Purpose                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `Coda-env.mjs`           | Script discovery helper — prints the bundled scripts directory so skills can resolve sibling launcher paths |
| `Coda-guard.mjs`         | Phase transition guard — validates exit conditions, `--apply` auto-updates `.Coda.yaml`                    |
| `Coda-handoff.mjs`       | Design handoff — generates deterministic context packages from OpenSpec artifacts with SHA256 tracing       |
| `Coda-archive.mjs`       | One-command archive — validates state, syncs specs, moves to archive, updates status                        |
| `Coda-yaml-validate.mjs` | Schema validator — validates `.Coda.yaml` structure and field values                                       |
| `Coda-hook-guard.mjs`    | Phase write guard — PreToolUse hook, blocks file writes during open/design/archive phases                   |
| `Coda-state.mjs`         | Unified state management — init/set/get/check/scale, agents' exclusive YAML interface                       |

All scripts are thin Node.js facades over the bundled `Coda-runtime.mjs` (generated from TypeScript). They run
through `node` on every platform, so Coda requires only Node.js — no Bash, Git Bash, or WSL.

</details>

### OpenSpec Skills

Spec lifecycle management: propose, explore, sync, verify, archive, and more.

### Superpowers Skills

Development methodology: brainstorming, TDD, subagent-driven development, code review, plan writing, and more.

See [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) for the 0.4.0 runtime model, state split,
diagnostic path, and Bundle/Skill architecture details.

## Workflow

```
/Coda
  ↓ auto-detect
/Coda-open  -->  /Coda-design  -->  /Coda-build  -->  /Coda-verify  -->  /Coda-archive
(OpenSpec)         (Superpowers)       (Superpowers)       (Both)           (OpenSpec)

/Coda-hotfix (preset path, skips brainstorming)
  open  -->  build  -->  verify  -->  archive

/Coda-tweak (lightweight preset, chains OpenSpec, delta spec is first-class)
  open  -->  build  -->  verify  -->  archive
```

### Five Phases

| Phase              | Command          | Owner       | Artifacts                            |
| ------------------ | ---------------- | ----------- | ------------------------------------ |
| 1. Open            | `/Coda-open`    | OpenSpec    | proposal.md, design.md, tasks.md     |
| 2. Deep Design     | `/Coda-design`  | Superpowers | Design Doc, delta spec               |
| 3. Plan & Build    | `/Coda-build`   | Superpowers | Implementation plan, code commits    |
| 4. Verify & Finish | `/Coda-verify`  | Both        | Verification report, branch handling |
| 5. Archive         | `/Coda-archive` | OpenSpec    | delta→main spec sync, archive        |

### Core Principles

- **Brainstorming is non-skippable** — every change must go through deep design (except hotfix/tweak)
- **Delta specs are living documents** — freely editable during Phase 3, synced at archive
- **Keep tasks.md in sync** — check off each task as completed
- **Commit frequently** — one commit per task, message reflects design intent
- **Verify before archive** — `/Coda-verify` must pass before `/Coda-archive`

### State Management

Coda uses a decoupled state architecture with separate files:

| File                    | Owner    | Purpose                                             |
| ----------------------- | -------- | --------------------------------------------------- |
| `.openspec.yaml`        | OpenSpec | Spec lifecycle, change metadata                     |
| `.Coda.yaml`           | Coda    | Workflow phase, execution mode, verification status |
| `.Coda/run-state.json` | Engine   | Run identity and execution state (machine-owned)    |

`.Coda.yaml` holds all user-facing Classic workflow fields and a `run_id` link. The Engine stores Run fields
(`current_step`, `skill`, `iteration`, `run_status`, etc.) separately in `.Coda/run-state.json` (camelCase JSON).
Legacy changes with Run fields embedded in `.Coda.yaml` are auto-migrated on first read.

All states and execution phases are updated via scripts, and each phase verifies that tasks are truly complete before
advancing. Compared to storing complex state rules only in Skill text, this script-backed state machine gives Coda more
reliable phase transitions, correct YAML, and easier breakpoint recovery; agents can read the current Spec situation
through Coda's built-in commands.

<details>
<summary>View key .Coda.yaml fields</summary>

**Key Fields in `.Coda.yaml`:**

```yaml
workflow: full
auto_transition: true
phase: build
skill: Coda-classic # Resolved Skill package name
run_id: <uuid> # Links to .Coda/run-state.json
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

In full workflow, `build_mode`, `build_pause`, `isolation`, `verify_mode`, `tdd_mode`, and `subagent_dispatch` may
temporarily be `null`; `build_mode` and `isolation` must be resolved before `build → verify`. `auto_transition` controls automatic vs manual skill invocation after phase completion — see [AUTO-TRANSITION.md](docs/AUTO-TRANSITION.md). `build_pause` records an internal build-phase pause point:
`null` means no pause, while `plan-ready` means the plan has been generated and the user paused before choosing
isolation and execution mode. It is not an execution mode and must not be written into `build_mode`.
`verification_report` stays `null` until verification writes a report, and `verify-pass` requires that report to exist
plus `branch_status: handled`. Fields after `archived` in the example are optional or script-derived: `direct_override`
is only needed for full-workflow direct builds, project commands may be absent unless configured, and
`handoff_context` / `handoff_hash` are recorded by `Coda-handoff.mjs` before leaving design. Projects can configure
`build_command` / `verify_command` in the change or repo root, and guard will run those commands first and print failure
output. Configured commands use a restricted shell grammar: command words, quotes, paths, and `&&` for sequential steps
are allowed; `;`, pipes, bare `&`, `$`, and backticks are rejected. `review_mode` controls automatic code review during
Build/Verify (`off` skips, `standard` reviews key changes, `thorough` reviews everything); can be set project-wide in
`.Coda/config.yaml`.

</details>

### Reliability Features

Coda ensures agent execution reliability through automated state transitions:

<details>
<summary>View reliability features</summary>

1. **Entry Verification** — Each phase validates preconditions before execution
   - Checks file existence, state consistency, and phase transitions
   - Outputs `[HARD STOP]` with actionable suggestions if validation fails

2. **Automated State Transitions** — `Coda-guard.mjs --apply` updates `.Coda.yaml` automatically
   - All phase transitions (open → design/build → verify → archive) use `guard --apply`
   - No manual state editing required — eliminates write-verification errors
   - `Coda-state.mjs` is the agents' exclusive interface for state operations
   - Guard and archive scripts use `Coda-state.mjs` internally for state management

3. **Schema Validation** — `Coda-yaml-validate.mjs` ensures data integrity
   - Validates required and optional fields
   - Validates enum values, including `direct_override`
   - Validates `design_doc`, `plan`, and `handoff_context` paths exist, plus `handoff_hash` format
   - Detects unknown/typos fields

4. **Build Decision Enforcement** — Guard and state transitions both block skipped build choices
   - `isolation` must be `branch` or `worktree`
   - `build_mode` must be selected before leaving build
   - `build_pause: plan-ready` is a recoverable pause after plan generation, not a `build_mode`
   - Full workflow `build_mode: direct` requires `direct_override: true`

5. **Verification Evidence** — Guard enforces proof before phase advance
   - `verify-pass` transition requires `verification_report` pointing to an existing report file
   - `branch_status` must be `handled` before verify can pass
   - Guard checks `verification_report exists` and `branch_status=handled` as hard prerequisites
   - Prevents false phase advances when verification or branch handling was skipped

6. **Archive Automation** — `Coda-archive.mjs` handles the full archive flow in one command
   - Validates entry state, merges delta specs into main specs through OpenSpec
   - Annotates design doc and plan frontmatter
   - Moves change to archive directory and updates `archived: true`
   - Supports `--dry-run` for preview

</details>

## Project Structure

```
your-project/
├── .Coda/
│   └── config.yaml              # Project-level global config (context_compression, review_mode, auto_transition)
├── .claude/skills/              # Platform skills dir (Coda + OpenSpec + Superpowers)
│   ├── Coda/SKILL.md
│   │   └── scripts/
│   │       ├── Coda-guard.mjs       # Phase transition guard (--apply auto-updates state)
│   │       ├── Coda-env.mjs         # Script discovery helper
│   │       ├── Coda-handoff.mjs     # Design handoff (OpenSpec → Superpowers context tracing)
│   │       ├── Coda-archive.mjs     # One-command archive automation
│   │       ├── Coda-yaml-validate.mjs # Schema validator
│   │       ├── Coda-hook-guard.mjs   # Phase write guard (PreToolUse hook)
│   │       └── Coda-state.mjs       # Unified state management (init/set/get/check/scale)
│   ├── Coda-*/SKILL.md
│   ├── openspec-*/SKILL.md
│   └── brainstorming/SKILL.md
├── openspec/                    # OpenSpec — WHAT
│   ├── config.yaml
│   └── changes/
│       └── <name>/
│           ├── .openspec.yaml       # OpenSpec state
│           ├── .Coda.yaml          # Coda workflow state (Classic fields + run_id link)
│           ├── .Coda/
│           │   └── run-state.json   # Engine Run state (machine-owned, auto-migrated)
│           ├── proposal.md
│           ├── design.md
│           ├── specs/<capability>/spec.md
│           └── tasks.md
└── docs/superpowers/            # Superpowers — HOW
    ├── specs/                   # Design documents
    └── plans/                   # Implementation plans
```

<details>
<summary>Context Compression (Beta)</summary>

Coda supports context compression at the Design → Build handoff. When enabled, `Coda-handoff.mjs` generates a compact
context package that reduces Build-phase input tokens by **25–30%** without affecting implementation correctness.

| Mode   | Behavior                                 | Token Savings |
| ------ | ---------------------------------------- | ------------- |
| `off`  | Full Spec excerpts in handoff context    | Baseline      |
| `beta` | Design Doc + SHA256 hash references only | ~25–30%       |

Key findings from benchmark testing:

- **Test pass rate**: 100% across all tiers (compression does not affect correctness)
- **Spec coverage**: 100% (off) vs 95% (beta) — minor edge-case detail loss
- **Scaling**: Larger tasks yield higher absolute savings (up to 15,000 tokens for large-tier tasks)

Enable in `.Coda/config.yaml`: `context_compression: beta`

See [CONTEXT-COMPRESSION.md](docs/CONTEXT-COMPRESSION.md) for the full benchmark report, compression principles, and
reproduction steps.

</details>

<details>
<summary>Auto Transition</summary>

`auto_transition` controls whether Coda automatically invokes the next skill after a phase completes, or pauses for
manual handoff. Phase advancement itself always happens — this setting only affects skill invocation.

| Value   | Behavior                                                      |
| ------- | ------------------------------------------------------------- |
| `true`  | Auto-invoke the next skill after each phase (default)         |
| `false` | Pause after each phase; user manually triggers the next skill |

Three-layer configuration with precedence: `Coda_AUTO_TRANSITION` env var > `.Coda/config.yaml` (project) > `.Coda.yaml` (change).

See [AUTO-TRANSITION.md](docs/AUTO-TRANSITION.md) for configuration details, workflow mapping, and FAQ.

</details>

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) | [中文版](CONTRIBUTING-zh.md) for development setup, commit
conventions, PR process, branch workflow, and guidance for adding platforms,
skills, scripts, or changelog entries.

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

## Roadmap

Track our development progress and upcoming features on the [Coda Roadmap](https://github.com/orgs/rpamis/projects/1).

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=rpamis/Coda&type=Date)](https://star-history.com/#rpamis/Coda&Date)

## Contributors

<a href="https://github.com/rpamis/Coda/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=rpamis/Coda&columns=12&anon=1" />
</a>

## License

[MIT](LICENSE)

## Community

<table align="center">
  <tr>
    <td align="center" width="180">
      <img src="https://github.com/rpamis/Coda/blob/master/img/douyin.png" width="120" height="120"><br>
      <b>DouYin (Recommended)</b>
    </td>
    <td align="center" width="180">
      <img src="https://github.com/rpamis/Coda/blob/master/img/wechat.jpg" width="120" height="120"><br>
      <b>WeChat</b>
    </td>
    <td align="center" width="180">
      <img src="https://github.com/rpamis/Coda/blob/master/img/qq.jpg" width="120" height="120"><br>
      <b>QQ</b>
    </td>
  </tr>
</table>

## Reference

[LINUX DO - 新的理想型社区](https://linux.do/)
