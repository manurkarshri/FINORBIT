import test from "node:test";
import assert from "node:assert/strict";
import { createCredential, verifyCredential, encryptPayload, decryptPayload } from "../src/security/crypto.js";

test("PIN credential verifies without storing the PIN", async () => {
  const credential = await createCredential("123456", "pin");
  assert.equal(JSON.stringify(credential).includes("123456"), false);
  assert.equal(await verifyCredential("123456", credential), true);
  assert.equal(await verifyCredential("654321", credential), false);
});

test("passphrase credential verifies", async () => {
  const credential = await createCredential("correct horse battery staple", "passphrase");
  assert.equal(await verifyCredential("correct horse battery staple", credential), true);
});

test("encryption uses a unique IV and round trips", async () => {
  const first = await encryptPayload({ safe: true }, "secret");
  const second = await encryptPayload({ safe: true }, "secret");
  assert.notEqual(first.iv, second.iv);
  assert.deepEqual(await decryptPayload(first, "secret"), { safe: true });
});

test("wrong secret and tampering are rejected", async () => {
  const envelope = await encryptPayload({ safe: true }, "secret");
  await assert.rejects(decryptPayload(envelope, "wrong"), /authenticated/);
  envelope.ciphertext = `${envelope.ciphertext.slice(0, -2)}AA`;
  await assert.rejects(decryptPayload(envelope, "secret"), /authenticated/);
});
