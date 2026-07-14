const encoder = new TextEncoder();
const decoder = new TextDecoder();
export const KDF_DEFAULTS = Object.freeze({ name: "PBKDF2", hash: "SHA-256", iterations: 600000, version: 1 });

function bytesToBase64(bytes) {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}

function base64ToBytes(value) {
  const raw = atob(value);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

async function derive(secret, salt, usage, cryptoObject = globalThis.crypto) {
  const material = await cryptoObject.subtle.importKey("raw", encoder.encode(secret), "PBKDF2", false, ["deriveBits"]);
  const contextSalt = new Uint8Array(salt.length + usage.length);
  contextSalt.set(salt);
  contextSalt.set(encoder.encode(usage), salt.length);
  return new Uint8Array(await cryptoObject.subtle.deriveBits({ name: "PBKDF2", hash: KDF_DEFAULTS.hash, iterations: KDF_DEFAULTS.iterations, salt: contextSalt }, material, 256));
}

export async function createCredential(secret, mode, cryptoObject = globalThis.crypto) {
  if (!secret || !["pin", "passphrase"].includes(mode)) throw new TypeError("A PIN or passphrase is required");
  const salt = cryptoObject.getRandomValues(new Uint8Array(16));
  const verifier = await derive(secret, salt, "finorbit:verifier:v1", cryptoObject);
  return { id: "security.credential", mode, salt: bytesToBase64(salt), verifier: bytesToBase64(verifier), kdf: KDF_DEFAULTS, updatedAt: new Date().toISOString(), schemaVersion: 1 };
}

export async function verifyCredential(secret, credential, cryptoObject = globalThis.crypto) {
  const actual = await derive(secret, base64ToBytes(credential.salt), "finorbit:verifier:v1", cryptoObject);
  const expected = base64ToBytes(credential.verifier);
  let mismatch = actual.length ^ expected.length;
  for (let index = 0; index < Math.max(actual.length, expected.length); index += 1) mismatch |= (actual[index] ?? 0) ^ (expected[index] ?? 0);
  return mismatch === 0;
}

export async function encryptPayload(value, secret, cryptoObject = globalThis.crypto) {
  const salt = cryptoObject.getRandomValues(new Uint8Array(16));
  const iv = cryptoObject.getRandomValues(new Uint8Array(12));
  const rawKey = await derive(secret, salt, "finorbit:encryption:v1", cryptoObject);
  const key = await cryptoObject.subtle.importKey("raw", rawKey, "AES-GCM", false, ["encrypt"]);
  const ciphertext = await cryptoObject.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(JSON.stringify(value)));
  rawKey.fill(0);
  return { format: "finorbit-encrypted-envelope", version: 1, algorithm: "AES-GCM", kdf: KDF_DEFAULTS, salt: bytesToBase64(salt), iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) };
}

export async function decryptPayload(envelope, secret, cryptoObject = globalThis.crypto) {
  if (envelope?.format !== "finorbit-encrypted-envelope" || envelope?.version !== 1) throw new Error("Unsupported encrypted backup format");
  try {
    const rawKey = await derive(secret, base64ToBytes(envelope.salt), "finorbit:encryption:v1", cryptoObject);
    const key = await cryptoObject.subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
    const plaintext = await cryptoObject.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(envelope.iv) }, key, base64ToBytes(envelope.ciphertext));
    rawKey.fill(0);
    return JSON.parse(decoder.decode(plaintext));
  } catch (error) {
    throw new Error("The encrypted backup could not be authenticated", { cause: error });
  }
}
