import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';

export function register(server: McpServer): void {
  server.tool(
    'get_access_log',
    'View the history of document field accesses — what was shared, with which client, and when.',
    {
      limit: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Maximum number of log entries to return (default 50)'),
      document_id: z
        .string()
        .optional()
        .describe('Filter entries to a specific document ID'),
    },
    async () => {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ entries: [] }),
          },
        ],
      };
    }
  );
}
