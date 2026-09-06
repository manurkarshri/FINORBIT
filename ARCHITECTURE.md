# FinOrbit Architecture

## Decision summary

FinOrbit Version 1 will be a static, installable PWA built with semantic HTML, modular CSS, and native JavaScript modules. It will be hosted on GitHub Pages, use IndexedDB for durable local data, and keep financial-domain logic independent from UI and persistence. No framework or required backend is approved for Version 1.

Milestone 3 adds application services for onboarding and entity commands above the persistence layer. UI modules call these services rather than IndexedDB. Entity commands share validation, audit, stable-ID, reference, lifecycle, and opening-position rules; no calculation engine or transaction command is introduced.

Opening balances and opening asset/liability estimates are dedicated `openingPositions` records linked to stable entity and audit IDs. They are starting facts, never synthetic transactions, income, or expenses.

Milestone 4 introduces a transaction aggregate above IndexedDB. A command validates its type-specific fields and references, derives explicit postings through the pure posting engine, and writes transaction, effects, splits, immutable version snapshot, merchant snapshot, and audit events in one transaction. Projections fold opening positions with active effects; accounts are never mutated as an untraceable balance cache. Replacement editing creates a linked transaction while deactivating original effects atomically. Void/restore toggles one existing effect set and prevents duplicate application.

Milestone 5 introduces a pure Wealth Impact Engine above transaction postings. It joins active effects to transaction accounting dates, applies effective-dated openings and latest eligible valuations, and derives assets, liabilities, net worth, income, expense, savings, savings rate, explanations, and integrity diagnostics without importing the DOM, IndexedDB, or network services. Snapshot persistence and route presentation consume this engine rather than reimplementing calculations.

The wealth application service loads all calculation inputs through one readonly transaction and stores each snapshot with its audit event through one readwrite transaction. Transaction mutations invalidate affected dated snapshots inside their own atomic write boundary, ensuring a posted change cannot commit while leaving a later snapshot marked current.

## Architectural principles

1. Local-first: all core workflows function without a server or account.
2. Transaction-first: startup and navigation prioritize logging and reviewing transactions.
3. Layered boundaries: UI, domain engines, persistence, and external services do not depend on each other's internal representations.
4. Deterministic finance: money uses integer minor units; domain calculations are pure and tested.
5. Resilient evolution: IndexedDB migrations are versioned, atomic where possible, tested, and never silently reset data.
6. Progressive enhancement: external pricing and notifications improve the product but never block transaction entry or corrupt records.
7. Minimal supply chain: prefer browser-native APIs and add dependencies only with written justification.

## Runtime layers

- `src/app`: bootstrap, routing, state coordination, and lifecycle.
- `src/components`: reusable accessible UI primitives with no financial calculations.
- `src/modules`: feature controllers and views grouped by user workflow.
- `src/engines`: pure transaction, wealth, recurring, forecast, reconciliation, and reporting rules.
- `src/database`: IndexedDB schema, migrations, repositories, and atomic units of work.
- `src/services`: encryption, backup, export, notifications, and isolated market-data adapters.
- `src/utils`: formatting, validation, identifiers, dates, and shared low-level helpers.

## Final Version 1 folder structure

```text
/
├── index.html
├── manifest.webmanifest
├── service-worker.js
├── assets/
│   ├── icons/
│   ├── images/
│   └── fonts/
├── src/
│   ├── app/
│   ├── components/
│   ├── database/
│   ├── engines/
│   ├── modules/
│   │   ├── transactions/
│   │   ├── accounts/
│   │   ├── cards/
│   │   ├── loans/
│   │   ├── recurring/
│   │   ├── investments/
│   │   ├── properties/
│   │   ├── vehicles/
│   │   ├── budgets/
│   │   ├── goals/
│   │   ├── reports/
│   │   └── settings/
│   ├── services/
│   ├── styles/
│   └── utils/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── browser/
├── docs/
└── .github/workflows/
```

Directories are created when their milestone introduces owned code; Milestone 0 does not add empty scaffolding.

## Dependency direction

`components/modules -> app/domain contracts -> engines -> domain values`

Persistence and services implement interfaces consumed by application coordinators. Engines must not import DOM, IndexedDB, network, or service-worker modules. Views must not calculate balances or net worth. Database records must not leak directly into UI rendering.

## Application state

IndexedDB is the durable source of truth. In-memory state is a disposable projection used for the active route and summaries. Mutations pass through a command/use-case boundary that validates input, applies financial rules, persists all related records atomically, emits an audit entry, and then refreshes projections.

## Routing and deployment

Milestone 1 uses hash-based client routing so deep links work on GitHub Pages without server rewrites. The five shell routes are `#/transactions`, `#/accounts`, `#/plan`, `#/wealth`, and `#/more`; unknown hashes canonicalize to Transactions. Route changes update navigation state, document title, and heading focus without full reload.

The service worker caches only the explicit, versioned shell allowlist. It resolves all assets relative to its registration scope for GitHub Pages subpath compatibility. Navigations use an online-first strategy with cached `index.html` fallback; allowlisted static assets use cache-first. No runtime data or external response is cached.

## Browser and module baseline

Target current stable Chromium, Firefox, and Safari versions that support ES modules, IndexedDB, Web Crypto, service workers, and installable PWA fundamentals. Unsupported capabilities require visible fallbacks. The precise support matrix will be recorded when browser testing begins.

## Architecture decision records

Material deviations from this document require a short ADR under `docs/decisions/` describing context, decision, consequences, and migration impact.
