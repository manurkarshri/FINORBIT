const REFS = { sourceAccountId: "accounts", destinationAccountId: "accounts", creditCardId: "creditCards", loanId: "loans", investmentId: "investments", propertyId: "properties", vehicleId: "vehicles", otherAssetId: "otherAssets", categoryId: "categories", familyMemberId: "familyMembers" };
const duplicateKey = (tx) => [tx.accountingDate, tx.type, tx.amountPaise, tx.sourceAccountId ?? "", tx.destinationAccountId ?? "", tx.creditCardId ?? ""].join("\u001f");

export function diagnoseIntegrity(stores, { generatedAt = new Date().toISOString() } = {}) {
  const issues = []; const transactions = stores.transactions ?? []; const txIds = new Set(transactions.map(({ id }) => id));
  const ids = Object.fromEntries(Object.entries(stores).map(([name, rows]) => [name, new Set(rows.map(({ id }) => id))]));
  for (const tx of transactions) for (const [field, store] of Object.entries(REFS)) if (tx[field] && !ids[store]?.has(tx[field])) issues.push({ code: "broken-reference", severity: "error", store: "transactions", recordId: tx.id, field, targetStore: store, targetId: tx[field], repair: "review-required" });
  for (const effect of stores.transactionEffects ?? []) if (!txIds.has(effect.transactionId)) issues.push({ code: "orphan-effect", severity: "error", store: "transactionEffects", recordId: effect.id, transactionId: effect.transactionId, repair: "archive-reversible" });
  const firstByKey = new Map();
  for (const tx of transactions) if (tx.status === "posted") { const key = duplicateKey(tx); const first = firstByKey.get(key); if (first) issues.push({ code: "possible-duplicate", severity: "warning", store: "transactions", recordId: first.id, duplicateId: tx.id, repair: "review-required" }); else firstByKey.set(key, tx); }
  return { generatedAt, issues, counts: issues.reduce((result, issue) => ({ ...result, [issue.code]: (result[issue.code] ?? 0) + 1 }), {},), healthy: !issues.some(({ severity }) => severity === "error") };
}
