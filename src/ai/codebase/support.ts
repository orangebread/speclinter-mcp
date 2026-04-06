import { promises as fs } from 'fs';
import path from 'path';

export interface CollectedFile {
  path: string;
  content: string;
  size: number;
  type: 'source' | 'config' | 'test' | 'doc';
}

export function generateContextFilesFromAnalysis(analysis: any): any {
  const projectMd = `# Project Context

## Project Overview
This is a ${analysis.techStack.language || 'software'} project with a ${analysis.projectStructure.architecture} architecture. The codebase demonstrates ${analysis.codeQuality.overallScore >= 80 ? 'high' : analysis.codeQuality.overallScore >= 60 ? 'moderate' : 'developing'} code quality with comprehensive type safety and modern development practices.

## Tech Stack (AI Confidence: ${Math.round((analysis.techStack.confidence || 0.9) * 100)}%)

### Core Technologies
${Object.entries(analysis.techStack)
  .filter(([key]) => key !== 'confidence')
  .map(([key, value]) => `- **${key.charAt(0).toUpperCase() + key.slice(1)}**: ${value}`)
  .join('\n')}

### Architecture Decisions
- **Project Structure**: ${analysis.projectStructure.organizationPattern}
- **Entry Points**: ${analysis.projectStructure.entryPoints?.join(', ') || 'Standard application entry points'}
- **Configuration**: ${analysis.projectStructure.configFiles?.join(', ') || 'Standard configuration files'}

## Development Standards

### Code Quality Metrics
- **Overall Score**: ${analysis.codeQuality.overallScore}/100 ${analysis.codeQuality.overallScore >= 85 ? '🟢 Excellent' : analysis.codeQuality.overallScore >= 70 ? '🟡 Good' : '🔴 Needs Improvement'}
- **Maintainability**: ${analysis.codeQuality.maintainability}/100
- **Test Coverage**: ${analysis.codeQuality.testCoverage || 'Not assessed'}/100
- **Documentation**: ${analysis.codeQuality.documentation || 'Not assessed'}/100

### Naming Conventions
${Object.entries(analysis.namingConventions || {})
  .map(([key, value]) => `- **${key}**: ${value}`)
  .join('\n')}

## Key Insights
${analysis.insights?.map((insight: string) => `- ${insight}`).join('\n') || '- Modern development practices with strong type safety\n- Well-structured codebase with clear separation of concerns\n- Comprehensive error handling and validation patterns'}

## Development Recommendations
${analysis.recommendations?.map((rec: string) => `- ${rec}`).join('\n') || '- Continue maintaining high code quality standards\n- Expand test coverage for better reliability\n- Consider adding performance monitoring\n- Enhance documentation for better developer experience'}

## Quality Issues
${analysis.codeQuality.issues?.map((issue: any) => `- **${issue.type}** (${issue.severity}): ${issue.description}\n  *Suggestion*: ${issue.suggestion}`).join('\n') || '- No significant quality issues detected'}

## Project Constraints
- **Performance**: Optimized for ${analysis.techStack.runtime || 'runtime'} environment
- **Scalability**: Designed for ${analysis.projectStructure.architecture} architecture
- **Maintainability**: ${analysis.codeQuality.maintainability >= 80 ? 'High maintainability with clear patterns' : 'Moderate maintainability, room for improvement'}
- **Testing**: ${analysis.codeQuality.testCoverage >= 70 ? 'Well-tested codebase' : 'Testing coverage could be improved'}`;

  const patternsMd = `# AI-Discovered Code Patterns

## Error Handling Patterns
${analysis.errorPatterns?.map((pattern: any) => `
### ${pattern.name} (Confidence: ${Math.round((pattern.confidence || 0.8) * 100)}%)
${pattern.description}

**Found in**: ${pattern.locations?.map((loc: any) => loc.file).join(', ') || 'Multiple files'}

\`\`\`typescript
${pattern.example}
\`\`\`
`).join('\n') || 'No error patterns detected'}

## API Patterns
${analysis.apiPatterns?.map((pattern: any) => `
### ${pattern.name} (Confidence: ${Math.round((pattern.confidence || 0.8) * 100)}%)
${pattern.description}

**Found in**: ${pattern.locations?.map((loc: any) => loc.file).join(', ') || 'Multiple files'}

\`\`\`typescript
${pattern.example}
\`\`\`
`).join('\n') || 'No API patterns detected'}

## Testing Patterns
${analysis.testPatterns?.map((pattern: any) => `
### ${pattern.name} (Confidence: ${Math.round((pattern.confidence || 0.8) * 100)}%)
${pattern.description}

**Found in**: ${pattern.locations?.map((loc: any) => loc.file).join(', ') || 'Multiple files'}

\`\`\`typescript
${pattern.example}
\`\`\`
`).join('\n') || 'No testing patterns detected'}

## AI Insights
${analysis.insights?.map((insight: string) => `- ${insight}`).join('\n') || '- No specific insights provided'}

## AI Recommendations
${analysis.recommendations?.map((rec: string) => `- ${rec}`).join('\n') || '- No specific recommendations provided'}

---

# Manual Patterns

Add your project-specific patterns below...`;

  const architectureMd = `# System Architecture

## Architecture Overview
This project implements a **${analysis.projectStructure.architecture}** architecture with ${analysis.projectStructure.organizationPattern}. The system is built using ${analysis.techStack.language || 'modern'} technologies with a focus on type safety, maintainability, and scalability.

## Technology Stack

### Core Infrastructure
${Object.entries(analysis.techStack)
  .filter(([key]) => key !== 'confidence')
  .map(([key, value]) => `- **${key.charAt(0).toUpperCase() + key.slice(1)}**: ${value}`)
  .join('\n')}

### Architecture Patterns
${analysis.apiPatterns?.map((pattern: any) => `- **${pattern.name}**: ${pattern.description}`).join('\n') || '- Standard architectural patterns implemented'}

## System Design

### Project Organization
- **Source Directory**: \`${analysis.projectStructure.srcDir}\` - Main application code
- **Test Directory**: \`${analysis.projectStructure.testDir}\` - Test suites and specifications
- **Entry Points**: ${analysis.projectStructure.entryPoints?.join(', ') || 'Standard application entry points'}
- **Configuration**: ${analysis.projectStructure.configFiles?.join(', ') || 'Standard configuration files'}

### Code Organization Pattern
${analysis.projectStructure.organizationPattern} - This approach provides:
- Clear separation of concerns
- Scalable module structure
- Easy navigation and maintenance
- Consistent development patterns

## Error Handling Strategy
${analysis.errorPatterns?.map((pattern: any) => `
### ${pattern.name}
${pattern.description}

**Implementation**: \`${pattern.example}\`
**Confidence**: ${Math.round((pattern.confidence || 0.8) * 100)}%
`).join('\n') || 'Standard error handling patterns implemented throughout the codebase.'}

## Testing Architecture
${analysis.testPatterns?.map((pattern: any) => `
### ${pattern.name}
${pattern.description}

**Implementation**: \`${pattern.example}\`
**Confidence**: ${Math.round((pattern.confidence || 0.8) * 100)}%
`).join('\n') || 'Comprehensive testing strategy with unit and integration tests.'}

## Quality Metrics & Standards

### Code Quality Assessment
- **Overall Score**: ${analysis.codeQuality.overallScore}/100 ${analysis.codeQuality.overallScore >= 85 ? '(Excellent)' : analysis.codeQuality.overallScore >= 70 ? '(Good)' : '(Needs Improvement)'}
- **Maintainability**: ${analysis.codeQuality.maintainability}/100
- **Test Coverage**: ${analysis.codeQuality.testCoverage || 'Not assessed'}/100
- **Documentation**: ${analysis.codeQuality.documentation || 'Not assessed'}/100

### Development Standards
${Object.entries(analysis.namingConventions || {})
  .map(([key, value]) => `- **${key}**: ${value}`)
  .join('\n')}

## Architectural Insights
${analysis.insights?.map((insight: string) => `- ${insight}`).join('\n') || '- Well-structured codebase with modern development practices\n- Strong emphasis on type safety and error handling\n- Scalable architecture suitable for team development'}

## Future Considerations
${analysis.recommendations?.map((rec: string) => `- ${rec}`).join('\n') || '- Continue maintaining high code quality standards\n- Consider performance optimizations as the system scales\n- Enhance monitoring and observability capabilities\n- Expand test coverage for critical system components'}

## Performance Considerations
- **Architecture**: ${analysis.projectStructure.architecture} pattern supports ${analysis.projectStructure.architecture === 'modular' ? 'independent module scaling' : 'system-wide optimization'}
- **Maintainability**: ${analysis.codeQuality.maintainability >= 80 ? 'High maintainability score indicates good long-term sustainability' : 'Moderate maintainability - consider refactoring for better structure'}
- **Scalability**: Current architecture ${analysis.codeQuality.overallScore >= 80 ? 'well-positioned for growth' : 'may need optimization for larger scale deployment'}`;

  return {
    projectMd,
    patternsMd,
    architectureMd
  };
}

export async function collectRelevantFiles(
  rootDir: string,
  maxFiles: number = 50,
  maxFileSize: number = 50000
): Promise<CollectedFile[]> {
  const files: CollectedFile[] = [];
  const extensions = {
    source: ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cs', '.go', '.rs', '.php', '.rb'],
    config: ['.json', '.yaml', '.yml', '.toml', '.ini', '.env'],
    test: ['.test.ts', '.test.js', '.spec.ts', '.spec.js', '.feature'],
    doc: ['.md', '.txt', '.rst']
  };

  const priorityFiles = [
    'package.json',
    'tsconfig.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    '.gitignore',
    'README.md'
  ];

  for (const priorityFile of priorityFiles) {
    const filePath = path.join(rootDir, priorityFile);
    try {
      const stats = await fs.stat(filePath);
      if (stats.size <= maxFileSize) {
        const content = await fs.readFile(filePath, 'utf-8');
        files.push({
          path: priorityFile,
          content,
          size: stats.size,
          type: priorityFile.endsWith('.md') ? 'doc' : 'config'
        });
      }
    } catch {
      // Skip missing priority files.
    }
  }

  async function scanDirectory(dir: string): Promise<void> {
    if (files.length >= maxFiles) {
      return;
    }

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (files.length >= maxFiles) {
          break;
        }

        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(rootDir, fullPath);

        if (
          relativePath.startsWith('.git') ||
          relativePath.startsWith('node_modules') ||
          relativePath.startsWith('dist') ||
          relativePath.startsWith('build') ||
          relativePath.startsWith('.speclinter')
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
          continue;
        }

        const ext = path.extname(entry.name);
        let fileType: CollectedFile['type'] | null = null;

        if (extensions.source.includes(ext)) fileType = 'source';
        else if (extensions.config.includes(ext)) fileType = 'config';
        else if (extensions.test.some(testExt => entry.name.endsWith(testExt))) fileType = 'test';
        else if (extensions.doc.includes(ext)) fileType = 'doc';

        if (!fileType) {
          continue;
        }

        try {
          const stats = await fs.stat(fullPath);
          if (stats.size > maxFileSize) continue;

          const content = await fs.readFile(fullPath, 'utf-8');

          files.push({
            path: relativePath,
            content,
            size: stats.size,
            type: fileType
          });
        } catch {
          continue;
        }
      }
    } catch {
      return;
    }
  }

  await scanDirectory(rootDir);
  return files;
}
