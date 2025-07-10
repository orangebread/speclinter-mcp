# SpecLinter GitMCP Integration Guide

This guide explains how to use SpecLinter with GitMCP for enhanced AI-powered development workflows.

## What is GitMCP?

GitMCP (https://gitmcp.io) is a service that transforms any GitHub repository into a Model Context Protocol (MCP) server, allowing AI assistants to access repository documentation and code directly.

## SpecLinter + GitMCP Integration

### Access Methods

1. **Documentation Access**: `https://gitmcp.io/orangebread/speclinter-mcp`
2. **Direct Repository**: Browse at https://gitmcp.io/orangebread/speclinter-mcp
3. **Badge Link**: Click the GitMCP badge in the README

### What GitMCP Provides for SpecLinter

- **📖 Documentation Browsing**: Access SpecLinter's comprehensive documentation
- **🔍 Code Search**: Search through SpecLinter source code for implementation details
- **📋 Configuration Examples**: Find real-world MCP configuration examples
- **🎯 Usage Patterns**: Discover how to integrate SpecLinter into your workflow

### Setting Up GitMCP for SpecLinter

Add this to your AI IDE's MCP configuration:

```json
{
  "mcpServers": {
    "speclinter-docs": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://gitmcp.io/orangebread/speclinter-mcp"
      ]
    }
  }
}
```

### AI Prompts for GitMCP + SpecLinter

Once configured, you can ask your AI:

```
"Show me how to configure SpecLinter as an MCP server"
"What are all the available SpecLinter tools?"
"Find examples of SpecLinter task generation"
"How does SpecLinter's quality grading system work?"
"Show me the SpecLinter project structure"
```

### Limitations

**GitMCP provides documentation access only** - it doesn't expose SpecLinter's actual MCP tools. For full SpecLinter functionality, you need to:

1. Install SpecLinter locally (`pnpm install && pnpm build`)
2. Configure it as a direct MCP server (see main README)
3. Use GitMCP as a supplementary documentation resource

### Workflow Recommendation

**Optimal Setup**: Use both integrations together:

```json
{
  "mcpServers": {
    "speclinter": {
      "command": "node",
      "args": ["/path/to/speclinter-mcp/dist/cli.js", "serve"],
      "cwd": "/path/to/speclinter-mcp"
    },
    "speclinter-docs": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://gitmcp.io/orangebread/speclinter-mcp"
      ]
    }
  }
}
```

This gives you:
- **Full SpecLinter functionality** (from direct MCP server)
- **Enhanced documentation access** (from GitMCP)
- **Best of both worlds** for AI-assisted development

## Benefits of GitMCP Integration

### For New Users
- **Quick Discovery**: Find SpecLinter through GitMCP without installation
- **Documentation Browsing**: Understand capabilities before committing to setup
- **Configuration Help**: Get setup assistance from AI with access to docs

### For Existing Users
- **Enhanced Support**: AI can reference documentation during troubleshooting
- **Feature Discovery**: Learn about advanced features through documentation search
- **Best Practices**: Access examples and patterns from the repository

### For Teams
- **Onboarding**: New team members can explore SpecLinter through GitMCP
- **Knowledge Sharing**: Shared access to comprehensive documentation
- **Standardization**: Consistent access to official documentation and examples

## Troubleshooting GitMCP Integration

### Common Issues

1. **"GitMCP not finding tools"**
   - GitMCP provides documentation access, not tool execution
   - Install SpecLinter directly for MCP tools

2. **"Configuration not working"**
   - Ensure you're using the correct GitMCP URL format
   - Check your AI IDE's MCP configuration syntax

3. **"Limited functionality"**
   - GitMCP is for documentation; use direct MCP server for full features
   - Consider hybrid setup (both GitMCP + direct server)

### Getting Help

- **GitMCP Issues**: https://github.com/idosal/git-mcp/issues
- **SpecLinter Issues**: https://github.com/orangebread/speclinter-mcp/issues
- **Documentation**: This repository's README and docs/

## Future Enhancements

Potential improvements for GitMCP compatibility:

1. **Enhanced llms.txt**: More comprehensive tool documentation
2. **Usage Examples**: Real-world configuration and usage patterns
3. **Integration Guides**: Step-by-step setup for different AI IDEs
4. **Video Tutorials**: Visual guides for GitMCP + SpecLinter setup

## Contributing

Help improve SpecLinter's GitMCP compatibility:

1. **Documentation**: Enhance llms.txt and documentation files
2. **Examples**: Add real-world usage examples
3. **Integration Guides**: Create setup guides for different AI IDEs
4. **Feedback**: Report issues or suggest improvements

## Resources

- **SpecLinter Repository**: https://github.com/orangebread/speclinter-mcp
- **GitMCP Service**: https://gitmcp.io
- **GitMCP Repository**: https://github.com/idosal/git-mcp
- **Model Context Protocol**: https://modelcontextprotocol.io
