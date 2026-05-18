import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';

const NATIONAL_ID_FIELDS = [
  'given_name',
  'family_name',
  'date_of_birth',
  'id_number',
  'nationality',
  'expiry_date',
  'issuing_country',
] as const;

const STUB_DATA: Record<(typeof NATIONAL_ID_FIELDS)[number], string> = {
  given_name: 'STUB_GIVEN_NAME',
  family_name: 'STUB_FAMILY_NAME',
  date_of_birth: '1990-01-01',
  id_number: 'STUB-ID-001',
  nationality: 'STUB_NATIONALITY',
  expiry_date: '2030-01-01',
  issuing_country: 'STUB_COUNTRY',
};

export function register(server: McpServer): void {
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
        .describe('Why the calling agent needs this data — shown to the user for consent'),
    },
    async ({ fields, purpose }) => {
      const result = Object.fromEntries(fields.map((f) => [f, STUB_DATA[f]]));
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ document_type: 'national_id', fields: result, purpose }),
          },
        ],
      };
    }
  );
}
