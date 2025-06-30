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
    const storage = new Storage(process.cwd());
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

program.parse();
