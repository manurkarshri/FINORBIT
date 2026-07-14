# Changelog

All notable changes to FinOrbit are documented here. The project follows milestone-based development before adopting semantic releases.

## Unreleased

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

### Confirmed

- The remote repository and local workspace contained no prior application implementation or Git history at assessment time.
- No application, database, PWA, or deployment functionality exists yet.
