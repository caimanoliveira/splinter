import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PetListScreen } from '../screens/pets/PetListScreen';
import { PetDetailScreen } from '../screens/pets/PetDetailScreen';
import { AddEditPetScreen } from '../screens/pets/AddEditPetScreen';
import { HealthRecordsScreen } from '../screens/health/HealthRecordsScreen';
import { AddRecordScreen } from '../screens/health/AddRecordScreen';
import { RecordDetailScreen } from '../screens/health/RecordDetailScreen';
import type { PetsStackParamList } from '../types';

const Stack = createNativeStackNavigator<PetsStackParamList>();

export function PetsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4CAF82' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="PetList" component={PetListScreen} options={{ title: 'My Pets' }} />
      <Stack.Screen name="PetDetail" component={PetDetailScreen} options={{ title: 'Pet Profile' }} />
      <Stack.Screen name="AddEditPet" component={AddEditPetScreen} options={({ route }) => ({
        title: route.params?.petId ? 'Edit Pet' : 'Add Pet',
      })} />
      <Stack.Screen name="HealthRecords" component={HealthRecordsScreen} options={({ route }) => ({
        title: `${route.params.petName}'s Records`,
      })} />
      <Stack.Screen name="AddRecord" component={AddRecordScreen} options={({ route }) => ({
        title: route.params.recordId ? 'Edit Record' : 'Add Record',
      })} />
      <Stack.Screen name="RecordDetail" component={RecordDetailScreen} options={{ title: 'Record Detail' }} />
    </Stack.Navigator>
  );
}
