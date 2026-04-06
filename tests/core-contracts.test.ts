import os from 'os';
import path from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StorageManager } from '../src/core/storage-manager.js';
import { SpecParser } from '../src/core/parser.js';
import { TaskGenerator } from '../src/core/generator.js';
import { DEFAULT_CONFIG } from '../src/types/config.js';

describe('core contract enforcement', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(path.join(os.tmpdir(), 'speclinter-core-contracts-'));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('does not auto-initialize storage for uninitialized projects', async () => {
    await expect(StorageManager.createInitializedStorage(projectRoot)).rejects.toThrow(
      /not initialized/i
    );
  });

  it('fails fast when direct parser usage would require fabricated AI output', async () => {
    const parser = new SpecParser(DEFAULT_CONFIG);

    await expect(
      parser.parse('As a user, I want a dashboard so that I can see activity.')
    ).rejects.toThrow(/not supported for direct local parsing/i);
  });

  it('returns an explicit deprecation error for the legacy test runner', async () => {
    const generator = new TaskGenerator();

    const result = await generator.runFeatureTests('example-feature', undefined, projectRoot);

    expect(result.failed).toBe(1);
    expect(result.details[0]?.error).toContain('runFeatureTests is deprecated');
    expect(result.details[0]?.error).toContain('speclinter_validate_implementation');
  });
});
