```
 ██████╗ ██████╗ ███████╗ ██████╗██╗     ██╗███╗   ██╗████████╗███████╗██████╗
██╔════╝ ██╔══██╗██╔════╝██╔════╝██║     ██║████╗  ██║╚══██╔══╝██╔════╝██╔══██╗
███████╗ ██████╔╝█████╗  ██║     ██║     ██║██╔██╗ ██║   ██║   █████╗  ██████╔╝
╚════██║ ██╔═══╝ ██╔══╝  ██║     ██║     ██║██║╚██╗██║   ██║   ██╔══╝  ██╔══██╗
███████║ ██║     ███████╗╚██████╗███████╗██║██║ ╚████║   ██║   ███████╗██║  ██║
╚══════╝ ╚═╝     ╚══════╝ ╚═════╝╚══════╝╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝

    🔍 AI-Powered Specification Analysis  •  📊 Quality Grading  •  ⚡ Task Generation
```

# SpecLinter MCP

Transform specifications into structured tasks with built-in quality gates for AI-powered development.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [MCP Integration Setup](#mcp-integration-setup)
  - [Verification & Testing](#verification--testing)
- [Project Structure](#project-structure)
- [Understanding Gherkin Scenarios](#understanding-gherkin-scenarios)
  - [What are Gherkin Scenarios?](#what-are-gherkin-scenarios)
  - [How SpecLinter Uses Gherkin](#how-speclinter-uses-gherkin)
  - [SpecLinter's Gherkin Template](#speclinters-gherkin-template)
  - [Benefits for Development](#benefits-for-development)
  - [Learn More About Gherkin](#learn-more-about-gherkin)
  - [Pro Tips](#pro-tips)
- [CLI Commands](#cli-commands)
- [Available Tools](#available-tools)
- [Quality Grading System](#quality-grading-system)
  - [Grade Scale](#grade-scale)
  - [Quality Criteria](#quality-criteria)
  - [Improvement Suggestions](#improvement-suggestions)
- [AI-Powered Implementation Validation](#ai-powered-implementation-validation)
  - [How It Works](#how-it-works)
  - [Key Benefits](#key-benefits)
  - [Validation Results Include](#validation-results-include)
- [Workflow Scenarios](#workflow-scenarios)
  - [New Project Setup](#new-project-setup)
  - [Legacy Codebase Integration](#legacy-codebase-integration)
  - [Complete Feature Development Lifecycle](#complete-feature-development-lifecycle)
  - [Team Collaboration](#team-collaboration)
  - [Quality Improvement Journey](#quality-improvement-journey)
  - [Advanced Similarity Detection](#advanced-similarity-detection)
- [Development](#development)
- [Architecture](#architecture)
- [License](#license)

## Features

- **🤖 AI-Leveraged Analysis**: Semantic understanding of specifications vs. regex patterns
- **📊 Quality Grading**: A+ to F grading with actionable improvement suggestions
- **🔧 Task Generation**: Break down specs into implementable tasks with dependencies
- **🧪 Scenario Generation**: Generate Gherkin scenarios for behavior specification
- **🎨 Project Context**: Auto-detect tech stack and patterns for better task generation
- **🔍 Similarity Detection**: AI-powered semantic analysis with database-backed feature comparison
- **🛡️ Type Safety**: Full TypeScript with Zod validation

## Quick Start

### Prerequisites
- **Node.js** 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm) on macOS/Linux or [nvm-windows](https://github.com/coreybutler/nvm-windows) on Windows)
- **Package Manager**: pnpm (recommended), npm, or yarn

### Installation

```bash
# Install pnpm if you haven't already (recommended)
npm install -g pnpm

# Install dependencies and build
pnpm install && pnpm build

# Alternative: use npm or yarn
# npm install && npm run build
# yarn install && yarn build
```

### MCP Integration Setup

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

### Verification & Testing

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

## Project Structure

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

## Understanding Gherkin Scenarios

SpecLinter automatically generates **Gherkin scenarios** for each task to provide clear, testable acceptance criteria. These scenarios serve as both documentation and validation guidelines for your feature implementation.

### What are Gherkin Scenarios?

Gherkin is a business-readable, domain-specific language that describes software behavior without detailing how that behavior is implemented. It uses a simple syntax with keywords like `Given`, `When`, `Then`, and `And` to structure test scenarios.

**Example Gherkin scenario:**
```gherkin
Feature: User Authentication

  Scenario: Successful login with valid credentials
    Given a user exists with email "user@example.com" and password "password123"
    When the user submits the login form with correct credentials
    Then the user should be redirected to the dashboard
    And a session token should be created
    And the user's last login time should be updated

  Scenario: Failed login with invalid credentials
    Given a user exists with email "user@example.com"
    When the user submits the login form with incorrect password
    Then an error message "Invalid credentials" should be displayed
    And the user should remain on the login page
    And no session token should be created
```

### How SpecLinter Uses Gherkin

When you parse a specification, SpecLinter:

1. **🤖 Analyzes each task** and generates appropriate Gherkin scenarios
2. **📁 Creates `.feature` files** in the `gherkin/` directory for each task
3. **🎯 Provides validation criteria** that AI can use to assess implementation quality
4. **📋 Documents expected behavior** in a standardized, readable format

### SpecLinter's Gherkin Template

Each task gets a basic Gherkin template that you can expand:

```gherkin
Feature: [Task Title]

  Scenario: [Task Title] - Happy Path
    Given the system is ready
    When [Task Summary/Action]
    Then the acceptance criteria are met

  Scenario: [Task Title] - Error Handling
    Given the system is ready
    When an error occurs
    Then it should be handled gracefully
```

### Benefits for Development

**For Developers:**
- **📖 Clear Requirements**: Understand exactly what behavior is expected
- **🧪 Test Guidance**: Use scenarios as a blueprint for writing actual tests
- **🔍 Validation Criteria**: Know what SpecLinter's AI will check during implementation validation

**For Teams:**
- **🤝 Shared Understanding**: Business stakeholders and developers speak the same language
- **📋 Documentation**: Self-documenting features with executable specifications
- **🎯 Acceptance Criteria**: Clear definition of "done" for each task

**For AI Validation:**
- **🤖 Intelligent Assessment**: AI uses Gherkin scenarios to evaluate implementation completeness
- **📊 Quality Scoring**: Scenarios provide structured criteria for quality assessment
- **🔄 Iterative Improvement**: AI can suggest improvements based on scenario coverage

### Learn More About Gherkin

- **📖 Official Gherkin Documentation**: [cucumber.io/docs/gherkin](https://cucumber.io/docs/gherkin/)
- **🎓 Gherkin Reference**: [cucumber.io/docs/gherkin/reference](https://cucumber.io/docs/gherkin/reference/)
- **💡 Best Practices**: [cucumber.io/docs/bdd/better-gherkin](https://cucumber.io/docs/bdd/better-gherkin/)
- **🧪 Cucumber Testing Framework**: [cucumber.io](https://cucumber.io/)

### Pro Tips

- **🎯 Expand the templates**: Customize generated scenarios with specific business logic
- **🧪 Write actual tests**: Use Gherkin scenarios as blueprints for unit/integration tests
- **🔄 Iterate and refine**: Update scenarios as requirements evolve
- **👥 Collaborate**: Share scenarios with stakeholders for requirement validation

> **🚀 Next Level**: While SpecLinter generates basic Gherkin scenarios for validation, you can expand them into full BDD (Behavior-Driven Development) test suites using frameworks like Cucumber, Jest-Cucumber, or SpecFlow.

## CLI Commands

SpecLinter is primarily designed for MCP integration, but includes these CLI commands:

```bash
node dist/cli.js serve               # Start MCP server
node dist/cli.js validate <feature> # Validate feature implementation (requires AI)
node dist/cli.js status <feature>   # Show feature status
```

> **💡 Note**: Project initialization uses the MCP `speclinter_init_project` tool.

## Available Tools

SpecLinter provides these AI-powered tools through your IDE. Simply ask your AI assistant to use them:

### Project Setup
**Initialize SpecLinter** - Sets up SpecLinter in your project with smart defaults
```
"Initialize SpecLinter in my project"
"Set up SpecLinter for this codebase"
```

### Codebase Analysis
**Analyze Codebase** - Understands your project's patterns, tech stack, and architecture
```
"Analyze my codebase to understand the patterns and tech stack"
"Generate project context documentation from my code"
```

### Specification Parsing
**Parse Specifications** - Transforms requirements into structured, actionable tasks
```
"Parse this spec: Create a user authentication system with email verification"
"Break down this feature: [your specification here]"
"Convert this requirement into SpecLinter tasks: [specification]"
```

### Similarity Detection
**Find Similar Features** - Prevents duplicate work by identifying existing functionality
```
"Check if this feature already exists: [specification]"
"Find similar functionality to: user profile management"
"Are there any existing features like: [description]"
```

### Task Management
**Check Task Status** - Shows progress and completion status of your features
```
"Show me the status of my authentication-system tasks"
"What's the progress on the user-dashboard feature?"
"Display task completion for [feature-name]"
```

**Update Task Status** - Marks tasks as completed, in-progress, or blocked
```
"Mark the database setup task as completed"
"Update task [task-id] to in-progress"
"Set the API integration task to blocked"
```

### Implementation Validation
**Validate Implementation** - AI-powered assessment of your code against specifications
```
"Validate the implementation of my authentication feature"
"Check if my user-dashboard code meets the requirements"
"Analyze the quality of my [feature-name] implementation"
```

> **💡 Pro Tip**: Just describe what you want in natural language - the AI will automatically choose and configure the right tools for you!



## Quality Grading System

SpecLinter analyzes specifications and assigns quality grades:

### Grade Scale
- **🏆 A+ (95-100)**: Exceptional specification with comprehensive details
- **⭐ A (90-94)**: Excellent specification with clear requirements
- **✅ B (80-89)**: Good specification with minor improvements needed
- **⚠️ C (70-79)**: Adequate specification with several areas for improvement
- **❌ D (60-69)**: Poor specification requiring significant enhancement
- **🚫 F (0-59)**: Failing specification with major issues

### Quality Criteria
- **✅ Acceptance Criteria**: Clear, measurable success conditions
- **⚠️ Error Handling**: Specified failure scenarios and edge cases
- **🎯 Specificity**: Concrete requirements vs. vague terms
- **📋 Completeness**: Sufficient detail for implementation
- **👤 User Stories**: Proper format and context (optional)

### Improvement Suggestions
SpecLinter provides actionable feedback:
- 📊 Replace vague terms with specific metrics
- ✅ Add missing acceptance criteria
- ⚠️ Include error handling scenarios
- 📝 Structure as user stories when appropriate
- 📖 Expand brief specifications with implementation details

## AI-Powered Implementation Validation

SpecLinter's revolutionary validation system uses AI to intelligently assess your feature implementations against specifications and project patterns.

### How It Works

1. **🔍 Codebase Scanning**: Automatically finds implementation files related to your feature
2. **🧠 AI Analysis**: Semantic understanding of what your code actually does vs. what was specified
3. **📊 Quality Assessment**: Evaluates code quality, pattern compliance, and completeness
4. **✅ Acceptance Validation**: Checks each acceptance criteria against actual implementation
5. **🏗️ Architectural Review**: Ensures consistency with project patterns and standards
6. **🔒 Security & Performance**: Identifies potential security and performance issues
7. **📈 Actionable Insights**: Provides prioritized recommendations for improvement

### Key Benefits

- **Semantic Understanding**: AI knows the difference between a login form and a search form
- **Pattern Awareness**: Validates against your project's specific coding patterns
- **Quality Scoring**: Objective assessment of implementation quality (0-100)
- **Auto-Status Updates**: Automatically updates task statuses based on actual implementation
- **Intelligent Recommendations**: Specific, actionable next steps for feature completion
- **Comprehensive Coverage**: Analyzes architecture, security, performance, and testing

### Validation Results Include

- **Task-by-Task Analysis**: Implementation status and quality score for each task
- **Code Quality Issues**: Identified problems with severity levels and fix suggestions
- **Pattern Compliance**: How well your code follows project conventions
- **Security Assessment**: Potential vulnerabilities and security recommendations
- **Performance Review**: Performance considerations and optimization suggestions
- **Test Coverage**: Analysis of existing tests and recommendations for improvement
- **Next Steps**: Prioritized action items for feature completion

> **🚀 Revolutionary Approach**: Unlike traditional testing tools that only check syntax, SpecLinter's AI validation understands intent, context, and quality - providing insights no other tool can match.

## Workflow Scenarios

Real-world user journeys demonstrating SpecLinter's power in different development contexts.

### New Project Setup
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

### Legacy Codebase Integration
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

### Complete Feature Development Lifecycle
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

### Team Collaboration
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

### Quality Improvement Journey
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

### Advanced Similarity Detection
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

## Development

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

## Architecture

- **🔒 Type Safety**: Full TypeScript with Zod validation
- **🤖 AI-Leveraged**: Two-step pattern for semantic analysis
- **💾 Database**: SQLite for task management, feature history, and AI analysis input
- **🔌 MCP Integration**: Full Model Context Protocol support

## License

MIT
