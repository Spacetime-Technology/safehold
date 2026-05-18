import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { updateDocument, getDocumentById } from '../../storage/vault.js';
import { validateDocumentFields } from '../../schemas/documents.js';

export function register(server: McpServer, vaultDir: string, key: Uint8Array): void {
  server.tool(
    'update_document',
    'Update fields on an existing document. Only the provided keys are changed. Known document types are strictly validated.',
    {
      id: z.string().describe('The ID of the document to update'),
      fields: z
        .record(z.string(), z.unknown())
        .describe('The fields to update — only provided keys are changed'),
    },
    async ({ id, fields }) => {
      try {
        const existing = getDocumentById(vaultDir, key, id);
        if (existing) {
          const validation = validateDocumentFields(existing.document_type, fields);
          if (!validation.ok) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: validation.error }) }],
              isError: true,
            };
          }
        }
        const updated = updateDocument(vaultDir, key, id, fields);
        return {
          content: [{ type: 'text', text: JSON.stringify({ updated }) }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: err instanceof Error ? err.message : 'Internal error',
              }),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
