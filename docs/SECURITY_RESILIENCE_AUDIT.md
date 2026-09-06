# Milestone 13 security and resilience audit

## Audit result

No unresolved critical security issue was identified in the reviewed Version 1 implementation. This result is bounded by the documented local-browser threat model and does not claim protection from a compromised device, browser profile, or extension.

## Controls reviewed

- PBKDF2-SHA-256 credential derivation and AES-GCM backup encryption use Web Crypto, random salts, independent derivation contexts, and unique IVs.
- Incorrect secrets and tampered encrypted backups fail authentication. Empty encrypted-backup passphrases are rejected.
- Restore validates format, version, IDs, relationships, integer postings, and active effects before one atomic replacement transaction.
- Receipt types and per-file/aggregate limits are enforced; base64 payload size must match declared file size. Receipt content is not cached or exported in standard backups.
- User-controlled interface content is assigned with `textContent`; no `innerHTML`, dynamic evaluation, or inline executable code is used.
- The document CSP restricts resources to same-origin, disables object embedding and base URL changes, and limits workers, connections, images, scripts, and styles.
- The service worker caches only an explicit static-shell allowlist. Backups, reports, receipts, IndexedDB records, and user-selected files are excluded.
- Browser notification and persistent-storage permissions are optional and requested only from user actions.
- Source scans found no committed API keys or common secret assignments.
- `pnpm audit --prod` reported no known production dependency vulnerabilities on 2026-09-06. The runtime has no production package dependencies; the pinned IndexedDB test implementation is development-only.

## Resilience validation

Automated tests cover incorrect PIN/passphrase attempts, encrypted-backup authentication, malformed and oversized backups, broken references, atomic restore rollback, migration rollback, provider failure, receipt limits, storage-pressure classification, and a synthetic ten-year daily transaction history. Duplicate diagnostics were changed from quadratic pair scanning to keyed linear grouping.

## Remaining limitations

Local records and receipts are not field-encrypted at rest. App-lock failure delay resets with a full page reload. Browser quota reporting and persistence are browser-controlled. Live market providers remain disabled unless explicitly configured in a later integration.
