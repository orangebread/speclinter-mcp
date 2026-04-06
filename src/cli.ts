#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Storage } from './core/storage.js';
import { validateProjectContext } from './utils/validation.js';
import { resolveProjectRoot } from './tools.js';

const program = new Command();

program
  .name('speclinter')
  .description('Turn specs into structured tasks with built-in quality gates')
  .version('0.1.0');

program
  .command('serve')
  .description('Start the MCP server')
  .action(async () => {
    const { startServer } = await import('./server.js');
    await startServer();
  });

program
  .command('init')
  .description('Initialize SpecLinter in the current directory')
  .action(async () => {
    await initializeSpecLinter();
  });

program
  .command('validate <feature>')
  .description('Validate implementation of a specific feature using AI analysis')
  .action(async (feature) => {
    await validateFeatureImplementation(feature);
  });

program
  .command('status <feature>')
  .description('Show status of a feature')
  .action(async (feature) => {
    await showFeatureStatus(feature);
  });

async function initializeSpecLinter(): Promise<void> {
  const spinner = ora('Initializing SpecLinter...').start();

  try {
    const { handleInitProject } = await import('./tools.js');

    // Initialize SpecLinter in current directory
    const result = await handleInitProject({
      project_root: process.cwd()
    });

    if (!result.success) {
      throw new Error(result.message);
    }

    spinner.succeed('SpecLinter initialized successfully!');

    console.log(chalk.green('\n🎉 SpecLinter is ready to use!'));
    console.log(chalk.blue('📁 Created directories:'));
    console.log(chalk.gray('  • .speclinter/ - Configuration and context'));
    console.log(chalk.gray('  • speclinter-tasks/ - Feature tasks and specifications'));
    console.log(chalk.blue('\n🚀 Next steps:'));
    console.log(chalk.yellow('  1. Connect to your AI IDE using MCP configuration'));
    console.log(chalk.yellow('  2. Try: "Initialize SpecLinter and parse this spec: Create a user login form"'));

  } catch (error) {
    spinner.fail('Failed to initialize SpecLinter');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

async function createCliStorage(): Promise<Storage> {
  const projectRoot = await resolveProjectRoot(process.cwd());
  const validation = await validateProjectContext(projectRoot);

  if (!validation.success || !validation.rootDir) {
    throw new Error(validation.error ?? 'SpecLinter is not initialized in this project');
  }

  const storage = new Storage(validation.rootDir);
  await storage.initialize();
  return storage;
}

async function validateFeatureImplementation(feature: string): Promise<void> {
  const spinner = ora(`Validating implementation for ${feature}...`).start();

  try {
    console.log(chalk.yellow('\n🤖 AI-powered validation requires an AI assistant.'));
    console.log(chalk.gray('Please use the MCP tools through your AI IDE:'));
    console.log(chalk.blue(`  1. "Validate implementation for feature: ${feature}"`));
    console.log(chalk.blue('  2. If AI analysis is needed, your assistant will handle the follow-up automatically'));
    console.log(chalk.gray('\nOr use the direct MCP tools:'));
    console.log(chalk.blue('  • speclinter_validate_implementation'));

    spinner.info('Validation requires AI analysis');

    // Show current status information without mutating project state
    const storage = await createCliStorage();
    const status = await storage.getFeatureStatus(feature);

    console.log(chalk.green(`\n📊 Current Status for ${feature}:`));
    console.log(chalk.blue(`  📝 Total Tasks: ${status.totalTasks}`));
    console.log(chalk.green(`  ✅ Completed: ${status.completedTasks}`));
    console.log(chalk.yellow(`  🔄 In Progress: ${status.inProgressTasks}`));
    console.log(chalk.red(`  🚫 Blocked: ${status.blockedTasks}`));
    console.log(chalk.gray(`  📅 Last Updated: ${status.lastUpdated}`));

    const progress = status.totalTasks > 0
      ? Math.round((status.completedTasks / status.totalTasks) * 100)
      : 0;
    console.log(chalk.blue(`  📈 Progress: ${progress}%`));

    // Check if validation results exist
    const validationResults = await storage.getValidationResults(feature);
    if (validationResults) {
      console.log(chalk.green(`\n🔍 Last AI Validation:`));
      console.log(chalk.blue(`  Status: ${validationResults.overallStatus}`));
      console.log(chalk.blue(`  Quality Score: ${validationResults.qualityScore}/100`));
      console.log(chalk.blue(`  Completion: ${validationResults.completionPercentage}%`));
      console.log(chalk.gray(`  Validated: ${new Date(validationResults.created_at).toLocaleString()}`));
    } else {
      console.log(chalk.yellow('\n💡 No AI validation results found. Use the MCP tools for comprehensive analysis.'));
    }

  } catch (error) {
    spinner.fail('Validation check failed');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exitCode = 1;
  }
}

async function showFeatureStatus(feature: string): Promise<void> {
  try {
    const storage = await createCliStorage();

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
    process.exitCode = 1;
  }
}

program.parse();
