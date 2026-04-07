import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure foreground notification behaviour
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request permissions and return the Expo push token string.
 * Returns null on simulators or when permission is denied.
 *
 * Note: expo-device is no longer required — we use
 * Notifications.getPermissionsAsync() which works on all environments.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Push notification permission denied.');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Pet Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF82',
    });
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch {
    // Simulators and environments without a push token service return an error
    return null;
  }
}

/**
 * Schedule a local notification and return the identifier.
 */
export async function scheduleLocalNotification(opts: {
  title: string;
  body: string;
  triggerDate: Date;
}): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: opts.title,
      body: opts.body,
      sound: true,
    },
    trigger: {
      date: opts.triggerDate,
    },
  });
  return id;
}

/**
 * Cancel a previously scheduled local notification by its identifier.
 */
export async function cancelLocalNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

/**
 * Cancel all scheduled local notifications.
 */
export async function cancelAllLocalNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Returns the Expo push token for the current device.
 * Stored on reminder rows so push notifications can be targeted.
 */
export async function getOrRegisterPushToken(): Promise<string | null> {
  return registerForPushNotifications();
}
