import Database from 'better-sqlite3';
import os from 'os';
import path from 'path';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { handleInitProject } from '../src/tools.js';
import {
  handleAnalyzeCodebaseUnified,
  handleGenerateGherkinUnified,
  handleReverseSpecUnified,
  handleValidateImplementationUnified
} from '../src/unified-ai-tools.js';
import {
  handleProcessGherkinAnalysis
} from '../src/ai/gherkin/workflow.js';
import {
  handleProcessReverseSpecAnalysis
} from '../src/ai/codebase/reverse-spec.js';
import {
  handleProcessSpecAnalysisAI
} from '../src/ai/spec/parse-spec.js';
import {
  handleValidateImplementationProcess
} from '../src/ai/validation/workflow.js';
import { Storage } from '../src/core/storage.js';
import type {
  AIFeatureValidation,
  AIGherkinAnalysis,
  AIReverseSpecAnalysis
} from '../src/types/ai-schemas.js';

describe('unified workflow regressions', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(path.join(os.tmpdir(), 'speclinter-unified-regressions-'));
    const result = await handleInitProject({ project_root: projectRoot });
    expect(result.success).toBe(true);
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('routes auto reverse-spec continuations back through the unified codebase tool', async () => {
    await seedCodebase(projectRoot);

    const prepareResult = await handleAnalyzeCodebaseUnified({
      project_root: projectRoot
    });

    expect(prepareResult.success).toBe(true);
    expect(prepareResult.continuation_tool).toBe('speclinter_analyze_codebase');
    expect(prepareResult.continuation_args.include_reverse_spec).toBe(true);

    const processResult = await handleAnalyzeCodebaseUnified({
      ...prepareResult.continuation_args,
      analysis: createReverseSpecAnalysis()
    });

    expect(processResult.success).toBe(true);
    expect(processResult.features_discovered).toBe(1);
    expect(processResult.features_created).toEqual(['email-settings']);
    expect(processResult.internal_step).toBe('unified_operation');
  });

  it('includes the validation prompt in unified validation continuations', async () => {
    await seedFeature(projectRoot);
    await writeAnalyzedContext(projectRoot);

    const result = await handleValidateImplementationUnified({
      project_root: projectRoot,
      feature_name: 'email-update'
    });

    expect(result.success).toBe(true);
    expect(result.state).toBe('needs_ai_analysis');
    expect(result.analysis_prompt).toContain('# AI Implementation Validation Analysis');
    expect(result.continuation_tool).toBe('speclinter_validate_implementation');
  });

  it('carries task_id through unified gherkin continuations and completes the follow-up call', async () => {
    await seedFeature(projectRoot);

    const storage = new Storage(projectRoot);
    await storage.initialize();
    const task = (await storage.getFeatureTasks('email-update'))[0];

    const prepareResult = await handleGenerateGherkinUnified({
      project_root: projectRoot,
      feature_name: 'email-update',
      task
    });

    expect(prepareResult.success).toBe(true);
    expect(prepareResult.continuation_args.task_id).toBe(task.id);

    const processResult = await handleGenerateGherkinUnified({
      ...prepareResult.continuation_args,
      analysis: createGherkinAnalysis()
    });

    expect(processResult.success).toBe(true);
    expect(processResult.task_id).toBe(task.id);
    expect(processResult.gherkin_file).toContain(`${task.id.replace('task_', '')}_email_update.feature`);
  });

  it('returns a structured error when reverse spec discovery is disabled', async () => {
    await seedCodebase(projectRoot);
    await updateConfig(projectRoot, (config) => {
      config.reverseSpec.enabled = false;
      return config;
    });

    const result = await handleReverseSpecUnified({
      project_root: projectRoot
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('disabled');
    expect(result.internal_step).toBe('prepare');
  });

  it('persists reverse-spec state tracking metadata after processing', async () => {
    const analysis = createReverseSpecAnalysis();

    const result = await handleProcessReverseSpecAnalysis({
      project_root: projectRoot,
      analysis,
      context: {
        analysis_scope: 'full_codebase',
        confidence_threshold: 0.7,
        analysis_depth: 'standard'
      }
    });

    expect(result.success).toBe(true);

    const db = new Database(path.join(projectRoot, '.speclinter', 'speclinter.db'), {
      readonly: true
    });

    try {
      const row = db.prepare(`
        SELECT analysis_scope, confidence_threshold, analysis_depth, total_files_analyzed, features_discovered
        FROM reverse_spec_state
        ORDER BY id DESC
        LIMIT 1
      `).get() as Record<string, number | string>;

      expect(row.analysis_scope).toBe('full_codebase');
      expect(row.confidence_threshold).toBe(0.7);
      expect(row.analysis_depth).toBe('standard');
      expect(row.total_files_analyzed).toBe(2);
      expect(row.features_discovered).toBe(1);
    } finally {
      db.close();
    }
  });

  it('rejects malformed gherkin AI payloads with a schema error', async () => {
    const result = await handleProcessGherkinAnalysis({
      project_root: projectRoot,
      feature_name: 'email-update',
      task_id: 'task_01',
      analysis: {}
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('does not match expected schema');
  });

  it('rejects malformed validation AI payloads with a schema error', async () => {
    const result = await handleValidateImplementationProcess({
      project_root: projectRoot,
      feature_name: 'email-update',
      analysis: {}
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('does not match expected schema');
  });
});

async function seedCodebase(rootDir: string): Promise<void> {
  await mkdir(path.join(rootDir, 'src'), { recursive: true });
  await writeFile(
    path.join(rootDir, 'package.json'),
    JSON.stringify({ name: 'speclinter-test-app', version: '1.0.0', type: 'module' }, null, 2)
  );
  await writeFile(
    path.join(rootDir, 'src', 'email-settings.ts'),
    'export function updateEmailAddress(nextEmail) { return nextEmail.trim().toLowerCase(); }\n'
  );
}

async function seedFeature(rootDir: string): Promise<void> {
  const result = await handleProcessSpecAnalysisAI({
    project_root: rootDir,
    feature_name: 'email-update',
    original_spec: 'As a user, I want to update my email so that my account details stay current.',
    analysis: {
      quality: {
        score: 90,
        grade: 'A',
        issues: [],
        strengths: ['Clear user outcome'],
        improvements: ['Add validation edge cases']
      },
      tasks: [
        {
          title: 'Add email update form',
          summary: 'Allow users to submit a replacement email address.',
          implementation: 'Create a settings form and persist a validated email value.',
          acceptanceCriteria: ['Users can submit a new valid email address'],
          estimatedEffort: 'S',
          dependencies: [],
          testingNotes: 'Cover invalid email submissions.',
          relevantPatterns: ['Structured Errors'],
          riskFactors: [],
          securityConsiderations: [],
          performanceConsiderations: [],
          userExperience: 'Clear validation feedback',
          technicalDebt: []
        }
      ],
      technicalConsiderations: ['Validate email uniqueness'],
      userStories: ['As a user, I want to update my email so that my account details stay current.'],
      businessValue: 'Keeps account information accurate',
      scope: {
        inScope: ['Email updates from settings page'],
        outOfScope: ['Admin-managed email changes'],
        assumptions: ['User is already authenticated']
      }
    }
  });

  expect(result.success).toBe(true);
}

async function writeAnalyzedContext(rootDir: string): Promise<void> {
  const contextDir = path.join(rootDir, '.speclinter', 'context');
  await writeFile(path.join(contextDir, 'project.md'), '# Project Context\n\n' + 'a'.repeat(200));
  await writeFile(path.join(contextDir, 'patterns.md'), '# Patterns\n\n' + 'b'.repeat(200));
}

async function updateConfig(
  rootDir: string,
  mutate: (config: Record<string, any>) => Record<string, any>
): Promise<void> {
  const configPath = path.join(rootDir, '.speclinter', 'config.json');
  const currentConfig = JSON.parse(await readFile(configPath, 'utf-8')) as Record<string, any>;
  const nextConfig = mutate(currentConfig);
  await writeFile(configPath, `${JSON.stringify(nextConfig, null, 2)}\n`);
}

function createGherkinAnalysis(): AIGherkinAnalysis {
  return {
    feature: {
      title: 'Email update',
      description: 'Users can replace their account email address.',
      scenarios: [
        {
          type: 'happy_path',
          title: 'User updates email successfully',
          steps: [
            { type: 'given', text: 'an authenticated user is on the account settings page' },
            { type: 'when', text: 'they submit a valid new email address' },
            { type: 'then', text: 'the account email is updated' }
          ],
          priority: 'high'
        }
      ],
      testingNotes: 'Verify validation and persistence.',
      coverageAreas: ['email update flow']
    },
    qualityMetrics: {
      scenarioCount: 1,
      coverageScore: 92,
      actionabilityScore: 90,
      maintainabilityScore: 88
    },
    technicalConsiderations: ['Mock the persistence layer in automation.'],
    automationReadiness: {
      score: 85,
      blockers: [],
      recommendations: ['Use seeded account fixtures.']
    },
    aiInsights: {
      confidence: 0.91,
      improvements: ['Add an invalid email scenario.'],
      patterns: ['happy_path']
    }
  };
}

function createReverseSpecAnalysis(): AIReverseSpecAnalysis {
  return {
    discoveredFeatures: [
      {
        name: 'email-settings',
        confidence: 0.91,
        businessPurpose: 'Lets users manage the email tied to their account.',
        implementationStatus: 'complete',
        specificationGap: true,
        coreFiles: [
          {
            path: 'src/email-settings.ts',
            purpose: 'Handles the email update workflow.',
            lines: [1],
            keySymbols: ['updateEmailAddress']
          }
        ],
        supportingFiles: [],
        testFiles: [],
        userStory: 'As a user, I want to update my account email so that my contact details stay current.',
        acceptanceCriteria: ['The user can submit a new valid email address'],
        suggestedImprovements: ['Add a formal feature specification.'],
        integrationPoints: [],
        technicalDebt: ['No dedicated persistence abstraction for reverse spec writes.'],
        securityConsiderations: ['Validate email input before persistence.'],
        performanceConsiderations: ['The update path is low traffic.']
      }
    ],
    analysisScope: 'full_codebase',
    analysisDepth: 'standard',
    confidenceThreshold: 0.7,
    codebaseInsights: {
      totalFilesAnalyzed: 2,
      featureBoundaryStrategy: 'Grouped files by cohesive business behavior.',
      businessLogicPatterns: ['settings updates'],
      architecturalObservations: ['Logic is concentrated in a small module.']
    },
    qualityAssessment: {
      overallImplementationQuality: 82,
      specificationCoverage: 0,
      testCoverage: 25,
      documentationQuality: 20,
      technicalDebtLevel: 'medium'
    },
    recommendations: [
      {
        type: 'specification',
        priority: 'high',
        description: 'Capture the discovered feature as a formal specification.',
        affectedFeatures: ['email-settings'],
        estimatedEffort: 'S'
      }
    ],
    nextSteps: ['Create a formal spec for email settings.'],
    metadata: {
      analysisTimestamp: new Date().toISOString(),
      toolVersion: '0.1.0',
      analysisId: 'analysis-email-settings',
      processingTime: 1.2,
      limitations: []
    }
  };
}
