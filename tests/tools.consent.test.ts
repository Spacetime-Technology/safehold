import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClientWithDir } from './helpers/create-test-client.js';
import { parseToolResult } from './helpers/parse-tool-result.js';

describe('Elicitation-based consent', () => {
  describe('client accepts', () => {
    let client: Client;
    let cleanup: () => Promise<void>;
    let elicitationCalls = 0;

    beforeAll(async () => {
      ({ client, cleanup } = await createTestClientWithDir({
        elicitationHandler: () => {
          elicitationCalls++;
          return { action: 'accept', content: { approve: true } };
        },
      }));
      await client.callTool({
        name: 'add_document',
        arguments: {
          document_type: 'passport',
          label: 'Test Passport',
          fields: { given_name: 'Alice', passport_number: 'X1' },
        },
      });
    });

    afterAll(async () => {
      await cleanup();
    });

    it('returns fields and logs outcome=accepted', async () => {
      const before = elicitationCalls;
      const result = await client.callTool({
        name: 'get_passport',
        arguments: { fields: ['given_name'], purpose: 'consent test' },
      });
      expect(elicitationCalls).toBe(before + 1);
      expect(result.isError).toBeFalsy();
      const parsed = parseToolResult(result.content);
      expect(parsed['outcome']).toBe('accepted');
      expect(parsed['consent_method']).toBe('elicitation');
      expect((parsed['fields'] as Record<string, unknown>)['given_name']).toBe('Alice');

      const log = await client.callTool({
        name: 'get_access_log',
        arguments: { limit: 10 },
      });
      const entries = parseToolResult(log.content)['entries'] as Array<{ outcome?: string }>;
      expect(entries.at(-1)?.outcome).toBe('accepted');
    });
  });

  describe('client declines', () => {
    let client: Client;
    let cleanup: () => Promise<void>;

    beforeAll(async () => {
      ({ client, cleanup } = await createTestClientWithDir({
        elicitationHandler: () => ({ action: 'decline' }),
      }));
      await client.callTool({
        name: 'add_document',
        arguments: {
          document_type: 'passport',
          label: 'Test Passport',
          fields: { given_name: 'Alice', passport_number: 'X1' },
        },
      });
    });

    afterAll(async () => {
      await cleanup();
    });

    it('returns isError and does not include fields, log records outcome=declined', async () => {
      const result = await client.callTool({
        name: 'get_passport',
        arguments: { fields: ['given_name'], purpose: 'should be denied' },
      });
      expect(result.isError).toBe(true);
      const parsed = parseToolResult(result.content);
      expect(parsed).not.toHaveProperty('fields');
      expect(parsed['outcome']).toBe('declined');

      const log = await client.callTool({
        name: 'get_access_log',
        arguments: { limit: 10 },
      });
      const entries = parseToolResult(log.content)['entries'] as Array<{ outcome?: string }>;
      expect(entries.at(-1)?.outcome).toBe('declined');
    });
  });

  describe('client does not advertise elicitation', () => {
    let client: Client;
    let cleanup: () => Promise<void>;

    beforeAll(async () => {
      ({ client, cleanup } = await createTestClientWithDir());
      await client.callTool({
        name: 'add_document',
        arguments: {
          document_type: 'passport',
          label: 'Test Passport',
          fields: { given_name: 'Alice', passport_number: 'X1' },
        },
      });
    });

    afterAll(async () => {
      await cleanup();
    });

    it('falls back to host-approval and records outcome=auto', async () => {
      const result = await client.callTool({
        name: 'get_passport',
        arguments: { fields: ['given_name'], purpose: 'fallback test' },
      });
      expect(result.isError).toBeFalsy();
      const parsed = parseToolResult(result.content);
      expect(parsed['outcome']).toBe('auto');
      expect(parsed['consent_method']).toBe('host-approval');

      const log = await client.callTool({
        name: 'get_access_log',
        arguments: { limit: 10 },
      });
      const entries = parseToolResult(log.content)['entries'] as Array<{ outcome?: string }>;
      expect(entries.at(-1)?.outcome).toBe('auto');
    });
  });
});
