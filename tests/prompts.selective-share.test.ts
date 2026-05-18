import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient } from './helpers/create-test-client.js';

describe('selective_share prompt', () => {
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

  it('echoes the service name and request and bakes them into the purpose', async () => {
    const { messages } = await client.getPrompt({
      name: 'selective_share',
      arguments: {
        service_name: 'Acme Bank',
        requested_data_description: 'date of birth and nationality',
      },
    });
    const text = getText(messages);
    expect(text).toContain('Acme Bank');
    expect(text).toContain('date of birth and nationality');
    expect(text).toMatch(/Purpose that will be shown at consent: "Share with Acme Bank/);
  });

  it('warns against oversharing identifiers', async () => {
    const { messages } = await client.getPrompt({
      name: 'selective_share',
      arguments: {
        service_name: 'Some Site',
        requested_data_description: 'full name',
      },
    });
    const text = getText(messages);
    expect(text).toContain('passport_number');
    expect(text).toContain('list_documents');
  });
});
