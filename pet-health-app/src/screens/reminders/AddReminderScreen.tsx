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

import { useUser } from '@clerk/expo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { DatePickerInput } from '../../components/common/DatePickerInput';
import { useReminderStore } from '../../store/reminderStore';
import { usePetStore } from '../../store/petStore';
import { S } from '../../lib/strings';
import type { RemindersStackParamList, ReminderType } from '../../types';

type Props = NativeStackScreenProps<RemindersStackParamList, 'AddReminder'>;

const REMINDER_TYPES: ReminderType[] = ['vaccine', 'consultation', 'medication', 'exam', 'other'];

const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  vaccine: S.reminderTypeVaccine,
  consultation: S.reminderTypeConsultation,
  medication: S.reminderTypeMedication,
  exam: S.reminderTypeExam,
  other: S.reminderTypeOther,
};

export function AddReminderScreen({ navigation, route }: Props) {
  const { reminderId, petId: initialPetId } = route.params ?? {};
  const { user } = useUser();
  const userId = user?.id ?? '';
  const { reminders, addReminder, updateReminder } = useReminderStore();
  const { pets, fetchPets } = usePetStore();

  const existing = reminderId ? reminders.find((r) => r.id === reminderId) : null;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [reminderType, setReminderType] = useState<ReminderType>(existing?.reminder_type ?? 'vaccine');
  const [selectedPetId, setSelectedPetId] = useState(existing?.pet_id ?? initialPetId ?? '');
  const [remindAt, setRemindAt] = useState<Date | null>(
    existing?.remind_at ? new Date(existing.remind_at) : null,
  );
  const [isRecurring, setIsRecurring] = useState(existing?.is_recurring ?? false);
  const [recurrenceDays, setRecurrenceDays] = useState(
    existing?.recurrence_days ? String(existing.recurrence_days) : '',
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; petId?: string; remindAt?: string }>({});

  useEffect(() => {
    if (pets.length === 0 && userId) fetchPets(userId);
  }, [pets.length, fetchPets]);

  function validate() {
    const e: typeof errors = {};
    if (!title.trim()) e.title = S.reminderTitleRequired;
    if (!selectedPetId) e.petId = S.reminderPetRequired;
    if (!remindAt) e.remindAt = S.reminderDateRequired;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate() || !remindAt) return;
    setSaving(true);

    try {
      if (reminderId) {
        await updateReminder(reminderId, {
          title: title.trim(),
          description: description.trim() || null,
          reminder_type: reminderType,
          pet_id: selectedPetId,
          remind_at: remindAt.toISOString(),
          is_recurring: isRecurring,
          recurrence_days: isRecurring && recurrenceDays ? parseInt(recurrenceDays, 10) : null,
        }, userId);
      } else {
        await addReminder({
          title: title.trim(),
          description: description.trim() || null,
          reminder_type: reminderType,
          pet_id: selectedPetId,
          remind_at: remindAt.toISOString(),
          is_recurring: isRecurring,
          recurrence_days: isRecurring && recurrenceDays ? parseInt(recurrenceDays, 10) : null,
          is_completed: false,
        }, userId);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert(S.error, (err as Error).message ?? S.reminderSaveError);
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
        <Text style={styles.label}>{S.reminderType}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {REMINDER_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, reminderType === t && styles.chipActive]}
              onPress={() => setReminderType(t)}
            >
              <Text style={[styles.chipText, reminderType === t && styles.chipTextActive]}>
                {REMINDER_TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Input label={S.reminderTitle} value={title} onChangeText={setTitle} placeholder={S.reminderTitlePlaceholder} error={errors.title} />

        <Text style={styles.label}>{S.reminderPet}</Text>
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

        <DatePickerInput
          label={S.reminderDateTime}
          value={remindAt}
          onChange={setRemindAt}
          mode="datetime"
          placeholder={S.reminderDateTimePlaceholder}
          minimumDate={new Date()}
          error={errors.remindAt}
        />

        <Input
          label={S.notes}
          value={description}
          onChangeText={setDescription}
          placeholder={S.notesPlaceholder}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{S.reminderRecurring}</Text>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ true: '#4CAF82', false: '#E0E0E0' }}
            thumbColor="#fff"
          />
        </View>

        {isRecurring ? (
          <Input
            label={S.reminderRepeatDays}
            value={recurrenceDays}
            onChangeText={setRecurrenceDays}
            placeholder={S.reminderRepeatDaysPlaceholder}
            keyboardType="numeric"
          />
        ) : null}

        <Button
          title={reminderId ? S.saveChanges : S.setReminder}
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
