/* ============================================
   Zarbin - Rendering Module
   ماژول رندر کردن رابط کاربری
   ============================================ */

const Render = {
  // Persian digit conversion
  toPersian(num) {
    const id = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/[0-9]/g, w => id[+w]);
  },

  // Format currency with thousands separators
  formatMoney(amount) {
    const state = Store.state;
    let value = amount;
    if (state.baseCurrency === 'تومان') {
      value = Math.floor(amount / 10);
    }
    const formatted = Math.abs(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const sign = value < 0 ? '− ' : '';
    return sign + this.toPersian(formatted);
  },

  // Format with currency suffix
  formatWithCurrency(amount) {
    return `${this.formatMoney(amount)} ${Store.state.baseCurrency}`;
  },

  // Format a date string YYYY/MM/DD to Persian display
  formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    return this.toPersian(parts[0]) + '/' + this.toPersian(parts[1]) + '/' + this.toPersian(parts[2]);
  },

  formatTime(timeStr) {
    if (!timeStr) return '';
    return this.toPersian(timeStr);
  },

  // ==================== Dashboard ====================
  renderDashboard() {
    const state = Store.state;
    const list = document.getElementById('transactionsList');
    if (!list) return;

    const selDate = state.selectedDate;
    // Filter transactions by active account AND selected date
    const visibleTx = state.transactions.filter(t => t.account === state.activeAccount && t.date === selDate);

    let itemsCount = visibleTx.length;
    let totalExpense = 0, totalIncome = 0, totalOther = 0;
    const categories = { expense: [], other: [], income: [] };

    visibleTx.forEach(t => {
      if (t.type === 'expense') {
        totalExpense += t.amount;
        categories.expense.push(t);
      } else if (t.type === 'income') {
        totalIncome += t.amount;
        categories.income.push(t);
      } else {
        totalOther += t.amount;
        categories.other.push(t);
      }
    });

    // Build the day picker
    this.renderDayPicker();

    // Build transaction sections
    const renderSection = (title, transList) => {
      if (!transList.length) return '';
      let html = `<div class="space-y-2 animate-fade-in">
        <span class="text-[10px] font-black tracking-wider text-slate-400 block uppercase">${title}</span>
        <div class="space-y-2.5">`;
      transList.forEach(t => {
        const unsettledBadge = t.unsettled ? `<span class="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded mr-1">تسویه نشده</span>` : '';
        const noteLine = t.note ? `<span class="text-[10px] text-slate-400 block">${this.escapeHtml(t.note)}</span>` : '';
        html += `
          <div class="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-all shadow-sm animate-slide-up" onclick="App.showTransactionDetails(${t.id})">
            <div class="flex items-center gap-3 flex-1">
              <span class="w-9 h-9 rounded-full ${t.color} text-white flex items-center justify-center text-sm shadow-md shrink-0"><i class="fa-solid ${t.icon}"></i></span>
              <div class="flex-1 min-w-0">
                <span class="text-xs font-bold block text-slate-800 truncate">${this.escapeHtml(t.category)} ${unsettledBadge}</span>
                ${noteLine}
                <span class="text-[10px] text-slate-400 block">${this.formatTime(t.time || '')} · ${this.formatDate(t.date)}</span>
              </div>
            </div>
            <div class="text-left space-y-0.5 mr-2">
              <span class="text-xs font-black block ${t.type === 'income' ? 'text-emerald-600' : t.type === 'expense' ? 'text-slate-800' : 'text-amber-600'}">${t.type === 'income' ? '+' : t.type === 'expense' ? '−' : ''}${this.formatMoney(t.amount)}</span>
              <span class="text-[10px] text-slate-400 block font-bold">مانده: ${this.formatMoney(t.balance || 0)}</span>
            </div>
          </div>
        `;
      });
      html += `</div></div>`;
      return html;
    };

    if (itemsCount === 0) {
      list.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-center text-slate-400 animate-fade-in">
          <i class="fa-solid fa-receipt text-5xl mb-4 empty-state-icon opacity-30"></i>
          <p class="text-sm font-bold mb-1">تراکنشی برای این روز ثبت نشده است</p>
          <p class="text-[11px] text-slate-400">برای ثبت تراکنش جدید از دکمه + استفاده کنید.</p>
        </div>
      `;
    } else {
      list.innerHTML = '';
      list.innerHTML += renderSection('هزینه', categories.expense);
      list.innerHTML += renderSection('درآمد', categories.income);
      list.innerHTML += renderSection('سایر', categories.other);
    }

    // Update summary card
    document.getElementById('sumTotal').innerText = this.formatMoney(totalExpense + totalOther + totalIncome);
    document.getElementById('sumOther').innerText = this.formatMoney(totalOther);
    document.getElementById('sumExpense').innerText = this.formatMoney(totalExpense);
    document.getElementById('sumIncome').innerText = this.formatMoney(totalIncome);
    document.getElementById('sumItemsCount').innerText = this.toPersian(itemsCount);

    // Update active account display in header
    const accName = document.getElementById('activeAccountName');
    const accBal = document.getElementById('activeAccountBalance');
    if (accName) accName.innerText = state.activeAccount;
    if (accBal) accBal.innerText = this.formatWithCurrency(state.accounts[state.activeAccount] || 0);

    // Update month label
    const monthLabel = document.getElementById('monthLabel');
    if (monthLabel) {
      monthLabel.innerText = `${JALALI_MONTHS[state.selectedMonth.jm - 1]} ${this.toPersian(state.selectedMonth.jy)}`;
    }
  },

  // ==================== Day Picker ====================
  renderDayPicker() {
    const state = Store.state;
    const container = document.getElementById('dayPickerContainer');
    if (!container) return;

    const { jy, jm } = state.selectedMonth;
    const daysInMonth = JalaliDate.daysInMonth(jy, jm);
    const today = JalaliDate.today();
    const selectedDay = parseInt(state.selectedDate.split('/')[2]);

    let html = '';
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = (today[0] === jy && today[1] === jm && today[2] === day);
      const isSelected = (day === selectedDay);
      // Calculate weekday: convert Jalali date to Gregorian, then getDay()
      const [gy, gm, gd] = JalaliDate.jalaliToGregorian(jy, jm, day);
      const weekday = new Date(gy, gm - 1, gd).getDay();
      // Convert Sunday=0 to Saturday=0
      const persianWeekday = (weekday + 1) % 7;

      const classes = isSelected
        ? 'bg-appDarkTeal text-white rounded-full shadow-md'
        : isToday
          ? 'bg-teal-100 text-teal-800 rounded-lg font-bold'
          : 'text-slate-500 hover:bg-slate-100 rounded-lg';
      const dateStr = `${jy}/${String(jm).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
      html += `
        <div onclick="App.selectDay('${dateStr}')" class="text-center w-10 py-1 cursor-pointer transition-all ${classes}">
          <span class="block text-[10px] opacity-70">${JALALI_WEEKDAYS[persianWeekday]}</span>
          <span class="text-xs font-bold">${this.toPersian(day)}</span>
        </div>
      `;
    }
    container.innerHTML = html;
  },

  // ==================== Debts Chart ====================
  renderDebtsChart() {
    const state = Store.state;
    const ctx = document.getElementById('debtsChart');
    if (!ctx) return;
    if (window._zarbinChart) window._zarbinChart.destroy();

    // Calculate receivables: unsettled transactions
    const unsettled = state.transactions.filter(t => t.unsettled);
    const totalReceivable = unsettled
      .filter(t => t.type === 'other')
      .reduce((s, t) => s + t.amount, 0);
    const totalDebt = state.transactions
      .filter(t => t.unsettled && t.type === 'income' && t.note && t.note.includes('قرض'))
      .reduce((s, t) => s + t.amount, 0);
    const netBalance = totalReceivable - totalDebt;

    document.getElementById('valTotalReceivable').innerText = this.formatWithCurrency(totalReceivable);
    document.getElementById('valTotalDebt').innerText = this.formatWithCurrency(totalDebt);
    document.getElementById('valNetBalance').innerText = this.formatWithCurrency(netBalance);

    // Trend chart - last 6 months
    const labels = [];
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date();
      m.setMonth(m.getMonth() - i);
      const [jy, jm] = JalaliDate.gregorianToJalali(m.getFullYear(), m.getMonth() + 1, 1);
      labels.push(JALALI_MONTHS[jm - 1]);
      // Sum unsettled for that month
      const prefix = `${jy}/${String(jm).padStart(2, '0')}`;
      const sum = state.transactions
        .filter(t => t.unsettled && t.date && t.date.startsWith(prefix))
        .reduce((s, t) => s + t.amount, 0);
      data.push(sum);
    }

    window._zarbinChart = new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels.map(l => this.toPersianMonths(l)),
        datasets: [{
          label: 'مطالبات',
          data: data,
          borderColor: '#0f3d37',
          backgroundColor: 'rgba(15, 61, 55, 0.12)',
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          pointBackgroundColor: '#0f3d37',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => this.formatWithCurrency(ctx.parsed.y)
            },
            rtl: true,
            bodyFont: { family: 'Vazirmatn' },
            titleFont: { family: 'Vazirmatn' }
          }
        },
        scales: {
          y: {
            display: false,
            beginAtZero: true
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Vazirmatn', size: 11 } }
          }
        }
      }
    });
  },

  toPersianMonths(label) {
    // No translation needed - already in Persian
    return label;
  },

  // ==================== Category Breakdown ====================
  renderCategoryBreakdown() {
    const state = Store.state;
    const container = document.getElementById('breakdownContainer');
    if (!container) return;

    // Aggregate by category for the current month
    const month = state.selectedMonth;
    const prefix = `${month.jy}/${String(month.jm).padStart(2, '0')}`;

    const aggregates = {};
    state.transactions.forEach(t => {
      if (t.type === 'expense' && t.date && t.date.startsWith(prefix)) {
        aggregates[t.category] = (aggregates[t.category] || 0) + t.amount;
      }
    });

    const total = Object.values(aggregates).reduce((a, b) => a + b, 0);
    if (total === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-slate-400">
          <i class="fa-solid fa-chart-pie text-3xl mb-3 opacity-40"></i>
          <p class="text-xs font-bold">موردی برای این ماه ثبت نشده است.</p>
        </div>
      `;
      return;
    }

    const palette = ['#0f766e', '#1e40af', '#7c2d12', '#9333ea', '#dc2626', '#ea580c', '#0d9488', '#b45309'];
    let html = '';
    let i = 0;
    Object.keys(aggregates).forEach(cat => {
      const amt = aggregates[cat];
      const pct = Math.round((amt / total) * 100);
      const color = palette[i % palette.length];
      html += `
        <div class="space-y-1.5 animate-fade-in">
          <div class="flex justify-between text-xs font-bold items-center">
            <span class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-sm" style="background:${color}"></span>
              <span class="text-slate-700">${this.escapeHtml(cat)}</span>
            </span>
            <span class="text-slate-800">${this.formatMoney(amt)} ${state.baseCurrency} (${this.toPersian(pct)}٪)</span>
          </div>
          <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all" style="width: ${pct}%; background: linear-gradient(90deg, ${color}, ${color}cc)"></div>
          </div>
        </div>
      `;
      i++;
    });
    container.innerHTML = html;
  },

  // ==================== Budgets ====================
  renderBudgets() {
    const state = Store.state;
    const view = document.getElementById('view-budget');
    if (!view) return;

    if (!state.budgets.length) {
      view.innerHTML = `
        <div class="flex flex-col items-center justify-center text-center h-full p-6 animate-fade-in">
          <div class="p-6 bg-white rounded-full text-teal-900 shadow-md mb-4">
            <i class="fa-solid fa-vault text-4xl empty-state-icon"></i>
          </div>
          <p class="text-sm font-bold text-slate-500 mb-2">بودجه‌ای برای این دوره ثبت نشده است.</p>
          <p class="text-xs text-slate-400 max-w-xs mb-4">با تعریف بودجه ماهانه، میزان مصرف خود را کنترل کنید.</p>
          <button onclick="App.openBudgetForm()" class="px-4 py-2 bg-appDarkTeal text-white rounded-lg text-xs font-bold shadow-lg">
            <i class="fa-solid fa-plus ml-1"></i> تعریف بودجه جدید
          </button>
        </div>
      `;
      return;
    }

    let html = `<div class="space-y-3 animate-fade-in">
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-bold text-sm text-slate-700">بودجه‌های ماه جاری</h3>
        <button onclick="App.openBudgetForm()" class="text-xs bg-teal-800 text-white px-3 py-1.5 rounded-lg font-bold">
          <i class="fa-solid fa-plus ml-1"></i> جدید
        </button>
      </div>`;

    state.budgets.forEach(b => {
      const spent = Store.getBudgetSpent(b.category);
      const pct = b.limit > 0 ? Math.min(100, Math.round((spent / b.limit) * 100)) : 0;
      const isOver = spent > b.limit;
      const barColor = isOver ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500';
      const remaining = b.limit - spent;

      html += `
        <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-lg ${isOver ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-700'} flex items-center justify-center text-sm"><i class="fa-solid fa-wallet"></i></span>
              <div>
                <span class="text-xs font-bold block text-slate-800">${this.escapeHtml(b.category)}</span>
                <span class="text-[10px] text-slate-400">سقف: ${this.formatMoney(b.limit)} ${state.baseCurrency}</span>
              </div>
            </div>
            <button onclick="App.deleteBudget(${b.id})" class="text-slate-300 hover:text-red-500 text-xs">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
          <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
            <div class="${barColor} h-full rounded-full transition-all" style="width: ${pct}%"></div>
          </div>
          <div class="flex justify-between text-[10px] font-bold">
            <span class="${isOver ? 'text-red-600' : 'text-slate-600'}">مصرف: ${this.formatMoney(spent)} (${this.toPersian(pct)}٪)</span>
            <span class="${remaining < 0 ? 'text-red-600' : 'text-emerald-600'}">${remaining < 0 ? 'مازاد:' : 'باقی:'} ${this.formatMoney(Math.abs(remaining))}</span>
          </div>
          ${isOver ? `<div class="mt-2 text-[10px] text-red-600 font-bold bg-red-50 p-2 rounded"><i class="fa-solid fa-triangle-exclamation ml-1"></i> از سقف بودجه عبور کرده‌اید!</div>` : ''}
        </div>
      `;
    });
    html += `</div>`;
    view.innerHTML = html;
  },

  // ==================== Account Selector ====================
  renderAccountSelectorList() {
    const list = document.getElementById('accountSelectionList');
    if (!list) return;
    const state = Store.state;
    list.innerHTML = '';

    Object.keys(state.accounts).forEach(acc => {
      const active = acc === state.activeAccount;
      const meta = state.accountMeta[acc] || {};
      const balance = state.accounts[acc];
      const isNegative = balance < 0;
      list.innerHTML += `
        <div onclick="App.selectActiveAccount('${this.escapeAttr(acc)}')" class="flex justify-between items-center p-3 rounded-xl border ${active ? 'border-teal-600 bg-teal-50' : 'border-slate-100 hover:bg-slate-50'} cursor-pointer transition-all">
          <div class="flex items-center gap-3">
            <span class="w-9 h-9 rounded-full ${meta.type === 'cash' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'} flex items-center justify-center text-sm">
              <i class="fa-solid ${meta.type === 'cash' ? 'fa-wallet' : 'fa-building-columns'}"></i>
            </span>
            <div>
              <span class="text-xs font-bold block ${active ? 'text-teal-800' : 'text-slate-800'}">${this.escapeHtml(acc)}</span>
              ${meta.bank ? `<span class="text-[10px] text-slate-400">${this.escapeHtml(meta.bank)}</span>` : ''}
            </div>
          </div>
          <div class="text-left">
            <span class="text-xs font-bold ${isNegative ? 'text-red-600' : 'text-slate-700'}">${this.formatMoney(balance)}</span>
            <span class="text-[9px] text-slate-400 block">${state.baseCurrency}</span>
          </div>
        </div>
      `;
    });
  },

  // ==================== SMS Inbox ====================
  renderSmsList() {
    const container = document.getElementById('smsContainer');
    if (!container) return;
    const state = Store.state;

    if (!state.smsInbox.length) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-center text-slate-400 animate-fade-in">
          <i class="fa-solid fa-envelope-open text-4xl mb-4 opacity-40"></i>
          <p class="text-xs font-bold">هیچ پیامک جدیدی وجود ندارد</p>
          <p class="text-[10px] text-slate-400 mt-1">پیامک‌های بانکی به‌صورت خودکار اینجا نمایش داده می‌شوند.</p>
        </div>
      `;
      const badge = document.getElementById('smsBadge');
      if (badge) badge.classList.add('hidden');
      return;
    }

    const badge = document.getElementById('smsBadge');
    if (badge) badge.classList.remove('hidden');

    container.innerHTML = '';
    state.smsInbox.forEach(s => {
      container.innerHTML += `
        <div class="bg-white p-4 rounded-xl border space-y-3 shadow-sm text-xs relative animate-slide-up">
          <span class="absolute top-2 left-2 text-[9px] text-slate-400 font-bold">${this.toPersian(s.date)}</span>
          <div class="flex items-center gap-2 mb-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-600 block"></span>
            <span class="font-bold text-slate-800">${this.escapeHtml(s.bank)} <span class="text-slate-400 font-normal">(${this.toPersian(s.card)})</span></span>
          </div>
          <div class="space-y-1 border-t pt-2 text-slate-500 text-[11px]">
            <div>نوع: <span class="font-bold text-slate-700">${this.escapeHtml(s.action)}</span></div>
            <div>مبلغ: <span class="font-bold ${s.action.includes('واریز') ? 'text-emerald-600' : 'text-red-600'}">${this.formatWithCurrency(s.amount)}</span></div>
            <div>حساب مقصد: <span class="font-bold text-slate-700">${this.escapeHtml(s.targetAccount)}</span></div>
          </div>
          <div class="flex gap-2 pt-1 border-t">
            <button onclick="App.approveSms(${s.id})" class="flex-1 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg font-bold text-center transition-all shadow-sm">
              <i class="fa-solid fa-check ml-1"></i> ثبت در تراکنش‌ها
            </button>
            <button onclick="App.deleteSms(${s.id})" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg font-bold transition-all">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    });
  },

  // ==================== Unsettled Transactions ====================
  renderUnsettledList() {
    const container = document.getElementById('unsettledContainer');
    if (!container) return;
    const state = Store.state;

    const unsettledTrans = state.transactions.filter(t => t.unsettled);
    if (!unsettledTrans.length) {
      container.innerHTML = `
        <div class="text-center py-16 text-slate-400 animate-fade-in">
          <i class="fa-solid fa-check-double text-4xl mb-4 text-emerald-500 opacity-60"></i>
          <p class="text-xs font-bold">کلیه مطالبات تسویه شده است.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    unsettledTrans.forEach(t => {
      container.innerHTML += `
        <div class="bg-white p-4 rounded-xl border space-y-3 shadow-sm animate-slide-up">
          <div class="flex justify-between items-center">
            <span class="text-xs font-bold block">${this.escapeHtml(t.category)}</span>
            <span class="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-bold">تسویه نشده</span>
          </div>
          <div class="flex justify-between text-xs text-slate-500">
            <span>مبلغ کل طلب:</span>
            <span class="font-bold text-slate-800">${this.formatWithCurrency(t.amount)}</span>
          </div>
          ${t.note ? `<div class="text-[10px] text-slate-400">${this.escapeHtml(t.note)}</div>` : ''}
          <div class="flex gap-2">
            <button onclick="App.settleTransaction(${t.id})" class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm">
              <i class="fa-solid fa-handshake ml-1"></i> تسویه و تصفیه
            </button>
            <button onclick="App.deleteTransaction(${t.id})" class="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    });
  },

  // ==================== Accounts Manager ====================
  renderAccountList() {
    const container = document.getElementById('accountsListContainer');
    if (!container) return;
    const state = Store.state;

    let html = '';
    // Cash accounts first
    const cashAccounts = Object.keys(state.accounts).filter(a => state.accountMeta[a]?.type === 'cash');
    const bankAccounts = Object.keys(state.accounts).filter(a => state.accountMeta[a]?.type !== 'cash');

    if (cashAccounts.length) {
      html += `<span class="text-[10px] font-black tracking-wider text-slate-400 block uppercase mb-2">کیف پول / صندوق</span>`;
      cashAccounts.forEach(acc => {
        const bal = state.accounts[acc];
        const meta = state.accountMeta[acc] || {};
        html += this._accountCard(acc, bal, meta, true);
      });
    }

    if (bankAccounts.length) {
      html += `<span class="text-[10px] font-black tracking-wider text-slate-400 block uppercase mt-4 mb-2">حساب‌های بانکی متصل</span>`;
      bankAccounts.forEach(acc => {
        const bal = state.accounts[acc];
        const meta = state.accountMeta[acc] || {};
        html += this._accountCard(acc, bal, meta, false);
      });
    }

    // Summary card
    const total = Object.values(state.accounts).reduce((s, v) => s + v, 0);
    html += `
      <div class="mt-4 bg-gradient-to-l from-teal-800 to-teal-900 text-white p-4 rounded-xl shadow-md">
        <span class="text-[10px] opacity-75 block mb-1">دارایی کل (خالص)</span>
        <span class="text-xl font-black">${this.formatMoney(total)} ${state.baseCurrency}</span>
      </div>
    `;

    container.innerHTML = html;
  },

  _accountCard(name, balance, meta, isCash) {
    const isNegative = balance < 0;
    return `
      <div class="bg-white p-3.5 rounded-xl border flex justify-between items-center shadow-sm mb-2">
        <div class="flex items-center gap-3">
          <span class="w-9 h-9 rounded-full ${isCash ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'} flex items-center justify-center text-sm">
            <i class="fa-solid ${isCash ? 'fa-wallet' : 'fa-building-columns'}"></i>
          </span>
          <div>
            <span class="text-xs font-bold text-slate-700 block">${this.escapeHtml(name)}</span>
            ${meta.bank ? `<span class="text-[10px] text-slate-400 block">${this.escapeHtml(meta.bank)}${meta.iban ? ' · شبا: ' + this.toPersian(meta.iban) : ''}</span>` : ''}
          </div>
        </div>
        <div class="text-left flex items-center gap-2">
          <div>
            <span class="text-xs font-bold ${isNegative ? 'text-red-600' : 'text-teal-800'} block">${this.formatMoney(balance)}</span>
            <span class="text-[9px] text-slate-400 block">${Store.state.baseCurrency}</span>
          </div>
          ${name !== Store.state.activeAccount ? `<button onclick="App.deleteAccount('${this.escapeAttr(name)}')" class="text-slate-300 hover:text-red-500 text-xs"><i class="fa-solid fa-trash"></i></button>` : '<span class="text-[9px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">فعال</span>'}
        </div>
      </div>
    `;
  },

  // ==================== Helpers ====================
  escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  },

  escapeAttr(text) {
    return String(text).replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }
};

if (typeof window !== 'undefined') window.Render = Render;
