// Main entry point for the SpecLinter package
// Legacy exports removed - SpecLinter now uses AI-leveraged tools exclusively
export { TaskGenerator } from './core/generator.js';
export { Storage } from './core/storage.js';
export { StorageManager } from './core/storage-manager.js';
export { SpecLinterServer, startServer } from './server.js';
export * from './types/index.js';
export * from './types/config.js';
export {
  handleGetTaskStatus,
  handleUpdateTaskStatus,
  handleInitProject
} from './tools.js';

// AI-leveraged tools (use via MCP server)
export {
  handleAnalyzeCodebase,
  handleProcessCodebaseAnalysis,
  handleParseSpecAI,
  handleProcessSpecAnalysisAI,
  handleFindSimilarAI,
  handleProcessSimilarityAnalysisAI,
  handleValidateImplementationPrepare,
  handleValidateImplementationProcess
} from './ai-tools.js';

// AI schemas and types
export * from './types/ai-schemas.js';
