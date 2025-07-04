import { z } from 'zod';

// Base schemas for AI responses
export const AICodePatternSchema = z.object({
  name: z.string().describe('Name of the code pattern'),
  description: z.string().describe('Description of what this pattern does'),
  example: z.string().describe('Code example demonstrating the pattern'),
  confidence: z.number().min(0).max(1).describe('AI confidence in pattern detection (0-1)'),
  locations: z.array(z.object({
    file: z.string(),
    lineStart: z.number().optional(),
    lineEnd: z.number().optional()
  })).describe('Files where this pattern was found')
});

export const AITechStackSchema = z.object({
  frontend: z.string().optional().describe('Frontend framework/library detected'),
  backend: z.string().optional().describe('Backend framework detected'),
  database: z.string().optional().describe('Database technology detected'),
  testing: z.string().optional().describe('Testing framework detected'),
  buildTool: z.string().optional().describe('Build tool detected'),
  packageManager: z.string().optional().describe('Package manager detected'),
  language: z.string().optional().describe('Primary programming language'),
  confidence: z.number().min(0).max(1).describe('Overall confidence in tech stack detection')
});

export const AINamingConventionsSchema = z.object({
  fileNaming: z.string().describe('File naming convention (e.g., kebab-case, camelCase)'),
  variableNaming: z.string().describe('Variable naming convention'),
  functionNaming: z.string().describe('Function naming convention'),
  classNaming: z.string().optional().describe('Class naming convention if applicable'),
  constantNaming: z.string().optional().describe('Constant naming convention'),
  examples: z.array(z.object({
    type: z.enum(['file', 'variable', 'function', 'class', 'constant']),
    example: z.string(),
    convention: z.string()
  })).describe('Examples of naming conventions found')
});

export const AIProjectStructureSchema = z.object({
  srcDir: z.string().describe('Main source directory'),
  testDir: z.string().describe('Test directory'),
  configFiles: z.array(z.string()).describe('Configuration files found'),
  entryPoints: z.array(z.string()).describe('Main entry point files'),
  architecture: z.enum(['monolith', 'microservices', 'modular', 'layered', 'unknown']).describe('Detected architecture pattern'),
  organizationPattern: z.string().describe('How code is organized (by feature, by type, etc.)')
});

// Comprehensive codebase analysis schema
export const AICodebaseAnalysisSchema = z.object({
  techStack: AITechStackSchema,
  errorPatterns: z.array(AICodePatternSchema).describe('Error handling patterns found'),
  apiPatterns: z.array(AICodePatternSchema).describe('API patterns found'),
  testPatterns: z.array(AICodePatternSchema).describe('Testing patterns found'),
  namingConventions: AINamingConventionsSchema,
  projectStructure: AIProjectStructureSchema,
  codeQuality: z.object({
    overallScore: z.number().min(0).max(100).describe('Overall code quality score'),
    maintainability: z.number().min(0).max(100).describe('Code maintainability score'),
    testCoverage: z.number().min(0).max(100).optional().describe('Estimated test coverage'),
    documentation: z.number().min(0).max(100).describe('Documentation quality score'),
    issues: z.array(z.object({
      type: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      description: z.string(),
      file: z.string().optional(),
      suggestion: z.string().optional()
    })).describe('Code quality issues found')
  }).describe('Code quality assessment'),
  insights: z.array(z.string()).describe('Key insights about the codebase'),
  recommendations: z.array(z.string()).describe('Recommendations for improvement')
});

// Spec analysis schemas
export const AISpecQualitySchema = z.object({
  score: z.number().min(0).max(100).describe('Overall spec quality score'),
  grade: z.enum(['A+', 'A', 'B', 'C', 'D', 'F']).describe('Letter grade for the spec'),
  issues: z.array(z.object({
    type: z.string().describe('Type of issue (e.g., vague_requirements, missing_acceptance_criteria)'),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    message: z.string().describe('Description of the issue'),
    suggestion: z.string().describe('How to fix this issue'),
    points: z.number().describe('Points deducted for this issue')
  })).describe('Quality issues found in the spec'),
  strengths: z.array(z.string()).describe('What the spec does well'),
  improvements: z.array(z.string()).describe('Specific improvements needed')
});

export const AITaskSchema = z.object({
  title: z.string().describe('Clear, actionable task title'),
  summary: z.string().describe('Brief summary of what needs to be done'),
  implementation: z.string().describe('Detailed implementation guidance'),
  acceptanceCriteria: z.array(z.string()).describe('Specific acceptance criteria'),
  estimatedEffort: z.enum(['XS', 'S', 'M', 'L', 'XL']).describe('Estimated effort/complexity'),
  dependencies: z.array(z.string()).describe('Other tasks this depends on'),
  testingNotes: z.string().describe('Testing considerations and approach'),
  relevantPatterns: z.array(z.string()).describe('Code patterns that apply to this task'),
  riskFactors: z.array(z.string()).describe('Potential risks or challenges')
});

export const AISpecAnalysisSchema = z.object({
  quality: AISpecQualitySchema,
  tasks: z.array(AITaskSchema).describe('Extracted tasks from the specification'),
  technicalConsiderations: z.array(z.string()).describe('Technical considerations and constraints'),
  userStories: z.array(z.string()).describe('User stories extracted or inferred'),
  businessValue: z.string().describe('Business value and impact of this feature'),
  scope: z.object({
    inScope: z.array(z.string()).describe('What is included in this feature'),
    outOfScope: z.array(z.string()).describe('What is explicitly not included'),
    assumptions: z.array(z.string()).describe('Assumptions made about the feature')
  })
});

// Similarity analysis schema
export const AISimilarityAnalysisSchema = z.object({
  similarFeatures: z.array(z.object({
    featureName: z.string(),
    similarityScore: z.number().min(0).max(1).describe('Semantic similarity score'),
    similarityReasons: z.array(z.string()).describe('Why these features are similar'),
    differences: z.array(z.string()).describe('Key differences between features'),
    recommendation: z.enum(['merge', 'separate', 'refactor']).describe('Recommended action')
  })).describe('Features with semantic similarity'),
  overallAssessment: z.string().describe('Overall assessment of feature uniqueness'),
  confidence: z.number().min(0).max(1).describe('Confidence in similarity analysis')
});

// AI prompt templates with detailed instructions
export const AIPromptTemplates = {
  codebaseAnalysis: `Analyze the provided codebase files and extract comprehensive information about:

1. **Tech Stack**: Identify frameworks, libraries, databases, testing tools, build tools, and package managers
   - Look for package.json, requirements.txt, Cargo.toml, go.mod, etc.
   - Identify frontend frameworks (React, Vue, Angular, etc.)
   - Detect backend frameworks (Express, FastAPI, Spring, etc.)
   - Find testing frameworks (Jest, Vitest, pytest, etc.)

2. **Code Patterns**: Find error handling, API, and testing patterns with specific examples
   - Error handling: try-catch blocks, Result types, error middleware
   - API patterns: REST endpoints, GraphQL resolvers, middleware usage
   - Testing patterns: test structure, mocking, assertion styles

3. **Naming Conventions**: Analyze how files, variables, functions, and classes are named
   - File naming: kebab-case, camelCase, PascalCase, snake_case
   - Variable/function naming patterns
   - Class and interface naming conventions

4. **Project Structure**: Understand the organization and architecture
   - Source directory structure
   - Separation of concerns (MVC, layered, etc.)
   - Configuration and build file organization

5. **Code Quality**: Assess maintainability, documentation, and identify issues
   - Rate overall quality (0-100)
   - Identify specific issues with severity levels
   - Assess documentation coverage and quality

6. **Insights & Recommendations**: Provide actionable insights
   - Key strengths of the codebase
   - Areas for improvement with specific suggestions
   - Best practices being followed or missing

Return a JSON response matching the AICodebaseAnalysisSchema. Be thorough but focus on the most significant patterns and insights.`,

  specAnalysis: `Analyze the provided specification and extract:

1. **Quality Assessment**: Score the spec and identify issues, strengths, and improvements
   - Rate overall quality (0-100) and assign letter grade (A+ to F)
   - Identify vague requirements, missing acceptance criteria, unclear scope
   - Note strengths like clear user stories, well-defined constraints
   - Suggest specific improvements with actionable recommendations

2. **Task Breakdown**: Extract clear, actionable tasks with implementation guidance
   - Create 5-10 specific, implementable tasks
   - Each task should be completable in 1-4 hours by a developer
   - Include detailed implementation guidance and technical approach
   - Provide clear acceptance criteria for each task
   - Estimate effort level (XS, S, M, L, XL)

3. **Technical Considerations**: Identify technical constraints and requirements
   - Performance requirements and scalability needs
   - Security considerations and compliance requirements
   - Integration points with existing systems
   - Technology stack recommendations

4. **Business Context**: Understand user stories and business value
   - Extract or infer user stories from the specification
   - Identify the business value and impact
   - Understand the target users and use cases

5. **Scope Definition**: Clarify what's in/out of scope and assumptions
   - Clearly define what is included in this feature
   - Identify what is explicitly excluded
   - List assumptions being made about the implementation

Return a JSON response matching the AISpecAnalysisSchema. Focus on creating implementable tasks with clear acceptance criteria.`,

  similarityAnalysis: `Analyze the provided specification against existing features to determine semantic similarity:

1. **Semantic Comparison**: Compare meaning and intent, not just keywords
   - Look beyond surface-level text matching to understand true intent
   - Consider functional overlap, user goals, and business objectives
   - Analyze the core purpose and value proposition of each feature

2. **Similarity Scoring**: Provide accurate similarity scores with reasoning
   - Use 0.0-1.0 scale where 1.0 is identical functionality
   - Scores above 0.8 indicate significant overlap requiring attention
   - Provide detailed reasoning for each similarity score

3. **Difference Analysis**: Identify key differences even in similar features
   - Technical implementation differences
   - Different user personas or use cases
   - Varying scope or complexity levels
   - Distinct business requirements

4. **Recommendations**: Suggest whether to merge, separate, or refactor
   - "merge": Features are essentially the same, combine them
   - "separate": Features serve different purposes, keep distinct
   - "refactor": Significant overlap suggests architectural improvements

Return a JSON response matching the AISimilarityAnalysisSchema. Focus on semantic understanding over surface-level text matching.`
};

// Type exports
export type AICodePattern = z.infer<typeof AICodePatternSchema>;
export type AITechStack = z.infer<typeof AITechStackSchema>;
export type AINamingConventions = z.infer<typeof AINamingConventionsSchema>;
export type AIProjectStructure = z.infer<typeof AIProjectStructureSchema>;
export type AICodebaseAnalysis = z.infer<typeof AICodebaseAnalysisSchema>;
export type AISpecQuality = z.infer<typeof AISpecQualitySchema>;
export type AITask = z.infer<typeof AITaskSchema>;
export type AISpecAnalysis = z.infer<typeof AISpecAnalysisSchema>;
export type AISimilarityAnalysis = z.infer<typeof AISimilarityAnalysisSchema>;
