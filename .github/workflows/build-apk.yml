name: Build Android APK

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build:
    name: Build APK
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4

      - name: ☕ Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'gradle'

      - name: 📦 Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: 📥 Install npm dependencies
        run: npm ci || npm install

      - name: 🔄 Sync Capacitor
        run: npx cap sync android

      - name: 🔧 Set up Android SDK
        uses: android-actions/setup-android@v3
        with:
          packages: |
            platforms;android-34
            build-tools;34.0.0

      - name: 🔨 Make gradlew executable
        run: chmod +x ./android/gradlew

      - name: 🏗️ Build Debug APK
        working-directory: android
        run: ./gradlew assembleDebug --no-daemon --stacktrace

      - name: 🏗️ Build Release APK (unsigned)
        working-directory: android
        run: ./gradlew assembleRelease --no-daemon -x lintVitalRelease || true

      - name: 📋 List built APKs
        run: |
          find android/app/build/outputs/apk -name "*.apk" -exec ls -la {} \;

      - name: 📤 Upload APK artifact
        uses: actions/upload-artifact@v4
        with:
          name: zarbin-apk
          path: |
            android/app/build/outputs/apk/**/*.apk
          retention-days: 90

      - name: 🏷️ Create GitHub Release & Upload APK
        if: startsWith(github.ref, 'refs/tags/')
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ github.ref_name }}
          name: Zarbin ${{ github.ref_name }}
          body: |
            # زرین · Zarbin ${{ github.ref_name }}

            Persian personal finance accountant app.

            ## 📲 Installation
            1. Download `zarbin-${{ github.ref_name }}.apk` below
            2. Allow "Install from unknown sources" in Android settings
            3. Tap the APK to install

            ## ✨ Features
            - 📊 Multi-account management (bank + cash)
            - 💰 Income/expense/loan tracking
            - 📅 Jalali (Shamsi) calendar
            - 📈 Charts and category breakdowns
            - 🎯 Budget tracking with alerts
            - 📲 Bank SMS inbox (mock)
            - 📤 CSV/PDF export, JSON backup
            - 🌙 Dark mode
            - 📱 Full offline support, RTL Persian UI

            **Version:** ${{ github.ref_name }}
            **Build:** ${{ github.run_number }}
            **Min Android:** 5.0 (API 22)
            **Target Android:** 14 (API 34)
          files: |
            android/app/build/outputs/apk/debug/app-debug.apk
            android/app/build/outputs/apk/release/app-release-unsigned.apk
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
