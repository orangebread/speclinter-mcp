# SpecLinter Directory Restoration System

This system automatically restores `.speclinter-example` and `speclinter-tasks-example` directories back to their original names (`.speclinter` and `speclinter-tasks`) for the repository owner when pulling updates from the repository.

## Overview

The SpecLinter Directory Restoration System consists of:

1. **Automatic Restoration**: Git post-merge hook that triggers after `git pull`/`git merge`
2. **Manual Restoration**: Standalone script for on-demand execution
3. **Security**: Only executes for the repository owner (orangebread)
4. **Safety**: Prevents overwriting existing directories

## Quick Start

### For Repository Owner (orangebread)

1. **Setup the system:**
   ```bash
   ./scripts/setup-speclinter-restore.sh
   ```

2. **Configure Git (if prompted):**
   ```bash
   git config user.name "orangebread"
   git config user.email "mzbwrt@gmail.com"
   ```

3. **Test the system:**
   ```bash
   ./scripts/restore-speclinter-dirs.sh --dry-run --verbose
   ```

### For Other Users

The system will not execute for other users. If you need to restore directories manually, you can use the force option (not recommended):

```bash
./scripts/restore-speclinter-dirs.sh --force --dry-run
```

## Components

### Main Restoration Script

**Location**: `scripts/restore-speclinter-dirs.sh`

**Features**:
- User identification and security checks
- Directory detection and conflict resolution
- Safe directory renaming with error handling
- Dry-run mode for testing
- Verbose logging
- Help documentation

**Usage**:
```bash
# Basic usage
./scripts/restore-speclinter-dirs.sh

# With verbose output
./scripts/restore-speclinter-dirs.sh --verbose

# Dry run (preview changes)
./scripts/restore-speclinter-dirs.sh --dry-run

# Show help
./scripts/restore-speclinter-dirs.sh --help

# Force execution (skip user check)
./scripts/restore-speclinter-dirs.sh --force
```

### Git Post-Merge Hook

**Location**: `.git/hooks/post-merge`

**Features**:
- Automatically triggers after git pull/merge operations
- Calls the main restoration script
- Can be enabled/disabled via environment variables
- Includes error handling and logging

**Configuration**:
```bash
# Enable/disable the hook
export SPECLINTER_HOOK_ENABLED=true   # default
export SPECLINTER_HOOK_ENABLED=false  # to disable

# Enable verbose output
export SPECLINTER_HOOK_VERBOSE=true
```

### Setup Script

**Location**: `scripts/setup-speclinter-restore.sh`

**Features**:
- Interactive setup process
- Git configuration assistance
- Hook installation and management
- Environment configuration

**Usage**:
```bash
# Full interactive setup
./scripts/setup-speclinter-restore.sh

# Configure Git only
./scripts/setup-speclinter-restore.sh --configure-git

# Install hook only
./scripts/setup-speclinter-restore.sh --install-hook

# Enable verbose output
./scripts/setup-speclinter-restore.sh --enable-verbose

# Uninstall system
./scripts/setup-speclinter-restore.sh --uninstall
```

## Security Model

### User Identification

The system identifies the repository owner through multiple checks:

1. **Git user.name**: Must match "orangebread"
2. **Git user.email**: Must match "mzbwrt@gmail.com"
3. **System username**: Fallback check for "orangebread"

### Safety Measures

- **Conflict Detection**: Won't overwrite existing directories
- **Error Handling**: Comprehensive error checking and reporting
- **Dry Run Mode**: Preview changes without executing
- **Graceful Failures**: Non-destructive error handling

## Directory Operations

### Restoration Logic

The system looks for these directories and renames them:

- `.speclinter-example` → `.speclinter`
- `speclinter-tasks-example` → `speclinter-tasks`

### Conflict Resolution

If original directories already exist:
- **Warning**: Logs a warning message
- **Skip**: Skips the restoration for that directory
- **Continue**: Continues with other directories

### Example Scenarios

1. **Normal Restoration**:
   ```
   Before: .speclinter-example, speclinter-tasks-example
   After:  .speclinter, speclinter-tasks
   ```

2. **Partial Conflict**:
   ```
   Before: .speclinter-example, .speclinter (existing), speclinter-tasks-example
   After:  .speclinter-example (unchanged), .speclinter (unchanged), speclinter-tasks
   Warning: Cannot restore .speclinter-example: .speclinter already exists
   ```

3. **No Changes Needed**:
   ```
   Before: .speclinter, speclinter-tasks
   After:  .speclinter, speclinter-tasks
   Message: No SpecLinter example directories found that need restoration
   ```

## Troubleshooting

### Common Issues

1. **"Not the repository owner" message**:
   ```bash
   # Configure Git with correct credentials
   git config user.name "orangebread"
   git config user.email "mzbwrt@gmail.com"
   ```

2. **Hook not triggering**:
   ```bash
   # Check if hook is enabled
   echo $SPECLINTER_HOOK_ENABLED
   
   # Check if hook is executable
   ls -la .git/hooks/post-merge
   
   # Reinstall hook
   ./scripts/setup-speclinter-restore.sh --install-hook
   ```

3. **Script not found**:
   ```bash
   # Ensure script exists and is executable
   ls -la scripts/restore-speclinter-dirs.sh
   chmod +x scripts/restore-speclinter-dirs.sh
   ```

### Debug Mode

Enable verbose output for detailed logging:

```bash
# For manual script
./scripts/restore-speclinter-dirs.sh --verbose

# For Git hook
export SPECLINTER_HOOK_VERBOSE=true
```

### Testing

Test the system without making changes:

```bash
# Test manual script
./scripts/restore-speclinter-dirs.sh --dry-run --verbose --force

# Test with current user identification
./scripts/restore-speclinter-dirs.sh --dry-run --verbose
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SPECLINTER_HOOK_ENABLED` | `true` | Enable/disable the Git hook |
| `SPECLINTER_HOOK_VERBOSE` | `false` | Enable verbose output for hooks |
| `VERBOSE` | `false` | Enable verbose output for manual script |
| `DRY_RUN` | `false` | Enable dry-run mode |

## Files and Directories

```
├── scripts/
│   ├── restore-speclinter-dirs.sh      # Main restoration script
│   └── setup-speclinter-restore.sh     # Setup and configuration script
├── .git/hooks/
│   └── post-merge                       # Git hook (auto-generated)
└── docs/
    └── SPECLINTER_RESTORE.md           # This documentation
```

## Integration with GitHub Actions

This system works in conjunction with the GitHub Actions workflow that renames directories to `-example` when pushing to the main branch. The workflow creates the `-example` directories, and this system restores them for the repository owner when pulling.

**Workflow**:
1. Developer pushes to main branch
2. GitHub Actions renames directories to `-example`
3. Repository owner pulls changes
4. Post-merge hook automatically restores original directory names
5. Development continues with original directory structure

## Uninstallation

To remove the SpecLinter Directory Restoration System:

```bash
./scripts/setup-speclinter-restore.sh --uninstall
```

This will:
- Remove the Git post-merge hook
- Preserve the manual restoration script
- Provide instructions for removing environment variables

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Run with `--verbose` flag for detailed logging
3. Use `--dry-run` to test without making changes
4. Review the script source code for implementation details
