import { reportPeriod } from "../../engines/report-engine.js";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const element = (tag, text, className) => { const node = document.createElement(tag); if (text != null) node.textContent = text; if (className) node.className = className; return node; };
const field = (label, control) => { const wrapper = element("label", null, "field"); wrapper.append(element("span", label), control); return wrapper; };
const input = (name, type, value = "") => { const node = element("input"); node.name = name; node.type = type; node.value = value ?? ""; return node; };
const select = (name, choices, value = "") => { const node = element("select"); node.name = name; for (const [key, label] of choices) { const option = element("option", label); option.value = key; option.selected = key === value; node.append(option); } return node; };
function download(result) { const url = URL.createObjectURL(new Blob([result.bytes], { type: result.mimeType })); const link = element("a"); link.href = url; link.download = `finorbit-report-${new Date().toISOString().slice(0, 10)}.${result.extension}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function breakdown(title, key, rows) { const section = element("section", null, "report-breakdown"); section.append(element("h2", title)); if (!rows.length) { section.append(element("p", "No matching spending.")); return section; } const table = element("table", null, "report-table"); const head = element("thead"); const tr = element("tr"); tr.append(element("th", title.slice(0, -9)), element("th", "Spent")); head.append(tr); const body = element("tbody"); for (const row of rows) { const item = element("tr"); item.append(element("td", row[key]), element("td", money.format(row.amountPaise / 100))); body.append(item); } table.append(head, body); section.append(table); return section; }

export function createReportsCenter({ reports, liveRegion }) {
  const root = element("section", null, "reports-center");
  const today = new Date().toISOString().slice(0, 10);
  let filters = { period: "monthly", anchor: today, ...reportPeriod("monthly", today), categoryId: "", merchant: "", accountId: "", includeNotes: false, includeReceipts: false, maskIdentifiers: true };
  let generation = 0;

  function filterForm(options) {
    const form = element("form", null, "household-form report-controls");
    const notes = input("includeNotes", "checkbox"); notes.checked = filters.includeNotes;
    const receipts = input("includeReceipts", "checkbox"); receipts.checked = filters.includeReceipts;
    const mask = input("maskIdentifiers", "checkbox"); mask.checked = filters.maskIdentifiers;
    const period = select("period", [["monthly", "Monthly"], ["quarterly", "Quarterly"], ["yearly", "Calendar year"], ["financial-year", "Financial year (Apr–Mar)"], ["custom", "Custom date range"]], filters.period);
    const anchor = input("anchor", "date", filters.anchor);
    const from = input("dateFrom", "date", filters.dateFrom); const through = input("dateTo", "date", filters.dateTo);
    const syncDates = () => { const custom = period.value === "custom"; from.disabled = !custom; through.disabled = !custom; anchor.disabled = custom; if (!custom) { const bounds = reportPeriod(period.value, anchor.value || today); from.value = bounds.dateFrom; through.value = bounds.dateTo; } };
    period.onchange = syncDates; anchor.onchange = syncDates; syncDates();
    const apply = element("button", "Generate report", "button"); apply.type = "submit";
    form.append(field("Period", period), field("Period date", anchor), field("From", from), field("Through", through), field("Category", select("categoryId", [["", "All categories"], ...options.categories.map((item) => [item.id, item.name])], filters.categoryId)), field("Merchant", select("merchant", [["", "All merchants"], ...options.merchants.map((item) => [item, item])], filters.merchant)), field("Account", select("accountId", [["", "All accounts"], ...options.accounts.map((item) => [item.id, item.nickname ?? item.name ?? "Account"])], filters.accountId)), field("Include notes", notes), field("Include receipt counts", receipts), field("Mask identifiers", mask), apply);
    form.onsubmit = (event) => { event.preventDefault(); const data = new FormData(form); filters = { period: data.get("period"), anchor: data.get("anchor"), dateFrom: from.value, dateTo: through.value, categoryId: data.get("categoryId"), merchant: data.get("merchant"), accountId: data.get("accountId"), includeNotes: data.get("includeNotes") === "on", includeReceipts: data.get("includeReceipts") === "on", maskIdentifiers: data.get("maskIdentifiers") === "on" }; render(); };
    return form;
  }
  async function exportFormat(format) { const result = await reports.export(format, filters); download(result); liveRegion.textContent = `${format} report generated locally.`; }
  async function render() {
    const current = ++generation; const [report, options] = await Promise.all([reports.build(filters), reports.options()]); if (current !== generation) return;
    const heading = element("header"); heading.append(element("h1", "Reports and exports"), element("p", `Generated ${report.generatedAt}. Filter Category and Merchant independently or combine them.`));
    const totals = element("div", null, "wealth-summary"); for (const [label, amount] of [["Income", report.totals.incomePaise], ["Expenses", report.totals.expensePaise], ["Savings", report.totals.savingsPaise]]) { const card = element("article", null, "wealth-card"); card.append(element("p", label), element("strong", money.format(amount / 100))); totals.append(card); }
    const actions = element("div", null, "report-actions"); for (const [format, label] of [["pdf", "Download PDF"], ["spreadsheet", "Download spreadsheet"], ["csv", "Download CSV"]]) { const button = element("button", label, "button button--secondary"); button.onclick = () => exportFormat(format); actions.append(button); } const print = element("button", "Print report", "button button--secondary"); print.onclick = () => window.print(); actions.append(print);
    const table = element("table", null, "report-table"); const head = element("thead"); const headerRow = element("tr"); for (const label of ["Date", "Type", "Amount", "Account", "Category", "Merchant"]) headerRow.append(element("th", label)); head.append(headerRow); const body = element("tbody"); for (const row of report.rows) { const tr = element("tr"); for (const value of [row.date, row.type, money.format(row.amountPaise / 100), row.account, row.category, row.merchant]) tr.append(element("td", value)); body.append(tr); } table.append(head, body); if (!report.rows.length) table.setAttribute("aria-label", "No matching transactions");
    root.replaceChildren(heading, filterForm(options), totals, breakdown("Category spending", "category", report.byCategory), breakdown("Merchant spending", "merchant", report.byMerchant), actions, table, element("p", report.investmentPriceTimestamp ? `Investment prices last updated ${report.investmentPriceTimestamp}.` : "No investment price timestamp is available."));
  }
  return { element: root, start() { root.setAttribute("aria-busy", "true"); return render().finally(() => root.removeAttribute("aria-busy")); } };
}
