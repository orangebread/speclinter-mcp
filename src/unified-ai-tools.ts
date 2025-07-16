import { promises as fs } from 'fs';
import path from 'path';
import {
  handleAnalyzeCodebase,
  handleProcessCodebaseAnalysis,
  handleParseSpecAI,
  handleProcessSpecAnalysisAI,
  handleFindSimilarAI,
  handleProcessSimilarityAnalysisAI,
  handleValidateImplementationPrepare,
  handleValidateImplementationProcess,
  handleGenerateGherkinPrepare,
  handleProcessGherkinAnalysis,
  handleAnalyzeSpecQuality,
  handleProcessSpecQualityAnalysis,
  handleGenerateTasksFromSpec,
  handleProcessTaskGeneration,
  handleAnalyzeSpecComprehensive,
  handleProcessComprehensiveSpecAnalysis
} from './ai-tools.js';
import { resolveProjectRoot } from './tools.js';
import {
  validateProjectContext,
  ValidationResult,
  createErrorResponse,
  validateResourceLimits,
  validateInputSanitization,
  ConcurrencyValidator
} from './utils/validation.js';
import { validateToolDependencies, getWorkflowRecommendations } from './utils/dependency-validator.js';

/**
 * Base interface for unified tool responses
 */
interface UnifiedToolResponse {
  success: boolean;
  error?: string;
  internal_step?: string;
  debug_info?: string;
  [key: string]: any;
}

/**
 * Handles AI analysis by returning prompts for the MCP AI assistant to process
 * This leverages the AI assistant calling the MCP server rather than external AI APIs
 */
function handleAIAnalysisRequest(prepareResult: any): UnifiedToolResponse {
  // Check if this is a prepare result that needs AI analysis
  if (!prepareResult.success || prepareResult.action !== 'ai_analysis_required') {
    return {
      success: false,
      error: 'Invalid prepare result for AI analysis',
      debug_info: 'Prepare step must return action: ai_analysis_required'
    };
  }

  // Return the AI analysis prompt for the MCP AI assistant to process
  return {
    success: false, // Indicates this needs AI processing
    action: 'ai_analysis_required',
    analysis_prompt: prepareResult.analysis_prompt,
    schema: prepareResult.schema,
    follow_up_tool: prepareResult.follow_up_tool,
    context_data: prepareResult.context_data || {},
    instructions: [
      'Please analyze the provided data using the prompt below',
      'Return your analysis in JSON format matching the specified schema',
      `Expected schema: ${prepareResult.schema}`,
      'Use the follow-up tool with your analysis as the "analysis" parameter'
    ]
  };
}

/**
 * Unified error handling for all tools using standardized error responses
 */
function handleUnifiedError(error: any, step: string, context?: string): UnifiedToolResponse {
  return createErrorResponse(error, step, context);
}



/**
 * Unified Codebase Analysis Tool
 * Combines prepare and process steps for comprehensive codebase analysis
 */
export async function handleAnalyzeCodebaseUnified(args: any): Promise<UnifiedToolResponse> {
  try {
    // Validate project context using standardized validation
    const validation = await validateProjectContext(args.project_root);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error || 'Project validation failed',
        error_type: 'validation',
        internal_step: 'project_validation',
        suggestions: validation.suggestions,
        recovery_actions: [
          'Initialize SpecLinter with speclinter_init_project',
          'Ensure you are in the correct project directory',
          'Check file system permissions'
        ]
      };
    }

    // If analysis is provided, skip prepare step (advanced usage)
    if (args.analysis) {
      try {
        return await handleProcessCodebaseAnalysis(args);
      } catch (error) {
        return handleUnifiedError(error, 'process_analysis', 'ai_analysis');
      }
    }

    // Step 1: Prepare (internal)
    const prepareResult = await handleAnalyzeCodebase(args);
    if (!prepareResult.success) {
      return createErrorResponse(
        new Error(prepareResult.error || 'Preparation failed'),
        'prepare',
        'codebase_analysis_preparation'
      );
    }

    // Step 2: Check if AI analysis is needed
    if (prepareResult.action === 'ai_analysis_required') {
      return handleAIAnalysisRequest(prepareResult);
    }

    // Step 3: Process (internal) - only if no AI analysis needed
    const processResult = await handleProcessCodebaseAnalysis({
      ...args,
      analysis: prepareResult
    });

    return {
      ...processResult,
      internal_step: 'unified_operation'
    };
  } catch (error) {
    return handleUnifiedError(error, 'unified_operation', 'codebase_analysis');
  }
}

/**
 * Unified Specification Parsing Tool
 * Combines prepare and process steps for specification analysis
 */
export async function handleParseSpecUnified(args: any): Promise<UnifiedToolResponse> {
  try {
    // Validate concurrency limits
    const concurrencyCheck = await ConcurrencyValidator.validateConcurrency('spec_parsing');
    if (!concurrencyCheck.success) {
      return {
        success: false,
        error: concurrencyCheck.error,
        error_type: 'configuration',
        suggestions: concurrencyCheck.suggestions
      };
    }

    ConcurrencyValidator.incrementOperation('spec_parsing');

    try {
      // Validate input sanitization
      if (args.spec) {
        const sanitizationCheck = validateInputSanitization(args.spec, 50000);
        if (!sanitizationCheck.success) {
          return {
            success: false,
            error: sanitizationCheck.error,
            error_type: 'validation',
            suggestions: sanitizationCheck.suggestions
          };
        }
      }

      // Validate project context
      const validation = await validateProjectContext(args.project_root);
      if (!validation.success) {
        return validation;
      }

      // If analysis is provided, skip prepare step (advanced usage)
      if (args.analysis) {
        return await handleProcessSpecAnalysisAI(args);
      }

      // Step 1: Prepare (internal)
      const prepareResult = await handleParseSpecAI(args);
      if (!prepareResult.success) {
        return {
          ...prepareResult,
          internal_step: 'prepare',
          debug_info: 'Failed during specification analysis preparation'
        };
      }

      // Step 2: Check if AI analysis is needed
      if (prepareResult.action === 'ai_analysis_required') {
        return handleAIAnalysisRequest(prepareResult);
      }

      // Step 3: Process (internal) - only if no AI analysis needed
      const processResult = await handleProcessSpecAnalysisAI({
        ...args,
        analysis: prepareResult
      });

      return {
        ...processResult,
        internal_step: 'unified_operation'
      };
    } finally {
      ConcurrencyValidator.decrementOperation('spec_parsing');
    }
  } catch (error) {
    ConcurrencyValidator.decrementOperation('spec_parsing');
    return handleUnifiedError(error, 'unified_operation');
  }
}

/**
 * Unified Similarity Analysis Tool
 * Combines prepare and process steps for duplicate feature detection
 */
export async function handleFindSimilarUnified(args: any): Promise<UnifiedToolResponse> {
  try {
    // Validate project context
    const validation = await validateProjectContext(args.project_root);
    if (!validation.success) {
      return validation;
    }

    // If analysis is provided, skip prepare step (advanced usage)
    if (args.analysis) {
      return await handleProcessSimilarityAnalysisAI(args);
    }

    // Step 1: Prepare (internal)
    const prepareResult = await handleFindSimilarAI(args);
    if (!prepareResult.success) {
      return {
        ...prepareResult,
        internal_step: 'prepare',
        debug_info: 'Failed during similarity analysis preparation'
      };
    }

    // Step 2: Check if AI analysis is needed
    if (prepareResult.action === 'ai_analysis_required') {
      return handleAIAnalysisRequest(prepareResult);
    }

    // Step 3: Process (internal) - only if no AI analysis needed
    const processResult = await handleProcessSimilarityAnalysisAI({
      ...args,
      analysis: prepareResult
    });

    return {
      ...processResult,
      internal_step: 'unified_operation'
    };
  } catch (error) {
    return handleUnifiedError(error, 'unified_operation');
  }
}

/**
 * Unified Implementation Validation Tool
 * Combines prepare and process steps for code quality validation
 */
export async function handleValidateImplementationUnified(args: any): Promise<UnifiedToolResponse> {
  try {
    // Validate tool dependencies first
    const dependencyValidation = await validateToolDependencies('speclinter_validate_implementation', args);
    if (!dependencyValidation.success) {
      return {
        success: false,
        error: dependencyValidation.error || 'Tool dependency validation failed',
        error_type: 'validation',
        suggestions: dependencyValidation.suggestions,
        workflow_recommendations: getWorkflowRecommendations('speclinter_validate_implementation')
      };
    }

    // Show warnings if any recommended tools haven't been run
    if (dependencyValidation.data?.warnings?.length > 0) {
      console.warn('Workflow recommendations:', dependencyValidation.data.warnings);
    }

    // Validate project context
    const validation = await validateProjectContext(args.project_root);
    if (!validation.success) {
      return validation;
    }

    // If analysis is provided, skip prepare step (advanced usage)
    if (args.analysis) {
      return await handleValidateImplementationProcess(args);
    }

    // Step 1: Prepare (internal)
    const prepareResult = await handleValidateImplementationPrepare(args);
    if (!prepareResult.success) {
      return {
        ...prepareResult,
        internal_step: 'prepare',
        debug_info: 'Failed during implementation validation preparation'
      };
    }

    // Step 2: Check if AI analysis is needed
    if (prepareResult.action === 'ai_analysis_required') {
      return handleAIAnalysisRequest(prepareResult);
    }

    // Step 3: Process (internal) - only if no AI analysis needed
    const processResult = await handleValidateImplementationProcess({
      ...args,
      analysis: prepareResult
    });

    return {
      ...processResult,
      internal_step: 'unified_operation'
    };
  } catch (error) {
    return handleUnifiedError(error, 'unified_operation');
  }
}

/**
 * Unified Gherkin Generation Tool
 * Combines prepare and process steps for BDD scenario generation
 */
export async function handleGenerateGherkinUnified(args: any): Promise<UnifiedToolResponse> {
  try {
    // Validate project context
    const validation = await validateProjectContext(args.project_root);
    if (!validation.success) {
      return validation;
    }

    // If analysis is provided, skip prepare step (advanced usage)
    if (args.analysis) {
      return await handleProcessGherkinAnalysis(args);
    }

    // Step 1: Prepare (internal)
    const prepareResult = await handleGenerateGherkinPrepare(args);
    if (!prepareResult.success) {
      return {
        ...prepareResult,
        internal_step: 'prepare',
        debug_info: 'Failed during Gherkin generation preparation'
      };
    }

    // Step 2: Check if AI analysis is needed
    if (prepareResult.action === 'ai_analysis_required') {
      return handleAIAnalysisRequest(prepareResult);
    }

    // Step 3: Process (internal) - only if no AI analysis needed
    const processResult = await handleProcessGherkinAnalysis({
      ...args,
      analysis: prepareResult
    });

    return {
      ...processResult,
      internal_step: 'unified_operation'
    };
  } catch (error) {
    return handleUnifiedError(error, 'unified_operation');
  }
}

/**
 * Unified Spec Quality Analysis Tool
 * Combines prepare and process steps for specification quality assessment
 */
export async function handleAnalyzeSpecQualityUnified(args: any): Promise<UnifiedToolResponse> {
  try {
    // Validate project context
    const validation = await validateProjectContext(args.project_root);
    if (!validation.success) {
      return validation;
    }

    // If analysis is provided, skip prepare step (advanced usage)
    if (args.analysis) {
      return await handleProcessSpecQualityAnalysis(args);
    }

    // Step 1: Prepare (internal)
    const prepareResult = await handleAnalyzeSpecQuality(args);
    if (!prepareResult.success) {
      return {
        ...prepareResult,
        internal_step: 'prepare',
        debug_info: 'Failed during spec quality analysis preparation'
      };
    }

    // Step 2: Check if AI analysis is needed
    if (prepareResult.action === 'ai_analysis_required') {
      return handleAIAnalysisRequest(prepareResult);
    }

    // Step 3: Process (internal) - only if no AI analysis needed
    const processResult = await handleProcessSpecQualityAnalysis({
      ...args,
      analysis: prepareResult
    });

    return {
      ...processResult,
      internal_step: 'unified_operation'
    };
  } catch (error) {
    return handleUnifiedError(error, 'unified_operation');
  }
}

/**
 * Unified Task Generation Tool
 * Combines prepare and process steps for task breakdown from specs
 */
export async function handleGenerateTasksUnified(args: any): Promise<UnifiedToolResponse> {
  try {
    // Validate project context
    const validation = await validateProjectContext(args.project_root);
    if (!validation.success) {
      return validation;
    }

    // If analysis is provided, skip prepare step (advanced usage)
    if (args.analysis) {
      return await handleProcessTaskGeneration(args);
    }

    // Step 1: Prepare (internal)
    const prepareResult = await handleGenerateTasksFromSpec(args);
    if (!prepareResult.success) {
      return {
        ...prepareResult,
        internal_step: 'prepare',
        debug_info: 'Failed during task generation preparation'
      };
    }

    // Step 2: Check if AI analysis is needed
    if (prepareResult.action === 'ai_analysis_required') {
      return handleAIAnalysisRequest(prepareResult);
    }

    // Step 3: Process (internal) - only if no AI analysis needed
    const processResult = await handleProcessTaskGeneration({
      ...args,
      analysis: prepareResult
    });

    return {
      ...processResult,
      internal_step: 'unified_operation'
    };
  } catch (error) {
    return handleUnifiedError(error, 'unified_operation');
  }
}

/**
 * Unified Comprehensive Spec Analysis Tool
 * Combines prepare and process steps for complete spec analysis
 */
export async function handleAnalyzeSpecComprehensiveUnified(args: any): Promise<UnifiedToolResponse> {
  try {
    // Validate project context
    const validation = await validateProjectContext(args.project_root);
    if (!validation.success) {
      return validation;
    }

    // If analysis is provided, skip prepare step (advanced usage)
    if (args.analysis) {
      return await handleProcessComprehensiveSpecAnalysis(args);
    }

    // Step 1: Prepare (internal)
    const prepareResult = await handleAnalyzeSpecComprehensive(args);
    if (!prepareResult.success) {
      return {
        ...prepareResult,
        internal_step: 'prepare',
        debug_info: 'Failed during comprehensive spec analysis preparation'
      };
    }

    // Step 2: Check if AI analysis is needed
    if (prepareResult.action === 'ai_analysis_required') {
      return handleAIAnalysisRequest(prepareResult);
    }

    // Step 3: Process (internal) - only if no AI analysis needed
    const processResult = await handleProcessComprehensiveSpecAnalysis({
      ...args,
      analysis: prepareResult
    });

    return {
      ...processResult,
      internal_step: 'unified_operation'
    };
  } catch (error) {
    return handleUnifiedError(error, 'unified_operation');
  }
}
