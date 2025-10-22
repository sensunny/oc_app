# Patient Management App

A production-ready React Native app built with Expo, featuring Firebase Cloud Messaging push notifications, authentication, and patient management.

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/sensunny/oc_app)

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Scan the QR code with:
- **iOS**: Camera app or Expo Go
- **Android**: Expo Go app

## 📱 Features

- ✅ Firebase Cloud Messaging (Push Notifications)
- ✅ Expo Notifications (Development Support)
- ✅ Email/Password Authentication
- ✅ Patient Dashboard
- ✅ Document Management
- ✅ Profile Management
- ✅ Tab Navigation
- ✅ iOS & Android Support

## 🔥 Push Notifications

This app uses a **hybrid approach** for push notifications:

### In Development (Expo Go)
- Uses **Expo Push Notifications**
- Easy testing without building
- Perfect for rapid development

### In Production (EAS Build)
- Uses **Firebase Cloud Messaging (FCM)**
- Native push notifications
- Full production features

The code automatically detects the environment and uses the appropriate system.

## 🛠️ Technology Stack

- **Framework**: Expo (React Native)
- **Navigation**: expo-router (file-based routing)
- **Notifications**: expo-notifications + Firebase FCM
- **Authentication**: Custom API integration
- **Database**: Supabase (available but not currently used)
- **State Management**: React Context

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Quick reference guide
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Comprehensive deployment instructions
- **[EXPO_VS_BARE_COMPARISON.md](EXPO_VS_BARE_COMPARISON.md)** - Why we use Expo
- **[PUSH_TO_GIT.md](PUSH_TO_GIT.md)** - Git workflow instructions
- **[FILES_CREATED.md](FILES_CREATED.md)** - Index of all documentation

## 🏗️ Project Structure

```
├── app/                    # Screens (expo-router)
│   ├── (tabs)/            # Tab navigation
│   │   ├── _layout.tsx   # Tab bar configuration
│   │   ├── index.tsx     # Home screen
│   │   ├── documents.tsx # Documents screen
│   │   └── profile.tsx   # Profile screen
│   ├── _layout.tsx        # Root layout
│   └── login.tsx          # Login screen
├── components/            # Reusable components
├── contexts/              # React contexts
├── services/              # API and services
│   ├── api.ts            # Backend API calls
│   └── notifications.ts  # Push notifications
├── config/                # Configuration
├── .env                   # Environment variables
├── app.json              # Expo configuration
└── eas.json              # EAS Build configuration
```

## 🔧 Configuration

### Environment Variables (.env)
```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
```

### Firebase Configuration
- **Android**: `google-services.json` (root directory)
- **iOS**: `GoogleService-Info.plist` (root directory)

### App Identifiers
- **Bundle ID (iOS)**: `com.sensunny.patientmanagementapp`
- **Package (Android)**: `com.sensunny.patientmanagementapp`
- **Expo Project ID**: `b941d44b-470f-44c6-b02d-c3c64fe38ea3`

## 📦 Building for Production

### Prerequisites
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login
```

### Build Commands

#### Development Build (with dev tools)
```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

#### Production Build
```bash
eas build --profile production --platform android
eas build --profile production --platform ios
```

### Submit to Stores
```bash
eas submit --platform ios      # iOS App Store
eas submit --platform android  # Google Play Store
```

## 🧪 Testing Push Notifications

### In Expo Go
1. Run `npm run dev`
2. Open app in Expo Go
3. Uses Expo push notifications
4. Send test via Expo dashboard

### In EAS Build
1. Build with EAS
2. Install on device
3. Check console for FCM token
4. Send test via Firebase Console

## 🌿 Git Workflow

```bash
cd /tmp/cc-agent/58848219/project
git checkout -b keep-expo-notifications
git add -A
git commit -m "Keep Expo notifications with Firebase FCM integration"
git push -u origin keep-expo-notifications
```

See **[PUSH_TO_GIT.md](PUSH_TO_GIT.md)** for detailed instructions.

## 🚀 Deployment Workflow

1. **Develop** → Test in Expo Go
2. **Build** → Create development build for testing
3. **Test** → Verify on real devices
4. **Build Production** → Create production builds
5. **Submit** → Submit to app stores
6. **Update** → Use EAS Update for quick fixes

## 📊 Available Scripts

```bash
npm run dev          # Start development server
npm run build:web    # Build for web
npm run lint         # Run linter
npm run typecheck    # TypeScript type checking
```

## 🛟 Troubleshooting

### "Firebase messaging not available"
- Running in Expo Go (expected)
- Build with EAS for Firebase support

### Notifications not received
1. Check permissions are granted
2. Verify FCM token sent to backend
3. Test with app in background
4. Check Firebase Console for errors

## 💡 Why Expo?

Used by: Walmart, Coinbase, Brex, Decathlon, and many more.

**Benefits**:
- ✅ Faster development
- ✅ Built-in OTA updates
- ✅ Simplified build process
- ✅ Production ready

See **[EXPO_VS_BARE_COMPARISON.md](EXPO_VS_BARE_COMPARISON.md)** for details.

## 📞 Support & Resources

- **Expo Docs**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **Firebase**: https://firebase.google.com/docs

---

**Need help?** Check the documentation or run `./BUILD_AND_DEPLOY.sh`

🎉 Happy coding!
