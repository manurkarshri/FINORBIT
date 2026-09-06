import { runTransaction } from "../database/transaction.js";
import { buildReportDataset, reportToCsv } from "../engines/report-engine.js";
import { reportToPdf, reportToSpreadsheetXml } from "../engines/export-engine.js";

export function createReportService(database, { now = () => new Date().toISOString() } = {}) {
  async function sourceData() {
    const [transactions, effects, categories, accounts, familyMembers, prices] = await runTransaction(database, ["transactions", "transactionEffects", "categories", "accounts", "familyMembers", "marketPrices"], "readonly", async ({ store }) => Promise.all([store("transactions").getAll(), store("transactionEffects").getAll(), store("categories").getAll(), store("accounts").getAll(), store("familyMembers").getAll(), store("marketPrices").getAll()]));
    return { transactions, effects, categories, accounts, familyMembers, prices };
  }
  async function build(filters = {}) { const data = await sourceData(); const timestamp = data.prices.map((item) => item.priceTimestamp ?? item.updatedAt).filter(Boolean).sort().at(-1) ?? null; return buildReportDataset({ ...data, filters, generatedAt: now(), investmentPriceTimestamp: timestamp }); }
  async function options() { const { transactions, categories, accounts, familyMembers } = await sourceData(); return { categories, accounts, familyMembers, merchants: [...new Set(transactions.map((tx) => tx.merchantText?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)) }; }
  async function exportReport(format, filters) { const report = await build(filters); if (format === "csv") return { report, mimeType: "text/csv", extension: "csv", bytes: new TextEncoder().encode(reportToCsv(report)) }; if (format === "pdf") return { report, mimeType: "application/pdf", extension: "pdf", bytes: reportToPdf(report) }; if (format === "spreadsheet") return { report, mimeType: "application/vnd.ms-excel", extension: "xml", bytes: new TextEncoder().encode(reportToSpreadsheetXml(report)) }; throw new TypeError("Choose a supported export format."); }
  return { build, options, export: exportReport };
}
