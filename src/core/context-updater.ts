import { promises as fs } from 'fs';
import path from 'path';
import { AICodebaseAnalysis, AIContextFiles } from '../types/ai-schemas.js';

export class ContextUpdater {
  private speclinterDir: string;

  constructor(projectRoot: string) {
    this.speclinterDir = path.join(projectRoot, '.speclinter');
  }

  // Option A: Full AI Generation - Write AI-generated content directly
  async updateContextFilesFromAI(analysis: AICodebaseAnalysis, contextFiles: AIContextFiles): Promise<string[]> {
    const updatedFiles: string[] = [];

    // Ensure context directory exists
    const contextDir = path.join(this.speclinterDir, 'context');
    await fs.mkdir(contextDir, { recursive: true });

    // Write AI-generated content directly (no template cleanup needed)
    const projectPath = path.join(contextDir, 'project.md');
    await fs.writeFile(projectPath, contextFiles.projectMd);
    updatedFiles.push(projectPath);

    const patternsPath = path.join(contextDir, 'patterns.md');
    await fs.writeFile(patternsPath, contextFiles.patternsMd);
    updatedFiles.push(patternsPath);

    const architecturePath = path.join(contextDir, 'architecture.md');
    await fs.writeFile(architecturePath, contextFiles.architectureMd);
    updatedFiles.push(architecturePath);

    return updatedFiles;
  }

  // All legacy methods removed in Option A:
  // - cleanupGenericTemplates (eliminated)
  // - generateAIStackSection (AI handles this)
  // - generateAIPatternSection (AI handles this)
  // - generateProjectSpecificContent (AI handles this)


}
