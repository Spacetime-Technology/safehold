import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

const KEY_FILENAME = 'master.key';

export function loadOrCreateKey(vaultDir: string): Uint8Array {
  try {
    mkdirSync(vaultDir, { recursive: true });
  } catch (err) {
    throw new Error(
      `Failed to create vault directory: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }
  const keyPath = join(vaultDir, KEY_FILENAME);
  if (existsSync(keyPath)) {
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
    writeFileSync(keyPath, key, { mode: 0o600 });
  } catch (err) {
    throw new Error(
      `Failed to write master key: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }
  return new Uint8Array(key);
}
