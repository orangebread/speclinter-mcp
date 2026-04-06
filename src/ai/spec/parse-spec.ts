import { AISpecAnalysisSchema, AIPromptTemplates } from '../../types/ai-schemas.js';
import { resolveProjectRoot } from '../../tools.js';
import { StorageManager } from '../../core/storage-manager.js';
import { buildParseResultFromSpecAnalysis } from '../shared/task-mappers.js';
import { loadProjectContextSnapshot } from '../shared/project-context.js';
import type { AIContinuationRequest, SpecAnalysis } from '../contracts.js';

export async function handleParseSpecAI(args: any): Promise<AIContinuationRequest | { success: false; error: string; project_root: string }> {
  const {
    spec,
    feature_name,
    context,
    project_root
  } = args;

  const rootDir = await resolveProjectRoot(project_root);

  try {
    const projectContext = await loadProjectContextSnapshot(rootDir);

    const analysisPrompt = `${AIPromptTemplates.specAnalysis}

**Project Context:**
${projectContext.hasContext ? `
- Tech Stack: ${JSON.stringify(projectContext.stack, null, 2)}
- Constraints: ${projectContext.constraints.join(', ') || 'None specified'}
- Standards: ${projectContext.standards.join(', ') || 'None specified'}
- Patterns: ${projectContext.patterns.map(p => p.name).join(', ') || 'None specified'}
` : 'No project context available'}

**Additional Context:**
${context || 'No additional context provided'}

**Specification to Analyze:**
${spec}

**Feature Name:** ${feature_name}

Please analyze this specification and return a comprehensive JSON response matching the AISpecAnalysisSchema. Focus on creating implementable tasks that align with the project's tech stack and patterns.`;

    return {
      success: true,
      action: 'ai_analysis_required',
      feature_name,
      project_root: rootDir,
      original_spec: spec,
      analysis_prompt: analysisPrompt,
      follow_up_tool: 'process_spec_analysis_ai',
      schema: 'AISpecAnalysisSchema',
      project_context: projectContext.raw,
      next_steps: [
        'AI will analyze the specification and extract tasks',
        'Results will be validated and converted to SpecLinter format',
        'Tasks will be saved and ready for implementation'
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

export async function handleProcessSpecAnalysisAI(args: any) {
  const {
    analysis,
    feature_name,
    project_root,
    spec,
    original_spec,
    deduplication_strategy = 'prompt',
    similarity_threshold,
    skip_similarity_check = false
  } = args;

  if (!analysis) {
    return {
      success: false,
      error: 'No analysis data provided'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    const validatedAnalysis: SpecAnalysis = AISpecAnalysisSchema.parse(analysis);
    const sourceSpec = original_spec ?? spec;
    if (!sourceSpec) {
      return {
        success: false,
        error: 'Original specification is required to save spec analysis results',
        project_root: rootDir
      };
    }
    const { tasks, parseResult } = buildParseResultFromSpecAnalysis(
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
        onSimilarFound: deduplication_strategy,
        similarityThreshold: similarity_threshold,
        skipSimilarityCheck: skip_similarity_check
      }
    );

    return {
      success: true,
      feature_name,
      grade: validatedAnalysis.quality.grade,
      score: validatedAnalysis.quality.score,
      tasks,
      files_created: saveResult.files,
      merge_result: saveResult.mergeResult,
      ai_insights: {
        technicalConsiderations: validatedAnalysis.technicalConsiderations,
        businessValue: validatedAnalysis.businessValue,
        scope: validatedAnalysis.scope,
        qualityIssues: validatedAnalysis.quality.issues,
        strengths: validatedAnalysis.quality.strengths
      },
      next_steps: [
        `Review generated tasks for ${feature_name}`,
        'Use speclinter_validate_implementation after code changes are complete',
        'Review AI-generated technical considerations',
        'Validate scope and assumptions with stakeholders'
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
