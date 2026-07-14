# FinOrbit

**Your Complete Financial World**

Track Money. Understand Wealth.

FinOrbit is a new, independent, local-first personal finance and wealth-management Progressive Web Application. Version 1 will connect daily transactions with accounts, liabilities, investments, assets, forecasts, reports, and net worth without requiring a cloud account.

## Project status

Milestone 2 is implemented on `codex/security-database`: the PWA shell now has a versioned IndexedDB foundation, app lock, audited security operations, and validated standard/encrypted backup and atomic restore. It intentionally contains no onboarding, financial records, or calculations.

The governing specification is [docs/FINORBIT_MASTER_DEVELOPMENT_PLAN.md](docs/FINORBIT_MASTER_DEVELOPMENT_PLAN.md).

## Version 1 boundaries

Version 1 is an installable, offline-capable, mobile-first PWA deployed to GitHub Pages. It uses browser-native APIs, IndexedDB, modular HTML/CSS/JavaScript, and Indian Rupee formatting. It includes transactions, accounts, cards, loans, recurring items, budgets, investments, physical assets, forecasting, reports, reconciliation, encrypted backup/restore, and security controls.

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

## Development status

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
