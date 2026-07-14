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

The canonical examples in the governing plan—₹2,000 grocery expense, ₹10,000 transfer, ₹5,000 card purchase/payment, ₹10,000 mutual-fund purchase, ₹20,000 EMI split into ₹15,000 principal and ₹5,000 interest, ₹1,000 refund, and ₹5,00,000 vehicle purchase—form the first calculation test matrix in Milestone 5, with foundational value-object tests introduced earlier.
