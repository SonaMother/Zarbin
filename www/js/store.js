/* ============================================
   Zarbin - State Management & Persistence
   مدیریت حالت و ذخیره‌سازی
   ============================================ */

const APP_VERSION = '1.3.0';
const APP_BUILD = '20260629';
const STORAGE_KEY = 'zarbin_state_v1';
const FIRST_RUN_KEY = 'zarbin_first_run_done';

// Demo state - rich sample data shown when user picks "Demo Mode"
function getDemoState() {
  const today = JalaliDate.today();
  const todayStr = `${String(today[0]).padStart(4, '0')}/${String(today[1]).padStart(2, '0')}/${String(today[2]).padStart(2, '0')}`;
  // Yesterday in Jalali: convert to Greg, subtract 1 day, convert back
  const [gY, gM, gD] = JalaliDate.jalaliToGregorian(today[0], today[1], today[2]);
  const yd = new Date(gY, gM - 1, gD - 1);
  const [jy2, jm2, jd2] = JalaliDate.gregorianToJalali(yd.getFullYear(), yd.getMonth() + 1, yd.getDate());
  const yesterday = `${String(jy2).padStart(4, '0')}/${String(jm2).padStart(2, '0')}/${String(jd2).padStart(2, '0')}`;

  return {
    version: APP_VERSION,
    baseCurrency: 'ریال',
    activeAccount: 'حساب ۴۰۰۱۰۰',
    activeTab: 'main',
    fontScale: 100,
    darkMode: false,
    biometricLock: false,
    activeSmsTab: 'bank',
    currentUser: 'کاربر زرین',
    selectedDate: todayStr,
    selectedMonth: { jy: today[0], jm: today[1] },
    accounts: {
      'حساب ۴۰۰۱۰۰': 573686654,
      'حساب ۷۰۰۱۰۱': -100000000,
      'جیب': 12000000,
      'ملت سهروردی': 8000000,
      'شعبه شریعتی': 0
    },
    accountMeta: {
      'حساب ۴۰۰۱۰۰': { bank: 'بانک شهر', type: 'bank', iban: '001234567890', color: '#1e40af' },
      'حساب ۷۰۰۱۰۱': { bank: 'بانک شهر', type: 'bank', iban: '', color: '#1e40af' },
      'جیب': { bank: '', type: 'cash', iban: '', color: '#0f766e' },
      'ملت سهروردی': { bank: 'بانک ملت', type: 'bank', iban: '9876543210', color: '#7c2d12' },
      'شعبه شریعتی': { bank: 'بانک تجارت', type: 'bank', iban: '', color: '#1e3a8a' }
    },
    transactions: [
      { id: 1, type: 'expense', category: 'خوراک/کوروش', amount: 755700, account: 'حساب ۴۰۰۱۰۰', date: todayStr, time: '20:08', balance: 573686654, icon: 'fa-utensils', color: 'bg-red-500', note: 'خرید سوپرمارکت' },
      { id: 2, type: 'expense', category: 'اینترنت', amount: 755700, account: 'حساب ۴۰۰۱۰۰', date: todayStr, time: '19:30', balance: 573686654, icon: 'fa-shield-halved', color: 'bg-purple-500', note: 'اشتراک ماهانه' },
      { id: 3, type: 'expense', category: 'کرایه', amount: 1059000, account: 'حساب ۴۰۰۱۰۰', date: todayStr, time: '15:42', balance: 625219854, icon: 'fa-car', color: 'bg-emerald-500', note: 'تاکسی پرند' },
      { id: 4, type: 'other', category: 'قرض دادن / به امیر', amount: 50021800, account: 'حساب ۴۰۰۱۰۰', date: todayStr, time: '12:15', balance: 575198054, icon: 'fa-hand-holding-dollar', color: 'bg-slate-600', unsettled: true, note: 'قرض موقت' },
      { id: 5, type: 'income', category: 'حقوق', amount: 35000000, account: 'حساب ۴۰۰۱۰۰', date: yesterday, time: '09:00', balance: 575198054, icon: 'fa-briefcase', color: 'bg-emerald-600', note: 'حقوق ماهانه' },
      { id: 6, type: 'expense', category: 'قبوض', amount: 850000, account: 'حساب ۴۰۰۱۰۰', date: yesterday, time: '14:20', balance: 545198054, icon: 'fa-bolt', color: 'bg-amber-500', note: 'قبض برق' }
    ],
    categories: [
      { id: 'food', name: 'خوراک', icon: 'fa-utensils', color: '#ef4444', type: 'expense' },
      { id: 'transport', name: 'کرایه', icon: 'fa-car', color: '#10b981', type: 'expense' },
      { id: 'internet', name: 'اینترنت', icon: 'fa-shield-halved', color: '#a855f7', type: 'expense' },
      { id: 'utility', name: 'قبوض', icon: 'fa-bolt', color: '#f59e0b', type: 'expense' },
      { id: 'health', name: 'سلامت', icon: 'fa-heart-pulse', color: '#ec4899', type: 'expense' },
      { id: 'salary', name: 'حقوق', icon: 'fa-briefcase', color: '#22c55e', type: 'income' },
      { id: 'loan', name: 'وام', icon: 'fa-people-group', color: '#f97316', type: 'other' },
      { id: 'lend', name: 'قرض دادن', icon: 'fa-hand-holding-dollar', color: '#64748b', type: 'other' }
    ],
    recurringTransactions: [
      { id: 'rec_demo_1', type: 'income', category: 'حقوق', amount: 35000000, account: 'حساب ۴۰۰۱۰۰', icon: 'fa-briefcase', color: 'bg-emerald-600', note: 'حقوق ماهانه (دمو)', frequency: 'monthly', startDate: '1405/01/01', nextRun: '1405/04/30', active: true, createdAt: '2026-01-01T00:00:00.000Z' }
    ],
    budgets: [
      { id: 1, category: 'خوراک', limit: 5000000, period: 'monthly' },
      { id: 2, category: 'کرایه', limit: 3000000, period: 'monthly' },
      { id: 3, category: 'اینترنت', limit: 1500000, period: 'monthly' }
    ],
    smsInbox: [
      { id: 101, bank: 'بانک شهر', card: '4001003675898', amount: 900000, action: 'برداشت', date: '1405/03/27 19:02:22', targetAccount: 'حساب ۴۰۰۱۰۰', mappedCategory: 'خوراک/کوروش' },
      { id: 102, bank: 'بانک شهر', card: '4001003675898', amount: 670000, action: 'برداشت', date: '1405/03/27 17:33:29', targetAccount: 'حساب ۴۰۰۱۰۰', mappedCategory: 'اینترنت' },
      { id: 103, bank: 'بانک شهر', card: '4001003675898', amount: 6289120, action: 'برداشت', date: '1405/03/26 19:31:47', targetAccount: 'حساب ۴۰۰۱۰۰', mappedCategory: 'سایر' },
      { id: 104, bank: 'بانک ملت', card: '5670330', amount: 8000000, action: 'واریز یارانه', date: '1405/03/26 09:12:00', targetAccount: 'ملت سهروردی', mappedCategory: 'یارانه' }
    ],
    settings: {
      showTodayDate: true,
      autoParseSms: true,
      dailyReminder: true,
      currency: 'ریال',
      lowBalanceThreshold: 1000000
    }
  };
}

// Clean state - empty, for real use
function getCleanState() {
  const today = JalaliDate.today();
  const todayStr = `${String(today[0]).padStart(4, '0')}/${String(today[1]).padStart(2, '0')}/${String(today[2]).padStart(2, '0')}`;
  return {
    version: APP_VERSION,
    baseCurrency: 'ریال',
    activeAccount: 'جیب',
    activeTab: 'main',
    fontScale: 100,
    darkMode: false,
    biometricLock: false,
    activeSmsTab: 'bank',
    currentUser: 'کاربر زرین',
    selectedDate: todayStr,
    selectedMonth: { jy: today[0], jm: today[1] },
    accounts: {
      'جیب': 0
    },
    accountMeta: {
      'جیب': { bank: '', type: 'cash', iban: '', color: '#0f766e' }
    },
    transactions: [],
    categories: [
      { id: 'food', name: 'خوراک', icon: 'fa-utensils', color: '#ef4444', type: 'expense' },
      { id: 'transport', name: 'کرایه', icon: 'fa-car', color: '#10b981', type: 'expense' },
      { id: 'internet', name: 'اینترنت', icon: 'fa-shield-halved', color: '#a855f7', type: 'expense' },
      { id: 'utility', name: 'قبوض', icon: 'fa-bolt', color: '#f59e0b', type: 'expense' },
      { id: 'health', name: 'سلامت', icon: 'fa-heart-pulse', color: '#ec4899', type: 'expense' },
      { id: 'salary', name: 'حقوق', icon: 'fa-briefcase', color: '#22c55e', type: 'income' },
      { id: 'loan', name: 'وام', icon: 'fa-people-group', color: '#f97316', type: 'other' },
      { id: 'lend', name: 'قرض دادن', icon: 'fa-hand-holding-dollar', color: '#64748b', type: 'other' }
    ],
    recurringTransactions: [],
    budgets: [],
    smsInbox: [],
    settings: {
      showTodayDate: true,
      autoParseSms: true,
      dailyReminder: true,
      currency: 'ریال',
      lowBalanceThreshold: 1000000
    }
  };
}

// Default to demo for backward compatibility
function getDefaultState() { return getDemoState(); }

const Store = {
  state: null,
  isFirstRun: false,

  init() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.state = JSON.parse(saved);
        // Migration: ensure all new fields exist
        const def = getDefaultState();
        for (const key of Object.keys(def)) {
          if (this.state[key] === undefined) this.state[key] = def[key];
        }
        this.state.version = APP_VERSION;
        this.isFirstRun = false;
      } else {
        // First run - mark for onboarding prompt. App.js will call chooseMode().
        this.isFirstRun = true;
        // Load minimal placeholder state so the app shell renders without errors
        this.state = getCleanState();
      }
      // Process any due recurring transactions
      if (!this.isFirstRun) {
        try { this.processRecurringTransactions(); } catch(e) { console.warn('Recurring processing failed:', e); }
      }
    } catch (e) {
      console.warn('Failed to load state, using clean default', e);
      this.state = getCleanState();
      this.isFirstRun = true;
    }
  },

  chooseMode(mode) {
    if (mode === 'demo') {
      this.state = getDemoState();
    } else {
      this.state = getCleanState();
    }
    this.save();
    localStorage.setItem(FIRST_RUN_KEY, '1');
    this.isFirstRun = false;
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state', e);
    }
  },

  reset(mode) {
    if (mode === 'demo') {
      this.state = getDemoState();
    } else if (mode === 'clean') {
      this.state = getCleanState();
    } else {
      this.state = getDefaultState();
    }
    this.save();
    localStorage.setItem(FIRST_RUN_KEY, '1');
  },

  // Transaction operations
  addTransaction(tx) {
    tx.id = Date.now() + Math.floor(Math.random() * 1000); // ensure uniqueness
    tx.date = tx.date || (() => {
      const t = JalaliDate.today();
      return `${String(t[0]).padStart(4, '0')}/${String(t[1]).padStart(2, '0')}/${String(t[2]).padStart(2, '0')}`;
    })();
    tx.time = tx.time || new Date().toTimeString().slice(0, 5);
    this.state.transactions.unshift(tx);
    // Update account balance
    if (tx.account && this.state.accounts[tx.account] !== undefined) {
      if (tx.type === 'income') {
        this.state.accounts[tx.account] += tx.amount;
      } else if (tx.type === 'expense') {
        this.state.accounts[tx.account] -= tx.amount;
      } else if (tx.type === 'other') {
        // Loan given - reduce balance
        this.state.accounts[tx.account] -= tx.amount;
      } else if (tx.type === 'transfer') {
        // Transfers move money out of source account; destination handled separately
        this.state.accounts[tx.account] -= tx.amount;
      }
      tx.balance = this.state.accounts[tx.account];
    }
    this.save();
    return tx;
  },

  deleteTransaction(id) {
    const tx = this.state.transactions.find(t => t.id === id);
    if (tx) {
      // Reverse the account effect on source account
      if (tx.type === 'income') {
        this.state.accounts[tx.account] -= tx.amount;
      } else {
        // expense, other, transfer all reduce source balance
        this.state.accounts[tx.account] += tx.amount;
      }
      // For transfers: also reverse the destination credit
      if (tx.type === 'transfer' && tx.destAccount && this.state.accounts[tx.destAccount] !== undefined) {
        this.state.accounts[tx.destAccount] -= tx.amount;
      }
      this.state.transactions = this.state.transactions.filter(t => t.id !== id);
      this.save();
    }
  },

  settleTransaction(id) {
    const t = this.state.transactions.find(item => item.id === id);
    if (t) {
      t.unsettled = false;
      t.settledAt = new Date().toISOString();
      t.type = 'income';
      this.state.accounts[t.account] += t.amount;
      this.save();
    }
  },

  // Account operations
  addAccount(name, bank, type, initialBalance, iban) {
    this.state.accounts[name] = initialBalance || 0;
    this.state.accountMeta[name] = { bank, type, iban, color: '#1e40af' };
    this.save();
  },

  deleteAccount(name) {
    if (name === this.state.activeAccount) return false;
    delete this.state.accounts[name];
    delete this.state.accountMeta[name];
    this.save();
    return true;
  },

  // SMS operations
  deleteSms(id) {
    this.state.smsInbox = this.state.smsInbox.filter(item => item.id !== id);
    this.save();
  },

  approveSms(id) {
    const sms = this.state.smsInbox.find(item => item.id === id);
    if (!sms) return null;
    const tx = {
      type: sms.action.includes('واریز') ? 'income' : 'expense',
      category: sms.mappedCategory,
      amount: sms.amount,
      account: sms.targetAccount,
      icon: 'fa-envelope-open',
      color: 'bg-blue-600',
      note: `از پیامک ${sms.bank}`,
      source: 'sms'
    };
    this.addTransaction(tx);
    this.state.smsInbox = this.state.smsInbox.filter(item => item.id !== id);
    this.save();
    return tx;
  },

  // Budget operations
  addBudget(category, limit, period) {
    this.state.budgets.push({
      id: Date.now(),
      category,
      limit: parseInt(limit),
      period: period || 'monthly'
    });
    this.save();
  },

  deleteBudget(id) {
    this.state.budgets = this.state.budgets.filter(b => b.id !== id);
    this.save();
  },

  getBudgetSpent(category) {
    const month = this.state.selectedMonth;
    const prefix = `${month.jy}/${String(month.jm).padStart(2, '0')}`;
    return this.state.transactions
      .filter(t => t.type === 'expense' && t.category && t.category.includes(category) && t.date && t.date.startsWith(prefix))
      .reduce((sum, t) => sum + t.amount, 0);
  },

  // Settings
  setCurrency(curr) {
    this.state.baseCurrency = curr;
    this.state.settings.currency = curr;
    this.save();
  },

  setFontScale(scale) {
    this.state.fontScale = parseInt(scale);
    this.save();
  },

  toggleDarkMode() {
    this.state.darkMode = !this.state.darkMode;
    this.save();
  },

  // ==================== Category operations ====================
  addCategory(name, icon, color, type, parentId) {
    const cat = {
      id: 'cat_' + Date.now() + Math.floor(Math.random() * 1000),
      name,
      icon: icon || 'fa-tag',
      color: color || '#0f766e',
      type: type || 'expense',
      parentId: parentId || null,
      custom: true
    };
    this.state.categories.push(cat);
    this.save();
    return cat;
  },

  updateCategory(id, updates) {
    const cat = this.state.categories.find(c => c.id === id);
    if (cat && cat.custom) {
      Object.assign(cat, updates);
      this.save();
    }
  },

  deleteCategory(id) {
    const cat = this.state.categories.find(c => c.id === id);
    if (!cat || !cat.custom) return false;
    this.state.categories = this.state.categories.filter(c => c.id !== id && c.parentId !== id);
    this.save();
    return true;
  },

  getCategoriesByType(type) {
    return this.state.categories.filter(c => c.type === type);
  },

  getMainCategories() {
    return this.state.categories.filter(c => !c.parentId);
  },

  getSubCategories(parentId) {
    return this.state.categories.filter(c => c.parentId === parentId);
  },

  // ==================== Recurring Transactions ====================
  addRecurringTransaction(tx) {
    const recurring = {
      id: 'rec_' + Date.now() + Math.floor(Math.random() * 1000),
      type: tx.type,
      category: tx.category,
      amount: tx.amount,
      account: tx.account,
      destAccount: tx.destAccount,
      icon: tx.icon,
      color: tx.color,
      note: tx.note || '',
      frequency: tx.frequency || 'monthly', // daily, weekly, monthly, yearly
      startDate: tx.date || this._todayStr(),
      nextRun: tx.date || this._todayStr(),
      active: true,
      createdAt: new Date().toISOString()
    };
    if (!this.state.recurringTransactions) this.state.recurringTransactions = [];
    this.state.recurringTransactions.push(recurring);
    this.save();
    return recurring;
  },

  deleteRecurring(id) {
    if (!this.state.recurringTransactions) return;
    this.state.recurringTransactions = this.state.recurringTransactions.filter(r => r.id !== id);
    this.save();
  },

  toggleRecurring(id) {
    if (!this.state.recurringTransactions) return;
    const r = this.state.recurringTransactions.find(x => x.id === id);
    if (r) {
      r.active = !r.active;
      this.save();
    }
  },

  // Check and create due recurring transactions (called on app init)
  processRecurringTransactions() {
    if (!this.state.recurringTransactions || !this.state.recurringTransactions.length) return;
    const today = this._todayStr();
    let created = 0;
    this.state.recurringTransactions.forEach(r => {
      if (!r.active) return;
      // Loop while nextRun is due (in case multiple periods have passed)
      while (r.active && r.nextRun <= today) {
        // Create the transaction for this date
        const tx = {
          type: r.type,
          category: r.category,
          amount: r.amount,
          account: r.account,
          destAccount: r.destAccount,
          icon: r.icon,
          color: r.color,
          note: (r.note || '') + ' (تکراری)',
          date: r.nextRun,
          time: '09:00',
          recurringId: r.id
        };
        this.addTransaction(tx);
        // For transfers, also credit destination
        if (r.type === 'transfer' && r.destAccount && this.state.accounts[r.destAccount] !== undefined) {
          this.state.accounts[r.destAccount] += r.amount;
        }
        // Advance nextRun
        r.nextRun = this._advanceDate(r.nextRun, r.frequency);
        // Safety: stop after 12 iterations to prevent infinite loop on bad data
        created++;
        if (created > 12) break;
      }
    });
    if (created > 0) this.save();
    return created;
  },

  _todayStr() {
    const t = JalaliDate.today();
    return `${String(t[0]).padStart(4, '0')}/${String(t[1]).padStart(2, '0')}/${String(t[2]).padStart(2, '0')}`;
  },

  _advanceDate(dateStr, frequency) {
    const parts = dateStr.split('/').map(p => parseInt(p));
    const [jy, jm, jd] = parts;
    const [gy, gm, gd] = JalaliDate.jalaliToGregorian(jy, jm, jd);
    const d = new Date(gy, gm - 1, gd);
    switch (frequency) {
      case 'daily': d.setDate(d.getDate() + 1); break;
      case 'weekly': d.setDate(d.getDate() + 7); break;
      case 'monthly': d.setMonth(d.getMonth() + 1); break;
      case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
      default: d.setMonth(d.getMonth() + 1);
    }
    const [njy, njm, njd] = JalaliDate.gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return `${String(njy).padStart(4, '0')}/${String(njm).padStart(2, '0')}/${String(njd).padStart(2, '0')}`;
  },

  // ==================== Reports / Savings ====================
  // Get income, expense, savings for a given year
  getYearlySummary(jy) {
    const prefix = `${jy}/`;
    let income = 0, expense = 0, other = 0;
    this.state.transactions.forEach(t => {
      if (!t.date || !t.date.startsWith(prefix)) return;
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
      else other += t.amount;
    });
    return {
      income,
      expense,
      other,
      savings: income - expense, // savings = income - expense (excludes loans/transfers)
      total: income - expense - other
    };
  },

  // Get monthly summary for a year (12 entries)
  getMonthlySummaries(jy) {
    const result = [];
    for (let m = 1; m <= 12; m++) {
      const prefix = `${jy}/${String(m).padStart(2, '0')}`;
      let income = 0, expense = 0;
      this.state.transactions.forEach(t => {
        if (!t.date || !t.date.startsWith(prefix)) return;
        if (t.type === 'income') income += t.amount;
        else if (t.type === 'expense') expense += t.amount;
      });
      result.push({ month: m, income, expense, savings: income - expense });
    }
    return result;
  },

  // Get transactions for a year, filtered by type
  getYearlyTransactions(jy, typeFilter) {
    const prefix = `${jy}/`;
    return this.state.transactions.filter(t => {
      if (!t.date || !t.date.startsWith(prefix)) return false;
      if (typeFilter === 'income') return t.type === 'income';
      if (typeFilter === 'expense') return t.type === 'expense';
      return true;
    });
  }
};

if (typeof window !== 'undefined') {
  window.Store = Store;
  window.APP_VERSION = APP_VERSION;
  window.APP_BUILD = APP_BUILD;
}
