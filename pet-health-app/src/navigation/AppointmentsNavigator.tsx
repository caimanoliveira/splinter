import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AppointmentCalendarScreen } from '../screens/appointments/AppointmentCalendarScreen';
import { AddAppointmentScreen } from '../screens/appointments/AddAppointmentScreen';
import type { AppointmentsStackParamList } from '../types';

const Stack = createNativeStackNavigator<AppointmentsStackParamList>();

export function AppointmentsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4CAF82' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="AppointmentCalendar"
        component={AppointmentCalendarScreen}
        options={{ title: 'Appointments' }}
      />
      <Stack.Screen
        name="AddAppointment"
        component={AddAppointmentScreen}
        options={({ route }) => ({
          title: route.params?.appointmentId ? 'Edit Appointment' : 'New Appointment',
        })}
      />
    </Stack.Navigator>
  );
}
