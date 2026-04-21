# OpenCode Mobile — Android APK Build Guide

## Prerequisites

Before building, you need:

1. **Node.js 18+** and **npm** installed locally
2. An **Expo account** — sign up free at [expo.dev](https://expo.dev)
3. **EAS CLI** installed globally (done in step 1 below)
4. The backend API deployed (see "Set Your API URL" below)

---

## Step 1 — Install EAS CLI

```bash
npm install -g eas-cli
```

Verify it works:

```bash
eas --version
```

---

## Step 2 — Log in to Expo

```bash
npx eas-cli login
```

Enter your Expo account credentials.

---

## Step 3 — Clone / download this project locally

EAS Build requires you to run commands from your local machine (it uploads your code to Expo's cloud build servers).

```bash
# If using git
git clone <your-repo-url>
cd opencode-mobile
npm install
```

Or download the project zip from Replit and extract it.

---

## Step 4 — Configure EAS for your account

```bash
npx eas-cli build:configure
```

This will:
- Ask you to link the project to your Expo account
- Generate a `projectId` in your `app.json` under `extra.eas.projectId`
- Update `eas.json` if needed

---

## Step 5 — Set Your API URL

Open `eas.json` and replace `YOUR_DEPLOYED_DOMAIN_HERE` with your actual backend domain:

```json
"preview": {
  "env": {
    "EXPO_PUBLIC_DOMAIN": "my-app.replit.app"
  }
}
```

If your backend isn't deployed yet, you can test with your local IP (device and computer must be on same WiFi):

```json
"EXPO_PUBLIC_DOMAIN": "192.168.1.X:8080"
```

---

## Step 6 — Build the APK (preview profile)

```bash
npx eas-cli build -p android --profile preview
```

This:
- Uploads your code to Expo's cloud build servers
- Builds a **signed APK** (not AAB — directly installable)
- Takes ~10–15 minutes on the first build
- Emails you when done, and the APK download link appears in your terminal

---

## Step 7 — Download and install the APK

After the build completes:

1. Download the `.apk` file from the link in your terminal or at [expo.dev/accounts/your-username/projects/opencode-mobile/builds](https://expo.dev)
2. Transfer it to your Android device (USB, Google Drive, email, etc.)
3. On your Android device: **Settings → Security → Install unknown apps → Allow**
4. Open the APK file to install

---

## Build Profiles Summary

| Profile | Output | Use for |
|---------|--------|---------|
| `development` | APK (debug) | Local testing with dev tools |
| `preview` | APK (release) | Direct install / sharing testers |
| `production` | AAB | Google Play Store upload |

---

## Updating the App Version

Before each new build, increment these in `app.json`:

```json
"version": "1.0.1",          // User-visible version string
"android": {
  "versionCode": 2            // Must increase with every new build
}
```

`versionCode` must always be a higher integer than the previous build. The Play Store enforces this; sideloaded APKs require it for clean upgrades.

---

## Common Build Problems & Fixes

### ❌ `Your project needs to be linked to an Expo account`
**Fix:** Run `npx eas-cli build:configure` and follow the prompts.

### ❌ `Project not found` or `projectId missing`
**Fix:** Open `app.json`, find `extra.eas.projectId`, and set it to the ID shown after `eas build:configure`.

### ❌ `The following packages should be updated for best compatibility`
**Fix:** Run `npx expo install --fix` to align package versions to your Expo SDK version.

### ❌ `Keystore not found` on first build
**Fix:** EAS auto-generates a keystore the first time. Just confirm when prompted. **Save the keystore credentials** — you need the same keystore for all future updates.

### ❌ Build fails with Metro bundler errors
**Fix:**
```bash
npx expo start --clear    # clears Metro cache
```
Then try building again.

### ❌ `EXPO_PUBLIC_DOMAIN` is wrong / app can't reach API
**Fix:** Double-check `eas.json` → `preview.env.EXPO_PUBLIC_DOMAIN`. It should be just the domain, no `https://` prefix and no trailing slash (e.g. `my-app.replit.app`).

### ❌ WebView shows blank page
**Fix:** Make sure `INTERNET` permission is set in `app.json` (it is by default in this project).

### ❌ `versionCode` already used
**Fix:** Increment `android.versionCode` in `app.json` by 1 and rebuild.

### ❌ Build takes too long / times out
**Fix:** First builds are slow (~15 min). Subsequent builds use the cache and are faster (~5 min). You can also track build status at expo.dev.

---

## File Reference

| File | Purpose |
|------|---------|
| `app.json` | App metadata, Android package name, permissions, icons |
| `eas.json` | Build profiles (APK vs AAB, env vars, distribution) |
| `assets/images/icon.png` | Main app icon (1024×1024 recommended) |
| `assets/images/adaptive-icon.png` | Android adaptive icon foreground layer |
| `assets/images/adaptive-icon-bg.png` | Android adaptive icon background layer |
| `constants/api.ts` | `API_BASE` — points to your backend |

---

## Quick Reference Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in
npx eas-cli login

# First-time setup (links project to your Expo account)
npx eas-cli build:configure

# Build APK for direct install (recommended for testing)
npx eas-cli build -p android --profile preview

# Build debug APK with dev tools
npx eas-cli build -p android --profile development

# Build AAB for Google Play Store
npx eas-cli build -p android --profile production

# Check build status
npx eas-cli build:list

# Update packages to match Expo SDK
npx expo install --fix
```
