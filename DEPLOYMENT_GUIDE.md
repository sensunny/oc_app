# Deployment Guide - Patient Management App

## Overview

This app uses Expo with Firebase Cloud Messaging for push notifications. Expo is a production-ready framework used by many companies. Converting to bare React Native would require weeks of work and provide no significant benefit.

## Prerequisites

1. **Node.js** installed (v18 or higher)
2. **EAS CLI** installed globally:
   ```bash
   npm install -g eas-cli
   ```
3. **Expo Account** - Sign up at https://expo.dev
4. **Apple Developer Account** (for iOS builds)
5. **Google Play Console Account** (for Android builds)

## Initial Setup

### 1. Login to EAS

```bash
eas login
```

### 2. Configure EAS Project

The project is already configured with:
- EAS Project ID: `b941d44b-470f-44c6-b02d-c3c64fe38ea3`
- Bundle ID (iOS): `com.sensunny.patientmanagementapp`
- Package (Android): `com.sensunny.patientmanagementapp`

## Build Configurations

### Development Build (Recommended for Testing)

Development builds include Firebase and allow testing on real devices:

```bash
# For iOS
eas build --profile development --platform ios

# For Android
eas build --profile development --platform android
```

After the build completes:
- **iOS**: Install on device via TestFlight or direct download
- **Android**: Download .apk and install directly on device

### Production Build

```bash
# For iOS
eas build --profile production --platform ios

# For Android
eas build --profile production --platform android
```

### Preview Build (Internal Testing)

```bash
# For iOS
eas build --profile preview --platform ios

# For Android
eas build --profile preview --platform android
```

## Firebase Setup

Your Firebase configuration is already set up:

### Android
- `google-services.json` is present in root
- Referenced in `app.json`

### iOS
- `GoogleService-Info.plist` is present in root
- Referenced in `app.json`

### Firebase Cloud Messaging

The app uses Firebase Cloud Messaging (FCM) for push notifications:
- **Development**: FCM won't work in Expo Go (expected behavior)
- **Production**: FCM works perfectly in EAS development/production builds

## Testing the App

### Option 1: Expo Go (Quick Testing - No FCM)

```bash
npm run dev
```

Scan the QR code with:
- **iOS**: Camera app
- **Android**: Expo Go app

**Note**: Firebase notifications won't work in Expo Go.

### Option 2: Development Build (Full Testing with FCM)

1. Build development version:
   ```bash
   eas build --profile development --platform android
   ```

2. Install on your device

3. Run development server:
   ```bash
   npx expo start --dev-client
   ```

4. Open the app on your device - it will connect to the dev server

## Push to New Branch

### Create and Push FCM Branch

```bash
# Make sure you're in the project directory
cd /tmp/cc-agent/58848219/project

# Check current status
git status

# Create new branch
git checkout -b fcm-pure-firebase

# Stage all changes
git add -A

# Commit changes
git commit -m "Remove Expo notifications, use pure Firebase FCM

- Removed expo-notifications dependency
- Rewrote notifications.ts to use only Firebase messaging
- All push notifications handled by Firebase
- Fixed authentication context patient data loading
- FCM tokens for both iOS and Android
- Supports foreground, background, and notification tap handling"

# Push to new branch
git push -u origin fcm-pure-firebase
```

## Deployment to Stores

### iOS App Store

1. **Build for production**:
   ```bash
   eas build --profile production --platform ios
   ```

2. **Submit to App Store**:
   ```bash
   eas submit --platform ios
   ```

3. Follow the prompts to upload to App Store Connect

### Google Play Store

1. **Build for production**:
   ```bash
   eas build --profile production --platform android
   ```

2. **Submit to Play Store**:
   ```bash
   eas submit --platform android
   ```

3. Follow the prompts to upload to Play Console

## Environment Variables

Your app uses these environment variables from `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-key>
```

For EAS builds, set secrets:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your-url"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key"
```

## Testing Push Notifications

### Send Test Notification via Firebase Console

1. Go to Firebase Console > Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and text
4. Click "Send test message"
5. Enter your FCM token (logged in app console)
6. Click "Test"

### Send via API

```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "FCM_TOKEN_FROM_APP",
    "notification": {
      "title": "Test Notification",
      "body": "This is a test from API"
    },
    "data": {
      "type": "test",
      "customData": "value"
    }
  }'
```

## Monitoring Builds

### Check Build Status

```bash
eas build:list
```

### View Build Logs

```bash
eas build:view BUILD_ID
```

## Common Issues

### Issue: Firebase not working
**Solution**: Make sure you're using a development or production build, not Expo Go.

### Issue: Build fails
**Solution**: Check that `google-services.json` and `GoogleService-Info.plist` are valid and in the root directory.

### Issue: Can't receive notifications
**Solution**:
1. Check device permissions
2. Verify FCM token is being sent to backend
3. Check Firebase Console for errors
4. Ensure app is in background when testing background notifications

## Update Over-the-Air (OTA)

For non-native code changes, use EAS Update:

```bash
# Publish update
eas update --branch production --message "Bug fixes"
```

## Build Channels

Your app can have different channels:

- `production` - Live app users
- `preview` - Internal testing
- `development` - Active development

## Recommended Workflow

1. **Development**: Use development build + dev server
2. **Testing**: Build preview version for testers
3. **Production**: Build and submit to stores
4. **Updates**: Use EAS Update for JavaScript changes
5. **New Features**: Create feature branches and merge to main

## Support

- EAS Documentation: https://docs.expo.dev/build/introduction/
- Firebase FCM: https://firebase.google.com/docs/cloud-messaging
- React Native Firebase: https://rnfirebase.io/

## Cost Estimate

### Expo EAS (https://expo.dev/pricing)

- **Free Tier**: Limited builds per month
- **Production Plan**: $29/month - Unlimited builds
- **Enterprise**: Custom pricing

### Why Keep Expo?

1. **Faster Development**: Built-in tools and services
2. **Easy Updates**: OTA updates without app store review
3. **Better DX**: Simplified build process
4. **Production Ready**: Used by major companies
5. **Cross-Platform**: Single codebase for iOS/Android/Web
6. **Maintained**: Regular updates and security patches

Converting to bare React Native would cost weeks of development time and provide minimal benefits for your use case.
