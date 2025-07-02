import { Task, TestResult } from '../types/index.js';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TaskGenerator {
  async createTasks(parseResult: any, featureName: string): Promise<Task[]> {
    // Tasks are already created in parseResult, just need to set feature name
    return parseResult.tasks.map((task: Task) => ({
      ...task,
      featureName
    }));
  }

  async runFeatureTests(featureName: string, taskId?: string, projectRoot?: string): Promise<TestResult> {
    const rootDir = projectRoot || process.cwd();
    const featureDir = path.join(rootDir, 'tasks', featureName);
    const gherkinDir = path.join(featureDir, 'gherkin');

    try {
      // Check if gherkin files exist
      const gherkinFiles = await fs.readdir(gherkinDir);
      const featureFiles = gherkinFiles.filter(f => f.endsWith('.feature'));

      if (featureFiles.length === 0) {
        return {
          passed: 0,
          failed: 0,
          skipped: 0,
          coverage: 0,
          details: []
        };
      }

      // Run tests using vitest with cucumber
      const testCommand = taskId
        ? `npx vitest --run --reporter=json --testNamePattern="${taskId}"`
        : `npx vitest --run --reporter=json --testPathPattern="${featureName}"`;

      try {
        const { stdout } = await execAsync(testCommand, {
          cwd: process.cwd(),
          timeout: 30000
        });

        const results = JSON.parse(stdout);

        return {
          passed: results.numPassedTests || 0,
          failed: results.numFailedTests || 0,
          skipped: results.numPendingTests || 0,
          coverage: 0, // Would need coverage tool
          details: results.testResults?.map((tr: any) => ({
            scenario: tr.title || 'Unknown',
            status: tr.status || 'unknown',
            error: tr.failureMessage
          })) || []
        };
      } catch (execError: any) {
        // Tests failed, but we can still parse results
        if (execError.stdout) {
          try {
            const results = JSON.parse(execError.stdout);
            return {
              passed: results.numPassedTests || 0,
              failed: results.numFailedTests || 0,
              skipped: results.numPendingTests || 0,
              coverage: 0,
              details: results.testResults?.map((tr: any) => ({
                scenario: tr.title || 'Unknown',
                status: 'failed',
                error: tr.failureMessage
              })) || []
            };
          } catch {
            // Fallback if JSON parsing fails
          }
        }

        return {
          passed: 0,
          failed: 1,
          skipped: 0,
          coverage: 0,
          details: [{
            scenario: 'Test execution',
            status: 'failed',
            error: execError.message
          }]
        };
      }
    } catch (error) {
      return {
        passed: 0,
        failed: 1,
        skipped: 0,
        coverage: 0,
        details: [{
          scenario: 'Test setup',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }]
      };
    }
  }

  async updateActiveFile(featureName: string): Promise<void> {
    // This is handled by Storage class
    const { StorageManager } = await import('./storage-manager.js');
    const storage = await StorageManager.createInitializedStorage();
    await storage.updateActiveFile(featureName);
  }
}
