# FinOrbit Architecture

## Decision summary

FinOrbit Version 1 will be a static, installable PWA built with semantic HTML, modular CSS, and native JavaScript modules. It will be hosted on GitHub Pages, use IndexedDB for durable local data, and keep financial-domain logic independent from UI and persistence. No framework or required backend is approved for Version 1.

This is the target architecture established during Milestone 0; no application code has yet been implemented.

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

Milestone 1 will use hash-based client routing so deep links work on GitHub Pages without server rewrites. URLs must remain stable and accessible. The service worker will cache only the versioned application shell initially; user financial data remains in IndexedDB and is never placed in Cache Storage.

## Browser and module baseline

Target current stable Chromium, Firefox, and Safari versions that support ES modules, IndexedDB, Web Crypto, service workers, and installable PWA fundamentals. Unsupported capabilities require visible fallbacks. The precise support matrix will be recorded when browser testing begins.

## Architecture decision records

Material deviations from this document require a short ADR under `docs/decisions/` describing context, decision, consequences, and migration impact.
