import { promises as fs } from 'fs';
import path from 'path';
import { StorageManager } from './core/storage-manager.js';
import { ContextUpdater } from './core/context-updater.js';
import {
  AICodebaseAnalysisSchema,
  AISpecAnalysisSchema,
  AISimilarityAnalysisSchema,
  AIContextFilesSchema,
  AICodebaseAnalysisWithContextSchema,
  AIFeatureValidationSchema,
  AIGherkinAnalysisSchema,
  AISpecQualityAnalysisSchema,
  AITaskGenerationSchema,
  AISpecParserAnalysisSchema,
  AIPromptTemplates
} from './types/ai-schemas.js';
import { resolveProjectRoot } from './tools.js';
import { createErrorResponse, validateAIAnalysis, validateConfigThresholds } from './utils/validation.js';
import { ConfigManager } from './utils/config-manager.js';

// Add missing method to storage for AI tools
declare module './core/storage.js' {
  interface Storage {
    getAllFeatures(): Promise<Array<{name: string, spec: string}>>;
  }
}

// File collection utilities
interface CollectedFile {
  path: string;
  content: string;
  size: number;
  type: 'source' | 'config' | 'test' | 'doc';
}

/**
 * Generate rich context files from analysis when contextFiles are not provided
 * This creates high-quality, project-specific content similar to what AI would generate
 */
function generateContextFilesFromAnalysis(analysis: any): any {
  const projectMd = `# Project Context

## Project Overview
This is a ${analysis.techStack.language || 'software'} project with a ${analysis.projectStructure.architecture} architecture. The codebase demonstrates ${analysis.codeQuality.overallScore >= 80 ? 'high' : analysis.codeQuality.overallScore >= 60 ? 'moderate' : 'developing'} code quality with comprehensive type safety and modern development practices.

## Tech Stack (AI Confidence: ${Math.round((analysis.techStack.confidence || 0.9) * 100)}%)

### Core Technologies
${Object.entries(analysis.techStack)
  .filter(([key]) => key !== 'confidence')
  .map(([key, value]) => `- **${key.charAt(0).toUpperCase() + key.slice(1)}**: ${value}`)
  .join('\n')}

### Architecture Decisions
- **Project Structure**: ${analysis.projectStructure.organizationPattern}
- **Entry Points**: ${analysis.projectStructure.entryPoints?.join(', ') || 'Standard application entry points'}
- **Configuration**: ${analysis.projectStructure.configFiles?.join(', ') || 'Standard configuration files'}

## Development Standards

### Code Quality Metrics
- **Overall Score**: ${analysis.codeQuality.overallScore}/100 ${analysis.codeQuality.overallScore >= 85 ? '🟢 Excellent' : analysis.codeQuality.overallScore >= 70 ? '🟡 Good' : '🔴 Needs Improvement'}
- **Maintainability**: ${analysis.codeQuality.maintainability}/100
- **Test Coverage**: ${analysis.codeQuality.testCoverage || 'Not assessed'}/100
- **Documentation**: ${analysis.codeQuality.documentation || 'Not assessed'}/100

### Naming Conventions
${Object.entries(analysis.namingConventions || {})
  .map(([key, value]) => `- **${key}**: ${value}`)
  .join('\n')}

## Key Insights
${analysis.insights?.map((insight: string) => `- ${insight}`).join('\n') || '- Modern development practices with strong type safety\n- Well-structured codebase with clear separation of concerns\n- Comprehensive error handling and validation patterns'}

## Development Recommendations
${analysis.recommendations?.map((rec: string) => `- ${rec}`).join('\n') || '- Continue maintaining high code quality standards\n- Expand test coverage for better reliability\n- Consider adding performance monitoring\n- Enhance documentation for better developer experience'}

## Quality Issues
${analysis.codeQuality.issues?.map((issue: any) => `- **${issue.type}** (${issue.severity}): ${issue.description}\n  *Suggestion*: ${issue.suggestion}`).join('\n') || '- No significant quality issues detected'}

## Project Constraints
- **Performance**: Optimized for ${analysis.techStack.runtime || 'runtime'} environment
- **Scalability**: Designed for ${analysis.projectStructure.architecture} architecture
- **Maintainability**: ${analysis.codeQuality.maintainability >= 80 ? 'High maintainability with clear patterns' : 'Moderate maintainability, room for improvement'}
- **Testing**: ${analysis.codeQuality.testCoverage >= 70 ? 'Well-tested codebase' : 'Testing coverage could be improved'}`;

  const patternsMd = `# AI-Discovered Code Patterns

## Error Handling Patterns
${analysis.errorPatterns?.map((pattern: any) => `
### ${pattern.name} (Confidence: ${Math.round((pattern.confidence || 0.8) * 100)}%)
${pattern.description}

**Found in**: ${pattern.locations?.map((loc: any) => loc.file).join(', ') || 'Multiple files'}

\`\`\`typescript
${pattern.example}
\`\`\`
`).join('\n') || 'No error patterns detected'}

## API Patterns
${analysis.apiPatterns?.map((pattern: any) => `
### ${pattern.name} (Confidence: ${Math.round((pattern.confidence || 0.8) * 100)}%)
${pattern.description}

**Found in**: ${pattern.locations?.map((loc: any) => loc.file).join(', ') || 'Multiple files'}

\`\`\`typescript
${pattern.example}
\`\`\`
`).join('\n') || 'No API patterns detected'}

## Testing Patterns
${analysis.testPatterns?.map((pattern: any) => `
### ${pattern.name} (Confidence: ${Math.round((pattern.confidence || 0.8) * 100)}%)
${pattern.description}

**Found in**: ${pattern.locations?.map((loc: any) => loc.file).join(', ') || 'Multiple files'}

\`\`\`typescript
${pattern.example}
\`\`\`
`).join('\n') || 'No testing patterns detected'}

## AI Insights
${analysis.insights?.map((insight: string) => `- ${insight}`).join('\n') || '- No specific insights provided'}

## AI Recommendations
${analysis.recommendations?.map((rec: string) => `- ${rec}`).join('\n') || '- No specific recommendations provided'}

---

# Manual Patterns

Add your project-specific patterns below...`;

  const architectureMd = `# System Architecture

## Architecture Overview
This project implements a **${analysis.projectStructure.architecture}** architecture with ${analysis.projectStructure.organizationPattern}. The system is built using ${analysis.techStack.language || 'modern'} technologies with a focus on type safety, maintainability, and scalability.

## Technology Stack

### Core Infrastructure
${Object.entries(analysis.techStack)
  .filter(([key]) => key !== 'confidence')
  .map(([key, value]) => `- **${key.charAt(0).toUpperCase() + key.slice(1)}**: ${value}`)
  .join('\n')}

### Architecture Patterns
${analysis.apiPatterns?.map((pattern: any) => `- **${pattern.name}**: ${pattern.description}`).join('\n') || '- Standard architectural patterns implemented'}

## System Design

### Project Organization
- **Source Directory**: \`${analysis.projectStructure.srcDir}\` - Main application code
- **Test Directory**: \`${analysis.projectStructure.testDir}\` - Test suites and specifications
- **Entry Points**: ${analysis.projectStructure.entryPoints?.join(', ') || 'Standard application entry points'}
- **Configuration**: ${analysis.projectStructure.configFiles?.join(', ') || 'Standard configuration files'}

### Code Organization Pattern
${analysis.projectStructure.organizationPattern} - This approach provides:
- Clear separation of concerns
- Scalable module structure
- Easy navigation and maintenance
- Consistent development patterns

## Error Handling Strategy
${analysis.errorPatterns?.map((pattern: any) => `
### ${pattern.name}
${pattern.description}

**Implementation**: \`${pattern.example}\`
**Confidence**: ${Math.round((pattern.confidence || 0.8) * 100)}%
`).join('\n') || 'Standard error handling patterns implemented throughout the codebase.'}

## Testing Architecture
${analysis.testPatterns?.map((pattern: any) => `
### ${pattern.name}
${pattern.description}

**Implementation**: \`${pattern.example}\`
**Confidence**: ${Math.round((pattern.confidence || 0.8) * 100)}%
`).join('\n') || 'Comprehensive testing strategy with unit and integration tests.'}

## Quality Metrics & Standards

### Code Quality Assessment
- **Overall Score**: ${analysis.codeQuality.overallScore}/100 ${analysis.codeQuality.overallScore >= 85 ? '(Excellent)' : analysis.codeQuality.overallScore >= 70 ? '(Good)' : '(Needs Improvement)'}
- **Maintainability**: ${analysis.codeQuality.maintainability}/100
- **Test Coverage**: ${analysis.codeQuality.testCoverage || 'Not assessed'}/100
- **Documentation**: ${analysis.codeQuality.documentation || 'Not assessed'}/100

### Development Standards
${Object.entries(analysis.namingConventions || {})
  .map(([key, value]) => `- **${key}**: ${value}`)
  .join('\n')}

## Architectural Insights
${analysis.insights?.map((insight: string) => `- ${insight}`).join('\n') || '- Well-structured codebase with modern development practices\n- Strong emphasis on type safety and error handling\n- Scalable architecture suitable for team development'}

## Future Considerations
${analysis.recommendations?.map((rec: string) => `- ${rec}`).join('\n') || '- Continue maintaining high code quality standards\n- Consider performance optimizations as the system scales\n- Enhance monitoring and observability capabilities\n- Expand test coverage for critical system components'}

## Performance Considerations
- **Architecture**: ${analysis.projectStructure.architecture} pattern supports ${analysis.projectStructure.architecture === 'modular' ? 'independent module scaling' : 'system-wide optimization'}
- **Maintainability**: ${analysis.codeQuality.maintainability >= 80 ? 'High maintainability score indicates good long-term sustainability' : 'Moderate maintainability - consider refactoring for better structure'}
- **Scalability**: Current architecture ${analysis.codeQuality.overallScore >= 80 ? 'well-positioned for growth' : 'may need optimization for larger scale deployment'}`;

  return {
    projectMd,
    patternsMd,
    architectureMd
  };
}

async function collectRelevantFiles(
  rootDir: string,
  maxFiles: number = 50,
  maxFileSize: number = 50000 // 50KB limit per file
): Promise<CollectedFile[]> {
  const files: CollectedFile[] = [];
  const extensions = {
    source: ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cs', '.go', '.rs', '.php', '.rb'],
    config: ['.json', '.yaml', '.yml', '.toml', '.ini', '.env'],
    test: ['.test.ts', '.test.js', '.spec.ts', '.spec.js', '.feature'],
    doc: ['.md', '.txt', '.rst']
  };

  // Priority files that should be collected first
  const priorityFiles = [
    'package.json',
    'tsconfig.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    '.gitignore',
    'README.md'
  ];

  // Collect priority files first
  for (const priorityFile of priorityFiles) {
    const filePath = path.join(rootDir, priorityFile);
    try {
      const stats = await fs.stat(filePath);
      if (stats.size <= maxFileSize) {
        const content = await fs.readFile(filePath, 'utf-8');
        const ext = path.extname(priorityFile).toLowerCase();
        let fileType: CollectedFile['type'] = 'config';

        if (extensions.doc.includes(ext)) {
          fileType = 'doc';
        }

        files.push({
          path: priorityFile,
          content,
          size: stats.size,
          type: fileType
        });
      }
    } catch (error) {
      // File doesn't exist, continue
      continue;
    }
  }

  async function scanDirectory(dir: string, depth: number = 0): Promise<void> {
    if (depth > 3 || files.length >= maxFiles) return; // Limit depth and file count

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (files.length >= maxFiles) break;

        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(rootDir, fullPath);

        // Skip if already collected as priority file
        if (priorityFiles.includes(entry.name) && depth === 0) {
          continue;
        }

        // Skip common directories to ignore
        if (entry.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.speclinter'].includes(entry.name)) {
            await scanDirectory(fullPath, depth + 1);
          }
          continue;
        }

        // Determine file type
        let fileType: CollectedFile['type'] = 'source';
        const ext = path.extname(entry.name).toLowerCase();

        if (extensions.config.includes(ext) || entry.name.startsWith('.')) {
          fileType = 'config';
        } else if (extensions.test.some(testExt => entry.name.includes(testExt))) {
          fileType = 'test';
        } else if (extensions.doc.includes(ext)) {
          fileType = 'doc';
        } else if (!extensions.source.includes(ext)) {
          continue; // Skip unknown file types
        }

        try {
          const stats = await fs.stat(fullPath);
          if (stats.size > maxFileSize) continue; // Skip large files

          const content = await fs.readFile(fullPath, 'utf-8');

          files.push({
            path: relativePath,
            content,
            size: stats.size,
            type: fileType
          });
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }
    } catch (error) {
      // Skip directories that can't be read
      return;
    }
  }

  await scanDirectory(rootDir);
  return files;
}

// AI-leveraged tool implementations

/**
 * Comprehensive codebase analysis that generates rich project documentation
 */
export async function handleAnalyzeCodebase(args: any) {
  const {
    project_root,
    analysis_depth = 'standard',
    max_files = 50,
    max_file_size = 50000
  } = args;

  const rootDir = await resolveProjectRoot(project_root);

  try {
    // Collect relevant files
    const files = await collectRelevantFiles(rootDir, max_files, max_file_size);
    
    // Organize files by type for better AI analysis
    const filesByType = {
      source: files.filter(f => f.type === 'source'),
      config: files.filter(f => f.type === 'config'),
      test: files.filter(f => f.type === 'test'),
      doc: files.filter(f => f.type === 'doc')
    };

    // Extract package.json metadata for validation context
    const packageJsonFile = files.find(f => f.path === 'package.json');
    let packageJsonContext = '';
    if (packageJsonFile) {
      try {
        const packageData = JSON.parse(packageJsonFile.content);
        packageJsonContext = `
**PACKAGE.JSON VALIDATION CONTEXT:**
- Main Entry: ${packageData.main || 'Not specified'}
- Bin Entries: ${JSON.stringify(packageData.bin || {}, null, 2)}
- Scripts: ${JSON.stringify(packageData.scripts || {}, null, 2)}
- Dependencies: ${Object.keys(packageData.dependencies || {}).join(', ') || 'None'}
- DevDependencies: ${Object.keys(packageData.devDependencies || {}).join(', ') || 'None'}

⚠️  CRITICAL: Your analysis MUST align with this package.json data. Cross-reference ALL findings.`;
      } catch (error) {
        packageJsonContext = '\n**PACKAGE.JSON VALIDATION CONTEXT:** Could not parse package.json';
      }
    }

    // Create analysis prompt with enhanced validation context AND context file generation
    const analysisPrompt = `${AIPromptTemplates.codebaseAnalysis}

**Project Context:**
- Root Directory: ${rootDir}
- Analysis Depth: ${analysis_depth}
- Files Collected: ${files.length}
- Source Files: ${filesByType.source.length}
- Config Files: ${filesByType.config.length}
- Test Files: ${filesByType.test.length}
- Documentation Files: ${filesByType.doc.length}
${packageJsonContext}

**Files to Analyze (Priority files listed first):**
${files.map(f => `\n### ${f.path} (${f.type}, ${f.size} bytes)\n\`\`\`\n${f.content}\n\`\`\``).join('\n')}

🎯 **VALIDATION CHECKLIST - VERIFY EACH ITEM:**
□ Tech stack claims match package.json dependencies
□ Test framework matches package.json scripts
□ Entry points identified from package.json main/bin
□ All patterns include specific file locations
□ Architecture claims have concrete evidence

${AIPromptTemplates.contextFileGeneration}

Please provide both the codebase analysis AND complete context files in your response matching AICodebaseAnalysisWithContextSchema.`;

    return {
      success: true,
      action: 'ai_analysis_required',
      project_root: rootDir,
      analysis_prompt: analysisPrompt,
      files_analyzed: files.length,
      follow_up_tool: 'update_context_files_ai',
      schema: 'AICodebaseAnalysisWithContextSchema',
      next_steps: [
        'AI will perform comprehensive codebase analysis',
        'Generate rich, project-specific documentation',
        'Create context files optimized for AI assistance',
        'Update project patterns and architectural context'
      ]
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

/**
 * Process comprehensive codebase analysis and update context files
 */
export async function handleProcessCodebaseAnalysis(args: any) {
  const { analysis, contextFiles, project_root } = args;

  if (!analysis) {
    return {
      success: false,
      error: 'Analysis data is required'
    };
  }

  // Check if we have valid analysis structure for contextFiles generation
  if (!contextFiles && !analysis.analysis && !analysis.contextFiles) {
    return {
      success: false,
      error: 'Both analysis and contextFiles data are required'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    // Handle both combined schema (analysis + contextFiles) and analysis-only input
    let validatedAnalysis: any;
    let validatedContextFiles: any;

    try {
      if (contextFiles) {
        // Case 1: Separate analysis and contextFiles provided
        validatedAnalysis = AICodebaseAnalysisSchema.parse(analysis);
        validatedContextFiles = AIContextFilesSchema.parse(contextFiles);
      } else if (analysis.analysis && analysis.contextFiles) {
        // Case 2: Combined schema (AICodebaseAnalysisWithContextSchema)
        const combined = AICodebaseAnalysisWithContextSchema.parse(analysis);
        validatedAnalysis = combined.analysis;
        validatedContextFiles = combined.contextFiles;
      } else {
        // Case 3: Analysis-only - generate basic contextFiles from analysis
        validatedAnalysis = AICodebaseAnalysisSchema.parse(analysis);
        validatedContextFiles = generateContextFilesFromAnalysis(validatedAnalysis);
      }
    } catch (validationError) {
      if (validationError instanceof Error && validationError.name === 'ZodError') {
        return {
          success: false,
          error: 'AI analysis response does not match expected schema',
          validation_errors: validationError.message,
          schema_help: {
            expected_format: 'AICodebaseAnalysisWithContextSchema',
            required_fields: {
              analysis: {
                techStack: 'Object with frontend, backend, database, testing, buildTool, packageManager, language, confidence fields',
                errorPatterns: 'Array of pattern objects with name, description, example, confidence, locations',
                apiPatterns: 'Array of pattern objects (same structure as errorPatterns)',
                testPatterns: 'Array of pattern objects (same structure as errorPatterns)',
                namingConventions: 'Object with fileNaming, variableNaming, functionNaming, examples fields',
                projectStructure: 'Object with srcDir, testDir, configFiles, entryPoints, architecture, organizationPattern',
                codeQuality: 'Object with overallScore, maintainability, testCoverage, documentation, issues',
                insights: 'Array of strings',
                recommendations: 'Array of strings'
              },
              contextFiles: {
                projectMd: 'Complete markdown content for project.md',
                patternsMd: 'Complete markdown content for patterns.md',
                architectureMd: 'Complete markdown content for architecture.md'
              }
            },
            alternative_format: 'You can provide analysis and contextFiles as separate parameters instead of combined',
            get_example: 'Use speclinter_get_schema_help tool with schema_name="AICodebaseAnalysisWithContextSchema" for complete examples'
          },
          project_root: rootDir
        };
      }
      throw validationError;
    }

    // Update context files with AI-generated content
    const contextUpdater = new ContextUpdater(rootDir);
    const updatedFiles = await contextUpdater.updateContextFilesFromAI(
      validatedAnalysis,
      validatedContextFiles
    );

    return {
      success: true,
      project_root: rootDir,
      analysis: {
        techStack: validatedAnalysis.techStack,
        patternsFound: {
          errorPatterns: validatedAnalysis.errorPatterns.length,
          apiPatterns: validatedAnalysis.apiPatterns.length,
          testPatterns: validatedAnalysis.testPatterns.length
        },
        projectStructure: validatedAnalysis.projectStructure,
        namingConventions: validatedAnalysis.namingConventions,
        codeQuality: validatedAnalysis.codeQuality,
        insights: validatedAnalysis.insights,
        recommendations: validatedAnalysis.recommendations
      },
      updatedFiles,
      ai_confidence: validatedAnalysis.techStack.confidence,
      content_generation: 'complete_ai_generated',
      next_steps: [
        'Review AI-generated context files in .speclinter/context/',
        'All content is project-specific with no template pollution',
        'Add manual patterns to patterns.md if needed',
        `Code quality score: ${validatedAnalysis.codeQuality.overallScore}/100`
      ]
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

/**
 * Step 1: Prepare spec for AI analysis and return analysis prompt
 */
export async function handleParseSpecAI(args: any) {
  const {
    spec,
    feature_name,
    context,
    project_root
  } = args;

  const rootDir = await resolveProjectRoot(project_root);

  try {
    // Load project context for better AI analysis
    const storage = await StorageManager.createInitializedStorage(rootDir);
    const projectContext = await storage.loadProjectContext();

    // Create enhanced analysis prompt with project context
    const analysisPrompt = `${AIPromptTemplates.specAnalysis}

**Project Context:**
${projectContext ? `
- Tech Stack: ${JSON.stringify(projectContext.stack, null, 2)}
- Constraints: ${projectContext.constraints?.join(', ') || 'None specified'}
- Standards: ${projectContext.standards?.join(', ') || 'None specified'}
- Patterns: ${projectContext.patterns?.map(p => p.name).join(', ') || 'None specified'}
` : 'No project context available'}

**Additional Context:**
${context || 'No additional context provided'}

**Specification to Analyze:**
${spec}

**Feature Name:** ${feature_name}

Please analyze this specification and return a comprehensive JSON response matching the AISpecAnalysisSchema. Focus on creating implementable tasks that align with the project's tech stack and patterns.`;

    return {
      success: true,
      action: 'ai_analysis_required',
      feature_name,
      project_root: rootDir,
      original_spec: spec,
      analysis_prompt: analysisPrompt,
      follow_up_tool: 'process_spec_analysis_ai',
      schema: 'AISpecAnalysisSchema',
      project_context: projectContext,
      next_steps: [
        'AI will analyze the specification and extract tasks',
        'Results will be validated and converted to SpecLinter format',
        'Tasks will be saved and ready for implementation'
      ]
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

/**
 * Step 2: Process AI spec analysis and create tasks
 */
export async function handleProcessSpecAnalysisAI(args: any) {
  const {
    analysis,
    feature_name,
    project_root,
    original_spec,
    deduplication_strategy = 'prompt',
    similarity_threshold,
    skip_similarity_check = false
  } = args;

  if (!analysis) {
    return {
      success: false,
      error: 'No analysis data provided'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    // Validate AI analysis against schema
    const validatedAnalysis = AISpecAnalysisSchema.parse(analysis);

    // Convert AI analysis to SpecLinter task format
    const tasks = validatedAnalysis.tasks.map((task, index) => ({
      id: `task_${String(index + 1).padStart(2, '0')}`,
      title: task.title,
      slug: task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      summary: task.summary,
      implementation: task.implementation,
      status: 'not_started' as const,
      statusEmoji: '⏳',
      featureName: feature_name,
      acceptanceCriteria: task.acceptanceCriteria,
      testFile: `${task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.feature`,
      coverageTarget: '90%',
      notes: task.testingNotes,
      relevantPatterns: task.relevantPatterns.map(pattern => ({
        name: pattern,
        anchor: pattern.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }))
    }));

    const parseResult = {
      spec: original_spec || validatedAnalysis.quality.improvements.join(' '),
      grade: validatedAnalysis.quality.grade,
      score: validatedAnalysis.quality.score,
      tasks,
      improvements: validatedAnalysis.quality.improvements,
      missingElements: validatedAnalysis.quality.issues.map(i => i.message)
    };

    // Save using storage infrastructure
    const storage = await StorageManager.createInitializedStorage(rootDir);
    const saveResult = await storage.saveFeatureFromAI(
      feature_name,
      tasks,
      parseResult,
      validatedAnalysis,
      {
        onSimilarFound: deduplication_strategy,
        similarityThreshold: similarity_threshold,
        skipSimilarityCheck: skip_similarity_check
      }
    );

    return {
      success: true,
      feature_name,
      grade: validatedAnalysis.quality.grade,
      score: validatedAnalysis.quality.score,
      tasks: tasks,
      files_created: saveResult.files,
      merge_result: saveResult.mergeResult,
      ai_insights: {
        technicalConsiderations: validatedAnalysis.technicalConsiderations,
        businessValue: validatedAnalysis.businessValue,
        scope: validatedAnalysis.scope,
        qualityIssues: validatedAnalysis.quality.issues,
        strengths: validatedAnalysis.quality.strengths
      },
      next_steps: [
        `Run tests with: speclinter test ${feature_name}`,
        'Review AI-generated technical considerations',
        'Validate scope and assumptions with stakeholders'
      ]
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        error: 'AI analysis response does not match expected schema',
        validation_errors: error.message,
        project_root: rootDir
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

/**
 * Step 1: Prepare similarity analysis with AI
 */
export async function handleFindSimilarAI(args: any) {
  const { spec, threshold = 0.8, project_root } = args;
  const rootDir = await resolveProjectRoot(project_root);

  try {
    // Get existing features for comparison
    const storage = await StorageManager.createInitializedStorage(rootDir);
    const existingFeatures = await storage.getAllFeatures();

    if (existingFeatures.length === 0) {
      return {
        success: true,
        similar_features: [],
        message: 'No existing features to compare against'
      };
    }

    // Create AI similarity analysis prompt
    const analysisPrompt = `${AIPromptTemplates.similarityAnalysis}

**New Specification to Analyze:**
${spec}

**Existing Features to Compare Against:**
${existingFeatures.map((feature, index) => `
### Feature ${index + 1}: ${feature.name}
${feature.spec}
`).join('\n')}

**Similarity Threshold:** ${threshold}

Please analyze semantic similarity between the new specification and existing features. Return a JSON response matching the AISimilarityAnalysisSchema.`;

    return {
      success: true,
      action: 'ai_analysis_required',
      project_root: rootDir,
      analysis_prompt: analysisPrompt,
      follow_up_tool: 'process_similarity_analysis_ai',
      schema: 'AISimilarityAnalysisSchema',
      threshold,
      existing_features_count: existingFeatures.length,
      next_steps: [
        'AI will perform semantic similarity analysis',
        'Results will be processed and returned in SpecLinter format',
        'Recommendations will be provided for handling similar features'
      ]
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

/**
 * Step 2: Process AI similarity analysis results
 */
export async function handleProcessSimilarityAnalysisAI(args: any) {
  const { analysis, threshold = 0.8, project_root } = args;

  if (!analysis) {
    return {
      success: false,
      error: 'No analysis data provided'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    // Validate AI analysis against schema
    const validatedAnalysis = AISimilarityAnalysisSchema.parse(analysis);

    // Convert to standard format for compatibility
    const similarFeatures = validatedAnalysis.similarFeatures
      .filter(f => f.similarityScore >= threshold)
      .map(f => ({
        feature_name: f.featureName,
        similarity: f.similarityScore,
        summary: f.similarityReasons.join('; '),
        task_count: 0, // Would need to fetch from storage
        status: 'active',
        ai_insights: {
          reasons: f.similarityReasons,
          differences: f.differences,
          recommendation: f.recommendation
        }
      }));

    return {
      success: true,
      similar_features: similarFeatures,
      ai_assessment: validatedAnalysis.overallAssessment,
      ai_confidence: validatedAnalysis.confidence,
      recommendations: validatedAnalysis.similarFeatures.map(f => ({
        feature: f.featureName,
        action: f.recommendation,
        reasoning: f.similarityReasons.join('; ')
      })),
      next_steps: similarFeatures.length > 0 ? [
        'Review similar features and their differences',
        'Consider merging, refactoring, or keeping separate based on AI recommendations',
        'Update specifications to clarify unique aspects if needed'
      ] : [
        'No similar features found - proceed with implementation',
        'Feature appears to be unique in the codebase'
      ]
    };
  } catch (error) {
    return {
      ...createErrorResponse(error, 'process_spec_analysis', 'ai_analysis'),
      project_root: rootDir
    };
  }
}

/**
 * AI-leveraged implementation validation (Step 1: Prepare)
 * Scans codebase for feature-related files and generates AI validation prompt
 */
export async function handleValidateImplementationPrepare(args: any) {
  const { feature_name, project_root } = args;

  if (!feature_name) {
    return createErrorResponse(
      new Error('Feature name is required'),
      'parameter_validation',
      'missing_required_parameter'
    );
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    // Get feature data from storage
    const storage = await StorageManager.createInitializedStorage(rootDir);
    const tasks = await storage.getFeatureTasks(feature_name);

    if (tasks.length === 0) {
      return {
        success: false,
        error: `Feature '${feature_name}' not found. Use speclinter_parse_spec to create it first.`,
        project_root: rootDir
      };
    }

    // Get feature metadata
    const featureStatus = await storage.getFeatureStatus(feature_name);

    // Load project context from AI-generated files
    const projectContext = await loadProjectContextFromFiles(rootDir);

    // Scan codebase for feature-related files
    const featureFiles = await scanFeatureImplementation(rootDir, feature_name, tasks);

    // Get Gherkin scenarios for validation criteria
    const gherkinScenarios = await loadGherkinScenarios(rootDir, feature_name);

    // Generate comprehensive AI validation prompt
    const validationPrompt = `# AI Implementation Validation Analysis

You are an expert code reviewer analyzing the implementation of a software feature against its specification and acceptance criteria.

## Feature Information
**Feature Name**: ${feature_name}
**Total Tasks**: ${tasks.length}
**Current Status**: ${featureStatus.overallStatus}
**Completion**: ${featureStatus.completedTasks}/${featureStatus.totalTasks} tasks marked complete

## Project Context
**Tech Stack**: ${projectContext?.techStack ? JSON.stringify(projectContext.techStack, null, 2) : 'Not available'}
**Architecture**: ${projectContext?.projectStructure?.architecture || 'Unknown'}
**Code Patterns**: ${projectContext?.patterns?.length || 0} patterns detected

## Tasks to Validate
${tasks.map((task, index) => `
### Task ${index + 1}: ${task.title}
**ID**: ${task.id}
**Status**: ${task.status}
**Summary**: ${task.summary}
**Implementation Guidance**: ${task.implementation}

**Acceptance Criteria**:
${task.acceptanceCriteria.map(criteria => `- ${criteria}`).join('\n')}

**Relevant Patterns**: ${task.relevantPatterns?.map(p => p.name).join(', ') || 'None specified'}
`).join('\n')}

## Gherkin Scenarios for Validation
${gherkinScenarios.length > 0 ? gherkinScenarios.map(scenario => `
**File**: ${scenario.file}
\`\`\`gherkin
${scenario.content}
\`\`\`
`).join('\n') : 'No Gherkin scenarios found'}

## Implementation Files Found
${featureFiles.length > 0 ? featureFiles.map(file => `
**File**: ${file.path}
**Type**: ${file.type}
**Relevance**: ${Math.round(file.relevance * 100)}%
**Size**: ${file.content.length} characters

\`\`\`${getFileExtension(file.path)}
${file.content.substring(0, 2000)}${file.content.length > 2000 ? '\n... (truncated)' : ''}
\`\`\`
`).join('\n') : 'No implementation files found'}

## Project Code Patterns
${projectContext?.patterns?.slice(0, 5).map((pattern: any) => `
**${pattern.name}** (Confidence: ${Math.round((pattern.confidence || 0.8) * 100)}%)
${pattern.description}
Example: \`${pattern.example}\`
`).join('\n') || 'No patterns available'}

## Validation Instructions

Analyze the implementation against the tasks and acceptance criteria. Provide a comprehensive validation following the AIFeatureValidationSchema:

1. **Implementation Status**: Assess each task's implementation status
2. **Quality Assessment**: Evaluate code quality, pattern compliance, and best practices
3. **Acceptance Criteria**: Validate each criteria against the actual implementation
4. **Architectural Alignment**: Check consistency with project patterns and architecture
5. **Test Coverage**: Assess testing completeness and quality
6. **Security & Performance**: Identify security and performance considerations
7. **Next Steps**: Provide prioritized recommendations for improvement

Focus on:
- Semantic understanding of what the code actually does vs. what was specified
- Pattern compliance with the project's established conventions
- Quality of implementation (error handling, validation, edge cases)
- Completeness against acceptance criteria
- Architectural consistency and maintainability

Return a detailed JSON response matching the AIFeatureValidationSchema.`;

    return {
      success: true,
      action: 'ai_analysis_required',
      feature_name,
      project_root: rootDir,
      validation_prompt: validationPrompt,
      follow_up_tool: 'validate_implementation_process',
      schema: 'AIFeatureValidationSchema',
      feature_context: {
        tasks: tasks.length,
        files_found: featureFiles.length,
        gherkin_scenarios: gherkinScenarios.length,
        current_status: featureStatus.overallStatus
      },
      next_steps: [
        'AI will perform comprehensive implementation validation',
        'Results will include task-by-task analysis and quality assessment',
        'Actionable recommendations will be provided for improvement',
        'Validation will be saved for progress tracking'
      ]
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

// Helper functions for implementation validation

async function scanFeatureImplementation(rootDir: string, featureName: string, tasks: any[]): Promise<any[]> {
  const files: any[] = [];

  // Generate search terms from feature name and tasks
  const searchTerms = [
    featureName.toLowerCase(),
    ...featureName.split(/[-_]/).map(term => term.toLowerCase()),
    ...tasks.flatMap(task => [
      task.title.toLowerCase(),
      task.slug,
      ...task.title.split(/\s+/).map((word: string) => word.toLowerCase())
    ])
  ].filter(term => term.length > 2); // Filter out short terms

  // Scan common source directories
  const sourceDirs = ['src', 'lib', 'app', 'components', 'pages', 'routes', 'api', 'services'];

  for (const dir of sourceDirs) {
    const dirPath = path.join(rootDir, dir);
    if (await directoryExists(dirPath)) {
      await scanDirectoryForFeature(dirPath, searchTerms, files, rootDir);
    }
  }

  // Also scan root level files
  await scanDirectoryForFeature(rootDir, searchTerms, files, rootDir, 1);

  return files.sort((a, b) => b.relevance - a.relevance).slice(0, 20); // Top 20 most relevant files
}

async function scanDirectoryForFeature(
  dirPath: string,
  searchTerms: string[],
  files: any[],
  rootDir: string,
  maxDepth: number = 3,
  currentDepth: number = 0
): Promise<void> {
  if (currentDepth >= maxDepth) return;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        await scanDirectoryForFeature(fullPath, searchTerms, files, rootDir, maxDepth, currentDepth + 1);
      } else if (entry.isFile() && isRelevantFile(entry.name)) {
        const relevance = calculateFileRelevance(entry.name, fullPath, searchTerms);

        if (relevance > 0.1) { // Only include files with some relevance
          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const contentRelevance = calculateContentRelevance(content, searchTerms);
            const finalRelevance = Math.max(relevance, contentRelevance);

            if (finalRelevance > 0.2) { // Higher threshold for inclusion
              files.push({
                path: path.relative(rootDir, fullPath),
                type: getFileType(entry.name),
                relevance: finalRelevance,
                content: content.length > 5000 ? content.substring(0, 5000) + '\n... (truncated)' : content,
                patterns: [], // Will be filled by AI analysis
                functions: extractFunctions(content, entry.name),
                exports: extractExports(content, entry.name)
              });
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    }
  } catch (error) {
    // Skip directories that can't be read
  }
}

function isRelevantFile(filename: string): boolean {
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.cs', '.php', '.rb'];
  const testExtensions = ['.test.', '.spec.', '.e2e.'];

  return extensions.some(ext => filename.endsWith(ext)) ||
         testExtensions.some(ext => filename.includes(ext));
}

function getFileType(filename: string): 'source' | 'test' | 'config' | 'documentation' {
  if (filename.includes('.test.') || filename.includes('.spec.') || filename.includes('.e2e.')) {
    return 'test';
  }
  if (filename.includes('config') || filename.endsWith('.config.js') || filename.endsWith('.config.ts')) {
    return 'config';
  }
  if (filename.endsWith('.md') || filename.endsWith('.txt') || filename.endsWith('.doc')) {
    return 'documentation';
  }
  return 'source';
}

function calculateFileRelevance(filename: string, filepath: string, searchTerms: string[]): number {
  let relevance = 0;
  const lowerFilename = filename.toLowerCase();
  const lowerFilepath = filepath.toLowerCase();

  for (const term of searchTerms) {
    if (lowerFilename.includes(term)) {
      relevance += 0.5;
    }
    if (lowerFilepath.includes(term)) {
      relevance += 0.3;
    }
  }

  return Math.min(relevance, 1.0);
}

function calculateContentRelevance(content: string, searchTerms: string[]): number {
  let relevance = 0;
  const lowerContent = content.toLowerCase();
  const contentLength = content.length;

  for (const term of searchTerms) {
    const matches = (lowerContent.match(new RegExp(term, 'g')) || []).length;
    relevance += (matches / contentLength) * 1000; // Normalize by content length
  }

  return Math.min(relevance, 1.0);
}

function extractFunctions(content: string, filename: string): string[] {
  const functions: string[] = [];

  if (filename.endsWith('.ts') || filename.endsWith('.tsx') || filename.endsWith('.js') || filename.endsWith('.jsx')) {
    // Extract function declarations and arrow functions
    const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*:\s*(?:async\s+)?\()/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const funcName = match[1] || match[2] || match[3];
      if (funcName && !functions.includes(funcName)) {
        functions.push(funcName);
      }
    }
  }

  return functions.slice(0, 10); // Limit to top 10 functions
}

function extractExports(content: string, filename: string): string[] {
  const exports: string[] = [];

  if (filename.endsWith('.ts') || filename.endsWith('.tsx') || filename.endsWith('.js') || filename.endsWith('.jsx')) {
    // Extract exports
    const exportRegex = /export\s+(?:default\s+)?(?:const\s+|function\s+|class\s+)?(\w+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      if (!exports.includes(match[1])) {
        exports.push(match[1]);
      }
    }
  }

  return exports.slice(0, 10); // Limit to top 10 exports
}

async function loadGherkinScenarios(rootDir: string, featureName: string): Promise<any[]> {
  const scenarios: any[] = [];
  const gherkinDir = path.join(rootDir, 'speclinter-tasks', featureName, 'gherkin');

  try {
    if (await directoryExists(gherkinDir)) {
      const files = await fs.readdir(gherkinDir);
      const featureFiles = files.filter(f => f.endsWith('.feature'));

      for (const file of featureFiles) {
        try {
          const content = await fs.readFile(path.join(gherkinDir, file), 'utf-8');
          scenarios.push({
            file,
            content
          });
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  } catch (error) {
    // Gherkin directory doesn't exist or can't be read
  }

  return scenarios;
}

function getFileExtension(filepath: string): string {
  const ext = path.extname(filepath).substring(1);
  const langMap: { [key: string]: string } = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'py': 'python',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby'
  };
  return langMap[ext] || ext;
}

async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function loadProjectContextFromFiles(rootDir: string): Promise<any> {
  const contextDir = path.join(rootDir, '.speclinter', 'context');

  try {
    // Try to read AI-generated context files
    const projectPath = path.join(contextDir, 'project.md');
    const patternsPath = path.join(contextDir, 'patterns.md');
    const architecturePath = path.join(contextDir, 'architecture.md');

    let projectContent = '';
    let patternsContent = '';
    let architectureContent = '';

    try {
      projectContent = await fs.readFile(projectPath, 'utf-8');
    } catch {
      // File doesn't exist, use empty content
    }

    try {
      patternsContent = await fs.readFile(patternsPath, 'utf-8');
    } catch {
      // File doesn't exist, use empty content
    }

    try {
      architectureContent = await fs.readFile(architecturePath, 'utf-8');
    } catch {
      // File doesn't exist, use empty content
    }

    // Parse basic information from the content
    const techStack = extractTechStackFromContent(projectContent);
    const patterns = extractPatternsFromContent(patternsContent);
    const projectStructure = extractProjectStructureFromContent(architectureContent);

    return {
      techStack,
      patterns,
      projectStructure,
      hasContext: projectContent.length > 0 || patternsContent.length > 0 || architectureContent.length > 0
    };
  } catch (error) {
    // Return minimal context if files can't be read
    return {
      techStack: { fallbackStack: 'node' },
      patterns: [],
      projectStructure: { architecture: 'Unknown' },
      hasContext: false
    };
  }
}

function extractTechStackFromContent(content: string): any {
  const techStack: any = {};

  // Extract tech stack from markdown content
  if (content.includes('TypeScript')) techStack.language = 'TypeScript';
  else if (content.includes('JavaScript')) techStack.language = 'JavaScript';
  else if (content.includes('Python')) techStack.language = 'Python';

  if (content.includes('React')) techStack.frontend = 'React';
  else if (content.includes('Vue')) techStack.frontend = 'Vue';
  else if (content.includes('Angular')) techStack.frontend = 'Angular';

  if (content.includes('Node.js')) techStack.backend = 'Node.js';
  else if (content.includes('Express')) techStack.backend = 'Express';

  if (content.includes('Vitest')) techStack.testing = 'Vitest';
  else if (content.includes('Jest')) techStack.testing = 'Jest';

  return techStack;
}

function extractPatternsFromContent(content: string): any[] {
  const patterns: any[] = [];

  // Extract patterns from markdown content using regex
  const patternRegex = /### (.+?) \(Confidence: (\d+)%\)\s*([^#]*?)(?=###|$)/gs;
  let match;

  while ((match = patternRegex.exec(content)) !== null) {
    const [, name, confidence, description] = match;
    patterns.push({
      name: name.trim(),
      description: description.trim(),
      confidence: parseInt(confidence) / 100,
      example: '' // Could extract code blocks if needed
    });
  }

  return patterns;
}

function extractProjectStructureFromContent(content: string): any {
  const structure: any = { architecture: 'Unknown' };

  if (content.includes('microservices')) structure.architecture = 'Microservices';
  else if (content.includes('monolith')) structure.architecture = 'Monolith';
  else if (content.includes('MCP')) structure.architecture = 'MCP Server';

  return structure;
}

/**
 * AI-leveraged implementation validation (Step 2: Process)
 * Process AI validation analysis and provide comprehensive results
 */
export async function handleValidateImplementationProcess(args: any) {
  const { analysis, feature_name, project_root } = args;

  if (!analysis) {
    return {
      success: false,
      error: 'AI validation analysis is required'
    };
  }

  if (!feature_name) {
    return {
      success: false,
      error: 'Feature name is required'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    // Validate AI analysis against schema
    const validatedAnalysis = AIFeatureValidationSchema.parse(analysis);

    // Store validation results in database
    const storage = await StorageManager.createInitializedStorage(rootDir);
    await storage.updateValidationResults(feature_name, validatedAnalysis);

    // Update task statuses based on AI validation if they differ significantly
    for (const taskValidation of validatedAnalysis.taskValidations) {
      const currentTask = await storage.getTask(feature_name, taskValidation.taskId);

      if (currentTask) {
        // Auto-update task status based on AI assessment (with confidence threshold)
        if (taskValidation.implementationStatus === 'fully_implemented' &&
            taskValidation.qualityScore >= 80 &&
            currentTask.status !== 'completed') {

          await storage.updateTaskStatus(
            feature_name,
            taskValidation.taskId,
            'completed',
            `Auto-updated based on AI validation (Quality Score: ${taskValidation.qualityScore})`
          );
        } else if (taskValidation.implementationStatus === 'not_implemented' &&
                   currentTask.status === 'completed') {

          await storage.updateTaskStatus(
            feature_name,
            taskValidation.taskId,
            'in_progress',
            `Reverted based on AI validation - implementation not found`
          );
        }
      }
    }

    // Generate summary insights
    const summary = generateValidationSummary(validatedAnalysis);

    return {
      success: true,
      feature_name,
      project_root: rootDir,
      validation_results: {
        overall_status: validatedAnalysis.overallStatus,
        completion_percentage: validatedAnalysis.completionPercentage,
        quality_score: validatedAnalysis.qualityScore,
        tasks_validated: validatedAnalysis.taskValidations.length,
        tasks_implemented: validatedAnalysis.taskValidations.filter(t =>
          t.implementationStatus === 'fully_implemented' ||
          t.implementationStatus === 'partially_implemented'
        ).length,
        critical_issues: validatedAnalysis.taskValidations.flatMap(t =>
          t.codeQualityIssues.filter(issue => issue.severity === 'critical')
        ).length,
        security_concerns: validatedAnalysis.securityConsiderations.filter(s =>
          s.status === 'vulnerable'
        ).length
      },
      task_details: validatedAnalysis.taskValidations.map(task => ({
        task_id: task.taskId,
        title: task.title,
        status: task.implementationStatus,
        quality_score: task.qualityScore,
        files: task.implementationFiles,
        issues: task.codeQualityIssues.length,
        recommendations: task.recommendations.length
      })),
      architectural_assessment: validatedAnalysis.architecturalAlignment,
      test_coverage: validatedAnalysis.testCoverage,
      security_assessment: validatedAnalysis.securityConsiderations,
      performance_assessment: validatedAnalysis.performanceConsiderations,
      next_steps: validatedAnalysis.nextSteps.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }),
      ai_insights: validatedAnalysis.aiInsights,
      summary,
      recommendations: [
        ...summary.immediate_actions,
        'Review detailed task validations for specific implementation guidance',
        'Address critical and high-priority issues first',
        'Consider architectural recommendations for long-term maintainability'
      ]
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        error: 'AI validation response does not match expected schema',
        validation_errors: error.message,
        project_root: rootDir
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

function generateValidationSummary(validation: any): any {
  const totalTasks = validation.taskValidations.length;
  const implementedTasks = validation.taskValidations.filter((t: any) =>
    t.implementationStatus === 'fully_implemented'
  ).length;
  const partiallyImplementedTasks = validation.taskValidations.filter((t: any) =>
    t.implementationStatus === 'partially_implemented'
  ).length;

  const criticalIssues = validation.taskValidations.flatMap((t: any) =>
    t.codeQualityIssues.filter((issue: any) => issue.severity === 'critical')
  );

  const highPriorityNextSteps = validation.nextSteps.filter((step: any) =>
    step.priority === 'critical' || step.priority === 'high'
  );

  const immediateActions = [];

  if (criticalIssues.length > 0) {
    immediateActions.push(`Address ${criticalIssues.length} critical code quality issues`);
  }

  if (validation.securityConsiderations.some((s: any) => s.status === 'vulnerable')) {
    immediateActions.push('Fix security vulnerabilities identified');
  }

  if (validation.testCoverage.coverage < 70) {
    immediateActions.push('Improve test coverage (currently below 70%)');
  }

  if (partiallyImplementedTasks > 0) {
    immediateActions.push(`Complete ${partiallyImplementedTasks} partially implemented tasks`);
  }

  return {
    implementation_progress: `${implementedTasks}/${totalTasks} tasks fully implemented`,
    quality_assessment: validation.qualityScore >= 80 ? 'Good' :
                       validation.qualityScore >= 60 ? 'Fair' : 'Needs Improvement',
    critical_issues_count: criticalIssues.length,
    security_status: validation.securityConsiderations.every((s: any) => s.status === 'secure') ?
                    'Secure' : 'Has Concerns',
    test_coverage_status: validation.testCoverage.coverage >= 80 ? 'Good' :
                         validation.testCoverage.coverage >= 60 ? 'Fair' : 'Poor',
    immediate_actions: immediateActions.length > 0 ? immediateActions : ['Continue with planned development'],
    overall_recommendation: validation.completionPercentage >= 90 ?
                           'Feature is ready for production' :
                           validation.completionPercentage >= 70 ?
                           'Feature needs minor improvements' :
                           'Feature requires significant work'
  };
}

/**
 * Step 1: Prepare AI Gherkin scenario generation
 */
export async function handleGenerateGherkinPrepare(args: any) {
  const {
    task,
    feature_name,
    project_root
  } = args;

  if (!task || !feature_name) {
    return {
      success: false,
      error: 'Task and feature_name are required'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    // Load project context
    const projectContext = await loadProjectContextFromFiles(rootDir);

    // Get configuration for testing framework
    const storage = await StorageManager.createInitializedStorage(rootDir);
    const config = await storage.getConfig();

    // Format acceptance criteria for prompt
    const acceptanceCriteriaText = Array.isArray(task.acceptanceCriteria)
      ? task.acceptanceCriteria.map((criteria: string, index: number) => `${index + 1}. ${criteria}`).join('\n')
      : 'No specific acceptance criteria provided';

    // Format tech stack information
    const techStackText = projectContext.techStack
      ? `Primary: ${projectContext.techStack.primary || 'Unknown'}, Framework: ${projectContext.techStack.framework || 'Unknown'}`
      : 'Tech stack not detected';

    // Format code patterns
    const codePatternsText = projectContext.patterns && projectContext.patterns.length > 0
      ? projectContext.patterns.map((p: any) => `- ${p.name}: ${p.description}`).join('\n')
      : 'No specific code patterns detected';

    // Generate comprehensive AI prompt
    const gherkinPrompt = AIPromptTemplates.gherkinGeneration
      .replace('{taskTitle}', task.title || 'Unknown Task')
      .replace('{taskSummary}', task.summary || 'No summary provided')
      .replace('{implementation}', task.implementation || 'No implementation details provided')
      .replace('{acceptanceCriteria}', acceptanceCriteriaText)
      .replace('{techStack}', techStackText)
      .replace('{testFramework}', config.generation.testFramework || 'vitest')
      .replace('{codePatterns}', codePatternsText)
      .replace('{projectStructure}', projectContext.projectStructure?.architecture || 'Unknown architecture');

    return {
      success: true,
      action: 'ai_analysis_required',
      task_id: task.id,
      feature_name,
      project_root: rootDir,
      analysis_prompt: gherkinPrompt,
      follow_up_tool: 'process_gherkin_analysis',
      schema: 'AIGherkinAnalysisSchema',
      project_context: projectContext,
      next_steps: [
        'AI will generate comprehensive Gherkin scenarios',
        'Scenarios will be validated and formatted',
        'Generated scenarios will replace generic templates'
      ]
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

/**
 * Step 2: Process AI Gherkin analysis and generate scenario files
 */
export async function handleProcessGherkinAnalysis(args: any) {
  const {
    analysis,
    task_id,
    feature_name,
    project_root
  } = args;

  if (!analysis || !task_id || !feature_name) {
    return {
      success: false,
      error: 'Analysis, task_id, and feature_name are required'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    // Validate AI analysis against schema
    const validatedAnalysis = AIGherkinAnalysisSchema.parse(analysis);

    // Generate Gherkin content from validated analysis
    const gherkinContent = formatGherkinFromAnalysis(validatedAnalysis);

    // Get storage and config
    const storage = await StorageManager.createInitializedStorage(rootDir);
    const config = await storage.getConfig();

    // Determine file path
    const tasksDir = path.join(rootDir, config.storage.tasksDir);
    const featureDir = path.join(tasksDir, feature_name);
    const gherkinDir = path.join(featureDir, 'gherkin');

    // Ensure gherkin directory exists
    await fs.mkdir(gherkinDir, { recursive: true });

    // Generate filename from task
    const filename = `${task_id.replace('task_', '')}_${validatedAnalysis.feature.title.toLowerCase().replace(/\s+/g, '_')}.feature`;
    const filePath = path.join(gherkinDir, filename);

    // Write the generated Gherkin file
    await fs.writeFile(filePath, gherkinContent);

    return {
      success: true,
      task_id,
      feature_name,
      project_root: rootDir,
      gherkin_file: filePath,
      scenario_count: validatedAnalysis.feature.scenarios.length,
      quality_metrics: validatedAnalysis.qualityMetrics,
      automation_readiness: validatedAnalysis.automationReadiness,
      ai_confidence: validatedAnalysis.aiInsights.confidence,
      next_steps: [
        `Generated ${validatedAnalysis.feature.scenarios.length} specific scenarios`,
        `Coverage score: ${validatedAnalysis.qualityMetrics.coverageScore}/100`,
        `Automation readiness: ${validatedAnalysis.automationReadiness.score}/100`,
        'Review scenarios and customize as needed'
      ]
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        error: 'AI Gherkin analysis response does not match expected schema',
        validation_errors: error.message,
        project_root: rootDir
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

// Helper function to format Gherkin content from AI analysis
function formatGherkinFromAnalysis(analysis: any): string {
  const feature = analysis.feature;
  let gherkinContent = `Feature: ${feature.title}\n`;

  if (feature.description) {
    gherkinContent += `  ${feature.description}\n`;
  }

  gherkinContent += '\n';

  // Add background if present
  if (feature.background && feature.background.length > 0) {
    gherkinContent += '  Background:\n';
    feature.background.forEach((step: any) => {
      gherkinContent += `    ${step.type.charAt(0).toUpperCase() + step.type.slice(1)} ${step.text}\n`;
    });
    gherkinContent += '\n';
  }

  // Add scenarios
  feature.scenarios.forEach((scenario: any, index: number) => {
    if (index > 0) gherkinContent += '\n';

    // Add tags if present
    if (scenario.tags && scenario.tags.length > 0) {
      gherkinContent += `  ${scenario.tags.map((tag: string) => `@${tag}`).join(' ')}\n`;
    }

    gherkinContent += `  Scenario: ${scenario.title}\n`;

    if (scenario.description) {
      gherkinContent += `    ${scenario.description}\n`;
    }

    // Add steps
    scenario.steps.forEach((step: any) => {
      gherkinContent += `    ${step.type.charAt(0).toUpperCase() + step.type.slice(1)} ${step.text}\n`;
    });

    // Add examples if present
    if (scenario.examples && scenario.examples.length > 0) {
      gherkinContent += '\n    Examples:\n';
      scenario.examples.forEach((example: any) => {
        gherkinContent += `      | ${example.description} |\n`;
        Object.entries(example.data).forEach(([key, value]) => {
          gherkinContent += `      | ${key} | ${value} |\n`;
        });
      });
    }
  });

  // Add testing notes as comments
  if (feature.testingNotes) {
    gherkinContent += '\n\n# Testing Notes:\n';
    gherkinContent += `# ${feature.testingNotes}\n`;
  }

  return gherkinContent;
}

/**
 * AI-Powered Spec Quality Analysis Tools
 * These replace the legacy regex-based parser with intelligent semantic analysis
 */

/**
 * Step 1: Prepare AI-powered spec quality analysis
 */
export async function handleAnalyzeSpecQuality(args: any) {
  const {
    spec,
    feature_name,
    context,
    project_root,
    analysis_depth = 'standard'
  } = args;

  if (!spec || !feature_name) {
    return {
      success: false,
      error: 'Specification and feature name are required'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    // Load project context for enhanced analysis
    const storage = await StorageManager.createInitializedStorage(rootDir);
    const config = await storage.getConfig();
    const projectContext = await storage.loadProjectContext();

    // Build context for AI analysis
    const techStack = projectContext?.stack ?
      Object.entries(projectContext.stack).map(([key, value]) => `${key}: ${value}`).join(', ') :
      config.context.fallbackStack;

    const codePatterns = projectContext?.patterns && projectContext.patterns.length > 0 ?
      projectContext.patterns.map(p => `${p.name}: ${p.description}`).join('\n') :
      'No specific patterns detected';

    const architecture = 'Unknown';

    // Create comprehensive analysis prompt
    const analysisPrompt = AIPromptTemplates.specQualityAnalysis
      .replace('{specification}', spec)
      .replace('{projectContext}', context || 'No additional context provided')
      .replace('{techStack}', techStack)
      .replace('{codePatterns}', codePatterns)
      .replace('{architecture}', architecture)
      .replace('{teamLevel}', 'standard'); // Could be configurable

    return {
      success: true,
      action: 'ai_analysis_required',
      feature_name,
      project_root: rootDir,
      analysis_prompt: analysisPrompt,
      follow_up_tool: 'process_spec_quality_analysis',
      schema: 'AISpecQualityAnalysisSchema',
      analysis_depth,
      project_context: projectContext,
      next_steps: [
        'AI will perform semantic quality analysis',
        'Quality dimensions will be evaluated (clarity, completeness, testability, feasibility, business value)',
        'Issues will be identified with actionable suggestions',
        'Strengths and improvements will be highlighted'
      ]
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

/**
 * Step 2: Process AI spec quality analysis results
 */
export async function handleProcessSpecQualityAnalysis(args: any) {
  const {
    analysis,
    feature_name,
    project_root,
    analysis_depth = 'standard'
  } = args;

  if (!analysis) {
    return {
      success: false,
      error: 'No analysis data provided'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    // Validate AI analysis against schema
    const validatedAnalysis = AISpecQualityAnalysisSchema.parse(analysis);

    // Check if analysis meets confidence threshold using standardized config management
    const confidenceValidation = await ConfigManager.validateConfidenceThreshold(
      validatedAnalysis.aiInsights.confidence,
      rootDir,
      'spec quality analysis'
    );

    if (!confidenceValidation.success) {
      return {
        ...createErrorResponse(
          new Error(confidenceValidation.error || 'Confidence threshold validation failed'),
          'confidence_validation',
          'configuration'
        ),
        project_root: rootDir,
        suggestions: confidenceValidation.suggestions
      };
    }

    return {
      success: true,
      feature_name,
      project_root: rootDir,
      quality_analysis: {
        overallScore: validatedAnalysis.overallScore,
        grade: validatedAnalysis.grade,
        qualityDimensions: validatedAnalysis.qualityDimensions,
        issueCount: validatedAnalysis.semanticIssues.length,
        strengthCount: validatedAnalysis.strengths.length,
        improvementCount: validatedAnalysis.improvements.length
      },
      semantic_issues: validatedAnalysis.semanticIssues.map(issue => ({
        type: issue.type,
        severity: issue.severity,
        description: issue.description,
        suggestion: issue.suggestion,
        confidence: issue.confidence
      })),
      strengths: validatedAnalysis.strengths,
      improvements: validatedAnalysis.improvements,
      ai_insights: validatedAnalysis.aiInsights,
      next_steps: [
        'Use quality analysis for task generation',
        'Address high-priority improvements before implementation',
        'Leverage identified strengths in development approach'
      ]
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        error: 'AI analysis response does not match expected schema',
        validation_errors: error.message,
        project_root: rootDir
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

/**
 * Step 1: Prepare AI-powered task generation
 */
export async function handleGenerateTasksFromSpec(args: any) {
  const {
    spec,
    feature_name,
    quality_analysis,
    context,
    project_root,
    task_complexity = 'standard'
  } = args;

  if (!spec || !feature_name) {
    return {
      success: false,
      error: 'Specification and feature name are required'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    // Load project context for task generation
    const storage = await StorageManager.createInitializedStorage(rootDir);
    const config = await storage.getConfig();
    const projectContext = await storage.loadProjectContext();

    // Build enhanced context for task generation
    const techStack = projectContext?.stack ?
      Object.entries(projectContext.stack).map(([key, value]) => `${key}: ${value}`).join(', ') :
      config.context.fallbackStack;

    const codePatterns = projectContext?.patterns && projectContext.patterns.length > 0 ?
      projectContext.patterns.map(p => `${p.name}: ${p.description}`).join('\n') :
      'No specific patterns detected';

    const architecture = 'Unknown';
    const projectStructure = 'Unknown organization';

    // Format quality analysis for context
    const qualityContext = quality_analysis ?
      `Quality Score: ${quality_analysis.overallScore}/100
Issues Found: ${quality_analysis.issueCount}
Strengths: ${quality_analysis.strengthCount}
Key Issues: ${quality_analysis.semantic_issues?.slice(0, 3).map((i: any) => i.description).join('; ') || 'None'}` :
      'No quality analysis provided';

    // Create comprehensive task generation prompt
    const taskPrompt = AIPromptTemplates.taskGeneration
      .replace('{specification}', spec)
      .replace('{qualityAnalysis}', qualityContext)
      .replace('{projectContext}', context || 'No additional context provided')
      .replace('{techStack}', techStack)
      .replace('{testFramework}', config.generation.testFramework)
      .replace('{codePatterns}', codePatterns)
      .replace('{architecture}', architecture)
      .replace('{projectStructure}', projectStructure);

    return {
      success: true,
      action: 'ai_analysis_required',
      feature_name,
      project_root: rootDir,
      analysis_prompt: taskPrompt,
      follow_up_tool: 'process_task_generation',
      schema: 'AITaskGenerationSchema',
      task_complexity,
      project_context: projectContext,
      next_steps: [
        'AI will generate comprehensive task breakdown',
        'Tasks will include implementation guidance and acceptance criteria',
        'Dependencies and relationships will be identified',
        'Testing strategy will be defined for each task'
      ]
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

/**
 * Step 2: Process AI task generation results
 */
export async function handleProcessTaskGeneration(args: any) {
  const {
    analysis,
    feature_name,
    project_root,
    task_complexity = 'standard'
  } = args;

  if (!analysis) {
    return {
      success: false,
      error: 'No analysis data provided'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    // Validate AI analysis against schema
    const validatedAnalysis = AITaskGenerationSchema.parse(analysis);

    // Check quality metrics using standardized config management
    const qualityValidation = await ConfigManager.validateQualityThreshold(
      validatedAnalysis.qualityMetrics.coverageScore,
      rootDir,
      'task generation'
    );

    if (!qualityValidation.success) {
      return {
        ...createErrorResponse(
          new Error(qualityValidation.error || 'Quality threshold validation failed'),
          'quality_validation',
          'configuration'
        ),
        project_root: rootDir,
        suggestions: qualityValidation.suggestions
      };
    }

    // Convert AI tasks to SpecLinter format
    const tasks = validatedAnalysis.tasks.map((task, index) => ({
      id: `task_${String(index + 1).padStart(2, '0')}`,
      title: task.title,
      slug: task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      summary: task.summary,
      implementation: `${task.implementation.approach}\n\nTechnical Steps:\n${task.implementation.technicalSteps.map(step => `- ${step}`).join('\n')}\n\nFiles: ${task.implementation.fileLocations.join(', ')}`,
      status: 'not_started' as const,
      statusEmoji: '⏳',
      featureName: feature_name,
      acceptanceCriteria: task.acceptanceCriteria.map(ac => ac.criteria),
      testFile: `${task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.feature`,
      coverageTarget: '90%',
      notes: `Business Value: ${task.businessValue.userImpact}\nComplexity: ${task.estimatedEffort.complexity}\nRisks: ${task.implementation.riskFactors.join('; ')}`,
      relevantPatterns: task.implementation.codePatterns.map(pattern => ({
        name: pattern,
        anchor: pattern.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }))
    }));

    return {
      success: true,
      feature_name,
      project_root: rootDir,
      tasks,
      task_generation: {
        taskCount: validatedAnalysis.qualityMetrics.taskCount,
        averageComplexity: validatedAnalysis.qualityMetrics.averageComplexity,
        coverageScore: validatedAnalysis.qualityMetrics.coverageScore,
        actionabilityScore: validatedAnalysis.qualityMetrics.actionabilityScore,
        testabilityScore: validatedAnalysis.qualityMetrics.testabilityScore
      },
      implementation_strategy: validatedAnalysis.implementationStrategy,
      task_relationships: validatedAnalysis.taskRelationships,
      next_steps: [
        'Tasks are ready for implementation',
        'Review task dependencies and relationships',
        'Consider implementation strategy phases',
        'Generate Gherkin scenarios for testing'
      ]
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        error: 'AI analysis response does not match expected schema',
        validation_errors: error.message,
        project_root: rootDir
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

/**
 * Comprehensive AI-Powered Spec Parser Analysis
 * This combines quality analysis and task generation in a single comprehensive analysis
 */

/**
 * Step 1: Prepare comprehensive AI spec parser analysis
 */
export async function handleAnalyzeSpecComprehensive(args: any) {
  const {
    spec,
    feature_name,
    context,
    project_root,
    analysis_depth = 'standard',
    focus_areas = []
  } = args;

  if (!spec || !feature_name) {
    return {
      success: false,
      error: 'Specification and feature name are required'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    // Load comprehensive project context
    const storage = await StorageManager.createInitializedStorage(rootDir);
    const config = await storage.getConfig();
    const projectContext = await storage.loadProjectContext();

    // Build rich context for comprehensive analysis
    const techStack = projectContext?.stack ?
      Object.entries(projectContext.stack).map(([key, value]) => `${key}: ${value}`).join(', ') :
      config.context.fallbackStack;

    const codePatterns = projectContext?.patterns && projectContext.patterns.length > 0 ?
      projectContext.patterns.map(p => `${p.name}: ${p.description}`).join('\n') :
      'No specific patterns detected';

    const architecture = 'Unknown';
    const projectStructure = 'Unknown organization';
    const teamContext = 'Standard development team'; // Could be configurable

    // Create comprehensive analysis prompt
    const analysisPrompt = AIPromptTemplates.specParserAnalysis
      .replace('{specification}', spec)
      .replace('{techStack}', techStack)
      .replace('{architecture}', architecture)
      .replace('{codePatterns}', codePatterns)
      .replace('{projectStructure}', projectStructure)
      .replace('{testFramework}', config.generation.testFramework)
      .replace('{teamContext}', teamContext)
      .replace('{analysisDepth}', analysis_depth)
      .replace('{focusAreas}', focus_areas.join(', ') || 'General analysis');

    return {
      success: true,
      action: 'ai_analysis_required',
      feature_name,
      project_root: rootDir,
      analysis_prompt: analysisPrompt,
      follow_up_tool: 'process_comprehensive_spec_analysis',
      schema: 'AISpecParserAnalysisSchema',
      analysis_depth,
      focus_areas,
      project_context: projectContext,
      next_steps: [
        'AI will perform comprehensive specification analysis',
        'Quality assessment across 5 dimensions',
        'Comprehensive task generation with implementation guidance',
        'Project alignment and business context analysis',
        'Implementation guidance and risk assessment'
      ]
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

/**
 * Step 2: Process comprehensive AI spec parser analysis results
 */
export async function handleProcessComprehensiveSpecAnalysis(args: any) {
  const {
    analysis,
    feature_name,
    project_root,
    analysis_depth = 'standard'
  } = args;

  if (!analysis) {
    return {
      success: false,
      error: 'No analysis data provided'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    // Validate AI analysis against comprehensive schema
    const validatedAnalysis = AISpecParserAnalysisSchema.parse(analysis);

    // Check overall confidence and quality thresholds using standardized config management
    const confidenceValidation = await ConfigManager.validateConfidenceThreshold(
      validatedAnalysis.aiMetadata.modelConfidence,
      rootDir,
      'comprehensive spec analysis'
    );

    if (!confidenceValidation.success) {
      return {
        ...createErrorResponse(
          new Error(confidenceValidation.error || 'Confidence threshold validation failed'),
          'confidence_validation',
          'configuration'
        ),
        project_root: rootDir,
        suggestions: confidenceValidation.suggestions
      };
    }

    const qualityValidation = await ConfigManager.validateQualityThreshold(
      validatedAnalysis.qualityAnalysis.overallScore,
      rootDir,
      'comprehensive spec analysis'
    );

    if (!qualityValidation.success) {
      return {
        ...createErrorResponse(
          new Error(qualityValidation.error || 'Quality threshold validation failed'),
          'quality_validation',
          'configuration'
        ),
        project_root: rootDir,
        suggestions: qualityValidation.suggestions,
        data: {
          quality_issues: validatedAnalysis.qualityAnalysis.semanticIssues.slice(0, 5)
        }
      };
    }

    // Convert AI tasks to SpecLinter format
    const tasks = validatedAnalysis.taskGeneration.tasks.map((task, index) => ({
      id: `task_${String(index + 1).padStart(2, '0')}`,
      title: task.title,
      slug: task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      summary: task.summary,
      implementation: `${task.implementation.approach}\n\nTechnical Steps:\n${task.implementation.technicalSteps.map(step => `- ${step}`).join('\n')}\n\nFiles: ${task.implementation.fileLocations.join(', ')}\n\nRisks: ${task.implementation.riskFactors.join('; ')}`,
      status: 'not_started' as const,
      statusEmoji: '⏳',
      featureName: feature_name,
      acceptanceCriteria: task.acceptanceCriteria.map(ac => ac.criteria),
      testFile: `${task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.feature`,
      coverageTarget: '90%',
      notes: `Business Value: ${task.businessValue.userImpact}\nComplexity: ${task.estimatedEffort.complexity}\nPriority: ${task.businessValue.priority}`,
      relevantPatterns: task.implementation.codePatterns.map(pattern => ({
        name: pattern,
        anchor: pattern.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }))
    }));

    // Create comprehensive parse result
    const parseResult = {
      spec: 'Specification processed by AI analysis', // Placeholder since spec is not passed to process function
      grade: validatedAnalysis.qualityAnalysis.grade,
      score: validatedAnalysis.qualityAnalysis.overallScore,
      tasks,
      improvements: validatedAnalysis.qualityAnalysis.improvements.map(imp => imp.suggestion),
      missingElements: validatedAnalysis.qualityAnalysis.semanticIssues.map(issue => issue.description)
    };

    return {
      success: true,
      feature_name,
      project_root: rootDir,
      parse_result: parseResult,
      comprehensive_analysis: {
        qualityAnalysis: {
          overallScore: validatedAnalysis.qualityAnalysis.overallScore,
          grade: validatedAnalysis.qualityAnalysis.grade,
          qualityDimensions: validatedAnalysis.qualityAnalysis.qualityDimensions,
          issueCount: validatedAnalysis.qualityAnalysis.semanticIssues.length,
          strengthCount: validatedAnalysis.qualityAnalysis.strengths.length
        },
        taskGeneration: {
          taskCount: validatedAnalysis.taskGeneration.qualityMetrics.taskCount,
          coverageScore: validatedAnalysis.taskGeneration.qualityMetrics.coverageScore,
          actionabilityScore: validatedAnalysis.taskGeneration.qualityMetrics.actionabilityScore
        },
        projectAlignment: validatedAnalysis.projectAlignment,
        businessContext: validatedAnalysis.businessContext,
        implementationGuidance: validatedAnalysis.implementationGuidance
      },
      ai_insights: {
        confidence: validatedAnalysis.aiMetadata.modelConfidence,
        analysisDepth: validatedAnalysis.aiMetadata.analysisDepth,
        contextFactors: validatedAnalysis.aiMetadata.contextFactors,
        recommendations: validatedAnalysis.aiMetadata.recommendations
      },
      next_steps: [
        'Comprehensive analysis complete',
        'Tasks ready for implementation',
        'Review business context and alignment',
        'Consider implementation guidance and risk factors',
        'Generate Gherkin scenarios for testing'
      ]
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        success: false,
        error: 'AI analysis response does not match expected schema',
        validation_errors: error.message,
        project_root: rootDir
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

// Export aliases for test compatibility
export const handleAnalyzeCodebaseAI = handleAnalyzeCodebase;
export const handleUpdateContextFilesAI = handleProcessCodebaseAnalysis;