import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { getLogEntries } from '../../storage/access-log-store.js';

export function register(server: McpServer, vaultDir: string, key: Uint8Array): void {
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
    async ({ limit, document_id }) => {
      try {
        const entries = getLogEntries(vaultDir, key, {
          ...(document_id !== undefined ? { document_id } : {}),
          ...(limit !== undefined ? { limit } : {}),
        });
        return {
          content: [{ type: 'text', text: JSON.stringify({ entries }) }],
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
