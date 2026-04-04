import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useReminderStore } from '../../store/reminderStore';
import { usePetStore } from '../../store/petStore';
import type { RemindersStackParamList, ReminderType } from '../../types';

type Props = NativeStackScreenProps<RemindersStackParamList, 'AddReminder'>;

const REMINDER_TYPES: ReminderType[] = ['vaccine', 'consultation', 'medication', 'exam', 'other'];

export function AddReminderScreen({ navigation, route }: Props) {
  const { reminderId, petId: initialPetId } = route.params ?? {};
  const { reminders, addReminder, updateReminder } = useReminderStore();
  const { pets, fetchPets } = usePetStore();

  const existing = reminderId ? reminders.find((r) => r.id === reminderId) : null;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [reminderType, setReminderType] = useState<ReminderType>(existing?.reminder_type ?? 'vaccine');
  const [selectedPetId, setSelectedPetId] = useState(existing?.pet_id ?? initialPetId ?? '');
  const [remindAt, setRemindAt] = useState(
    existing?.remind_at
      ? existing.remind_at.replace('T', ' ').slice(0, 16)
      : '',
  );
  const [isRecurring, setIsRecurring] = useState(existing?.is_recurring ?? false);
  const [recurrenceDays, setRecurrenceDays] = useState(
    existing?.recurrence_days ? String(existing.recurrence_days) : '',
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; petId?: string; remindAt?: string }>({});

  useEffect(() => {
    if (pets.length === 0) fetchPets();
  }, [pets.length, fetchPets]);

  function validate() {
    const e: typeof errors = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!selectedPetId) e.petId = 'Please select a pet';
    if (!remindAt) e.remindAt = 'Date & time is required';
    else {
      const d = new Date(remindAt.replace(' ', 'T'));
      if (isNaN(d.getTime())) e.remindAt = 'Use YYYY-MM-DD HH:MM format';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const isoRemindAt = new Date(remindAt.replace(' ', 'T')).toISOString();

    try {
      if (reminderId) {
        await updateReminder(reminderId, {
          title: title.trim(),
          description: description.trim() || null,
          reminder_type: reminderType,
          pet_id: selectedPetId,
          remind_at: isoRemindAt,
          is_recurring: isRecurring,
          recurrence_days: isRecurring && recurrenceDays ? parseInt(recurrenceDays, 10) : null,
        });
      } else {
        await addReminder({
          title: title.trim(),
          description: description.trim() || null,
          reminder_type: reminderType,
          pet_id: selectedPetId,
          remind_at: isoRemindAt,
          is_recurring: isRecurring,
          recurrence_days: isRecurring && recurrenceDays ? parseInt(recurrenceDays, 10) : null,
          is_completed: false,
        });
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', (err as Error).message ?? 'Could not save reminder.');
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
        {/* Type */}
        <Text style={styles.label}>Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {REMINDER_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, reminderType === t && styles.chipActive]}
              onPress={() => setReminderType(t)}
            >
              <Text style={[styles.chipText, reminderType === t && styles.chipTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Input label="Title *" value={title} onChangeText={setTitle} placeholder="Annual Rabies Vaccine" error={errors.title} />

        {/* Pet selector */}
        <Text style={styles.label}>Pet *</Text>
        {errors.petId ? <Text style={styles.errorText}>{errors.petId}</Text> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {pets.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.chip, selectedPetId === p.id && styles.chipActive]}
              onPress={() => setSelectedPetId(p.id)}
            >
              <Text style={[styles.chipText, selectedPetId === p.id && styles.chipTextActive]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Input
          label="Remind At * (YYYY-MM-DD HH:MM)"
          value={remindAt}
          onChangeText={setRemindAt}
          placeholder="2024-09-15 09:00"
          keyboardType="numeric"
          error={errors.remindAt}
        />

        <Input
          label="Notes"
          value={description}
          onChangeText={setDescription}
          placeholder="Additional notes..."
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        {/* Recurring toggle */}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Recurring reminder</Text>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ true: '#4CAF82', false: '#E0E0E0' }}
            thumbColor="#fff"
          />
        </View>

        {isRecurring ? (
          <Input
            label="Repeat every (days)"
            value={recurrenceDays}
            onChangeText={setRecurrenceDays}
            placeholder="30"
            keyboardType="numeric"
          />
        ) : null}

        <Button
          title={reminderId ? 'Save Changes' : 'Set Reminder'}
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  switchLabel: { fontSize: 15, fontWeight: '600', color: '#333' },
  saveBtn: { marginTop: 4 },
});
