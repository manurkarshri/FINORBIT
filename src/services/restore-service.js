import { STORE_NAMES, SCHEMA_VERSION } from "../database/schema.js";
import { runTransaction } from "../database/transaction.js";
import { BACKUP_FORMAT } from "./backup-service.js";
import { decryptPayload } from "../security/crypto.js";
import { createAuditEvent } from "../database/audit.js";

export function validateBackup(payload) {
  if (payload?.format !== BACKUP_FORMAT || payload?.version !== 1) throw new Error("Unsupported backup format");
  if (payload.schemaVersion > SCHEMA_VERSION) throw new Error("This backup requires a newer FinOrbit schema");
  const ids = new Set();
  const idsByStore = new Map();
  for (const name of STORE_NAMES) {
    if (!Array.isArray(payload.stores?.[name])) throw new Error(`Backup store ${name} is missing`);
    idsByStore.set(name, new Set());
    for (const record of payload.stores[name]) {
      if (!record || typeof record.id !== "string" || !record.id) throw new Error(`${name} contains an invalid record`);
      const compound = `${name}:${record.id}`;
      if (ids.has(compound)) throw new Error(`${name} contains duplicate IDs`);
      ids.add(compound);
      idsByStore.get(name).add(record.id);
    }
  }
  const relationships = { profileId: "profiles", accountId: "accounts", creditCardId: "creditCards", loanId: "loans", transactionId: "transactions", categoryId: "categories", subcategoryId: "subcategories", familyMemberId: "familyMembers", merchantId: "merchants", investmentId: "investments", propertyId: "properties", vehicleId: "vehicles", budgetId: "budgets", goalId: "goals" };
  for (const name of STORE_NAMES) for (const record of payload.stores[name]) for (const [field, target] of Object.entries(relationships)) {
    if (record[field] != null && !idsByStore.get(target).has(record[field])) throw new Error(`${name}.${field} has a broken reference`);
  }
  return {
    schemaVersion: payload.schemaVersion,
    counts: Object.fromEntries(STORE_NAMES.map((name) => [name, payload.stores[name].length])),
    exportedAt: payload.exportedAt,
    restoresAppLock: payload.stores.settings.some((record) => record.id === "security.credential"),
  };
}

export async function parseBackup(text, { secret, cryptoObject = globalThis.crypto, maxBytes = 25 * 1024 * 1024 } = {}) {
  if (new TextEncoder().encode(text).length > maxBytes) throw new Error("Backup exceeds the 25 MB safety limit");
  const parsed = JSON.parse(text);
  const payload = parsed?.format === "finorbit-encrypted-envelope" ? await decryptPayload(parsed, secret, cryptoObject) : parsed;
  return { payload, preview: validateBackup(payload) };
}

export async function restoreBackup(database, payload) {
  validateBackup(payload);
  await runTransaction(database, STORE_NAMES, "readwrite", async ({ store }) => {
    for (const name of STORE_NAMES) {
      await store(name).clear();
      for (const record of payload.stores[name]) await store(name).add(record);
    }
    await store("auditLogs").add(createAuditEvent("restore.completed", { schemaVersion: payload.schemaVersion }));
  });
}
