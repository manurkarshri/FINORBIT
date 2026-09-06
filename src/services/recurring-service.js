import { createAuditEvent } from "../database/audit.js";
import { runTransaction } from "../database/transaction.js";
import { isIntegerPaise, isIsoDate } from "../database/validation.js";
import { classifyOccurrenceStatus, createOccurrence, generateOccurrenceDates, TERMINAL_OCCURRENCE_STATUSES } from "../engines/recurrence-engine.js";

const LIVE_STATUSES = new Set(["scheduled", "due-soon", "due-today", "overdue"]);

export function createRecurringService(database, { now = () => new Date().toISOString(), dueSoonDays = 3, transactions } = {}) {
  async function generate(fromDate, toDate, { today = now().slice(0, 10) } = {}) {
    if (!isIsoDate(fromDate) || !isIsoDate(toDate) || fromDate > toDate) throw new TypeError("Enter a valid generation range.");
    const result = await runTransaction(database, ["recurringRules", "recurringOccurrences", "notifications", "auditLogs"], "readwrite", async ({ store }) => {
      const rules = await store("recurringRules").getAll(); const existing = await store("recurringOccurrences").getAll();
      const byId = new Map(existing.map((item) => [item.id, item])); const created = []; const refreshed = [];
      for (const rule of rules) for (const dueDate of generateOccurrenceDates(rule, fromDate, toDate)) {
        const candidate = createOccurrence(rule, dueDate, { now, today, dueSoonDays }); const prior = byId.get(candidate.id);
        if (!prior) {
          await store("recurringOccurrences").add(candidate); byId.set(candidate.id, candidate); created.push(candidate);
          await store("notifications").add({ id: `reminder_${candidate.id}`, occurrenceId: candidate.id, ruleId: rule.id, scheduledFor: dueDate, status: "pending", channel: "in-app", archived: false, createdAt: candidate.createdAt, updatedAt: candidate.updatedAt, schemaVersion: 4 });
        } else if (LIVE_STATUSES.has(prior.status)) {
          const status = classifyOccurrenceStatus(prior.dueDate, today, dueSoonDays);
          if (status !== prior.status) { prior.status = status; prior.updatedAt = now(); await store("recurringOccurrences").put(prior); refreshed.push(prior); }
        }
      }
      if (created.length) await store("auditLogs").add(createAuditEvent("recurring.generated", { fromDate, toDate, occurrenceCount: created.length, ruleCount: new Set(created.map(({ ruleId }) => ruleId)).size }));
      return { created, refreshed, occurrenceCount: byId.size };
    });
    result.autoPosted = [];
    for (const occurrence of result.created.filter((item) => item.autoPost && item.dueDate <= today && (item.sourceAccountId || item.destinationAccountId))) {
      result.autoPosted.push(await confirmAndPost(occurrence.id, { autoPosted: true }));
    }
    return result;
  }

  async function list({ fromDate, toDate, statuses, ruleId, includeArchived = false, today = now().slice(0, 10) } = {}) {
    let items = await runTransaction(database, ["recurringOccurrences"], "readonly", ({ store }) => store("recurringOccurrences").getAll());
    items = items.filter((item) => (includeArchived || !item.archived) && (!fromDate || item.dueDate >= fromDate) && (!toDate || item.dueDate <= toDate) && (!ruleId || item.ruleId === ruleId) && (!statuses?.length || statuses.includes(item.status)));
    return items.map((item) => LIVE_STATUSES.has(item.status) ? { ...item, status: classifyOccurrenceStatus(item.dueDate, today, dueSoonDays) } : item).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name));
  }

  async function listRules({ includeArchived = false } = {}) {
    const rules = await runTransaction(database, ["recurringRules"], "readonly", ({ store }) => store("recurringRules").getAll());
    return rules.filter((rule) => includeArchived || !rule.archived).sort((a, b) => a.name.localeCompare(b.name));
  }

  async function setRuleStatus(ruleId, status) {
    if (!["active", "inactive"].includes(status)) throw new TypeError("Choose active or inactive recurring status.");
    return runTransaction(database, ["recurringRules", "auditLogs"], "readwrite", async ({ store }) => {
      const rule = await store("recurringRules").get(ruleId); if (!rule) throw new Error("Recurring rule not found.");
      rule.status = status; rule.updatedAt = now(); await store("recurringRules").put(rule);
      await store("auditLogs").add(createAuditEvent("entity.edited", { entityType: rule.kind === "income" ? "incomeSource" : "commitment", entityId: rule.id, recurringStatus: status })); return rule;
    });
  }

  async function deliverDueReminders(deliver, { today = now().slice(0, 10) } = {}) {
    if (typeof deliver !== "function") throw new TypeError("A reminder delivery function is required.");
    const [reminders, occurrences] = await Promise.all([
      runTransaction(database, ["notifications"], "readonly", ({ store }) => store("notifications").getAll()),
      runTransaction(database, ["recurringOccurrences"], "readonly", ({ store }) => store("recurringOccurrences").getAll()),
    ]); const occurrenceById = new Map(occurrences.map((item) => [item.id, item])); const delivered = [];
    for (const reminder of reminders.filter((item) => item.status === "pending" && item.scheduledFor <= today)) {
      const occurrence = occurrenceById.get(reminder.occurrenceId); if (!occurrence || TERMINAL_OCCURRENCE_STATUSES.includes(occurrence.status)) continue;
      await deliver({ reminder, occurrence }); reminder.status = "delivered"; reminder.deliveredAt = now(); reminder.updatedAt = reminder.deliveredAt;
      await runTransaction(database, ["notifications"], "readwrite", ({ store }) => store("notifications").put(reminder)); delivered.push(reminder);
    }
    return delivered;
  }

  async function transition(occurrenceId, action, detail = {}) {
    return runTransaction(database, ["recurringOccurrences", "notifications", "auditLogs"], "readwrite", async ({ store }) => {
      const occurrence = await store("recurringOccurrences").get(occurrenceId); if (!occurrence) throw new Error("Recurring occurrence not found.");
      if (TERMINAL_OCCURRENCE_STATUSES.includes(occurrence.status)) throw new Error("Completed occurrences cannot be changed.");
      const instant = now(); let auditType;
      if (action === "skip") { occurrence.status = "skipped"; occurrence.skipReason = String(detail.reason ?? "").trim() || null; auditType = "recurring.skipped"; }
      else if (action === "postpone") {
        if (!isIsoDate(detail.dueDate) || detail.dueDate <= occurrence.dueDate) throw new TypeError("Postponed date must be later than the current due date.");
        occurrence.dueDate = detail.dueDate; occurrence.status = "postponed"; auditType = "recurring.postponed";
      } else if (action === "confirm") {
        const amount = detail.actualAmountPaise ?? (occurrence.estimateType === "fixed" ? occurrence.expectedAmountPaise : null);
        if (!isIntegerPaise(amount)) throw new TypeError("Confirm variable occurrences with an actual amount in whole paise.");
        occurrence.actualAmountPaise = amount; occurrence.status = detail.autoPosted ? "auto-posted" : occurrence.kind === "income" ? "received" : "paid"; occurrence.completionKind = occurrence.kind === "income" ? "received" : "paid"; occurrence.confirmedAt = instant; occurrence.transactionId = detail.transactionId ?? null; auditType = "recurring.confirmed";
      } else throw new TypeError("Unsupported recurring occurrence action.");
      occurrence.updatedAt = instant; await store("recurringOccurrences").put(occurrence);
      const reminder = await store("notifications").get(`reminder_${occurrence.id}`);
      if (reminder) { reminder.status = action === "postpone" ? "pending" : "dismissed"; reminder.scheduledFor = occurrence.dueDate; reminder.updatedAt = instant; await store("notifications").put(reminder); }
      await store("auditLogs").add(createAuditEvent(auditType, { occurrenceId, ruleId: occurrence.ruleId, dueDate: occurrence.dueDate })); return occurrence;
    });
  }
  async function confirmAndPost(occurrenceId, detail = {}) {
    const occurrence = await runTransaction(database, ["recurringOccurrences"], "readonly", ({ store }) => store("recurringOccurrences").get(occurrenceId));
    if (!occurrence) throw new Error("Recurring occurrence not found.");
    const amountPaise = detail.actualAmountPaise ?? (occurrence.estimateType === "fixed" ? occurrence.expectedAmountPaise : null);
    if (!isIntegerPaise(amountPaise)) throw new TypeError("Confirm variable occurrences with an actual amount in whole paise.");
    let transactionId = null; const accountId = occurrence.kind === "income" ? occurrence.destinationAccountId : occurrence.sourceAccountId;
    if (transactions && accountId) {
      const transaction = { type: occurrence.kind === "income" ? "income" : "expense", accountingDate: detail.accountingDate ?? occurrence.dueDate, amountPaise, currency: "INR", categoryId: occurrence.categoryId, merchantText: occurrence.name, recurringOccurrenceId: occurrence.id, [occurrence.kind === "income" ? "destinationAccountId" : "sourceAccountId"]: accountId };
      const posted = await transactions.create(transaction); if (!posted.ok) throw new Error(Object.values(posted.errors)[0]); transactionId = posted.transaction.id;
    }
    return transition(occurrenceId, "confirm", { actualAmountPaise: amountPaise, transactionId, autoPosted: Boolean(detail.autoPosted) });
  }
  return { generate, list, listRules, setRuleStatus, transition, confirmAndPost, deliverDueReminders };
}
