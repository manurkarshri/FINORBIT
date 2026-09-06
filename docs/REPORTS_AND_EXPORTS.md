# Reports and Exports

Milestone 11 builds every view and export from one immutable reporting dataset assembled from posted transactions and active accounting effects. Date, account, and category filters are applied once. Income, expense, savings, category, and transaction totals therefore cannot diverge between the application, CSV, spreadsheet, printable view, and PDF.

Reports exclude receipt data and notes by default, mask identifiers by default, and record generation and latest investment-price timestamps. CSV is the universal offline fallback. The spreadsheet export is Excel-compatible SpreadsheetML with separate Transactions, Summary, and Categories worksheets. JSON backup remains the complete machine-readable data export.

PDFs use paginated A4 pages, embedded standard fonts, and escaped user text. The sample output was structurally reopened, text-extracted, rasterised, and visually inspected for alignment, clipping, and legibility. The More route provides offline generation, a responsive table, explicit export controls, and print-specific styling.
