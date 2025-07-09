# System Architecture

## Architecture Overview
This project implements a **MCP Server** architecture with modular organization. The system is built using TypeScript technologies with a focus on type safety, maintainability, and AI integration scalability.

## Technology Stack

### Core Infrastructure
- **Language**: TypeScript with strict type checking and modern ES features
- **Runtime**: Node.js 18+ for optimal performance and modern JavaScript support
- **Architecture**: MCP (Model Context Protocol) server for AI IDE integration
- **Database**: SQLite with better-sqlite3 for high-performance local storage
- **Validation**: Zod schemas for runtime type safety and AI data validation
- **Testing**: Vitest for fast, modern testing with TypeScript support
- **Build**: TypeScript compiler with ES modules for modern JavaScript output

### Architecture Patterns
- **MCP Server Pattern**: Standardized AI tool protocol implementation
- **Prepare/Process Pattern**: Two-step AI analysis workflow for complex operations
- **Directory-Based Storage**: Human-readable, version-controllable task persistence
- **Schema-First Design**: Zod validation for all external data interfaces

## System Design

### Project Organization
- **Source Directory**: `src` - Main application code with clear module separation
- **Test Directory**: `test` - Comprehensive test suites with integration testing
- **Entry Points**: dist/cli.js (CLI), dist/server.js (MCP server)
- **Configuration**: package.json, tsconfig.json, .eslintrc for development tooling

### Core Modules

#### Storage Layer (`src/core/`)
- **storage.ts**: SQLite database operations with transaction support
- **storage-manager.ts**: File system operations and project initialization
- **codebase-analyzer.ts**: Project structure analysis and tech stack detection

#### AI Integration (`src/ai-*.ts`)
- **ai-server-tools.ts**: MCP tool registration and AI workflow orchestration
- **ai-tools.ts**: Core AI analysis functions and prompt generation

#### Type System (`src/types/`)
- **config.ts**: Configuration schemas and defaults
- **ai-schemas.ts**: AI analysis input/output validation
- **index.ts**: Core domain types and validation schemas

### Data Flow Architecture

```
AI IDE (Cursor/Claude) 
    ↓ MCP Protocol (stdio)
MCP Server (ai-server-tools.ts)
    ↓ Tool Registration
AI Analysis Functions (ai-tools.ts)
    ↓ Data Processing
Storage Layer (storage.ts)
    ↓ Persistence
SQLite Database + File System
```

### MCP Integration Architecture

#### Tool Registration Pattern
```typescript
server.registerTool(
  'tool_name',
  { title, description, inputSchema },
  async (args) => {
    // Validation
    const validated = schema.parse(args);
    
    // Processing
    const result = await processOperation(validated);
    
    // Response
    return { success: true, data: result };
  }
);
```

#### Prepare/Process Workflow
1. **Prepare Phase**: Generate AI analysis prompts with project context
2. **AI Analysis**: External AI processes the prompt and returns structured data
3. **Process Phase**: Validate and persist AI analysis results
4. **Response**: Return structured results to AI IDE

### Database Architecture

#### Schema Design
```sql
-- Features table for high-level feature tracking
CREATE TABLE features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table for detailed task management
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id INTEGER REFERENCES features(id),
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'not_started',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Similarity analysis for duplicate detection
CREATE TABLE feature_similarities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature1_id INTEGER REFERENCES features(id),
  feature2_id INTEGER REFERENCES features(id),
  similarity_score REAL NOT NULL,
  analysis_data TEXT, -- JSON blob
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Performance Optimizations
- **WAL Mode**: Write-Ahead Logging for better concurrent access
- **Foreign Keys**: Referential integrity enforcement
- **Indexes**: Optimized queries for similarity analysis and status tracking

### File System Architecture

#### Directory Structure
```
.speclinter/
├── config.json              # Project configuration
├── speclinter.db            # SQLite database
├── cache/                   # Analysis cache (gitignored)
└── context/                 # AI context files
    ├── project.md           # Project overview and domain knowledge
    ├── patterns.md          # Code patterns and best practices
    └── architecture.md      # System design documentation

speclinter-tasks/
└── [feature-name]/
    ├── _active.md           # Live status dashboard
    ├── task_01_*.md         # Individual task files
    ├── meta.json            # Feature metadata
    └── gherkin/             # Behavior-driven test scenarios
        └── *.feature
```

#### Storage Strategy
- **Database**: Relational data, similarity analysis, status tracking
- **File System**: Human-readable content, version control integration
- **Cache**: Temporary analysis results, performance optimization

## Integration Points

### AI IDE Integration
- **Protocol**: MCP (Model Context Protocol) over stdio transport
- **Tools**: Registered MCP tools for specification analysis and task management
- **Context**: Dynamic project context injection for AI assistance
- **Validation**: Zod schemas ensure AI response compatibility

### Version Control Integration
- **Git-Friendly**: Human-readable task files for collaborative editing
- **Gitignore**: Cache and database files excluded from version control
- **Branching**: Task directories support feature branch workflows
- **Merging**: Conflict resolution through file-based task storage

### Development Tool Integration
- **CLI**: Standalone command-line interface for non-MCP usage
- **TypeScript**: Full IDE support with type checking and IntelliSense
- **Testing**: Vitest integration with watch mode and coverage reporting
- **Linting**: ESLint integration for code quality enforcement

## Security Considerations

### Data Privacy
- **Local Storage**: All data stored locally, no external service dependencies
- **No Telemetry**: No usage tracking or data collection
- **Secure Defaults**: Conservative configuration defaults

### Input Validation
- **Zod Schemas**: Runtime validation of all external inputs
- **SQL Injection**: Parameterized queries with better-sqlite3
- **File System**: Path validation and sanitization

### Access Control
- **Local Only**: No network access or remote API calls
- **File Permissions**: Appropriate file system permissions
- **Process Isolation**: MCP server runs in isolated process

## Performance Considerations

### Database Performance
- **SQLite Optimizations**: WAL mode, foreign keys, appropriate indexes
- **Connection Pooling**: Single connection with transaction batching
- **Query Optimization**: Efficient similarity analysis queries

### Memory Management
- **Streaming**: Large file processing with streaming APIs
- **Caching**: Intelligent caching of analysis results
- **Garbage Collection**: Proper cleanup of temporary resources

### Scalability Limits
- **Single User**: Current architecture optimized for individual developers
- **File System**: Limited by file system performance and capacity
- **SQLite**: Single-writer limitation for concurrent access

## Deployment Architecture

### Development Environment
```bash
# Local development with watch mode
pnpm dev          # TypeScript compilation + watch
pnpm test         # Vitest test runner
pnpm lint         # ESLint code quality
```

### Production Build
```bash
# Optimized production build
pnpm build        # TypeScript compilation
chmod +x dist/cli.js  # CLI executable permissions
```

### MCP Server Deployment
```json
{
  "mcpServers": {
    "speclinter": {
      "command": "node",
      "args": ["/path/to/speclinter-mcp/dist/cli.js", "serve"],
      "env": {}
    }
  }
}
```

## Future Architecture Considerations

### Multi-User Support
- **Database Migration**: PostgreSQL or MySQL for concurrent access
- **Authentication**: User management and access control
- **Collaboration**: Real-time task synchronization

### Distributed Analysis
- **Microservices**: Separate analysis services for large codebases
- **Message Queues**: Asynchronous processing for complex analysis
- **Caching Layer**: Redis for distributed caching

### Plugin Architecture
- **Extension Points**: Pluggable analysis modules
- **Custom Patterns**: User-defined code pattern detection
- **Integration APIs**: Third-party tool integration

### Cloud Integration
- **Remote Storage**: Cloud-based task and analysis storage
- **AI Services**: Integration with cloud AI providers
- **Backup/Sync**: Automatic backup and synchronization

## Monitoring and Observability

### Logging Strategy
- **Structured Logging**: JSON-formatted logs for analysis
- **Log Levels**: Appropriate verbosity for different environments
- **Error Tracking**: Comprehensive error capture and reporting

### Performance Monitoring
- **Database Metrics**: Query performance and optimization
- **Memory Usage**: Resource consumption tracking
- **Response Times**: MCP tool performance measurement

### Health Checks
- **Database Connectivity**: SQLite database health verification
- **File System**: Storage availability and permissions
- **MCP Protocol**: Communication channel health
