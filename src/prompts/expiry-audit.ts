import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';

export function register(server: McpServer): void {
  server.registerPrompt(
    'expiry_audit',
    {
      title: 'Document expiry audit',
      description:
        'Surface any stored document expiring within a configurable window. Uses metadata only — no consent prompts.',
      argsSchema: {
        window_months: z
          .string()
          .optional()
          .describe('How many months ahead to check (default 6). Pass a positive integer.'),
      },
    },
    ({ window_months }) => {
      const parsed = window_months ? Number.parseInt(window_months, 10) : 6;
      const months = Number.isFinite(parsed) && parsed > 0 ? parsed : 6;

      const text =
        `Audit the user's Safehold documents for upcoming expiries within ${months} months.\n\n` +
        `Steps:\n` +
        `1. Call \`list_documents\`. The response includes \`id\`, \`type\`, \`label\`, and \`expiry_date\` for every document. This needs no consent and exposes no sensitive values.\n` +
        `2. For each document with an \`expiry_date\`, compare it to today and group as:\n` +
        `     EXPIRED — \`expiry_date\` is in the past.\n` +
        `     URGENT — expires within 1 month.\n` +
        `     SOON — expires within 3 months.\n` +
        `     UPCOMING — expires within ${months} months.\n` +
        `   Ignore anything expiring further out.\n` +
        `3. Documents without an \`expiry_date\` are skipped — do not flag them.\n` +
        `4. Present the result as a table or grouped list, ordered by soonest expiry first. Include \`type\`, \`label\`, \`expiry_date\`, and days remaining.\n` +
        `5. For each flagged document, suggest a concrete next step:\n` +
        `     passport / national_id / driving_license → renewal via the issuing authority.\n` +
        `     visa / travel_authorization → re-application or extension.\n` +
        `6. Do NOT call any \`get_*\` retrieval tool. This audit runs on metadata only. Do NOT call \`add_document\`, \`update_document\`, or \`delete_document\`.`;

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
