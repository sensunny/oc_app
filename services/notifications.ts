import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from "@/utils/apiClient";

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

// Track if we're using Expo Go or standalone build
const isExpoGo = !messaging;

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

    // Only set up FCM foreground handler in standalone builds
    // In Expo Go, notifications come through Expo push system only
    if (messaging && !isExpoGo) {
      messageUnsubscribe = messaging().onMessage(async (remoteMessage: any) => {
        console.log('FCM message received in foreground:', remoteMessage);

        // Check if this is a duplicate by comparing with recent notifications
        const isDuplicate = await checkDuplicateNotification(remoteMessage);
        if (isDuplicate) {
          console.log('Skipping duplicate notification');
          return;
        }

        // Display notification for FCM messages in standalone builds
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification?.title || 'Notification',
            body: remoteMessage.notification?.body || '',
            data: remoteMessage.data || {},
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

    // In Expo Go, always use Expo push tokens
    // In standalone builds, use FCM tokens
    if (messaging && !isExpoGo) {
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

// Helper function to check for duplicate notifications
const checkDuplicateNotification = async (remoteMessage: any): Promise<boolean> => {
  try {
    const now = Date.now();
    const messageId = remoteMessage.messageId || 
                     remoteMessage.data?.messageId || 
                     `${remoteMessage.notification?.title}-${remoteMessage.notification?.body}`;
    
    // Store recent notification IDs to avoid duplicates
    const recentNotifications = await AsyncStorage.getItem('recent_notifications');
    const notifications: Array<{id: string, timestamp: number}> = recentNotifications ? 
      JSON.parse(recentNotifications) : [];
    
    // Clean old entries (older than 10 seconds)
    const filteredNotifications = notifications.filter(
      n => now - n.timestamp < 10000
    );
    
    // Check if this is a duplicate
    const isDuplicate = filteredNotifications.some(n => n.id === messageId);
    
    if (!isDuplicate) {
      // Add to recent notifications
      filteredNotifications.push({ id: messageId, timestamp: now });
      await AsyncStorage.setItem(
        'recent_notifications', 
        JSON.stringify(filteredNotifications.slice(-20)) // Keep last 20
      );
    }
    
    return isDuplicate;
  } catch (error) {
    console.error('Error checking duplicate notification:', error);
    return false;
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

    const response = await fetch(`${BASE_URL}/saveFCMToken`, {
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
    if (messaging && !isExpoGo) {
      messaging().onTokenRefresh(async (newToken: string) => {
        console.log('FCM Token refreshed:', newToken);
        await saveFCMTokenToAPI(newToken);
      });

      messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
        console.log('FCM message received in background:', remoteMessage);
        // Background messages are handled automatically by the system
      });
    }
  } catch (error) {
    console.error('Error initializing FCM:', error);
  }
};