import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient } from './helpers/create-test-client.js';

describe('travel_preflight prompt', () => {
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

  it('mentions destination, dates, and the tools to call in order', async () => {
    const { messages } = await client.getPrompt({
      name: 'travel_preflight',
      arguments: {
        destination_country: 'Japan',
        travel_date: '2026-08-01',
        return_date: '2026-08-15',
      },
    });
    const text = getText(messages);
    expect(text).toContain('Japan');
    expect(text).toContain('2026-08-01');
    expect(text).toContain('2026-08-15');
    expect(text).toContain('list_documents');
    expect(text).toContain('get_passport');
    expect(text).toContain('get_visa');
    expect(text).toContain('expiry_date');
  });

  it('embeds a purpose string that names the destination', async () => {
    const { messages } = await client.getPrompt({
      name: 'travel_preflight',
      arguments: { destination_country: 'Brazil', travel_date: '2026-09-01' },
    });
    const text = getText(messages);
    expect(text).toMatch(/purpose: "Travel pre-flight check for Brazil/);
  });

  it('does not invoke write tools', async () => {
    const { messages } = await client.getPrompt({
      name: 'travel_preflight',
      arguments: { destination_country: 'Canada', travel_date: '2026-12-01' },
    });
    const text = getText(messages);
    expect(text).toMatch(/Do not call `add_document`, `update_document`, or `delete_document`/);
  });
});
