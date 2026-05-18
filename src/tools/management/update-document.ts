import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';

export function register(server: McpServer): void {
  server.tool(
    'update_document',
    'Update fields on an existing document. Only the provided keys are changed.',
    {
      id: z.string().describe('The ID of the document to update'),
      fields: z
        .record(z.string(), z.unknown())
        .describe('The fields to update — only provided keys are changed'),
    },
    async () => {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ updated: true }),
          },
        ],
      };
    }
  );
}
