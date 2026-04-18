import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { useUser } from '@clerk/expo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { DatePickerInput } from '../../components/common/DatePickerInput';
import { usePetStore } from '../../store/petStore';
import { uploadFile, deleteFile } from '../../lib/storage';
import { S } from '../../lib/strings';
import type { PetsStackParamList, HealthRecordType } from '../../types';

type Props = NativeStackScreenProps<PetsStackParamList, 'AddRecord'>;

const RECORD_TYPES: HealthRecordType[] = ['vaccine', 'consultation', 'exam', 'surgery', 'other'];

const RECORD_TYPE_LABELS: Record<HealthRecordType, string> = {
  vaccine: S.typeVaccine,
  consultation: S.typeConsultation,
  exam: S.typeExam,
  surgery: S.typeSurgery,
  other: S.typeOther,
};

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
  const [recordDate, setRecordDate] = useState<Date>(() => {
    if (existing?.record_date) return new Date(existing.record_date);
    return new Date();
  });

  // P0-4: existing attachments management
  const [existingUrls, setExistingUrls] = useState<string[]>(existing?.attachment_urls ?? []);
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const [newAttachmentUris, setNewAttachmentUris] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!title.trim()) e.title = S.recordTitleRequired;
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
      setNewAttachmentUris((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  }

  function removeExisting(url: string) {
    setExistingUrls((prev) => prev.filter((u) => u !== url));
    setRemovedUrls((prev) => [...prev, url]);
  }

  async function handleSave() {
    if (!validate() || !user) return;
    setSaving(true);

    try {
      // Delete removed files from R2
      for (const url of removedUrls) {
        await deleteFile(url).catch(() => null);
      }

      // Upload new attachments
      const uploadedUrls: string[] = [];
      for (const uri of newAttachmentUris) {
        const url = await uploadFile({ folder: 'record-attachments', userId: user.id, localUri: uri });
        uploadedUrls.push(url);
      }

      const finalUrls = [...existingUrls, ...uploadedUrls];

      if (recordId && existing) {
        await updateHealthRecord(
          recordId,
          {
            title: title.trim(),
            record_type: recordType,
            description: description.trim() || null,
            veterinarian: veterinarian.trim() || null,
            record_date: recordDate.toISOString().slice(0, 10),
            attachment_urls: finalUrls.length > 0 ? finalUrls : null,
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
          record_date: recordDate.toISOString().slice(0, 10),
          attachment_urls: finalUrls.length > 0 ? finalUrls : null,
        }, user.id);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert(S.error, (err as Error).message ?? S.recordSaveError);
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
        <Text style={styles.label}>{S.recordType}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          {RECORD_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, recordType === t && styles.chipActive]}
              onPress={() => setRecordType(t)}
            >
              <Text style={[styles.chipText, recordType === t && styles.chipTextActive]}>
                {RECORD_TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Input label={S.recordTitle} value={title} onChangeText={setTitle} placeholder={S.recordTitlePlaceholder} error={errors.title} />

        <DatePickerInput
          label={S.recordDate}
          value={recordDate}
          onChange={setRecordDate}
          mode="date"
          placeholder={S.recordDatePlaceholder}
          maximumDate={new Date()}
        />

        <Input label={S.recordVet} value={veterinarian} onChangeText={setVeterinarian} placeholder={S.recordVetPlaceholder} />
        <Input
          label={S.notes}
          value={description}
          onChangeText={setDescription}
          placeholder={S.notesPlaceholder}
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        {/* P0-4: Existing attachments */}
        {existingUrls.length > 0 ? (
          <View style={styles.attachSection}>
            <Text style={styles.label}>{S.existingAttachments}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {existingUrls.map((url) => (
                <View key={url} style={styles.thumbWrap}>
                  <Image source={{ uri: url }} style={styles.thumb} />
                  <TouchableOpacity style={styles.removeThumb} onPress={() => removeExisting(url)}>
                    <Ionicons name="close-circle" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <TouchableOpacity style={styles.attachBtn} onPress={pickAttachment}>
          <Ionicons name="attach" size={20} color="#4CAF82" />
          <Text style={styles.attachBtnText}>
            {newAttachmentUris.length > 0 ? S.addAttachmentsCount(newAttachmentUris.length) : S.addAttachments}
          </Text>
        </TouchableOpacity>

        <Button
          title={recordId ? S.saveChanges : S.addRecord}
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
  attachSection: { marginBottom: 16 },
  thumbWrap: { position: 'relative', marginRight: 10 },
  thumb: { width: 80, height: 80, borderRadius: 10 },
  removeThumb: { position: 'absolute', top: -6, right: -6 },
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
