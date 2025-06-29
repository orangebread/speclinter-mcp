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

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

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
