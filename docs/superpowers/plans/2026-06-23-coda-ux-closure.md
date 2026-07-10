# Coda UX Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the highest-priority user-facing gaps by making `/Coda-any` review and publish recovery understandable in text mode, exposing the new Classic diagnostics contract in user-facing CLI help, and aligning public docs with the real 0.4.0 product shape.

**Architecture:** Keep the existing domain contracts intact and improve the user surface on top of them. `domains/bundle/review-summary.ts` remains the source of readiness truth, `domains/Coda-classic/classic-diagnostics.ts` remains the shared Classic evidence path, and the work focuses on better text rendering plus concise bilingual documentation that matches the runtime.

**Tech Stack:** TypeScript, Commander CLI command layer, Vitest, Markdown docs

## Global Constraints

- Must preserve the current source of truth: Bundle readiness comes from `domains/bundle/review-summary.ts`; Classic diagnostics come from `domains/Coda-classic/classic-diagnostics.ts`.
- Must keep Chinese and English user-facing docs/skills structurally aligned when behavior changes.
- Must use `apply_patch` for manual edits.
- Must keep launcher/runtime responsibilities unchanged; no business logic goes back into thin launchers.
- Must verify with `pnpm format:check`, `pnpm lint`, `pnpm build`, `npx vitest run test/domains/Coda-classic/Coda-scripts.test.ts`, and `npx vitest run`.
- If Classic runtime sources change, must run `pnpm build:classic-runtime` before final verification.

---

### Task 1: Make `/Coda-any` text-mode review and publish flow self-explanatory

**Files:**
- Modify: `D:\Project\Coda\app\commands\bundle.ts`
- Modify: `D:\Project\Coda\assets/skills-zh/Coda-any/SKILL.md`
- Modify: `D:\Project\Coda\assets/skills-zh/Coda-any/reference/bundle-authoring.md`
- Modify: `D:\Project\Coda\assets/skills/Coda-any/SKILL.md`
- Modify: `D:\Project\Coda\assets/skills/Coda-any/reference/bundle-authoring.md`
- Test: `D:\Project\Coda\test\domains\bundle\bundle-cli-e2e.test.ts`
- Test: `D:\Project\Coda\test\ts\Coda-any-skill.test.ts`

**Interfaces:**
- Consumes: `buildBundleReviewSummary(options) => Promise<BundleReviewSummary>`
- Consumes: `BundleReviewSummary["readiness"]` with `state`, `blockers`, `warnings`, and `evidence`
- Produces: richer non-JSON `Coda bundle status` and `Coda bundle review-summary` output that explicitly shows readiness state, blockers, warnings, and next-action context

- [x] **Step 1: Write the failing CLI/text-output tests**

```ts
it('prints readiness blockers and evidence in review-summary text mode', async () => {
  await bundleReviewSummaryCommand('demo-skill', {
    project: projectRoot,
    platform: 'claude-code',
  });

  expect(stdout).toContain('Readiness: blocked');
  expect(stdout).toContain('Blockers:');
  expect(stdout).toContain('Eval evidence for the current draft hash is missing');
  expect(stdout).toContain('Evidence:');
});

it('prints factory/eval/review hints in bundle status text mode', async () => {
  await bundleStatusCommand('demo-skill', { project: projectRoot });

  expect(stdout).toContain('Status: review-approved');
  expect(stdout).toContain('Factory package:');
  expect(stdout).toContain('Eval:');
  expect(stdout).toContain('Review:');
});
```

- [x] **Step 2: Run the targeted tests to verify they fail**

Run: `npx vitest run test/domains/bundle/bundle-cli-e2e.test.ts test/ts/Coda-any-skill.test.ts -t "readiness|status text"`  
Expected: FAIL with missing `Readiness:` / `Blockers:` / status hint assertions

- [x] **Step 3: Implement minimal text rendering in the CLI**

```ts
const readinessLines = [
  `Readiness: ${summary.readiness.state}`,
  ...(summary.readiness.blockers.length
    ? ['Blockers:', ...summary.readiness.blockers.map((item) => `- ${item}`)]
    : []),
  ...(summary.readiness.warnings.length
    ? ['Warnings:', ...summary.readiness.warnings.map((item) => `- ${item}`)]
    : []),
  ...(Object.entries(summary.readiness.evidence).length
    ? [
        'Evidence:',
        ...Object.entries(summary.readiness.evidence).map(([key, value]) => `- ${key}: ${value}`),
      ]
    : []),
];
```

- [x] **Step 4: Update `/Coda-any` bilingual guidance so the text-mode contract matches the CLI**

```md
- 在非 JSON 输出下，也必须读取并展示 readiness、blockers、warnings 和 evidence。
- 当 readiness 为 `blocked` 时，先根据 blockers 处理候选恢复 / Eval / review，再继续 publish。
```

- [x] **Step 5: Re-run the targeted tests to verify they pass**

Run: `npx vitest run test/domains/bundle/bundle-cli-e2e.test.ts test/ts/Coda-any-skill.test.ts`  
Expected: PASS

- [x] **Step 6: Commit**

```bash
git add app/commands/bundle.ts assets/skills-zh/Coda-any/SKILL.md assets/skills-zh/Coda-any/reference/bundle-authoring.md assets/skills/Coda-any/SKILL.md assets/skills/Coda-any/reference/bundle-authoring.md test/domains/bundle/bundle-cli-e2e.test.ts test/ts/Coda-any-skill.test.ts
git commit -m "feat: clarify Coda-any readiness recovery flow"
```

### Task 2: Expose the new Classic diagnostics contract in user-facing status and doctor surfaces

**Files:**
- Modify: `D:\Project\Coda\app\commands\status.ts`
- Modify: `D:\Project\Coda\app\commands\doctor.ts`
- Test: `D:\Project\Coda\test\app\status.test.ts`
- Test: `D:\Project\Coda\test\app\doctor.test.ts`

**Interfaces:**
- Consumes: `inspectClassicChange(changeDir, name) => Promise<ClassicDiagnostic>`
- Consumes: `ClassicDiagnostic["runtimeMode" | "currentStep" | "runtimeEval" | "error"]`
- Produces: user-facing status/doctor output that explains why a change is blocked or recoverable instead of only surfacing raw fields

- [x] **Step 1: Write the failing output tests**

```ts
it('prints a concise next-action hint for invalid changes in status text output', async () => {
  await statusCommand(projectRoot);
  expect(stdout).toContain('next: inspect .Coda.yaml and rerun Coda doctor');
});

it('prints runtime eval evidence in doctor output for valid changes', async () => {
  await doctorCommand(projectRoot);
  expect(stdout).toContain('runtime_eval:');
});
```

- [x] **Step 2: Run the targeted tests to verify they fail**

Run: `npx vitest run test/app/status.test.ts test/app/doctor.test.ts`  
Expected: FAIL because output does not yet include runtime-eval or recovery phrasing

- [x] **Step 3: Implement concise evidence/recovery text without changing the shared diagnostics source**

```ts
if (c.error) {
  console.log('     next: inspect .Coda.yaml and rerun Coda doctor');
}

if (diagnostic.runtimeEval) {
  console.log(`     runtime_eval: ${diagnostic.runtimeEval.passed ? 'pass' : 'fail'} (${diagnostic.runtimeEval.evalId})`);
}
```

- [x] **Step 4: Re-run the targeted tests to verify they pass**

Run: `npx vitest run test/app/status.test.ts test/app/doctor.test.ts`  
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add app/commands/status.ts app/commands/doctor.ts test/app/status.test.ts test/app/doctor.test.ts
git commit -m "feat: improve classic diagnostics user output"
```

### Task 3: Align public docs with the real 0.4.0 user model

**Files:**
- Modify: `D:\Project\Coda\README.md`
- Modify: `D:\Project\Coda\README-zh.md`
- Modify: `D:\Project\Coda\docs\architecture\ARCHITECTURE.md`
- Test: `D:\Project\Coda\test\ts\readme.test.ts`

**Interfaces:**
- Consumes: the live CLI/runtime behavior from Tasks 1-2
- Produces: concise bilingual public docs that describe Coda as a Node-only runtime + Skill platform, and accurately describe `status`, `doctor`, and `/Coda-any`

- [x] **Step 1: Write the failing doc assertions**

```ts
it('documents status and doctor as diagnostics-aware user commands', async () => {
  expect(readme).toContain('runtime mode');
  expect(readme).toContain('current step');
  expect(readme).toContain('diagnostic');
});

it('keeps English and Chinese README feature summaries aligned', async () => {
  expect(readmeZh).toContain('Skill 平台');
  expect(readmeEn).toContain('Skill platform');
});
```

- [x] **Step 2: Run the focused doc test to verify it fails**

Run: `npx vitest run test/ts/readme.test.ts`  
Expected: FAIL because README content still emphasizes the older dual-star framing and under-describes current diagnostics

- [x] **Step 3: Update the docs with concise user-facing language**

```md
- Reframe the top summary around the current 0.4.0 product: Node-only runtime, resumable workflow, Skill platform.
- Update the `Coda status` section to mention current step, runtime mode, and malformed-state reporting.
- Update the `Coda doctor` section to mention diagnostics of active changes, not only installation health.
- Keep heavy implementation detail in `docs/architecture/ARCHITECTURE.md`, not in README.
```

- [x] **Step 4: Re-run the focused doc test**

Run: `npx vitest run test/ts/readme.test.ts`  
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add README.md README-zh.md docs/architecture/ARCHITECTURE.md test/ts/readme.test.ts
git commit -m "docs: align public docs with Coda runtime model"
```

### Task 4: Run final integrated verification and prepare release-facing notes

**Files:**
- Modify: `D:\Project\Coda\CHANGELOG.md`

**Interfaces:**
- Consumes: completed code and docs from Tasks 1-3
- Produces: validated working tree with changelog updated only if the final user-visible behavior changed materially

- [x] **Step 1: Update changelog only if final user-visible behavior changed beyond the existing 0.4.0-beta.1 entry**

```md
### Changed
- **User-facing diagnostics and readiness output**: Clarifies `/Coda-any` recovery/publish text output and exposes Classic runtime diagnostics more directly in `status` and `doctor`.
```

- [x] **Step 2: Run format check**

Run: `pnpm format:check`  
Expected: PASS

- [x] **Step 3: Run lint**

Run: `pnpm lint`  
Expected: PASS

- [x] **Step 4: Run build**

Run: `pnpm build`  
Expected: PASS

- [x] **Step 5: Run Classic runtime contract test**

Run: `npx vitest run test/domains/Coda-classic/Coda-scripts.test.ts`  
Expected: PASS

- [x] **Step 6: Run full test suite**

Run: `npx vitest run`  
Expected: PASS

- [x] **Step 7: Run diff sanity check**

Run: `git diff --check`  
Expected: no output

- [x] **Step 8: Commit**

```bash
git add CHANGELOG.md
git commit -m "chore: finalize Coda ux closure verification"
```
