const ASSET_DIMENSIONS = new Set(["account-asset", "investment-asset", "physical-asset", "receivable"]);
const LIABILITY_DIMENSIONS = new Set(["creditCard-liability", "loan-liability"]);
const VALUED_ENTITY_TYPES = new Set(["investment", "property", "vehicle", "otherAsset"]);

function assertDate(value, field) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "") || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new TypeError(`${field} must be an ISO calendar date.`);
  }
}

function assertMoney(value, field) {
  if (!Number.isSafeInteger(value)) throw new TypeError(`${field} must be integer paise.`);
}

const keyFor = (entityType, entityId) => `${entityType}:${entityId}`;
const sum = (records, select) => records.reduce((total, record) => total + select(record), 0);

function positionKind(record) {
  if (record.entityType === "creditCard" || record.entityType === "loan") return "liability";
  return "asset";
}

function effectKind(effect) {
  if (ASSET_DIMENSIONS.has(effect.dimension)) return "asset";
  if (LIABILITY_DIMENSIONS.has(effect.dimension)) return "liability";
  if (effect.dimension === "correction" && effect.entityType === "account") return "asset";
  return null;
}

export function diagnoseWealthInputs({ openingPositions = [], transactions = [], effects = [], valuations = [] } = {}) {
  const diagnostics = [];
  const transactionById = new Map(transactions.map((transaction) => [transaction.id, transaction]));
  const seenIds = new Set();

  for (const effect of effects) {
    if (seenIds.has(effect.id)) diagnostics.push({ code: "duplicate-effect-id", effectId: effect.id });
    seenIds.add(effect.id);
    if (!transactionById.has(effect.transactionId)) diagnostics.push({ code: "orphan-effect", effectId: effect.id, transactionId: effect.transactionId });
    if (!Number.isSafeInteger(effect.amountPaise)) diagnostics.push({ code: "invalid-effect-money", effectId: effect.id });
    const transaction = transactionById.get(effect.transactionId);
    if (effect.active && transaction && transaction.status !== "posted") diagnostics.push({ code: "active-effect-on-non-posted-transaction", effectId: effect.id, transactionId: effect.transactionId });
  }
  for (const opening of openingPositions) {
    if (!opening.entityId || !opening.entityType) diagnostics.push({ code: "invalid-opening-reference", openingId: opening.id });
    if (!Number.isSafeInteger(opening.amountPaise)) diagnostics.push({ code: "invalid-opening-money", openingId: opening.id });
  }
  for (const valuation of valuations) {
    if (!VALUED_ENTITY_TYPES.has(valuation.entityType) || !valuation.entityId) diagnostics.push({ code: "invalid-valuation-reference", valuationId: valuation.id });
    if (!Number.isSafeInteger(valuation.valuePaise)) diagnostics.push({ code: "invalid-valuation-money", valuationId: valuation.id });
  }
  return diagnostics;
}

export function buildWealthSnapshot({ asOfDate, periodStart, openingPositions = [], transactions = [], effects = [], valuations = [], excludedEntityKeys = [] }) {
  assertDate(asOfDate, "asOfDate");
  assertDate(periodStart, "periodStart");
  if (periodStart > asOfDate) throw new RangeError("periodStart cannot be after asOfDate.");
  const diagnostics = diagnoseWealthInputs({ openingPositions, transactions, effects, valuations });
  if (diagnostics.some(({ code }) => code.includes("money"))) throw new TypeError("Wealth inputs contain non-integer money.");

  const transactionById = new Map(transactions.map((transaction) => [transaction.id, transaction]));
  const positions = new Map();
  const excluded = new Set(excludedEntityKeys);
  const addPosition = (entityType, entityId, kind, amountPaise) => {
    if (!entityId) return;
    if (excluded.has(keyFor(entityType, entityId))) return;
    assertMoney(amountPaise, "position amount");
    const key = keyFor(entityType, entityId);
    const current = positions.get(key) ?? { entityType, entityId, kind, bookValuePaise: 0, valuePaise: 0, valuationAdjustmentPaise: 0 };
    current.bookValuePaise += amountPaise;
    current.valuePaise += amountPaise;
    positions.set(key, current);
  };

  for (const opening of openingPositions) {
    if (opening.effectiveDate <= asOfDate) addPosition(opening.entityType, opening.entityId, positionKind(opening), opening.amountPaise);
  }

  const includedEffects = effects.filter((effect) => {
    const transaction = transactionById.get(effect.transactionId);
    return effect.active && transaction?.status === "posted" && transaction.accountingDate <= asOfDate;
  });
  for (const effect of includedEffects) {
    const kind = effectKind(effect);
    if (kind) addPosition(effect.entityType, effect.entityId, kind, effect.amountPaise);
  }

  const valuationsByEntity = new Map();
  for (const valuation of valuations.filter((item) => item.valuationDate <= asOfDate)) {
    const key = keyFor(valuation.entityType, valuation.entityId);
    const candidates = valuationsByEntity.get(key) ?? [];
    candidates.push(valuation);
    valuationsByEntity.set(key, candidates);
  }
  for (const [key, candidates] of valuationsByEntity) {
    if (excluded.has(key)) continue;
    const first = candidates[0];
    const current = positions.get(key) ?? { entityType: first.entityType, entityId: first.entityId, kind: "asset", bookValuePaise: 0, valuePaise: 0, valuationAdjustmentPaise: 0 };
    const valuation = resolveValuation(candidates, { asOfDate, bookValuePaise: Math.max(0, current.bookValuePaise) });
    current.valuePaise = valuation.valuePaise;
    current.valuationAdjustmentPaise = valuation.valuePaise - current.bookValuePaise;
    current.valuationDate = valuation.valuationDate;
    current.valuationSource = valuation.source;
    current.valuationStatus = valuation.status;
    current.valuationAgeDays = valuation.ageDays;
    current.depreciationPaise = valuation.depreciationPaise ?? 0;
    positions.set(key, current);
  }

  const periodEffects = includedEffects.filter((effect) => {
    const date = transactionById.get(effect.transactionId).accountingDate;
    return date >= periodStart && date <= asOfDate;
  });
  const incomePaise = sum(periodEffects.filter(({ dimension }) => dimension === "income"), ({ amountPaise }) => amountPaise);
  const expensePaise = sum(periodEffects.filter(({ dimension }) => dimension === "expense"), ({ amountPaise }) => amountPaise);
  const savingsPaise = incomePaise - expensePaise;
  const positionList = [...positions.values()].sort((a, b) => keyFor(a.entityType, a.entityId).localeCompare(keyFor(b.entityType, b.entityId)));
  const totalAssetsPaise = sum(positionList.filter(({ kind }) => kind === "asset"), ({ valuePaise }) => valuePaise);
  const totalLiabilitiesPaise = sum(positionList.filter(({ kind }) => kind === "liability"), ({ valuePaise }) => valuePaise);

  return {
    asOfDate,
    periodStart,
    positions: positionList,
    totalAssetsPaise,
    totalLiabilitiesPaise,
    netWorthPaise: totalAssetsPaise - totalLiabilitiesPaise,
    incomePaise,
    expensePaise,
    savingsPaise,
    savingsRateBasisPoints: incomePaise > 0 ? Math.round((savingsPaise * 10000) / incomePaise) : null,
    periodEffects,
    valuationAdjustmentPaise: sum(positionList, ({ valuationAdjustmentPaise }) => valuationAdjustmentPaise),
    depreciationPaise: sum(positionList, ({ depreciationPaise = 0 }) => depreciationPaise),
    diagnostics,
    excludedEntityCount: excluded.size,
  };
}

export function explainWealthChange(current, previous) {
  const netWorthChangePaise = current.netWorthPaise - previous.netWorthPaise;
  const marketValueChangePaise = current.valuationAdjustmentPaise - previous.valuationAdjustmentPaise;
  const investmentContributionPaise = sum(current.periodEffects.filter(({ dimension, amountPaise }) => dimension === "investment-asset" && amountPaise > 0), ({ amountPaise }) => amountPaise);
  const debtReductionPaise = -sum(current.periodEffects.filter(({ dimension, amountPaise }) => LIABILITY_DIMENSIONS.has(dimension) && amountPaise < 0), ({ amountPaise }) => amountPaise);
  const loanInterestPaise = sum(current.periodEffects.filter(({ classification }) => classification === "loan-interest"), ({ amountPaise }) => amountPaise);
  const adjustmentsPaise = sum(current.periodEffects.filter(({ dimension }) => dimension === "correction"), ({ amountPaise }) => amountPaise);
  const depreciationChangePaise = Math.max(0, current.depreciationPaise - (previous.depreciationPaise ?? 0));
  const assetDepreciationPaise = depreciationChangePaise ? -depreciationChangePaise : 0;
  const explainedPaise = current.incomePaise - current.expensePaise + marketValueChangePaise + adjustmentsPaise;
  return {
    netWorthChangePaise,
    incomeContributionPaise: current.incomePaise,
    expenseImpactPaise: -current.expensePaise,
    investmentContributionPaise,
    marketValueChangePaise,
    debtReductionPaise,
    loanInterestPaise,
    assetDepreciationPaise,
    adjustmentsPaise,
    otherCapitalChangePaise: netWorthChangePaise - explainedPaise,
  };
}
import { resolveValuation } from "./valuation-engine.js";
