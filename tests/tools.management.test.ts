import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient } from './helpers/create-test-client.js';
import { parseToolResult } from './helpers/parse-tool-result.js';

describe('Management tools', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClient());
  });

  afterAll(async () => {
    await cleanup();
  });

  it('list_documents returns an empty documents array', async () => {
    const result = await client.callTool({ name: 'list_documents', arguments: {} });
    expect(result.isError).toBeFalsy();
    const parsed = parseToolResult(result.content);
    expect(Array.isArray(parsed['documents'])).toBe(true);
  });

  it('add_document returns a document id', async () => {
    const result = await client.callTool({
      name: 'add_document',
      arguments: {
        document_type: 'passport',
        label: 'My Test Passport',
        fields: { given_name: 'Alice', passport_number: 'X1234567' },
      },
    });
    expect(result.isError).toBeFalsy();
    const parsed = parseToolResult(result.content);
    expect(parsed).toHaveProperty('id');
    expect(parsed['created']).toBe(true);
  });

  it('delete_document returns deleted true', async () => {
    const result = await client.callTool({
      name: 'delete_document',
      arguments: { id: 'stub-id-001' },
    });
    expect(result.isError).toBeFalsy();
    const parsed = parseToolResult(result.content);
    expect(parsed['deleted']).toBe(true);
  });

  it('update_document returns updated true', async () => {
    const result = await client.callTool({
      name: 'update_document',
      arguments: { id: 'stub-id-001', fields: { given_name: 'Bob' } },
    });
    expect(result.isError).toBeFalsy();
    const parsed = parseToolResult(result.content);
    expect(parsed['updated']).toBe(true);
  });

  it('get_access_log returns an empty entries array', async () => {
    const result = await client.callTool({
      name: 'get_access_log',
      arguments: { limit: 10 },
    });
    expect(result.isError).toBeFalsy();
    const parsed = parseToolResult(result.content);
    expect(Array.isArray(parsed['entries'])).toBe(true);
  });

  it('get_access_log accepts optional document_id filter', async () => {
    const result = await client.callTool({
      name: 'get_access_log',
      arguments: { document_id: 'stub-id-001' },
    });
    expect(result.isError).toBeFalsy();
  });
});
