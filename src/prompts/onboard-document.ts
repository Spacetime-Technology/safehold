import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { DOCUMENT_FIELDS, DOCUMENT_TYPE_LABELS } from '../types/document-fields.js';

const DOCUMENT_TYPES = ['passport', 'national_id', 'driving_license', 'visa'] as const;
const MODES = ['add', 'update'] as const;

export function register(server: McpServer): void {
  server.registerPrompt(
    'onboard_document',
    {
      title: 'Onboard a document',
      description:
        'Guided intake to add or update a passport, national ID, driving licence, or visa in Safehold.',
      argsSchema: {
        document_type: z.enum(DOCUMENT_TYPES).describe('Which document type to onboard'),
        mode: z
          .enum(MODES)
          .optional()
          .describe('"add" for a new document (default), "update" to modify an existing one'),
        document_id: z
          .string()
          .optional()
          .describe('Existing document id when mode=update (omit to let the user pick)'),
      },
    },
    ({ document_type, mode, document_id }) => {
      const docType = document_type;
      const resolvedMode = mode ?? 'add';
      const label = DOCUMENT_TYPE_LABELS[docType];
      const fields = DOCUMENT_FIELDS[docType];
      const fieldList = fields.map((f) => `  - ${f}`).join('\n');

      const updateBlock =
        resolvedMode === 'update'
          ? document_id
            ? `The user wants to update document_id "${document_id}". Confirm with the user that this is the right document before changing anything.`
            : `The user wants to update an existing ${label}. First call \`list_documents\` and ask the user which document_id to update.`
          : '';

      const callTool =
        resolvedMode === 'add'
          ? `\`add_document\` with document_type="${docType}", a short \`label\` (e.g. the holder's name), and a \`fields\` object containing every value you collected.`
          : `\`update_document\` with the document_id and a \`fields\` object containing only the changed fields.`;

      const text =
        `You are helping the user ${resolvedMode === 'add' ? 'add a new' : 'update an existing'} ${label} in Safehold.\n\n` +
        (updateBlock ? `${updateBlock}\n\n` : '') +
        `Collect each of these fields from the user, one at a time. Do not invent values; if the user does not know a field, leave it out rather than guessing.\n\n` +
        `Required fields for a ${label}:\n${fieldList}\n\n` +
        `Validation rules:\n` +
        `  - Dates must be ISO 8601 (YYYY-MM-DD).\n` +
        `  - If \`expiry_date\` is in the past, warn the user and confirm they still want to store it.\n` +
        `  - If \`expiry_date\` is within 6 months of today, flag it so the user can plan a renewal.\n` +
        (docType === 'driving_license'
          ? `  - "categories" is an array of licence categories (e.g. ["B", "A1"]).\n`
          : '') +
        `\n` +
        `When you have all the fields the user is willing to provide, call ${callTool}\n\n` +
        `After the call succeeds, confirm the saved \`label\` and \`id\` back to the user. Do not call any \`get_*\` retrieval tool — onboarding only writes.`;

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
