#!/usr/bin/env node
// coda-guard.mjs —Coda phase guard CLI launcher.
// Thin Node facade: delegates to the bundled coda-runtime.mjs so the skill
// never needs bash. Equivalent to `node coda-runtime.mjs guard "$@"`.
import { main } from './Coda-runtime.mjs';

process.exitCode = await main(['guard', ...process.argv.slice(2)]);
