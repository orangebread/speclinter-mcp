import os from 'os';
import path from 'path';
import { existsSync } from 'fs';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { spawnSync } from 'child_process';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { handleInitProject } from '../src/tools.js';

const scriptPath = path.resolve(process.cwd(), 'start.sh');

function runStartCheck(projectRoot: string) {
  return spawnSync('bash', [scriptPath, '--check'], {
    cwd: process.cwd(),
    encoding: 'utf-8',
    env: {
      ...process.env,
      SPECLINTER_PROJECT_ROOT: projectRoot
    }
  });
}

describe('start.sh', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(path.join(os.tmpdir(), 'speclinter-start-script-'));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('validates an initialized project and completes MCP healthcheck', async () => {
    const initResult = await handleInitProject({ project_root: projectRoot });
    expect(initResult.success).toBe(true);

    const result = runStartCheck(projectRoot);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(0);
    expect(output).toContain('Project configuration validated');
    expect(output).toContain('SpecLinter MCP server running on stdio');
  });

  it('creates missing configured directories during validation', async () => {
    const initResult = await handleInitProject({ project_root: projectRoot });
    expect(initResult.success).toBe(true);

    await rm(path.join(projectRoot, 'speclinter-tasks'), { recursive: true, force: true });
    await rm(path.join(projectRoot, '.speclinter', 'context'), { recursive: true, force: true });

    const result = runStartCheck(projectRoot);

    expect(result.status).toBe(0);
    expect(existsSync(path.join(projectRoot, 'speclinter-tasks'))).toBe(true);
    expect(existsSync(path.join(projectRoot, '.speclinter', 'context'))).toBe(true);
  });

  it('fails when SPECLINTER_PROJECT_ROOT does not exist', () => {
    const missingRoot = path.join(projectRoot, 'missing-root');
    const result = runStartCheck(missingRoot);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).not.toBe(0);
    expect(output).toContain(`Project root does not exist: ${missingRoot}`);
  });

  it('fails when the project configuration is invalid', async () => {
    const initResult = await handleInitProject({ project_root: projectRoot });
    expect(initResult.success).toBe(true);

    const configPath = path.join(projectRoot, '.speclinter', 'config.json');
    const rawConfig = JSON.parse(await readFile(configPath, 'utf-8'));
    rawConfig.generation.specAnalysis.qualityThreshold = 101;
    await writeFile(configPath, JSON.stringify(rawConfig, null, 2));

    const result = runStartCheck(projectRoot);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).not.toBe(0);
    expect(output).toContain('Project configuration is invalid');
  });
});
