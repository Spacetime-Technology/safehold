import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { type Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClientWithDir } from './helpers/create-test-client.js';
import { parseToolResult } from './helpers/parse-tool-result.js';

describe('Error handling', () => {
  describe('corrupted vault file', () => {
    let client: Client;
    let vaultDir: string;
    let cleanup: () => Promise<void>;

    beforeAll(async () => {
      ({ client, vaultDir, cleanup } = await createTestClientWithDir());

      await client.callTool({
        name: 'add_document',
        arguments: {
          document_type: 'passport',
          label: 'Test Passport',
          fields: { given_name: 'Alice', passport_number: 'P12345678' },
        },
      });

      // Corrupt the .enc file
      const vaultSubdir = join(vaultDir, 'vault');
      const files = readdirSync(vaultSubdir).filter((f) => f.endsWith('.enc'));
      expect(files.length).toBe(1);
      writeFileSync(join(vaultSubdir, files[0]!), Buffer.from('this is not valid ciphertext'));
    });

    afterAll(async () => {
      await cleanup();
    });

    it('get_passport returns isError on corrupted file', async () => {
      const result = await client.callTool({
        name: 'get_passport',
        arguments: { fields: ['given_name'], purpose: 'test' },
      });
      expect(result.isError).toBe(true);
      const parsed = parseToolResult(result.content);
      expect(typeof parsed['error']).toBe('string');
    });

    it('list_documents skips corrupted files', async () => {
      const result = await client.callTool({ name: 'list_documents', arguments: {} });
      expect(result.isError).toBeFalsy();
      const parsed = parseToolResult(result.content);
      expect(Array.isArray(parsed['documents'])).toBe(true);
      expect((parsed['documents'] as unknown[]).length).toBe(0);
    });
  });

  describe('client_name in access log', () => {
    let client: Client;
    let cleanup: () => Promise<void>;

    beforeAll(async () => {
      ({ client, cleanup } = await createTestClientWithDir());

      await client.callTool({
        name: 'add_document',
        arguments: {
          document_type: 'passport',
          label: 'Test Passport',
          fields: { given_name: 'Alice', passport_number: 'P12345678' },
        },
      });

      await client.callTool({
        name: 'get_passport',
        arguments: { fields: ['given_name'], purpose: 'test' },
      });
    });

    afterAll(async () => {
      await cleanup();
    });

    it('access log records client name from MCP handshake', async () => {
      const result = await client.callTool({ name: 'get_access_log', arguments: { limit: 10 } });
      expect(result.isError).toBeFalsy();
      const parsed = parseToolResult(result.content);
      const entries = parsed['entries'] as Array<{ client_name: string }>;
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[0]!.client_name).toBe('safehold-test');
    });
  });

  describe('missing fields in document', () => {
    let client: Client;
    let cleanup: () => Promise<void>;

    beforeAll(async () => {
      ({ client, cleanup } = await createTestClientWithDir());

      // Store passport with only some fields populated
      await client.callTool({
        name: 'add_document',
        arguments: {
          document_type: 'passport',
          label: 'Partial Passport',
          fields: { given_name: 'Alice' },
        },
      });
    });

    afterAll(async () => {
      await cleanup();
    });

    it('returns only fields that exist in the stored document', async () => {
      const result = await client.callTool({
        name: 'get_passport',
        arguments: { fields: ['given_name', 'expiry_date'], purpose: 'test' },
      });
      expect(result.isError).toBeFalsy();
      const parsed = parseToolResult(result.content);
      const fields = parsed['fields'] as Record<string, unknown>;
      expect(fields).toHaveProperty('given_name');
      expect(Object.keys(fields)).not.toContain('expiry_date');
    });

    it('get_document returns only fields that exist', async () => {
      const result = await client.callTool({
        name: 'get_document',
        arguments: {
          document_type: 'passport',
          fields: ['given_name', 'nonexistent_field'],
          purpose: 'test',
        },
      });
      expect(result.isError).toBeFalsy();
      const parsed = parseToolResult(result.content);
      const fields = parsed['fields'] as Record<string, unknown>;
      expect(fields).toHaveProperty('given_name');
      expect(Object.keys(fields)).not.toContain('nonexistent_field');
    });
  });
});
