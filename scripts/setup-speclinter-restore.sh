#!/bin/bash

# SpecLinter Directory Restoration Setup Script
#
# Purpose: Set up the SpecLinter directory restoration system
#          including Git hooks and configuration
#
# Usage: ./scripts/setup-speclinter-restore.sh [OPTIONS]

set -e

# Configuration
REPO_OWNER_NAME="orangebread"
REPO_OWNER_EMAIL="mzbwrt@gmail.com"
SCRIPT_NAME="$(basename "$0")"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show help
show_help() {
    cat << EOF
SpecLinter Directory Restoration Setup Script

USAGE:
    $SCRIPT_NAME [OPTIONS]

DESCRIPTION:
    Sets up the SpecLinter directory restoration system including:
    - Git post-merge hook installation
    - User configuration validation
    - Environment setup

OPTIONS:
    -h, --help          Show this help message
    --configure-git     Configure Git with repository owner credentials
    --install-hook      Install the Git post-merge hook
    --enable-verbose    Enable verbose output for hooks
    --disable-hook      Disable the post-merge hook
    --uninstall         Remove all SpecLinter restoration components

EXAMPLES:
    $SCRIPT_NAME                        # Full setup with prompts
    $SCRIPT_NAME --configure-git        # Only configure Git
    $SCRIPT_NAME --install-hook         # Only install Git hook
    $SCRIPT_NAME --uninstall            # Remove all components

EOF
}

# Function to check if we're in a Git repository
check_git_repo() {
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        log_error "Not in a Git repository"
        exit 1
    fi
}

# Function to configure Git with repository owner credentials
configure_git() {
    log_info "Configuring Git with repository owner credentials..."
    
    local current_name
    local current_email
    
    current_name=$(git config user.name 2>/dev/null || echo "")
    current_email=$(git config user.email 2>/dev/null || echo "")
    
    log_info "Current Git configuration:"
    log_info "  user.name: '$current_name'"
    log_info "  user.email: '$current_email'"
    
    if [[ "$current_name" == "$REPO_OWNER_NAME" ]] && [[ "$current_email" == "$REPO_OWNER_EMAIL" ]]; then
        log_success "Git is already configured correctly"
        return 0
    fi
    
    echo
    read -p "Configure Git with repository owner credentials? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git config user.name "$REPO_OWNER_NAME"
        git config user.email "$REPO_OWNER_EMAIL"
        log_success "Git configured successfully"
        log_info "  user.name: '$REPO_OWNER_NAME'"
        log_info "  user.email: '$REPO_OWNER_EMAIL'"
    else
        log_info "Git configuration skipped"
    fi
}

# Function to install the Git post-merge hook
install_hook() {
    local hook_file=".git/hooks/post-merge"
    local hook_template="$hook_file"
    
    log_info "Installing Git post-merge hook..."
    
    if [[ -f "$hook_file" ]]; then
        log_warning "Post-merge hook already exists"
        echo
        read -p "Overwrite existing hook? (y/N): " -n 1 -r
        echo
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Hook installation skipped"
            return 0
        fi
        
        # Backup existing hook
        cp "$hook_file" "$hook_file.backup.$(date +%s)"
        log_info "Existing hook backed up"
    fi
    
    # The hook should already exist from our implementation
    if [[ -f "$hook_file" ]]; then
        chmod +x "$hook_file"
        log_success "Git post-merge hook installed and made executable"
    else
        log_error "Hook file not found at $hook_file"
        return 1
    fi
}

# Function to enable verbose output
enable_verbose() {
    log_info "Enabling verbose output for SpecLinter hooks..."
    
    # Add to shell profile if not already present
    local shell_profile=""
    if [[ -f "$HOME/.bashrc" ]]; then
        shell_profile="$HOME/.bashrc"
    elif [[ -f "$HOME/.zshrc" ]]; then
        shell_profile="$HOME/.zshrc"
    elif [[ -f "$HOME/.profile" ]]; then
        shell_profile="$HOME/.profile"
    fi
    
    if [[ -n "$shell_profile" ]]; then
        if ! grep -q "SPECLINTER_HOOK_VERBOSE" "$shell_profile"; then
            echo "" >> "$shell_profile"
            echo "# SpecLinter configuration" >> "$shell_profile"
            echo "export SPECLINTER_HOOK_VERBOSE=true" >> "$shell_profile"
            log_success "Added SPECLINTER_HOOK_VERBOSE=true to $shell_profile"
            log_info "Restart your shell or run: source $shell_profile"
        else
            log_info "SPECLINTER_HOOK_VERBOSE already configured in $shell_profile"
        fi
    fi
    
    # Set for current session
    export SPECLINTER_HOOK_VERBOSE=true
    log_success "Verbose output enabled for current session"
}

# Function to disable the hook
disable_hook() {
    log_info "Disabling SpecLinter post-merge hook..."
    
    # Set environment variable to disable
    export SPECLINTER_HOOK_ENABLED=false
    
    log_success "SpecLinter hook disabled for current session"
    log_info "To permanently disable, add to your shell profile:"
    log_info "  export SPECLINTER_HOOK_ENABLED=false"
}

# Function to uninstall all components
uninstall() {
    log_warning "Uninstalling SpecLinter directory restoration components..."
    
    echo
    read -p "Are you sure you want to uninstall? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Uninstall cancelled"
        return 0
    fi
    
    # Remove Git hook
    if [[ -f ".git/hooks/post-merge" ]]; then
        rm ".git/hooks/post-merge"
        log_success "Removed Git post-merge hook"
    fi
    
    # Note: We don't remove the restore script as it might be useful standalone
    log_info "Manual restore script preserved at: scripts/restore-speclinter-dirs.sh"
    
    log_success "SpecLinter directory restoration uninstalled"
}

# Function to auto-detect if setup is needed
needs_setup() {
    # Check if hook exists and is executable
    if [[ ! -f ".git/hooks/post-merge" ]] || [[ ! -x ".git/hooks/post-merge" ]]; then
        return 0  # Needs setup
    fi

    # Check if user is configured
    local git_user_name=$(git config user.name 2>/dev/null || echo "")
    local git_user_email=$(git config user.email 2>/dev/null || echo "")

    if [[ "$git_user_name" == "$REPO_OWNER_NAME" ]] || [[ "$git_user_email" == "$REPO_OWNER_EMAIL" ]]; then
        return 1  # Already set up
    fi

    return 0  # Needs setup
}

# Function to run automatic setup (minimal prompts)
auto_setup() {
    log_info "Auto-configuring SpecLinter directory restoration..."

    # Auto-install hook without prompts
    if [[ ! -f ".git/hooks/post-merge" ]] || [[ ! -x ".git/hooks/post-merge" ]]; then
        chmod +x ".git/hooks/post-merge" 2>/dev/null || true
        log_success "Git post-merge hook configured"
    fi

    # Auto-configure Git if we can detect the user
    local current_user=$(whoami 2>/dev/null || echo "")
    if [[ "$current_user" == "$REPO_OWNER_NAME" ]]; then
        git config user.name "$REPO_OWNER_NAME" 2>/dev/null || true
        git config user.email "$REPO_OWNER_EMAIL" 2>/dev/null || true
        log_success "Git configuration auto-detected and set"
    fi

    log_success "SpecLinter auto-setup completed!"
}

# Function to run full setup
full_setup() {
    log_info "Setting up SpecLinter directory restoration system..."
    echo

    configure_git
    echo

    install_hook
    echo

    log_success "SpecLinter directory restoration setup completed!"
    echo
    log_info "The system will now automatically restore SpecLinter directories"
    log_info "after git pull/merge operations for the repository owner."
    echo
    log_info "Manual usage: ./scripts/restore-speclinter-dirs.sh"
    log_info "Enable verbose: export SPECLINTER_HOOK_VERBOSE=true"
    log_info "Disable hook: export SPECLINTER_HOOK_ENABLED=false"
}

# Main function
main() {
    local configure_git_only=false
    local install_hook_only=false
    local enable_verbose_only=false
    local disable_hook_only=false
    local uninstall_only=false
    local auto_mode=false

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --configure-git)
                configure_git_only=true
                shift
                ;;
            --install-hook)
                install_hook_only=true
                shift
                ;;
            --enable-verbose)
                enable_verbose_only=true
                shift
                ;;
            --disable-hook)
                disable_hook_only=true
                shift
                ;;
            --uninstall)
                uninstall_only=true
                shift
                ;;
            --auto)
                auto_mode=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    # Check if we're in a Git repository
    check_git_repo

    # Execute based on options
    if [[ "$configure_git_only" == "true" ]]; then
        configure_git
    elif [[ "$install_hook_only" == "true" ]]; then
        install_hook
    elif [[ "$enable_verbose_only" == "true" ]]; then
        enable_verbose
    elif [[ "$disable_hook_only" == "true" ]]; then
        disable_hook
    elif [[ "$uninstall_only" == "true" ]]; then
        uninstall
    elif [[ "$auto_mode" == "true" ]]; then
        auto_setup
    else
        # Smart default: auto-setup if needed, otherwise full setup
        if needs_setup; then
            echo "SpecLinter restoration system not configured."
            echo "Run automatic setup? (Y/n): "
            read -n 1 -r
            echo
            if [[ $REPLY =~ ^[Nn]$ ]]; then
                full_setup
            else
                auto_setup
            fi
        else
            log_success "SpecLinter restoration system already configured!"
            log_info "Use --help to see configuration options"
        fi
    fi
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
