import { createAuditEvent } from "../database/audit.js";
import { runTransaction } from "../database/transaction.js";
import { createOpaqueId, isIsoDate } from "../database/validation.js";
import { diagnoseIntegrity } from "../engines/integrity-engine.js";

const DIAGNOSTIC_STORES = ["transactions", "transactionEffects", "accounts", "creditCards", "loans", "investments", "properties", "vehicles", "otherAssets", "categories", "familyMembers"];

export function createReconciliationService(database, { transactions, now = () => new Date().toISOString(), id = () => createOpaqueId() } = {}) {
  async function balanceAt(accountId, statementDate) {
    return runTransaction(database, ["openingPositions", "transactionEffects", "transactions"], "readonly", async ({ store }) => {
      const openings = await store("openingPositions").indexGetAll("byEntityId", accountId);
      const effects = await store("transactionEffects").indexGetAll("byEntityId", accountId);
      const transactionRows = await store("transactions").getAll(); const txById = new Map(transactionRows.map((tx) => [tx.id, tx]));
      const opening = openings.filter((item) => item.entityType === "account" && (!item.effectiveDate || item.effectiveDate <= statementDate)).sort((a, b) => String(b.effectiveDate).localeCompare(String(a.effectiveDate)))[0]?.amountPaise ?? 0;
      return opening + effects.filter((effect) => effect.active && effect.entityType === "account" && txById.get(effect.transactionId)?.accountingDate <= statementDate).reduce((sum, effect) => sum + effect.amountPaise, 0);
    });
  }
  async function create({ accountId, statementDate, closingBalancePaise }) {
    if (!accountId || !isIsoDate(statementDate) || !Number.isSafeInteger(closingBalancePaise)) return { ok: false, errors: { input: "Choose an account, statement date, and valid closing balance." } };
    const account = await runTransaction(database, ["accounts"], "readonly", ({ store }) => store("accounts").get(accountId));
    if (!account || account.archived) return { ok: false, errors: { accountId: "Choose an active account." } };
    const projectedBalancePaise = await balanceAt(accountId, statementDate); const instant = now();
    const record = { id: id(), accountId, statementDate, closingBalancePaise, projectedBalancePaise, differencePaise: closingBalancePaise - projectedBalancePaise, status: "open", archived: false, createdAt: instant, updatedAt: instant, schemaVersion: 8 };
    await runTransaction(database, ["reconciliations", "auditLogs"], "readwrite", async ({ store }) => { await store("reconciliations").add(record); await store("auditLogs").add(createAuditEvent("reconciliation.created", { reconciliationId: record.id, accountId, differencePaise: record.differencePaise })); });
    return { ok: true, record };
  }
  async function workspace() {
    const [accounts, reconciliations, transactionRows] = await runTransaction(database, ["accounts", "reconciliations", "transactions"], "readonly", async ({ store }) => Promise.all([store("accounts").getAll(), store("reconciliations").getAll(), store("transactions").getAll()]));
    return { accounts: accounts.filter((item) => !item.archived), reconciliations: reconciliations.filter((item) => !item.archived).sort((a, b) => b.statementDate.localeCompare(a.statementDate)), transactions: transactionRows.filter((item) => item.status === "posted") };
  }
  async function markTransactions(reconciliationId, transactionIds, state) {
    if (!["cleared", "reconciled"].includes(state)) throw new TypeError("Choose cleared or reconciled state.");
    return runTransaction(database, ["reconciliations", "transactions", "transactionVersions", "auditLogs"], "readwrite", async ({ store }) => {
      const reconciliation = await store("reconciliations").get(reconciliationId); if (!reconciliation || reconciliation.status !== "open") throw new Error("Open reconciliation not found.");
      const changed = [];
      for (const transactionId of transactionIds) { const tx = await store("transactions").get(transactionId); if (!tx || tx.status !== "posted" || tx.accountingDate > reconciliation.statementDate || (tx.sourceAccountId !== reconciliation.accountId && tx.destinationAccountId !== reconciliation.accountId)) continue; await store("transactionVersions").add({ id: id(), transactionId: tx.id, version: "reconciliation", snapshot: { reconciliationState: tx.reconciliationState, reconciliationId: tx.reconciliationId }, createdAt: now(), updatedAt: now(), schemaVersion: 8 }); tx.reconciliationState = state; if (state === "reconciled") tx.reconciliationId = reconciliationId; tx.updatedAt = now(); await store("transactions").put(tx); changed.push(tx.id); }
      await store("auditLogs").add(createAuditEvent("transaction.cleared", { reconciliationId, state, transactionIds: changed })); return changed;
    });
  }
  async function complete(reconciliationId) { return runTransaction(database, ["reconciliations", "auditLogs"], "readwrite", async ({ store }) => { const record = await store("reconciliations").get(reconciliationId); if (!record) throw new Error("Reconciliation not found."); if (record.differencePaise !== 0) throw new Error("Resolve or explicitly correct the balance difference before completing reconciliation."); record.status = "completed"; record.completedAt = now(); record.updatedAt = record.completedAt; await store("reconciliations").put(record); await store("auditLogs").add(createAuditEvent("reconciliation.completed", { reconciliationId })); return record; }); }
  async function correction(reconciliationId, reason) { if (!reason?.trim()) return { ok: false, errors: { reason: "Explain why this correction is required." } }; const record = await runTransaction(database, ["reconciliations"], "readonly", ({ store }) => store("reconciliations").get(reconciliationId)); if (!record || !record.differencePaise) throw new Error("No reconciliation difference requires correction."); const result = await transactions.create({ type: "balance-correction", accountingDate: record.statementDate, amountPaise: Math.abs(record.differencePaise), currency: "INR", sourceAccountId: record.accountId, direction: record.differencePaise < 0 ? "decrease" : "increase", reason: reason.trim(), reconciliationId }); if (!result.ok) return result; record.projectedBalancePaise += record.differencePaise; record.differencePaise = 0; record.correctionTransactionId = result.transaction.id; record.correctionReason = reason.trim(); record.updatedAt = now(); await runTransaction(database, ["reconciliations"], "readwrite", ({ store }) => store("reconciliations").put(record)); return { ok: true, record, transaction: result.transaction }; }
  async function diagnose() { const stores = await runTransaction(database, DIAGNOSTIC_STORES, "readonly", async ({ store }) => Object.fromEntries(await Promise.all(DIAGNOSTIC_STORES.map(async (name) => [name, await store(name).getAll()])))); return diagnoseIntegrity(stores); }
  async function archiveOrphanEffect(effectId) { return runTransaction(database, ["transactionEffects", "auditLogs"], "readwrite", async ({ store }) => { const effect = await store("transactionEffects").get(effectId); if (!effect) throw new Error("Effect not found."); effect.archived = true; effect.activeBeforeRepair = effect.active; effect.active = false; effect.repairStatus = "archived-orphan"; effect.updatedAt = now(); await store("transactionEffects").put(effect); await store("auditLogs").add(createAuditEvent("integrity.repair", { store: "transactionEffects", recordId: effect.id, action: "archive-orphan", reversible: true })); return effect; }); }
  async function restoreEffect(effectId) { return runTransaction(database, ["transactionEffects", "auditLogs"], "readwrite", async ({ store }) => { const effect = await store("transactionEffects").get(effectId); if (effect?.repairStatus !== "archived-orphan") throw new Error("No reversible orphan repair found."); effect.archived = false; effect.active = effect.activeBeforeRepair; effect.repairStatus = null; effect.updatedAt = now(); await store("transactionEffects").put(effect); await store("auditLogs").add(createAuditEvent("integrity.repair", { store: "transactionEffects", recordId: effect.id, action: "restore-orphan" })); return effect; }); }
  return { create, workspace, markTransactions, complete, correction, diagnose, archiveOrphanEffect, restoreEffect, diagnosticJson: async () => JSON.stringify(await diagnose(), null, 2) };
}
