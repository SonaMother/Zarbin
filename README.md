# زرین · Zarbin

> **حسابدار هوشمند شخصی** — A Persian (Farsi, RTL) personal finance accountant app, packaged as a cross-platform web app and Android APK via Capacitor.

[![Build APK](https://github.com/SonaMother/Zarbin/actions/workflows/build-apk.yml/badge.svg)](https://github.com/SonaMother/Zarbin/actions/workflows/build-apk.yml)
[![Version](https://img.shields.io/badge/version-1.0.0-14b8a6)](https://github.com/SonaMother/Zarbin/releases)
[![Platform](https://img.shields.io/badge/platform-Android%20%7C%20Web%20%7C%20PWA-0c322c)](https://github.com/SonaMother/Zarbin)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## ✨ Features

- **📊 Multi-Account Management** — Track bank accounts, wallets, and cash separately with live balances
- **💰 Transaction Tracking** — Expenses, income, loans, and transfers with categories and notes
- **📅 Jalali (Shamsi) Calendar** — Native Persian calendar with day/month picker
- **📈 Charts & Breakdowns** — Category-wise spending analysis with visual progress bars
- **🎯 Budget Tracking** — Monthly budgets per category with overspend alerts
- **📞 Bank SMS Inbox** — Auto-parse and approve bank SMS into transactions (mock data)
- **🔄 Unsettled Transactions** — Track outstanding loans and receivables
- **📤 Export & Backup** — Real CSV (Excel) export, printable PDF report, JSON backup/restore
- **🌙 Dark Mode** — Toggle between light and dark themes
- **🎚️ Adjustable Font Size** — 80%–130% scaling for accessibility
- **💱 Currency Switching** — Between Rial (ریال) and Toman (تومان)
- **🔒 Fully Offline** — All data stored locally on device, no internet required
- **📱 PWA + APK** — Installable on Android via APK or as a PWA from the web

## 📲 Installation

### Option A: Install APK on Android

1. Go to [Releases](https://github.com/SonaMother/Zarbin/releases)
2. Download the latest `app-debug.apk` (or `app-release-unsigned.apk`)
3. On your Android phone, enable **"Install unknown apps"** for your browser
4. Tap the downloaded APK file and confirm installation

### Option B: Run as Web App / PWA

```bash
# Clone and serve locally
git clone https://github.com/SonaMother/Zarbin.git
cd Zarbin
npm install
npm run dev
# Open http://localhost:8080 in your browser
```

To install as a PWA: open the web app in Chrome/Edge → menu → **Install app**.

## 🏗️ Build from Source

### Prerequisites

- **Node.js** 18+ and npm
- **JDK 17** (for Android builds)
- **Android SDK** (API 34, build-tools 34.0.0) — only needed for local APK builds

### Build the APK locally

```bash
# Install dependencies
npm install

# Sync web assets into Android project
npx cap sync android

# Build debug APK
cd android
./gradlew assembleDebug

# APK will be at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### CI/CD Build (Automatic)

This repo includes a GitHub Actions workflow (`.github/workflows/build-apk.yml`) that automatically builds an APK whenever you push a `v*` tag. The APK is attached to a new GitHub Release.

```bash
# Trigger a new release build
git tag v1.0.1
git push origin v1.0.1
# → GitHub Actions builds APK and creates release
```

You can also trigger a build manually from the **Actions** tab → "Build Android APK" → "Run workflow".

## 🗂️ Project Structure

```
Zarbin/
├── www/                    # Web app source (served by Capacitor WebView)
│   ├── index.html          # Main HTML
│   ├── manifest.json       # PWA manifest
│   ├── css/
│   │   ├── app.css         # Custom styles, fonts, animations
│   │   └── lib/fontawesome.min.css
│   ├── js/
│   │   ├── jalali.js       # Jalali (Persian) calendar utility
│   │   ├── store.js        # State management + localStorage persistence
│   │   ├── render.js       # UI rendering functions
│   │   ├── export.js       # CSV/PDF/JSON export
│   │   ├── app.js          # Main app controller
│   │   └── lib/            # chart.js, tailwind.js
│   └── assets/
│       ├── fonts/          # Vazirmatn (offline)
│       ├── webfonts/       # FontAwesome (offline)
│       └── icons/          # App icons (PWA)
├── android/                # Capacitor-generated Android project
├── scripts/
│   └── generate-icons.py   # SVG → PNG icon generator
├── .github/workflows/
│   └── build-apk.yml       # CI/CD: builds APK on tag push
├── capacitor.config.json   # Capacitor config
├── package.json
└── README.md
```

## 🎨 Tech Stack

- **Frontend:** HTML5, Tailwind CSS (runtime), vanilla JavaScript (no framework)
- **Charts:** Chart.js 4
- **Icons:** Font Awesome 6 (offline-bundled)
- **Font:** Vazirmatn (Persian, offline-bundled)
- **Calendar:** Custom Jalali (Shamsi) implementation
- **Packaging:** Capacitor 6 → Android APK
- **Build:** Gradle 8, Android Gradle Plugin 8, JDK 17
- **CI/CD:** GitHub Actions

## 📊 App Data & Privacy

- **All data is stored locally** on your device using `localStorage` — no servers, no telemetry, no cloud sync.
- Use the **Backup** feature (in Reports tab) to export a JSON backup anytime.
- Reset the app anytime from Reports → "بازنشانی کامل داده‌ها".

## 🌐 Localization

The app is **100% Persian (Farsi)** with RTL layout. Numbers are displayed in Persian digits (۰-۹) and dates use the Jalali (Shamsi) calendar.

## 📦 Version History

| Version | Date | Notes |
|---------|------|-------|
| v1.0.0 | 2026-06-26 | Initial public release |

The version number is always visible in the top header (next to the "زرین" brand) and in the sidebar footer.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Open a Pull Request

## 📜 License

MIT © SonaMother — see [LICENSE](LICENSE).

## 💛 Acknowledgments

- **Vazirmatn** font by [rastikerdar](https://github.com/rastikerdar/vazirmatn) (OFL)
- **Tailwind CSS** by Tailwind Labs (MIT)
- **Chart.js** by chartjs contributors (MIT)
- **Font Awesome** by Fonticons (Free License)
- **Capacitor** by Ionic (MIT)

---

<p align="center">
  <strong>زرین · Zarbin</strong><br>
  <sub>Your golden accountant · حسابدار طلایی شما</sub><br>
  <sub>© 2026 SonaMother</sub>
</p>
