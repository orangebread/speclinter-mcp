import { z } from 'zod';
import {
  AISpecAnalysisSchema,
  AITaskGenerationSchema,
  AISpecParserAnalysisSchema,
  AIFeatureValidationSchema
} from '../types/ai-schemas.js';
import type { ParseResult, ProjectContext, Task } from '../types/index.js';

export type SpecAnalysis = z.infer<typeof AISpecAnalysisSchema>;
export type GeneratedTaskAnalysis = z.infer<typeof AITaskGenerationSchema>;
export type GeneratedTaskAnalysisTask = GeneratedTaskAnalysis['tasks'][number];
export type ComprehensiveSpecAnalysis = z.infer<typeof AISpecParserAnalysisSchema>;
export type ComprehensiveGeneratedTask = ComprehensiveSpecAnalysis['taskGeneration']['tasks'][number];
export type FeatureValidationAnalysis = z.infer<typeof AIFeatureValidationSchema>;

export interface AIContinuationRequest {
  success: true;
  action: 'ai_analysis_required';
  schema: string;
  project_root: string;
  analysis_prompt: string;
  feature_name?: string;
  original_spec?: string;
  input_context?: string;
  project_context?: unknown;
  follow_up_tool?: string;
  next_steps?: string[];
}

export interface ProjectContextSnapshot {
  raw: ProjectContext | null;
  hasContext: boolean;
  stack?: ProjectContext['stack'];
  techStack: Record<string, string>;
  constraints: string[];
  standards: string[];
  patterns: Array<{ name: string; description: string; anchor: string }>;
  projectStructure: {
    architecture: string;
  };
}

export interface TaskMapperResult {
  tasks: Task[];
  parseResult: ParseResult;
}
