import { runTransaction } from "../database/transaction.js";

export function createMarketDataService(database, { adapters = {}, wealth, now = () => new Date().toISOString(), online = () => navigator.onLine } = {}) {
  async function refresh(investments) {
    const results = [];
    for (const investment of investments) {
      const adapter = adapters[investment.priceProvider];
      if (!online() || !adapter || !investment.symbol) { results.push({ investmentId: investment.id, status: "cached", reason: !online() ? "offline" : "provider-unavailable" }); continue; }
      try { const quote = await adapter.quote({ symbol: investment.symbol, assetClass: investment.assetClass }); if (!Number.isSafeInteger(quote.unitPricePaise) || quote.unitPricePaise < 0) throw new Error("Provider returned an invalid price."); const valuation = await wealth.recordValuation({ entityType: "investment", entityId: investment.id, unitPricePaise: quote.unitPricePaise, quantity: investment.quantity, valuationDate: quote.valuationDate ?? now().slice(0, 10), priceTimestamp: quote.priceTimestamp ?? now(), provider: investment.priceProvider, source: "provider" }); results.push({ investmentId: investment.id, status: "updated", valuation }); } catch (error) { results.push({ investmentId: investment.id, status: "cached", reason: "provider-failed", message: error.message }); }
    }
    return results;
  }
  async function configuration() { return (await runTransaction(database, ["settings"], "readonly", ({ store }) => store("settings").get("market.providers")))?.value ?? {}; }
  async function saveConfiguration(value) { const instant = now(); return runTransaction(database, ["settings"], "readwrite", ({ store }) => store("settings").put({ id: "market.providers", value, updatedAt: instant, schemaVersion: 6 })); }
  return { refresh, configuration, saveConfiguration };
}
