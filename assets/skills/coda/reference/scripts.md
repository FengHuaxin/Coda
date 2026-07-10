# Script Location and Commands

Canonical path: `coda/reference/scripts.md`

This file is the single source of truth for locating Coda scripts and the state/guard/handoff/archive command surface. Load it once per session, then reuse the cached env vars.

## Bootstrap (run once per session)

Coda scripts are distributed in `coda/scripts/`. **Do not hardcode paths** —locate once, cache in env vars. This block is a standard boilerplate repeated in every sub-skill for independent loadability; changes must be kept in sync across all files:

```bash
CODA_ENV="${CODA_ENV:-$(find . "$HOME"/.*/skills "$HOME/.config" "$HOME/.gemini" -path '*/coda/scripts/coda-env.mjs' -type f -print -quit 2>/dev/null)}"
if [ -z "$CODA_ENV" ]; then
  echo "ERROR: coda-env.mjs not found. Ensure the coda skill is installed." >&2
  return 1
fi
CODA_SCRIPTS_DIR="$(node "$CODA_ENV")"
CODA_STATE="$CODA_SCRIPTS_DIR/coda-state.mjs"
CODA_GUARD="$CODA_SCRIPTS_DIR/coda-guard.mjs"
CODA_HANDOFF="$CODA_SCRIPTS_DIR/coda-handoff.mjs"
CODA_ARCHIVE="$CODA_SCRIPTS_DIR/coda-archive.mjs"
CODA_RUNTIME="$CODA_SCRIPTS_DIR/coda-runtime.mjs"

# Stop workflow when script location fails
if [ -z "$CODA_SCRIPTS_DIR" ]; then
  echo "ERROR: Coda scripts not found. Ensure the coda skill is installed." >&2
  return 1
fi
```

After loading coda, agents should run the variable assignments above once, then reuse `$CODA_GUARD`, `$CODA_STATE`, `$CODA_HANDOFF`, `$CODA_ARCHIVE` throughout the session.

## Auto state update

Guard supports `--apply` flag, automatically updating `.coda.yaml` state fields after checks pass:

```bash
node "$CODA_GUARD" <change-name> <phase> --apply
```

`--apply` delegates to `coda-state transition`. Use these semantic events when state changes need to be expressed directly:

```bash
node "$CODA_STATE" transition <change-name> open-complete
node "$CODA_STATE" transition <change-name> design-complete
node "$CODA_STATE" transition <change-name> build-complete
node "$CODA_STATE" transition <change-name> verify-pass
node "$CODA_STATE" transition <change-name> verify-fail
```

Archive completion is handled by `node "$CODA_ARCHIVE" <change-name>` after OpenSpec moves the change into its date-prefixed archive directory; do not manually transition an `<archive-name>`.

## Resolve next action

After guard-based phase advancement, use the `next` subcommand to determine whether to auto-invoke the next skill:

```bash
node "$CODA_STATE" next <change-name>
```

Output format: `NEXT: auto|manual|done` + `SKILL: <skill-name>` (omitted for `done`) + `HINT` (for `manual` only). With `auto_transition: false`, output is `manual`, which pauses only the next skill invocation and does not block phase updates.

## Archive script

Complete all archive steps in one command:

```bash
node "$CODA_ARCHIVE" <change-name>
```
