import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { initializeNotifications, initializeFCMAndSendToken } from '../services/notifications';

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

    if (!isAuthenticated && inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && !inAuthGroup && segments[0] !== 'login') {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    if (isAuthenticated && patient) {
      initializeNotifications({
        patientId: patient._id,
        onNotificationReceived: (notification) => {
          console.log('Notification received (foreground):', notification);
        },
        onNotificationOpened: (response) => {
          console.log('Notification clicked:', response);

          if (response.notification.request.content.data?.type === 'document_upload') {
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
