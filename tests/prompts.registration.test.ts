import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient } from './helpers/create-test-client.js';

const EXPECTED_PROMPTS = [
  'onboard_document',
  'travel_preflight',
  'selective_share',
  'expiry_audit',
];

describe('Prompt registration', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClient());
  });

  afterAll(async () => {
    await cleanup();
  });

  it('registers exactly 4 prompts', async () => {
    const { prompts } = await client.listPrompts();
    expect(prompts).toHaveLength(4);
  });

  it.each(EXPECTED_PROMPTS)('registers prompt "%s"', async (promptName) => {
    const { prompts } = await client.listPrompts();
    const names = prompts.map((p) => p.name);
    expect(names).toContain(promptName);
  });

  it('all prompts have a description', async () => {
    const { prompts } = await client.listPrompts();
    for (const prompt of prompts) {
      expect(prompt.description, `${prompt.name} has no description`).toBeTruthy();
    }
  });
});
