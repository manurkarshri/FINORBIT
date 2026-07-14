import { STORE_DEFINITIONS } from "./schema.js";

export const MIGRATIONS = Object.freeze([
  {
    version: 1,
    description: "Create the empty Version 1 logical-store foundation",
    run({ database }) {
      for (const [name, definition] of Object.entries(STORE_DEFINITIONS)) {
        const store = database.objectStoreNames.contains(name)
          ? null
          : database.createObjectStore(name, { keyPath: definition.keyPath });
        if (!store) continue;
        for (const index of definition.indexes) store.createIndex(index.name, index.keyPath, { unique: false });
      }
    },
  },
  {
    version: 2,
    description: "Add explicit opening positions and entity query indexes",
    run({ database, transaction }) {
      const definition = STORE_DEFINITIONS.openingPositions;
      if (!database.objectStoreNames.contains("openingPositions")) {
        const store = database.createObjectStore("openingPositions", { keyPath: definition.keyPath });
        for (const index of definition.indexes) store.createIndex(index.name, index.keyPath, { unique: false });
      }
      for (const name of ["profiles", "accounts", "creditCards", "loans", "recurringRules", "investments", "properties", "vehicles"]) {
        const store = transaction.objectStore(name);
        if (!store.indexNames.contains("byStatus")) store.createIndex("byStatus", "status", { unique: false });
        if (!store.indexNames.contains("byNameKey")) store.createIndex("byNameKey", "nameKey", { unique: false });
      }
    },
  },
]);

export function runMigrations({ database, transaction, oldVersion, newVersion, migrations = MIGRATIONS }) {
  const ordered = [...migrations].sort((a, b) => a.version - b.version);
  for (const migration of ordered) {
    if (migration.version > oldVersion && migration.version <= newVersion) migration.run({ database, transaction, oldVersion, newVersion });
  }
}
