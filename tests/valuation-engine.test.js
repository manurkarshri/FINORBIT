import test from "node:test";
import assert from "node:assert/strict";
import { assessFreshness, multiplyPriceByQuantity, resolveValuation, straightLineDepreciation } from "../src/engines/valuation-engine.js";

test("investment quantity multiplication is exact and rounds to nearest paise", () => {
  assert.equal(multiplyPriceByQuantity(12345, "10.5"), 129623);
  assert.equal(multiplyPriceByQuantity(1, "0.5"), 1);
  assert.throws(() => multiplyPriceByQuantity(100, "1e3"));
});
test("valuation freshness uses explicit and source-aware windows", () => {
  assert.deepEqual(assessFreshness({ valuationDate: "2026-09-04", source: "provider", entityType: "investment" }, "2026-09-05"), { status: "fresh", ageDays: 1, staleAfterDays: 1 });
  assert.equal(assessFreshness({ valuationDate: "2026-09-03", source: "provider", entityType: "investment" }, "2026-09-05").status, "stale");
  assert.equal(assessFreshness({ valuationDate: "2026-09-06", source: "manual", entityType: "property" }, "2026-09-05").status, "future");
});

test("valuation resolution prefers fresh facts and falls back transparently", () => {
  const resolved = resolveValuation([
    { id: "stale-provider", entityType: "investment", entityId: "fund", valuePaise: 120000, valuationDate: "2026-09-01", source: "provider" },
    { id: "manual", entityType: "investment", entityId: "fund", valuePaise: 110000, valuationDate: "2026-08-20", source: "manual" },
  ], { asOfDate: "2026-09-05", bookValuePaise: 100000 });
  assert.equal(resolved.id, "manual");
  assert.equal(resolved.status, "fresh");
  assert.equal(resolveValuation([], { asOfDate: "2026-09-05", bookValuePaise: 100000 }).status, "book-fallback");
});

test("straight-line depreciation is deterministic and respects residual value", () => {
  assert.deepEqual(straightLineDepreciation({ baseValuePaise: 1000000, residualValuePaise: 200000, annualRateBasisPoints: 1000, startDate: "2025-09-05", asOfDate: "2026-09-05" }), { valuePaise: 920000, depreciationPaise: 80000, elapsedDays: 365 });
  assert.equal(straightLineDepreciation({ baseValuePaise: 1000000, residualValuePaise: 200000, annualRateBasisPoints: 10000, startDate: "2020-01-01", asOfDate: "2026-09-05" }).valuePaise, 200000);
});
