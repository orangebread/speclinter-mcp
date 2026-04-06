import { describe, expect, it } from 'vitest';
import { createProjectContextSnapshot } from '../src/ai/shared/project-context.js';
import {
  buildParseResultFromComprehensiveAnalysis,
  buildParseResultFromSpecAnalysis,
  mapComprehensiveGeneratedTask,
  mapSpecAnalysisTask
} from '../src/ai/shared/task-mappers.js';
import type { ComprehensiveSpecAnalysis, SpecAnalysis } from '../src/ai/contracts.js';

describe('AI shared seams', () => {
  it('creates a normalized project context snapshot from stored context data', () => {
    const snapshot = createProjectContextSnapshot(
      {
        stack: { language: 'TypeScript', frontend: 'React' },
        constraints: ['Security: validate inputs'],
        standards: ['Functions: camelCase'],
        patterns: [{ name: 'Structured Errors', description: 'Return structured payloads', anchor: 'structured-errors' }]
      },
      '# System Architecture\n\nThis project implements a **modular** architecture.'
    );

    expect(snapshot.hasContext).toBe(true);
    expect(snapshot.techStack.language).toBe('TypeScript');
    expect(snapshot.patterns[0]?.name).toBe('Structured Errors');
    expect(snapshot.projectStructure.architecture).toBe('modular');
  });

  it('returns a deterministic empty context snapshot when no context exists', () => {
    const snapshot = createProjectContextSnapshot(null);

    expect(snapshot.hasContext).toBe(false);
    expect(snapshot.techStack).toEqual({});
    expect(snapshot.patterns).toEqual([]);
    expect(snapshot.projectStructure.architecture).toBe('Unknown');
  });

  it('maps spec-analysis tasks into persisted task records and parse results', () => {
    const analysis: SpecAnalysis = {
      quality: {
        score: 88,
        grade: 'A',
        issues: [{ type: 'missing_context', severity: 'medium', message: 'Needs API notes', suggestion: 'Add API notes', points: 5 }],
        strengths: ['Clear user value'],
        improvements: ['Document API constraints']
      },
      tasks: [{
        title: 'Add reset endpoint',
        summary: 'Implement the password reset endpoint.',
        implementation: 'Create POST /password/reset.',
        acceptanceCriteria: ['Endpoint returns 202'],
        estimatedEffort: 'M',
        dependencies: [],
        testingNotes: 'Cover token expiry.',
        relevantPatterns: ['Structured Errors'],
        riskFactors: [],
        securityConsiderations: [],
        performanceConsiderations: [],
        userExperience: 'Fast reset flow',
        technicalDebt: []
      }],
      technicalConsiderations: [],
      userStories: [],
      businessValue: 'Users can recover accounts',
      scope: {
        inScope: [],
        outOfScope: [],
        assumptions: []
      }
    };

    const task = mapSpecAnalysisTask(analysis.tasks[0], 'password-reset', 0);
    const result = buildParseResultFromSpecAnalysis(
      'As a user, I want password reset access.',
      'password-reset',
      analysis
    );

    expect(task.id).toBe('task_01');
    expect(task.relevantPatterns?.[0]?.anchor).toBe('structured-errors');
    expect(result.parseResult.spec).toContain('password reset');
    expect(result.parseResult.tasks).toHaveLength(1);
  });

  it('maps comprehensive generated tasks into persisted task records and parse results', () => {
    const analysis: ComprehensiveSpecAnalysis = {
      qualityAnalysis: {
        overallScore: 90,
        grade: 'A',
        qualityDimensions: {
          clarity: 90,
          completeness: 88,
          testability: 92,
          feasibility: 91,
          businessValue: 89
        },
        semanticIssues: [],
        strengths: [],
        improvements: [{ priority: 'medium', category: 'clarity', suggestion: 'Add audit trail details', rationale: 'Improves ops visibility' }],
        aiInsights: {
          confidence: 0.9,
          analysisDepth: 'standard',
          contextFactors: [],
          recommendations: []
        }
      },
      taskGeneration: {
        tasks: [{
          title: 'Persist reset audit log',
          summary: 'Store reset attempts for review.',
          description: 'Capture reset attempts.',
          implementation: {
            approach: 'Insert audit rows during reset flow.',
            technicalSteps: ['Add audit table', 'Write on request'],
            fileLocations: ['src/reset.ts'],
            codePatterns: ['Audit Logging'],
            dependencies: [],
            riskFactors: ['Storage growth']
          },
          acceptanceCriteria: [{ criteria: 'Audit rows are written', validationMethod: 'Inspect DB', priority: 'must_have', testable: true }],
          estimatedEffort: { size: 'S', complexity: 'medium', uncertainty: 'low' },
          businessValue: { userImpact: 'Support investigations', businessImpact: 'Operational visibility', priority: 'high' },
          technicalConsiderations: [],
          dependencies: [],
          testingStrategy: { unitTests: [], integrationTests: [], e2eTests: [], manualTests: [], testData: [] },
          aiInsights: { confidence: 0.8, alternativeApproaches: [], potentialIssues: [], optimizations: [] }
        }],
        taskRelationships: [],
        implementationStrategy: {
          approach: 'incremental',
          phases: [],
          riskMitigation: [],
          successCriteria: []
        },
        qualityMetrics: {
          taskCount: 1,
          averageComplexity: 2,
          coverageScore: 93,
          actionabilityScore: 95,
          testabilityScore: 92
        }
      },
      projectAlignment: {
        techStackCompatibility: 90,
        architecturalFit: 88,
        patternCompliance: [],
        integrationPoints: []
      },
      businessContext: {
        userStories: [],
        businessValue: 'Safer account recovery',
        stakeholders: [],
        successMetrics: []
      },
      implementationGuidance: {
        recommendedApproach: 'Incremental rollout',
        criticalPath: [],
        quickWins: [],
        riskAreas: [],
        dependencies: []
      },
      aiMetadata: {
        analysisTimestamp: new Date().toISOString(),
        modelConfidence: 0.92,
        analysisDepth: 'standard',
        contextFactors: [],
        limitations: [],
        recommendations: []
      }
    };

    const task = mapComprehensiveGeneratedTask(analysis.taskGeneration.tasks[0], 'password-reset', 0);
    const result = buildParseResultFromComprehensiveAnalysis(
      'As a user, I want a secure reset process.',
      'password-reset',
      analysis
    );

    expect(task.notes).toContain('Priority: high');
    expect(task.implementation).toContain('Risks: Storage growth');
    expect(result.parseResult.improvements).toEqual(['Add audit trail details']);
    expect(result.tasks).toHaveLength(1);
  });
});
