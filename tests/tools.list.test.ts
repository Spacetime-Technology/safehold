import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createTestClient } from './helpers/create-test-client.js';

const EXPECTED_TOOLS = [
  'get_passport',
  'get_driving_license',
  'get_national_id',
  'get_visa',
  'get_photo',
  'get_document',
  'add_document',
  'list_documents',
  'delete_document',
  'update_document',
  'get_access_log',
];

describe('Tool registration', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    ({ client, cleanup } = await createTestClient());
  });

  afterAll(async () => {
    await cleanup();
  });

  it('registers exactly 11 tools', async () => {
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(11);
  });

  it.each(EXPECTED_TOOLS)('registers tool "%s"', async (toolName) => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain(toolName);
  });

  it('all tools have a description', async () => {
    const { tools } = await client.listTools();
    for (const tool of tools) {
      expect(tool.description, `${tool.name} has no description`).toBeTruthy();
    }
  });

  it('all tools have an inputSchema', async () => {
    const { tools } = await client.listTools();
    for (const tool of tools) {
      expect(tool.inputSchema, `${tool.name} has no inputSchema`).toBeTruthy();
    }
  });
});
