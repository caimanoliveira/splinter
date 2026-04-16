import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RemindersScreen } from '../screens/reminders/RemindersScreen';
import { AddReminderScreen } from '../screens/reminders/AddReminderScreen';
import { S } from '../lib/strings';
import type { RemindersStackParamList } from '../types';

const Stack = createNativeStackNavigator<RemindersStackParamList>();

export function RemindersNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4CAF82' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="ReminderList" component={RemindersScreen} options={{ title: S.reminders }} />
      <Stack.Screen name="AddReminder" component={AddReminderScreen} options={({ route }) => ({
        title: route.params?.reminderId ? S.editReminder : S.addReminder,
      })} />
    </Stack.Navigator>
  );
}
