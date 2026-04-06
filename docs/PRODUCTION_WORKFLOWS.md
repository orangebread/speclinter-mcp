# SpecLinter Production Workflow Contract

This document defines the intended production workflows for SpecLinter.

The goal is to eliminate product drift. SpecLinter should behave like a reliable stateful MCP tool, not a loose collection of AI-shaped utilities.

## Product Intent

SpecLinter exists to do one core job:

1. Accept a feature specification.
2. Turn it into durable, actionable tasks.
3. Track execution state.
4. Validate implementation against the saved source specification.

Anything outside that loop is secondary.

## Contract Decisions

These decisions are recommended as hard product rules:

- Initialization is explicit only. No silent auto-initialization on read paths.
- Public workflows are single-step MCP tools. Internal prepare/process steps stay internal.
- The original spec text is immutable source data once saved.
- The database is the source of truth for state. Markdown files are generated views.
- Project-aware analysis is only claimed when codebase context has actually been generated and consumed.
- If AI evidence is weak, the system returns uncertainty, not fake precision.

## Public Interfaces

These are the supported public interfaces:

- MCP tools
- CLI commands for local setup and read-oriented convenience
- Generated task/spec artifacts under the configured task directory
- Context artifacts under `.speclinter/context`

These are internal only:

- prepare/process helper functions
- intermediate AI prompts and schema handoff details
- transient orchestration metadata

These should be removed or deprecated if retained:

- dead commands
- leaked internal follow-up tool names
- legacy flows that contradict the unified tool contract

## Workflow 1: Project Bootstrap

### Purpose

Turn a normal repository into a SpecLinter-enabled repository with explicit user intent.

### Trigger

- MCP: `speclinter_init_project`
- CLI: `speclinter init`

### Required Inputs

- `project_root` or current working directory

### System Behavior

- Create `.speclinter/`
- Create `.speclinter/config.json`
- Create `.speclinter/context/`
- Create the task output directory
- Initialize database schema
- Return exact next actions

### Outputs

- success/failure result
- created directories
- next recommended workflow

### Persisted State

- config file
- database
- `.gitignore` for transient DB files

### Failure Modes

- already initialized
- invalid path
- permission failure
- native dependency or DB initialization failure

### Public Contract

- supported and explicit

### Internal Notes

- reads must never trigger this workflow

## Workflow 2: Codebase Analysis and Context Generation

### Purpose

Generate the context that allows later workflows to be project-aware.

### Trigger

- MCP: `speclinter_analyze_codebase`

### Required Inputs

- `project_root`
- `analysis_depth`
- optional reverse-spec settings

### System Behavior

- inspect repository structure
- extract tech stack and architectural cues
- identify recurring patterns and constraints
- write project context files
- optionally discover existing features from code

### Outputs

- analysis summary
- files written to `.speclinter/context`
- reverse-spec summary when enabled

### Persisted State

- context files
- reverse-spec state if enabled

### Failure Modes

- project not initialized
- repository too large for configured limits
- unreadable files
- no meaningful context discovered

### Public Contract

- single MCP tool

### Internal Notes

- later workflows may say "no project context available" only if this has not been run or produced insufficient context
- if context exists, downstream analysis must consume it

## Workflow 3: Spec Intake to Saved Feature

### Purpose

Convert a raw specification into durable feature records and actionable tasks.

### Trigger

- MCP: `speclinter_parse_spec`

### Required Inputs

- `spec`
- `feature_name`
- optional user context
- optional deduplication strategy

### System Behavior

- validate input size and project state
- optionally load project context
- analyze specification quality
- generate tasks and acceptance criteria
- check for duplicate or overlapping features
- save feature, tasks, and generated artifacts

### Outputs

- feature grade and score
- generated tasks
- deduplication result if applicable
- files written
- next steps

### Persisted State

- original spec text
- quality metadata
- task rows
- generated task/spec markdown views

### Failure Modes

- missing initialization
- invalid AI response
- duplicate conflict requiring user decision
- quality too weak for task generation if quality gating is enabled

### Public Contract

- single MCP tool

### Internal Notes

- never replace the original spec with an AI summary or placeholder
- task generation must point back to the saved feature record

## Workflow 4: Duplicate Detection and Merge Decision

### Purpose

Prevent duplicate work while keeping merge behavior deterministic.

### Trigger

- implicit during `speclinter_parse_spec`
- explicit via `speclinter_find_similar` for advisory lookup

### Required Inputs

- candidate spec
- configured or explicit similarity threshold

### System Behavior

- compare candidate spec against saved original specs
- include reverse-discovered features when available
- return exact match, high-confidence similarity, or no meaningful overlap
- if part of parse flow, honor `prompt`, `skip`, `merge`, or `replace`

### Outputs

- duplicate classification
- similar feature list
- recommended action

### Persisted State

- none unless parse flow proceeds with merge/replace

### Failure Modes

- insufficient feature baseline
- ambiguous overlap
- merge semantics undefined

### Public Contract

- `find_similar` is advisory
- `parse_spec` is authoritative for final save behavior

### Internal Notes

- auto-merge should only happen when semantics are explicit and confidence is extremely high

## Workflow 5: Implementation Validation

### Purpose

Evaluate implementation against the saved feature specification and tasks.

### Trigger

- MCP: `speclinter_validate_implementation`
- CLI: `speclinter validate <feature>` as a read-oriented entry point

### Required Inputs

- `feature_name`
- `project_root`

### System Behavior

- load saved feature and original spec
- load associated tasks and acceptance criteria
- locate likely implementation files
- compare code evidence to saved expectations
- produce completion, quality, and gap analysis

### Outputs

- overall status
- completion percentage
- quality score
- missing or weakly implemented criteria
- suggested next actions

### Persisted State

- validation snapshots only

### Failure Modes

- feature not found
- original spec missing or corrupted
- insufficient code evidence
- AI response schema mismatch

### Public Contract

- single MCP tool
- CLI may surface summary data but must not invent a separate workflow contract

### Internal Notes

- if evidence is insufficient, return `insufficient_evidence` or equivalent, not a fake pass/fail

## Workflow 6: Task Lifecycle and Status Tracking

### Purpose

Track implementation progress in a way that is operational, not decorative.

### Trigger

- MCP: `speclinter_get_task_status`
- MCP: `speclinter_update_task_status`
- CLI: `speclinter status <feature>`

### Required Inputs

- `feature_name`
- for updates: `task_id`, `status`, optional notes

### System Behavior

- read task state from DB
- apply validated status transitions
- update feature progress
- optionally refresh generated task views

### Outputs

- task status summary
- per-task progress details
- updated task confirmation for mutations

### Persisted State

- DB task rows
- optional regenerated markdown views

### Failure Modes

- task not found
- feature not found
- invalid status transition
- stale generated file view

### Public Contract

- DB is authoritative
- markdown is a projection for humans

### Internal Notes

- do not split authority between filesystem and DB

## Workflow 7: AI Orchestration Contract

### Purpose

Make AI-dependent workflows reliable for MCP clients and assistants.

### Trigger

- any public workflow that requires semantic analysis

### Required Inputs

- workflow-specific context

### System Behavior

- validate prerequisites
- prepare internal analysis context
- if AI is required, return a machine-readable continuation state
- complete internal processing once AI output is available
- return final user-facing result from the original public workflow

### Outputs

- final structured result
- or a machine-readable continuation envelope that clients are documented to handle

### Persisted State

- final validated results only

### Failure Modes

- schema mismatch
- incomplete AI response
- unsupported client that cannot continue AI analysis

### Public Contract

- the public tool name remains the same throughout the workflow
- internal helper names are never exposed as required user actions

### Internal Notes

- do not use `success: false` for a normal continuation state unless every client is explicitly documented to treat it as non-error
- prefer a distinct status field like `state: "needs_ai_analysis"`

## Source of Truth Model

The following ownership model is recommended:

- original spec: authoritative feature intent
- tasks table: authoritative task state
- validation snapshots: authoritative historical validation results
- markdown task/spec files: generated views
- context files: generated analysis artifacts, not business state

## Immediate Cleanup Required

These items should be treated as contract violations:

- silent auto-init on read paths
- placeholder spec text replacing original input
- user-facing references to nonexistent commands
- leaked internal follow-up tool names
- project-aware claims when no context is loaded
- conflicting terminology such as `deep` vs `comprehensive`

## Implementation Order

1. Align AI orchestration with the single public tool contract.
2. Preserve original spec text end-to-end.
3. Remove implicit initialization from read flows.
4. Make project-context loading real and required for project-aware claims.
5. Remove dead commands and stale docs.
6. Add tests for each workflow's success path and hard failure path.

## Definition of Done

SpecLinter is production-ready only when:

- each public workflow has one documented contract
- user-facing docs match actual MCP behavior
- original specs survive every workflow unchanged
- task state is authoritative and durable
- AI continuation behavior is predictable for clients
- failure states are explicit and non-destructive
- each workflow has automated coverage for success and key edge cases
