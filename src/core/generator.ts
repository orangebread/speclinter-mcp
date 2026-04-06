import { Task, TestResult } from '../types/index.js';
import { StorageManager } from './storage-manager.js';

export class TaskGenerator {
  async createTasks(parseResult: any, featureName: string): Promise<Task[]> {
    // Tasks are already created in parseResult, just need to set feature name
    return parseResult.tasks.map((task: Task) => ({
      ...task,
      featureName
    }));
  }

  async runFeatureTests(featureName: string, taskId?: string, projectRoot?: string): Promise<TestResult> {
    void taskId;
    void projectRoot;

    return {
      passed: 0,
      failed: 1,
      skipped: 0,
      coverage: 0,
      details: [{
        scenario: featureName,
        status: 'failed',
        error: 'runFeatureTests is deprecated. Generated Gherkin scenarios are not directly executable in this package. Use speclinter_validate_implementation for validation workflows.'
      }]
    };
  }

  async updateActiveFile(featureName: string): Promise<void> {
    // This is handled by Storage class
    const { StorageManager } = await import('./storage-manager.js');
    const storage = await StorageManager.createInitializedStorage();
    await storage.updateActiveFile(featureName);
  }
}
