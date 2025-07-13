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
  title: z.string().describe('Clear, actionable task title using specific verbs and concrete outcomes'),
  summary: z.string().describe('Brief summary focusing on user value and specific functionality'),
  implementation: z.string().describe('Detailed implementation guidance with technology-specific steps, file locations, and code patterns'),
  acceptanceCriteria: z.array(z.string()).describe('Specific, measurable, testable acceptance criteria with concrete validation points'),
  estimatedEffort: z.enum(['XS', 'S', 'M', 'L', 'XL']).describe('Estimated effort/complexity based on implementation scope'),
  dependencies: z.array(z.string()).describe('Other tasks this depends on with specific reasons'),
  testingNotes: z.string().describe('Comprehensive testing approach including unit, integration, and edge case considerations'),
  relevantPatterns: z.array(z.string()).describe('Specific code patterns from project context that apply to this task'),
  riskFactors: z.array(z.string()).describe('Technical risks, integration challenges, and mitigation strategies'),
  securityConsiderations: z.array(z.string()).describe('Security aspects including validation, authentication, and data protection'),
  performanceConsiderations: z.array(z.string()).describe('Performance implications, optimization opportunities, and scalability factors'),
  userExperience: z.string().describe('How this task impacts user experience and interaction patterns'),
  technicalDebt: z.array(z.string()).describe('Potential technical debt and long-term maintenance considerations')
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

// Enhanced AI Spec Analysis Schemas for Parser Replacement
export const AISpecQualityAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100).describe('Overall specification quality score based on semantic analysis'),
  grade: z.enum(['A+', 'A', 'B', 'C', 'D', 'F']).describe('Letter grade for the specification'),
  qualityDimensions: z.object({
    clarity: z.number().min(0).max(100).describe('How clear and unambiguous the specification is'),
    completeness: z.number().min(0).max(100).describe('How complete the specification is'),
    testability: z.number().min(0).max(100).describe('How testable the requirements are'),
    feasibility: z.number().min(0).max(100).describe('How technically feasible the requirements are'),
    businessValue: z.number().min(0).max(100).describe('How well business value is articulated')
  }).describe('Detailed quality assessment across multiple dimensions'),
  semanticIssues: z.array(z.object({
    type: z.enum(['ambiguous_requirement', 'missing_acceptance_criteria', 'vague_language', 'conflicting_requirements', 'missing_context', 'unclear_scope', 'missing_error_handling', 'performance_gaps', 'security_gaps']).describe('Type of semantic issue detected'),
    severity: z.enum(['low', 'medium', 'high', 'critical']).describe('Issue severity based on impact'),
    description: z.string().describe('Detailed description of the issue'),
    location: z.string().describe('Where in the spec this issue occurs'),
    suggestion: z.string().describe('Specific, actionable suggestion to resolve the issue'),
    impact: z.string().describe('How this issue affects implementation'),
    confidence: z.number().min(0).max(1).describe('AI confidence in this issue detection')
  })).describe('Semantic issues found through AI analysis'),
  strengths: z.array(z.object({
    aspect: z.string().describe('What aspect of the spec is strong'),
    description: z.string().describe('Why this is a strength'),
    examples: z.array(z.string()).describe('Specific examples from the spec')
  })).describe('Positive aspects of the specification'),
  improvements: z.array(z.object({
    priority: z.enum(['low', 'medium', 'high', 'critical']).describe('Priority of this improvement'),
    category: z.enum(['clarity', 'completeness', 'testability', 'feasibility', 'business_value']).describe('Category of improvement'),
    suggestion: z.string().describe('Specific improvement suggestion'),
    rationale: z.string().describe('Why this improvement is needed'),
    example: z.string().optional().describe('Example of how to implement this improvement')
  })).describe('Prioritized improvement suggestions'),
  aiInsights: z.object({
    confidence: z.number().min(0).max(1).describe('Overall AI confidence in the analysis'),
    analysisDepth: z.enum(['surface', 'standard', 'deep']).describe('Depth of analysis performed'),
    contextFactors: z.array(z.string()).describe('Project context factors that influenced the analysis'),
    recommendations: z.array(z.string()).describe('High-level recommendations for spec improvement')
  }).describe('AI-specific insights and metadata')
});

export const AITaskGenerationSchema = z.object({
  tasks: z.array(z.object({
    title: z.string().describe('Clear, actionable task title with specific verbs and measurable outcomes'),
    summary: z.string().describe('Concise summary focusing on user value and business impact'),
    description: z.string().describe('Detailed description of what needs to be implemented'),
    implementation: z.object({
      approach: z.string().describe('High-level implementation approach'),
      technicalSteps: z.array(z.string()).describe('Specific technical steps to implement'),
      fileLocations: z.array(z.string()).describe('Expected file locations and modifications'),
      codePatterns: z.array(z.string()).describe('Relevant code patterns to follow'),
      dependencies: z.array(z.string()).describe('Technical dependencies and prerequisites'),
      riskFactors: z.array(z.string()).describe('Implementation risks and mitigation strategies')
    }).describe('Comprehensive implementation guidance'),
    acceptanceCriteria: z.array(z.object({
      criteria: z.string().describe('Specific, measurable acceptance criteria'),
      validationMethod: z.string().describe('How to validate this criteria'),
      priority: z.enum(['must_have', 'should_have', 'nice_to_have']).describe('Priority level'),
      testable: z.boolean().describe('Whether this criteria can be automatically tested')
    })).describe('Enhanced acceptance criteria with validation methods'),
    estimatedEffort: z.object({
      size: z.enum(['XS', 'S', 'M', 'L', 'XL']).describe('T-shirt size estimate'),
      hours: z.number().optional().describe('Estimated hours if available'),
      complexity: z.enum(['low', 'medium', 'high']).describe('Implementation complexity'),
      uncertainty: z.enum(['low', 'medium', 'high']).describe('Level of uncertainty in estimate')
    }).describe('Detailed effort estimation'),
    businessValue: z.object({
      userImpact: z.string().describe('How this task impacts users'),
      businessImpact: z.string().describe('Business value delivered'),
      priority: z.enum(['low', 'medium', 'high', 'critical']).describe('Business priority')
    }).describe('Business value assessment'),
    technicalConsiderations: z.array(z.object({
      category: z.enum(['performance', 'security', 'scalability', 'maintainability', 'compatibility']).describe('Category of consideration'),
      description: z.string().describe('Specific technical consideration'),
      impact: z.enum(['low', 'medium', 'high']).describe('Impact level'),
      mitigation: z.string().optional().describe('How to mitigate this consideration')
    })).describe('Technical considerations and constraints'),
    dependencies: z.array(z.object({
      taskTitle: z.string().describe('Title of dependent task'),
      relationship: z.enum(['blocks', 'enables', 'enhances']).describe('Type of dependency'),
      reason: z.string().describe('Why this dependency exists')
    })).describe('Task dependencies with relationships'),
    testingStrategy: z.object({
      unitTests: z.array(z.string()).describe('Unit test scenarios'),
      integrationTests: z.array(z.string()).describe('Integration test scenarios'),
      e2eTests: z.array(z.string()).describe('End-to-end test scenarios'),
      manualTests: z.array(z.string()).describe('Manual testing scenarios'),
      testData: z.array(z.string()).describe('Test data requirements')
    }).describe('Comprehensive testing strategy'),
    aiInsights: z.object({
      confidence: z.number().min(0).max(1).describe('AI confidence in task breakdown'),
      alternativeApproaches: z.array(z.string()).describe('Alternative implementation approaches'),
      potentialIssues: z.array(z.string()).describe('Potential implementation issues'),
      optimizations: z.array(z.string()).describe('Potential optimizations')
    }).describe('AI-generated insights and alternatives')
  })).describe('AI-generated tasks with comprehensive details'),
  taskRelationships: z.array(z.object({
    fromTask: z.string().describe('Source task title'),
    toTask: z.string().describe('Target task title'),
    relationship: z.enum(['prerequisite', 'parallel', 'sequential', 'optional']).describe('Relationship type'),
    description: z.string().describe('Description of the relationship')
  })).describe('Relationships between tasks'),
  implementationStrategy: z.object({
    approach: z.enum(['incremental', 'big_bang', 'parallel', 'phased']).describe('Overall implementation approach'),
    phases: z.array(z.object({
      name: z.string().describe('Phase name'),
      tasks: z.array(z.string()).describe('Task titles in this phase'),
      deliverables: z.array(z.string()).describe('Phase deliverables'),
      duration: z.string().describe('Estimated phase duration')
    })).describe('Implementation phases'),
    riskMitigation: z.array(z.string()).describe('Overall risk mitigation strategies'),
    successCriteria: z.array(z.string()).describe('Success criteria for the entire feature')
  }).describe('Overall implementation strategy'),
  qualityMetrics: z.object({
    taskCount: z.number().describe('Total number of tasks generated'),
    averageComplexity: z.number().min(1).max(5).describe('Average task complexity (1-5)'),
    coverageScore: z.number().min(0).max(100).describe('How well tasks cover the specification'),
    actionabilityScore: z.number().min(0).max(100).describe('How actionable the tasks are'),
    testabilityScore: z.number().min(0).max(100).describe('How testable the tasks are')
  }).describe('Quality metrics for the generated tasks')
});

export const AISpecParserAnalysisSchema = z.object({
  qualityAnalysis: AISpecQualityAnalysisSchema,
  taskGeneration: AITaskGenerationSchema,
  projectAlignment: z.object({
    techStackCompatibility: z.number().min(0).max(100).describe('How well the spec aligns with project tech stack'),
    architecturalFit: z.number().min(0).max(100).describe('How well the spec fits the project architecture'),
    patternCompliance: z.array(z.object({
      pattern: z.string().describe('Project pattern name'),
      compliance: z.enum(['follows', 'partially_follows', 'violates', 'not_applicable']).describe('Compliance level'),
      recommendation: z.string().describe('Recommendation for better compliance')
    })).describe('Compliance with existing project patterns'),
    integrationPoints: z.array(z.object({
      component: z.string().describe('Component or system to integrate with'),
      complexity: z.enum(['low', 'medium', 'high']).describe('Integration complexity'),
      considerations: z.array(z.string()).describe('Integration considerations')
    })).describe('Integration points with existing systems')
  }).describe('How well the specification aligns with the existing project'),
  businessContext: z.object({
    userStories: z.array(z.object({
      role: z.string().describe('User role (As a...)'),
      goal: z.string().describe('User goal (I want...)'),
      benefit: z.string().describe('User benefit (So that...)'),
      priority: z.enum(['low', 'medium', 'high', 'critical']).describe('Story priority'),
      extractedFrom: z.string().describe('Where in the spec this was extracted from')
    })).describe('Extracted or inferred user stories'),
    businessValue: z.string().describe('Overall business value and impact'),
    stakeholders: z.array(z.string()).describe('Identified stakeholders'),
    successMetrics: z.array(z.string()).describe('Suggested success metrics')
  }).describe('Business context and value analysis'),
  implementationGuidance: z.object({
    recommendedApproach: z.string().describe('Recommended overall implementation approach'),
    criticalPath: z.array(z.string()).describe('Critical path tasks'),
    quickWins: z.array(z.string()).describe('Quick win opportunities'),
    riskAreas: z.array(z.object({
      area: z.string().describe('Risk area'),
      risk: z.string().describe('Description of the risk'),
      mitigation: z.string().describe('Suggested mitigation'),
      impact: z.enum(['low', 'medium', 'high']).describe('Risk impact')
    })).describe('Risk areas and mitigation strategies'),
    dependencies: z.array(z.object({
      type: z.enum(['internal', 'external', 'technical', 'business']).describe('Dependency type'),
      description: z.string().describe('Dependency description'),
      impact: z.enum(['low', 'medium', 'high']).describe('Impact if not resolved'),
      mitigation: z.string().describe('How to handle this dependency')
    })).describe('External dependencies and constraints')
  }).describe('Implementation guidance and recommendations'),
  aiMetadata: z.object({
    analysisTimestamp: z.string().describe('When this analysis was performed'),
    modelConfidence: z.number().min(0).max(1).describe('Overall model confidence'),
    analysisDepth: z.enum(['quick', 'standard', 'comprehensive']).describe('Depth of analysis performed'),
    contextFactors: z.array(z.string()).describe('Context factors that influenced the analysis'),
    limitations: z.array(z.string()).describe('Known limitations of this analysis'),
    recommendations: z.array(z.string()).describe('Recommendations for improving the analysis')
  }).describe('AI analysis metadata and confidence indicators')
});

// AI prompt templates for comprehensive documentation generation
export const AIPromptTemplates = {
  specQualityAnalysis: `You are an expert software specification analyst. Analyze the provided specification for quality, clarity, and completeness.

**SPECIFICATION TO ANALYZE:**
{specification}

**PROJECT CONTEXT:**
{projectContext}

**ANALYSIS REQUIREMENTS:**
1. **Semantic Quality Assessment**: Evaluate clarity, completeness, testability, feasibility, and business value
2. **Issue Detection**: Identify ambiguous requirements, missing acceptance criteria, vague language, conflicting requirements, scope gaps
3. **Strength Identification**: Highlight what the specification does well with specific examples
4. **Improvement Recommendations**: Provide prioritized, actionable suggestions with rationale

**QUALITY DIMENSIONS TO EVALUATE:**
- **Clarity (0-100)**: How clear and unambiguous are the requirements?
- **Completeness (0-100)**: Are all necessary details provided?
- **Testability (0-100)**: Can requirements be easily tested and validated?
- **Feasibility (0-100)**: Are requirements technically achievable?
- **Business Value (0-100)**: Is business value clearly articulated?

**CONTEXT FACTORS TO CONSIDER:**
- Project tech stack: {techStack}
- Existing patterns: {codePatterns}
- Architecture: {architecture}
- Team experience level: {teamLevel}

Provide a comprehensive analysis following the AISpecQualityAnalysisSchema format. Focus on semantic understanding rather than keyword matching.`,

  taskGeneration: `You are an expert software architect and project manager. Break down the provided specification into comprehensive, actionable tasks.

**SPECIFICATION:**
{specification}

**QUALITY ANALYSIS RESULTS:**
{qualityAnalysis}

**PROJECT CONTEXT:**
{projectContext}

**TASK GENERATION REQUIREMENTS:**
1. **Comprehensive Breakdown**: Create detailed, actionable tasks that fully implement the specification
2. **Implementation Guidance**: Provide specific technical steps, file locations, and code patterns
3. **Acceptance Criteria**: Generate measurable, testable criteria with validation methods
4. **Effort Estimation**: Provide realistic estimates with complexity and uncertainty factors
5. **Business Value**: Connect each task to user and business impact
6. **Technical Considerations**: Address performance, security, scalability, maintainability
7. **Testing Strategy**: Define comprehensive testing approach for each task
8. **Dependencies**: Identify and describe task relationships

**CONTEXT FOR TASK GENERATION:**
- Tech Stack: {techStack}
- Test Framework: {testFramework}
- Code Patterns: {codePatterns}
- Architecture: {architecture}
- Project Structure: {projectStructure}

**TASK QUALITY CRITERIA:**
- Each task should be completable by a developer in 4-8 hours
- Tasks should have clear, measurable outcomes
- Implementation guidance should be technology-specific
- Acceptance criteria should be testable
- Dependencies should be clearly defined

Generate tasks following the AITaskGenerationSchema format. Ensure tasks are comprehensive, actionable, and aligned with project patterns.`,

  specParserAnalysis: `You are an expert software specification analyst and architect. Perform a comprehensive analysis of the provided specification including quality assessment, task generation, and implementation guidance.

**SPECIFICATION TO ANALYZE:**
{specification}

**PROJECT CONTEXT:**
- Tech Stack: {techStack}
- Architecture: {architecture}
- Code Patterns: {codePatterns}
- Project Structure: {projectStructure}
- Test Framework: {testFramework}
- Team Context: {teamContext}

**COMPREHENSIVE ANALYSIS REQUIREMENTS:**

1. **QUALITY ANALYSIS**:
   - Semantic evaluation across 5 dimensions (clarity, completeness, testability, feasibility, business value)
   - Issue detection with severity, location, and actionable suggestions
   - Strength identification with specific examples
   - Prioritized improvement recommendations

2. **TASK GENERATION**:
   - Comprehensive task breakdown with implementation guidance
   - Enhanced acceptance criteria with validation methods
   - Effort estimation with complexity and uncertainty factors
   - Business value assessment for each task
   - Technical considerations (performance, security, scalability)
   - Testing strategy (unit, integration, e2e, manual)
   - Task dependencies and relationships

3. **PROJECT ALIGNMENT**:
   - Tech stack compatibility assessment
   - Architectural fit evaluation
   - Pattern compliance analysis
   - Integration point identification

4. **BUSINESS CONTEXT**:
   - User story extraction/inference
   - Business value articulation
   - Stakeholder identification
   - Success metrics definition

5. **IMPLEMENTATION GUIDANCE**:
   - Recommended implementation approach
   - Critical path identification
   - Quick win opportunities
   - Risk assessment and mitigation
   - Dependency management

**ANALYSIS DEPTH**: {analysisDepth}
**FOCUS AREAS**: {focusAreas}

Provide a comprehensive response following the AISpecParserAnalysisSchema format. Ensure all analysis is based on semantic understanding and project context rather than simple keyword matching.`,

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

2. **Task Breakdown**: Extract clear, actionable tasks with comprehensive implementation guidance
   - Create 5-10 specific, implementable tasks with concrete deliverables
   - Each task should be completable in 1-4 hours by a developer
   - REQUIRED: Include detailed implementation guidance with specific file paths, function names, and code structure
   - REQUIRED: Reference relevant code patterns from project context with examples
   - REQUIRED: Provide measurable, testable acceptance criteria with specific validation points
   - REQUIRED: Include security considerations (input validation, authentication, authorization)
   - REQUIRED: Include performance considerations (response times, scalability, optimization)
   - REQUIRED: Describe user experience impact and interaction patterns
   - REQUIRED: Identify potential technical debt and maintenance considerations
   - Estimate effort level (XS, S, M, L, XL) based on implementation complexity
   - Include comprehensive testing approach (unit, integration, edge cases)

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

Return JSON matching AIContextFilesSchema with complete file contents.`,

  gherkinGeneration: `# AI Gherkin Scenario Generation

You are an expert test analyst and Gherkin scenario writer. Your task is to generate comprehensive, actionable Gherkin scenarios for a specific development task.

## Task Context
**Task Title**: {taskTitle}
**Task Summary**: {taskSummary}
**Implementation Details**: {implementation}

## Acceptance Criteria
{acceptanceCriteria}

## Project Context
**Tech Stack**: {techStack}
**Testing Framework**: {testFramework}
**Code Patterns**: {codePatterns}
**Project Structure**: {projectStructure}

## Requirements for Gherkin Scenarios

### 1. Scenario Quality Standards
- **Specific**: Use concrete examples, not generic placeholders
- **Actionable**: Each step should be implementable as an automated test
- **Measurable**: Include specific assertions and validation points
- **Business-focused**: Write from user/system perspective, not implementation details

### 2. Required Scenario Types
Generate scenarios covering:
- **Happy Path**: Primary success scenarios with valid inputs
- **Error Handling**: Invalid inputs, system errors, edge cases
- **Edge Cases**: Boundary conditions, unusual but valid scenarios
- **Integration**: How this feature interacts with other system components
- **Security**: Authentication, authorization, data validation (if applicable)
- **Performance**: Response times, load handling (if applicable)

### 3. Step Writing Guidelines
- **Given**: Set up preconditions with specific data
- **When**: Describe user actions or system events
- **Then**: Assert specific, measurable outcomes
- **Use concrete data**: "user@example.com" not "a valid email"
- **Avoid implementation details**: Focus on behavior, not code

### 4. Technical Considerations
- Align with project's testing framework: {testFramework}
- Consider project architecture: {projectStructure}
- Include setup/teardown considerations
- Account for external dependencies and mocking needs

## Example Quality Transformation

❌ **Generic (Current)**:
\`\`\`gherkin
Scenario: Create user - Happy Path
  Given the system is ready
  When Create user functionality is implemented
  Then the acceptance criteria are met
\`\`\`

✅ **Specific (Target)**:
\`\`\`gherkin
Scenario: Successfully create user with valid data
  Given the user registration system is available
  And no user exists with email "newuser@example.com"
  When I submit user registration with:
    | email    | newuser@example.com |
    | password | SecurePass123!      |
    | name     | John Doe            |
  Then a new user account should be created
  And the user should receive a confirmation email
  And the response should include a user ID
  And the password should be securely hashed in the database
\`\`\`

Please generate comprehensive Gherkin scenarios following these guidelines and return a JSON response matching the AIGherkinAnalysisSchema.`
};

// AI Gherkin Generation Schemas
export const AIGherkinStepSchema = z.object({
  type: z.enum(['given', 'when', 'then', 'and', 'but']).describe('Step type'),
  text: z.string().describe('Step text with specific, actionable language'),
  parameters: z.array(z.object({
    name: z.string(),
    value: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'object']).optional()
  })).optional().describe('Parameterized values for data-driven testing')
});

export const AIGherkinScenarioSchema = z.object({
  type: z.enum(['happy_path', 'error_handling', 'edge_case', 'integration', 'security', 'performance', 'validation']).describe('Scenario category'),
  title: z.string().describe('Specific, testable scenario title'),
  description: z.string().optional().describe('Additional context for the scenario'),
  tags: z.array(z.string()).optional().describe('Tags for scenario organization (@smoke, @regression, etc.)'),
  steps: z.array(AIGherkinStepSchema).describe('Scenario steps with specific actions and assertions'),
  examples: z.array(z.object({
    description: z.string(),
    data: z.record(z.string())
  })).optional().describe('Scenario outline examples for data-driven testing'),
  priority: z.enum(['critical', 'high', 'medium', 'low']).describe('Testing priority level'),
  estimatedDuration: z.string().optional().describe('Estimated test execution time')
});

export const AIGherkinFeatureSchema = z.object({
  title: z.string().describe('Feature title matching the task'),
  description: z.string().describe('Feature description with business context'),
  background: z.array(AIGherkinStepSchema).optional().describe('Common setup steps for all scenarios'),
  scenarios: z.array(AIGherkinScenarioSchema).describe('Generated test scenarios'),
  rules: z.array(z.object({
    title: z.string(),
    scenarios: z.array(AIGherkinScenarioSchema)
  })).optional().describe('Business rules with associated scenarios'),
  testingNotes: z.string().describe('Additional testing considerations and setup requirements'),
  coverageAreas: z.array(z.string()).describe('Areas of functionality covered by these scenarios')
});

export const AIGherkinAnalysisSchema = z.object({
  feature: AIGherkinFeatureSchema,
  qualityMetrics: z.object({
    scenarioCount: z.number().describe('Total number of scenarios generated'),
    coverageScore: z.number().min(0).max(100).describe('Estimated coverage of acceptance criteria'),
    actionabilityScore: z.number().min(0).max(100).describe('How actionable and specific the scenarios are'),
    maintainabilityScore: z.number().min(0).max(100).describe('How maintainable the scenarios are')
  }),
  technicalConsiderations: z.array(z.string()).describe('Technical aspects to consider during testing'),
  automationReadiness: z.object({
    score: z.number().min(0).max(100).describe('How ready scenarios are for test automation'),
    blockers: z.array(z.string()).describe('Potential automation blockers'),
    recommendations: z.array(z.string()).describe('Recommendations for test automation')
  }),
  aiInsights: z.object({
    confidence: z.number().min(0).max(1).describe('AI confidence in scenario quality'),
    improvements: z.array(z.string()).describe('Suggested improvements for scenarios'),
    patterns: z.array(z.string()).describe('Testing patterns applied')
  })
});

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
export type AIGherkinStep = z.infer<typeof AIGherkinStepSchema>;

// Enhanced AI Spec Analysis Types
export type AISpecQualityAnalysis = z.infer<typeof AISpecQualityAnalysisSchema>;
export type AITaskGeneration = z.infer<typeof AITaskGenerationSchema>;
export type AISpecParserAnalysis = z.infer<typeof AISpecParserAnalysisSchema>;
export type AIGherkinScenario = z.infer<typeof AIGherkinScenarioSchema>;
export type AIGherkinFeature = z.infer<typeof AIGherkinFeatureSchema>;
export type AIGherkinAnalysis = z.infer<typeof AIGherkinAnalysisSchema>;
export type AICodebaseAnalysisWithContext = z.infer<typeof AICodebaseAnalysisWithContextSchema>;
