# 🎯 SpecLinter MCP

Transform specifications into structured tasks with built-in quality gates for AI-powered development.

## ✨ Features

- **📊 Quality Grading**: Analyze specs with actionable feedback using configurable rules
- **🔧 Task Generation**: Break down specs into implementable tasks with dependencies
- **🧪 Test Creation**: Generate Gherkin scenarios automatically
- **🎨 Project Context**: Use your stack and patterns for better task generation
- **🤖 MCP Integration**: Works seamlessly in AI IDEs like Cursor and Windsurf
- **🛡️ Type Safety**: Full TypeScript implementation with Zod validation
- **🏗️ Modern Architecture**: Clean separation of concerns with better-sqlite3

## 🚀 Quick Start

### 📋 Prerequisites
- **Node.js** 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm) on macOS/Linux or [nvm-windows](https://github.com/coreybutler/nvm-windows) on Windows)
- **Package Manager**: pnpm (recommended), npm, or yarn

### 📦 Installation

#### Using pnpm (⭐ recommended)
```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install dependencies
pnpm install

# Build the project
pnpm build
```

#### Using npm
```bash
# Install dependencies
npm install

# Build the project
npm run build
```

#### Using yarn
```bash
# Install dependencies
yarn install

# Build the project
yarn build
```

### 🔌 MCP Integration Setup

> **💡 Key Point**: SpecLinter works as an MCP (Model Context Protocol) server. Configure your AI IDE to use it:

#### For Cursor IDE
Add to your MCP configuration file (usually `~/.cursor/mcp_servers.json`):

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

#### For Windsurf IDE
Add to your MCP configuration:

```json
{
  "speclinter": {
    "command": "node",
    "args": ["/absolute/path/to/speclinter-mcp/dist/cli.js", "serve"],
    "cwd": "/absolute/path/to/speclinter-mcp"
  }
}
```

#### For Claude Desktop
Add to your `claude_desktop_config.json`:

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

> **⚠️ Important**: Replace `/absolute/path/to/speclinter-mcp` with the actual absolute path to your SpecLinter installation.

### 💻 Platform-Specific Setup

#### 🍎 macOS/Linux
```bash
# Make CLI executable (if needed)
chmod +x dist/cli.js
```

#### 🪟 Windows
✅ No additional setup required - the MCP server will work out of the box.

### ✅ Verification & Testing

#### 🧪 Test the Installation
```bash
# 1. Verify Node.js version
node --version  # Should be 18+

# 2. Test the server starts
node dist/cli.js serve
# Should start without errors (Ctrl+C to stop)

# 3. Check MCP tools are available
# In your AI IDE, ask: "What SpecLinter tools are available?"
```

#### 🎯 Verify MCP Integration
Once your AI IDE is configured:

1. **🤖 Ask your AI**: "Initialize SpecLinter in my project"
2. **🔧 Or use the tool directly**: Call `init_project_speclinter`
3. **📁 Check for success**: Look for `.speclinter/` directory creation
4. **📝 Test parsing**: Ask to parse a simple specification

#### 🌟 Example First Use
```
# In your AI IDE chat:
"Please initialize SpecLinter in my current project, then parse this spec:
'Create a user login form with email validation and password strength checking'"
```

> **💡 Pro Tip**: No need to specify paths - SpecLinter automatically detects your project structure!

### 🎉 Getting Started
Once configured and verified, use your AI IDE to work with specifications:

```
# 🚀 Initialize in your project
"Initialize SpecLinter in my project"

# 📝 Parse specifications
"Parse this spec: [your specification here]"

# 📊 Check task status
"Show me the status of my tasks"

# 🧪 Run tests
"Run tests for my feature"
```

> **🎯 That's it!** SpecLinter handles all the complexity behind the scenes.

## 📁 Project Structure

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

## 💻 Direct CLI Usage

> **ℹ️ Note**: SpecLinter is primarily designed to work through MCP integration with AI IDEs, but you can also run commands directly:

```bash
node dist/cli.js serve             # 🚀 Start MCP server
node dist/cli.js test <feature>    # 🧪 Run feature tests
node dist/cli.js status <feature>  # 📊 Show feature status
```

> **💡 Important**: Project initialization is handled through the MCP `init_project` tool, not CLI.

## 🛠️ Available MCP Tools

When using SpecLinter through AI IDEs or the MCP protocol, these tools are available:

### 🚀 `init_project`
Initialize SpecLinter in your project with default configuration and templates.

**Parameters:**
- `force_reinit` (boolean, optional, default: false) - Force reinitialization if already initialized

**Returns:**
- ✅ Success status and message
- 📁 List of directories created
- 📋 Next steps for configuration

> **🎯 Auto-Magic**: Automatically detects your project root directory - no manual configuration needed!

### 📝 `parse_spec`
Parse a specification and generate structured tasks with quality grading.

**Parameters:**
- `spec` (string, required) - The specification text to parse
- `feature_name` (string, required) - Name for the feature (used for directory)
- `context` (string, optional) - Additional context about the implementation

**Returns:**
- 📊 Quality grade (A+ to F) and score
- 🔧 Generated tasks with acceptance criteria
- 📄 Files created (task files, Gherkin scenarios)
- 💡 Improvement suggestions
- 🔍 Similar existing features

**Example:**
```json
{
  "spec": "Create a user authentication system with login, logout, and password reset functionality. Users should receive confirmation emails after successful registration.",
  "feature_name": "user-auth",
  "context": "React web application with Node.js backend"
}
```

### 📊 `get_task_status`
Get the current status and progress of a feature's tasks.

**Parameters:**
- `feature_name` (string, required) - Name of the feature to check

**Returns:**
- 📈 Total, completed, in-progress, and blocked task counts
- 📊 Overall progress percentage
- 🕒 Last updated timestamp

### 🔍 `find_similar`
Find existing features similar to a given specification to avoid duplicate work.

**Parameters:**
- `spec` (string, required) - Specification to find similarities for
- `threshold` (number, optional, default: 0.8) - Similarity threshold (0.0 to 1.0)

**Returns:**
- 📋 List of similar features with similarity scores
- 📊 Feature summaries and task counts
- ⚡ Status of similar features

### ✏️ `update_task_status`
Update the status of a specific task and regenerate active files.

**Parameters:**
- `feature_name` (string, required) - Name of the feature
- `task_id` (string, required) - ID of the task to update
- `status` (string, required) - New status: `not_started`, `in_progress`, `completed`, `blocked`
- `notes` (string, optional) - Optional notes about the status change

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

## Testing SpecLinter Locally

### Quick Test
```bash
# Build the project
pnpm build

# Test using MCP tools (through your AI IDE)
# 1. Initialize SpecLinter:
#    Ask your AI: "Initialize SpecLinter in my project"
#
# 2. Parse a specification:
#    Ask your AI: "Parse this spec: Create a user registration system with email validation"
#    Or call parse_spec_speclinter with:
#    {
#      "spec": "Create a user registration system with email validation.",
#      "feature_name": "user-registration",
#      "context": "Web application"
#    }
#
# 3. Check the generated files in tasks/user-registration/
```

### MCP Server Testing
```bash
# Start the MCP server
node dist/cli.js serve

# In another terminal, send a test message
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}' | node dist/cli.js serve
```

### Complete MCP Configuration Examples

#### Cursor IDE Configuration
Create or edit `~/.cursor/mcp_servers.json`:

```json
{
  "mcpServers": {
    "speclinter": {
      "command": "node",
      "args": ["/Users/yourname/projects/speclinter-mcp/dist/cli.js", "serve"],
      "cwd": "/Users/yourname/projects/speclinter-mcp",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### Windsurf IDE Configuration
Add to your Windsurf MCP settings:

```json
{
  "mcpServers": {
    "speclinter": {
      "command": "node",
      "args": ["/Users/yourname/projects/speclinter-mcp/dist/cli.js", "serve"],
      "cwd": "/Users/yourname/projects/speclinter-mcp"
    }
  }
}
```

#### Claude Desktop Configuration
Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "speclinter": {
      "command": "node",
      "args": ["/Users/yourname/projects/speclinter-mcp/dist/cli.js", "serve"],
      "cwd": "/Users/yourname/projects/speclinter-mcp"
    }
  }
}
```

#### Generic MCP Client Configuration
For any MCP-compatible client:

```json
{
  "servers": {
    "speclinter": {
      "command": "node",
      "args": ["/absolute/path/to/speclinter-mcp/dist/cli.js", "serve"],
      "cwd": "/absolute/path/to/speclinter-mcp",
      "description": "SpecLinter MCP Server - Transform specifications into structured tasks"
    }
  }
}
```

#### Docker Configuration (Optional)
For containerized environments:

```json
{
  "mcpServers": {
    "speclinter": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-v", "/path/to/your/projects:/workspace",
        "speclinter-mcp:latest"
      ],
      "cwd": "/workspace"
    }
  }
}
```

**Path Configuration Tips:**
- **Windows**: Use forward slashes or escaped backslashes in JSON: `"C:/Users/yourname/projects/speclinter-mcp/dist/cli.js"`
- **macOS/Linux**: Use absolute paths: `/Users/yourname/projects/speclinter-mcp/dist/cli.js`
- **Environment variables**: Some clients support `${HOME}` or `%USERPROFILE%` expansion

## Troubleshooting

### Common Issues

#### "Command not found" or "Module not found"
- **Ensure Node.js 18+ is installed**: `node --version`
- **Verify the build completed**: Check that `dist/` directory exists
- **Use absolute paths**: Relative paths in MCP configs often fail
- **Check permissions**: On Unix systems, ensure `dist/cli.js` is executable

#### Windows-Specific Issues
```powershell
# If you get permission errors
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Use forward slashes in JSON configs
"C:/Users/yourname/projects/speclinter-mcp/dist/cli.js"

# Or escape backslashes
"C:\\Users\\yourname\\projects\\speclinter-mcp\\dist\\cli.js"
```

#### macOS/Linux-Specific Issues
```bash
# Make CLI executable
chmod +x dist/cli.js

# If you get "command not found"
which node  # Should return a path
npm list -g  # Check global packages
```

#### MCP Connection Issues
1. **Verify the server starts**: `node dist/cli.js serve`
2. **Check the path**: Ensure absolute paths in MCP config
3. **Restart your AI IDE**: After changing MCP configuration
4. **Check logs**: Most AI IDEs have MCP server logs

#### Database/Permission Issues
```bash
# If .speclinter directory creation fails
mkdir -p .speclinter
chmod 755 .speclinter

# If SQLite issues occur
rm -rf .speclinter/speclinter.db
# Then reinitialize
```

### Getting Help
- **Check the logs**: Most AI IDEs show MCP server output
- **Test manually**: Run `node dist/cli.js serve` to test the server
- **Verify paths**: Use absolute paths and check they exist
- **Platform differences**: Windows uses different path separators

## Development

### Local Development Setup

```bash
# Clone and setup
git clone <repository-url>
cd speclinter-mcp

# Install dependencies (choose one)
pnpm install    # Recommended
npm install     # Alternative
yarn install    # Alternative

# Build for production
pnpm build

# Watch mode for development
pnpm build --watch

# Run tests
pnpm test

# Lint code
pnpm lint

# Start MCP server for testing
pnpm start
```

### Cross-Platform Development

#### Windows Development
```powershell
# Use PowerShell or Command Prompt
npm install -g pnpm  # If using pnpm
pnpm install
pnpm build

# Test the server
node dist/cli.js serve
```

#### macOS/Linux Development
```bash
# Install pnpm via npm or homebrew
npm install -g pnpm
# or: brew install pnpm

pnpm install
pnpm build

# Make executable
chmod +x dist/cli.js

# Test the server
./dist/cli.js serve
```

## Architecture

This implementation combines clean architecture principles with comprehensive functionality:

- **Type Safety**: Full TypeScript with Zod validation
- **Modern Patterns**: ESM modules, async/await, proper error handling
- **Database**: better-sqlite3 for optimal performance
- **CLI**: Commander.js with rich terminal UI
- **MCP Integration**: Full Model Context Protocol support
- **Testing**: Vitest with comprehensive coverage

## Ready-to-Use Configuration Templates

### Quick Copy-Paste Configurations

#### Template 1: Cursor IDE (macOS/Linux)
```json
{
  "mcpServers": {
    "speclinter": {
      "command": "node",
      "args": ["REPLACE_WITH_YOUR_PATH/speclinter-mcp/dist/cli.js", "serve"],
      "cwd": "REPLACE_WITH_YOUR_PATH/speclinter-mcp"
    }
  }
}
```

#### Template 2: Cursor IDE (Windows)
```json
{
  "mcpServers": {
    "speclinter": {
      "command": "node",
      "args": ["C:/REPLACE_WITH_YOUR_PATH/speclinter-mcp/dist/cli.js", "serve"],
      "cwd": "C:/REPLACE_WITH_YOUR_PATH/speclinter-mcp"
    }
  }
}
```

#### Template 3: Claude Desktop (macOS)
```json
{
  "mcpServers": {
    "speclinter": {
      "command": "node",
      "args": ["/Users/YOURUSERNAME/projects/speclinter-mcp/dist/cli.js", "serve"],
      "cwd": "/Users/YOURUSERNAME/projects/speclinter-mcp"
    }
  }
}
```

#### Template 4: Claude Desktop (Windows)
```json
{
  "mcpServers": {
    "speclinter": {
      "command": "node",
      "args": ["C:/Users/YOURUSERNAME/projects/speclinter-mcp/dist/cli.js", "serve"],
      "cwd": "C:/Users/YOURUSERNAME/projects/speclinter-mcp"
    }
  }
}
```

#### Template 5: Generic MCP Client
```json
{
  "servers": {
    "speclinter": {
      "command": "node",
      "args": ["ABSOLUTE_PATH_TO/speclinter-mcp/dist/cli.js", "serve"],
      "cwd": "ABSOLUTE_PATH_TO/speclinter-mcp",
      "description": "SpecLinter - Transform specs into structured tasks"
    }
  }
}
```

### Configuration Steps
1. **Choose the template** that matches your platform and AI IDE
2. **Replace the placeholder paths** with your actual installation path
3. **Copy the JSON** to your MCP configuration file
4. **Restart your AI IDE** to load the new configuration
5. **Test the integration** by asking your AI: "Initialize SpecLinter in my project"

### Finding Your Installation Path
```bash
# In your speclinter-mcp directory, run:
pwd
# Copy the output and use it in the templates above
```

## License

MIT
