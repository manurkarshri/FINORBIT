# Onboarding and Entity Management

## Flow and minimum setup

The resumable wizard has 13 stages: welcome; profile/preferences; accounts; cards; loans; income sources; commitments; investments; properties; vehicles; emergency-fund target; opening summary; and review/complete. Every stage provides back, continue, and save/exit; optional entity stages can be skipped. Draft input and the current stage are stored locally. Completion requires a name/nickname, INR, financial-year start month, and at least one active bank/cash/wallet account. Incomplete setup reopens automatically.

## Entities and lifecycle

Milestone 3 configures unlimited accounts, credit cards, loans, income sources, commitment templates, investments, properties, and vehicles using the fields approved in the master plan. The normal Accounts, Plan, and Wealth routes provide status-filtered/searchable lists. Create/edit, archive/restore, and relevant close/status states preserve stable IDs; status-changing actions require confirmation. Similar normalized names are allowed but warned. Hard deletion is not a normal workflow.

Shared validation covers required fields, stable IDs, non-negative integer paise, ISO dates, 1–31 days, last-four digits, decimal quantity strings, ownership percentage, statuses, and entity references. Warning-only conditions include card outstanding above limit and loan outstanding above original principal. Full account/card numbers, CVV, credentials, PAN, Aadhaar, and other prohibited identifiers are not accepted.

## Opening positions and schema

Schema v2 adds `openingPositions` to the original 26 stores. Each opening record contains a stable entity link, entity type, integer-paise amount, effective date, onboarding/manual source, timestamps, and audit link. Edits update the dedicated position and emit `opening-value.changed`; no fake transaction, income, or expense is created. Investments preserve quantity as a decimal string.

The ordered v1-to-v2 upgrade preserves settings (including lock and theme), audit history, and every prior store. Entity stores add `byStatus` and `byNameKey`; opening positions add `byEntityId` and `byEffectiveDate`. Upgrade failures abort the IndexedDB versionchange transaction rather than rebuilding data.

## Privacy, backup, and limitations

Entity records are ordinary IndexedDB records and are not field-encrypted at rest. Optional app lock is session protection; encrypted backup protects only the exported envelope. Standard and encrypted backups now include every entity and opening-position record, and restore preview reports per-store counts. No new network call or production dependency exists.

This milestone does not implement transaction entry/history, recurring generation, wealth/net-worth/gain calculations, price sync, budgets, reports, forecasting, reminders, reconciliation, or cloud sync.

## Validation

Install and run the pinned package manager workflow:

```sh
pnpm install --frozen-lockfile
pnpm run check
```

Coverage includes onboarding resume/completion/security preservation, entity validation and lifecycle, exact money/quantity persistence, opening-position audit behavior, migration/index creation, backup/restore, and explicit absence of transaction/occurrence creation.
