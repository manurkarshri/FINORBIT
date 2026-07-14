# FinOrbit Data Model

## Model principles

- IndexedDB is the Version 1 persistence layer.
- Records use stable opaque IDs; relationships never depend on mutable names.
- Monetary values use integer paise plus an explicit currency code. Floating-point numbers are forbidden for persisted money and aggregation.
- Dates and times use explicit semantics: ISO calendar dates for user-accounting dates and UTC instants for audit/system events.
- Archived entities remain referencable by historical records.
- Transactions are immutable financial facts at the engine boundary; editing creates a traceable replacement/reversal operation rather than silently losing prior meaning.
- Schema versions and migrations are monotonic, tested, and recoverable.

## Logical stores

The initial logical model includes profiles, accounts, credit cards, loans, transactions, transaction splits, recurring rules, recurring occurrences, categories, subcategories, family members, merchants, investments, investment lots, market prices, properties, vehicles, other assets, budgets, goals, receipts, notifications, net-worth snapshots, reconciliations, audit logs, and settings.

Physical store consolidation may be approved after query and migration prototypes, provided integrity and lifecycle rules remain explicit.

## Common record fields

Records generally include `id`, `createdAt`, `updatedAt`, `schemaVersion`, and lifecycle state. Financial records add accounting date, currency, source/type, and audit linkage. Display labels are snapshots where historical readability requires them, but stable IDs remain authoritative.

## Transaction aggregate

A transaction is the auditable command record. Balanced effects/splits describe changes to cash, expense/income classifications, assets, liabilities, budgets, and cost basis. Required transaction types include income, expense, transfer, card purchase/payment, loan disbursement/payment, investment purchase/sale, asset purchase/sale, refund, reimbursement, correction, and balance adjustment.

The aggregate must enforce:

- one currency per transaction until explicit foreign-exchange support is approved;
- non-negative integer paise components;
- required source/destination references for transfers;
- principal plus interest plus fees equals loan-payment cash outflow;
- linked card payments do not create a second expense;
- asset conversions do not create ordinary expense except explicit fees/taxes;
- edits and corrections preserve an audit trail.

## Investments and prices

Holdings and lots are durable portfolio facts. Market prices are timestamped observations with provider and freshness metadata. A failed or stale price update never changes quantity, cost basis, or transaction history. Valuation projections identify their price timestamp and fallback state.

## Migration and restore contract

Before upgrade, open the current version, run ordered idempotent migration steps in a controlled transaction where supported, validate invariants, and only then mark the target schema active. On failure, preserve the prior database and present recovery guidance.

Restore parses and validates version, checks referential integrity and monetary invariants in isolation, reports incompatibilities, and replaces active data only after full success. Interrupted or invalid restores leave active data unchanged.

## Milestone 2 physical schema

Schema version 1 maps each of the 26 approved logical boundaries to its own object store with key path `id`. General stores index `updatedAt` and `archived`; audit logs index `createdAt` and `type`; settings index `updatedAt`. Encryption envelopes are versioned AES-GCM records containing KDF metadata, salt, IV, and ciphertext. Domain-specific indexes and financial invariants remain deferred until their owning milestones introduce real records and measured query patterns.

## Milestone 3 physical schema

Schema version 2 preserves all 26 stores and adds `openingPositions`, indexed by `entityId` and `effectiveDate`. Profiles, accounts, cards, loans, recurring rules, investments, properties, and vehicles add `status` and normalized `nameKey` indexes for active/status filtering and duplicate-name lookup. Opening records contain stable entity ID/type, integer-paise value, effective date, source (`onboarding` or `manual`), timestamps, and audit linkage. Investment quantities persist as non-negative decimal strings; persisted money never uses binary floating point.

Income sources and commitment templates share `recurringRules` with an explicit `kind`; neither creates `recurringOccurrences`. Archive is reversible and hard deletion is not the normal lifecycle. Closed/sold entities remain readable.

## Milestone 4 physical schema

Schema version 3 adds `transactionEffects` and `transactionVersions`, bringing the physical total to 29 stores. Effects index `transactionId`, `entityId`, and `dimension`; versions index `transactionId` and `createdAt`. Transactions index accounting date, type, status, source/destination account, card, loan, investment, category, and replacement linkage. Receipts and splits index transaction ID.

Transactions contain integer-paise amount, INR, accounting date/time, type/status, stable entity/category/merchant relationships and snapshots, notes/tags, receipt IDs, reconciliation state, recurrence/original/replacement links, and timestamps. Effects carry signed integer paise and an explicit dimension/classification. Split totals must equal the aggregate total. Voided records remain readable; only active effects contribute to projections.
