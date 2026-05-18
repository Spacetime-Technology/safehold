import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { encrypt, decrypt } from './crypto.js';
import type { AccessLogEntry } from '../types/access-log.js';

const LOG_FILENAME = 'access-log.enc';

function logPath(baseDir: string): string {
  return join(baseDir, LOG_FILENAME);
}

function readEntries(baseDir: string, key: Uint8Array): AccessLogEntry[] {
  const path = logPath(baseDir);
  if (!existsSync(path)) return [];
  try {
    const blob = readFileSync(path);
    const plain = decrypt(key, new Uint8Array(blob));
    if (plain === null) return [];
    return JSON.parse(Buffer.from(plain).toString('utf8')) as AccessLogEntry[];
  } catch {
    return [];
  }
}

function writeEntries(baseDir: string, key: Uint8Array, entries: AccessLogEntry[]): void {
  const plain = new Uint8Array(Buffer.from(JSON.stringify(entries), 'utf8'));
  const blob = encrypt(key, plain);
  try {
    writeFileSync(logPath(baseDir), blob);
  } catch (err) {
    throw new Error(
      `Failed to write access log: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }
}

export function appendLogEntry(
  baseDir: string,
  key: Uint8Array,
  entry: Omit<AccessLogEntry, 'id' | 'timestamp'>
): void {
  const entries = readEntries(baseDir, key);
  const newEntry: AccessLogEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    tool_name: entry.tool_name,
    client_name: entry.client_name,
    fields_requested: entry.fields_requested,
    purpose: entry.purpose,
    ...(entry.document_id !== undefined ? { document_id: entry.document_id } : {}),
  };
  entries.push(newEntry);
  writeEntries(baseDir, key, entries);
}

export function getLogEntries(
  baseDir: string,
  key: Uint8Array,
  filters: { document_id?: string; limit?: number }
): AccessLogEntry[] {
  let entries = readEntries(baseDir, key);
  if (filters.document_id !== undefined) {
    entries = entries.filter((e) => e.document_id === filters.document_id);
  }
  const limit = filters.limit ?? 50;
  return entries.slice(-limit);
}
