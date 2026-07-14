# Milestone 2: Database and Security Foundation

## IndexedDB schema

FinOrbit uses database `finorbit`, schema version 1, with the 26 approved logical stores listed in `src/database/schema.js`. Every store uses stable `id` keys. Ordinary stores index `updatedAt` and `archived`; audit logs index `createdAt` and `type`; settings index `updatedAt`. Upgrades run ordered monotonic migrations inside the IndexedDB version-change transaction. A failed migration aborts instead of deleting or silently recreating data.

UI modules do not call IndexedDB. Connection, transaction, repository, settings, validation, and audit modules own persistence. `runTransaction` is the atomic unit-of-work boundary for multi-store changes.

## App lock and cryptography

The optional lock supports PINs and passphrases. PBKDF2-HMAC-SHA-256 uses a random 128-bit salt and 600,000 iterations. Verification and encryption use domain-separated derivations. Credentials store only versioned KDF metadata, salt, and verifier. Secrets and derived keys are not placed in localStorage, IndexedDB, logs, backups, or source.

Encrypted backups use AES-256-GCM, a fresh 96-bit IV and salt per envelope, and authenticated versioned metadata. Wrong credentials and modified ciphertext fail authentication. Locking clears the in-memory secret reference; manual, inactivity, hidden-tab, reset, and cross-tab lock signals are supported. This protects against casual access after locking, not a compromised device, browser profile, extension, or operating system. IndexedDB metadata, store names, indexes, and record sizes remain observable.

## Backup, restore, and reset

Standard JSON backups exclude lock credentials. Encrypted backups include the validated database snapshot inside an authenticated envelope. Restore enforces a 25 MB input cap, parses in isolation, validates format/schema/all stores/stable IDs/duplicates/known references, presents a preview, and only then replaces all active stores in one transaction. Any validation or write failure leaves the prior database unchanged.

Reset closes the managed connection, requests IndexedDB deletion, clears the non-sensitive legacy theme preference, and broadcasts reset to other tabs. Browser deletion is not claimed to make data forensically unrecoverable.

## Operations and testing

Run `npm run check`. Automated coverage includes fresh schema creation, indexes, atomic commit/rollback, stable ID validation, PIN/passphrase verification, unique encryption IVs, wrong-secret/tamper rejection, standard/encrypted backup, restore preview validation, and preservation of active data after invalid restore.

Milestone 2 adds one exact development-only dependency: `fake-indexeddb@6.2.5`, used only by Node tests. Runtime remains browser-native.
