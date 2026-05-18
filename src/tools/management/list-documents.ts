import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listDocuments } from '../../storage/vault.js';

export function register(server: McpServer, vaultDir: string, key: Uint8Array): void {
  server.tool(
    'list_documents',
    'List all stored documents. Returns metadata only (type, label, expiry) — no sensitive field values.',
    {},
    async () => {
      try {
        const documents = listDocuments(vaultDir, key);
        return {
          content: [{ type: 'text', text: JSON.stringify({ documents }) }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: err instanceof Error ? err.message : 'Internal error',
              }),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
