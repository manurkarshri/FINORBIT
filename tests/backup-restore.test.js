import test from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { openDatabase } from "../src/database/connection.js";
import { runTransaction } from "../src/database/transaction.js";
import { STORE_NAMES } from "../src/database/schema.js";
import { createBackup } from "../src/services/backup-service.js";
import { parseBackup, restoreBackup, validateBackup } from "../src/services/restore-service.js";

async function db() { return openDatabase({ indexedDB: new IDBFactory(), name: crypto.randomUUID() }); }
test("standard backup excludes lock credentials", async () => {
  const database = await db();
  await runTransaction(database, ["settings"], "readwrite", ({ store }) => store("settings").put({ id: "security.credential", verifier: "private", updatedAt: new Date().toISOString() }));
  const backup = await createBackup(database);
  assert.equal(backup.stores.settings.length, 0);
  assert.equal(Object.keys(backup.stores).length, 26);
  database.close();
});

test("encrypted backup parses only with correct secret", async () => {
  const database = await db();
  const backup = await createBackup(database, { encrypted: true, secret: "strong phrase" });
  assert.equal((await parseBackup(JSON.stringify(backup), { secret: "strong phrase" })).preview.counts.accounts, 0);
  await assert.rejects(parseBackup(JSON.stringify(backup), { secret: "wrong" }), /authenticated/);
  database.close();
});

test("restore validates before replacing active data", async () => {
  const database = await db();
  await runTransaction(database, ["accounts"], "readwrite", ({ store }) => store("accounts").add({ id: "existing_1", updatedAt: new Date().toISOString() }));
  const invalid = { format: "finorbit-backup", version: 1, schemaVersion: 1, stores: Object.fromEntries(STORE_NAMES.map((name) => [name, []])) };
  invalid.stores.accounts = [{ id: "same" }, { id: "same" }];
  assert.throws(() => validateBackup(invalid), /duplicate/);
  await assert.rejects(restoreBackup(database, invalid), /duplicate/);
  assert.equal(await runTransaction(database, ["accounts"], "readonly", ({ store }) => store("accounts").count()), 1);
  database.close();
});

test("valid restore replaces all stores atomically and adds audit", async () => {
  const source = await db();
  await runTransaction(source, ["accounts"], "readwrite", ({ store }) => store("accounts").add({ id: "restored_1", updatedAt: new Date().toISOString() }));
  const backup = await createBackup(source);
  const target = await db();
  await restoreBackup(target, backup);
  assert.equal(await runTransaction(target, ["accounts"], "readonly", ({ store }) => store("accounts").count()), 1);
  assert.equal(await runTransaction(target, ["auditLogs"], "readonly", ({ store }) => store("auditLogs").count()), 1);
  source.close(); target.close();
});

test("invalid JSON and unsupported versions are rejected", async () => {
  await assert.rejects(parseBackup("not json"), SyntaxError);
  const payload = { format: "finorbit-backup", version: 99 };
  assert.throws(() => validateBackup(payload), /Unsupported/);
});

test("broken references are rejected during preview", () => {
  const payload = { format: "finorbit-backup", version: 1, schemaVersion: 1, stores: Object.fromEntries(STORE_NAMES.map((name) => [name, []])) };
  payload.stores.transactions.push({ id: "transaction_1", accountId: "missing_account" });
  assert.throws(() => validateBackup(payload), /broken reference/);
});
