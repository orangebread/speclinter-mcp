/**
 * Unified validation utilities for SpecLinter MCP tools
 * Provides consistent validation patterns across all tools
 */

import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { resolveProjectRoot } from '../tools.js';

/**
 * Standard validation response interface
 */
export interface ValidationResult {
  success: boolean;
  error?: string;
  data?: any;
  suggestions?: string[];
}

/**
 * Project context validation result
 */
export interface ProjectValidationResult extends ValidationResult {
  rootDir?: string;
  speclinterDir?: string;
  configPath?: string;
}

/**
 * Parameter validation result
 */
export interface ParameterValidationResult extends ValidationResult {
  validatedParams?: any;
  missingRequired?: string[];
  invalidParams?: string[];
}

/**
 * Validates project context and SpecLinter initialization
 */
export async function validateProjectContext(project_root?: string): Promise<ProjectValidationResult> {
  try {
    const rootDir = await resolveProjectRoot(project_root);
    const speclinterDir = path.join(rootDir, '.speclinter');
    const configPath = path.join(speclinterDir, 'config.json');
    
    // Check if .speclinter directory exists
    try {
      await fs.access(speclinterDir);
    } catch {
      return {
        success: false,
        error: 'SpecLinter not initialized in this project',
        suggestions: [
          'Run speclinter_init_project to initialize SpecLinter',
          'Ensure you are in the correct project directory',
          'Check if .speclinter directory exists'
        ]
      };
    }

    // Check if config file exists
    try {
      await fs.access(configPath);
    } catch {
      return {
        success: false,
        error: 'SpecLinter configuration file missing',
        suggestions: [
          'Run speclinter_init_project to recreate configuration',
          'Check if .speclinter/config.json exists',
          'Verify file permissions'
        ]
      };
    }

    // Validate config file is readable and valid JSON
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      JSON.parse(configContent);
    } catch (error) {
      return {
        success: false,
        error: 'SpecLinter configuration file is corrupted',
        suggestions: [
          'Run speclinter_init_project with force_reinit: true',
          'Manually fix the JSON syntax in .speclinter/config.json',
          'Restore from backup if available'
        ]
      };
    }

    return {
      success: true,
      rootDir,
      speclinterDir,
      configPath
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resolve project root',
      suggestions: [
        'Ensure you have proper file system permissions',
        'Check if the project directory exists',
        'Verify the project_root parameter is correct'
      ]
    };
  }
}

/**
 * Validates required parameters using Zod schema
 */
export function validateParameters<T>(
  params: any,
  schema: z.ZodSchema<T>,
  requiredFields: string[] = []
): ParameterValidationResult {
  try {
    // Check for missing required fields
    const missingRequired = requiredFields.filter(field => 
      params[field] === undefined || params[field] === null || params[field] === ''
    );

    if (missingRequired.length > 0) {
      return {
        success: false,
        error: `Missing required parameters: ${missingRequired.join(', ')}`,
        missingRequired,
        suggestions: [
          'Provide all required parameters',
          'Check parameter names for typos',
          'Ensure parameters are not empty strings or null'
        ]
      };
    }

    // Validate against schema
    const validatedParams = schema.parse(params);

    return {
      success: true,
      validatedParams
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const invalidParams = error.errors.map(err => err.path.join('.'));
      return {
        success: false,
        error: 'Parameter validation failed',
        data: error.errors,
        invalidParams,
        suggestions: [
          'Check parameter types and formats',
          'Ensure all parameters match expected schema',
          'Review tool documentation for parameter requirements'
        ]
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
      suggestions: [
        'Check parameter format and types',
        'Ensure all required parameters are provided'
      ]
    };
  }
}

/**
 * Validates AI analysis response against schema
 */
export function validateAIAnalysis<T>(
  analysis: any,
  schema: z.ZodSchema<T>,
  schemaName: string
): ValidationResult {
  try {
    const validatedAnalysis = schema.parse(analysis);
    return {
      success: true,
      data: validatedAnalysis
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `AI analysis response does not match expected schema: ${schemaName}`,
        data: {
          validation_errors: error.errors,
          schema_name: schemaName
        },
        suggestions: [
          'Check AI analysis format and structure',
          'Ensure all required fields are present',
          'Verify data types match schema requirements',
          `Use speclinter_get_schema_help with schema_name: "${schemaName}" for examples`
        ]
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown AI analysis validation error',
      suggestions: [
        'Check AI analysis response format',
        'Ensure response is valid JSON',
        'Verify all required fields are present'
      ]
    };
  }
}

/**
 * Validates file system permissions and access
 */
export async function validateFileAccess(filePath: string, mode: 'read' | 'write' | 'execute' = 'read'): Promise<ValidationResult> {
  try {
    const accessMode = mode === 'read' ? fs.constants.R_OK :
                      mode === 'write' ? fs.constants.W_OK :
                      fs.constants.X_OK;

    await fs.access(filePath, accessMode);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Cannot ${mode} file: ${filePath}`,
      suggestions: [
        'Check if file exists',
        'Verify file permissions',
        'Ensure parent directory exists',
        'Check if file is locked by another process'
      ]
    };
  }
}

/**
 * Validates directory structure and creates missing directories
 */
export async function validateAndCreateDirectories(directories: string[], rootDir: string): Promise<ValidationResult> {
  try {
    const createdDirs: string[] = [];
    const errors: string[] = [];

    for (const dir of directories) {
      const dirPath = path.join(rootDir, dir);
      try {
        await fs.mkdir(dirPath, { recursive: true });
        createdDirs.push(dir);
      } catch (error) {
        errors.push(`Failed to create ${dir}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: 'Failed to create some directories',
        data: { errors, createdDirs },
        suggestions: [
          'Check file system permissions',
          'Ensure sufficient disk space',
          'Verify parent directories exist'
        ]
      };
    }

    return {
      success: true,
      data: { createdDirs }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown directory creation error',
      suggestions: [
        'Check file system permissions',
        'Ensure root directory exists',
        'Verify disk space availability'
      ]
    };
  }
}

/**
 * Validates configuration thresholds and settings
 */
export function validateConfigThresholds(
  value: number,
  threshold: number,
  thresholdName: string,
  comparison: 'min' | 'max' = 'min'
): ValidationResult {
  const isValid = comparison === 'min' ? value >= threshold : value <= threshold;

  if (!isValid) {
    return {
      success: false,
      error: `Value ${value} does not meet ${thresholdName} threshold (${comparison}: ${threshold})`,
      suggestions: [
        `Adjust the value to meet the ${thresholdName} requirement`,
        `Consider modifying the ${thresholdName} in configuration`,
        'Review quality requirements for this operation'
      ]
    };
  }

  return { success: true };
}

/**
 * Standardized error handling for all SpecLinter tools
 */
export interface StandardErrorResponse {
  success: false;
  error: string;
  error_type: 'validation' | 'file_system' | 'ai_analysis' | 'configuration' | 'unknown';
  internal_step?: string;
  debug_info?: string;
  suggestions?: string[];
  recovery_actions?: string[];
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: any,
  step: string = 'unknown',
  context?: string
): StandardErrorResponse {
  // Handle Zod validation errors
  if (error instanceof Error && error.name === 'ZodError') {
    return {
      success: false,
      error: 'Validation failed - data does not match expected format',
      error_type: 'validation',
      internal_step: step,
      debug_info: error.message,
      suggestions: [
        'Check data format and structure',
        'Ensure all required fields are present',
        'Verify data types match expected schema'
      ],
      recovery_actions: [
        'Review input parameters',
        'Check tool documentation for correct format',
        'Use schema help tools for examples'
      ]
    };
  }

  // Handle file system errors
  if (error instanceof Error && (
    error.message.includes('ENOENT') ||
    error.message.includes('EACCES') ||
    error.message.includes('EPERM')
  )) {
    return {
      success: false,
      error: 'File system operation failed',
      error_type: 'file_system',
      internal_step: step,
      debug_info: error.message,
      suggestions: [
        'Check file and directory permissions',
        'Ensure files and directories exist',
        'Verify sufficient disk space'
      ],
      recovery_actions: [
        'Run speclinter_init_project if not initialized',
        'Check file system permissions',
        'Ensure project directory is accessible'
      ]
    };
  }

  // Handle configuration errors
  if (error instanceof Error && (
    error.message.includes('threshold') ||
    error.message.includes('configuration') ||
    error.message.includes('config')
  )) {
    return {
      success: false,
      error: 'Configuration validation failed',
      error_type: 'configuration',
      internal_step: step,
      debug_info: error.message,
      suggestions: [
        'Check configuration file format',
        'Verify threshold values are appropriate',
        'Review configuration documentation'
      ],
      recovery_actions: [
        'Reset configuration with speclinter_init_project',
        'Manually edit .speclinter/config.json',
        'Use default configuration values'
      ]
    };
  }

  // Handle AI analysis errors
  if (context === 'ai_analysis' || error.message?.includes('AI analysis')) {
    return {
      success: false,
      error: 'AI analysis processing failed',
      error_type: 'ai_analysis',
      internal_step: step,
      debug_info: error instanceof Error ? error.message : 'Unknown AI analysis error',
      suggestions: [
        'Check AI analysis response format',
        'Ensure analysis matches expected schema',
        'Verify all required analysis fields are present'
      ],
      recovery_actions: [
        'Retry with different analysis parameters',
        'Check schema documentation for correct format',
        'Use simpler analysis depth if available'
      ]
    };
  }

  // Generic error handling
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error occurred',
    error_type: 'unknown',
    internal_step: step,
    debug_info: context || 'No additional context available',
    suggestions: [
      'Check input parameters and format',
      'Ensure all prerequisites are met',
      'Review tool documentation'
    ],
    recovery_actions: [
      'Retry the operation',
      'Check system requirements',
      'Contact support if issue persists'
    ]
  };
}

/**
 * Edge case validation utilities
 */

/**
 * Validates resource limits for large codebase operations
 */
export async function validateResourceLimits(
  fileCount: number,
  totalSize: number,
  maxFiles: number = 1000,
  maxSizeBytes: number = 50 * 1024 * 1024 // 50MB
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (fileCount > maxFiles) {
    errors.push(`File count (${fileCount}) exceeds maximum limit (${maxFiles})`);
  } else if (fileCount > maxFiles * 0.8) {
    warnings.push(`File count (${fileCount}) is approaching limit (${maxFiles})`);
  }

  if (totalSize > maxSizeBytes) {
    errors.push(`Total size (${Math.round(totalSize / 1024 / 1024)}MB) exceeds maximum limit (${Math.round(maxSizeBytes / 1024 / 1024)}MB)`);
  } else if (totalSize > maxSizeBytes * 0.8) {
    warnings.push(`Total size (${Math.round(totalSize / 1024 / 1024)}MB) is approaching limit (${Math.round(maxSizeBytes / 1024 / 1024)}MB)`);
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: 'Resource limits exceeded',
      data: { errors, warnings },
      suggestions: [
        'Reduce the scope of analysis',
        'Use file filters to exclude unnecessary files',
        'Increase resource limits in configuration',
        'Process files in smaller batches'
      ]
    };
  }

  return {
    success: true,
    data: { warnings }
  };
}

/**
 * Validates input sanitization for security
 */
export function validateInputSanitization(input: string, maxLength: number = 10000): ValidationResult {
  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /\.\.\//g,  // Path traversal
    /<script/gi, // Script injection
    /javascript:/gi, // JavaScript protocol
    /data:.*base64/gi, // Base64 data URLs
    /file:\/\//gi, // File protocol
    /\$\{.*\}/g, // Template injection
    /`.*`/g, // Template literals
  ];

  const foundPatterns = dangerousPatterns.filter(pattern => pattern.test(input));

  if (foundPatterns.length > 0) {
    return {
      success: false,
      error: 'Input contains potentially dangerous patterns',
      suggestions: [
        'Remove or escape special characters',
        'Use plain text without code or markup',
        'Avoid file paths and URLs in input'
      ]
    };
  }

  if (input.length > maxLength) {
    return {
      success: false,
      error: `Input length (${input.length}) exceeds maximum allowed (${maxLength})`,
      suggestions: [
        'Reduce input length',
        'Split large inputs into smaller parts',
        'Use file uploads for large content'
      ]
    };
  }

  return { success: true };
}

/**
 * Validates malformed JSON inputs
 */
export function validateJSONInput(input: string): ValidationResult {
  try {
    const parsed = JSON.parse(input);

    // Check for circular references
    try {
      JSON.stringify(parsed);
    } catch (error) {
      return {
        success: false,
        error: 'JSON contains circular references',
        suggestions: [
          'Remove circular references from JSON',
          'Use a different data structure',
          'Serialize data properly before sending'
        ]
      };
    }

    return {
      success: true,
      data: parsed
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid JSON format',
      suggestions: [
        'Check JSON syntax for errors',
        'Ensure proper escaping of special characters',
        'Validate JSON using a JSON validator tool'
      ]
    };
  }
}

/**
 * Validates disk space availability
 */
export async function validateDiskSpace(
  directory: string,
  requiredBytes: number = 100 * 1024 * 1024 // 100MB
): Promise<ValidationResult> {
  try {
    const stats = await fs.statfs(directory);
    const availableBytes = stats.bavail * stats.bsize;

    if (availableBytes < requiredBytes) {
      return {
        success: false,
        error: `Insufficient disk space. Available: ${Math.round(availableBytes / 1024 / 1024)}MB, Required: ${Math.round(requiredBytes / 1024 / 1024)}MB`,
        suggestions: [
          'Free up disk space',
          'Use a different directory with more space',
          'Reduce the scope of the operation',
          'Clean up temporary files'
        ]
      };
    }

    return { success: true };
  } catch (error) {
    // statfs might not be available on all systems
    return {
      success: true,
      data: { warning: 'Could not check disk space availability' }
    };
  }
}

/**
 * Validates concurrent operation limits
 */
export class ConcurrencyValidator {
  private static activeOperations = new Map<string, number>();
  private static readonly MAX_CONCURRENT = 3;

  static async validateConcurrency(operationType: string): Promise<ValidationResult> {
    const current = this.activeOperations.get(operationType) || 0;

    if (current >= this.MAX_CONCURRENT) {
      return {
        success: false,
        error: `Too many concurrent ${operationType} operations (${current}/${this.MAX_CONCURRENT})`,
        suggestions: [
          'Wait for current operations to complete',
          'Reduce concurrent operation limits',
          'Use operation queuing if available'
        ]
      };
    }

    return { success: true };
  }

  static incrementOperation(operationType: string): void {
    const current = this.activeOperations.get(operationType) || 0;
    this.activeOperations.set(operationType, current + 1);
  }

  static decrementOperation(operationType: string): void {
    const current = this.activeOperations.get(operationType) || 0;
    if (current > 0) {
      this.activeOperations.set(operationType, current - 1);
    }
  }
}
