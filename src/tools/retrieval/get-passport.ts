import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';

const PASSPORT_FIELDS = [
  'given_name',
  'family_name',
  'nationality',
  'date_of_birth',
  'passport_number',
  'expiry_date',
  'issuing_country',
  'gender',
] as const;

const STUB_DATA: Record<(typeof PASSPORT_FIELDS)[number], string> = {
  given_name: 'STUB_GIVEN_NAME',
  family_name: 'STUB_FAMILY_NAME',
  nationality: 'STUB_NATIONALITY',
  date_of_birth: '1990-01-01',
  passport_number: 'STUB123456',
  expiry_date: '2030-01-01',
  issuing_country: 'STUB_COUNTRY',
  gender: 'STUB_GENDER',
};

export function register(server: McpServer): void {
  server.tool(
    'get_passport',
    'Retrieve specific fields from the stored passport. The user will be prompted for consent before any data is returned.',
    {
      fields: z
        .array(z.enum(PASSPORT_FIELDS))
        .min(1)
        .describe('The passport fields to retrieve'),
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
            text: JSON.stringify({ document_type: 'passport', fields: result, purpose }),
          },
        ],
      };
    }
  );
}
