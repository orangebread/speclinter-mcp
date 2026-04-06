import os from 'os';
import path from 'path';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { handleInitProject } from '../src/tools.js';
import { ConfigManager } from '../src/utils/config-manager.js';

describe('ConfigManager.updateConfig', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(path.join(os.tmpdir(), 'speclinter-config-manager-'));
    const initResult = await handleInitProject({ project_root: projectRoot });
    expect(initResult.success).toBe(true);
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
    ConfigManager.clearCache(projectRoot);
  });

  it('deep merges nested updates without discarding sibling settings', async () => {
    const result = await ConfigManager.updateConfig(projectRoot, {
      generation: {
        specAnalysis: {
          qualityThreshold: 85
        }
      }
    });

    expect(result.success).toBe(true);

    const config = await ConfigManager.getConfig(projectRoot);
    expect(config.generation.specAnalysis.qualityThreshold).toBe(85);
    expect(config.generation.specAnalysis.analysisDepth).toBe('standard');
    expect(config.generation.gherkinQuality.maxScenarioCount).toBe(8);
  });

  it('replaces arrays explicitly instead of merging stale entries', async () => {
    const result = await ConfigManager.updateConfig(projectRoot, {
      reverseSpec: {
        excludePatterns: ['coverage', '.turbo']
      }
    });

    expect(result.success).toBe(true);

    const rawConfig = JSON.parse(
      await readFile(path.join(projectRoot, '.speclinter', 'config.json'), 'utf-8')
    );

    expect(rawConfig.reverseSpec.excludePatterns).toEqual(['coverage', '.turbo']);
  });
});
