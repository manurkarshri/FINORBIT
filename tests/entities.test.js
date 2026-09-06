import test from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { openDatabase } from "../src/database/connection.js";
import { runTransaction } from "../src/database/transaction.js";
import { createEntityService, validateEntity } from "../src/services/entity-service.js";
import { createBackup } from "../src/services/backup-service.js";
import { restoreBackup } from "../src/services/restore-service.js";

async function fixture() { const database = await openDatabase({ indexedDB: new IDBFactory(), name: crypto.randomUUID() }); return { database, service: createEntityService(database) }; }
const account = { nickname: "Daily bank", accountType: "savings", openingBalancePaise: 125050, includeInNetWorth: true, status: "active", effectiveDate: "2026-07-15" };

test("account CRUD stores integer-paise opening position without a transaction", async () => {
  const { database, service } = await fixture(); const created = await service.save("account", account, { source: "onboarding" });
  assert.equal(created.ok, true); assert.equal((await service.list("account"))[0].openingBalancePaise, 125050);
  const opening = await runTransaction(database, ["openingPositions"], "readonly", ({ store }) => store("openingPositions").getAll());
  assert.deepEqual({ amount: opening[0].amountPaise, source: opening[0].source }, { amount: 125050, source: "onboarding" });
  assert.equal(await runTransaction(database, ["transactions"], "readonly", ({ store }) => store("transactions").count()), 0); database.close();
});

test("edit, archive, restore and duplicate-name lookup preserve stable ID", async () => {
  const { database, service } = await fixture(); const first = (await service.save("account", account)).record;
  const edited = (await service.save("account", { ...first, openingBalancePaise: 130000 })).record; assert.equal(edited.id, first.id);
  await service.save("account", { ...account, nickname: "Daily Bank" }); assert.equal((await service.similarNames("account", "daily bank", first.id)).length, 1);
  await service.transition("account", first.id, "archive"); assert.equal((await service.list("account")).length, 1);
  await service.transition("account", first.id, "restore"); assert.equal((await service.list("account")).length, 2); database.close();
});

test("shared validation rejects sensitive and malformed financial identifiers", () => {
  assert.equal(validateEntity("account", { ...account, openingBalancePaise: -1 }).openingBalancePaise.length > 0, true);
  assert.equal(validateEntity("creditCard", { nickname: "Card", issuingBank: "Bank", network: "Visa", lastFour: "12345", creditLimitPaise: 1, openingOutstandingPaise: 0, statementDay: 32, dueDay: 1, status: "active", includeInNetWorth: true }).lastFour.length > 0, true);
});

test("card over-limit and loan excess-principal are non-blocking warnings", async () => {
  const { database, service } = await fixture();
  const card = await service.save("creditCard", { nickname: "Travel", issuingBank: "Bank", network: "Visa", creditLimitPaise: 100, openingOutstandingPaise: 120, statementDay: 1, dueDay: 20, status: "active", includeInNetWorth: true }); assert.equal(card.ok, true); assert.equal(card.warnings.length, 1);
  const loan = await service.save("loan", { nickname: "Home", loanType: "home", originalPrincipalPaise: 100, outstandingPrincipalPaise: 110, status: "active", includeInNetWorth: true }); assert.equal(loan.ok, true); assert.equal(loan.warnings.length, 1); database.close();
});

test("loan setup persists rate, EMI dates, and remaining tenure", async () => {
  const { database, service } = await fixture();
  const result = await service.save("loan", { nickname: "Home loan", lender: "Bank", loanType: "home", originalPrincipalPaise: 50000000, outstandingPrincipalPaise: 42000000, annualInterestRateBasisPoints: 850, rateType: "floating", emiPaise: 450000, emiDay: 5, startDate: "2024-01-05", expectedEndDate: "2039-01-05", remainingTenureMonths: 148, status: "active", includeInNetWorth: true });
  assert.equal(result.ok, true);
  assert.deepEqual({ rate: result.record.annualInterestRateBasisPoints, emi: result.record.emiPaise, day: result.record.emiDay, tenure: result.record.remainingTenureMonths }, { rate: 850, emi: 450000, day: 5, tenure: 148 });
  assert.ok(validateEntity("loan", { ...result.record, annualInterestRateBasisPoints: -1 }).annualInterestRateBasisPoints);
  assert.ok(validateEntity("loan", { ...result.record, expectedEndDate: "2023-01-01" }).expectedEndDate);
  database.close();
});

test("decimal investment quantity persists exactly and asset references remain configuration", async () => {
  const { database, service } = await fixture(); const result = await service.save("investment", { name: "Index fund", assetClass: "mutual-fund", quantity: "12.3400", openingEstimatedValuePaise: 500000, valuationDate: "2026-07-15", includeInNetWorth: false, status: "active" });
  assert.equal(result.record.quantity, "12.3400"); assert.equal(result.record.openingEstimatedValuePaise, 500000); assert.equal(result.record.includeInNetWorth, false); database.close();
});

test("property ownership and linked-loan assets archive and restore", async () => {
  const { database, service } = await fixture(); const loan = (await service.save("loan", { nickname: "Mortgage", loanType: "home", status: "active", includeInNetWorth: true })).record;
  const property = (await service.save("property", { nickname: "Home", propertyType: "residential", ownershipPercentage: 50, openingEstimatedValuePaise: 1000000, valuationDate: "2026-07-15", linkedLoanId: loan.id, includeInNetWorth: true, status: "active" })).record;
  await service.transition("property", property.id, "archive"); assert.equal((await service.list("property")).length, 0); await service.transition("property", property.id, "restore"); assert.equal((await service.list("property")).length, 1); database.close();
});

test("other valuables persist opening value and net-worth inclusion policy", async () => { const { database, service } = await fixture(); const result = await service.save("otherAsset", { nickname: "Family gold", assetType: "gold", openingEstimatedValuePaise: 250000, valuationDate: "2026-09-05", includeInNetWorth: true, status: "active" }); assert.equal(result.ok, true); assert.equal((await service.list("otherAsset"))[0].assetType, "gold"); assert.equal((await runTransaction(database, ["openingPositions"], "readonly", ({ store }) => store("openingPositions").get(`opening_${result.record.id}`))).amountPaise, 250000); database.close(); });

test("physical-asset depreciation requires explicit bounded settings", async () => {
  const { database, service } = await fixture();
  const invalid = await service.save("vehicle", { nickname: "Car", vehicleType: "car", openingEstimatedValuePaise: 1000000, valuationDate: "2026-07-15", includeInNetWorth: true, status: "active", depreciationMethod: "straight-line", depreciationAnnualRateBasisPoints: 12000, depreciationResidualValuePaise: 1200000, depreciationStartDate: "2026-07-15" });
  assert.equal(invalid.ok, false);
  assert.ok(invalid.errors.depreciationAnnualRateBasisPoints);
  assert.ok(invalid.errors.depreciationResidualValuePaise);
  const valid = await service.save("vehicle", { nickname: "Car", vehicleType: "car", openingEstimatedValuePaise: 1000000, valuationDate: "2026-07-15", includeInNetWorth: true, status: "active", depreciationMethod: "straight-line", depreciationAnnualRateBasisPoints: 1000, depreciationResidualValuePaise: 200000, depreciationStartDate: "2026-07-15" });
  assert.equal(valid.ok, true);
  assert.equal(valid.record.depreciationMethod, "straight-line");
  database.close();
});

test("entity edits invalidate snapshots from the earliest affected date", async () => {
  const { database, service } = await fixture();
  const created = (await service.save("account", account)).record;
  await runTransaction(database, ["netWorthSnapshots"], "readwrite", ({ store }) => store("netWorthSnapshots").add({ id: "snapshot_2026", asOfDate: "2026-07-31", stale: false, archived: false, createdAt: "2026-07-31T00:00:00.000Z", updatedAt: "2026-07-31T00:00:00.000Z" }));
  await service.save("account", { ...created, openingBalancePaise: 0, includeInNetWorth: false, effectiveDate: "2026-07-15" });
  const snapshot = await runTransaction(database, ["netWorthSnapshots"], "readonly", ({ store }) => store("netWorthSnapshots").get("snapshot_2026"));
  assert.equal(snapshot.stale, true);
  database.close();
});

test("income and commitment configuration creates no occurrences or transactions", async () => {
  const { database, service } = await fixture();
  assert.equal((await service.save("incomeSource", { name: "Salary", incomeType: "salary", expectedAmountPaise: 1000, frequency: "monthly", status: "active", estimateType: "fixed" })).ok, true);
  assert.equal((await service.save("commitment", { name: "Rent", commitmentType: "rent", expectedAmountPaise: 500, frequency: "monthly", status: "active", estimateType: "fixed" })).ok, true);
  assert.equal(await runTransaction(database, ["transactions", "recurringOccurrences"], "readonly", async ({ store }) => (await store("transactions").count()) + (await store("recurringOccurrences").count())), 0); database.close();
});

test("backup and restore include opening positions and all new entity records", async () => {
  const source = await fixture(); await source.service.save("account", account); const backup = await createBackup(source.database); assert.equal(backup.counts.openingPositions, 1);
  const target = await fixture(); await restoreBackup(target.database, backup); assert.equal((await target.service.list("account")).length, 1); source.database.close(); target.database.close();
});
