import os from 'os';
import path from 'path';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { validateFileAccess } from '../src/utils/validation.js';

describe('validateFileAccess', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'speclinter-validation-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('returns success for a readable file', async () => {
    const filePath = path.join(tempDir, 'sample.txt');
    await writeFile(filePath, 'spec');

    const result = await validateFileAccess(filePath, 'read');

    expect(result).toEqual({ success: true });
  });

  it('returns a structured failure for a missing file', async () => {
    const filePath = path.join(tempDir, 'missing.txt');

    const result = await validateFileAccess(filePath, 'read');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot read file');
    expect(result.suggestions).toContain('Check if file exists');
  });
});
