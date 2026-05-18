import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { getDocumentByType } from '../../storage/vault.js';
import { appendLogEntry } from '../../storage/access-log-store.js';

const VISA_FIELDS = [
  'visa_type',
  'issuing_country',
  'issue_date',
  'expiry_date',
  'entries_allowed',
  'reference_number',
] as const;

export function register(server: McpServer, vaultDir: string, key: Uint8Array): void {
  server.tool(
    'get_visa',
    'Retrieve specific fields from a stored visa. The user will be prompted for consent before any data is returned.',
    {
      fields: z.array(z.enum(VISA_FIELDS)).min(1).describe('The visa fields to retrieve'),
      purpose: z
        .string()
        .describe('Why the calling agent needs this data — shown to the user for consent'),
    },
    async ({ fields, purpose }) => {
      try {
        const doc = getDocumentByType(vaultDir, key, 'visa');
        if (!doc) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: 'No visa found in vault' }) }],
            isError: true,
          };
        }
        const result = Object.fromEntries(
          fields.filter((f) => f in doc.fields).map((f) => [f, doc.fields[f]])
        );
        appendLogEntry(vaultDir, key, {
          tool_name: 'get_visa',
          client_name: server.server.getClientVersion()?.name ?? 'unknown',
          fields_requested: [...fields],
          purpose,
          document_id: doc.id,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ document_type: 'visa', fields: result, purpose }),
            },
          ],
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
