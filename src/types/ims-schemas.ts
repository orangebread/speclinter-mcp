import { z } from 'zod';

// IMS v0.1.0 Schema Definitions
// Implementation Manifest Standard schemas for SpecLinter

// Base symbol schema for code symbols
export const IMSSymbolSchema = z.object({
  name: z.string().describe('Symbol name (class, function, variable, etc.)'),
  type: z.enum(['class', 'function', 'method', 'variable', 'constant', 'interface', 'type', 'enum', 'module']).describe('Type of symbol'),
  lines: z.tuple([z.number(), z.number()]).describe('Start and end line numbers [start, end]')
});

// File schema for implementation files
export const IMSFileSchema = z.object({
  path: z.string().describe('File path relative to project root'),
  hash: z.string().regex(/^sha256:[a-f0-9]{64}$/).optional().describe('SHA-256 hash of file content (sha256:...)'),
  purpose: z.string().optional().describe('Purpose or role of this file in the implementation'),
  symbols: z.array(IMSSymbolSchema).optional().describe('Code symbols found in this file')
});

// Test coverage schema
export const IMSCoverageSchema = z.object({
  statements: z.number().min(0).max(100).describe('Statement coverage percentage'),
  branches: z.number().min(0).max(100).describe('Branch coverage percentage'),
  functions: z.number().min(0).max(100).describe('Function coverage percentage'),
  lines: z.number().min(0).max(100).describe('Line coverage percentage')
});

// Test files schema
export const IMSTestsSchema = z.object({
  unit: z.array(z.string()).optional().describe('Unit test file paths'),
  integration: z.array(z.string()).optional().describe('Integration test file paths'),
  e2e: z.array(z.string()).optional().describe('End-to-end test file paths')
});

// Implementation schema
export const IMSImplementationSchema = z.object({
  status: z.enum(['complete', 'partial', 'planned']).optional().describe('Implementation status'),
  completeness: z.number().min(0).max(1).optional().describe('Implementation completeness (0.0 - 1.0)'),
  files: z.array(IMSFileSchema).describe('Files that implement this requirement'),
  tests: IMSTestsSchema.optional().describe('Test files for this implementation'),
  coverage: IMSCoverageSchema.optional().describe('Test coverage metrics')
});

// Requirement schema
export const IMSRequirementSchema = z.object({
  id: z.string().describe('Unique requirement identifier (e.g., REQ-001)'),
  title: z.string().optional().describe('Human-readable requirement title'),
  description: z.string().optional().describe('Requirement description or summary'),
  source: z.string().describe('URL or path to the specification definition'),
  composedOf: z.array(z.string()).optional().describe('Array of subordinate requirement IDs'),
  version: z.string().optional().describe('Semantic version of the requirement itself')
});

// Agent schema
export const IMSAgentSchema = z.object({
  identifier: z.string().describe('Agent identifier (e.g., claude-3.5, human-dev-001)'),
  source: z.string().describe('Agent source or provider (e.g., anthropic, openai, human)'),
  timestamp: z.string().datetime().optional().describe('ISO 8601 timestamp when manifest was created')
});

// Verification schema
export const IMSVerificationSchema = z.object({
  verifiedAt: z.string().datetime().describe('ISO 8601 timestamp when verification was performed'),
  status: z.enum(['pass', 'fail', 'unknown']).describe('Verification status'),
  methods: z.array(z.string()).describe('Verification methods used (e.g., hash-check, test-run)'),
  tools: z.array(z.string()).describe('Tools used for verification (e.g., speclinter@0.5.2)')
});

// Relationships schema
export const IMSRelationshipsSchema = z.object({
  implements: z.array(z.string()).optional().describe('Requirement IDs this manifest implements'),
  depends_on: z.array(z.string()).optional().describe('Requirement IDs this implementation depends on'),
  validates: z.array(z.string()).optional().describe('Scenario or test IDs this implementation validates')
});

// Chain schema for evolution tracking
export const IMSChainSchema = z.object({
  previous: z.string().regex(/^sha256:[a-f0-9]{64}$/).describe('SHA-256 hash of previous manifest in chain'),
  reason: z.string().describe('Reason for this evolution/change'),
  breaking: z.boolean().optional().describe('Whether this change is breaking')
});

// Meta schema for additional metadata
export const IMSMetaSchema = z.object({
  tags: z.array(z.string()).optional().describe('Tags for categorization'),
  domain: z.string().optional().describe('Domain or area of the system'),
  project: z.string().optional().describe('Project or component name')
});

// Extensions schema for tool-specific data
export const IMSExtensionsSchema = z.object({
  speclinter: z.object({
    patterns: z.array(z.string()).optional().describe('Code patterns used'),
    coverage_target: z.string().optional().describe('Target coverage percentage'),
    feature_name: z.string().optional().describe('SpecLinter feature name'),
    task_ids: z.array(z.string()).optional().describe('Associated SpecLinter task IDs')
  }).optional().describe('SpecLinter-specific extensions'),
  cursor: z.object({
    workspace_id: z.string().optional().describe('Cursor workspace identifier')
  }).optional().describe('Cursor IDE extensions'),
  github: z.object({
    repository: z.string().optional().describe('GitHub repository URL'),
    commit: z.string().optional().describe('Git commit hash'),
    pull_request: z.string().optional().describe('Pull request number')
  }).optional().describe('GitHub integration extensions')
}).catchall(z.any()).describe('Tool-specific extensions under their own namespace');

// Main IMS Manifest schema
export const IMSManifestSchema = z.object({
  schemaVersion: z.literal('0.1.0').describe('IMS schema version this manifest adheres to'),
  requirement: IMSRequirementSchema.describe('Requirement being implemented'),
  agent: IMSAgentSchema.describe('Agent that created this manifest'),
  implementation: IMSImplementationSchema.describe('Implementation details'),
  verification: IMSVerificationSchema.optional().describe('Verification results'),
  relationships: IMSRelationshipsSchema.optional().describe('Relationships to other requirements'),
  chain: IMSChainSchema.optional().describe('Evolution chain information'),
  meta: IMSMetaSchema.optional().describe('Additional metadata'),
  extensions: IMSExtensionsSchema.optional().describe('Tool-specific extensions')
});

// Type exports for TypeScript usage
export type IMSSymbol = z.infer<typeof IMSSymbolSchema>;
export type IMSFile = z.infer<typeof IMSFileSchema>;
export type IMSCoverage = z.infer<typeof IMSCoverageSchema>;
export type IMSTests = z.infer<typeof IMSTestsSchema>;
export type IMSImplementation = z.infer<typeof IMSImplementationSchema>;
export type IMSRequirement = z.infer<typeof IMSRequirementSchema>;
export type IMSAgent = z.infer<typeof IMSAgentSchema>;
export type IMSVerification = z.infer<typeof IMSVerificationSchema>;
export type IMSRelationships = z.infer<typeof IMSRelationshipsSchema>;
export type IMSChain = z.infer<typeof IMSChainSchema>;
export type IMSMeta = z.infer<typeof IMSMetaSchema>;
export type IMSExtensions = z.infer<typeof IMSExtensionsSchema>;
export type IMSManifest = z.infer<typeof IMSManifestSchema>;

// Validation helper functions
export const validateIMSManifest = (data: unknown): IMSManifest => {
  return IMSManifestSchema.parse(data);
};

export const isValidIMSManifest = (data: unknown): data is IMSManifest => {
  try {
    IMSManifestSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

// Minimum viable manifest schema for basic validation
export const IMSMinimalManifestSchema = z.object({
  schemaVersion: z.literal('0.1.0'),
  requirement: z.object({
    id: z.string(),
    source: z.string()
  }),
  agent: z.object({
    identifier: z.string(),
    source: z.string()
  }),
  implementation: z.object({
    files: z.array(z.object({
      path: z.string()
    })).min(1)
  })
});

export type IMSMinimalManifest = z.infer<typeof IMSMinimalManifestSchema>;
