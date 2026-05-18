import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';

const VISA_FIELDS = [
  'visa_type',
  'issuing_country',
  'issue_date',
  'expiry_date',
  'entries_allowed',
  'reference_number',
] as const;

const STUB_DATA: Record<(typeof VISA_FIELDS)[number], string> = {
  visa_type: 'STUB_TYPE',
  issuing_country: 'STUB_COUNTRY',
  issue_date: '2024-01-01',
  expiry_date: '2026-01-01',
  entries_allowed: 'multiple',
  reference_number: 'STUB-VISA-001',
};

export function register(server: McpServer): void {
  server.tool(
    'get_visa',
    'Retrieve specific fields from a stored visa. The user will be prompted for consent before any data is returned.',
    {
      fields: z
        .array(z.enum(VISA_FIELDS))
        .min(1)
        .describe('The visa fields to retrieve'),
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
            text: JSON.stringify({ document_type: 'visa', fields: result, purpose }),
          },
        ],
      };
    }
  );
}
