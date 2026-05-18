import { readFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { atomicWrite } from './atomic-write.js';

const KEY_FILENAME = 'master.key';

export function loadOrCreateKey(vaultDir: string): Uint8Array {
  try {
    mkdirSync(vaultDir, { recursive: true, mode: 0o700 });
  } catch (err) {
    throw new Error(
      `Failed to create vault directory: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }
  const keyPath = join(vaultDir, KEY_FILENAME);
  if (existsSync(keyPath)) {
    const stats = statSync(keyPath);
    if ((stats.mode & 0o077) !== 0) {
      throw new Error(
        `Master key has insecure permissions (${(stats.mode & 0o777).toString(8)}). Expected 0600.`
      );
    }
    try {
      return new Uint8Array(readFileSync(keyPath));
    } catch (err) {
      throw new Error(
        `Failed to read master key: ${err instanceof Error ? err.message : String(err)}`,
        { cause: err }
      );
    }
  }
  const key = randomBytes(32);
  try {
    atomicWrite(keyPath, key, 0o600);
  } catch (err) {
    throw new Error(
      `Failed to write master key: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }
  return new Uint8Array(key);
}
