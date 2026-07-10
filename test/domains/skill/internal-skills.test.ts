import { describe, expect, it } from 'vitest';
import {
  getManagedSkillPaths,
  getManifestSkills,
  getUserFacingSkillNames,
  readManifest,
  type Manifest,
} from '../../../domains/skill/platform-install.js';

const manifest: Manifest = {
  version: '1.0.0',
  skills: ['coda/SKILL.md', 'coda-open/SKILL.md', 'coda/scripts/runtime.mjs'],
  internalSkills: ['Coda-classic/SKILL.md', 'Coda-classic/coda/skill.yaml'],
};

describe('internal Skill assets', () => {
  it('includes internal Skills in managed lifecycle paths', () => {
    expect(getManagedSkillPaths(manifest)).toEqual([
      'coda/SKILL.md',
      'coda-open/SKILL.md',
      'coda/scripts/runtime.mjs',
      'Coda-classic/SKILL.md',
      'Coda-classic/coda/skill.yaml',
    ]);
  });

  it('excludes internal Skills from user-facing command names', () => {
    expect(getUserFacingSkillNames(manifest)).toEqual(['coda', 'coda-open']);
  });

  it('declares the internalSkills collection in the shipped manifest', async () => {
    const shipped = await readManifest();

    expect(shipped.internalSkills).toEqual([
      'Coda-classic/SKILL.md',
      'Coda-classic/coda/skill.yaml',
      'Coda-classic/coda/guardrails.yaml',
      'Coda-classic/coda/checks.yaml',
    ]);
    expect(getUserFacingSkillNames(shipped)).not.toContain('coda-classic');
    expect(await getManifestSkills()).toEqual(getManagedSkillPaths(shipped));
  });
});
