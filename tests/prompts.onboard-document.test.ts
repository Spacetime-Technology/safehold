import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient } from './helpers/create-test-client.js';

describe('onboard_document prompt', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClient());
  });

  afterAll(async () => {
    await cleanup();
  });

  function getText(messages: Array<{ content: { type: string; text?: string } }>): string {
    const first = messages[0];
    if (!first || first.content.type !== 'text' || !first.content.text) {
      throw new Error('expected first message to be text');
    }
    return first.content.text;
  }

  it('passport add mode lists every passport field and instructs add_document', async () => {
    const { messages } = await client.getPrompt({
      name: 'onboard_document',
      arguments: { document_type: 'passport' },
    });
    const text = getText(messages);
    for (const field of [
      'given_name',
      'family_name',
      'nationality',
      'date_of_birth',
      'passport_number',
      'expiry_date',
      'issuing_country',
      'gender',
    ]) {
      expect(text).toContain(field);
    }
    expect(text).toContain('add_document');
    expect(text).not.toContain('update_document');
  });

  it('update mode references list_documents when no document_id is given', async () => {
    const { messages } = await client.getPrompt({
      name: 'onboard_document',
      arguments: { document_type: 'driving_license', mode: 'update' },
    });
    const text = getText(messages);
    expect(text).toContain('list_documents');
    expect(text).toContain('update_document');
    expect(text).toContain('categories');
  });

  it('update mode with document_id names the id and skips list_documents', async () => {
    const { messages } = await client.getPrompt({
      name: 'onboard_document',
      arguments: { document_type: 'visa', mode: 'update', document_id: 'abc-123' },
    });
    const text = getText(messages);
    expect(text).toContain('abc-123');
    expect(text).toContain('update_document');
  });

  it('forbids retrieval tools', async () => {
    const { messages } = await client.getPrompt({
      name: 'onboard_document',
      arguments: { document_type: 'national_id' },
    });
    const text = getText(messages);
    expect(text).toContain('id_number');
    expect(text).toMatch(/Do not call any `get_\*` retrieval tool/);
  });
});
