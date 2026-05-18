import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function register(server: McpServer): void {
  server.tool(
    'list_documents',
    'List all stored documents. Returns metadata only (type, label, expiry) — no sensitive field values.',
    {},
    async () => {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ documents: [] }),
          },
        ],
      };
    }
  );
}
