import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { getDocumentByType } from '../../storage/vault.js';
import { appendLogEntry } from '../../storage/access-log-store.js';

const NATIONAL_ID_FIELDS = [
  'given_name',
  'family_name',
  'date_of_birth',
  'id_number',
  'nationality',
  'expiry_date',
  'issuing_country',
] as const;

export function register(server: McpServer, vaultDir: string, key: Uint8Array): void {
  server.tool(
    'get_national_id',
    'Retrieve specific fields from the stored national identity card. The user will be prompted for consent before any data is returned.',
    {
      fields: z
        .array(z.enum(NATIONAL_ID_FIELDS))
        .min(1)
        .describe('The national ID fields to retrieve'),
      purpose: z
        .string()
        .min(1)
        .max(500)
        .describe('Why the calling agent needs this data — shown to the user for consent'),
    },
    async ({ fields, purpose }) => {
      try {
        const doc = getDocumentByType(vaultDir, key, 'national_id');
        if (!doc) {
          return {
            content: [
              { type: 'text', text: JSON.stringify({ error: 'No national ID found in vault' }) },
            ],
            isError: true,
          };
        }
        const result = Object.fromEntries(
          fields.filter((f) => f in doc.fields).map((f) => [f, doc.fields[f]])
        );
        appendLogEntry(vaultDir, key, {
          tool_name: 'get_national_id',
          client_name: server.server.getClientVersion()?.name ?? 'unknown',
          fields_requested: [...fields],
          purpose,
          document_id: doc.id,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ document_type: 'national_id', fields: result, purpose }),
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
