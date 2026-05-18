import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClientWithDir } from './helpers/create-test-client.js';
import { parseToolResult } from './helpers/parse-tool-result.js';

describe('Retrieval response shape', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClientWithDir());
    await client.callTool({
      name: 'add_document',
      arguments: {
        document_type: 'passport',
        label: 'Partial Passport',
        fields: { given_name: 'Alice', passport_number: 'X1' },
      },
    });
  });

  afterAll(async () => {
    await cleanup();
  });

  it('returns unavailable_fields for fields not present on the document', async () => {
    const result = await client.callTool({
      name: 'get_passport',
      arguments: {
        fields: ['given_name', 'expiry_date', 'nationality'],
        purpose: 'test',
      },
    });
    expect(result.isError).toBeFalsy();
    const parsed = parseToolResult(result.content);
    const fields = parsed['fields'] as Record<string, unknown>;
    expect(fields).toHaveProperty('given_name');
    expect(Object.keys(fields)).not.toContain('expiry_date');
    const unavailable = parsed['unavailable_fields'] as string[];
    expect(unavailable.sort()).toEqual(['expiry_date', 'nationality']);
  });

  it('returns empty unavailable_fields when all requested fields are present', async () => {
    const result = await client.callTool({
      name: 'get_passport',
      arguments: { fields: ['given_name'], purpose: 'test' },
    });
    const parsed = parseToolResult(result.content);
    expect(parsed['unavailable_fields']).toEqual([]);
  });
});
