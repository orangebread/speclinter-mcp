import { promises as fs } from 'fs';
import path from 'path';
import { StorageManager } from './core/storage-manager.js';
import { ContextUpdater } from './core/context-updater.js';
import { 
  AICodebaseAnalysisSchema, 
  AISpecAnalysisSchema, 
  AISimilarityAnalysisSchema,
  AIPromptTemplates,
  type AICodebaseAnalysis,
  type AISpecAnalysis,
  type AISimilarityAnalysis
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

  async function scanDirectory(dir: string, depth: number = 0): Promise<void> {
    if (depth > 3 || files.length >= maxFiles) return; // Limit depth and file count
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (files.length >= maxFiles) break;
        
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(rootDir, fullPath);
        
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
 * Step 1: Collect codebase files and return AI analysis prompt
 */
export async function handleAnalyzeCodebaseAI(args: any) {
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

    // Create analysis prompt with file context
    const analysisPrompt = `${AIPromptTemplates.codebaseAnalysis}

**Project Context:**
- Root Directory: ${rootDir}
- Analysis Depth: ${analysis_depth}
- Files Collected: ${files.length}
- Source Files: ${filesByType.source.length}
- Config Files: ${filesByType.config.length}
- Test Files: ${filesByType.test.length}
- Documentation Files: ${filesByType.doc.length}

**Files to Analyze:**
${files.map(f => `\n### ${f.path} (${f.type}, ${f.size} bytes)\n\`\`\`\n${f.content}\n\`\`\``).join('\n')}

Please analyze these files and return a comprehensive JSON response matching the AICodebaseAnalysisSchema.`;

    return {
      success: true,
      action: 'ai_analysis_required',
      project_root: rootDir,
      analysis_prompt: analysisPrompt,
      files_analyzed: files.length,
      follow_up_tool: 'update_context_files_ai',
      schema: 'AICodebaseAnalysisSchema',
      next_steps: [
        'AI will analyze the codebase and return structured results',
        'Results will be validated and used to update context files',
        'Updated context will improve future spec parsing and task generation'
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
 * Step 2: Process AI analysis results and update context files
 */
export async function handleUpdateContextFilesAI(args: any) {
  const { analysis, project_root } = args;
  
  if (!analysis) {
    return {
      success: false,
      error: 'No analysis data provided'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    // Validate AI analysis against schema
    const validatedAnalysis = AICodebaseAnalysisSchema.parse(analysis);
    
    // Update SpecLinter context files directly with AI analysis
    const contextUpdater = new ContextUpdater(rootDir);
    const updatedFiles = await contextUpdater.updateContextFilesFromAI(validatedAnalysis);

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
      next_steps: [
        'Review updated context files in .speclinter/context/',
        'Verify AI-detected tech stack and patterns are accurate',
        'Parse specifications to see improved task generation',
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
