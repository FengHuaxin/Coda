#!/usr/bin/env node
// coda-yaml-validate.mjs —Coda .coda.yaml schema validator CLI launcher.
// Thin Node facade: delegates to the bundled coda-runtime.mjs so the skill
// never needs bash. Equivalent to `node coda-runtime.mjs validate "$@"`.
import { main } from './Coda-runtime.mjs';

process.exitCode = await main(['validate', ...process.argv.slice(2)]);
