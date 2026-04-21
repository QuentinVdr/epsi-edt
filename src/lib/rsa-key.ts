/**
 * Ephemeral RSA-OAEP key pair for password encryption.
 *
 * Generated once when the module is first imported (i.e. on server startup).
 * The private key never leaves this module — only the public key is exposed
 * to clients so they can encrypt before sending.
 *
 * "Ephemeral" means the key pair is regenerated every time the server process
 * starts. Old ciphertexts cannot be decrypted after a restart, which prevents
 * replay attacks and means no key material ever needs to be stored on disk.
 *
 * Algorithm: RSA-OAEP / SHA-256, 2048-bit modulus.
 * This matches the Web Crypto API settings used on the browser side.
 */

import {
  constants as cryptoConstants,
  generateKeyPairSync,
  privateDecrypt,
} from "node:crypto";

// ── Key generation (runs once at module load, ~50–100 ms) ────────────────────

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki", // SubjectPublicKeyInfo — required by Web Crypto importKey
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns the PEM-encoded public key to send to the browser. */
export function getPublicKeyPem(): string {
  return publicKey;
}

/**
 * Decrypts a base64-encoded RSA-OAEP ciphertext produced by the browser.
 * Throws if the ciphertext is invalid or was encrypted with a different key.
 */
export function decryptPassword(ciphertextBase64: string): string {
  const cipherBuffer = Buffer.from(ciphertextBase64, "base64");
  const decrypted = privateDecrypt(
    {
      key: privateKey,
      padding: cryptoConstants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    cipherBuffer,
  );
  return decrypted.toString("utf8");
}
