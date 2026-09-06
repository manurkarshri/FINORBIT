import test from "node:test";
import assert from "node:assert/strict";
import { calculateBudgets, consumptionByCategory, priorBudgetMonth } from "../src/engines/budget-engine.js";

const month = "2026-09";
const transactions = [
  { id: "tx_grocery", type: "expense", status: "posted", accountingDate: "2026-09-05", categoryId: "groceries" },
  { id: "tx_card", type: "credit-card-purchase", status: "posted", accountingDate: "2026-09-06", categoryId: "groceries" },
  { id: "tx_transfer", type: "transfer", status: "posted", accountingDate: "2026-09-07", categoryId: "groceries" },
  { id: "tx_invest", type: "investment-purchase", status: "posted", accountingDate: "2026-09-08", categoryId: "groceries" },
  { id: "tx_old", type: "expense", status: "voided", accountingDate: "2026-09-09", categoryId: "groceries" },
  { id: "tx_refund", type: "refund", status: "posted", accountingDate: "2026-09-10", categoryId: "groceries" },
];
const effects = [
  ["tx_grocery", "expense", 200000], ["tx_card", "expense", 50000], ["tx_transfer", "transfer", 1000000],
  ["tx_invest", "expense", 1000], ["tx_old", "expense", 99999], ["tx_refund", "expense", -10000],
].map(([transactionId, dimension, amountPaise], index) => ({ id: `effect_${index}`, transactionId, dimension, amountPaise, active: true }));

test("budget consumption uses active classified expense and excludes asset conversions", () => {
  assert.equal(consumptionByCategory({ transactions, effects, month }).get("groceries"), 240000);
});

test("monthly budget calculates positive rollover, pace, warning, and comparison", () => {
  const [result] = calculateBudgets({ budgets: [{ id: "budget_food", categoryId: "groceries", month, limitPaise: 300000, rolloverMode: "positive-only" }], transactions, effects, month, asOfDate: "2026-09-10", previousResults: [{ categoryId: "groceries", spentPaise: 200000, remainingPaise: 50000 }] });
  assert.deepEqual({ rollover: result.rolloverPaise, available: result.availablePaise, spent: result.spentPaise, remaining: result.remainingPaise, status: result.status, change: result.changeFromPreviousPaise }, { rollover: 50000, available: 350000, spent: 240000, remaining: 110000, status: "ahead-of-pace", change: 40000 });
});
test("full rollover carries overspend while positive-only does not", () => {
  const previousResults = [{ categoryId: "groceries", spentPaise: 300000, remainingPaise: -50000 }];
  const base = { id: "budget_food", categoryId: "groceries", month, limitPaise: 100000 };
  assert.equal(calculateBudgets({ budgets: [{ ...base, rolloverMode: "full" }], month, previousResults })[0].availablePaise, 50000);
  assert.equal(calculateBudgets({ budgets: [{ ...base, rolloverMode: "positive-only" }], month, previousResults })[0].availablePaise, 100000);
});

test("previous month handles year boundaries", () => assert.equal(priorBudgetMonth("2026-01"), "2025-12"));
