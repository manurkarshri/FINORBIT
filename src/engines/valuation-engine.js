const DAY_MS = 86_400_000;

function dateMs(value, field) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "") || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) throw new TypeError(`${field} must be an ISO calendar date.`);
  return Date.parse(`${value}T00:00:00Z`);
}
function assertMoney(value, field) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${field} must be non-negative integer paise.`);
}

export function multiplyPriceByQuantity(unitPricePaise, quantity) {
  assertMoney(unitPricePaise, "unitPricePaise");
  if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(quantity ?? "")) throw new TypeError("quantity must be a non-negative decimal string.");
  const [whole, fraction = ""] = quantity.split(".");
  const scale = 10n ** BigInt(fraction.length);
  const units = BigInt(`${whole}${fraction}`);
  const numerator = BigInt(unitPricePaise) * units;
  const rounded = (numerator + scale / 2n) / scale;
  if (rounded > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError("Calculated market value exceeds safe integer paise.");
  return Number(rounded);
}

export function assessFreshness(valuation, asOfDate) {
  const asOf = dateMs(asOfDate, "asOfDate");
  const observed = dateMs(valuation.valuationDate, "valuationDate");
  if (observed > asOf) return { status: "future", ageDays: -Math.floor((observed - asOf) / DAY_MS), staleAfterDays: valuation.staleAfterDays ?? defaultFreshnessDays(valuation) };
  const staleAfterDays = valuation.staleAfterDays ?? defaultFreshnessDays(valuation);
  const ageDays = Math.floor((asOf - observed) / DAY_MS);
  return { status: ageDays > staleAfterDays ? "stale" : "fresh", ageDays, staleAfterDays };
}

function defaultFreshnessDays(valuation) {
  if (valuation.source === "provider") return 1;
  return valuation.entityType === "investment" ? 30 : 365;
}

export function resolveValuation(candidates, { asOfDate, bookValuePaise = 0 } = {}) {
  assertMoney(bookValuePaise, "bookValuePaise");
  const eligible = candidates
    .map((valuation) => ({ ...valuation, freshness: assessFreshness(valuation, asOfDate) }))
    .filter(({ freshness }) => freshness.status !== "future")
    .sort((a, b) => b.valuationDate.localeCompare(a.valuationDate));
  const fresh = eligible.find(({ freshness }) => freshness.status === "fresh");
  const chosen = fresh ?? eligible[0];
  if (!chosen) return { valuePaise: bookValuePaise, status: "book-fallback", source: "book", valuationDate: null, ageDays: null };
  return { ...chosen, status: chosen.freshness.status === "fresh" ? "fresh" : "stale-fallback", ageDays: chosen.freshness.ageDays, staleAfterDays: chosen.freshness.staleAfterDays };
}

export function straightLineDepreciation({ baseValuePaise, residualValuePaise = 0, annualRateBasisPoints, startDate, asOfDate }) {
  assertMoney(baseValuePaise, "baseValuePaise");
  assertMoney(residualValuePaise, "residualValuePaise");
  if (residualValuePaise > baseValuePaise) throw new RangeError("Residual value cannot exceed base value.");
  if (!Number.isInteger(annualRateBasisPoints) || annualRateBasisPoints < 0 || annualRateBasisPoints > 10000) throw new TypeError("annualRateBasisPoints must be from 0 through 10000.");
  const start = dateMs(startDate, "startDate"); const end = dateMs(asOfDate, "asOfDate");
  if (end <= start) return { valuePaise: baseValuePaise, depreciationPaise: 0, elapsedDays: 0 };
  const elapsedDays = Math.floor((end - start) / DAY_MS);
  const depreciable = BigInt(baseValuePaise - residualValuePaise);
  const depreciation = Number((depreciable * BigInt(annualRateBasisPoints) * BigInt(elapsedDays)) / (10000n * 365n));
  const depreciationPaise = Math.min(baseValuePaise - residualValuePaise, depreciation);
  return { valuePaise: baseValuePaise - depreciationPaise, depreciationPaise, elapsedDays };
}
