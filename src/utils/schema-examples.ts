/**
 * Schema example generator for SpecLinter MCP tools
 * Provides concrete examples and documentation for AI analysis schemas
 */

import type { 
  AICodebaseAnalysisWithContext,
  AICodebaseAnalysis,
  AIContextFiles,
  AITechStack,
  AINamingConventions,
  AIProjectStructure,
  AICodePattern
} from '../types/ai-schemas.js';

/**
 * Generate a complete example of AICodebaseAnalysisWithContextSchema
 */
export function generateCodebaseAnalysisExample(): AICodebaseAnalysisWithContext {
  return {
    analysis: {
      techStack: {
        frontend: "React with TypeScript",
        backend: "Node.js with Express",
        database: "SQLite",
        testing: "Vitest",
        buildTool: "TypeScript Compiler",
        packageManager: "pnpm",
        language: "TypeScript",
        confidence: 0.95
      },
      errorPatterns: [
        {
          name: "Try-Catch Error Handling",
          description: "Consistent error handling with try-catch blocks",
          example: "try { await operation(); } catch (error) { return { success: false, error: error.message }; }",
          confidence: 0.9,
          locations: [
            { file: "src/ai-tools.ts", lineStart: 507, lineEnd: 544 },
            { file: "src/tools.ts", lineStart: 123, lineEnd: 135 }
          ]
        }
      ],
      apiPatterns: [
        {
          name: "MCP Tool Registration",
          description: "Model Context Protocol tool registration pattern",
          example: "server.registerTool('tool_name', { title, description, inputSchema }, handler)",
          confidence: 0.95,
          locations: [
            { file: "src/ai-server-tools.ts", lineStart: 71, lineEnd: 135 }
          ]
        }
      ],
      testPatterns: [
        {
          name: "Vitest Unit Tests",
          description: "Unit testing with Vitest framework",
          example: "describe('feature', () => { test('should work', () => { expect(result).toBe(expected); }); });",
          confidence: 0.8,
          locations: [
            { file: "tests/ai-tools.test.ts", lineStart: 1, lineEnd: 50 }
          ]
        }
      ],
      namingConventions: {
        fileNaming: "kebab-case for files, camelCase for TypeScript files",
        variableNaming: "camelCase",
        functionNaming: "camelCase",
        classNaming: "PascalCase",
        constantNaming: "UPPER_SNAKE_CASE",
        examples: [
          { type: "file", example: "ai-server-tools.ts", convention: "kebab-case" },
          { type: "variable", example: "projectRoot", convention: "camelCase" },
          { type: "function", example: "handleProcessCodebaseAnalysis", convention: "camelCase" },
          { type: "class", example: "StorageManager", convention: "PascalCase" },
          { type: "constant", example: "DEFAULT_CONFIG", convention: "UPPER_SNAKE_CASE" }
        ]
      },
      projectStructure: {
        srcDir: "src",
        testDir: "tests",
        configFiles: ["package.json", "tsconfig.json", "vitest.config.ts"],
        entryPoints: ["src/index.ts", "src/server.ts"],
        architecture: "modular",
        organizationPattern: "organized by feature with core utilities"
      },
      codeQuality: {
        overallScore: 85,
        maintainability: 90,
        testCoverage: 75,
        documentation: 80,
        issues: [
          {
            type: "documentation",
            severity: "medium",
            description: "Some functions lack comprehensive JSDoc comments",
            file: "src/ai-tools.ts",
            suggestion: "Add detailed JSDoc comments for complex functions"
          }
        ]
      },
      insights: [
        "Project follows TypeScript best practices with strict type checking",
        "Consistent error handling patterns across the codebase",
        "Well-structured modular architecture with clear separation of concerns",
        "Strong use of Zod for runtime type validation"
      ],
      recommendations: [
        "Consider adding more comprehensive integration tests",
        "Improve JSDoc documentation coverage",
        "Add performance monitoring for AI analysis operations",
        "Consider implementing caching for repeated analysis operations"
      ]
    },
    contextFiles: {
      projectMd: `# SpecLinter MCP Project

## Overview
SpecLinter MCP is a Model Context Protocol server that transforms natural language specifications into structured development tasks using AI-powered analysis.

## Tech Stack
- **Language**: TypeScript
- **Runtime**: Node.js
- **Package Manager**: pnpm
- **Testing**: Vitest
- **Database**: SQLite
- **Architecture**: Modular MCP server

## Key Features
- AI-powered specification analysis
- Automatic task generation
- Quality assessment and grading
- Similarity detection
- Implementation validation
- Gherkin scenario generation

## Development Workflow
1. Specifications are parsed and analyzed by AI
2. Tasks are generated with implementation guidance
3. Quality gates ensure specification completeness
4. Implementation is validated against original specs
5. Test scenarios are auto-generated
`,
      patternsMd: `# Code Patterns

## Error Handling Patterns

### Try-Catch with Structured Response
**Confidence**: 90%
**Usage**: Consistent across all async operations

\`\`\`typescript
try {
  const result = await operation();
  return { success: true, data: result };
} catch (error) {
  return { 
    success: false, 
    error: error instanceof Error ? error.message : 'Unknown error' 
  };
}
\`\`\`

## API Patterns

### MCP Tool Registration
**Confidence**: 95%
**Usage**: All MCP tools follow this pattern

\`\`\`typescript
server.registerTool(
  'tool_name',
  {
    title: 'Tool Title',
    description: 'Detailed description with schema info',
    inputSchema: { /* Zod schema */ }
  },
  async (args) => handleToolExecution(handler, args)
);
\`\`\`

## Testing Patterns

### Vitest Unit Tests
**Confidence**: 80%
**Usage**: Standard testing approach

\`\`\`typescript
describe('Feature', () => {
  test('should handle valid input', () => {
    expect(result).toBe(expected);
  });
});
\`\`\`
`,
      architectureMd: `# Architecture

## System Design
SpecLinter MCP follows a modular architecture with clear separation between:
- **Core Logic**: Business logic and data management
- **AI Integration**: AI-powered analysis and generation
- **MCP Interface**: Model Context Protocol server implementation
- **Storage**: SQLite-based persistence layer

## MCP Architecture
The server implements the Model Context Protocol specification:
- **Tools**: Exposed as MCP tools for AI assistants
- **Resources**: Project context and documentation
- **Prompts**: AI analysis prompts and templates

## AI-Leveraged Patterns
Two-step AI integration pattern:
1. **Prepare**: Collect data and generate AI prompts
2. **Process**: Validate and process AI responses

## Data Flow
1. User provides specification via MCP tool
2. System analyzes codebase context
3. AI performs semantic analysis
4. Results are validated and stored
5. Tasks and documentation are generated
6. Implementation validation occurs

## Implementation Decisions
- **TypeScript**: Full type safety with runtime validation
- **Zod**: Schema validation for AI responses
- **SQLite**: Lightweight persistence for task management
- **Modular Design**: Easy to extend and maintain
`
    }
  };
}

/**
 * Generate schema documentation for error messages
 */
export function getSchemaDocumentation(schemaName: string): object {
  switch (schemaName) {
    case 'AICodebaseAnalysisWithContextSchema':
      return {
        description: 'Combined codebase analysis and context files',
        structure: {
          analysis: 'AICodebaseAnalysisSchema object',
          contextFiles: 'AIContextFilesSchema object'
        },
        example: generateCodebaseAnalysisExample()
      };
    
    default:
      return {
        description: 'Unknown schema',
        suggestion: 'Check the tool description for schema requirements'
      };
  }
}

/**
 * Generate minimal valid example for quick testing
 */
export function generateMinimalExample(): AICodebaseAnalysisWithContext {
  return {
    analysis: {
      techStack: {
        language: "TypeScript",
        confidence: 0.8
      },
      errorPatterns: [],
      apiPatterns: [],
      testPatterns: [],
      namingConventions: {
        fileNaming: "kebab-case",
        variableNaming: "camelCase",
        functionNaming: "camelCase",
        examples: []
      },
      projectStructure: {
        srcDir: "src",
        testDir: "tests",
        configFiles: ["package.json"],
        entryPoints: ["src/index.ts"],
        architecture: "modular",
        organizationPattern: "by feature"
      },
      codeQuality: {
        overallScore: 80,
        maintainability: 80,
        documentation: 70,
        issues: []
      },
      insights: ["Basic TypeScript project structure"],
      recommendations: ["Add more comprehensive analysis"]
    },
    contextFiles: {
      projectMd: "# Project\n\nBasic project documentation.",
      patternsMd: "# Patterns\n\nNo specific patterns detected.",
      architectureMd: "# Architecture\n\nModular TypeScript architecture."
    }
  };
}
