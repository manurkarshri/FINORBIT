# FinOrbit 1.0.0 release notes

FinOrbit 1.0.0 connects daily money activity to planning and wealth in a private, local-first Progressive Web Application.

## Highlights

- Guided household setup for accounts, cards, loans, investments and physical assets.
- Exact transaction posting for 21 financial event types with searchable history, replacement editing, splits, receipts, auditability and safe void/restore.
- Net-worth snapshots, valuation freshness, historical recalculation and transparent wealth explanations.
- Duplicate-proof recurring schedules, reminders, budgets, goals, forecasts and conservative safe-to-spend estimates.
- Investment lots, cost basis, gains and provider-isolated cached/manual price fallbacks.
- Properties, vehicles and valuables with linked liabilities, schedules and sale lifecycle.
- Reports with monthly, quarterly, yearly, financial-year and custom ranges; independent Category and Merchant analysis; PDF, spreadsheet and CSV export.
- Statement account reconciliation, integrity diagnostics and reversible repair.
- Optional app lock, authenticated encrypted backups, atomic restore, restrictive CSP, offline shell, storage-pressure guidance and recovery documentation.

## Verification

The release candidate passes the complete automated suite, static validation, minimal-artifact build, dependency audit, synthetic ten-year history test, database migration/rollback tests, backup/restore tests, financial invariant tests, and browser route checks at mobile and desktop sizes.

## Important limitations

Records are stored in the current browser and are not field-encrypted at rest. There is no cloud sync, direct bank or broker connection, tax filing, payment execution, OCR or multi-user account. Backups and forgotten secrets remain the user’s responsibility. See [../KNOWN_LIMITATIONS.md](../KNOWN_LIMITATIONS.md).
