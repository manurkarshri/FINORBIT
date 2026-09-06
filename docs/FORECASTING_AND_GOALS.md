# Forecasting and Goals

Milestone 10 projects stored account balances through seven- and thirty-day windows using generated recurring income and commitments. Each event retains confirmed or estimated confidence, uncertainty, date, amount, and resulting balance. Uncertain items are excluded unless the user opts in; transfers never enter forecast income or expense.

Safe to spend is conservative: active account balance plus fixed/actual included income, less all included commitments and the user’s minimum cash reserve, floored at zero. Expected investment surplus currently equals this unallocated conservative amount. Every reserve breach exposes the event that caused it, and the UI displays the active assumptions.

Emergency-fund, education, property, vehicle, retirement, debt-payoff, and custom goals store integer-paise targets/current amounts and target dates. Progress exposes the gap and required monthly contribution. Goal funding is tracked separately and is never reclassified as consumption expense by the forecast engine.
