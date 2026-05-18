import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { loadOrCreateKey } from './storage/key.js';
import { register as registerGetPassport } from './tools/retrieval/get-passport.js';
import { register as registerGetNationalId } from './tools/retrieval/get-national-id.js';
import { register as registerGetDrivingLicense } from './tools/retrieval/get-driving-license.js';
import { register as registerGetVisa } from './tools/retrieval/get-visa.js';
import { register as registerGetPhoto } from './tools/retrieval/get-photo.js';
import { register as registerGetDocument } from './tools/retrieval/get-document.js';
import { register as registerListDocuments } from './tools/management/list-documents.js';
import { register as registerAddDocument } from './tools/management/add-document.js';
import { register as registerDeleteDocument } from './tools/management/delete-document.js';
import { register as registerUpdateDocument } from './tools/management/update-document.js';
import { register as registerGetAccessLog } from './tools/management/get-access-log.js';

export function createServer(vaultDir?: string): McpServer {
  const resolvedVaultDir =
    vaultDir ?? process.env['SAFEHOLD_VAULT_DIR'] ?? join(homedir(), '.safehold');
  const key = loadOrCreateKey(resolvedVaultDir);

  const server = new McpServer(
    { name: 'safehold', version: '0.1.0' },
    {
      instructions:
        'Safehold stores identity documents locally and encrypted. ' +
        'Every field access requires explicit user consent. ' +
        'Always provide a clear purpose when requesting document fields.',
    }
  );

  registerGetPassport(server, resolvedVaultDir, key);
  registerGetNationalId(server, resolvedVaultDir, key);
  registerGetDrivingLicense(server, resolvedVaultDir, key);
  registerGetVisa(server, resolvedVaultDir, key);
  registerGetPhoto(server, resolvedVaultDir, key);
  registerGetDocument(server, resolvedVaultDir, key);

  registerListDocuments(server, resolvedVaultDir, key);
  registerAddDocument(server, resolvedVaultDir, key);
  registerDeleteDocument(server, resolvedVaultDir, key);
  registerUpdateDocument(server, resolvedVaultDir, key);
  registerGetAccessLog(server, resolvedVaultDir, key);

  return server;
}
