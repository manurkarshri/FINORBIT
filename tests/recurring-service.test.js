import test from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { openDatabase } from "../src/database/connection.js";
import { runTransaction } from "../src/database/transaction.js";
import { createRecurringService } from "../src/services/recurring-service.js";
import { createTransactionService } from "../src/services/transaction-service.js";

async function fixture() {
  const database = await openDatabase({ indexedDB: new IDBFactory(), name: crypto.randomUUID() }); const instant = "2026-09-05T10:00:00.000Z";
  await runTransaction(database, ["recurringRules"], "readwrite", ({ store }) => Promise.all([
    store("recurringRules").add({ id: "rule_salary", name: "Salary", kind: "income", frequency: "monthly", expectedAmountPaise: 100000, estimateType: "fixed", startDate: "2026-08-05", status: "active", archived: false }),
    store("recurringRules").add({ id: "rule_power", name: "Power bill", kind: "commitment", frequency: "monthly", expectedAmountPaise: 5000, estimateType: "variable", startDate: "2026-08-07", status: "active", archived: false }),
  ]));
  return { database, service: createRecurringService(database, { now: () => instant }) };
}

test("generation is idempotent and creates one reminder per occurrence", async () => {
  const { database, service } = await fixture();
  assert.equal((await service.generate("2026-08-01", "2026-09-30")).created.length, 4);
  assert.equal((await service.generate("2026-08-01", "2026-09-30")).created.length, 0);
  assert.equal(await runTransaction(database, ["recurringOccurrences"], "readonly", ({ store }) => store("recurringOccurrences").count()), 4);
  assert.equal(await runTransaction(database, ["notifications"], "readonly", ({ store }) => store("notifications").count()), 4); database.close();
});

test("due items remain visible and live statuses refresh", async () => {
  const { database, service } = await fixture(); await service.generate("2026-09-01", "2026-09-30");
  assert.deepEqual((await service.list({ today: "2026-09-08" })).map(({ status }) => status), ["overdue", "overdue"]); database.close();
});

test("fixed income confirms by expectation while variable bills require actual amount", async () => {
  const { database, service } = await fixture(); await service.generate("2026-09-01", "2026-09-30"); const [salary, bill] = await service.list();
  assert.equal((await service.transition(salary.id, "confirm")).status, "received");
  await assert.rejects(service.transition(bill.id, "confirm"), (error) => /actual amount/.test(error.cause?.message ?? error.message));
  const paid = await service.transition(bill.id, "confirm", { actualAmountPaise: 6250 }); assert.equal(paid.status, "paid"); assert.equal(paid.actualAmountPaise, 6250); database.close();
});

test("skip and postpone preserve auditability and update reminders", async () => {
  const { database, service } = await fixture(); await service.generate("2026-09-01", "2026-09-30"); const [salary, bill] = await service.list();
  assert.equal((await service.transition(salary.id, "skip", { reason: "Unpaid leave" })).skipReason, "Unpaid leave");
  assert.equal((await service.transition(bill.id, "postpone", { dueDate: "2026-09-10" })).status, "postponed");
  const reminder = await runTransaction(database, ["notifications"], "readonly", ({ store }) => store("notifications").get(`reminder_${bill.id}`)); assert.equal(reminder.scheduledFor, "2026-09-10");
  const audits = await runTransaction(database, ["auditLogs"], "readonly", ({ store }) => store("auditLogs").getAll()); assert.equal(audits.some(({ type }) => type === "recurring.skipped"), true); assert.equal(audits.some(({ type }) => type === "recurring.postponed"), true); database.close();
});

test("confirmation posts one linked transaction when the rule has an account", async () => {
  const { database } = await fixture(); const instant = "2026-09-05T10:00:00.000Z";
  await runTransaction(database, ["accounts", "recurringRules"], "readwrite", async ({ store }) => {
    await store("accounts").add({ id: "account_bank", nickname: "Bank", status: "active", archived: false, createdAt: instant, updatedAt: instant });
    const salary = await store("recurringRules").get("rule_salary"); salary.destinationAccountId = "account_bank"; await store("recurringRules").put(salary);
  });
  const service = createRecurringService(database, { now: () => instant, transactions: createTransactionService(database, { now: () => instant }) });
  await service.generate("2026-09-01", "2026-09-30"); const salary = (await service.list()).find(({ ruleId }) => ruleId === "rule_salary"); const confirmed = await service.confirmAndPost(salary.id);
  assert.ok(confirmed.transactionId); assert.equal(await runTransaction(database, ["transactions"], "readonly", ({ store }) => store("transactions").count()), 1); database.close();
});

test("opt-in auto-posting creates exactly one transaction across repeated generation", async () => {
  const { database } = await fixture(); const instant = "2026-09-05T10:00:00.000Z";
  await runTransaction(database, ["accounts", "recurringRules"], "readwrite", async ({ store }) => {
    await store("accounts").add({ id: "account_bank", nickname: "Bank", status: "active", archived: false, createdAt: instant, updatedAt: instant });
    const salary = await store("recurringRules").get("rule_salary"); salary.destinationAccountId = "account_bank"; salary.autoPost = true; await store("recurringRules").put(salary);
  });
  const transactions = createTransactionService(database, { now: () => instant }); const service = createRecurringService(database, { now: () => instant, transactions });
  assert.equal((await service.generate("2026-09-01", "2026-09-05")).autoPosted.length, 1);
  assert.equal((await service.generate("2026-09-01", "2026-09-05")).autoPosted.length, 0);
  const occurrence = (await service.list()).find(({ ruleId }) => ruleId === "rule_salary"); assert.equal(occurrence.status, "auto-posted");
  assert.equal((await transactions.list({ recurringOccurrenceId: occurrence.id })).length, 1); database.close();
});

test("due reminders deliver once and remain locally recorded", async () => {
  const { database, service } = await fixture(); await service.generate("2026-09-01", "2026-09-07"); const delivered = [];
  assert.equal((await service.deliverDueReminders(({ occurrence }) => delivered.push(occurrence.id), { today: "2026-09-08" })).length, 2);
  assert.equal((await service.deliverDueReminders(() => {}, { today: "2026-09-08" })).length, 0); assert.equal(delivered.length, 2); database.close();
});
