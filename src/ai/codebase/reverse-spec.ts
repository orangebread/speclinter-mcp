import { promises as fs } from 'fs';
import path from 'path';
import { AIReverseSpecAnalysisSchema, AIPromptTemplates } from '../../types/ai-schemas.js';
import { resolveProjectRoot } from '../../tools.js';
import { StorageManager } from '../../core/storage-manager.js';
import { collectRelevantFiles } from './support.js';
import type { ReverseEngineeredFeatureRecord, ReverseSpecStateWrite } from '../../types/index.js';

export async function handleReverseSpecAnalysis(args: any) {
  const {
    project_root,
    analysis_scope = 'full_codebase',
    confidence_threshold = 0.7,
    feature_discovery_mode = 'features',
    analysis_depth = 'standard'
  } = args;

  const rootDir = await resolveProjectRoot(project_root);

  try {
    const storage = await StorageManager.createInitializedStorage(rootDir);
    const config = await storage.getConfig();
    const projectContext = await storage.loadProjectContext();

    if (!config.reverseSpec.enabled) {
      return {
        success: false,
        error: 'Reverse specification analysis is disabled in configuration',
        project_root: rootDir
      };
    }

    const files = await collectRelevantFiles(
      rootDir,
      config.reverseSpec.maxFeaturesPerAnalysis * 5,
      100000
    );

    if (files.length === 0) {
      return {
        success: false,
        error: 'No suitable files found for reverse specification analysis',
        project_root: rootDir
      };
    }

    let existingState = null;
    if (config.reverseSpec.incrementalAnalysis && config.reverseSpec.stateTrackingEnabled) {
      existingState = await loadReverseSpecState(storage);
    }

    const filesToAnalyze = filterFilesForAnalysis(files, analysis_scope, existingState);

    const analysisPrompt = generateReverseSpecPrompt({
      projectRoot: rootDir,
      techStack: projectContext?.stack ? JSON.stringify(projectContext.stack) : 'Unknown',
      architecture: 'Unknown',
      analysisScope: analysis_scope,
      confidenceThreshold: confidence_threshold,
      codebaseFiles: filesToAnalyze,
      discoveryMode: feature_discovery_mode,
      analysisDepth: analysis_depth,
      existingFeatures: await getExistingFeatureNames(storage),
      projectContext
    });

    return {
      success: true,
      action: 'ai_analysis_required',
      analysis_prompt: analysisPrompt,
      follow_up_tool: 'process_reverse_spec_analysis',
      schema: 'AIReverseSpecAnalysisSchema',
      context: {
        project_root: rootDir,
        files_analyzed: filesToAnalyze.length,
        analysis_scope,
        confidence_threshold,
        discovery_mode: feature_discovery_mode,
        analysis_depth
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      project_root: rootDir
    };
  }
}

export async function handleProcessReverseSpecAnalysis(args: any) {
  const { analysis, project_root } = args;

  if (!analysis) {
    return {
      success: false,
      error: 'Reverse spec analysis data is required'
    };
  }

  const rootDir = await resolveProjectRoot(project_root);

  try {
    const validatedAnalysis = AIReverseSpecAnalysisSchema.parse(analysis);
    const storage = await StorageManager.createInitializedStorage(rootDir);
    const config = await storage.getConfig();

    const createdFiles: string[] = [];
    const discoveredFeatures: string[] = [];

    for (const feature of validatedAnalysis.discoveredFeatures) {
      if (feature.confidence >= config.reverseSpec.confidenceThreshold) {
        const featureFiles = await createReverseSpecFeature(
          storage,
          feature,
          validatedAnalysis,
          rootDir
        );
        createdFiles.push(...featureFiles);
        discoveredFeatures.push(feature.name);
      }
    }

    if (config.reverseSpec.stateTrackingEnabled) {
      await updateReverseSpecState(storage, validatedAnalysis, args.context);
    }

    return {
      success: true,
      features_discovered: discoveredFeatures.length,
      features_created: discoveredFeatures,
      files_created: createdFiles,
      analysis_summary: {
        total_files_analyzed: validatedAnalysis.codebaseInsights.totalFilesAnalyzed,
        confidence_threshold: validatedAnalysis.confidenceThreshold,
        analysis_scope: validatedAnalysis.analysisScope,
        quality_score: validatedAnalysis.qualityAssessment.overallImplementationQuality
      },
      recommendations: validatedAnalysis.recommendations,
      next_steps: validatedAnalysis.nextSteps,
      project_root: rootDir
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

export async function shouldAutoDiscoverFeatures(storage: { getFeatureCount(): Promise<number> }, config: { reverseSpec: { autoGenerateSpecs: boolean } }): Promise<boolean> {
  try {
    const hasNoFeatures = (await storage.getFeatureCount()) === 0;
    const autoDiscoveryEnabled = config.reverseSpec.autoGenerateSpecs;

    return hasNoFeatures || autoDiscoveryEnabled;
  } catch {
    return true;
  }
}

async function loadReverseSpecState(storage: { getLatestReverseSpecState(): Promise<unknown> }): Promise<unknown> {
  try {
    return await storage.getLatestReverseSpecState();
  } catch {
    return null;
  }
}

function filterFilesForAnalysis(files: any[], analysisScope: string, existingState: any): any[] {
  const limit = 50;
  if (analysisScope && existingState) {
    return files.slice(0, limit);
  }
  return files.slice(0, limit);
}

function generateReverseSpecPrompt(context: any): string {
  const {
    projectRoot,
    techStack,
    architecture,
    analysisScope,
    confidenceThreshold,
    codebaseFiles,
    discoveryMode,
    analysisDepth,
    existingFeatures,
    projectContext
  } = context;

  const filesContent = codebaseFiles.map((file: any) =>
    `**File: ${file.path}**\n\`\`\`${file.type}\n${file.content}\n\`\`\``
  ).join('\n\n');

  const extraContextLines = [
    discoveryMode ? `Discovery Mode: ${discoveryMode}` : null,
    analysisDepth ? `Analysis Depth: ${analysisDepth}` : null,
    Array.isArray(existingFeatures) && existingFeatures.length ? `Existing Features: ${existingFeatures.join(', ')}` : null,
    projectContext ? `Project Context Keys: ${Object.keys(projectContext).join(', ')}` : null
  ].filter(Boolean).join('\n');

  return (
    AIPromptTemplates.reverseSpecAnalysis
      .replace('{projectRoot}', projectRoot)
      .replace('{techStack}', techStack)
      .replace('{architecture}', architecture)
      .replace('{analysisScope}', analysisScope)
      .replace('{confidenceThreshold}', confidenceThreshold.toString())
      .replace('{codebaseFiles}', filesContent)
      .replace('{projectMaturity}', 'Unknown')
      .replace('{teamSize}', 'Unknown')
      .replace('{developmentStage}', 'Unknown')
      .replace('{businessDomain}', 'Unknown')
  ) + '\n' + extraContextLines;
}

async function getExistingFeatureNames(storage: { getFeatureNames(): Promise<string[]> }): Promise<string[]> {
  try {
    return await storage.getFeatureNames();
  } catch {
    return [];
  }
}

async function createReverseSpecFeature(
  storage: {
    saveReverseEngineeredFeature(feature: ReverseEngineeredFeatureRecord): Promise<void>;
    updateActiveFile(featureName: string): Promise<void>;
  },
  feature: any,
  analysis: any,
  rootDir: string
): Promise<string[]> {
  const createdFiles: string[] = [];
  const featureDir = path.join(rootDir, 'speclinter-tasks', feature.name);

  await fs.mkdir(featureDir, { recursive: true });
  await fs.mkdir(path.join(featureDir, 'gherkin'), { recursive: true });

  const reverseSpecContent = generateReverseSpecMarkdown(feature, analysis);
  const reverseSpecPath = path.join(featureDir, 'reverse-spec.md');
  await fs.writeFile(reverseSpecPath, reverseSpecContent);
  createdFiles.push(reverseSpecPath);

  const implementationMap = {
    featureId: feature.name,
    confidence: feature.confidence,
    coreFiles: feature.coreFiles,
    supportingFiles: feature.supportingFiles,
    testFiles: feature.testFiles,
    integrationPoints: feature.integrationPoints
  };
  const mapPath = path.join(featureDir, 'implementation-map.json');
  await fs.writeFile(mapPath, JSON.stringify(implementationMap, null, 2));
  createdFiles.push(mapPath);

  const discoveryMetadata = {
    discoveredAt: new Date().toISOString(),
    analysisDepth: analysis.analysisDepth,
    confidenceScore: feature.confidence,
    businessPurpose: feature.businessPurpose,
    implementationStatus: feature.implementationStatus,
    specificationGap: feature.specificationGap,
    technicalDebt: feature.technicalDebt,
    securityConsiderations: feature.securityConsiderations,
    performanceConsiderations: feature.performanceConsiderations
  };
  const metadataPath = path.join(featureDir, 'discovery-metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(discoveryMetadata, null, 2));
  createdFiles.push(metadataPath);

  const metaPath = path.join(featureDir, 'meta.json');
  await fs.writeFile(metaPath, JSON.stringify({
    featureName: feature.name,
    grade: 'B',
    score: Math.round(feature.confidence * 100),
    taskCount: 0,
    createdAt: new Date().toISOString(),
    sourceType: 'reverse_engineered'
  }, null, 2));
  createdFiles.push(metaPath);

  await storage.saveReverseEngineeredFeature({
    name: feature.name,
    userStory: feature.userStory,
    confidence: feature.confidence,
    implementationMap
  });

  await storage.updateActiveFile(feature.name);
  createdFiles.push(path.join(featureDir, '_active.md'));

  return createdFiles;
}

function generateReverseSpecMarkdown(feature: any, analysis: any): string {
  void analysis;

  return `# ${feature.name.split('-').map((word: string) =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')} Feature

**Discovered**: ${new Date().toISOString().split('T')[0]} | **Confidence**: ${Math.round(feature.confidence * 100)}% | **Status**: ${feature.implementationStatus}

## User Story
${feature.userStory}

## Business Purpose
${feature.businessPurpose}

## Acceptance Criteria
${feature.acceptanceCriteria.map((criteria: string) => `- [x] ${criteria}`).join('\n')}

## Implementation Status
- **Completeness**: ${feature.implementationStatus}
- **Specification Gap**: ${feature.specificationGap ? 'Yes' : 'No'}
- **Core Files**: ${feature.coreFiles.length}
- **Test Coverage**: ${feature.testFiles.length > 0 ? 'Present' : 'Missing'}

## Technical Considerations

### Security
${feature.securityConsiderations.length > 0 ?
  feature.securityConsiderations.map((item: string) => `- ${item}`).join('\n') :
  '- No specific security considerations identified'}

### Performance
${feature.performanceConsiderations.length > 0 ?
  feature.performanceConsiderations.map((item: string) => `- ${item}`).join('\n') :
  '- No specific performance considerations identified'}

### Technical Debt
${feature.technicalDebt.length > 0 ?
  feature.technicalDebt.map((item: string) => `- ${item}`).join('\n') :
  '- No significant technical debt identified'}

## Suggested Improvements
${feature.suggestedImprovements.map((improvement: string) => `- ${improvement}`).join('\n')}

## Integration Points
${feature.integrationPoints.length > 0 ?
  feature.integrationPoints.map((point: any) => `- **${point.feature}** (${point.relationship}): ${point.description}`).join('\n') :
  '- No integration points identified'}

---
*Reverse-engineered from existing implementation*
`;
}

async function updateReverseSpecState(
  storage: { appendReverseSpecState(state: ReverseSpecStateWrite): Promise<void> },
  analysis: any,
  context: any
): Promise<void> {
  try {
    await storage.appendReverseSpecState({
      discoveredFeatures: analysis.discoveredFeatures.map((feature: any) => feature.name),
      analysisScope: (analysis.analysisScope ?? context?.analysis_scope ?? 'full_codebase'),
      confidenceThreshold: (analysis.confidenceThreshold ?? context?.confidence_threshold ?? 0.7),
      analysisDepth: (analysis.analysisDepth ?? context?.analysis_depth ?? 'standard'),
      totalFilesAnalyzed: analysis.codebaseInsights.totalFilesAnalyzed,
      featuresDiscovered: analysis.discoveredFeatures.length,
      analyzedFiles: {},
      lastAnalysis: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Failed to update reverse spec state:', error);
  }
}
