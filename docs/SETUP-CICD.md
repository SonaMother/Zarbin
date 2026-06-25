# CI/CD Setup Guide

## Why isn't the GitHub Actions workflow in `.github/workflows/`?

The Personal Access Token used to create this repository has the `repo` scope but **not** the `workflow` scope. GitHub requires the `workflow` scope to push files to `.github/workflows/`.

## How to enable automatic APK builds

### Option A: Add the workflow via GitHub Web UI (easiest)

1. Go to https://github.com/SonaMother/Zarbin/actions/new
2. Click "set up a workflow yourself"
3. Delete the default content
4. Copy the entire content of [`docs/github-actions-workflow.yml.md`](github-actions-workflow.yml.md)
5. Commit the file as `build-apk.yml`
6. Done! Future `v*` tag pushes will auto-build APKs

### Option B: Create a new token with `workflow` scope

1. Go to https://github.com/settings/tokens/new
2. Select scopes: `repo` AND `workflow`
3. Generate the token
4. Update your local git remote:
   ```bash
   git remote set-url origin https://<NEW_TOKEN>@github.com/SonaMother/Zarbin.git
   ```
5. Add the workflow file:
   ```bash
   git add .github/workflows/build-apk.yml
   git commit -m "ci: add GitHub Actions workflow for APK builds"
   git push origin main
   ```

## Triggering a build

Once the workflow is in place, you can trigger a build in two ways:

### Automatic (tag push)
```bash
git tag v1.0.1
git push origin v1.0.1
# → GitHub Actions builds APK and creates a release
```

### Manual (workflow_dispatch)
1. Go to https://github.com/SonaMother/Zarbin/actions
2. Select "Build Android APK"
3. Click "Run workflow"

## Building the APK locally

You can also build the APK locally without GitHub Actions:

### Prerequisites
- Node.js 18+
- JDK 17
- Android SDK (API 34, build-tools 34.0.0)

### Steps
```bash
npm install
npx cap sync android
cd android
./gradlew assembleDebug
# APK at: app/build/outputs/apk/debug/app-debug.apk
```

For a release (signed) APK:
```bash
cd android
./gradlew assembleRelease
# APK at: app/build/outputs/apk/release/app-release-unsigned.apk
```
