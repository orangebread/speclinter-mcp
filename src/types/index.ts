import { z } from 'zod';

export const TaskStatusSchema = z.enum([
  'not_started',
  'in_progress', 
  'completed',
  'blocked'
]);

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  implementation: z.string(),
  status: TaskStatusSchema,
  statusEmoji: z.string(),
  featureName: z.string(),
  slug: z.string(),
  dependencies: z.array(z.string()).optional(),
  blocks: z.array(z.string()).optional(),
  acceptanceCriteria: z.array(z.string()),
  testFile: z.string(),
  coverageTarget: z.string(),
  notes: z.string(),
  relevantPatterns: z.array(z.object({
    name: z.string(),
    anchor: z.string()
  })).optional()
});

export const ParseResultSchema = z.object({
  spec: z.string(),
  grade: z.string(),
  score: z.number(),
  tasks: z.array(TaskSchema),
  improvements: z.array(z.string()),
  missingElements: z.array(z.string())
});

export const FeatureStatusSchema = z.object({
  featureName: z.string(),
  totalTasks: z.number(),
  completedTasks: z.number(),
  inProgressTasks: z.number(),
  blockedTasks: z.number(),
  overallStatus: z.string(),
  lastUpdated: z.string()
});

export const TestResultSchema = z.object({
  passed: z.number(),
  failed: z.number(),
  skipped: z.number(),
  coverage: z.number(),
  details: z.array(z.object({
    scenario: z.string(),
    status: z.string(),
    error: z.string().optional()
  }))
});

export const SimilarFeatureSchema = z.object({
  featureName: z.string(),
  score: z.number(),
  summary: z.string(),
  taskCount: z.number(),
  status: z.string()
});

export const ProjectContextSchema = z.object({
  stack: z.record(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  standards: z.array(z.string()).optional(),
  patterns: z.array(z.object({
    name: z.string(),
    description: z.string(),
    anchor: z.string()
  })).optional()
});

export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type ParseResult = z.infer<typeof ParseResultSchema>;
export type FeatureStatus = z.infer<typeof FeatureStatusSchema>;
export type TestResult = z.infer<typeof TestResultSchema>;
export type SimilarFeature = z.infer<typeof SimilarFeatureSchema>;
export type ProjectContext = z.infer<typeof ProjectContextSchema>;
