# Discovered Code Patterns

## Error Handling Patterns

### Try-Catch Error Handling
Standard try-catch error handling pattern

```typescript
try {
    const { TaskGenerator } = await import('./core/generator.js');
    const generator = new TaskGenerator();

    const results = await generator.runFeatureTests(feature);

    spinner.succeed(...
```

### Result Type Pattern
Functional error handling with Result types

```typescript
Result<') || content.includes('{ success:')) {
          patterns.push({
            name: 'Result Type Pattern',
            description: 'Functional error handling with Result types',
            ex...
```

### Promise Error Handling
Promise-based error handling

```typescript
.catch(')
```

## API Patterns

### Express Route Handler
Express.js route definition pattern

```typescript
app.get(') || content.includes('router.')) {
          patterns.push({
            name: 'Express Route Handler',
            description: 'Express.js route definition pattern',
            example: t...
```

### JSON API Response
Standard JSON API response pattern

```typescript
res.json(')
```

### HTTP Client Pattern
HTTP client request pattern

```typescript
axios.')) {
          patterns.push({
            name: 'HTTP Client Pattern',
            description: 'HTTP client request pattern',
            example: this.extractCodeExample(content, /(?:fetch|a...
```

## Testing Patterns
*No patterns detected*

---

# Manual Patterns

# Code Patterns

## Error Handling Pattern
```typescript
// Always return Result<T> type, never throw
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function doSomething(): Promise<Result<Data>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## API Response Pattern
```typescript
interface ApiResponse<T> {
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    total?: number;
    timestamp: string;
  };
}
```

## Component Pattern
```typescript
// Always use this component structure
interface Props {
  // Define props here
}

export function Component({ }: Props) {
  // Component logic
  return (
    // JSX here
  );
}
```

## Add your project-specific patterns below...
