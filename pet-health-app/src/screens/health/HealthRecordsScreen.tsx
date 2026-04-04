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

import { usePetStore } from '../../store/petStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import type { PetsStackParamList, HealthRecord, HealthRecordType } from '../../types';

type Props = NativeStackScreenProps<PetsStackParamList, 'HealthRecords'>;

const TYPE_CONFIG: Record<HealthRecordType, { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; label: string }> = {
  vaccine: { icon: 'shield-checkmark', color: '#4CAF82', label: 'Vaccine' },
  consultation: { icon: 'stethoscope', color: '#2196F3', label: 'Consultation' },
  exam: { icon: 'document-text', color: '#FF9800', label: 'Exam' },
  surgery: { icon: 'cut', color: '#F44336', label: 'Surgery' },
  other: { icon: 'ellipsis-horizontal-circle', color: '#9E9E9E', label: 'Other' },
};

export function HealthRecordsScreen({ navigation, route }: Props) {
  const { petId } = route.params;
  const { healthRecords, loading, fetchHealthRecords } = usePetStore();

  const records = healthRecords[petId] ?? [];

  useEffect(() => {
    fetchHealthRecords(petId);
  }, [petId, fetchHealthRecords]);

  const handleRefresh = useCallback(() => {
    fetchHealthRecords(petId);
  }, [petId, fetchHealthRecords]);

  function renderRecord({ item }: { item: HealthRecord }) {
    const config = TYPE_CONFIG[item.record_type];
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RecordDetail', { recordId: item.id })}
        activeOpacity={0.75}
      >
        <View style={[styles.iconWrapper, { backgroundColor: `${config.color}15` }]}>
          <Ionicons name={config.icon} size={24} color={config.color} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {config.label} · {formatDate(item.record_date)}
          </Text>
          {item.veterinarian ? (
            <Text style={styles.vet}>Dr. {item.veterinarian}</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
      </TouchableOpacity>
    );
  }

  if (loading && records.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={renderRecord}
        contentContainerStyle={records.length === 0 ? styles.listEmpty : styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor="#4CAF82" />}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No records yet"
            subtitle="Tap + to log a vaccine, consultation, or exam."
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddRecord', { petId })}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, marginLeft: 12 },
  title: { fontSize: 15, fontWeight: '700', color: '#212121' },
  meta: { fontSize: 12, color: '#757575', marginTop: 2 },
  vet: { fontSize: 12, color: '#4CAF82', marginTop: 3, fontWeight: '600' },
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
