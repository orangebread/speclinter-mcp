import { ParseResult, ProjectContext, Task } from '../types/index.js';
import { Config } from '../types/config.js';
import slugify from 'slugify';

interface QualityIssue {
  type: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  points: number;
}

export class SpecParser {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async parse(
    spec: string,
    context?: string,
    projectContext?: ProjectContext | null
  ): Promise<ParseResult> {
    // Analyze spec quality
    const { score, issues } = this.analyzeQuality(spec);

    // Break down into tasks
    const tasks = this.extractTasks(spec, context, projectContext);

    // Apply project patterns if available
    const enhancedTasks = projectContext?.patterns
      ? this.applyPatterns(tasks, projectContext.patterns)
      : tasks;

    // Calculate grade
    const grade = this.scoreToGrade(score);

    // Identify improvements
    const improvements = this.suggestImprovements(spec, issues);

    return {
      spec,
      grade,
      score,
      tasks: enhancedTasks,
      improvements,
      missingElements: issues.map(i => i.message)
    };
  }

  private analyzeQuality(spec: string): { score: number; issues: QualityIssue[] } {
    let score = 100;
    const issues: QualityIssue[] = [];

    // Check for acceptance criteria
    if (!spec.toLowerCase().includes('accept') && !spec.toLowerCase().includes('criteria')) {
      const points = 20;
      score -= points;
      issues.push({
        type: 'missing_acceptance_criteria',
        message: 'No acceptance criteria specified',
        severity: 'high',
        points
      });
    }

    // Check for vague terms
    for (const term of this.config.grading.vagueTerms) {
      if (spec.toLowerCase().includes(term)) {
        const points = 10;
        score -= points;
        issues.push({
          type: 'vague_term',
          message: `Vague term '${term}' - be specific`,
          severity: 'medium',
          points
        });
      }
    }

    // Check length
    const words = spec.split(/\s+/);
    if (words.length < this.config.grading.minWordCount) {
      const points = 15;
      score -= points;
      issues.push({
        type: 'too_brief',
        message: 'Specification too brief - add more detail',
        severity: 'medium',
        points
      });
    }

    // Check for user stories
    const userStoryPhrases = ['as a', 'i want', 'so that'];
    if (this.config.grading.requireUserStory &&
        !userStoryPhrases.some(phrase => spec.toLowerCase().includes(phrase))) {
      const points = 10;
      score -= points;
      issues.push({
        type: 'no_user_story',
        message: 'Consider adding user story format',
        severity: 'low',
        points
      });
    }

    // Check for error handling
    if (!spec.toLowerCase().includes('error') && !spec.toLowerCase().includes('fail')) {
      const points = 15;
      score -= points;
      issues.push({
        type: 'no_error_handling',
        message: 'No error handling scenarios specified',
        severity: 'high',
        points
      });
    }

    return { score: Math.max(0, score), issues };
  }

  private extractTasks(spec: string, context?: string, projectContext?: ProjectContext | null): Task[] {
    const tasks: Task[] = [];

    // Basic task breakdown - in real implementation this would be more sophisticated
    const sentences = spec.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let taskCounter = 1;

    for (const sentence of sentences) {
      if (sentence.trim().length < 10) continue;

      const taskId = `task_${taskCounter.toString().padStart(2, '0')}`;
      const title = this.extractTitle(sentence);
      const slug = slugify(title, { lower: true });

      tasks.push({
        id: taskId,
        title,
        slug,
        summary: sentence.trim(),
        implementation: this.generateImplementation(sentence, projectContext),
        status: 'not_started',
        statusEmoji: '⏳',
        featureName: '', // Will be set by caller
        acceptanceCriteria: this.generateAcceptanceCriteria(sentence),
        testFile: `${slug}.feature`,
        coverageTarget: '90%',
        notes: context || 'Generated from specification',
        relevantPatterns: this.findRelevantPatterns(sentence, projectContext?.patterns)
      });

      taskCounter++;
    }

    // Add common tasks
    tasks.push({
      id: `task_${taskCounter.toString().padStart(2, '0')}`,
      title: 'Write Tests',
      slug: 'write-tests',
      summary: 'Implement comprehensive test coverage for the feature',
      implementation: 'Create unit tests, integration tests, and end-to-end tests',
      status: 'not_started',
      statusEmoji: '⏳',
      featureName: '',
      acceptanceCriteria: [
        'Unit tests cover all functions',
        'Integration tests cover API endpoints',
        'E2E tests cover user workflows',
        'Test coverage >= 90%'
      ],
      testFile: 'testing.feature',
      coverageTarget: '95%',
      notes: 'Focus on edge cases and error scenarios'
    });

    return tasks;
  }

  private extractTitle(sentence: string): string {
    // Extract meaningful title from sentence
    const words = sentence.trim().split(/\s+/).slice(0, 8);
    return words.join(' ').replace(/[^\w\s]/g, '').trim();
  }

  private generateImplementation(sentence: string, projectContext?: ProjectContext | null): string {
    let impl = `Implement: ${sentence.trim()}`;

    if (projectContext?.stack) {
      const stack = Object.entries(projectContext.stack);
      if (stack.length > 0) {
        impl += `\n\nTechnical approach:\n`;
        for (const [key, value] of stack) {
          impl += `- ${key}: ${value}\n`;
        }
      }
    }

    return impl;
  }

  private generateAcceptanceCriteria(sentence: string): string[] {
    const criteria = [
      `Implementation matches specification: "${sentence.trim()}"`,
      'Code follows project standards',
      'Error handling is implemented',
      'Tests pass successfully'
    ];

    // Add specific criteria based on content
    if (sentence.toLowerCase().includes('user')) {
      criteria.push('User experience is intuitive');
    }

    if (sentence.toLowerCase().includes('api') || sentence.toLowerCase().includes('endpoint')) {
      criteria.push('API response time < 200ms');
      criteria.push('Proper HTTP status codes returned');
    }

    if (sentence.toLowerCase().includes('database') || sentence.toLowerCase().includes('data')) {
      criteria.push('Data integrity is maintained');
      criteria.push('Database operations are transactional');
    }

    return criteria;
  }

  private findRelevantPatterns(
    sentence: string,
    patterns?: Array<{name: string, description: string, anchor: string}>
  ): Array<{name: string, anchor: string}> | undefined {
    if (!patterns) return undefined;

    const relevant: Array<{name: string, anchor: string}> = [];

    for (const pattern of patterns) {
      const keywords = pattern.description.toLowerCase().split(/\s+/);
      const sentenceWords = sentence.toLowerCase().split(/\s+/);

      const overlap = keywords.filter(k => sentenceWords.includes(k));
      if (overlap.length > 0) {
        relevant.push({
          name: pattern.name,
          anchor: pattern.anchor
        });
      }
    }

    return relevant.length > 0 ? relevant : undefined;
  }

  private applyPatterns(
    tasks: Task[],
    patterns: Array<{name: string, description: string, anchor: string}>
  ): Task[] {
    return tasks.map(task => ({
      ...task,
      relevantPatterns: this.findRelevantPatterns(task.summary, patterns)
    }));
  }

  private scoreToGrade(score: number): string {
    const thresholds = this.config.grading.gradeThresholds;
    if (score >= 95) return 'A+';
    if (score >= thresholds.A) return 'A';
    if (score >= thresholds.B) return 'B';
    if (score >= thresholds.C) return 'C';
    if (score >= thresholds.D) return 'D';
    return 'F';
  }

  private suggestImprovements(_spec: string, issues: QualityIssue[]): string[] {
    const improvements: string[] = [];

    for (const issue of issues) {
      switch (issue.type) {
        case 'missing_acceptance_criteria':
          improvements.push('Add specific acceptance criteria with measurable outcomes');
          break;
        case 'vague_term':
          improvements.push('Replace vague terms with specific metrics and requirements');
          break;
        case 'too_brief':
          improvements.push('Expand specification with more implementation details');
          break;
        case 'no_user_story':
          improvements.push('Structure as user story: "As a [user], I want [goal] so that [benefit]"');
          break;
        case 'no_error_handling':
          improvements.push('Specify error scenarios and failure handling');
          break;
      }
    }

    return improvements;
  }
}
