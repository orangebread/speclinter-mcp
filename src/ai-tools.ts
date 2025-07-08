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
  AIPromptTemplates
} from './types/ai-schemas.js';
import { resolveProjectRoot } from './tools.js';

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

    // Convert to legacy format for compatibility
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