# Code Patterns

## TypeScript Patterns

### Zod Schema Validation (Confidence: 95%)
Comprehensive runtime validation using Zod schemas for type safety with AI-generated data.

**Found in**: src/types/config.ts, src/types/ai-schemas.ts, src/types/index.ts

```typescript
export const ConfigSchema = z.object({
  version: z.string(),
  grading: z.object({
    strictMode: z.boolean(),
    minWordCount: z.number(),
    requireAcceptanceCriteria: z.boolean()
  })
});

export type Config = z.infer<typeof ConfigSchema>;
```

### Error Handling with Result Types (Confidence: 85%)
Structured error handling using custom error types and result patterns.

**Found in**: src/core/storage.ts, src/ai-tools.ts

```typescript
try {
  const result = await operation();
  return { success: true, data: result };
} catch (error) {
  throw new Error(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
```

### Async/Await with Proper Error Propagation (Confidence: 90%)
Consistent async/await usage with proper error handling and propagation.

**Found in**: Multiple files

```typescript
async initialize(): Promise<void> {
  try {
    await this.setupDatabase();
    await this.loadConfiguration();
  } catch (error) {
    throw new Error(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

## Database Patterns

### SQLite with better-sqlite3 (Confidence: 90%)
Local SQLite database with synchronous operations for better performance.

**Found in**: src/core/storage.ts

```typescript
import Database from 'better-sqlite3';

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
```

### Database Schema Migration (Confidence: 80%)
Version-controlled database schema with migration support.

**Found in**: src/core/storage.ts

```typescript
private initializeDatabase(): void {
  const createTables = `
    CREATE TABLE IF NOT EXISTS features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  this.db.exec(createTables);
}
```

## File System Patterns

### Directory-Based Task Storage (Confidence: 95%)
Human-readable task storage using filesystem directories for version control compatibility.

**Found in**: src/core/storage-manager.ts

```typescript
const directories = [
  '.speclinter',
  '.speclinter/context',
  '.speclinter/cache',
  'speclinter-tasks'
];

for (const dir of directories) {
  const dirPath = path.join(rootDir, dir);
  await fs.mkdir(dirPath, { recursive: true });
}
```

### Configuration File Management (Confidence: 85%)
JSON configuration files with default fallbacks and validation.

**Found in**: src/core/storage-manager.ts

```typescript
const configPath = path.join(speclinterDir, 'config.json');
try {
  await fs.access(configPath);
  // Config exists, don't overwrite
} catch {
  // Create default config
  await fs.writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
}
```

## MCP Integration Patterns

### Tool Registration Pattern (Confidence: 95%)
Structured tool registration for MCP server with proper schema validation.

**Found in**: src/ai-server-tools.ts

```typescript
server.registerTool(
  'tool_name',
  {
    title: 'Tool Title',
    description: 'Tool description',
    inputSchema: {
      param: z.string().describe('Parameter description')
    }
  },
  async (args) => {
    // Tool implementation
    return { success: true, data: result };
  }
);
```

### Prepare/Process Pattern (Confidence: 90%)
Two-step pattern for AI analysis: prepare prompt, then process AI response.

**Found in**: src/ai-server-tools.ts

```typescript
// Step 1: Prepare
server.registerTool('operation_prepare', {}, async (args) => {
  const prompt = generateAnalysisPrompt(args);
  return { prompt, context };
});

// Step 2: Process
server.registerTool('operation_process', {}, async (args) => {
  const result = await processAIResponse(args.analysis);
  return result;
});
```

## Testing Patterns

### Vitest Test Structure (Confidence: 85%)
Comprehensive testing using Vitest with proper setup and teardown.

**Found in**: test/ai-tools.test.ts

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Feature Tests', () => {
  beforeEach(async () => {
    // Setup test environment
  });

  afterEach(async () => {
    // Cleanup
  });

  it('should perform operation correctly', async () => {
    // Test implementation
    expect(result).toBeDefined();
  });
});
```

## Shell Scripting Patterns

### Shell Scripting Patterns for Git Operations
Safe Git operations with proper error handling and user validation.

```bash
# Check if in Git repository
if ! git rev-parse --git-dir >/dev/null 2>&1; then
    echo "Error: Not in a Git repository"
    exit 1
fi

# Get Git configuration safely
git_user_name=$(git config user.name 2>/dev/null || echo "")
git_user_email=$(git config user.email 2>/dev/null || echo "")
```

### Secure User Identification Without Hardcoded Credentials
Multi-method user identification with fallbacks and security checks.

```bash
is_repo_owner() {
    local git_user_name=$(git config user.name 2>/dev/null || echo "")
    local git_user_email=$(git config user.email 2>/dev/null || echo "")
    local current_user=$(whoami 2>/dev/null || echo "")
    
    # Check multiple identification methods
    if [[ "$git_user_name" == "$REPO_OWNER_NAME" ]] || [[ "$git_user_email" == "$REPO_OWNER_EMAIL" ]]; then
        return 0
    fi
    
    # Fallback to system username
    if [[ "$current_user" == "$REPO_OWNER_NAME" ]]; then
        return 0
    fi
    
    return 1
}
```

### Safe File System Operations
Directory operations with conflict detection and error handling.

```bash
# Safe directory renaming with conflict detection
if [[ -d ".source-dir" ]] && [[ ! -d ".target-dir" ]]; then
    if mv ".source-dir" ".target-dir"; then
        echo "Successfully renamed directory"
    else
        echo "Error: Failed to rename directory"
        exit 1
    fi
else
    echo "Warning: Cannot rename - target already exists or source missing"
fi
```

### Git Hooks Implementation Patterns
Executable Git hooks with environment-based configuration.

```bash
#!/bin/bash
# Git hook with configurable behavior
HOOK_ENABLED=${HOOK_ENABLED:-true}
HOOK_VERBOSE=${HOOK_VERBOSE:-false}

if [[ "$HOOK_ENABLED" != "true" ]]; then
    exit 0
fi

# Hook implementation with error handling
if ! execute_hook_logic; then
    # Log warning but don't fail the Git operation
    echo "Warning: Hook execution failed"
fi
```

### Command-Line Interface Design
User-friendly CLI with help, options, and error handling.

```bash
show_help() {
    cat << EOF
Script Name - Description

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -h, --help      Show this help
    -v, --verbose   Enable verbose output
    --dry-run       Preview changes without executing

EXAMPLES:
    $0                  # Basic usage
    $0 --verbose        # With detailed output
EOF
}

# Argument parsing
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done
```

### Standalone Shell Script Patterns
Self-contained scripts with proper structure and error handling.

```bash
#!/bin/bash
set -e  # Exit on any error

# Script configuration
SCRIPT_NAME="$(basename "$0")"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Main function
main() {
    # Script logic here
    log_info "Starting operation..."
    
    if perform_operation; then
        log_success "Operation completed successfully"
    else
        log_error "Operation failed"
        exit 1
    fi
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

### Technical Documentation Patterns
Structured documentation with clear sections and examples.

```markdown
# Feature Name

## Overview
Brief description of the feature and its purpose.

## Quick Start
Step-by-step instructions for immediate usage.

## Components
Detailed breakdown of system components.

### Component Name
- **Purpose**: What it does
- **Location**: Where to find it
- **Usage**: How to use it

## Configuration
Available configuration options with examples.

## Troubleshooting
Common issues and their solutions.

### Issue Name
**Problem**: Description of the issue
**Solution**: Step-by-step resolution
**Prevention**: How to avoid in the future
```

### Step-by-Step Instruction Format
Clear, actionable instructions with verification steps.

```markdown
### Setup Process

1. **Initial Setup**
   ```bash
   command-to-run
   ```
   Expected output: `Success message`

2. **Configuration**
   ```bash
   configuration-command
   ```
   Verify with: `verification-command`

3. **Testing**
   ```bash
   test-command
   ```
   Should show: `Expected result`
```

## Error Handling Patterns

### Shell Error Handling Patterns
Comprehensive error checking with proper exit codes and logging.

```bash
# Function with error handling
perform_operation() {
    local operation_result

    if ! operation_result=$(some_command 2>&1); then
        log_error "Command failed: $operation_result"
        return 1
    fi

    # Validate result
    if [[ -z "$operation_result" ]]; then
        log_error "Command returned empty result"
        return 1
    fi

    log_success "Operation completed: $operation_result"
    return 0
}

# Usage with error propagation
if ! perform_operation; then
    log_error "Failed to complete operation"
    exit 1
fi
```

### Logging and Debugging Patterns
Structured logging with different verbosity levels.

```bash
# Configurable logging
VERBOSE=${VERBOSE:-false}
DEBUG=${DEBUG:-false}

log_debug() {
    if [[ "$DEBUG" == "true" ]]; then
        echo -e "${CYAN}[DEBUG]${NC} $1" >&2
    fi
}

log_verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}[VERBOSE]${NC} $1" >&2
    fi
}

# Usage
log_debug "Detailed debugging information"
log_verbose "Additional information for verbose mode"
log_info "Standard information message"
```

## AI Insights
- Strong emphasis on type safety with Zod validation throughout
- Consistent error handling patterns across the codebase
- Well-structured MCP integration with clear tool boundaries
- File system-based storage for human-readable, version-controllable data
- Comprehensive testing approach with proper setup/teardown

## AI Recommendations
- Continue using Zod for all external data validation
- Maintain consistent async/await error handling patterns
- Expand test coverage for edge cases in AI response processing
- Consider adding more granular logging for debugging AI interactions
- Document MCP tool dependencies and interaction patterns
