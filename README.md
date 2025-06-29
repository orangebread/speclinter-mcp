# SpecLinter MCP (Merged Implementation)

Transform specifications into structured tasks with built-in quality gates for AI-powered development.

## Features

- **Quality Grading**: Analyze specs with actionable feedback using configurable rules
- **Task Generation**: Break down specs into implementable tasks with dependencies
- **Test Creation**: Generate Gherkin scenarios automatically
- **Project Context**: Use your stack and patterns for better task generation
- **MCP Integration**: Works seamlessly in AI IDEs like Cursor and Windsurf
- **Type Safety**: Full TypeScript implementation with Zod validation
- **Modern Architecture**: Clean separation of concerns with better-sqlite3

## Quick Start

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Initialize in your project
cd my-project
speclinter init

# Configure your MCP client to use speclinter
# In Cursor/Windsurf: Add to MCP tools configuration
```

## Project Structure

```
your-project/
├── .speclinter/
│   ├── speclinter.db          # SQLite database
│   ├── config.json            # Type-safe configuration
│   └── context/               # Project context
│       ├── project.md         # Stack, constraints
│       ├── patterns.md        # Code patterns
│       └── architecture.md    # Architecture decisions
└── tasks/
    └── [feature-name]/
        ├── _active.md         # Current status
        ├── task_01_*.md       # Individual tasks
        ├── meta.json          # Feature metadata
        └── gherkin/           # Test files
            └── *.feature
```

## CLI Commands

```bash
speclinter init              # Initialize project
speclinter serve             # Start MCP server
speclinter test <feature>    # Run feature tests
speclinter status <feature>  # Show feature status
```

## Available MCP Tools

When using SpecLinter through AI IDEs or the MCP protocol, these tools are available:

### `parse_spec`
Parse a specification and generate structured tasks with quality grading.

**Parameters:**
- `spec` (string, required) - The specification text to parse
- `feature_name` (string, required) - Name for the feature (used for directory)
- `context` (string, optional) - Additional context about the implementation

**Returns:**
- Quality grade (A+ to F) and score
- Generated tasks with acceptance criteria
- Files created (task files, Gherkin scenarios)
- Improvement suggestions
- Similar existing features

**Example:**
```json
{
  "spec": "Create a user authentication system with login, logout, and password reset functionality. Users should receive confirmation emails after successful registration.",
  "feature_name": "user-auth",
  "context": "React web application with Node.js backend"
}
```

### `get_task_status`
Get the current status and progress of a feature's tasks.

**Parameters:**
- `feature_name` (string, required) - Name of the feature to check

**Returns:**
- Total, completed, in-progress, and blocked task counts
- Overall progress percentage
- Last updated timestamp

### `find_similar`
Find existing features similar to a given specification to avoid duplicate work.

**Parameters:**
- `spec` (string, required) - Specification to find similarities for
- `threshold` (number, optional, default: 0.8) - Similarity threshold (0.0 to 1.0)

**Returns:**
- List of similar features with similarity scores
- Feature summaries and task counts
- Status of similar features

### `update_task_status`
Update the status of a specific task and regenerate active files.

**Parameters:**
- `feature_name` (string, required) - Name of the feature
- `task_id` (string, required) - ID of the task to update
- `status` (string, required) - New status: `not_started`, `in_progress`, `completed`, `blocked`
- `notes` (string, optional) - Optional notes about the status change

**Returns:**
- Updated task information
- Confirmation of status change

## Quality Grading System

SpecLinter analyzes specifications and assigns quality grades:

### Grade Scale
- **A+ (95-100)**: Exceptional specification with comprehensive details
- **A (90-94)**: Excellent specification with clear requirements
- **B (80-89)**: Good specification with minor improvements needed
- **C (70-79)**: Adequate specification with several areas for improvement
- **D (60-69)**: Poor specification requiring significant enhancement
- **F (0-59)**: Failing specification with major issues

### Quality Criteria
- **Acceptance Criteria**: Clear, measurable success conditions
- **Error Handling**: Specified failure scenarios and edge cases
- **Specificity**: Concrete requirements vs. vague terms
- **Completeness**: Sufficient detail for implementation
- **User Stories**: Proper format and context (optional)

### Improvement Suggestions
SpecLinter provides actionable feedback:
- Replace vague terms with specific metrics
- Add missing acceptance criteria
- Include error handling scenarios
- Structure as user stories when appropriate
- Expand brief specifications with implementation details

## Testing SpecLinter Locally

### Quick Test
```bash
# Build the project
pnpm build

# Initialize in a test directory
mkdir test-project && cd test-project
speclinter init

# Create a test specification
echo "Create a user registration system with email validation." > spec.md

# Test the parse_spec tool
node -e "
import { handleParseSpec } from '../dist/tools.js';
import { readFileSync } from 'fs';

const spec = readFileSync('spec.md', 'utf-8');
const result = await handleParseSpec({
  spec,
  feature_name: 'user-registration',
  context: 'Web application'
});

console.log('Grade:', result.grade);
console.log('Tasks created:', result.tasks.length);
console.log('Files created:', result.files_created.length);
"

# Check the generated files
ls -la tasks/user-registration/
```

### MCP Server Testing
```bash
# Start the MCP server
node dist/cli.js serve

# In another terminal, send a test message
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}' | node dist/cli.js serve
```

### AI IDE Integration
Add to your MCP configuration:
```json
{
  "speclinter": {
    "command": "node",
    "args": ["/path/to/speclinter-mcp/dist/cli.js", "serve"],
    "cwd": "/path/to/speclinter-mcp"
  }
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Watch mode for development
pnpm build --watch

# Lint code
pnpm lint
```

## Architecture

This implementation combines clean architecture principles with comprehensive functionality:

- **Type Safety**: Full TypeScript with Zod validation
- **Modern Patterns**: ESM modules, async/await, proper error handling
- **Database**: better-sqlite3 for optimal performance
- **CLI**: Commander.js with rich terminal UI
- **MCP Integration**: Full Model Context Protocol support
- **Testing**: Vitest with comprehensive coverage

## License

MIT
