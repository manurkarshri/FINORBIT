# FinOrbit Security Standard

## Security posture

FinOrbit is local-first, not risk-free. Browser storage protects privacy from a central FinOrbit service, but device compromise, malicious extensions, shared browser profiles, and physical access remain relevant threats. Security controls must fail visibly and must never risk silent financial-data loss.

## Prohibited data

FinOrbit must never store full card numbers, CVVs, banking or broker passwords, UPI PINs, plaintext encryption keys, plaintext backup passwords, or committed API keys. Account/card identifiers are limited to display labels and, where useful, the last four digits.

## Secrets and keys

- User-supplied API keys remain on-device, masked in UI, and excluded from source, logs, reports, exports, diagnostics, and routine backups unless explicitly and safely supported.
- Backup passphrases are never persisted.
- Encryption keys are derived with a reviewed password-based KDF using a unique random salt and suitable work factor, then used through Web Crypto authenticated encryption.
- Key material is held only as long as needed and is never serialized in plaintext.
- Recovery limitations are stated before users enable encryption; forgotten secrets cannot be bypassed.

## Data protection rules

- Use Web Crypto; do not invent cryptography.
- Encrypt sensitive backups with authenticated encryption and versioned metadata.
- Validate a complete restore into a temporary logical database before replacing active data.
- Redact sensitive values from errors and diagnostics.
- Receipts are excluded from reports and exports by default.
- All user-controlled text is rendered as text, never injected as HTML.
- Imported files receive size, type, schema, version, and content validation.

## Application security

- Use a restrictive Content Security Policy compatible with GitHub Pages and the chosen PWA architecture.
- No inline executable code or dynamic evaluation (`eval`, `new Function`).
- External connections are allowlisted and isolated behind service adapters.
- Market-data failures cannot mutate holdings or block startup.
- Service-worker cache keys are versioned; user records and secrets never enter Cache Storage.
- Dependencies require a documented purpose, pinned versions/lockfile, license review, and vulnerability review.
- Browser permissions are requested only in context and remain optional.

## Session protection

Milestone 2 provides optional PIN/passphrase verification, manual/inactivity/hidden-tab locking, failed-attempt delay, and cross-tab lock/reset signaling. PBKDF2-SHA-256 uses 600,000 iterations and independent derivation contexts for verification and AES-GCM encryption. Locking clears the held secret reference, but does not protect an already-compromised device or make all IndexedDB metadata opaque.

Failed-attempt counters and delay are session-memory controls and reset on a full page reload. JavaScript string secrets cannot be guaranteed to be securely erased from runtime memory; FinOrbit can only release its references. Encrypted backup restore may replace the current app-lock configuration with the backed-up configuration, which restore preview must disclose before confirmation.

## Milestone 1 security impact

The application shell stores only the non-sensitive theme choice in `localStorage`. It uses no IndexedDB, financial data, API key, external API, browser permission, authentication, or encryption. A restrictive document Content Security Policy permits only same-origin scripts, styles, images, connections, manifest, and worker resources. Cache Storage contains the explicit static shell allowlist only.

## Milestone 3 data protection

Profiles, entity labels, institution/lender labels, last four digits, financial configuration, opening positions, dates, and free-text notes are stored in IndexedDB and included in backups. These entity records are not field-encrypted at rest; do not claim otherwise. Encrypted backups protect the exported payload, while optional app lock is only a session-access control. Full account/card numbers, CVV, credentials, PINs, PAN, Aadhaar, exact property addresses, and unnecessary identity fields are rejected or never requested. No external connection or new production dependency is introduced.

## Security review gates

Every milestone report states new sensitive data, permissions, network connections, risks, and mitigations. Critical findings block release. No secrets may appear in commits. Security and recovery behavior require automated negative tests plus manual browser tests before Version 1.

## Reporting vulnerabilities

Do not place real financial data or secrets in a public issue. Report suspected vulnerabilities privately to the repository owner with reproduction steps using synthetic data.
