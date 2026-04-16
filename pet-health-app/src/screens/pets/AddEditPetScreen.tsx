import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { useUser } from '@clerk/expo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { usePetStore } from '../../store/petStore';
import { uploadFile } from '../../lib/storage';
import { S } from '../../lib/strings';
import type { PetsStackParamList, Species } from '../../types';

type Props = NativeStackScreenProps<PetsStackParamList, 'AddEditPet'>;

const SPECIES_OPTIONS: Species[] = ['dog', 'cat', 'bird', 'rabbit', 'fish', 'reptile', 'other'];

const SPECIES_LABELS: Record<Species, string> = {
  dog: S.speciesDog,
  cat: S.speciesCat,
  bird: S.speciesBird,
  rabbit: S.speciesRabbit,
  fish: S.speciesFish,
  reptile: S.speciesReptile,
  other: S.speciesOther,
};

export function AddEditPetScreen({ navigation, route }: Props) {
  const { petId } = route.params ?? {};
  const { pets, activePet, addPet, updatePet, fetchPet } = usePetStore();
  const { user } = useUser();

  const existing = petId ? (activePet?.id === petId ? activePet : pets.find((p) => p.id === petId)) : null;

  const [name, setName] = useState(existing?.name ?? '');
  const [species, setSpecies] = useState<Species>(existing?.species ?? 'dog');
  const [breed, setBreed] = useState(existing?.breed ?? '');
  const [birthdate, setBirthdate] = useState(existing?.birthdate ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(existing?.photo_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; birthdate?: string }>({});

  useEffect(() => {
    if (petId && !activePet) {
      fetchPet(petId);
    }
  }, [petId, activePet, fetchPet]);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!name.trim()) e.name = S.petNameRequired;
    if (birthdate && !/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      e.birthdate = 'Use o formato YYYY-MM-DD';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!validate()) return;
    if (!user) return;
    setSaving(true);

    try {
      let photoUrl = existing?.photo_url ?? null;

      if (photoUri && !photoUri.startsWith('https://')) {
        setUploading(true);
        photoUrl = await uploadFile({
          folder: 'pet-photos',
          userId: user.id,
          localUri: photoUri,
        });
        setUploading(false);
      }

      if (petId) {
        await updatePet(petId, {
          name: name.trim(),
          species,
          breed: breed.trim() || null,
          birthdate: birthdate || null,
          photo_url: photoUrl,
        }, user.id);
      } else {
        const newPet = await addPet({
          name: name.trim(),
          species,
          breed: breed.trim() || null,
          birthdate: birthdate || null,
          photo_url: photoUrl,
        }, user.id);
        navigation.replace('PetDetail', { petId: newPet.id });
        return;
      }

      navigation.goBack();
    } catch (err) {
      Alert.alert(S.error, (err as Error).message ?? S.petSaveError);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={32} color="#4CAF82" />
              <Text style={styles.photoHint}>{photoUri ? S.petPhotoChange : S.petPhoto}</Text>
            </View>
          )}
        </TouchableOpacity>

        <Input
          label={S.petName}
          value={name}
          onChangeText={setName}
          placeholder={S.petNamePlaceholder}
          error={errors.name}
        />

        <Text style={styles.label}>{S.petSpecies}</Text>
        <View style={styles.speciesRow}>
          {SPECIES_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.speciesChip, species === s && styles.speciesChipActive]}
              onPress={() => setSpecies(s)}
            >
              <Text style={[styles.speciesChipText, species === s && styles.speciesChipTextActive]}>
                {SPECIES_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label={S.petBreed}
          value={breed}
          onChangeText={setBreed}
          placeholder={S.petBreedPlaceholder}
        />

        <Input
          label={S.petBirthdate}
          value={birthdate}
          onChangeText={setBirthdate}
          placeholder="2021-03-15"
          keyboardType="numeric"
          error={errors.birthdate}
        />

        <Button
          title={petId ? S.saveChanges : S.addPet}
          onPress={handleSave}
          loading={saving || uploading}
          style={styles.saveBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingBottom: 40 },
  photoPicker: { alignSelf: 'center', marginBottom: 24 },
  photoPreview: { width: 110, height: 110, borderRadius: 55 },
  photoPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E8F5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: { fontSize: 12, color: '#4CAF82', marginTop: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  speciesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  speciesChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  speciesChipActive: { backgroundColor: '#4CAF82', borderColor: '#4CAF82' },
  speciesChipText: { fontSize: 13, color: '#555' },
  speciesChipTextActive: { color: '#fff', fontWeight: '700' },
  saveBtn: { marginTop: 8 },
});
