# SpecLinter MCP Tools Reference

Complete reference for all Model Context Protocol (MCP) tools provided by SpecLinter.

## Tool Categories

### Project Setup Tools

#### `speclinter_init_project`
**Purpose**: Initialize SpecLinter in a project directory with default configuration and directory structure

**Parameters**:
- `project_root` (optional): Root directory for the project (defaults to current working directory)
- `force_reinit` (optional): Force reinitialization if already initialized (default: false)

**Usage Example**:
```
"Initialize SpecLinter in my project"
"Set up SpecLinter for this codebase"
```

**What it creates**:
- `.speclinter/` directory with configuration and database
- `speclinter-tasks/` directory for feature tasks
- A context directory that is populated after codebase analysis

### Codebase Analysis Tools

#### `speclinter_analyze_codebase`
**Purpose**: Comprehensive codebase analysis that generates rich project documentation and context files

**Parameters**:
- `project_root` (optional): Root directory of the project
- `analysis_depth` (optional): Depth of analysis ('quick', 'standard', 'comprehensive') - default: 'standard'
- `max_files` (optional): Maximum number of files to analyze (default: 50)
- `max_file_size` (optional): Maximum file size in bytes to include (default: 50000)
- `include_reverse_spec` (optional): Discover existing features from the codebase
- `analysis` (optional): Advanced usage for supplying pre-computed AI analysis

**Usage Example**:
```
"Analyze my codebase to understand the patterns and tech stack"
"Generate project context documentation from my code"
```

### Specification Parsing Tools

#### `speclinter_parse_spec`
**Purpose**: Analyze a specification and create SpecLinter tasks

**Parameters**:
- `spec`: The specification text to parse
- `feature_name`: Name for the feature (used for directory)
- `context` (optional): Additional context about the implementation
- `project_root` (optional): Root directory of the project
- `deduplication_strategy` (optional): How to handle duplicates ('prompt', 'merge', 'replace', 'skip')
- `similarity_threshold` (optional): Similarity threshold for detecting duplicates (0.0 to 1.0)
- `skip_similarity_check` (optional): Skip similarity checking entirely
- `analysis` (optional): Advanced usage for supplying pre-computed AI analysis

**Usage Example**:
```
"Parse this spec: Create a user authentication system with email verification"
"Break down this feature: [your specification here]"
```

### Similarity Detection Tools

#### `speclinter_find_similar`
**Purpose**: Find existing features with similar intent or scope

**Parameters**:
- `spec`: Specification to find similarities for
- `threshold` (optional): Similarity threshold (0.0 to 1.0) - default: 0.8
- `project_root` (optional): Root directory of the project
- `analysis` (optional): Advanced usage for supplying pre-computed AI analysis

**Usage Example**:
```
"Check if this feature already exists: [specification]"
"Find similar functionality to: user profile management"
```

### Task Management Tools

#### `speclinter_get_task_status`
**Purpose**: Get the current status of a feature's tasks

**Parameters**:
- `feature_name`: Name of the feature to check
- `project_root` (optional): Root directory of the project

**Usage Example**:
```
"Show me the status of my authentication-system tasks"
"What's the progress on the user-dashboard feature?"
```

**Returns**:
- Task completion status
- Progress percentages
- Individual task details
- Dependency information

#### `speclinter_update_task_status`
**Purpose**: Update the status of a specific task

**Parameters**:
- `feature_name`: Name of the feature
- `task_id`: ID of the task to update
- `status`: New status ('not_started', 'in_progress', 'completed', 'blocked')
- `notes` (optional): Optional notes about the status change
- `project_root` (optional): Root directory of the project

**Usage Example**:
```
"Mark the database setup task as completed"
"Update task [task-id] to in-progress"
"Set the API integration task to blocked"
```

### Implementation Validation Tools

#### `speclinter_validate_implementation`
**Purpose**: Scan the codebase for a feature implementation and evaluate it against the saved specification

**Parameters**:
- `feature_name`: Name of the feature to validate
- `project_root` (optional): Root directory of the project
- `analysis` (optional): Advanced usage for supplying pre-computed AI analysis

**Usage Example**:
```
"Validate the implementation of my authentication feature"
"Check if my user-dashboard code meets the requirements"
```

**Validation Results Include**:
- Task-by-task implementation status
- Code quality assessment
- Pattern compliance analysis
- Security considerations
- Performance recommendations
- Test coverage analysis

## Tool Usage Patterns

### Unified AI-Leveraged Pattern

Most SpecLinter tools expose a single MCP tool call:

1. **Unified Tool Call**: Collects data, validates prerequisites, and decides whether AI analysis is required
2. **Internal Follow-up**: If AI analysis is needed, the assistant completes the follow-up automatically using the returned prompt and schema

This keeps the public tool surface simple while preserving:
- **Semantic Understanding**: AI provides intelligent analysis
- **Flexible Processing**: Different AI models can be used
- **Quality Control**: Human review of AI analysis before processing

### Natural Language Interface

All tools are designed to work with natural language prompts:

```
"Initialize SpecLinter in my project"
"Parse this spec: [specification text]"
"Show me task status for [feature-name]"
"Validate implementation of [feature-name]"
```

The AI assistant automatically:
- Selects appropriate tools
- Provides required parameters
- Handles any required AI follow-up
- Formats results for human consumption

## Integration Examples

### Basic Workflow
1. Initialize project: `speclinter_init_project`
2. Analyze codebase: `speclinter_analyze_codebase`
3. Parse specification: `speclinter_parse_spec`
4. Check progress: `speclinter_get_task_status`
5. Validate implementation: `speclinter_validate_implementation`

### Advanced Workflow
1. Check for similar features: `speclinter_find_similar`
2. Parse with deduplication: `speclinter_parse_spec`
3. Update task statuses: `speclinter_update_task_status`
4. Continuous validation: `speclinter_validate_implementation`

## Error Handling

All tools include comprehensive error handling:
- **Validation Errors**: Invalid parameters or missing data
- **File System Errors**: Permission issues or missing directories
- **Database Errors**: SQLite connection or query issues
- **AI Processing Errors**: Malformed analysis results

Error responses include:
- Clear error messages
- Suggested fixes
- Relevant context information
