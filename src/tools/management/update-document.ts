import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { updateDocument } from '../../storage/vault.js';

export function register(server: McpServer, vaultDir: string, key: Uint8Array): void {
  server.tool(
    'update_document',
    'Update fields on an existing document. Only the provided keys are changed.',
    {
      id: z.string().describe('The ID of the document to update'),
      fields: z
        .record(z.string(), z.unknown())
        .describe('The fields to update — only provided keys are changed'),
    },
    async ({ id, fields }) => {
      try {
        const updated = updateDocument(vaultDir, key, id, fields);
        return {
          content: [{ type: 'text', text: JSON.stringify({ updated }) }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }) }],
          isError: true,
        };
      }
    }
  );
}
