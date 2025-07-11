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

> **🚀 Turn vague specs into structured tasks with AI-powered quality gates**

Transform natural language specifications into actionable development tasks with built-in quality assessment, similarity detection, and implementation validation.

## ✨ What Makes SpecLinter Special

| Feature | Traditional Tools | SpecLinter |
|---------|------------------|------------|
| **Spec Analysis** | Manual review | 🤖 AI-powered quality grading (A+ to F) |
| **Task Breakdown** | Manual decomposition | ⚡ Auto-generated structured tasks |
| **Duplicate Detection** | Manual checking | 🔍 Semantic similarity analysis |
| **Implementation Check** | Code review | 🧠 AI validates against original spec |
| **Test Scenarios** | Write from scratch | 🧪 Auto-generated Gherkin scenarios |

## 🎯 Quick Start (5 Minutes)

### 1. Install & Build
```bash
pnpm install && pnpm build
```

### 2. Connect to Your AI IDE
Add to your MCP configuration:
```json
{
  "mcpServers": {
    "speclinter": {
      "command": "node",
      "args": ["/path/to/speclinter-mcp/dist/cli.js", "serve"]
    }
  }
}
```

### 3. Try It Out
Ask your AI: `"Initialize SpecLinter and parse this spec: Create a user login form with email validation"`

## 📋 Table of Contents

- [Core Workflows](#core-workflows) • [Setup Guide](#setup-guide) • [Quality System](#quality-system) • [Advanced Features](#advanced-features)

## 🎯 Core Workflows

### Scenario: Developer Gets Quality Feedback on Vague Spec
```gherkin
Given I have a vague specification: "Add social features"
When I ask SpecLinter to parse it
Then I get grade F with specific improvement suggestions
And actionable feedback like "Define specific social features"
And a template showing how to improve to grade A
```

### Scenario: Developer Generates Structured Tasks
```gherkin
Given I have a detailed spec: "Create user authentication with email verification, password reset, and 2FA"
When SpecLinter analyzes it
Then I get grade A with 8-12 structured tasks
And each task has acceptance criteria and Gherkin scenarios
And tasks are saved in organized directories
```

### Scenario: Developer Validates Implementation
```gherkin
Given I've implemented my authentication feature
When I ask SpecLinter to validate it
Then AI scans my codebase for related files
And compares implementation against original spec
And provides quality score with specific recommendations
```

### Scenario: Team Avoids Duplicate Work
```gherkin
Given my teammate built user profile management
When I try to add "user settings page"
Then SpecLinter detects 85% similarity
And recommends extending existing feature
And prevents duplicate implementation
```

## 🚀 Setup Guide

### Prerequisites
- **Node.js 18+** • **pnpm** (recommended)

### Installation
```bash
pnpm install && pnpm build
```

### MCP Integration

| AI IDE | Configuration File | Location |
|--------|-------------------|----------|
| **Cursor** | `mcp_servers.json` | `~/.cursor/` |
| **Claude Desktop** | `claude_desktop_config.json` | `~/Library/Application Support/Claude/` (macOS)<br>`%APPDATA%\Claude\` (Windows) |
| **Windsurf** | Check Windsurf docs | Varies |

**Add this configuration:**
```json
{
  "mcpServers": {
    "speclinter": {
      "command": "node",
      "args": ["/absolute/path/to/speclinter-mcp/dist/cli.js", "serve"]
    }
  }
}
```

### ✅ Verify Setup
```bash
# Test server starts
node dist/cli.js serve

# In your AI IDE, try:
"Initialize SpecLinter in my project"
"Parse this spec: Create a user login form"
```

## 📊 Quality System

SpecLinter grades your specifications and provides actionable feedback:

| Grade | Score | What It Means | Example Issues |
|-------|-------|---------------|----------------|
| 🏆 **A+** | 95-100 | Exceptional spec | None - ready to implement |
| ⭐ **A** | 90-94 | Excellent spec | Minor clarity improvements |
| ✅ **B** | 80-89 | Good spec | Missing some acceptance criteria |
| ⚠️ **C** | 70-79 | Needs work | Vague terms, brief description |
| ❌ **D** | 60-69 | Poor spec | Major gaps in requirements |
| 🚫 **F** | 0-59 | Failing spec | Too vague to implement |

### Quality Criteria Checklist
- ✅ **Clear acceptance criteria** - What defines "done"?
- ✅ **Specific requirements** - Avoid vague terms like "user-friendly"
- ✅ **Error handling** - What happens when things go wrong?
- ✅ **Sufficient detail** - Enough info for implementation
- ✅ **User story format** - "As a... I want... So that..." (optional)

### Example: F → A Transformation

**❌ Grade F Spec:**
```
"Add social features to the app"
```

**✅ Grade A Spec:**
```
As a user, I want to send direct messages to other users so that I can communicate privately.

Acceptance Criteria:
- Users can search for other users by username
- Messages are delivered in real-time using WebSocket
- Message history is preserved and searchable
- Users can block/unblock other users
- All messages are encrypted end-to-end

Error Handling:
- Show "User not found" for invalid usernames
- Display "Message failed to send" with retry option
- Handle offline users with message queuing
```

## 🔧 Advanced Features

### 🧪 Auto-Generated Gherkin Scenarios
Every task gets testable scenarios:
```gherkin
Feature: User Authentication

Scenario: Successful login
  Given a user exists with valid credentials
  When they submit the login form
  Then they should be redirected to dashboard
  And a session token should be created
```

### 🔍 Semantic Similarity Detection
Prevents duplicate work by finding similar features:
```
Input: "user profile management"
Found: "user settings page" (85% similarity)
Recommendation: Extend existing feature
```

### 🤖 AI Implementation Validation
Validates your code against original specifications:
- **Scans codebase** for implementation files
- **Semantic analysis** of what code actually does
- **Quality scoring** with specific recommendations
- **Auto-updates** task statuses based on findings

### 📁 Project Structure
```
your-project/
├── .speclinter/
│   ├── config.json         # Settings
│   ├── cache/              # Analysis cache
│   └── context/            # AI-generated project docs
└── speclinter-tasks/
    └── [feature-name]/
        ├── _active.md      # Status dashboard
        ├── task_*.md       # Individual tasks
        └── gherkin/        # Test scenarios
```

## 💬 How to Use SpecLinter

Just talk to your AI assistant naturally! Here are the most common commands:

### 🚀 Getting Started
```
"Initialize SpecLinter in my project"
"Analyze my codebase to understand patterns"
```

### 📝 Working with Specs
```
"Parse this spec: Create a user authentication system with email verification"
"Grade this specification: [your spec here]"
"Find similar features to: user profile management"
```

### 📊 Managing Tasks
```
"Show me the status of my authentication tasks"
"Mark the database setup task as completed"
"Validate the implementation of my login feature"
```

> **💡 Pro Tip**: SpecLinter works through your AI IDE - no CLI commands needed for daily use!



## 🏗️ Real-World Examples

### Example 1: E-commerce Product Catalog
**Input Spec:**
```
Create a product catalog page with filtering and search
```

**SpecLinter Output:**
- **Grade:** C (needs more detail)
- **Generated Tasks:** 6 structured tasks
- **Improvements:** Add specific filter types, search behavior, pagination

### Example 2: User Authentication System
**Input Spec:**
```
As a user, I want to log in with email and password so I can access my account.

Acceptance Criteria:
- Email validation with proper error messages
- Password must be 8+ characters
- Failed attempts are rate-limited (3 attempts/5 minutes)
- Successful login redirects to dashboard
- Remember me option for 30 days
```

**SpecLinter Output:**
- **Grade:** A (excellent specification)
- **Generated Tasks:** 12 detailed tasks including security, validation, and UX
- **Gherkin Scenarios:** Auto-generated for each task

## 🤝 Team Collaboration

### Preventing Duplicate Work
```gherkin
Scenario: Team coordination
  Given developer A built "user profile management"
  When developer B wants to add "user settings page"
  Then SpecLinter detects 85% similarity
  And recommends extending existing feature
  And prevents duplicate implementation
```

### Cross-Project Similarity
SpecLinter can detect similar features across multiple repositories and microservices, helping large teams avoid redundant work.

## 🔧 Development & Contributing

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
- **💾 Database**: SQLite for task management and feature history
- **🔌 MCP Integration**: Full Model Context Protocol support

## 📄 License

MIT