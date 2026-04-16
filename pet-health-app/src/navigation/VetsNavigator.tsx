import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { VetRegistryScreen } from '../screens/vets/VetRegistryScreen';
import { VetDetailScreen } from '../screens/vets/VetDetailScreen';
import { AddEditVetScreen } from '../screens/vets/AddEditVetScreen';
import { S } from '../lib/strings';
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
      <Stack.Screen name="VetRegistry" component={VetRegistryScreen} options={{ title: S.vets }} />
      <Stack.Screen name="VetDetail" component={VetDetailScreen} options={{ title: S.vetProfile }} />
      <Stack.Screen name="AddEditVet" component={AddEditVetScreen} options={({ route }) => ({
        title: route.params?.vetId ? S.editVet : S.addVet,
      })} />
    </Stack.Navigator>
  );
}
