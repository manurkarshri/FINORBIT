# Reconciliation and data integrity

FinOrbit’s Accounts route includes a local-only reconciliation workspace. A reconciliation records the selected account, statement closing date and closing balance. FinOrbit calculates its projected balance only through that date and displays the exact difference in integer paise.

## Workflow

1. Choose an active account and enter the statement closing balance.
2. Review posted transactions through the statement date.
3. Mark selected transactions cleared or reconciled. Unrelated accounts and later transactions are rejected by the service.
4. Resolve an imbalance by correcting the underlying transaction history or recording a balance correction with a required explanation.
5. Complete only when the difference is exactly zero.

Balance corrections create normal immutable transaction effects and audit events. They do not rewrite prior transactions. Reconciliation state changes preserve a version snapshot.

## Diagnostics and repair

The integrity scan identifies possible duplicates, broken transaction references to accounts and assets, and orphan transaction effects. Duplicate and broken-reference findings always require human review; FinOrbit never deletes or rewrites them automatically.

An orphan effect can be explicitly archived so it no longer affects balances. The service preserves its prior active state and supports restoring it. Each repair and restoration is audited.

The diagnostic panel exports the complete scan as a local JSON file for troubleshooting. No financial data is uploaded.

## Verification

Automated coverage verifies traceable corrections, exact-zero completion, reversible orphan repair, diagnostic export, and statement-date projections that exclude later transactions.
