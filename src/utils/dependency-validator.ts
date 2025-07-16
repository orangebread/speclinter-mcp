/**
 * Tool dependency validation utilities
 * Ensures proper tool execution order and prerequisites
 */

import { promises as fs } from 'fs';
import path from 'path';
import { ValidationResult } from './validation.js';
import { resolveProjectRoot } from '../tools.js';

/**
 * Tool dependency requirements
 */
export interface ToolDependencies {
  requiresInit: boolean;
  requiresCodebaseAnalysis: boolean;
  requiresFeature: boolean;
  recommendedPrecedingTools?: string[];
  conflictingTools?: string[];
}

/**
 * Tool dependency registry
 */
export const TOOL_DEPENDENCIES: Record<string, ToolDependencies> = {
  'speclinter_init_project': {
    requiresInit: false,
    requiresCodebaseAnalysis: false,
    requiresFeature: false
  },
  'speclinter_analyze_codebase': {
    requiresInit: true,
    requiresCodebaseAnalysis: false,
    requiresFeature: false,
    recommendedPrecedingTools: ['speclinter_init_project']
  },
  'speclinter_parse_spec': {
    requiresInit: true,
    requiresCodebaseAnalysis: false,
    requiresFeature: false,
    recommendedPrecedingTools: ['speclinter_init_project', 'speclinter_analyze_codebase']
  },
  'speclinter_find_similar': {
    requiresInit: true,
    requiresCodebaseAnalysis: false,
    requiresFeature: false,
    recommendedPrecedingTools: ['speclinter_init_project']
  },
  'speclinter_get_task_status': {
    requiresInit: true,
    requiresCodebaseAnalysis: false,
    requiresFeature: true,
    recommendedPrecedingTools: ['speclinter_parse_spec']
  },
  'speclinter_update_task_status': {
    requiresInit: true,
    requiresCodebaseAnalysis: false,
    requiresFeature: true,
    recommendedPrecedingTools: ['speclinter_parse_spec']
  },
  'speclinter_validate_implementation': {
    requiresInit: true,
    requiresCodebaseAnalysis: true,
    requiresFeature: true,
    recommendedPrecedingTools: ['speclinter_analyze_codebase', 'speclinter_parse_spec']
  },
  'speclinter_generate_gherkin': {
    requiresInit: true,
    requiresCodebaseAnalysis: false,
    requiresFeature: true,
    recommendedPrecedingTools: ['speclinter_parse_spec']
  },
  'speclinter_analyze_spec_quality': {
    requiresInit: true,
    requiresCodebaseAnalysis: false,
    requiresFeature: false,
    recommendedPrecedingTools: ['speclinter_init_project']
  },
  'speclinter_generate_tasks': {
    requiresInit: true,
    requiresCodebaseAnalysis: false,
    requiresFeature: false,
    recommendedPrecedingTools: ['speclinter_init_project', 'speclinter_analyze_codebase']
  },
  'speclinter_analyze_spec_comprehensive': {
    requiresInit: true,
    requiresCodebaseAnalysis: false,
    requiresFeature: false,
    recommendedPrecedingTools: ['speclinter_init_project', 'speclinter_analyze_codebase']
  }
};

/**
 * Validates tool dependencies before execution
 */
export async function validateToolDependencies(
  toolName: string,
  args: any
): Promise<ValidationResult> {
  const dependencies = TOOL_DEPENDENCIES[toolName];
  
  if (!dependencies) {
    return {
      success: false,
      error: `Unknown tool: ${toolName}`,
      suggestions: [
        'Check tool name spelling',
        'Ensure tool is properly registered',
        'Review available tools documentation'
      ]
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  try {
    const projectRoot = await resolveProjectRoot(args.project_root);

    // Check initialization requirement
    if (dependencies.requiresInit) {
      const initCheck = await checkInitialization(projectRoot);
      if (!initCheck.success) {
        errors.push('Project not initialized');
        suggestions.push('Run speclinter_init_project first');
      }
    }

    // Check codebase analysis requirement
    if (dependencies.requiresCodebaseAnalysis) {
      const codebaseCheck = await checkCodebaseAnalysis(projectRoot);
      if (!codebaseCheck.success) {
        errors.push('Codebase analysis not performed');
        suggestions.push('Run speclinter_analyze_codebase first');
      }
    }

    // Check feature requirement
    if (dependencies.requiresFeature && args.feature_name) {
      const featureCheck = await checkFeatureExists(projectRoot, args.feature_name);
      if (!featureCheck.success) {
        errors.push(`Feature '${args.feature_name}' not found`);
        suggestions.push('Run speclinter_parse_spec to create the feature first');
      }
    }

    // Check recommended preceding tools
    if (dependencies.recommendedPrecedingTools) {
      const precedingCheck = await checkRecommendedTools(projectRoot, dependencies.recommendedPrecedingTools);
      if (precedingCheck.warnings.length > 0) {
        warnings.push(...precedingCheck.warnings);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: 'Tool dependency requirements not met',
        data: { errors, warnings },
        suggestions
      };
    }

    return {
      success: true,
      data: { warnings }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Dependency validation failed',
      suggestions: [
        'Check project root path',
        'Ensure proper file permissions',
        'Verify project structure'
      ]
    };
  }
}

/**
 * Checks if project is initialized
 */
async function checkInitialization(projectRoot: string): Promise<ValidationResult> {
  try {
    const speclinterDir = path.join(projectRoot, '.speclinter');
    const configPath = path.join(speclinterDir, 'config.json');
    
    await fs.access(speclinterDir);
    await fs.access(configPath);
    
    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Project not initialized'
    };
  }
}

/**
 * Checks if codebase analysis has been performed
 */
async function checkCodebaseAnalysis(projectRoot: string): Promise<ValidationResult> {
  try {
    const contextDir = path.join(projectRoot, '.speclinter', 'context');
    const projectMd = path.join(contextDir, 'project.md');
    const patternsMd = path.join(contextDir, 'patterns.md');
    
    await fs.access(projectMd);
    await fs.access(patternsMd);
    
    // Check if files have content (not just empty)
    const projectContent = await fs.readFile(projectMd, 'utf-8');
    const patternsContent = await fs.readFile(patternsMd, 'utf-8');
    
    if (projectContent.trim().length < 100 || patternsContent.trim().length < 100) {
      return {
        success: false,
        error: 'Codebase analysis appears incomplete'
      };
    }
    
    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Codebase analysis not performed'
    };
  }
}

/**
 * Checks if a feature exists
 */
async function checkFeatureExists(projectRoot: string, featureName: string): Promise<ValidationResult> {
  try {
    const tasksDir = path.join(projectRoot, 'speclinter-tasks');
    const featureDir = path.join(tasksDir, featureName);
    
    await fs.access(featureDir);
    
    // Check for task files
    const files = await fs.readdir(featureDir);
    const hasTaskFiles = files.some(file => file.endsWith('.md') || file.endsWith('.json'));
    
    if (!hasTaskFiles) {
      return {
        success: false,
        error: 'Feature directory exists but contains no task files'
      };
    }
    
    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Feature not found'
    };
  }
}

/**
 * Checks recommended preceding tools
 */
async function checkRecommendedTools(
  projectRoot: string,
  recommendedTools: string[]
): Promise<{ warnings: string[] }> {
  const warnings: string[] = [];
  
  for (const tool of recommendedTools) {
    const check = await checkToolExecution(projectRoot, tool);
    if (!check.success) {
      warnings.push(`Recommended tool '${tool}' has not been executed`);
    }
  }
  
  return { warnings };
}

/**
 * Checks if a tool has been executed (heuristic check)
 */
async function checkToolExecution(projectRoot: string, toolName: string): Promise<ValidationResult> {
  try {
    switch (toolName) {
      case 'speclinter_init_project':
        return await checkInitialization(projectRoot);
      
      case 'speclinter_analyze_codebase':
        return await checkCodebaseAnalysis(projectRoot);
      
      case 'speclinter_parse_spec':
        // Check if any features exist
        const tasksDir = path.join(projectRoot, 'speclinter-tasks');
        try {
          const features = await fs.readdir(tasksDir);
          return { success: features.length > 0 };
        } catch {
          return { success: false };
        }
      
      default:
        // For other tools, assume they've been run if dependencies are met
        return { success: true };
    }
  } catch {
    return { success: false };
  }
}

/**
 * Gets workflow recommendations for a tool
 */
export function getWorkflowRecommendations(toolName: string): string[] {
  const dependencies = TOOL_DEPENDENCIES[toolName];
  
  if (!dependencies) {
    return ['Unknown tool - check tool name'];
  }

  const recommendations: string[] = [];

  if (dependencies.requiresInit) {
    recommendations.push('Ensure project is initialized with speclinter_init_project');
  }

  if (dependencies.requiresCodebaseAnalysis) {
    recommendations.push('Run speclinter_analyze_codebase for better context');
  }

  if (dependencies.requiresFeature) {
    recommendations.push('Create feature with speclinter_parse_spec first');
  }

  if (dependencies.recommendedPrecedingTools) {
    recommendations.push(
      `Recommended preceding tools: ${dependencies.recommendedPrecedingTools.join(', ')}`
    );
  }

  return recommendations;
}
