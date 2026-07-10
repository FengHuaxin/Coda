import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { afterEach, describe, expect, it } from 'vitest';

const temporary: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporary
      .splice(0)
      .map((dir) =>
        fs.rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }),
      ),
  );
});

const SCRIPT_PATH = path.resolve(__dirname, '../../scripts/lint/id-lint.mjs');

function runIdLint(
  args: string[],
  cwd: string = process.cwd(),
): { status: number; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: 'utf8',
    cwd,
  });
  return {
    status: result.status ?? -1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

describe('ID lint', () => {
  it('skips when no changes directory exists', () => {
    const result = runIdLint([]);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/not found|no changes|skip/);
  });

  it('passes when changes dir is empty', async () => {
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'id-lint-test-empty-'));
    temporary.push(workspace);
    const changesDir = path.join(workspace, 'changes');
    await fs.mkdir(changesDir, { recursive: true });

    const result = runIdLint(['--changes', changesDir], workspace);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/no artifacts|skip/);
  });

  it('fails on artifact missing Index section', async () => {
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'id-lint-test-missing-'));
    temporary.push(workspace);
    const changesDir = path.join(workspace, 'changes');
    const changeDir = path.join(changesDir, 'demo');
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(
      path.join(changeDir, 'proposal.md'),
      '# Proposal\n\nNo Index section here.\n',
      'utf8',
    );

    const result = runIdLint(['--changes', changesDir], workspace);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/缺少 ## Index/);
  });

  it('fails on duplicate IDs in Index', async () => {
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'id-lint-test-dup-'));
    temporary.push(workspace);
    const changesDir = path.join(workspace, 'changes');
    const changeDir = path.join(changesDir, 'demo');
    await fs.mkdir(changeDir, { recursive: true });
    const content = [
      '# Proposal',
      '',
      '## Index',
      '',
      'version: 1',
      'derived_from: []',
      '',
      '- PRD-F-001: feature one',
      '- PRD-F-001: feature one duplicate',
      '',
      '## PRD-F-001: feature one',
      'description here',
      '',
    ].join('\n');
    await fs.writeFile(path.join(changeDir, 'proposal.md'), content, 'utf8');

    const result = runIdLint(['--changes', changesDir], workspace);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/重复 ID/);
  });

  it('passes on well-formed artifact', async () => {
    const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'id-lint-test-pass-'));
    temporary.push(workspace);
    const changesDir = path.join(workspace, 'changes');
    const changeDir = path.join(changesDir, 'demo');
    await fs.mkdir(changeDir, { recursive: true });
    const content = [
      '# Proposal',
      '',
      '## Index',
      '',
      'version: 1',
      'derived_from: []',
      '',
      '- PRD-F-001: feature one',
      '',
      '---',
      '',
      '## PRD-F-001: feature one',
      'description here',
      '',
    ].join('\n');
    await fs.writeFile(path.join(changeDir, 'proposal.md'), content, 'utf8');

    const result = runIdLint(['--changes', changesDir], workspace);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/PASS/);
  });
});
