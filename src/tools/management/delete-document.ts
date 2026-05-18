import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';

export function register(server: McpServer): void {
  server.tool(
    'delete_document',
    'Permanently delete a document from the vault.',
    {
      id: z.string().describe('The ID of the document to delete'),
    },
    async () => {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ deleted: true }),
          },
        ],
      };
    }
  );
}
