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
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { useUser } from '@clerk/clerk-expo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { usePetStore } from '../../store/petStore';
import { uploadFile } from '../../lib/storage';
import type { PetsStackParamList, HealthRecordType } from '../../types';

type Props = NativeStackScreenProps<PetsStackParamList, 'AddRecord'>;

const RECORD_TYPES: HealthRecordType[] = ['vaccine', 'consultation', 'exam', 'surgery', 'other'];

export function AddRecordScreen({ navigation, route }: Props) {
  const { petId, recordId } = route.params;
  const { healthRecords, addHealthRecord, updateHealthRecord } = usePetStore();
  const { user } = useUser();

  const existing = recordId
    ? (healthRecords[petId] ?? []).find((r) => r.id === recordId)
    : null;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [recordType, setRecordType] = useState<HealthRecordType>(existing?.record_type ?? 'consultation');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [veterinarian, setVeterinarian] = useState(existing?.veterinarian ?? '');
  const [recordDate, setRecordDate] = useState(
    existing?.record_date ?? new Date().toISOString().split('T')[0] ?? '',
  );
  const [attachmentUris, setAttachmentUris] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; recordDate?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!recordDate) e.recordDate = 'Date is required';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(recordDate)) e.recordDate = 'Use YYYY-MM-DD format';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function pickAttachment() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setAttachmentUris((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  }

  async function handleSave() {
    if (!validate() || !user) return;
    setSaving(true);

    try {
      // Upload new attachments
      const uploadedUrls: string[] = [];
      for (const uri of attachmentUris) {
        const url = await uploadFile({ folder: 'record-attachments', userId: user.id, localUri: uri });
        uploadedUrls.push(url);
      }

      const allAttachments = [
        ...(existing?.attachment_urls ?? []),
        ...uploadedUrls,
      ];

      if (recordId && existing) {
        await updateHealthRecord(
          recordId,
          {
            title: title.trim(),
            record_type: recordType,
            description: description.trim() || null,
            veterinarian: veterinarian.trim() || null,
            record_date: recordDate,
            attachment_urls: allAttachments.length > 0 ? allAttachments : null,
          },
          petId,
          user.id,
        );
      } else {
        await addHealthRecord({
          pet_id: petId,
          title: title.trim(),
          record_type: recordType,
          description: description.trim() || null,
          veterinarian: veterinarian.trim() || null,
          record_date: recordDate,
          attachment_urls: allAttachments.length > 0 ? allAttachments : null,
        }, user.id);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', (err as Error).message ?? 'Could not save record.');
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
        {/* Type selector */}
        <Text style={styles.label}>Record Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          {RECORD_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, recordType === t && styles.chipActive]}
              onPress={() => setRecordType(t)}
            >
              <Text style={[styles.chipText, recordType === t && styles.chipTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Input label="Title *" value={title} onChangeText={setTitle} placeholder="Annual vaccine" error={errors.title} />
        <Input
          label="Date * (YYYY-MM-DD)"
          value={recordDate}
          onChangeText={setRecordDate}
          placeholder="2024-06-01"
          keyboardType="numeric"
          error={errors.recordDate}
        />
        <Input label="Veterinarian" value={veterinarian} onChangeText={setVeterinarian} placeholder="Dr. Smith" />
        <Input
          label="Notes"
          value={description}
          onChangeText={setDescription}
          placeholder="Additional details..."
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        {/* Attachments */}
        <TouchableOpacity style={styles.attachBtn} onPress={pickAttachment}>
          <Ionicons name="attach" size={20} color="#4CAF82" />
          <Text style={styles.attachBtnText}>
            Add Attachments {attachmentUris.length > 0 ? `(${attachmentUris.length} new)` : ''}
          </Text>
        </TouchableOpacity>

        <Button
          title={recordId ? 'Save Changes' : 'Add Record'}
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
  typeScroll: { marginBottom: 20 },
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
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4CAF82',
    borderStyle: 'dashed',
    marginBottom: 20,
    gap: 8,
  },
  attachBtnText: { color: '#4CAF82', fontSize: 14, fontWeight: '600' },
  saveBtn: { marginTop: 4 },
});
