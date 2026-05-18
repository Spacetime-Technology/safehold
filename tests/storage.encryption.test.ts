import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { type Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClientWithDir } from './helpers/create-test-client.js';

describe('Encryption at rest', () => {
  let client: Client;
  let vaultDir: string;
  let cleanup: () => Promise<void>;

  const PLAINTEXT_MARKER = 'PLAINTEXT_LEAK_SENTINEL_VALUE_8675309';

  beforeAll(async () => {
    ({ client, vaultDir, cleanup } = await createTestClientWithDir());
    await client.callTool({
      name: 'add_document',
      arguments: {
        document_type: 'passport',
        label: 'Encryption Test Passport',
        fields: { given_name: PLAINTEXT_MARKER, passport_number: 'X1234567' },
      },
    });
  });

  afterAll(async () => {
    await cleanup();
  });

  it('vault directory has 0700 permissions', () => {
    if (process.platform === 'win32') return;
    const mode = statSync(vaultDir).mode & 0o777;
    expect(mode & 0o077).toBe(0);
  });

  it('encrypted blob does not contain plaintext field values', () => {
    const vaultSubdir = join(vaultDir, 'vault');
    const files = readdirSync(vaultSubdir).filter((f) => f.endsWith('.enc'));
    expect(files.length).toBe(1);
    const blob = readFileSync(join(vaultSubdir, files[0]!));
    const asString = blob.toString('binary');
    expect(asString).not.toContain(PLAINTEXT_MARKER);
    expect(asString).not.toContain('X1234567');
    expect(asString).not.toContain('passport_number');
  });

  it('access log file does not contain plaintext purpose values', async () => {
    await client.callTool({
      name: 'get_passport',
      arguments: { fields: ['given_name'], purpose: 'SUPER_SECRET_PURPOSE_MARKER_42' },
    });
    const logBlob = readFileSync(join(vaultDir, 'access-log.enc'));
    expect(logBlob.toString('binary')).not.toContain('SUPER_SECRET_PURPOSE_MARKER_42');
  });
});
