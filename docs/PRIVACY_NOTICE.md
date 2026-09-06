# FinOrbit privacy notice

FinOrbit Version 1 is a local-first personal-finance application. Financial records, profile details, notes, receipt files, settings, and app-lock verification data are stored in the current browser profile. FinOrbit does not operate a cloud account, analytics service, advertising service, or financial-data synchronization service.

The application makes same-origin requests for its static application files. Market-price providers are isolated adapters and no live provider is enabled by default. Browser notifications are optional and requested only when the user selects the reminder control. Persistent browser storage is optional and requested only from the Security, privacy & data panel.

Standard backups omit app-lock credentials and receipt content. Encrypted backups use a user-supplied passphrase that is never stored. Reports exclude receipt content and do not include credentials or full financial identifiers.

Browser storage is not equivalent to full-disk or field-level encryption. Anyone who can access the device, browser profile, developer tools, or a sufficiently privileged extension may be able to inspect local data. App lock reduces casual access but does not protect a compromised device. Users should use device encryption, a private operating-system account, current software, and regular encrypted backups.

FinOrbit cannot recover a forgotten app-lock secret or encrypted-backup passphrase. Clearing site data, uninstalling the browser profile, storage eviction, or device loss can permanently remove records that were not backed up.
