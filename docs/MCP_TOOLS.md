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
- Project context files (project.md, patterns.md, architecture.md)

### Codebase Analysis Tools

#### `speclinter_analyze_codebase_prepare`
**Purpose**: Comprehensive codebase analysis that generates rich project documentation and context files

**Parameters**:
- `project_root` (optional): Root directory of the project
- `analysis_depth` (optional): Depth of analysis ('quick', 'standard', 'deep') - default: 'standard'
- `max_files` (optional): Maximum number of files to analyze (default: 50)
- `max_file_size` (optional): Maximum file size in bytes to include (default: 50000)

**Usage Example**:
```
"Analyze my codebase to understand the patterns and tech stack"
"Generate project context documentation from my code"
```

#### `speclinter_analyze_codebase_process`
**Purpose**: Process comprehensive codebase analysis results and update SpecLinter context files

**Parameters**:
- `analysis`: AI analysis results matching AICodebaseAnalysisWithContextSchema
- `contextFiles` (optional): AI-generated context files
- `project_root` (optional): Root directory of the project

**Usage**: This is typically called automatically after the prepare step.

### Specification Parsing Tools

#### `speclinter_parse_spec_prepare`
**Purpose**: Prepare specification for AI analysis and return structured analysis prompt

**Parameters**:
- `spec`: The specification text to parse
- `feature_name`: Name for the feature (used for directory)
- `context` (optional): Additional context about the implementation
- `project_root` (optional): Root directory of the project

**Usage Example**:
```
"Parse this spec: Create a user authentication system with email verification"
"Break down this feature: [your specification here]"
```

#### `speclinter_parse_spec_process`
**Purpose**: Process AI specification analysis results and create SpecLinter tasks

**Parameters**:
- `analysis`: AI analysis results matching AISpecAnalysisSchema
- `feature_name`: Name for the feature
- `original_spec` (optional): Original specification text
- `project_root` (optional): Root directory of the project
- `deduplication_strategy` (optional): How to handle duplicates ('prompt', 'merge', 'replace', 'skip')
- `similarity_threshold` (optional): Similarity threshold for detecting duplicates (0.0 to 1.0)
- `skip_similarity_check` (optional): Skip similarity checking entirely (default: false)

**Usage**: This is typically called automatically after the prepare step.

### Similarity Detection Tools

#### `speclinter_find_similar_prepare`
**Purpose**: Prepare specification for AI similarity analysis against existing features

**Parameters**:
- `spec`: Specification to find similarities for
- `threshold` (optional): Similarity threshold (0.0 to 1.0) - default: 0.8
- `project_root` (optional): Root directory of the project

**Usage Example**:
```
"Check if this feature already exists: [specification]"
"Find similar functionality to: user profile management"
```

#### `speclinter_find_similar_process`
**Purpose**: Process AI similarity analysis results and return recommendations

**Parameters**:
- `analysis`: AI analysis results matching AISimilarityAnalysisSchema
- `threshold` (optional): Similarity threshold used
- `project_root` (optional): Root directory of the project

**Usage**: This is typically called automatically after the prepare step.

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

#### `speclinter_validate_implementation_prepare`
**Purpose**: Scan codebase for feature implementation and prepare AI validation analysis

**Parameters**:
- `feature_name`: Name of the feature to validate
- `project_root` (optional): Root directory of the project

**Usage Example**:
```
"Validate the implementation of my authentication feature"
"Check if my user-dashboard code meets the requirements"
```

#### `speclinter_validate_implementation_process`
**Purpose**: Process AI validation analysis results and provide comprehensive implementation assessment

**Parameters**:
- `analysis`: AI validation results matching AIFeatureValidationSchema
- `feature_name`: Name of the feature being validated
- `project_root` (optional): Root directory of the project

**Usage**: This is typically called automatically after the prepare step.

**Validation Results Include**:
- Task-by-task implementation status
- Code quality assessment
- Pattern compliance analysis
- Security considerations
- Performance recommendations
- Test coverage analysis

## Tool Usage Patterns

### Two-Step AI-Leveraged Pattern

Most SpecLinter tools follow a two-step pattern:

1. **Prepare Step**: Collects data and generates AI prompts
2. **Process Step**: Takes AI analysis results and updates SpecLinter state

This pattern allows for:
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
- Handles the two-step process
- Formats results for human consumption

## Integration Examples

### Basic Workflow
1. Initialize project: `speclinter_init_project`
2. Analyze codebase: `speclinter_analyze_codebase_prepare` + `process`
3. Parse specification: `speclinter_parse_spec_prepare` + `process`
4. Check progress: `speclinter_get_task_status`
5. Validate implementation: `speclinter_validate_implementation_prepare` + `process`

### Advanced Workflow
1. Check for similar features: `speclinter_find_similar_prepare` + `process`
2. Parse with deduplication: `speclinter_parse_spec_prepare` + `process`
3. Update task statuses: `speclinter_update_task_status`
4. Continuous validation: `speclinter_validate_implementation_prepare` + `process`

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
