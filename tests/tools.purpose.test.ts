import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClientWithDir } from './helpers/create-test-client.js';

describe('Purpose validation', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClientWithDir());
    await client.callTool({
      name: 'add_document',
      arguments: {
        document_type: 'passport',
        label: 'Test',
        fields: { given_name: 'Alice', passport_number: 'X1' },
      },
    });
  });

  afterAll(async () => {
    await cleanup();
  });

  it('rejects empty purpose', async () => {
    const result = await client.callTool({
      name: 'get_passport',
      arguments: { fields: ['given_name'], purpose: '' },
    });
    expect(result.isError).toBe(true);
  });

  it('rejects purpose longer than 500 chars', async () => {
    const result = await client.callTool({
      name: 'get_passport',
      arguments: { fields: ['given_name'], purpose: 'a'.repeat(501) },
    });
    expect(result.isError).toBe(true);
  });

  it('accepts a normal purpose', async () => {
    const result = await client.callTool({
      name: 'get_passport',
      arguments: { fields: ['given_name'], purpose: 'booking a flight' },
    });
    expect(result.isError).toBeFalsy();
  });
});
