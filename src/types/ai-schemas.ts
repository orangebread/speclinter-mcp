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

// Enhanced context file generation schema with rich project-specific content
export const AIContextFilesSchema = z.object({
  projectMd: z.string().describe('Complete project.md content - comprehensive project context including domain, purpose, tech stack with rationale, architectural decisions, development workflow, and integration patterns'),
  patternsMd: z.string().describe('Complete patterns.md content - discovered patterns with examples, confidence levels, and implementation guidance'),
  architectureMd: z.string().describe('Complete architecture.md content - detailed system design, MCP architecture, AI-leveraged patterns, data flow, and implementation decisions with rationale')
});



// Combined schema for single AI call efficiency
export const AICodebaseAnalysisWithContextSchema = z.object({
  analysis: AICodebaseAnalysisSchema,
  contextFiles: AIContextFilesSchema
});

// AI Implementation Validation Schemas
export const AIImplementationFileSchema = z.object({
  path: z.string().describe('File path relative to project root'),
  type: z.enum(['source', 'test', 'config', 'documentation']).describe('Type of file'),
  relevance: z.number().min(0).max(1).describe('How relevant this file is to the feature (0-1)'),
  content: z.string().describe('File content or relevant excerpts'),
  patterns: z.array(z.string()).describe('Code patterns found in this file'),
  functions: z.array(z.string()).describe('Key functions/methods found'),
  exports: z.array(z.string()).describe('Exported symbols/components')
});

export const AITaskValidationSchema = z.object({
  taskId: z.string().describe('Task ID being validated'),
  title: z.string().describe('Task title'),
  implementationStatus: z.enum(['not_implemented', 'partially_implemented', 'fully_implemented', 'over_implemented']).describe('Implementation status'),
  qualityScore: z.number().min(0).max(100).describe('Implementation quality score (0-100)'),
  implementationFiles: z.array(z.string()).describe('Files that implement this task'),
  acceptanceCriteriaValidation: z.array(z.object({
    criteria: z.string().describe('Acceptance criteria text'),
    status: z.enum(['met', 'partially_met', 'not_met', 'unclear']).describe('Whether criteria is met'),
    evidence: z.string().describe('Code evidence or explanation'),
    confidence: z.number().min(0).max(1).describe('Confidence in this assessment')
  })).describe('Validation of each acceptance criteria'),
  patternCompliance: z.array(z.object({
    pattern: z.string().describe('Code pattern name'),
    compliance: z.enum(['follows', 'partially_follows', 'violates', 'not_applicable']).describe('Pattern compliance'),
    examples: z.array(z.string()).describe('Code examples showing compliance/violation')
  })).describe('How well implementation follows project patterns'),
  codeQualityIssues: z.array(z.object({
    type: z.enum(['error_handling', 'validation', 'security', 'performance', 'maintainability']).describe('Type of issue'),
    severity: z.enum(['low', 'medium', 'high', 'critical']).describe('Issue severity'),
    description: z.string().describe('Description of the issue'),
    location: z.string().describe('File and line where issue occurs'),
    suggestion: z.string().describe('How to fix this issue')
  })).describe('Code quality issues found'),
  missingComponents: z.array(z.string()).describe('Components that should exist but are missing'),
  recommendations: z.array(z.string()).describe('Specific recommendations for improvement')
});

export const AIFeatureValidationSchema = z.object({
  featureName: z.string().describe('Name of the feature being validated'),
  overallStatus: z.enum(['not_started', 'in_progress', 'mostly_complete', 'complete', 'over_engineered']).describe('Overall feature implementation status'),
  completionPercentage: z.number().min(0).max(100).describe('Estimated completion percentage'),
  qualityScore: z.number().min(0).max(100).describe('Overall implementation quality score'),
  taskValidations: z.array(AITaskValidationSchema).describe('Validation results for each task'),
  architecturalAlignment: z.object({
    score: z.number().min(0).max(100).describe('How well feature aligns with project architecture'),
    strengths: z.array(z.string()).describe('Architectural strengths'),
    concerns: z.array(z.string()).describe('Architectural concerns'),
    recommendations: z.array(z.string()).describe('Architectural recommendations')
  }).describe('Assessment of architectural alignment'),
  testCoverage: z.object({
    hasTests: z.boolean().describe('Whether tests exist for this feature'),
    testTypes: z.array(z.enum(['unit', 'integration', 'e2e', 'manual'])).describe('Types of tests found'),
    coverage: z.number().min(0).max(100).optional().describe('Estimated test coverage percentage'),
    testQuality: z.enum(['poor', 'fair', 'good', 'excellent']).describe('Quality of existing tests'),
    missingTests: z.array(z.string()).describe('Types of tests that should be added')
  }).describe('Test coverage assessment'),
  securityConsiderations: z.array(z.object({
    area: z.string().describe('Security area (auth, validation, etc.)'),
    status: z.enum(['secure', 'needs_attention', 'vulnerable']).describe('Security status'),
    details: z.string().describe('Security assessment details'),
    recommendations: z.array(z.string()).describe('Security recommendations')
  })).describe('Security assessment'),
  performanceConsiderations: z.array(z.object({
    area: z.string().describe('Performance area (database, API, etc.)'),
    assessment: z.string().describe('Performance assessment'),
    concerns: z.array(z.string()).describe('Performance concerns'),
    optimizations: z.array(z.string()).describe('Suggested optimizations')
  })).describe('Performance assessment'),
  nextSteps: z.array(z.object({
    priority: z.enum(['low', 'medium', 'high', 'critical']).describe('Priority level'),
    action: z.string().describe('Recommended action'),
    effort: z.enum(['XS', 'S', 'M', 'L', 'XL']).describe('Estimated effort'),
    rationale: z.string().describe('Why this action is recommended')
  })).describe('Prioritized next steps for feature completion'),
  aiInsights: z.object({
    strengths: z.array(z.string()).describe('What the implementation does well'),
    weaknesses: z.array(z.string()).describe('Areas that need improvement'),
    surprises: z.array(z.string()).describe('Unexpected findings in the implementation'),
    confidence: z.number().min(0).max(1).describe('Overall confidence in this validation')
  }).describe('AI insights and observations')
});

// AI prompt templates for comprehensive documentation generation
export const AIPromptTemplates = {
  codebaseAnalysis: `Analyze the provided codebase files and generate comprehensive project documentation.

🎯 **PROJECT CONTEXT ANALYSIS:**
Extract deep understanding of:
- Project purpose and core domain (what problem does it solve?)
- Target users and use cases (who uses this and how?)
- Value proposition (what makes this unique/valuable?)
- Key domain concepts and terminology

🏗️ **ARCHITECTURAL DECISION ANALYSIS:**
For each major technical choice, identify:
- The decision made (e.g., "Use MCP server architecture")
- Context that led to the decision (e.g., "Need to integrate with AI IDEs")
- Rationale and benefits (e.g., "MCP provides standardized AI tool protocol")
- Trade-offs and limitations (e.g., "Limited to stdio transport")
- Alternatives that were considered (e.g., "REST API, GraphQL, gRPC")

🔄 **DEVELOPMENT WORKFLOW ANALYSIS:**
Understand how work flows through the system:
- How are specifications processed into tasks?
- What is the testing and validation approach?
- How are features deployed and used?
- What are the key development patterns?

🔗 **INTEGRATION PATTERN ANALYSIS:**
Identify how the system connects with external systems:
- AI IDE integration patterns
- External API usage
- Database and storage patterns
- Protocol and communication patterns

📊 **PERFORMANCE & SCALABILITY ANALYSIS:**
Consider system design for scale:
- What are the scalability factors?
- What performance optimizations exist?
- What are the current limitations?
- How does the architecture support growth?`,





  specAnalysis: `Analyze the provided specification and extract:

🔍 **CRITICAL ANALYSIS REQUIREMENTS:**
- MUST align all tasks with the provided project tech stack and patterns
- MUST reference specific project patterns and conventions in implementation guidance
- MUST ensure tasks are implementable within the existing architecture
- MUST validate technical approaches against project capabilities

1. **Quality Assessment**: Score the spec and identify issues, strengths, and improvements
   - Rate overall quality (0-100) and assign letter grade (A+ to F)
   - Identify vague requirements, missing acceptance criteria, unclear scope
   - Note strengths like clear user stories, well-defined constraints
   - Suggest specific improvements with actionable recommendations

2. **Task Breakdown**: Extract clear, actionable tasks with implementation guidance
   - Create 5-10 specific, implementable tasks
   - Each task should be completable in 1-4 hours by a developer
   - REQUIRED: Include detailed implementation guidance using project's tech stack
   - REQUIRED: Reference relevant code patterns from project context
   - Provide clear acceptance criteria for each task
   - Estimate effort level (XS, S, M, L, XL)

3. **Technical Considerations**: Identify technical constraints and requirements
   - Performance requirements and scalability needs
   - Security considerations and compliance requirements
   - Integration points with existing systems
   - REQUIRED: Technology stack recommendations aligned with project stack

4. **Business Context**: Understand user stories and business value
   - Extract or infer user stories from the specification
   - Identify the business value and impact
   - Understand the target users and use cases

5. **Scope Definition**: Clarify what's in/out of scope and assumptions
   - Clearly define what is included in this feature
   - Identify what is explicitly excluded
   - List assumptions being made about the implementation

🎯 **PROJECT ALIGNMENT REQUIREMENTS:**
- All implementation guidance MUST use the project's detected tech stack
- All patterns MUST reference existing project patterns where applicable
- All tasks MUST be implementable within the current architecture

Return a JSON response matching the AISpecAnalysisSchema. Focus on creating implementable tasks that align with the project's tech stack and patterns.`,

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

Return a JSON response matching the AISimilarityAnalysisSchema. Focus on semantic understanding over surface-level text matching.`,

  contextFileGeneration: `Based on your comprehensive codebase analysis, generate complete, professional context files:

🎯 **REQUIREMENTS:**
- Generate complete files from scratch (no templates or placeholders)
- Project-specific content only
- Professional documentation quality
- Consistent markdown formatting
- Evidence-based claims with file references

📁 **FILES TO GENERATE:**

1. **project.md**: Project overview with tech stack, constraints, standards, key decisions
2. **patterns.md**: Code patterns discovered in the codebase with examples and confidence scores
3. **architecture.md**: System architecture, design decisions, and trade-offs

🔍 **CONTENT GUIDELINES:**
- Use actual project data from analysis
- Include confidence scores for AI-detected items
- Reference specific files where patterns were found
- No generic placeholders like [Framework/Library/etc]
- Professional tone suitable for development teams

Return JSON matching AIContextFilesSchema with complete file contents.`
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
export type AIContextFiles = z.infer<typeof AIContextFilesSchema>;
export type AICodebaseAnalysisWithContext = z.infer<typeof AICodebaseAnalysisWithContextSchema>;
