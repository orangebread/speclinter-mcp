import { TaskGenerator } from './core/generator.js';
import { Storage } from './core/storage.js';
import { StorageManager } from './core/storage-manager.js';
import { TaskStatusSchema } from './types/index.js';
import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_CONFIG } from './types/config.js';

/**
 * Resolves the project root directory using multiple fallback strategies
 */
export async function resolveProjectRoot(explicitRoot?: string): Promise<string> {
  // 1. Use explicit parameter if provided
  if (explicitRoot) {
    return path.resolve(explicitRoot);
  }

  // 2. Check environment variable
  if (process.env.SPECLINTER_PROJECT_ROOT) {
    return path.resolve(process.env.SPECLINTER_PROJECT_ROOT);
  }

  // 3. Auto-detect by walking up from process.cwd()
  const detected = await findProjectRoot(process.cwd());
  if (detected) {
    return detected;
  }

  // 4. Fallback to process.cwd()
  return process.cwd();
}

/**
 * Walks up the directory tree looking for a .speclinter directory
 */
async function findProjectRoot(startDir: string): Promise<string | null> {
  let currentDir = path.resolve(startDir);
  const rootDir = path.parse(currentDir).root;

  while (currentDir !== rootDir) {
    try {
      const speclinterPath = path.join(currentDir, '.speclinter');
      await fs.access(speclinterPath);
      // Found .speclinter directory
      return currentDir;
    } catch {
      // .speclinter not found, go up one level
      currentDir = path.dirname(currentDir);
    }
  }

  return null;
}

// Tool handlers

export async function handleGetTaskStatus(args: any) {
  const { feature_name, project_root } = args;
  const rootDir = await resolveProjectRoot(project_root);
  const storage = await StorageManager.createInitializedStorage(rootDir);
  const status = await storage.getFeatureStatus(feature_name);
  return status;
}

export async function handleRunTests(args: any) {
  const { feature_name, task_id, project_root } = args;

  const rootDir = await resolveProjectRoot(project_root);
  const storage = await StorageManager.createInitializedStorage(rootDir);
  const generator = new TaskGenerator();

  // Run tests
  const results = await generator.runFeatureTests(feature_name, task_id, rootDir);

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



export async function handleUpdateTaskStatus(args: any) {
  const { feature_name, task_id, status, notes, project_root } = args;

  // Validate status
  const validStatus = TaskStatusSchema.parse(status);

  const rootDir = await resolveProjectRoot(project_root);
  const storage = await StorageManager.createInitializedStorage(rootDir);

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

  const root = await resolveProjectRoot(project_root);
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


