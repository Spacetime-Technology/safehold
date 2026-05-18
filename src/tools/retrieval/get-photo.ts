import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { getDocumentByType } from '../../storage/vault.js';
import { appendLogEntry } from '../../storage/access-log-store.js';

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
    },
    async ({ type, purpose }) => {
      try {
        const doc = getDocumentByType(vaultDir, key, `photo_${type}`);
        if (!doc) {
          return {
            content: [
              { type: 'text', text: JSON.stringify({ error: `No ${type} photo found in vault` }) },
            ],
            isError: true,
          };
        }
        appendLogEntry(vaultDir, key, {
          tool_name: 'get_photo',
          client_name: server.server.getClientVersion()?.name ?? 'unknown',
          fields_requested: [type],
          purpose,
          document_id: doc.id,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                data: doc.fields['data'],
                mime_type: doc.fields['mime_type'],
                photo_type: type,
                purpose,
              }),
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
