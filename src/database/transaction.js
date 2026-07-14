import { classifyDatabaseError } from "./errors.js";
import { requestToPromise, transactionDone } from "./requests.js";

export async function runTransaction(database, storeNames, mode, operation) {
  if (!['readonly', 'readwrite'].includes(mode)) throw new TypeError("Transaction mode must be readonly or readwrite");
  const transaction = database.transaction(storeNames, mode);
  const done = transactionDone(transaction);
  const store = (name) => {
    const objectStore = transaction.objectStore(name);
    return {
      add: (value) => requestToPromise(objectStore.add(value)),
      put: (value) => requestToPromise(objectStore.put(value)),
      get: (key) => requestToPromise(objectStore.get(key)),
      getAll: () => requestToPromise(objectStore.getAll()),
      delete: (key) => requestToPromise(objectStore.delete(key)),
      clear: () => requestToPromise(objectStore.clear()),
      count: () => requestToPromise(objectStore.count()),
    };
  };
  try {
    const result = await operation({ store, mode, transaction });
    await done;
    return result;
  } catch (error) {
    try { transaction.abort(); } catch {}
    try { await done; } catch {}
    throw classifyDatabaseError(error);
  }
}
