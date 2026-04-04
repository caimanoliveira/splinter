import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useReminderStore } from '../../store/reminderStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import type { RemindersStackParamList, Reminder, ReminderType } from '../../types';

type Props = NativeStackScreenProps<RemindersStackParamList, 'ReminderList'>;

const TYPE_CONFIG: Record<ReminderType, { icon: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  vaccine: { icon: 'shield-checkmark', color: '#4CAF82' },
  consultation: { icon: 'stethoscope', color: '#2196F3' },
  medication: { icon: 'medkit', color: '#FF9800' },
  exam: { icon: 'document-text', color: '#9C27B0' },
  other: { icon: 'alarm', color: '#9E9E9E' },
};

export function RemindersScreen({ navigation }: Props) {
  const { reminders, loading, fetchReminders, markCompleted, deleteReminder } =
    useReminderStore();

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleRefresh = useCallback(() => fetchReminders(), [fetchReminders]);

  const upcoming = reminders.filter((r) => !r.is_completed);
  const done = reminders.filter((r) => r.is_completed);

  function handleLongPress(item: Reminder) {
    Alert.alert(item.title, 'What would you like to do?', [
      { text: 'Mark done', onPress: () => markCompleted(item.id) },
      { text: 'Edit', onPress: () => navigation.navigate('AddReminder', { reminderId: item.id }) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteReminder(item.id).catch(() => Alert.alert('Error', 'Could not delete reminder.')),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function renderReminder({ item }: { item: Reminder }) {
    const config = TYPE_CONFIG[item.reminder_type];
    const isOverdue = !item.is_completed && new Date(item.remind_at) < new Date();
    return (
      <TouchableOpacity
        style={[styles.card, item.is_completed && styles.cardDone]}
        onPress={() => navigation.navigate('AddReminder', { reminderId: item.id })}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.iconWrapper, { backgroundColor: `${config.color}18` }]}>
          <Ionicons name={config.icon} size={22} color={item.is_completed ? '#BDBDBD' : config.color} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, item.is_completed && styles.titleDone]}>{item.title}</Text>
          <Text style={[styles.when, isOverdue && styles.whenOverdue]}>
            {isOverdue ? '⚠ Overdue · ' : ''}{formatDateTime(item.remind_at)}
          </Text>
          {item.pet ? (
            <Text style={styles.petLabel}>{item.pet.name}</Text>
          ) : null}
        </View>
        {item.is_completed ? (
          <Ionicons name="checkmark-circle" size={22} color="#4CAF82" />
        ) : item.is_recurring ? (
          <Ionicons name="repeat" size={18} color="#9E9E9E" />
        ) : null}
      </TouchableOpacity>
    );
  }

  if (loading && reminders.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[...upcoming, ...done]}
        keyExtractor={(item) => item.id}
        renderItem={renderReminder}
        contentContainerStyle={reminders.length === 0 ? styles.listEmpty : styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor="#4CAF82" />}
        ListHeaderComponent={
          upcoming.length > 0 && done.length > 0 ? (
            <Text style={styles.sectionHeader}>Upcoming ({upcoming.length})</Text>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="alarm-outline"
            title="No reminders"
            subtitle="Tap + to set a reminder for vaccines, medication, or check-ups."
          />
        }
        ItemSeparatorComponent={() => null}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddReminder', {})}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  list: { padding: 16 },
  listEmpty: { flex: 1 },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
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
  cardDone: { opacity: 0.6 },
  iconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, marginLeft: 12 },
  title: { fontSize: 15, fontWeight: '700', color: '#212121' },
  titleDone: { textDecorationLine: 'line-through', color: '#9E9E9E' },
  when: { fontSize: 12, color: '#757575', marginTop: 2 },
  whenOverdue: { color: '#F44336', fontWeight: '600' },
  petLabel: { fontSize: 11, color: '#4CAF82', marginTop: 3, fontWeight: '600' },
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
