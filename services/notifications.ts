import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { pushTokenApi } from './api';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from '../config/firebase';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export interface NotificationConfig {
  patientId?: string;
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void;
}

let notificationListeners: {
  received?: Notifications.Subscription;
  response?: Notifications.Subscription;
} = {};

export const initializeNotifications = async (config: NotificationConfig) => {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return null;
  }

  try {
    const Device = require('expo-device');
    const token = await registerForPushNotifications();

    if (token && config.patientId) {
      const deviceInfo = {
        deviceId: Device.deviceName || 'Unknown',
        platform: Platform.OS,
        osVersion: Device.osVersion,
        brand: Device.brand,
        modelName: Device.modelName,
      };

      await pushTokenApi.registerToken(config.patientId, token, deviceInfo);
    }

    cleanupListeners();

    if (config.onNotificationReceived) {
      notificationListeners.received = Notifications.addNotificationReceivedListener(
        config.onNotificationReceived
      );
    }

    if (config.onNotificationResponse) {
      notificationListeners.response = Notifications.addNotificationResponseReceivedListener(
        config.onNotificationResponse
      );
    }

    const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
    if (lastNotificationResponse && config.onNotificationResponse) {
      config.onNotificationResponse(lastNotificationResponse);
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
    const Device = require('expo-device');
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('Failed to get push notification permissions');
      return null;
    }

    const fcmToken = await messaging().getToken();
    console.log('FCM Token:', fcmToken);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#20606B',
      });

      await Notifications.setNotificationChannelAsync('document_upload', {
        name: 'Document Uploads',
        description: 'Notifications for new document uploads',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#20606B',
        sound: 'default',
      });
    }

    return fcmToken;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>
) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: data?.type || 'default',
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

export const cleanupListeners = () => {
  if (notificationListeners.received) {
    notificationListeners.received.remove();
  }
  if (notificationListeners.response) {
    notificationListeners.response.remove();
  }
  notificationListeners = {};
};

export const getBadgeCount = async (): Promise<number> => {
  return await Notifications.getBadgeCountAsync();
};

export const setBadgeCount = async (count: number) => {
  await Notifications.setBadgeCountAsync(count);
};

export const clearBadge = async () => {
  await Notifications.setBadgeCountAsync(0);
};

export const dismissAllNotifications = async () => {
  await Notifications.dismissAllNotificationsAsync();
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

  try {
    const fcmToken = await registerForPushNotifications();
    if (fcmToken) {
      await saveFCMTokenToAPI(fcmToken);
    }

    messaging().onTokenRefresh(async (newToken) => {
      console.log('FCM Token refreshed:', newToken);
      await saveFCMTokenToAPI(newToken);
    });

    messaging().onMessage(async (remoteMessage) => {
      console.log('FCM message received in foreground:', remoteMessage);
      if (remoteMessage.notification) {
        await scheduleLocalNotification(
          remoteMessage.notification.title || 'Notification',
          remoteMessage.notification.body || '',
          remoteMessage.data
        );
      }
    });

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('FCM message received in background:', remoteMessage);
    });
  } catch (error) {
    console.error('Error initializing FCM:', error);
  }
};
