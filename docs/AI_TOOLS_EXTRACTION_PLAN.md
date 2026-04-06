# AI Tools Extraction Plan

## Purpose

This document defines the recommended extraction plan for [`src/ai-tools.ts`](/Volumes/OWC%20Envoy%20Ultra/projects/speclinter/src/ai-tools.ts), based on the code that exists today, not an imagined architecture.

The goal is not to split one large file into several smaller bad files. The goal is to reduce regression risk, clarify workflow ownership, improve type boundaries, and preserve the unified MCP tool contract while the internals are refactored.

## Current Reality

`src/ai-tools.ts` is currently 2,805 lines and mixes:

- workflow orchestration
- AI prompt construction
- schema parsing
- config threshold enforcement
- storage persistence
- file-system scanning
- markdown reconstruction/parsing
- direct SQL access through `storage.db`
- compatibility aliases for tests

Only [`src/unified-ai-tools.ts`](/Volumes/OWC%20Envoy%20Ultra/projects/speclinter/src/unified-ai-tools.ts) imports it directly. That is the key fact that makes incremental extraction viable: the public MCP contract already has a single facade.

## Validated Findings

### Critical

#### `ai-tools.ts` is a service blob
Location: [`src/ai-tools.ts`](/Volumes/OWC%20Envoy%20Ultra/projects/speclinter/src/ai-tools.ts)

What is wrong:
- unrelated workflows live in one module
- prepare/process functions and low-level helpers share mutable assumptions
- storage, prompt construction, parsing, persistence, and formatting are mixed together

Why it matters:
- common changes have a wide blast radius
- test seams are poor
- future fixes will continue to create drift between workflows

Recommended fix:
- extract by workflow, not by helper category

Fix scope: `Larger refactor`

### High

#### Internal contracts are largely untyped
Location: [`src/ai-tools.ts`](/Volumes/OWC%20Envoy%20Ultra/projects/speclinter/src/ai-tools.ts)

What is wrong:
- the module is saturated with `any`
- prepare/process payloads rely on convention instead of explicit internal types
- several helpers return structurally important objects with no contract enforcement

Why it matters:
- file extraction without typed boundaries will just move fragility around
- changes to one workflow will silently break another

Recommended fix:
- define internal workflow contracts before or during extraction

Fix scope: `Larger refactor`

### High

#### Project context loading is duplicated and inconsistent
Locations:
- [`src/ai-tools.ts`](/Volumes/OWC%20Envoy%20Ultra/projects/speclinter/src/ai-tools.ts)
- [`src/core/storage.ts`](/Volumes/OWC%20Envoy%20Ultra/projects/speclinter/src/core/storage.ts)

What is wrong:
- `ai-tools.ts` has its own markdown-parsing loader for validation and Gherkin
- `Storage.loadProjectContext()` already exists and follows a different path

Why it matters:
- “project-aware” behavior can diverge by workflow
- extraction will be messy unless one context-loading boundary is declared authoritative

Recommended fix:
- move context loading behind one shared service and deprecate the duplicate parser in `ai-tools.ts`

Fix scope: `Quick win` before larger extraction

### High

#### Reverse-spec helpers bypass storage boundaries
Location: reverse-spec section in [`src/ai-tools.ts`](/Volumes/OWC%20Envoy%20Ultra/projects/speclinter/src/ai-tools.ts)

What is wrong:
- helpers directly query and mutate `storage.db`
- feature persistence logic is partially duplicated outside the storage abstraction

Why it matters:
- reverse-spec extraction will either drag DB internals into new modules or duplicate more persistence logic

Recommended fix:
- introduce a storage-facing reverse-spec repository API before extracting that workflow

Fix scope: `Larger refactor`

### Medium

#### Task conversion logic is duplicated
Locations:
- `handleProcessSpecAnalysisAI`
- `handleProcessTaskGeneration`
- `handleProcessComprehensiveSpecAnalysis`

What is wrong:
- multiple workflows map AI task payloads into SpecLinter task records independently

Why it matters:
- task shape drift is likely
- later changes to task metadata will require synchronized edits in multiple flows

Recommended fix:
- extract one `mapAiTaskToStoredTask` layer with workflow-specific adapters only where needed

Fix scope: `Quick win`

### Medium

#### Validation workflow owns too many local file-scanning concerns
Locations:
- `scanFeatureImplementation`
- `scanDirectoryForFeature`
- `loadGherkinScenarios`
- `loadProjectContextFromFiles`

What is wrong:
- validation is half workflow orchestration and half ad hoc source indexing

Why it matters:
- the validation extraction will stall unless file discovery is isolated first

Recommended fix:
- move validation support helpers into a dedicated indexing/context module

Fix scope: `Quick win`

## Recommended Target Structure

Do not optimize for perfect layering on the first pass. Optimize for clear ownership and low-risk migration.

```text
src/
  ai/
    contracts.ts
    shared/
      project-context.ts
      prompt-inputs.ts
      task-mappers.ts
      workflow-results.ts
    codebase/
      analyze-codebase.ts
      process-codebase.ts
      reverse-spec.ts
      reverse-spec-repository.ts
    spec/
      parse-spec.ts
      process-spec.ts
      analyze-spec-quality.ts
      process-spec-quality.ts
      generate-tasks.ts
      process-task-generation.ts
      analyze-spec-comprehensive.ts
      process-spec-comprehensive.ts
      find-similar.ts
      process-similarity.ts
    validation/
      prepare-validation.ts
      process-validation.ts
      feature-indexer.ts
    gherkin/
      prepare-gherkin.ts
      process-gherkin.ts
      formatter.ts
  ai-tools.ts
```

### Why keep `ai-tools.ts`

For the first extraction pass, [`src/ai-tools.ts`](/Volumes/OWC%20Envoy%20Ultra/projects/speclinter/src/ai-tools.ts) should become a compatibility barrel that re-exports the extracted functions. That keeps [`src/unified-ai-tools.ts`](/Volumes/OWC%20Envoy%20Ultra/projects/speclinter/src/unified-ai-tools.ts) stable while internals move.

If you try to change both the public wrapper and the internals at the same time, you are creating avoidable risk.

## Internal Contracts To Define First

Before moving workflows, define explicit internal result types in one place.

Recommended minimum contracts:

- `AIPrepareResult`
- `AIContinuationRequest`
- `WorkflowProcessResult<T>`
- `ProjectContextSnapshot`
- `SpecTaskRecord`
- `ReverseSpecDiscoveryContext`

Minimum invariants:

- prepare functions never persist state
- process functions never infer missing source inputs silently
- all process functions receive schema-validated `analysis`
- all persisted feature/task writes go through storage-facing helpers, not ad hoc SQL in workflow modules
- project context is loaded through one shared function

## Extraction Order

### Phase 0: Stabilize Shared Seams

Scope:
- introduce internal contract types
- extract shared task mapping
- extract shared project context loader

Do first because:
- without this, the later “workflow extraction” is just moving duplicated logic

Validation gates:
- existing tests stay green
- add unit tests for task mapping
- add unit tests for shared project context loader success/fallback behavior

### Phase 1: Extract Spec Intake Workflow

Move:
- `handleParseSpecAI`
- `handleProcessSpecAnalysisAI`
- `handleFindSimilarAI`
- `handleProcessSimilarityAnalysisAI`

Why first:
- this is the core product loop
- it already has the best workflow-level coverage
- it exposes duplicated task and persistence logic that should shape the shared seams

Validation gates:
- current workflow tests stay green
- add failure tests for malformed `AISpecAnalysisSchema`
- add failure tests for deduplication strategy edge cases if the storage layer exposes them

### Phase 2: Extract Comprehensive Spec Workflow

Move:
- `handleAnalyzeSpecQuality`
- `handleProcessSpecQualityAnalysis`
- `handleGenerateTasksFromSpec`
- `handleProcessTaskGeneration`
- `handleAnalyzeSpecComprehensive`
- `handleProcessComprehensiveSpecAnalysis`

Why second:
- these flows are conceptually one family
- they reuse the same inputs and task-mapping logic
- this is where typed contracts will pay off fastest

Validation gates:
- add failure test for missing `original_spec`
- add threshold-failure tests for confidence and quality gates
- confirm saved source spec remains immutable

### Phase 3: Extract Validation Workflow

Move:
- `handleValidateImplementationPrepare`
- `handleValidateImplementationProcess`
- validation file scanning helpers

Why third:
- it has the most local helper noise
- it depends on shared context loading and feature indexing
- it mutates task status, so it should come after the shared persistence seams are cleaner

Validation gates:
- add failure tests for missing feature
- add schema-mismatch tests for validation responses
- add tests that completed tasks revert only on explicit AI “not_implemented” signal

### Phase 4: Extract Codebase + Reverse-Spec Workflow

Move:
- `handleAnalyzeCodebase`
- `handleProcessCodebaseAnalysis`
- `handleReverseSpecAnalysis`
- `handleProcessReverseSpecAnalysis`
- reverse-spec helpers

Why last:
- this area has the messiest infrastructure mixing
- reverse-spec currently relies on direct DB access and placeholder filtering logic
- extracting this early would harden bad boundaries

Validation gates:
- add tests for codebase analysis continuation contract
- add tests for reverse-spec disabled-in-config path
- add tests for reverse-spec state persistence

### Phase 5: Extract Gherkin Workflow

Move:
- `handleGenerateGherkinPrepare`
- `handleProcessGherkinAnalysis`
- `formatGherkinFromAnalysis`

Why last:
- useful but not core to the central product promise
- low value compared with spec intake and validation

Validation gates:
- add tests for file output path generation
- add tests for malformed Gherkin AI payloads

## What Not To Do

- Do not split by “prepare” vs “process” folders. That mirrors mechanics, not domain ownership.
- Do not start with reverse-spec just because it looks isolated. It is not isolated; it leaks DB internals.
- Do not start by extracting generic helpers like `resolveProjectRoot` or `createErrorResponse`. That is procrastination disguised as architecture.
- Do not try to remove `ai-tools.ts` on the first pass. Keep the facade stable until the new structure is proven.

## Proposed Validation Matrix

Keep the current suite green, then add these targeted tests during extraction:

### Contract tests
- unified continuation response never leaks `follow_up_tool`
- process handlers fail clearly when `analysis` is missing
- comprehensive processing fails when original spec is absent

### Persistence tests
- saved feature spec remains original source text
- nested config updates preserve sibling settings
- reverse-spec writes expected metadata artifacts

### Failure-path tests
- malformed schema payload for each extracted workflow family
- missing project context falls back deterministically
- threshold validation failures produce structured errors

## Suggested First PR

The first extraction PR should be intentionally narrow:

1. add `src/ai/contracts.ts`
2. add `src/ai/shared/task-mappers.ts`
3. add `src/ai/shared/project-context.ts`
4. switch the spec-intake family to use those shared modules
5. keep `src/ai-tools.ts` as the export surface
6. add tests for the new shared seams

If the first PR is bigger than that, it is likely too big.

## Final Recommendation

This extraction is worth doing, but only if it is treated as a behavior-preserving restructuring with explicit gates.

The main risk is not lack of abstraction. The main risk is moving fragile implicit contracts into more files and pretending the system is now cleaner. If the internal types, shared context boundary, and task mapping seams are not defined first, the refactor will create more surface area without creating more control.
