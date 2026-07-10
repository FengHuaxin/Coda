import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { select } from '@inquirer/prompts';
import { PLATFORMS, type Platform } from '../../platform/install/platforms.js';
import {
  buildNpmUpdateArgs,
  detectCodaPackageScope,
  detectInstalledCodaLanguage,
  detectInstalledCodaTargets,
  formatNpmUpdateCommand,
  formatSkillUpdateCommand,
  updateCommand,
} from '../../app/commands/update.js';

// Mock the interactive select prompt so tests don't hang on CI (no TTY).
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn().mockResolvedValue(false),
}));

const mockedSelect = vi.mocked(select);

const claudePlatform: Platform = {
  id: 'claude',
  name: 'Claude Code',
  skillsDir: '.claude',
  openspecToolId: 'claude',
};

describe('update command helpers', () => {
  let tmpDir: string;

  beforeEach(async () => {
    mockedSelect.mockClear();
    tmpDir = path.join(
      os.tmpdir(),
      `Coda-update-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('detects Chinese installed Coda skills from existing skill content', async () => {
    await fs.mkdir(path.join(tmpDir, '.claude', 'skills', 'Coda'), { recursive: true });
    await fs.writeFile(
      path.join(tmpDir, '.claude', 'skills', 'Coda', 'SKILL.md'),
      '# Coda\n\n当用户提出需求时，先澄清目标再执行。',
      'utf-8',
    );

    await expect(detectInstalledCodaLanguage(tmpDir, claudePlatform)).resolves.toBe('zh');
  });

  it('detects English installed Coda skills from existing skill content', async () => {
    await fs.mkdir(path.join(tmpDir, '.claude', 'skills', 'Coda'), { recursive: true });
    await fs.writeFile(
      path.join(tmpDir, '.claude', 'skills', 'Coda', 'SKILL.md'),
      '# Coda\n\nUse this skill when starting a new change.',
      'utf-8',
    );

    await expect(detectInstalledCodaLanguage(tmpDir, claudePlatform)).resolves.toBe('en');
  });

  it('defaults installed Coda language to English when the skills directory is missing', async () => {
    await fs.mkdir(path.join(tmpDir, '.claude'), { recursive: true });

    await expect(detectInstalledCodaLanguage(tmpDir, claudePlatform)).resolves.toBe('en');
  });

  it('finds only scopes and platforms that already have Coda skills installed', async () => {
    const projectDir = path.join(tmpDir, 'project');
    const globalDir = path.join(tmpDir, 'home');

    await fs.mkdir(path.join(projectDir, '.claude', 'skills', 'Coda'), { recursive: true });
    await fs.writeFile(
      path.join(projectDir, '.claude', 'skills', 'Coda', 'SKILL.md'),
      '# Coda\n\nUse this skill.',
      'utf-8',
    );

    await fs.mkdir(path.join(projectDir, '.cursor'), { recursive: true });

    await fs.mkdir(path.join(globalDir, '.codex', 'skills', 'Coda'), { recursive: true });
    await fs.writeFile(
      path.join(globalDir, '.codex', 'skills', 'Coda', 'SKILL.md'),
      '# Coda\n\n当用户提出需求时使用这个技能。',
      'utf-8',
    );

    const targets = await detectInstalledCodaTargets(projectDir, {
      globalBaseDir: globalDir,
    });

    expect(targets.map((t) => `${t.scope}:${t.platform.id}:${t.language}`)).toEqual([
      'project:claude:en',
      'global:codex:zh',
    ]);
  });

  it('ignores platform directories that do not contain a skills directory', async () => {
    const projectDir = path.join(tmpDir, 'project');
    await fs.mkdir(path.join(projectDir, '.claude'), { recursive: true });

    await expect(detectInstalledCodaTargets(projectDir, { scopes: ['project'] })).resolves.toEqual(
      [],
    );
  });

  it('respects explicit scope filtering when detecting installed targets', async () => {
    const projectDir = path.join(tmpDir, 'project');
    const globalDir = path.join(tmpDir, 'home');

    await fs.mkdir(path.join(projectDir, '.claude', 'skills', 'Coda'), { recursive: true });
    await fs.writeFile(path.join(projectDir, '.claude', 'skills', 'Coda', 'SKILL.md'), '# Coda');
    await fs.mkdir(path.join(globalDir, '.codex', 'skills', 'Coda'), { recursive: true });
    await fs.writeFile(path.join(globalDir, '.codex', 'skills', 'Coda', 'SKILL.md'), '# Coda');

    const targets = await detectInstalledCodaTargets(projectDir, {
      globalBaseDir: globalDir,
      scopes: ['global'],
    });

    expect(targets.map((t) => `${t.scope}:${t.platform.id}`)).toEqual(['global:codex']);
  });

  it('detects legacy global Pi skills so update can migrate them', async () => {
    const projectDir = path.join(tmpDir, 'project');
    const globalDir = path.join(tmpDir, 'home');

    await fs.mkdir(path.join(globalDir, '.pi', 'skills', 'Coda'), { recursive: true });
    await fs.writeFile(
      path.join(globalDir, '.pi', 'skills', 'Coda', 'SKILL.md'),
      '# Coda\n\nUse this skill.',
      'utf-8',
    );

    const targets = await detectInstalledCodaTargets(projectDir, {
      globalBaseDir: globalDir,
      scopes: ['global'],
    });

    expect(targets.map((t) => `${t.scope}:${t.platform.id}:${t.language}`)).toEqual([
      'global:pi:en',
    ]);
    expect(PLATFORMS.find((platform) => platform.id === 'pi')?.globalSkillsDir).toBe('.pi/agent');
  });

  it('detects project package scope from local node_modules install path', async () => {
    const projectDir = path.join(tmpDir, 'project');
    const packageRoot = path.join(projectDir, 'node_modules', '@huaxin', 'coda');

    await expect(detectCodaPackageScope(projectDir, packageRoot)).resolves.toBe('project');
  });

  it('detects project package scope from package.json dependencies', async () => {
    const projectDir = path.join(tmpDir, 'project');
    await fs.mkdir(projectDir, { recursive: true });
    await fs.writeFile(
      path.join(projectDir, 'package.json'),
      JSON.stringify({ devDependencies: { '@huaxin/coda': '^0.2.4' } }),
      'utf-8',
    );

    await expect(detectCodaPackageScope(projectDir, tmpDir)).resolves.toBe('project');
  });

  it('falls back to global package scope when no project install is found', async () => {
    const projectDir = path.join(tmpDir, 'project');
    await fs.mkdir(projectDir, { recursive: true });

    await expect(detectCodaPackageScope(projectDir, tmpDir)).resolves.toBe('global');
  });

  it('builds npm update args preserving package install scope with official registry', () => {
    expect(buildNpmUpdateArgs('global')).toEqual([
      'install',
      '-g',
      '@huaxin/coda@latest',
      '--registry',
      'https://registry.npmjs.org',
    ]);
    expect(buildNpmUpdateArgs('project')).toEqual([
      'install',
      '@huaxin/coda@latest',
      '--registry',
      'https://registry.npmjs.org',
    ]);
  });

  it('formats the npm update command for friendly console output', () => {
    expect(formatNpmUpdateCommand('global')).toBe(
      'npm install -g @huaxin/coda@latest --registry https://registry.npmjs.org',
    );
    expect(formatNpmUpdateCommand('project')).toBe(
      'npm install @huaxin/coda@latest --registry https://registry.npmjs.org',
    );
  });

  it('formats the skill update command with scope, platform, and language source', () => {
    expect(formatSkillUpdateCommand('project', claudePlatform, 'skills-zh')).toBe(
      'copy assets/skills-zh -> .claude/skills/ (project)',
    );
    expect(formatSkillUpdateCommand('global', claudePlatform, 'skills')).toBe(
      'copy assets/skills -> ~/.claude/skills/ (global)',
    );
  });

  it('prints the skill update command when updating installed skills', async () => {
    await fs.mkdir(path.join(tmpDir, '.claude', 'skills', 'Coda'), { recursive: true });
    await fs.writeFile(
      path.join(tmpDir, '.claude', 'skills', 'Coda', 'SKILL.md'),
      '# Coda\n\n当用户提出需求时使用这个技能。',
      'utf-8',
    );

    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    let output = '';
    try {
      await updateCommand(tmpDir, { skipNpm: true });
      output = log.mock.calls.map((call) => call.join(' ')).join('\n');
    } finally {
      log.mockRestore();
    }

    expect(output).toContain('$ copy assets/skills-zh -> .claude/skills/ (project)');
  });

  it('prints structured JSON when requested', async () => {
    await fs.mkdir(path.join(tmpDir, '.claude', 'skills', 'Coda'), { recursive: true });
    await fs.writeFile(
      path.join(tmpDir, '.claude', 'skills', 'Coda', 'SKILL.md'),
      '# Coda\n\nUse this skill.',
      'utf-8',
    );

    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    let json = '';
    try {
      await updateCommand(tmpDir, { json: true, skipNpm: true });
      json = log.mock.calls.map((call) => call.join(' ')).join('\n');
    } finally {
      log.mockRestore();
    }

    const result = JSON.parse(json);
    expect(result.npm.scope).toBe('skipped');
    expect(result.skills.totalCopied).toBeGreaterThan(0);
    expect(result.skills.targets[0]).toMatchObject({
      scope: 'project',
      platform: 'claude',
      language: 'en',
      source: 'skills',
    });
  });

  it('does not prompt to install CodeGraph when the project already has an index', async () => {
    await fs.mkdir(path.join(tmpDir, '.claude', 'skills', 'Coda'), { recursive: true });
    await fs.writeFile(
      path.join(tmpDir, '.claude', 'skills', 'Coda', 'SKILL.md'),
      '# Coda\n\nUse this skill.',
      'utf-8',
    );
    await fs.mkdir(path.join(tmpDir, '.codegraph'), { recursive: true });
    await fs.writeFile(path.join(tmpDir, '.codegraph', 'codegraph.db'), '');

    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      await updateCommand(tmpDir, { skipNpm: true });
    } finally {
      log.mockRestore();
    }

    expect(mockedSelect).not.toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('CodeGraph'),
      }),
    );
  });
});
