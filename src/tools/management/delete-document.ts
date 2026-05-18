import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { deleteDocument } from '../../storage/vault.js';

export function register(server: McpServer, vaultDir: string, key: Uint8Array): void {
  server.tool(
    'delete_document',
    'Permanently delete a document from the vault.',
    {
      id: z.string().describe('The ID of the document to delete'),
    },
    async ({ id }) => {
      try {
        const deleted = deleteDocument(vaultDir, key, id);
        return {
          content: [{ type: 'text', text: JSON.stringify({ deleted }) }],
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
