import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useUser } from '@clerk/expo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useVetStore } from '../../store/vetStore';
import { usePetStore } from '../../store/petStore';
import { S } from '../../lib/strings';
import type { AppointmentsStackParamList, AppointmentStatus } from '../../types';

type Props = NativeStackScreenProps<AppointmentsStackParamList, 'AddAppointment'>;

const STATUS_OPTIONS: AppointmentStatus[] = ['scheduled', 'completed', 'cancelled'];

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: S.statusScheduled,
  completed: S.statusCompleted,
  cancelled: S.statusCancelled,
};

export function AddAppointmentScreen({ navigation, route }: Props) {
  const { appointmentId } = route.params ?? {};
  const { user } = useUser();
  const userId = user?.id ?? '';
  const { appointments, addAppointment, updateAppointment, vets, fetchVets } = useVetStore();
  const { pets, fetchPets } = usePetStore();

  const existing = appointmentId ? appointments.find((a) => a.id === appointmentId) : null;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [selectedPetId, setSelectedPetId] = useState(existing?.pet_id ?? '');
  const [selectedVetId, setSelectedVetId] = useState(existing?.vet_id ?? '');
  const [appointmentAt, setAppointmentAt] = useState(
    existing?.appointment_at
      ? existing.appointment_at.replace('T', ' ').slice(0, 16)
      : '',
  );
  const [status, setStatus] = useState<AppointmentStatus>(existing?.status ?? 'scheduled');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; petId?: string; appointmentAt?: string }>({});

  useEffect(() => {
    if (pets.length === 0 && userId) fetchPets(userId);
    if (vets.length === 0 && userId) fetchVets(userId);
  }, [pets.length, vets.length, fetchPets, fetchVets]);

  function validate() {
    const e: typeof errors = {};
    if (!title.trim()) e.title = S.appointmentTitleRequired;
    if (!selectedPetId) e.petId = S.appointmentPetRequired;
    if (!appointmentAt) e.appointmentAt = S.appointmentDateRequired;
    else {
      const d = new Date(appointmentAt.replace(' ', 'T'));
      if (isNaN(d.getTime())) e.appointmentAt = 'Use o formato YYYY-MM-DD HH:MM';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const isoAt = new Date(appointmentAt.replace(' ', 'T')).toISOString();

    try {
      if (appointmentId) {
        await updateAppointment(appointmentId, {
          title: title.trim(),
          description: description.trim() || null,
          pet_id: selectedPetId,
          vet_id: selectedVetId || null,
          appointment_at: isoAt,
          status,
          location: location.trim() || null,
        }, userId);
      } else {
        await addAppointment({
          title: title.trim(),
          description: description.trim() || null,
          pet_id: selectedPetId,
          vet_id: selectedVetId || null,
          appointment_at: isoAt,
          status,
          location: location.trim() || null,
        }, userId);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert(S.error, (err as Error).message ?? S.appointmentSaveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label={S.appointmentTitle} value={title} onChangeText={setTitle} placeholder={S.appointmentTitlePlaceholder} error={errors.title} />

        <Text style={styles.label}>{S.appointmentPet}</Text>
        {errors.petId ? <Text style={styles.errorText}>{errors.petId}</Text> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {pets.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.chip, selectedPetId === p.id && styles.chipActive]}
              onPress={() => setSelectedPetId(p.id)}
            >
              <Text style={[styles.chipText, selectedPetId === p.id && styles.chipTextActive]}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>{S.appointmentVet}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <TouchableOpacity
            style={[styles.chip, selectedVetId === '' && styles.chipActive]}
            onPress={() => setSelectedVetId('')}
          >
            <Text style={[styles.chipText, selectedVetId === '' && styles.chipTextActive]}>{S.appointmentVetNone}</Text>
          </TouchableOpacity>
          {vets.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={[styles.chip, selectedVetId === v.id && styles.chipActive]}
              onPress={() => setSelectedVetId(v.id)}
            >
              <Text style={[styles.chipText, selectedVetId === v.id && styles.chipTextActive]}>
                Dr. {v.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Input
          label={S.appointmentDateTime}
          value={appointmentAt}
          onChangeText={setAppointmentAt}
          placeholder="2024-09-20 10:30"
          keyboardType="numeric"
          error={errors.appointmentAt}
        />

        <Input label={S.appointmentLocation} value={location} onChangeText={setLocation} placeholder={S.appointmentLocationPlaceholder} />

        <Input
          label={S.notes}
          value={description}
          onChangeText={setDescription}
          placeholder={S.notesPlaceholder}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        {appointmentId ? (
          <>
            <Text style={styles.label}>{S.appointmentStatus}</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, status === s && styles.chipActive]}
                  onPress={() => setStatus(s)}
                >
                  <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
                    {STATUS_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        <Button
          title={appointmentId ? S.saveChanges : S.scheduleAppointment}
          onPress={handleSave}
          loading={saving}
          style={styles.saveBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  errorText: { fontSize: 12, color: '#F44336', marginBottom: 6 },
  chipScroll: { marginBottom: 20 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#4CAF82', borderColor: '#4CAF82' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  textArea: { height: 90, textAlignVertical: 'top', paddingTop: 12 },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  saveBtn: { marginTop: 4 },
});
