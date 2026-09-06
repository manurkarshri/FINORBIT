import { createOpaqueId, isDayOfMonth, isDecimalString, isIntegerPaise, isIsoDate, isLastFour, validateFields } from "../database/validation.js";
import { runTransaction } from "../database/transaction.js";
import { createAuditEvent } from "../database/audit.js";

export const ENTITY_CONFIG = Object.freeze({
  account: { store: "accounts", name: "nickname", statuses: ["active", "closed"], money: ["openingBalancePaise", "minimumBalancePaise"], required: ["nickname", "accountType", "openingBalancePaise", "includeInNetWorth", "status"] },
  creditCard: { store: "creditCards", name: "nickname", statuses: ["active", "blocked", "closed"], money: ["creditLimitPaise", "openingOutstandingPaise", "minimumDuePaise", "annualFeePaise"], required: ["nickname", "issuingBank", "network", "creditLimitPaise", "openingOutstandingPaise", "statementDay", "dueDay", "status", "includeInNetWorth"] },
  loan: { store: "loans", name: "nickname", statuses: ["active", "paused", "closed"], money: ["originalPrincipalPaise", "outstandingPrincipalPaise", "emiPaise"], required: ["nickname", "loanType", "status", "includeInNetWorth"] },
  incomeSource: { store: "recurringRules", kind: "income", name: "name", statuses: ["active", "inactive"], money: ["expectedAmountPaise"], required: ["name", "incomeType", "expectedAmountPaise", "frequency", "status", "estimateType"] },
  commitment: { store: "recurringRules", kind: "commitment", name: "name", statuses: ["active", "inactive"], money: ["expectedAmountPaise"], required: ["name", "commitmentType", "expectedAmountPaise", "frequency", "status", "estimateType"] },
  investment: { store: "investments", name: "name", statuses: ["active", "archived"], money: ["openingCostBasisPaise", "openingEstimatedValuePaise"], required: ["name", "assetClass", "quantity", "openingEstimatedValuePaise", "valuationDate", "includeInNetWorth", "status"] },
  property: { store: "properties", name: "nickname", statuses: ["active", "sold", "archived"], money: ["purchasePricePaise", "openingEstimatedValuePaise", "depreciationResidualValuePaise"], required: ["nickname", "propertyType", "ownershipPercentage", "openingEstimatedValuePaise", "valuationDate", "includeInNetWorth", "status"] },
  vehicle: { store: "vehicles", name: "nickname", statuses: ["active", "sold", "archived"], money: ["purchasePricePaise", "openingEstimatedValuePaise", "depreciationResidualValuePaise"], required: ["nickname", "vehicleType", "openingEstimatedValuePaise", "valuationDate", "includeInNetWorth", "status"] },
  otherAsset: { store: "otherAssets", name: "nickname", statuses: ["active", "sold", "archived"], money: ["purchasePricePaise", "openingEstimatedValuePaise"], required: ["nickname", "assetType", "openingEstimatedValuePaise", "valuationDate", "includeInNetWorth", "status"] },
});

const optional = (test, message) => (value) => value == null || value === "" || test(value) ? null : message;
const required = (value) => value === undefined || value === null || value === "" ? "This field is required." : null;

export function validateEntity(type, record) {
  const config = ENTITY_CONFIG[type];
  if (!config) return { type: "Unsupported entity type." };
  const rules = Object.fromEntries(config.required.map((field) => [field, [required]]));
  for (const field of ["accountNumber", "fullAccountNumber", "cardNumber", "fullCardNumber", "cvv", "pin", "password", "pan", "aadhaar"]) if (record[field] != null && record[field] !== "") errorsFor(rules, field, "This sensitive value must not be stored in FinOrbit.");
  for (const field of config.money) rules[field] = [...(rules[field] ?? []), optional(isIntegerPaise, "Enter a non-negative whole number of paise.")];
  for (const field of ["lastFour"]) rules[field] = [optional(isLastFour, "Enter exactly four digits.")];
  for (const field of ["statementDay", "dueDay", "emiDay", "expectedDay", "dueDayOfMonth"]) rules[field] = [optional(isDayOfMonth, "Enter a day from 1 to 31.")];
  for (const field of ["startDate", "expectedEndDate", "valuationDate", "purchaseDate", "effectiveDate"]) rules[field] = [optional(isIsoDate, "Enter a valid date.")];
  if (type === "investment") rules.quantity = [required, optional(isDecimalString, "Use a non-negative decimal written as text.")];
  if (type === "property") rules.ownershipPercentage = [required, optional((v) => typeof v === "number" && v > 0 && v <= 100, "Enter a percentage above 0 and at most 100.")];
  if (["property", "vehicle"].includes(type)) {
    if (record.depreciationMethod != null && !["none", "straight-line"].includes(record.depreciationMethod)) rules.depreciationMethod = [() => "Choose none or straight-line depreciation."];
    if (record.depreciationMethod === "straight-line") {
      rules.depreciationAnnualRateBasisPoints = [required, (value) => Number.isInteger(value) && value >= 0 && value <= 10000 ? null : "Enter an annual rate from 0 through 10000 basis points."];
      rules.depreciationStartDate = [required, optional(isIsoDate, "Enter a valid depreciation start date.")];
      rules.depreciationResidualValuePaise = [required, optional(isIntegerPaise, "Enter a non-negative residual value in whole paise."), (value) => value <= record.openingEstimatedValuePaise ? null : "Residual value cannot exceed the opening estimated value."];
    }
  }
  if (!config.statuses.includes(record.status)) rules.status = [() => "Choose a supported status."];
  return validateFields(record, rules);
}

function errorsFor(rules, field, message) { rules[field] = [() => message]; }

async function markWealthSnapshotsStale(store, fromDate, instant) {
  for (const snapshot of await store("netWorthSnapshots").getAll()) if (!snapshot.stale && snapshot.asOfDate >= fromDate) {
    snapshot.stale = true; snapshot.updatedAt = instant; await store("netWorthSnapshots").put(snapshot);
  }
}

export function createEntityService(database, { now = () => new Date().toISOString(), id = () => createOpaqueId() } = {}) {
  async function save(type, input, { source = "manual" } = {}) {
    const config = ENTITY_CONFIG[type];
    const errors = validateEntity(type, input);
    const references = { linkedPaymentAccountId: "accounts", destinationAccountId: "accounts", sourceAccountId: "accounts", relatedCreditCardId: "creditCards", relatedLoanId: "loans", linkedLoanId: "loans" };
    for (const [field, targetStore] of Object.entries(references)) if (input[field]) { const exists = await runTransaction(database, [targetStore], "readonly", ({ store }) => store(targetStore).get(input[field])); if (!exists) errors[field] = "Choose an existing related entity."; }
    if (Object.keys(errors).length) return { ok: false, errors, warnings: warningsFor(type, input) };
    const instant = now();
    const existing = input.id ? await runTransaction(database, [config.store], "readonly", ({ store }) => store(config.store).get(input.id)) : null;
    const record = { ...input, id: input.id ?? id(), kind: config.kind, nameKey: String(input[config.name]).trim().toLocaleLowerCase("en-IN"), archived: Boolean(input.archived), createdAt: existing?.createdAt ?? instant, updatedAt: instant, schemaVersion: 2 };
    const opening = openingValue(type, record);
    const stores = [config.store, "auditLogs", "netWorthSnapshots", ...(opening != null ? ["openingPositions"] : [])];
    await runTransaction(database, stores, "readwrite", async ({ store }) => {
      await store(config.store).put(record);
      const audit = createAuditEvent(existing ? "entity.edited" : "entity.created", { entityType: type, entityId: record.id });
      await store("auditLogs").add(audit);
      if (opening != null) {
        const positionId = `opening_${record.id}`;
        const prior = await store("openingPositions").get(positionId);
        await store("openingPositions").put({ id: positionId, entityId: record.id, entityType: type, amountPaise: opening, effectiveDate: input.effectiveDate ?? instant.slice(0, 10), source, auditId: audit.id, createdAt: prior?.createdAt ?? instant, updatedAt: instant, schemaVersion: 2 });
        if (prior && prior.amountPaise !== opening) await store("auditLogs").add(createAuditEvent("opening-value.changed", { entityType: type, entityId: record.id }));
      }
      const affectedDates = [input.effectiveDate, input.valuationDate, input.depreciationStartDate, instant.slice(0, 10)].filter(isIsoDate).sort();
      await markWealthSnapshotsStale(store, affectedDates[0], instant);
    });
    return { ok: true, record, warnings: warningsFor(type, record) };
  }
  async function list(type, { search = "", status = "active", includeArchived = false } = {}) {
    const config = ENTITY_CONFIG[type];
    let records = await runTransaction(database, [config.store], "readonly", ({ store }) => store(config.store).getAll());
    records = records.filter((r) => (!config.kind || r.kind === config.kind) && (includeArchived || !r.archived) && (!status || r.status === status) && (!search || r.nameKey?.includes(search.trim().toLocaleLowerCase("en-IN"))));
    return records.sort((a, b) => a.nameKey.localeCompare(b.nameKey));
  }
  async function transition(type, entityId, action) {
    const config = ENTITY_CONFIG[type];
    return runTransaction(database, [config.store, "auditLogs"], "readwrite", async ({ store }) => {
      const record = await store(config.store).get(entityId); if (!record) throw new Error("Entity not found.");
      if (action === "archive") record.archived = true;
      else if (action === "restore") record.archived = false;
      else if (action === "close" && config.statuses.includes("closed")) record.status = "closed";
      else throw new Error("Unsupported lifecycle transition.");
      record.updatedAt = now(); await store(config.store).put(record);
      await store("auditLogs").add(createAuditEvent(`entity.${action}d`, { entityType: type, entityId })); return record;
    });
  }
  async function similarNames(type, name, excludeId) { const key = name.trim().toLocaleLowerCase("en-IN"); return (await list(type, { status: "", includeArchived: true })).filter((r) => r.id !== excludeId && (r.nameKey === key || r.nameKey.includes(key) || key.includes(r.nameKey))); }
  return { save, list, transition, similarNames };
}

function openingValue(type, record) { return ({ account: record.openingBalancePaise, creditCard: record.openingOutstandingPaise, loan: record.outstandingPrincipalPaise, investment: record.openingEstimatedValuePaise, property: record.openingEstimatedValuePaise, vehicle: record.openingEstimatedValuePaise, otherAsset: record.openingEstimatedValuePaise })[type]; }
function warningsFor(type, record) { const warnings = []; if (type === "creditCard" && record.openingOutstandingPaise > record.creditLimitPaise) warnings.push("Opening outstanding exceeds the stated limit."); if (type === "loan" && record.originalPrincipalPaise != null && record.outstandingPrincipalPaise > record.originalPrincipalPaise) warnings.push("Current principal exceeds original principal."); return warnings; }
