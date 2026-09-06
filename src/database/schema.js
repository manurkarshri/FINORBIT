export const DATABASE_NAME = "finorbit";
export const SCHEMA_VERSION = 8;

export const STORE_NAMES = Object.freeze([
  "profiles", "accounts", "creditCards", "loans", "transactions", "transactionSplits",
  "recurringRules", "recurringOccurrences", "categories", "subcategories", "familyMembers",
  "merchants", "investments", "investmentLots", "marketPrices", "properties", "vehicles",
  "otherAssets", "budgets", "goals", "receipts", "notifications", "netWorthSnapshots",
  "reconciliations", "openingPositions", "transactionEffects", "transactionVersions", "auditLogs", "settings",
]);

export const STORE_DEFINITIONS = Object.freeze(Object.fromEntries(STORE_NAMES.map((name) => [name, {
  keyPath: "id",
  indexes: name === "auditLogs"
    ? [{ name: "byCreatedAt", keyPath: "createdAt" }, { name: "byType", keyPath: "type" }]
    : name === "settings"
      ? [{ name: "byUpdatedAt", keyPath: "updatedAt" }]
      : name === "openingPositions"
        ? [{ name: "byEntityId", keyPath: "entityId" }, { name: "byEffectiveDate", keyPath: "effectiveDate" }]
        : name === "transactionEffects"
          ? [{ name: "byTransactionId", keyPath: "transactionId" }, { name: "byEntityId", keyPath: "entityId" }, { name: "byDimension", keyPath: "dimension" }]
          : name === "transactionVersions"
            ? [{ name: "byTransactionId", keyPath: "transactionId" }, { name: "byCreatedAt", keyPath: "createdAt" }]
            : name === "transactions"
              ? [{ name: "byUpdatedAt", keyPath: "updatedAt" }, { name: "byArchived", keyPath: "archived" }, { name: "byRecurringOccurrenceId", keyPath: "recurringOccurrenceId", unique: true }]
            : name === "recurringOccurrences"
              ? [{ name: "byUpdatedAt", keyPath: "updatedAt" }, { name: "byArchived", keyPath: "archived" }, { name: "byRuleId", keyPath: "ruleId" }, { name: "byDueDate", keyPath: "dueDate" }, { name: "byStatus", keyPath: "status" }, { name: "byRuleDueDate", keyPath: ["ruleId", "originalDueDate"], unique: true }]
              : name === "notifications"
                ? [{ name: "byUpdatedAt", keyPath: "updatedAt" }, { name: "byArchived", keyPath: "archived" }, { name: "byOccurrenceId", keyPath: "occurrenceId", unique: true }, { name: "byScheduledFor", keyPath: "scheduledFor" }, { name: "byStatus", keyPath: "status" }]
                : name === "categories"
                  ? [{ name: "byUpdatedAt", keyPath: "updatedAt" }, { name: "byArchived", keyPath: "archived" }, { name: "byNameKey", keyPath: "nameKey", unique: true }, { name: "byClassification", keyPath: "classification" }]
                  : name === "subcategories"
                    ? [{ name: "byUpdatedAt", keyPath: "updatedAt" }, { name: "byArchived", keyPath: "archived" }, { name: "byCategoryId", keyPath: "categoryId" }]
                    : name === "familyMembers"
                      ? [{ name: "byUpdatedAt", keyPath: "updatedAt" }, { name: "byArchived", keyPath: "archived" }, { name: "byNameKey", keyPath: "nameKey" }]
                      : name === "budgets"
                        ? [{ name: "byUpdatedAt", keyPath: "updatedAt" }, { name: "byArchived", keyPath: "archived" }, { name: "byMonth", keyPath: "month" }, { name: "byCategoryMonth", keyPath: ["categoryId", "month"], unique: true }]
                        : name === "investmentLots"
                          ? [{ name: "byUpdatedAt", keyPath: "updatedAt" }, { name: "byArchived", keyPath: "archived" }, { name: "byInvestmentId", keyPath: "investmentId" }, { name: "byPurchaseDate", keyPath: "purchaseDate" }]
                          : name === "marketPrices"
                            ? [{ name: "byUpdatedAt", keyPath: "updatedAt" }, { name: "byArchived", keyPath: "archived" }, { name: "byEntityId", keyPath: "entityId" }, { name: "byValuationDate", keyPath: "valuationDate" }, { name: "byProvider", keyPath: "provider" }]
                            : name === "goals"
                              ? [{ name: "byUpdatedAt", keyPath: "updatedAt" }, { name: "byArchived", keyPath: "archived" }, { name: "byTargetDate", keyPath: "targetDate" }, { name: "byStatus", keyPath: "status" }]
                              : name === "reconciliations"
                                ? [{ name: "byUpdatedAt", keyPath: "updatedAt" }, { name: "byArchived", keyPath: "archived" }, { name: "byAccountId", keyPath: "accountId" }, { name: "byStatementDate", keyPath: "statementDate" }, { name: "byStatus", keyPath: "status" }]
                : [{ name: "byUpdatedAt", keyPath: "updatedAt" }, { name: "byArchived", keyPath: "archived" }],
}])));
