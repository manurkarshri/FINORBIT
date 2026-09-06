export const TRANSACTION_TYPES = Object.freeze(["income", "expense", "transfer", "credit-card-purchase", "credit-card-payment", "loan-disbursement", "loan-payment", "investment-purchase", "investment-sale", "dividend", "interest", "refund", "reimbursement", "asset-purchase", "asset-sale", "cash-withdrawal", "cash-deposit", "gift-received", "gift-given", "tax-payment", "balance-correction"]);
export function physicalAssetReference(tx) { const populated = [["property", tx.propertyId], ["vehicle", tx.vehicleId], ["otherAsset", tx.otherAssetId]].filter(([, id]) => Boolean(id)); return populated.length === 1 ? { entityType: populated[0][0], entityId: populated[0][1] } : null; }

const effect = (dimension, entityType, entityId, amountPaise, classification) => ({ dimension, entityType, entityId, amountPaise, classification });
const assetIncrease = (id, amount) => effect("account-asset", "account", id, amount, "increase");
const assetDecrease = (id, amount) => effect("account-asset", "account", id, -amount, "decrease");
const liabilityIncrease = (kind, id, amount) => effect(`${kind}-liability`, kind, id, amount, "increase");
const liabilityDecrease = (kind, id, amount) => effect(`${kind}-liability`, kind, id, -amount, "decrease");
const expense = (amount, classification = "expense") => effect("expense", "classification", null, amount, classification);
const income = (amount, classification = "income") => effect("income", "classification", null, amount, classification);

export function buildPostings(tx) {
  const a = tx.amountPaise; const fees = tx.feesPaise ?? 0; const taxes = tx.taxesPaise ?? 0;
  switch (tx.type) {
    case "expense": case "gift-given": case "tax-payment": return [assetDecrease(tx.sourceAccountId, a), expense(a, tx.type)];
    case "income": case "dividend": case "interest": case "gift-received": return [assetIncrease(tx.destinationAccountId, a), income(a, tx.type)];
    case "transfer": case "cash-withdrawal": case "cash-deposit": return [assetDecrease(tx.sourceAccountId, a), assetIncrease(tx.destinationAccountId, a), effect("transfer", "transfer", null, a, tx.type)];
    case "credit-card-purchase": return [liabilityIncrease("creditCard", tx.creditCardId, a), expense(a, "card-purchase")];
    case "credit-card-payment": return [assetDecrease(tx.sourceAccountId, a), liabilityDecrease("creditCard", tx.creditCardId, a)];
    case "loan-disbursement": return [assetIncrease(tx.destinationAccountId, a), liabilityIncrease("loan", tx.loanId, a)];
    case "loan-payment": return [assetDecrease(tx.sourceAccountId, a), liabilityDecrease("loan", tx.loanId, tx.principalPaise), ...(tx.interestPaise ? [expense(tx.interestPaise, "loan-interest")] : []), ...(tx.feesPaise ? [expense(tx.feesPaise, "loan-fee")] : [])];
    case "investment-purchase": return [assetDecrease(tx.sourceAccountId, a + fees + taxes), effect("investment-asset", "investment", tx.investmentId, a, "increase"), ...(fees ? [expense(fees, "investment-fee")] : []), ...(taxes ? [expense(taxes, "investment-tax")] : [])];
    case "investment-sale": return [effect("investment-asset", "investment", tx.investmentId, -(tx.costBasisPaise ?? a), "decrease"), assetIncrease(tx.destinationAccountId, a - fees - taxes), ...(fees ? [expense(fees, "investment-fee")] : []), ...(taxes ? [expense(taxes, "investment-tax")] : [])];
    case "refund": return tx.creditCardId ? [liabilityDecrease("creditCard", tx.creditCardId, a), expense(-a, "refund")] : [assetIncrease(tx.destinationAccountId, a), expense(-a, "refund")];
    case "reimbursement": return tx.reimbursementState === "expected" ? [effect("receivable", "receivable", tx.originalTransactionId, a, "increase"), expense(-a, "reimbursement-expected")] : [assetIncrease(tx.destinationAccountId, a), effect("receivable", "receivable", tx.originalTransactionId, -a, "settled")];
    case "asset-purchase": { const asset = physicalAssetReference(tx); if (!asset) throw new Error("Asset purchase requires exactly one physical-asset reference."); return [assetDecrease(tx.sourceAccountId, a + fees + taxes), effect("physical-asset", asset.entityType, asset.entityId, a, "increase"), ...(fees + taxes ? [expense(fees + taxes, "asset-cost")] : [])]; }
    case "asset-sale": { const asset = physicalAssetReference(tx); if (!asset) throw new Error("Asset sale requires exactly one physical-asset reference."); return [effect("physical-asset", asset.entityType, asset.entityId, -(tx.costBasisPaise ?? a), "decrease"), assetIncrease(tx.destinationAccountId, a - fees - taxes), ...(fees + taxes ? [expense(fees + taxes, "asset-sale-cost")] : [])]; }
    case "balance-correction": return [effect("correction", "account", tx.sourceAccountId ?? tx.destinationAccountId, tx.direction === "decrease" ? -a : a, "adjustment")];
    default: throw new Error("Unsupported transaction type.");
  }
}

export function validateTransaction(tx, splits = []) {
  const errors = {};
  if (!TRANSACTION_TYPES.includes(tx.type)) errors.type = "Choose a supported transaction type.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tx.accountingDate ?? "") || Number.isNaN(Date.parse(`${tx.accountingDate}T00:00:00Z`))) errors.accountingDate = "Enter a valid accounting date.";
  if (!Number.isSafeInteger(tx.amountPaise) || tx.amountPaise < 0) errors.amountPaise = "Amount must be a non-negative whole number of paise.";
  if (tx.currency !== "INR") errors.currency = "Milestone 4 supports INR only.";
  if (["transfer", "cash-withdrawal", "cash-deposit"].includes(tx.type) && (!tx.sourceAccountId || !tx.destinationAccountId || tx.sourceAccountId === tx.destinationAccountId)) errors.destinationAccountId = "Choose different source and destination accounts.";
  if (["expense", "gift-given", "tax-payment", "credit-card-payment", "loan-payment", "investment-purchase", "asset-purchase"].includes(tx.type) && !tx.sourceAccountId) errors.sourceAccountId = "Choose a source account.";
  if (["income", "dividend", "interest", "gift-received", "loan-disbursement", "investment-sale", "asset-sale"].includes(tx.type) && !tx.destinationAccountId) errors.destinationAccountId = "Choose a destination account.";
  if (["credit-card-purchase", "credit-card-payment"].includes(tx.type) && !tx.creditCardId) errors.creditCardId = "Choose a credit card.";
  if (["loan-disbursement", "loan-payment"].includes(tx.type) && !tx.loanId) errors.loanId = "Choose a loan.";
  if (["investment-purchase", "investment-sale"].includes(tx.type) && !tx.investmentId) errors.investmentId = "Choose an investment.";
  if (tx.type === "loan-payment" && [tx.principalPaise, tx.interestPaise, tx.feesPaise].some((v) => !Number.isSafeInteger(v ?? 0) || (v ?? 0) < 0)) errors.principalPaise = "Loan components must be non-negative integer paise.";
  if (tx.type === "loan-payment" && (tx.principalPaise ?? 0) + (tx.interestPaise ?? 0) + (tx.feesPaise ?? 0) !== tx.amountPaise) errors.amountPaise = "Principal, interest, and fees must equal the total cash outflow.";
  if (tx.type === "balance-correction" && !tx.reason?.trim()) errors.reason = "Explain why this balance correction is needed.";
  if (["asset-purchase", "asset-sale"].includes(tx.type)) { const count = [tx.propertyId, tx.vehicleId, tx.otherAssetId].filter(Boolean).length; if (count !== 1) errors.physicalAsset = count ? "Choose only one property, vehicle, or other asset." : "Choose a property, vehicle, or other asset."; }
  if (splits.length && splits.reduce((sum, split) => sum + split.amountPaise, 0) !== tx.amountPaise) errors.splits = "Split amounts must equal the transaction total exactly.";
  if (splits.some((split) => !Number.isSafeInteger(split.amountPaise) || split.amountPaise < 0)) errors.splits = "Every split must use non-negative integer paise.";
  return errors;
}

export function reversePostings(postings) { return postings.map((posting) => ({ ...posting, amountPaise: -posting.amountPaise, classification: `reversal:${posting.classification}` })); }
