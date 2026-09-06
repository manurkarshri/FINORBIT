import { STORE_NAMES } from "../database/schema.js";
import { runTransaction } from "../database/transaction.js";
import { assessStorage } from "../engines/storage-engine.js";

export function createStorageHealthService(database, { storage = globalThis.navigator?.storage } = {}) {
  async function status() {
    const receipts = await runTransaction(database, ["receipts"], "readonly", ({ store }) => store("receipts").getAll());
    let estimate = {}; let persisted = false;
    try { estimate = await storage?.estimate?.() ?? {}; persisted = await storage?.persisted?.() ?? false; } catch { estimate = {}; }
    return assessStorage({ usage: estimate.usage, quota: estimate.quota, receiptBytes: receipts.reduce((sum, item) => sum + (item.size ?? 0), 0), persisted });
  }
  async function requestPersistence() { if (!storage?.persist) return { supported: false, persisted: false }; try { return { supported: true, persisted: await storage.persist() }; } catch { return { supported: true, persisted: false }; } }
  async function databaseHealth() {
    try { const counts = await runTransaction(database, STORE_NAMES, "readonly", async ({ store }) => Object.fromEntries(await Promise.all(STORE_NAMES.map(async (name) => [name, (await store(name).getAll()).length])))); return { readable: true, counts }; }
    catch (error) { return { readable: false, error: error?.name ?? "DatabaseError" }; }
  }
  return { status, requestPersistence, databaseHealth };
}
