#!/usr/bin/env node
// coda-archive.mjs —Coda archive CLI launcher.
// Thin Node facade: delegates to the bundled coda-runtime.mjs so the skill
// never needs bash. Equivalent to `node coda-runtime.mjs archive "$@"`.
import { main } from './Coda-runtime.mjs';

process.exitCode = await main(['archive', ...process.argv.slice(2)]);
