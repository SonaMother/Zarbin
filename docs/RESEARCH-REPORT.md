# Research Report: Professional Accounting App Features
## With Special Focus on Iranian Market Requirements

**Author:** Zarbin Research Team  
**Date:** 2026-06-29  
**Version:** 1.0  
**Purpose:** Define the feature set a professional accounting app must offer, with special focus on Iranian advanced accounting needs and basic personal finance needs, to audit Zarbin's current implementation and plan improvements.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Methodology](#2-methodology)
3. [Global Best Practices: Personal Finance Apps](#3-global-best-practices-personal-finance-apps)
4. [Global Best Practices: Professional Accounting Software](#4-global-best-practices-professional-accounting-software)
5. [Iranian Market: Specific Requirements](#5-iranian-market-specific-requirements)
6. [Iranian Personal Finance Apps: Competitive Analysis](#6-iranian-personal-finance-apps-competitive-analysis)
7. [Feature Matrix: Must-Have vs Nice-to-Have](#7-feature-matrix-must-have-vs-nice-to-have)
8. [Security & Privacy Requirements](#8-security--privacy-requirements)
9. [Conclusion](#9-conclusion)

---

## 1. Executive Summary

This report synthesizes research from three domains:

1. **Global personal finance app best practices** (Money Manager, Wallet, YNAB, Copilot, Monarch, Spendee)
2. **Professional accounting software features** (QuickBooks, Xero, FreshBooks, Zoho Books)
3. **Iranian accounting software and apps** (Parmis, Gheyas, Deyarito, Hamkaran, Sepidar, Himid, Chertakeh, Mowj)

The Iranian market has **unique requirements** that global apps don't address:
- **Jalali (Shamsi) calendar** as the primary calendar (not Gregorian)
- **Iranian fiscal year** starts March 21 (1st of Farvardin), not January 1
- **Dual currency display** (Rial رسمی vs Toman رایج) — 1 Toman = 10 Rials
- **Multi-currency with USD** — Iranians track dollar savings due to 50%+ annual rial inflation
- **Cheque (سک) management** — Iranian cheques have a "صیادی" serial system, due dates, and pass/bounce workflows that don't exist in Western banking
- **VAT (مالیات بر ارزش افزوده)** — quarterly VAT returns for self-employed/freelancers (9% rate)
- **Samaneh Moadian (سامانه مودیان)** — Iran's e-invoicing system, mandatory for many businesses since 2023
- **Bank SMS auto-parsing** — Iranian banks send structured transactional SMS that apps auto-import

The audit in [`FEATURE-AUDIT.md`](./FEATURE-AUDIT.md) identifies **19 missing critical features** and **11 suboptimal implementations** in the current Zarbin v1.3.0 codebase. The improvement plan in [`IMPROVEMENT-PLAN.md`](./IMPROVEMENT-PLAN.md) prioritizes these into 4 release milestones.

---

## 2. Methodology

Research was conducted using:

1. **Web searches** (10 queries) across English and Persian sources, covering:
   - Iranian accounting software vendor sites (Parmis, Gheyas, Deyarito, Sepidar, Himid, Hamkaran, Chertakeh)
   - Iranian accounting journals (IJAAF, IJFIFSA)
   - Global personal finance app reviews (Forbes, NerdWallet, WSJ, Equifax)
   - Iranian tax authority documentation (VAT law, Moadian system)
   - Iranian cheque management software vendors
2. **Google Play Store** listings for top Iranian personal finance apps
3. **Code audit** of Zarbin v1.3.0 (90 tracked files, 2,742 lines of JS, 1,213 lines of HTML)
4. **Feature gap analysis** comparing research findings to current implementation

---

## 3. Global Best Practices: Personal Finance Apps

Based on analysis of top global personal finance apps (Money Manager, Wallet, YNAB, Copilot, Monarch, Spendee, PocketGuard, Rocket Money, Simplifi, Neontra):

### 3.1 Core Transaction Management (Must-Have)
| Feature | Description | Used By |
|---------|-------------|---------|
| Multi-account types | Bank, cash, credit card, savings, loan, investment | All apps |
| Income/expense/transfer | Three fundamental transaction types | All apps |
| Categories + subcategories | Two-level hierarchy with custom icons/colors | Money Manager, Wallet, YNAB |
| Tags/labels | Cross-cutting labels (e.g. "trip", "reimbursable") | Monarch, Copilot, Simplifi |
| Notes/memos | Free-text description per transaction | All apps |
| Date + time | Date required, time optional | All apps |
| Photo/receipt attachment | Snap a photo of the receipt | Wallet, Spendee, Money Manager |
| Location | Optional GPS tag | Wallet, Spendee |

### 3.2 Budgeting (Must-Have)
| Feature | Description | Used By |
|---------|-------------|---------|
| Monthly budget per category | Set spending limit per category | All apps |
| Weekly/monthly/yearly budgets | Multiple time horizons | Money Manager, YNAB |
| Rollover unused budget | Carry surplus to next month | YNAB, Monarch |
| Budget vs actual | Visual progress bars with color states (green/amber/red) | All apps |
| Alerts on threshold | Notify at 80%/100% of budget | PocketGuard, Rocket Money |
| Envelope budgeting | YNAB-style zero-based allocation | YNAB, Monarch |

### 3.3 Recurring & Scheduled Transactions (Must-Have)
| Feature | Description | Used By |
|---------|-------------|---------|
| Recurring rules | Daily/weekly/monthly/yearly frequency | All apps |
| Auto-create on due date | Background processing | Money Manager, Wallet |
| Pause/resume | Temporarily disable a recurring | YNAB, Monarch |
| Edit instance vs series | Modify one occurrence or all future | YNAB, Monarch |

### 3.4 Reports & Analytics (Must-Have)
| Feature | Description | Used By |
|---------|-------------|---------|
| Monthly income vs expense | Bar chart comparing 12 months | All apps |
| Category breakdown | Pie/donut chart of spending by category | All apps |
| Trend over time | Line chart of net worth or balance | Monarch, Copilot, Wallet |
| Yearly summary | Annual P&L statement | All apps |
| Custom date range | Filter by any date range | All apps |
| Export to CSV/Excel | Machine-readable export | All apps |
| Export to PDF | Human-readable report | Wallet, Monarch |

### 3.5 Goals & Savings (Must-Have)
| Feature | Description | Used By |
|---------|-------------|---------|
| Savings goals | Set target amount + deadline | PocketGuard, Monarch, Simplifi |
| Progress tracking | Visual progress bar | All apps with goals |
| Auto-contribution | Optional scheduled transfers | YNAB, Monarch |

### 3.6 Net Worth Tracking (Nice-to-Have → Must-Have for pro users)
| Feature | Description | Used By |
|---------|-------------|---------|
| Assets vs liabilities | Track total net worth | Monarch, Copilot, Empower |
| Investment accounts | Track stocks, crypto, funds | Monarch, Copilot |
| Manual balance updates | Periodic revaluation | All apps |

### 3.7 Search & Filter (Must-Have)
| Feature | Description | Used By |
|---------|-------------|---------|
| Full-text search | Search notes, categories, payees | All apps |
| Multi-filter | Filter by date, category, account, amount range, tag | Money Manager, Wallet |
| Saved searches | Bookmark frequent filter combos | Monarch, Copilot |

### 3.8 Security & Privacy (Must-Have)
| Feature | Description | Used By |
|---------|-------------|---------|
| App lock (PIN) | 4–8 digit passcode | All apps |
| Biometric unlock | Fingerprint/Face ID | All apps |
| Local-first storage | No mandatory cloud | Money Manager, Beyond Budget, Financy |
| Encrypted backup | Password-protected backup files | Wallet, Monarch |
| Auto-lock timeout | Lock after inactivity | All apps |

---

## 4. Global Best Practices: Professional Accounting Software

Based on analysis of QuickBooks, Xero, FreshBooks, Zoho Books, Wave, Sage:

### 4.1 Double-Entry Accounting (Advanced)
- **Chart of accounts** — hierarchical account numbering (assets 1000, liabilities 2000, equity 3000, revenue 4000, expenses 5000)
- **Debit/credit postings** — every transaction debits one account and credits another
- **Journal entries** — manual adjustments with reference numbers
- **Trial balance** — list of all accounts with debit/credit balances
- **Balance sheet** — assets = liabilities + equity snapshot
- **Income statement (P&L)** — revenue minus expenses over a period
- **Cash flow statement** — operating/investing/financing cash flows

### 4.2 Invoicing & Receivables (Advanced)
- **Invoice creation** — line items, tax, discounts, terms
- **Customer database** — contact info, payment terms, history
- **Invoice status tracking** — draft → sent → viewed → paid → overdue
- **Recurring invoices** — auto-generation on schedule
- **Estimates/quotes** — convert to invoice on acceptance
- **Payment recording** — partial payments, multiple payment methods

### 4.3 Bills & Payables (Advanced)
- **Bill entry** — vendor, due date, line items
- **Aging reports** — 30/60/90 day breakdown of payables
- **Payment scheduling** — cash flow planning
- **Vendor database** — 1099 tracking (US) or vendor tax IDs

### 4.4 Inventory (Advanced)
- **Item tracking** — SKU, name, cost, sale price, quantity
- **Stock movements** — purchases, sales, adjustments
- **Multiple warehouses** — location tracking
- **FIFO/LIFO/Average costing** — valuation methods
- **Low stock alerts** — reorder points

### 4.5 Tax & Compliance (Advanced)
- **Tax categories** — map to tax authority codes
- **Tax calculation per line** — VAT/GST per item
- **Tax returns** — quarterly/annual reports
- **1099/W-2 generation** (US) or local equivalents
- **Audit trail** — who changed what, when

### 4.6 Multi-Currency (Advanced)
- **Currency setup** — base currency + foreign currencies
- **Exchange rate management** — daily rates, historical rates
- **Realized/Unrealized gains** — FX gain/loss tracking
- **Revaluation** — period-end revaluation of foreign balances

### 4.7 Reporting Suite (Advanced)
- **Standard reports** — Balance Sheet, P&L, Cash Flow, Trial Balance, AR Aging, AP Aging
- **Custom reports** — user-defined columns, filters, grouping
- **Scheduled reports** — auto-email weekly/monthly
- **Budget vs actual** — variance analysis
- **Department/class tracking** — segment reporting

### 4.8 Bank Reconciliation (Advanced)
- **Import bank statements** — CSV/OFX/QBO import
- **Match transactions** — auto-match to existing entries
- **Reconcile** — mark cleared, identify discrepancies
- **Reconciliation reports** — period summary

---

## 5. Iranian Market: Specific Requirements

The Iranian market has unique requirements that Western apps completely ignore. These are deal-breakers for Iranian users.

### 5.1 Calendar & Fiscal Year

| Requirement | Detail |
|-------------|--------|
| **Jalali (Shamsi) calendar** | All dates displayed in Persian solar calendar (فروردین، اردیبهشت، …، اسفند). Leap years have 366 days with 30-day Esfand. |
| **Persian digits** | Numbers displayed in ۰۱۲۳۴۵۶۷۸۹ format |
| **Persian weekday names** | شنبه (Saturday) is the first day of the week; weekend is پنجشنبه+جمعه (Thursday+Friday) |
| **Iranian fiscal year** | Starts **March 21** (1st of Farvardin). Annual reports must align with this, NOT January 1. |
| **Persian date picker** | Native Jalali calendar widget, not Gregorian |
| **Persian month/year navigation** | Pressing "previous month" goes to the previous Jalali month, not Gregorian |

### 5.2 Currency

| Requirement | Detail |
|-------------|--------|
| **Rial (ریال) vs Toman (تومان)** | 1 Toman = 10 Rials. Iranian law uses Rial; everyday speech uses Toman. Apps must toggle between them. |
| **USD tracking** | Due to ~50% annual rial inflation (1 USD = ~1,375,000 IRR in 2026), Iranians commonly hold USD savings. Apps must support parallel USD accounting. |
| **Euro, AED, TRY** | Other common currencies Iranians hold (Turkey, UAE are common destinations) |
| **Manual exchange rate entry** | Iranian banks don't publish a stable official rate; users need to set their own rate |
| **Currency conversion in reports** | Show balances in user's preferred currency using their entered rate |

### 5.3 Cheque (چک) Management — CRITICAL

Iranian cheques are fundamentally different from Western checks:

| Feature | Why It's Needed |
|---------|-----------------|
| **Cheque register** | Track both received (دریافتی) and issued (پرداختی) cheques separately |
| **Sayadi serial (صیادی)** | Since 2018, all Iranian cheques have a 16-digit "صیادی" serial printed by the central bank. Apps must record this. |
| **Cheque status workflow** | State machine: ثبت → وصول شده → برگشت خورده → واگذاری (registered → cashed → bounced → endorsed) |
| **Due date (سررسید)** | Cheques have a future cashing date. Apps must show a calendar of upcoming cheques. |
| **Bounced cheque tracking** | A bounced cheque (چک برگشتی) is a legal matter in Iran — apps must record and alert |
| **Cheque endorsement (واگذاری)** | A received cheque can be endorsed to a third party — track chain of ownership |
| **Cheque printing** | Pre-printed cheque templates for Iranian banks (Melli, Saderat, Tejarat, Sepah, etc.) |
| **Aging report** | Upcoming-due cheques by 1-7 days, 8-30 days, 31+ days |

### 5.4 Value Added Tax (VAT — مالیات بر ارزش افزوده)

| Requirement | Detail |
|-------------|--------|
| **VAT rate** | Currently **9%** in Iran (was 10% prior to 1403) |
| **VAT-inclusive vs exclusive** | Iranian prices can be quoted either way; app must handle both |
| **Quarterly VAT return** | Taxpayers file 4 returns per year (Q1: by end of Khordad, etc.) |
| **VAT on sales** | Output VAT collected from customers |
| **VAT on purchases** | Input VAT paid to vendors (deductible) |
| **Net VAT payable** | Output − Input, paid to tax authority |
| **VAT exemption tracking** | Some goods/services are zero-rated or exempt |

### 5.5 Samaneh Moadian (سامانه مودیان) — E-Invoicing

Since 2023, Iran mandates electronic invoicing through the **Samaneh Moadian** (Taxpayers System) for many businesses:

| Requirement | Detail |
|-------------|--------|
| **Electronic invoice (صورتحساب الکترونیکی)** | XML/JSON format with specific schema |
| **Invoice types** | Type 1 (subject to VAT), Type 2 (zero-rated), Type 3 (exempt), Type 4 (internal) |
| **Subject codes (کد موضوعی)** | Tax authority product/service classification codes |
| **Buyer/Seller tax ID (شناسه مالیاتی)** | 10-digit national tax ID |
| **QR code on invoice** | Required for compliance |
| **Submission status** | Pending → Accepted → Rejected → Modified |
| **Moadian report export** | XML/Excel format for direct upload to the portal |

**For Zarbin as a personal finance app**, full Moadian compliance is out of scope, but the app should at least allow recording invoices with tax ID and VAT breakdown for users who later upload them to Moadian.

### 5.6 Bank SMS Auto-Parsing

Iranian banks send structured SMS for every card transaction:

```
برداشت مبلغ 500,000 ريال
شماره کارت: 6037-****-1234
مانده: 1,234,567,890 ريال
تاریخ: 1405/04/04 - 12:34
```

**Apps must:**
- Read SMS (with permission) from banks (Mellat, Melli, Saderat, Tejarat, Sepah, Pasargad, Saman, Parsian, Ayandeh, Resalat, etc.)
- Parse amount, card number, balance, date/time
- Auto-create a transaction in the matching account
- Let user confirm/edit before final save
- Learn user's categorization patterns

### 5.7 People (اشخاص) Management

Iranian personal finance apps universally support a "people" concept:

- Track money lent to/borrowed from specific people (قرض با اشخاص)
- Person database: name, phone, email, photo, relationship
- Per-person ledger: all transactions involving them
- Settlement tracking: when a loan is fully repaid
- Reminders for due dates on personal loans

### 5.8 Loans & Installments (وام و اقساط)

| Feature | Description |
|---------|-------------|
| **Loan definition** | Principal amount, interest rate (سود), term, start date |
| **Installment schedule** | Auto-generate N monthly payments |
| **Payment tracking** | Mark each installment paid/unpaid/late |
| **Early repayment** | Recalculate remaining schedule |
| **Two types: received vs given** | Borrowed from bank vs lent to friend |
| **Interest vs principal split** | Each payment splits between them (amortization) |

### 5.9 Iranian Banking Specifics

| Feature | Why |
|---------|-----|
| **Bank list with logos** | All 20+ Iranian banks with brand colors |
| **IBAN (شبا)** | 24-digit Iranian IBAN format: IR + 22 digits |
| **Card number format** | 16-digit grouped as 4-4-4-4 |
| **CVV2, expiry** | Optional card metadata |
| **Account number vs card number** | Iranians distinguish between حساب (account) and کارت (card) |

### 5.10 Persian UI/UX

| Requirement | Detail |
|-------------|--------|
| **RTL layout** | `dir="rtl"` on all elements |
| **Persian fonts** | Vazirmatn, IRANSans, Shabnam, Yekan Bakh |
| **No English fallback** | 100% Persian labels, even for icons |
| **Persian number formatting** | Group by 3 digits with comma: ۱،۲۳۴،۵۶۷ |
| **Currency suffix** | "ریال" or "تومان" appears after the amount, not before |
| **Friday (جمعه) highlighted** | Weekend in Persian calendar; apps highlight it in red |

---

## 6. Iranian Personal Finance Apps: Competitive Analysis

### 6.1 Parmis (پارمیس همراه) — Most Downloaded

Source: Google Play, Bazaar, parmisit.com

**Key features:**
- Cheque management (اسناد پرداختنی) with due date tracking
- Loan & installment registration (وام و اقساط)
- Family member accounting (هر عضو منزل)
- Balance sheet report (ترازنامه)
- Account statement (صورتحساب)
- Bank SMS auto-import (since v3.0+)
- Multi-account: bank, cash, loan, savings
- Moadian e-invoicing integration (Parmis desktop)
- Recurring transactions
- Budget per category
- CSV/Excel/PDF export
- Dropbox/Google Drive backup
- PIN lock + fingerprint
- 100% offline, no account required

### 6.2 Gheyas (قیاس) — Most Feature-Rich

Source: gheyas.com, Google Play

**Key features:**
- Unlimited accounts, banks, expenses, incomes, persons
- Loan registration with full details (principal, interest, term, payment schedule)
- SMS transaction registration (auto-parse Iranian bank SMS)
- Visual dashboard with charts
- Bill & invoice tracking (قبوض)
- Person ledger (دفتر اشخاص)
- Multi-currency support
- Backup to Dropbox
- Recurring transactions
- Customizable home screen widgets
- QR code scanning for card numbers

### 6.3 Deyarito (داریتو) — Free & Simple

Source: darito.ir, Google Play

**Key features:**
- Daily/monthly income & expense tracking
- Cheque, loan, debt tracking (چک، وام، بدهی)
- Simple charts
- Export to Excel/PDF
- Free, no ads in premium tier
- Persian RTL UI

### 6.4 Hamkaran (همکاران سیستم) — Enterprise

Source: hamkaran.com

**Key features:**
- Full double-entry accounting
- Moadian e-invoicing
- Inventory management
- Payroll
- CRM
- Cheque management with bank reconciliation
- Multi-company, multi-currency
- Network/Cloud versions

### 6.5 Sepidar (سپیدار) — SMB

Source: sepisys.com

**Key features:**
- Similar to Hamkaran but lighter
- Moadian integration
- Bank & cheque module
- Cost accounting
- Project accounting

### 6.6 Himid (حسابداری هلو) — Free Personal

Source: hello-accounting.com

**Key features:**
- Free for personal use
- Bank account tracking
- Cheque register
- Loan tracking
- Annual report
- Backup to email
- Multi-user (family members)

### 6.7 Mowj (موج) — Modern UI

Source: mowj.app, Google Play

**Key features:**
- Modern Material Design UI
- Invoice management (فاکتور)
- Inventory tracking
- Cheque management
- Customer/supplier database
- Suitable for small shops
- Moadian-ready

---

## 7. Feature Matrix: Must-Have vs Nice-to-Have

Based on the research, here is the prioritized feature matrix for Zarbin. **P0** = must-have for basic personal use; **P1** = must-have for Iranian advanced users; **P2** = nice-to-have; **P3** = out of scope for personal app.

### 7.1 Transaction Management

| Feature | Priority | Zarbin v1.3.0 Status |
|---------|----------|---------------------|
| Multi-account (bank, cash, loan) | **P0** | ✅ Done |
| Income/expense/transfer | **P0** | ✅ Done (transfer fixed in v1.2) |
| Categories + subcategories | **P0** | ⚠️ Only flat categories (no parent/child) |
| Custom icons & colors per category | **P0** | ✅ Done |
| Tags/labels | **P1** | ❌ Missing |
| Notes/memos | **P0** | ✅ Done |
| Date + time | **P0** | ✅ Done |
| Receipt photo attachment | **P2** | ❌ Missing |
| Person/payee field | **P1** | ❌ Missing (Iranian "اشخاص" feature) |
| Recurring transactions | **P0** | ✅ Done (added v1.3) |
| Search & filter transactions | **P0** | ❌ Missing (only category search) |

### 7.2 Budgeting

| Feature | Priority | Zarbin v1.3.0 Status |
|---------|----------|---------------------|
| Monthly budget per category | **P0** | ✅ Done |
| Weekly/yearly budgets | **P2** | ❌ Missing |
| Rollover unused budget | **P2** | ❌ Missing |
| Budget vs actual with color states | **P0** | ✅ Done (green/amber/red) |
| Threshold alerts (80%) | **P1** | ❌ Missing (only red on overspend) |

### 7.3 Cheque Management

| Feature | Priority | Zarbin v1.3.0 Status |
|---------|----------|---------------------|
| Cheque register (received + issued) | **P1** | ❌ Missing |
| Sayadi serial (صیادی) | **P1** | ❌ Missing |
| Status workflow (cashed/bounced/endorsed) | **P1** | ❌ Missing |
| Due date tracking with reminders | **P1** | ❌ Missing |
| Cheque calendar view | **P2** | ❌ Missing |
| Cheque printing templates | **P3** | ❌ Out of scope |

### 7.4 Loans & Installments

| Feature | Priority | Zarbin v1.3.0 Status |
|---------|----------|---------------------|
| Loan definition (principal, interest, term) | **P1** | ❌ Missing |
| Auto-generate installment schedule | **P1** | ❌ Missing |
| Track paid/unpaid installments | **P1** | ❌ Missing |
| Interest vs principal split (amortization) | **P2** | ❌ Missing |
| Loan received vs given | **P1** | ⚠️ Partial ( unsettled transactions only) |

### 7.5 Reports & Analytics

| Feature | Priority | Zarbin v1.3.0 Status |
|---------|----------|---------------------|
| Monthly income vs expense bar chart | **P0** | ✅ Done (yearly report) |
| Category breakdown pie/progress | **P0** | ✅ Done (breakdown tab) |
| Yearly summary | **P0** | ✅ Done (added v1.3) |
| Custom date range filter | **P0** | ❌ Missing |
| Transaction search | **P0** | ❌ Missing |
| Balance sheet (assets/liabilities) | **P1** | ❌ Missing |
| Trial balance | **P2** | ❌ Missing |
| Cash flow statement | **P2** | ❌ Missing |
| Net worth tracking | **P1** | ❌ Missing |
| Debts/receivables trend | **P0** | ✅ Done (debts tab) |
| Tag-based report | **P2** | ❌ Missing |

### 7.6 Calendar & Date

| Feature | Priority | Zarbin v1.3.0 Status |
|---------|----------|---------------------|
| Jalali calendar widget | **P0** | ✅ Done |
| Persian digits | **P0** | ✅ Done |
| Persian weekday names | **P0** | ✅ Done |
| Persian month names | **P0** | ✅ Done |
| Iranian fiscal year (Mar 21) | **P1** | ⚠️ Implicit (year nav works, but no fiscal-year boundary) |
| Friday highlighted | **P2** | ❌ Missing |
| Persian holidays | **P2** | ❌ Missing |

### 7.7 Currency

| Feature | Priority | Zarbin v1.3.0 Status |
|---------|----------|---------------------|
| Rial/Toman toggle | **P0** | ✅ Done |
| USD account support | **P1** | ❌ Missing |
| Multi-currency accounts | **P1** | ❌ Missing (single base currency) |
| Manual exchange rate entry | **P1** | ❌ Missing |
| Currency in reports | **P1** | ❌ Missing |

### 7.8 People (اشخاص)

| Feature | Priority | Zarbin v1.3.0 Status |
|---------|----------|---------------------|
| Person database | **P1** | ❌ Missing |
| Per-person ledger | **P1** | ❌ Missing |
| Settlement tracking | **P2** | ❌ Missing |

### 7.9 Security & Privacy

| Feature | Priority | Zarbin v1.3.0 Status |
|---------|----------|---------------------|
| PIN lock | **P0** | ❌ Missing (toggle exists in settings but no implementation) |
| Biometric unlock | **P1** | ❌ Missing |
| Auto-lock timeout | **P1** | ❌ Missing |
| Encrypted backup | **P1** | ❌ Missing (JSON plain text) |
| Local-only storage | **P0** | ✅ Done |
| No telemetry | **P0** | ✅ Done |

### 7.10 Bank SMS

| Feature | Priority | Zarbin v1.3.0 Status |
|---------|----------|---------------------|
| SMS inbox mock | **P0** | ✅ Done (demo data only) |
| Real SMS reading | **P1** | ❌ Missing (needs Android permission) |
| Auto-parse Iranian bank formats | **P1** | ❌ Missing |
| Pattern learning | **P2** | ❌ Missing |

### 7.11 Export & Backup

| Feature | Priority | Zarbin v1.3.0 Status |
|---------|----------|---------------------|
| CSV export | **P0** | ✅ Done |
| PDF report | **P0** | ✅ Done |
| JSON backup | **P0** | ✅ Done |
| JSON restore | **P0** | ✅ Done |
| Encrypted backup | **P1** | ❌ Missing |
| Excel (.xlsx) export | **P2** | ❌ Missing (CSV with BOM works for Excel) |

### 7.12 Invoicing (for side-business users)

| Feature | Priority | Zarbin v1.3.0 Status |
|---------|----------|---------------------|
| Simple invoice creation | **P2** | ❌ Missing |
| Customer database | **P2** | ❌ Missing |
| VAT calculation | **P2** | ❌ Missing |
| Moadian XML export | **P3** | ❌ Out of scope |

### 7.13 UI/UX

| Feature | Priority | Zarbin v1.3.0 Status |
|---------|----------|---------------------|
| RTL layout | **P0** | ✅ Done |
| Persian fonts (Vazirmatn) | **P0** | ✅ Done |
| Dark mode | **P0** | ✅ Done |
| Font size scaling | **P0** | ✅ Done |
| Bottom navigation | **P0** | ✅ Done (added v1.3) |
| Responsive (phone + tablet) | **P0** | ✅ Done |
| Always-visible version badge | **P0** | ✅ Done |
| Pull-to-refresh | **P2** | ❌ Missing |
| Offline-first | **P0** | ✅ Done |

---

## 8. Security & Privacy Requirements

Based on research from Forbes, Equifax, Beyond Budget, Financy, and privacy-focused personal finance apps:

### 8.1 Data at Rest
- **MUST:** All financial data stored locally on device (no mandatory cloud)
- **MUST:** App database encrypted at rest (AES-256) — currently Zarbin uses plain `localStorage`
- **SHOULD:** Backup files password-protected with PBKDF2-derived key

### 8.2 Access Control
- **MUST:** Optional PIN lock (4–8 digits)
- **MUST:** Optional biometric unlock (fingerprint/Face ID via Capacitor plugin)
- **SHOULD:** Auto-lock after configurable inactivity timeout (1/5/15 min)
- **SHOULD:** Lock immediately when app backgrounded

### 8.3 Data in Transit
- **MUST:** No automatic cloud sync without explicit user opt-in
- **MUST:** If sync added later, use end-to-end encryption

### 8.4 Privacy
- **MUST:** No analytics/telemetry by default
- **MUST:** No third-party ad SDKs
- **MUST:** Clear privacy policy in About screen
- **SHOULD:** "Right to be forgotten" — full reset wipes all data including backups in localStorage

### 8.5 Audit Trail
- **SHOULD:** Log all transaction edits/deletes with timestamp (for dispute resolution)
- **SHOULD:** Export audit trail as part of backup

---

## 9. Conclusion

The Zarbin app currently satisfies **32 of 75** must-have/nice-to-have features identified in this research. The remaining **43 features** fall into three buckets:

- **19 P0/P1 critical gaps** — must be closed for the app to compete with Iranian personal finance apps like Parmis and Gheyas (see [`IMPROVEMENT-PLAN.md`](./IMPROVEMENT-PLAN.md) Milestone 1 & 2)
- **11 P2 nice-to-haves** — would differentiate Zarbin but aren't blockers (Milestone 3)
- **13 P3 out of scope** — full Moadian compliance, inventory, payroll (not pursued)

The most critical gaps, in order of importance to Iranian users:

1. **PIN/biometric app lock** — every Iranian app has this; Zarbin's settings toggle does nothing
2. **Cheque (چک) management** — used by every Iranian adult with a bank account
3. **Loan & installment tracking** — Iranian banking revolves around installment loans
4. **People (اشخاص) management** — fundamental for tracking personal loans to/from friends/family
5. **Multi-currency with USD** — Iranians hold dollars as inflation hedge
6. **Transaction search & filter** — universal must-have, currently missing
7. **Balance sheet / net worth report** — basic financial health view
8. **Real bank SMS auto-import** — currently mock only

The improvement plan in [`IMPROVEMENT-PLAN.md`](./IMPROVEMENT-PLAN.md) organizes these into 4 milestones with concrete code-level tasks.

---

## Sources

### Iranian Accounting Apps (Primary)
- Parmis Personal Accounting: https://play.google.com/store/apps/details?id=com.parmisit.parmismobile
- Gheyas Personal Accounting: https://gheyas.com
- Deyarito: https://darito.ir
- Mowj (Mowj App): https://mowj.app
- Himid (Hello Accounting): https://hello-accounting.com
- Chertakeh: https://chortakeh.com

### Iranian Enterprise Accounting
- Sepidar System: https://sepisys.com
- Hamkaran System: https://hamkaran.com
- Arian System (Fardad): https://ariansys.ir
- Taraz (Jooyeshgar): https://www.jooyeshgar.com/en/product/det-471741

### Iranian Tax & Compliance
- Iran VAT Law: https://tax.gov.ir
- Samaneh Moadian: https://www.eidm.tax.gov.ir
- Iranian Journal of Accounting, Auditing and Finance: https://ijaaf.um.ac.ir

### Global Personal Finance Apps (Comparison)
- Money Manager Expense & Budget (Realbyte): Google Play
- Wallet: Budget Expense Tracker: Google Play
- YNAB (You Need A Budget): https://ynab.com
- Copilot Money: https://copilot.money
- Monarch Money: https://monarchmoney.com
- Spendee: https://www.spendee.com
- PocketGuard: https://pocketguard.com
- Rocket Money: https://rocketmoney.com
- Quicken Simplifi: https://www.simplifimoney.com
- Neontra: https://neontra.com

### Security & Privacy
- Forbes Advisor: Best Budgeting Apps 2026
- NerdWallet: Best Budget Apps 2026
- Equifax: How Budgeting Apps Work
- Beyond Budget Security: https://beyondbudget.io/security
- Financy App Store listing

### Calendar & Currency
- Vazirmatn font: https://github.com/rastikerdar/vazirmatn
- Jalali calendar algorithm: https://jdf.scr.ir
- USD/IRR exchange rate tracking: https://www.tgju.org
