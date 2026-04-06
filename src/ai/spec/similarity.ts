import { AISimilarityAnalysisSchema, AIPromptTemplates } from '../../types/ai-schemas.js';
import { resolveProjectRoot } from '../../tools.js';
import { StorageManager } from '../../core/storage-manager.js';
import { createErrorResponse } from '../../utils/validation.js';

export async function handleFindSimilarAI(args: any) {
  const { spec, threshold = 0.8, project_root } = args;
  const rootDir = await resolveProjectRoot(project_root);

  try {
    const storage = await StorageManager.createInitializedStorage(rootDir);
    const existingFeatures = await storage.getAllFeatures();

    if (existingFeatures.length === 0) {
      return {
        success: true,
        similar_features: [],
        message: 'No existing features to compare against'
      };
    }

    const analysisPrompt = `${AIPromptTemplates.similarityAnalysis}

**New Specification to Analyze:**
${spec}

**Existing Features to Compare Against:**
${existingFeatures.map((feature, index) => `
### Feature ${index + 1}: ${feature.name}
${feature.spec}
`).join('\n')}

**Similarity Threshold:** ${threshold}

Please analyze semantic similarity between the new specification and existing features. Return a JSON response matching the AISimilarityAnalysisSchema.`;

    return {
      success: true,
      action: 'ai_analysis_required',
      project_root: rootDir,
      analysis_prompt: analysisPrompt,
      follow_up_tool: 'process_similarity_analysis_ai',
      schema: 'AISimilarityAnalysisSchema',
      threshold,
      existing_features_count: existingFeatures.length,
      next_steps: [
        'AI will perform semantic similarity analysis',
        'Results will be processed and returned in SpecLinter format',
        'Recommendations will be provided for handling similar features'
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

export async function handleProcessSimilarityAnalysisAI(args: any) {
  const { analysis, threshold = 0.8, project_root } = args;

  if (!analysis) {
    return {
      success: false,
      error: 'No analysis data provided'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    const validatedAnalysis = AISimilarityAnalysisSchema.parse(analysis);

    const similarFeatures = validatedAnalysis.similarFeatures
      .filter(feature => feature.similarityScore >= threshold)
      .map(feature => ({
        feature_name: feature.featureName,
        similarity: feature.similarityScore,
        summary: feature.similarityReasons.join('; '),
        task_count: 0,
        status: 'active',
        ai_insights: {
          reasons: feature.similarityReasons,
          differences: feature.differences,
          recommendation: feature.recommendation
        }
      }));

    return {
      success: true,
      similar_features: similarFeatures,
      ai_assessment: validatedAnalysis.overallAssessment,
      ai_confidence: validatedAnalysis.confidence,
      recommendations: validatedAnalysis.similarFeatures.map(feature => ({
        feature: feature.featureName,
        action: feature.recommendation,
        reasoning: feature.similarityReasons.join('; ')
      })),
      next_steps: similarFeatures.length > 0 ? [
        'Review similar features and their differences',
        'Consider merging, refactoring, or keeping separate based on AI recommendations',
        'Update specifications to clarify unique aspects if needed'
      ] : [
        'No similar features found - proceed with implementation',
        'Feature appears to be unique in the codebase'
      ]
    };
  } catch (error) {
    return {
      ...createErrorResponse(error, 'process_spec_analysis', 'ai_analysis'),
      project_root: rootDir
    };
  }
}
