import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, statSync } from 'node:fs';
import { loadOrCreateKey } from './storage/key.js';
import { encrypt, decrypt } from './storage/crypto.js';
import { VERSION } from './version.js';
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
import { register as registerOnboardDocumentPrompt } from './prompts/onboard-document.js';
import { register as registerTravelPreflightPrompt } from './prompts/travel-preflight.js';
import { register as registerSelectiveSharePrompt } from './prompts/selective-share.js';
import { register as registerExpiryAuditPrompt } from './prompts/expiry-audit.js';

function assertVaultReady(vaultDir: string, key: Uint8Array): void {
  mkdirSync(join(vaultDir, 'vault'), { recursive: true, mode: 0o700 });
  if (platform() !== 'win32') {
    try {
      const mode = statSync(vaultDir).mode & 0o777;
      if ((mode & 0o077) !== 0) {
        process.stderr.write(
          `safehold: warning — vault directory ${vaultDir} has loose permissions (${mode.toString(8)}). Expected 0700.\n`
        );
      }
    } catch {
      // best-effort
    }
  }
  const probe = new Uint8Array([1, 2, 3]);
  const decrypted = decrypt(key, encrypt(key, probe));
  if (!decrypted || decrypted[0] !== 1) {
    throw new Error('Vault self-test failed — encryption round-trip did not match');
  }
}

export function createServer(vaultDir?: string): McpServer {
  const resolvedVaultDir =
    vaultDir ?? process.env['SAFEHOLD_VAULT_DIR'] ?? join(homedir(), '.safehold');
  const key = loadOrCreateKey(resolvedVaultDir);
  assertVaultReady(resolvedVaultDir, key);

  const server = new McpServer(
    { name: 'safehold', version: VERSION },
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

  registerOnboardDocumentPrompt(server);
  registerTravelPreflightPrompt(server);
  registerSelectiveSharePrompt(server);
  registerExpiryAuditPrompt(server);

  return server;
}
