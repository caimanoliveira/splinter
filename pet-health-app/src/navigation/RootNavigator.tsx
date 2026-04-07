import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth, useUser } from '@clerk/expo';

import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { useProfileStore } from '../store/authStore';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { syncProfile } = useProfileStore();

  // Sync Clerk user data into our `users` table on sign-in
  useEffect(() => {
    if (isSignedIn && user) {
      const fullName =
        user.fullName ??
        [user.firstName, user.lastName].filter(Boolean).join(' ') ??
        null;
      syncProfile(user.id, fullName);
    }
  }, [isSignedIn, user, syncProfile]);

  if (!isLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4CAF82" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isSignedIn ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
});
