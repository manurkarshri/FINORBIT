# Changelog

All notable changes to FinOrbit are documented here. The project follows milestone-based development before adopting semantic releases.

## [1.0.0] - 2026-09-06

### Added

- Governing Markdown development plan converted from the approved Word specification.
- Milestone 0 repository assessment, feature/gap inventories, and risk registers.
- Version 1 architecture, security standard, data model, financial rules, roadmap, contribution guide, and known limitations.
- Modular semantic PWA shell with five accessible hash routes and transaction-first startup.
- Responsive bottom/mobile and side/desktop navigation with original FinOrbit visual identity.
- Light, dark, and system themes with a single non-sensitive persisted preference.
- Versioned, scope-safe service worker and offline application-shell fallback.
- PWA manifest, original install icons, online/offline and update messaging, and safe global error handling.
- Dependency-free Node test/static validation foundation and GitHub Actions validation/Pages workflows.
- Versioned 26-store IndexedDB schema, ordered migrations, connection manager, repositories, validation, recoverable errors, and atomic multi-store transactions.
- Optional PIN/passphrase app lock, Web Crypto KDF/encryption envelopes, audit events, and multi-tab lock/reset coordination.
- Standard and encrypted backups, isolated validation/preview, atomic restore, and local-data reset controls.
- `fake-indexeddb@6.2.5` as an exact test-only dependency for database integration coverage.
- Resumable 13-stage onboarding with profile/regional preferences and minimum-setup enforcement.
- Account, card, loan, income, commitment, investment, property, and vehicle configuration with shared validation and lifecycle actions.
- Schema v2 migration and dedicated audited opening-position records, with exact decimal-string investment quantities.
- Entity-aware backup/restore counts and mobile-first offline-cached onboarding modules.
- Transaction-first home, adaptive mobile form, quick actions, history search/filter, upcoming-template summary, and Indian currency formatting.
- Explicit 21-type posting engine with atomic transaction/effect/split/version/audit persistence and opening-position projections.
- Replacement editing, duplicate, void/restore protections, safe receipt lifecycle, default transaction categories, and merchant snapshots.
- Schema v3 transaction effect/version stores and indexed history/reference queries.
- Centralized linked-entity lifecycle eligibility, explicit validated property/vehicle/other-asset postings, and replacement history discoverable from both transaction links.
- Pure Wealth Impact Engine foundation with dated recalculation, asset/liability/net-worth aggregation, monthly income/expense/savings metrics, valuation adjustments, wealth-change explanations, and integrity diagnostics.
- Audited, explicitly replaceable net-worth snapshot persistence from a consistent IndexedDB read.
- Atomic stale-snapshot invalidation for transaction creation, replacement, void, restore, and duplication.
- Validated manual/provider valuation recording with audited, effective-dated snapshot invalidation.
- Ordered month-end historical recalculation and the first local-first Wealth route with current totals, monthly metrics, and saved snapshot history.
- Wealth valuation entry, recent valuation history, full change explanation, stale-snapshot presentation, and user-triggered historical recalculation controls.
- Exact investment price/quantity arithmetic, source-aware freshness rules, transparent stale/book fallbacks, and deterministic residual-floor straight-line depreciation.
- Explicit property/vehicle depreciation configuration with bounded validation and manual-valuation precedence.
- Authoritative `includeInNetWorth` handling across openings, effects, valuations, assets, and liabilities, with atomic snapshot invalidation after entity-policy changes.
- Broad classified default categories, custom categories/subcategories, reversible category visibility, and family-member attribution targets.
- Monthly integer-paise budgets calculated from active classified expense effects, with rollover policies, spending pace, warnings, and prior-period comparisons.
- Exact investment-lot portfolio calculations with independent cost basis, realised/unrealised gains, provider isolation, cached/offline fallback, and visible price provenance.
- Multiple properties, vehicles, and other valuables with loan links, schedules, value history, asset-level income/expense reporting, and atomic sale/archive lifecycle.
- Transparent 7/30-day cash-flow forecasts, conservative safe-to-spend and surplus estimates, causal low-balance warnings, uncertainty controls, and typed goal contribution planning.
- Canonical offline reporting datasets with printable reports, professional PDF, structured Excel-compatible workbook, CSV fallback, safe defaults, and consistent totals.
- Deterministic recurring-rule engine covering calendar, interval, weekday, and explicit-date schedules with duplicate-proof occurrence identity.
- Schema v4 indexes for recurring occurrences, reminders, and unique occurrence-linked transactions.
- Plan dashboard with rule creation, pause/resume, overdue review, fixed/variable confirmation, postponement, skip history, and expected totals.
- Durable in-app reminders, permission-based single-delivery browser notifications, linked-account shortfall warnings, and explicit idempotent auto-posting.
- Statement-date account reconciliation with closing-balance differences, cleared/reconciled transaction states, explicit audited corrections, completion safeguards, and reconciliation history.
- Review-only duplicate and broken-reference diagnostics, reversible orphan-effect repair, and local JSON diagnostic export.
- Independent category and merchant report filters and spending summaries, with monthly, quarterly, calendar-year, Indian financial-year, and custom date ranges.
- Security and resilience audit covering CSP, injection exposure, secrets, dependencies, permissions, encrypted backups, atomic restore, receipt validation, and cache boundaries.
- On-demand browser storage/database health checks, contextual persistent-storage requests, pressure guidance, privacy notice, and recovery procedures.
- Linear-time duplicate diagnostics and synthetic ten-year transaction-history validation.
- Responsive and accessibility hardening with async busy states, corrected onboarding route synchronization, bounded transaction-history rendering, keyboard/mobile checks, and overflow-safe form grids.
- Minimal production build artifact generated from the service-worker runtime allowlist.

### Historical assessment

- The remote repository and local workspace contained no prior application implementation or Git history when Milestone 0 began. Subsequent milestones now provide the functionality listed above.
