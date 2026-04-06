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
  handleProcessComprehensiveSpecAnalysis,
  handleProcessReverseSpecAnalysis,
  handleReverseSpecAnalysis
} from './ai-tools.js';
import {
  validateProjectContext,
  createErrorResponse,
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

function createAIContinuationResponse(
  prepareResult: any,
  publicToolName: string,
  originalArgs: Record<string, any>
): UnifiedToolResponse {
  const continuationArgs: Record<string, any> = {
    ...originalArgs,
    project_root: prepareResult.project_root ?? originalArgs.project_root,
    feature_name: prepareResult.feature_name ?? originalArgs.feature_name,
    original_spec: prepareResult.original_spec ?? originalArgs.original_spec,
    context: prepareResult.input_context ?? originalArgs.context
  };

  if (prepareResult.task_id) {
    continuationArgs.task_id = prepareResult.task_id;
  }

  if (prepareResult.follow_up_tool === 'process_reverse_spec_analysis') {
    continuationArgs.include_reverse_spec = true;
    continuationArgs.context = prepareResult.context ?? originalArgs.context;
  }

  return {
    success: true,
    state: 'needs_ai_analysis',
    action: 'ai_analysis_required',
    analysis_prompt: prepareResult.analysis_prompt ?? prepareResult.validation_prompt,
    schema: prepareResult.schema,
    continuation_tool: publicToolName,
    continuation_args: continuationArgs,
    instructions: [
      'Analyze the provided prompt and return JSON matching the specified schema.',
      `Call ${publicToolName} again with the same arguments plus the analysis result in the "analysis" field.`,
      `Expected schema: ${prepareResult.schema}`
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
 * Exposes a single public MCP entrypoint for codebase analysis.
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
        // Check if this should be reverse spec analysis based on include_reverse_spec parameter
        const isReverseSpec = args.include_reverse_spec === true;

        if (isReverseSpec) {
          // Route to reverse spec analysis
          return {
            ...await handleProcessReverseSpecAnalysis(args),
            internal_step: 'unified_operation'
          };
        } else {
          // Route to regular codebase analysis
          return {
            ...await handleProcessCodebaseAnalysis(args),
            internal_step: 'unified_operation'
          };
        }
      } catch (error) {
        return handleUnifiedError(error, 'process_analysis', 'ai_analysis');
      }
    }

    // Step 1: Prepare (internal)
    const prepareResult = await handleAnalyzeCodebase(args);
    if (!prepareResult.success) {
      return createErrorResponse(
        new Error((prepareResult as any).error || 'Preparation failed'),
        'prepare',
        'codebase_analysis_preparation'
      );
    }

    // Step 2: Check if AI analysis is needed
    if (prepareResult.action === 'ai_analysis_required') {
      return createAIContinuationResponse(prepareResult, 'speclinter_analyze_codebase', args);
    }

    // Step 3: Process (internal) - only if no AI analysis is required
    const isReverseSpec = prepareResult.follow_up_tool === 'process_reverse_spec_analysis';

    const processResult = isReverseSpec
      ? await handleProcessReverseSpecAnalysis({
          ...args,
          analysis: prepareResult
        })
      : await handleProcessCodebaseAnalysis({
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
 * Exposes a single public MCP entrypoint for specification analysis.
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
        return {
          ...await handleProcessSpecAnalysisAI(args),
          internal_step: 'unified_operation'
        };
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
        return createAIContinuationResponse(prepareResult, 'speclinter_parse_spec', args);
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
 * Exposes a single public MCP entrypoint for duplicate feature detection.
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
      return {
        ...await handleProcessSimilarityAnalysisAI(args),
        internal_step: 'unified_operation'
      };
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
      return createAIContinuationResponse(prepareResult, 'speclinter_find_similar', args);
    }

    if (!('action' in prepareResult)) {
      return {
        ...prepareResult,
        internal_step: 'unified_operation'
      };
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
 * Exposes a single public MCP entrypoint for implementation validation.
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
      return {
        ...await handleValidateImplementationProcess(args),
        internal_step: 'unified_operation'
      };
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
      return createAIContinuationResponse(prepareResult, 'speclinter_validate_implementation', args);
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
 * Exposes a single public MCP entrypoint for BDD scenario generation.
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
      return {
        ...await handleProcessGherkinAnalysis(args),
        internal_step: 'unified_operation'
      };
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
      return createAIContinuationResponse(prepareResult, 'speclinter_generate_gherkin', args);
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
 * Exposes a single public MCP entrypoint for specification quality assessment.
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
      return {
        ...await handleProcessSpecQualityAnalysis(args),
        internal_step: 'unified_operation'
      };
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
      return createAIContinuationResponse(prepareResult, 'speclinter_analyze_spec_quality', args);
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
 * Exposes a single public MCP entrypoint for task generation from specs.
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
      return {
        ...await handleProcessTaskGeneration(args),
        internal_step: 'unified_operation'
      };
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
      return createAIContinuationResponse(prepareResult, 'speclinter_generate_tasks', args);
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
 * Exposes a single public MCP entrypoint for comprehensive spec analysis.
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
      return {
        ...await handleProcessComprehensiveSpecAnalysis(args),
        internal_step: 'unified_operation'
      };
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
      return createAIContinuationResponse(prepareResult, 'speclinter_analyze_spec_comprehensive', args);
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

/**
 * Unified Reverse Specification Discovery Tool
 * Discovers existing features from codebase and creates speclinter-tasks directories
 */
export async function handleReverseSpecUnified(args: any): Promise<UnifiedToolResponse> {
  try {
    // Validate project context
    const validation = await validateProjectContext(args.project_root);
    if (!validation.success) {
      return validation;
    }

    // If analysis is provided, skip prepare step (advanced usage)
    if (args.analysis) {
      return {
        ...await handleProcessReverseSpecAnalysis(args),
        internal_step: 'unified_operation'
      };
    }

    // Step 1: Prepare (internal)
    const prepareResult = await handleReverseSpecAnalysis(args);
    if (!prepareResult.success) {
      return {
        ...prepareResult,
        internal_step: 'prepare',
        debug_info: 'Failed during reverse spec analysis preparation'
      };
    }

    // Step 2: Check if AI analysis is needed
    if (prepareResult.action === 'ai_analysis_required') {
      return createAIContinuationResponse(prepareResult, 'speclinter_reverse_spec', args);
    }

    // Step 3: Process (internal) - only if no AI analysis needed
    const processResult = await handleProcessReverseSpecAnalysis({
      ...args,
      analysis: prepareResult
    });

    return {
      ...processResult,
      internal_step: 'unified_operation'
    };
  } catch (error) {
    return handleUnifiedError(error, 'unified_operation', 'reverse_spec_analysis');
  }
}
