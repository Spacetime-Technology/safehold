import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, chmodSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { loadOrCreateKey } from '../src/storage/key.js';

describe('Master key permissions', () => {
  it('throws when master.key has insecure permissions', () => {
    if (process.platform === 'win32') return;
    const dir = mkdtempSync(join(tmpdir(), 'safehold-key-test-'));
    try {
      const keyPath = join(dir, 'master.key');
      writeFileSync(keyPath, randomBytes(32));
      chmodSync(keyPath, 0o644);
      expect(() => loadOrCreateKey(dir)).toThrow(/insecure permissions/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('creates master.key with 0600 permissions on first run', async () => {
    if (process.platform === 'win32') return;
    const { statSync } = await import('node:fs');
    const dir = mkdtempSync(join(tmpdir(), 'safehold-key-test-'));
    try {
      loadOrCreateKey(dir);
      const mode = statSync(join(dir, 'master.key')).mode & 0o777;
      expect(mode).toBe(0o600);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns the same key bytes on subsequent loads', () => {
    const dir = mkdtempSync(join(tmpdir(), 'safehold-key-test-'));
    try {
      const first = loadOrCreateKey(dir);
      const second = loadOrCreateKey(dir);
      expect(Buffer.from(first).equals(Buffer.from(second))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
