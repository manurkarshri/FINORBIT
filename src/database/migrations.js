import { STORE_DEFINITIONS } from "./schema.js";

export const MIGRATIONS = Object.freeze([
  {
    version: 1,
    description: "Create the empty Version 1 logical-store foundation",
    run({ database }) {
      for (const [name, definition] of Object.entries(STORE_DEFINITIONS).filter(([name]) => !["openingPositions", "transactionEffects", "transactionVersions"].includes(name))) {
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
  {
    version: 3,
    description: "Add transaction postings, immutable versions, and history indexes",
    run({ database, transaction }) {
      for (const name of ["transactionEffects", "transactionVersions"]) if (!database.objectStoreNames.contains(name)) {
        const definition = STORE_DEFINITIONS[name]; const store = database.createObjectStore(name, { keyPath: definition.keyPath });
        for (const index of definition.indexes) store.createIndex(index.name, index.keyPath, { unique: false });
      }
      const transactions = transaction.objectStore("transactions");
      for (const [name, keyPath] of [["byAccountingDate", "accountingDate"], ["byType", "type"], ["byStatus", "status"], ["bySourceAccountId", "sourceAccountId"], ["byDestinationAccountId", "destinationAccountId"], ["byCreditCardId", "creditCardId"], ["byLoanId", "loanId"], ["byInvestmentId", "investmentId"], ["byCategoryId", "categoryId"], ["byMerchantId", "merchantId"], ["byFamilyMemberId", "familyMemberId"], ["byReplacementOfId", "replacementOfId"]]) if (!transactions.indexNames.contains(name)) transactions.createIndex(name, keyPath, { unique: false });
      const receipts = transaction.objectStore("receipts"); if (!receipts.indexNames.contains("byTransactionId")) receipts.createIndex("byTransactionId", "transactionId", { unique: false });
      const splits = transaction.objectStore("transactionSplits"); if (!splits.indexNames.contains("byTransactionId")) splits.createIndex("byTransactionId", "transactionId", { unique: false });
    },
  },
]);

export function runMigrations({ database, transaction, oldVersion, newVersion, migrations = MIGRATIONS }) {
  const ordered = [...migrations].sort((a, b) => a.version - b.version);
  for (const migration of ordered) {
    if (migration.version > oldVersion && migration.version <= newVersion) migration.run({ database, transaction, oldVersion, newVersion });
  }
}
