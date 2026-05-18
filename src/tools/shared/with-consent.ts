import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getDocumentsByType, getDocumentById, type StoredDocument } from '../../storage/vault.js';
import { appendLogEntry } from '../../storage/access-log-store.js';
import type { AccessOutcome } from '../../types/access-log.js';

function textResult(payload: unknown, isError = false): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload) }],
    ...(isError ? { isError: true } : {}),
  };
}

function clientName(server: McpServer): string {
  return server.server.getClientVersion()?.name ?? 'unknown';
}

function clientSupportsElicitation(server: McpServer): boolean {
  return server.server.getClientCapabilities()?.elicitation !== undefined;
}

async function requestConsent(
  server: McpServer,
  params: {
    toolName: string;
    documentType: string;
    documentLabel: string;
    fields: string[];
    purpose: string;
  }
): Promise<AccessOutcome> {
  if (!clientSupportsElicitation(server)) return 'auto';
  const message =
    `${params.toolName} wants to read fields from your ${params.documentType} (${params.documentLabel}).\n\n` +
    `Fields: ${params.fields.join(', ')}\n` +
    `Purpose: ${params.purpose}\n` +
    `Requested by: ${clientName(server)}\n\n` +
    `Approve this access?`;
  try {
    const res = await server.server.elicitInput({
      message,
      requestedSchema: {
        type: 'object',
        properties: {
          approve: {
            type: 'boolean',
            title: 'Approve access',
            description: 'Allow the requested fields to be shared',
          },
        },
        required: ['approve'],
      },
    });
    if (res.action !== 'accept') return 'declined';
    const approve = (res.content as Record<string, unknown> | undefined)?.['approve'];
    return approve === true ? 'accepted' : 'declined';
  } catch {
    return 'auto';
  }
}

export interface RetrievalConfig {
  toolName: string;
  documentType: string;
  documentTypeLabel: string;
  fields: string[];
  purpose: string;
  documentId?: string;
  shape?: 'fields' | 'photo';
}

export async function retrieveWithConsent(
  server: McpServer,
  vaultDir: string,
  key: Uint8Array,
  cfg: RetrievalConfig
): Promise<CallToolResult> {
  let doc: StoredDocument | null = null;
  if (cfg.documentId !== undefined) {
    doc = getDocumentById(vaultDir, key, cfg.documentId);
    if (!doc || doc.document_type !== cfg.documentType) {
      return textResult(
        {
          error: `No ${cfg.documentTypeLabel} with id ${cfg.documentId} found in vault`,
        },
        true
      );
    }
  } else {
    const matches = getDocumentsByType(vaultDir, key, cfg.documentType);
    if (matches.length === 0) {
      return textResult({ error: `No ${cfg.documentTypeLabel} found in vault` }, true);
    }
    if (matches.length > 1) {
      return textResult(
        {
          error: `Multiple ${cfg.documentTypeLabel} documents found — specify document_id`,
          candidates: matches.map((d) => ({ id: d.id, label: d.label })),
        },
        true
      );
    }
    doc = matches[0]!;
  }

  const outcome = await requestConsent(server, {
    toolName: cfg.toolName,
    documentType: cfg.documentTypeLabel,
    documentLabel: doc.label,
    fields: cfg.fields,
    purpose: cfg.purpose,
  });

  appendLogEntry(vaultDir, key, {
    tool_name: cfg.toolName,
    client_name: clientName(server),
    fields_requested: [...cfg.fields],
    purpose: cfg.purpose,
    document_id: doc.id,
    outcome,
  });

  if (outcome === 'declined') {
    return textResult({ error: 'Access denied by user', outcome }, true);
  }

  if (cfg.shape === 'photo') {
    return textResult({
      data: doc.fields['data'],
      mime_type: doc.fields['mime_type'],
      photo_type: cfg.fields[0],
      document_id: doc.id,
      purpose: cfg.purpose,
      outcome,
      consent_method: outcome === 'auto' ? 'host-approval' : 'elicitation',
    });
  }

  const available = cfg.fields.filter((f) => f in doc.fields);
  const unavailable = cfg.fields.filter((f) => !(f in doc.fields));
  const result = Object.fromEntries(available.map((f) => [f, doc.fields[f]]));
  return textResult({
    document_type: cfg.documentType,
    document_id: doc.id,
    fields: result,
    unavailable_fields: unavailable,
    purpose: cfg.purpose,
    outcome,
    consent_method: outcome === 'auto' ? 'host-approval' : 'elicitation',
  });
}
