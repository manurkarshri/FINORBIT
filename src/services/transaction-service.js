import { createOpaqueId } from "../database/validation.js";
import { runTransaction } from "../database/transaction.js";
import { createAuditEvent } from "../database/audit.js";
import { buildPostings, reversePostings, validateTransaction } from "../engines/posting-engine.js";

const REFS = { sourceAccountId: "accounts", destinationAccountId: "accounts", creditCardId: "creditCards", loanId: "loans", investmentId: "investments", propertyId: "properties", vehicleId: "vehicles", otherAssetId: "otherAssets", categoryId: "categories", subcategoryId: "subcategories", familyMemberId: "familyMembers", recurringRuleId: "recurringRules", originalTransactionId: "transactions" };
const QUERY_INDEX = { type: "byType", status: "byStatus", sourceAccountId: "bySourceAccountId", destinationAccountId: "byDestinationAccountId", creditCardId: "byCreditCardId", loanId: "byLoanId", investmentId: "byInvestmentId", categoryId: "byCategoryId", merchantId: "byMerchantId", familyMemberId: "byFamilyMemberId", accountingDate: "byAccountingDate" };
export const DEFAULT_CATEGORIES = Object.freeze(["Income", "Housing", "Groceries", "Food", "Utilities", "Transport", "Education", "Family", "Healthcare", "Insurance", "Personal", "Entertainment", "Travel", "Taxes", "Financial charges", "Business", "Agriculture", "Donations", "Miscellaneous"]);

export async function ensureDefaultCategories(database, { now = () => new Date().toISOString() } = {}) {
  const existing = await runTransaction(database, ["categories"], "readonly", ({ store }) => store("categories").count()); if (existing) return;
  const instant = now(); await runTransaction(database, ["categories"], "readwrite", async ({ store }) => { for (const name of DEFAULT_CATEGORIES) await store("categories").add({ id: `category_${name.toLocaleLowerCase("en-IN").replaceAll(" ", "_")}`, name, nameKey: name.toLocaleLowerCase("en-IN"), status: "active", archived: false, createdAt: instant, updatedAt: instant, schemaVersion: 3 }); });
}

export async function validateLinkedEntityEligibility(database, input) {
  const errors = {}; const records = {};
  for (const [field, storeName] of Object.entries(REFS)) if (input[field]) { const record = await runTransaction(database, [storeName], "readonly", ({ store }) => store(storeName).get(input[field])); records[field] = record; if (!record) errors[field] = "Choose an existing related record."; }
  for (const field of ["sourceAccountId", "destinationAccountId"]) if (input[field] && records[field] && (records[field].archived || records[field].status !== "active")) errors[field] = "New transactions require an active, non-archived account.";
  const card = records.creditCardId; if (card) { if (card.archived) errors.creditCardId = "Archived cards cannot receive new transactions."; else if (input.type === "credit-card-purchase" && card.status !== "active") errors.creditCardId = "Card purchases require an active card."; else if (input.type === "credit-card-payment" && !["active", "blocked", "closed"].includes(card.status)) errors.creditCardId = "Card payments require an active or blocked card."; else if (input.type === "credit-card-payment" && card.status === "closed") { const outstanding = await projectionFor(database, "creditCard", card.id); if (outstanding <= 0) errors.creditCardId = "A closed card accepts only an explicit payoff while outstanding remains."; } }
  const loan = records.loanId; if (loan) { if (loan.archived) errors.loanId = "Archived loans cannot receive new transactions."; else if (input.type === "loan-payment" && !["active", "paused"].includes(loan.status)) errors.loanId = "Normal loan payments require an active or paused loan; use correction for a closed loan."; else if (input.type === "loan-disbursement" && loan.status !== "active") errors.loanId = "Loan disbursement requires an active loan."; }
  const investment = records.investmentId; if (investment && (investment.archived || investment.status !== "active")) errors.investmentId = "Investment purchases and sales require an active, non-archived holding.";
  for (const field of ["propertyId", "vehicleId", "otherAssetId"]) { const asset = records[field]; if (asset && (asset.archived || asset.status !== "active")) errors[field] = "Physical-asset transactions require an active, non-archived and unsold asset."; }
  return errors;
}

async function projectionFor(database, entityType, entityId) { const opening = await runTransaction(database, ["openingPositions"], "readonly", ({ store }) => store("openingPositions").indexGetAll("byEntityId", entityId)); const effects = await runTransaction(database, ["transactionEffects"], "readonly", ({ store }) => store("transactionEffects").indexGetAll("byEntityId", entityId)); return (opening[0]?.amountPaise ?? 0) + effects.filter((p) => p.active && p.entityType === entityType).reduce((sum, p) => sum + p.amountPaise, 0); }

export function createTransactionService(database, { now = () => new Date().toISOString(), id = () => createOpaqueId() } = {}) {
  async function validate(input, splits) {
    const errors = validateTransaction(input, splits);
    Object.assign(errors, await validateLinkedEntityEligibility(database, input));
    return errors;
  }
  async function create(input, { splits = [], auditType = "transaction.created" } = {}) {
    const errors = await validate(input, splits); if (Object.keys(errors).length) return { ok: false, errors };
    const instant = now(); let merchant; let similarMerchant = false;
    if (input.merchantText?.trim()) { const nameKey = input.merchantText.trim().toLocaleLowerCase("en-IN"); const merchants = await runTransaction(database, ["merchants"], "readonly", ({ store }) => store("merchants").getAll()); merchant = merchants.find((item) => item.nameKey === nameKey); similarMerchant = !merchant && merchants.some((item) => item.nameKey.includes(nameKey) || nameKey.includes(item.nameKey)); merchant ??= { id: id(), name: input.merchantText.trim(), nameKey, status: "active", archived: false, createdAt: instant, updatedAt: instant, schemaVersion: 3 }; }
    const transaction = { ...input, id: input.id ?? id(), merchantId: merchant?.id, currency: "INR", status: input.status ?? "posted", tags: [...new Set(input.tags ?? [])], receiptIds: input.receiptIds ?? [], reconciliationState: input.reconciliationState ?? "unreconciled", createdAt: input.createdAt ?? instant, updatedAt: instant, schemaVersion: 3 };
    const postings = buildPostings(transaction).map((posting) => ({ ...posting, id: id(), transactionId: transaction.id, active: true, createdAt: instant, updatedAt: instant, schemaVersion: 3 }));
    await runTransaction(database, ["transactions", "transactionEffects", "transactionSplits", "transactionVersions", "merchants", "auditLogs"], "readwrite", async ({ store }) => {
      if (merchant && !(await store("merchants").get(merchant.id))) await store("merchants").add(merchant);
      await store("transactions").add(transaction);
      for (const posting of postings) await store("transactionEffects").add(posting);
      for (let index = 0; index < splits.length; index++) await store("transactionSplits").add({ ...splits[index], id: id(), transactionId: transaction.id, order: index, createdAt: instant, updatedAt: instant, schemaVersion: 3 });
      await store("transactionVersions").add({ id: id(), transactionId: transaction.id, version: 1, snapshot: transaction, createdAt: instant, updatedAt: instant, schemaVersion: 3 });
      await store("auditLogs").add(createAuditEvent(auditType, { transactionId: transaction.id, type: transaction.type }));
      if (transaction.type === "balance-correction") await store("auditLogs").add(createAuditEvent("balance-correction.created", { transactionId: transaction.id }));
      if (splits.length) await store("auditLogs").add(createAuditEvent("split.changed", { transactionId: transaction.id, count: splits.length }));
    });
    return { ok: true, transaction, postings, warnings: [...await warnings(transaction), ...(similarMerchant ? ["A similar merchant name already exists."] : [])] };
  }
  async function replace(transactionId, changes, { splits = [] } = {}) {
    const original = await get(transactionId); if (!original || original.status !== "posted") throw new Error("Only a posted transaction can be replaced.");
    const input = { ...original, ...changes, id: undefined, createdAt: undefined, replacementOfId: original.id, originalTransactionId: original.originalTransactionId ?? original.id, status: "posted" };
    const errors = await validate(input, splits); if (Object.keys(errors).length) return { ok: false, errors };
    const instant = now(); const replacement = { ...input, id: id(), createdAt: instant, updatedAt: instant, schemaVersion: 3 }; const postings = buildPostings(replacement).map((posting) => ({ ...posting, id: id(), transactionId: replacement.id, active: true, createdAt: instant, updatedAt: instant, schemaVersion: 3 }));
    await runTransaction(database, ["transactions", "transactionEffects", "transactionSplits", "transactionVersions", "auditLogs"], "readwrite", async ({ store }) => {
      const active = await store("transactionEffects").indexGetAll("byTransactionId", original.id); for (const posting of active) { posting.active = false; posting.updatedAt = instant; await store("transactionEffects").put(posting); }
      original.status = "voided"; original.voidReason = "Replaced by an edited transaction"; original.replacedById = replacement.id; original.updatedAt = instant; await store("transactions").put(original); await store("transactions").add(replacement);
      for (const posting of postings) await store("transactionEffects").add(posting); for (let index = 0; index < splits.length; index++) await store("transactionSplits").add({ ...splits[index], id: id(), transactionId: replacement.id, order: index, createdAt: instant, updatedAt: instant, schemaVersion: 3 });
      await store("transactionVersions").add({ id: id(), transactionId: original.id, version: 2, snapshot: replacement, replacementId: replacement.id, createdAt: instant, updatedAt: instant, schemaVersion: 3 });
      await store("transactionVersions").add({ id: id(), transactionId: replacement.id, version: 1, snapshot: replacement, originalTransactionId: original.id, createdAt: instant, updatedAt: instant, schemaVersion: 3 }); await store("auditLogs").add(createAuditEvent("transaction.replaced", { transactionId: original.id, replacementId: replacement.id })); if (splits.length) await store("auditLogs").add(createAuditEvent("split.changed", { transactionId: replacement.id, count: splits.length }));
    }); return { ok: true, transaction: replacement, postings, warnings: await warnings(replacement) };
  }
  async function voidTransaction(transactionId, reason, { replacementId, auditType = "transaction.voided" } = {}) {
    if (!reason?.trim()) throw new Error("A reason is required.");
    return runTransaction(database, ["transactions", "transactionEffects", "auditLogs"], "readwrite", async ({ store }) => {
      const transaction = await store("transactions").get(transactionId); if (!transaction || transaction.status !== "posted") throw new Error("Transaction is not currently posted.");
      const active = await store("transactionEffects").indexGetAll("byTransactionId", transactionId); for (const posting of active) { posting.active = false; posting.updatedAt = now(); await store("transactionEffects").put(posting); }
      transaction.status = "voided"; transaction.voidReason = reason; transaction.replacedById = replacementId; transaction.updatedAt = now(); await store("transactions").put(transaction); await store("auditLogs").add(createAuditEvent(auditType, { transactionId, replacementId })); return transaction;
    });
  }
  async function restore(transactionId, reason = "Restored by user") {
    return runTransaction(database, ["transactions", "transactionEffects", "auditLogs"], "readwrite", async ({ store }) => {
      const transaction = await store("transactions").get(transactionId); if (!transaction || transaction.status !== "voided" || transaction.replacedById) throw new Error("This transaction cannot be safely restored.");
      const postings = await store("transactionEffects").indexGetAll("byTransactionId", transactionId); if (postings.some((p) => p.active)) throw new Error("Transaction effects are already active.");
      for (const posting of postings) { posting.active = true; posting.updatedAt = now(); await store("transactionEffects").put(posting); } transaction.status = "posted"; transaction.restoreReason = reason; transaction.updatedAt = now(); await store("transactions").put(transaction); await store("auditLogs").add(createAuditEvent("transaction.restored", { transactionId })); return transaction;
    });
  }
  async function duplicate(transactionId, accountingDate, { includeReceipts = false } = {}) { const original = await get(transactionId); if (!original) throw new Error("Transaction not found."); const { id: _, createdAt: __, updatedAt: ___, receiptIds, replacementOfId, replacedById, voidReason, ...copy } = original; return create({ ...copy, accountingDate, status: "posted", receiptIds: includeReceipts ? receiptIds : [] }, { auditType: "transaction.duplicated" }); }
  async function get(transactionId) { return runTransaction(database, ["transactions"], "readonly", ({ store }) => store("transactions").get(transactionId)); }
  async function details(transactionId) { return runTransaction(database, ["transactions", "transactionEffects", "transactionSplits", "receipts", "transactionVersions", "auditLogs"], "readonly", async ({ store }) => ({ transaction: await store("transactions").get(transactionId), effects: await store("transactionEffects").indexGetAll("byTransactionId", transactionId), splits: await store("transactionSplits").indexGetAll("byTransactionId", transactionId), receipts: (await store("receipts").indexGetAll("byTransactionId", transactionId)).map(({ contentBase64, ...metadata }) => metadata), versions: await store("transactionVersions").indexGetAll("byTransactionId", transactionId), audit: (await store("auditLogs").getAll()).filter((event) => event.detail?.transactionId === transactionId) })); }
  async function list(filters = {}) {
    const indexed = Object.entries(QUERY_INDEX).find(([field]) => filters[field] != null && filters[field] !== "");
    let records = await runTransaction(database, ["transactions"], "readonly", ({ store }) => indexed ? store("transactions").indexGetAll(QUERY_INDEX[indexed[0]], filters[indexed[0]]) : store("transactions").getAll());
    records = records.filter((tx) => (!filters.dateFrom || tx.accountingDate >= filters.dateFrom) && (!filters.dateTo || tx.accountingDate <= filters.dateTo) && (!filters.merchant || String(tx.merchantText ?? "").toLocaleLowerCase("en-IN").includes(filters.merchant.toLocaleLowerCase("en-IN"))) && (!filters.tag || tx.tags?.includes(filters.tag)) && (filters.minAmountPaise == null || tx.amountPaise >= filters.minAmountPaise) && (filters.maxAmountPaise == null || tx.amountPaise <= filters.maxAmountPaise) && (filters.hasReceipt == null || Boolean(tx.receiptIds?.length) === filters.hasReceipt));
    for (const [field] of Object.entries(QUERY_INDEX)) if (filters[field] != null && filters[field] !== "" && (!indexed || field !== indexed[0])) records = records.filter((tx) => tx[field] === filters[field]);
    if (filters.search) { const needle = filters.search.toLocaleLowerCase("en-IN"); records = records.filter((tx) => [tx.merchantText, tx.notes, ...(tx.tags ?? [])].some((value) => String(value ?? "").toLocaleLowerCase("en-IN").includes(needle))); }
    return records.sort((a, b) => b.accountingDate.localeCompare(a.accountingDate) || b.createdAt.localeCompare(a.createdAt));
  }
  async function warnings(tx) { if (tx.type !== "credit-card-payment") return []; const projection = await project("creditCard", tx.creditCardId); return projection < 0 ? ["This payment creates a credit balance on the card."] : []; }
  async function project(entityType, entityId) {
    const opening = await runTransaction(database, ["openingPositions"], "readonly", ({ store }) => store("openingPositions").indexGetAll("byEntityId", entityId));
    const effects = await runTransaction(database, ["transactionEffects"], "readonly", ({ store }) => store("transactionEffects").indexGetAll("byEntityId", entityId));
    return (opening[0]?.amountPaise ?? 0) + effects.filter((p) => p.active && p.entityType === entityType).reduce((sum, p) => sum + p.amountPaise, 0);
  }
  return { create, replace, void: voidTransaction, restore, duplicate, get, details, list, project };
}
