import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from 'node:crypto';

const NONCE_LENGTH = 24;

export function encrypt(key: Uint8Array, plaintext: Uint8Array): Uint8Array {
  const nonce = randomBytes(NONCE_LENGTH);
  const cipher = xchacha20poly1305(key, nonce);
  const ciphertext = cipher.encrypt(plaintext);
  const result = new Uint8Array(NONCE_LENGTH + ciphertext.length);
  result.set(nonce, 0);
  result.set(ciphertext, NONCE_LENGTH);
  return result;
}

export function decrypt(key: Uint8Array, blob: Uint8Array): Uint8Array | null {
  try {
    const nonce = blob.subarray(0, NONCE_LENGTH);
    const ciphertext = blob.subarray(NONCE_LENGTH);
    const cipher = xchacha20poly1305(key, nonce);
    return cipher.decrypt(ciphertext);
  } catch {
    return null;
  }
}
