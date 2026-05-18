import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { retrieveWithConsent } from '../shared/with-consent.js';

const PHOTO_TYPES = ['passport_style', 'selfie', 'signature'] as const;

export function register(server: McpServer, vaultDir: string, key: Uint8Array): void {
  server.tool(
    'get_photo',
    'Retrieve a stored photo. Returns base64-encoded image data. The user will be prompted for consent before any data is returned.',
    {
      type: z.enum(PHOTO_TYPES).describe('The type of photo to retrieve'),
      purpose: z
        .string()
        .min(1)
        .max(500)
        .describe('Why the calling agent needs this photo — shown to the user for consent'),
      document_id: z
        .string()
        .optional()
        .describe('Specific photo id (required when more than one of this type is stored)'),
    },
    async ({ type, purpose, document_id }) => {
      try {
        return await retrieveWithConsent(server, vaultDir, key, {
          toolName: 'get_photo',
          documentType: `photo_${type}`,
          documentTypeLabel: `${type.replace('_', ' ')} photo`,
          fields: [type],
          purpose,
          shape: 'photo',
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
