import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { doctorCommand } from '../../app/commands/doctor.js';

const runtime = path.resolve('assets', 'skills', 'coda', 'scripts', 'coda-runtime.mjs');

function state(cwd: string, ...args: string[]) {
  const env: NodeJS.ProcessEnv = { ...process.env };
  if (args[0] === 'set' && args[2] === 'phase') {
    // Direct phase writes are normally blocked; the force hatch is the
    // documented way for tooling/tests to seed a change into a specific phase.
    env.CODA_FORCE_PHASE = '1';
  }
  return spawnSync(process.execPath, [runtime, 'state', ...args], {
    cwd,
    encoding: 'utf8',
    env,
  });
}

describe('doctor command', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = path.join(
      os.tmpdir(),
      `coda-doctor-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('accepts current coda state fields in JSON output', async () => {
    const changeDir = path.join(tmpDir, 'openspec', 'changes', 'current-state');
    state(tmpDir, 'init', 'current-state', 'full');
    state(tmpDir, 'set', 'current-state', 'phase', 'verify');
    const before = await fs.readFile(path.join(changeDir, '.coda.yaml'), 'utf8');

    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    let json = '';
    try {
      await doctorCommand(tmpDir, { json: true });
      json = log.mock.calls.map((call) => call.join(' ')).join('\n');
    } finally {
      log.mockRestore();
    }

    const results = JSON.parse(json).results as Array<{ check: string; status: string }>;
    expect(results.find((result) => result.check === '.coda.yaml: current-state')).toMatchObject({
      status: 'pass',
      message: expect.stringContaining('full.verify.run'),
    });
    expect(await fs.readFile(path.join(changeDir, '.coda.yaml'), 'utf8')).not.toBe(before);
  });

  it('prints the current coda version in text output', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    let output = '';
    try {
      await doctorCommand(tmpDir);
      output = log.mock.calls.map((call) => call.join(' ')).join('\n');
    } finally {
      log.mockRestore();
    }

    expect(output).toContain('Coda CLI: installed (');
  });

  it('does not report non-coda skill directories as missing coda installs in auto scope', async () => {
    await fs.mkdir(path.join(tmpDir, '.claude', 'skills', 'using-superpowers'), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(tmpDir, '.claude', 'skills', 'using-superpowers', 'SKILL.md'),
      '# using-superpowers\n',
    );

    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    let output = '';
    try {
      await doctorCommand(tmpDir);
      output = log.mock.calls.map((call) => call.join(' ')).join('\n');
    } finally {
      log.mockRestore();
    }

    expect(output).not.toContain('skills: Claude Code (project): missing');
    expect(output).toContain('Superpowers: detected');
    expect(output).toContain(
      'Coda skills: not installed in project or global scope — run: coda init',
    );
  });

  it('reports partial coda installs with an update command instead of a raw missing dump', async () => {
    await fs.mkdir(path.join(tmpDir, '.claude', 'skills', 'coda'), {
      recursive: true,
    });
    await fs.writeFile(path.join(tmpDir, '.claude', 'skills', 'coda', 'SKILL.md'), '# coda\n');

    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    let output = '';
    try {
      await doctorCommand(tmpDir, { scope: 'project' });
      output = log.mock.calls.map((call) => call.join(' ')).join('\n');
    } finally {
      log.mockRestore();
    }

    expect(output).toContain('skills: Claude Code (project): partial');
    expect(output).toContain('run: coda update --scope project');
    expect(output).not.toContain('missing 31:');
  });

  it('uses the shared schema and leaves invalid state untouched', async () => {
    const invalidChangeDir = path.join(tmpDir, 'openspec', 'changes', 'top-level-invalid');
    state(tmpDir, 'init', 'top-level-invalid', 'full');
    await fs.appendFile(path.join(invalidChangeDir, '.coda.yaml'), 'unknown_root_field: true\n');
    const before = await fs.readFile(path.join(invalidChangeDir, '.coda.yaml'), 'utf8');

    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    let json = '';
    try {
      await doctorCommand(tmpDir, { json: true });
      json = log.mock.calls.map((call) => call.join(' ')).join('\n');
    } finally {
      log.mockRestore();
    }

    const results = JSON.parse(json).results as Array<{
      check: string;
      status: string;
      message: string;
    }>;

    expect(
      results.find((result) => result.check === '.coda.yaml: top-level-invalid'),
    ).toMatchObject({
      status: 'fail',
      message: expect.stringContaining('unknown_root_field'),
    });
    expect(await fs.readFile(path.join(invalidChangeDir, '.coda.yaml'), 'utf8')).toBe(before);
  });

  it('uses Classic diagnostics for coda yaml validity messages', async () => {
    state(tmpDir, 'init', 'demo', 'full');

    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    let json = '';
    try {
      await doctorCommand(tmpDir, { json: true });
      json = log.mock.calls.map((call) => call.join(' ')).join('\n');
    } finally {
      log.mockRestore();
    }
    const payload = JSON.parse(json);
    const CODAYaml = payload.results.find((item: { check: string }) => item.check === '.coda.yaml: demo');

    expect(CODAYaml.message).toContain('step: full.open');
    expect(CODAYaml.message).toContain('mode: engine-projection');
  });

  it('prints runtime check evidence in doctor output for valid changes', async () => {
    state(tmpDir, 'init', 'demo', 'full');

    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    let output = '';
    try {
      await doctorCommand(tmpDir);
      output = log.mock.calls.map((call) => call.join(' ')).join('\n');
    } finally {
      log.mockRestore();
    }

    expect(output).toContain(
      'runtime_check: demo: fail (full.open; missing: openspec.proposal, openspec.tasks;',
    );
    expect(output).toContain(
      'next: run /coda-open or restore missing evidence (openspec.proposal, openspec.tasks), then rerun coda doctor',
    );
  });

  it('prints invalid coda yaml errors together with a concrete next step', async () => {
    const invalidChangeDir = path.join(tmpDir, 'openspec', 'changes', 'top-level-invalid');
    state(tmpDir, 'init', 'top-level-invalid', 'full');
    await fs.appendFile(path.join(invalidChangeDir, '.coda.yaml'), 'unknown_root_field: true\n');

    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    let output = '';
    try {
      await doctorCommand(tmpDir);
      output = log.mock.calls.map((call) => call.join(' ')).join('\n');
    } finally {
      log.mockRestore();
    }

    expect(output).toContain(
      '.coda.yaml: top-level-invalid: Invalid Classic state: unknown field(s): unknown_root_field',
    );
    expect(output).toContain(
      'next: top-level-invalid: inspect .coda.yaml and rerun coda doctor',
    );
  });
});
