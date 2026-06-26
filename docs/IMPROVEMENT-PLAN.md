# Improvement Plan: Zarbin v1.4.0 → v2.0.0

**Date:** 2026-06-29  
**Based on:** [`RESEARCH-REPORT.md`](./RESEARCH-REPORT.md) and [`FEATURE-AUDIT.md`](./FEATURE-AUDIT.md)  
**Goal:** Close the 19 P0/P1 critical gaps and 11 P2 nice-to-haves identified in the audit.

---

## Milestones Overview

| Milestone | Version | Theme | Features | Est. Effort |
|-----------|---------|-------|----------|-------------|
| **M1** | v1.4.0 | Security & Bug Fixes | 7 items | Medium |
| **M2** | v1.5.0 | Iranian Essentials | 6 items (cheques, loans, people, multi-currency, SMS, balance sheet) | Large |
| **M3** | v1.6.0 | Power Features | 6 items (tags, goals, holidays, P2R, receipts, alerts) | Medium |
| **M4** | v2.0.0 | Polish & Performance | Subcategory UI, virtualized list, IndexedDB, tests | Medium |

---

## Milestone 1: v1.4.0 — Security & Bug Fixes

**Goal:** Close critical bugs and the most embarrassing gap (PIN lock toggle that does nothing). This release makes the app trustworthy.

### M1.1 — Implement PIN Lock
**Priority:** P0  
**Files:** `www/js/app.js`, `www/js/store.js`, `www/index.html`, `www/css/app.css`

**Tasks:**
- [ ] Add `state.security = { pinEnabled, pinHash, autoLockMinutes, lastActiveAt }` to store
- [ ] Create `www/js/security.js` module with:
  - `setPin(pin)` — hash with PBKDF2 (Web Crypto API), store hash
  - `verifyPin(pin)` — compare hash
  - `isLocked()` — check if app should be locked (timeout or explicit)
  - `lock()` / `unlock(pin)` — state management
- [ ] Add `www/js/biometric.js` wrapper (uses Capacitor BiometricAuth if available, falls back to PIN)
- [ ] Add lock screen modal in `index.html`:
  - 4-digit PIN pad (Persian digits)
  - "Use biometric" button if available
  - "Forgot PIN" → reset (wipes data with confirmation)
- [ ] Wire up `App.init()` to check `isLocked()` and show lock screen
- [ ] Update sidebar "حالت تاریک" toggle area to include "قفل PIN" and "حسگر زیست‌سنجی" toggles
- [ ] Add auto-lock on `visibilitychange` (app backgrounded) if `autoLockMinutes` elapsed
- [ ] Install `@capacitor-community/biometric-auth` for Android fingerprint

**Acceptance Criteria:**
- User can set a 4-digit PIN from settings
- App locks when backgrounded for > configured minutes
- Lock screen shows PIN pad with Persian digits
- Biometric works on devices with fingerprint sensor
- "Forgot PIN" wipes data after double confirmation

### M1.2 — Fix Transaction Type Inference
**Priority:** P0  
**Files:** `www/js/app.js`

**Tasks:**
- [ ] Change `openTransactionForm(type)` to store the type string directly in a state variable `this.currentFormType = type`
- [ ] Change `handleFormSubmit()` to read `this.currentFormType` instead of parsing the title
- [ ] Map type strings to internal types: `'پرداخت' → 'expense'`, `'دریافت' → 'income'`, `'وام' → 'other'`, `'انتقال' → 'transfer'`
- [ ] Remove reliance on `document.getElementById('formTitle').innerText`

**Acceptance Criteria:**
- Transaction type is determined by the button clicked, not the title text
- Renaming the form title doesn't break type detection

### M1.3 — Fix Budget Category Matching
**Priority:** P0  
**Files:** `www/js/store.js`

**Tasks:**
- [ ] Change `getBudgetSpent(category)` from `t.category.includes(category)` to exact match: `t.category === category`
- [ ] Better: match by category ID — add `categoryId` to budgets and transactions
- [ ] Migration: for existing budgets without ID, look up category by name and assign ID

**Acceptance Criteria:**
- Budget for "خوراک" doesn't accidentally count "خوراک بیرون" transactions

### M1.4 — Add Transaction Search & Filter
**Priority:** P0  
**Files:** `www/js/app.js`, `www/js/render.js`, `www/index.html`

**Tasks:**
- [ ] Add search bar above transaction list in `view-main`
- [ ] Search inputs: note, category, account name (case-insensitive, Persian-normalized)
- [ ] Add filter sheet (collapsible) with:
  - Date range (from/to Jalali date)
  - Account multi-select
  - Category multi-select
  - Type checkboxes (income/expense/other/transfer)
  - Amount range (min/max)
- [ ] Add `App.transactionFilters` state object
- [ ] Update `Render.renderDashboard()` to apply filters before rendering
- [ ] Add "clear filters" button
- [ ] Show filter count badge when filters active

**Acceptance Criteria:**
- User can search "حقوق" and find all salary transactions
- User can filter to "last week, account X, expense only"
- Filter state persists during session

### M1.5 — Add Custom Date Range for Reports
**Priority:** P0  
**Files:** `www/js/app.js`, `www/js/render.js`, `www/index.html`

**Tasks:**
- [ ] Add "بازه زمانی دلخواه" option in `view-goraresh` (reports list)
- [ ] Create date range picker modal (from date / to date, both Jalali)
- [ ] Add `Store.getTransactionsInRange(fromDate, toDate, typeFilter)`
- [ ] Add `Render.renderCustomRangeReport(fromDate, toDate)` showing:
  - Summary cards (income, expense, savings, net)
  - Category breakdown for the range
  - Transaction count
  - Export button (CSV/PDF for this range)

**Acceptance Criteria:**
- User can pick "1405/01/15 to 1405/03/20" and see all transactions in that range
- Report is exportable

### M1.6 — Friday Highlighting in Calendar
**Priority:** P0  
**Files:** `www/js/render.js`

**Tasks:**
- [ ] In `renderDayPicker()`, add `text-red-500` class to Friday (جمعه) cells
- [ ] In `renderCalendarGrid()`, same — Friday cells get red text
- [ ] Add Persian holiday data for major holidays (Nowruz, Sizdah Bedar, religious holidays) — hardcode 10-15 major ones for current year

**Acceptance Criteria:**
- Fridays show in red in both day picker and calendar modal
- Major Persian holidays show with a dot indicator

### M1.7 — Make Fiscal Year Explicit
**Priority:** P0  
**Files:** `www/js/render.js`, `www/js/app.js`

**Tasks:**
- [ ] In `renderYearlyReport()`, add header "سال مالی ۱۴۰۵ (۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹)"
- [ ] Add note: "سال مالی ایران از ۱ فروردین شروع می‌شود"
- [ ] Ensure year navigation increments the fiscal year (which equals Jalali year)

**Acceptance Criteria:**
- Reports clearly show Iranian fiscal year boundaries

---

## Milestone 2: v1.5.0 — Iranian Essentials

**Goal:** Add the features that every Iranian personal finance app has. This is the release that makes Zarbin competitive with Parmis and Gheyas.

### M2.1 — Cheque (چک) Management Module
**Priority:** P1  
**Files:** New `www/js/cheque.js`, `www/js/app.js` (add methods), `www/index.html` (add views), `www/js/store.js` (add `state.cheques`)

**Data Model:**
```js
state.cheques = [{
  id, type: 'received' | 'issued',
  sayadiSerial,         // 16-digit صیادی
  chequeNumber,
  bank: 'بانک ملت' | 'بانک مelli' | ...,
  amount,
  issueDate,            // Jalali YYYY/MM/DD
  dueDate,              // سررسید
  status: 'registered' | 'cashed' | 'bounced' | 'endorsed' | 'cancelled',
  account,              // affected account
  payee,                // person name
  note,
  bouncedReason,
  createdAt, updatedAt
}]
```

**UI:**
- [ ] New bottom nav entry (replace "More" with 5 icons: Home, Reports, **Cheques**, Categories, More)
- [ ] Cheque list view with tabs: دریافتی / پرداختی / تقویم سررسید
- [ ] "Add cheque" form with all fields + bank dropdown (20 Iranian banks)
- [ ] Cheque calendar view (upcoming due dates in next 30 days)
- [ ] Cheque details modal with status workflow buttons:
  - registered → cashed (وصول شد)
  - registered → bounced (برگشت خورد)
  - received → endorsed (واگذاری)
  - any → cancelled (ابطال)
- [ ] When cheque is cashed, auto-create a transaction in the linked account

**Acceptance Criteria:**
- User can record a received cheque with Sayadi serial, due date, bank
- Cheque appears in calendar of upcoming dues
- Marking cheque as "cashed" credits/debits the linked account
- Bounced cheques are visually flagged

### M2.2 — Loan & Installment Module
**Priority:** P1  
**Files:** New `www/js/loan.js`, `www/index.html`, `www/js/store.js`

**Data Model:**
```js
state.loans = [{
  id, type: 'received' | 'given',
  principal, annualInterestRate, termMonths, startDate,
  installmentAmount,    // calculated
  numberOfInstallments,
  account,
  counterparty,         // person or bank name
  note,
  installments: [{
    id, number, dueDate, amount,
    principalPart, interestPart,
    status: 'pending' | 'paid' | 'late',
    paidDate
  }],
  status: 'active' | 'completed' | 'defaulted'
}]
```

**UI:**
- [ ] Loans view in "More" menu
- [ ] "Add loan" form: type, principal, rate, term, start date, account, counterparty
- [ ] Auto-generate installment schedule on save (amortization formula)
- [ ] Loans list with summary cards (total borrowed, total paid, remaining)
- [ ] Per-loan detail view: installment table, "Pay installment" button
- [ ] Paying an installment creates a transaction in the linked account
- [ ] Reminders for upcoming installment due dates

**Acceptance Criteria:**
- User can record a bank loan with 12% interest, 24 months, auto-generates 24 installments
- Each installment shows principal vs interest split
- Paying an installment debits the account and marks it paid
- Loan status auto-changes to "completed" when all installments paid

### M2.3 — People (اشخاص) Module
**Priority:** P1  
**Files:** New `www/js/persons.js`, `www/index.html`, `www/js/store.js`

**Data Model:**
```js
state.persons = [{
  id, name, phone, email, photo (data URL), relationship,
  notes, createdAt
}]
state.transactions[i].personId  // optional reference
```

**UI:**
- [ ] Persons view in "More" menu
- [ ] "Add person" form: name, phone, email, relationship (friend/family/colleague/other)
- [ ] Persons list with search
- [ ] Per-person ledger: all transactions involving them
- [ ] Person balance summary: total lent, total borrowed, net
- [ ] "Settle up" action: creates offsetting transaction to zero the balance
- [ ] Optional person field in transaction form (autocomplete from persons list)

**Acceptance Criteria:**
- User can add "علی احمدی" as a person
- Lend 500,000 to them → transaction with `personId`
- Person ledger shows the debt
- "Settle up" creates a repayment transaction

### M2.4 — Multi-Currency Support
**Priority:** P1  
**Files:** `www/js/store.js`, `www/js/render.js`, `www/js/app.js`, `www/index.html`

**Data Model Changes:**
```js
state.currencies = [{
  code: 'IRR', symbol: 'ریال', name: 'ریال ایران', isBase: true
}, {
  code: 'USD', symbol: '$', name: 'دلار آمریکا', rateToBase: 1380000  // user-set
}, {
  code: 'EUR', symbol: '€', name: 'یورو', rateToBase: 1500000
}, {
  code: 'AED', symbol: 'د.ا', name: 'درهم امارات', rateToBase: 376000
}]
state.accounts[name].currency = 'IRR' | 'USD' | ...
state.accounts[name].balance  // in account's currency
state.displayCurrency = 'IRR' | 'USD' | ...  // for reports
```

**UI:**
- [ ] Currency management in Settings: list, add, edit rate
- [ ] Per-account currency selector in account creation form
- [ ] "Display currency" toggle in header (next to Rial/Toman toggle)
- [ ] All amounts rendered with currency code suffix
- [ ] Reports convert all balances to display currency using current rates
- [ ] Exchange rate update reminder (manual, not auto-fetch — Iranian rates are unofficial)

**Acceptance Criteria:**
- User can create a "حساب دلاری" account with USD currency
- Balance shows as "1,000 $" not "1,380,000,000 ریال"
- Yearly report converts everything to display currency with a note about exchange rate
- User can manually update the USD rate

### M2.5 — Real Bank SMS Auto-Import
**Priority:** P1  
**Files:** New Capacitor plugin integration, `www/js/sms.js`

**Tasks:**
- [ ] Install `@capacitor-community/sms` or `cordova-plugin-sms` (or build custom plugin)
- [ ] Add `RECEIVE_SMS` permission to `AndroidManifest.xml`
- [ ] Create `www/js/sms-parser.js` with regex patterns for major Iranian banks:
  - بانک ملت, ملی, سدرات, تجارت, سپه, کشاورزی, مسکن, پاسارگاد, سامان, پارسیان, آینده, رسالت, شهر, سرمایه, تات, post bank
- [ ] Each pattern extracts: amount, card number, balance, date/time, transaction type (برداشت/واریز)
- [ ] On app launch (with permission), fetch unread bank SMS
- [ ] Show in SMS inbox with "auto-detected" badge
- [ ] User confirms → transaction auto-created with mapped account (by card number)

**Acceptance Criteria:**
- App requests SMS permission on first use
- Real bank SMS appears in inbox (not just mock data)
- Card number → account mapping is configurable
- User can disable SMS reading in settings

### M2.6 — Balance Sheet / Net Worth Report
**Priority:** P1  
**Files:** `www/js/render.js`, `www/index.html`

**Tasks:**
- [ ] Add "ترازنامه" option in reports list
- [ ] `Render.renderBalanceSheet()`:
  - Assets section: all accounts with positive balance, grouped by type (cash, bank, USD, etc.)
  - Liabilities section: all accounts with negative balance, plus unsettled debts
  - Net worth = Assets − Liabilities
  - Comparison to last month (delta indicator)
- [ ] Historical net worth chart (line chart, last 12 months)

**Acceptance Criteria:**
- User sees total assets, total liabilities, net worth
- Chart shows net worth trend over time

---

## Milestone 3: v1.6.0 — Power Features

**Goal:** Differentiators that make Zarbin better than competitors.

### M3.1 — Tags/Labels
**Priority:** P2  
- Add `tags: []` to transactions
- Tag input in transaction form (autocomplete + create new)
- Tag filter in transaction list
- Tag-based report

### M3.2 — Savings Goals
**Priority:** P2  
- `state.goals = [{ id, name, targetAmount, currentAmount, deadline, account, icon }]`
- Goals view with progress bars
- "Contribute to goal" action (creates a transfer transaction)
- Goal completion celebration

### M3.3 — Persian Holidays in Calendar
**Priority:** P2  
- Hardcode 30+ major Persian holidays for current year
- Show with red dot in calendar
- Holiday name tooltip on tap

### M3.4 — Pull-to-Refresh
**Priority:** P2  
- Add touch gesture detection on transaction list
- Pull down > 60px triggers `Render.renderDashboard()`
- Show refresh indicator

### M3.5 — Receipt Photo Attachment
**Priority:** P2  
- Add camera button in transaction form
- Use Capacitor Camera plugin
- Store photo as data URL in transaction (base64 JPEG, max 100KB)
- Thumbnail in transaction list, full image on tap

### M3.6 — Budget Threshold Alerts
**Priority:** P2  
- When budget hits 80%, show yellow toast notification
- When budget hits 100%, show red toast + notification
- Use Capacitor Local Notifications for background alerts

---

## Milestone 4: v2.0.0 — Polish & Performance

**Goal:** Architecture improvements for scale and maintainability.

### M4.1 — Subcategory UI
**Priority:** P1 (deferred from M2)  
- Expose parent/child relationship in category form
- Category list shows as tree
- Transaction form groups subcategories under parent

### M4.2 — Virtualized Transaction List
**Priority:** P2  
- Only render visible transactions + buffer
- Smooth scroll for 10,000+ transactions
- Use `IntersectionObserver` for windowing

### M4.3 — IndexedDB Migration (Optional)
**Priority:** P2  
- If user has > 5,000 transactions, offer migration to IndexedDB
- Transparent fallback to localStorage for small datasets
- IndexedDB allows up to ~50MB per origin

### M4.4 — Schema Versioning & Migrations
**Priority:** P1  
- Add `state.schemaVersion` (separate from app version)
- Migration functions: `migrate_1_to_2(state)`, `migrate_2_to_3(state)`, etc.
- Run on `Store.init()` before any reads

### M4.5 — Unit Tests
**Priority:** P2  
- Add Vitest or Jest
- Test `JalaliDate` conversion (especially edge cases: leap years, month boundaries)
- Test `Store` methods (addTransaction, deleteTransaction, transfer logic)
- Test `Render.formatMoney` (Rial/Toman conversion, Persian digits)
- Target 60% coverage on core modules

### M4.6 — Error Boundaries
**Priority:** P1  
- Wrap all render functions in try/catch
- Show error toast + fallback UI on render failure
- Log errors to `state.errorLog` for debugging

---

## Implementation Order

### Sprint 1 (Week 1): M1.1, M1.2, M1.3, M1.6, M1.7
Quick wins: PIN lock + 3 bug fixes + Friday highlighting + fiscal year label.

### Sprint 2 (Week 2): M1.4, M1.5
Transaction search/filter + custom date range reports.

### Sprint 3 (Week 3-4): M2.1
Cheque management — biggest single feature, needs its own sprint.

### Sprint 4 (Week 5): M2.2, M2.3
Loans & installments + people management (related: both involve counterparty tracking).

### Sprint 5 (Week 6): M2.4
Multi-currency — touches every part of the app, needs careful testing.

### Sprint 6 (Week 7): M2.5, M2.6
Real SMS import + balance sheet report.

### Sprint 7 (Week 8-9): M3.1–M3.6
Power features (tags, goals, holidays, P2R, receipts, alerts).

### Sprint 8 (Week 10): M4.1, M4.4, M4.6
Subcategory UI + schema versioning + error boundaries.

### Sprint 9 (Week 11): M4.2, M4.3, M4.5
Performance + tests.

---

## Release Strategy

Each milestone ships as a GitHub release with:
1. New APK attached (`zarbin-v{VERSION}.apk`)
2. Release notes referencing this plan
3. Version bump in `store.js`, `package.json`, `manifest.json`, `app/build.gradle`
4. Updated version history table in README.md
5. APK size verification (target: stay under 7 MB)

---

## Success Metrics

After v2.0.0, the app should achieve:
- **Feature coverage:** 70+ of 80 identified features (up from 28)
- **APK size:** < 7 MB
- **App startup time:** < 300ms
- **Transaction list render (1,000 txs):** < 100ms
- **No critical bugs** (PIN works, transfer logic correct, no data loss on schema changes)
- **Iranian feature parity** with Parmis/Gheyas: cheques ✓, loans ✓, people ✓, SMS ✓, multi-currency ✓
- **Security:** PIN lock ✓, encrypted backup ✓, biometric ✓

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SMS plugin breaks on Android 14 | Medium | High | Test on API 34, fallback to manual entry |
| Multi-currency migration corrupts existing data | Medium | Critical | Schema versioning + migration tests + backup before upgrade |
| Cheque module too complex for v1.5 | Medium | Medium | Can defer to v1.6 if needed |
| Biometric plugin incompatible with old Android | Low | Low | Feature-detect at runtime, fall back to PIN |
| IndexedDB migration loses data | Low | Critical | Keep localStorage copy until IndexedDB verified |
| APK size grows with new features | Medium | Low | Monitor, use WebP for any new images, enable R8 shrinking |

---

## Conclusion

This plan takes Zarbin from a solid v1.3.0 (37% feature coverage) to a competitive v2.0.0 (~88% coverage) over 11 weeks of focused work. The most impactful single feature is the **cheque management module** (M2.1), which is the #1 reason Iranian users currently choose Parmis/Gheyas over generic apps.

The plan is intentionally conservative about scope: it does NOT pursue full Moadian compliance, double-entry accounting, or inventory — those are enterprise features that belong in a different product. Zarbin remains a **personal finance app**, but one that fully understands Iranian users' needs.
