import {
  handleAnalyzeCodebase,
  handleProcessCodebaseAnalysis
} from './ai/codebase/workflow.js';

export {
  handleAnalyzeCodebase,
  handleProcessCodebaseAnalysis
} from './ai/codebase/workflow.js';
export {
  handleReverseSpecAnalysis,
  handleProcessReverseSpecAnalysis
} from './ai/codebase/reverse-spec.js';
export {
  handleGenerateGherkinPrepare,
  handleProcessGherkinAnalysis
} from './ai/gherkin/workflow.js';
export {
  handleValidateImplementationPrepare,
  handleValidateImplementationProcess
} from './ai/validation/workflow.js';
export {
  handleParseSpecAI,
  handleProcessSpecAnalysisAI
} from './ai/spec/parse-spec.js';
export {
  handleFindSimilarAI,
  handleProcessSimilarityAnalysisAI
} from './ai/spec/similarity.js';
export {
  handleAnalyzeSpecQuality,
  handleProcessSpecQualityAnalysis,
  handleGenerateTasksFromSpec,
  handleProcessTaskGeneration,
  handleAnalyzeSpecComprehensive,
  handleProcessComprehensiveSpecAnalysis
} from './ai/spec/comprehensive.js';

export const handleAnalyzeCodebaseAI = handleAnalyzeCodebase;
export const handleUpdateContextFilesAI = handleProcessCodebaseAnalysis;
