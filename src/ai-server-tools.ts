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
  handleProcessGherkinAnalysis,
  handleAnalyzeSpecQuality,
  handleProcessSpecQualityAnalysis,
  handleGenerateTasksFromSpec,
  handleProcessTaskGeneration,
  handleAnalyzeSpecComprehensive,
  handleProcessComprehensiveSpecAnalysis
} from './ai-tools.js';
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
            used_by: ['speclinter_analyze_codebase_process']
          },
          {
            name: 'AISpecAnalysisSchema',
            description: 'Specification analysis with quality assessment and task extraction',
            used_by: ['speclinter_parse_spec_process']
          },
          {
            name: 'AIGherkinAnalysisSchema',
            description: 'Gherkin scenario generation with quality metrics',
            used_by: ['speclinter_generate_gherkin_process']
          }
        ],
        usage: 'Call this tool with schema_name parameter to get detailed documentation and examples'
      });
    }
  );
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
      description: `Process comprehensive codebase analysis results and update SpecLinter context files.

REQUIRED SCHEMA: AICodebaseAnalysisWithContextSchema
The analysis parameter must contain:
{
  "analysis": {
    "techStack": {
      "frontend": "string (optional)",
      "backend": "string (optional)",
      "database": "string (optional)",
      "testing": "string (optional)",
      "buildTool": "string (optional)",
      "packageManager": "string (optional)",
      "language": "string (optional)",
      "confidence": "number (0-1)"
    },
    "errorPatterns": [{"name": "string", "description": "string", "example": "string", "confidence": "number (0-1)", "locations": [{"file": "string", "lineStart": "number?", "lineEnd": "number?"}]}],
    "apiPatterns": [/* same structure as errorPatterns */],
    "testPatterns": [/* same structure as errorPatterns */],
    "namingConventions": {
      "fileNaming": "string",
      "variableNaming": "string",
      "functionNaming": "string",
      "classNaming": "string (optional)",
      "constantNaming": "string (optional)",
      "examples": [{"type": "file|variable|function|class|constant", "example": "string", "convention": "string"}]
    },
    "projectStructure": {
      "srcDir": "string",
      "testDir": "string",
      "configFiles": ["string"],
      "entryPoints": ["string"],
      "architecture": "monolith|microservices|modular|layered|unknown",
      "organizationPattern": "string"
    },
    "codeQuality": {
      "overallScore": "number (0-100)",
      "maintainability": "number (0-100)",
      "testCoverage": "number (0-100, optional)",
      "documentation": "number (0-100)",
      "issues": [{"type": "string", "severity": "low|medium|high|critical", "description": "string", "file": "string?", "suggestion": "string?"}]
    },
    "insights": ["string"],
    "recommendations": ["string"]
  },
  "contextFiles": {
    "projectMd": "string (complete markdown content)",
    "patternsMd": "string (complete markdown content)",
    "architectureMd": "string (complete markdown content)"
  }
}

ALTERNATIVE: You can provide separate analysis and contextFiles parameters instead of the combined format.`,
      inputSchema: {
        analysis: z.object({}).passthrough().describe('AI analysis results matching AICodebaseAnalysisWithContextSchema (see description for complete structure)'),
        contextFiles: z.object({}).passthrough().optional().describe('AI-generated context files with projectMd, patternsMd, architectureMd fields'),
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
      description: `Process AI specification analysis results and create SpecLinter tasks.

REQUIRED SCHEMA: AISpecAnalysisSchema
The analysis parameter must contain:
{
  "quality": {
    "score": "number (0-100)",
    "grade": "A+|A|B|C|D|F",
    "issues": [{"type": "string", "severity": "low|medium|high|critical", "message": "string", "suggestion": "string", "points": "number"}],
    "strengths": ["string"],
    "improvements": ["string"]
  },
  "tasks": [{"title": "string", "summary": "string", "implementation": "string", "acceptanceCriteria": ["string"], "estimatedEffort": "XS|S|M|L|XL", "dependencies": ["string"], "tags": ["string"], "priority": "low|medium|high|critical"}],
  "technicalConsiderations": ["string"],
  "userStories": ["string"],
  "businessValue": "string",
  "scope": {
    "inScope": ["string"],
    "outOfScope": ["string"],
    "assumptions": ["string"]
  }
}

TIP: Use speclinter_get_schema_help with schema_name="AISpecAnalysisSchema" for detailed examples.`,
      inputSchema: {
        analysis: z.object({}).passthrough().describe('AI analysis results matching AISpecAnalysisSchema (see description for structure)'),
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

  // AI-powered Spec Quality Analysis (Step 1)
  server.registerTool(
    'speclinter_analyze_spec_quality_prepare',
    {
      title: 'Prepare AI Spec Quality Analysis',
      description: 'Prepare AI-powered specification quality analysis with semantic understanding',
      inputSchema: {
        spec: z.string().describe('The specification text to analyze'),
        feature_name: z.string().describe('Name for the feature'),
        context: z.string().optional().describe('Additional context about the specification'),
        project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)'),
        analysis_depth: z.enum(['quick', 'standard', 'comprehensive']).optional().default('standard').describe('Depth of quality analysis to perform')
      }
    },
    async (args) => handleToolExecution(handleAnalyzeSpecQuality, args)
  );

  // AI-powered Spec Quality Analysis (Step 2)
  server.registerTool(
    'speclinter_analyze_spec_quality_process',
    {
      title: 'Process AI Spec Quality Analysis',
      description: 'Process AI quality analysis results and provide comprehensive quality assessment',
      inputSchema: {
        analysis: z.object({}).passthrough().describe('AI analysis results matching AISpecQualityAnalysisSchema'),
        feature_name: z.string().describe('Name of the feature'),
        project_root: z.string().optional().describe('Root directory of the project'),
        analysis_depth: z.enum(['quick', 'standard', 'comprehensive']).optional().default('standard').describe('Depth of analysis performed')
      }
    },
    async (args) => handleToolExecution(handleProcessSpecQualityAnalysis, args)
  );

  // AI-powered Task Generation (Step 1)
  server.registerTool(
    'speclinter_generate_tasks_prepare',
    {
      title: 'Prepare AI Task Generation',
      description: 'Prepare AI-powered task generation from specification with comprehensive implementation guidance',
      inputSchema: {
        spec: z.string().describe('The specification text to break down into tasks'),
        feature_name: z.string().describe('Name for the feature'),
        quality_analysis: z.object({}).passthrough().optional().describe('Previous quality analysis results'),
        context: z.string().optional().describe('Additional context about the specification'),
        project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)'),
        task_complexity: z.enum(['basic', 'standard', 'comprehensive']).optional().default('standard').describe('Complexity level for task generation')
      }
    },
    async (args) => handleToolExecution(handleGenerateTasksFromSpec, args)
  );

  // AI-powered Task Generation (Step 2)
  server.registerTool(
    'speclinter_generate_tasks_process',
    {
      title: 'Process AI Task Generation',
      description: 'Process AI task generation results and create comprehensive task breakdown',
      inputSchema: {
        analysis: z.object({}).passthrough().describe('AI analysis results matching AITaskGenerationSchema'),
        feature_name: z.string().describe('Name of the feature'),
        project_root: z.string().optional().describe('Root directory of the project'),
        task_complexity: z.enum(['basic', 'standard', 'comprehensive']).optional().default('standard').describe('Complexity level used for generation')
      }
    },
    async (args) => handleToolExecution(handleProcessTaskGeneration, args)
  );

  // Comprehensive AI Spec Parser Analysis (Step 1)
  server.registerTool(
    'speclinter_analyze_spec_comprehensive_prepare',
    {
      title: 'Prepare Comprehensive AI Spec Analysis',
      description: 'Prepare comprehensive AI-powered specification analysis combining quality assessment and task generation',
      inputSchema: {
        spec: z.string().describe('The specification text to analyze comprehensively'),
        feature_name: z.string().describe('Name for the feature'),
        context: z.string().optional().describe('Additional context about the specification'),
        project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)'),
        analysis_depth: z.enum(['quick', 'standard', 'comprehensive']).optional().default('standard').describe('Depth of comprehensive analysis to perform'),
        focus_areas: z.array(z.string()).optional().default([]).describe('Specific areas to focus analysis on')
      }
    },
    async (args) => handleToolExecution(handleAnalyzeSpecComprehensive, args)
  );

  // Comprehensive AI Spec Parser Analysis (Step 2)
  server.registerTool(
    'speclinter_analyze_spec_comprehensive_process',
    {
      title: 'Process Comprehensive AI Spec Analysis',
      description: 'Process comprehensive AI analysis results and provide complete specification breakdown',
      inputSchema: {
        analysis: z.object({}).passthrough().describe('AI analysis results matching AISpecParserAnalysisSchema'),
        feature_name: z.string().describe('Name of the feature'),
        project_root: z.string().optional().describe('Root directory of the project'),
        analysis_depth: z.enum(['quick', 'standard', 'comprehensive']).optional().default('standard').describe('Depth of analysis performed')
      }
    },
    async (args) => handleToolExecution(handleProcessComprehensiveSpecAnalysis, args)
  );
}

// Hybrid tools removed - focusing on clean AI-leveraged implementation
