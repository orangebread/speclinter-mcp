# SpecLinter Code Patterns

## Core Architectural Patterns

### AI-First Tool Pattern
**Confidence**: 94%
**Usage**: Foundation pattern for all AI-integrated tools

```typescript
// Two-step AI integration pattern
export async function analyzeWithAI<T>(
  inputs: InputType,
  schema: z.ZodSchema<T>
): Promise<AnalysisResult<T>> {
  // Step 1: Prepare structured prompt
  const prompt = await prepareAnalysisPrompt(inputs);
  
  // Step 2: Process with validation
  return await processAIResponse(prompt, schema);
}
```

### MCP Tool Registration Pattern
**Confidence**: 98%
**Usage**: Standardized tool registration across all features

```typescript
server.registerTool(
  'speclinter_tool_name',
  {
    title: 'Tool Title',
    description: 'Comprehensive description with schema info',
    inputSchema: zodSchema
  },
  async (args) => handleToolExecution(handler, args)
);
```

### Schema-Driven Validation Pattern
**Confidence**: 96%
**Usage**: All inputs and outputs validated with Zod

```typescript
const ToolInputSchema = z.object({
  project_root: z.string().optional().describe('Root directory'),
  analysis_depth: z.enum(['quick', 'standard', 'deep']).default('standard'),
  confidence_threshold: z.number().min(0).max(1).default(0.7)
});

type ToolInput = z.infer<typeof ToolInputSchema>;
```

## Error Handling Patterns

### Structured Error Response Pattern
**Confidence**: 95%
**Usage**: Consistent error handling with recovery guidance

```typescript
try {
  const result = await processRequest(input);
  return { success: true, data: result };
} catch (error) {
  return {
    success: false,
    error: error.message,
    error_type: 'validation',
    suggestions: ['Try different parameters', 'Check configuration'],
    recovery_actions: ['Reinitialize project', 'Update configuration']
  };
}
```

### Try-Catch with Validation
**Confidence**: 92%
**Usage**: Input validation with comprehensive error handling

```typescript
try {
  const validated = schema.parse(input);
  return await process(validated);
} catch (error) {
  if (error instanceof z.ZodError) {
    return handleValidationError(error);
  }
  return handleUnknownError(error);
}
```

## AI Integration Patterns

### Prompt Engineering Pattern
**Confidence**: 93%
**Usage**: Structured prompt generation for consistent AI responses

```typescript
function buildAnalysisPrompt(context: ProjectContext): string {
  return `
Analyze the following codebase for features:

Context: ${context.description}
Tech Stack: ${context.techStack}
Files: ${context.relevantFiles.join(', ')}

Provide analysis in the following JSON format:
${JSON.stringify(expectedSchema, null, 2)}
  `;
}
```

### Response Validation Pattern
**Confidence**: 91%
**Usage**: Strict validation of AI responses

```typescript
function validateAIResponse<T>(response: unknown, schema: z.ZodSchema<T>): T {
  try {
    return schema.parse(response);
  } catch (error) {
    throw new Error(`Invalid AI response: ${error.message}`);
  }
}
```

## Configuration Management Patterns

### Default Configuration Pattern
**Confidence**: 88%
**Usage**: Comprehensive default settings with environment overrides

```typescript
export const DEFAULT_CONFIG: Config = {
  version: "1.0.0",
  generation: {
    tasksPerFeature: 10,
    testFramework: "vitest",
    gherkinStyle: "declarative"
  },
  reverseSpec: {
    enabled: true,
    analysisDepth: "standard",
    confidenceThreshold: 0.7,
    discoveryMode: "features"
  }
};
```

## Storage and Data Patterns

### File-Based Storage Pattern
**Confidence**: 89%
**Usage**: Structured file organization with JSON storage

```typescript
const STORAGE_STRUCTURE = {
  tasks: './speclinter-tasks/{feature-name}/',
  context: './.speclinter/context/',
  config: './.speclinter/config.json',
  implementations: './.speclinter/implementations/'
};
```

### Task Management Pattern
**Confidence**: 87%
**Usage**: Consistent task structure and lifecycle

```typescript
interface Task {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  acceptanceCriteria: AcceptanceCriteria[];
  estimatedEffort: EffortEstimate;
  businessValue: BusinessValue;
}
```

## Testing Patterns

### BDD Scenario Generation Pattern
**Confidence**: 88%
**Usage**: Automated Gherkin scenario creation

```gherkin
Feature: {Feature Name}

Scenario: {Scenario Name}
  Given {precondition}
  When {action}
  Then {expected outcome}
  And {additional verification}
```

### Vitest Integration Pattern
**Confidence**: 85%
**Usage**: Test framework integration with TypeScript

```typescript
describe('Feature Tests', () => {
  test('should meet acceptance criteria', async () => {
    const result = await handler(validInput);
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject(expectedOutput);
  });
});
```

## Naming Conventions

- **Files**: kebab-case (ai-server-tools.ts)
- **Variables**: camelCase (projectRoot)
- **Functions**: camelCase (handleProcessCodebaseAnalysis)
- **Classes**: PascalCase (SpecParser)
- **Constants**: UPPER_SNAKE_CASE (DEFAULT_CONFIG)
- **Types/Interfaces**: PascalCase (Config, Task)
- **Enums**: PascalCase with UPPER_SNAKE_CASE values