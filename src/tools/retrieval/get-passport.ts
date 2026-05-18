import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { retrieveWithConsent } from '../shared/with-consent.js';
import { PASSPORT_FIELDS } from '../../types/document-fields.js';

export function register(server: McpServer, vaultDir: string, key: Uint8Array): void {
  server.tool(
    'get_passport',
    'Retrieve specific fields from a stored passport. The user will be prompted for consent before any data is returned.',
    {
      fields: z.array(z.enum(PASSPORT_FIELDS)).min(1).describe('The passport fields to retrieve'),
      purpose: z
        .string()
        .min(1)
        .max(500)
        .describe('Why the calling agent needs this data — shown to the user for consent'),
      document_id: z
        .string()
        .optional()
        .describe('Specific passport id (required when more than one passport is stored)'),
    },
    async ({ fields, purpose, document_id }) => {
      try {
        return await retrieveWithConsent(server, vaultDir, key, {
          toolName: 'get_passport',
          documentType: 'passport',
          documentTypeLabel: 'passport',
          fields: [...fields],
          purpose,
          ...(document_id !== undefined ? { documentId: document_id } : {}),
        });
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
