import { DatabaseError, classifyDatabaseError } from "./errors.js";
import { runMigrations } from "./migrations.js";
import { DATABASE_NAME, SCHEMA_VERSION } from "./schema.js";

export function openDatabase({ indexedDB = globalThis.indexedDB, name = DATABASE_NAME, version = SCHEMA_VERSION, migrations, onBlocked = () => {}, onVersionChange = () => {} } = {}) {
  if (!indexedDB) return Promise.reject(new DatabaseError("UNSUPPORTED", "This browser does not provide IndexedDB."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onblocked = () => onBlocked({ name, version });
    request.onupgradeneeded = (event) => {
      try { runMigrations({ database: request.result, transaction: request.transaction, oldVersion: event.oldVersion, newVersion: event.newVersion, migrations }); }
      catch (error) { request.transaction.abort(); reject(classifyDatabaseError(error)); }
    };
    request.onerror = () => reject(classifyDatabaseError(request.error));
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = (event) => { database.close(); onVersionChange(event); };
      resolve(database);
    };
  });
}

export class ConnectionManager {
  #database = null;
  #opening = null;
  constructor(options = {}) { this.options = options; }
  async open() {
    if (this.#database) return this.#database;
    this.#opening ??= openDatabase(this.options).then((database) => (this.#database = database)).finally(() => { this.#opening = null; });
    return this.#opening;
  }
  close() { this.#database?.close(); this.#database = null; }
}
