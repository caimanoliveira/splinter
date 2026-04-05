import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useUser } from '@clerk/clerk-expo';
import { useVetStore } from '../../store/vetStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import type { VetsStackParamList, Vet } from '../../types';

type Props = NativeStackScreenProps<VetsStackParamList, 'VetRegistry'>;

export function VetRegistryScreen({ navigation }: Props) {
  const { user } = useUser();
  const userId = user?.id ?? '';
  const { vets, loading, fetchVets } = useVetStore();

  useEffect(() => {
    if (userId) fetchVets(userId);
  }, [userId, fetchVets]);

  const handleRefresh = useCallback(() => { if (userId) fetchVets(userId); }, [userId, fetchVets]);

  function renderVet({ item }: { item: Vet }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('VetDetail', { vetId: item.id })}
        activeOpacity={0.75}
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={26} color="#4CAF82" />
        </View>
        <View style={styles.info}>
          <Text style={styles.vetName}>Dr. {item.name}</Text>
          {item.clinic ? <Text style={styles.meta}>{item.clinic}</Text> : null}
          {item.specialty ? <Text style={styles.specialty}>{item.specialty}</Text> : null}
        </View>
        {item.phone ? (
          <View style={styles.phoneChip}>
            <Ionicons name="call-outline" size={14} color="#4CAF82" />
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
      </TouchableOpacity>
    );
  }

  if (loading && vets.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={vets}
        keyExtractor={(item) => item.id}
        renderItem={renderVet}
        contentContainerStyle={vets.length === 0 ? styles.listEmpty : styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor="#4CAF82" />}
        ListEmptyComponent={
          <EmptyState
            icon="medkit-outline"
            title="No vets registered"
            subtitle="Tap + to add a veterinarian to your registry."
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditVet', {})}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  list: { padding: 16 },
  listEmpty: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, marginLeft: 12 },
  vetName: { fontSize: 16, fontWeight: '700', color: '#212121' },
  meta: { fontSize: 13, color: '#757575', marginTop: 2 },
  specialty: { fontSize: 12, color: '#4CAF82', marginTop: 3, fontWeight: '600' },
  phoneChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8F5ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
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
