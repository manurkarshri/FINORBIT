import { DATABASE_NAME } from "../database/schema.js";
import { requestToPromise } from "../database/requests.js";

export async function resetApplicationData({ manager, coordination, indexedDBObject = globalThis.indexedDB } = {}) {
  manager?.close();
  await requestToPromise(indexedDBObject.deleteDatabase(DATABASE_NAME));
  try { globalThis.localStorage?.removeItem("finorbit.theme"); } catch {}
  coordination?.publish("reset", { reason: "data-reset" });
}
