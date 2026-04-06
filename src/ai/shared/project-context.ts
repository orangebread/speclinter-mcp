import { promises as fs } from 'fs';
import path from 'path';
import { StorageManager } from '../../core/storage-manager.js';
import type { ProjectContext } from '../../types/index.js';
import type { ProjectContextSnapshot } from '../contracts.js';

function parseArchitecture(content: string): string {
  const patterns: Array<{ regex: RegExp; value: string }> = [
    { regex: /\bMCP Server\b/i, value: 'MCP Server' },
    { regex: /\bmicroservices\b/i, value: 'microservices' },
    { regex: /\bmonolith\b/i, value: 'monolith' },
    { regex: /\bmodular\b/i, value: 'modular' },
    { regex: /\blayered\b/i, value: 'layered' }
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(content)) {
      return pattern.value;
    }
  }

  return 'Unknown';
}

async function readOptionalFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
}

export async function loadProjectContextSnapshot(rootDir: string): Promise<ProjectContextSnapshot> {
  const storage = await StorageManager.createInitializedStorage(rootDir);
  const config = await storage.getConfig();
  const rawContext = await storage.loadProjectContext();
  const architecturePath = path.join(rootDir, config.context.contextDir, 'architecture.md');
  const architectureContent = await readOptionalFile(architecturePath);

  return createProjectContextSnapshot(rawContext, architectureContent);
}

export function createProjectContextSnapshot(
  rawContext: ProjectContext | null,
  architectureContent: string = ''
): ProjectContextSnapshot {
  return {
    raw: rawContext,
    hasContext: Boolean(
      rawContext &&
      (
        Object.keys(rawContext.stack ?? {}).length > 0 ||
        (rawContext.constraints?.length ?? 0) > 0 ||
        (rawContext.standards?.length ?? 0) > 0 ||
        (rawContext.patterns?.length ?? 0) > 0 ||
        architectureContent.trim().length > 0
      )
    ),
    stack: rawContext?.stack,
    techStack: rawContext?.stack ?? {},
    constraints: rawContext?.constraints ?? [],
    standards: rawContext?.standards ?? [],
    patterns: rawContext?.patterns ?? [],
    projectStructure: {
      architecture: parseArchitecture(architectureContent)
    }
  };
}
