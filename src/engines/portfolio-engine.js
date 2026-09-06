import { multiplyPriceByQuantity } from "./valuation-engine.js";

export function calculateHolding({ investment, lots = [], valuation }) {
  const quantity = lots.length ? lots.reduce((sum, lot) => addDecimal(sum, lot.quantity), "0") : investment.quantity ?? "0";
  const costBasisPaise = lots.length ? lots.reduce((sum, lot) => sum + lot.costBasisPaise, 0) : investment.openingCostBasisPaise ?? investment.openingEstimatedValuePaise ?? 0;
  const currentValuePaise = valuation?.valuePaise ?? (valuation?.unitPricePaise != null ? multiplyPriceByQuantity(valuation.unitPricePaise, quantity) : investment.openingEstimatedValuePaise ?? costBasisPaise);
  const realisedGainPaise = lots.reduce((sum, lot) => sum + (lot.realisedGainPaise ?? 0), 0); const unrealisedGainPaise = currentValuePaise - costBasisPaise;
  return { investmentId: investment.id, name: investment.name, assetClass: investment.assetClass, quantity, costBasisPaise, currentValuePaise, realisedGainPaise, unrealisedGainPaise, totalGainPaise: realisedGainPaise + unrealisedGainPaise, priceSource: valuation?.source ?? "book", priceTimestamp: valuation?.priceTimestamp ?? valuation?.updatedAt ?? null, manualOverride: valuation?.source === "manual" };
}

function addDecimal(a, b) { const scale = Math.max((a.split(".")[1] ?? "").length, (b.split(".")[1] ?? "").length); const factor = 10n ** BigInt(scale); const integer = (value) => { const [whole, fraction = ""] = value.split("."); return BigInt(whole) * factor + BigInt(fraction.padEnd(scale, "0")); }; const total = integer(a) + integer(b); const whole = total / factor; const fraction = String(total % factor).padStart(scale, "0").replace(/0+$/, ""); return fraction ? `${whole}.${fraction}` : String(whole); }

export function calculatePortfolio({ investments = [], lots = [], valuations = [] }) {
  const holdings = investments.filter((item) => !item.archived && item.status === "active").map((investment) => { const prices = valuations.filter((item) => item.entityId === investment.id).sort((a, b) => String(b.priceTimestamp ?? b.updatedAt ?? b.valuationDate).localeCompare(String(a.priceTimestamp ?? a.updatedAt ?? a.valuationDate))); return calculateHolding({ investment, lots: lots.filter((lot) => lot.investmentId === investment.id && !lot.archived), valuation: prices[0] }); });
  return { holdings, costBasisPaise: holdings.reduce((sum, item) => sum + item.costBasisPaise, 0), currentValuePaise: holdings.reduce((sum, item) => sum + item.currentValuePaise, 0), realisedGainPaise: holdings.reduce((sum, item) => sum + item.realisedGainPaise, 0), unrealisedGainPaise: holdings.reduce((sum, item) => sum + item.unrealisedGainPaise, 0) };
}
