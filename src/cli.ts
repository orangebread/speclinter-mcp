#!/usr/bin/env node
import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { DEFAULT_CONFIG } from './types/config.js';

const program = new Command();

program
  .name('speclinter')
  .description('Turn specs into structured tasks with built-in quality gates')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize SpecLinter in the current project')
  .action(async () => {
    await initializeProject();
  });

program
  .command('serve')
  .description('Start the MCP server')
  .action(async () => {
    const { startServer } = await import('./server.js');
    await startServer();
  });

program
  .command('test <feature>')
  .description('Run tests for a specific feature')
  .action(async (feature) => {
    await runFeatureTests(feature);
  });

program
  .command('status <feature>')
  .description('Show status of a feature')
  .action(async (feature) => {
    await showFeatureStatus(feature);
  });

async function initializeProject(): Promise<void> {
  const root = process.cwd();
  const speclinterDir = path.join(root, '.speclinter');
  
  // Check if already initialized
  try {
    await fs.access(speclinterDir);
    console.log(chalk.yellow('SpecLinter already initialized!'));
    
    const answer = await confirm('Reinitialize? This will keep your existing data.');
    if (!answer) return;
  } catch {
    // Directory doesn't exist, proceed with initialization
  }
  
  const spinner = ora('Initializing SpecLinter...').start();
  
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
      spinner.text = `Created ${dir}/`;
    }
    
    // Create default config
    const configPath = path.join(speclinterDir, 'config.json');
    await fs.writeFile(
      configPath, 
      JSON.stringify(DEFAULT_CONFIG, null, 2)
    );
    spinner.text = 'Created config.json';
    
    // Create context templates
    await createContextTemplates(path.join(speclinterDir, 'context'));
    spinner.text = 'Created context templates';
    
    // Create .gitignore for speclinter
    const gitignorePath = path.join(speclinterDir, '.gitignore');
    await fs.writeFile(gitignorePath, 'cache/\n*.db\n*.db-journal\n');

    // Initialize database and create tables
    spinner.text = 'Creating database...';
    const { Storage } = await import('./core/storage.js');
    const storage = new Storage(root);
    await storage.initialize();
    spinner.text = 'Database initialized';

    spinner.succeed('SpecLinter initialized successfully!');
    
    console.log(chalk.green('\n✨ Setup complete! Next steps:'));
    console.log(chalk.blue('  1. Edit .speclinter/context/project.md with your stack'));
    console.log(chalk.blue('  2. Add patterns to .speclinter/context/patterns.md'));
    console.log(chalk.blue('  3. Configure your AI IDE to use SpecLinter MCP'));
    console.log(chalk.gray('\n  Example MCP config:'));
    console.log(chalk.gray('  {'));
    console.log(chalk.gray('    "speclinter": {'));
    console.log(chalk.gray('      "command": "speclinter",'));
    console.log(chalk.gray('      "args": ["serve"]'));
    console.log(chalk.gray('    }'));
    console.log(chalk.gray('  }'));
    
  } catch (error) {
    spinner.fail('Failed to initialize SpecLinter');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

async function createContextTemplates(contextDir: string): Promise<void> {
  // Project template
  const projectTemplate = `# Project Context

## Stack
- **Language**: [e.g., TypeScript/Node.js]
- **API**: [e.g., REST with Express]
- **Database**: [e.g., PostgreSQL]
- **Testing**: [e.g., Jest]

## Constraints
- Response time: <200ms for API calls
- Deployment: [Platform and budget]
- Team size: [Number of developers]
- Timeline: [MVP deadline]

## Standards
- All inputs validated with [validation library]
- Error handling pattern: [describe]
- Test coverage minimum: [percentage]
- Code style: [ESLint config]

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

## API Endpoint Pattern
\`\`\`typescript
// Schema validation with Zod
const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email()
});

// Handler structure
export async function handleRequest(req: Request): Promise<Response> {
  // 1. Validate input
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  // 2. Business logic
  const result = await businessLogic(parsed.data);
  if (!result.success) {
    return Response.json({ error: result.error }, { status: 500 });
  }

  // 3. Return success
  return Response.json({ data: result.data });
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

async function runFeatureTests(feature: string): Promise<void> {
  const spinner = ora(`Running tests for ${feature}...`).start();

  try {
    const { TaskGenerator } = await import('./core/generator.js');
    const generator = new TaskGenerator();

    const results = await generator.runFeatureTests(feature);

    spinner.succeed('Tests completed');

    console.log(chalk.green(`\n📊 Test Results for ${feature}:`));
    console.log(chalk.green(`  ✅ Passed: ${results.passed}`));
    console.log(chalk.red(`  ❌ Failed: ${results.failed}`));
    console.log(chalk.yellow(`  ⏭️  Skipped: ${results.skipped}`));
    console.log(chalk.blue(`  📈 Coverage: ${results.coverage}%`));

    if (results.details.length > 0) {
      console.log(chalk.gray('\n📋 Details:'));
      for (const detail of results.details) {
        const statusIcon = detail.status === 'passed' ? '✅' : '❌';
        console.log(chalk.gray(`  ${statusIcon} ${detail.scenario}`));
        if (detail.error) {
          console.log(chalk.red(`    Error: ${detail.error}`));
        }
      }
    }

  } catch (error) {
    spinner.fail('Test execution failed');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
  }
}

async function showFeatureStatus(feature: string): Promise<void> {
  try {
    const { Storage } = await import('./core/storage.js');
    const storage = new Storage();
    await storage.initialize();

    const status = await storage.getFeatureStatus(feature);

    console.log(chalk.green(`\n📊 Status for ${feature}:`));
    console.log(chalk.blue(`  📝 Total Tasks: ${status.totalTasks}`));
    console.log(chalk.green(`  ✅ Completed: ${status.completedTasks}`));
    console.log(chalk.yellow(`  🔄 In Progress: ${status.inProgressTasks}`));
    console.log(chalk.red(`  🚫 Blocked: ${status.blockedTasks}`));
    console.log(chalk.gray(`  📅 Last Updated: ${status.lastUpdated}`));

    const progress = status.totalTasks > 0
      ? Math.round((status.completedTasks / status.totalTasks) * 100)
      : 0;
    console.log(chalk.blue(`  📈 Progress: ${progress}%`));

  } catch (error) {
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
  }
}

async function confirm(message: string): Promise<boolean> {
  console.log(chalk.yellow(`\n${message} (y/N)`));

  return new Promise((resolve) => {
    process.stdin.once('data', (data) => {
      const answer = data.toString().trim().toLowerCase();
      resolve(answer === 'y' || answer === 'yes');
    });
  });
}

program.parse();
