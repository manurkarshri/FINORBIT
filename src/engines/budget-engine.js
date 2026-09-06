import { isIntegerPaise, isIsoDate } from "../database/validation.js";

const CONSUMPTION_EXCLUSIONS = new Set(["investment-purchase", "investment-sale", "asset-purchase", "asset-sale"]);
const monthStart = (month) => `${month}-01`;
function monthEnd(month) { const [year, value] = month.split("-").map(Number); return new Date(Date.UTC(year, value, 0)).toISOString().slice(0, 10); }
function previousMonth(month) { const [year, value] = month.split("-").map(Number); return new Date(Date.UTC(year, value - 2, 1)).toISOString().slice(0, 7); }

export function validateBudget(budget) {
  const errors = {};
  if (!budget?.id) errors.id = "A stable budget ID is required.";
  if (!/^\d{4}-\d{2}$/.test(budget?.month ?? "") || !isIsoDate(monthStart(budget.month))) errors.month = "Enter a valid budget month.";
  if (!isIntegerPaise(budget?.limitPaise)) errors.limitPaise = "Enter a non-negative whole number of paise.";
  if (!budget?.categoryId) errors.categoryId = "Choose a category.";
  if (!["none", "positive-only", "full"].includes(budget?.rolloverMode ?? "none")) errors.rolloverMode = "Choose a supported rollover policy.";
  return errors;
}

export function consumptionByCategory({ transactions = [], effects = [], month }) {
  const start = monthStart(month); const end = monthEnd(month); const txById = new Map(transactions.map((tx) => [tx.id, tx])); const totals = new Map();
  for (const effect of effects) {
    const tx = txById.get(effect.transactionId);
    if (!tx || tx.status !== "posted" || !effect.active || effect.dimension !== "expense" || tx.accountingDate < start || tx.accountingDate > end || CONSUMPTION_EXCLUSIONS.has(tx.type)) continue;
    const categoryId = tx.categoryId ?? "uncategorized"; totals.set(categoryId, (totals.get(categoryId) ?? 0) + effect.amountPaise);
  }
  return totals;
}

export function calculateBudgets({ budgets = [], transactions = [], effects = [], month, asOfDate = monthEnd(month), previousResults = [] }) {
  if (!/^\d{4}-\d{2}$/.test(month ?? "") || !isIsoDate(asOfDate) || !asOfDate.startsWith(month)) throw new TypeError("Budget calculation requires a valid month and an as-of date inside it.");
  const errors = budgets.flatMap((budget) => Object.entries(validateBudget(budget)).map(([field, message]) => ({ budgetId: budget.id, field, message })));
  if (errors.length) throw Object.assign(new TypeError("Budget configuration is invalid."), { errors });
  const spending = consumptionByCategory({ transactions, effects, month }); const priorByCategory = new Map(previousResults.map((item) => [item.categoryId, item]));
  const end = monthEnd(month); const elapsedDays = Number(asOfDate.slice(8, 10)); const totalDays = Number(end.slice(8, 10));
  return budgets.filter((budget) => budget.month === month && !budget.archived).map((budget) => {
    const prior = priorByCategory.get(budget.categoryId); const priorRemaining = prior?.remainingPaise ?? 0;
    const rolloverPaise = budget.rolloverMode === "full" ? priorRemaining : budget.rolloverMode === "positive-only" ? Math.max(0, priorRemaining) : 0;
    const availablePaise = budget.limitPaise + rolloverPaise; const spentPaise = spending.get(budget.categoryId) ?? 0; const remainingPaise = availablePaise - spentPaise;
    const paceAllowancePaise = Math.floor(availablePaise * elapsedDays / totalDays); const paceDeltaPaise = spentPaise - paceAllowancePaise;
    return { budgetId: budget.id, categoryId: budget.categoryId, month, limitPaise: budget.limitPaise, rolloverPaise, availablePaise, spentPaise, remainingPaise, paceAllowancePaise, paceDeltaPaise, status: remainingPaise < 0 ? "exceeded" : paceDeltaPaise > 0 ? "ahead-of-pace" : "on-track", previousSpentPaise: prior?.spentPaise ?? null, changeFromPreviousPaise: prior ? spentPaise - prior.spentPaise : null, asOfDate };
  });
}

export function priorBudgetMonth(month) { return previousMonth(month); }
