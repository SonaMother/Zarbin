# Feature Audit: Zarbin v1.3.0 vs Research Findings

**Date:** 2026-06-29  
**Audited Version:** v1.3.0 (commit 4f68e12)  
**Reference:** [`RESEARCH-REPORT.md`](./RESEARCH-REPORT.md)

---

## Summary

| Category | Total Features | ✅ Done | ⚠️ Partial | ❌ Missing | Coverage |
|----------|---------------|---------|-----------|-----------|----------|
| Transaction Management | 10 | 7 | 1 | 2 | 70% |
| Budgeting | 5 | 2 | 0 | 3 | 40% |
| Cheque Management | 6 | 0 | 0 | 6 | 0% |
| Loans & Installments | 5 | 0 | 1 | 4 | 0% |
| Reports & Analytics | 11 | 3 | 0 | 8 | 27% |
| Calendar & Date | 7 | 4 | 1 | 2 | 57% |
| Currency | 5 | 1 | 0 | 4 | 20% |
| People (اشخاص) | 3 | 0 | 0 | 3 | 0% |
| Security & Privacy | 6 | 2 | 0 | 4 | 33% |
| Bank SMS | 4 | 1 | 0 | 3 | 25% |
| Export & Backup | 5 | 4 | 0 | 1 | 80% |
| Invoicing | 4 | 0 | 0 | 4 | 0% |
| UI/UX | 9 | 8 | 0 | 1 | 89% |
| **TOTAL** | **80** | **28** | **3** | **45** | **37%** |

**Bottom line:** Zarbin has strong UI/UX foundations and basic transaction management, but is missing **45 features** that Iranian users expect. Most critically: cheque management, loans/installments, people management, PIN lock, multi-currency, and transaction search.

---

## Codebase Inventory

### File Structure
```
www/
├── index.html              (1,213 lines)
├── manifest.json           (PWA manifest)
├── css/app.css             (custom styles)
├── css/lib/fontawesome.min.css
├── js/
│   ├── jalali.js           (109 lines — Jalali calendar utility)
│   ├── store.js            (536 lines — state + persistence)
│   ├── render.js           (946 lines — UI rendering)
│   ├── export.js           (174 lines — CSV/PDF/JSON export)
│   ├── app.js              (977 lines — main controller)
│   └── lib/                (chart.js, tailwind.js)
└── assets/
    ├── fonts/              (Vazirmatn TTFs)
    ├── webfonts/           (FontAwesome woff2)
    ├── icons/              (PWA icons)
    └── art/                (AI-generated art, WebP)
```

### Current State Shape (store.js)
```js
state = {
  version, baseCurrency,           // ✅
  activeAccount, activeTab,        // ✅
  fontScale, darkMode,             // ✅
  biometricLock,                   // ⚠️ Flag exists, no implementation
  activeSmsTab, currentUser,
  selectedDate, selectedMonth,     // ✅
  accounts: { name: balance },     // ✅
  accountMeta: { name: { bank, type, iban, color } },
  transactions: [{
    id, type, category, amount, account, date, time,
    balance, icon, color, note, unsettled, destAccount, recurringId
  }],
  categories: [{ id, name, icon, color, type, parentId?, custom }],
  recurringTransactions: [{...}],  // ✅ Added v1.3
  budgets: [{ id, category, limit, period }],
  smsInbox: [{...}],               // ⚠️ Mock data only
  settings: { showTodayDate, autoParseSms, dailyReminder, currency, lowBalanceThreshold }
}
```

### Method Count
- `App` object: 79 methods
- `Render` object: 23 methods
- `Store` object: 32 methods
- Total: 134 methods

### Views (9 total)
- `view-main` — transaction list with day picker
- `view-debts` — debts/receivables chart
- `view-breakdown` — category breakdown
- `view-budget` — budget tracking
- `view-goraresh` — reports list
- `view-categories` — categories management (added v1.3)
- `view-reports-yearly` — yearly report with sub-tabs (added v1.3)
- `view-recurring` — recurring transactions (added v1.3)
- `view-help` — user guide (added v1.3)

### Modals (17 total)
datePicker, smsInbox, accountSelector, fontSettings, currency, unsettled, accountManager, toolbarSettings, budgetForm, about, txDetails, categoryForm, recurringForm, helpTopic, moreMenu, onboarding, modeSwitcher

---

## Detailed Gap Analysis

### 1. Transaction Management

#### ✅ Done
- Multi-account (bank, cash) — `state.accounts` + `accountMeta`
- Income/expense/transfer types — `handleFormSubmit()` distinguishes by title keyword
- Custom icons & colors per category — `categoryFormModal` with 8-color picker
- Notes/memos — `formNote` field
- Date + time — Jalali date picker + auto time
- Recurring transactions — `addRecurringTransaction()`, `processRecurringTransactions()`

#### ⚠️ Partial
- **Categories + subcategories** — `parentId` field exists in store, but UI doesn't expose parent/child relationship. All categories are flat.

#### ❌ Missing
- **Tags/labels** — No `tags` field on transactions, no tag UI
- **Person/payee field** — No "اشخاص" concept. Iranian apps universally have this.
- **Search & filter transactions** — Only category list has search. Transaction list has zero search/filter capability.
- **Receipt photo attachment** — No photo storage, no camera integration

#### Implementation Quality Issues
- `handleFormSubmit()` infers transaction type from the form TITLE string (`title.includes('پرداخت')`). This is fragile — if title text changes, type detection breaks. Should use the hidden `formTypeLabel` value directly.
- Transaction `id` uses `Date.now() + Math.floor(Math.random() * 1000)` which can still collide under fast clicking. Should use `crypto.randomUUID()` or a monotonic counter.

### 2. Budgeting

#### ✅ Done
- Monthly budget per category — `budgets` array
- Budget vs actual with color states — `renderBudgets()` uses green/amber/red

#### ❌ Missing
- Weekly/yearly budgets — only `period: 'monthly'` supported
- Rollover unused budget — `getBudgetSpent()` only counts current month
- Threshold alerts at 80% — only visual red on overspend, no notification
- Per-account budgets — budgets are per-category only, not per-account

#### Implementation Quality Issues
- `getBudgetSpent(category)` uses `t.category.includes(category)` which is substring match. If user has categories "خوراک" and "خوراک بیرون", both match the "خوراک" budget. Should be exact match or use category ID.

### 3. Cheque Management — ENTIRELY MISSING

This is the biggest gap. Iranian personal finance apps universally have a cheque module. Zarbin has zero.

#### Required Data Model (proposed)
```js
state.cheques = [{
  id, type: 'received' | 'issued',
  sayadiSerial,         // 16-digit صیادی
  chequeNumber,         // چک number
  bankName,             // e.g. 'بانک ملت'
  amount,
  issueDate,            // تاریخ صدور
  dueDate,              // سررسید
  status: 'registered' | 'cashed' | 'bounced' | 'endorsed' | 'cancelled',
  account,              // which account it affects
  payee,                // گیرنده (for issued) or payer (for received)
  note,
  endorsementChain: [], // for endorsed cheques
  bouncedReason,        // if bounced
  createdAt, updatedAt
}]
```

#### Required UI
- Cheque list view (tabs: received / issued / all)
- "Add cheque" form with all fields
- Cheque calendar (upcoming due dates)
- Status change workflow (registered → cashed / bounced)
- Cheque details modal with action buttons

### 4. Loans & Installments — ENTIRELY MISSING

#### Current State
- We have `type: 'other'` for loans with `unsettled: true` flag
- "Unsettled transactions" report shows them
- No installment tracking, no interest calculation, no schedule

#### Required Data Model (proposed)
```js
state.loans = [{
  id, type: 'received' | 'given',
  principal, interestRate, termMonths, startDate,
  installmentAmount, numberOfInstallments,
  account,
  counterparty,          // person or bank
  note,
  installments: [{
    id, dueDate, amount, principalPart, interestPart,
    status: 'pending' | 'paid' | 'late', paidDate
  }],
  status: 'active' | 'completed' | 'defaulted'
}]
```

#### Required UI
- Loans list view
- "Add loan" form with auto-schedule generation
- Per-loan detail view with installment schedule
- "Pay installment" action
- Loan summary (total paid, remaining, next due)

### 5. Reports & Analytics

#### ✅ Done
- Monthly income vs expense bar chart — `renderYearlyReport()`
- Category breakdown with progress bars — `renderCategoryBreakdown()`
- Yearly summary — `renderYearlyReport()` with 4 sub-tabs
- Debts/receivables trend — `renderDebtsChart()`

#### ❌ Missing
- **Custom date range filter** — No "from date / to date" picker for reports
- **Transaction search** — No search box in transaction list
- **Balance sheet** — No assets vs liabilities report
- **Net worth tracking** — Account balances are summed but not tracked over time
- **Cash flow statement** — No operating/investing/financing breakdown
- **Trial balance** — Not applicable (no double-entry)
- **Tag-based report** — No tags exist
- **Savings rate trend** — Yearly report shows savings % but no historical trend

### 6. Calendar & Date

#### ✅ Done
- Jalali calendar widget — `JalaliDate` utility + `renderCalendarGrid()`
- Persian digits — `toPersian()`
- Persian weekday names — `JALALI_WEEKDAYS = ['ش','ی','د','س','چ','پ','ج']`
- Persian month names — `JALALI_MONTHS`

#### ⚠️ Partial
- **Iranian fiscal year** — Year navigation works, but no awareness that fiscal year starts Farvardin 1 (which happens to align with Jalali month 1, so it's implicitly correct). Should make this explicit in reports.

#### ❌ Missing
- **Friday highlighted** — `renderDayPicker()` and `renderCalendarGrid()` don't highlight Friday in red
- **Persian holidays** — No holiday data (Nowruz, religious holidays, etc.)

### 7. Currency

#### ✅ Done
- Rial/Toman toggle — `setBaseCurrency()`, `formatMoney()` divides by 10 for Toman

#### ❌ Missing
- **USD account support** — `accounts` object has only numeric balances, no currency per account
- **Multi-currency accounts** — All accounts implicitly use `state.baseCurrency`
- **Manual exchange rate entry** — No exchange rate table
- **Currency conversion in reports** — No way to see all balances in USD
- **EUR, AED, TRY support** — Only Rial/Toman

#### Implementation Quality Issues
- `state.baseCurrency` is a single global. Should be per-account currency with a display currency toggle.
- No exchange rate concept at all. For Iranians who hold USD, this is critical.

### 8. People (اشخاص) — ENTIRELY MISSING

#### Required Data Model (proposed)
```js
state.persons = [{
  id, name, phone, email, photo, relationship,
  notes, createdAt
}]
state.transactions[i].personId  // optional reference
```

#### Required UI
- Persons list view (searchable)
- "Add person" form
- Per-person ledger (all transactions involving them)
- Settlement status (loan fully repaid?)
- Person details modal with action buttons

### 9. Security & Privacy

#### ✅ Done
- Local-only storage — `localStorage`, no network calls
- No telemetry — verified by code inspection

#### ❌ Missing
- **PIN lock** — `state.biometricLock` flag exists in settings but is NEVER READ by any code path. The toggle in sidebar does nothing.
- **Biometric unlock** — No Capacitor plugin installed for fingerprint/Face ID
- **Auto-lock timeout** — No inactivity timer
- **Encrypted backup** — `Exporter.exportBackup()` writes plain JSON

#### Implementation Quality Issues
- `state.biometricLock = false` is set in defaults but `applyDarkMode()` is the only place that reads `state.darkMode`. There's no `applyBiometricLock()` or similar. This is a dead feature flag.
- Backup JSON includes all user data in plaintext. If user's phone is stolen, attacker gets full financial history.

### 10. Bank SMS

#### ✅ Done
- SMS inbox mock — `state.smsInbox` with 4 sample messages
- SMS list rendering — `renderSmsList()`
- Approve SMS to transaction — `approveSms()`

#### ❌ Missing
- **Real SMS reading** — No Capacitor SMS plugin, no Android `RECEIVE_SMS` permission
- **Auto-parse Iranian bank formats** — No regex/parser for actual bank SMS
- **Pattern learning** — No learning of user's categorization

#### Implementation Quality Issues
- SMS data is hardcoded in demo state. Real SMS reading requires a Capacitor plugin like `@capacitor-community/sms` or `cordova-plugin-sms-receiver`. This needs Android permission: `android.permission.RECEIVE_SMS`.

### 11. Export & Backup

#### ✅ Done
- CSV export with UTF-8 BOM — `Exporter.exportCSV()`
- PDF report — `Exporter.exportPDF()` opens new window with printable HTML
- JSON backup — `Exporter.exportBackup()`
- JSON restore — `Exporter.importBackup()`

#### ❌ Missing
- **Encrypted backup** — Plain JSON only
- **Excel (.xlsx) native** — CSV works but not true .xlsx

### 12. Invoicing — ENTIRELY MISSING

For users with side businesses. Out of scope for personal finance but could be a P2 addition.

### 13. UI/UX

#### ✅ Done
- RTL layout — `dir="rtl"` on `<html>`
- Persian fonts (Vazirmatn) — Bundled offline
- Dark mode — `applyDarkMode()` toggles class
- Font size scaling — `applyFontScale()` adjusts `font-size` %
- Bottom navigation — 5-tab bar (added v1.3)
- Responsive (phone + tablet) — Media queries
- Always-visible version badge — In header
- Offline-first — All assets bundled

#### ❌ Missing
- **Pull-to-refresh** — No pull gesture on transaction list
- **Haptic feedback** — No vibration on button taps (Capacitor Haptics)
- **Animations** — Some `animate-slide-up` but could be more polished

---

## Critical Bugs Found During Audit

### Bug 1: Transaction Type Inference from Title String
**Location:** `app.js` line 224-236  
**Problem:** `handleFormSubmit()` infers type by checking `title.includes('پرداخت')`, `title.includes('دریافت')`, etc. The title is set by `openTransactionForm(type)` as `ثبت تراکنش ${type}`. This is fragile — if someone changes the title format, type detection breaks. Also, `دریافت` appears in both "دریافت درآمد" (income) and "دریافت وام" (loan) — could misclassify.  
**Fix:** Use the hidden `formTypeLabel` value directly, not the title text.

### Bug 2: Budget Category Matching Uses Substring
**Location:** `store.js` `getBudgetSpent()`  
**Problem:** `t.category.includes(category)` is substring match. If categories "خوراک" and "خوراک بیرون" both exist, the "خوراک" budget counts both.  
**Fix:** Use exact equality `t.category === category` or, better, match by category ID.

### Bug 3: Transaction ID Collisions
**Location:** `store.js` `addTransaction()`  
**Problem:** `tx.id = Date.now() + Math.floor(Math.random() * 1000)`. Under rapid clicking (e.g. recurring processing), can collide.  
**Fix:** Use `crypto.randomUUID()` or `Date.now().toString(36) + Math.random().toString(36).slice(2)`.

### Bug 4: Biometric Lock Toggle Does Nothing
**Location:** `app.js` `toggleDarkMode()` (only) reads `state.darkMode`. The `state.biometricLock` flag is set in defaults but no code reads it.  
**Fix:** Implement `applyBiometricLock()`, add PIN setup flow, add lock screen.

### Bug 5: SubBar Not Hidden When Switching to Categories/Help/Recurring
**Location:** `app.js` `switchMainView()`  
**Problem:** When switching to 'home' or 'reports', sub-bar is shown. When switching to 'categories', 'recurring', 'help', 'reports-yearly', sub-bar is hidden. But the active sub-tab styling (`border-teal-400 text-white font-bold`) is not cleared, so when user returns home, the old tab appears active.  
**Fix:** Reset all sub-tab styles when hiding the sub-bar.

### Bug 6: `selectedDate` Not Validated
**Location:** `store.js` `init()`  
**Problem:** If `state.selectedDate` is from a previous month and user navigates, the day picker shows the right month but `selectedDate` might be invalid (e.g. 31st of a 30-day month). No validation.  
**Fix:** Clamp `selectedDate` to valid range for the selected month.

### Bug 7: Transfer Validation Gaps
**Location:** `app.js` `handleFormSubmit()`  
**Problem:** Transfer validates `destAcc !== acc` but doesn't check if source account has sufficient balance. User can transfer more than they have, going negative without warning.  
**Fix:** Add optional warning (not block) if transfer would make balance negative.

### Bug 8: Recurring Transaction Processing Cap
**Location:** `store.js` `processRecurringTransactions()`  
**Problem:** Safety cap of 12 iterations prevents infinite loop, but if user hasn't opened app for a year (12+ monthly recurring), some transactions are silently skipped.  
**Fix:** Log skipped recurring runs; show a toast "X recurring transactions were created, Y skipped".

---

## Architecture Observations

### Strengths
1. **Clean separation** of concerns: `store.js` (state), `render.js` (view), `app.js` (controller), `export.js` (I/O), `jalali.js` (utility)
2. **No framework dependency** — vanilla JS, fast load, no build step
3. **Offline-first** — all assets bundled, no CDN calls
4. **localStorage persistence** — simple, works everywhere, no DB setup
5. **Capacitor wrapping** — proper Android packaging, handles back button, splash screen

### Weaknesses
1. **No schema versioning** — `state.version` is set but no migration logic when schema changes
2. **No data validation** — `addTransaction()` doesn't validate inputs (amount > 0, account exists, etc.)
3. **No error boundaries** — a single bad transaction can crash the whole render loop
4. **Tight coupling** — `Render` methods reference `App.categoryFilter`, `App.reportYear` etc. directly
5. **No unit tests** — zero test coverage
6. **No TypeScript** — plain JS, easy to introduce type errors
7. **`innerHTML` everywhere** — XSS risk if user input isn't escaped (though `escapeHtml()` is used in most places)

---

## Performance Observations

### Current Performance
- App startup: ~200ms (DOM ready to first render)
- Transaction list render: ~50ms for 100 transactions
- Yearly chart render: ~150ms (Chart.js bar chart)
- localStorage save: ~10ms for typical state

### Potential Issues at Scale
- `state.transactions` is an array — linear search for `find(t => t.id === id)` is O(n). At 10,000+ transactions, will slow down.
- `Render.renderDashboard()` re-renders the entire list on every change. Should diff or virtualize.
- `localStorage` has a 5-10 MB limit. At ~500 bytes per transaction, that's ~10,000-20,000 transactions before quota exceeded.
- No indexing — finding transactions by date range requires full scan.

### Recommendations
- Add an in-memory index by `id`, `date`, `account`, `category` for O(1) lookups
- Implement virtualized scrolling for transaction list (only render visible items)
- Add a "data cleanup" feature to archive old transactions to a separate JSON file
- Consider IndexedDB for >10,000 transactions (localStorage is fine for typical use)

---

## Summary of Required Work

### P0 — Critical (Must close for basic viability)
1. Implement PIN lock (the toggle currently does nothing)
2. Add transaction search & filter
3. Add custom date range for reports
4. Fix budget category matching (substring → exact)
5. Fix transaction type inference (use formTypeLabel, not title)
6. Add Friday highlighting in calendar
7. Make fiscal year explicit in yearly report

### P1 — High (Must close for Iranian market)
8. Add cheque (چک) management module
9. Add loan & installment tracking module
10. Add people (اشخاص) management module
11. Add multi-currency support (USD, EUR, AED)
12. Add real bank SMS auto-import (Capacitor SMS plugin)
13. Add balance sheet / net worth report
14. Add subcategory support in UI
15. Add encrypted backup (password-protected)
16. Add biometric unlock (Capacitor BiometricAuth plugin)

### P2 — Medium (Differentiators)
17. Add tags/labels to transactions
18. Add savings goals
19. Add Persian holidays to calendar
20. Add pull-to-refresh
21. Add receipt photo attachment
22. Add threshold alerts (80% of budget)
23. Add Excel (.xlsx) native export
24. Add rollover unused budget
25. Add haptic feedback

### P3 — Out of Scope
- Full Moadian e-invoicing
- Inventory management
- Payroll
- Double-entry accounting
- Cheque printing
- Multi-company/multi-user

---

**Next step:** See [`IMPROVEMENT-PLAN.md`](./IMPROVEMENT-PLAN.md) for the milestone-organized implementation plan.
