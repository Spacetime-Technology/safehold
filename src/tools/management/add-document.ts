import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { addDocument } from '../../storage/vault.js';

export function register(server: McpServer, vaultDir: string, key: Uint8Array): void {
  server.tool(
    'add_document',
    'Add a new document to the vault. The document is stored locally and encrypted.',
    {
      document_type: z.string().describe('The type of document (e.g. "passport", "visa")'),
      label: z
        .string()
        .describe('A human-readable label for this document, e.g. "UK Passport 2024"'),
      fields: z.record(z.string(), z.unknown()).describe('The document field values to store'),
    },
    async ({ document_type, label, fields }) => {
      const doc = addDocument(vaultDir, key, { document_type, label, fields });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ id: doc.id, created: true }),
          },
        ],
      };
    }
  );
}
