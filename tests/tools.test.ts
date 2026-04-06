import os from 'os';
import path from 'path';
import { access, mkdtemp, rm } from 'fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { handleInitProject } from '../src/tools.js';

describe('handleInitProject', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(path.join(os.tmpdir(), 'speclinter-tools-'));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('initializes the expected project structure and unified next step guidance', async () => {
    const result = await handleInitProject({ project_root: projectRoot });

    expect(result.success).toBe(true);
    expect(result.next_steps).toContain('Use speclinter_analyze_codebase to start AI analysis');

    await expect(access(path.join(projectRoot, '.speclinter', 'config.json'))).resolves.toBeUndefined();
    await expect(access(path.join(projectRoot, '.speclinter', '.gitignore'))).resolves.toBeUndefined();
    await expect(access(path.join(projectRoot, 'speclinter-tasks'))).resolves.toBeUndefined();
  });

  it('refuses to reinitialize an existing project unless forced', async () => {
    await handleInitProject({ project_root: projectRoot });

    const result = await handleInitProject({ project_root: projectRoot });

    expect(result.success).toBe(false);
    expect(result.message).toContain('already initialized');
  });
});
