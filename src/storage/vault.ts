import { readFileSync, readdirSync, unlinkSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { encrypt, decrypt } from './crypto.js';
import { atomicWrite } from './atomic-write.js';

export interface StoredDocument {
  id: string;
  document_type: string;
  label: string;
  fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DocumentMetadata {
  id: string;
  type: string;
  label: string;
  expiry_date?: string;
}

function getVaultSubdir(baseDir: string): string {
  const dir = join(baseDir, 'vault');
  try {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  } catch (err) {
    throw new Error(
      `Failed to create vault directory: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }
  return dir;
}

function docPath(baseDir: string, id: string): string {
  return join(getVaultSubdir(baseDir), `${id}.enc`);
}

function readDoc(baseDir: string, key: Uint8Array, id: string): StoredDocument | null {
  const path = docPath(baseDir, id);
  if (!existsSync(path)) return null;
  let blob: Buffer;
  try {
    blob = readFileSync(path);
  } catch (err) {
    throw new Error(
      `Failed to read document ${id}: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }
  const plain = decrypt(key, new Uint8Array(blob));
  if (plain === null) {
    throw new Error(`Document ${id} could not be decrypted — file may be corrupted`);
  }
  try {
    return JSON.parse(Buffer.from(plain).toString('utf8')) as StoredDocument;
  } catch (err) {
    throw new Error(`Document ${id} could not be parsed — file may be corrupted`, { cause: err });
  }
}

const MAX_DOC_SIZE_BYTES = 5 * 1024 * 1024;

function writeDoc(baseDir: string, key: Uint8Array, doc: StoredDocument): void {
  const plain = new Uint8Array(Buffer.from(JSON.stringify(doc), 'utf8'));
  if (plain.length > MAX_DOC_SIZE_BYTES) {
    throw new Error(
      `Document exceeds maximum size of ${MAX_DOC_SIZE_BYTES} bytes (got ${plain.length})`
    );
  }
  const blob = encrypt(key, plain);
  try {
    atomicWrite(docPath(baseDir, doc.id), blob);
  } catch (err) {
    throw new Error(
      `Failed to write document ${doc.id}: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }
}

export function addDocument(
  baseDir: string,
  key: Uint8Array,
  input: { document_type: string; label: string; fields: Record<string, unknown> }
): StoredDocument {
  const now = new Date().toISOString();
  const doc: StoredDocument = {
    id: randomUUID(),
    document_type: input.document_type,
    label: input.label,
    fields: input.fields,
    created_at: now,
    updated_at: now,
  };
  writeDoc(baseDir, key, doc);
  return doc;
}

export function listDocuments(baseDir: string, key: Uint8Array): DocumentMetadata[] {
  let files: string[];
  try {
    files = readdirSync(getVaultSubdir(baseDir)).filter((f) => f.endsWith('.enc'));
  } catch (err) {
    throw new Error(`Failed to read vault: ${err instanceof Error ? err.message : String(err)}`, {
      cause: err,
    });
  }
  const results: DocumentMetadata[] = [];
  for (const file of files) {
    const id = file.slice(0, -4);
    let doc: StoredDocument | null;
    try {
      doc = readDoc(baseDir, key, id);
    } catch {
      continue;
    }
    if (!doc) continue;
    const meta: DocumentMetadata = { id: doc.id, type: doc.document_type, label: doc.label };
    const expiryDate = doc.fields['expiry_date'];
    if (typeof expiryDate === 'string') meta.expiry_date = expiryDate;
    results.push(meta);
  }
  return results;
}

export function getDocumentsByType(
  baseDir: string,
  key: Uint8Array,
  documentType: string
): StoredDocument[] {
  let files: string[];
  try {
    files = readdirSync(getVaultSubdir(baseDir)).filter((f) => f.endsWith('.enc'));
  } catch (err) {
    throw new Error(`Failed to read vault: ${err instanceof Error ? err.message : String(err)}`, {
      cause: err,
    });
  }
  const results: StoredDocument[] = [];
  for (const file of files) {
    const id = file.slice(0, -4);
    let doc: StoredDocument | null;
    try {
      doc = readDoc(baseDir, key, id);
    } catch {
      continue;
    }
    if (doc?.document_type === documentType) results.push(doc);
  }
  return results;
}

export function getDocumentById(
  baseDir: string,
  key: Uint8Array,
  id: string
): StoredDocument | null {
  return readDoc(baseDir, key, id);
}

export function updateDocument(
  baseDir: string,
  key: Uint8Array,
  id: string,
  fields: Record<string, unknown>
): boolean {
  const doc = readDoc(baseDir, key, id);
  if (!doc) return false;
  doc.fields = { ...doc.fields, ...fields };
  doc.updated_at = new Date().toISOString();
  writeDoc(baseDir, key, doc);
  return true;
}

export function deleteDocument(baseDir: string, key: Uint8Array, id: string): boolean {
  const path = docPath(baseDir, id);
  if (!existsSync(path)) return false;
  try {
    unlinkSync(path);
  } catch (err) {
    throw new Error(
      `Failed to delete document ${id}: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }
  return true;
}
