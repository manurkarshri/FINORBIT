import test from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { openDatabase } from "../src/database/connection.js";
import { STORE_NAMES } from "../src/database/schema.js";
import { runTransaction } from "../src/database/transaction.js";
import { createStoreRepository } from "../src/database/repository.js";
import { MIGRATIONS, runMigrations } from "../src/database/migrations.js";
import { migrateThemePreference } from "../src/database/settings.js";

async function database(name = crypto.randomUUID()) { return openDatabase({ indexedDB: new IDBFactory(), name }); }

test("fresh schema v3 creates entity and transaction stores with required indexes", async () => {
  const db = await database();
  assert.deepEqual([...db.objectStoreNames], [...STORE_NAMES].sort());
  const tx = db.transaction(["accounts", "auditLogs"]);
  assert.deepEqual([...tx.objectStore("accounts").indexNames], ["byArchived", "byNameKey", "byStatus", "byUpdatedAt"]);
  assert.deepEqual([...tx.objectStore("auditLogs").indexNames], ["byCreatedAt", "byType"]);
  db.close();
});

test("schema 2 upgrades to schema 3 preserving onboarding, openings, security and audit", async () => {
  const indexedDB = new IDBFactory(); const name = crypto.randomUUID(); const instant = new Date().toISOString();
  const v2 = await openDatabase({ indexedDB, name, version: 2, migrations: MIGRATIONS.slice(0, 2) }); await runTransaction(v2, ["settings", "openingPositions", "auditLogs"], "readwrite", async ({ store }) => { await store("settings").put({ id: "onboarding.progress", stage: 12, completed: true, updatedAt: instant }); await store("settings").put({ id: "security.credential", mode: "PIN", updatedAt: instant }); await store("openingPositions").put({ id: "opening_keep", entityId: "account_keep", amountPaise: 1, effectiveDate: "2026-07-01", updatedAt: instant }); await store("auditLogs").put({ id: "audit_keep", type: "onboarding.completed", createdAt: instant, updatedAt: instant }); }); v2.close();
  const v3 = await openDatabase({ indexedDB, name }); assert.equal((await runTransaction(v3, ["settings"], "readonly", ({ store }) => store("settings").get("onboarding.progress"))).completed, true); assert.equal(await runTransaction(v3, ["openingPositions"], "readonly", ({ store }) => store("openingPositions").count()), 1); assert.equal(await runTransaction(v3, ["auditLogs"], "readonly", ({ store }) => store("auditLogs").count()), 1); assert.equal(v3.objectStoreNames.contains("transactionEffects"), true); v3.close();
});

test("failed schema 3 migration rolls back and leaves schema 2 readable", async () => {
  const indexedDB = new IDBFactory(); const name = crypto.randomUUID(); const v2 = await openDatabase({ indexedDB, name, version: 2, migrations: MIGRATIONS.slice(0, 2) }); v2.close(); await assert.rejects(openDatabase({ indexedDB, name, version: 3, migrations: [...MIGRATIONS.slice(0, 2), { version: 3, run() { throw new Error("v3 failed"); } }] })); const reopened = await openDatabase({ indexedDB, name, version: 2, migrations: MIGRATIONS.slice(0, 2) }); assert.equal(reopened.objectStoreNames.contains("transactionEffects"), false); reopened.close();
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

test("schema 1 upgrades to schema 2 while preserving security settings and audit history", async () => {
  const indexedDB = new IDBFactory(); const name = crypto.randomUUID();
  const v1 = await openDatabase({ indexedDB, name, version: 1, migrations: [MIGRATIONS[0]] });
  await runTransaction(v1, ["settings", "auditLogs"], "readwrite", async ({ store }) => { await store("settings").put({ id: "security.credential", mode: "PIN", updatedAt: new Date().toISOString() }); await store("auditLogs").put({ id: "audit_old", type: "security.setup", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); }); v1.close();
  const v2 = await openDatabase({ indexedDB, name });
  assert.equal((await runTransaction(v2, ["settings"], "readonly", ({ store }) => store("settings").get("security.credential"))).mode, "PIN");
  assert.equal(await runTransaction(v2, ["auditLogs"], "readonly", ({ store }) => store("auditLogs").count()), 1); assert.equal(v2.objectStoreNames.contains("openingPositions"), true); v2.close();
});

test("failed schema 2 upgrade aborts without replacing schema 1 data", async () => {
  const indexedDB = new IDBFactory(); const name = crypto.randomUUID(); const v1 = await openDatabase({ indexedDB, name, version: 1, migrations: [MIGRATIONS[0]] });
  await runTransaction(v1, ["settings"], "readwrite", ({ store }) => store("settings").put({ id: "theme.preference", value: "dark", updatedAt: new Date().toISOString() })); v1.close();
  await assert.rejects(openDatabase({ indexedDB, name, version: 2, migrations: [MIGRATIONS[0], { version: 2, run() { throw new Error("synthetic migration failure"); } }] }));
  const reopened = await openDatabase({ indexedDB, name, version: 1, migrations: [MIGRATIONS[0]] }); assert.equal((await runTransaction(reopened, ["settings"], "readonly", ({ store }) => store("settings").get("theme.preference"))).value, "dark"); reopened.close();
});

test("theme preference migrates from localStorage once", async () => {
  const db = await database();
  const storage = { getItem: () => "dark" };
  assert.equal(await migrateThemePreference(db, storage), "dark");
  storage.getItem = () => "light";
  assert.equal(await migrateThemePreference(db, storage), "dark");
  db.close();
});
