import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient } from './helpers/create-test-client.js';
import { parseToolResult } from './helpers/parse-tool-result.js';

describe('Management tools', () => {
  let client: Client;
  let cleanup: () => Promise<void>;
  let docId: string;

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClient());
  });

  afterAll(async () => {
    await cleanup();
  });

  it('list_documents returns empty array on a fresh vault', async () => {
    const result = await client.callTool({ name: 'list_documents', arguments: {} });
    expect(result.isError).toBeFalsy();
    const parsed = parseToolResult(result.content);
    expect(Array.isArray(parsed['documents'])).toBe(true);
    expect((parsed['documents'] as unknown[]).length).toBe(0);
  });

  it('add_document stores the document and returns a real UUID', async () => {
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
    expect(typeof parsed['id']).toBe('string');
    expect(parsed['id']).not.toBe('stub-id-001');
    expect(parsed['created']).toBe(true);
    docId = parsed['id'] as string;
  });

  it('list_documents shows the document after add', async () => {
    const result = await client.callTool({ name: 'list_documents', arguments: {} });
    expect(result.isError).toBeFalsy();
    const parsed = parseToolResult(result.content);
    const docs = parsed['documents'] as unknown[];
    expect(docs.length).toBe(1);
  });

  it('update_document modifies fields on the stored document', async () => {
    const result = await client.callTool({
      name: 'update_document',
      arguments: { id: docId, fields: { given_name: 'Bob' } },
    });
    expect(result.isError).toBeFalsy();
    const parsed = parseToolResult(result.content);
    expect(parsed['updated']).toBe(true);
  });

  it('update_document returns false for a non-existent id', async () => {
    const result = await client.callTool({
      name: 'update_document',
      arguments: { id: 'does-not-exist', fields: { given_name: 'Nobody' } },
    });
    expect(result.isError).toBeFalsy();
    const parsed = parseToolResult(result.content);
    expect(parsed['updated']).toBe(false);
  });

  it('delete_document removes the document', async () => {
    const result = await client.callTool({
      name: 'delete_document',
      arguments: { id: docId },
    });
    expect(result.isError).toBeFalsy();
    const parsed = parseToolResult(result.content);
    expect(parsed['deleted']).toBe(true);
  });

  it('list_documents is empty after deletion', async () => {
    const result = await client.callTool({ name: 'list_documents', arguments: {} });
    expect(result.isError).toBeFalsy();
    const parsed = parseToolResult(result.content);
    expect((parsed['documents'] as unknown[]).length).toBe(0);
  });

  it('delete_document returns false for an already-deleted id', async () => {
    const result = await client.callTool({
      name: 'delete_document',
      arguments: { id: docId },
    });
    expect(result.isError).toBeFalsy();
    const parsed = parseToolResult(result.content);
    expect(parsed['deleted']).toBe(false);
  });

  it('get_access_log returns an entries array', async () => {
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
      arguments: { document_id: 'some-id' },
    });
    expect(result.isError).toBeFalsy();
    const parsed = parseToolResult(result.content);
    expect(Array.isArray(parsed['entries'])).toBe(true);
  });
});
