import React, { useState } from 'react';
import {
  ScrollView,
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
import { S } from '../../lib/strings';
import type { VetsStackParamList } from '../../types';

type Props = NativeStackScreenProps<VetsStackParamList, 'AddEditVet'>;

export function AddEditVetScreen({ navigation, route }: Props) {
  const { vetId } = route.params ?? {};
  const { user } = useUser();
  const userId = user?.id ?? '';
  const { vets, addVet, updateVet } = useVetStore();
  const existing = vetId ? vets.find((v) => v.id === vetId) : null;

  const [name, setName] = useState(existing?.name ?? '');
  const [clinic, setClinic] = useState(existing?.clinic ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [specialty, setSpecialty] = useState(existing?.specialty ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!name.trim()) e.name = S.vetNameRequired;
    if (email && !/\S+@\S+\.\S+/.test(email)) e.email = S.vetEmailInvalid;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (vetId) {
        await updateVet(vetId, {
          name: name.trim(),
          clinic: clinic.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          specialty: specialty.trim() || null,
          notes: notes.trim() || null,
        }, userId);
        navigation.goBack();
      } else {
        const newVet = await addVet({
          name: name.trim(),
          clinic: clinic.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          specialty: specialty.trim() || null,
          notes: notes.trim() || null,
        }, userId);
        navigation.replace('VetDetail', { vetId: newVet.id });
      }
    } catch (err) {
      Alert.alert(S.error, (err as Error).message ?? S.vetSaveError);
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
        <Input label={S.vetName} value={name} onChangeText={setName} placeholder={S.vetNamePlaceholder} error={errors.name} />
        <Input label={S.vetClinic} value={clinic} onChangeText={setClinic} placeholder={S.vetClinicPlaceholder} />
        <Input label={S.vetPhone} value={phone} onChangeText={setPhone} placeholder={S.vetPhonePlaceholder} keyboardType="phone-pad" />
        <Input label={S.vetEmail} value={email} onChangeText={setEmail} placeholder={S.vetEmailPlaceholder} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
        <Input label={S.vetSpecialty} value={specialty} onChangeText={setSpecialty} placeholder={S.vetSpecialtyPlaceholder} />
        <Input
          label={S.vetNotes}
          value={notes}
          onChangeText={setNotes}
          placeholder={S.vetNotesPlaceholder}
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />
        <Button title={vetId ? S.saveChanges : S.addVet} onPress={handleSave} loading={saving} style={styles.saveBtn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingBottom: 40 },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  saveBtn: { marginTop: 4 },
});
