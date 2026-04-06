import { ContextUpdater } from '../../core/context-updater.js';
import { StorageManager } from '../../core/storage-manager.js';
import {
  AICodebaseAnalysisSchema,
  AIContextFilesSchema,
  AICodebaseAnalysisWithContextSchema,
  AIPromptTemplates
} from '../../types/ai-schemas.js';
import { resolveProjectRoot } from '../../tools.js';
import { collectRelevantFiles, generateContextFilesFromAnalysis } from './support.js';
import { handleReverseSpecAnalysis, shouldAutoDiscoverFeatures } from './reverse-spec.js';

export async function handleAnalyzeCodebase(args: any) {
  const {
    project_root,
    analysis_depth = 'standard',
    max_files = 50,
    max_file_size = 50000,
    include_reverse_spec,
    feature_discovery_mode = 'features',
    confidence_threshold = 0.7,
    analysis_scope = 'full_codebase'
  } = args;

  const rootDir = await resolveProjectRoot(project_root);

  try {
    const files = await collectRelevantFiles(rootDir, max_files, max_file_size);

    const filesByType = {
      source: files.filter(file => file.type === 'source'),
      config: files.filter(file => file.type === 'config'),
      test: files.filter(file => file.type === 'test'),
      doc: files.filter(file => file.type === 'doc')
    };

    const packageJsonFile = files.find(file => file.path === 'package.json');
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
      } catch {
        packageJsonContext = '\n**PACKAGE.JSON VALIDATION CONTEXT:** Could not parse package.json';
      }
    }

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
${files.map(file => `\n### ${file.path} (${file.type}, ${file.size} bytes)\n\`\`\`\n${file.content}\n\`\`\``).join('\n')}

🎯 **VALIDATION CHECKLIST - VERIFY EACH ITEM:**
□ Tech stack claims match package.json dependencies
□ Test framework matches package.json scripts
□ Entry points identified from package.json main/bin
□ All patterns include specific file locations
□ Architecture claims have concrete evidence

${AIPromptTemplates.contextFileGeneration}

Please provide both the codebase analysis AND complete context files in your response matching AICodebaseAnalysisWithContextSchema.`;

    const storage: any = await StorageManager.createInitializedStorage(rootDir);
    const config = await storage.getConfig();

    const shouldPerformReverseSpec = include_reverse_spec === true ||
      (include_reverse_spec !== false && config.reverseSpec.enabled && await shouldAutoDiscoverFeatures(storage, config));

    if (shouldPerformReverseSpec) {
      return await handleReverseSpecAnalysis({
        project_root,
        analysis_scope: analysis_scope || config.reverseSpec.analysisScope || 'full_codebase',
        confidence_threshold: confidence_threshold || config.reverseSpec.confidenceThreshold,
        feature_discovery_mode: feature_discovery_mode || config.reverseSpec.discoveryMode,
        analysis_depth: analysis_depth || config.reverseSpec.analysisDepth
      });
    }

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

export async function handleProcessCodebaseAnalysis(args: any) {
  const { analysis, contextFiles, project_root } = args;

  if (!analysis) {
    return {
      success: false,
      error: 'Analysis data is required'
    };
  }

  if (!contextFiles && !analysis.analysis && !analysis.contextFiles) {
    return {
      success: false,
      error: 'Both analysis and contextFiles data are required'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    let validatedAnalysis: any;
    let validatedContextFiles: any;

    try {
      if (contextFiles) {
        validatedAnalysis = AICodebaseAnalysisSchema.parse(analysis);
        validatedContextFiles = AIContextFilesSchema.parse(contextFiles);
      } else if (analysis.analysis && analysis.contextFiles) {
        const combined = AICodebaseAnalysisWithContextSchema.parse(analysis);
        validatedAnalysis = combined.analysis;
        validatedContextFiles = combined.contextFiles;
      } else {
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
