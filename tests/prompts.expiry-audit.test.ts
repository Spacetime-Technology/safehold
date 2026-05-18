import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient } from './helpers/create-test-client.js';

describe('expiry_audit prompt', () => {
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

  it('defaults to a 6-month window', async () => {
    const { messages } = await client.getPrompt({
      name: 'expiry_audit',
      arguments: {},
    });
    const text = getText(messages);
    expect(text).toContain('within 6 months');
    expect(text).toContain('list_documents');
  });

  it('honours an explicit window', async () => {
    const { messages } = await client.getPrompt({
      name: 'expiry_audit',
      arguments: { window_months: '12' },
    });
    const text = getText(messages);
    expect(text).toContain('within 12 months');
  });

  it('falls back to 6 months for invalid input', async () => {
    const { messages } = await client.getPrompt({
      name: 'expiry_audit',
      arguments: { window_months: 'not-a-number' },
    });
    const text = getText(messages);
    expect(text).toContain('within 6 months');
  });

  it('forbids retrieval and write tools', async () => {
    const { messages } = await client.getPrompt({
      name: 'expiry_audit',
      arguments: {},
    });
    const text = getText(messages);
    expect(text).toMatch(/Do NOT call any `get_\*` retrieval tool/);
    expect(text).toMatch(/Do NOT call `add_document`, `update_document`, or `delete_document`/);
  });
});
