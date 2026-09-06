# Categories, Family and Budgets

Milestone 7 expands the default household taxonomy to cover housing, children and school costs, parent/elder care, healthcare, transport, financial commitments, business, agriculture, emergencies, and other broad personal-finance needs. Categories have stable IDs, classifications, icon labels, and reversible visibility. Hidden categories remain valid historical transaction references. Custom categories, subcategories, and family-member attribution targets are persisted and audited.

Monthly budgets use active `expense` effects joined to posted transactions. They never infer consumption from cash movement, so transfers, credit-card payments, loan principal, and investment principal cannot inflate spending. Refund expense effects reduce the relevant category total. Limits and totals use integer paise.

Budgets support no rollover, positive-only rollover, or full surplus/deficit rollover. Results expose available, spent, remaining, elapsed-month pace allowance, pace status, previous-month spending, and change from the prior period. The Plan route presents these facts without fabricated sample amounts.
