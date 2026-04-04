import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { usePetStore } from '../../store/petStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { WeightChart } from '../../components/pets/WeightChart';
import { Button } from '../../components/common/Button';
import type { PetsStackParamList } from '../../types';

type Props = NativeStackScreenProps<PetsStackParamList, 'PetDetail'>;

export function PetDetailScreen({ navigation, route }: Props) {
  const { petId } = route.params;
  const { activePet, weightLogs, loading, fetchPet, fetchWeightLogs, deletePet, addWeightLog } =
    usePetStore();

  useEffect(() => {
    fetchPet(petId);
    fetchWeightLogs(petId);
  }, [petId, fetchPet, fetchWeightLogs]);

  const logs = weightLogs[petId] ?? [];
  const latestWeight = logs.length > 0 ? logs[logs.length - 1] : null;

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Remove Pet',
      `Are you sure you want to remove ${activePet?.name ?? 'this pet'}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePet(petId);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Could not remove pet. Please try again.');
            }
          },
        },
      ],
    );
  }, [activePet, deletePet, navigation, petId]);

  const handleLogWeight = useCallback(() => {
    Alert.prompt(
      'Log Weight',
      'Enter current weight in kg:',
      async (value) => {
        if (!value) return;
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
          Alert.alert('Invalid weight', 'Please enter a valid positive number.');
          return;
        }
        try {
          await addWeightLog({
            pet_id: petId,
            weight_kg: num,
            logged_at: new Date().toISOString().split('T')[0] ?? new Date().toISOString(),
            notes: null,
          });
        } catch {
          Alert.alert('Error', 'Could not save weight entry.');
        }
      },
      'plain-text',
      latestWeight ? String(latestWeight.weight_kg) : '',
    );
  }, [addWeightLog, latestWeight, petId]);

  if (loading && !activePet) {
    return <LoadingSpinner fullScreen />;
  }

  if (!activePet) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Pet not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        {activePet.photo_url ? (
          <Image source={{ uri: activePet.photo_url }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons name="paw" size={64} color="#4CAF82" />
          </View>
        )}
        <Text style={styles.petName}>{activePet.name}</Text>
        <Text style={styles.petMeta}>
          {activePet.species} {activePet.breed ? `· ${activePet.breed}` : ''}
        </Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCard
          icon="scale-outline"
          label="Weight"
          value={latestWeight ? `${latestWeight.weight_kg} kg` : '—'}
        />
        <StatCard
          icon="calendar-outline"
          label="Age"
          value={activePet.birthdate ? calcAge(activePet.birthdate) : '—'}
        />
        <StatCard
          icon="medical-outline"
          label="Species"
          value={capitalize(activePet.species)}
        />
      </View>

      {/* Weight chart */}
      <WeightChart logs={logs} />

      {/* Weight log button */}
      <Button
        title="Log Weight"
        onPress={handleLogWeight}
        variant="secondary"
        style={styles.actionBtn}
      />

      {/* Health records */}
      <Button
        title="View Health Records"
        onPress={() =>
          navigation.navigate('HealthRecords', { petId, petName: activePet.name })
        }
        style={styles.actionBtn}
      />

      {/* Edit / Delete */}
      <View style={styles.row}>
        <Button
          title="Edit"
          onPress={() => navigation.navigate('AddEditPet', { petId })}
          variant="secondary"
          style={styles.halfBtn}
        />
        <Button
          title="Remove Pet"
          onPress={handleDelete}
          variant="danger"
          style={styles.halfBtn}
        />
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={statStyles.card}>
      <Ionicons name={icon} size={22} color="#4CAF82" />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function calcAge(birthdate: string): string {
  const birth = new Date(birthdate);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth() + (now.getDate() >= birth.getDate() ? 0 : -1);
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) return `${totalMonths}mo`;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return `${y}yr${m > 0 ? ` ${m}mo` : ''}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 20 },
  heroImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 12 },
  heroPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  petName: { fontSize: 26, fontWeight: '800', color: '#212121' },
  petMeta: { fontSize: 14, color: '#757575', marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  actionBtn: { marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  halfBtn: { flex: 1 },
  errorText: { textAlign: 'center', marginTop: 40, color: '#666' },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  value: { fontSize: 15, fontWeight: '700', color: '#212121', marginTop: 6 },
  label: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
});
