# Recurring Engine

Milestone 6 introduces deterministic recurring rules, generated occurrences, and local reminders. The pure engine supports daily, weekly, fortnightly, monthly, every-two-months, quarterly, half-yearly, yearly, custom-day intervals, first/last weekdays, and explicit dates. Monthly dates clamp to month end without drifting; “working day” means Monday through Friday because FinOrbit has no holiday-calendar provider.

Occurrence IDs derive from the stable rule ID and original due date. Generation and its unique database index therefore prevent duplicates across reloads and overlapping runs. Paused, archived, not-yet-started, and ended rules do not generate new occurrences. Existing missed occurrences remain visible.

Fixed occurrences can use the expected amount. Variable occurrences require an actual whole-paise amount before confirmation. When a rule has a linked account, confirmation creates its income or expense transaction and links that transaction back to the occurrence. Paid, received, skipped, and auto-posted states are terminal; skipped reasons, postponements, confirmations, and generation batches are audited. Postponing retains the original identity and moves its in-app reminder.

The Plan route provides rule creation, pause/resume, expected totals, linked-account shortfall warnings, status-aware occurrence review, and explicit confirm/postpone/skip actions. Fixed rules with a linked account can explicitly opt into idempotent auto-posting. Browser reminders are delivered once only after the user grants permission; their durable local records are included in backups.
