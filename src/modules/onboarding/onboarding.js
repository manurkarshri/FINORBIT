import { ONBOARDING_STAGES } from "../../services/onboarding-service.js";

const STAGES = [
  ["Welcome", "Set up only what you need. You can save, exit, and return at any time."],
  ["Profile and preferences", "Confirm your local preferences. FinOrbit does not need your legal identity."],
  ["Bank, cash, and wallets", "Add at least one place where money is available."],
  ["Credit cards", "Optional. Record only the last four digits—never a full card number."],
  ["Loans", "Optional. Unknown historical details can be left blank."],
  ["Income sources", "Optional planned income configuration; this does not create income transactions."],
  ["Recurring commitments", "Optional templates only; no occurrences or transactions are generated."],
  ["Investments", "Optional user-entered opening estimates; prices and gains are not calculated."],
  ["Properties", "Optional. A location label is enough; do not enter an exact address."],
  ["Vehicles", "Optional. Full registration details are not required."],
  ["Emergency-fund target", "Optional planning preference in months."],
  ["Opening financial summary", "Opening values are initial positions, never income or expenses."],
  ["Review and complete", "Review your setup. You can edit every entity later."],
];

const ENTITY_STAGE = { 2: "account", 3: "creditCard", 4: "loan", 5: "incomeSource", 6: "commitment", 7: "investment", 8: "property", 9: "vehicle" };
const DEFAULT_ONLY_FIELDS = {
  account: new Set(["accountType"]), creditCard: new Set(["network"]), loan: new Set(["loanType", "rateType"]),
  incomeSource: new Set(["incomeType", "frequency"]), commitment: new Set(["commitmentType", "frequency"]), investment: new Set(["assetClass"]),
};
const FIELDS = {
  account: [["nickname", "Account nickname"], ["accountType", "Account type", "select", ["savings", "salary", "current", "joint", "cash", "digital-wallet", "overdraft", "custom"]], ["institution", "Bank or institution (optional)"], ["lastFour", "Last four digits (optional)"], ["openingBalancePaise", "Opening balance (₹)", "money"], ["effectiveDate", "Balance date", "date"]],
  creditCard: [["nickname", "Card nickname"], ["issuingBank", "Issuing bank"], ["network", "Card network", "select", ["Visa", "Mastercard", "RuPay", "Amex", "Other"]], ["lastFour", "Last four digits (optional)"], ["creditLimitPaise", "Credit limit (₹)", "money"], ["openingOutstandingPaise", "Current outstanding (₹)", "money"], ["statementDay", "Statement day", "number"], ["dueDay", "Payment due day", "number"]],
  loan: [["nickname", "Loan nickname"], ["lender", "Lender (optional)"], ["loanType", "Loan type", "select", ["home", "vehicle", "personal", "education", "business", "gold", "property", "family", "custom"]], ["originalPrincipalPaise", "Original loan amount (₹)", "money"], ["outstandingPrincipalPaise", "Current outstanding principal (₹)", "money"], ["annualInterestRateBasisPoints", "Current annual interest rate (%)", "percent"], ["rateType", "Interest type", "select", ["fixed", "floating"]], ["emiPaise", "EMI amount (₹)", "money"], ["emiDay", "EMI payment day", "number"], ["startDate", "Loan start date", "date"], ["expectedEndDate", "Expected end date", "date"], ["remainingTenureMonths", "Remaining tenure (months)", "number"]],
  incomeSource: [["name", "Income source name"], ["incomeType", "Income type", "select", ["salary", "business", "rent", "pension", "interest", "custom"]], ["expectedAmountPaise", "Expected amount (₹)", "money"], ["frequency", "Frequency", "select", ["monthly", "weekly", "quarterly", "yearly"]], ["expectedDay", "Expected day (optional)", "number"]],
  commitment: [["name", "Commitment name"], ["commitmentType", "Commitment type", "select", ["emi", "rent", "utility", "insurance", "subscription", "school-fees", "custom"]], ["expectedAmountPaise", "Expected amount (₹)", "money"], ["frequency", "Frequency", "select", ["monthly", "weekly", "quarterly", "yearly"]], ["dueDayOfMonth", "Due day (optional)", "number"]],
  investment: [["name", "Investment or holding name"], ["assetClass", "Asset class", "select", ["equity", "mutual-fund", "etf", "bond", "fixed-deposit", "retirement", "crypto", "custom"]], ["institution", "Broker or institution (optional)"], ["brokerAccountName", "Broker account nickname (optional)"], ["brokerAccountLastFour", "Broker account last four characters (optional)"], ["quantity", "Quantity or units"], ["openingCostBasisPaise", "Total cost basis (₹, optional)", "money"], ["openingEstimatedValuePaise", "Current estimated value (₹)", "money"], ["valuationDate", "Valuation date", "date"]],
  property: [["nickname", "Property nickname"], ["propertyType", "Property type"], ["locationLabel", "Location label (optional)"], ["ownershipPercentage", "Ownership percentage", "number"], ["openingEstimatedValuePaise", "Opening estimated value (paise)", "number"], ["valuationDate", "Valuation date", "date"], ["depreciationMethod", "Depreciation policy", "select", ["none", "straight-line"]], ["depreciationAnnualRateBasisPoints", "Annual depreciation rate (basis points, if enabled)", "number"], ["depreciationResidualValuePaise", "Residual value (paise, if enabled)", "number"], ["depreciationStartDate", "Depreciation start date (if enabled)", "date"]],
  vehicle: [["nickname", "Vehicle nickname"], ["vehicleType", "Vehicle type"], ["registrationLabel", "Registration label / last characters (optional)"], ["openingEstimatedValuePaise", "Opening estimated value (paise)", "number"], ["valuationDate", "Valuation date", "date"], ["depreciationMethod", "Depreciation policy", "select", ["none", "straight-line"]], ["depreciationAnnualRateBasisPoints", "Annual depreciation rate (basis points, if enabled)", "number"], ["depreciationResidualValuePaise", "Residual value (paise, if enabled)", "number"], ["depreciationStartDate", "Depreciation start date (if enabled)", "date"]],
};

function field([name, label, type = "text", options], draft, errors) {
  const wrapper = document.createElement("div"); wrapper.className = "field";
  const id = `onboarding-${name}`; const labelElement = document.createElement("label"); labelElement.htmlFor = id; labelElement.textContent = label;
  const input = options ? document.createElement("select") : document.createElement("input"); input.id = id; input.name = name; if (!options) input.type = ["money", "percent"].includes(type) ? "number" : type;
  if (options) for (const option of options) { const element = document.createElement("option"); element.value = option; element.textContent = option.replaceAll("-", " "); input.append(element); }
  const stored = draft[name]; input.value = type === "money" && Number.isFinite(stored) ? stored / 100 : type === "percent" && Number.isFinite(stored) ? stored / 100 : stored ?? (options ? options[0] : "");
  if (["money", "percent"].includes(type)) { input.step = "0.01"; input.dataset.unit = type; }
  input.setAttribute("aria-describedby", `${id}-error`);
  const error = document.createElement("p"); error.id = `${id}-error`; error.className = "field__error"; error.textContent = errors[name] ?? "";
  wrapper.append(labelElement, input, error); return wrapper;
}

export function createOnboarding({ onboarding, entities, onExit, onComplete }) {
  const view = document.createElement("section"); view.className = "onboarding"; view.setAttribute("aria-labelledby", "onboarding-title");
  let state; let stage = 0; let errors = {}; let message = "";
  const draftFor = () => state.drafts?.[ONBOARDING_STAGES[stage]] ?? {};
  async function start({ reopen = false } = {}) { state = await onboarding.read(); stage = reopen && state.completed ? 0 : state.stage; render(); }
  function collect() { const result = { ...draftFor() }; for (const input of view.querySelectorAll("input, select, textarea")) { if (!input.name) continue; const number = input.value === "" ? undefined : Number(input.value); result[input.name] = input.dataset.unit === "money" ? (number == null ? undefined : Math.round(number * 100)) : input.dataset.unit === "percent" ? (number == null ? undefined : Math.round(number * 100)) : input.type === "number" ? number : input.value; } return result; }
  async function persist(nextStage = stage, currentDraft = collect()) { const drafts = { ...state.drafts, [ONBOARDING_STAGES[stage]]: currentDraft }; await onboarding.saveProgress({ stage: nextStage, drafts }); state = { ...state, stage: nextStage, drafts }; }
  async function saveEntity(draft) {
    const type = ENTITY_STAGE[stage]; if (!type) return { ok: true };
    const defaults = { status: "active", includeInNetWorth: true, estimateType: "estimated", active: true };
    const result = await entities.save(type, { ...defaults, ...draft }, { source: "onboarding" });
    if (!result.ok) { state.drafts[ONBOARDING_STAGES[stage]] = draft; errors = result.errors; render(); }
    return result;
  }
  function hasEntityInput(type, draft) { return Object.entries(draft).some(([key, value]) => !DEFAULT_ONLY_FIELDS[type]?.has(key) && value !== "" && value !== undefined); }
  async function continueStep() {
    errors = {}; message = ""; const draft = collect();
    if (stage === 1) { const result = await onboarding.saveProfile({ displayName: draft.displayName, householdName: draft.householdName, currency: "INR", locale: "en-IN", financialYearStartMonth: Number(draft.financialYearStartMonth), dateFormat: draft.dateFormat || "DD/MM/YYYY", emergencyFundMonths: state.profile?.emergencyFundMonths }); if (!result.ok) { errors = result.errors; render(); return; } state.profile = result.profile; }
    const type = ENTITY_STAGE[stage];
    if (type && hasEntityInput(type, draft)) {
      const result = await saveEntity(draft);
      if (!result.ok) return;
      message = result.warnings.join(" "); state.drafts[ONBOARDING_STAGES[stage]] = {};
    }
    if (stage === 10 && draft.emergencyFundMonths !== "") { const result = await onboarding.saveProfile({ ...state.profile, emergencyFundMonths: Number(draft.emergencyFundMonths) }); if (!result.ok) { errors = result.errors; render(); return; } state.profile = result.profile; }
    if (stage === 12) { try { await onboarding.complete(); state.completed = true; render(); onComplete?.(); } catch (error) { message = error.message; render(); } return; }
    const next = Math.min(12, stage + 1); await persist(next, type ? {} : collect()); stage = next; render();
  }
  function render() {
    view.replaceChildren(); const [titleText, description] = STAGES[stage];
    const progress = document.createElement("p"); progress.className = "onboarding__progress"; progress.textContent = `Step ${stage + 1} of 13`;
    const progressBar = document.createElement("progress"); progressBar.max = 13; progressBar.value = stage + 1; progressBar.setAttribute("aria-label", "Onboarding progress");
    const title = document.createElement("h1"); title.id = "onboarding-title"; title.tabIndex = -1; title.textContent = titleText;
    const intro = document.createElement("p"); intro.textContent = description; view.append(progress, progressBar, title, intro);
    const form = document.createElement("form"); form.noValidate = true; const draft = draftFor();
    if (stage === 1) for (const def of [["displayName", "Name or nickname"], ["householdName", "Household name (optional)"], ["financialYearStartMonth", "Financial-year start month (1–12)", "number"], ["dateFormat", "Preferred date format"]]) form.append(field(def, { financialYearStartMonth: 4, dateFormat: "DD/MM/YYYY", ...state.profile, ...draft }, errors));
    else if (ENTITY_STAGE[stage]) {
      const saved = document.createElement("div"); saved.className = "onboarding__saved"; saved.textContent = "Loading saved records…"; form.append(saved);
      const type = ENTITY_STAGE[stage]; entities.list(type, { status: "", includeArchived: false }).then((records) => { saved.textContent = records.length ? `Already added (${records.length}): ${records.map((record) => record.nickname ?? record.name).join(", ")}` : "Nothing added yet."; });
      for (const def of FIELDS[type]) form.append(field(def, draft, errors));
    }
    else if (stage === 10) form.append(field(["emergencyFundMonths", "Emergency-fund target (months)", "number"], { emergencyFundMonths: state.profile?.emergencyFundMonths ?? "", ...draft }, errors));
    else if (stage === 11) { const summary = document.createElement("p"); summary.textContent = "Every opening balance, outstanding liability, and estimated asset value is stored as a dated opening-position record linked to its entity and audit event."; form.append(summary); }
    else if (stage === 12) { const summary = document.createElement("p"); summary.textContent = `Profile: ${state.profile?.displayName ?? "not set"}. Completion requires this profile and at least one active account.`; form.append(summary); }
    if (Object.keys(errors).length) { const status = document.createElement("p"); status.className = "status-banner status-banner--warning"; status.setAttribute("role", "alert"); status.textContent = `Please correct ${Object.keys(errors).length} highlighted field${Object.keys(errors).length === 1 ? "" : "s"}.`; form.prepend(status); }
    if (message) { const status = document.createElement("p"); status.className = "status-banner status-banner--warning"; status.setAttribute("role", "status"); status.textContent = message; form.append(status); }
    const actions = document.createElement("div"); actions.className = "onboarding__actions";
    const back = document.createElement("button"); back.type = "button"; back.className = "button button--secondary"; back.textContent = "Back"; back.disabled = stage === 0; back.onclick = async () => { await persist(stage - 1); stage -= 1; render(); };
    const save = document.createElement("button"); save.type = "button"; save.className = "button button--secondary"; save.textContent = "Save and exit"; save.onclick = async () => { await persist(stage); onExit?.(); };
    const optional = stage >= 3 && stage <= 10; if (optional) { const skip = document.createElement("button"); skip.type = "button"; skip.className = "button button--secondary"; skip.textContent = "Skip for now"; skip.onclick = async () => { const next = stage + 1; await persist(next); stage = next; render(); }; actions.append(skip); }
    if (ENTITY_STAGE[stage]) { const another = document.createElement("button"); another.type = "button"; another.className = "button button--secondary"; another.textContent = "Save and add another"; another.onclick = async () => { errors = {}; const draft = collect(); const result = await saveEntity(draft); if (!result.ok) return; await persist(stage, {}); message = `${result.record.nickname ?? result.record.name} added. You can add another.`; render(); }; actions.append(another); }
    const next = document.createElement("button"); next.type = "submit"; next.className = "button"; next.textContent = stage === 12 ? "Complete setup" : ENTITY_STAGE[stage] ? "Save and continue" : "Continue"; actions.append(back, save, next); form.append(actions); form.onsubmit = (event) => { event.preventDefault(); continueStep(); }; view.append(form); title.focus();
  }
  return { element: view, start };
}
