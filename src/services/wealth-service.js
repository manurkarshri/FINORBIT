import { createAuditEvent } from "../database/audit.js";
import { runTransaction } from "../database/transaction.js";
import { createOpaqueId } from "../database/validation.js";
import { buildWealthSnapshot, explainWealthChange } from "../engines/wealth-engine.js";
import { assessFreshness, multiplyPriceByQuantity, straightLineDepreciation } from "../engines/valuation-engine.js";

const ENTITY_STORES = ["accounts", "creditCards", "loans", "investments", "properties", "vehicles", "otherAssets"];
const INPUT_STORES = ["openingPositions", "transactions", "transactionEffects", "marketPrices", ...ENTITY_STORES];
const ENTITY_TYPES = { accounts: "account", creditCards: "creditCard", loans: "loan", investments: "investment", properties: "property", vehicles: "vehicle", otherAssets: "otherAsset" };

function monthStart(date) {
  return `${date.slice(0, 7)}-01`;
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "") && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function monthEndDates(fromDate, toDate) {
  if (!isIsoDate(fromDate) || !isIsoDate(toDate) || fromDate > toDate) throw new TypeError("Choose a valid ascending recalculation range.");
  const dates = [];
  let cursor = new Date(`${fromDate.slice(0, 7)}-01T00:00:00Z`);
  const end = new Date(`${toDate}T00:00:00Z`);
  while (cursor <= end) {
    const monthEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0));
    const date = monthEnd > end ? toDate : monthEnd.toISOString().slice(0, 10);
    if (date >= fromDate && !dates.includes(date)) dates.push(date);
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }
  return dates;
}

function valuationFromPrice(record) {
  return {
    id: record.id,
    entityType: record.entityType ?? "investment",
    entityId: record.entityId ?? record.investmentId,
    valuePaise: record.valuePaise ?? record.marketValuePaise ?? (record.unitPricePaise != null && record.quantity ? multiplyPriceByQuantity(record.unitPricePaise, record.quantity) : undefined),
    valuationDate: record.valuationDate ?? record.priceDate,
    source: record.source ?? "manual",
    staleAfterDays: record.staleAfterDays,
  };
}

export function createWealthService(database, { now = () => new Date().toISOString(), id = () => createOpaqueId() } = {}) {
  async function calculate(asOfDate, { periodStart = monthStart(asOfDate) } = {}) {
    const inputs = await runTransaction(database, INPUT_STORES, "readonly", async ({ store }) => ({
      openingPositions: await store("openingPositions").getAll(),
      transactions: await store("transactions").getAll(),
      effects: await store("transactionEffects").getAll(),
      valuations: (await store("marketPrices").getAll()).map(valuationFromPrice),
      depreciableAssets: [...await store("properties").getAll(), ...await store("vehicles").getAll()],
      entities: Object.fromEntries(await Promise.all(ENTITY_STORES.map(async (name) => [name, await store(name).getAll()]))),
    }));
    const excludedEntityKeys = Object.entries(inputs.entities).flatMap(([storeName, records]) => records.filter(({ includeInNetWorth }) => includeInNetWorth === false).map(({ id: entityId }) => `${ENTITY_TYPES[storeName]}:${entityId}`));
    const explicitlyValued = new Set(inputs.valuations.filter(({ valuationDate }) => valuationDate <= asOfDate).map(({ entityType, entityId }) => `${entityType}:${entityId}`));
    for (const asset of inputs.depreciableAssets) if (asset.depreciationMethod === "straight-line") {
      const entityType = asset.propertyType ? "property" : "vehicle";
      if (explicitlyValued.has(`${entityType}:${asset.id}`)) continue;
      const depreciation = straightLineDepreciation({ baseValuePaise: asset.openingEstimatedValuePaise, residualValuePaise: asset.depreciationResidualValuePaise, annualRateBasisPoints: asset.depreciationAnnualRateBasisPoints, startDate: asset.depreciationStartDate, asOfDate });
      inputs.valuations.push({ id: `depreciation_${asset.id}_${asOfDate}`, entityType, entityId: asset.id, valuePaise: depreciation.valuePaise, valuationDate: asOfDate, source: "depreciation", depreciationPaise: depreciation.depreciationPaise, staleAfterDays: 0 });
    }
    return buildWealthSnapshot({ asOfDate, periodStart, openingPositions: inputs.openingPositions, transactions: inputs.transactions, effects: inputs.effects, valuations: inputs.valuations, excludedEntityKeys });
  }

  async function latestBefore(asOfDate) {
    const snapshots = await runTransaction(database, ["netWorthSnapshots"], "readonly", ({ store }) => store("netWorthSnapshots").getAll());
    return snapshots
      .filter((snapshot) => !snapshot.stale && snapshot.asOfDate < asOfDate)
      .sort((a, b) => b.asOfDate.localeCompare(a.asOfDate) || b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  }

  async function calculateWithExplanation(asOfDate, options = {}) {
    const calculated = await calculate(asOfDate, options);
    const previous = await latestBefore(asOfDate);
    return { ...calculated, explanation: explainWealthChange(calculated, previous ?? { netWorthPaise: 0, valuationAdjustmentPaise: 0 }) };
  }

  async function save(asOfDate, { periodStart = monthStart(asOfDate), replace = false } = {}) {
    const calculated = await calculate(asOfDate, { periodStart });
    if (calculated.diagnostics.length) {
      const error = new Error("Wealth snapshot blocked by integrity diagnostics.");
      error.diagnostics = calculated.diagnostics;
      throw error;
    }
    const previous = await latestBefore(asOfDate);
    const explanation = explainWealthChange(calculated, previous ?? { netWorthPaise: 0, valuationAdjustmentPaise: 0 });
    const instant = now();
    return runTransaction(database, ["netWorthSnapshots", "auditLogs"], "readwrite", async ({ store }) => {
      const snapshots = await store("netWorthSnapshots").getAll();
      const existing = snapshots.find((snapshot) => snapshot.asOfDate === asOfDate && !snapshot.archived);
      if (existing && !replace) throw new Error("A current wealth snapshot already exists for this date.");
      if (existing) {
        existing.archived = true;
        existing.stale = true;
        existing.updatedAt = instant;
        await store("netWorthSnapshots").put(existing);
      }
      const snapshot = {
        ...calculated,
        id: id(),
        explanation,
        stale: false,
        archived: false,
        supersedesId: existing?.id,
        createdAt: instant,
        updatedAt: instant,
        schemaVersion: 3,
      };
      await store("netWorthSnapshots").add(snapshot);
      await store("auditLogs").add(createAuditEvent(existing ? "wealth.snapshot-recalculated" : "wealth.snapshot-created", { snapshotId: snapshot.id, asOfDate, supersedesId: existing?.id }));
      return snapshot;
    });
  }

  async function list({ includeStale = false, includeArchived = false } = {}) {
    const snapshots = await runTransaction(database, ["netWorthSnapshots"], "readonly", ({ store }) => store("netWorthSnapshots").getAll());
    return snapshots
      .filter((snapshot) => (includeStale || !snapshot.stale) && (includeArchived || !snapshot.archived))
      .sort((a, b) => b.asOfDate.localeCompare(a.asOfDate) || b.createdAt.localeCompare(a.createdAt));
  }

  async function listValuations({ entityType, entityId } = {}) {
    const valuations = (await runTransaction(database, ["marketPrices"], "readonly", ({ store }) => store("marketPrices").getAll())).map(valuationFromPrice);
    const asOfDate = new Date().toISOString().slice(0, 10);
    return valuations.filter((item) => (!entityType || item.entityType === entityType) && (!entityId || item.entityId === entityId)).map((item) => ({ ...item, freshness: assessFreshness(item, asOfDate) })).sort((a, b) => b.valuationDate.localeCompare(a.valuationDate));
  }

  async function recordValuation(input) {
    const entityType = input.entityType;
    if (!["investment", "property", "vehicle", "otherAsset"].includes(entityType)) throw new TypeError("Choose a supported valued asset type.");
    if (!input.entityId) throw new TypeError("Valuation requires a stable entity reference.");
    const calculatedValue = input.valuePaise ?? (input.unitPricePaise != null && input.quantity ? multiplyPriceByQuantity(input.unitPricePaise, input.quantity) : undefined);
    if (!Number.isSafeInteger(calculatedValue) || calculatedValue < 0) throw new TypeError("Valuation must provide a non-negative total value or a valid unit price and quantity.");
    if (!isIsoDate(input.valuationDate)) throw new TypeError("Valuation requires an ISO calendar date.");
    if (!["manual", "provider"].includes(input.source)) throw new TypeError("Valuation source must be manual or provider.");
    const instant = now();
    return runTransaction(database, ["marketPrices", "netWorthSnapshots", "auditLogs"], "readwrite", async ({ store }) => {
      const valuation = { ...input, valuePaise: calculatedValue, id: input.id ?? id(), currency: "INR", archived: false, createdAt: instant, updatedAt: instant, schemaVersion: 3 };
      await store("marketPrices").add(valuation);
      for (const snapshot of await store("netWorthSnapshots").getAll()) if (!snapshot.stale && snapshot.asOfDate >= valuation.valuationDate) {
        snapshot.stale = true; snapshot.updatedAt = instant; await store("netWorthSnapshots").put(snapshot);
      }
      await store("auditLogs").add(createAuditEvent("wealth.valuation-recorded", { valuationId: valuation.id, entityType, entityId: input.entityId, valuationDate: input.valuationDate, source: input.source }));
      return valuation;
    });
  }

  async function recalculateRange(fromDate, toDate) {
    const results = [];
    for (const asOfDate of monthEndDates(fromDate, toDate)) results.push(await save(asOfDate, { replace: true }));
    return results;
  }

  return { calculate, calculateWithExplanation, save, list, listValuations, latestBefore, recordValuation, recalculateRange };
}
