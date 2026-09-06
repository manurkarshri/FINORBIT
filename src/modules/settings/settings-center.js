const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

const TYPES = [
  { id: "account", title: "Bank, cash and wallet accounts", name: "Account", fields: [
    ["nickname", "Account nickname", "text", true], ["accountType", "Account type", "select", true, [["savings", "Savings"], ["salary", "Salary"], ["current", "Current"], ["joint", "Joint"], ["cash", "Cash"], ["digital-wallet", "Digital wallet"], ["overdraft", "Overdraft"], ["custom", "Other"]]],
    ["institution", "Bank or institution", "text"], ["lastFour", "Last four digits", "text"], ["openingBalancePaise", "Opening balance (₹)", "money", true], ["effectiveDate", "Balance date", "date", true],
  ] },
  { id: "creditCard", title: "Credit cards", name: "Credit card", fields: [
    ["nickname", "Card nickname", "text", true], ["issuingBank", "Issuing bank", "text", true], ["network", "Card network", "select", true, [["Visa", "Visa"], ["Mastercard", "Mastercard"], ["RuPay", "RuPay"], ["Amex", "American Express"], ["Other", "Other"]]],
    ["lastFour", "Last four digits", "text"], ["creditLimitPaise", "Credit limit (₹)", "money", true], ["openingOutstandingPaise", "Current outstanding (₹)", "money", true], ["statementDay", "Statement day", "number", true], ["dueDay", "Payment due day", "number", true],
  ] },
  { id: "loan", title: "Loans", name: "Loan", fields: [
    ["nickname", "Loan nickname", "text", true], ["lender", "Lender", "text"], ["loanType", "Loan type", "select", true, [["home", "Home loan"], ["vehicle", "Vehicle loan"], ["personal", "Personal loan"], ["education", "Education loan"], ["business", "Business loan"], ["gold", "Gold loan"], ["property", "Loan against property"], ["family", "Family loan"], ["custom", "Other"]]],
    ["originalPrincipalPaise", "Original loan amount (₹)", "money"], ["outstandingPrincipalPaise", "Current outstanding principal (₹)", "money"], ["annualInterestRateBasisPoints", "Current annual interest rate (%)", "percent"], ["rateType", "Interest type", "select", false, [["fixed", "Fixed"], ["floating", "Floating"]]],
    ["emiPaise", "EMI amount (₹)", "money"], ["emiDay", "EMI payment day", "number"], ["startDate", "Loan start date", "date"], ["expectedEndDate", "Expected end date", "date"], ["remainingTenureMonths", "Remaining tenure (months)", "number"],
  ] },
  { id: "incomeSource", title: "Income sources", name: "Income source", fields: [
    ["name", "Income source name", "text", true], ["incomeType", "Income type", "select", true, [["salary", "Salary"], ["business", "Business"], ["rent", "Rent"], ["pension", "Pension"], ["interest", "Interest"], ["custom", "Other"]]], ["expectedAmountPaise", "Expected amount (₹)", "money", true], ["frequency", "Frequency", "select", true, [["monthly", "Monthly"], ["weekly", "Weekly"], ["quarterly", "Quarterly"], ["yearly", "Yearly"]]], ["expectedDay", "Expected day", "number"],
  ] },
  { id: "commitment", title: "Recurring commitments", name: "Commitment", fields: [
    ["name", "Commitment name", "text", true], ["commitmentType", "Commitment type", "select", true, [["emi", "EMI"], ["rent", "Rent"], ["utility", "Utility"], ["insurance", "Insurance"], ["subscription", "Subscription"], ["school-fees", "School fees"], ["custom", "Other"]]], ["expectedAmountPaise", "Expected amount (₹)", "money", true], ["frequency", "Frequency", "select", true, [["monthly", "Monthly"], ["weekly", "Weekly"], ["quarterly", "Quarterly"], ["yearly", "Yearly"]]], ["dueDayOfMonth", "Due day", "number"],
  ] },
  { id: "investment", title: "Investments and broker holdings", name: "Investment", fields: [
    ["name", "Investment or holding name", "text", true], ["assetClass", "Asset class", "select", true, [["equity", "Shares / equity"], ["mutual-fund", "Mutual fund"], ["etf", "ETF"], ["bond", "Bond"], ["fixed-deposit", "Fixed deposit"], ["retirement", "Retirement"], ["crypto", "Crypto"], ["custom", "Other"]]], ["institution", "Broker or institution", "text"], ["brokerAccountName", "Broker account nickname", "text"], ["brokerAccountLastFour", "Broker account last four characters", "text"], ["quantity", "Quantity or units", "text", true], ["openingCostBasisPaise", "Total cost basis (₹)", "money"], ["openingEstimatedValuePaise", "Current estimated value (₹)", "money", true], ["valuationDate", "Valuation date", "date", true],
  ] },
];

const today = () => new Date().toISOString().slice(0, 10);
const el = (tag, text, className) => { const node = document.createElement(tag); if (text != null) node.textContent = text; if (className) node.className = className; return node; };
const rupeesToPaise = (value) => value === "" ? undefined : Math.round(Number(value) * 100);

function controlFor([name, label, kind, required, options]) {
  const control = kind === "select" ? el("select") : el("input"); control.name = name;
  if (kind === "select") for (const [value, text] of options) control.append(new Option(text, value));
  else { control.type = kind === "money" || kind === "percent" ? "number" : kind; if (["money", "percent"].includes(kind)) control.step = "0.01"; }
  if (required) control.required = true;
  if (kind === "date" && ["effectiveDate", "valuationDate"].includes(name)) control.value = today();
  const wrapper = el("label", null, "field"); wrapper.append(el("span", `${label}${required ? " *" : ""}`), control); return { wrapper, control, kind };
}

function recordFrom(form, definition) {
  const data = Object.fromEntries(new FormData(form)); const record = {};
  for (const [name, , kind] of definition.fields) {
    const value = data[name];
    if (kind === "money") record[name] = rupeesToPaise(value);
    else if (kind === "percent") record[name] = value === "" ? undefined : Math.round(Number(value) * 100);
    else if (kind === "number") record[name] = value === "" ? undefined : Number(value);
    else record[name] = typeof value === "string" ? value.trim() : value;
  }
  return { status: "active", includeInNetWorth: true, estimateType: "estimated", active: true, ...record };
}

function summary(type, record) {
  if (type === "loan") return `${record.lender || "Lender not specified"} · ${record.outstandingPrincipalPaise == null ? "Outstanding not entered" : money.format(record.outstandingPrincipalPaise / 100)} outstanding · ${record.annualInterestRateBasisPoints == null ? "Rate not entered" : `${(record.annualInterestRateBasisPoints / 100).toFixed(2)}%`} · ${record.remainingTenureMonths ?? "—"} months remaining`;
  if (type === "creditCard") return `${record.issuingBank} · ${record.lastFour ? `•••• ${record.lastFour}` : "number not stored"}`;
  if (type === "investment") return `${record.institution || "Institution not specified"}${record.brokerAccountName ? ` · ${record.brokerAccountName}` : ""} · ${record.quantity} units`;
  const amount = record.openingBalancePaise ?? record.expectedAmountPaise;
  return amount == null ? record.status : `${money.format(amount / 100)} · ${record.status}`;
}

export function createSettingsCenter({ entities, liveRegion }) {
  const root = el("section", null, "settings-center");
  async function render() {
    const heading = el("header"); heading.append(el("p", "Your financial setup", "route-heading__eyebrow"), el("h1", "Settings"), el("p", "Add and manage accounts whenever your financial life changes. Required fields are marked with an asterisk."));
    const sections = [];
    for (const definition of TYPES) {
      const section = el("details", null, "settings-section"); const summaryTitle = el("summary", definition.title); section.append(summaryTitle);
      const records = await entities.list(definition.id, { status: "", includeArchived: true });
      const list = el("div", null, "settings-records");
      for (const record of records) {
        const card = el("article", null, "settings-record"); const name = record.nickname ?? record.name;
        const archive = el("button", record.archived ? "Restore" : "Archive", "button button--secondary"); archive.type = "button";
        archive.onclick = async () => { if (confirm(`${archive.textContent} ${name}?`)) { await entities.transition(definition.id, record.id, record.archived ? "restore" : "archive"); await render(); } };
        card.append(el("h3", name), el("p", summary(definition.id, record)), archive); list.append(card);
      }
      if (!records.length) list.append(el("p", `No ${definition.title.toLowerCase()} added yet.`));
      const form = el("form", null, "settings-form"); const grid = el("div", null, "settings-form__grid");
      for (const field of definition.fields) grid.append(controlFor(field).wrapper);
      const status = el("p", "", "field__error"); status.setAttribute("role", "alert");
      const save = el("button", `Add ${definition.name.toLowerCase()}`, "button"); save.type = "submit";
      form.append(grid, status, save);
      form.onsubmit = async (event) => {
        event.preventDefault(); save.disabled = true; status.textContent = "";
        const result = await entities.save(definition.id, recordFrom(form, definition), { source: "manual" });
        if (!result.ok) { status.textContent = Object.values(result.errors).join(" "); save.disabled = false; return; }
        liveRegion.textContent = `${definition.name} added.`; await render();
      };
      section.append(list, el("h3", `Add ${definition.name.toLowerCase()}`), form); sections.push(section);
    }
    root.replaceChildren(heading, ...sections);
  }
  return { element: root, start: render };
}
