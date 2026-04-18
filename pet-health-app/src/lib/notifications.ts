import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
    return null;
  }
}

export async function scheduleLocalNotification(opts: {
  title: string;
  body: string;
  triggerDate: Date;
  data?: Record<string, unknown>;
}): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: opts.title,
      body: opts.body,
      sound: true,
      data: opts.data ?? {},
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: opts.triggerDate,
    },
  });
  return id;
}

export async function cancelLocalNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllLocalNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getOrRegisterPushToken(): Promise<string | null> {
  return registerForPushNotifications();
}
