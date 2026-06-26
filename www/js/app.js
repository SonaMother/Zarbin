/* ============================================
   Zarbin - Main Application Controller
   کنترلر اصلی اپلیکیشن
   ============================================ */

const App = {
  init() {
    Store.init();
    // Apply font scale WITHOUT saving (Store.init may have just loaded a
    // placeholder state for first-run; saving it would prevent the
    // onboarding modal from showing on subsequent loads).
    this._applyFontScaleNoSave(Store.state.fontScale);
    this.applyDarkMode();
    this.updateVersionDisplay();
    this.bindEvents();
    this.populateSourceAccounts();

    if (Store.isFirstRun) {
      // Show onboarding modal; defer dashboard render until user picks a mode
      this.showOnboarding();
    } else if (Security.isLocked()) {
      // PIN-protected — show lock screen first
      this.showLockScreen();
    } else {
      Security.touchActivity();
      Render.renderDashboard();
    }
    this.updateSmsBadge();
    this.updateDemoModeToggle();
  },

  // Internal: apply font scale to DOM without persisting to localStorage.
  // Used during init() to avoid clobbering first-run state.
  _applyFontScaleNoSave(scaleVal) {
    // Set the CSS variable --font-scale on the app container.
    // CSS uses calc(px * var(--font-scale)) to scale ALL text sizes
    // including Tailwind's text-xs, text-[11px], etc.
    var scale = parseFloat(scaleVal) / 100;
    var input = document.getElementById('fontRangeInput');
    var label = document.getElementById('fontScaleLabel');
    var container = document.getElementById('appContainer');
    if (input) input.value = scaleVal;
    if (label) label.innerText = Render.toPersian(scaleVal) + '٪';
    if (container) container.style.setProperty('--font-scale', scale);
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
  // Maps Persian FAB labels to internal transaction types
  // (used to be inferred from form title string — now explicit)
  // Note: FORM_TYPE_MAP is set as a regular property below, not `static`.

  currentFormType: null,  // set by openTransactionForm

  openTransactionForm(type) {
    this.toggleFabMenu();
    // Store the explicit type so handleFormSubmit doesn't need to parse titles
    this.currentFormType = type;
    // Ensure dropdown reflects current accounts
    this.populateSourceAccounts();
    this.populateDestAccounts();
    this.populatePersonProjectDropdowns();

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

    // Set type hidden field (kept for backward compatibility)
    if (typeLabel) {
      typeLabel.value = type;
    }

    // Reset form
    document.getElementById('financialForm').reset();
    document.getElementById('formAmount').value = '';
    document.getElementById('formNote').value = '';
    // Reset recurring toggle from previous use
    this.recurringFormState = { enabled: false, frequency: 'monthly' };
    const rToggle = document.getElementById('formRecurringToggle');
    const rOpts = document.getElementById('formRecurringOptions');
    if (rToggle) rToggle.classList.remove('active');
    if (rOpts) rOpts.classList.add('hidden');
    this.setRecurringFrequency('monthly');

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
    const destAcc =  (document.getElementById('formDestAccount') ? document.getElementById('formDestAccount').value : '');
    const personId = (document.getElementById('formPerson') && document.getElementById('formPerson').value && document.getElementById('formPerson').value !== '__add_new__') ? document.getElementById('formPerson').value : '';
    const projectId = (document.getElementById('formProject') && document.getElementById('formProject').value && document.getElementById('formProject').value !== '__add_new__') ? document.getElementById('formProject').value : '';

    // Use explicit type set by openTransactionForm, not title parsing
    const typeKey = this.currentFormType;
    const FORM_TYPE_MAP = {
      'پرداخت': { type: 'expense',  icon: 'fa-arrow-down-long', color: 'bg-red-500' },
      'دریافت': { type: 'income',   icon: 'fa-arrow-up-long',   color: 'bg-emerald-500' },
      'وام':    { type: 'other',    icon: 'fa-people-group',    color: 'bg-amber-500' },
      'انتقال': { type: 'transfer', icon: 'fa-right-left',      color: 'bg-slate-700' }
    };
    const mapping = FORM_TYPE_MAP[typeKey] || { type: 'other', icon: 'fa-tag', color: 'bg-amber-500' };
    let type = mapping.type;
    let icon = mapping.icon;
    let color = mapping.color;

    // Transfer-specific validation
    if (type === 'transfer') {
      if (!destAcc) {
        this.toast('حساب مقصد را انتخاب کنید', 'error');
        return;
      }
      if (destAcc === acc) {
        this.toast('حساب مبدا و مقصد نمی‌توانند یکسان باشند', 'error');
        return;
      }
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
    if (personId) tx.personId = personId;
    if (projectId) tx.projectId = projectId;

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
    const type =  (document.querySelector('input[name="newAccountType"]:checked') ? document.querySelector('input[name="newAccountType"]:checked').value : 'bank') || 'bank';

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
    var scale = parseFloat(scaleVal) / 100;
    var input = document.getElementById('fontRangeInput');
    var label = document.getElementById('fontScaleLabel');
    var container = document.getElementById('appContainer');
    if (input) input.value = scaleVal;
    if (label) label.innerText = Render.toPersian(scaleVal) + '٪';
    if (container) container.style.setProperty('--font-scale', scale);
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
    var modal = document.getElementById('datePickerModal');
    modal.classList.remove('hidden');
    this._datePickerTarget = 'transaction';
    this.renderCalendarGrid();
  },

  // Reusable date picker — opens calendar, writes selected date to the
  // specified hidden input and updates its display label.
  openDatePickerFor(inputId) {
    var modal = document.getElementById('datePickerModal');
    modal.classList.remove('hidden');
    this._datePickerTarget = inputId;
    // Read current value from the hidden input and set as selectedDate
    var input = document.getElementById(inputId);
    if (input && input.value) {
      var parts = input.value.split('/');
      if (parts.length === 3) {
        Store.state.selectedDate = input.value;
        Store.state.selectedMonth = {
          jy: parseInt(parts[0]),
          jm: parseInt(parts[1])
        };
      }
    }
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
      // Compute weekday for this day to highlight Fridays
      const [dgy, dgm, dgd] = JalaliDate.jalaliToGregorian(jy, jm, day);
      const weekday = new Date(dgy, dgm - 1, dgd).getDay();
      const persianWeekday = (weekday + 1) % 7;
      const isFriday = persianWeekday === 6;
      const holiday = Render.getPersianHoliday(jy, jm, day);

      let cellClass;
      if (active) {
        cellClass = 'bg-teal-900 text-white shadow-sm';
      } else if (holiday) {
        cellClass = 'text-red-600 hover:bg-red-50';
      } else if (isFriday) {
        cellClass = 'text-red-400 hover:bg-slate-100';
      } else {
        cellClass = 'hover:bg-slate-100 text-slate-700';
      }
      html += `
        <div onclick="App.selectDayFromCalendar('${dateStr}')" class="p-1.5 rounded-full text-center cursor-pointer font-bold ${cellClass}" ${holiday ? `title="${Render.escapeHtml(holiday)}"` : ''}>
          ${Render.toPersian(day)}
        </div>
      `;
    }
    grid.innerHTML = html;

    // Update calendar header
    document.getElementById('calendarHeader').innerText = `${JALALI_MONTHS[jm - 1]} ${Render.toPersian(jy)}`;
  },

  selectDayFromCalendar(dateStr) {
    var target = this._datePickerTarget || 'transaction';
    this.closeModal('datePickerModal');

    if (target === 'transaction') {
      this.selectDay(dateStr);
      // Update the transaction form's date label
      var parts = dateStr.split('/');
      var label = document.getElementById('formDateLabel');
      if (label) {
        label.innerText = JALALI_MONTHS[parseInt(parts[1]) - 1] + ' ' +
          Render.toPersian(parseInt(parts[2])) + ', ' + Render.toPersian(parts[0]);
      }
    } else {
      // Generic date picker — update hidden input + display label
      var input = document.getElementById(target);
      if (input) input.value = dateStr;
      var labelEl = document.getElementById(target + 'Label');
      if (labelEl) {
        // Convert to Persian digits for display
        labelEl.innerText = Render.toPersian(dateStr);
      }
    }
    this._datePickerTarget = null;
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

  // ==================== PIN Lock / Security ====================
  pinEntryBuffer: '',

  showLockScreen() {
    const modal = document.getElementById('lockScreenModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    this.pinEntryBuffer = '';
    this.updatePinDots();
    // Try biometric automatically if enabled
    if (Store.state.security && Store.state.security.biometricEnabled) {
      setTimeout(() => this.tryBiometricUnlock(), 400);
    }
  },

  hideLockScreen() {
    const modal = document.getElementById('lockScreenModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  // PIN pad handler — called from lock screen digit buttons
  pressPinDigit(digit) {
    if (this.pinEntryBuffer.length >= 8) return;
    this.pinEntryBuffer += digit;
    this.updatePinDots();
    if (this.pinEntryBuffer.length >= 4) {
      // Auto-submit when user enters at least 4 digits (or wait for explicit submit?)
      // We let the user tap the checkmark to submit, so don't auto-submit.
    }
  },

  pressPinBackspace() {
    this.pinEntryBuffer = this.pinEntryBuffer.slice(0, -1);
    this.updatePinDots();
  },

  updatePinDots() {
    const dots = document.querySelectorAll('#lockScreenModal .pin-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('filled', i < this.pinEntryBuffer.length);
    });
  },

  async submitPin() {
    if (this.pinEntryBuffer.length < 4) {
      this.toast('PIN باید حداقل ۴ رقم باشد', 'error');
      return;
    }
    const ok = await Security.verifyPin(this.pinEntryBuffer, Store.state.security.pinHash);
    if (ok) {
      Security.unlock();
      this.pinEntryBuffer = '';
      this.hideLockScreen();
      Render.renderDashboard();
      this.toast('خوش آمدید!', 'success');
    } else {
      Store.state.security.failedAttempts = (Store.state.security.failedAttempts || 0) + 1;
      Store.save();
      this.pinEntryBuffer = '';
      this.updatePinDots();
      // Shake animation
      const pad = document.querySelector('#lockScreenModal .pin-pad');
      if (pad) {
        pad.classList.add('shake');
        setTimeout(() => pad.classList.remove('shake'), 500);
      }
      const attempts = Store.state.security.failedAttempts;
      if (attempts >= 5) {
        this.toast('۵ تلاش ناموفق! برای امنیت، قفل PIN را تنظیم مجدد کنید (تنظیمات → قفل PIN → غیرفعال‌سازی).', 'error');
      } else {
        this.toast(`PIN اشتباه است (${this.toPersianDigits(attempts)} تلاش)`, 'error');
      }
    }
  },

  async tryBiometricUnlock() {
    const ok = await Security.biometricUnlock();
    if (ok) {
      this.hideLockScreen();
      Render.renderDashboard();
      this.toast('خوش آمدید!', 'success');
    }
  },

  toPersianDigits(n) {
    return Render.toPersian(n);
  },

  // PIN setup flow (from settings)
  async openPinSetup() {
    this.toggleSidebar(false);
    const modal = document.getElementById('pinSetupModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    // Reset
    this._pinSetupStep = 1;  // 1 = enter new pin, 2 = confirm
    this._pinSetupFirst = '';
    this.pinEntryBuffer = '';
    this.updatePinSetupDots();
    document.getElementById('pinSetupTitle').innerText = 'تعیین PIN جدید';
    document.getElementById('pinSetupSubtitle').innerText = 'یک PIN ۴ تا ۸ رقمی وارد کنید';
  },

  closePinSetup() {
    const modal = document.getElementById('pinSetupModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  pressPinSetupDigit(digit) {
    if (this.pinEntryBuffer.length >= 8) return;
    this.pinEntryBuffer += digit;
    this.updatePinSetupDots();
  },

  pressPinSetupBackspace() {
    this.pinEntryBuffer = this.pinEntryBuffer.slice(0, -1);
    this.updatePinSetupDots();
  },

  updatePinSetupDots() {
    const dots = document.querySelectorAll('#pinSetupModal .pin-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('filled', i < this.pinEntryBuffer.length);
    });
  },

  async submitPinSetup() {
    if (this.pinEntryBuffer.length < 4) {
      this.toast('PIN باید حداقل ۴ رقم باشد', 'error');
      return;
    }
    if (this._pinSetupStep === 1) {
      this._pinSetupFirst = this.pinEntryBuffer;
      this._pinSetupStep = 2;
      this.pinEntryBuffer = '';
      this.updatePinSetupDots();
      document.getElementById('pinSetupTitle').innerText = 'تایید PIN';
      document.getElementById('pinSetupSubtitle').innerText = 'PIN را دوباره وارد کنید';
    } else {
      // Confirm step
      if (this.pinEntryBuffer !== this._pinSetupFirst) {
        this.toast('PIN ها مطابقت ندارند. دوباره تلاش کنید.', 'error');
        this._pinSetupStep = 1;
        this._pinSetupFirst = '';
        this.pinEntryBuffer = '';
        this.updatePinSetupDots();
        document.getElementById('pinSetupTitle').innerText = 'تعیین PIN جدید';
        document.getElementById('pinSetupSubtitle').innerText = 'یک PIN ۴ تا ۸ رقمی وارد کنید';
        return;
      }
      // Save
      await Security.setPin(this.pinEntryBuffer);
      this.closePinSetup();
      this.toast('PIN با موفقیت تنظیم شد', 'success');
      // Update sidebar toggle state
      const toggle = document.getElementById('pinLockToggle');
      if (toggle) toggle.classList.add('active');
    }
  },

  toggleDemoMode() {
    // Determine current mode: if we have demo data (5 accounts, 6+ txs), we're in demo
    var isDemo = Object.keys(Store.state.accounts).length > 1 || Store.state.transactions.length > 0;
    var msg = isDemo
      ? 'تغییر به حالت تمیز: تمام داده‌های فعلی حذف می‌شود و اپلیکیشن برای استفاده واقعی آماده می‌شود. ادامه؟'
      : 'تغییر به حالت دمو: داده‌های نمونه بارگذاری می‌شود. ادامه؟';
    if (!confirm(msg)) return;
    this.toggleSidebar(false);
    if (isDemo) {
      Store.reset('clean');
    } else {
      Store.reset('demo');
    }
    this.toast('حالت تغییر یافت. اپلیکیشن مجدداً بارگذاری می‌شود...', 'success');
    setTimeout(function() { location.reload(); }, 800);
  },

  updateDemoModeToggle() {
    var isDemo = Object.keys(Store.state.accounts).length > 1 || Store.state.transactions.length > 0;
    var toggle = document.getElementById('demoModeToggle');
    if (toggle) {
      toggle.classList.toggle('active', isDemo);
    }
  },

  togglePinLock() {
    if (Security.isPinEnabled()) {
      if (confirm('غیرفعال‌سازی قفل PIN؟ داده‌های شما باقی می‌ماند اما قفل غیرفعال می‌شود.')) {
        Security.disablePin();
        var toggle = document.getElementById('pinLockToggle');
        if (toggle) toggle.classList.remove('active');
        this.toast('قفل PIN غیرفعال شد', 'success');
      }
    } else {
      this.openPinSetup();
    }
  },

  lockNow() {
    if (!Security.isPinEnabled()) {
      this.toast('ابتدا قفل PIN را فعال کنید', 'error');
      return;
    }
    this.toggleSidebar(false);
    Security.lock();
    this.showLockScreen();
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
    var sel = document.getElementById('formSourceAccount');
    if (!sel) return;
    sel.innerHTML = '';
    Object.keys(Store.state.accounts).forEach(function(acc) {
      var opt = document.createElement('option');
      opt.value = acc;
      opt.textContent = acc;
      sel.appendChild(opt);
    });
    sel.value = Store.state.activeAccount;
  },

  populateDestAccounts() {
    var sel = document.getElementById('formDestAccount');
    if (!sel) return;
    sel.innerHTML = '';
    Object.keys(Store.state.accounts).forEach(function(acc) {
      var opt = document.createElement('option');
      opt.value = acc;
      opt.textContent = acc;
      sel.appendChild(opt);
    });
    var sourceAcc = Store.state.activeAccount;
    var others = Object.keys(Store.state.accounts).filter(function(a) { return a !== sourceAcc; });
    if (others.length) sel.value = others[0];
  },

  populatePersonProjectDropdowns() {
    // Persons
    var personSel = document.getElementById('formPerson');
    if (personSel) {
      personSel.innerHTML = '<option value="">— هیچ‌کس —</option>';
      (Store.state.persons || []).forEach(function(p) {
        var opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        personSel.appendChild(opt);
      });
      // Add "add new" option
      var addOpt = document.createElement('option');
      addOpt.value = '__add_new__';
      addOpt.textContent = '＋ افزودن شخص جدید...';
      personSel.appendChild(addOpt);
    }
    // Projects
    var projSel = document.getElementById('formProject');
    if (projSel) {
      projSel.innerHTML = '<option value="">— بدون پروژه —</option>';
      (Store.state.projects || []).forEach(function(pr) {
        var opt = document.createElement('option');
        opt.value = pr.id;
        opt.textContent = pr.name;
        projSel.appendChild(opt);
      });
      var addProjOpt = document.createElement('option');
      addProjOpt.value = '__add_new__';
      addProjOpt.textContent = '＋ افزودن پروژه جدید...';
      projSel.appendChild(addProjOpt);
    }
  },

  onFormPersonChange(value) {
    if (value === '__add_new__') {
      var name = prompt('نام شخص جدید را وارد کنید:');
      if (name && name.trim()) {
        var p = Store.addPerson({ name: name.trim(), phone: '', relationship: 'other', note: '' });
        this.populatePersonProjectDropdowns();
        document.getElementById('formPerson').value = p.id;
        this.toast('شخص اضافه شد: ' + name.trim(), 'success');
      } else {
        document.getElementById('formPerson').value = '';
      }
    }
  },

  onFormProjectChange(value) {
    if (value === '__add_new__') {
      var name = prompt('نام پروژه جدید را وارد کنید:');
      if (name && name.trim()) {
        var pr = Store.addProject({ name: name.trim(), note: '' });
        this.populatePersonProjectDropdowns();
        document.getElementById('formProject').value = pr.id;
        this.toast('پروژه اضافه شد: ' + name.trim(), 'success');
      } else {
        document.getElementById('formProject').value = '';
      }
    }
  },

  // ==================== Transaction Details ====================
  showTransactionDetails(id) {
    // id may be a UUID string (crypto.randomUUID) — never parse as int
    const tx = Store.state.transactions.find(t => String(t.id) === String(id));
    if (!tx) return;
    const modal = document.getElementById('txDetailsModal');
    document.getElementById('txDetailsCategory').innerText = tx.category;
    document.getElementById('txDetailsAmount').innerText = Render.formatWithCurrency(tx.amount);
    document.getElementById('txDetailsDate').innerText = `${Render.formatDate(tx.date)} ${Render.formatTime(tx.time || '')}`;
    document.getElementById('txDetailsAccount').innerText = tx.account + (tx.destAccount ? ` ← ${tx.destAccount}` : '');
    document.getElementById('txDetailsType').innerText = tx.type === 'expense' ? 'هزینه' : tx.type === 'income' ? 'درآمد' : tx.type === 'transfer' ? 'انتقال' : 'سایر';
    document.getElementById('txDetailsNote').innerText = tx.note || '—';
    document.getElementById('txDetailsBalance').innerText = Render.formatMoney(tx.balance || 0);
    modal.dataset.txId = tx.id;
    modal.classList.remove('hidden');
  },

  deleteTransactionFromDetails() {
    const modal = document.getElementById('txDetailsModal');
    const id = modal.dataset.txId;
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

    // Periodic save (in case of background kill) + auto-lock
    // On background: just save. On foreground: check if we should auto-lock.
    // Note: we do NOT call touchActivity on background — that would reset the
    // inactivity timer and prevent auto-lock from ever firing after a real
    // period of inactivity. The last touch from the user stays as the reference.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        Store.save();
      } else {
        // App became visible again — check if we should lock
        if (Security.isPinEnabled() && Security.isLocked()) {
          this.showLockScreen();
        }
      }
    });

    // Touch activity on user interaction (only when unlocked).
    // This updates lastActiveAt so the auto-lock timer resets on every tap.
    ['click', 'touchstart'].forEach(evt => {
      document.addEventListener(evt, () => {
        if (!Security.isLocked()) Security.touchActivity();
      }, { passive: true });
    });
  },

  // ==================== Bottom Navigation ====================
  activeMainView: 'home',
  reportYear: null,
  reportTab: 'summary',
  categoryFilter: 'all',
  categorySearchQuery: '',
  recurringFormState: { enabled: false, frequency: 'monthly' },

  // Transaction search/filter state
  txSearchQuery: '',
  txFilters: {
    types: new Set(),       // 'expense' | 'income' | 'other' | 'transfer'
    account: '',            // account name or ''
    amountMin: null,
    amountMax: null
  },

  // When filters/search are active, we ignore the selected date and show all matching txs
  isFilteringActive() {
    return this.txSearchQuery.length > 0 ||
           this.txFilters.types.size > 0 ||
           this.txFilters.account !== '' ||
           this.txFilters.amountMin !== null ||
           this.txFilters.amountMax !== null;
  },

  applyTxSearch(query) {
    this.txSearchQuery = (query || '').trim();
    const clearBtn = document.getElementById('txSearchClear');
    if (clearBtn) clearBtn.classList.toggle('hidden', !this.txSearchQuery);
    Render.renderDashboard();
  },

  clearTxSearch() {
    this.txSearchQuery = '';
    const input = document.getElementById('txSearchInput');
    if (input) input.value = '';
    const clearBtn = document.getElementById('txSearchClear');
    if (clearBtn) clearBtn.classList.add('hidden');
    Render.renderDashboard();
  },

  toggleFilterSheet() {
    const sheet = document.getElementById('filterSheet');
    if (!sheet) return;
    sheet.classList.toggle('open');
    // Populate account dropdown on first open
    const sel = document.getElementById('filterAccount');
    if (sel && sel.options.length <= 1) {
      Object.keys(Store.state.accounts).forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc;
        opt.textContent = acc;
        sel.appendChild(opt);
      });
    }
  },

  toggleFilter(category, value) {
    if (category === 'type') {
      if (this.txFilters.types.has(value)) {
        this.txFilters.types.delete(value);
      } else {
        this.txFilters.types.add(value);
      }
      const btn = document.getElementById(`filter-type-${value}`);
      if (btn) {
        const active = this.txFilters.types.has(value);
        btn.classList.toggle('bg-teal-800', active);
        btn.classList.toggle('text-white', active);
        btn.classList.toggle('text-slate-600', !active);
      }
    }
    this.updateFilterBadge();
    Render.renderDashboard();
  },

  onFilterAccountChange(value) {
    this.txFilters.account = value || '';
    this.updateFilterBadge();
    Render.renderDashboard();
  },

  applyAmountFilter() {
    const min =  (document.getElementById('filterAmountMin') ? document.getElementById('filterAmountMin').value : '');
    const max =  (document.getElementById('filterAmountMax') ? document.getElementById('filterAmountMax').value : '');
    this.txFilters.amountMin = min ? parseInt(min) : null;
    this.txFilters.amountMax = max ? parseInt(max) : null;
    this.updateFilterBadge();
    Render.renderDashboard();
  },

  updateFilterBadge() {
    let count = 0;
    if (this.txFilters.types.size > 0) count++;
    if (this.txFilters.account) count++;
    if (this.txFilters.amountMin !== null || this.txFilters.amountMax !== null) count++;
    const badge = document.getElementById('filterCountBadge');
    if (badge) {
      badge.classList.toggle('hidden', count === 0);
      if (count > 0) badge.innerText = Render.toPersian(count);
    }
  },

  clearAllFilters() {
    this.txSearchQuery = '';
    this.txFilters.types.clear();
    this.txFilters.account = '';
    this.txFilters.amountMin = null;
    this.txFilters.amountMax = null;
    // Reset UI
    const input = document.getElementById('txSearchInput');
    if (input) input.value = '';
    ['expense','income','other','transfer'].forEach(t => {
      const btn = document.getElementById(`filter-type-${t}`);
      if (btn) {
        btn.classList.remove('bg-teal-800','text-white');
        btn.classList.add('text-slate-600');
      }
    });
    const accSel = document.getElementById('filterAccount');
    if (accSel) accSel.value = '';
    const min = document.getElementById('filterAmountMin');
    if (min) min.value = '';
    const max = document.getElementById('filterAmountMax');
    if (max) max.value = '';
    const clearBtn = document.getElementById('txSearchClear');
    if (clearBtn) clearBtn.classList.add('hidden');
    this.updateFilterBadge();
    Render.renderDashboard();
    this.toast('فیلترها پاک شدند', 'success');
  },

  // Returns the filtered list of transactions (respects search + filters)
  // When NOT filtering, returns only txs for activeAccount + selectedDate.
  getFilteredTransactions() {
    const state = Store.state;
    let txs = state.transactions;

    if (this.isFilteringActive()) {
      // Apply search and filters across ALL transactions (ignore date/account)
      const q = this.txSearchQuery.toLowerCase();
      const persianNorm = (s) => (s || '').toString().toLowerCase();
      txs = txs.filter(t => {
        // Search query
        if (q) {
          const haystack = [t.category, t.note, t.account, t.destAccount, t.type]
            .map(persianNorm).join(' ');
          if (!haystack.includes(q)) return false;
        }
        // Type filter
        if (this.txFilters.types.size > 0 && !this.txFilters.types.has(t.type)) return false;
        // Account filter
        if (this.txFilters.account && t.account !== this.txFilters.account && t.destAccount !== this.txFilters.account) return false;
        // Amount filter
        if (this.txFilters.amountMin !== null && t.amount < this.txFilters.amountMin) return false;
        if (this.txFilters.amountMax !== null && t.amount > this.txFilters.amountMax) return false;
        return true;
      });
      return txs;
    } else {
      // Normal mode: only active account + selected date
      const selDate = state.selectedDate;
      return txs.filter(t => t.account === state.activeAccount && t.date === selDate);
    }
  },

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
    const color =  (document.querySelector('input[name="catColor"]:checked') ? document.querySelector('input[name="catColor"]:checked').value : '#0f766e') || '#0f766e';
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
  },

  // ==================== Cheque Management ====================
  activeChequeTab: 'received',

  openChequeManager() {
    document.getElementById('chequeManagerModal').classList.remove('translate-x-full');
    this.activeChequeTab = 'received';
    this.switchChequeTab('received');
  },

  closeChequeManager() {
    document.getElementById('chequeManagerModal').classList.add('translate-x-full');
  },

  switchChequeTab(tab) {
    this.activeChequeTab = tab;
    ['received', 'issued', 'upcoming'].forEach(t => {
      const btn = document.getElementById(`chequeTab-${t}`);
      if (btn) {
        const active = t === tab;
        btn.classList.toggle('border-teal-700', active);
        btn.classList.toggle('text-teal-700', active);
        btn.classList.toggle('border-transparent', !active);
        btn.classList.toggle('text-slate-600', !active);
      }
    });
    Render.renderChequeList(tab);
  },

  openChequeForm() {
    // Populate account dropdown
    var sel = document.getElementById('newChequeAccount');
    sel.innerHTML = '';
    Object.keys(Store.state.accounts).forEach(function(acc) {
      var opt = document.createElement('option');
      opt.value = acc;
      opt.textContent = acc;
      sel.appendChild(opt);
    });
    // Set today's date as default
    var today = JalaliDate.today();
    var todayStr = today[0] + '/' + String(today[1]).padStart(2,'0') + '/' + String(today[2]).padStart(2,'0');
    document.getElementById('newChequeIssueDate').value = todayStr;
    document.getElementById('newChequeDueDate').value = todayStr;
    document.getElementById('newChequeIssueDateLabel').innerText = Render.toPersian(todayStr);
    document.getElementById('newChequeDueDateLabel').innerText = Render.toPersian(todayStr);
    document.getElementById('chequeFormModal').classList.remove('hidden');
  },

  handleChequeSubmit(e) {
    e.preventDefault();
    const amount = parseInt(document.getElementById('newChequeAmount').value);
    if (!amount || amount <= 0) {
      this.toast('مبلغ معتبر وارد کنید', 'error');
      return;
    }
    const dueDate = document.getElementById('newChequeDueDate').value.trim();
    if (!/^\d{4}\/\d{2}\/\d{2}$/.test(dueDate)) {
      this.toast('سررسید را به فرمت 1405/01/01 وارد کنید', 'error');
      return;
    }
    Store.addCheque({
      type: document.getElementById('newChequeType').value,
      bank: document.getElementById('newChequeBank').value,
      chequeNumber: document.getElementById('newChequeNumber').value.trim(),
      sayadiSerial: document.getElementById('newChequeSayadi').value.trim(),
      amount,
      issueDate: document.getElementById('newChequeIssueDate').value.trim(),
      dueDate,
      account: document.getElementById('newChequeAccount').value,
      payee: document.getElementById('newChequePayee').value.trim(),
      note: document.getElementById('newChequeNote').value.trim()
    });
    this.closeModal('chequeFormModal');
    Render.renderChequeList(this.activeChequeTab);
    this.toast('چک با موفقیت ثبت شد', 'success');
  },

  cashCheque(id) {
    if (!confirm('وصول این چک؟ مبلغ به حساب مرتبط افزوده/کسر می‌شود.')) return;
    Store.updateChequeStatus(id, 'cashed');
    Render.renderChequeList(this.activeChequeTab);
    this.toast('چک وصول شد و تراکنش مرتبط ثبت گردید', 'success');
  },

  bounceCheque(id) {
    const reason = prompt('دلیل برگشت چک را وارد کنید (اختیاری):');
    Store.updateChequeStatus(id, 'bounced', { bouncedReason: reason || '' });
    Render.renderChequeList(this.activeChequeTab);
    this.toast('چک به‌عنوان برگشتی علامت‌گذاری شد', 'error');
  },

  deleteCheque(id) {
    if (!confirm('حذف این چک؟')) return;
    Store.deleteCheque(id);
    Render.renderChequeList(this.activeChequeTab);
    this.toast('چک حذف شد', 'success');
  },

  // ==================== Loan Management ====================
  openLoanManager() {
    document.getElementById('loanManagerModal').classList.remove('translate-x-full');
    Render.renderLoanList();
  },

  closeLoanManager() {
    document.getElementById('loanManagerModal').classList.add('translate-x-full');
  },

  openLoanForm() {
    var sel = document.getElementById('newLoanAccount');
    sel.innerHTML = '';
    Object.keys(Store.state.accounts).forEach(function(acc) {
      var opt = document.createElement('option');
      opt.value = acc;
      opt.textContent = acc;
      sel.appendChild(opt);
    });
    var today = JalaliDate.today();
    var todayStr = today[0] + '/' + String(today[1]).padStart(2,'0') + '/' + String(today[2]).padStart(2,'0');
    document.getElementById('newLoanStartDate').value = todayStr;
    document.getElementById('newLoanStartDateLabel').innerText = Render.toPersian(todayStr);
    document.getElementById('loanFormModal').classList.remove('hidden');
  },

  handleLoanSubmit(e) {
    e.preventDefault();
    const principal = parseInt(document.getElementById('newLoanPrincipal').value);
    if (!principal || principal <= 0) {
      this.toast('مبلغ وام معتبر وارد کنید', 'error');
      return;
    }
    const termMonths = parseInt(document.getElementById('newLoanTerm').value);
    if (!termMonths || termMonths < 1) {
      this.toast('تعداد ماه معتبر وارد کنید', 'error');
      return;
    }
    Store.addLoan({
      type: document.getElementById('newLoanType').value,
      counterparty: document.getElementById('newLoanCounterparty').value.trim(),
      principal,
      annualInterestRate: parseFloat(document.getElementById('newLoanRate').value || '0'),
      termMonths,
      startDate: document.getElementById('newLoanStartDate').value.trim(),
      account: document.getElementById('newLoanAccount').value,
      note: document.getElementById('newLoanNote').value.trim()
    });
    this.closeModal('loanFormModal');
    Render.renderLoanList();
    this.toast('وام با موفقیت ثبت شد و برنامه اقساط ایجاد گردید', 'success');
  },

  openLoanDetail(id) {
    Render.renderLoanDetail(id);
  },

  payInstallment(loanId, installmentId) {
    if (!confirm('پرداخت این قسط؟ مبلغ از حساب کسر/به حساب افزوده می‌شود.')) return;
    Store.payInstallment(loanId, installmentId);
    Render.renderLoanDetail(loanId);
    Render.renderLoanList();
    this.toast('قسط پرداخت شد', 'success');
  },

  deleteLoan(id) {
    if (!confirm('حذف این وام؟ اصل وام از حساب برگردانده می‌شود.')) return;
    Store.deleteLoan(id);
    Render.renderLoanList();
    this.toast('وام حذف شد', 'success');
  },

  // ==================== Person Management ====================
  openPersonManager() {
    document.getElementById('personManagerModal').classList.remove('translate-x-full');
    Render.renderPersonList();
  },

  closePersonManager() {
    document.getElementById('personManagerModal').classList.add('translate-x-full');
  },

  openPersonForm() {
    document.getElementById('personFormModal').classList.remove('hidden');
    ['newPersonName','newPersonPhone','newPersonNote'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  },

  handlePersonSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('newPersonName').value.trim();
    if (!name) {
      this.toast('نام را وارد کنید', 'error');
      return;
    }
    Store.addPerson({
      name,
      phone: document.getElementById('newPersonPhone').value.trim(),
      relationship: document.getElementById('newPersonRelationship').value,
      note: document.getElementById('newPersonNote').value.trim()
    });
    this.closeModal('personFormModal');
    Render.renderPersonList();
    this.toast('شخص اضافه شد', 'success');
  },

  deletePerson(id) {
    if (!confirm('حذف این شخص؟ تراکنش‌های مرتبط حذف نمی‌شوند.')) return;
    Store.deletePerson(id);
    Render.renderPersonList();
    this.toast('شخص حذف شد', 'success');
  },

  // ==================== Custom Range Report ====================
  openCustomRangeReport() {
    var today = JalaliDate.today();
    var todayStr = today[0] + '/' + String(today[1]).padStart(2,'0') + '/' + String(today[2]).padStart(2,'0');
    document.getElementById('rangeFromDate').value = todayStr;
    document.getElementById('rangeToDate').value = todayStr;
    document.getElementById('rangeFromDateLabel').innerText = Render.toPersian(todayStr);
    document.getElementById('rangeToDateLabel').innerText = Render.toPersian(todayStr);
    document.getElementById('customRangeModal').classList.remove('translate-x-full');
    this.runCustomRangeReport();
  },

  closeCustomRangeReport() {
    document.getElementById('customRangeModal').classList.add('translate-x-full');
  },

  runCustomRangeReport() {
    const from = document.getElementById('rangeFromDate').value.trim();
    const to = document.getElementById('rangeToDate').value.trim();
    if (!/^\d{4}\/\d{2}\/\d{2}$/.test(from) || !/^\d{4}\/\d{2}\/\d{2}$/.test(to)) {
      this.toast('تاریخ‌ها را به فرمت 1405/01/01 وارد کنید', 'error');
      return;
    }
    if (from > to) {
      this.toast('تاریخ شروع باید قبل از پایان باشد', 'error');
      return;
    }
    Render.renderCustomRangeReport(from, to);
  },

  exportCustomRangeCSV() {
    const from = document.getElementById('rangeFromDate').value.trim();
    const to = document.getElementById('rangeToDate').value.trim();
    if (!from || !to) { this.toast('ابتدا بازه را تعیین کنید', 'error'); return; }
    const txs = Store.getTransactionsInRange(from, to);
    if (!txs.length) { this.toast('تراکنشی در این بازه نیست', 'error'); return; }
    // Reuse Exporter but with custom slice — temporarily replace the function
    const origGetTx = () => Store.state.transactions;
    Store.state.transactions._customSlice = txs;
    // Build CSV inline
    const headers = ['تاریخ','ساعت','نوع','دسته','حساب','مبلغ','یادداشت'];
    const rows = txs.map(t => [
      t.date, t.time || '',
      t.type === 'expense' ? 'هزینه' : t.type === 'income' ? 'درآمد' : t.type === 'transfer' ? 'انتقال' : 'سایر',
      t.category, t.account, t.amount, t.note || ''
    ]);
    let csv = '\uFEFF' + headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(c => {
        const s = String(c || '');
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g,'""')}"` : s;
      }).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zarbin-range-${from}-to-${to}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.toast('خروجی CSV ایجاد شد', 'success');
  },

  exportCustomRangePDF() {
    const from = document.getElementById('rangeFromDate').value.trim();
    const to = document.getElementById('rangeToDate').value.trim();
    if (!from || !to) { this.toast('ابتدا بازه را تعیین کنید', 'error'); return; }
    const summary = Store.getRangeSummary(from, to);
    const txs = Store.getTransactionsInRange(from, to);
    const rows = txs.map(t => `
      <tr>
        <td>${Render.formatDate(t.date)} ${Render.formatTime(t.time||'')}</td>
        <td>${Render.escapeHtml(t.category)}</td>
        <td>${Render.escapeHtml(t.account)}</td>
        <td style="text-align:left;color:${t.type==='income'?'#16a34a':t.type==='expense'?'#dc2626':'#d97706'}">${t.type==='income'?'+':t.type==='expense'?'−':''}${Render.formatMoney(t.amount)}</td>
      </tr>
    `).join('');
    const html = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><title>گزارش بازه زرین</title>
<style>body{font-family:Vazirmatn,Tahoma,sans-serif;padding:30px;color:#1e293b}.header{border-bottom:3px solid #0f3d37;padding-bottom:15px;margin-bottom:20px}.header h1{color:#0f3d37;margin:0;font-size:22px}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}.summary .card{background:#f0f5f4;padding:12px;border-radius:8px;border-right:4px solid #0f766e}.summary .label{font-size:11px;color:#64748b}.summary .value{font-size:16px;font-weight:bold;margin-top:4px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#0f3d37;color:white;padding:10px;text-align:right}td{padding:8px;border-bottom:1px solid #e2e8f0}tr:nth-child(even){background:#f8fafc}.footer{margin-top:30px;padding-top:15px;border-top:1px solid #e2e8f0;text-align:center;font-size:10px;color:#94a3b8}@media print{body{padding:0}}</style>
</head><body>
<div class="header"><h1>گزارش بازه دلخواه زرین</h1><div style="font-size:12px;color:#64748b;margin-top:5px">از ${Render.formatDate(from)} تا ${Render.formatDate(to)}</div></div>
<div class="summary">
  <div class="card"><div class="label">درآمد</div><div class="value" style="color:#16a34a">${Render.formatWithCurrency(summary.income)}</div></div>
  <div class="card"><div class="label">هزینه</div><div class="value" style="color:#dc2626">${Render.formatWithCurrency(summary.expense)}</div></div>
  <div class="card"><div class="label">پس‌انداز</div><div class="value" style="color:${summary.savings>=0?'#16a34a':'#dc2626'}">${Render.formatWithCurrency(summary.savings)}</div></div>
  <div class="card"><div class="label">تعداد</div><div class="value">${Render.toPersian(summary.count)}</div></div>
</div>
<table><thead><tr><th>تاریخ</th><th>دسته</th><th>حساب</th><th>مبلغ</th></tr></thead><tbody>${rows}</tbody></table>
<div class="footer">زرین · Zarbin v${APP_VERSION} — گزارش بازه دلخواه</div>
<button class="no-print" onclick="window.print()" style="margin-top:20px;padding:10px 20px;background:#0f3d37;color:white;border:none;border-radius:8px;cursor:pointer;font-family:inherit;">چاپ / ذخیره PDF</button>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) { this.toast('اجازه باز شدن پنجره را بدهید', 'error'); return; }
    w.document.write(html);
    w.document.close();
  },

  // ==================== Balance Sheet ====================
  openBalanceSheet() {
    document.getElementById('balanceSheetModal').classList.remove('translate-x-full');
    Render.renderBalanceSheet();
  },

  closeBalanceSheet() {
    document.getElementById('balanceSheetModal').classList.add('translate-x-full');
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());

if (typeof window !== 'undefined') window.App = App;
