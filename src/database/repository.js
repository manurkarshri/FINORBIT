import { runTransaction } from "./transaction.js";
import { assertStableRecord } from "./validation.js";

export function createStoreRepository(connectionManager, storeName) {
  return {
    async get(id) { return runTransaction(await connectionManager.open(), [storeName], "readonly", ({ store }) => store(storeName).get(id)); },
    async getAll() { return runTransaction(await connectionManager.open(), [storeName], "readonly", ({ store }) => store(storeName).getAll()); },
    async put(record) { assertStableRecord(record, { storeName }); return runTransaction(await connectionManager.open(), [storeName], "readwrite", ({ store }) => store(storeName).put(record)); },
    async delete(id) { return runTransaction(await connectionManager.open(), [storeName], "readwrite", ({ store }) => store(storeName).delete(id)); },
  };
}
