#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

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

async function validateFeatureImplementation(feature: string): Promise<void> {
  const spinner = ora(`Validating implementation for ${feature}...`).start();

  try {
    console.log(chalk.yellow('\n🤖 AI-powered validation requires an AI assistant.'));
    console.log(chalk.gray('Please use the MCP tools through your AI IDE:'));
    console.log(chalk.blue('  1. "Prepare validation for feature: ' + feature + '"'));
    console.log(chalk.blue('  2. AI will analyze the implementation'));
    console.log(chalk.blue('  3. "Process the validation results"'));
    console.log(chalk.gray('\nOr use the direct MCP tools:'));
    console.log(chalk.blue('  • speclinter_validate_implementation_prepare'));
    console.log(chalk.blue('  • speclinter_validate_implementation_process'));

    spinner.info('Validation requires AI analysis');

    // For now, show basic status information
    const { StorageManager } = await import('./core/storage-manager.js');
    const storage = await StorageManager.createInitializedStorage();
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
  }
}

async function showFeatureStatus(feature: string): Promise<void> {
  try {
    const { StorageManager } = await import('./core/storage-manager.js');
    const storage = await StorageManager.createInitializedStorage();

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

program.parse();
