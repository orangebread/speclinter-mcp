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

// Unified AI tools (use via MCP server)
export {
  handleAnalyzeCodebaseUnified,
  handleParseSpecUnified,
  handleFindSimilarUnified,
  handleValidateImplementationUnified,
  handleGenerateGherkinUnified,
  handleAnalyzeSpecQualityUnified,
  handleGenerateTasksUnified,
  handleAnalyzeSpecComprehensiveUnified
} from './unified-ai-tools.js';

// AI schemas and types
export * from './types/ai-schemas.js';
