import type { Task } from '../../types/index.js';
import type {
  ComprehensiveGeneratedTask,
  ComprehensiveSpecAnalysis,
  GeneratedTaskAnalysisTask,
  SpecAnalysis,
  TaskMapperResult
} from '../contracts.js';

function createTaskId(index: number): string {
  return `task_${String(index + 1).padStart(2, '0')}`;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function mapPatternAnchors(patterns: string[]): Array<{ name: string; anchor: string }> {
  return patterns.map(pattern => ({
    name: pattern,
    anchor: slugify(pattern)
  }));
}

export function mapSpecAnalysisTask(
  task: SpecAnalysis['tasks'][number],
  featureName: string,
  index: number
): Task {
  return {
    id: createTaskId(index),
    title: task.title,
    slug: slugify(task.title),
    summary: task.summary,
    implementation: task.implementation,
    status: 'not_started',
    statusEmoji: '⏳',
    featureName,
    acceptanceCriteria: task.acceptanceCriteria,
    testFile: `${slugify(task.title)}.feature`,
    coverageTarget: '90%',
    notes: task.testingNotes,
    relevantPatterns: mapPatternAnchors(task.relevantPatterns)
  };
}

function buildImplementationText(task: GeneratedTaskAnalysisTask | ComprehensiveGeneratedTask): string {
  return `${task.implementation.approach}\n\nTechnical Steps:\n${task.implementation.technicalSteps.map(step => `- ${step}`).join('\n')}\n\nFiles: ${task.implementation.fileLocations.join(', ')}`;
}

export function mapGeneratedTask(
  task: GeneratedTaskAnalysisTask | ComprehensiveGeneratedTask,
  featureName: string,
  index: number
): Task {
  return {
    id: createTaskId(index),
    title: task.title,
    slug: slugify(task.title),
    summary: task.summary,
    implementation: buildImplementationText(task),
    status: 'not_started',
    statusEmoji: '⏳',
    featureName,
    acceptanceCriteria: task.acceptanceCriteria.map(item => item.criteria),
    testFile: `${slugify(task.title)}.feature`,
    coverageTarget: '90%',
    notes: `Business Value: ${task.businessValue.userImpact}\nComplexity: ${task.estimatedEffort.complexity}\nRisks: ${task.implementation.riskFactors.join('; ')}`,
    relevantPatterns: mapPatternAnchors(task.implementation.codePatterns)
  };
}

export function mapComprehensiveGeneratedTask(
  task: ComprehensiveGeneratedTask,
  featureName: string,
  index: number
): Task {
  return {
    ...mapGeneratedTask(task, featureName, index),
    implementation: `${buildImplementationText(task)}\n\nRisks: ${task.implementation.riskFactors.join('; ')}`,
    notes: `Business Value: ${task.businessValue.userImpact}\nComplexity: ${task.estimatedEffort.complexity}\nPriority: ${task.businessValue.priority}`
  };
}

export function buildParseResultFromSpecAnalysis(
  sourceSpec: string,
  featureName: string,
  analysis: SpecAnalysis
): TaskMapperResult {
  const tasks = analysis.tasks.map((task, index) => mapSpecAnalysisTask(task, featureName, index));

  return {
    tasks,
    parseResult: {
      spec: sourceSpec,
      grade: analysis.quality.grade,
      score: analysis.quality.score,
      tasks,
      improvements: analysis.quality.improvements,
      missingElements: analysis.quality.issues.map(issue => issue.message)
    }
  };
}

export function buildParseResultFromComprehensiveAnalysis(
  sourceSpec: string,
  featureName: string,
  analysis: ComprehensiveSpecAnalysis
): TaskMapperResult {
  const tasks = analysis.taskGeneration.tasks.map((task, index) =>
    mapComprehensiveGeneratedTask(task, featureName, index)
  );

  return {
    tasks,
    parseResult: {
      spec: sourceSpec,
      grade: analysis.qualityAnalysis.grade,
      score: analysis.qualityAnalysis.overallScore,
      tasks,
      improvements: analysis.qualityAnalysis.improvements.map(improvement => improvement.suggestion),
      missingElements: analysis.qualityAnalysis.semanticIssues.map(issue => issue.description)
    }
  };
}
