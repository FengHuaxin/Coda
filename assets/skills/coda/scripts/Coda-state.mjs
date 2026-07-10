#!/usr/bin/env node
// coda-state.mjs —Coda state machine CLI launcher.
// Thin Node facade: delegates to the bundled coda-runtime.mjs so the skill
// never needs bash. Equivalent to `node coda-runtime.mjs state "$@"`.
import { main } from './Coda-runtime.mjs';

process.exitCode = await main(['state', ...process.argv.slice(2)]);
