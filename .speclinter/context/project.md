# SpecLinter MCP Project

## Overview
SpecLinter MCP is a Model Context Protocol server that transforms natural language specifications into structured development tasks using AI-powered analysis. It serves as an intelligent bridge between human requirements and actionable development work.

## Core Purpose
- **Problem**: Converting vague specifications into concrete, implementable tasks
- **Solution**: AI-powered semantic analysis with quality gates and validation
- **Value**: Reduces specification ambiguity and accelerates development planning

## Tech Stack
- **Language**: TypeScript with strict type checking
- **Runtime**: Node.js 18+
- **Package Manager**: pnpm (preferred over npm/yarn)
- **Testing Framework**: Vitest
- **Database**: SQLite for task persistence
- **Architecture**: Modular MCP server with AI integration
- **Validation**: Zod for runtime type safety

## Key Features
- **AI-Powered Specification Analysis**: Semantic understanding vs regex patterns
- **Quality Grading System**: A+ to F grading with improvement suggestions
- **Task Generation**: Break specs into implementable tasks with dependencies
- **Similarity Detection**: AI-powered semantic analysis to prevent duplicate work
- **Implementation Validation**: AI assessment of code against specifications
- **Gherkin Scenario Generation**: Comprehensive, actionable test scenarios
- **Codebase Analysis**: Automatic project context and pattern detection

## Development Workflow
1. **Specification Input**: Natural language requirements via MCP tools
2. **AI Analysis**: Semantic analysis with quality assessment
3. **Task Generation**: Structured breakdown with implementation guidance
4. **Quality Gates**: Ensure specification completeness before proceeding
5. **Implementation**: Development guided by generated tasks
6. **Validation**: AI-powered verification against original specifications
7. **Test Generation**: Automatic Gherkin scenario creation

## Project Structure
```
src/
├── core/           # Core business logic
├── types/          # TypeScript type definitions
├── ai-tools.ts     # AI-leveraged tool implementations
├── server.ts       # MCP server setup
└── cli.ts          # Command-line interface

.speclinter/
├── config.json     # Project configuration
├── context/        # AI-generated project context
└── speclinter.db   # SQLite task database

speclinter-tasks/   # Generated feature tasks
└── [feature-name]/
    ├── _active.md  # Live status dashboard
    ├── task_*.md   # Individual task files
    └── gherkin/    # Test scenarios
```

## Configuration
- **Quality Threshold**: 70 (configurable)
- **Task Complexity**: Standard (basic/standard/comprehensive)
- **Similarity Threshold**: 0.8 for duplicate detection
- **AI Analysis Depth**: Standard (quick/standard/comprehensive)

## Integration
Designed for AI IDE integration via Model Context Protocol:
- **Claude**: Native MCP support
- **Cursor**: MCP integration
- **Other AI IDEs**: Standard MCP protocol compatibility