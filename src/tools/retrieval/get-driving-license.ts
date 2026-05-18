import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';

const DRIVING_LICENSE_FIELDS = [
  'given_name',
  'family_name',
  'date_of_birth',
  'license_number',
  'categories',
  'expiry_date',
  'issuing_authority',
] as const;

const STUB_DATA: Record<(typeof DRIVING_LICENSE_FIELDS)[number], string> = {
  given_name: 'STUB_GIVEN_NAME',
  family_name: 'STUB_FAMILY_NAME',
  date_of_birth: '1990-01-01',
  license_number: 'STUB-DL-001',
  categories: 'B,BE',
  expiry_date: '2030-01-01',
  issuing_authority: 'STUB_AUTHORITY',
};

export function register(server: McpServer): void {
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
      const result = Object.fromEntries(fields.map((f) => [f, STUB_DATA[f]]));
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ document_type: 'driving_license', fields: result, purpose }),
          },
        ],
      };
    }
  );
}
