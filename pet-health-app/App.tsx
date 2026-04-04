import 'react-native-url-polyfill/auto';
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { NavigationContainerRef } from '@react-navigation/native';

import { RootNavigator } from './src/navigation/RootNavigator';

// Notification handler: show alert while app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Listen for incoming notifications (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // Optionally update badge / state here
      },
    );

    // Listen for user tapping a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (_response) => {
        // Navigate to relevant screen based on notification data
        // e.g. _response.notification.request.content.data
      },
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
