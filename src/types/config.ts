import { z } from 'zod';

export const ConfigSchema = z.object({
  version: z.string(),
  grading: z.object({
    strictMode: z.boolean(),
    minWordCount: z.number(),
    requireAcceptanceCriteria: z.boolean(),
    requireUserStory: z.boolean(),
    vagueTerms: z.array(z.string()),
    gradeThresholds: z.object({
      A: z.number(),
      B: z.number(),
      C: z.number(),
      D: z.number()
    })
  }),
  generation: z.object({
    tasksPerFeature: z.number(),
    includePatterns: z.boolean(),
    testFramework: z.string(),
    gherkinStyle: z.enum(['declarative', 'imperative'])
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
  })
});

export type Config = z.infer<typeof ConfigSchema>;

export const DEFAULT_CONFIG: Config = {
  version: "1.0.0",
  grading: {
    strictMode: false,
    minWordCount: 20,
    requireAcceptanceCriteria: true,
    requireUserStory: false,
    vagueTerms: ["fast", "easy", "good", "simple", "nice"],
    gradeThresholds: {
      A: 90,
      B: 80,
      C: 70,
      D: 60
    }
  },
  generation: {
    tasksPerFeature: 10,
    includePatterns: true,
    testFramework: "vitest",
    gherkinStyle: "declarative"
  },
  storage: {
    tasksDir: "./tasks",
    dbPath: "./.speclinter/speclinter.db",
    useGit: true
  },
  context: {
    autoDetect: true,
    contextDir: "./.speclinter/context",
    fallbackStack: "node"
  }
};
