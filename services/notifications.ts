import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let messaging: any = null;

try {
  if (Platform.OS !== 'web') {
    messaging = require('@react-native-firebase/messaging').default;
  }
} catch (error) {
  console.warn('Firebase messaging module not available. This is expected in Expo Go.');
}

export interface NotificationConfig {
  patientId?: string;
  onNotificationReceived?: (notification: any) => void;
  onNotificationResponse?: (response: any) => void;
}

let unsubscribeForeground: (() => void) | null = null;

export const initializeNotifications = async (config: NotificationConfig) => {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return null;
  }

  if (!messaging) {
    console.warn('Firebase messaging not available. Build with EAS to use FCM push notifications.');
    return null;
  }

  try {
    const token = await registerForPushNotifications();

    if (token) {
      await saveFCMTokenToAPI(token);
    }

    cleanupListeners();

    if (config.onNotificationReceived) {
      unsubscribeForeground = messaging().onMessage(async (remoteMessage: any) => {
        console.log('Notification received in foreground:', remoteMessage);
        config.onNotificationReceived?.(remoteMessage);
      });
    }

    return token;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return null;
  }
};

export const registerForPushNotifications = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!messaging) {
    console.warn('Firebase messaging not available. Build with EAS to use FCM push notifications.');
    return null;
  }

  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('Failed to get push notification permissions');
      return null;
    }

    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages();
      const apnsToken = await messaging().getAPNSToken();
      if (apnsToken) {
        console.log('APNS Token:', apnsToken);
      }
    }

    const fcmToken = await messaging().getToken();
    console.log('FCM Token:', fcmToken);

    return fcmToken;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

export const cleanupListeners = () => {
  if (unsubscribeForeground) {
    unsubscribeForeground();
    unsubscribeForeground = null;
  }
};

export const getBadgeCount = async (): Promise<number> => {
  if (!messaging) return 0;

  try {
    if (Platform.OS === 'ios') {
      const badge = await messaging().getBadge();
      return badge || 0;
    }
  } catch (error) {
    console.error('Error getting badge count:', error);
  }
  return 0;
};

export const setBadgeCount = async (count: number) => {
  if (!messaging) return;

  try {
    if (Platform.OS === 'ios') {
      await messaging().setBadge(count);
    }
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
};

export const clearBadge = async () => {
  await setBadgeCount(0);
};

export const dismissAllNotifications = async () => {
  console.log('Dismiss notifications not implemented for FCM');
};

export const saveFCMTokenToAPI = async (fcmToken: string): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['token'] = token;
    }

    const response = await fetch('https://www.oncarecancer.com/mobile-app/saveFCMToken', {
      method: 'POST',
      headers,
      body: JSON.stringify({ fcmToken }),
    });

    if (!response.ok) {
      console.error('Failed to save FCM token:', await response.text());
      return false;
    }

    console.log('FCM token saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return false;
  }
};

export const initializeFCMAndSendToken = async () => {
  if (Platform.OS === 'web') {
    return;
  }

  if (!messaging) {
    console.warn('Firebase messaging not available. Build with EAS to use FCM push notifications.');
    return;
  }

  try {
    const fcmToken = await registerForPushNotifications();
    if (fcmToken) {
      await saveFCMTokenToAPI(fcmToken);
    }

    messaging().onTokenRefresh(async (newToken: string) => {
      console.log('FCM Token refreshed:', newToken);
      await saveFCMTokenToAPI(newToken);
    });

    messaging().onMessage(async (remoteMessage: any) => {
      console.log('FCM message received in foreground:', remoteMessage);
    });

    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('FCM message received in background:', remoteMessage);
    });
  } catch (error) {
    console.error('Error initializing FCM:', error);
  }
};
