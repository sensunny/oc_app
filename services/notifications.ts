import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { pushTokenApi } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

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
    const token = await registerForPushNotifications();

    if (token && config.patientId) {
      const deviceInfo = {
        deviceId: Device.deviceName || 'Unknown',
        platform: Platform.OS,
        osVersion: Device.osVersion || 'Unknown',
        brand: Device.brand || 'Unknown',
        modelName: Device.modelName || 'Unknown',
      };

      await saveExpoTokenToAPI(token);
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
    console.log('Push notifications not supported on web');
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

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn('Project ID not found. Using fallback token generation.');
    }

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    })).data;

    console.log('Expo Push Token:', token);

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

    return token;
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

export const saveExpoTokenToAPI = async (expoToken: string): Promise<boolean> => {
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
      body: JSON.stringify({ fcmToken: expoToken }),
    });

    if (!response.ok) {
      console.error('Failed to save Expo push token:', await response.text());
      return false;
    }

    console.log('Expo push token saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving Expo push token:', error);
    return false;
  }
};

export const initializeExpoNotifications = async () => {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const expoToken = await registerForPushNotifications();
    if (expoToken) {
      await saveExpoTokenToAPI(expoToken);
      console.log('Expo notifications initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing Expo notifications:', error);
  }
};
