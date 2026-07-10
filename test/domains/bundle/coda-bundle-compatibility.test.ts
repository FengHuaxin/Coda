import { describe, expect, it } from 'vitest';
import path from 'path';
import { runCodaBundleCompatibilityBenchmark } from '../../../domains/bundle/compatibility-benchmark.js';

describe('current coda Bundle compatibility benchmark', () => {
  it('reproduces the managed contracts for every registered platform', async () => {
    const result = await runCodaBundleCompatibilityBenchmark({
      repoRoot: path.resolve('.'),
    });

    expect(result.platforms).toBe(32);
    expect(result.skillContractRate).toBe(1);
    expect(result.ruleContractRate).toBe(1);
    expect(result.hookContractRate).toBe(1);
    expect(result.referenceContractRate).toBe(1);
    expect(result.pathContractRate).toBe(1);
  }, 30_000);
});
