import test from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { openDatabase } from "../src/database/connection.js";
import { STORE_NAMES } from "../src/database/schema.js";
import { runTransaction } from "../src/database/transaction.js";
import { createStoreRepository } from "../src/database/repository.js";
import { runMigrations } from "../src/database/migrations.js";
import { migrateThemePreference } from "../src/database/settings.js";

async function database(name = crypto.randomUUID()) { return openDatabase({ indexedDB: new IDBFactory(), name }); }

test("fresh database creates exactly the 26 approved stores with required indexes", async () => {
  const db = await database();
  assert.deepEqual([...db.objectStoreNames], [...STORE_NAMES].sort());
  const tx = db.transaction(["accounts", "auditLogs"]);
  assert.deepEqual([...tx.objectStore("accounts").indexNames], ["byArchived", "byUpdatedAt"]);
  assert.deepEqual([...tx.objectStore("auditLogs").indexNames], ["byCreatedAt", "byType"]);
  db.close();
});

test("multi-store transaction commits atomically", async () => {
  const db = await database();
  await runTransaction(db, ["accounts", "auditLogs"], "readwrite", async ({ store }) => {
    await store("accounts").add({ id: "account_123", updatedAt: new Date().toISOString() });
    await store("auditLogs").add({ id: "audit_123", type: "database.created", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  });
  assert.equal(await runTransaction(db, ["accounts"], "readonly", ({ store }) => store("accounts").count()), 1);
  db.close();
});

test("failed multi-store transaction rolls back all writes", async () => {
  const db = await database();
  await assert.rejects(runTransaction(db, ["accounts", "auditLogs"], "readwrite", async ({ store }) => {
    await store("accounts").add({ id: "account_123", updatedAt: new Date().toISOString() });
    await store("auditLogs").add({ id: "duplicate", type: "x" });
    await store("auditLogs").add({ id: "duplicate", type: "x" });
  }));
  assert.equal(await runTransaction(db, ["accounts"], "readonly", ({ store }) => store("accounts").count()), 0);
  db.close();
});

test("repository rejects unstable identifiers", async () => {
  const db = await database();
  const repository = createStoreRepository({ open: async () => db }, "accounts");
  await assert.rejects(repository.put({ id: "bad" }), { code: "INVALID_ID" });
  db.close();
});

test("migrations run in version order and skip completed versions", () => {
  const calls = [];
  runMigrations({ database: {}, transaction: {}, oldVersion: 1, newVersion: 4, migrations: [4, 2, 1, 3].map((version) => ({ version, run: () => calls.push(version) })) });
  assert.deepEqual(calls, [2, 3, 4]);
});

test("failed migration remains visible to the upgrade transaction", () => {
  assert.throws(() => runMigrations({ database: {}, transaction: {}, oldVersion: 0, newVersion: 1, migrations: [{ version: 1, run: () => { throw new Error("fixture failed"); } }] }), /fixture failed/);
});

test("theme preference migrates from localStorage once", async () => {
  const db = await database();
  const storage = { getItem: () => "dark" };
  assert.equal(await migrateThemePreference(db, storage), "dark");
  storage.getItem = () => "light";
  assert.equal(await migrateThemePreference(db, storage), "dark");
  db.close();
});
