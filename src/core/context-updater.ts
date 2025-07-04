import { promises as fs } from 'fs';
import path from 'path';
import { CodebaseAnalysis, TechStack, CodePattern } from './codebase-analyzer.js';
import { AICodebaseAnalysis } from '../types/ai-schemas.js';

export class ContextUpdater {
  private speclinterDir: string;

  constructor(projectRoot: string) {
    this.speclinterDir = path.join(projectRoot, '.speclinter');
  }

  async updateContextFiles(analysis: CodebaseAnalysis): Promise<string[]> {
    const updatedFiles: string[] = [];

    // Update project.md with detected tech stack
    const projectPath = path.join(this.speclinterDir, 'context', 'project.md');
    await this.updateProjectContext(projectPath, analysis.techStack);
    updatedFiles.push(projectPath);

    // Update patterns.md with discovered patterns
    const patternsPath = path.join(this.speclinterDir, 'context', 'patterns.md');
    await this.updatePatternsContext(patternsPath, analysis);
    updatedFiles.push(patternsPath);

    return updatedFiles;
  }

  async updateContextFilesFromAI(analysis: AICodebaseAnalysis): Promise<string[]> {
    const updatedFiles: string[] = [];

    // Update project.md with AI-detected tech stack
    const projectPath = path.join(this.speclinterDir, 'context', 'project.md');
    await this.updateProjectContextFromAI(projectPath, analysis);
    updatedFiles.push(projectPath);

    // Update patterns.md with AI-discovered patterns
    const patternsPath = path.join(this.speclinterDir, 'context', 'patterns.md');
    await this.updatePatternsContextFromAI(patternsPath, analysis);
    updatedFiles.push(patternsPath);

    return updatedFiles;
  }

  private async updateProjectContext(filePath: string, techStack: TechStack): Promise<void> {
    let content = '';
    
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch {
      // File doesn't exist, we'll create it
    }

    // Update the Stack section
    const stackSection = this.generateStackSection(techStack);
    
    if (content.includes('## Stack')) {
      // Replace existing stack section
      content = content.replace(
        /## Stack[\s\S]*?(?=##|$)/,
        stackSection + '\n\n'
      );
    } else {
      // Add stack section at the beginning
      content = stackSection + '\n\n' + content;
    }

    await fs.writeFile(filePath, content);
  }

  private generateStackSection(techStack: TechStack): string {
    const stack = [];
    
    if (techStack.frontend) stack.push(`- **Frontend**: ${techStack.frontend}`);
    if (techStack.backend) stack.push(`- **Backend**: ${techStack.backend}`);
    if (techStack.database) stack.push(`- **Database**: ${techStack.database}`);
    if (techStack.testing) stack.push(`- **Testing**: ${techStack.testing}`);
    if (techStack.buildTool) stack.push(`- **Build Tool**: ${techStack.buildTool}`);
    if (techStack.packageManager) stack.push(`- **Package Manager**: ${techStack.packageManager}`);

    return `## Stack\n${stack.join('\n')}`;
  }

  private async updatePatternsContext(filePath: string, analysis: CodebaseAnalysis): Promise<void> {
    let content = '';
    
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch {
      // File doesn't exist, we'll create it
    }

    // Generate patterns sections
    const errorPatternsSection = this.generatePatternSection('Error Handling Patterns', analysis.errorPatterns);
    const apiPatternsSection = this.generatePatternSection('API Patterns', analysis.apiPatterns);
    const testPatternsSection = this.generatePatternSection('Testing Patterns', analysis.testPatterns);

    // Add discovered patterns at the top
    const discoveredSection = `# Discovered Code Patterns

${errorPatternsSection}

${apiPatternsSection}

${testPatternsSection}

---

# Manual Patterns

`;

    if (content.includes('# Discovered Code Patterns')) {
      // Replace existing discovered patterns section
      content = content.replace(
        /# Discovered Code Patterns[\s\S]*?(?=# Manual Patterns|$)/,
        discoveredSection
      );
    } else {
      // Add discovered patterns at the beginning
      content = discoveredSection + content;
    }

    await fs.writeFile(filePath, content);
  }

  private generatePatternSection(title: string, patterns: CodePattern[]): string {
    if (patterns.length === 0) {
      return `## ${title}\n*No patterns detected*`;
    }

    const patternBlocks = patterns.map(pattern => `### ${pattern.name}
${pattern.description}

\`\`\`typescript
${pattern.example}
\`\`\``).join('\n\n');

    return `## ${title}\n\n${patternBlocks}`;
  }

  private async updateProjectContextFromAI(filePath: string, analysis: AICodebaseAnalysis): Promise<void> {
    let content = '';

    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch {
      // File doesn't exist, we'll create it
    }

    // Generate enhanced stack section with AI insights
    const stackSection = this.generateAIStackSection(analysis.techStack);

    if (content.includes('## Stack')) {
      // Replace existing stack section
      content = content.replace(
        /## Stack[\s\S]*?(?=##|$)/,
        stackSection + '\n\n'
      );
    } else {
      // Add stack section at the beginning
      content = stackSection + '\n\n' + content;
    }

    await fs.writeFile(filePath, content);
  }

  private generateAIStackSection(techStack: any): string {
    const stack = [];

    if (techStack.frontend) stack.push(`- **Frontend**: ${techStack.frontend}`);
    if (techStack.backend) stack.push(`- **Backend**: ${techStack.backend}`);
    if (techStack.database) stack.push(`- **Database**: ${techStack.database}`);
    if (techStack.testing) stack.push(`- **Testing**: ${techStack.testing}`);
    if (techStack.buildTool) stack.push(`- **Build Tool**: ${techStack.buildTool}`);
    if (techStack.packageManager) stack.push(`- **Package Manager**: ${techStack.packageManager}`);
    if (techStack.language) stack.push(`- **Language**: ${techStack.language}`);

    const confidence = techStack.confidence ? ` (AI Confidence: ${Math.round(techStack.confidence * 100)}%)` : '';

    return `## Stack${confidence}\n${stack.join('\n')}`;
  }

  private async updatePatternsContextFromAI(filePath: string, analysis: AICodebaseAnalysis): Promise<void> {
    let content = '';

    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch {
      // File doesn't exist, we'll create it
    }

    // Generate AI-enhanced patterns sections
    const errorPatternsSection = this.generateAIPatternSection('Error Handling Patterns', analysis.errorPatterns);
    const apiPatternsSection = this.generateAIPatternSection('API Patterns', analysis.apiPatterns);
    const testPatternsSection = this.generateAIPatternSection('Testing Patterns', analysis.testPatterns);

    // Add AI insights section
    const insightsSection = analysis.insights.length > 0 ? `
## AI Insights
${analysis.insights.map(insight => `- ${insight}`).join('\n')}
` : '';

    const recommendationsSection = analysis.recommendations.length > 0 ? `
## AI Recommendations
${analysis.recommendations.map(rec => `- ${rec}`).join('\n')}
` : '';

    // Add discovered patterns at the top
    const discoveredSection = `# AI-Discovered Code Patterns

${errorPatternsSection}

${apiPatternsSection}

${testPatternsSection}

${insightsSection}

${recommendationsSection}

---

# Manual Patterns

`;

    if (content.includes('# AI-Discovered Code Patterns')) {
      // Replace existing discovered patterns section
      content = content.replace(
        /# AI-Discovered Code Patterns[\s\S]*?(?=# Manual Patterns|$)/,
        discoveredSection
      );
    } else {
      // Add discovered patterns at the beginning
      content = discoveredSection + content;
    }

    await fs.writeFile(filePath, content);
  }

  private generateAIPatternSection(title: string, patterns: any[]): string {
    if (patterns.length === 0) {
      return `## ${title}\n*No patterns detected*`;
    }

    const patternBlocks = patterns.map(pattern => {
      const confidence = pattern.confidence ? ` (Confidence: ${Math.round(pattern.confidence * 100)}%)` : '';
      const locations = pattern.locations ? `\n\n**Found in**: ${pattern.locations.map((loc: any) => loc.file).join(', ')}` : '';

      return `### ${pattern.name}${confidence}
${pattern.description}${locations}

\`\`\`typescript
${pattern.example}
\`\`\``;
    }).join('\n\n');

    return `## ${title}\n\n${patternBlocks}`;
  }
}
