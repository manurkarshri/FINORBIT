# Contributing to FinOrbit

## Governing rules

Read `docs/FINORBIT_MASTER_DEVELOPMENT_PLAN.md` and the current milestone documents before changing code. Work milestones sequentially. Do not start later-milestone features opportunistically.

## Branches and pull requests

- Use one branch per milestone, following the `codex/<milestone>` names in the specification.
- Keep commits small, understandable, and free of generated secrets or local configuration.
- Open a pull request for every milestone and keep `main` deployable where practical.
- Explain architecture, database, security, financial-logic, dependency, and migration effects.
- Update documentation and `CHANGELOG.md` in the same pull request.

## Coding standard

- Use semantic HTML, accessible forms, keyboard-operable controls, and mobile-first CSS.
- Use native ES modules and browser APIs; dependencies require justification.
- Keep UI, financial engines, persistence, and external services separated.
- Prefer pure functions and immutable inputs in domain engines.
- Represent money as integer paise and validate at boundaries.
- Use stable opaque IDs and explicit dates/currencies.
- Avoid hidden global state, inline scripts, dynamic code evaluation, and user text inserted as HTML.
- Use clear names, small modules, JSDoc for public contracts, and comments for rationale rather than restating code.

## Tests and quality gates

Every change must add proportionate automated tests. Financial calculations require boundary and regression cases. Database migrations require upgrade, failure, and preservation tests. UI changes require keyboard/accessibility checks and supported-browser smoke tests. PWA changes require online-first-load and offline-reload tests.

Before requesting review, run all documented checks, inspect browser console output, verify no secrets, review the complete diff, and record known limitations. Failing or skipped checks must be explicit.

## Financial and security review

Changes that affect balances, classifications, net worth, recurrence, restoration, encryption, imports, receipts, external requests, or identifiers require focused review against `FINANCIAL_RULES.md` and `SECURITY.md`. Synthetic data only should be used in tests and issues.
