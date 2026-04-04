import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { VetRegistryScreen } from '../screens/vets/VetRegistryScreen';
import { VetDetailScreen } from '../screens/vets/VetDetailScreen';
import { AddEditVetScreen } from '../screens/vets/AddEditVetScreen';
import type { VetsStackParamList } from '../types';

const Stack = createNativeStackNavigator<VetsStackParamList>();

export function VetsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4CAF82' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="VetRegistry" component={VetRegistryScreen} options={{ title: 'Veterinarians' }} />
      <Stack.Screen name="VetDetail" component={VetDetailScreen} options={{ title: 'Vet Profile' }} />
      <Stack.Screen name="AddEditVet" component={AddEditVetScreen} options={({ route }) => ({
        title: route.params?.vetId ? 'Edit Vet' : 'Add Vet',
      })} />
    </Stack.Navigator>
  );
}
