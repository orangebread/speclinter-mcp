#!/bin/bash

# SpecLinter Directory Restoration Script
# 
# Purpose: Automatically restore .speclinter-example and speclinter-tasks-example 
#          directories back to their original names (.speclinter and speclinter-tasks)
#          for the repository owner only.
#
# Security: Only executes for the repository owner (orangebread)
# Usage: Can be run manually or called from Git hooks

set -e  # Exit on any error

# Configuration
REPO_OWNER_NAME="orangebread"
REPO_OWNER_EMAIL="mzbwrt@gmail.com"
SCRIPT_NAME="$(basename "$0")"
VERBOSE=${VERBOSE:-false}

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}[INFO]${NC} $1" >&2
    fi
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Function to show help
show_help() {
    cat << EOF
SpecLinter Directory Restoration Script

USAGE:
    $SCRIPT_NAME [OPTIONS]

DESCRIPTION:
    Restores .speclinter-example and speclinter-tasks-example directories back to 
    their original names (.speclinter and speclinter-tasks) for the repository 
    owner only.

OPTIONS:
    -h, --help      Show this help message
    -v, --verbose   Enable verbose output
    --dry-run       Show what would be done without making changes
    --force         Skip user identification check (use with caution)

EXAMPLES:
    $SCRIPT_NAME                    # Run with default settings
    $SCRIPT_NAME --verbose          # Run with verbose output
    $SCRIPT_NAME --dry-run          # Preview changes without executing

SECURITY:
    This script only executes for the repository owner (orangebread).
    Other users will see a message but no changes will be made.

EOF
}

# Function to identify if current user is the repository owner
is_repo_owner() {
    local git_user_name
    local git_user_email
    local current_user
    
    log_info "Checking user identification..."
    
    # Get Git configuration
    git_user_name=$(git config user.name 2>/dev/null || echo "")
    git_user_email=$(git config user.email 2>/dev/null || echo "")
    current_user=$(whoami 2>/dev/null || echo "")
    
    log_info "Git user.name: '$git_user_name'"
    log_info "Git user.email: '$git_user_email'"
    log_info "System user: '$current_user'"
    
    # Check if user matches repository owner
    if [[ "$git_user_name" == "$REPO_OWNER_NAME" ]] || [[ "$git_user_email" == "$REPO_OWNER_EMAIL" ]]; then
        log_info "User identified as repository owner"
        return 0
    fi
    
    # Additional check for system username (fallback)
    if [[ "$current_user" == "$REPO_OWNER_NAME" ]]; then
        log_info "User identified as repository owner (via system username)"
        return 0
    fi
    
    log_info "User is not the repository owner"
    return 1
}

# Function to detect directories that need restoration
detect_directories() {
    local speclinter_example_exists=false
    local tasks_example_exists=false
    local speclinter_original_exists=false
    local tasks_original_exists=false
    
    log_info "Detecting directories..."
    
    # Check for example directories
    if [[ -d ".speclinter-example" ]]; then
        speclinter_example_exists=true
        log_info "Found .speclinter-example directory"
    fi
    
    if [[ -d "speclinter-tasks-example" ]]; then
        tasks_example_exists=true
        log_info "Found speclinter-tasks-example directory"
    fi
    
    # Check for original directories (to prevent conflicts)
    if [[ -d ".speclinter" ]]; then
        speclinter_original_exists=true
        log_info "Found existing .speclinter directory"
    fi
    
    if [[ -d "speclinter-tasks" ]]; then
        tasks_original_exists=true
        log_info "Found existing speclinter-tasks directory"
    fi
    
    # Set global variables for use by other functions
    SPECLINTER_NEEDS_RESTORE=$speclinter_example_exists
    TASKS_NEEDS_RESTORE=$tasks_example_exists
    SPECLINTER_CONFLICT=$speclinter_original_exists
    TASKS_CONFLICT=$tasks_original_exists
    
    # Return true if any directories need restoration
    if [[ "$speclinter_example_exists" == "true" ]] || [[ "$tasks_example_exists" == "true" ]]; then
        return 0
    else
        return 1
    fi
}

# Function to safely rename directories
restore_directories() {
    local changes_made=false
    local dry_run=${DRY_RUN:-false}
    
    log_info "Starting directory restoration..."
    
    # Restore .speclinter-example to .speclinter
    if [[ "$SPECLINTER_NEEDS_RESTORE" == "true" ]]; then
        if [[ "$SPECLINTER_CONFLICT" == "true" ]]; then
            log_warning "Cannot restore .speclinter-example: .speclinter already exists"
        else
            if [[ "$dry_run" == "true" ]]; then
                log_info "DRY RUN: Would rename .speclinter-example to .speclinter"
            else
                log_info "Renaming .speclinter-example to .speclinter..."
                if mv ".speclinter-example" ".speclinter"; then
                    log_success "Successfully restored .speclinter directory"
                    changes_made=true
                else
                    log_error "Failed to rename .speclinter-example"
                    return 1
                fi
            fi
        fi
    fi
    
    # Restore speclinter-tasks-example to speclinter-tasks
    if [[ "$TASKS_NEEDS_RESTORE" == "true" ]]; then
        if [[ "$TASKS_CONFLICT" == "true" ]]; then
            log_warning "Cannot restore speclinter-tasks-example: speclinter-tasks already exists"
        else
            if [[ "$dry_run" == "true" ]]; then
                log_info "DRY RUN: Would rename speclinter-tasks-example to speclinter-tasks"
            else
                log_info "Renaming speclinter-tasks-example to speclinter-tasks..."
                if mv "speclinter-tasks-example" "speclinter-tasks"; then
                    log_success "Successfully restored speclinter-tasks directory"
                    changes_made=true
                else
                    log_error "Failed to rename speclinter-tasks-example"
                    return 1
                fi
            fi
        fi
    fi
    
    if [[ "$changes_made" == "true" ]]; then
        log_success "Directory restoration completed successfully"
    elif [[ "$dry_run" == "true" ]]; then
        log_info "Dry run completed - no changes made"
    else
        log_info "No directories needed restoration"
    fi
    
    return 0
}

# Main function
main() {
    local force_mode=false
    local dry_run=false
    
    # Parse command line arguments
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
                dry_run=true
                DRY_RUN=true
                shift
                ;;
            --force)
                force_mode=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    log_info "Starting SpecLinter directory restoration..."
    
    # Check if we're in a Git repository
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        log_error "Not in a Git repository"
        exit 1
    fi
    
    # User identification check (unless forced)
    if [[ "$force_mode" != "true" ]]; then
        if ! is_repo_owner; then
            log_warning "This script is intended for the repository owner only"
            log_info "If you are the repository owner, please configure Git with:"
            log_info "  git config user.name '$REPO_OWNER_NAME'"
            log_info "  git config user.email '$REPO_OWNER_EMAIL'"
            log_info "Or use --force to skip this check (not recommended)"
            exit 0
        fi
    else
        log_warning "Skipping user identification check (--force mode)"
    fi
    
    # Detect directories that need restoration
    if ! detect_directories; then
        log_info "No SpecLinter example directories found that need restoration"
        exit 0
    fi
    
    # Restore directories
    if ! restore_directories; then
        log_error "Directory restoration failed"
        exit 1
    fi
    
    log_success "SpecLinter directory restoration completed"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
