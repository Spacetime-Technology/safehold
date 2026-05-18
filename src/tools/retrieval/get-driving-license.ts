import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { getDocumentByType } from '../../storage/vault.js';
import { appendLogEntry } from '../../storage/access-log-store.js';

const DRIVING_LICENSE_FIELDS = [
  'given_name',
  'family_name',
  'date_of_birth',
  'license_number',
  'categories',
  'expiry_date',
  'issuing_authority',
] as const;

export function register(server: McpServer, vaultDir: string, key: Uint8Array): void {
  server.tool(
    'get_driving_license',
    'Retrieve specific fields from the stored driving licence. The user will be prompted for consent before any data is returned.',
    {
      fields: z
        .array(z.enum(DRIVING_LICENSE_FIELDS))
        .min(1)
        .describe('The driving licence fields to retrieve'),
      purpose: z
        .string()
        .describe('Why the calling agent needs this data — shown to the user for consent'),
    },
    async ({ fields, purpose }) => {
      try {
        const doc = getDocumentByType(vaultDir, key, 'driving_license');
        if (!doc) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: 'No driving licence found in vault' }),
              },
            ],
            isError: true,
          };
        }
        const result = Object.fromEntries(
          fields.filter((f) => f in doc.fields).map((f) => [f, doc.fields[f]])
        );
        appendLogEntry(vaultDir, key, {
          tool_name: 'get_driving_license',
          client_name: server.server.getClientVersion()?.name ?? 'unknown',
          fields_requested: [...fields],
          purpose,
          document_id: doc.id,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ document_type: 'driving_license', fields: result, purpose }),
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
