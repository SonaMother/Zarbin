/* ============================================
   Zarbin - Main Application Controller
   کنترلر اصلی اپلیکیشن
   ============================================ */

const App = {
  init() {
    Store.init();
    this.applyFontScale(Store.state.fontScale);
    this.applyDarkMode();
    this.updateVersionDisplay();
    this.bindEvents();
    this.populateSourceAccounts();

    if (Store.isFirstRun) {
      // Show onboarding modal; defer dashboard render until user picks a mode
      this.showOnboarding();
    } else {
      Render.renderDashboard();
    }
    this.updateSmsBadge();
  },

  // ==================== Onboarding (Demo vs Clean) ====================
  showOnboarding() {
    const modal = document.getElementById('onboardingModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  },

  hideOnboarding() {
    const modal = document.getElementById('onboardingModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  chooseMode(mode) {
    Store.chooseMode(mode);
    this.hideOnboarding();
    this.populateSourceAccounts();
    Render.renderDashboard();
    this.updateSmsBadge();
    this.toast(mode === 'demo' ? 'حالت دمو فعال شد — نمونه داده‌ها بارگذاری شد' : 'حالت تمیز فعال شد — آماده برای استفاده واقعی', 'success');
  },

  // Show the mode-switcher from settings
  openModeSwitcher() {
    this.toggleSidebar(false);
    document.getElementById('modeSwitcherModal').classList.remove('hidden');
  },

  confirmModeSwitch(mode) {
    if (!confirm(mode === 'demo'
      ? 'تغییر به حالت دمو: تمام داده‌های فعلی شما با داده‌های نمونه جایگزین می‌شود. ادامه می‌دهید؟'
      : 'تغییر به حالت تمیز: تمام داده‌های فعلی شما حذف می‌شود. ادامه می‌دهید؟')) return;
    Store.reset(mode);
    document.getElementById('modeSwitcherModal').classList.add('hidden');
    setTimeout(() => location.reload(), 300);
  },

  updateVersionDisplay() {
    document.querySelectorAll('.version-badge').forEach(el => {
      el.innerText = `v${APP_VERSION}`;
    });
    document.querySelectorAll('.build-number').forEach(el => {
      el.innerText = `Build ${APP_BUILD}`;
    });
  },

  updateSmsBadge() {
    const badge = document.getElementById('smsBadge');
    if (badge) {
      if (Store.state.smsInbox.length > 0) {
        badge.classList.remove('hidden');
        badge.innerText = Render.toPersian(Store.state.smsInbox.length);
        badge.classList.add('text-[8px]', 'flex', 'items-center', 'justify-center');
      } else {
        badge.classList.add('hidden');
      }
    }
  },

  // ==================== Navigation ====================
  switchTab(tabId) {
    Store.state.activeTab = tabId;
    Store.save();

    document.querySelectorAll('.tab-view').forEach(view => view.classList.add('hidden'));
    document.getElementById(`view-${tabId}`).classList.remove('hidden');

    document.querySelectorAll('nav button').forEach(btn => {
      btn.classList.remove('text-white', 'font-bold', 'border-teal-400');
      btn.classList.add('border-transparent');
    });
    const selectedButton = document.getElementById(`tab-${tabId}`);
    selectedButton.classList.add('text-white', 'font-bold', 'border-teal-400');
    selectedButton.classList.remove('border-transparent');

    if (tabId === 'debts') Render.renderDebtsChart();
    else if (tabId === 'breakdown') Render.renderCategoryBreakdown();
    else if (tabId === 'budget') Render.renderBudgets();
    else if (tabId === 'main') Render.renderDashboard();
  },

  selectDay(dateStr) {
    Store.state.selectedDate = dateStr;
    const parts = dateStr.split('/');
    Store.state.selectedMonth = { jy: parseInt(parts[0]), jm: parseInt(parts[1]) };
    Store.save();
    Render.renderDashboard();
  },

  changeMonth(delta) {
    const m = Store.state.selectedMonth;
    let jy = m.jy, jm = m.jm + delta;
    if (jm > 12) { jm = 1; jy++; }
    if (jm < 1) { jm = 12; jy--; }
    Store.state.selectedMonth = { jy, jm };
    // Update selected date to the 1st of new month
    Store.state.selectedDate = `${jy}/${String(jm).padStart(2, '0')}/01`;
    Store.save();
    Render.renderDashboard();
  },

  // ==================== Sidebar ====================
  toggleSidebar(open) {
    const sidebar = document.getElementById('sidebarMenu');
    const overlay = document.getElementById('sidebarOverlay');
    if (open) {
      sidebar.classList.remove('translate-x-full');
      overlay.classList.remove('hidden');
    } else {
      sidebar.classList.add('translate-x-full');
      overlay.classList.add('hidden');
    }
  },

  // ==================== FAB ====================
  toggleFabMenu() {
    const overlay = document.getElementById('fabOverlay');
    const open = overlay.classList.contains('hidden');
    if (open) {
      overlay.classList.remove('hidden');
    } else {
      overlay.classList.add('hidden');
    }
  },

  // ==================== Transaction Form ====================
  openTransactionForm(type) {
    this.toggleFabMenu();
    // Ensure dropdown reflects current accounts
    this.populateSourceAccounts();
    this.populateDestAccounts();

    const subpage = document.getElementById('formSubpage');
    const title = document.getElementById('formTitle');
    const label = document.getElementById('formAccountLabel');
    const amtLabel = document.getElementById('formAmountLabel');
    const typeLabel = document.getElementById('formTypeLabel');
    const destWrapper = document.getElementById('formDestAccountWrapper');

    subpage.classList.remove('translate-x-full');
    title.innerText = `ثبت تراکنش ${type}`;
    label.innerText = type === 'دریافت' ? 'واریز به حساب' : 'برداشت از حساب';
    amtLabel.innerText = Store.state.baseCurrency;

    // Show destination account selector only for transfers
    if (destWrapper) {
      destWrapper.classList.toggle('hidden', type !== 'انتقال');
    }

    // Set type hidden field
    if (typeLabel) {
      typeLabel.value = type;
    }

    // Reset form
    document.getElementById('financialForm').reset();
    document.getElementById('formAmount').value = '';
    document.getElementById('formNote').value = '';

    // Set today's date in date field
    const today = JalaliDate.today();
    document.getElementById('formDateLabel').innerText =
      `${JALALI_MONTHS[today[1] - 1]} ${Render.toPersian(today[2])}, ${Render.toPersian(today[0])}`;

    // Set source account dropdown to active account
    const sel = document.getElementById('formSourceAccount');
    if (sel) sel.value = Store.state.activeAccount;
  },

  closeFormSubpage() {
    document.getElementById('formSubpage').classList.add('translate-x-full');
  },

  handleFormSubmit(e) {
    e.preventDefault();
    const amt = parseInt(document.getElementById('formAmount').value);
    if (!amt || amt <= 0) {
      this.toast('مبلغ معتبر وارد کنید', 'error');
      return;
    }
    const cat = document.getElementById('formCategory').value;
    const acc = document.getElementById('formSourceAccount').value;
    const note = document.getElementById('formNote').value;
    const fee = parseInt(document.getElementById('formFee').value || '0');
    const title = document.getElementById('formTitle').innerText;
    const destAcc = document.getElementById('formDestAccount')?.value;

    let type = 'expense';
    let icon = 'fa-tag';
    let color = 'bg-slate-500';

    if (title.includes('پرداخت')) {
      type = 'expense';
      icon = 'fa-arrow-down-long';
      color = 'bg-red-500';
    } else if (title.includes('دریافت')) {
      type = 'income';
      icon = 'fa-arrow-up-long';
      color = 'bg-emerald-500';
    } else if (title.includes('وام')) {
      type = 'other';
      icon = 'fa-people-group';
      color = 'bg-amber-500';
    } else if (title.includes('انتقال')) {
      // Validate destination account
      if (!destAcc) {
        this.toast('حساب مقصد را انتخاب کنید', 'error');
        return;
      }
      if (destAcc === acc) {
        this.toast('حساب مبدا و مقصد نمی‌توانند یکسان باشند', 'error');
        return;
      }
      type = 'transfer';
      icon = 'fa-right-left';
      color = 'bg-slate-700';
    } else {
      type = 'other';
      icon = 'fa-tag';
      color = 'bg-amber-500';
    }

    const tx = {
      type,
      category: cat,
      amount: amt + fee,
      account: acc,
      icon,
      color,
      note: note || ''
    };
    if (type === 'other') tx.unsettled = true;
    if (type === 'transfer' && destAcc) tx.destAccount = destAcc;

    Store.addTransaction(tx);

    // For transfers: also credit the destination account
    if (type === 'transfer' && destAcc && Store.state.accounts[destAcc] !== undefined) {
      Store.state.accounts[destAcc] += amt;
      Store.save();
    }

    // If recurring toggle was on, also create a recurring schedule
    this.maybeCreateRecurringFromForm(tx);

    this.closeFormSubpage();
    Render.renderDashboard();
    this.toast('تراکنش با موفقیت ثبت شد', 'success');
  },

  // ==================== Account Selector ====================
  toggleAccountSelector(open) {
    const modal = document.getElementById('accountSelectorModal');
    if (open) {
      modal.classList.remove('hidden');
      Render.renderAccountSelectorList();
    } else {
      modal.classList.add('hidden');
    }
  },

  selectActiveAccount(accountName) {
    Store.state.activeAccount = accountName;
    Store.save();
    this.toggleAccountSelector(false);
    Render.renderDashboard();
  },

  // ==================== SMS ====================
  openSmsInbox() {
    const modal = document.getElementById('smsInboxModal');
    modal.classList.remove('translate-x-full');
    this.switchSmsTab(Store.state.activeSmsTab);
  },

  closeSmsInbox() {
    document.getElementById('smsInboxModal').classList.add('translate-x-full');
  },

  switchSmsTab(tabType) {
    Store.state.activeSmsTab = tabType;
    Store.save();

    const tabBank = document.getElementById('smsTab-bank');
    const tabSys = document.getElementById('smsTab-system');
    if (tabBank) {
      tabBank.classList.toggle('border-teal-700', tabType === 'bank');
      tabBank.classList.toggle('text-teal-700', tabType === 'bank');
      tabBank.classList.toggle('font-bold', tabType === 'bank');
    }
    if (tabSys) {
      tabSys.classList.toggle('border-teal-700', tabType === 'system');
      tabSys.classList.toggle('text-teal-700', tabType === 'system');
      tabSys.classList.toggle('font-bold', tabType === 'system');
    }

    const container = document.getElementById('smsContainer');
    if (tabType === 'system') {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-center text-slate-400 animate-fade-in">
          <i class="fa-solid fa-triangle-exclamation text-3xl opacity-50 mb-3"></i>
          <p class="text-xs font-bold">هیچ پیام سیستمی ثبت نگردیده است</p>
        </div>
      `;
    } else {
      Render.renderSmsList();
    }
  },

  approveSms(id) {
    Store.approveSms(id);
    Render.renderSmsList();
    Render.renderDashboard();
    this.updateSmsBadge();
    this.toast('تراکنش از پیامک ثبت شد', 'success');
  },

  deleteSms(id) {
    Store.deleteSms(id);
    Render.renderSmsList();
    this.updateSmsBadge();
    this.toast('پیامک حذف شد', 'success');
  },

  // ==================== Unsettled ====================
  openUnsettledReport() {
    document.getElementById('unsettledModal').classList.remove('translate-x-full');
    Render.renderUnsettledList();
  },

  closeUnsettledReport() {
    document.getElementById('unsettledModal').classList.add('translate-x-full');
    document.getElementById('exportDropdownMenu').classList.add('hidden');
  },

  settleTransaction(id) {
    Store.settleTransaction(id);
    Render.renderDashboard();
    Render.renderUnsettledList();
    this.toast('تراکنش تسویه شد', 'success');
  },

  deleteTransaction(id) {
    if (!confirm('آیا از حذف این تراکنش مطمئن هستید؟')) return;
    Store.deleteTransaction(id);
    Render.renderDashboard();
    Render.renderUnsettledList();
    this.toast('تراکنش حذف شد', 'success');
  },

  // ==================== Export ====================
  toggleExportMenu(e) {
    e.stopPropagation();
    document.getElementById('exportDropdownMenu').classList.toggle('hidden');
  },

  triggerDocumentExport(type) {
    document.getElementById('exportDropdownMenu').classList.add('hidden');
    if (type === 'PDF') {
      Exporter.exportPDF();
    } else if (type === 'CSV' || type === 'Excel') {
      Exporter.exportCSV();
    }
  },

  // ==================== Account Manager ====================
  openAccountManager(open) {
    const page = document.getElementById('accountManagerModal');
    if (open) {
      page.classList.remove('translate-x-full');
      Render.renderAccountList();
    } else {
      page.classList.add('translate-x-full');
    }
  },

  openAccountCreationForm() {
    document.getElementById('accountCreationSubpage').classList.remove('translate-x-full');
  },

  closeAccountCreationForm() {
    document.getElementById('accountCreationSubpage').classList.add('translate-x-full');
  },

  handleAccountCreation(e) {
    e.preventDefault();
    const bank = document.getElementById('newAccountBank').value;
    const name = document.getElementById('newAccountName').value;
    const initial = parseInt(document.getElementById('newAccountInitialBalance').value || '0');
    const iban = document.getElementById('newAccountIban').value;
    const type = document.querySelector('input[name="newAccountType"]:checked')?.value || 'bank';

    const fullName = type === 'cash' ? `کیف پول ${name}` : `حساب ${bank} - ${name}`;
    Store.addAccount(fullName, bank, type, initial, iban);
    this.closeAccountCreationForm();
    Render.renderAccountList();
    Render.renderAccountSelectorList();
    this.toast('حساب جدید ایجاد شد', 'success');
  },

  deleteAccount(name) {
    if (name === Store.state.activeAccount) {
      this.toast('امکان حذف حساب فعال وجود ندارد', 'error');
      return;
    }
    if (!confirm(`حذف حساب "${name}"؟`)) return;
    Store.deleteAccount(name);
    Render.renderAccountList();
    Render.renderAccountSelectorList();
    this.toast('حساب حذف شد', 'success');
  },

  // ==================== Budget Form ====================
  openBudgetForm() {
    document.getElementById('budgetFormModal').classList.remove('hidden');
  },

  closeBudgetForm() {
    document.getElementById('budgetFormModal').classList.add('hidden');
  },

  handleBudgetSubmit(e) {
    e.preventDefault();
    const category = document.getElementById('budgetCategory').value;
    const limit = parseInt(document.getElementById('budgetLimit').value);
    if (!limit || limit <= 0) {
      this.toast('مبلغ بودجه معتبر نیست', 'error');
      return;
    }
    Store.addBudget(category, limit, 'monthly');
    this.closeBudgetForm();
    Render.renderBudgets();
    this.toast('بودجه جدید ثبت شد', 'success');
  },

  deleteBudget(id) {
    if (!confirm('حذف این بودجه؟')) return;
    Store.deleteBudget(id);
    Render.renderBudgets();
    this.toast('بودجه حذف شد', 'success');
  },

  // ==================== Settings ====================
  openFontSettings() {
    this.toggleSidebar(false);
    document.getElementById('fontSettingsModal').classList.remove('hidden');
    document.getElementById('fontRangeInput').value = Store.state.fontScale;
    this.applyFontScale(Store.state.fontScale);
  },

  applyFontScale(scaleVal) {
    Store.setFontScale(scaleVal);
    document.getElementById('fontRangeInput').value = scaleVal;
    document.getElementById('fontScaleLabel').innerText = `${Render.toPersian(scaleVal)}٪`;
    document.getElementById('appContainer').style.fontSize = `${scaleVal}%`;
  },

  openCurrencySettings() {
    this.toggleSidebar(false);
    document.getElementById('currencyModal').classList.remove('hidden');
    const isRial = Store.state.baseCurrency === 'ریال';
    document.getElementById('checkRial').classList.toggle('hidden', !isRial);
    document.getElementById('checkToman').classList.toggle('hidden', isRial);
  },

  setBaseCurrency(curr) {
    Store.setCurrency(curr);
    const isRial = curr === 'ریال';
    document.getElementById('checkRial').classList.toggle('hidden', !isRial);
    document.getElementById('checkToman').classList.toggle('hidden', isRial);
    Render.renderDashboard();
    this.toast(`واحد پول به ${curr} تغییر یافت`, 'success');
  },

  openToolbarSettings() {
    this.toggleSidebar(false);
    document.getElementById('toolbarSettingsModal').classList.remove('hidden');
  },

  // ==================== About ====================
  openAboutDialog() {
    this.toggleSidebar(false);
    document.getElementById('aboutModal').classList.remove('hidden');
  },

  closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
  },

  // ==================== Date Picker ====================
  openDatePicker() {
    const modal = document.getElementById('datePickerModal');
    modal.classList.remove('hidden');
    this.renderCalendarGrid();
  },

  renderCalendarGrid() {
    const grid = document.getElementById('calendarDaysGrid');
    const state = Store.state;
    const { jy, jm } = state.selectedMonth;
    const daysInMonth = JalaliDate.daysInMonth(jy, jm);
    const selectedDay = parseInt(state.selectedDate.split('/')[2]);

    // Find weekday of day 1
    const [gy, gm, gd] = JalaliDate.jalaliToGregorian(jy, jm, 1);
    const firstWeekday = (new Date(gy, gm - 1, gd).getDay() + 1) % 7;

    let html = '';
    // Empty cells before day 1
    for (let i = 0; i < firstWeekday; i++) {
      html += `<div></div>`;
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const active = day === selectedDay;
      const dateStr = `${jy}/${String(jm).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
      html += `
        <div onclick="App.selectDayFromCalendar('${dateStr}')" class="p-1.5 rounded-full text-center cursor-pointer font-bold ${active ? 'bg-teal-900 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-700'}">
          ${Render.toPersian(day)}
        </div>
      `;
    }
    grid.innerHTML = html;

    // Update calendar header
    document.getElementById('calendarHeader').innerText = `${JALALI_MONTHS[jm - 1]} ${Render.toPersian(jy)}`;
  },

  selectDayFromCalendar(dateStr) {
    this.selectDay(dateStr);
    this.closeModal('datePickerModal');
  },

  changeCalendarMonth(delta) {
    this.changeMonth(delta);
    this.renderCalendarGrid();
  },

  // ==================== Settings ====================
  toggleDarkMode() {
    Store.toggleDarkMode();
    this.applyDarkMode();
  },

  applyDarkMode() {
    document.body.classList.toggle('dark-mode', Store.state.darkMode);
    document.documentElement.setAttribute('data-theme', Store.state.darkMode ? 'dark' : 'light');
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) toggle.classList.toggle('active', Store.state.darkMode);
  },

  // ==================== Backup ====================
  triggerBackup() {
    Exporter.exportBackup();
  },

  triggerRestore() {
    document.getElementById('restoreFileInput').click();
  },

  handleRestoreFile(e) {
    const file = e.target.files[0];
    if (file) Exporter.importBackup(file);
    e.target.value = '';
  },

  triggerReset() {
    // Route through the mode switcher so the user can pick demo vs clean
    this.openModeSwitcher();
  },

  // ==================== Source Account Dropdown ====================
  populateSourceAccounts() {
    const sel = document.getElementById('formSourceAccount');
    if (!sel) return;
    sel.innerHTML = '';
    Object.keys(Store.state.accounts).forEach(acc => {
      const opt = document.createElement('option');
      opt.value = acc;
      opt.textContent = acc;
      sel.appendChild(opt);
    });
    sel.value = Store.state.activeAccount;
  },

  populateDestAccounts() {
    const sel = document.getElementById('formDestAccount');
    if (!sel) return;
    sel.innerHTML = '';
    Object.keys(Store.state.accounts).forEach(acc => {
      const opt = document.createElement('option');
      opt.value = acc;
      opt.textContent = acc;
      sel.appendChild(opt);
    });
    // Default to a different account than source
    const sourceAcc = Store.state.activeAccount;
    const others = Object.keys(Store.state.accounts).filter(a => a !== sourceAcc);
    if (others.length) sel.value = others[0];
  },

  // ==================== Transaction Details ====================
  showTransactionDetails(id) {
    const tx = Store.state.transactions.find(t => t.id === id);
    if (!tx) return;
    const modal = document.getElementById('txDetailsModal');
    document.getElementById('txDetailsCategory').innerText = tx.category;
    document.getElementById('txDetailsAmount').innerText = Render.formatWithCurrency(tx.amount);
    document.getElementById('txDetailsDate').innerText = `${Render.formatDate(tx.date)} ${Render.formatTime(tx.time || '')}`;
    document.getElementById('txDetailsAccount').innerText = tx.account + (tx.destAccount ? ` ← ${tx.destAccount}` : '');
    document.getElementById('txDetailsType').innerText = tx.type === 'expense' ? 'هزینه' : tx.type === 'income' ? 'درآمد' : tx.type === 'transfer' ? 'انتقال' : 'سایر';
    document.getElementById('txDetailsNote').innerText = tx.note || '—';
    document.getElementById('txDetailsBalance').innerText = Render.formatMoney(tx.balance || 0);
    modal.dataset.txId = id;
    modal.classList.remove('hidden');
  },

  deleteTransactionFromDetails() {
    const modal = document.getElementById('txDetailsModal');
    const id = parseInt(modal.dataset.txId);
    modal.classList.add('hidden');
    this.deleteTransaction(id);
  },

  // ==================== Toast ====================
  toast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transition = 'opacity .3s';
      setTimeout(() => t.remove(), 300);
    }, 2500);
  },

  // ==================== Events ====================
  bindEvents() {
    // Close export menu on outside click
    document.addEventListener('click', () => {
      const menu = document.getElementById('exportDropdownMenu');
      if (menu) menu.classList.add('hidden');
    });

    // Android back button (Capacitor)
    if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.App) {
      Capacitor.Plugins.App.addListener('backButton', ({ canGoBack }) => {
        // Close any open modals/overlays first
        const modals = ['formSubpage', 'smsInboxModal', 'unsettledModal', 'accountManagerModal', 'accountCreationSubpage'];
        for (const id of modals) {
          const el = document.getElementById(id);
          if (el && !el.classList.contains('translate-x-full')) {
            el.classList.add('translate-x-full');
            return;
          }
        }
        const fab = document.getElementById('fabOverlay');
        if (fab && !fab.classList.contains('hidden')) {
          this.toggleFabMenu();
          return;
        }
        const sidebar = document.getElementById('sidebarMenu');
        if (sidebar && !sidebar.classList.contains('translate-x-full')) {
          this.toggleSidebar(false);
          return;
        }
        // Otherwise exit
        if (navigator.app) navigator.app.exitApp();
      });
    }

    // Periodic save (in case of background kill)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) Store.save();
    });
  },

  // ==================== Bottom Navigation ====================
  activeMainView: 'home',
  reportYear: null,
  reportTab: 'summary',
  categoryFilter: 'all',
  categorySearchQuery: '',
  recurringFormState: { enabled: false, frequency: 'monthly' },

  switchMainView(view) {
    this.activeMainView = view;
    // Update bottom nav active states
    ['home', 'reports', 'categories', 'more'].forEach(v => {
      const el = document.getElementById(`bottomnav-${v}`);
      if (el) {
        if (v === view) {
          el.classList.remove('text-slate-400');
          el.classList.add('text-teal-800');
        } else {
          el.classList.add('text-slate-400');
          el.classList.remove('text-teal-800');
        }
      }
    });

    const subBar = document.getElementById('subTabBar');

    if (view === 'home') {
      // Show sub-tab bar and switch to main tab
      if (subBar) subBar.classList.remove('hidden');
      this.switchTab('main');
    } else if (view === 'reports') {
      // Show sub-tab bar and switch to goraresh (reports list)
      if (subBar) subBar.classList.remove('hidden');
      this.switchTab('goraresh');
    } else if (view === 'categories') {
      // Hide sub-tab bar, show categories view
      if (subBar) subBar.classList.add('hidden');
      this.showView('categories');
      Render.renderCategoriesList();
    } else if (view === 'more') {
      // Open more menu modal
      document.getElementById('moreMenuModal').classList.remove('hidden');
    } else if (view === 'recurring') {
      if (subBar) subBar.classList.add('hidden');
      this.showView('recurring');
      Render.renderRecurringList();
    } else if (view === 'help') {
      if (subBar) subBar.classList.add('hidden');
      this.showView('help');
    } else if (view === 'reports-yearly') {
      if (subBar) subBar.classList.add('hidden');
      this.showView('reports-yearly');
      this.renderReportContent();
    }
  },

  // Helper: show a single view, hide all others
  showView(viewId) {
    document.querySelectorAll('.tab-view').forEach(view => view.classList.add('hidden'));
    const el = document.getElementById(`view-${viewId}`);
    if (el) el.classList.remove('hidden');
  },

  // ==================== Categories Management ====================
  openCategoryForm() {
    document.getElementById('categoryFormModal').classList.remove('hidden');
    document.getElementById('newCatName').value = '';
    document.getElementById('newCatIcon').value = 'fa-tag';
  },

  handleCategorySubmit(e) {
    e.preventDefault();
    const name = document.getElementById('newCatName').value.trim();
    const type = document.getElementById('newCatType').value;
    const icon = document.getElementById('newCatIcon').value.trim() || 'fa-tag';
    const color = document.querySelector('input[name="catColor"]:checked')?.value || '#0f766e';
    if (!name) {
      this.toast('نام دسته را وارد کنید', 'error');
      return;
    }
    Store.addCategory(name, icon, color, type);
    this.closeModal('categoryFormModal');
    Render.renderCategoriesList();
    this.toast('دسته جدید اضافه شد', 'success');
  },

  deleteCategory(id) {
    if (!confirm('حذف این دسته؟ تراکنش‌های مرتبط دست‌نخورده باقی می‌مانند.')) return;
    if (Store.deleteCategory(id)) {
      Render.renderCategoriesList();
      this.toast('دسته حذف شد', 'success');
    } else {
      this.toast('امکان حذف دسته پیش‌فرض وجود ندارد', 'error');
    }
  },

  filterCategories(query) {
    this.categorySearchQuery = query;
    Render.renderCategoriesList();
  },

  filterCategoriesByType(type) {
    this.categoryFilter = type;
    // Update active button
    ['all', 'expense', 'income', 'other'].forEach(t => {
      const btn = document.getElementById(`cat-filter-${t}`);
      if (btn) {
        if (t === type) {
          btn.classList.add('bg-teal-800', 'text-white');
          btn.classList.remove('text-slate-600', 'hover:bg-slate-100');
        } else {
          btn.classList.remove('bg-teal-800', 'text-white');
          btn.classList.add('text-slate-600', 'hover:bg-slate-100');
        }
      }
    });
    Render.renderCategoriesList();
  },

  // ==================== Recurring Transactions ====================
  toggleRecurringField() {
    const toggle = document.getElementById('formRecurringToggle');
    const options = document.getElementById('formRecurringOptions');
    this.recurringFormState.enabled = !this.recurringFormState.enabled;
    toggle.classList.toggle('active', this.recurringFormState.enabled);
    options.classList.toggle('hidden', !this.recurringFormState.enabled);
  },

  setRecurringFrequency(freq) {
    this.recurringFormState.frequency = freq;
    ['daily', 'weekly', 'monthly', 'yearly'].forEach(f => {
      const btn = document.getElementById(`freq-${f}`);
      if (btn) {
        if (f === freq) {
          btn.classList.add('bg-teal-800', 'text-white');
          btn.classList.remove('text-slate-600', 'hover:bg-slate-50');
        } else {
          btn.classList.remove('bg-teal-800', 'text-white');
          btn.classList.add('text-slate-600', 'hover:bg-slate-50');
        }
      }
    });
  },

  // Hook into transaction form submit — if recurring enabled, also create a recurring schedule
  // (called from handleFormSubmit after Store.addTransaction)
  maybeCreateRecurringFromForm(txData) {
    if (this.recurringFormState.enabled) {
      Store.addRecurringTransaction({
        ...txData,
        frequency: this.recurringFormState.frequency,
        date: Store.state.selectedDate
      });
    }
    // Reset state for next time
    this.recurringFormState = { enabled: false, frequency: 'monthly' };
    const toggle = document.getElementById('formRecurringToggle');
    const options = document.getElementById('formRecurringOptions');
    if (toggle) toggle.classList.remove('active');
    if (options) options.classList.add('hidden');
  },

  openRecurringForm() {
    document.getElementById('recurringFormModal').classList.remove('hidden');
    // Populate account dropdown
    const sel = document.getElementById('recAccount');
    sel.innerHTML = '';
    Object.keys(Store.state.accounts).forEach(acc => {
      const opt = document.createElement('option');
      opt.value = acc;
      opt.textContent = acc;
      sel.appendChild(opt);
    });
    // Reset form
    document.getElementById('recCategory').value = '';
    document.getElementById('recAmount').value = '';
    document.getElementById('recNote').value = '';
  },

  handleRecurringSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('recType').value;
    const category = document.getElementById('recCategory').value.trim();
    const amount = parseInt(document.getElementById('recAmount').value);
    const account = document.getElementById('recAccount').value;
    const frequency = document.getElementById('recFrequency').value;
    const note = document.getElementById('recNote').value.trim();

    if (!amount || amount <= 0) {
      this.toast('مبلغ معتبر وارد کنید', 'error');
      return;
    }
    if (!category) {
      this.toast('دسته را وارد کنید', 'error');
      return;
    }

    const icon = type === 'income' ? 'fa-arrow-up-long' : type === 'transfer' ? 'fa-right-left' : 'fa-arrow-down-long';
    const color = type === 'income' ? 'bg-emerald-500' : type === 'transfer' ? 'bg-slate-700' : 'bg-red-500';

    Store.addRecurringTransaction({
      type, category, amount, account, frequency, note, icon, color
    });
    this.closeModal('recurringFormModal');
    Render.renderRecurringList();
    this.toast('تراکنش تکراری تعریف شد', 'success');
  },

  deleteRecurring(id) {
    if (!confirm('حذف این تراکنش تکراری؟ تراکنش‌های قبلی ایجاد شده حذف نمی‌شوند.')) return;
    Store.deleteRecurring(id);
    Render.renderRecurringList();
    this.toast('تراکنش تکراری حذف شد', 'success');
  },

  toggleRecurring(id) {
    Store.toggleRecurring(id);
    Render.renderRecurringList();
  },

  // ==================== Yearly Reports ====================
  changeReportYear(delta) {
    if (!this.reportYear) this.reportYear = JalaliDate.today()[0];
    this.reportYear += delta;
    document.getElementById('reportYearLabel').innerText = Render.toPersian(this.reportYear);
    this.renderReportContent();
  },

  switchReportTab(tab) {
    this.reportTab = tab;
    // Update active button
    ['summary', 'income-expense', 'incomes', 'expenses'].forEach(t => {
      const btn = document.getElementById(`rpt-tab-${t}`);
      if (btn) {
        if (t === tab) {
          btn.classList.add('bg-teal-800', 'text-white');
          btn.classList.remove('text-slate-600', 'hover:bg-slate-50');
        } else {
          btn.classList.remove('bg-teal-800', 'text-white');
          btn.classList.add('text-slate-600', 'hover:bg-slate-50');
        }
      }
    });
    this.renderReportContent();
  },

  renderReportContent() {
    if (!this.reportYear) this.reportYear = JalaliDate.today()[0];
    document.getElementById('reportYearLabel').innerText = Render.toPersian(this.reportYear);
    Render.renderYearlyReport(this.reportYear, this.reportTab);
  },

  // ==================== Help Topics ====================
  openHelpTopic(topic) {
    const titles = {
      transactions: 'چگونه تراکنش‌ها را ثبت و مدیریت کنیم؟',
      reports: 'چگونه گزارش‌ها و نمودارها را مشاهده کنیم؟',
      categories: 'چگونه دسته‌ها و زیردسته‌ها را مدیریت کنیم؟',
      recurring: 'چگونه تراکنش‌های تکراری را تنظیم کنیم؟',
      budgets: 'چگونه بودجه ماهانه تعریف کنیم؟',
      backup: 'پشتیبان‌گیری و بازگردانی داده‌ها',
      faq: 'سوالات متداول (FAQ)'
    };
    document.getElementById('helpTopicTitle').innerText = titles[topic] || 'راهنما';
    document.getElementById('helpTopicContent').innerHTML = Render.getHelpContent(topic);
    document.getElementById('helpTopicModal').classList.remove('hidden');
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());

if (typeof window !== 'undefined') window.App = App;
