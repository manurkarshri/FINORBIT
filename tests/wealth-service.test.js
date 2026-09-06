import test from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { openDatabase } from "../src/database/connection.js";
import { runTransaction } from "../src/database/transaction.js";
import { createTransactionService } from "../src/services/transaction-service.js";
import { createWealthService } from "../src/services/wealth-service.js";

async function fixture() {
  const database = await openDatabase({ indexedDB: new IDBFactory(), name: crypto.randomUUID() });
  const instant = "2026-09-05T10:00:00.000Z";
  await runTransaction(database, ["accounts", "investments", "openingPositions", "marketPrices"], "readwrite", async ({ store }) => {
    await store("accounts").add({ id: "account_bank", nickname: "Bank", status: "active", archived: false, createdAt: instant, updatedAt: instant });
    await store("investments").add({ id: "investment_fund", name: "Fund", status: "active", archived: false, createdAt: instant, updatedAt: instant });
    await store("openingPositions").add({ id: "opening_bank", entityType: "account", entityId: "account_bank", amountPaise: 1000000, effectiveDate: "2026-08-01", createdAt: instant, updatedAt: instant });
    await store("openingPositions").add({ id: "opening_fund", entityType: "investment", entityId: "investment_fund", amountPaise: 200000, effectiveDate: "2026-08-01", createdAt: instant, updatedAt: instant });
    await store("marketPrices").add({ id: "valuation_fund", entityType: "investment", entityId: "investment_fund", valuePaise: 225000, valuationDate: "2026-09-05", archived: false, createdAt: instant, updatedAt: instant });
  });
  let sequence = 0;
  const id = () => `wealth_id_${++sequence}`;
  return { database, transactions: createTransactionService(database), wealth: createWealthService(database, { now: () => instant, id }) };
}

test("wealth service calculates and atomically persists an audited snapshot", async () => {
  const { database, transactions, wealth } = await fixture();
  await transactions.create({ accountingDate: "2026-09-05", currency: "INR", type: "income", amountPaise: 100000, destinationAccountId: "account_bank" });
  const calculated = await wealth.calculate("2026-09-05");
  assert.equal(calculated.netWorthPaise, 1325000);
  assert.equal(calculated.incomePaise, 100000);
  const saved = await wealth.save("2026-09-05");
  assert.equal(saved.stale, false);
  assert.equal(saved.explanation.incomeContributionPaise, 100000);
  assert.equal((await wealth.list()).length, 1);
  const audit = await runTransaction(database, ["auditLogs"], "readonly", ({ store }) => store("auditLogs").getAll());
  assert.equal(audit.some(({ type, detail }) => type === "wealth.snapshot-created" && detail.snapshotId === saved.id), true);
  database.close();
});

test("duplicate snapshot dates require explicit replacement and retain history", async () => {
  const { database, wealth } = await fixture();
  const first = await wealth.save("2026-09-05");
  await assert.rejects(wealth.save("2026-09-05"), (error) => /already exists/.test(error.cause?.message ?? ""));
  const replacement = await wealth.save("2026-09-05", { replace: true });
  assert.equal(replacement.supersedesId, first.id);
  assert.equal((await wealth.list()).length, 1);
  const all = await wealth.list({ includeStale: true, includeArchived: true });
  assert.equal(all.length, 2);
  assert.equal(all.find(({ id }) => id === first.id).archived, true);
  database.close();
});

test("transaction lifecycle changes stale only affected dated snapshots", async () => {
  const { database, transactions, wealth } = await fixture();
  await wealth.save("2026-08-31");
  await wealth.save("2026-09-30");
  const created = await transactions.create({ accountingDate: "2026-09-05", currency: "INR", type: "expense", amountPaise: 5000, sourceAccountId: "account_bank" });
  let snapshots = await wealth.list({ includeStale: true });
  assert.equal(snapshots.find(({ asOfDate }) => asOfDate === "2026-08-31").stale, false);
  assert.equal(snapshots.find(({ asOfDate }) => asOfDate === "2026-09-30").stale, true);
  await wealth.save("2026-09-30", { replace: true });
  await transactions.void(created.transaction.id, "Correction");
  snapshots = await wealth.list({ includeStale: true, includeArchived: true });
  assert.equal(snapshots.filter(({ asOfDate, stale }) => asOfDate === "2026-09-30" && stale).length, 2);
  database.close();
});

test("structural diagnostics prevent snapshot persistence", async () => {
  const { database, wealth } = await fixture();
  await runTransaction(database, ["transactionEffects"], "readwrite", ({ store }) => store("transactionEffects").add({ id: "effect_orphan", transactionId: "missing_tx", dimension: "expense", entityType: "classification", entityId: null, amountPaise: 1, active: true }));
  await assert.rejects(wealth.save("2026-09-05"), (error) => error.diagnostics?.[0]?.code === "orphan-effect");
  assert.equal(await runTransaction(database, ["netWorthSnapshots"], "readonly", ({ store }) => store("netWorthSnapshots").count()), 0);
  database.close();
});

test("recording a validated valuation invalidates later snapshots", async () => {
  const { database, wealth } = await fixture();
  await wealth.save("2026-09-30");
  const valuation = await wealth.recordValuation({ entityType: "investment", entityId: "investment_fund", valuePaise: 240000, valuationDate: "2026-09-10", source: "manual" });
  assert.equal(valuation.currency, "INR");
  assert.equal((await wealth.list()).length, 0);
  assert.equal((await wealth.list({ includeStale: true }))[0].stale, true);
  await assert.rejects(wealth.recordValuation({ entityType: "account", entityId: "account_bank", valuePaise: 1, valuationDate: "2026-09-10", source: "manual" }), /supported/);
  database.close();
});

test("bulk recalculation writes chronological month-end snapshots", async () => {
  const { database, wealth } = await fixture();
  const snapshots = await wealth.recalculateRange("2026-08-01", "2026-09-05");
  assert.deepEqual(snapshots.map(({ asOfDate }) => asOfDate), ["2026-08-31", "2026-09-05"]);
  assert.deepEqual((await wealth.list()).map(({ asOfDate }) => asOfDate), ["2026-09-05", "2026-08-31"]);
  database.close();
});

test("calculation explanations and valuation history are available without persistence", async () => {
  const { database, transactions, wealth } = await fixture();
  await transactions.create({ accountingDate: "2026-09-05", currency: "INR", type: "expense", amountPaise: 2500, sourceAccountId: "account_bank" });
  const result = await wealth.calculateWithExplanation("2026-09-05");
  assert.equal(result.explanation.expenseImpactPaise, -2500);
  assert.equal(result.explanation.netWorthChangePaise, result.netWorthPaise);
  const valuations = await wealth.listValuations({ entityType: "investment", entityId: "investment_fund" });
  assert.deepEqual(valuations.map(({ id }) => id), ["valuation_fund"]);
  database.close();
});

test("provider unit prices derive exact market values from decimal quantity", async () => {
  const { database, wealth } = await fixture();
  const valuation = await wealth.recordValuation({ entityType: "investment", entityId: "investment_fund", unitPricePaise: 12345, quantity: "10.5", valuationDate: "2026-09-05", source: "provider" });
  assert.equal(valuation.valuePaise, 129623);
  assert.equal((await wealth.listValuations({ entityId: "investment_fund" }))[0].freshness.status, "fresh");
  database.close();
});

test("configured depreciation supplies a transparent value only without an explicit valuation", async () => {
  const { database, wealth } = await fixture();
  await runTransaction(database, ["vehicles", "openingPositions"], "readwrite", async ({ store }) => {
    await store("vehicles").add({ id: "vehicle_car", nickname: "Car", vehicleType: "car", status: "active", archived: false, openingEstimatedValuePaise: 1000000, depreciationMethod: "straight-line", depreciationAnnualRateBasisPoints: 1000, depreciationResidualValuePaise: 200000, depreciationStartDate: "2025-09-05" });
    await store("openingPositions").add({ id: "opening_car", entityType: "vehicle", entityId: "vehicle_car", amountPaise: 1000000, effectiveDate: "2025-09-05" });
  });
  let snapshot = await wealth.calculateWithExplanation("2026-09-05");
  let vehicle = snapshot.positions.find(({ entityId }) => entityId === "vehicle_car");
  assert.equal(vehicle.valuePaise, 920000);
  assert.equal(vehicle.valuationSource, "depreciation");
  assert.equal(snapshot.explanation.assetDepreciationPaise, -80000);
  await wealth.recordValuation({ entityType: "vehicle", entityId: "vehicle_car", valuePaise: 950000, valuationDate: "2026-09-05", source: "manual" });
  snapshot = await wealth.calculate("2026-09-05");
  vehicle = snapshot.positions.find(({ entityId }) => entityId === "vehicle_car");
  assert.equal(vehicle.valuePaise, 950000);
  assert.equal(vehicle.valuationSource, "manual");
  database.close();
});

test("entity include-in-net-worth settings are authoritative", async () => {
  const { database, wealth } = await fixture();
  await runTransaction(database, ["accounts", "investments"], "readwrite", async ({ store }) => {
    const account = await store("accounts").get("account_bank"); account.includeInNetWorth = false; await store("accounts").put(account);
    const investment = await store("investments").get("investment_fund"); investment.includeInNetWorth = false; await store("investments").put(investment);
  });
  const snapshot = await wealth.calculate("2026-09-05");
  assert.equal(snapshot.netWorthPaise, 0);
  assert.equal(snapshot.excludedEntityCount, 2);
  database.close();
});
