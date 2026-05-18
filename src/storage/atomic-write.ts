import { writeFileSync, renameSync, openSync, fsyncSync, closeSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';

export function atomicWrite(path: string, data: Uint8Array | Buffer, mode?: number): void {
  const tmp = `${path}.tmp.${process.pid}.${Date.now()}`;
  try {
    writeFileSync(tmp, data, mode !== undefined ? { mode } : undefined);
    const fd = openSync(tmp, 'r');
    try {
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    renameSync(tmp, path);
    try {
      const dirFd = openSync(dirname(path), 'r');
      try {
        fsyncSync(dirFd);
      } finally {
        closeSync(dirFd);
      }
    } catch {
      // Best-effort dir fsync — not all platforms support it (Windows).
    }
  } catch (err) {
    try {
      unlinkSync(tmp);
    } catch {
      // ignore
    }
    throw err;
  }
}
