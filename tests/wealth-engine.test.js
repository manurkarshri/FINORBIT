import test from "node:test";
import assert from "node:assert/strict";
import { buildWealthSnapshot, diagnoseWealthInputs, explainWealthChange } from "../src/engines/wealth-engine.js";

const transaction = (id, accountingDate = "2026-09-05") => ({ id, accountingDate, status: "posted" });
const effect = (id, transactionId, dimension, entityType, entityId, amountPaise, classification = "") => ({ id, transactionId, dimension, entityType, entityId, amountPaise, classification, active: true });

test("net worth aggregates openings, active postings, and latest valuations", () => {
  const snapshot = buildWealthSnapshot({
    asOfDate: "2026-09-05", periodStart: "2026-09-01",
    openingPositions: [
      { id: "o1", entityType: "account", entityId: "bank", amountPaise: 1000000, effectiveDate: "2026-08-01" },
      { id: "o2", entityType: "loan", entityId: "home", amountPaise: 400000, effectiveDate: "2026-08-01" },
      { id: "o3", entityType: "investment", entityId: "fund", amountPaise: 200000, effectiveDate: "2026-08-01" },
    ],
    transactions: [transaction("income"), transaction("expense")],
    effects: [
      effect("e1", "income", "account-asset", "account", "bank", 100000, "increase"),
      effect("e2", "income", "income", "classification", null, 100000, "income"),
      effect("e3", "expense", "account-asset", "account", "bank", -25000, "decrease"),
      effect("e4", "expense", "expense", "classification", null, 25000, "expense"),
    ],
    valuations: [
      { id: "v1", entityType: "investment", entityId: "fund", valuePaise: 215000, valuationDate: "2026-09-04" },
      { id: "v2", entityType: "investment", entityId: "fund", valuePaise: 220000, valuationDate: "2026-09-05" },
    ],
  });
  assert.equal(snapshot.totalAssetsPaise, 1295000);
  assert.equal(snapshot.totalLiabilitiesPaise, 400000);
  assert.equal(snapshot.netWorthPaise, 895000);
  assert.equal(snapshot.savingsPaise, 75000);
  assert.equal(snapshot.savingsRateBasisPoints, 7500);
  assert.equal(snapshot.valuationAdjustmentPaise, 20000);
});

test("transfers and principal payments do not distort income or expense", () => {
  const snapshot = buildWealthSnapshot({
    asOfDate: "2026-09-30", periodStart: "2026-09-01",
    openingPositions: [
      { id: "o1", entityType: "account", entityId: "a", amountPaise: 1000000, effectiveDate: "2026-08-01" },
      { id: "o2", entityType: "account", entityId: "b", amountPaise: 0, effectiveDate: "2026-08-01" },
      { id: "o3", entityType: "loan", entityId: "l", amountPaise: 500000, effectiveDate: "2026-08-01" },
    ],
    transactions: [transaction("transfer"), transaction("emi")],
    effects: [
      effect("e1", "transfer", "account-asset", "account", "a", -100000),
      effect("e2", "transfer", "account-asset", "account", "b", 100000),
      effect("e3", "emi", "account-asset", "account", "a", -200000),
      effect("e4", "emi", "loan-liability", "loan", "l", -150000),
      effect("e5", "emi", "expense", "classification", null, 50000, "loan-interest"),
    ],
  });
  assert.equal(snapshot.incomePaise, 0);
  assert.equal(snapshot.expensePaise, 50000);
  assert.equal(snapshot.netWorthPaise, 450000);
  const previous = { netWorthPaise: 500000, valuationAdjustmentPaise: 0 };
  assert.deepEqual(explainWealthChange(snapshot, previous), {
    netWorthChangePaise: -50000, incomeContributionPaise: 0, expenseImpactPaise: -50000,
    investmentContributionPaise: 0, marketValueChangePaise: 0, debtReductionPaise: 150000,
    loanInterestPaise: 50000, assetDepreciationPaise: 0, adjustmentsPaise: 0, otherCapitalChangePaise: 0,
  });
});

test("historical recalculation excludes later transactions and future openings", () => {
  const snapshot = buildWealthSnapshot({
    asOfDate: "2026-08-31", periodStart: "2026-08-01",
    openingPositions: [
      { id: "old", entityType: "account", entityId: "bank", amountPaise: 10000, effectiveDate: "2026-08-01" },
      { id: "future", entityType: "account", entityId: "bank", amountPaise: 99999, effectiveDate: "2026-09-01" },
    ],
    transactions: [transaction("aug", "2026-08-15"), transaction("sep", "2026-09-01")],
    effects: [effect("e1", "aug", "account-asset", "account", "bank", 1000), effect("e2", "sep", "account-asset", "account", "bank", 9999)],
  });
  assert.equal(snapshot.netWorthPaise, 11000);
});

test("integrity diagnostics detect orphan, duplicate, invalid, and wrongly active effects", () => {
  const diagnostics = diagnoseWealthInputs({
    transactions: [{ id: "voided", accountingDate: "2026-09-01", status: "voided" }],
    effects: [
      effect("same", "missing", "expense", "classification", null, 10),
      effect("same", "voided", "expense", "classification", null, 1.5),
    ],
  });
  assert.deepEqual(new Set(diagnostics.map(({ code }) => code)), new Set(["orphan-effect", "duplicate-effect-id", "invalid-effect-money", "active-effect-on-non-posted-transaction"]));
});

test("snapshot valuation policy prefers a fresh manual fallback over a stale provider value", () => {
  const snapshot = buildWealthSnapshot({ asOfDate: "2026-09-05", periodStart: "2026-09-01", openingPositions: [{ id: "opening", entityType: "investment", entityId: "fund", amountPaise: 100000, effectiveDate: "2026-01-01" }], valuations: [
    { id: "provider", entityType: "investment", entityId: "fund", valuePaise: 130000, valuationDate: "2026-09-01", source: "provider" },
    { id: "manual", entityType: "investment", entityId: "fund", valuePaise: 120000, valuationDate: "2026-08-20", source: "manual" },
  ] });
  assert.equal(snapshot.netWorthPaise, 120000);
  assert.equal(snapshot.positions[0].valuationSource, "manual");
  assert.equal(snapshot.positions[0].valuationStatus, "fresh");
});

test("explicit entity exclusions remove both assets and liabilities from net worth", () => {
  const snapshot = buildWealthSnapshot({ asOfDate: "2026-09-05", periodStart: "2026-09-01", openingPositions: [
    { id: "a", entityType: "account", entityId: "excluded_account", amountPaise: 100000, effectiveDate: "2026-01-01" },
    { id: "l", entityType: "loan", entityId: "excluded_loan", amountPaise: 40000, effectiveDate: "2026-01-01" },
    { id: "kept", entityType: "account", entityId: "kept_account", amountPaise: 25000, effectiveDate: "2026-01-01" },
  ], excludedEntityKeys: ["account:excluded_account", "loan:excluded_loan"] });
  assert.equal(snapshot.totalAssetsPaise, 25000);
  assert.equal(snapshot.totalLiabilitiesPaise, 0);
  assert.equal(snapshot.netWorthPaise, 25000);
  assert.equal(snapshot.excludedEntityCount, 2);
});
