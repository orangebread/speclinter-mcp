import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  handleParseSpec,
  handleGetTaskStatus,
  handleRunTests,
  handleFindSimilar,
  handleUpdateTaskStatus
} from './tools.js';

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
    // Parse specification tool
    this.server.registerTool(
      'parse_spec',
      {
        title: 'Parse Specification',
        description: 'Parse a specification and generate structured tasks with tests',
        inputSchema: {
          spec: z.string().describe('The specification text to parse'),
          feature_name: z.string().describe('Name for the feature (used for directory)'),
          context: z.string().optional().describe('Additional context about the implementation')
        }
      },
      async (args) => {
        const result = await handleParseSpec(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    );

    // Get task status tool
    this.server.registerTool(
      'get_task_status',
      {
        title: 'Get Task Status',
        description: 'Get the current status of a feature\'s tasks',
        inputSchema: {
          feature_name: z.string().describe('Name of the feature to check')
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

    // Run tests tool
    this.server.registerTool(
      'run_tests',
      {
        title: 'Run Tests',
        description: 'Run tests for a feature and update task status',
        inputSchema: {
          feature_name: z.string().describe('Name of the feature to test'),
          task_id: z.string().optional().describe('Optional specific task to test')
        }
      },
      async (args) => {
        const result = await handleRunTests(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    );

    // Find similar features tool
    this.server.registerTool(
      'find_similar',
      {
        title: 'Find Similar Features',
        description: 'Find features similar to a given specification',
        inputSchema: {
          spec: z.string().describe('Specification to find similarities for'),
          threshold: z.number().default(0.8).describe('Similarity threshold (0.0 to 1.0)')
        }
      },
      async (args) => {
        const result = await handleFindSimilar(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    );

    // Update task status tool
    this.server.registerTool(
      'update_task_status',
      {
        title: 'Update Task Status',
        description: 'Update the status of a specific task',
        inputSchema: {
          feature_name: z.string().describe('Name of the feature'),
          task_id: z.string().describe('ID of the task to update'),
          status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']).describe('New status for the task'),
          notes: z.string().optional().describe('Optional notes about the status change')
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
