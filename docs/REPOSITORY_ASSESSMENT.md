# Milestone 0 Repository Assessment

Assessment date: 2026-07-14

Repository: `manurkarshri/FINORBIT`

Milestone: 0 — Repository assessment and specification

## Executive conclusion

The assigned workspace was empty and was not a Git worktree. The named GitHub remote was reachable but returned no `HEAD` or refs, establishing that it had no commits to inspect. Therefore there is no experimental FinOrbit implementation to retain, replace, run, or delete. Milestone 0 creates the initial repository history as documentation only.

This is a clean-slate product. LedgerBook Pro and Personal Financial Dashboard are conceptual references only; no compatibility layer or import path is approved.

## Inspection scope and evidence

- Enumerated all visible and hidden workspace entries before changes: none existed.
- Checked Git status: the workspace was not a repository.
- Queried the specified remote's symbolic `HEAD` and refs: no refs were returned.
- Examined the complete governing Word document and converted its 1,476 paragraphs into the requested Markdown specification.
- Searched for application, package, manifest, service-worker, database, test, CI, configuration, and generated files: none existed.

## Existing feature inventory

| Area | Working | Placeholder | Finding |
| --- | --- | --- | --- |
| Application shell/UI | No | No | Absent |
| Transactions/accounts | No | No | Absent |
| Financial calculations | No | No | Absent |
| IndexedDB/data migration | No | No | Absent |
| PWA manifest/service worker | No | No | Absent |
| Offline/installability | No | No | Absent |
| Security/encryption | No | No | Absent |
| Backup/restore/export | No | No | Absent |
| Automated/browser tests | No | No | Absent |
| CI/GitHub Pages | No | No | Absent |

No existing experimental files, functioning features, incomplete placeholders, dependencies, or generated artifacts were found. No files were deleted.

## Retain, replace, and defer

- Retain: the approved product plan, now under `docs/`, and the Milestone 0 documentation created from it.
- Replace: nothing; there was no prior implementation.
- Defer: all runtime scaffolding and product code to the milestone sequence. Specifically, do not introduce an application shell until Milestone 1 or an IndexedDB/security implementation until Milestone 2.

## Gap analysis

The gap between the specification and repository is total implementation absence. The highest-priority gap is a testable, accessible, deployable offline PWA shell. Subsequent gaps follow the ordered roadmap: safe persistence/security, entity setup, transactions, wealth rules, recurrence/budgets, investments/assets, forecasting/reports, reconciliation, and production hardening.

Documentation now closes the Milestone 0 specification gap by establishing scope, architecture, data rules, financial invariants, security standards, known limitations, and the exact Milestone 1 proposal.

## Technical risk register

| ID | Risk | Likelihood | Impact | Required treatment |
| --- | --- | --- | --- | --- |
| T1 | Large feature scope creates monolithic code | High | High | Enforce layer/module boundaries and sequential milestones |
| T2 | GitHub Pages routing or scope breaks offline navigation | Medium | High | Hash routing; base-path tests; service-worker scope tests |
| T3 | Service-worker updates serve mixed/stale versions | Medium | High | Versioned shell cache, atomic activation strategy, update UX |
| T4 | IndexedDB migrations lose or orphan data | Medium | Critical | Ordered migrations, fixtures, invariant checks, recovery path |
| T5 | Browser storage eviction/limits cause loss | Medium | Critical | Storage estimates, persistent-storage request, backup guidance |
| T6 | Unnecessary dependencies increase supply-chain risk | Medium | High | Native-first policy and dependency review gate |
| T7 | Large histories degrade startup/query performance | Medium | High | Indexed queries, projections, pagination, performance fixtures |
| T8 | External market providers block or corrupt portfolio state | Medium | High | Adapter isolation, timestamped cache, immutable holdings |
| T9 | Inconsistent date semantics distort reports/recurrence | Medium | High | Calendar-date vs instant types and boundary tests |
| T10 | Export logic diverges from on-screen totals | Medium | Critical | Shared pure reporting projections and reconciliation tests |

## Security risk register

| ID | Risk | Likelihood | Impact | Required treatment |
| --- | --- | --- | --- | --- |
| S1 | Sensitive identifiers/secrets stored or exported | Medium | Critical | Prohibited-data rules, masking, redaction tests |
| S2 | XSS exposes locally stored financial data | Medium | Critical | Text-only rendering, CSP, no dynamic evaluation, input tests |
| S3 | Weak/custom encryption gives false assurance | Medium | Critical | Web Crypto, reviewed KDF/AEAD design, versioned envelope |
| S4 | Restore partially overwrites good data | Medium | Critical | Validate in isolation; atomic replacement; interruption tests |
| S5 | Service worker caches private data or unsafe responses | Low | Critical | Shell-only allowlist and cache inspection tests |
| S6 | API keys leak through logs/reports/backups/source | Medium | High | Local protected storage, centralized redaction, secret scanning |
| S7 | Shared/unlocked device exposes data | High | High | Honest threat model, optional auto-lock, clear limitations |
| S8 | Malicious import causes resource exhaustion/injection | Medium | High | Size/type/schema validation and sanitized rendering |

## Financial-calculation risk register

| ID | Risk | Likelihood | Impact | Required treatment |
| --- | --- | --- | --- | --- |
| F1 | Card payment counted as a second expense | High | Critical | Explicit card-purchase/payment posting tests |
| F2 | Transfers inflate income, expense, or savings | High | Critical | Balanced transfer invariant and report tests |
| F3 | Loan principal counted as expense | High | High | Mandatory principal/interest/fee split |
| F4 | Investment purchase counted as consumption | Medium | High | Asset-conversion classification and cost-basis tests |
| F5 | Floating-point rounding corrupts totals | High | Critical | Integer paise throughout domain/persistence |
| F6 | Editing leaves stale derived balances | Medium | Critical | Atomic recomputation and audit-linked correction |
| F7 | Refunds/reimbursements distort periods/categories | Medium | High | Linked reversal policy and cross-period tests |
| F8 | Stale prices misstate net worth without disclosure | High | High | Timestamp/freshness metadata and visible fallback |
| F9 | Recurrence creates duplicate transactions | Medium | Critical | Idempotency keys and occurrence-state tests |
| F10 | Archive/name edits break historical reporting | Medium | High | Stable IDs plus historical label snapshots |

## Data-model risk analysis

The principal threats are unstable name-based relationships, oversized unbounded records, ambiguous dates, floating-point money, unversioned schemas, orphaned links, non-atomic multi-record postings, hard deletion of history, and destructive restore. The target model addresses these with stable IDs, integer paise, explicit date types, transaction aggregates, archive semantics, audit linkage, versioned migrations, referential validation, and pre-replacement restore validation. Exact indexes and physical store grouping require prototypes in Milestone 2.

## Architecture and standards established

- Static native-module PWA with no mandatory backend or framework.
- Transaction-first, local-first, layered architecture.
- IndexedDB as durable truth; disposable in-memory projections.
- Pure financial engines independent of DOM, storage, and network.
- Integer-paise monetary model and explicit financial effects.
- Stable IDs, versioned migrations, audit history, validated restore.
- Native-first dependency policy, semantic/accessibility standards, and security controls documented in the root project documents.

## Version 1 scope and backlog

Version 1 includes the capabilities assigned to Milestones 1–15 of the governing plan. The ordered, prioritized backlog and explicit exclusions are recorded in `ROADMAP.md` and `README.md`. Scope must not expand to the post-Version-1 features without approval.

## Milestone 0 validation

| Check | Result |
| --- | --- |
| Complete pre-change repository enumeration | Passed; workspace empty |
| Remote ref inspection | Passed; remote reachable with no refs |
| Existing app local run | Not applicable; no application files |
| Browser-console check | Not applicable; no runnable page |
| PWA/manifest/service-worker check | Not applicable; absent |
| IndexedDB/calculation inspection | Not applicable; absent |
| Useful-file deletion check | Passed; none deleted |
| Core documentation presence/content review | Passed |
| Version 1 boundary review | Passed |

## Acceptance determination

- Existing code inspected: satisfied—there was no existing code locally or remotely.
- Existing application run where possible: satisfied with documented not-applicable result.
- No useful file deleted without explanation: satisfied; no deletion occurred.
- Architecture documented: satisfied in `ARCHITECTURE.md`.
- Financial rules documented: satisfied in `FINANCIAL_RULES.md`.
- Version 1 boundaries documented: satisfied in `README.md`, `ROADMAP.md`, and `KNOWN_LIMITATIONS.md`.

Milestone 0 is complete subject to repository commit, push, and pull-request review. Milestone 1 must not begin automatically.
