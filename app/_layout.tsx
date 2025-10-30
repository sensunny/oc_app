import { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View, Image, StyleSheet } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { initializeNotifications, initializeFCMAndSendToken, cleanupListeners } from '../services/notifications';

// === CONFIG: Change this URL to your dynamic splash image ===
const REMOTE_SPLASH_URL = 'https://www.oncarecancer.com/img/featured/2025-10-30%2C13%3A35%3A28.195Z-1024.png'; // Replace with your URL

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RemoteSplashScreen({ onLoaded }: { onLoaded: () => void }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Preload the image
    Image.prefetch(REMOTE_SPLASH_URL)
      .then(() => {
        setImageLoaded(true);
      })
      .catch(() => {
        setImageError(true);
        setImageLoaded(true); // Still proceed even if image fails
      });
  }, []);

  useEffect(() => {
    if (imageLoaded) {
      // Small delay to ensure smooth visual transition
      const timer = setTimeout(async () => {
        await SplashScreen.hideAsync();
        onLoaded();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [imageLoaded, onLoaded]);

  if (!imageLoaded) {
    return null; // Native splash is still visible
  }

  return (
    <View style={styles.container}>
      {!imageError ? (
        <Image
          source={{ uri: REMOTE_SPLASH_URL }}
          style={styles.image}
          resizeMode="contain"
          onError={() => {
            setImageError(true);
            SplashScreen.hideAsync();
            onLoaded();
          }}
        />
      ) : (
        <View style={styles.fallback} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#262f82',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '90%',
    height: '90%',
  },
  fallback: {
    flex: 1,
    backgroundColor: '#262f82',
  },
});

function RootLayoutNav() {
  const { isAuthenticated, loading, patient } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [appIsReady, setAppIsReady] = useState(false);
  const [showRemoteSplash, setShowRemoteSplash] = useState(true);
  const notificationsInitialized = useRef(false);

  // Initialize FCM once when component mounts
  useEffect(() => {
    initializeFCMAndSendToken();
  }, []);

  // Handle app initialization and authentication
  useEffect(() => {
    async function prepare() {
      try {
        // Wait for authentication to load
        if (loading) return;

        // Handle routing based on auth state
        const inAuthGroup = segments[0] === '(tabs)';

        if (!isAuthenticated || !patient) {
          if (inAuthGroup || segments[0] !== 'login') {
            router.replace('/login');
          }
        } else if (isAuthenticated && patient && !inAuthGroup) {
          router.replace('/(tabs)');
        }

        // Artificially delay for two seconds to simulate loading things
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, [isAuthenticated, loading, patient, segments]);

  // Initialize notifications when authenticated
  useEffect(() => {
    if (isAuthenticated && patient && !notificationsInitialized.current) {
      console.log('Initializing notifications for patient:', patient._id);
      
      initializeNotifications({
        patientId: patient._id,
        onNotificationReceived: (notification) => {
          console.log('Notification received (foreground):', notification);
        },
        onNotificationOpened: (response) => {
          console.log('Notification clicked:', response);

          const title = response.notification.request.content.title?.toLowerCase() || '';
          const body = response.notification.request.content.body?.toLowerCase() || '';
          const combinedText = title + ' ' + body;
          const data = response.notification.request.content.data || {};

          if (
            combinedText.includes('document') ||
            combinedText.includes('report') ||
            combinedText.includes('prescription') ||
            data.type === 'document_upload'
          ) {
            router.push('/(tabs)/documents');
          }
        },
      });

      notificationsInitialized.current = true;
    }

    return () => {
      if (!isAuthenticated || !patient) {
        console.log('Cleaning up notification listeners');
        cleanupListeners();
        notificationsInitialized.current = false;
      }
    };
  }, [isAuthenticated, patient, router]);

  // Show remote splash until it's loaded
  if (showRemoteSplash) {
    return <RemoteSplashScreen onLoaded={() => setShowRemoteSplash(false)} />;
  }

  // Show nothing until app is ready (native splash still visible)
  if (!appIsReady) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <RootLayoutNav />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}