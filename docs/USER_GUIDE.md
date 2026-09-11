# FinOrbit 1.0 simple user guide

FinOrbit is a private, installable personal-finance application for recording daily money, planning commitments, and understanding your overall wealth. It works in your browser and stores information locally on your device.

Open FinOrbit at [https://manurkarshri.github.io/FINORBIT/](https://manurkarshri.github.io/FINORBIT/).

## Important facts before you begin

- FinOrbit does not connect to your bank, move money, make investments, or provide financial advice.
- You enter and maintain your own financial information.
- Your data stays in the browser profile on the device where you use FinOrbit. There is no FinOrbit cloud account or automatic device-to-device sync.
- Clearing browser/site data, deleting the browser profile, or losing the device can remove your records. Create a complete encrypted backup at least weekly.
- Amounts use Indian rupees (INR). Opening balances describe where you started; they are not income or expenses.

## Install FinOrbit on a phone

### Android with Chrome

1. Open the FinOrbit link in Chrome.
2. Open Chrome's menu.
3. Select **Install app** or **Add to Home screen**.
4. Confirm, then open FinOrbit from its home-screen icon.

### iPhone or iPad with Safari

1. Open the FinOrbit link in Safari.
2. Tap **Share**.
3. Select **Add to Home Screen**, then tap **Add**.
4. Open FinOrbit from its home-screen icon.

The application shell works offline after it has loaded successfully at least once. Features needing fresh external information may not update while offline.

## First-time setup

FinOrbit opens a guided 13-step setup the first time it is used. You can use **Back**, **Save and add another**, **Save and continue**, or **Save draft and exit**. Saving a draft preserves what is typed but does not create that financial record until you use one of the two “Save” actions. Each section shows the records already added, so you can enter several accounts, cards, loans, income sources, commitments, or investments before moving on. Optional sections may be left empty and completed later.

### 1. Welcome

Read the introduction and select **Continue**.

### 2. Profile and preferences

Enter your name or nickname and, optionally, a household name. Choose your financial-year starting month—April is `4`—and preferred date format. FinOrbit currently uses INR and Indian number formatting.

### 3. Accounts

Add at least one place where money is held. This is the only financial item required to finish setup. Examples include a savings, salary, current, joint, cash, wallet, or overdraft account.

Give each account a clear nickname, such as “Salary account” or “Cash wallet.” Enter its real opening balance and the date on which that balance was correct. Institution name and the last four digits are optional.

### 4. Credit cards

Add each card you want to track, together with its opening outstanding balance and limit. A card purchase creates an expense and increases the amount owed. Paying the card reduces the bank balance and card liability; it does not create another expense.

### 5. Loans

Add home, vehicle, personal, education, or other loans. Enter the opening principal carefully. Repayments can separate principal, interest, and fees so that only interest and fees count as spending.

### 6. Income sources

Add expected salary, business income, rent, pension, or other recurring income. This is planning information only—it does not create money until an occurrence is confirmed or a transaction is recorded.

### 7. Commitments

Add recurring bills and obligations such as rent, school fees, insurance, subscriptions, EMIs, or utilities. These items help FinOrbit show what is coming next.

### 8. Investments

Add investments you want included in your portfolio. Cost and quantity are kept separately from the latest value. You remain responsible for checking any manual or provider price.

### 9–10. Property and vehicles

Add owned property and vehicles, their estimated values, ownership percentage where applicable, and any linked loan. Choose whether each item should be included in net worth.

### 11. Emergency-fund target

Set the number of months of expenses you would like to keep as an emergency reserve. This provides planning context; it is not automated advice.

### 12. Opening summary

Review your starting accounts, liabilities, investments, and assets. Correct inaccurate opening amounts before continuing.

### 13. Review and complete

Finish setup when the profile and at least one active account are present. FinOrbit then opens the main application.

## The five main areas

### Transactions — record daily activity

The Transactions page keeps **Add expense** and **Add income** as the two main actions. These open a short form containing only amount, account, category, merchant/source, and date. Notes, tags, related assets, and receipt upload are grouped under **Optional details and receipt**.

Open **Transfers, cards, loans and investments** only when you need a transfer, card payment, loan payment, investment transaction, refund, or another specialised transaction. Detailed accounting fields appear only for the transaction types that require them—for example, principal, interest, and fees for a loan payment.

Common examples:

- **Expense:** money spent from an account.
- **Income:** money received into an account.
- **Transfer:** movement between your accounts; not income or an expense.
- **Card purchase:** an expense that increases the card amount owed.
- **Card payment:** reduces cash and card liability without recording a second expense.
- **Loan payment:** separates principal from interest and fees.
- **Investment purchase:** converts cash into an investment asset; it is not ordinary spending.
- **Refund:** returns money and reduces the related expense.
- **Cash withdrawal:** moves money from a bank account to cash.
- **Balance correction:** adjusts an incorrect balance and requires an explanation.

Add a merchant to understand where money was spent. Add a category to understand what it was spent on. Notes, tags, family attribution, splits, and receipts are optional.

Transaction history can be searched and filtered. Editing creates a traceable replacement instead of silently rewriting history. **Void** disables an incorrect transaction's financial effect; **Restore** can reactivate an eligible voided entry. Use **Duplicate** for a similar new entry.

### Accounts — balances and reconciliation

Accounts contains your bank, cash, wallet, card, and loan records. You can add or edit items, archive ones no longer used, and restore archived items when appropriate. Historical references are preserved.

To compare FinOrbit with a bank statement:

1. Choose the account.
2. Enter the statement closing date and closing balance.
3. Select the transactions shown on the statement.
4. Review the difference.
5. Complete reconciliation only when the difference is zero.

Integrity diagnostics identify possible duplicates, missing links, or orphaned effects. Review warnings before making a correction.

### Plan — recurring items, budgets, forecasts, and goals

Use recurring rules for regular income and commitments. Choose the amount, frequency, start date, optional end date, and linked account. Fixed items may be confirmed when paid or received; variable bills require the actual amount. You can postpone or skip an occurrence without losing its history.

Automatic posting is optional and should be used only for fixed amounts linked to an account. Browser reminders require notification permission.

To create a budget:

1. Choose the review month and category.
2. Enter the monthly limit.
3. Choose no rollover, unused-amount rollover, or full surplus/overspend rollover.
4. Save and review the spent, remaining, pace, and previous-month figures.

Only classified expenses consume a budget. Transfers, card payments, loan principal, and investment principal do not.

You can add custom categories, subcategories, and family members. Hiding a category removes it from normal new-entry choices but preserves old transactions.

Forecasts show expected balances for the next 7 and 30 days. Set a minimum cash reserve and choose whether uncertain recurring estimates should be included. Goals show the target, current amount, remaining gap, target date, and required monthly contribution.

### Wealth — net worth and owned assets

Wealth combines active account balances, card and loan liabilities, investments, property, vehicles, and other valuables. It shows the calculation date and the source or freshness of valuations.

You can review net worth, save dated snapshots, recalculate month-end history, record investment prices, add physical assets, link loans, and decide which assets count toward net worth. A market-data failure does not delete holdings; FinOrbit visibly falls back to an eligible cached or manual value. Review stale estimates before relying on totals.

### More — reports, security, and data

#### Generate a report

1. Select **More**.
2. Under **Reports and exports**, select Monthly, Quarterly, Calendar year, Financial year (April–March), or Custom date range.
3. For a preset period, choose a date within it. For a custom report, choose **From** and **Through** dates.
4. Optionally select an Account, Category, or Merchant.
5. Select **Generate report**.

Category and Merchant filters are independent. Choose only “Food” to see spending across food merchants, or one merchant to see every category used there. Combine both for a narrower result.

Reports show income, expenses, savings, separate category and merchant spending, and matching transactions. Download PDF, spreadsheet, or CSV files, or print the report. Notes and receipt counts are excluded unless selected. Keep **Mask identifiers** enabled when sharing.

### Settings — change your financial setup later

Use **Settings** whenever you open another bank or broker account, receive a new card, take or repay a loan, add an income source, start a recurring commitment, or acquire a new investment. Each section displays saved records and a clearly labelled add form. Amounts are entered in rupees.

Loan settings include original amount, current outstanding principal, annual interest rate, fixed/floating rate type, EMI amount, EMI payment day, start/end dates, and remaining tenure. Investment settings include the broker or institution and a broker-account nickname, allowing holdings at multiple brokers to remain distinguishable. Archive records that are no longer active; their history is preserved.

## Backups, security, and recovery

### Set an app lock

In **More → Security, privacy & data**, choose a PIN or passphrase and select **Set app lock**. A long passphrase is safer than a short PIN. The lock protects the visible application session but is not a substitute for device security or encrypted backups.

FinOrbit cannot recover a forgotten app-lock secret or backup passphrase.

### Create a backup

FinOrbit shows backup status on the Transactions page and reminds you when seven days have passed. Create a backup after setup, at least weekly, and after significant changes:

1. Open **More → Security, privacy & data** and select **Create complete encrypted backup**.
2. Enter a strong passphrase you can remember or store safely.
3. Save or move the downloaded JSON file to **iCloud Drive**, **Google Drive**, or another safe location outside the browser.
4. Keep more than one recent backup.

The complete encrypted backup always includes all records, app-lock configuration, and receipt contents, so the file can become large. FinOrbit records when the complete backup was generated, but browsers do not tell the app whether you later moved it to cloud storage. Confirm the file appears in your chosen folder before clearing browser data.

An unencrypted data copy is available under **Restore and other backup options** for exceptional needs. It is not protected by a passphrase and omits receipt contents, so it does not satisfy the weekly complete-backup reminder.

FinOrbit cannot silently create or continuously update a permanent folder on every mobile device. Browsers deliberately require user permission for downloads and restrict background file access. The downloaded encrypted JSON file is therefore the independent copy that survives removal of FinOrbit's site data. Store it outside the browser—in device files, encrypted cloud storage, or another protected location.

### Restore a backup

1. Open FinOrbit in the browser/device where data should be restored.
2. Go to **More → Security, privacy & data**.
3. Choose the backup JSON file and enter its passphrase if encrypted.
4. Read the validation preview carefully.
5. Confirm only if you intend to replace all current FinOrbit data in that browser.

Restore validates the full backup before replacing data. It does not merge two separate datasets.

### Storage checks and reset

Use **Check storage & database** to review storage, receipt usage, persistence, and database readability. **Request persistent storage** asks the browser to reduce automatic data eviction, but backups remain necessary.

Clearing only the visible list of previously visited pages normally does not remove FinOrbit. Choosing an option that also clears cookies, site data, app data, or browser storage will remove it. **Reset all local data** also permanently removes FinOrbit records from the current browser profile. Export and verify a backup first.

## Recommended routine

- Record transactions daily or review them at the end of each day.
- Use accurate merchants and categories so reports remain useful.
- Confirm, postpone, or skip due recurring items.
- Review budgets weekly and reconcile accounts monthly.
- Review investment and asset values before assessing net worth.
- Generate a monthly report for income, spending, and savings.
- Download an encrypted backup at least monthly and after major updates.

## Updates and offline use

When **A newer FinOrbit shell is ready** appears, select **Update now**. Do not clear site data to update because doing so may remove financial records.

After one successful online load, the installed shell can reopen offline. Locally stored transactions, reports, and calculations remain available. Keep the same browser profile; private/incognito browsing is unsuitable for permanent records.

## Troubleshooting

### The app is not showing the latest version

Reconnect, reopen FinOrbit, and select **Update now** if offered. Close and reopen the installed app afterward.

### The install option is missing

Use a current browser. On Android, try Chrome's menu. On iPhone/iPad, use Safari's **Share → Add to Home Screen**. The app can still run in a browser tab.

### A balance looks wrong

Check the opening balance and date, then review transfers, card payments, loan splits, voided entries, and corrections. Use reconciliation and diagnostics instead of adding an unexplained expense.

### Data appears to be missing

Confirm you opened FinOrbit in the same browser profile and device. Different browsers have separate storage. If the original data is unavailable, restore your latest backup.

### A report is empty

Check the date range, then reset Account, Category, and Merchant to their “All” options. Only posted transactions within the selected dates are included.

### A passphrase is forgotten

FinOrbit cannot recover it. An encrypted backup requires its correct passphrase. Keep passphrases in a trusted password manager.

## Privacy and safe use

- Avoid entering full account or card numbers; the optional last four digits are normally enough.
- Protect the device with a screen lock and keep the browser and operating system updated.
- Do not casually share unmasked reports or unencrypted backups.
- Treat receipts and notes as sensitive information.
- Verify important totals against statements. FinOrbit is a record-keeping tool, not a bank or professional financial adviser.

For more detail, read the [privacy notice](PRIVACY_NOTICE.md), [recovery guide](RECOVERY_GUIDE.md), and [known limitations](../KNOWN_LIMITATIONS.md).

## Quick reference

| Need | Where to go |
| --- | --- |
| Record income, spending, transfers, cards, or loans | Transactions |
| Search, edit, duplicate, void, or restore an entry | Transactions |
| Manage accounts, cards, and loans | Accounts |
| Match an account to a statement | Accounts → Account reconciliation |
| Manage bills and recurring income | Plan → Recurring plan |
| Create categories, family members, or budgets | Plan → Household budgets |
| Review forecasts or goals | Plan → Forecasts and goals |
| Review net worth or snapshots | Wealth |
| Manage investments, property, vehicles, or valuables | Wealth |
| Add a new bank, broker account, card, loan, income source, commitment, or investment | Settings |
| Filter spending by category or merchant | More → Reports and exports |
| Export PDF, spreadsheet, or CSV | More → Reports and exports |
| Lock, back up, restore, or reset the app | More → Security, privacy & data |
