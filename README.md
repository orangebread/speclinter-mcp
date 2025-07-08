# SpecLinter MCP

Transform specifications into structured tasks with built-in quality gates for AI-powered development.

## ✨ Features

- **🤖 AI-Leveraged Analysis**: Semantic understanding of specifications vs. regex patterns
- **📊 Quality Grading**: A+ to F grading with actionable improvement suggestions
- **🔧 Task Generation**: Break down specs into implementable tasks with dependencies
- **🧪 Scenario Generation**: Generate Gherkin scenarios for behavior specification
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
"Validate the implementation of my feature"
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
└── speclinter-tasks/
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
node dist/cli.js serve               # Start MCP server
node dist/cli.js validate <feature> # Validate feature implementation (requires AI)
node dist/cli.js status <feature>   # Show feature status
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

### 🤖 `speclinter_validate_implementation_prepare`
**Step 1**: Scan codebase for feature implementation and prepare AI validation analysis.

**Parameters:**
- `feature_name` (string, required) - Name of the feature to validate
- `project_root` (string, optional) - Root directory of the project

**Returns:**
- 🎯 Comprehensive AI validation prompt with implementation analysis
- 📁 Scanned implementation files and their relevance scores
- 🧪 Gherkin scenarios for validation criteria
- 🔧 Follow-up tool instructions for AI processing

### 🔍 `speclinter_validate_implementation_process`
**Step 2**: Process AI validation analysis and provide comprehensive implementation assessment.

**Parameters:**
- `analysis` (object, required) - AI validation results matching AIFeatureValidationSchema
- `feature_name` (string, required) - Name of the feature being validated
- `project_root` (string, optional) - Root directory of the project

**Returns:**
- 📊 Comprehensive validation results with quality scores
- ✅ Task-by-task implementation status and recommendations
- 🏗️ Architectural alignment assessment
- 🔒 Security and performance considerations
- 📈 Prioritized next steps for feature completion
- 🤖 AI insights and intelligent recommendations

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

## 🤖 AI-Powered Implementation Validation

SpecLinter's revolutionary validation system uses AI to intelligently assess your feature implementations against specifications and project patterns.

### 🎯 How It Works

1. **🔍 Codebase Scanning**: Automatically finds implementation files related to your feature
2. **🧠 AI Analysis**: Semantic understanding of what your code actually does vs. what was specified
3. **📊 Quality Assessment**: Evaluates code quality, pattern compliance, and completeness
4. **✅ Acceptance Validation**: Checks each acceptance criteria against actual implementation
5. **🏗️ Architectural Review**: Ensures consistency with project patterns and standards
6. **🔒 Security & Performance**: Identifies potential security and performance issues
7. **📈 Actionable Insights**: Provides prioritized recommendations for improvement

### 🌟 Key Benefits

- **Semantic Understanding**: AI knows the difference between a login form and a search form
- **Pattern Awareness**: Validates against your project's specific coding patterns
- **Quality Scoring**: Objective assessment of implementation quality (0-100)
- **Auto-Status Updates**: Automatically updates task statuses based on actual implementation
- **Intelligent Recommendations**: Specific, actionable next steps for feature completion
- **Comprehensive Coverage**: Analyzes architecture, security, performance, and testing

### 📋 Validation Results Include

- **Task-by-Task Analysis**: Implementation status and quality score for each task
- **Code Quality Issues**: Identified problems with severity levels and fix suggestions
- **Pattern Compliance**: How well your code follows project conventions
- **Security Assessment**: Potential vulnerabilities and security recommendations
- **Performance Review**: Performance considerations and optimization suggestions
- **Test Coverage**: Analysis of existing tests and recommendations for improvement
- **Next Steps**: Prioritized action items for feature completion

> **🚀 Revolutionary Approach**: Unlike traditional testing tools that only check syntax, SpecLinter's AI validation understands intent, context, and quality - providing insights no other tool can match.

## 🚀 Workflow Scenarios

Real-world user journeys demonstrating SpecLinter's power in different development contexts.

### 🆕 New Project Setup
**Sarah starts a React e-commerce project with quality practices from day one**

```gherkin
Scenario: Setting up SpecLinter in a new React project
  Given Sarah has created a new React TypeScript project
  When she asks her AI: "Initialize SpecLinter in my project"
  Then SpecLinter creates the `.speclinter/` directory structure
  And generates initial configuration for React/TypeScript stack
  And creates context files with detected patterns

Scenario: Creating first feature from specification
  When she asks: "Parse this spec: Create a product catalog page that displays items in a grid layout with filtering by category, price range, and search functionality."
  Then SpecLinter analyzes the specification quality (B+ grade)
  And generates 8-12 structured tasks with React-specific patterns
  And creates Gherkin scenarios describing expected behavior for each task
  And saves tasks in `speclinter-tasks/product-catalog/` directory
```

### 🏢 Legacy Codebase Integration
**Marcus adds SpecLinter to a 3-year-old Node.js API project**

```gherkin
Scenario: Analyzing legacy codebase patterns
  Given Marcus has a mature Node.js Express API project
  When he initializes SpecLinter and runs codebase analysis
  Then SpecLinter identifies existing error handling patterns
  And detects API route structures and middleware usage
  And generates context documentation reflecting actual code patterns

Scenario: Detecting duplicate functionality
  Given Marcus wants to add "user profile management"
  When he asks SpecLinter to find similar features
  Then SpecLinter identifies existing user-related endpoints
  And provides semantic similarity analysis with 85% confidence
  And recommends extending existing features vs. creating new ones
```

### 🔄 Complete Feature Development Lifecycle
**Emma develops a notification system from spec to deployment**

```gherkin
Scenario: High-quality specification parsing
  When Emma submits: "Implement a real-time notification system with push notifications, delivery scheduling, rate limiting (max 10/hour), and email fallback."
  Then SpecLinter grades the specification as A (excellent quality)
  And generates 12 well-structured tasks including WebSocket setup and rate limiting
  And creates Gherkin scenarios describing the expected behavior for each task

Scenario: Task progression and AI validation
  When she completes the WebSocket setup task
  And asks: "Update task status for WebSocket connection to completed"
  Then SpecLinter marks the task as completed
  And updates the feature progress dashboard
  When she asks: "Validate the implementation of notification-system feature"
  Then SpecLinter scans the codebase for implementation files
  And AI analyzes the code against acceptance criteria and project patterns
  And provides comprehensive validation with quality scores and recommendations
  And automatically updates task statuses based on actual implementation found
```

### 👥 Team Collaboration
**Development team coordinates feature development**

```gherkin
Scenario: Feature assignment and coordination
  Given the team lead has parsed a large e-commerce checkout specification
  When developer Alex asks: "Show me the status of checkout-system tasks"
  Then SpecLinter displays current progress with task dependencies
  And shows 5 completed, 3 in progress, 7 not started
  And provides estimated completion timeline

Scenario: Avoiding duplicate work
  Given developer Lisa is working on payment processing
  When Tom asks: "Find similar features to payment validation logic"
  Then SpecLinter identifies 90% semantic similarity with Lisa's work
  And recommends coordination between Lisa and Tom
```

### 📈 Quality Improvement Journey
**David improves specification quality over time**

```gherkin
Scenario: Learning from poor specifications
  Given David submits: "Add social features to the app"
  Then SpecLinter assigns grade F (failing quality)
  And provides specific feedback: "Define specific social features", "Add acceptance criteria"
  And suggests improvement template with examples

Scenario: Iterative specification improvement
  When he revises to include messaging, group chats, encryption, and admin controls
  Then SpecLinter grades the improved specification as B+ (good quality)
  And generates 10 actionable tasks with clear acceptance criteria
  And provides suggestions for A-grade quality
```

### 🔍 Advanced Similarity Detection
**Large team prevents feature duplication across microservices**

```gherkin
Scenario: Cross-service similarity detection
  Given the team has 5 microservices with SpecLinter integration
  When Maria asks: "Parse this spec: Create user profile service with avatar upload and privacy settings"
  Then SpecLinter scans across all connected services
  And identifies 75% similarity with existing profile functionality in auth service
  And recommends extending the auth service vs. creating new service

Scenario: Technical debt identification
  When the team asks for similarity analysis across all features
  Then SpecLinter identifies patterns of duplication:
    - 3 different authentication implementations
    - 2 separate file upload systems
  And provides refactoring recommendations with priority scores
```

> **💡 Pro Tip**: These scenarios show SpecLinter's evolution from simple spec parsing to intelligent development orchestration. Start with basic workflows and gradually leverage advanced features like similarity detection and team coordination.

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
