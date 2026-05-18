import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';

export function register(server: McpServer): void {
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
      const result = Object.fromEntries(fields.map((f) => [f, `STUB_${f.toUpperCase()}`]));
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ document_type, fields: result, purpose }),
          },
        ],
      };
    }
  );
}
