import os from 'os';
import path from 'path';
import { existsSync } from 'fs';
import { mkdtemp, rm } from 'fs/promises';
import { spawnSync } from 'child_process';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const cliPath = path.resolve(process.cwd(), 'src/cli.ts');
const tsxPath = path.resolve(process.cwd(), 'node_modules', '.bin', 'tsx');

function runCli(args: string[], cwd: string) {
  return spawnSync(tsxPath, [cliPath, ...args], {
    cwd,
    encoding: 'utf-8'
  });
}

describe('CLI workflows', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(path.join(os.tmpdir(), 'speclinter-cli-'));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('initializes successfully in a fresh directory', () => {
    const result = runCli(['init'], projectRoot);

    expect(result.status).toBe(0);
    expect(existsSync(path.join(projectRoot, '.speclinter', 'config.json'))).toBe(true);
  });

  it('fails repeated initialization instead of reporting false success', () => {
    expect(runCli(['init'], projectRoot).status).toBe(0);

    const result = runCli(['init'], projectRoot);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('already initialized');
    expect(output).not.toContain('SpecLinter initialized successfully!');
  });

  it('fails status checks on uninitialized directories without auto-initializing state', () => {
    const result = runCli(['status', 'missing-feature'], projectRoot);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('SpecLinter not initialized');
    expect(existsSync(path.join(projectRoot, '.speclinter'))).toBe(false);
  });
});
