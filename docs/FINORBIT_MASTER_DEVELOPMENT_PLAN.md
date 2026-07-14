# FINORBIT — MASTER CODEX DEVELOPMENT PLAN

## 1. Project identity

Product name: FinOrbit
Primary tagline: Your Complete Financial World
Secondary message: Track Money. Understand Wealth.
Repository: https://github.com/manurkarshri/FINORBIT.git
Initial release target: FinOrbit Version 1.0
Application type: Installable Progressive Web Application
Primary deployment: GitHub Pages
Primary operating mode: Local-first and offline-capable
Primary currency: Indian Rupees
Currency display format: Indian numbering format, such as ₹1,20,000

# 2. Project status and interpretation

FinOrbit must be treated as a completely new and independent product.

It is not:

An upgrade of LedgerBook Pro.

A new version of LedgerBook.

A conversion of the Personal Financial Dashboard.

A migration destination for LedgerBook data.

A continuation of the LedgerBook database or interface.

A copy of either previous project.

LedgerBook Pro and the Personal Financial Dashboard may be used only as inspiration for useful concepts and lessons learned.

Everything in FinOrbit must be designed specifically for FinOrbit:

New architecture.

New database.

New transaction model.

New wealth-impact model.

New security design.

New recurring-payment system.

New investment model.

New reporting engine.

New navigation.

New user interface.

New branding.

New tests.

New documentation.

Do not implement any LedgerBook import or compatibility functionality.

# 3. Product vision

FinOrbit is an all-in-one personal finance and wealth-management platform.

It must connect everyday financial activity with the user’s complete financial position.

The platform should allow users to:

Log daily expenses.

Log regular and periodic income.

Manage multiple bank accounts.

Manage multiple credit cards.

Add new bank accounts at any time.

Add existing or newly acquired credit cards at any time.

Add existing or newly taken loans at any time.

Track recurring expenses.

Track recurring income.

Track bills and due dates.

Track stocks and mutual funds.

Track fixed deposits and retirement assets.

Track properties and vehicles.

Track other valuable assets.

Track total liabilities.

Track net worth.

Understand the impact of each transaction on wealth.

Edit and review previous transactions.

Search and filter historical records.

Generate PDF, spreadsheet and CSV reports.

Create secure backups.

Work offline.

Operate securely without mandatory cloud storage.

FinOrbit should answer the following questions clearly:

Where did my money go?

Where did my income come from?

What do I currently own?

What do I currently owe?

How did this month’s activity affect my net worth?

Which payments are due soon?

How much money is available for spending?

How much money is available for investment?

Is my debt reducing?

Is my wealth increasing?

# 4. Product principles

## 4.1 Transaction-first experience

The main screen must prioritize transaction logging.

The user should not be forced to navigate through a large analytics dashboard before adding a transaction.

The primary action should be:

Add Transaction

Quick actions should be available for:

Expense.

Income.

Transfer.

Credit-card purchase.

Credit-card payment.

Loan payment.

Investment purchase.

Refund.

The main screen should also show:

Recent transactions.

Today’s spending.

Current-month spending.

Upcoming bills.

Recurring commitments.

Account balance warnings.

A concise net-worth change summary.

## 4.2 Wealth-impact awareness

Every financial event must be evaluated for its impact on:

Cash.

Income.

Expenses.

Assets.

Liabilities.

Savings.

Budgets.

Net worth.

Future cash flow.

## 4.3 Local-first privacy

The application should function without requiring:

A cloud account.

A central database.

A third-party login.

Mandatory internet access.

Financial credentials.

Cloud features may be considered in future versions, but Version 1 must remain local-first.

## 4.4 Flexible financial structure

The platform must never assume that the user’s financial life is fixed after onboarding.

Users must be able to add, edit, archive and restore:

Bank accounts.

Cash accounts.

Wallets.

Credit cards.

Loans.

Properties.

Vehicles.

Investment accounts.

Income sources.

Recurring commitments.

## 4.5 Broad user suitability

The platform should support users across different:

Income levels.

Occupations.

Family sizes.

Financial classes.

Life stages.

Asset ownership levels.

Debt levels.

It must support:

School-going children.

Parents and elder care.

Family support.

Business income.

Salaried income.

Agricultural expenses.

Property ownership.

Vehicle ownership.

Loans.

Investments.

Insurance.

Healthcare commitments.

# 5. Reference projects

## 5.1 LedgerBook Pro

LedgerBook Pro may be used only as inspiration for concepts such as:

Fast transaction entry.

Offline use.

IndexedDB.

Recurring transactions.

Receipt storage.

PIN-based application access.

Backup and restore.

Mobile-first interaction.

Historical transaction editing.

Printable reports.

Do not reuse LedgerBook’s:

Single-file architecture.

Database schema.

Source structure.

Branding.

User interface.

Backup format.

Transaction model.

Known limitations.

Historical data.

## 5.2 Personal Financial Dashboard

The Excel dashboard may be used only as inspiration for concepts such as:

Net-worth tracking.

Total asset visibility.

Total liability visibility.

Bank balance summaries.

Credit-card reporting.

Loan reporting.

Investment analysis.

Asset allocation.

Cash-flow trends.

Financial ratios.

Premium visual presentation.

Colourful charts.

Month-wise and year-wise reporting.

FinOrbit must implement these functions natively within the new PWA.

# 6. Codex working rules

Codex must follow the rules below throughout development.

## 6.1 Repository rules

Treat the GitHub repository as the single source of truth.

Inspect the complete repository before changing code.

Do not delete functioning code without documenting the reason.

Use small and understandable commits.

Develop major milestones in separate branches.

Open a pull request for every major milestone.

Keep main deployable wherever practical.

Do not push uncontrolled large changes directly to main.

Maintain documentation with every milestone.

Maintain a changelog.

Keep release notes accurate.

Do not commit generated secrets or local configuration files.

Recommended branch names:

codex/repository-assessment

codex/pwa-foundation

codex/security-database

codex/onboarding

codex/transactions

codex/wealth-engine

codex/recurring

codex/categories-budgets

codex/investments

codex/assets

codex/forecasting

codex/reports

codex/reconciliation

codex/security-audit

codex/ux-performance

codex/release-v1

## 6.2 Development rules

Use modular HTML, CSS and JavaScript.

Do not build the final application as one large HTML file.

Avoid unnecessary frameworks.

Avoid unnecessary external dependencies.

Prefer browser-native APIs.

Use semantic HTML.

Use accessible forms.

Use mobile-first responsive design.

Separate UI logic from financial logic.

Separate database logic from presentation logic.

Separate external market data from portfolio records.

Add automated tests for core calculations.

Use versioned IndexedDB migrations.

Never silently reset user data after an upgrade.

Never silently alter account balances.

Never silently remove transactions.

Never allow a market-data failure to corrupt holdings.

Do not expose internal database IDs in user-facing screens.

## 6.3 Security rules

Never store:

Full credit-card numbers.

CVV values.

Internet banking passwords.

UPI PINs.

Broker passwords.

Plaintext encryption keys.

Plaintext backup passwords.

API keys inside committed source code.

Store only the last four digits of card or account identifiers where needed.

Any user-supplied API key must:

Remain local to the device.

Be masked in the interface.

Be excluded from reports.

Be excluded from logs.

Be excluded from source control.

Be protected appropriately in local storage.

## 6.4 Financial accuracy rules

Do not treat every outgoing payment as an expense.

Correctly distinguish:

Income.

Expense.

Transfer.

Credit-card purchase.

Credit-card payment.

Loan disbursement.

Loan principal repayment.

Loan interest.

Investment purchase.

Investment sale.

Asset purchase.

Asset sale.

Refund.

Reimbursement.

Liability creation.

Liability reduction.

Balance adjustment.

Asset appreciation.

Asset depreciation.

# 7. Core financial model

## 7.1 Net worth

Net Worth = Total Assets − Total Liabilities

## 7.2 Assets

The system must support:

Bank balances.

Cash.

Digital wallets.

Stocks.

Mutual funds.

ETFs.

Fixed deposits.

Bonds.

EPF.

PPF.

NPS.

Gold.

Properties.

Vehicles.

Business assets.

Other assets.

## 7.3 Liabilities

The system must support:

Credit-card outstanding.

Home loans.

Vehicle loans.

Personal loans.

Education loans.

Business loans.

Gold loans.

Loans against property.

Consumer loans.

Informal family loans.

Other liabilities.

## 7.4 Wealth-impact classifications

Each transaction should be classified as one or more of:

Income impact.

Expense impact.

Asset increase.

Asset decrease.

Asset conversion.

Liability creation.

Liability reduction.

Asset appreciation.

Asset depreciation.

Transfer.

Correction.

# 8. Required transaction behaviour

## 8.1 Expense from bank account

Example: ₹2,000 grocery expense.

Expected result:

Bank balance decreases by ₹2,000.

Grocery expense increases by ₹2,000.

Monthly expenses increase by ₹2,000.

Monthly savings decrease by ₹2,000.

Net worth decreases by ₹2,000.

Grocery budget consumption increases by ₹2,000.

## 8.2 Transfer between own accounts

Example: ₹10,000 transferred from SBI to HDFC.

Expected result:

SBI decreases by ₹10,000.

HDFC increases by ₹10,000.

Income does not change.

Expenses do not change.

Net worth does not change.

## 8.3 Credit-card purchase

Example: ₹5,000 purchase.

Expected result:

Credit-card outstanding increases by ₹5,000.

Expense increases by ₹5,000.

Net worth decreases by ₹5,000.

Bank balance does not immediately change.

## 8.4 Credit-card payment

Example: ₹5,000 payment from bank.

Expected result:

Bank balance decreases by ₹5,000.

Credit-card liability decreases by ₹5,000.

No additional expense is created.

Net worth does not decrease again.

## 8.5 Investment purchase

Example: ₹10,000 mutual-fund purchase.

Expected result:

Bank balance decreases by ₹10,000.

Investment asset increases by ₹10,000.

Cost basis increases by ₹10,000.

Ordinary expense remains unchanged.

Net worth remains unchanged before fees or market movement.

## 8.6 Loan EMI

Example: ₹20,000 EMI.

Breakdown:

Principal: ₹15,000.

Interest: ₹5,000.

Expected result:

Bank balance decreases by ₹20,000.

Loan liability decreases by ₹15,000.

Interest expense increases by ₹5,000.

Net worth decreases by ₹5,000.

Debt reduction is shown as ₹15,000.

## 8.7 Refund

Example: ₹1,000 refund.

Expected result:

Selected account balance increases by ₹1,000.

Original expense is reduced where linked.

Monthly spending is corrected.

Net-worth impact is corrected.

## 8.8 Asset purchase

Example: vehicle purchased for ₹5,00,000.

Expected result:

Cash decreases according to down payment.

Vehicle asset is created.

Related loan liability is created if financed.

Fees and taxes may be recorded as expenses or acquisition costs.

Net-worth impact must follow the actual asset and liability values.

# 9. User-interface direction

## 9.1 Visual style

The UI should be:

Modern.

Premium.

Clean.

Comfortable.

Mobile-first.

Professional.

Colourful without being cluttered.

Easy for non-technical users.

Support:

Light theme.

Dark theme.

Responsive layouts.

Clear typography.

Consistent icons.

Accessible contrast.

Large touch targets.

## 9.2 Navigation

Primary navigation:

Transactions

Accounts

Plan

Wealth

More

### Transactions

Add transaction.

Recent transactions.

Search.

Filters.

Receipts.

Transaction history.

Transfers.

### Accounts

Bank accounts.

Cash.

Wallets.

Credit cards.

Loans.

Reconciliation.

Archived accounts.

### Plan

Recurring income.

Recurring expenses.

Bills.

Budgets.

Goals.

Forecasts.

### Wealth

Net worth.

Investments.

Properties.

Vehicles.

Other assets.

Asset allocation.

Liability analysis.

### More

Reports.

Backup and restore.

Export.

Categories.

Family members.

Security.

Settings.

Audit history.

# 10. Proposed technical architecture

Codex may improve the structure if the reasoning is documented.

/
├── index.html
├── manifest.webmanifest
├── service-worker.js
├── assets/
│   ├── icons/
│   ├── images/
│   └── fonts/
├── src/
│   ├── app/
│   │   ├── app.js
│   │   ├── router.js
│   │   ├── state.js
│   │   └── bootstrap.js
│   ├── components/
│   ├── database/
│   │   ├── schema.js
│   │   ├── migrations.js
│   │   ├── repositories.js
│   │   └── transactions.js
│   ├── engines/
│   │   ├── transaction-engine.js
│   │   ├── wealth-engine.js
│   │   ├── recurring-engine.js
│   │   ├── forecast-engine.js
│   │   ├── reconciliation-engine.js
│   │   └── reporting-engine.js
│   ├── modules/
│   │   ├── transactions/
│   │   ├── accounts/
│   │   ├── cards/
│   │   ├── loans/
│   │   ├── recurring/
│   │   ├── investments/
│   │   ├── properties/
│   │   ├── vehicles/
│   │   ├── budgets/
│   │   ├── goals/
│   │   ├── reports/
│   │   └── settings/
│   ├── services/
│   │   ├── backup-service.js
│   │   ├── encryption-service.js
│   │   ├── export-service.js
│   │   ├── notification-service.js
│   │   └── market-data-service.js
│   ├── styles/
│   └── utils/
├── tests/
├── docs/
└── .github/
    └── workflows/

# 11. Database requirements

Use IndexedDB with schema versioning.

Recommended logical stores:

profiles

accounts

creditCards

loans

transactions

transactionSplits

recurringRules

recurringOccurrences

categories

subcategories

familyMembers

merchants

investments

investmentLots

marketPrices

properties

vehicles

otherAssets

budgets

goals

receipts

notifications

netWorthSnapshots

reconciliations

auditLogs

settings

Codex may consolidate stores where technically better, but functionality and data integrity must be preserved.

Important rules:

Archived entities remain in historical records.

Transactions must not depend on mutable display names.

Relationships must use stable IDs.

Database migrations must be versioned.

Migrations must be tested.

Failed migrations must not silently erase data.

Restore operations must validate before replacing data.

# 12. Development milestones

Codex must execute milestones in sequence.

Do not begin a new milestone until the previous milestone has met its acceptance criteria or has documented blockers.

# MILESTONE 0 — Repository assessment and specification

## Objectives

Inspect the complete repository.

Identify existing experimental files.

Determine what is usable.

Determine what should be replaced.

Establish the final Version 1 architecture.

Establish coding standards.

Establish security standards.

Establish financial rules.

Build the development backlog.

## Tasks

Review all repository files.

Run the application locally if possible.

Check browser-console errors.

Check current PWA support.

Check service-worker behaviour.

Inspect IndexedDB usage.

Inspect existing calculations.

Identify incomplete placeholders.

Identify unsafe design decisions.

Identify architectural debt.

Create or update:

README.md

ARCHITECTURE.md

SECURITY.md

DATA_MODEL.md

FINANCIAL_RULES.md

ROADMAP.md

CHANGELOG.md

CONTRIBUTING.md

KNOWN_LIMITATIONS.md

## Deliverables

Repository assessment.

Feature inventory.

Gap analysis.

Technical risk register.

Security risk register.

Financial-calculation risk register.

Final folder structure.

Version 1 scope.

Development backlog.

## Acceptance criteria

Existing code has been inspected.

Existing application has been run where possible.

No useful file is deleted without explanation.

Architecture is documented.

Financial rules are documented.

Version 1 boundaries are documented.

# MILESTONE 1 — Modular PWA foundation

## Objectives

Create a clean, maintainable and deployable application foundation.

## Tasks

Create modular project structure.

Create application shell.

Create client-side routing.

Build shared components.

Build responsive navigation.

Implement theme framework.

Implement light theme.

Implement dark theme.

Create PWA manifest.

Create service worker.

Cache application shell.

Add offline fallback.

Add update-available notification.

Add global error handling.

Configure GitHub Pages deployment.

Add automated deployment workflow where appropriate.

Add basic test setup.

Add static checks.

Add version display.

## Acceptance criteria

App runs locally.

App loads on GitHub Pages.

App can be installed as a PWA.

App shell loads offline after first visit.

No critical browser-console errors.

Mobile and desktop layouts function.

No secrets exist in the repository.

Deployment instructions are documented.

# MILESTONE 2 — Database and security foundation

## Objectives

Create safe persistence, access control and backup foundations.

## Tasks

Create versioned IndexedDB schema.

Create data-access layer.

Create repository abstractions.

Create migration system.

Add atomic multi-store operations.

Add PIN or passphrase lock.

Add password-derived encryption support.

Add inactivity auto-lock.

Add lock-on-reopen option.

Add failed-attempt delay.

Add security settings.

Add standard backup.

Add password-encrypted backup.

Add restore preview.

Add restore validation.

Add safe reset workflow.

Add audit-log foundation.

Add privacy explanations.

Add masked display for sensitive identifiers.

## Acceptance criteria

Data persists after restart.

Database upgrades preserve data.

PIN or password is not stored in plaintext.

Invalid backups are rejected safely.

Backup restores into a clean profile.

Auto-lock functions.

Failed restore does not partially overwrite valid data.

Reset requires explicit confirmation.

Audit logs do not contain secrets.

# MILESTONE 3 — Guided onboarding and entity management

## Objectives

Create first-time setup and flexible financial entity management.

## Onboarding sections

User profile.

Currency.

Financial year.

Bank accounts.

Cash accounts.

Wallets.

Credit cards.

Existing loans.

Income sources.

Recurring commitments.

Optional investments.

Optional properties.

Optional vehicles.

Emergency-fund target.

Opening balances.

All optional sections must be skippable.

## Bank accounts

Support unlimited:

Savings.

Salary.

Current.

Joint.

Cash.

Wallet.

Overdraft.

Custom.

Fields:

Account nickname.

Institution.

Account type.

Last four digits.

Opening balance.

Current balance.

Interest rate.

Minimum balance.

Account holder.

Include in net worth.

Active or archived status.

## Credit cards

Support unlimited cards.

Fields:

Card nickname.

Bank.

Network.

Last four digits.

Credit limit.

Opening outstanding.

Statement date.

Due date.

Minimum due.

Annual fee.

Linked bank account.

Reward type.

Active, blocked or closed status.

## Loans

Support unlimited loans.

Loan types:

Home.

Vehicle.

Personal.

Education.

Business.

Gold.

Consumer durable.

Loan against property.

Family loan.

Custom.

Fields:

Lender.

Original amount.

Current principal.

Interest rate.

EMI.

Start date.

Expected end date.

Remaining tenure.

Payment date.

Linked bank account.

Fixed or floating rate.

Active or closed status.

## Acceptance criteria

Minimum onboarding can be completed quickly.

Optional steps can be skipped.

New entities can be added later.

Existing loans can be added.

New loans can be added.

Existing cards can be added.

New cards can be added.

Entities can be edited.

Entities can be archived.

Archived entities remain in history.

Opening balances create an initial net-worth position.

# MILESTONE 4 — Transaction-first main experience

## Objectives

Build the primary daily-use workflow.

## Required transaction types

Income.

Expense.

Transfer.

Credit-card purchase.

Credit-card payment.

Loan disbursement.

Loan payment.

Investment purchase.

Investment sale.

Dividend.

Interest.

Refund.

Reimbursement.

Asset purchase.

Asset sale.

Cash withdrawal.

Cash deposit.

Gift received.

Gift given.

Tax payment.

Balance correction.

## Transaction fields

Date.

Time.

Type.

Amount.

Source account.

Destination account.

Category.

Subcategory.

Merchant or source.

Family member.

Payment method.

Notes.

Tags.

Receipt.

Recurring rule link.

Loan link.

Credit-card link.

Investment link.

Asset link.

Reconciliation status.

Created timestamp.

Modified timestamp.

## Main screen

Show:

Add Transaction.

Quick transaction buttons.

Today’s spending.

Current-month spending.

Recent transactions.

Upcoming commitments.

Account warnings.

Short wealth-impact summary.

## Historical transaction functions

Search.

Date filters.

Account filters.

Type filters.

Category filters.

Merchant filters.

Amount filters.

Edit.

Duplicate.

Soft delete.

Restore.

Receipt replacement.

Convert to recurring.

Split transaction.

## Editing rule

Editing a transaction must reverse the original impact and apply the corrected impact atomically.

## Acceptance criteria

Common transactions are quick to enter.

Previous transactions are searchable.

Previous transactions are editable.

Soft-deleted transactions can be restored.

Transfers do not affect income or expenses.

Card payments do not duplicate expenses.

Loan payments split principal and interest.

Editing does not leave incorrect balances.

Core scenarios have automated tests.

# MILESTONE 5 — Wealth Impact Engine

## Objectives

Build the central FinOrbit financial engine.

## Tasks

Create transaction-posting rules.

Create balance calculation engine.

Create asset calculation engine.

Create liability calculation engine.

Create net-worth engine.

Create monthly income calculations.

Create monthly expense calculations.

Create monthly savings.

Create savings rate.

Create debt reduction analysis.

Create net-worth snapshots.

Create historical recalculation.

Create wealth-change explanation.

Create data-integrity diagnostics.

Document every calculation rule.

## Required wealth explanations

Show:

Net-worth change this month.

Income contribution.

Expense impact.

Investment contribution.

Market-value change.

Debt reduction.

Loan-interest impact.

Asset depreciation.

Adjustments.

## Acceptance criteria

Net-worth calculations match documented rules.

Historical edits recalculate affected periods.

Transfers do not distort reporting.

Asset purchases are not automatically consumption expenses.

Investment contributions and gains remain separate.

Principal and interest remain separate.

Core rules are covered by automated tests.

Integrity diagnostics detect inconsistent records.

# MILESTONE 6 — Recurring income, expenses and reminders

## Objectives

Create reliable recurring financial tracking.

## Recurring types

Salary.

Pension.

Rental income.

Interest income.

Dividend expectation.

Rent expense.

EMI.

SIP.

School fees.

Insurance.

Utility bill.

Subscription.

Society maintenance.

Tax payment.

Credit-card payment.

Custom recurring item.

## Frequencies

Daily.

Weekly.

Fortnightly.

Monthly.

Every two months.

Quarterly.

Half-yearly.

Yearly.

Custom interval.

First working day.

Last working day.

Specific dates.

## Statuses

Scheduled.

Due soon.

Due today.

Overdue.

Paid.

Received.

Skipped.

Postponed.

Amount changed.

Auto-posted.

## Tasks

Build recurring-rule editor.

Build occurrence generator.

Prevent duplicate generation.

Support fixed amounts.

Support estimated variable amounts.

Support confirmation before posting.

Support optional automatic posting.

Add due-date dashboard.

Add in-app reminders.

Add browser notifications where permitted.

Add expected-versus-actual comparison.

Add insufficient-balance warnings.

Add pause, resume and end-date controls.

## Acceptance criteria

Occurrences generate only once.

Variable bills can be confirmed.

Missed items remain visible.

Skipped items remain auditable.

Archived accounts trigger reassignment warnings.

Notification denial does not break the recurring system.

Recurring rules survive database upgrades.

# MILESTONE 7 — Categories, family and budgets

## Objectives

Support broad household and personal-finance needs.

## Category groups

At minimum:

Housing.

Rent.

Home loan.

Groceries.

Food and dining.

Utilities.

Household supplies.

Domestic help.

Transport.

Fuel.

Public transport.

Vehicle maintenance.

Children.

School fees.

Books and stationery.

Tuition.

School transport.

Family support.

Parents and elder care.

Healthcare.

Medicines.

Insurance.

Clothing.

Personal care.

Communication.

Technology.

Entertainment.

Travel.

Religious events.

Social events.

Donations.

Bank charges.

Loan interest.

Taxes.

Business.

Agriculture.

Emergency expenses.

Custom categories.

## Tasks

Add subcategories.

Add custom categories.

Allow categories to be hidden.

Add category icons.

Add category classifications:

Essential.

Discretionary.

Financial commitment.

Wealth-building.

Add family-member profiles.

Allow transaction assignment by family member.

Build monthly budgets.

Add rollover.

Add spending pace.

Add warnings.

Add comparisons with previous periods.

## Acceptance criteria

Default categories cover broad needs.

User can hide irrelevant categories.

User can add custom categories.

School and child-related expenses are supported.

Parent and family support are supported.

Transfers are excluded from budgets.

Investment purchases are excluded from consumption budgets.

Budget totals match transaction totals.

# MILESTONE 8 — Investments and price syncing

## Objectives

Create reliable portfolio tracking with flexible price providers.

## Investment types

Indian stocks.

International stocks.

Mutual funds.

ETFs.

Fixed deposits.

Bonds.

EPF.

PPF.

NPS.

Gold.

Custom investments.

## Investment fields

Broker or account.

Symbol or scheme code.

Investment name.

Asset class.

Quantity or units.

Purchase date.

Purchase price.

Fees.

Cost basis.

Current price.

Current value.

Realised gain.

Unrealised gain.

Dividend.

Price timestamp.

Price provider.

Manual override indicator.

## Provider architecture

Use:

Portfolio → Market Data Service → Provider Adapter → External Source

Do not tightly couple the portfolio to one provider.

## Price behaviour

Refresh when portfolio opens.

Provide manual refresh.

Cache the latest successful price.

Show last update time.

Mark stale prices.

Support manual price entry.

Handle rate limits.

Handle offline mode.

Never alter holdings when price retrieval fails.

Never commit API keys.

Store provider configuration locally.

## Mutual funds

Do not describe mutual-fund NAV as continuous real-time data.

Mutual-fund NAV should be treated as daily or periodic valuation data.

## Acceptance criteria

Portfolio works offline with cached prices.

Manual valuation works without APIs.

API failure does not corrupt holdings.

Cost basis remains independent from current price.

Price source and timestamp are visible.

Investment purchases and sales integrate with wealth calculations.

Fixed deposits and retirement assets work without live APIs.

# MILESTONE 9 — Properties, vehicles and other assets

## Objectives

Support multiple physical assets.

## Properties

Support:

Residential house.

Rental property.

Land.

Commercial property.

Under-construction property.

Fields:

Name.

Location.

Purchase date.

Purchase price.

Ownership percentage.

Current estimated value.

Linked loan.

Rental income.

Property tax.

Maintenance.

Insurance.

Include in net worth.

## Vehicles

Support:

Car.

Motorcycle.

Commercial vehicle.

Bicycle.

Custom vehicle.

Fields:

Name.

Registration identifier.

Purchase date.

Purchase price.

Current estimated value.

Linked loan.

Insurance renewal.

Service schedule.

Fuel and maintenance linkage.

Include in net worth.

## Other assets

Support:

Gold.

Jewellery.

Business equipment.

Collectibles.

Agricultural assets.

Custom valuables.

## Tasks

Add asset-value history.

Add manual appreciation.

Add manual depreciation.

Link expenses.

Link income.

Link loans.

Support asset sale.

Archive sold assets.

Preserve historical values.

## Acceptance criteria

Multiple properties are supported.

Multiple vehicles are supported.

Assets can be included or excluded from net worth.

Linked loans are visible.

Asset sales update cash and ownership.

Historical values remain available.

Vehicle expenses can be reported by vehicle.

# MILESTONE 10 — Forecasting, goals and planning

## Objectives

Help users understand future financial pressure and surplus.

## Tasks

Build 7-day cash-flow forecast.

Build 30-day cash-flow forecast.

Build monthly projected balance.

Use recurring income.

Use recurring commitments.

Add safe-to-spend estimate.

Add low-balance warning.

Add expected investment surplus.

Add emergency-fund goal.

Add education goal.

Add property goal.

Add vehicle goal.

Add retirement goal.

Add debt-payoff goal.

Add custom goals.

Show:

Target.

Current amount.

Gap.

Target date.

Required monthly contribution.

## Acceptance criteria

Forecasts distinguish confirmed and estimated values.

Shortfall causes are visible.

Transfers do not inflate forecasts.

Goal contributions are not treated as consumption expenses.

Forecast assumptions are visible.

Users can exclude uncertain recurring items.

Safe-to-spend logic is documented.

# MILESTONE 11 — Reports and exports

## Objectives

Create a professional reporting centre.

## Transaction reports

Daily transactions.

Monthly transactions.

Yearly transactions.

Financial-year transactions.

Account statement.

Category statement.

Merchant report.

Family-member report.

Payment-method report.

Credit-card report.

## Income and expense reports

Income versus expenses.

Savings trend.

Essential versus discretionary.

Fixed versus variable.

Recurring commitments.

Children and education.

Family support.

Healthcare.

Vehicle expenses.

Property expenses.

## Wealth reports

Net-worth statement.

Net-worth movement.

Total assets.

Total liabilities.

Asset allocation.

Liability allocation.

Investment performance.

Loan repayment.

Credit utilisation.

Emergency-fund coverage.

## Forecast reports

Next 7 days.

Next 30 days.

Expected account balances.

Expected income.

Expected commitments.

## Export formats

PDF.

XLSX where practical.

CSV.

JSON backup.

## Export controls

Date range.

Account filters.

Category filters.

Include charts.

Exclude charts.

Include notes.

Exclude notes.

Include receipts.

Exclude receipts.

Mask identifiers.

Report-generation timestamp.

Investment-price timestamp.

## Acceptance criteria

Export totals match application totals.

PDF output is professional.

Reports are printable.

Receipts are excluded by default.

CSV works as a fallback.

XLSX contains structured worksheets when implemented.

Reports work offline where technically possible.

# MILESTONE 12 — Reconciliation and data integrity

## Objectives

Help users match FinOrbit balances to actual financial accounts.

## Tasks

Add account reconciliation.

Allow statement closing balance entry.

Calculate difference.

Mark transactions as cleared.

Mark transactions as reconciled.

Add correction workflow.

Add duplicate-transaction detection.

Add broken-reference detection.

Add orphaned-record detection.

Add safe repair tools.

Add diagnostic export.

Add audit records for corrections.

## Acceptance criteria

Reconciliation does not rewrite valid history silently.

Corrections are traceable.

Duplicate detection requires review.

Broken account links are identified.

Broken asset links are identified.

Repair operations are reversible where practical.

Balance differences are explained clearly.

# MILESTONE 13 — Security, privacy and resilience audit

## Objectives

Prepare FinOrbit for serious personal financial use.

## Tasks

Review stored data.

Review encryption.

Review key handling.

Review PIN and password flow.

Review auto-lock.

Review API-key handling.

Review backup encryption.

Review receipt storage.

Review file-import validation.

Review HTML injection risks.

Review service-worker caching.

Review dependency risks.

Review browser permissions.

Add Content Security Policy where compatible.

Add privacy notice.

Add security guide.

Add recovery guide.

Add corrupted-database strategy.

Add storage-pressure handling.

Test large datasets.

## Test conditions

Incorrect PIN attempts.

Forgotten PIN.

Forgotten passphrase.

Invalid backup.

Interrupted restore.

Malformed JSON.

Offline use.

API failure.

API rate limits.

Browser storage pressure.

Ten years of transactions.

Multiple banks.

Multiple credit cards.

Multiple loans.

Large receipt storage.

Database version upgrade.

## Acceptance criteria

No unresolved critical security issue.

No committed secrets.

Restore failure cannot partially replace valid data.

Reports do not expose secrets.

Sensitive identifiers are masked.

Security limitations are documented.

Recovery options are documented.

# MILESTONE 14 — User experience, accessibility and performance

## Objectives

Create a polished and efficient product.

## Tasks

Test daily transaction flows.

Reduce unnecessary taps.

Improve amount entry.

Improve date entry.

Improve mobile keyboard behaviour.

Add loading states.

Add success states.

Add error states.

Add useful empty states.

Add accessible labels.

Add keyboard navigation.

Check contrast.

Check screen-reader basics.

Optimise transaction-list rendering.

Optimise IndexedDB queries.

Optimise startup time.

Lazy-load noncritical modules.

Prevent market-data requests from blocking startup.

Audit service-worker cache size.

Test common mobile and desktop screen sizes.

## Acceptance criteria

Transaction entry is comfortable on mobile.

Application remains responsive with large histories.

Portfolio requests do not delay transaction logging.

Key workflows are keyboard accessible.

No major layout overflow.

Clear feedback appears after save, edit, delete, export and restore.

Startup performance is acceptable.

# MILESTONE 15 — Production release

## Objectives

Release FinOrbit Version 1.0.

## Tasks

Resolve release-blocking defects.

Run the complete automated test suite.

Run manual acceptance tests.

Verify GitHub Pages deployment.

Verify PWA installation.

Verify offline use.

Verify clean installation.

Verify database upgrades.

Verify backup and restore.

Verify transaction editing.

Verify net-worth calculations.

Verify recurring items.

Verify reports.

Verify investment fallback behaviour.

Update version number.

Finalise changelog.

Create user guide.

Create security guide.

Create privacy guide.

Create known-limitations document.

Create release notes.

Tag v1.0.0.

Create GitHub release.

Preserve rollback point.

## Version 1 release blockers

Do not release Version 1 if any of these remain:

Incorrect net-worth calculations.

Duplicate expense from credit-card payment.

Broken transaction editing.

Destructive database migration.

Failed backup restoration.

Exposed API keys.

Critical offline failure.

Critical security defect.

Export totals differing from application totals.

Data loss after update.

Recurring duplicate generation.

Investment failure corrupting holdings.

# 13. Features outside Version 1

Do not implement these before Version 1 is stable unless specifically approved:

Direct bank synchronisation.

Direct credit-card synchronisation.

Broker login integration.

Cloud synchronisation.

Family multi-user collaboration.

Tax filing.

Automated financial advice.

Receipt OCR.

AI financial recommendations.

Open banking.

Automated payments.

Loan applications.

Insurance sales.

Investment trading.

Cryptocurrency trading.

The architecture may allow these later, but they must not delay Version 1.

# 14. Required milestone completion report

After each milestone, Codex must provide the following.

## Completed

List:

Features completed.

Files created.

Files changed.

Features removed or replaced.

## Technical decisions

Explain:

Architecture decisions.

Database decisions.

Security decisions.

Financial logic decisions.

Dependency decisions.

## Tests performed

List:

Automated tests.

Manual tests.

Browser tests.

Offline tests.

Data tests.

## Known limitations

List:

Incomplete behaviour.

Temporary fallbacks.

Unsupported scenarios.

Deferred issues.

## Security impact

State:

New sensitive data introduced.

New browser permissions.

New external connections.

New security risks.

## Database impact

State:

Schema version change.

Migration added.

Stores added.

Stores changed.

Restore compatibility impact.

## Deployment status

Confirm:

Local build status.

GitHub Pages status.

PWA installation status.

Offline status.

## Pull request

Provide:

Branch name.

Commit reference.

Pull-request link.

Summary of review points.

## Recommended next step

State the next milestone.

Do not automatically begin the next milestone unless instructed.

# 15. Initial Codex instruction

Begin with Milestone 0 only.

Do not attempt to build the entire application in one uncontrolled implementation.

Inspect the current repository thoroughly.

The repository may be empty or may contain an experimental FinOrbit trial. Treat any existing trial code as non-production code until it has been assessed.

Do not assume that any existing file is the approved foundation.

During Milestone 0:

Run the current application if possible.

Inspect all code.

Identify working features.

Identify placeholders.

Identify architectural weaknesses.

Identify security weaknesses.

Identify financial-calculation weaknesses.

Identify data-integrity risks.

Recommend what should be retained.

Recommend what should be rewritten.

Create the core documentation.

Propose the exact Milestone 1 implementation.

Do not delete existing files during Milestone 0 unless they are clearly generated artifacts and the reason is documented.

At the end of Milestone 0, provide:

Repository assessment.

Existing feature inventory.

Gap analysis.

Security risk analysis.

Financial-logic risk analysis.

Data-model risk analysis.

Proposed architecture.

Proposed backlog.

Files created or updated.

Tests performed.

Branch and pull-request details.
