import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { PetsNavigator } from './PetsNavigator';
import { RemindersNavigator } from './RemindersNavigator';
import { AppointmentsNavigator } from './AppointmentsNavigator';
import { VetsNavigator } from './VetsNavigator';
import { S } from '../lib/strings';
import type { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  Pets: { active: 'paw', inactive: 'paw-outline' },
  Reminders: { active: 'alarm', inactive: 'alarm-outline' },
  Appointments: { active: 'calendar', inactive: 'calendar-outline' },
  Vets: { active: 'medical', inactive: 'medical-outline' },
};

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4CAF82',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarStyle: { paddingBottom: 4 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons?.active : icons?.inactive;
          return <Ionicons name={iconName ?? 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Pets" component={PetsNavigator} options={{ title: S.tabPets }} />
      <Tab.Screen name="Reminders" component={RemindersNavigator} options={{ title: S.tabReminders }} />
      <Tab.Screen name="Appointments" component={AppointmentsNavigator} options={{ title: S.tabAppointments }} />
      <Tab.Screen name="Vets" component={VetsNavigator} options={{ title: S.tabVets }} />
    </Tab.Navigator>
  );
}
