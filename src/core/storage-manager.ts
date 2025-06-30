import { promises as fs } from 'fs';
import path from 'path';
import { Storage } from './storage.js';
import { DEFAULT_CONFIG } from '../types/config.js';

/**
 * StorageManager provides auto-initialization capabilities for Storage instances.
 * This avoids circular dependencies and maintains clean architecture by keeping
 * the Storage class as a pure data layer component.
 */
export class StorageManager {
  /**
   * Creates and initializes a Storage instance, automatically setting up
   * the required directory structure if it doesn't exist.
   */
  static async createInitializedStorage(rootDir?: string): Promise<Storage> {
    const storage = new Storage(rootDir);
    
    try {
      await storage.initialize();
      return storage;
    } catch (error) {
      // Check if the error is due to missing initialization
      if (error instanceof Error && error.message.includes('not initialized')) {
        console.error('SpecLinter not initialized. Auto-initializing with default configuration...');
        await this.autoInitialize(rootDir || process.cwd());
        
        // Try to initialize again after auto-setup
        await storage.initialize();
        console.error('✅ SpecLinter auto-initialized successfully!');
        return storage;
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Performs minimal auto-initialization required for Storage to function.
   * Only creates the essential directory structure and configuration.
   */
  private static async autoInitialize(rootDir: string): Promise<void> {
    const speclinterDir = path.join(rootDir, '.speclinter');
    
    try {
      // Create essential directory structure
      const directories = [
        '.speclinter',
        '.speclinter/context',
        '.speclinter/cache',
        'tasks'
      ];

      for (const dir of directories) {
        const dirPath = path.join(rootDir, dir);
        await fs.mkdir(dirPath, { recursive: true });
      }

      // Create default config if it doesn't exist
      const configPath = path.join(speclinterDir, 'config.json');
      try {
        await fs.access(configPath);
        // Config already exists, don't overwrite
      } catch {
        // Config doesn't exist, create it
        await fs.writeFile(
          configPath,
          JSON.stringify(DEFAULT_CONFIG, null, 2)
        );
      }

      // Create minimal context templates if they don't exist
      await this.createMinimalContextTemplates(path.join(speclinterDir, 'context'));

      // Create .gitignore for speclinter if it doesn't exist
      const gitignorePath = path.join(speclinterDir, '.gitignore');
      try {
        await fs.access(gitignorePath);
        // .gitignore already exists, don't overwrite
      } catch {
        // .gitignore doesn't exist, create it
        await fs.writeFile(gitignorePath, 'cache/\n*.db\n*.db-journal\n');
      }

    } catch (error) {
      throw new Error(
        `Failed to auto-initialize SpecLinter: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Creates minimal context template files if they don't exist.
   * These are basic templates that users can customize later.
   */
  private static async createMinimalContextTemplates(contextDir: string): Promise<void> {
    const templates = [
      {
        filename: 'project.md',
        content: `# Project Context

## Stack
- **Language**: [Your primary language]
- **Framework**: [Your framework]
- **Database**: [Your database]
- **Testing**: [Your testing framework]

## Constraints
- [Add your project constraints here]

## Standards
- [Add your coding standards here]
`
      },
      {
        filename: 'patterns.md',
        content: `# Code Patterns

## Error Handling Pattern
\`\`\`typescript
// Add your error handling patterns here
\`\`\`

## API Response Pattern
\`\`\`typescript
// Add your API patterns here
\`\`\`

## Add your project-specific patterns below...
`
      },
      {
        filename: 'architecture.md',
        content: `# Architecture Decisions

## Overview
[Describe your system architecture]

## Key Design Decisions

### 1. [Decision Name]
**Context**: Why this decision was needed
**Decision**: What was decided
**Consequences**: Trade-offs and implications

## Add your architecture decisions below...
`
      }
    ];

    for (const template of templates) {
      const filePath = path.join(contextDir, template.filename);
      try {
        await fs.access(filePath);
        // File already exists, don't overwrite
      } catch {
        // File doesn't exist, create it
        await fs.writeFile(filePath, template.content);
      }
    }
  }
}
