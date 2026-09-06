# Transaction Engine and Daily Use

## Daily experience

Transactions is the default route. It provides a large add action, eight common quick actions, an adaptive full-screen mobile form, today/recent stored activity, upcoming configured commitments, search/date filters, and visible receipt/void status. Forms show only relevant account, card, loan, investment, category, component, correction, merchant, note, tag, and receipt fields. Quick save and save/add-another use today by default.

## Types and effects

Milestone 4 supports income, expense, transfer, credit-card purchase/payment, loan disbursement/payment, investment purchase/sale, dividend, interest, refund, reimbursement, asset purchase/sale, cash withdrawal/deposit, gift received/given, tax payment, and balance correction. `src/engines/posting-engine.js` defines each type explicitly.

Every command atomically persists its transaction, signed integer-paise effects, splits, immutable version snapshot, merchant relationship/snapshot, and sanitized audit events. Effects distinguish account asset, expense/income classification, card/loan liability, investment/physical asset, receivable, transfer, fee/tax, and correction dimensions. Projections are `openingPositions + active transactionEffects`; entity opening values are never overwritten.

Loan payment enforces principal + interest + fees = total. Transfer source/destination must differ. Splits must use integer paise and equal the transaction total. Card overpayment is accepted with a warning. Investment principal is not ordinary expense, and card/loan principal payment is not counted twice.

Physical-asset purchase/sale uses exactly one explicit `propertyId`, `vehicleId`, or `otherAssetId`. The transaction boundary maps that field to the approved store, verifies the record and active lifecycle, and only then constructs a posting; conflicting or missing references are rejected.

Linked-entity eligibility is centralized in the transaction service. New postings require active, non-archived accounts. Card purchases require active cards; payments allow active or blocked cards, and a closed non-archived card only for an explicit payoff while a positive outstanding projection remains. Loan payments allow active or paused non-archived loans; disbursement requires active; closed loans use correction rather than normal payment. Investment purchases/sales and physical-asset purchases/sales require active, non-archived/unsold records. Closing or archiving later never hides historical transactions.

## History and lifecycle

History is newest-first and indexed by date/type/status and major entity/category references. Search covers merchant/source, notes, and tags. Replacement editing atomically deactivates the original effect set, links an immutable replacement, and preserves audit/version history. The replacement snapshot is indexed once under the original transaction chain and once under the replacement transaction, so both detail screens can retrieve immutable history without depending only on audit traversal. Void deactivates effects once; safe restore reactivates that exact set once. Duplicate creates a new ID/date and excludes receipts unless explicitly requested.

## Receipts and backups

JPEG, PNG, WebP, and PDF receipts are stored separately with stable IDs and validated MIME/size metadata. Limits are 10 MB per file and 50 MB total. Filenames are text only; content is not executed, cached, OCR-processed, or uploaded. Preview data remains local. Standard backups retain metadata but exclude content; `includeReceipts` produces an explicit complete backup. Restore validates transaction references, integer postings, and active effects before replacement.

The one-time PR #5 review URL may use `?preview=1`, which exposes an explicitly labelled synthetic-receipt button solely to make remote browser testing possible without a local file picker. It invokes the same receipt service, storage, history indicator, preview, and deletion paths. The control is absent from normal URLs and production Pages.

## Schema and security

Schema v3 adds `transactionEffects` and `transactionVersions` and transaction/history indexes described in `DATA_MODEL.md`. The v2→v3 migration preserves onboarding, security/theme settings, opening positions, entities, and audit history, and aborts on failure. Transaction, merchant, note, tag, filename, and receipt data remain ordinary IndexedDB records—not field-encrypted at rest. Optional app lock protects only the visible session; encrypted backups protect exported payloads.

## Validation and exclusions

Run `pnpm install --frozen-lockfile` and `pnpm run check`. Automated coverage includes canonical expense/transfer/card/investment/loan/refund postings; partial/overpayment behavior; splits; replacement; void/restore; duplicate; correction; references/archive rules; indexed queries; receipts; backup/restore; migration/rollback; local-only and PWA invariants.

Milestone 4 excludes wealth/net-worth trends, wealth-change explanation, market valuation, allocation/performance, recurring generation/reminders, budgets, goals, forecasts, reports, reconciliation workflows, tax calculations, market APIs, cloud sync, analytics, telemetry, and AI advice.
