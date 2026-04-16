import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useUser } from '@clerk/expo';
import { useVetStore } from '../../store/vetStore';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { S } from '../../lib/strings';
import type { VetsStackParamList, Vet } from '../../types';

type Props = NativeStackScreenProps<VetsStackParamList, 'VetDetail'>;

export function VetDetailScreen({ navigation, route }: Props) {
  const { vetId } = route.params;
  const { user } = useUser();
  const { vets, deleteVet } = useVetStore();
  const vet = vets.find((v) => v.id === vetId);

  async function handleDelete() {
    Alert.alert(S.removeVet, S.removeVetConfirm(vet?.name ?? ''), [
      { text: S.cancel, style: 'cancel' },
      {
        text: S.remove,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVet(vetId, user?.id ?? '');
            navigation.goBack();
          } catch {
            Alert.alert(S.error, S.removeVetError);
          }
        },
      },
    ]);
  }

  if (!vet) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroAvatar}>
          <Ionicons name="person" size={52} color="#4CAF82" />
        </View>
        <Text style={styles.vetName}>Dr. {vet.name}</Text>
        {vet.specialty ? <Text style={styles.specialty}>{vet.specialty}</Text> : null}
      </View>

      <View style={styles.infoSection}>
        {vet.clinic ? <InfoRow icon="business-outline" label={S.vetClinicLabel} value={vet.clinic} /> : null}
        {vet.phone ? (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${vet.phone}`)}>
            <InfoRow icon="call-outline" label={S.vetPhoneLabel} value={vet.phone ?? ''} isLink />
          </TouchableOpacity>
        ) : null}
        {vet.email ? (
          <TouchableOpacity onPress={() => Linking.openURL(`mailto:${vet.email}`)}>
            <InfoRow icon="mail-outline" label={S.vetEmailLabel} value={vet.email ?? ''} isLink />
          </TouchableOpacity>
        ) : null}
        {vet.notes ? <InfoRow icon="document-text-outline" label={S.vetNotesLabel} value={vet.notes} /> : null}
      </View>

      <View style={styles.actions}>
        <Button
          title={S.edit}
          variant="secondary"
          onPress={() => navigation.navigate('AddEditVet', { vetId })}
          style={styles.halfBtn}
        />
        <Button
          title={S.remove}
          variant="danger"
          onPress={handleDelete}
          style={styles.halfBtn}
        />
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, isLink }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  isLink?: boolean;
}) {
  return (
    <View style={infoStyles.row}>
      <View style={infoStyles.iconWrap}>
        <Ionicons name={icon} size={20} color="#4CAF82" />
      </View>
      <View style={infoStyles.text}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={[infoStyles.value, isLink && infoStyles.link]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 28 },
  heroAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  vetName: { fontSize: 24, fontWeight: '800', color: '#212121' },
  specialty: { fontSize: 14, color: '#4CAF82', marginTop: 4, fontWeight: '600' },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
  },
  actions: { flexDirection: 'row', gap: 12 },
  halfBtn: { flex: 1 },
});

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  iconWrap: { width: 36, alignItems: 'center', marginTop: 2 },
  text: { flex: 1 },
  label: { fontSize: 11, color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: 0.4 },
  value: { fontSize: 15, fontWeight: '600', color: '#212121', marginTop: 2 },
  link: { color: '#2196F3' },
});
