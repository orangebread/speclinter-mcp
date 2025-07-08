# 🎯 SpecLinter MCP

Transform specifications into structured tasks with built-in quality gates for AI-powered development.

## ✨ Features

- **🤖 AI-Leveraged Analysis**: Semantic understanding of specifications vs. regex patterns
- **📊 Quality Grading**: A+ to F grading with actionable improvement suggestions
- **🔧 Task Generation**: Break down specs into implementable tasks with dependencies
- **🧪 Test Creation**: Generate Gherkin scenarios automatically
- **🎨 Project Context**: Auto-detect tech stack and patterns for better task generation
- **🔍 Similarity Detection**: AI-powered semantic analysis with database-backed feature comparison
- **🛡️ Type Safety**: Full TypeScript with Zod validation

## 🚀 Quick Start

### 📋 Prerequisites
- **Node.js** 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm) on macOS/Linux or [nvm-windows](https://github.com/coreybutler/nvm-windows) on Windows)
- **Package Manager**: pnpm (recommended), npm, or yarn

### 📦 Installation

```bash
# Install pnpm if you haven't already (recommended)
npm install -g pnpm

# Install dependencies and build
pnpm install && pnpm build

# Alternative: use npm or yarn
# npm install && npm run build
# yarn install && yarn build
```

### 🔌 MCP Integration Setup

SpecLinter works as an MCP (Model Context Protocol) server. Add this to your AI IDE's MCP configuration file:

```json
{
  "mcpServers": {
    "speclinter": {
      "command": "node",
      "args": ["/absolute/path/to/speclinter-mcp/dist/cli.js", "serve"],
      "cwd": "/absolute/path/to/speclinter-mcp"
    }
  }
}
```

**Configuration File Locations:**
- **Cursor IDE**: `~/.cursor/mcp_servers.json`
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
- **Windsurf IDE**: Check Windsurf documentation for MCP settings location

> **⚠️ Important**: Replace `/absolute/path/to/speclinter-mcp` with the actual absolute path to your SpecLinter installation.

### ✅ Verification & Testing

```bash
# 1. Verify Node.js version
node --version  # Should be 18+

# 2. Test the server starts
node dist/cli.js serve
# Should start without errors (Ctrl+C to stop)

# 3. Make CLI executable on macOS/Linux (if needed)
chmod +x dist/cli.js
```

**Verify MCP Integration:**
1. **🤖 Ask your AI**: "Initialize SpecLinter in my project"
2. **📁 Check for success**: Look for `.speclinter/` directory creation
3. **📝 Test parsing**: "Parse this spec: Create a user login form with email validation"

**Common Usage:**
```
"Initialize SpecLinter in my project"
"Analyze my codebase to detect patterns and tech stack"
"Parse this spec: [your specification here]"
"Show me the status of my tasks"
"Run tests for my feature"
```

## 📁 Project Structure

SpecLinter creates this structure when initialized:

```
your-project/
├── .speclinter/
│   ├── config.json            # Configuration
│   ├── speclinter.db          # SQLite database
│   ├── cache/                 # Analysis cache
│   └── context/               # Project context
│       ├── project.md         # Tech stack, constraints
│       ├── patterns.md        # Code patterns
│       └── architecture.md    # Architecture decisions
└── tasks/
    └── [feature-name]/
        ├── _active.md         # Live status dashboard
        ├── task_01_*.md       # Individual task files
        ├── meta.json          # Feature metadata
        └── gherkin/           # Test scenarios
            └── *.feature
```

## 💻 CLI Commands

SpecLinter is primarily designed for MCP integration, but includes these CLI commands:

```bash
node dist/cli.js serve             # Start MCP server
node dist/cli.js test <feature>    # Run feature tests
node dist/cli.js status <feature>  # Show feature status
```

> **💡 Note**: Project initialization uses the MCP `speclinter_init_project` tool.

## 🛠️ Available MCP Tools

When using SpecLinter through AI IDEs or the MCP protocol, these tools are available:

### 🚀 `speclinter_init_project`
Initialize SpecLinter in your project with default configuration and templates.

**Parameters:**
- `project_root` (string, optional) - Root directory for the project (defaults to current working directory)
- `force_reinit` (boolean, optional, default: false) - Force reinitialization if already initialized

**Returns:**
- ✅ Success status and message
- 📁 List of directories created
- 📋 Next steps for configuration

> **🎯 Auto-Magic**: Automatically detects your project root directory - no manual configuration needed!

### 🤖 Comprehensive Codebase Analysis

#### 🔍 `speclinter_analyze_codebase_prepare`
Comprehensive codebase analysis that generates rich project documentation and context files.

**Parameters:**
- `project_root` (string, optional) - Root directory of the project (defaults to auto-detected project root)
- `analysis_depth` (enum, optional, default: 'standard') - Depth of analysis: 'quick', 'standard', or 'deep'
- `max_files` (number, optional, default: 50) - Maximum number of files to analyze
- `max_file_size` (number, optional, default: 50000) - Maximum file size in bytes to include

**Returns:**
- 🎯 Comprehensive AI analysis prompt with project context
- 📁 Collected files with package.json and README context
- 🔧 Follow-up tool for processing results

#### 🔄 `speclinter_analyze_codebase_process`
Process comprehensive codebase analysis results and update SpecLinter context files.

**Parameters:**
- `analysis` (object, required) - AI analysis results matching AICodebaseAnalysisWithContextSchema
- `contextFiles` (object, optional) - AI-generated context files
- `project_root` (string, optional) - Root directory of the project

**Returns:**
- ✅ Rich, project-specific context files (project.md, architecture.md, patterns.md)
- 📊 Comprehensive tech stack and architectural analysis
- 💡 AI-optimized documentation for effective development assistance

### 🤖 AI-Leveraged Specification Parsing

#### 📝 `speclinter_parse_spec_prepare`
**Step 1**: Prepare specification for AI analysis and return structured analysis prompt.

**Parameters:**
- `spec` (string, required) - The specification text to parse
- `feature_name` (string, required) - Name for the feature (used for directory)
- `context` (string, optional) - Additional context about the implementation
- `project_root` (string, optional) - Root directory of the project

**Returns:**
- 🎯 Structured AI analysis prompt with project context
- 📋 Existing project patterns and tech stack information
- 🔧 Follow-up tool instructions

#### 🔄 `speclinter_parse_spec_process`
**Step 2**: Process AI specification analysis results and create SpecLinter tasks.

**Parameters:**
- `analysis` (object, required) - AI analysis results matching AISpecAnalysisSchema
- `feature_name` (string, required) - Name for the feature
- `original_spec` (string, optional) - Original specification text
- `project_root` (string, optional) - Root directory of the project
- `deduplication_strategy` (enum, optional, default: 'prompt') - How to handle duplicates: 'prompt', 'merge', 'replace', 'skip'
- `similarity_threshold` (number, optional) - Similarity threshold for detecting duplicates (0.0 to 1.0)
- `skip_similarity_check` (boolean, optional, default: false) - Skip similarity checking entirely

**Returns:**
- 📊 Quality grade (A+ to F) and score with AI insights
- 🔧 Generated tasks with intelligent acceptance criteria
- 📄 Files created (task files, Gherkin scenarios)
- 💡 AI-powered improvement suggestions
- 🔍 Semantic similarity analysis

### 🤖 AI-Leveraged Similarity Analysis

#### 🔍 `speclinter_find_similar_prepare`
**Step 1**: Prepare specification for AI similarity analysis against existing features.

**Parameters:**
- `spec` (string, required) - Specification to find similarities for
- `threshold` (number, optional, default: 0.8) - Similarity threshold (0.0 to 1.0)
- `project_root` (string, optional) - Root directory of the project

**Returns:**
- 🎯 Structured AI similarity analysis prompt
- 📋 Existing features for comparison
- 🔧 Follow-up tool instructions

#### 🔄 `speclinter_find_similar_process`
**Step 2**: Process AI similarity analysis results and return recommendations.

**Parameters:**
- `analysis` (object, required) - AI analysis results matching AISimilarityAnalysisSchema
- `threshold` (number, optional, default: 0.8) - Similarity threshold used
- `project_root` (string, optional) - Root directory of the project

**Returns:**
- 📋 Semantic similarity analysis with confidence scores
- 💡 Intelligent recommendations (merge/separate/refactor)
- 📊 Detailed difference analysis

### 📊 `speclinter_get_task_status`
Get the current status and progress of a feature's tasks.

**Parameters:**
- `feature_name` (string, required) - Name of the feature to check
- `project_root` (string, optional) - Root directory of the project

**Returns:**
- 📈 Total, completed, in-progress, and blocked task counts
- 📊 Overall progress percentage
- 🕒 Last updated timestamp

### 🧪 `speclinter_run_tests`
Run tests for a feature and update task status.

**Parameters:**
- `feature_name` (string, required) - Name of the feature to test
- `task_id` (string, optional) - Optional specific task to test
- `project_root` (string, optional) - Root directory of the project

**Returns:**
- ✅ Test results with pass/fail counts
- 📊 Coverage information
- 📝 Detailed test output

### ✏️ `speclinter_update_task_status`
Update the status of a specific task and regenerate active files.

**Parameters:**
- `feature_name` (string, required) - Name of the feature
- `task_id` (string, required) - ID of the task to update
- `status` (enum, required) - New status: `not_started`, `in_progress`, `completed`, `blocked`
- `notes` (string, optional) - Optional notes about the status change
- `project_root` (string, optional) - Root directory of the project

**Returns:**
- 📝 Updated task information
- ✅ Confirmation of status change



## 📊 Quality Grading System

SpecLinter analyzes specifications and assigns quality grades:

### 🎯 Grade Scale
- **🏆 A+ (95-100)**: Exceptional specification with comprehensive details
- **⭐ A (90-94)**: Excellent specification with clear requirements
- **✅ B (80-89)**: Good specification with minor improvements needed
- **⚠️ C (70-79)**: Adequate specification with several areas for improvement
- **❌ D (60-69)**: Poor specification requiring significant enhancement
- **🚫 F (0-59)**: Failing specification with major issues

### 🔍 Quality Criteria
- **✅ Acceptance Criteria**: Clear, measurable success conditions
- **⚠️ Error Handling**: Specified failure scenarios and edge cases
- **🎯 Specificity**: Concrete requirements vs. vague terms
- **📋 Completeness**: Sufficient detail for implementation
- **👤 User Stories**: Proper format and context (optional)

### 💡 Improvement Suggestions
SpecLinter provides actionable feedback:
- 📊 Replace vague terms with specific metrics
- ✅ Add missing acceptance criteria
- ⚠️ Include error handling scenarios
- 📝 Structure as user stories when appropriate
- 📖 Expand brief specifications with implementation details



## 🔧 Development

```bash
git clone <repository-url>
cd speclinter-mcp
pnpm install && pnpm build

# Available scripts
pnpm build        # Build for production
pnpm test         # Run tests
pnpm lint         # Lint code
pnpm dev          # Watch mode
```

## 🏗️ Architecture

- **🔒 Type Safety**: Full TypeScript with Zod validation
- **🤖 AI-Leveraged**: Two-step pattern for semantic analysis
- **💾 Database**: SQLite for task management, feature history, and AI analysis input
- **🔌 MCP Integration**: Full Model Context Protocol support

## License

MIT
