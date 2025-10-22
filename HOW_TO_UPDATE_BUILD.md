# 🚀 How to Update Your Build - Complete Guide

## ⚠️ IMPORTANT: Why Changes Aren't Visible

**Your code has all the fixes ✅ BUT your build doesn't have them yet ❌**

### Understanding the Problem:
- Code changes = Source code on your computer
- Build = Compiled app (APK/IPA) installed on device
- **Changes in code DON'T automatically appear in builds**
- You MUST create a NEW BUILD to see changes

---

## ✅ What's Fixed in Code (Ready to Build)

All 6 issues are fixed in the code:

1. ✅ App icon configured (local file, not URL)
2. ✅ Notification icon configured
3. ✅ File download fixed (FileSystem API)
4. ✅ Duplicate notifications removed
5. ✅ Smart notification routing added
6. ✅ Authentication guard fixed

**Version: 1.0.0 → 1.0.1**
**Android versionCode: 2 → 3**

---

## 🎯 Step-by-Step: Create New Build

### Prerequisites

Make sure you have:
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged into EAS: `eas login`
- [ ] Project linked: `eas init` (if not already)

### Step 1: Verify Configuration

Check that `app.json` has correct configuration:

```json
{
  "expo": {
    "version": "1.0.1",  // ← Should be 1.0.1
    "icon": "./assets/images/icon.png",  // ← Local file
    "android": {
      "versionCode": 3,  // ← Should be 3
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/icon.png",
        "backgroundColor": "#20606B"
      },
      "permissions": [
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "DOWNLOAD_WITHOUT_NOTIFICATION"
      ]
    }
  }
}
```

### Step 2: Build Development Version (Test First)

This creates a build you can install immediately to test:

```bash
eas build --profile development --platform android
```

**What happens:**
1. EAS uploads your code to cloud
2. Builds APK with all your changes
3. Provides download link
4. You download and install on device

**Time:** ~15-20 minutes

### Step 3: Install and Test

After build completes:

1. Click the download link EAS provides
2. Download APK to your device
3. Install the APK
4. Test all 6 fixes:
   - [ ] App icon shows OnCare logo
   - [ ] Notification icon shows OnCare logo
   - [ ] File download works
   - [ ] Only one notification in foreground
   - [ ] Click notification with "document" → routes to Documents
   - [ ] App opens to login screen

### Step 4: Build Production Version

Once development build works:

```bash
eas build --profile production --platform android
```

**What happens:**
1. Creates optimized production build
2. Generates AAB file for Google Play Store
3. Ready for submission

**Time:** ~20-30 minutes

### Step 5: Submit to Google Play Store

```bash
eas submit -p android
```

**What happens:**
1. Uploads AAB to Google Play Console
2. Creates new release (version 1.0.1)
3. Users see update available

**Time:** ~5 minutes upload, ~1-7 days review

---

## 🔄 Update Strategy Options

### Option A: Internal Testing (Fastest)

**Best for:** Quick testing with team

1. Build production version:
```bash
eas build --profile production --platform android
```

2. In Google Play Console:
   - Go to **Testing → Internal testing**
   - Click "Create new release"
   - Upload the AAB file
   - Add testers (email addresses)
   - Publish

3. Testers install via Google Play Store
   - They see "Internal test" badge
   - Updates are instant (no review)

**Time to users:** ~30 minutes

---

### Option B: Beta Testing (More Users)

**Best for:** Testing with more users before public release

1. Build production version
2. In Google Play Console:
   - Go to **Testing → Closed testing**
   - Create track (e.g., "Beta")
   - Upload AAB
   - Add testers or create opt-in URL
   - Publish

**Time to users:** ~1-2 hours

---

### Option C: Production Release (All Users)

**Best for:** Final public release

1. Build production version
2. Submit to store:
```bash
eas submit -p android
```

3. In Google Play Console:
   - Go to **Production → Releases**
   - Click "Create new release"
   - Upload AAB
   - Write release notes
   - Review and roll out

**Time to users:** 1-7 days (Google review)

---

## 📱 Over-The-Air (OTA) Updates

### ⚠️ OTA Limitations

**OTA Updates work for:**
- JavaScript code changes
- React component changes
- Business logic changes

**OTA Updates DON'T work for:**
- ❌ App icon changes (NATIVE)
- ❌ Notification configuration (NATIVE)
- ❌ Permission changes (NATIVE)
- ❌ Native module changes

### Why Your Changes Need Full Build:

Your 6 fixes include NATIVE changes:
1. Icon (native asset)
2. Notification icon (native config)
3. File permissions (native config)

**Therefore: You MUST create a full new build**

---

## 🛠️ Build Profiles Explained

Your `eas.json` should have:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

### Development Profile
- Purpose: Testing on your devices
- Output: APK (easy install)
- Use: `eas build --profile development --platform android`

### Production Profile
- Purpose: Google Play Store
- Output: AAB (optimized)
- Use: `eas build --profile production --platform android`

---

## 🔍 Verifying Build Has Your Changes

### After Installing New Build:

1. **Check Version:**
   - Look for version in app (should be 1.0.1)
   - Or check in device settings → Apps → Patient Management

2. **Check Icon:**
   - Home screen should show OnCare logo
   - Not the default Expo icon

3. **Test Features:**
   - All 6 fixes should work

### If Changes Still Not Visible:

1. **Uninstall old app completely**
```bash
adb uninstall com.oncare.patientmanagementapp
```

2. **Clear device cache** (optional)
   - Settings → Storage → Clear cache

3. **Install new build**

4. **Restart device** (optional)

---

## 🐛 Troubleshooting

### Build Fails: "Icon not found"

**Problem:** Icon file doesn't exist

**Fix:**
```bash
curl -o assets/images/icon.png "https://www.oncarecancer.com/img/featured/2025-10-22%2C10%3A26%3A10.122Z-logo%20%283%29.png"
```

### Build Fails: "Google Services file not found"

**Problem:** Firebase config missing

**Fix:**
- Ensure `google-services.json` exists in project root
- Check `app.json` has correct path:
  ```json
  "googleServicesFile": "./google-services.json"
  ```

### Build Succeeds But Changes Not Visible

**Problem:** Installed old build, not new one

**Fix:**
1. Check version number in app (should be 1.0.1)
2. If old version, uninstall and reinstall
3. Make sure you downloaded the LATEST build from EAS

### Duplicate Notifications Still Appear

**Problem:** Testing on Expo Go (not a real build)

**Fix:**
- Expo Go has limitations
- Must test on actual build (APK/AAB)
- Run `eas build --profile development`

### Download Not Working

**Problem:** Permissions not granted

**Fix:**
1. Check app permissions in device settings
2. Grant storage permissions
3. If still fails, rebuild with permissions in app.json ✅

---

## 📋 Pre-Build Checklist

Before running build command:

- [ ] All code changes committed
- [ ] `app.json` version is 1.0.1
- [ ] `app.json` versionCode is 3 (Android)
- [ ] Icon file exists at `assets/images/icon.png`
- [ ] `google-services.json` exists
- [ ] `GoogleService-Info.plist` exists (iOS)
- [ ] EAS CLI installed and logged in
- [ ] Internet connection stable

---

## ⚡ Quick Commands Reference

```bash
# Check EAS login
eas whoami

# Build development (testing)
eas build --profile development --platform android

# Build production (store)
eas build --profile production --platform android

# Submit to store
eas submit -p android

# Check build status
eas build:list

# View specific build
eas build:view [BUILD_ID]

# Cancel build
eas build:cancel

# Clear cache and rebuild
eas build --clear-cache --profile production --platform android
```

---

## 🎉 Summary

### Your Current Situation:
- ✅ Code has all 6 fixes
- ❌ Build doesn't have fixes yet
- ❌ Users can't see fixes

### What You Need to Do:
1. Run: `eas build --profile development --platform android`
2. Wait ~15 minutes
3. Download and install APK
4. Test all fixes
5. If works: `eas build --profile production --platform android`
6. Submit: `eas submit -p android`

### Timeline:
- Development build: 15 minutes
- Testing: 10 minutes
- Production build: 20 minutes
- Submit to store: 5 minutes
- **Total: ~50 minutes** (plus Google review time)

---

## 🚀 Ready to Build?

Run this command now:

```bash
eas build --profile development --platform android
```

Then wait for the download link and install on your device to test!

---

## 📞 Need Help?

**Build logs:**
```bash
eas build:list
eas build:view [BUILD_ID]
```

**Check configuration:**
```bash
eas build:configure
```

**Update EAS CLI:**
```bash
npm install -g eas-cli@latest
```

---

**Remember: Changes in code don't appear until you BUILD and INSTALL a new version!** 🎯
