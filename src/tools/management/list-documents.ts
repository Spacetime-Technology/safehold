import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listDocuments } from '../../storage/vault.js';

export function register(server: McpServer, vaultDir: string, key: Uint8Array): void {
  server.tool(
    'list_documents',
    'List all stored documents. Returns metadata only (type, label, expiry) — no sensitive field values.',
    {},
    async () => {
      const documents = listDocuments(vaultDir, key);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ documents }),
          },
        ],
      };
    }
  );
}
