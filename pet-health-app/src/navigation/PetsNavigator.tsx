import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PetListScreen } from '../screens/pets/PetListScreen';
import { PetDetailScreen } from '../screens/pets/PetDetailScreen';
import { AddEditPetScreen } from '../screens/pets/AddEditPetScreen';
import { HealthRecordsScreen } from '../screens/health/HealthRecordsScreen';
import { AddRecordScreen } from '../screens/health/AddRecordScreen';
import { RecordDetailScreen } from '../screens/health/RecordDetailScreen';
import { S } from '../lib/strings';
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
      <Stack.Screen name="PetList" component={PetListScreen} options={{ title: S.myPets }} />
      <Stack.Screen name="PetDetail" component={PetDetailScreen} options={{ title: S.petProfile }} />
      <Stack.Screen name="AddEditPet" component={AddEditPetScreen} options={({ route }) => ({
        title: route.params?.petId ? S.editPet : S.addPet,
      })} />
      <Stack.Screen name="HealthRecords" component={HealthRecordsScreen} options={({ route }) => ({
        title: S.healthRecords(route.params.petName),
      })} />
      <Stack.Screen name="AddRecord" component={AddRecordScreen} options={({ route }) => ({
        title: route.params.recordId ? S.editRecord : S.addRecord,
      })} />
      <Stack.Screen name="RecordDetail" component={RecordDetailScreen} options={{ title: S.recordDetail }} />
    </Stack.Navigator>
  );
}
