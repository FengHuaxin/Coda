---
name: Coda
description: "Coda — OpenSpec + Superpowers dual-star development workflow. Start with /Coda for automatic phase detection and dispatch to subcommands. Five phases: open → design → build → verify → archive."
---

# Coda — OpenSpec + Superpowers Dual-Star Development Workflow

OpenSpec and Superpowers orbit the same goal like a binary star system.

```
OpenSpec handles WHAT  — outline, proposal, spec lifecycle, archive
Superpowers handles HOW — technical design, planning, execution, closing
```

**Core principle: brainstorming cannot be skipped. Every change must undergo deep design (except hotfix and tweak presets).**

---

## Decision Core

Agents need only read this section for decision-making. Refer to the Reference Appendix as needed.

### Output Language Rule

Use the language of the user request that triggered this workflow as the default output language. When resuming an existing change with a clear dominant artifact language, preserve that language unless the user explicitly asks to switch.

### Automatic Phase Detection

**Step 0: Active Change Discovery and Intent Detection**

1. Detect presets first; if hotfix/tweak matches, invoke the corresponding preset skill directly and do not enter the normal open branch
2. When no preset matches, run `openspec list --json` to get all active changes

**Preset detection has highest priority**:
- User explicitly describes a fix for existing abnormal, regressed, or incorrect behavior and meets hotfix conditions (no new capability, no full design needed) → directly invoke `/Coda-hotfix`
- User explicitly describes a lightweight/medium change that can fit in a single OpenSpec change, should be executed through OpenSpec apply, and does not need full `/Coda` deep design/plan → directly invoke `/Coda-tweak`
- No preset match → follow the table below

| Active changes | User input | Behavior |
|----------------|------------|----------|
| None | non-preset input | → Invoke `/Coda-open` |
| Exactly 1 | `/Coda <description>` | → **Ask**: continue this change or create a new change |
| Multiple | `/Coda <description>` | → **Ask**: continue existing or create new; if continuing, list changes for selection |
| Exactly 1 | `/Coda` with no description | → Auto-select, enter Step 1 |
| Multiple | `/Coda` with no description | → List changes for user selection |

<IMPORTANT>
When the user chooses "create a new change", **must invoke `/Coda-open`**. Do not call `/opsx:new` directly.
`/Coda-open` performs dual initialization: OpenSpec artifacts (created by internal `/opsx:new`) plus `.Coda.yaml` state file.
Calling `/opsx:new` directly leaves `.Coda.yaml` missing and breaks later phase detection.
</IMPORTANT>

**Step 1: Read `.Coda.yaml` state metadata**

Prefer reading `openspec/changes/<name>/.Coda.yaml`. If not available, fall back to `openspec status --change "<name>" --json`, `tasks.md`, and `docs/superpowers/` file checks.

**Resume rules**:
- On every context resume, rerun Step 0 and Step 1; do not trust conversation history for phase detection
- If there is an active change and the worktree has uncommitted changes, handle them through `Coda/reference/dirty-worktree.md`. That protocol defines checks, attribution, and prohibitions; this file does not repeat them
- If `phase: build`, first check `build_pause`, `plan`, `build_mode`, and `isolation` (see details below):
  - If `build_pause: plan-ready` but `isolation` and `build_mode` are already set, treat as stale pause: first output `[Coda] Detected stale pause (build_pause=plan-ready but isolation/build_mode already set), auto-clearing and continuing`, then run `node "$Coda_STATE" set <name> build_pause null`, then read the next unchecked task from tasks.md and resume execution per `build_mode`
  - If `build_pause: plan-ready` and the plan file exists, but `isolation` or `build_mode` is not yet set, return to the `/Coda-build` plan-ready resume point, prompt the user to choose isolation and execution method, and do not regenerate the plan
  - If `build_pause: plan-ready` but the plan file is missing, return to `/Coda-build` to handle corrupted state or regenerate the plan
  - If `build_mode`, `isolation`, or `tdd_mode` is unset, return to the corresponding `/Coda-build` step to supplement before executing
  - If all are set, read the next unchecked task from tasks.md and continue:
    - If `build_mode: subagent-driven-development`, do not execute tasks directly in the main window; return to `/Coda-build`'s background subagent dispatch rules, main window only coordinates
    - Other execution modes follow `/Coda-build`'s corresponding rules
- If `phase: verify` and `verify_result: fail`, enter the verification failure decision blocking point: pause and ask the user to fix or accept deviation; only after the user chooses fix, run `node "$Coda_STATE" transition <name> verify-fail` and invoke `/Coda-build`
- If `phase: open` but proposal/design/tasks are complete, first run `node "$Coda_GUARD" <change-name> open --apply` to repair state, then continue detection
- If `phase: archive`, only invoke `/Coda-archive`; `/Coda-archive` must first wait for final archive confirmation. After archive succeeds, the change moves to the archive directory, so do not run guard against the old active directory

**Step 2: Phase Determination** (check in order, first match wins)

1. `archived: true` or change moved to archive → Workflow complete
2. `verify_result: pass` and `archived` is not `true` → Invoke `/Coda-archive` (first perform final archive confirmation)
3. `verify_result: fail` → Enter verification failure decision blocking point (pause and ask fix or accept deviation; only after user chooses fix, run `verify-fail` then `/Coda-build`)
4. `phase: verify` or tasks.md all checked → Invoke `/Coda-verify`
5. `phase: build` or has Design Doc but plan/execution incomplete → Route by workflow: `hotfix` → `/Coda-hotfix`, `tweak` → `/Coda-tweak`, `full` → `/Coda-build`
6. `phase: design` or has change but no Design Doc → Invoke `/Coda-design`
7. `phase: open` or active change exists but `.Coda.yaml` is missing → Invoke `/Coda-open`
8. No active change → Invoke `/Coda-open`

If metadata conflicts with file state, use verifiable file state as source of truth and correct `.Coda.yaml` before continuing.

### Preset Upgrade Assessment

hotfix/tweak scope assessment uses a three-layer division of labor, avoiding "using pure file count as a hard upgrade condition" that wrongly blocks normal small changes:

1. **Qualitative-change signals** (agent semantic recognition; hitting any one pauses and delegates a two-choice decision to the user): cross-module coordinated change, new capability needed, database schema change, introduces new public API, hits deep architecture issues
2. **File-count tripwire** (user decides; not an automatic upgrade): when changed files exceed a hint threshold, pause and let the user decide whether to continue the preset or upgrade to full; do not auto-kick
3. **Verification weight** (scale script decides): `Coda-state scale` only decides `verify_mode` (verification weight); it does not block the flow or trigger an upgrade

**Upgrade decision point (user chooses one of two)**:
- Continue the preset lightweight flow (user confirms scope is manageable)
- Upgrade to full `/Coda` (use `node "$Coda_STATE" transition <name> preset-escalate` to legally rewind to the design phase, supplementing Design Doc and Superpowers plan)

See the "Upgrade Assessment" section of each `Coda-hotfix` / `Coda-tweak` for detailed rules.

### Error Handling Quick Reference

| Scenario | Handling |
|----------|----------|
| `openspec list --json` fails | Check if openspec is installed, prompt user to run `openspec init` |
| Sub-skill unavailable | Stop workflow, prompt to install or enable the corresponding skill |
| `.Coda.yaml` malformed or missing | Use file state as source of truth, correct with `node "$Coda_STATE" set` then continue |
| Build/test fails | Return to build phase for fixes, do not enter verify |
| Incomplete change directory structure | Fill missing files according to `Coda-open` artifact requirements |

### Phase Transitions

<IMPORTANT>
A single `/Coda` invocation starts from the detected phase and advances to the next phase when exit conditions are met.

Flow chain: open → design → build → verify → archive

**Continuous execution requirement**: starting from the detected phase, the agent automatically continues through all later phases. But **auto-advancing only applies at transition points without user decisions**. When encountering user decision points, **must use the current platform's available user input/confirmation mechanism to pause and wait for the user's explicit response**. Must not use recommendation rules, defaults, or historical preferences to substitute for user confirmation, and must not just output a text prompt and then continue executing.

**Distinguish phase advancement vs automatic handoff**: each sub-skill runs phase guard `--apply` before exit to advance the `.Coda.yaml` `phase` field. This step **always happens** and is not controlled by `auto_transition`. After that, the sub-skill runs `node "$Coda_STATE" next <name>` to resolve the next action: when `auto_transition` is not `false`, output is `NEXT: auto` (auto-invoke next skill); when `auto_transition` is `false`, output is `NEXT: manual` (do not invoke next skill, show a manual run hint). Therefore `auto_transition` **only controls next skill invocation, not phase advancement**. Regardless of `auto_transition`, user decision points below remain blocking.

**Decision points are blocking points**: whenever reaching any of the following nodes, the current `/Coda` invocation must stop, and follow the `Coda/reference/decision-point.md` protocol to obtain the user's explicit choice. Only after the user explicitly chooses can the corresponding state fields be written and operations executed, then auto-advance resumes.

Nodes requiring user participation (pause only at these nodes):
1. Open phase proposal/design/tasks review and confirmation
2. Confirm design approach during brainstorming
3. Plan-ready pause choice during build phase, followed by workflow configuration selection (isolation + execution method + TDD mode)
4. Decide to fix or accept deviation when verify fails (including Spec drift handling)
5. Choose branch handling method for finishing-branch
6. Archive phase final confirmation before running the archive script
7. Encounter an upgrade-assessment signal (hotfix/tweak → user chooses one of two: continue preset / upgrade to full workflow)
8. Build phase scope expansion requiring redesign or new change split
9. Open phase large PRD requiring confirmation to split into multiple changes

Agents should not skip these decision points; other unambiguous phase transitions must proceed automatically, must not exit midway. At decision points, **must not skip user confirmation or choose automatically — must explicitly obtain the user's choice through the current platform's available user input/confirmation mechanism before continuing**.

**Red Flags** — when these thoughts appear, STOP and check:

| Agent Thought | Actual Risk |
|--------------|-------------|
| "The user would probably agree with this approach" | Cannot decide for the user — use the current platform's user input/confirmation mechanism |
| "This is a small change, confirmation isn't needed" | Decision points have no size exception — blocking points must wait |
| "The user chose A last time, so A again" | Historical preference cannot substitute for current confirmation |
| "I explained the plan and the user didn't object" | No objection ≠ consent — must use tool to get explicit choice |
| "The flow has reached this point, should be fine" | Verification not passed ≠ passed — check verify_result |
</IMPORTANT>

---

## Subcommand Quick Reference

| Command | Phase | Owner | Artifacts |
|---------|-------|-------|-----------|
| `/Coda-open` | 1. Open | OpenSpec | proposal.md, design.md, tasks.md |
| `/Coda-design` | 2. Deep Design | Superpowers | Design Doc, delta spec |
| `/Coda-build` | 3. Plan and Build | Superpowers | Implementation plan, code commits |
| `/Coda-verify` | 4. Verify and Close | Both | Verification report, branch handling |
| `/Coda-archive` | 5. Archive | OpenSpec | delta→main spec sync, design doc markup, archive |
| `/Coda-hotfix` | Preset path | Both | Quick fix (skip brainstorming) |
| `/Coda-tweak` | Preset path | Both | OpenSpec-chained medium change (delta spec is first-class, skip brainstorming and full plan) |

```
/Coda
  ↓ Auto-detect
/Coda-open ──→ /Coda-design ──→ /Coda-build ──→ /Coda-verify ──→ /Coda-archive
  (OpenSpec)      (Superpowers)     (Superpowers)     (Both)          (OpenSpec)

/Coda-hotfix (preset, skip brainstorming)
  open ──→ build ──→ verify ──→ archive
    ↑ Upgrade-assessment signal hit → user chooses one of two (continue preset / upgrade full) → if upgrade, transition preset-escalate → supplement Design Doc → return to full workflow

/Coda-tweak (lightweight preset, chains OpenSpec, delta spec is first-class)
  open ──→ build ──→ verify ──→ archive
    ↑ Upgrade-assessment signal hit → user chooses one of two (continue preset / upgrade full) → if upgrade, transition preset-escalate → supplement Design Doc → return to full workflow
```

---

## Reference Appendix

### State Machine Hard Constraints

- Before `build → verify`, `isolation` must be `branch` or `worktree`
- Before `build → verify`, `build_mode` must be selected
- `build_mode: subagent-driven-development` must also have `subagent_dispatch: confirmed`
- Before full workflow leaves build phase, `tdd_mode` must be selected as `tdd` or `direct`
- Before full workflow leaves build phase, `review_mode` must be selected as `off`, `standard`, or `thorough`
- `build_mode: direct` is allowed by default only for `hotfix` / `tweak`; full workflow requires `direct_override: true`
- `build_pause` is not an execution method and must not be written to `build_mode`
- These constraints are enforced by both `Coda-guard.mjs build --apply` and `Coda-state.mjs transition <name> build-complete`

### .Coda.yaml Field Reference

See `Coda/reference/Coda-yaml-fields.md` for complete field reference with examples and descriptions.

### File Structure

See `Coda/reference/file-structure.md` for the complete directory layout and artifact organization.

### Auto-Transition Protocol

See `Coda/reference/auto-transition.md` for the complete automatic handoff workflow.

### Context Recovery

See `Coda/reference/context-recovery.md` for structured recovery after context compression.

### Decision Point Protocol

See `Coda/reference/decision-point.md` for the complete user decision point protocol.

### Debug Gate Protocol

See `Coda/reference/debug-gate.md` for the complete debug gate protocol.

### Script Location

Coda scripts are distributed in `Coda/scripts/`. **Do not hardcode paths** — locate once, cache in env vars. The full bootstrap block, command reference (`--apply`, `transition`, `next`, `archive`), and output formats live in `Coda/reference/scripts.md`. Run that bootstrap once per session, then reuse `$Coda_GUARD`, `$Coda_STATE`, `$Coda_HANDOFF`, `$Coda_ARCHIVE`, `$Coda_RUNTIME` throughout. Key entry points:

```bash
node "$Coda_GUARD" <change-name> <phase> --apply    # phase guard + auto state update
node "$Coda_STATE" transition <change-name> <event> # open-complete | design-complete | build-complete | verify-pass | verify-fail
node "$Coda_STATE" next <change-name>               # NEXT: auto|manual|done  + SKILL: <skill-name>; auto_transition:false → manual, which pauses only the next skill invocation and does not block phase updates
node "$Coda_ARCHIVE" <change-name>                  # full archive in one command
```

### Best Practices

1. **brainstorming cannot be skipped** — Every change must undergo deep design (except hotfix and tweak)
2. **delta spec is a living document** — Freely modify during phase 3, sync at archive
3. **Handoff packages are generated by scripts** — OpenSpec → Superpowers context must be generated through `Coda-handoff.mjs` as compact traceable excerpts (use `--full` when needed), and validated by guard for source/hash/mode
4. **Keep tasks.md in sync** — Check off each completed task
5. **Commit frequently** — One commit per task, message reflects design intent
6. **Verify before archive confirmation** — Enter `/Coda-archive` only after `/Coda-verify` passes, but wait for final user confirmation before running the archive script
7. **Classify incremental updates** — Small edits, medium brainstorming, large new changes
8. **Plan must associate with change** — File header contains `change:` and `design-doc:` metadata
9. **Archive closure** — design doc and plan must mark `archived-with` status
10. **Modifying existing features** — Just open a new change
11. **Preset upgrade assessment** — When hotfix/tweak hit a qualitative-change signal or file-count tripwire, pause and let the user choose one of two (continue preset / upgrade full); upgrade uses `transition preset-escalate`
