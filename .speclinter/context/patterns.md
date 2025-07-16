# Code Patterns

## Error Handling Patterns

### Try-Catch with Structured Response
**Confidence**: 90%
**Usage**: Consistent across all async operations
**Locations**: `src/ai-tools.ts:421-428`, `src/tools.ts:123-135`

```typescript
try {
  const result = await operation();
  return {
    success: true,
    data: result,
    // Additional success properties
  };
} catch (error) {
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error occurred',
    project_root: rootDir
  };
}
```

### Error Type Checking
**Confidence**: 85%
**Usage**: Proper error handling with type safety

```typescript
error instanceof Error ? error.message : 'Unknown error occurred'
```

## API Patterns

### MCP Tool Registration
**Confidence**: 95%
**Usage**: All MCP tools follow this pattern
**Locations**: `src/server.ts:76-95`, `src/ai-server-tools.ts:71-135`

```typescript
server.registerTool(
  'speclinter_tool_name',
  {
    title: 'Human Readable Title',
    description: 'Detailed description with schema requirements',
    inputSchema: {
      project_root: z.string().optional(),
      // Other Zod schema definitions
    }
  },
  async (args) => {
    const result = await handleToolFunction(args);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);
```

### Unified AI Tool Pattern
**Confidence**: 95%
**Usage**: Single-step AI-leveraged operations with internal prepare/process coordination
**Locations**: `src/unified-ai-tools.ts`

```typescript
// Unified Tool - Handles prepare→AI→process internally
export async function handleAnalyzeCodebaseUnified(args: any): Promise<UnifiedToolResponse> {
  try {
    // Validate project context
    const validation = await validateProjectContext(args.project_root);
    if (!validation.success) {
      return validation;
    }

    // If analysis is provided, skip prepare step (advanced usage)
    if (args.analysis) {
      return await handleProcessCodebaseAnalysis(args);
    }

    // Step 1: Prepare (internal)
    const prepareResult = await handleAnalyzeCodebase(args);
    if (!prepareResult.success) {
      return {
        ...prepareResult,
        internal_step: 'prepare',
        debug_info: 'Failed during codebase analysis preparation'
      };
    }

    // Step 2: AI Analysis (simulated for now)
    const aiAnalysis = generateSimulatedAnalysis(prepareResult);

    // Step 3: Process (internal)
    const processResult = await handleProcessCodebaseAnalysis({
      ...args,
      analysis: aiAnalysis
    });

    return {
      ...processResult,
      internal_step: 'unified_operation',
      ai_analysis_simulated: true
    };
  } catch (error) {
    return handleUnifiedError(error, 'unified_operation');
  }
}
```

### Internal Two-Step AI Pattern (Legacy)
**Confidence**: 90%
**Usage**: Internal utilities for prepare/process coordination
**Locations**: `src/ai-tools.ts` (used internally by unified tools)

```typescript
// Internal Step 1: Prepare - Collect data and generate AI prompt
export async function handleAnalyzeCodebase(args: any) {
  // Collect project data
  const files = await scanCodebaseFiles(rootDir);

  // Generate comprehensive AI prompt
  const analysisPrompt = `Analyze the provided codebase...`;

  return {
    success: true,
    action: 'ai_analysis_required',
    analysis_prompt: analysisPrompt,
    follow_up_tool: 'process_analysis_ai',
    schema: 'AIAnalysisSchema'
  };
}

// Internal Step 2: Process - Validate AI response and update system
export async function handleProcessAnalysis(args: any) {
  const { analysis } = args;

  // Validate AI response against schema
  const validatedAnalysis = validateAnalysisSchema(analysis);

  // Update system with validated results
  await updateContextFiles(validatedAnalysis);

  return {
    success: true,
    files_updated: ['project.md', 'patterns.md', 'architecture.md']
  };
}
```

### Storage Manager Pattern
**Confidence**: 85%
**Usage**: Centralized storage with initialization
**Locations**: `src/core/storage-manager.ts`

```typescript
const storage = await StorageManager.createInitializedStorage(projectRoot);
const result = await storage.performOperation();
```

## Testing Patterns

### Vitest Unit Tests
**Confidence**: 80%
**Usage**: Standard testing approach
**Locations**: `tests/ai-tools.test.ts`

```typescript
import { describe, test, expect } from 'vitest';

describe('AI Tools', () => {
  test('should handle codebase analysis', async () => {
    const result = await handleAnalyzeCodebase({ project_root: '/test' });
    expect(result.success).toBe(true);
    expect(result.action).toBe('ai_analysis_required');
  });
});
```

## Naming Conventions

### File Naming
**Pattern**: kebab-case for TypeScript files
**Examples**: `ai-server-tools.ts`, `storage-manager.ts`, `codebase-analyzer.ts`

### Function Naming
**Pattern**: camelCase with descriptive prefixes
**Examples**: 
- `handleAnalyzeCodebase` (MCP tool handlers)
- `createInitializedStorage` (factory functions)
- `validateAnalysisSchema` (validation functions)

### Variable Naming
**Pattern**: camelCase
**Examples**: `projectRoot`, `analysisPrompt`, `validatedAnalysis`

### Class Naming
**Pattern**: PascalCase
**Examples**: `StorageManager`, `CodebaseAnalyzer`, `TaskGenerator`

### Constant Naming
**Pattern**: UPPER_SNAKE_CASE
**Examples**: `DEFAULT_CONFIG`, `MAX_FILE_SIZE`, `ANALYSIS_DEPTH`

## Configuration Patterns

### Zod Schema Validation
**Confidence**: 95%
**Usage**: Runtime type validation for all inputs

```typescript
const inputSchema = {
  project_root: z.string().optional().describe('Root directory'),
  analysis_depth: z.enum(['quick', 'standard', 'comprehensive']).default('standard')
};
```

### Default Configuration
**Confidence**: 90%
**Usage**: Comprehensive default settings

```typescript
export const DEFAULT_CONFIG: Config = {
  version: "1.0.0",
  generation: {
    tasksPerFeature: 10,
    testFramework: "vitest",
    gherkinStyle: "declarative"
  },
  storage: {
    tasksDir: "./speclinter-tasks",
    dbPath: "./.speclinter/speclinter.db"
  }
};
```