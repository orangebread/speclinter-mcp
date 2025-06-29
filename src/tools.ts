import { SpecParser } from './core/parser.js';
import { TaskGenerator } from './core/generator.js';
import { Storage } from './core/storage.js';
import { TaskStatusSchema } from './types/index.js';

// Tool handlers
export async function handleParseSpec(args: any) {
  const { spec, feature_name, context } = args;

  // Initialize components
  const storage = new Storage();
  await storage.initialize();

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

  // Find similar features
  const similar = await storage.findSimilar(spec);

  // Save everything
  const paths = await storage.saveFeature(feature_name, tasks, result);

  return {
    feature_name,
    grade: result.grade,
    score: result.score,
    tasks: tasks.map(t => ({ ...t })),
    similar_features: similar,
    improvements: result.improvements,
    files_created: paths,
    next_steps: `Run tests with: speclinter test ${feature_name}`
  };
}

export async function handleGetTaskStatus(args: any) {
  const { feature_name } = args;
  const storage = new Storage();
  await storage.initialize();
  const status = await storage.getFeatureStatus(feature_name);
  return status;
}

export async function handleRunTests(args: any) {
  const { feature_name, task_id } = args;

  const storage = new Storage();
  await storage.initialize();
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
  const storage = new Storage();
  await storage.initialize();
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

  const storage = new Storage();
  await storage.initialize();

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
