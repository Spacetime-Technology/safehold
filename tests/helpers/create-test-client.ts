import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ElicitRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from '../../src/server.js';

export type ElicitationHandler = (
  message: string
) => { action: 'accept'; content: Record<string, unknown> } | { action: 'decline' | 'cancel' };

export interface TestClientOptions {
  vaultDir?: string;
  elicitationHandler?: ElicitationHandler;
  clientName?: string;
}

export async function createTestClient(): Promise<{
  client: Client;
  cleanup: () => Promise<void>;
}> {
  const { client, vaultDir, cleanup } = await createTestClientWithDir();
  void vaultDir;
  return { client, cleanup };
}

export async function createTestClientWithDir(opts: TestClientOptions = {}): Promise<{
  client: Client;
  vaultDir: string;
  cleanup: () => Promise<void>;
}> {
  const vaultDir = opts.vaultDir ?? mkdtempSync(join(tmpdir(), 'safehold-test-'));
  const server = createServer(vaultDir);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);

  const capabilities = opts.elicitationHandler ? { elicitation: {} } : {};
  const client = new Client(
    { name: opts.clientName ?? 'safehold-test', version: '0.0.1' },
    { capabilities }
  );

  if (opts.elicitationHandler) {
    const handler = opts.elicitationHandler;
    client.setRequestHandler(ElicitRequestSchema, (request) => {
      const message =
        'message' in request.params && typeof request.params.message === 'string'
          ? request.params.message
          : '';
      return Promise.resolve(handler(message));
    });
  }

  await client.connect(clientTransport);

  return {
    client,
    vaultDir,
    cleanup: async () => {
      await client.close();
      await server.close();
      rmSync(vaultDir, { recursive: true, force: true });
    },
  };
}
