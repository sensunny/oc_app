import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationConfig {
  patientId?: string;
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationOpened?: (response: Notifications.NotificationResponse) => void;
}

let notificationListener: Notifications.Subscription | null = null;
let responseListener: Notifications.Subscription | null = null;
let messageUnsubscribe: (() => void) | null = null;

export const initializeNotifications = async (config: NotificationConfig) => {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return null;
  }

  try {
    cleanupListeners();

    const token = await registerForPushNotifications();

    if (token && config.patientId) {
      await saveFCMTokenToAPI(token);
    }

    if (config.onNotificationReceived) {
      notificationListener = Notifications.addNotificationReceivedListener(
        config.onNotificationReceived
      );
    }

    if (config.onNotificationOpened) {
      responseListener = Notifications.addNotificationResponseReceivedListener(
        config.onNotificationOpened
      );
    }

    if (messaging) {
      messageUnsubscribe = messaging().onMessage(async (remoteMessage: any) => {
        console.log('FCM message received in foreground:', remoteMessage);

        // Only display notification if we're in a build (not Expo Go)
        // In Expo Go, notifications come through Expo push system
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification?.title || 'Notification',
            body: remoteMessage.notification?.body || '',
            data: remoteMessage.data,
          },
          trigger: null,
        });
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

  try {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      return null;
    }

    let token: string | undefined;

    if (messaging) {
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
        const apnsToken = await messaging().getAPNSToken();
        if (apnsToken) {
          console.log('APNS Token:', apnsToken);
        }
      }

      const fcmToken = await messaging().getToken();
      console.log('FCM Token:', fcmToken);
      token = fcmToken;
    } else {
      const expoPushToken = await Notifications.getExpoPushTokenAsync({
        projectId: 'b941d44b-470f-44c6-b02d-c3c64fe38ea3',
      });
      console.log('Expo Push Token:', expoPushToken.data);
      token = expoPushToken.data;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token || null;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

export const cleanupListeners = () => {
  if (notificationListener) {
    notificationListener.remove();
    notificationListener = null;
  }
  if (responseListener) {
    responseListener.remove();
    responseListener = null;
  }
  if (messageUnsubscribe) {
    messageUnsubscribe();
    messageUnsubscribe = null;
  }
};

export const getBadgeCount = async (): Promise<number> => {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
};

export const setBadgeCount = async (count: number) => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
};

export const clearBadge = async () => {
  await setBadgeCount(0);
};

export const saveFCMTokenToAPI = async (fcmToken: string): Promise<boolean> => {
  try {
    if (!fcmToken) {
      console.warn('No FCM token to save');
      return false;
    }

    const token = await AsyncStorage.getItem('access_token');

    if (!token) {
      console.warn('No access token available, skipping FCM token save');
      return false;
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'token': token,
    };

    const response = await fetch('https://www.oncarecancer.com/mobile-app/saveFCMToken', {
      method: 'POST',
      headers,
      body: JSON.stringify({ fcmToken }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to save FCM token:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('FCM token saved successfully:', result);
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

  try {
    // Set up Firebase token refresh handler only
    // Message handlers are set up in initializeNotifications to avoid duplicates
    if (messaging) {
      messaging().onTokenRefresh(async (newToken: string) => {
        console.log('FCM Token refreshed:', newToken);
        await saveFCMTokenToAPI(newToken);
      });

      messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
        console.log('FCM message received in background:', remoteMessage);
      });
    }
  } catch (error) {
    console.error('Error initializing FCM:', error);
  }
};
