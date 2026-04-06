import os from 'os';
import path from 'path';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { handleInitProject } from '../src/tools.js';
import {
  handleAnalyzeSpecComprehensiveUnified,
  handleFindSimilarUnified
} from '../src/unified-ai-tools.js';
import { handleProcessComprehensiveSpecAnalysis } from '../src/ai-tools.js';
import { Storage } from '../src/core/storage.js';
import { SpecParser } from '../src/core/parser.js';
import { DEFAULT_CONFIG } from '../src/types/config.js';

describe('production workflow contracts', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(path.join(os.tmpdir(), 'speclinter-workflows-'));
    const result = await handleInitProject({ project_root: projectRoot });
    expect(result.success).toBe(true);
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('returns unified AI continuation metadata that points back to the public tool', async () => {
    const spec = 'As a user, I want to reset my password so that I can recover account access.';

    const result = await handleAnalyzeSpecComprehensiveUnified({
      project_root: projectRoot,
      spec,
      feature_name: 'password-reset'
    });

    expect(result.success).toBe(true);
    expect(result.state).toBe('needs_ai_analysis');
    expect(result.continuation_tool).toBe('speclinter_analyze_spec_comprehensive');
    expect(result.continuation_args.spec).toBe(spec);
    expect(result.continuation_args.original_spec).toBe(spec);
    expect(result.follow_up_tool).toBeUndefined();
  });

  it('preserves the original spec through comprehensive processing and persistence', async () => {
    const spec = 'As a user, I want to reset my password so that I can recover account access.';
    const parser = new SpecParser(DEFAULT_CONFIG);
    const analysis = parser.generateSimulatedAIAnalysis(spec);

    const result = await handleProcessComprehensiveSpecAnalysis({
      analysis,
      feature_name: 'password-reset',
      project_root: projectRoot,
      original_spec: spec
    });

    expect(result.success).toBe(true);
    expect(result.parse_result.spec).toBe(spec);

    const storage = new Storage(projectRoot);
    await storage.initialize();
    const features = await storage.getAllFeatures();

    expect(features).toHaveLength(1);
    expect(features[0].spec).toBe(spec);
  });

  it('loads project context from generated context files when they exist', async () => {
    await writeFile(
      path.join(projectRoot, '.speclinter', 'context', 'project.md'),
      `# Project Context

## Tech Stack
- **Language**: TypeScript
- **Runtime**: Node.js
- **Testing**: Vitest

## Project Constraints
- **Performance**: Keep requests under 250ms
- **Security**: Validate all external input

## Naming Conventions
- **Functions**: camelCase
- **Files**: kebab-case
`
    );

    await writeFile(
      path.join(projectRoot, '.speclinter', 'context', 'patterns.md'),
      `# AI-Discovered Code Patterns

### Structured Error Handling (Confidence: 90%)
Return structured success/error payloads from async workflows.
`
    );

    const storage = new Storage(projectRoot);
    await storage.initialize();
    const context = await storage.loadProjectContext();

    expect(context?.stack?.language).toBe('TypeScript');
    expect(context?.stack?.runtime).toBe('Node.js');
    expect(context?.constraints).toContain('Performance: Keep requests under 250ms');
    expect(context?.standards).toContain('Functions: camelCase');
    expect(context?.patterns?.[0].name).toBe('Structured Error Handling');
  });

  it('returns an empty similarity result directly when no features exist yet', async () => {
    const result = await handleFindSimilarUnified({
      project_root: projectRoot,
      spec: 'As a user, I want to change my password.'
    });

    expect(result.success).toBe(true);
    expect(result.similar_features).toEqual([]);
    expect(result.internal_step).toBe('unified_operation');
  });
});
