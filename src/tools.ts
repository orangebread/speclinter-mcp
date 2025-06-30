import { SpecParser } from './core/parser.js';
import { TaskGenerator } from './core/generator.js';
import { Storage } from './core/storage.js';
import { StorageManager } from './core/storage-manager.js';
import { TaskStatusSchema } from './types/index.js';
import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_CONFIG } from './types/config.js';

// Tool handlers
export async function handleParseSpec(args: any) {
  const {
    spec,
    feature_name,
    context,
    project_root,
    deduplication_strategy = 'prompt',
    similarity_threshold,
    skip_similarity_check = false
  } = args;

  // Initialize components - use provided project_root or current working directory
  const rootDir = project_root || process.cwd();
  const storage = await StorageManager.createInitializedStorage(rootDir);

  // Get config through a proper method
  const config = await storage.getConfig();
  const parser = new SpecParser(config);
  const generator = new TaskGenerator();

  // Load project context if available
  const projectContext = await storage.loadProjectContext();

  // Parse and grade the spec
  const result = await parser.parse(spec, context, projectContext);

  // Generate tasks
  const tasks = await generator.createTasks(result, feature_name);

  // Save with deduplication options
  const saveResult = await storage.saveFeature(feature_name, tasks, result, {
    onSimilarFound: deduplication_strategy,
    similarityThreshold: similarity_threshold,
    skipSimilarityCheck: skip_similarity_check
  });

  // Handle deduplication results
  if (saveResult.duplicateInfo) {
    return {
      feature_name,
      grade: result.grade,
      score: result.score,
      duplicate_detected: true,
      duplicate_info: saveResult.duplicateInfo,
      recommended_action: saveResult.duplicateInfo.recommendedAction,
      similar_features: saveResult.duplicateInfo.similarFeatures,
      existing_feature: saveResult.duplicateInfo.existingFeature,
      files_created: saveResult.files,
      merge_result: saveResult.mergeResult,
      message: saveResult.duplicateInfo.type === 'exact_match'
        ? `Feature '${feature_name}' already exists. Choose an action: merge, replace, or skip.`
        : `Found ${saveResult.duplicateInfo.similarFeatures.length} similar feature(s). Review and choose an action.`
    };
  }

  // Normal response for unique features
  return {
    feature_name,
    grade: result.grade,
    score: result.score,
    tasks: tasks.map(t => ({ ...t })),
    files_created: saveResult.files,
    merge_result: saveResult.mergeResult,
    next_steps: `Run tests with: speclinter test ${feature_name}`
  };
}

export async function handleGetTaskStatus(args: any) {
  const { feature_name } = args;
  const storage = await StorageManager.createInitializedStorage();
  const status = await storage.getFeatureStatus(feature_name);
  return status;
}

export async function handleRunTests(args: any) {
  const { feature_name, task_id } = args;

  const storage = await StorageManager.createInitializedStorage();
  const generator = new TaskGenerator();

  // Run tests
  const results = await generator.runFeatureTests(feature_name, task_id);

  // Update status based on results
  await storage.updateTestResults(feature_name, results);

  return {
    feature: feature_name,
    passed: results.passed,
    failed: results.failed,
    skipped: results.skipped,
    coverage: results.coverage,
    details: results.details
  };
}

export async function handleFindSimilar(args: any) {
  const { spec, threshold = 0.8 } = args;
  const storage = await StorageManager.createInitializedStorage();
  const similar = await storage.findSimilar(spec, threshold);

  return similar.map(s => ({
    feature_name: s.featureName,
    similarity: s.score,
    summary: s.summary,
    task_count: s.taskCount,
    status: s.status
  }));
}

export async function handleUpdateTaskStatus(args: any) {
  const { feature_name, task_id, status, notes } = args;

  // Validate status
  const validStatus = TaskStatusSchema.parse(status);

  const storage = await StorageManager.createInitializedStorage();

  // Update task status
  const updatedTask = await storage.updateTaskStatus(
    feature_name,
    task_id,
    validStatus,
    notes
  );

  // Update active file
  await storage.updateActiveFile(feature_name);

  return {
    task_id: updatedTask.id,
    feature_name: updatedTask.featureName,
    status: updatedTask.status,
    title: updatedTask.title,
    updated: true
  };
}

export async function handleInitProject(args: any) {
  const { project_root, force_reinit = false } = args;

  const root = project_root || process.cwd();
  const speclinterDir = path.join(root, '.speclinter');

  // Check if already initialized
  try {
    await fs.access(speclinterDir);
    if (!force_reinit) {
      return {
        success: false,
        message: 'SpecLinter already initialized in this directory. Use force_reinit: true to reinitialize.',
        project_root: root
      };
    }
  } catch {
    // Directory doesn't exist, proceed with initialization
  }

  try {
    // Create directory structure
    const directories = [
      '.speclinter',
      '.speclinter/context',
      '.speclinter/cache',
      'tasks'
    ];

    for (const dir of directories) {
      const dirPath = path.join(root, dir);
      await fs.mkdir(dirPath, { recursive: true });
    }

    // Create default config
    const configPath = path.join(speclinterDir, 'config.json');
    await fs.writeFile(
      configPath,
      JSON.stringify(DEFAULT_CONFIG, null, 2)
    );

    // Create context templates
    await createContextTemplates(path.join(speclinterDir, 'context'));

    // Create .gitignore for speclinter
    const gitignorePath = path.join(speclinterDir, '.gitignore');
    await fs.writeFile(gitignorePath, 'cache/\n*.db\n*.db-journal\n');

    // Initialize database and create tables
    const storage = new Storage(root);
    await storage.initialize();

    return {
      success: true,
      message: 'SpecLinter initialized successfully!',
      project_root: root,
      directories_created: directories,
      next_steps: [
        'Edit .speclinter/context/project.md with your stack',
        'Add patterns to .speclinter/context/patterns.md',
        'Start using SpecLinter tools to parse specifications'
      ]
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to initialize SpecLinter: ${error instanceof Error ? error.message : 'Unknown error'}`,
      project_root: root
    };
  }
}

async function createContextTemplates(contextDir: string): Promise<void> {
  // Project template
  const projectTemplate = `# Project Context

## Stack
- **Frontend**: [React/Vue/Angular/etc]
- **Backend**: [Node.js/Python/Go/etc]
- **Database**: [PostgreSQL/MongoDB/etc]
- **Infrastructure**: [AWS/GCP/Azure/Docker/etc]
- **Testing**: [Jest/Vitest/Cypress/etc]

## Constraints
- Performance requirements
- Security considerations
- Browser/platform support
- Budget limitations
- Timeline constraints

## Standards
- Code style guide
- Testing requirements
- Documentation standards
- Review process
- Deployment procedures

## Key Decisions
- Architecture: [Monolith/Microservices/Serverless]
- Database strategy: [SQL/NoSQL and why]
- Authentication: [Strategy]
- State management: [Client/Server approach]
`;

  await fs.writeFile(
    path.join(contextDir, 'project.md'),
    projectTemplate
  );

  // Patterns template
  const patternsTemplate = `# Code Patterns

## Error Handling Pattern
\`\`\`typescript
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
\`\`\`

## API Response Pattern
\`\`\`typescript
interface ApiResponse<T> {
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    total?: number;
    timestamp: string;
  };
}
\`\`\`

## Component Pattern
\`\`\`typescript
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
\`\`\`

## Add your project-specific patterns below...
`;

  await fs.writeFile(
    path.join(contextDir, 'patterns.md'),
    patternsTemplate
  );

  // Architecture template
  const architectureTemplate = `# Architecture Decisions

## Overview
[Describe your system architecture]

## Key Design Decisions

### 1. [Decision Name]
**Context**: Why this decision was needed
**Decision**: What was decided
**Consequences**: Trade-offs and implications
**Alternatives Considered**: Other options evaluated

### 2. Database Strategy
**Context**: Need for data persistence
**Decision**: [Your choice]
**Consequences**:
- ✅ [Positive outcomes]
- ❌ [Trade-offs]
**Alternatives Considered**: [What else you evaluated]

## System Boundaries
\`\`\`
[ASCII or Mermaid diagram of your architecture]
\`\`\`

## Data Flow
1. [Step 1]
2. [Step 2]
3. [Step 3]
`;

  await fs.writeFile(
    path.join(contextDir, 'architecture.md'),
    architectureTemplate
  );
}
