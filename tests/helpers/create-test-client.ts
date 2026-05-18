import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from '../../src/server.js';

export async function createTestClient(): Promise<{
  client: Client;
  cleanup: () => Promise<void>;
}> {
  const vaultDir = mkdtempSync(join(tmpdir(), 'safehold-test-'));
  const server = createServer(vaultDir);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);

  const client = new Client({ name: 'safehold-test', version: '0.0.1' });
  await client.connect(clientTransport);

  return {
    client,
    cleanup: async () => {
      await client.close();
      await server.close();
      rmSync(vaultDir, { recursive: true, force: true });
    },
  };
}
