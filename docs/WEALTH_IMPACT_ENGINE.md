# Wealth Impact Engine

## Current scope

Milestone 5 begins with `src/engines/wealth-engine.js`, a pure calculation boundary. It accepts effective-dated opening positions, transactions, transaction effects, and optional asset valuations. It performs no IndexedDB, DOM, service-worker, or network work.

`buildWealthSnapshot` calculates positions and totals at an explicit accounting date, monthly income and expense, savings, savings rate in basis points, and valuation adjustments. Only active effects attached to posted transactions are eligible. Future-dated openings, transactions, and valuations are excluded, so the same inputs can be deterministically recalculated for an earlier date.

`explainWealthChange` reports net-worth change, income contribution, expense impact, investment contribution, market-value change, debt reduction, loan interest, depreciation, corrections, and any residual capital movement. Investment contributions and principal repayments are descriptive drivers rather than additive income or expense, preventing double-counting.

`diagnoseWealthInputs` currently detects duplicate effect IDs, orphan effects, non-integer money, invalid opening/valuation references, and active effects attached to non-posted transactions. Diagnostics are non-mutating and never silently repair financial history.

`src/services/wealth-service.js` reads openings, transactions, effects, and market-price valuations in one readonly IndexedDB transaction. It can calculate without persistence, or atomically store a dated snapshot and sanitized audit event. A second snapshot for the same date requires explicit replacement; the superseded snapshot remains archived for traceability. Transaction create, replacement, void, restore, and duplicate operations mark snapshots on or after the affected accounting date stale in the same database transaction as the financial mutation.

Valuation recording accepts investments, properties, vehicles, and other assets; requires non-negative integer paise, an ISO valuation date, INR, a stable entity reference, and a declared manual/provider source; and atomically invalidates later snapshots. Bulk recalculation walks month ends chronologically and uses the requested final date for a partial final month.

`src/engines/valuation-engine.js` provides exact investment price × decimal quantity arithmetic, source-aware freshness assessment, fresh/stale/book fallback resolution, and residual-floor straight-line depreciation. Snapshot positions retain the chosen valuation source, date, age, and status. The route summarizes fallback use and labels each recent valuation with its source and freshness state.

Properties and vehicles may explicitly opt into straight-line depreciation with an annual basis-point rate, residual-value floor, and start date. The wealth service derives a dated value only when no eligible explicit valuation exists for that asset. A manual or provider valuation therefore takes precedence and the derived result remains labelled with `depreciation` provenance.

Accounts, cards, loans, investments, properties, vehicles, and other assets with `includeInNetWorth: false` are excluded consistently across opening positions, transaction effects, and valuations. The Wealth route states the number of excluded entities. Changing an entity, opening value, inclusion preference, or depreciation policy stales affected later snapshots atomically.

The Wealth route calculates current values from local data, presents net worth/assets/liabilities/monthly savings, discloses the complete wealth-change breakdown, income, expense, savings rate, valuation adjustment and calculation date, and allows an explicitly replaceable local snapshot. It includes manual valuation entry, recent valuation history, stale-snapshot labels, and dated recalculation controls. It does not invent sample figures or transmit financial data.

## Milestone 5 completion status

The implemented scope meets Milestone 5 calculation, historical-edit, transfer, asset-conversion, investment-contribution, principal/interest, automated-rule, and integrity-diagnostic acceptance criteria. Automated validation and browser verification cover the local-first route and snapshot workflow. A live provider adapter remains correctly reserved for Milestone 8.
