import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

const KEY_FILENAME = 'master.key';

export function loadOrCreateKey(vaultDir: string): Uint8Array {
  mkdirSync(vaultDir, { recursive: true });
  const keyPath = join(vaultDir, KEY_FILENAME);
  if (existsSync(keyPath)) {
    return new Uint8Array(readFileSync(keyPath));
  }
  const key = randomBytes(32);
  writeFileSync(keyPath, key, { mode: 0o600 });
  return new Uint8Array(key);
}
