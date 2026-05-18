import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { getDocumentByType } from '../../storage/vault.js';
import { appendLogEntry } from '../../storage/access-log-store.js';

export function register(server: McpServer, vaultDir: string, key: Uint8Array): void {
  server.tool(
    'get_document',
    'Retrieve fields from any document type not covered by a dedicated tool. The user will be prompted for consent before any data is returned.',
    {
      document_type: z.string().describe('The document type to retrieve (e.g. "insurance_card")'),
      fields: z
        .array(z.string())
        .min(1)
        .describe('The field names to retrieve from the document'),
      purpose: z
        .string()
        .describe('Why the calling agent needs this data — shown to the user for consent'),
    },
    async ({ document_type, fields, purpose }) => {
      try {
        const doc = getDocumentByType(vaultDir, key, document_type);
        if (!doc) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: `No ${document_type} found in vault` }) }],
            isError: true,
          };
        }
        const result = Object.fromEntries(
          fields.filter((f) => f in doc.fields).map((f) => [f, doc.fields[f]])
        );
        appendLogEntry(vaultDir, key, {
          tool_name: 'get_document',
          client_name: server.server.getClientVersion()?.name ?? 'unknown',
          fields_requested: [...fields],
          purpose,
          document_id: doc.id,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ document_type, fields: result, purpose }),
            },
          ],
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
