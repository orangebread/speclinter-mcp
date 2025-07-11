#!/bin/sh
set -e

# SpecLinter MCP Server Docker Entrypoint
# Handles different modes: serve, validate, init, help

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Art Logo
print_logo() {
    echo "${PURPLE}"
    echo "   _____ ____  ___________   ____  ___  ____________ "
    echo "  / ___// __ \/ ____/ ___/  / __ \/ _ \/_  __/ ____/ "
    echo "  \__ \/ /_/ / __/ / /__   / / / /  __/ / / / __/    "
    echo " ___/ / ____/ /___/ /__/  / /_/ / /   / / / /___     "
    echo "/____/_/   /_____/\___/  /_____/_/   /_/ /_____/     "
    echo "${NC}"
    echo "${CYAN}🤖 AI-Powered Specification Analysis & Task Generation${NC}"
    echo ""
}

# Print usage information
print_usage() {
    echo "${GREEN}SpecLinter MCP Server - Docker Usage${NC}"
    echo ""
    echo "${YELLOW}Available Commands:${NC}"
    echo "  ${BLUE}serve${NC}     - Start MCP server (default)"
    echo "  ${BLUE}init${NC}      - Initialize SpecLinter in current directory"
    echo "  ${BLUE}validate${NC}  - Run headless validation on existing features"
    echo "  ${BLUE}status${NC}    - Show status of features"
    echo "  ${BLUE}help${NC}      - Show this help message"
    echo ""
    echo "${YELLOW}Quick Start Examples:${NC}"
    echo ""
    echo "${CYAN}1. Try SpecLinter (temporary):${NC}"
    echo "   docker run -it --rm speclinter/mcp:latest"
    echo ""
    echo "${CYAN}2. Use with your project (persistent):${NC}"
    echo "   docker run -it --rm -v \$(pwd):/workspace speclinter/mcp:latest"
    echo ""
    echo "${CYAN}3. Initialize in your project:${NC}"
    echo "   docker run --rm -v \$(pwd):/workspace speclinter/mcp:latest init"
    echo ""
    echo "${CYAN}4. Validate existing specifications:${NC}"
    echo "   docker run --rm -v \$(pwd):/workspace speclinter/mcp:latest validate"
    echo ""
    echo "${YELLOW}MCP Configuration for AI IDEs:${NC}"
    echo "${GREEN}Add this to your AI IDE's MCP configuration:${NC}"
    echo ""
    echo '{'
    echo '  "mcpServers": {'
    echo '    "speclinter": {'
    echo '      "command": "docker",'
    echo '      "args": ["run", "--rm", "-i", "-v", "$(pwd):/workspace",'
    echo '               "speclinter/mcp:latest", "serve"]'
    echo '    }'
    echo '  }'
    echo '}'
    echo ""
}

# Initialize SpecLinter in the workspace
init_speclinter() {
    echo "${GREEN}🚀 Initializing SpecLinter in workspace...${NC}"
    
    if [ -d "/workspace/.speclinter" ]; then
        echo "${YELLOW}⚠️  SpecLinter already initialized in this directory${NC}"
        echo "${BLUE}📁 Found existing .speclinter directory${NC}"
    else
        echo "${BLUE}📁 Creating SpecLinter directories...${NC}"
        node /app/dist/cli.js init 2>/dev/null || {
            echo "${RED}❌ Failed to initialize SpecLinter${NC}"
            echo "${YELLOW}💡 Make sure you have write permissions to the workspace${NC}"
            exit 1
        }
        echo "${GREEN}✅ SpecLinter initialized successfully!${NC}"
    fi
    
    echo ""
    echo "${CYAN}🎯 Next Steps:${NC}"
    echo "1. Start the MCP server: ${BLUE}docker run -it --rm -v \$(pwd):/workspace speclinter/mcp:latest serve${NC}"
    echo "2. Add MCP configuration to your AI IDE (see 'help' command)"
    echo "3. Try: ${BLUE}\"Initialize SpecLinter in my project\"${NC} in your AI IDE"
}

# Validate existing features
validate_features() {
    echo "${GREEN}🔍 Validating SpecLinter features...${NC}"
    
    if [ ! -d "/workspace/.speclinter" ]; then
        echo "${RED}❌ No SpecLinter project found${NC}"
        echo "${YELLOW}💡 Run 'init' first or mount a directory with SpecLinter initialized${NC}"
        exit 1
    fi
    
    # Check for features
    if [ ! -d "/workspace/speclinter-tasks" ] || [ -z "$(ls -A /workspace/speclinter-tasks 2>/dev/null)" ]; then
        echo "${YELLOW}⚠️  No features found to validate${NC}"
        echo "${BLUE}💡 Create some specifications first using the MCP tools${NC}"
        exit 0
    fi
    
    echo "${BLUE}📊 Found features to validate...${NC}"
    
    # List features and their status
    for feature_dir in /workspace/speclinter-tasks/*/; do
        if [ -d "$feature_dir" ]; then
            feature_name=$(basename "$feature_dir")
            echo "${CYAN}📋 Feature: ${feature_name}${NC}"
            node /app/dist/cli.js status "$feature_name" 2>/dev/null || echo "${YELLOW}  Status unavailable${NC}"
            echo ""
        fi
    done
    
    echo "${GREEN}✅ Validation complete${NC}"
    echo "${YELLOW}💡 For detailed AI-powered validation, use the MCP tools in your AI IDE${NC}"
}

# Show status of all features
show_status() {
    echo "${GREEN}📊 SpecLinter Project Status${NC}"
    echo ""
    
    if [ ! -d "/workspace/.speclinter" ]; then
        echo "${RED}❌ No SpecLinter project found${NC}"
        echo "${YELLOW}💡 Run 'init' first${NC}"
        exit 1
    fi
    
    if [ ! -d "/workspace/speclinter-tasks" ] || [ -z "$(ls -A /workspace/speclinter-tasks 2>/dev/null)" ]; then
        echo "${YELLOW}📝 No features found${NC}"
        echo "${BLUE}💡 Create specifications using the MCP tools in your AI IDE${NC}"
        exit 0
    fi
    
    echo "${BLUE}📋 Features:${NC}"
    for feature_dir in /workspace/speclinter-tasks/*/; do
        if [ -d "$feature_dir" ]; then
            feature_name=$(basename "$feature_dir")
            echo ""
            node /app/dist/cli.js status "$feature_name" 2>/dev/null || echo "${YELLOW}  ${feature_name}: Status unavailable${NC}"
        fi
    done
}

# Start MCP server
start_server() {
    echo "${GREEN}🚀 Starting SpecLinter MCP Server...${NC}"
    echo "${BLUE}📡 Server will communicate via stdio (MCP protocol)${NC}"
    echo "${YELLOW}💡 Connect this to your AI IDE using MCP configuration${NC}"
    echo ""
    
    # Ensure workspace is initialized
    if [ ! -d "/workspace/.speclinter" ]; then
        echo "${CYAN}🔧 Auto-initializing SpecLinter...${NC}"
        init_speclinter
        echo ""
    fi
    
    # Start the server
    exec node /app/dist/cli.js serve
}

# Main entrypoint logic
main() {
    # Handle different commands
    case "${1:-serve}" in
        "serve")
            start_server
            ;;
        "init")
            print_logo
            init_speclinter
            ;;
        "validate")
            print_logo
            validate_features
            ;;
        "status")
            print_logo
            show_status
            ;;
        "help"|"--help"|"-h")
            print_logo
            print_usage
            ;;
        *)
            print_logo
            echo "${RED}❌ Unknown command: $1${NC}"
            echo ""
            print_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
