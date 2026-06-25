/* ============================================
   Zarbin - Jalali (Shamsi) Calendar Utility
   تقویم جلالی
   Based on the algorithm by Kazimierz M. Borkowski
   ============================================ */

const JalaliDate = (function () {
  function div(a, b) { return Math.floor(a / b); }
  function mod(a, b) { return a - Math.floor(a / b) * b; }

  // Convert Gregorian date to Jalali
  function gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy;
    if (gy > 1600) {
      jy = 979;
      gy -= 1600;
    } else {
      jy = 0;
      gy -= 621;
    }
    const gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = (365 * gy) + (div((gy2 + 3), 4)) - (div((gy2 + 99), 100)) + (div((gy2 + 399), 400)) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * (div(days, 12053));
    days = mod(days, 12053);
    jy += 4 * (div(days, 1461));
    days = mod(days, 1461);
    if (days > 365) {
      jy += div((days - 1), 365);
      days = mod((days - 1), 365);
    }
    const jm = (days < 186) ? (1 + div(days, 31)) : (7 + div((days - 186), 30));
    const jd = 1 + ((days < 186) ? mod(days, 31) : mod((days - 186), 30));
    return [jy, jm, jd];
  }

  // Convert Jalali date to Gregorian
  function jalaliToGregorian(jy, jm, jd) {
    let gy;
    if (jy > 979) {
      gy = 1600;
      jy -= 979;
    } else {
      gy = 621;
    }
    let days = (365 * jy) + (div(jy, 33) * 8) + (div(mod(jy, 33) + 3, 4)) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    gy += 400 * (div(days, 146097));
    days = mod(days, 146097);
    if (days > 36524) {
      gy += 100 * (div(--days, 36524));
      days = mod(days, 36524);
      if (days >= 365) days++;
    }
    gy += 4 * (div(days, 1461));
    days = mod(days, 1461);
    if (days > 365) {
      gy += div((days - 1), 365);
      days = mod((days - 1), 365);
    }
    let gd = days + 1;
    const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm;
    for (gm = 0; gm < 13; gm++) {
      const v = sal_a[gm];
      if (gd <= v) break;
      gd -= v;
    }
    return [gy, gm, gd];
  }

  function isLeapJalali(jy) {
    const r = mod(jy, 33);
    return (r === 1 || r === 5 || r === 9 || r === 13 || r === 17 || r === 22 || r === 26 || r === 30);
  }

  function daysInMonth(jy, jm) {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return isLeapJalali(jy) ? 30 : 29;
  }

  return {
    gregorianToJalali,
    jalaliToGregorian,
    isLeap: isLeapJalali,
    daysInMonth,
    today: function () {
      const d = new Date();
      return gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    }
  };
})();

// Persian month names
const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// Persian weekday names (Saturday-first)
const JALALI_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const JALALI_WEEKDAYS_FULL = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

if (typeof window !== 'undefined') {
  window.JalaliDate = JalaliDate;
  window.JALALI_MONTHS = JALALI_MONTHS;
  window.JALALI_WEEKDAYS = JALALI_WEEKDAYS;
  window.JALALI_WEEKDAYS_FULL = JALALI_WEEKDAYS_FULL;
}
