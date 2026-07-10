import { describe, expect, it } from 'vitest';
import {
  buildSkillMakerInstallText,
  buildSkillMakerPlanSummary,
  buildSkillMakerResumeText,
  formatSkillMakerPlanSummary,
} from '../../../domains/bundle/user-facing.js';

describe('Skill Maker user-facing summaries', () => {
  it('formats a coda-based workflow contract', () => {
    const summary = buildSkillMakerPlanSummary({
      intent: 'customize-coda',
      skillName: 'team-coda',
      goal: 'Use project component and review Skills inside the coda workflow.',
      workflow: {
        kind: 'coda-five-phase-overlay',
        outputSchemas: ['coda.plan.v1', 'coda.execution-evidence.v1'],
        nodes: [
          {
            id: 'execute',
            label: 'Execute',
            kind: 'control',
            implementationSkill: 'coda-build',
            requiredSkills: ['elementui'],
            outputSchemas: ['coda.execution-evidence.v1'],
          },
          {
            id: 'review',
            label: 'Review',
            kind: 'guardrail',
            implementationSkill: 'requesting-code-review',
            requiredSkills: ['whitebox-code-standard'],
            outputSchemas: ['coda.review.v1'],
          },
        ],
      },
      retained: [],
      additions: ['execute: coda-build', 'review: requesting-code-review'],
      replacements: [],
      disabled: [],
      rejected: [],
      generated: ['Skill files, rules, hooks, scripts'],
      validation: ['Quick validation is recommended before install'],
      install: ['Install/enable into the current Agent after preview'],
      advanced: ['Workflow Contract hash will be recorded after confirmation'],
    });

    const text = formatSkillMakerPlanSummary(summary);

    expect(text).toContain('You are making: Customize existing Coda Skills');
    expect(text).toContain('Workflow contract:');
    expect(text).toContain('Node execute: Execute; control; implementation: coda-build');
    expect(text).toContain('required Skill calls: elementui');
    expect(text).toContain('Output Schemas: coda.plan.v1, coda.execution-evidence.v1');
  });

  it('formats resume text around user progress and next action', () => {
    const text = buildSkillMakerResumeText({
      title: 'Found an unfinished Skill creation',
      completed: ['Plan confirmed', 'Skill files generated'],
      missing: ['Validate this Skill'],
      nextAction: 'Continue validation',
      choices: ['Continue', 'View details', 'Abandon this creation'],
    });

    expect(text).toContain('Found an unfinished Skill creation');
    expect(text).toContain('Completed:');
    expect(text).toContain('Still needed:');
    expect(text).toContain('Next step: Continue validation');
    expect(text).not.toContain('Factory state is draft');
  });

  it('formats install preview without forcing publish/distribute vocabulary', () => {
    const text = buildSkillMakerInstallText({
      preview: true,
      skillName: 'team-coda',
      platforms: ['claude'],
      plannedFiles: ['skill: .claude/skills/team-coda/SKILL.md', 'hook: before-tool'],
      disclosures: ['hook guard reads state before writes'],
    });

    expect(text).toContain('Install preview');
    expect(text).toContain('No files were written');
    expect(text).toContain('Planned files:');
    expect(text).toContain('Executable disclosures:');
    expect(text).not.toContain('Distribution preview');
  });
});
