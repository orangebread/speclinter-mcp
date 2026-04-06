import { promises as fs } from 'fs';
import path from 'path';
import { StorageManager } from '../../core/storage-manager.js';
import { AIFeatureValidationSchema } from '../../types/ai-schemas.js';
import { resolveProjectRoot } from '../../tools.js';
import { createErrorResponse } from '../../utils/validation.js';
import { loadProjectContextSnapshot } from '../shared/project-context.js';
import type { FeatureValidationAnalysis } from '../contracts.js';

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
    const storage = await StorageManager.createInitializedStorage(rootDir);
    const tasks = await storage.getFeatureTasks(feature_name);

    if (tasks.length === 0) {
      return {
        success: false,
        error: `Feature '${feature_name}' not found. Use speclinter_parse_spec to create it first.`,
        project_root: rootDir
      };
    }

    const featureStatus = await storage.getFeatureStatus(feature_name);
    const projectContext = await loadProjectContextSnapshot(rootDir);
    const featureFiles = await scanFeatureImplementation(rootDir, feature_name, tasks);
    const gherkinScenarios = await loadGherkinScenarios(rootDir, feature_name);

    const validationPrompt = `# AI Implementation Validation Analysis

You are an expert code reviewer analyzing the implementation of a software feature against its specification and acceptance criteria.

## Feature Information
**Feature Name**: ${feature_name}
**Total Tasks**: ${tasks.length}
**Current Status**: ${featureStatus.overallStatus}
**Completion**: ${featureStatus.completedTasks}/${featureStatus.totalTasks} tasks marked complete

## Project Context
**Tech Stack**: ${Object.keys(projectContext.techStack).length > 0 ? JSON.stringify(projectContext.techStack, null, 2) : 'Not available'}
**Architecture**: ${projectContext.projectStructure.architecture}
**Code Patterns**: ${projectContext.patterns.length} patterns detected

## Tasks to Validate
${tasks.map((task, index) => `
### Task ${index + 1}: ${task.title}
**ID**: ${task.id}
**Status**: ${task.status}
**Summary**: ${task.summary}
**Implementation Guidance**: ${task.implementation}

**Acceptance Criteria**:
${task.acceptanceCriteria.map((criteria) => `- ${criteria}`).join('\n')}

**Relevant Patterns**: ${task.relevantPatterns?.map((pattern) => pattern.name).join(', ') || 'None specified'}
`).join('\n')}

## Gherkin Scenarios for Validation
${gherkinScenarios.length > 0 ? gherkinScenarios.map((scenario) => `
**File**: ${scenario.file}
\`\`\`gherkin
${scenario.content}
\`\`\`
`).join('\n') : 'No Gherkin scenarios found'}

## Implementation Files Found
${featureFiles.length > 0 ? featureFiles.map((file) => `
**File**: ${file.path}
**Type**: ${file.type}
**Relevance**: ${Math.round(file.relevance * 100)}%
**Size**: ${file.content.length} characters

\`\`\`${getFileExtension(file.path)}
${file.content.substring(0, 2000)}${file.content.length > 2000 ? '\n... (truncated)' : ''}
\`\`\`
`).join('\n') : 'No implementation files found'}

## Project Code Patterns
${projectContext.patterns.slice(0, 5).map((pattern) => `
**${pattern.name}**
${pattern.description}
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
    const validatedAnalysis: FeatureValidationAnalysis = AIFeatureValidationSchema.parse(analysis);

    const storage = await StorageManager.createInitializedStorage(rootDir);
    await storage.updateValidationResults(feature_name, validatedAnalysis);

    for (const taskValidation of validatedAnalysis.taskValidations) {
      const currentTask = await storage.getTask(feature_name, taskValidation.taskId);

      if (!currentTask) {
        continue;
      }

      if (
        taskValidation.implementationStatus === 'fully_implemented' &&
        taskValidation.qualityScore >= 80 &&
        currentTask.status !== 'completed'
      ) {
        await storage.updateTaskStatus(
          feature_name,
          taskValidation.taskId,
          'completed',
          `Auto-updated based on AI validation (Quality Score: ${taskValidation.qualityScore})`
        );
      } else if (
        taskValidation.implementationStatus === 'not_implemented' &&
        currentTask.status === 'completed'
      ) {
        await storage.updateTaskStatus(
          feature_name,
          taskValidation.taskId,
          'in_progress',
          'Reverted based on AI validation - implementation not found'
        );
      }
    }

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
        tasks_implemented: validatedAnalysis.taskValidations.filter((task) =>
          task.implementationStatus === 'fully_implemented' ||
          task.implementationStatus === 'partially_implemented'
        ).length,
        critical_issues: validatedAnalysis.taskValidations.flatMap((task) =>
          task.codeQualityIssues.filter((issue) => issue.severity === 'critical')
        ).length,
        security_concerns: validatedAnalysis.securityConsiderations.filter((item) =>
          item.status === 'vulnerable'
        ).length
      },
      task_details: validatedAnalysis.taskValidations.map((task) => ({
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

async function scanFeatureImplementation(rootDir: string, featureName: string, tasks: any[]): Promise<any[]> {
  const files: any[] = [];
  const searchTerms = [
    featureName.toLowerCase(),
    ...featureName.split(/[-_]/).map((term) => term.toLowerCase()),
    ...tasks.flatMap((task) => [
      task.title.toLowerCase(),
      task.slug,
      ...task.title.split(/\s+/).map((word: string) => word.toLowerCase())
    ])
  ].filter((term) => term.length > 2);

  const sourceDirs = ['src', 'lib', 'app', 'components', 'pages', 'routes', 'api', 'services'];

  for (const dir of sourceDirs) {
    const dirPath = path.join(rootDir, dir);
    if (await directoryExists(dirPath)) {
      await scanDirectoryForFeature(dirPath, searchTerms, files, rootDir);
    }
  }

  await scanDirectoryForFeature(rootDir, searchTerms, files, rootDir, 1);

  return files.sort((a, b) => b.relevance - a.relevance).slice(0, 20);
}

async function scanDirectoryForFeature(
  dirPath: string,
  searchTerms: string[],
  files: any[],
  rootDir: string,
  maxDepth: number = 3,
  currentDepth: number = 0
): Promise<void> {
  if (currentDepth >= maxDepth) {
    return;
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        await scanDirectoryForFeature(fullPath, searchTerms, files, rootDir, maxDepth, currentDepth + 1);
      } else if (entry.isFile() && isRelevantFile(entry.name)) {
        const relevance = calculateFileRelevance(entry.name, fullPath, searchTerms);

        if (relevance <= 0.1) {
          continue;
        }

        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const contentRelevance = calculateContentRelevance(content, searchTerms);
          const finalRelevance = Math.max(relevance, contentRelevance);

          if (finalRelevance > 0.2) {
            files.push({
              path: path.relative(rootDir, fullPath),
              type: getFileType(entry.name),
              relevance: finalRelevance,
              content: content.length > 5000 ? `${content.substring(0, 5000)}\n... (truncated)` : content,
              patterns: [],
              functions: extractFunctions(content, entry.name),
              exports: extractExports(content, entry.name)
            });
          }
        } catch {
          // Ignore unreadable files.
        }
      }
    }
  } catch {
    // Ignore unreadable directories.
  }
}

function isRelevantFile(filename: string): boolean {
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.cs', '.php', '.rb'];
  const testExtensions = ['.test.', '.spec.', '.e2e.'];

  return extensions.some((ext) => filename.endsWith(ext)) ||
    testExtensions.some((ext) => filename.includes(ext));
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
    relevance += (matches / contentLength) * 1000;
  }

  return Math.min(relevance, 1.0);
}

function extractFunctions(content: string, filename: string): string[] {
  const functions: string[] = [];

  if (filename.endsWith('.ts') || filename.endsWith('.tsx') || filename.endsWith('.js') || filename.endsWith('.jsx')) {
    const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*:\s*(?:async\s+)?\()/g;
    let match: RegExpExecArray | null;
    while ((match = functionRegex.exec(content)) !== null) {
      const funcName = match[1] || match[2] || match[3];
      if (funcName && !functions.includes(funcName)) {
        functions.push(funcName);
      }
    }
  }

  return functions.slice(0, 10);
}

function extractExports(content: string, filename: string): string[] {
  const exports: string[] = [];

  if (filename.endsWith('.ts') || filename.endsWith('.tsx') || filename.endsWith('.js') || filename.endsWith('.jsx')) {
    const exportRegex = /export\s+(?:default\s+)?(?:const\s+|function\s+|class\s+)?(\w+)/g;
    let match: RegExpExecArray | null;
    while ((match = exportRegex.exec(content)) !== null) {
      if (!exports.includes(match[1])) {
        exports.push(match[1]);
      }
    }
  }

  return exports.slice(0, 10);
}

async function loadGherkinScenarios(rootDir: string, featureName: string): Promise<Array<{ file: string; content: string }>> {
  const scenarios: Array<{ file: string; content: string }> = [];
  const gherkinDir = path.join(rootDir, 'speclinter-tasks', featureName, 'gherkin');

  try {
    if (await directoryExists(gherkinDir)) {
      const files = await fs.readdir(gherkinDir);
      const featureFiles = files.filter((file) => file.endsWith('.feature'));

      for (const file of featureFiles) {
        try {
          const content = await fs.readFile(path.join(gherkinDir, file), 'utf-8');
          scenarios.push({ file, content });
        } catch {
          // Ignore unreadable Gherkin files.
        }
      }
    }
  } catch {
    // Ignore missing Gherkin directories.
  }

  return scenarios;
}

function getFileExtension(filepath: string): string {
  const ext = path.extname(filepath).substring(1);
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    go: 'go',
    rs: 'rust',
    java: 'java',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby'
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

function generateValidationSummary(validation: FeatureValidationAnalysis): any {
  const coverage = validation.testCoverage.coverage ?? 0;
  const totalTasks = validation.taskValidations.length;
  const implementedTasks = validation.taskValidations.filter((task) =>
    task.implementationStatus === 'fully_implemented'
  ).length;
  const partiallyImplementedTasks = validation.taskValidations.filter((task) =>
    task.implementationStatus === 'partially_implemented'
  ).length;

  const criticalIssues = validation.taskValidations.flatMap((task) =>
    task.codeQualityIssues.filter((issue) => issue.severity === 'critical')
  );

  const immediateActions: string[] = [];

  if (criticalIssues.length > 0) {
    immediateActions.push(`Address ${criticalIssues.length} critical code quality issues`);
  }

  if (validation.securityConsiderations.some((item) => item.status === 'vulnerable')) {
    immediateActions.push('Fix security vulnerabilities identified');
  }

  if (coverage < 70) {
    immediateActions.push('Improve test coverage (currently below 70%)');
  }

  if (partiallyImplementedTasks > 0) {
    immediateActions.push(`Complete ${partiallyImplementedTasks} partially implemented tasks`);
  }

  return {
    implementation_progress: `${implementedTasks}/${totalTasks} tasks fully implemented`,
    quality_assessment: validation.qualityScore >= 80
      ? 'Good'
      : validation.qualityScore >= 60
        ? 'Fair'
        : 'Needs Improvement',
    critical_issues_count: criticalIssues.length,
    security_status: validation.securityConsiderations.every((item) => item.status === 'secure')
      ? 'Secure'
      : 'Has Concerns',
    test_coverage_status: coverage >= 80
      ? 'Good'
      : coverage >= 60
        ? 'Fair'
        : 'Poor',
    immediate_actions: immediateActions.length > 0 ? immediateActions : ['Continue with planned development'],
    overall_recommendation: validation.completionPercentage >= 90
      ? 'Feature is ready for production'
      : validation.completionPercentage >= 70
        ? 'Feature needs minor improvements'
        : 'Feature requires significant work'
  };
}
