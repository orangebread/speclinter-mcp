import { promises as fs } from 'fs';
import path from 'path';

export interface TechStack {
  frontend?: string;
  backend?: string;
  database?: string;
  testing?: string;
  buildTool?: string;
  packageManager?: string;
}

export interface CodePattern {
  name: string;
  description: string;
  example: string;
}

export interface CodebaseAnalysis {
  techStack: TechStack;
  errorPatterns: CodePattern[];
  apiPatterns: CodePattern[];
  testPatterns: CodePattern[];
  namingConventions: {
    fileNaming: string;
    variableNaming: string;
    functionNaming: string;
  };
  projectStructure: {
    srcDir: string;
    testDir: string;
    configFiles: string[];
  };
}

export class CodebaseAnalyzer {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async analyze(): Promise<CodebaseAnalysis> {
    const techStack = await this.detectTechStack();
    const projectStructure = await this.analyzeProjectStructure();
    const errorPatterns = await this.findErrorPatterns();
    const apiPatterns = await this.findApiPatterns();
    const testPatterns = await this.findTestPatterns();
    const namingConventions = await this.analyzeNamingConventions();

    return {
      techStack,
      errorPatterns,
      apiPatterns,
      testPatterns,
      namingConventions,
      projectStructure
    };
  }

  private async detectTechStack(): Promise<TechStack> {
    const stack: TechStack = {};

    try {
      // Check package.json for Node.js projects
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Detect frontend frameworks
      if (deps.react) stack.frontend = 'React';
      else if (deps.vue) stack.frontend = 'Vue';
      else if (deps['@angular/core']) stack.frontend = 'Angular';
      else if (deps.svelte) stack.frontend = 'Svelte';
      
      // Detect backend frameworks
      if (deps.express) stack.backend = 'Express';
      else if (deps.fastify) stack.backend = 'Fastify';
      else if (deps.koa) stack.backend = 'Koa';
      else if (deps['@nestjs/core']) stack.backend = 'NestJS';
      
      // Detect databases
      if (deps.mongoose || deps.mongodb) stack.database = 'MongoDB';
      else if (deps.pg || deps.postgres) stack.database = 'PostgreSQL';
      else if (deps.mysql || deps.mysql2) stack.database = 'MySQL';
      else if (deps.sqlite3 || deps['better-sqlite3']) stack.database = 'SQLite';
      
      // Detect testing frameworks
      if (deps.vitest) stack.testing = 'Vitest';
      else if (deps.jest) stack.testing = 'Jest';
      else if (deps.mocha) stack.testing = 'Mocha';
      else if (deps.cypress) stack.testing = 'Cypress';
      
      // Detect build tools
      if (deps.vite) stack.buildTool = 'Vite';
      else if (deps.webpack) stack.buildTool = 'Webpack';
      else if (deps.rollup) stack.buildTool = 'Rollup';
      else if (deps.esbuild) stack.buildTool = 'ESBuild';
      
      // Detect package manager
      if (await this.fileExists('pnpm-lock.yaml')) stack.packageManager = 'pnpm';
      else if (await this.fileExists('yarn.lock')) stack.packageManager = 'yarn';
      else if (await this.fileExists('package-lock.json')) stack.packageManager = 'npm';
      
    } catch (error) {
      // Try other language ecosystems
      if (await this.fileExists('requirements.txt') || await this.fileExists('pyproject.toml')) {
        stack.backend = 'Python';
      } else if (await this.fileExists('Cargo.toml')) {
        stack.backend = 'Rust';
      } else if (await this.fileExists('go.mod')) {
        stack.backend = 'Go';
      }
    }

    return stack;
  }

  private async analyzeProjectStructure() {
    const structure = {
      srcDir: '',
      testDir: '',
      configFiles: [] as string[]
    };

    // Find source directory
    const possibleSrcDirs = ['src', 'lib', 'app', 'source'];
    for (const dir of possibleSrcDirs) {
      if (await this.directoryExists(dir)) {
        structure.srcDir = dir;
        break;
      }
    }

    // Find test directory
    const possibleTestDirs = ['test', 'tests', '__tests__', 'spec'];
    for (const dir of possibleTestDirs) {
      if (await this.directoryExists(dir)) {
        structure.testDir = dir;
        break;
      }
    }

    // Find config files
    const configFiles = [
      'package.json', 'tsconfig.json', 'vite.config.ts', 'vite.config.js',
      'webpack.config.js', 'rollup.config.js', '.eslintrc.json', '.prettierrc'
    ];
    
    for (const file of configFiles) {
      if (await this.fileExists(file)) {
        structure.configFiles.push(file);
      }
    }

    return structure;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.projectRoot, filePath));
      return true;
    } catch {
      return false;
    }
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(path.join(this.projectRoot, dirPath));
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  private async findErrorPatterns(): Promise<CodePattern[]> {
    const patterns: CodePattern[] = [];
    const sourceFiles = await this.findSourceFiles();

    for (const file of sourceFiles.slice(0, 10)) { // Limit to first 10 files for MVP
      try {
        const content = await fs.readFile(file, 'utf-8');

        // Look for try-catch patterns
        if (content.includes('try {') && content.includes('catch')) {
          patterns.push({
            name: 'Try-Catch Error Handling',
            description: 'Standard try-catch error handling pattern',
            example: this.extractCodeExample(content, /try\s*{[\s\S]*?catch\s*\([^)]*\)\s*{[\s\S]*?}/m)
          });
        }

        // Look for Result type patterns
        if (content.includes('Result<') || content.includes('{ success:')) {
          patterns.push({
            name: 'Result Type Pattern',
            description: 'Functional error handling with Result types',
            example: this.extractCodeExample(content, /(?:Result<|{\s*success:)[\s\S]*?}/m)
          });
        }

        // Look for Promise rejection handling
        if (content.includes('.catch(') || content.includes('Promise.reject')) {
          patterns.push({
            name: 'Promise Error Handling',
            description: 'Promise-based error handling',
            example: this.extractCodeExample(content, /\.catch\([^)]*\)|Promise\.reject\([^)]*\)/m)
          });
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    return this.deduplicatePatterns(patterns);
  }

  private async findApiPatterns(): Promise<CodePattern[]> {
    const patterns: CodePattern[] = [];
    const sourceFiles = await this.findSourceFiles();

    for (const file of sourceFiles.slice(0, 10)) {
      try {
        const content = await fs.readFile(file, 'utf-8');

        // Express.js patterns
        if (content.includes('app.get(') || content.includes('router.')) {
          patterns.push({
            name: 'Express Route Handler',
            description: 'Express.js route definition pattern',
            example: this.extractCodeExample(content, /(?:app|router)\.\w+\([^)]*\)[^{]*{[\s\S]*?}/m)
          });
        }

        // API response patterns
        if (content.includes('res.json(') || content.includes('response.')) {
          patterns.push({
            name: 'JSON API Response',
            description: 'Standard JSON API response pattern',
            example: this.extractCodeExample(content, /res\.json\([^)]*\)|response\.[\w.]*\([^)]*\)/m)
          });
        }

        // Fetch/Axios patterns
        if (content.includes('fetch(') || content.includes('axios.')) {
          patterns.push({
            name: 'HTTP Client Pattern',
            description: 'HTTP client request pattern',
            example: this.extractCodeExample(content, /(?:fetch|axios)\.[^;]*;?/m)
          });
        }
      } catch (error) {
        continue;
      }
    }

    return this.deduplicatePatterns(patterns);
  }

  private async findTestPatterns(): Promise<CodePattern[]> {
    const patterns: CodePattern[] = [];
    const testFiles = await this.findTestFiles();

    for (const file of testFiles.slice(0, 5)) {
      try {
        const content = await fs.readFile(file, 'utf-8');

        // Jest/Vitest patterns
        if (content.includes('describe(') && content.includes('it(')) {
          patterns.push({
            name: 'Jest/Vitest Test Suite',
            description: 'Standard Jest/Vitest test structure',
            example: this.extractCodeExample(content, /describe\([^{]*{[\s\S]*?it\([^{]*{[\s\S]*?}\s*\)/m)
          });
        }

        // Expect assertions
        if (content.includes('expect(')) {
          patterns.push({
            name: 'Expect Assertions',
            description: 'Jest/Vitest expect assertion pattern',
            example: this.extractCodeExample(content, /expect\([^)]*\)\.[^;]*;?/m)
          });
        }

        // Mock patterns
        if (content.includes('jest.mock(') || content.includes('vi.mock(')) {
          patterns.push({
            name: 'Mock Pattern',
            description: 'Test mocking pattern',
            example: this.extractCodeExample(content, /(?:jest|vi)\.mock\([^)]*\)/m)
          });
        }
      } catch (error) {
        continue;
      }
    }

    return this.deduplicatePatterns(patterns);
  }

  private async analyzeNamingConventions() {
    const sourceFiles = await this.findSourceFiles();
    const conventions = {
      fileNaming: 'kebab-case',
      variableNaming: 'camelCase',
      functionNaming: 'camelCase'
    };

    // Analyze file naming patterns
    const fileNames = sourceFiles.map(f => path.basename(f, path.extname(f)));
    if (fileNames.some(name => name.includes('_'))) {
      conventions.fileNaming = 'snake_case';
    } else if (fileNames.some(name => /[A-Z]/.test(name))) {
      conventions.fileNaming = 'PascalCase';
    }

    // For MVP, we'll use simple heuristics
    // In a more advanced version, we could parse AST to analyze variable/function naming

    return conventions;
  }

  private async findSourceFiles(): Promise<string[]> {
    const files: string[] = [];
    const srcDir = path.join(this.projectRoot, 'src');

    try {
      await this.collectFiles(srcDir, files, ['.ts', '.js', '.tsx', '.jsx']);
    } catch {
      // If src doesn't exist, try root directory
      await this.collectFiles(this.projectRoot, files, ['.ts', '.js', '.tsx', '.jsx'], 1);
    }

    return files.filter(f => !f.includes('node_modules') && !f.includes('.min.'));
  }

  private async findTestFiles(): Promise<string[]> {
    const files: string[] = [];
    const testDirs = ['test', 'tests', '__tests__', 'spec'];

    for (const testDir of testDirs) {
      const fullPath = path.join(this.projectRoot, testDir);
      try {
        await this.collectFiles(fullPath, files, ['.test.ts', '.test.js', '.spec.ts', '.spec.js']);
      } catch {
        // Directory doesn't exist, continue
      }
    }

    // Also look for test files in src directory
    const srcDir = path.join(this.projectRoot, 'src');
    try {
      await this.collectFiles(srcDir, files, ['.test.ts', '.test.js', '.spec.ts', '.spec.js']);
    } catch {
      // Src doesn't exist
    }

    return files;
  }

  private async collectFiles(
    dir: string,
    files: string[],
    extensions: string[],
    maxDepth: number = 3,
    currentDepth: number = 0
  ): Promise<void> {
    if (currentDepth >= maxDepth) return;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await this.collectFiles(fullPath, files, extensions, maxDepth, currentDepth + 1);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          const hasTestExt = extensions.some(testExt => entry.name.endsWith(testExt));

          if (extensions.includes(ext) || hasTestExt) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  private extractCodeExample(content: string, pattern: RegExp): string {
    const match = content.match(pattern);
    if (match) {
      // Clean up the example and limit length
      let example = match[0].trim();
      if (example.length > 200) {
        example = example.substring(0, 200) + '...';
      }
      return example;
    }
    return 'Pattern found but example could not be extracted';
  }

  private deduplicatePatterns(patterns: CodePattern[]): CodePattern[] {
    const seen = new Set<string>();
    return patterns.filter(pattern => {
      if (seen.has(pattern.name)) {
        return false;
      }
      seen.add(pattern.name);
      return true;
    });
  }
}
