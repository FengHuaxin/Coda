#!/usr/bin/env node
// coda-handoff.mjs —Coda design handoff generator CLI launcher.
// Thin Node facade: delegates to the bundled coda-runtime.mjs so the skill
// never needs bash. Equivalent to `node coda-runtime.mjs handoff "$@"`.
import { main } from './Coda-runtime.mjs';

process.exitCode = await main(['handoff', ...process.argv.slice(2)]);
