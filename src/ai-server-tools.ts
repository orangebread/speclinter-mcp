import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import {
  handleAnalyzeCodebaseUnified,
  handleParseSpecUnified,
  handleFindSimilarUnified,
  handleValidateImplementationUnified,
  handleGenerateGherkinUnified,
  handleAnalyzeSpecQualityUnified,
  handleGenerateTasksUnified,
  handleAnalyzeSpecComprehensiveUnified
} from './unified-ai-tools.js';
import { generateCodebaseAnalysisExample, generateMinimalExample, getSchemaDocumentation } from './utils/schema-examples.js';

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
  // Schema documentation and examples
  server.registerTool(
    'speclinter_get_schema_help',
    {
      title: 'Get Schema Documentation',
      description: 'Get detailed schema documentation and examples for SpecLinter AI analysis tools',
      inputSchema: {
        schema_name: z.enum(['AICodebaseAnalysisWithContextSchema', 'AISpecAnalysisSchema', 'AIGherkinAnalysisSchema']).optional().describe('Specific schema to get help for'),
        include_example: z.boolean().optional().default(true).describe('Include a complete example'),
        example_type: z.enum(['complete', 'minimal']).optional().default('complete').describe('Type of example to include')
      }
    },
    async (args) => {
      const { schema_name, include_example = true, example_type = 'complete' } = args;

      if (schema_name) {
        const documentation = getSchemaDocumentation(schema_name);
        const result: any = { schema_name, documentation };

        if (include_example && schema_name === 'AICodebaseAnalysisWithContextSchema') {
          result.example = example_type === 'minimal'
            ? generateMinimalExample()
            : generateCodebaseAnalysisExample();
        }

        return wrapMcpResponse(result);
      }

      // Return overview of all schemas
      return wrapMcpResponse({
        available_schemas: [
          {
            name: 'AICodebaseAnalysisWithContextSchema',
            description: 'Combined codebase analysis and context files generation',
            used_by: ['speclinter_analyze_codebase']
          },
          {
            name: 'AISpecAnalysisSchema',
            description: 'Specification analysis with quality assessment and task extraction',
            used_by: ['speclinter_parse_spec']
          },
          {
            name: 'AIGherkinAnalysisSchema',
            description: 'Gherkin scenario generation with quality metrics',
            used_by: ['speclinter_generate_gherkin']
          }
        ],
        usage: 'Call this tool with schema_name parameter to get detailed documentation and examples'
      });
    }
  );








  // ========================================
  // UNIFIED TOOLS - Single-step operations
  // ========================================

  // Unified Codebase Analysis
  server.registerTool(
    'speclinter_analyze_codebase',
    {
      title: 'Analyze Codebase',
      description: 'Comprehensive codebase analysis that generates rich project documentation and context files',
      inputSchema: {
        project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)'),
        analysis_depth: z.enum(['quick', 'standard', 'deep']).optional().default('standard').describe('Depth of analysis to perform'),
        max_files: z.number().optional().default(50).describe('Maximum number of files to analyze'),
        max_file_size: z.number().optional().default(50000).describe('Maximum file size in bytes to include'),
        // Advanced usage: pre-computed analysis
        analysis: z.object({}).passthrough().optional().describe('Pre-computed AI analysis (advanced usage)'),
        contextFiles: z.object({}).passthrough().optional().describe('Pre-computed context files (advanced usage)')
      }
    },
    async (args) => handleToolExecution(handleAnalyzeCodebaseUnified, args)
  );

  // Unified Specification Parsing
  server.registerTool(
    'speclinter_parse_spec',
    {
      title: 'Parse Specification',
      description: 'Process specification and create SpecLinter tasks with AI analysis',
      inputSchema: {
        spec: z.string().describe('The specification text to parse'),
        feature_name: z.string().describe('Name for the feature (used for directory)'),
        context: z.string().optional().describe('Additional context about the implementation'),
        project_root: z.string().optional().describe('Root directory of the project (defaults to current working directory)'),
        // Advanced usage: pre-computed analysis
        analysis: z.object({}).passthrough().optional().describe('Pre-computed AI analysis (advanced usage)'),
        deduplication_strategy: z.enum(['prompt', 'merge', 'replace', 'skip']).optional().default('prompt').describe('How to handle duplicate/similar features'),
        similarity_threshold: z.number().optional().describe('Similarity threshold for detecting duplicates (0.0 to 1.0)'),
        skip_similarity_check: z.boolean().optional().default(false).describe('Skip similarity checking entirely')
      }
    },
    async (args) => handleToolExecution(handleParseSpecUnified, args)
  );

  // Unified Similarity Analysis
  server.registerTool(
    'speclinter_find_similar',
    {
      title: 'Find Similar Features',
      description: 'Find similar features using AI analysis against existing specifications',
      inputSchema: {
        spec: z.string().describe('Specification to find similarities for'),
        threshold: z.number().optional().default(0.8).describe('Similarity threshold (0.0 to 1.0)'),
        project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)'),
        // Advanced usage: pre-computed analysis
        analysis: z.object({}).passthrough().optional().describe('Pre-computed AI analysis (advanced usage)')
      }
    },
    async (args) => handleToolExecution(handleFindSimilarUnified, args)
  );

  // Unified Implementation Validation
  server.registerTool(
    'speclinter_validate_implementation',
    {
      title: 'Validate Implementation',
      description: 'Validate feature implementation using AI analysis of codebase',
      inputSchema: {
        feature_name: z.string().describe('Name of the feature to validate'),
        project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)'),
        // Advanced usage: pre-computed analysis
        analysis: z.object({}).passthrough().optional().describe('Pre-computed AI analysis (advanced usage)')
      }
    },
    async (args) => handleToolExecution(handleValidateImplementationUnified, args)
  );

  // Unified Gherkin Generation
  server.registerTool(
    'speclinter_generate_gherkin',
    {
      title: 'Generate Gherkin Scenarios',
      description: 'Generate BDD scenarios using AI analysis for a specific task',
      inputSchema: {
        task: z.object({}).passthrough().describe('Task object with title, summary, implementation, and acceptance criteria'),
        feature_name: z.string().describe('Name of the feature this task belongs to'),
        project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)'),
        // Advanced usage: pre-computed analysis
        analysis: z.object({}).passthrough().optional().describe('Pre-computed AI analysis (advanced usage)'),
        task_id: z.string().optional().describe('ID of the task being processed (for advanced usage)')
      }
    },
    async (args) => handleToolExecution(handleGenerateGherkinUnified, args)
  );

  // Unified Spec Quality Analysis
  server.registerTool(
    'speclinter_analyze_spec_quality',
    {
      title: 'Analyze Specification Quality',
      description: 'Analyze specification quality using AI with semantic understanding',
      inputSchema: {
        spec: z.string().describe('The specification text to analyze'),
        feature_name: z.string().describe('Name for the feature'),
        context: z.string().optional().describe('Additional context about the specification'),
        project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)'),
        analysis_depth: z.enum(['quick', 'standard', 'comprehensive']).optional().default('standard').describe('Depth of quality analysis to perform'),
        // Advanced usage: pre-computed analysis
        analysis: z.object({}).passthrough().optional().describe('Pre-computed AI analysis (advanced usage)')
      }
    },
    async (args) => handleToolExecution(handleAnalyzeSpecQualityUnified, args)
  );

  // Unified Task Generation
  server.registerTool(
    'speclinter_generate_tasks',
    {
      title: 'Generate Tasks from Specification',
      description: 'Generate comprehensive task breakdown using AI analysis',
      inputSchema: {
        spec: z.string().describe('The specification text to break down into tasks'),
        feature_name: z.string().describe('Name for the feature'),
        quality_analysis: z.object({}).passthrough().optional().describe('Previous quality analysis results'),
        context: z.string().optional().describe('Additional context about the specification'),
        project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)'),
        task_complexity: z.enum(['basic', 'standard', 'comprehensive']).optional().default('standard').describe('Complexity level for task generation'),
        // Advanced usage: pre-computed analysis
        analysis: z.object({}).passthrough().optional().describe('Pre-computed AI analysis (advanced usage)')
      }
    },
    async (args) => handleToolExecution(handleGenerateTasksUnified, args)
  );

  // Unified Comprehensive Spec Analysis
  server.registerTool(
    'speclinter_analyze_spec_comprehensive',
    {
      title: 'Comprehensive Specification Analysis',
      description: 'Comprehensive AI analysis combining quality assessment and task generation',
      inputSchema: {
        spec: z.string().describe('The specification text to analyze comprehensively'),
        feature_name: z.string().describe('Name for the feature'),
        context: z.string().optional().describe('Additional context about the specification'),
        project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)'),
        analysis_depth: z.enum(['quick', 'standard', 'comprehensive']).optional().default('standard').describe('Depth of comprehensive analysis to perform'),
        focus_areas: z.array(z.string()).optional().default([]).describe('Specific areas to focus analysis on'),
        // Advanced usage: pre-computed analysis
        analysis: z.object({}).passthrough().optional().describe('Pre-computed AI analysis (advanced usage)')
      }
    },
    async (args) => handleToolExecution(handleAnalyzeSpecComprehensiveUnified, args)
  );
}

// Hybrid tools removed - focusing on clean AI-leveraged implementation
