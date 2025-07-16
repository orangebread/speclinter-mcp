/**
 * Configuration management utilities for SpecLinter
 * Provides consistent configuration access and validation across all tools
 */

import { promises as fs } from 'fs';
import path from 'path';
import { Config, ConfigSchema, DEFAULT_CONFIG } from '../types/config.js';
import { ValidationResult, validateConfigThresholds } from './validation.js';

/**
 * Configuration manager for consistent config access
 */
export class ConfigManager {
  private static configCache = new Map<string, { config: Config; timestamp: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Gets configuration with caching and validation
   */
  static async getConfig(projectRoot: string): Promise<Config> {
    const configPath = path.join(projectRoot, '.speclinter', 'config.json');
    const cacheKey = configPath;
    const now = Date.now();

    // Check cache first
    const cached = this.configCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.config;
    }

    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      const configData = JSON.parse(configContent);
      const config = ConfigSchema.parse(configData);

      // Cache the validated config
      this.configCache.set(cacheKey, { config, timestamp: now });
      return config;
    } catch (error) {
      console.warn(`Failed to load config from ${configPath}, using defaults:`, error);
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Validates configuration values
   */
  static validateConfig(config: Config): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate threshold ranges
    if (config.generation.specAnalysis.qualityThreshold < 0 || config.generation.specAnalysis.qualityThreshold > 100) {
      errors.push('Quality threshold must be between 0 and 100');
    }

    if (config.generation.specAnalysis.confidenceThreshold < 0 || config.generation.specAnalysis.confidenceThreshold > 1) {
      errors.push('Confidence threshold must be between 0 and 1');
    }

    if (config.deduplication.similarityThreshold < 0 || config.deduplication.similarityThreshold > 1) {
      errors.push('Similarity threshold must be between 0 and 1');
    }

    // Validate reasonable values
    if (config.generation.tasksPerFeature > 50) {
      warnings.push('Tasks per feature is very high (>50), this may impact performance');
    }

    if (config.generation.gherkinQuality.maxScenarioCount > 20) {
      warnings.push('Max scenario count is very high (>20), this may impact readability');
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: 'Configuration validation failed',
        data: { errors, warnings },
        suggestions: [
          'Check configuration values are within valid ranges',
          'Reset to default configuration if needed',
          'Review configuration documentation'
        ]
      };
    }

    return {
      success: true,
      data: { warnings }
    };
  }

  /**
   * Gets quality threshold with validation
   */
  static async getQualityThreshold(projectRoot: string): Promise<{ threshold: number; isValid: boolean }> {
    const config = await this.getConfig(projectRoot);
    const threshold = config.generation.specAnalysis.qualityThreshold;
    const isValid = threshold >= 0 && threshold <= 100;
    return { threshold, isValid };
  }

  /**
   * Gets confidence threshold with validation
   */
  static async getConfidenceThreshold(projectRoot: string): Promise<{ threshold: number; isValid: boolean }> {
    const config = await this.getConfig(projectRoot);
    const threshold = config.generation.specAnalysis.confidenceThreshold;
    const isValid = threshold >= 0 && threshold <= 1;
    return { threshold, isValid };
  }

  /**
   * Gets similarity threshold with validation
   */
  static async getSimilarityThreshold(projectRoot: string): Promise<{ threshold: number; isValid: boolean }> {
    const config = await this.getConfig(projectRoot);
    const threshold = config.deduplication.similarityThreshold;
    const isValid = threshold >= 0 && threshold <= 1;
    return { threshold, isValid };
  }

  /**
   * Validates a value against quality threshold
   */
  static async validateQualityThreshold(
    value: number,
    projectRoot: string,
    operation: string = 'operation'
  ): Promise<ValidationResult> {
    const { threshold, isValid } = await this.getQualityThreshold(projectRoot);
    
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid quality threshold in configuration',
        suggestions: [
          'Check configuration file for valid quality threshold (0-100)',
          'Reset configuration to defaults',
          'Update quality threshold to valid range'
        ]
      };
    }

    return validateConfigThresholds(value, threshold, `quality threshold for ${operation}`, 'min');
  }

  /**
   * Validates a value against confidence threshold
   */
  static async validateConfidenceThreshold(
    value: number,
    projectRoot: string,
    operation: string = 'operation'
  ): Promise<ValidationResult> {
    const { threshold, isValid } = await this.getConfidenceThreshold(projectRoot);
    
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid confidence threshold in configuration',
        suggestions: [
          'Check configuration file for valid confidence threshold (0-1)',
          'Reset configuration to defaults',
          'Update confidence threshold to valid range'
        ]
      };
    }

    return validateConfigThresholds(value, threshold, `confidence threshold for ${operation}`, 'min');
  }

  /**
   * Gets resource limits from configuration
   */
  static async getResourceLimits(projectRoot: string): Promise<{
    maxFiles: number;
    maxFileSize: number;
    maxTotalSize: number;
  }> {
    const config = await this.getConfig(projectRoot);
    
    // These could be added to config schema in the future
    // For now, use reasonable defaults
    return {
      maxFiles: 1000,
      maxFileSize: 1024 * 1024, // 1MB per file
      maxTotalSize: 50 * 1024 * 1024 // 50MB total
    };
  }

  /**
   * Gets analysis depth setting
   */
  static async getAnalysisDepth(projectRoot: string): Promise<'quick' | 'standard' | 'comprehensive'> {
    const config = await this.getConfig(projectRoot);
    return config.generation.specAnalysis.analysisDepth;
  }

  /**
   * Gets task complexity setting
   */
  static async getTaskComplexity(projectRoot: string): Promise<'basic' | 'standard' | 'comprehensive'> {
    const config = await this.getConfig(projectRoot);
    return config.generation.specAnalysis.taskComplexity;
  }

  /**
   * Gets Gherkin quality settings
   */
  static async getGherkinQuality(projectRoot: string) {
    const config = await this.getConfig(projectRoot);
    return config.generation.gherkinQuality;
  }

  /**
   * Gets deduplication settings
   */
  static async getDeduplicationSettings(projectRoot: string) {
    const config = await this.getConfig(projectRoot);
    return config.deduplication;
  }

  /**
   * Clears configuration cache (useful for testing or config updates)
   */
  static clearCache(projectRoot?: string): void {
    if (projectRoot) {
      const configPath = path.join(projectRoot, '.speclinter', 'config.json');
      this.configCache.delete(configPath);
    } else {
      this.configCache.clear();
    }
  }

  /**
   * Updates configuration file with new values
   */
  static async updateConfig(
    projectRoot: string,
    updates: Partial<Config>
  ): Promise<ValidationResult> {
    try {
      const currentConfig = await this.getConfig(projectRoot);
      const newConfig = { ...currentConfig, ...updates };
      
      // Validate the new configuration
      const validation = this.validateConfig(newConfig);
      if (!validation.success) {
        return validation;
      }

      // Write the updated configuration
      const configPath = path.join(projectRoot, '.speclinter', 'config.json');
      await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2));
      
      // Clear cache to force reload
      this.clearCache(projectRoot);

      return {
        success: true,
        data: { config: newConfig }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update configuration',
        suggestions: [
          'Check file permissions',
          'Ensure configuration directory exists',
          'Verify configuration format is valid'
        ]
      };
    }
  }
}
