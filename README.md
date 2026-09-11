# FinOrbit

**Your Complete Financial World**

Track Money. Understand Your Financial Position.

FinOrbit is a local-first personal finance Progressive Web Application. Version 1 connects daily transactions with accounts, liabilities, financial investments, forecasts, reports, and a clear money position without requiring a cloud account. Homes and vehicles can be named only when useful for separating related expenses.

## Project status

The complete Version 1.0 local release candidate is implemented on `codex/v1-production-release`. Milestones 0–14 are complete; the Milestone 15 local acceptance gate passes. Publication remains pending reviewed integration to `main`, GitHub Pages enablement, the `v1.0.0` tag, and the GitHub Release.

The governing specification is [docs/FINORBIT_MASTER_DEVELOPMENT_PLAN.md](docs/FINORBIT_MASTER_DEVELOPMENT_PLAN.md).

## Version 1 boundaries

Version 1 is an installable, offline-capable, mobile-first PWA deployed to GitHub Pages. It uses browser-native APIs, IndexedDB, modular HTML/CSS/JavaScript, and Indian Rupee formatting. It includes transactions, accounts, cards, loans, recurring items, budgets, investments, lightweight expense-tracking items, forecasting, reports, reconciliation, encrypted backup/restore, and security controls.

Version 1 explicitly excludes bank/broker synchronization, cloud sync, multi-user collaboration, tax filing, automated advice or payments, OCR, trading, and LedgerBook compatibility/import.

## Documentation

- [Repository assessment](docs/REPOSITORY_ASSESSMENT.md)
- [Architecture](ARCHITECTURE.md)
- [Data model](DATA_MODEL.md)
- [Financial rules](FINANCIAL_RULES.md)
- [Security](SECURITY.md)
- [Roadmap](ROADMAP.md)
- [Known limitations](KNOWN_LIMITATIONS.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)
- [PWA foundation operations](docs/PWA_FOUNDATION.md)
- [Database and security foundation](docs/DATABASE_AND_SECURITY_FOUNDATION.md)
- [Onboarding and entity management](docs/ONBOARDING_AND_ENTITY_MANAGEMENT.md)
- [Transaction engine and daily use](docs/TRANSACTION_ENGINE_AND_DAILY_USE.md)
- [Wealth Impact Engine](docs/WEALTH_IMPACT_ENGINE.md)
- [Categories, family and budgets](docs/CATEGORIES_FAMILY_BUDGETS.md)
- [Investments and pricing](docs/INVESTMENTS_AND_PRICING.md)
- [Physical assets](docs/PHYSICAL_ASSETS.md)
- [Forecasting and goals](docs/FORECASTING_AND_GOALS.md)
- [Reports and exports](docs/REPORTS_AND_EXPORTS.md)
- [Reconciliation and integrity](docs/RECONCILIATION_AND_INTEGRITY.md)
- [User guide](docs/USER_GUIDE.md)
- [Privacy notice](docs/PRIVACY_NOTICE.md)
- [Recovery guide](docs/RECOVERY_GUIDE.md)
- [Version 1 release notes](docs/RELEASE_NOTES_V1.0.0.md)

## Local development

FinOrbit has no runtime package dependencies. Use Node.js 20 or newer:

```sh
pnpm install --frozen-lockfile
pnpm run serve
```

Open `http://127.0.0.1:4173`. Run all static checks and tests with:

```sh
pnpm run check
```

See [docs/PWA_FOUNDATION.md](docs/PWA_FOUNDATION.md) for installation, offline testing, cache updates, accessibility checks, browser assumptions, and GitHub Pages deployment.
