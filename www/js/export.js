/* ============================================
   Zarbin - Export Module (CSV & Printable)
   خروجی گرفتن از داده‌ها
   ============================================ */

const Exporter = {
  // Export transactions as CSV file (real download)
  exportCSV() {
    const state = Store.state;
    const txs = state.transactions;
    if (!txs.length) {
      App.toast('تراکنشی برای خروجی وجود ندارد', 'error');
      return;
    }

    const headers = ['شناسه', 'تاریخ', 'ساعت', 'نوع', 'دسته', 'حساب', 'مبلغ', 'مانده', 'یادداشت', 'تسویه'];
    const rows = txs.map(t => [
      t.id,
      t.date,
      t.time || '',
      t.type === 'expense' ? 'هزینه' : t.type === 'income' ? 'درآمد' : 'سایر',
      t.category,
      t.account,
      t.amount,
      t.balance || '',
      t.note || '',
      t.unsettled ? 'تسویه نشده' : 'تسویه شده'
    ]);

    // BOM for Excel UTF-8 detection
    let csv = '\uFEFF' + headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => {
        const s = String(cell || '');
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',') + '\n';
    });

    this._downloadFile(csv, `zarbin-transactions-${this._dateStamp()}.csv`, 'text/csv;charset=utf-8');
    App.toast('خروجی CSV با موفقیت ایجاد شد', 'success');
  },

  // Export as a printable HTML report (acts as PDF when user picks "Save as PDF")
  exportPDF() {
    const state = Store.state;
    const txs = state.transactions;
    if (!txs.length) {
      App.toast('تراکنشی برای خروجی وجود ندارد', 'error');
      return;
    }

    const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalOther = txs.filter(t => t.type === 'other').reduce((s, t) => s + t.amount, 0);
    const net = totalIncome - totalExpense - totalOther;

    const rows = txs.map(t => `
      <tr>
        <td>${Render.escapeHtml(t.date)} ${Render.formatTime(t.time || '')}</td>
        <td>${Render.escapeHtml(t.category)}</td>
        <td>${Render.escapeHtml(t.account)}</td>
        <td style="text-align:left;color:${t.type === 'income' ? '#16a34a' : t.type === 'expense' ? '#dc2626' : '#d97706'}">${t.type === 'income' ? '+' : t.type === 'expense' ? '−' : ''}${Render.formatMoney(t.amount)}</td>
        <td style="text-align:left">${Render.formatMoney(t.balance || 0)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<title>گزارش زرین - ${Render.formatDate(JalaliDate.today().join('/'))}</title>
<style>
@font-face { font-family: 'Vazirmatn'; src: local('Vazirmatn'); }
body { font-family: 'Vazirmatn', 'Tahoma', sans-serif; padding: 30px; color: #1e293b; }
.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0f3d37; padding-bottom: 15px; margin-bottom: 20px; }
.header h1 { color: #0f3d37; margin: 0; font-size: 24px; }
.header .meta { text-align: left; font-size: 12px; color: #64748b; }
.summary { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin: 20px 0; }
.summary .card { background: #f0f5f4; padding: 12px; border-radius: 8px; border-right: 4px solid #0f766e; }
.summary .card .label { font-size: 11px; color: #64748b; }
.summary .card .value { font-size: 16px; font-weight: bold; margin-top: 4px; }
table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
th { background: #0f3d37; color: white; padding: 10px; text-align: right; font-size: 11px; }
td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
tr:nth-child(even) { background: #f8fafc; }
.footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
@media print { body { padding: 0; } .no-print { display: none; } }
</style>
</head>
<body>
<div class="header">
  <h1>📜 گزارش تراکنش‌های زرین</h1>
  <div class="meta">
    <div>تاریخ تولید: ${Render.formatDate(JalaliDate.today().join('/'))}</div>
    <div>نسخه ${APP_VERSION}</div>
  </div>
</div>
<div class="summary">
  <div class="card"><div class="label">کل درآمد</div><div class="value" style="color:#16a34a">${Render.formatWithCurrency(totalIncome)}</div></div>
  <div class="card"><div class="label">کل هزینه</div><div class="value" style="color:#dc2626">${Render.formatWithCurrency(totalExpense)}</div></div>
  <div class="card"><div class="label">سایر</div><div class="value" style="color:#d97706">${Render.formatWithCurrency(totalOther)}</div></div>
  <div class="card"><div class="label">تراز</div><div class="value" style="color:${net >= 0 ? '#16a34a' : '#dc2626'}">${Render.formatWithCurrency(net)}</div></div>
</div>
<table>
<thead>
<tr><th>تاریخ</th><th>دسته</th><th>حساب</th><th>مبلغ</th><th>مانده</th></tr>
</thead>
<tbody>${rows}</tbody>
</table>
<div class="footer">
  گزارش توسط اپلیکیشن زرین (نسخه ${APP_VERSION}) تولید شده است.
  <br>© ${new Date().getFullYear()} Zarbin - SonaMother
</div>
<button class="no-print" onclick="window.print()" style="margin-top:20px;padding:10px 20px;background:#0f3d37;color:white;border:none;border-radius:8px;cursor:pointer;font-family:inherit;">چاپ / ذخیره به‌عنوان PDF</button>
</body>
</html>`;

    const w = window.open('', '_blank');
    if (!w) {
      App.toast('لطفاً اجازه باز شدن پنجره را بدهید', 'error');
      return;
    }
    w.document.write(html);
    w.document.close();
  },

  // Backup full state as JSON
  exportBackup() {
    const state = Store.state;
    const json = JSON.stringify(state, null, 2);
    this._downloadFile(json, `zarbin-backup-${this._dateStamp()}.json`, 'application/json');
    App.toast('فایل پشتیبان با موفقیت ایجاد شد', 'success');
  },

  // Import from JSON backup
  importBackup(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.accounts || !data.transactions) {
          throw new Error('Invalid file format');
        }
        Store.state = data;
        Store.save();
        App.toast('پشتیبان با موفقیت بازگردانی شد', 'success');
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        App.toast('فایل پشتیبان نامعتبر است', 'error');
      }
    };
    reader.readAsText(file);
  },

  // ==================== Internal helpers ====================
  _downloadFile(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  _dateStamp() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
};

if (typeof window !== 'undefined') window.Exporter = Exporter;
