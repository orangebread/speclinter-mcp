import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
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
  handleProcessGherkinAnalysis
} from './ai-tools.js';

/**
 * Helper function to wrap tool results in MCP content format
 */
function wrapMcpResponse(result: any) {
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify(result, null, 2)
    }]
  };
}

/**
 * Helper function to handle tool execution with proper MCP response format
 */
async function handleToolExecution(toolHandler: (args: any) => Promise<any>, args: any) {
  try {
    const result = await toolHandler(args);
    return wrapMcpResponse(result);
  } catch (error) {
    return wrapMcpResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

/**
 * Register AI-leveraged tools with the MCP server
 * These tools follow the two-step pattern: collect data + return AI prompts, then process AI results
 */
export function registerAITools(server: McpServer) {
  // Comprehensive codebase analysis
  server.registerTool(
    'speclinter_analyze_codebase_prepare',
    {
      title: 'Analyze Codebase',
      description: 'Comprehensive codebase analysis that generates rich project documentation and context files',
      inputSchema: {
        project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)'),
        analysis_depth: z.enum(['quick', 'standard', 'deep']).optional().default('standard').describe('Depth of analysis to perform'),
        max_files: z.number().optional().default(50).describe('Maximum number of files to analyze'),
        max_file_size: z.number().optional().default(50000).describe('Maximum file size in bytes to include')
      }
    },
    async (args) => handleToolExecution(handleAnalyzeCodebase, args)
  );

  // Process codebase analysis results
  server.registerTool(
    'speclinter_analyze_codebase_process',
    {
      title: 'Process Codebase Analysis',
      description: 'Process comprehensive codebase analysis results and update SpecLinter context files',
      inputSchema: {
        analysis: z.object({}).passthrough().describe('AI analysis results matching AICodebaseAnalysisWithContextSchema'),
        contextFiles: z.object({}).passthrough().optional().describe('AI-generated context files'),
        project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)')
      }
    },
    async (args) => handleToolExecution(handleProcessCodebaseAnalysis, args)
  );

  // AI-leveraged spec parsing (Step 1)
  server.registerTool(
    'speclinter_parse_spec_prepare',
    {
      title: 'Prepare Specification for AI Analysis',
      description: 'Prepare specification for AI analysis and return structured analysis prompt',
      inputSchema: {
        spec: z.string().describe('The specification text to parse'),
        feature_name: z.string().describe('Name for the feature (used for directory)'),
        context: z.string().optional().describe('Additional context about the implementation'),
        project_root: z.string().optional().describe('Root directory of the project (defaults to current working directory)')
      }
    },
    async (args) => handleToolExecution(handleParseSpecAI, args)
  );

  // Process AI spec analysis results (Step 2)
  server.registerTool(
    'speclinter_parse_spec_process',
    {
      title: 'Process AI Specification Analysis',
      description: 'Process AI specification analysis results and create SpecLinter tasks',
      inputSchema: {
        analysis: z.object({}).passthrough().describe('AI analysis results matching AISpecAnalysisSchema'),
        feature_name: z.string().describe('Name for the feature'),
        original_spec: z.string().optional().describe('Original specification text'),
        project_root: z.string().optional().describe('Root directory of the project'),
        deduplication_strategy: z.enum(['prompt', 'merge', 'replace', 'skip']).optional().default('prompt').describe('How to handle duplicate/similar features'),
        similarity_threshold: z.number().optional().describe('Similarity threshold for detecting duplicates (0.0 to 1.0)'),
        skip_similarity_check: z.boolean().optional().default(false).describe('Skip similarity checking entirely')
      }
    },
    async (args) => handleToolExecution(handleProcessSpecAnalysisAI, args)
  );

  // AI-leveraged similarity analysis (Step 1)
  server.registerTool(
    'speclinter_find_similar_prepare',
    {
      title: 'Prepare Similarity Analysis with AI',
      description: 'Prepare specification for AI similarity analysis against existing features',
      inputSchema: {
        spec: z.string().describe('Specification to find similarities for'),
        threshold: z.number().optional().default(0.8).describe('Similarity threshold (0.0 to 1.0)'),
        project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)')
      }
    },
    async (args) => handleToolExecution(handleFindSimilarAI, args)
  );

  // Process AI similarity analysis results (Step 2)
  server.registerTool(
    'speclinter_find_similar_process',
    {
      title: 'Process AI Similarity Analysis',
      description: 'Process AI similarity analysis results and return recommendations',
      inputSchema: {
        analysis: z.object({}).passthrough().describe('AI analysis results matching AISimilarityAnalysisSchema'),
        threshold: z.number().optional().default(0.8).describe('Similarity threshold used'),
        project_root: z.string().optional().describe('Root directory of the project')
      }
    },
    async (args) => handleToolExecution(handleProcessSimilarityAnalysisAI, args)
  );

  // AI-leveraged implementation validation (Step 1)
  server.registerTool(
    'speclinter_validate_implementation_prepare',
    {
      title: 'Prepare Implementation Validation',
      description: 'Scan codebase for feature implementation and prepare AI validation analysis',
      inputSchema: {
        feature_name: z.string().describe('Name of the feature to validate'),
        project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)')
      }
    },
    async (args) => handleToolExecution(handleValidateImplementationPrepare, args)
  );

  // Process AI validation results (Step 2)
  server.registerTool(
    'speclinter_validate_implementation_process',
    {
      title: 'Process AI Implementation Validation',
      description: 'Process AI validation analysis results and provide comprehensive implementation assessment',
      inputSchema: {
        analysis: z.object({}).passthrough().describe('AI validation results matching AIFeatureValidationSchema'),
        feature_name: z.string().describe('Name of the feature being validated'),
        project_root: z.string().optional().describe('Root directory of the project')
      }
    },
    async (args) => handleToolExecution(handleValidateImplementationProcess, args)
  );

  // AI-leveraged Gherkin generation (Step 1)
  server.registerTool(
    'speclinter_generate_gherkin_prepare',
    {
      title: 'Prepare AI Gherkin Generation',
      description: 'Prepare AI-powered Gherkin scenario generation for a specific task',
      inputSchema: {
        task: z.object({}).passthrough().describe('Task object with title, summary, implementation, and acceptance criteria'),
        feature_name: z.string().describe('Name of the feature this task belongs to'),
        project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)')
      }
    },
    async (args) => handleToolExecution(handleGenerateGherkinPrepare, args)
  );

  // Process AI Gherkin analysis results (Step 2)
  server.registerTool(
    'speclinter_generate_gherkin_process',
    {
      title: 'Process AI Gherkin Analysis',
      description: 'Process AI Gherkin analysis results and generate comprehensive scenario files',
      inputSchema: {
        analysis: z.object({}).passthrough().describe('AI Gherkin analysis results matching AIGherkinAnalysisSchema'),
        task_id: z.string().describe('ID of the task being processed'),
        feature_name: z.string().describe('Name of the feature'),
        project_root: z.string().optional().describe('Root directory of the project')
      }
    },
    async (args) => handleToolExecution(handleProcessGherkinAnalysis, args)
  );
}

// Hybrid tools removed - focusing on clean AI-leveraged implementation
