import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClientWithDir } from './helpers/create-test-client.js';
import { parseToolResult } from './helpers/parse-tool-result.js';

describe('Document field validation', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClientWithDir());
  });

  afterAll(async () => {
    await cleanup();
  });

  it('rejects add_document with a typo in a known field name', async () => {
    const result = await client.callTool({
      name: 'add_document',
      arguments: {
        document_type: 'passport',
        label: 'Typo Passport',
        fields: { passport_numbr: 'X1234567' },
      },
    });
    expect(result.isError).toBe(true);
    const parsed = parseToolResult(result.content);
    expect(typeof parsed['error']).toBe('string');
    expect((parsed['error'] as string).toLowerCase()).toMatch(/passport_numbr|unrecognized/);
  });

  it('accepts add_document with a subset of known passport fields', async () => {
    const result = await client.callTool({
      name: 'add_document',
      arguments: {
        document_type: 'passport',
        label: 'Partial Passport',
        fields: { given_name: 'Alice', passport_number: 'P12345678' },
      },
    });
    expect(result.isError).toBeFalsy();
  });

  it('accepts add_document with an unknown document_type and arbitrary fields', async () => {
    const result = await client.callTool({
      name: 'add_document',
      arguments: {
        document_type: 'insurance_card',
        label: 'Insurance',
        fields: { policy_number: 'POL-1', anything: 'goes', nested: { ok: true } },
      },
    });
    expect(result.isError).toBeFalsy();
  });

  it('rejects update_document with a typo on a known document', async () => {
    const add = await client.callTool({
      name: 'add_document',
      arguments: {
        document_type: 'visa',
        label: 'Test Visa',
        fields: { visa_type: 'tourist', issuing_country: 'USA' },
      },
    });
    const id = parseToolResult(add.content)['id'] as string;

    const result = await client.callTool({
      name: 'update_document',
      arguments: { id, fields: { visa_typo: 'business' } },
    });
    expect(result.isError).toBe(true);
  });

  it('rejects add_document with a wrong-typed field value', async () => {
    const result = await client.callTool({
      name: 'add_document',
      arguments: {
        document_type: 'passport',
        label: 'Wrong Type',
        fields: { given_name: 12345 },
      },
    });
    expect(result.isError).toBe(true);
  });
});
