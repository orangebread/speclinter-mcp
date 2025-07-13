import { promises as fs } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import Handlebars from 'handlebars'; // Still needed for task file generation
import { Config, ConfigSchema } from '../types/config.js';
import {
  Task,
  FeatureStatus,
  ParseResult,
  ProjectContext,
  SimilarFeature,
  TestResult,
  TaskStatus,
  DuplicateInfo,
  MergeResult,
  SaveFeatureOptions,
  SaveFeatureResult,
  ExistingFeature
} from '../types/index.js';

export class Storage {
  private db: Database.Database | null = null;
  private config: Config | null = null;
  private rootDir: string;
  private speclinterDir: string;
  private tasksDir: string;
  private initialized: boolean = false;

  constructor(rootDir?: string) {
    this.rootDir = rootDir || process.cwd();
    this.speclinterDir = path.join(this.rootDir, '.speclinter');
    this.tasksDir = ''; // Will be set after config is loaded
  }

  async initialize(): Promise<void> {
    // Check if speclinter is initialized
    try {
      await fs.access(this.speclinterDir);
    } catch {
      throw new Error(
        'SpecLinter not initialized. Run "speclinter init" in your project root first.'
      );
    }

    // Load and validate config
    const configPath = path.join(this.speclinterDir, 'config.json');
    const configContent = await fs.readFile(configPath, 'utf-8');
    const configData = JSON.parse(configContent);
    this.config = ConfigSchema.parse(configData);

    // Set tasks directory from config
    this.tasksDir = path.join(this.rootDir, this.config.storage.tasksDir);

    // Initialize database
    const dbPath = path.join(this.rootDir, this.config.storage.dbPath);
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);

    // Create tables
    this.createTables();

    this.initialized = true;
  }

  async getConfig(): Promise<Config> {
    if (!this.config) throw new Error('Storage not initialized');
    return this.config;
  }

  private createTables(): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS features (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        spec TEXT NOT NULL,
        grade TEXT NOT NULL,
        score INTEGER NOT NULL,
        embedding BLOB,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        feature_name TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        title TEXT NOT NULL,
        slug TEXT NOT NULL,
        summary TEXT NOT NULL,
        implementation TEXT NOT NULL,
        status TEXT NOT NULL,
        acceptance_criteria TEXT NOT NULL,
        test_file TEXT NOT NULL,
        coverage_target TEXT NOT NULL,
        notes TEXT NOT NULL,
        dependencies TEXT,
        blocks TEXT,
        relevant_patterns TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feature_name) REFERENCES features(name)
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_name TEXT NOT NULL,
        task_id TEXT,
        passed INTEGER NOT NULL,
        failed INTEGER NOT NULL,
        skipped INTEGER NOT NULL,
        coverage REAL NOT NULL,
        details TEXT NOT NULL,
        run_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feature_name) REFERENCES features(name)
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS validation_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_name TEXT NOT NULL,
        overall_status TEXT NOT NULL,
        completion_percentage REAL NOT NULL,
        quality_score REAL NOT NULL,
        validation_data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feature_name) REFERENCES features(name)
      )
    `);
  }

  async loadProjectContext(): Promise<ProjectContext | null> {
    if (!this.config) throw new Error('Storage not initialized');

    // AI-generated context files are self-contained and don't need parsing
    // Return null to indicate no legacy template-based context available
    // AI tools will read the files directly when needed
    return null;
  }

  // Legacy template parsing methods removed - AI generates self-contained context files

  async saveFeature(
    featureName: string,
    tasks: Task[],
    parseResult: ParseResult,
    options: SaveFeatureOptions = {}
  ): Promise<SaveFeatureResult> {
    if (!this.db || !this.config) throw new Error('Storage not initialized');

    // Check for existing feature with exact name
    const existingFeature = this.getExistingFeature(featureName);

    // Check for similar features if not skipping and deduplication is enabled
    if (!options.skipSimilarityCheck && this.config.deduplication.enabled) {
      const threshold = options.similarityThreshold ?? this.config.deduplication.similarityThreshold;
      const similarFeatures = await this.findSimilar(parseResult.spec, threshold);

      if (similarFeatures.length > 0 || existingFeature) {
        const duplicateInfo: DuplicateInfo = {
          type: existingFeature ? 'exact_match' : 'similar_features',
          existingFeature,
          similarFeatures,
          recommendedAction: this.getRecommendedAction(similarFeatures, existingFeature)
        };

        // Handle based on strategy
        const strategy = options.onSimilarFound ?? this.config.deduplication.defaultStrategy;

        switch (strategy) {
          case 'skip':
            return { files: [], duplicateInfo };
          case 'merge':
            return await this.mergeWithExisting(featureName, tasks, parseResult, duplicateInfo);
          case 'replace':
            // Continue with normal save (INSERT OR REPLACE handles this)
            break;
          case 'prompt':
          default:
            return { files: [], duplicateInfo }; // Let caller handle the decision
        }
      }
    }

    // Continue with normal save using internal method
    const files = await this.saveFeatureInternal(featureName, tasks, parseResult);
    return { files };
  }

  // Legacy method for backward compatibility
  async saveFeatureLegacy(
    featureName: string,
    tasks: Task[],
    parseResult: ParseResult
  ): Promise<string[]> {
    const result = await this.saveFeature(featureName, tasks, parseResult, {
      skipSimilarityCheck: true
    });
    return result.files;
  }

  private async writeTaskFile(
    filePath: string,
    task: Task,
    featureName: string
  ): Promise<void> {
    const template = `# Task: {{title}}

**ID**: {{id}}
**Status**: {{statusEmoji}} {{status}}
**Feature**: {{featureName}}
{{#if dependencies}}
**Dependencies**: {{dependencies}}
{{/if}}
{{#if blocks}}
**Blocks**: {{blocks}}
{{/if}}

## Summary
{{summary}}

## Implementation Details
{{implementation}}

{{#if relevantPatterns}}
## Patterns to Follow
{{#each relevantPatterns}}
- {{name}}: See \`.speclinter/context/patterns.md#{{anchor}}\`
{{/each}}
{{/if}}

## Acceptance Criteria
{{#each acceptanceCriteria}}
- [ ] {{this}}
{{/each}}

## Test Coverage
- **Gherkin**: \`gherkin/{{testFile}}\`
- **Target**: {{coverageTarget}}

## Implementation Notes
{{notes}}

---
*Generated by SpecLinter - Do not edit header metadata directly*`;

    const compiled = Handlebars.compile(template);

    const content = compiled({
      ...task,
      featureName,
      dependencies: task.dependencies?.join(', '),
      blocks: task.blocks?.join(', ')
    });

    await fs.writeFile(filePath, content);
  }

  private async writeGherkinFile(filePath: string, task: Task, featureName?: string): Promise<void> {
    // Try to use AI-powered Gherkin generation first
    try {
      const aiGherkinContent = await this.generateAIGherkinScenarios(task, featureName);
      if (aiGherkinContent) {
        await fs.writeFile(filePath, aiGherkinContent);
        return;
      }
    } catch (error) {
      // Fall back to improved template if AI generation fails
      console.warn('AI Gherkin generation failed, using improved template:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Improved fallback template with more specific scenarios
    const gherkin = this.generateImprovedGherkinTemplate(task);
    await fs.writeFile(filePath, gherkin);
  }

  private async generateAIGherkinScenarios(task: Task, featureName?: string): Promise<string | null> {
    if (!featureName) return null;

    try {
      // Import AI tools dynamically to avoid circular dependencies
      const { handleGenerateGherkinPrepare, handleProcessGherkinAnalysis } = await import('../ai-tools.js');

      // Step 1: Prepare AI analysis
      const prepareResult = await handleGenerateGherkinPrepare({
        task,
        feature_name: featureName,
        project_root: this.rootDir
      });

      if (!prepareResult.success) {
        return null;
      }

      // For now, we'll use a simplified AI generation approach
      // In a full implementation, this would involve calling an AI service
      // For this implementation, we'll generate improved scenarios based on task data
      return this.generateContextAwareGherkin(task);

    } catch (error) {
      return null;
    }
  }

  private generateContextAwareGherkin(task: Task): string {
    const scenarios = [];

    // Generate happy path scenario
    scenarios.push(this.generateHappyPathScenario(task));

    // Generate error handling scenarios
    scenarios.push(this.generateErrorHandlingScenario(task));

    // Generate edge case scenarios if acceptance criteria suggest them
    if (task.acceptanceCriteria.length > 2) {
      scenarios.push(this.generateEdgeCaseScenario(task));
    }

    // Generate validation scenario if acceptance criteria mention validation
    const hasValidation = task.acceptanceCriteria.some(criteria =>
      criteria.toLowerCase().includes('valid') ||
      criteria.toLowerCase().includes('format') ||
      criteria.toLowerCase().includes('check')
    );

    if (hasValidation) {
      scenarios.push(this.generateValidationScenario(task));
    }

    return `Feature: ${task.title}
  ${task.summary}

${scenarios.join('\n\n')}

# Testing Notes:
# - Ensure all acceptance criteria are covered
# - Consider integration with existing system components
# - Test with realistic data and edge cases
# - Validate error handling and user feedback
`;
  }

  private generateHappyPathScenario(task: Task): string {
    const primaryCriteria = task.acceptanceCriteria[0] || 'functionality works correctly';

    return `  Scenario: Successfully ${task.title.toLowerCase()}
    Given the system is properly configured
    And all prerequisites are met
    When I ${this.extractUserAction(task.summary)}
    Then ${primaryCriteria.toLowerCase()}
    And the operation should complete successfully
    And appropriate feedback should be provided`;
  }

  private generateErrorHandlingScenario(task: Task): string {
    return `  Scenario: Handle errors during ${task.title.toLowerCase()}
    Given the system is available
    When I ${this.extractUserAction(task.summary)} with invalid data
    Then an appropriate error message should be displayed
    And the system should remain stable
    And the user should be guided on how to correct the issue`;
  }

  private generateEdgeCaseScenario(task: Task): string {
    return `  Scenario: Handle edge cases for ${task.title.toLowerCase()}
    Given the system is under normal operation
    When I ${this.extractUserAction(task.summary)} with boundary values
    Then the system should handle the edge case gracefully
    And appropriate validation should be applied
    And the result should be consistent with business rules`;
  }

  private generateValidationScenario(task: Task): string {
    return `  Scenario: Validate input for ${task.title.toLowerCase()}
    Given the system is ready to accept input
    When I provide invalid or malformed data
    Then input validation should be triggered
    And specific validation errors should be shown
    And the user should understand what needs to be corrected`;
  }

  private extractUserAction(summary: string): string {
    // Extract meaningful user action from task summary
    const actionWords = ['create', 'update', 'delete', 'add', 'remove', 'configure', 'setup', 'implement'];
    const lowerSummary = summary.toLowerCase();

    for (const action of actionWords) {
      if (lowerSummary.includes(action)) {
        return summary.replace(/^(implement|create|add|setup|configure)\s*/i, '').trim();
      }
    }

    return summary.toLowerCase();
  }

  private generateImprovedGherkinTemplate(task: Task): string {
    // Improved fallback template that's more specific than the original
    return `Feature: ${task.title}
  ${task.summary}

  Background:
    Given the application is running
    And the user has appropriate permissions

  Scenario: ${task.title} - Success case
    Given the system is in a valid state
    When I complete the ${task.title.toLowerCase()} process
    Then ${task.acceptanceCriteria[0] || 'the operation should succeed'}
    And the system should provide confirmation

  Scenario: ${task.title} - Error handling
    Given the system is available
    When an error occurs during ${task.title.toLowerCase()}
    Then the error should be handled gracefully
    And appropriate error messages should be displayed
    And the system should remain stable

  Scenario: ${task.title} - Input validation
    Given I am performing ${task.title.toLowerCase()}
    When I provide invalid input
    Then input validation should prevent the operation
    And clear validation messages should be shown
    And I should be guided to provide correct input
`;
  }

  async updateActiveFile(featureName: string): Promise<void> {
    const status = await this.getFeatureStatus(featureName);
    const tasks = await this.getFeatureTasks(featureName);

    const template = `# {{featureName}} - Active Status

**Overall Progress**: {{completedTasks}}/{{totalTasks}} tasks completed
**Status**: {{overallStatus}}
**Last Updated**: {{lastUpdated}}

## Tasks

{{#each tasks}}
### {{statusEmoji}} {{title}} ({{id}})
{{summary}}

{{#unless (eq status "completed")}}
**Next Steps**: {{implementation}}
{{/unless}}

{{/each}}

## Next Actions
{{#each nextActions}}
- {{this}}
{{/each}}`;

    Handlebars.registerHelper('eq', (a, b) => a === b);
    const compiled = Handlebars.compile(template);

    const nextActions = this.generateNextActions(tasks);
    const notStartedCount = status.totalTasks - status.completedTasks - status.inProgressTasks - status.blockedTasks;

    const content = compiled({
      ...status,
      notStartedCount,
      tasks: tasks.map(t => ({
        ...t,
        statusEmoji: this.getStatusEmoji(t.status)
      })),
      nextActions
    });

    const activeFile = path.join(this.tasksDir, featureName, '_active.md');
    await fs.writeFile(activeFile, content);
  }

  async getFeatureStatus(featureName: string): Promise<FeatureStatus> {
    if (!this.db) throw new Error('Database not initialized');

    const tasks = this.db.prepare(`
      SELECT status FROM tasks WHERE feature_name = ?
    `).all(featureName) as Array<{status: string}>;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;

    return {
      featureName,
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      overallStatus: this.calculateOverallStatus(tasks),
      lastUpdated: new Date().toISOString()
    };
  }

  private calculateOverallStatus(tasks: Array<{status: string}>): string {
    if (tasks.every(t => t.status === 'completed')) return 'completed';
    if (tasks.some(t => t.status === 'in_progress')) return 'in_progress';
    if (tasks.some(t => t.status === 'blocked')) return 'blocked';
    return 'not_started';
  }

  async updateTaskStatus(
    featureName: string,
    taskId: string,
    status: TaskStatus,
    notes?: string
  ): Promise<Task> {
    if (!this.db) throw new Error('Database not initialized');

    this.db.prepare(`
      UPDATE tasks
      SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND feature_name = ?
    `).run(status, notes || '', taskId, featureName);

    const task = this.db.prepare(`
      SELECT * FROM tasks WHERE id = ? AND feature_name = ?
    `).get(taskId, featureName) as any;

    if (!task) throw new Error(`Task ${taskId} not found`);

    return this.dbTaskToTask(task);
  }

  async updateTestResults(featureName: string, results: TestResult): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    this.db.prepare(`
      INSERT INTO test_results (feature_name, passed, failed, skipped, coverage, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      featureName,
      results.passed,
      results.failed,
      results.skipped,
      results.coverage,
      JSON.stringify(results.details)
    );
  }

  async findSimilar(spec: string, threshold: number = 0.8): Promise<SimilarFeature[]> {
    if (!this.db) throw new Error('Database not initialized');

    const features = this.db.prepare('SELECT * FROM features').all() as any[];

    return features
      .map(f => ({
        featureName: f.name,
        score: this.calculateSimilarity(spec, f.spec),
        summary: f.spec.substring(0, 100) + '...',
        taskCount: this.getTaskCount(f.name),
        status: 'active' // Simplified
      }))
      .filter(f => f.score >= threshold)
      .sort((a, b) => b.score - a.score);
  }

  async getAllFeatures(): Promise<Array<{name: string, spec: string}>> {
    if (!this.db) throw new Error('Database not initialized');

    const features = this.db.prepare('SELECT name, spec FROM features').all() as Array<{name: string, spec: string}>;
    return features;
  }

  async saveFeatureFromAI(
    featureName: string,
    tasks: Task[],
    parseResult: ParseResult,
    aiAnalysis: any,
    options: SaveFeatureOptions = {}
  ): Promise<SaveFeatureResult> {
    if (!this.db || !this.config) throw new Error('Storage not initialized');

    // For now, use the existing saveFeature method
    // In the future, we could store AI-specific metadata
    return await this.saveFeature(featureName, tasks, parseResult, options);
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Enhanced similarity calculation with multiple factors
    const wordSimilarity = this.calculateWordSimilarity(text1, text2);
    const lengthSimilarity = this.calculateLengthSimilarity(text1, text2);
    const structureSimilarity = this.calculateStructureSimilarity(text1, text2);

    // Weighted combination
    return (wordSimilarity * 0.6) + (lengthSimilarity * 0.2) + (structureSimilarity * 0.2);
  }

  private calculateWordSimilarity(text1: string, text2: string): number {
    // Original word-based similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateLengthSimilarity(text1: string, text2: string): number {
    const len1 = text1.length;
    const len2 = text2.length;
    const maxLen = Math.max(len1, len2);
    const minLen = Math.min(len1, len2);
    return maxLen > 0 ? minLen / maxLen : 1;
  }

  private calculateStructureSimilarity(text1: string, text2: string): number {
    // Check for similar structural elements
    const patterns = [
      /as a .+? i want/gi,
      /given .+? when .+? then/gi,
      /should .+/gi,
      /must .+/gi,
      /acceptance criteria/gi,
      /user story/gi
    ];

    let matches = 0;
    const total = patterns.length;

    for (const pattern of patterns) {
      const has1 = pattern.test(text1);
      const has2 = pattern.test(text2);
      if (has1 === has2) matches++;
    }

    return total > 0 ? matches / total : 0;
  }

  private getTaskCount(featureName: string): number {
    if (!this.db) return 0;

    const result = this.db.prepare(`
      SELECT COUNT(*) as count FROM tasks WHERE feature_name = ?
    `).get(featureName) as {count: number};

    return result.count;
  }

  async getFeatureTasks(featureName: string): Promise<Task[]> {
    if (!this.db) throw new Error('Database not initialized');

    const tasks = this.db.prepare(`
      SELECT * FROM tasks WHERE feature_name = ? ORDER BY sequence
    `).all(featureName) as any[];

    return tasks.map(this.dbTaskToTask);
  }

  private dbTaskToTask = (dbTask: any): Task => {
    return {
      id: dbTask.id,
      title: dbTask.title,
      summary: dbTask.summary,
      implementation: dbTask.implementation,
      status: dbTask.status,
      statusEmoji: this.getStatusEmoji(dbTask.status),
      featureName: dbTask.feature_name,
      slug: dbTask.slug,
      dependencies: JSON.parse(dbTask.dependencies || '[]'),
      blocks: JSON.parse(dbTask.blocks || '[]'),
      acceptanceCriteria: JSON.parse(dbTask.acceptance_criteria),
      testFile: dbTask.test_file,
      coverageTarget: dbTask.coverage_target,
      notes: dbTask.notes,
      relevantPatterns: JSON.parse(dbTask.relevant_patterns || '[]')
    };
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'blocked': return '🚫';
      default: return '⏳';
    }
  }

  private generateNextActions(tasks: Task[]): string[] {
    const actions: string[] = [];

    const notStarted = tasks.filter(t => t.status === 'not_started');
    const blocked = tasks.filter(t => t.status === 'blocked');

    if (blocked.length > 0) {
      actions.push(`Unblock ${blocked.length} blocked task(s)`);
    }

    if (notStarted.length > 0) {
      const next = notStarted[0];
      actions.push(`Start work on: ${next.title}`);
    }

    return actions;
  }

  private getExistingFeature(featureName: string): ExistingFeature | undefined {
    if (!this.db) return undefined;

    const feature = this.db.prepare(`
      SELECT * FROM features WHERE name = ?
    `).get(featureName) as any;

    if (!feature) return undefined;

    const taskCount = this.getTaskCount(featureName);

    return {
      name: feature.name,
      spec: feature.spec,
      grade: feature.grade,
      score: feature.score,
      taskCount,
      lastUpdated: feature.created_at
    };
  }

  private getRecommendedAction(
    similarFeatures: SimilarFeature[],
    existingFeature?: ExistingFeature
  ): 'merge' | 'replace' | 'rename' | 'skip' {
    if (existingFeature) {
      return 'replace'; // Exact name match
    }

    if (similarFeatures.length === 0) {
      return 'merge'; // No conflicts
    }

    const highestSimilarity = Math.max(...similarFeatures.map(f => f.score));

    if (highestSimilarity > 0.95) {
      return 'skip'; // Very similar, likely duplicate
    } else if (highestSimilarity > 0.8) {
      return 'merge'; // Similar enough to merge
    } else {
      return 'rename'; // Some similarity, suggest rename
    }
  }

  private mergeSpecs(existingSpec: string, newSpec: string): string {
    // Simple merge strategy - could be enhanced with more sophisticated logic
    if (existingSpec.includes(newSpec) || newSpec.includes(existingSpec)) {
      // One spec contains the other, use the longer one
      return existingSpec.length > newSpec.length ? existingSpec : newSpec;
    }

    return `${existingSpec}\n\n--- Additional Requirements ---\n${newSpec}`;
  }

  private async mergeWithExisting(
    featureName: string,
    newTasks: Task[],
    parseResult: ParseResult,
    duplicateInfo: DuplicateInfo
  ): Promise<SaveFeatureResult> {
    const existingTasks = await this.getFeatureTasks(featureName);

    // Identify unique tasks by comparing summaries and implementations
    const uniqueNewTasks = newTasks.filter(newTask =>
      !existingTasks.some(existingTask =>
        this.calculateSimilarity(newTask.summary, existingTask.summary) > (this.config?.deduplication.taskSimilarityThreshold ?? 0.9)
      )
    );

    // Merge tasks with sequence adjustment
    const mergedTasks = [...existingTasks, ...uniqueNewTasks.map((task, index) => ({
      ...task,
      id: `task_${String(existingTasks.length + index + 1).padStart(2, '0')}`,
      featureName
    }))];

    // Update feature with merged content
    const mergedSpec = this.mergeSpecs(duplicateInfo.existingFeature!.spec, parseResult.spec);
    const updatedParseResult = { ...parseResult, spec: mergedSpec };

    // Save merged result using the original saveFeature method with skip similarity check
    const files = await this.saveFeatureInternal(featureName, mergedTasks, updatedParseResult);

    const mergeResult: MergeResult = {
      files,
      mergedTasks,
      originalTaskCount: existingTasks.length,
      newTaskCount: uniqueNewTasks.length,
      duplicateTasksSkipped: newTasks.length - uniqueNewTasks.length
    };

    return {
      files,
      mergeResult
    };
  }

  private async saveFeatureInternal(
    featureName: string,
    tasks: Task[],
    parseResult: ParseResult
  ): Promise<string[]> {
    // This is the original saveFeature logic without deduplication checks
    if (!this.db || !this.config) throw new Error('Storage not initialized');

    const createdFiles: string[] = [];
    const featureDir = path.join(this.tasksDir, featureName);

    // Create feature directory
    await fs.mkdir(featureDir, { recursive: true });
    await fs.mkdir(path.join(featureDir, 'gherkin'), { recursive: true });

    // Save to database
    const featureId = `feat_${Date.now()}`;
    this.db.prepare(`
      INSERT OR REPLACE INTO features (id, name, spec, grade, score)
      VALUES (?, ?, ?, ?, ?)
    `).run(featureId, featureName, parseResult.spec, parseResult.grade, parseResult.score);

    // Save tasks
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];

      // Save to database
      this.db.prepare(`
        INSERT OR REPLACE INTO tasks (
          id, feature_name, sequence, title, slug, summary, implementation, status,
          acceptance_criteria, test_file, coverage_target, notes,
          dependencies, blocks, relevant_patterns
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        task.id,
        featureName,
        i,
        task.title,
        task.slug,
        task.summary,
        task.implementation,
        task.status,
        JSON.stringify(task.acceptanceCriteria),
        task.testFile,
        task.coverageTarget,
        task.notes,
        JSON.stringify(task.dependencies || []),
        JSON.stringify(task.blocks || []),
        JSON.stringify(task.relevantPatterns || [])
      );

      // Create task file
      const taskFileName = `task_${String(i + 1).padStart(2, '0')}_${task.slug}.md`;
      const taskPath = path.join(featureDir, taskFileName);
      await this.writeTaskFile(taskPath, task, featureName);
      createdFiles.push(taskPath);

      // Create gherkin file
      if (task.testFile) {
        const gherkinPath = path.join(featureDir, 'gherkin', task.testFile);
        await this.writeGherkinFile(gherkinPath, task, featureName);
        createdFiles.push(gherkinPath);
      }
    }

    // Create meta.json
    const metaPath = path.join(featureDir, 'meta.json');
    await fs.writeFile(metaPath, JSON.stringify({
      featureName,
      grade: parseResult.grade,
      score: parseResult.score,
      taskCount: tasks.length,
      createdAt: new Date().toISOString()
    }, null, 2));
    createdFiles.push(metaPath);

    // Create _active.md
    await this.updateActiveFile(featureName);
    createdFiles.push(path.join(featureDir, '_active.md'));

    return createdFiles;
  }

  async updateValidationResults(featureName: string, validationResults: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    this.db.prepare(`
      INSERT OR REPLACE INTO validation_results (
        feature_name,
        overall_status,
        completion_percentage,
        quality_score,
        validation_data,
        created_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      featureName,
      validationResults.overallStatus,
      validationResults.completionPercentage,
      validationResults.qualityScore,
      JSON.stringify(validationResults)
    );
  }

  async getValidationResults(featureName: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.prepare(`
      SELECT * FROM validation_results
      WHERE feature_name = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(featureName) as any;

    if (!result) return null;

    return {
      ...JSON.parse(result.validation_data),
      created_at: result.created_at
    };
  }

  async getTask(featureName: string, taskId: string): Promise<Task | null> {
    if (!this.db) throw new Error('Database not initialized');

    const task = this.db.prepare(`
      SELECT * FROM tasks WHERE feature_name = ? AND id = ?
    `).get(featureName, taskId) as any;

    if (!task) return null;

    return this.dbTaskToTask(task);
  }
}
