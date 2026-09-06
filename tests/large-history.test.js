import test from "node:test";
import assert from "node:assert/strict";
import { diagnoseIntegrity } from "../src/engines/integrity-engine.js";
import { buildReportDataset } from "../src/engines/report-engine.js";

test("ten years of daily transactions remain diagnostically and report correct", () => {
  const transactions = []; const effects = [];
  for (let day = 0; day < 3653; day += 1) { const date = new Date(Date.UTC(2016, 0, 1 + day)).toISOString().slice(0, 10); const id = `tx_${day}`; transactions.push({ id, accountingDate: date, type: "expense", amountPaise: 100 + day, status: "posted", sourceAccountId: `account_${day % 8}`, categoryId: `category_${day % 12}`, merchantText: `Merchant ${day % 60}` }); effects.push({ id: `effect_${day}`, transactionId: id, dimension: "expense", amountPaise: 100 + day, active: true }); }
  const accounts = Array.from({ length: 8 }, (_, index) => ({ id: `account_${index}`, nickname: `Account ${index}` })); const categories = Array.from({ length: 12 }, (_, index) => ({ id: `category_${index}`, name: `Category ${index}` }));
  const started = performance.now(); const diagnostics = diagnoseIntegrity({ transactions, transactionEffects: effects, accounts, categories, creditCards: [], loans: [], investments: [], properties: [], vehicles: [], otherAssets: [], familyMembers: [] }); const report = buildReportDataset({ transactions, effects, accounts, categories, filters: { dateFrom: "2025-01-01", dateTo: "2025-12-31" } }); const elapsed = performance.now() - started;
  assert.equal(diagnostics.healthy, true); assert.equal(diagnostics.issues.length, 0); assert.equal(report.rows.length, 365); assert.equal(report.byCategory.length, 12); assert.ok(elapsed < 2000, `large-history processing took ${elapsed}ms`);
});
