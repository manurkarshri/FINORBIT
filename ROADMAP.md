# FinOrbit Version 1 Roadmap

The governing sequence is defined in `docs/FINORBIT_MASTER_DEVELOPMENT_PLAN.md`. A milestone begins only after the previous milestone meets acceptance criteria or has documented blockers and the user authorizes continuation.

## Milestone status

- **M0 Repository assessment and specification:** complete; squash-merged in PR #1.
- **M1 Modular PWA foundation:** complete; squash-merged in PR #2.
- **M2 Database and security foundation:** complete; squash-merged in PR #3.
- **M3 Guided onboarding and entity management:** complete; squash-merged in PR #4.
- **M4 Transaction-first main experience:** implemented and locally/CI validated on `codex/transactions`; draft PR #5 review and merge pending.
- **M5 Wealth Impact Engine:** implemented and locally verified on `codex/wealth-impact`; merge/review remains dependent on Milestone 4 landing first.
- **M6 Recurring income, expenses and reminders:** implemented and locally verified on `codex/recurring`; merge/review remains dependent on the stacked M4–M5 branches landing first.
- **M7 Categories, family and budgets:** implemented and locally verified on `codex/categories-budgets`; merge/review remains dependent on earlier milestone branches landing first.
- **M8 Investments and price syncing:** implemented and locally verified on `codex/investments-pricing`; merge/review remains dependent on earlier milestone branches landing first.
- **M9 Properties, vehicles and other assets:** implemented and locally verified on `codex/physical-assets`; merge/review remains dependent on earlier milestone branches landing first.
- **M10 Forecasting, goals and planning:** implemented and locally verified on `codex/forecasting-goals`; merge/review remains dependent on earlier milestone branches landing first.
- **M11 Reports and exports:** implemented and locally verified on `codex/reports-exports`; merge/review remains dependent on earlier milestone branches landing first.
- **M12 Reconciliation and data integrity:** implemented and locally verified on `codex/reconciliation-integrity`; merge/review remains dependent on earlier milestone branches landing first.
- **M13 Security, privacy and resilience audit:** implemented and locally verified on `codex/security-resilience`; final release review remains dependent on earlier milestone branches landing first.
- **M14 UX, accessibility and performance:** implemented and locally/browser verified on `codex/ux-accessibility-performance`; final release review remains.
- **M15 Production release:** local release candidate verified on `codex/v1-production-release`; publication awaits reviewed integration to `main`, GitHub Pages enablement, tag, and GitHub Release.

## Prioritized Version 1 backlog

1. Establish an accessible installable application shell and test/deployment pipeline.
2. Implement typed-by-contract domain values, IndexedDB schema/migrations, audit log, local security, and validated backup/restore.
3. Add guided profile/account/card/loan setup with stable IDs and archive semantics.
4. Deliver fast transaction capture and searchable/editable history.
5. Implement and exhaustively test wealth-impact rules.
6. Add recurrence generation with idempotency, reminders, and review states.
7. Add categories, family attribution, and budgets without corrupting transaction truth.
8. Add investments with provider isolation, timestamped prices, and safe fallbacks.
9. Add properties, vehicles, and other assets.
10. Add transparent forecasting, goals, and safe-to-spend projections.
11. Add verified PDF/CSV/XLSX/backup reporting and masking controls.
12. Add reconciliation, diagnostics, and reversible repair.
13. Complete security/resilience audit and large-data testing.
14. Complete accessibility, mobile UX, and performance hardening.
15. Release only after all stated blockers are cleared.

## Milestone 1 implementation

Milestone 1 is isolated on `codex/pwa-foundation` and contains only the deployable foundation:

1. Add semantic `index.html` with skip link, landmark structure, app mount points, no inline executable code, and transaction-first loading/empty state.
2. Add `src/app/bootstrap.js`, `app.js`, `router.js`, and `state.js`; use hash routing for `transactions`, `accounts`, `plan`, `wealth`, and `more`.
3. Add accessible responsive shell components and mobile-first navigation with light/dark/system theme tokens.
4. Add layered CSS (`tokens`, `base`, `layout`, `components`, `utilities`) without a CSS framework.
5. Add a standards-compliant manifest and complete icon set.
6. Add a versioned service worker that precaches only the application shell, cleans obsolete caches, handles navigation safely on GitHub Pages, and never caches financial/user data.
7. Add a minimal Node-based test harness using built-in `node:test`, plus unit tests for routing/theme helpers and browser smoke tests for load, navigation, install metadata, keyboard access, console errors, service-worker registration, and offline reload.
8. Add GitHub Actions for static validation/tests and GitHub Pages deployment from reviewed `main` commits.
9. Document local static serving, tests, cache invalidation, accessibility checks, and deployment.

Milestone 1 acceptance requires a working mobile/desktop shell, routing, navigation, both themes, valid manifest, registered service worker, offline shell reload after first visit, no console errors, automated checks, and successful GitHub Pages deployment verification. It must not introduce IndexedDB schema or financial features reserved for later milestones.

## Recorded deployment debt

The current GitHub Pages workflow uploads the repository root. A later infrastructure cleanup should build and upload a minimal deployment artifact containing runtime assets only; this is recorded debt and does not expand Milestone 2.
