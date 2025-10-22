# Quick Start Guide

## 🎯 Overview

This is a **production-ready Expo React Native app** with Firebase Cloud Messaging. You do NOT need to convert to bare React Native - Expo is used by many companies in production.

## ⚡ Quick Commands

### Install Dependencies
```bash
npm install
```

### Run Development Server (Web/Expo Go)
```bash
npm run dev
```
**Note**: FCM won't work in Expo Go, but other features will.

### Build App with Firebase Support

```bash
# Install EAS CLI (one time)
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android (recommended for testing)
eas build --profile development --platform android

# Build for iOS
eas build --profile development --platform ios
```

### Run on Device with Dev Server

After building development version:

1. Install the built app on your device
2. Run: `npx expo start --dev-client`
3. Open the app on your device

## 📱 Testing Push Notifications

### 1. Get FCM Token

When the app runs, check the logs for:
```
FCM Token: eyJh...
```

### 2. Send Test Notification via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Cloud Messaging → Send your first message
4. Enter title and text
5. Click "Send test message"
6. Paste your FCM token
7. Click "Test"

### 3. Send via Backend API

Your backend endpoint: `https://www.oncarecancer.com/mobile-app/saveFCMToken`

The app automatically sends the FCM token to your backend when user logs in.

## 🚀 Deployment Options

### Option 1: EAS Build (Recommended)

```bash
# Production build
eas build --profile production --platform android
eas build --profile production --platform ios

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

### Option 2: Manual Build

You can also build locally (requires Xcode/Android Studio setup).

## 🌿 Git Workflow

### Create and Push Feature Branch

```bash
# Create new branch
git checkout -b feature/fcm-notifications

# Stage changes
git add -A

# Commit
git commit -m "Add Firebase FCM notifications"

# Push to remote
git push -u origin feature/fcm-notifications
```

### Using the Build Script

```bash
# Run interactive script
./BUILD_AND_DEPLOY.sh

# Or manually:
chmod +x BUILD_AND_DEPLOY.sh
./BUILD_AND_DEPLOY.sh
```

## 📂 Project Structure

```
├── app/                    # Screens (expo-router)
│   ├── (tabs)/            # Tab navigation screens
│   ├── _layout.tsx        # Root layout
│   └── login.tsx          # Login screen
├── components/            # Reusable components
├── contexts/              # React contexts (Auth, Patient)
├── services/              # API and notifications
│   ├── api.ts            # Backend API calls
│   └── notifications.ts  # Firebase FCM logic
├── config/                # Firebase config
├── .env                   # Environment variables
├── app.json              # Expo configuration
├── eas.json              # EAS Build configuration
└── package.json          # Dependencies
```

## 🔧 Configuration Files

### app.json
- App name, bundle identifiers
- Firebase configuration files
- Permissions and plugins

### eas.json
- Build profiles (development, preview, production)
- Platform-specific build settings

### .env
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
```

## 🎨 Key Features

✅ Firebase Cloud Messaging (Push Notifications)
✅ Email/Password Authentication
✅ Patient Dashboard
✅ Document Management
✅ Profile Management
✅ Tab Navigation
✅ iOS & Android Support
✅ Production Ready

## 🔥 Firebase Setup

### Android
- File: `google-services.json` (root directory)
- Package: `com.sensunny.patientmanagementapp`

### iOS
- File: `GoogleService-Info.plist` (root directory)
- Bundle ID: `com.sensunny.patientmanagementapp`

## 📊 Monitoring

### Check Build Status
```bash
eas build:list
```

### View Specific Build
```bash
eas build:view BUILD_ID
```

### Check Logs
```bash
# During development
npx expo start --dev-client

# In app console
console.log messages will appear here
```

## 🐛 Troubleshooting

### "Firebase messaging not available"
- This is normal in Expo Go
- Build with EAS to enable Firebase

### "Network error during npm install"
- Check internet connection
- Try: `npm install --legacy-peer-deps`
- Or: `npm install --force`

### Build fails
- Verify `google-services.json` is valid
- Verify `GoogleService-Info.plist` is valid
- Check bundle IDs match Firebase project

### Notifications not received
- Check permissions are granted
- Verify FCM token is sent to backend
- Test in background (app closed/minimized)
- Check Firebase Console for errors

## 📱 Device Requirements

### iOS
- iOS 13.4 or higher
- Physical device (not simulator for FCM)

### Android
- Android 5.0 (API 21) or higher
- Google Play Services installed

## 💰 Costs

### Expo EAS
- **Free**: Limited builds/month
- **Production**: $29/month unlimited builds
- **Enterprise**: Custom pricing

### Firebase
- **Spark (Free)**: Sufficient for small apps
- **Blaze (Pay as you go)**: For larger scale

## 🎓 Learning Resources

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Guide](https://docs.expo.dev/build/introduction/)
- [React Native Firebase](https://rnfirebase.io)
- [Firebase Console](https://console.firebase.google.com)

## ❓ Why Not Convert to Bare React Native?

Converting would require:
- ❌ 2-3 weeks of development time
- ❌ Rewrite entire navigation (expo-router → React Navigation)
- ❌ Replace all Expo packages with native alternatives
- ❌ Manual native configuration for iOS/Android
- ❌ Complex build setup
- ❌ More maintenance overhead

Benefits of keeping Expo:
- ✅ Production ready (used by major companies)
- ✅ Faster development and iterations
- ✅ Built-in OTA updates
- ✅ Simplified build process
- ✅ Better developer experience
- ✅ Regular updates and security patches
- ✅ Great documentation and community

## 🆘 Support

For issues:
1. Check `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Review [Expo documentation](https://docs.expo.dev)
3. Check Firebase Console for errors
4. Review app logs for error messages

## 🚢 Next Steps

1. ✅ Test in Expo Go (web features only)
2. ✅ Build development version with EAS
3. ✅ Test FCM notifications on device
4. ✅ Build preview for internal testing
5. ✅ Submit production build to stores
6. ✅ Use EAS Update for quick fixes

Good luck with your deployment! 🎉
