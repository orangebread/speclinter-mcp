import os from 'os';
import path from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { handleInitProject } from '../src/tools.js';
import { handleParseSpecAI, handleProcessSpecAnalysisAI } from '../src/ai/spec/parse-spec.js';
import { handleFindSimilarAI, handleProcessSimilarityAnalysisAI } from '../src/ai/spec/similarity.js';

describe('spec intake workflow extraction', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(path.join(os.tmpdir(), 'speclinter-spec-intake-'));
    const result = await handleInitProject({ project_root: projectRoot });
    expect(result.success).toBe(true);
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('prepares spec analysis using the extracted workflow module', async () => {
    const spec = 'As a user, I want to update my email so that I can keep my account current.';

    const result = await handleParseSpecAI({
      project_root: projectRoot,
      spec,
      feature_name: 'email-update'
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error('Expected successful result');
    }
    expect(result.action).toBe('ai_analysis_required');
    expect(result.original_spec).toBe(spec);
    expect(result.schema).toBe('AISpecAnalysisSchema');
  });

  it('processes spec analysis through the extracted workflow module', async () => {
    const analysis = {
      quality: {
        score: 86,
        grade: 'B',
        issues: [],
        strengths: ['Clear user outcome'],
        improvements: ['Document validation edge cases']
      },
      tasks: [
        {
          title: 'Add email update form',
          summary: 'Allow users to submit a new email address.',
          implementation: 'Create a settings form and validate the new address.',
          acceptanceCriteria: ['Users can submit a valid email address'],
          estimatedEffort: 'M',
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
      userStories: ['As a user, I want to update my email so that my contact info stays current.'],
      businessValue: 'Keeps account information accurate',
      scope: {
        inScope: ['Email updates from settings page'],
        outOfScope: ['Admin-managed email changes'],
        assumptions: ['User is already authenticated']
      }
    };

    const result = await handleProcessSpecAnalysisAI({
      project_root: projectRoot,
      feature_name: 'email-update',
      original_spec: 'As a user, I want to update my email so that I can keep my account current.',
      analysis
    });

    expect(result.success).toBe(true);
    expect(result.tasks).toHaveLength(analysis.tasks.length);
    expect(result.files_created.length).toBeGreaterThan(0);
  });

  it('rejects spec analysis processing when no source specification is provided', async () => {
    const result = await handleProcessSpecAnalysisAI({
      project_root: projectRoot,
      feature_name: 'email-update',
      analysis: {
        quality: {
          score: 86,
          grade: 'B',
          issues: [],
          strengths: ['Clear user outcome'],
          improvements: ['Add edge cases']
        },
        tasks: [],
        technicalConsiderations: [],
        userStories: [],
        businessValue: 'Keeps account information accurate',
        scope: {
          inScope: [],
          outOfScope: [],
          assumptions: []
        }
      }
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Original specification is required');
  });

  it('handles empty similarity baselines and filtered similarity results', async () => {
    const emptyResult = await handleFindSimilarAI({
      project_root: projectRoot,
      spec: 'As a user, I want to change my password.'
    });

    expect(emptyResult.success).toBe(true);
    expect(emptyResult.similar_features).toEqual([]);

    const processed = await handleProcessSimilarityAnalysisAI({
      project_root: projectRoot,
      threshold: 0.8,
      analysis: {
        similarFeatures: [
          {
            featureName: 'password-reset',
            similarityScore: 0.9,
            similarityReasons: ['Same account recovery goal'],
            differences: ['Reset via email link'],
            recommendation: 'merge'
          },
          {
            featureName: 'avatar-upload',
            similarityScore: 0.4,
            similarityReasons: ['Both are settings changes'],
            differences: ['Different domain'],
            recommendation: 'separate'
          }
        ],
        overallAssessment: 'One strong match',
        confidence: 0.88
      }
    });

    expect(processed.success).toBe(true);
    expect(processed.similar_features).toHaveLength(1);
    expect(processed.similar_features[0]?.feature_name).toBe('password-reset');
  });
});
