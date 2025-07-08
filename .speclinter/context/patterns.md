# AI-Discovered Code Patterns

*Generated from comprehensive codebase analysis*

## Error Handling Patterns

### MCP Error Response Pattern (Confidence: 95%)
Structured error responses with success flags and detailed error messages for MCP tools

**Found in**: src/ai-tools.ts, src/tools.ts

```typescript
return {
  success: false,
  error: 'message',
  details: {...},
  project_root: rootDir
}
```

**Usage**: All MCP tool handlers use this consistent error format for reliable error handling in AI IDEs.

### Zod Schema Validation (Confidence: 90%)
Comprehensive input validation using Zod schemas with detailed error reporting

**Found in**: src/ai-tools.ts, src/types/ai-schemas.ts

```typescript
const validatedAnalysis = AICodebaseAnalysisSchema.parse(analysis);
// Automatic validation with detailed error messages
```

**Usage**: All AI tool inputs and outputs are validated against Zod schemas for type safety and error prevention.

### File System Error Handling (Confidence: 85%)
Graceful handling of file access and directory creation failures

**Found in**: src/core/storage.ts, src/tools.ts

```typescript
try {
  await fs.access(path)
} catch {
  throw new Error('not initialized')
}
```

**Usage**: File operations include proper error handling with meaningful error messages.

## API Patterns

### MCP Tool Registration Pattern (Confidence: 95%)
Standardized MCP tool registration with title, description, and Zod input schemas

**Found in**: src/server.ts, src/ai-server-tools.ts

```typescript
server.registerTool('tool_name', {
  title: 'Tool Title',
  description: 'Tool description',
  inputSchema: zodSchema
}, handler)
```

**Usage**: All MCP tools follow this consistent registration pattern for reliable AI IDE integration.

### Two-Step AI Tool Pattern (Confidence: 90%)
AI tools that prepare prompts, then process AI responses with validation

**Found in**: src/ai-tools.ts

```typescript
// Step 1: Prepare data and return AI prompt
handleAnalyzeCodebase -> returns analysis_prompt

// Step 2: Process AI response
handleProcessCodebaseAnalysis -> validates and processes AI results
```

**Usage**: This pattern ensures optimal AI interaction by separating data collection from AI processing.

### Storage API Pattern (Confidence: 85%)
Async storage operations with initialization checks and error handling

**Found in**: src/core/storage.ts, src/core/storage-manager.ts

```typescript
await storage.saveFeatureFromAI(feature_name, tasks, parseResult)
```

**Usage**: All storage operations are async and include proper initialization validation.

## Testing Patterns

### Vitest Test Structure (Confidence: 90%)
Comprehensive test suites with setup/teardown and mock data

**Found in**: test/ai-tools.test.ts

```typescript
describe('AI-Leveraged Tools', () => {
  beforeEach(async () => {
    // Setup test environment
  });
  
  afterEach(async () => {
    // Cleanup test artifacts
  });
});
```

**Usage**: All test files follow this structure for reliable, isolated testing.

### Schema Validation Testing (Confidence: 85%)
Testing AI schema validation with both valid and invalid inputs

**Found in**: test/ai-tools.test.ts

```typescript
expect(AIContextFilesSchema.safeParse(mockData).success).toBe(true)
```

**Usage**: Schema validation is thoroughly tested with both positive and negative test cases.

## Naming Conventions

### File Naming: kebab-case
- `ai-server-tools.ts`
- `storage-manager.ts`
- `ai-tools.test.ts`

### Variable Naming: camelCase
- `projectRoot`
- `analysisDepth`
- `validatedAnalysis`

### Function Naming: camelCase
- `handleAnalyzeCodebase`
- `createInitializedStorage`
- `updateContextFilesFromAI`

## Architecture Patterns

### Modular Organization
Code is organized by feature and layer:
- Core business logic in `src/core/`
- Type definitions in `src/types/`
- Tool implementations in dedicated files
- Clear separation of concerns

### AI-Leveraged Design
- Two-step AI interaction pattern
- Schema-driven validation
- Complete AI content generation
- No template pollution

## 🎯 Pattern Usage Guidelines

1. **Always use Zod schemas** for data validation
2. **Follow MCP error response format** for consistent error handling
3. **Implement two-step AI pattern** for complex AI interactions
4. **Use async/await** for all I/O operations
5. **Include comprehensive error handling** with meaningful messages
6. **Follow naming conventions** for consistency
7. **Write tests** for all new patterns and functionality
8. **Maintain high test coverage** with both positive and negative test cases