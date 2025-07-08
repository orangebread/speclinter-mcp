import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  handleGetTaskStatus,
  handleUpdateTaskStatus,
  handleInitProject
} from './tools.js';
import { registerAITools } from './ai-server-tools.js';

class SpecLinterServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer({
      name: 'speclinter',
      version: '0.1.0'
    });

    this.setupTools();
  }

  private setupTools() {

    // Get task status tool
    this.server.registerTool(
      'speclinter_get_task_status',
      {
        title: 'Get Task Status',
        description: 'Get the current status of a feature\'s tasks',
        inputSchema: {
          feature_name: z.string().describe('Name of the feature to check'),
          project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)')
        }
      },
      async (args) => {
        const result = await handleGetTaskStatus(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    );

    // Legacy run_tests tool removed - replaced with AI-leveraged validation
    // Use speclinter_validate_implementation_prepare and speclinter_validate_implementation_process instead

    // Update task status tool
    this.server.registerTool(
      'speclinter_update_task_status',
      {
        title: 'Update Task Status',
        description: 'Update the status of a specific task',
        inputSchema: {
          feature_name: z.string().describe('Name of the feature'),
          task_id: z.string().describe('ID of the task to update'),
          status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']).describe('New status for the task'),
          notes: z.string().optional().describe('Optional notes about the status change'),
          project_root: z.string().optional().describe('Root directory of the project (defaults to auto-detected project root)')
        }
      },
      async (args) => {
        const result = await handleUpdateTaskStatus(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    );

    // Initialize project tool
    this.server.registerTool(
      'speclinter_init_project',
      {
        title: 'Initialize SpecLinter Project',
        description: 'Initialize SpecLinter in a project directory with default configuration and directory structure',
        inputSchema: {
          project_root: z.string().optional().describe('Root directory for the project (defaults to current working directory)'),
          force_reinit: z.boolean().optional().default(false).describe('Force reinitialization if already initialized')
        }
      },
      async (args) => {
        const result = await handleInitProject(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    );

    // Register AI-leveraged tools
    registerAITools(this.server);
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SpecLinter MCP server running on stdio');
  }
}

export async function startServer() {
  const server = new SpecLinterServer();
  await server.run();
}

export { SpecLinterServer };
