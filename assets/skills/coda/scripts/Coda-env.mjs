#!/usr/bin/env node
// Coda script locator —prints the absolute path to this scripts directory.
//
// Usage:
//   CODA_SCRIPTS_DIR="$(node /path/to/coda-env.mjs)"
//
// The skill boilerplate runs this once to resolve the sibling launcher paths
// (coda-state.mjs, coda-guard.mjs, — without depending on bash. Each
// launcher then resolves its sibling coda-runtime.mjs the same way.
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Use forward slashes so the path is safe to interpolate into any shell and
// is accepted verbatim by Node on every platform (Windows included).
const scriptDir = dirname(fileURLToPath(import.meta.url)).replace(/\\/gu, '/');
process.stdout.write(`${scriptDir}\n`);
