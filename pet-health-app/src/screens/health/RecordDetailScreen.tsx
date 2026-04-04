import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { usePetStore } from '../../store/petStore';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { PetsStackParamList, HealthRecord } from '../../types';

type Props = NativeStackScreenProps<PetsStackParamList, 'RecordDetail'>;

export function RecordDetailScreen({ navigation, route }: Props) {
  const { recordId } = route.params;
  const { healthRecords, deleteHealthRecord } = usePetStore();

  // Find the record across all pet buckets
  const [record, setRecord] = useState<HealthRecord | null>(null);

  useEffect(() => {
    for (const recs of Object.values(healthRecords)) {
      const found = recs.find((r) => r.id === recordId);
      if (found) {
        setRecord(found);
        break;
      }
    }
  }, [healthRecords, recordId]);

  async function handleDelete() {
    if (!record) return;
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this health record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHealthRecord(record.id, record.pet_id);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Could not delete record.');
            }
          },
        },
      ],
    );
  }

  if (!record) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Type badge */}
      <View style={styles.typeBadge}>
        <Text style={styles.typeBadgeText}>{record.record_type.toUpperCase()}</Text>
      </View>

      <Text style={styles.title}>{record.title}</Text>
      <Text style={styles.date}>{formatDate(record.record_date)}</Text>

      {record.veterinarian ? (
        <InfoRow icon="person-circle-outline" label="Veterinarian" value={`Dr. ${record.veterinarian}`} />
      ) : null}

      {record.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.description}>{record.description}</Text>
        </View>
      ) : null}

      {record.attachment_urls && record.attachment_urls.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attachments ({record.attachment_urls.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {record.attachment_urls.map((url, i) => (
              <Image key={i} source={{ uri: url }} style={styles.attachment} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Edit"
          variant="secondary"
          onPress={() => navigation.navigate('AddRecord', { petId: record.pet_id, recordId: record.id })}
          style={styles.halfBtn}
        />
        <Button
          title="Delete"
          variant="danger"
          onPress={handleDelete}
          style={styles.halfBtn}
        />
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon} size={20} color="#4CAF82" style={infoStyles.icon} />
      <View>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingBottom: 40 },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5ED',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: '#4CAF82', letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: '800', color: '#212121', marginBottom: 4 },
  date: { fontSize: 13, color: '#9E9E9E', marginBottom: 16 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#757575', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  description: { fontSize: 15, color: '#424242', lineHeight: 22 },
  attachment: { width: 100, height: 100, borderRadius: 10, marginRight: 10 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 32 },
  halfBtn: { flex: 1 },
});

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  icon: { marginRight: 10, marginTop: 2 },
  label: { fontSize: 11, color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: 0.4 },
  value: { fontSize: 15, fontWeight: '600', color: '#212121', marginTop: 2 },
});
