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

PIN/password and auto-lock behavior will be designed in Milestone 2. Until then, no claim of at-rest application encryption is permitted. Locking must clear decrypted in-memory state and must not imply protection against an already-compromised device.

## Security review gates

Every milestone report states new sensitive data, permissions, network connections, risks, and mitigations. Critical findings block release. No secrets may appear in commits. Security and recovery behavior require automated negative tests plus manual browser tests before Version 1.

## Reporting vulnerabilities

Do not place real financial data or secrets in a public issue. Report suspected vulnerabilities privately to the repository owner with reproduction steps using synthetic data.
