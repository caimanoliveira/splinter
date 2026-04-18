import 'react-native-url-polyfill/auto';
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider } from '@clerk/expo';
import * as Notifications from 'expo-notifications';

import { RootNavigator } from './src/navigation/RootNavigator';
import { clerkTokenCache } from './src/lib/auth';
import { navigationRef } from './src/lib/navigationRef';

const CLERK_PUBLISHABLE_KEY = process.env['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'] ?? '';

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn('[App] Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env');
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const notifListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    notifListener.current = Notifications.addNotificationReceivedListener(
      (_n) => { /* update badge / in-app state here if needed */ },
    );
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (data?.type === 'reminder' && navigationRef.isReady()) {
        navigationRef.navigate('Main' as never);
      }
    });
    return () => {
      notifListener.current && Notifications.removeNotificationSubscription(notifListener.current);
      responseListener.current && Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={clerkTokenCache}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
