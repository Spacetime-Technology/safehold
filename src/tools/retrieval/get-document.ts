import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { retrieveWithConsent } from '../shared/with-consent.js';

export function register(server: McpServer, vaultDir: string, key: Uint8Array): void {
  server.tool(
    'get_document',
    'Retrieve fields from any document type not covered by a dedicated tool. The user will be prompted for consent before any data is returned.',
    {
      document_type: z
        .string()
        .min(1)
        .max(64)
        .describe('The document type to retrieve (e.g. "insurance_card")'),
      fields: z
        .array(z.string().min(1).max(64))
        .min(1)
        .describe('The field names to retrieve from the document'),
      purpose: z
        .string()
        .min(1)
        .max(500)
        .describe('Why the calling agent needs this data — shown to the user for consent'),
      document_id: z
        .string()
        .optional()
        .describe('Specific document id (required when more than one of this type is stored)'),
    },
    async ({ document_type, fields, purpose, document_id }) => {
      try {
        return await retrieveWithConsent(server, vaultDir, key, {
          toolName: 'get_document',
          documentType: document_type,
          documentTypeLabel: document_type,
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
