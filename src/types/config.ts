import { z } from 'zod';

export const ConfigSchema = z.object({
  version: z.string(),
  generation: z.object({
    tasksPerFeature: z.number(),
    includePatterns: z.boolean(),
    testFramework: z.string(),
    gherkinStyle: z.enum(['declarative', 'imperative']),
    gherkinQuality: z.object({
      useAIGeneration: z.boolean(),
      scenarioComplexity: z.enum(['basic', 'standard', 'comprehensive']),
      includeEdgeCases: z.boolean(),
      includeSecurityScenarios: z.boolean(),
      includePerformanceScenarios: z.boolean(),
      minScenarioCount: z.number(),
      maxScenarioCount: z.number(),
      requireDataTables: z.boolean(),
      requireBackground: z.boolean()
    }),
    specAnalysis: z.object({
      analysisDepth: z.enum(['quick', 'standard', 'comprehensive']),
      qualityThreshold: z.number().min(0).max(100),
      taskComplexity: z.enum(['basic', 'standard', 'comprehensive']),
      includeBusinessValue: z.boolean(),
      includeTechnicalDebt: z.boolean(),
      includeRiskAssessment: z.boolean(),
      confidenceThreshold: z.number().min(0).max(1),
      maxRetries: z.number().min(0).max(5)
    })
  }),
  storage: z.object({
    tasksDir: z.string(),
    dbPath: z.string(),
    useGit: z.boolean()
  }),
  context: z.object({
    autoDetect: z.boolean(),
    contextDir: z.string(),
    fallbackStack: z.string()
  }),
  deduplication: z.object({
    enabled: z.boolean(),
    similarityThreshold: z.number(),
    defaultStrategy: z.enum(['prompt', 'merge', 'replace', 'skip']),
    autoMergeThreshold: z.number(),
    taskSimilarityThreshold: z.number()
  })
});

export type Config = z.infer<typeof ConfigSchema>;

export const DEFAULT_CONFIG: Config = {
  version: "1.0.0",
  generation: {
    tasksPerFeature: 10,
    includePatterns: true,
    testFramework: "vitest",
    gherkinStyle: "declarative",
    gherkinQuality: {
      useAIGeneration: true,
      scenarioComplexity: "standard",
      includeEdgeCases: true,
      includeSecurityScenarios: true,
      includePerformanceScenarios: false,
      minScenarioCount: 3,
      maxScenarioCount: 8,
      requireDataTables: false,
      requireBackground: false
    },
    specAnalysis: {
      analysisDepth: "standard",
      qualityThreshold: 70,
      taskComplexity: "standard",
      includeBusinessValue: true,
      includeTechnicalDebt: true,
      includeRiskAssessment: true,
      confidenceThreshold: 0.7,
      maxRetries: 2
    }
  },
  storage: {
    tasksDir: "./speclinter-tasks",
    dbPath: "./.speclinter/speclinter.db",
    useGit: true
  },
  context: {
    autoDetect: true,
    contextDir: "./.speclinter/context",
    fallbackStack: "node"
  },
  deduplication: {
    enabled: true,
    similarityThreshold: 0.8,
    defaultStrategy: "prompt",
    autoMergeThreshold: 0.95,
    taskSimilarityThreshold: 0.9
  }
};
