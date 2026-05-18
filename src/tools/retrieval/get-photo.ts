import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';

// Minimal 1x1 transparent PNG as a placeholder stub
const STUB_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export function register(server: McpServer): void {
  server.tool(
    'get_photo',
    'Retrieve a stored photo. Returns base64-encoded image data. The user will be prompted for consent before any data is returned.',
    {
      type: z
        .enum(['passport_style', 'selfie', 'signature'])
        .describe('The type of photo to retrieve'),
      purpose: z
        .string()
        .describe('Why the calling agent needs this photo — shown to the user for consent'),
    },
    async ({ type, purpose }) => {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              data: STUB_PNG_BASE64,
              mime_type: 'image/png',
              photo_type: type,
              purpose,
            }),
          },
        ],
      };
    }
  );
}
