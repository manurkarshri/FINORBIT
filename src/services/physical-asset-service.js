import { runTransaction } from "../database/transaction.js";

const STORES = { property: "properties", vehicle: "vehicles", otherAsset: "otherAssets" };
const REF_FIELDS = { property: "propertyId", vehicle: "vehicleId", otherAsset: "otherAssetId" };

export function createPhysicalAssetService(database) {
  async function list({ includeSold = true } = {}) {
    return runTransaction(database, [...Object.values(STORES), "loans", "marketPrices"], "readonly", async ({ store }) => {
      const loans = new Map((await store("loans").getAll()).map((loan) => [loan.id, loan])); const valuations = await store("marketPrices").getAll(); const assets = [];
      for (const [entityType, storeName] of Object.entries(STORES)) for (const asset of await store(storeName).getAll()) {
        if (!includeSold && (asset.archived || asset.status === "sold")) continue;
        const history = valuations.filter((item) => item.entityType === entityType && item.entityId === asset.id).sort((a, b) => b.valuationDate.localeCompare(a.valuationDate));
        assets.push({ ...asset, entityType, linkedLoan: loans.get(asset.linkedLoanId) ?? null, latestValuePaise: history[0]?.valuePaise ?? asset.openingEstimatedValuePaise, latestValuationDate: history[0]?.valuationDate ?? asset.valuationDate, valuationCount: history.length });
      }
      return assets.sort((a, b) => (a.nickname ?? a.name).localeCompare(b.nickname ?? b.name));
    });
  }
  async function valueHistory(entityType, entityId) { return (await runTransaction(database, ["marketPrices"], "readonly", ({ store }) => store("marketPrices").indexGetAll("byEntityId", entityId))).filter((item) => item.entityType === entityType && !item.archived).sort((a, b) => b.valuationDate.localeCompare(a.valuationDate)); }
  async function activity(entityType, entityId) { const field = REF_FIELDS[entityType]; if (!field) throw new TypeError("Choose a physical asset type."); const [transactions, effects] = await runTransaction(database, ["transactions", "transactionEffects"], "readonly", async ({ store }) => Promise.all([store("transactions").getAll(), store("transactionEffects").getAll()])); const matching = transactions.filter((tx) => tx[field] === entityId); const ids = new Set(matching.filter((tx) => tx.status === "posted").map((tx) => tx.id)); return { transactions: matching.sort((a, b) => b.accountingDate.localeCompare(a.accountingDate)), incomePaise: effects.filter((effect) => ids.has(effect.transactionId) && effect.active && effect.dimension === "income").reduce((sum, effect) => sum + effect.amountPaise, 0), expensePaise: effects.filter((effect) => ids.has(effect.transactionId) && effect.active && effect.dimension === "expense").reduce((sum, effect) => sum + effect.amountPaise, 0) }; }
  function schedules(asset, today) { return [["Insurance renewal", asset.insuranceRenewalDate], ["Service", asset.nextServiceDate], ["Property tax", asset.propertyTaxDueDate], ["Maintenance", asset.maintenanceDueDate]].filter(([, date]) => date && date >= today).sort((a, b) => a[1].localeCompare(b[1])); }
  return { list, valueHistory, activity, schedules };
}
