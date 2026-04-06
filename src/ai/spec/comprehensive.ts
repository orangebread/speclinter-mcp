import { StorageManager } from '../../core/storage-manager.js';
import { resolveProjectRoot } from '../../tools.js';
import { createErrorResponse } from '../../utils/validation.js';
import { ConfigManager } from '../../utils/config-manager.js';
import {
  AISpecQualityAnalysisSchema,
  AITaskGenerationSchema,
  AISpecParserAnalysisSchema,
  AIPromptTemplates
} from '../../types/ai-schemas.js';
import {
  buildParseResultFromComprehensiveAnalysis,
  mapGeneratedTask
} from '../shared/task-mappers.js';
import { loadProjectContextSnapshot } from '../shared/project-context.js';
import type { ComprehensiveSpecAnalysis } from '../contracts.js';

export async function handleAnalyzeSpecQuality(args: any) {
  const {
    spec,
    feature_name,
    context,
    project_root,
    analysis_depth = 'standard'
  } = args;

  if (!spec || !feature_name) {
    return {
      success: false,
      error: 'Specification and feature name are required'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    const storage = await StorageManager.createInitializedStorage(rootDir);
    const config = await storage.getConfig();
    const projectContext = await loadProjectContextSnapshot(rootDir);

    const techStack = projectContext.hasContext && projectContext.stack
      ? Object.entries(projectContext.stack).map(([key, value]) => `${key}: ${value}`).join(', ')
      : config.context.fallbackStack;

    const codePatterns = projectContext.patterns.length > 0
      ? projectContext.patterns.map((pattern) => `${pattern.name}: ${pattern.description}`).join('\n')
      : 'No specific patterns detected';

    const analysisPrompt = AIPromptTemplates.specQualityAnalysis
      .replace('{specification}', spec)
      .replace('{projectContext}', context || 'No additional context provided')
      .replace('{techStack}', techStack)
      .replace('{codePatterns}', codePatterns)
      .replace('{architecture}', 'Unknown')
      .replace('{teamLevel}', 'standard');

    return {
      success: true,
      action: 'ai_analysis_required',
      feature_name,
      project_root: rootDir,
      analysis_prompt: analysisPrompt,
      follow_up_tool: 'process_spec_quality_analysis',
      schema: 'AISpecQualityAnalysisSchema',
      analysis_depth,
      project_context: projectContext.raw,
      next_steps: [
        'AI will perform semantic quality analysis',
        'Quality dimensions will be evaluated (clarity, completeness, testability, feasibility, business value)',
        'Issues will be identified with actionable suggestions',
        'Strengths and improvements will be highlighted'
      ]
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

export async function handleProcessSpecQualityAnalysis(args: any) {
  const {
    analysis,
    feature_name,
    project_root,
    analysis_depth = 'standard'
  } = args;

  if (!analysis) {
    return {
      success: false,
      error: 'No analysis data provided'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    const validatedAnalysis = AISpecQualityAnalysisSchema.parse(analysis);

    const confidenceValidation = await ConfigManager.validateConfidenceThreshold(
      validatedAnalysis.aiInsights.confidence,
      rootDir,
      'spec quality analysis'
    );

    if (!confidenceValidation.success) {
      return {
        ...createErrorResponse(
          new Error(confidenceValidation.error || 'Confidence threshold validation failed'),
          'confidence_validation',
          'configuration'
        ),
        project_root: rootDir,
        suggestions: confidenceValidation.suggestions
      };
    }

    return {
      success: true,
      feature_name,
      project_root: rootDir,
      analysis_depth,
      quality_analysis: {
        overallScore: validatedAnalysis.overallScore,
        grade: validatedAnalysis.grade,
        qualityDimensions: validatedAnalysis.qualityDimensions,
        issueCount: validatedAnalysis.semanticIssues.length,
        strengthCount: validatedAnalysis.strengths.length,
        improvementCount: validatedAnalysis.improvements.length
      },
      semantic_issues: validatedAnalysis.semanticIssues.map((issue) => ({
        type: issue.type,
        severity: issue.severity,
        description: issue.description,
        suggestion: issue.suggestion,
        confidence: issue.confidence
      })),
      strengths: validatedAnalysis.strengths,
      improvements: validatedAnalysis.improvements,
      ai_insights: validatedAnalysis.aiInsights,
      next_steps: [
        'Use quality analysis for task generation',
        'Address high-priority improvements before implementation',
        'Leverage identified strengths in development approach'
      ]
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        error: 'AI analysis response does not match expected schema',
        validation_errors: error.message,
        project_root: rootDir
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

export async function handleGenerateTasksFromSpec(args: any) {
  const {
    spec,
    feature_name,
    quality_analysis,
    context,
    project_root,
    task_complexity = 'standard'
  } = args;

  if (!spec || !feature_name) {
    return {
      success: false,
      error: 'Specification and feature name are required'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    const storage = await StorageManager.createInitializedStorage(rootDir);
    const config = await storage.getConfig();
    const projectContext = await loadProjectContextSnapshot(rootDir);

    const techStack = projectContext.hasContext && projectContext.stack
      ? Object.entries(projectContext.stack).map(([key, value]) => `${key}: ${value}`).join(', ')
      : config.context.fallbackStack;

    const codePatterns = projectContext.patterns.length > 0
      ? projectContext.patterns.map((pattern) => `${pattern.name}: ${pattern.description}`).join('\n')
      : 'No specific patterns detected';

    const qualityContext = quality_analysis
      ? `Quality Score: ${quality_analysis.overallScore}/100
Issues Found: ${quality_analysis.issueCount}
Strengths: ${quality_analysis.strengthCount}
Key Issues: ${quality_analysis.semantic_issues?.slice(0, 3).map((issue: any) => issue.description).join('; ') || 'None'}`
      : 'No quality analysis provided';

    const taskPrompt = AIPromptTemplates.taskGeneration
      .replace('{specification}', spec)
      .replace('{qualityAnalysis}', qualityContext)
      .replace('{projectContext}', context || 'No additional context provided')
      .replace('{techStack}', techStack)
      .replace('{testFramework}', config.generation.testFramework)
      .replace('{codePatterns}', codePatterns)
      .replace('{architecture}', 'Unknown')
      .replace('{projectStructure}', 'Unknown organization');

    return {
      success: true,
      action: 'ai_analysis_required',
      feature_name,
      project_root: rootDir,
      analysis_prompt: taskPrompt,
      follow_up_tool: 'process_task_generation',
      schema: 'AITaskGenerationSchema',
      task_complexity,
      project_context: projectContext.raw,
      next_steps: [
        'AI will generate comprehensive task breakdown',
        'Tasks will include implementation guidance and acceptance criteria',
        'Dependencies and relationships will be identified',
        'Testing strategy will be defined for each task'
      ]
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

export async function handleProcessTaskGeneration(args: any) {
  const {
    analysis,
    feature_name,
    project_root,
    task_complexity = 'standard'
  } = args;

  if (!analysis) {
    return {
      success: false,
      error: 'No analysis data provided'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    const validatedAnalysis = AITaskGenerationSchema.parse(analysis);

    const qualityValidation = await ConfigManager.validateQualityThreshold(
      validatedAnalysis.qualityMetrics.coverageScore,
      rootDir,
      'task generation'
    );

    if (!qualityValidation.success) {
      return {
        ...createErrorResponse(
          new Error(qualityValidation.error || 'Quality threshold validation failed'),
          'quality_validation',
          'configuration'
        ),
        project_root: rootDir,
        suggestions: qualityValidation.suggestions
      };
    }

    const tasks = validatedAnalysis.tasks.map((task, index) => mapGeneratedTask(task, feature_name, index));

    return {
      success: true,
      feature_name,
      project_root: rootDir,
      task_complexity,
      tasks,
      task_generation: {
        taskCount: validatedAnalysis.qualityMetrics.taskCount,
        averageComplexity: validatedAnalysis.qualityMetrics.averageComplexity,
        coverageScore: validatedAnalysis.qualityMetrics.coverageScore,
        actionabilityScore: validatedAnalysis.qualityMetrics.actionabilityScore,
        testabilityScore: validatedAnalysis.qualityMetrics.testabilityScore
      },
      implementation_strategy: validatedAnalysis.implementationStrategy,
      task_relationships: validatedAnalysis.taskRelationships,
      next_steps: [
        'Tasks are ready for implementation',
        'Review task dependencies and relationships',
        'Consider implementation strategy phases',
        'Generate Gherkin scenarios for testing'
      ]
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        error: 'AI analysis response does not match expected schema',
        validation_errors: error.message,
        project_root: rootDir
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

export async function handleAnalyzeSpecComprehensive(args: any) {
  const {
    spec,
    feature_name,
    context,
    project_root,
    analysis_depth = 'standard',
    focus_areas = []
  } = args;

  if (!spec || !feature_name) {
    return {
      success: false,
      error: 'Specification and feature name are required'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    const storage = await StorageManager.createInitializedStorage(rootDir);
    const config = await storage.getConfig();
    const projectContext = await loadProjectContextSnapshot(rootDir);

    const techStack = projectContext.hasContext && projectContext.stack
      ? Object.entries(projectContext.stack).map(([key, value]) => `${key}: ${value}`).join(', ')
      : config.context.fallbackStack;

    const codePatterns = projectContext.patterns.length > 0
      ? projectContext.patterns.map((pattern) => `${pattern.name}: ${pattern.description}`).join('\n')
      : 'No specific patterns detected';

    const analysisPrompt = AIPromptTemplates.specParserAnalysis
      .replace('{specification}', spec)
      .replace('{techStack}', techStack)
      .replace('{architecture}', 'Unknown')
      .replace('{codePatterns}', codePatterns)
      .replace('{projectStructure}', 'Unknown organization')
      .replace('{testFramework}', config.generation.testFramework)
      .replace('{teamContext}', 'Standard development team')
      .replace('{analysisDepth}', analysis_depth)
      .replace('{focusAreas}', focus_areas.join(', ') || 'General analysis');

    return {
      success: true,
      action: 'ai_analysis_required',
      feature_name,
      project_root: rootDir,
      original_spec: spec,
      input_context: context,
      analysis_prompt: analysisPrompt,
      follow_up_tool: 'process_comprehensive_spec_analysis',
      schema: 'AISpecParserAnalysisSchema',
      analysis_depth,
      focus_areas,
      project_context: projectContext.raw,
      next_steps: [
        'AI will perform comprehensive specification analysis',
        'Quality assessment across 5 dimensions',
        'Comprehensive task generation with implementation guidance',
        'Project alignment and business context analysis',
        'Implementation guidance and risk assessment'
      ]
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

export async function handleProcessComprehensiveSpecAnalysis(args: any) {
  const {
    analysis,
    feature_name,
    project_root,
    original_spec,
    spec,
    analysis_depth = 'standard'
  } = args;

  if (!analysis) {
    return {
      success: false,
      error: 'No analysis data provided'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    const validatedAnalysis: ComprehensiveSpecAnalysis = AISpecParserAnalysisSchema.parse(analysis);

    const sourceSpec = original_spec ?? spec;
    if (!sourceSpec) {
      return {
        success: false,
        error: 'Original specification is required to save comprehensive analysis results'
      };
    }

    const confidenceValidation = await ConfigManager.validateConfidenceThreshold(
      validatedAnalysis.aiMetadata.modelConfidence,
      rootDir,
      'comprehensive spec analysis'
    );

    if (!confidenceValidation.success) {
      return {
        ...createErrorResponse(
          new Error(confidenceValidation.error || 'Confidence threshold validation failed'),
          'confidence_validation',
          'configuration'
        ),
        project_root: rootDir,
        suggestions: confidenceValidation.suggestions
      };
    }

    const qualityValidation = await ConfigManager.validateQualityThreshold(
      validatedAnalysis.qualityAnalysis.overallScore,
      rootDir,
      'comprehensive spec analysis'
    );

    if (!qualityValidation.success) {
      return {
        ...createErrorResponse(
          new Error(qualityValidation.error || 'Quality threshold validation failed'),
          'quality_validation',
          'configuration'
        ),
        project_root: rootDir,
        suggestions: qualityValidation.suggestions,
        data: {
          quality_issues: validatedAnalysis.qualityAnalysis.semanticIssues.slice(0, 5)
        }
      };
    }

    const { tasks, parseResult } = buildParseResultFromComprehensiveAnalysis(
      sourceSpec,
      feature_name,
      validatedAnalysis
    );

    const storage = await StorageManager.createInitializedStorage(rootDir);
    const saveResult = await storage.saveFeatureFromAI(
      feature_name,
      tasks,
      parseResult,
      validatedAnalysis,
      {
        onSimilarFound: 'prompt',
        skipSimilarityCheck: false
      }
    );

    return {
      success: true,
      feature_name,
      project_root: rootDir,
      analysis_depth,
      parse_result: parseResult,
      files_created: saveResult.files,
      merge_result: saveResult.mergeResult,
      comprehensive_analysis: {
        qualityAnalysis: {
          overallScore: validatedAnalysis.qualityAnalysis.overallScore,
          grade: validatedAnalysis.qualityAnalysis.grade,
          qualityDimensions: validatedAnalysis.qualityAnalysis.qualityDimensions,
          issueCount: validatedAnalysis.qualityAnalysis.semanticIssues.length,
          strengthCount: validatedAnalysis.qualityAnalysis.strengths.length
        },
        taskGeneration: {
          taskCount: validatedAnalysis.taskGeneration.qualityMetrics.taskCount,
          coverageScore: validatedAnalysis.taskGeneration.qualityMetrics.coverageScore,
          actionabilityScore: validatedAnalysis.taskGeneration.qualityMetrics.actionabilityScore
        },
        projectAlignment: validatedAnalysis.projectAlignment,
        businessContext: validatedAnalysis.businessContext,
        implementationGuidance: validatedAnalysis.implementationGuidance
      },
      ai_insights: {
        confidence: validatedAnalysis.aiMetadata.modelConfidence,
        analysisDepth: validatedAnalysis.aiMetadata.analysisDepth,
        contextFactors: validatedAnalysis.aiMetadata.contextFactors,
        recommendations: validatedAnalysis.aiMetadata.recommendations
      },
      next_steps: [
        'Comprehensive analysis complete',
        'Tasks saved and ready for implementation',
        'Review business context and alignment',
        'Consider implementation guidance and risk factors',
        'Generate Gherkin scenarios for testing'
      ]
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        error: 'AI analysis response does not match expected schema',
        validation_errors: error.message,
        project_root: rootDir
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}
