import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { initializeNotifications, initializeFCMAndSendToken } from '../services/notifications';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, loading, patient } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [navigationReady, setNavigationReady] = useState(false);

  useEffect(() => {
    initializeFCMAndSendToken();
  }, []);

  useEffect(() => {
    if (loading) return;

    setNavigationReady(true);

    const inAuthGroup = segments[0] === '(tabs)';

    if (!isAuthenticated || !patient) {
      if (inAuthGroup || segments[0] !== 'login') {
        router.replace('/login');
      }
    } else if (isAuthenticated && patient && !inAuthGroup) {
      router.replace('/(tabs)');
    }

    SplashScreen.hideAsync();
  }, [isAuthenticated, loading, patient, segments]);

  useEffect(() => {
    if (isAuthenticated && patient) {
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

          if (
            combinedText.includes('document') ||
            combinedText.includes('report') ||
            combinedText.includes('prescription')
          ) {
            router.push('/(tabs)/documents');
          } else if (response.notification.request.content.data?.type === 'document_upload') {
            router.push('/(tabs)/documents');
          }
        },
      });
    }
  }, [isAuthenticated, patient]);

  if (!navigationReady) {
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
