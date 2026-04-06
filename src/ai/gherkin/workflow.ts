import { promises as fs } from 'fs';
import path from 'path';
import { StorageManager } from '../../core/storage-manager.js';
import { AIGherkinAnalysisSchema, AIPromptTemplates } from '../../types/ai-schemas.js';
import { resolveProjectRoot } from '../../tools.js';
import { loadProjectContextSnapshot } from '../shared/project-context.js';

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
    const projectContext = await loadProjectContextSnapshot(rootDir);
    const storage = await StorageManager.createInitializedStorage(rootDir);
    const config = await storage.getConfig();

    const acceptanceCriteriaText = Array.isArray(task.acceptanceCriteria)
      ? task.acceptanceCriteria.map((criteria: string, index: number) => `${index + 1}. ${criteria}`).join('\n')
      : 'No specific acceptance criteria provided';

    const techStackText = Object.keys(projectContext.techStack).length > 0
      ? `Primary: ${projectContext.techStack.primary || projectContext.techStack.language || 'Unknown'}, Framework: ${projectContext.techStack.framework || projectContext.techStack.frontend || 'Unknown'}`
      : 'Tech stack not detected';

    const codePatternsText = projectContext.patterns.length > 0
      ? projectContext.patterns.map((pattern) => `- ${pattern.name}: ${pattern.description}`).join('\n')
      : 'No specific code patterns detected';

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
    const validatedAnalysis = AIGherkinAnalysisSchema.parse(analysis);
    const gherkinContent = formatGherkinFromAnalysis(validatedAnalysis);

    const storage = await StorageManager.createInitializedStorage(rootDir);
    const config = await storage.getConfig();

    const tasksDir = path.join(rootDir, config.storage.tasksDir);
    const featureDir = path.join(tasksDir, feature_name);
    const gherkinDir = path.join(featureDir, 'gherkin');

    await fs.mkdir(gherkinDir, { recursive: true });

    const filename = `${task_id.replace('task_', '')}_${validatedAnalysis.feature.title.toLowerCase().replace(/\s+/g, '_')}.feature`;
    const filePath = path.join(gherkinDir, filename);

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

function formatGherkinFromAnalysis(analysis: any): string {
  const feature = analysis.feature;
  let gherkinContent = `Feature: ${feature.title}\n`;

  if (feature.description) {
    gherkinContent += `  ${feature.description}\n`;
  }

  gherkinContent += '\n';

  if (feature.background && feature.background.length > 0) {
    gherkinContent += '  Background:\n';
    feature.background.forEach((step: any) => {
      gherkinContent += `    ${step.type.charAt(0).toUpperCase() + step.type.slice(1)} ${step.text}\n`;
    });
    gherkinContent += '\n';
  }

  feature.scenarios.forEach((scenario: any, index: number) => {
    if (index > 0) {
      gherkinContent += '\n';
    }

    if (scenario.tags && scenario.tags.length > 0) {
      gherkinContent += `  ${scenario.tags.map((tag: string) => `@${tag}`).join(' ')}\n`;
    }

    gherkinContent += `  Scenario: ${scenario.title}\n`;

    if (scenario.description) {
      gherkinContent += `    ${scenario.description}\n`;
    }

    scenario.steps.forEach((step: any) => {
      gherkinContent += `    ${step.type.charAt(0).toUpperCase() + step.type.slice(1)} ${step.text}\n`;
    });

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

  if (feature.testingNotes) {
    gherkinContent += '\n\n# Testing Notes:\n';
    gherkinContent += `# ${feature.testingNotes}\n`;
  }

  return gherkinContent;
}
