import { STORE_NAMES, SCHEMA_VERSION } from "../database/schema.js";
import { runTransaction } from "../database/transaction.js";
import { encryptPayload } from "../security/crypto.js";

export const BACKUP_FORMAT = "finorbit-backup";
const SECURITY_SETTING_IDS = new Set(["security.credential", "security.lock"]);

export async function createBackup(database, { encrypted = false, secret, cryptoObject = globalThis.crypto, now = () => new Date().toISOString() } = {}) {
  const stores = await runTransaction(database, STORE_NAMES, "readonly", async ({ store }) => Object.fromEntries(await Promise.all(STORE_NAMES.map(async (name) => [name, await store(name).getAll()]))));
  if (!encrypted) stores.settings = stores.settings.filter((item) => !SECURITY_SETTING_IDS.has(item.id));
  const payload = { format: BACKUP_FORMAT, version: 1, app: "FinOrbit", schemaVersion: SCHEMA_VERSION, exportedAt: now(), encrypted, counts: Object.fromEntries(STORE_NAMES.map((name) => [name, stores[name].length])), stores };
  return encrypted ? encryptPayload(payload, secret, cryptoObject) : payload;
}
