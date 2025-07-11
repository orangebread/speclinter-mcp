import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import {
  handleAnalyzeCodebaseAI,
  handleUpdateContextFilesAI,
  handleParseSpecAI,
  handleFindSimilarAI,
  handleProcessSimilarityAnalysisAI
} from '../src/ai-tools.js';
import {
  AIContextFilesSchema,
  AICodebaseAnalysisSchema
} from '../src/types/ai-schemas.js';
import { StorageManager } from '../src/core/storage-manager.js';

describe('AI-Leveraged Tools', () => {
  const testProjectRoot = path.join(process.cwd(), 'test-temp');

  beforeEach(async () => {
    // Create test project structure
    await fs.mkdir(testProjectRoot, { recursive: true });
    await fs.mkdir(path.join(testProjectRoot, '.speclinter'), { recursive: true });
    await fs.mkdir(path.join(testProjectRoot, '.speclinter', 'context'), { recursive: true });
    await fs.mkdir(path.join(testProjectRoot, 'src'), { recursive: true });
    
    // Create test files
    await fs.writeFile(
      path.join(testProjectRoot, 'package.json'),
      JSON.stringify({
        name: 'test-project',
        dependencies: {
          'react': '^18.0.0',
          'express': '^4.18.0'
        },
        devDependencies: {
          'vitest': '^1.0.0'
        }
      }, null, 2)
    );

    await fs.writeFile(
      path.join(testProjectRoot, 'src', 'app.ts'),
      `
import express from 'express';

const app = express();

app.get('/api/users', async (req, res) => {
  try {
    const users = await getUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

async function getUsers() {
  // Mock implementation
  return [{ id: 1, name: 'John' }];
}

export default app;
      `
    );

    await fs.writeFile(
      path.join(testProjectRoot, 'src', 'app.test.ts'),
      `
import { describe, it, expect } from 'vitest';
import app from './app.js';

describe('App', () => {
  it('should handle user requests', async () => {
    expect(app).toBeDefined();
  });
});
      `
    );

    // Create SpecLinter config
    await fs.writeFile(
      path.join(testProjectRoot, '.speclinter', 'config.json'),
      JSON.stringify({
        version: "1.0.0",
        grading: {
          strictMode: false,
          minWordCount: 20,
          requireAcceptanceCriteria: true,
          requireUserStory: false,
          vagueTerms: ["fast", "easy", "good", "simple", "nice"],
          gradeThresholds: { A: 90, B: 80, C: 70, D: 60 }
        },
        generation: {
          tasksPerFeature: 10,
          includePatterns: true,
          testFramework: "vitest",
          gherkinStyle: "declarative"
        },
        storage: {
          tasksDir: "./speclinter-tasks",
          dbPath: "./.speclinter/speclinter.db",
          useGit: true
        },
        context: {
          autoDetect: true,
          contextDir: "./.speclinter/context",
          fallbackStack: "node"
        },
        deduplication: {
          enabled: true,
          similarityThreshold: 0.8,
          defaultStrategy: "prompt",
          autoMergeThreshold: 0.95,
          taskSimilarityThreshold: 0.9
        }
      }, null, 2)
    );
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testProjectRoot, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('handleAnalyzeCodebaseAI', () => {
    it('should collect files and return AI analysis prompt with context generation', async () => {
      const result = await handleAnalyzeCodebaseAI({
        project_root: testProjectRoot,
        max_files: 10
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('ai_analysis_required');
      expect(result.analysis_prompt).toContain('Analyze the provided codebase files');
      expect(result.analysis_prompt).toContain('package.json');
      expect(result.analysis_prompt).toContain('app.ts');
      expect(result.analysis_prompt).toContain('generate complete, professional context files');
      expect(result.analysis_prompt).toContain('AICodebaseAnalysisWithContextSchema');
      expect(result.follow_up_tool).toBe('update_context_files_ai');
      expect(result.schema).toBe('AICodebaseAnalysisWithContextSchema');
      expect(result.files_analyzed).toBeGreaterThan(0);
    });

    it('should limit file collection based on max_files parameter', async () => {
      const result = await handleAnalyzeCodebaseAI({
        project_root: testProjectRoot,
        max_files: 2
      });

      expect(result.success).toBe(true);
      expect(result.files_analyzed).toBeLessThanOrEqual(2);
    });
  });

  describe('handleUpdateContextFilesAI', () => {
    it('should process valid AI analysis and context files (Option A)', async () => {
      const mockAnalysis = {
        techStack: {
          frontend: 'React',
          backend: 'Express',
          testing: 'Vitest',
          packageManager: 'npm',
          confidence: 0.95
        },
        errorPatterns: [{
          name: 'Try-Catch Error Handling',
          description: 'Standard try-catch error handling pattern',
          example: 'try { ... } catch (error) { ... }',
          confidence: 0.9,
          locations: [{ file: 'src/app.ts' }]
        }],
        apiPatterns: [{
          name: 'Express Route Handler',
          description: 'Express.js route definition pattern',
          example: 'app.get("/api/users", async (req, res) => { ... })',
          confidence: 0.95,
          locations: [{ file: 'src/app.ts' }]
        }],
        testPatterns: [{
          name: 'Vitest Test Suite',
          description: 'Standard Vitest test structure',
          example: 'describe("App", () => { it("should...", () => { ... }); });',
          confidence: 0.9,
          locations: [{ file: 'src/app.test.ts' }]
        }],
        namingConventions: {
          fileNaming: 'kebab-case',
          variableNaming: 'camelCase',
          functionNaming: 'camelCase',
          examples: [
            { type: 'file', example: 'app.ts', convention: 'kebab-case' },
            { type: 'function', example: 'getUsers', convention: 'camelCase' }
          ]
        },
        projectStructure: {
          srcDir: 'src',
          testDir: 'src',
          configFiles: ['package.json'],
          entryPoints: ['src/app.ts'],
          architecture: 'monolith',
          organizationPattern: 'by-type'
        },
        codeQuality: {
          overallScore: 85,
          maintainability: 80,
          documentation: 70,
          issues: [{
            type: 'missing_comments',
            severity: 'medium',
            description: 'Some functions lack documentation',
            suggestion: 'Add JSDoc comments to public functions'
          }]
        },
        insights: [
          'Project uses modern JavaScript/TypeScript patterns',
          'Good error handling practices in API routes'
        ],
        recommendations: [
          'Add more comprehensive error handling',
          'Consider adding input validation middleware'
        ]
      };

      const mockContextFiles = {
        projectMd: `# Test Project

## Stack (AI Confidence: 95%)
- **Frontend**: React
- **Backend**: Express
- **Testing**: Vitest
- **Package Manager**: npm

## Architecture Decisions

### System Architecture
**Decision**: Monolith architecture
**Context**: by-type organization pattern
**Consequences**:
- ✅ Project uses modern JavaScript/TypeScript patterns
- ✅ Good error handling practices in API routes
- ⚠️ Add more comprehensive error handling`,

        patternsMd: `# AI-Discovered Code Patterns

## Error Handling Patterns

### Try-Catch Error Handling (Confidence: 90%)
Standard try-catch error handling pattern

**Found in**: src/app.ts

\`\`\`typescript
try { ... } catch (error) { ... }
\`\`\`

## API Patterns

### Express Route Handler (Confidence: 95%)
Express.js route definition pattern

**Found in**: src/app.ts

\`\`\`typescript
app.get("/api/users", async (req, res) => { ... })
\`\`\`

## Testing Patterns

### Vitest Test Suite (Confidence: 90%)
Standard Vitest test structure

**Found in**: src/app.test.ts

\`\`\`typescript
describe("App", () => { it("should...", () => { ... }); });
\`\`\`

## AI Insights
- Project uses modern JavaScript/TypeScript patterns
- Good error handling practices in API routes

## AI Recommendations
- Add more comprehensive error handling
- Consider adding input validation middleware`,

        architectureMd: `# System Architecture

## Overview
This project follows a **monolith** architecture with by-type organization pattern.

## Key Components
- **Frontend**: React-based user interface
- **Backend**: Express.js server
- **Testing**: Vitest testing framework

## Design Decisions

### Architecture Pattern
- **Choice**: Monolith architecture
- **Rationale**: Suitable for the current project scope and team size
- **Trade-offs**: Simpler deployment but potential scalability concerns

### Technology Stack
- **Frontend Framework**: React (confidence: 95%)
- **Backend Framework**: Express.js
- **Testing Strategy**: Vitest for unit and integration tests

## Quality Assessment
- **Overall Score**: 85/100
- **Maintainability**: 80/100
- **Documentation**: 70/100`
      };

      const result = await handleUpdateContextFilesAI({
        analysis: mockAnalysis,
        contextFiles: mockContextFiles,
        project_root: testProjectRoot
      });

      expect(result.success).toBe(true);
      expect(result.updatedFiles).toHaveLength(3); // Now includes architecture.md
      expect(result.ai_confidence).toBe(0.95);
      expect(result.analysis?.codeQuality.overallScore).toBe(85);
      expect(result.content_generation).toBe('complete_ai_generated');

      // Verify context files were created with AI-generated content
      const projectFile = await fs.readFile(
        path.join(testProjectRoot, '.speclinter', 'context', 'project.md'),
        'utf-8'
      );
      expect(projectFile).toContain('React');
      expect(projectFile).toContain('Express');
      expect(projectFile).toContain('AI Confidence: 95%');
      expect(projectFile).toContain('Architecture Decisions');

      const patternsFile = await fs.readFile(
        path.join(testProjectRoot, '.speclinter', 'context', 'patterns.md'),
        'utf-8'
      );
      expect(patternsFile).toContain('Try-Catch Error Handling');
      expect(patternsFile).toContain('Express Route Handler');
      expect(patternsFile).toContain('AI Insights');
      expect(patternsFile).toContain('modern JavaScript/TypeScript patterns');

      // Verify architecture.md was created
      const architectureFile = await fs.readFile(
        path.join(testProjectRoot, '.speclinter', 'context', 'architecture.md'),
        'utf-8'
      );
      expect(architectureFile).toContain('System Architecture');
      expect(architectureFile).toContain('Monolith architecture');
      expect(architectureFile).toContain('**Overall Score**: 85/100');
    });

    it('should handle missing contextFiles parameter', async () => {
      const result = await handleUpdateContextFilesAI({
        analysis: { invalid: 'data' },
        project_root: testProjectRoot
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Both analysis and contextFiles data are required');
    });

    it('should handle invalid AI analysis gracefully', async () => {
      const result = await handleUpdateContextFilesAI({
        analysis: { invalid: 'data' },
        contextFiles: { invalid: 'data' },
        project_root: testProjectRoot
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not match expected schema');
    });
  });

  describe('handleParseSpecAI', () => {
    it('should prepare spec for AI analysis with project context', async () => {
      const spec = 'Create a user authentication system with login, logout, and password reset functionality. Users should be able to register with email and password, and receive email confirmations.';
      
      const result = await handleParseSpecAI({
        spec,
        feature_name: 'user-auth',
        context: 'This is for a web application',
        project_root: testProjectRoot
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('ai_analysis_required');
      expect(result.feature_name).toBe('user-auth');
      expect(result.original_spec).toBe(spec);
      expect(result.analysis_prompt).toContain('Analyze the provided specification');
      expect(result.analysis_prompt).toContain(spec);
      expect(result.follow_up_tool).toBe('process_spec_analysis_ai');
    });
  });

  describe('handleFindSimilarAI', () => {
    it('should prepare similarity analysis with existing features', async () => {
      // First create a feature to compare against
      const { StorageManager } = await import('../src/core/storage-manager.js');
      const storage = await StorageManager.createInitializedStorage(testProjectRoot);

      // Mock an existing feature
      await storage.saveFeature(
        'existing-feature',
        [{
          id: 'task_01',
          title: 'Create user login',
          slug: 'create-user-login',
          summary: 'Implement user authentication',
          implementation: 'Build login form and validation',
          status: 'not_started',
          statusEmoji: '⏳',
          featureName: 'existing-feature',
          acceptanceCriteria: ['User can enter credentials', 'System validates login'],
          testFile: 'login.feature',
          coverageTarget: '90%',
          notes: 'Use secure authentication',
          relevantPatterns: []
        }],
        {
          spec: 'Create a user authentication system with login functionality',
          grade: 'A',
          score: 90,
          tasks: [],
          improvements: [],
          missingElements: []
        }
      );

      const spec = 'Build a user login system with authentication and session management';

      const result = await handleFindSimilarAI({
        spec,
        threshold: 0.8,
        project_root: testProjectRoot
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('ai_analysis_required');
      expect(result.analysis_prompt).toContain('determine semantic similarity');
      expect(result.analysis_prompt).toContain(spec);
      expect(result.analysis_prompt).toContain('existing-feature');
      expect(result.follow_up_tool).toBe('process_similarity_analysis_ai');
      expect(result.existing_features_count).toBe(1);
    });

    it('should handle no existing features gracefully', async () => {
      const spec = 'Create a new feature with no existing comparisons';

      const result = await handleFindSimilarAI({
        spec,
        project_root: testProjectRoot
      });

      expect(result.success).toBe(true);
      expect(result.similar_features).toEqual([]);
      expect(result.message).toBe('No existing features to compare against');
    });
  });

  describe('handleProcessSimilarityAnalysisAI', () => {
    it('should process AI similarity analysis and return recommendations', async () => {
      const mockAnalysis = {
        similarFeatures: [{
          featureName: 'user-auth',
          similarityScore: 0.85,
          similarityReasons: [
            'Both involve user authentication',
            'Similar login functionality'
          ],
          differences: [
            'New feature includes password reset',
            'Different session management approach'
          ],
          recommendation: 'separate'
        }],
        overallAssessment: 'Features have significant overlap but serve different purposes',
        confidence: 0.9
      };

      const result = await handleProcessSimilarityAnalysisAI({
        analysis: mockAnalysis,
        threshold: 0.8,
        project_root: testProjectRoot
      });

      expect(result.success).toBe(true);
      expect(result.similar_features).toHaveLength(1);
      expect(result.similar_features?.[0].feature_name).toBe('user-auth');
      expect(result.similar_features?.[0].similarity).toBe(0.85);
      expect(result.ai_assessment).toBe('Features have significant overlap but serve different purposes');
      expect(result.ai_confidence).toBe(0.9);
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations?.[0].action).toBe('separate');
    });

    it('should handle no similar features found', async () => {
      const mockAnalysis = {
        similarFeatures: [],
        overallAssessment: 'Feature appears to be unique',
        confidence: 0.95
      };

      const result = await handleProcessSimilarityAnalysisAI({
        analysis: mockAnalysis,
        threshold: 0.8,
        project_root: testProjectRoot
      });

      expect(result.success).toBe(true);
      expect(result.similar_features).toHaveLength(0);
      expect(result.next_steps).toContain('No similar features found - proceed with implementation');
    });

    it('should handle invalid AI analysis gracefully', async () => {
      const result = await handleProcessSimilarityAnalysisAI({
        analysis: { invalid: 'data' },
        project_root: testProjectRoot
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not match expected schema');
    });
  });

  describe('Option A Schema Tests', () => {
    it('should validate AIContextFilesSchema correctly', () => {
      const validContextFiles = {
        projectMd: '# Project\n\n## Stack\n- **Language**: TypeScript',
        patternsMd: '# Code Patterns\n\n## Error Handling\n*No patterns detected*',
        architectureMd: '# Architecture\n\n## System Design\nMonolith architecture'
      };

      const result = AIContextFilesSchema.safeParse(validContextFiles);
      expect(result.success).toBe(true);
    });

    it('should reject invalid AIContextFilesSchema', () => {
      const invalidContextFiles = {
        projectMd: '# Project',
        // Missing patternsMd and architectureMd
      };

      const result = AIContextFilesSchema.safeParse(invalidContextFiles);
      expect(result.success).toBe(false);
    });

    it('should validate complete AI-generated content structure', () => {
      const mockAnalysis = {
        techStack: { confidence: 0.9 },
        errorPatterns: [],
        apiPatterns: [],
        testPatterns: [],
        namingConventions: { fileNaming: 'kebab-case', variableNaming: 'camelCase', functionNaming: 'camelCase', examples: [] },
        projectStructure: { srcDir: 'src', testDir: 'test', configFiles: [], entryPoints: [], architecture: 'monolith', organizationPattern: 'by-type' },
        codeQuality: { overallScore: 80, maintainability: 75, documentation: 60, issues: [] },
        insights: [],
        recommendations: []
      };

      const mockContextFiles = {
        projectMd: '# Project\n\nComplete AI-generated project documentation',
        patternsMd: '# Patterns\n\nComplete AI-generated patterns documentation',
        architectureMd: '# Architecture\n\nComplete AI-generated architecture documentation'
      };

      const analysisResult = AICodebaseAnalysisSchema.safeParse(mockAnalysis);
      const contextResult = AIContextFilesSchema.safeParse(mockContextFiles);

      expect(analysisResult.success).toBe(true);
      expect(contextResult.success).toBe(true);
    });
  });

  describe('Integration Test', () => {
    it('should complete full AI-leveraged codebase analysis workflow', async () => {
      // Step 1: Analyze codebase
      const analyzeResult = await handleAnalyzeCodebaseAI({
        project_root: testProjectRoot,
        max_files: 5
      });

      expect(analyzeResult.success).toBe(true);
      expect(analyzeResult.analysis_prompt).toBeDefined();

      // Step 2: Process mock AI analysis
      const mockAnalysis = {
        techStack: {
          frontend: 'React',
          backend: 'Express',
          testing: 'Vitest',
          confidence: 0.9
        },
        errorPatterns: [],
        apiPatterns: [],
        testPatterns: [],
        namingConventions: {
          fileNaming: 'kebab-case',
          variableNaming: 'camelCase',
          functionNaming: 'camelCase',
          examples: []
        },
        projectStructure: {
          srcDir: 'src',
          testDir: 'src',
          configFiles: ['package.json'],
          entryPoints: ['src/app.ts'],
          architecture: 'monolith',
          organizationPattern: 'by-type'
        },
        codeQuality: {
          overallScore: 80,
          maintainability: 75,
          documentation: 60,
          issues: []
        },
        insights: ['Well-structured Express application'],
        recommendations: ['Add more tests']
      };

      const mockContextFiles = {
        projectMd: `# Test Project\n\n## Stack\n- **Frontend**: React\n- **Backend**: Express\n- **Testing**: Vitest`,
        patternsMd: `# AI-Discovered Code Patterns\n\n*No patterns detected*`,
        architectureMd: `# System Architecture\n\n## Overview\nMonolith architecture with Express backend and React frontend.`
      };

      const updateResult = await handleUpdateContextFilesAI({
        analysis: mockAnalysis,
        contextFiles: mockContextFiles,
        project_root: testProjectRoot
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.updatedFiles).toHaveLength(3);
      expect(updateResult.content_generation).toBe('complete_ai_generated');

      // Verify files exist and contain expected content
      const projectFile = await fs.readFile(
        path.join(testProjectRoot, '.speclinter', 'context', 'project.md'),
        'utf-8'
      );
      expect(projectFile).toContain('Express');
      expect(projectFile).toContain('React');

      // Verify architecture.md was created
      const architectureFile = await fs.readFile(
        path.join(testProjectRoot, '.speclinter', 'context', 'architecture.md'),
        'utf-8'
      );
      expect(architectureFile).toContain('System Architecture');
    });
  });

  describe('AI Implementation Validation', () => {
    beforeEach(async () => {
      // Create a test feature with tasks
      const storage = await StorageManager.createInitializedStorage(testProjectRoot);
      await storage.saveFeature(
        'test-validation-feature',
        [{
          id: 'task_01',
          title: 'Create user authentication endpoint',
          slug: 'create-user-auth-endpoint',
          summary: 'Implement POST /api/auth/login endpoint with validation',
          implementation: 'Create Express route with bcrypt password validation',
          status: 'completed',
          statusEmoji: '✅',
          featureName: 'test-validation-feature',
          acceptanceCriteria: [
            'Endpoint accepts email and password',
            'Returns JWT token on successful login',
            'Returns 401 for invalid credentials',
            'Validates input format'
          ],
          testFile: 'auth-login.feature',
          coverageTarget: '90%',
          notes: 'Use bcrypt for password hashing',
          relevantPatterns: []
        }],
        {
          spec: 'Create user authentication system with login endpoint',
          grade: 'A',
          score: 90,
          tasks: [],
          improvements: [],
          missingElements: []
        }
      );

      // Create mock implementation file
      await fs.writeFile(
        path.join(testProjectRoot, 'src', 'auth.ts'),
        `
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user (mock implementation)
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function findUserByEmail(email: string) {
  // Mock user lookup
  return { id: 1, email, passwordHash: 'hashed_password' };
}

export default router;
        `
      );
    });

    it('should prepare validation analysis with feature context', async () => {
      const { handleValidateImplementationPrepare } = await import('../src/ai-tools.js');

      const result = await handleValidateImplementationPrepare({
        feature_name: 'test-validation-feature',
        project_root: testProjectRoot
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('ai_analysis_required');
      expect(result.feature_name).toBe('test-validation-feature');
      expect(result.validation_prompt).toContain('Create user authentication endpoint');
      expect(result.validation_prompt).toContain('POST /api/auth/login');
      expect(result.validation_prompt).toContain('auth.ts');
      expect(result.follow_up_tool).toBe('validate_implementation_process');
      expect(result.schema).toBe('AIFeatureValidationSchema');
      expect(result.feature_context?.tasks).toBe(1);
      expect(result.feature_context?.files_found).toBeGreaterThan(0);
    });

    it('should handle validation for non-existent feature', async () => {
      const { handleValidateImplementationPrepare } = await import('../src/ai-tools.js');

      const result = await handleValidateImplementationPrepare({
        feature_name: 'non-existent-feature',
        project_root: testProjectRoot
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Feature \'non-existent-feature\' not found');
    });

    it('should validate AI schema compliance', async () => {
      const { AIFeatureValidationSchema } = await import('../src/types/ai-schemas.js');

      const validValidation = {
        featureName: 'test-feature',
        overallStatus: 'complete',
        completionPercentage: 100,
        qualityScore: 95,
        taskValidations: [],
        architecturalAlignment: {
          score: 90,
          strengths: [],
          concerns: [],
          recommendations: []
        },
        testCoverage: {
          hasTests: true,
          testTypes: ['unit'],
          coverage: 85,
          testQuality: 'good',
          missingTests: []
        },
        securityConsiderations: [],
        performanceConsiderations: [],
        nextSteps: [],
        aiInsights: {
          strengths: [],
          weaknesses: [],
          surprises: [],
          confidence: 0.9
        }
      };

      const result = AIFeatureValidationSchema.safeParse(validValidation);
      expect(result.success).toBe(true);
    });
  });
});
