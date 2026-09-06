# FinOrbit 1.0.0 production release checklist

## Locally verified

- Complete static validation, automated financial/security/database suite, and minimal production build.
- Clean production-artifact startup and manifest discovery.
- Production-artifact offline reload after the local origin is stopped.
- Fresh database/onboarding path and schema upgrades with rollback-on-failure tests.
- Encrypted and standard backup validation plus atomic restore.
- Transaction create, replacement edit, void/restore, splits and receipts.
- Net-worth calculations, dated snapshots, recalculation, valuation policy and invariant diagnostics.
- Duplicate-proof recurring generation, review states and posting.
- Report totals, date/category/merchant filters, PDF, spreadsheet and CSV.
- Portfolio cost basis and provider-failure fallback without holding mutation.
- Reconciliation, traceable correction, duplicate/broken-link review and reversible repair.
- Mobile route sweep at 375×667, shell/form checks at 320px, desktop route sweep at 1280×800, no final overflow or console errors.
- Production dependency audit with no known vulnerabilities and source scan with no committed secret patterns.

## Publication gate

- Integrate the release candidate into `main` through review.
- Enable GitHub Pages with GitHub Actions as the source. The last Pages run failed because Pages was not enabled, not because validation failed.
- Confirm the Pages workflow deploys the minimal `dist/` artifact.
- Verify the public HTTPS URL, install prompt/standalone launch and offline reload.
- Create the annotated `v1.0.0` rollback tag from the verified release commit.
- Publish the GitHub Release using `RELEASE_NOTES_V1.0.0.md`.

No tag or release should be created from an unreviewed or failing commit.
