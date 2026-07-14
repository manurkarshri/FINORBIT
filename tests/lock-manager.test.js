import test from "node:test";
import assert from "node:assert/strict";
import { createCredential } from "../src/security/crypto.js";
import { createLockManager } from "../src/security/lock-manager.js";

test("lock manager unlocks, exposes secret only to a callback, and clears it", async () => {
  const credential = await createCredential("2468", "pin");
  const manager = createLockManager({ credential, timeoutMs: 0 });
  assert.equal(await manager.unlock("wrong"), false);
  assert.equal(await manager.unlock("2468"), true);
  assert.equal(manager.useSecret((secret) => secret.length), 4);
  manager.lock();
  assert.throws(() => manager.useSecret(() => {}), /locked/);
});

test("hidden-tab policy locks an unlocked manager", async () => {
  const credential = await createCredential("a longer phrase", "passphrase");
  const manager = createLockManager({ credential, timeoutMs: 0, lockOnHidden: true });
  await manager.unlock("a longer phrase");
  manager.visibilityChanged(true);
  assert.equal(manager.locked, true);
});

test("inactivity timer invokes auto-lock", async () => {
  const credential = await createCredential("timed phrase", "passphrase");
  let scheduled;
  const manager = createLockManager({ credential, timeoutMs: 10, schedule: (callback) => { scheduled = callback; return 1; }, cancel: () => {} });
  await manager.unlock("timed phrase");
  scheduled();
  assert.equal(manager.locked, true);
});
