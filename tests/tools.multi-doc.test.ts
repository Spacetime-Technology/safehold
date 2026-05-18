import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClientWithDir } from './helpers/create-test-client.js';
import { parseToolResult } from './helpers/parse-tool-result.js';

describe('Multi-document of same type', () => {
  let client: Client;
  let cleanup: () => Promise<void>;
  let ukPassportId: string;
  let usPassportId: string;

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClientWithDir());

    const uk = await client.callTool({
      name: 'add_document',
      arguments: {
        document_type: 'passport',
        label: 'UK Passport',
        fields: { given_name: 'Alice', passport_number: 'UK111111', issuing_country: 'GBR' },
      },
    });
    ukPassportId = parseToolResult(uk.content)['id'] as string;

    const us = await client.callTool({
      name: 'add_document',
      arguments: {
        document_type: 'passport',
        label: 'US Passport',
        fields: { given_name: 'Alice', passport_number: 'US222222', issuing_country: 'USA' },
      },
    });
    usPassportId = parseToolResult(us.content)['id'] as string;
  });

  afterAll(async () => {
    await cleanup();
  });

  it('get_passport without document_id errors with candidates when multiple exist', async () => {
    const result = await client.callTool({
      name: 'get_passport',
      arguments: { fields: ['passport_number'], purpose: 'test' },
    });
    expect(result.isError).toBe(true);
    const parsed = parseToolResult(result.content);
    expect(typeof parsed['error']).toBe('string');
    expect(parsed['error']).toMatch(/specify document_id/);
    const candidates = parsed['candidates'] as Array<{ id: string; label: string }>;
    expect(candidates.length).toBe(2);
    expect(candidates.map((c) => c.label).sort()).toEqual(['UK Passport', 'US Passport']);
  });

  it('get_passport with document_id returns the specified passport', async () => {
    const result = await client.callTool({
      name: 'get_passport',
      arguments: {
        fields: ['passport_number'],
        purpose: 'test',
        document_id: ukPassportId,
      },
    });
    expect(result.isError).toBeFalsy();
    const parsed = parseToolResult(result.content);
    expect((parsed['fields'] as Record<string, unknown>)['passport_number']).toBe('UK111111');
    expect(parsed['document_id']).toBe(ukPassportId);
  });

  it('get_passport with document_id returns the OTHER passport when asked', async () => {
    const result = await client.callTool({
      name: 'get_passport',
      arguments: {
        fields: ['passport_number'],
        purpose: 'test',
        document_id: usPassportId,
      },
    });
    expect(result.isError).toBeFalsy();
    const parsed = parseToolResult(result.content);
    expect((parsed['fields'] as Record<string, unknown>)['passport_number']).toBe('US222222');
  });

  it('get_passport with an unknown document_id errors', async () => {
    const result = await client.callTool({
      name: 'get_passport',
      arguments: {
        fields: ['passport_number'],
        purpose: 'test',
        document_id: 'does-not-exist',
      },
    });
    expect(result.isError).toBe(true);
  });

  it('get_passport with a document_id pointing to a different type errors', async () => {
    const visa = await client.callTool({
      name: 'add_document',
      arguments: {
        document_type: 'visa',
        label: 'US Visa',
        fields: { visa_type: 'tourist', issuing_country: 'USA' },
      },
    });
    const visaId = parseToolResult(visa.content)['id'] as string;
    const result = await client.callTool({
      name: 'get_passport',
      arguments: { fields: ['passport_number'], purpose: 'test', document_id: visaId },
    });
    expect(result.isError).toBe(true);
  });
});
