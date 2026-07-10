---
name: Coda-classic
description: "Use when Coda internally needs to restore, migrate, or advance a classic full, hotfix, or tweak workflow Run; never use as a direct user command."
---

# Coda Classic

`Coda-classic` is an internal compatibility Skill used by Coda Engine. It
maps the existing full, hotfix, and tweak workflows to stable steps without
replacing the user-facing `/Coda*` commands.

## Invocation Boundary

- This internal compatibility Skill must not be invoked directly by users.
- Users continue to invoke `/coda`, `/coda-open`, `/coda-design`,
  `/coda-build`, `/coda-verify`, `/coda-archive`, `/coda-hotfix`, or
  `/coda-tweak`.
- Before entering this Skill, `ensureClassicRun()` must complete legacy-state
  migration and validate both state projections.
- Classic Resolver must derive the current step from `.coda.yaml` and
  structured evidence. Do not infer it from conversation history.

## Execution Rules

1. Reload the validated ClassicState, RunState, and evidence.
2. Execute only the action for `current_step`.
3. When an action references a public Coda Skill, preserve all of that
   Skill's confirmation points and exit conditions.
4. After the action completes, Classic runtime atomically updates legacy and
   Run fields and appends a Trajectory event.
5. Collect evidence again, then let Resolver calculate the next step.
6. At `completed`, run the completion eval and dispatch no further Skills.

## Stability Constraints

- Do not edit Run fields manually.
- Do not update only the legacy projection or only the Run projection.
- Do not bypass Resolver to select the next step.
- Do not continue when evidence is missing, states conflict, or the snapshot
  hash does not match.
- Do not repeat ambiguous archive or other irreversible operations.
- When migration, recovery, or transition safety cannot be proven, fail closed
  and preserve the original state.

## Recovery Semantics

- Read handoff text from Context.
- Read long-running task progress from Artifact and checkpoint.
- Read unfinished or recoverable operations from PendingWork.
- Trajectory is an append-only audit record, not a manually editable state
  source.
- Re-entering the same change must reuse its existing `run_id` and Skill
  snapshot.

This Skill defines only the compatibility execution protocol. The public Coda
Skills remain responsible for design, build, verification, and archive
behavior.
