import { classifyDatabaseError } from "./errors.js";

export function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(classifyDatabaseError(request.error));
  });
}

export function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(classifyDatabaseError(transaction.error ?? new DOMException("Transaction aborted", "AbortError")));
    transaction.onerror = () => {};
  });
}
