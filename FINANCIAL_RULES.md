# FinOrbit Financial Rules

## Numeric and accounting standard

All monetary calculations use integer paise. Formatting uses Indian numbering and `INR`/₹ at the presentation boundary. Aggregations must be deterministic and tested with zero, large values, partial payments, reversals, and date-boundary cases.

`Net worth = total assets - total liabilities`

Income, expense, cash flow, asset movement, liability movement, and net-worth movement are separate dimensions. An outgoing payment is not automatically an expense.

## Required classifications

Every event can carry one or more explicit effects: income, expense, asset increase/decrease/conversion, liability creation/reduction, appreciation/depreciation, transfer, or correction.

## Canonical posting rules

| Event | Cash/account effect | Other effect | Income/expense | Net-worth effect |
| --- | --- | --- | --- | --- |
| Bank expense | Decrease | Budget consumption | Expense increases | Decrease by expense |
| Own-account transfer | Source decreases; destination increases | Transfer only | None | None |
| Credit-card purchase | None immediately | Card liability increases | Expense increases | Decrease by purchase |
| Credit-card payment | Bank decreases | Card liability decreases | No new expense | None |
| Investment purchase | Bank decreases | Investment/cost basis increases | Fees only | None before fees/market move |
| Loan EMI | Bank decreases | Liability decreases by principal | Interest/fees only | Decrease by interest/fees |
| Refund | Destination increases | Linked original effect reduced | Expense reversed/reduced | Correct prior impact |
| Asset purchase | Cash/down payment decreases; financing recorded | Asset and any liability created | Only explicit fees/taxes as applicable | Based on actual asset/liability values |

## Additional invariants

- Card payments never duplicate the original card-purchase expense.
- Transfers never inflate income, expense, savings, budgets, or forecasts.
- Investment purchases are asset conversions, not consumption.
- Loan principal is debt reduction, not expense; interest and eligible fees are expense.
- Refunds should link to the original transaction when available and reverse the correct period/category effects according to the reporting policy.
- Corrections are explicit and auditable; balance adjustments are never disguised as income or expense.
- Market appreciation/depreciation affects asset value and net worth but not earned income or spending.
- Archived accounts and categories retain historical attribution.
- Monthly savings is derived consistently from defined income and expense classifications, not raw account inflow/outflow.
- Forecasts separate confirmed, expected, and uncertain events and expose their assumptions.

## Editing and deletion

Editing a financial event must recalculate all dependent effects atomically. Destructive hard deletion is not the default for posted history; void/reversal plus audit linkage is preferred. Any supported deletion must explain downstream effects and remain recoverable where practical.

## Test oracle examples

The canonical examples in the governing plan—₹2,000 grocery expense, ₹10,000 transfer, ₹5,000 card purchase/payment, ₹10,000 mutual-fund purchase, ₹20,000 EMI split into ₹15,000 principal and ₹5,000 interest, ₹1,000 refund, and ₹5,00,000 vehicle purchase—form the calculation test matrix. Posting tests cover their transaction effects; Milestone 5 wealth tests verify that those effects aggregate without treating transfers, investment principal, card payments, or loan principal as income or expense.

## Milestone 5 calculation contract

- A wealth snapshot uses an explicit `asOfDate` and period start; future openings, transactions, and valuations are excluded.
- Only active effects belonging to posted transactions contribute. Historical edits therefore recalculate from the active replacement rather than retaining the voided effect set.
- Book positions are effective-dated openings plus qualifying asset or liability effects.
- The latest eligible valuation overrides book value only for a supported valued asset; the difference remains an explicit valuation adjustment.
- `Net worth = total valued assets - total liabilities`.
- `Monthly savings = classified income - classified expense`; savings rate is expressed in basis points and is undefined when income is zero.
- Wealth explanations separate reconciled income, expense, market valuation, and correction contributions from descriptive investment-contribution, debt-reduction, loan-interest, and depreciation measures to avoid double-counting balance-sheet conversions.
- Invalid integer money, orphan effects, duplicate effect IDs, and active effects on non-posted transactions are diagnosable before snapshots are persisted.
- An entity with `includeInNetWorth: false` contributes neither its opening position, transaction asset/liability effects, nor valuation to wealth totals. Its transactions retain their income/expense classifications for reporting; exclusion is not deletion or reclassification.

## Valuation policy

- Investment unit price multiplied by quantity uses decimal-string/BigInt arithmetic and rounds once to the nearest paise; binary floating point is forbidden.
- Provider valuations are fresh through one day by default. Manual investment valuations are fresh through 30 days; manual physical-asset valuations through 365 days. A record may declare a stricter explicit window.
- Future-dated valuations are never used. Resolution prefers the newest eligible fresh valuation, then an explicitly labelled stale valuation, then an explicitly labelled book-value fallback.
- Straight-line depreciation uses integer paise, elapsed whole days, an annual rate in basis points, and a residual-value floor. It is available as a deterministic policy but is not automatically applied until the user configures an asset depreciation policy.
# Milestone 4 posting rules

Transaction types do not share a generic cash-flow shortcut. Expense reduces a source asset and records expense; income increases a destination asset and records income; transfers move equal value without income/expense; card purchase increases liability and expense; card payment reduces bank asset and card liability; loan disbursement increases cash and liability; loan payment separates principal from interest/fees; investment and physical-asset purchases convert cash to assets with explicit fees/taxes; sale records preserve proceeds and cost-position inputs; refunds reduce prior expense; balance correction is an audited non-income/expense adjustment.

Loan principal + interest + fees must equal total outflow. Splits use integer paise and must total exactly. Projections equal opening position plus active effects. Replacement, void, and restore must never apply two active effect sets for the same effective transaction meaning.
