export const DATABASE_NAME = "finorbit";
export const SCHEMA_VERSION = 2;

export const STORE_NAMES = Object.freeze([
  "profiles", "accounts", "creditCards", "loans", "transactions", "transactionSplits",
  "recurringRules", "recurringOccurrences", "categories", "subcategories", "familyMembers",
  "merchants", "investments", "investmentLots", "marketPrices", "properties", "vehicles",
  "otherAssets", "budgets", "goals", "receipts", "notifications", "netWorthSnapshots",
  "reconciliations", "openingPositions", "auditLogs", "settings",
]);

export const STORE_DEFINITIONS = Object.freeze(Object.fromEntries(STORE_NAMES.map((name) => [name, {
  keyPath: "id",
  indexes: name === "auditLogs"
    ? [{ name: "byCreatedAt", keyPath: "createdAt" }, { name: "byType", keyPath: "type" }]
    : name === "settings"
      ? [{ name: "byUpdatedAt", keyPath: "updatedAt" }]
      : name === "openingPositions"
        ? [{ name: "byEntityId", keyPath: "entityId" }, { name: "byEffectiveDate", keyPath: "effectiveDate" }]
        : [{ name: "byUpdatedAt", keyPath: "updatedAt" }, { name: "byArchived", keyPath: "archived" }],
}])));
