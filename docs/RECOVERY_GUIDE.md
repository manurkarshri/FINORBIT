# Recovery guide

## Before a problem

Export an encrypted backup regularly and after substantial data entry. Store the backup separately from the device and verify that the passphrase is available to you. The Security panel can check database readability, browser quota pressure, receipt usage, and persistent-storage status.

## Forgotten app-lock PIN or passphrase

FinOrbit cannot bypass or recover an app-lock secret. If a valid backup is available, reset this browser’s FinOrbit data, restart setup, and restore the backup. A standard backup intentionally excludes the prior lock credential. An encrypted backup may contain the prior lock configuration; the restore preview warns before replacing the current configuration.

## Forgotten backup passphrase

Authenticated encryption has no recovery bypass. Use another backup whose passphrase is known. Do not reset working browser data merely because one exported backup cannot be opened.

## Corrupted or unreadable database

1. Do not clear site data immediately.
2. Record the browser/version and visible error without including financial details.
3. Try the same browser profile after a normal browser restart.
4. If the database health check remains unreadable, preserve any existing backup files.
5. Reset local data only after confirming a usable backup or accepting that local data may be lost, then restore through FinOrbit’s validation preview.

FinOrbit validates the whole backup before opening a single atomic replacement transaction. Validation or write failure aborts replacement, preserving the prior database.

## Storage pressure

At 75% reported quota use, FinOrbit recommends reviewing receipts and exporting a current backup. At 90%, export a backup and remove unneeded receipt files before adding more data. Browser quota estimates are advisory and may be unavailable. Persistent-storage permission reduces eviction risk but is not a backup.

## Interrupted restore or upgrade

Reload FinOrbit. IndexedDB transactions are atomic: an interrupted restore or schema upgrade either commits completely or rolls back. If the application remains unavailable, follow the corrupted-database steps above.
