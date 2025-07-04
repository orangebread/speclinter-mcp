import { promises as fs } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import Handlebars from 'handlebars';
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
    this.tasksDir = path.join(this.rootDir, 'tasks');
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
  }

  async loadProjectContext(): Promise<ProjectContext | null> {
    if (!this.config) throw new Error('Storage not initialized');

    const contextDir = path.join(this.speclinterDir, 'context');

    try {
      const files = ['project.md', 'patterns.md', 'architecture.md'];
      const context: any = {};

      for (const file of files) {
        try {
          const content = await fs.readFile(path.join(contextDir, file), 'utf-8');
          const key = file.replace('.md', '');

          if (key === 'project') {
            context.stack = this.parseSection(content, 'Stack');
            context.constraints = this.parseListSection(content, 'Constraints');
            context.standards = this.parseListSection(content, 'Standards');
          } else if (key === 'patterns') {
            context.patterns = this.parsePatterns(content);
          }
        } catch {
          // File doesn't exist, skip
        }
      }

      return Object.keys(context).length > 0 ? context : null;
    } catch {
      return null;
    }
  }

  private parseSection(content: string, section: string): Record<string, string> {
    const lines = content.split('\n');
    const sectionIndex = lines.findIndex(line =>
      line.toLowerCase().includes(section.toLowerCase())
    );

    if (sectionIndex === -1) return {};

    const result: Record<string, string> = {};
    for (let i = sectionIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('##')) break;
      if (line.startsWith('- **')) {
        const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
        if (match) {
          result[match[1]] = match[2];
        }
      }
    }

    return result;
  }

  private parseListSection(content: string, section: string): string[] {
    const lines = content.split('\n');
    const sectionIndex = lines.findIndex(line =>
      line.toLowerCase().includes(section.toLowerCase())
    );

    if (sectionIndex === -1) return [];

    const result: string[] = [];
    for (let i = sectionIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('##')) break;
      if (line.startsWith('-')) {
        result.push(line.substring(1).trim());
      }
    }

    return result;
  }

  private parsePatterns(content: string): Array<{name: string, description: string, anchor: string}> {
    const patterns: Array<{name: string, description: string, anchor: string}> = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('## ')) {
        const name = line.substring(3);
        const anchor = name.toLowerCase().replace(/\s+/g, '-');
        const description = lines[i + 1]?.trim() || '';
        patterns.push({ name, description, anchor });
      }
    }

    return patterns;
  }

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

  private async writeGherkinFile(filePath: string, task: Task): Promise<void> {
    const gherkin = `Feature: ${task.title}

  Scenario: ${task.title} - Happy Path
    Given the system is ready
    When ${task.summary}
    Then the acceptance criteria are met

  Scenario: ${task.title} - Error Handling
    Given the system is ready
    When an error occurs
    Then it should be handled gracefully
`;
    await fs.writeFile(filePath, gherkin);
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

  private async getFeatureTasks(featureName: string): Promise<Task[]> {
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
        await this.writeGherkinFile(gherkinPath, task);
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
}
