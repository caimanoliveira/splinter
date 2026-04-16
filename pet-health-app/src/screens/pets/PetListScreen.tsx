import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useAuth, useUser, useClerk } from '@clerk/expo';
import { usePetStore } from '../../store/petStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { S } from '../../lib/strings';
import type { PetsStackParamList, Pet } from '../../types';

type Props = NativeStackScreenProps<PetsStackParamList, 'PetList'>;

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐶',
  cat: '🐱',
  bird: '🐦',
  rabbit: '🐰',
  fish: '🐟',
  reptile: '🦎',
  other: '🐾',
};

export function PetListScreen({ navigation }: Props) {
  const { pets, loading, fetchPets } = usePetStore();
  const { user } = useUser();
  const { signOut } = useClerk();
  const userId = user?.id ?? '';

  useEffect(() => {
    if (userId) fetchPets(userId);
  }, [userId, fetchPets]);

  const handleRefresh = useCallback(() => {
    if (userId) fetchPets(userId);
  }, [userId, fetchPets]);

  function renderPet({ item }: { item: Pet }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PetDetail', { petId: item.id })}
        activeOpacity={0.75}
      >
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarEmoji}>{SPECIES_EMOJI[item.species] ?? '🐾'}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.petName}>{item.name}</Text>
          <Text style={styles.petMeta}>
            {item.species.charAt(0).toUpperCase() + item.species.slice(1)}
            {item.breed ? ` · ${item.breed}` : ''}
          </Text>
          {item.birthdate ? (
            <Text style={styles.petAge}>{calcAge(item.birthdate)}</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
      </TouchableOpacity>
    );
  }

  if (loading && pets.length === 0) {
    return <LoadingSpinner fullScreen message={S.loadingPets} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{S.greeting(user?.firstName ?? '')}</Text>
          <Text style={styles.subGreeting}>{S.petCount(pets.length)}</Text>
        </View>
        <TouchableOpacity onPress={() => signOut()} style={styles.signOutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#F44336" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={pets}
        keyExtractor={(item) => item.id}
        renderItem={renderPet}
        contentContainerStyle={pets.length === 0 ? styles.listEmpty : styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor="#4CAF82" />}
        ListEmptyComponent={
          <EmptyState
            icon="paw-outline"
            title={S.noPets}
            subtitle={S.noPetsHint}
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditPet', {})}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function calcAge(birthdate: string): string {
  const birth = new Date(birthdate);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months =
    now.getMonth() - birth.getMonth() + (now.getDate() >= birth.getDate() ? 0 : -1);
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) return S.ageMonths(totalMonths);
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return S.ageYearsMonths(y, m);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF82',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: '#fff' },
  subGreeting: { fontSize: 13, color: '#ffffffCC', marginTop: 2 },
  signOutBtn: { padding: 8, backgroundColor: '#fff2', borderRadius: 8 },
  list: { padding: 16 },
  listEmpty: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 28 },
  info: { flex: 1, marginLeft: 14 },
  petName: { fontSize: 17, fontWeight: '700', color: '#212121' },
  petMeta: { fontSize: 13, color: '#757575', marginTop: 2 },
  petAge: { fontSize: 12, color: '#4CAF82', marginTop: 4, fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF82',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#4CAF82',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
});
