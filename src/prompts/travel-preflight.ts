import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';

export function register(server: McpServer): void {
  server.registerPrompt(
    'travel_preflight',
    {
      title: 'Travel pre-flight check',
      description:
        'Verify passport and visa validity for an upcoming trip. Reads only the fields it needs and explains why.',
      argsSchema: {
        destination_country: z.string().describe('Country the user is travelling to'),
        travel_date: z.string().describe('Departure date in ISO 8601 (YYYY-MM-DD)'),
        return_date: z
          .string()
          .optional()
          .describe('Return date in ISO 8601 (YYYY-MM-DD), if known'),
      },
    },
    ({ destination_country, travel_date, return_date }) => {
      const tripWindow = return_date
        ? `departure ${travel_date}, return ${return_date}`
        : `departure ${travel_date}`;
      const expiryReference = return_date ?? travel_date;
      const purpose = `Travel pre-flight check for ${destination_country} (${tripWindow})`;

      const text =
        `You are running a pre-flight check for a trip to ${destination_country} (${tripWindow}).\n\n` +
        `Steps:\n` +
        `1. Call \`list_documents\` to see what is in the vault. This needs no consent.\n` +
        `2. For each passport in the list, call \`get_passport\` with:\n` +
        `     fields: ["expiry_date", "nationality", "issuing_country"]\n` +
        `     purpose: "${purpose}"\n` +
        `   The user will be asked to consent; phrase the purpose exactly as above.\n` +
        `3. For each visa whose \`issuing_country\` is "${destination_country}", call \`get_visa\` with:\n` +
        `     fields: ["visa_type", "issue_date", "expiry_date", "entries_allowed"]\n` +
        `     purpose: "${purpose}"\n` +
        `4. Evaluate:\n` +
        `     - RED: passport \`expiry_date\` is before ${expiryReference}, or no passport exists.\n` +
        `     - YELLOW: passport \`expiry_date\` is within 6 months of ${expiryReference} (many countries require 6 months validity beyond entry).\n` +
        `     - GREEN: passport \`expiry_date\` is more than 6 months after ${expiryReference}.\n` +
        `     - Also flag any visa whose \`expiry_date\` is before ${expiryReference}, or whose \`entries_allowed\` looks exhausted.\n` +
        `5. Report results to the user grouped by severity. Be specific about which document and which field triggered each flag.\n` +
        `6. If the destination commonly requires a visa or travel authorisation (ESTA, eTA, Schengen, etc.) and none is stored, mention that as an UNKNOWN — do not assert the user lacks one, just flag the gap.\n\n` +
        `Do not call \`add_document\`, \`update_document\`, or \`delete_document\` during this check.`;

      return {
        messages: [
          {
            role: 'user',
            content: { type: 'text', text },
          },
        ],
      };
    }
  );
}
