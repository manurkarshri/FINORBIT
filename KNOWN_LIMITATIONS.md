# Known Limitations

## Milestone 1

- The application is a navigable PWA shell only; its empty states are intentionally non-financial.
- There is no IndexedDB database, onboarding, account/card/loan setup, transaction entry/history, financial engine, backup/restore, reporting, recurrence, investment, asset, budget, goal, or wealth functionality.
- Theme preference is the only browser-persisted application value and is not sensitive.
- Online/offline state uses the browser connectivity hint; it does not prove internet reachability.
- GitHub Pages becomes production only after reviewed code reaches `main` and repository Pages is configured to use GitHub Actions.
- Install prompts and exact PWA presentation vary by supported browser and operating system.
- The browser support baseline is current stable Chromium, Firefox, and Safari with ES modules; service workers/install UI depend on platform support.
- Exact IndexedDB physical stores, indexes, migration mechanics, encryption envelopes, and auto-lock behavior are deferred to Milestone 2.
- No financial-data security control should be interpreted as implemented because no financial data exists yet.

## Product boundaries through Version 1

Version 1 will not provide direct financial-institution synchronization, broker login, cloud synchronization, collaborative family accounts, tax filing, automated financial advice/payments, receipt OCR, open banking, lending/insurance sales, or trading. It will not import or maintain compatibility with LedgerBook products.

These limitations change only through an approved specification/roadmap update.

## Milestone 3

- Entity data and notes are stored locally but are not field-encrypted at rest. App lock does not change this protection level.
- Setup values are configuration and opening positions only. There is no transaction entry/history, recurring occurrence generation, net-worth or gain calculation, report, forecast, reconciliation, reminder, market API, or cloud sync.
- Duplicate names produce guidance but remain allowed. Warning-only conditions such as over-limit cards and loan principal above original principal remain intentional user choices.
- Day-of-month values permit 1–31; later recurrence logic must define behavior in shorter months.
- Opening estimates are user-entered and may be stale. No automatic price, depreciation, amortization, or rental-income behavior exists.

## Milestone 2

- The database stores are empty infrastructure; onboarding and every financial workflow remain deferred to Milestone 3 or later.
- App lock reduces casual access after locking but is not operating-system authentication, hardware-backed key storage, full database encryption, or protection from a compromised device/extension.
- IndexedDB metadata, store/index names, record counts, and approximate sizes remain observable. Standard backups deliberately exclude lock credentials.
- Forgotten lock or backup secrets cannot be recovered by FinOrbit. Browser reset/deletion is not claimed to make data forensically unrecoverable.
- Restore validates known relationship fields; later milestones must extend reference and financial-invariant validation as they introduce domain records.
- The Pages workflow currently uploads the repository root instead of a clean runtime-only artifact; cleanup is recorded technical debt.
- Failed-attempt delay is held in session memory and can be reset by fully reloading the page.
- JavaScript string secrets cannot be guaranteed to be securely erased from runtime memory.
- Encrypted backups may restore an earlier app-lock configuration; restore preview identifies this before replacement.
- A future backup schema version will require a validated backup migration path before active-data replacement.
