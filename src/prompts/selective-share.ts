import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';

export function register(server: McpServer): void {
  server.registerPrompt(
    'selective_share',
    {
      title: 'Selective identity sharing',
      description:
        'Help the user share the minimum data a service actually needs, with an explicit consent purpose.',
      argsSchema: {
        service_name: z.string().describe('The service or form asking for data'),
        requested_data_description: z
          .string()
          .describe("What the service is asking for, in the user's own words"),
      },
    },
    ({ service_name, requested_data_description }) => {
      const purpose = `Share with ${service_name}: ${requested_data_description}`.slice(0, 500);

      const text =
        `${service_name} has asked the user for:\n` +
        `  "${requested_data_description}"\n\n` +
        `Your job is to minimise what the user discloses. Steps:\n\n` +
        `1. Parse the request into a concrete field list. For each requested item, map it to the smallest set of Safehold fields that satisfies it. Examples:\n` +
        `     - "date of birth" → date_of_birth (one field, do not also share full name).\n` +
        `     - "proof of identity" → ask the user which document they want to use, then pick the minimum identifying fields.\n` +
        `     - "nationality" → nationality (do not share passport_number unless the service explicitly asked for it).\n` +
        `2. Call \`list_documents\` to see which documents could fulfil the request. This needs no consent.\n` +
        `3. Show the user a proposal in this format before calling any \`get_*\` tool:\n` +
        `     Document: <label> (<type>)\n` +
        `     Fields to share: <comma-separated field names>\n` +
        `     Purpose that will be shown at consent: "${purpose}"\n` +
        `   Ask the user to confirm, reduce, or change the document.\n` +
        `4. Only after explicit confirmation, call the appropriate \`get_*\` tool with that exact \`fields\` array and \`purpose\`. Use \`get_document\` for document types that do not have a dedicated tool.\n` +
        `5. Return the retrieved values to the user clearly, and remind them which service they are about to share with.\n\n` +
        `Rules:\n` +
        `  - Never request a field the service did not actually ask for.\n` +
        `  - Never request \`passport_number\`, \`id_number\`, or \`license_number\` if the service only asked for a name or DOB.\n` +
        `  - If the request is ambiguous, ask the user what to share before proceeding.\n` +
        `  - Do not call \`add_document\`, \`update_document\`, or \`delete_document\`.`;

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
