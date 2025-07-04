import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  handleAnalyzeCodebaseAI,
  handleUpdateContextFilesAI,
  handleParseSpecAI,
  handleProcessSpecAnalysisAI,
  handleFindSimilarAI,
  handleProcessSimilarityAnalysisAI
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
  // AI-leveraged codebase analysis (Step 1)
  server.registerTool(
    'speclinter_analyze_codebase_prepare',
    {
      title: 'Prepare Codebase for AI Analysis',
      description: 'Collect codebase files and return AI analysis prompt for comprehensive pattern detection',
      inputSchema: {
        project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)'),
        analysis_depth: z.enum(['quick', 'standard', 'deep']).optional().default('standard').describe('Depth of analysis to perform'),
        max_files: z.number().optional().default(50).describe('Maximum number of files to analyze'),
        max_file_size: z.number().optional().default(50000).describe('Maximum file size in bytes to include')
      }
    },
    async (args) => handleToolExecution(handleAnalyzeCodebaseAI, args)
  );

  // Process AI codebase analysis results (Step 2)
  server.registerTool(
    'speclinter_analyze_codebase_process',
    {
      title: 'Process AI Codebase Analysis',
      description: 'Process AI codebase analysis results and update SpecLinter context files',
      inputSchema: {
        analysis: z.object({}).passthrough().describe('AI analysis results matching AICodebaseAnalysisSchema'),
        project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)')
      }
    },
    async (args) => handleToolExecution(handleUpdateContextFilesAI, args)
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
}

// Hybrid tools removed - focusing on clean AI-leveraged implementation
