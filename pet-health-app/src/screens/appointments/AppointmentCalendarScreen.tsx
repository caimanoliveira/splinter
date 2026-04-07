import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

import { useUser } from '@clerk/expo';
import { useVetStore } from '../../store/vetStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import type { AppointmentsStackParamList, Appointment, AppointmentStatus } from '../../types';

type Props = NativeStackScreenProps<AppointmentsStackParamList, 'AppointmentCalendar'>;

const STATUS_CONFIG: Record<AppointmentStatus, { color: string; label: string }> = {
  scheduled: { color: '#2196F3', label: 'Scheduled' },
  completed: { color: '#4CAF82', label: 'Completed' },
  cancelled: { color: '#9E9E9E', label: 'Cancelled' },
};

export function AppointmentCalendarScreen({ navigation }: Props) {
  const { user } = useUser();
  const userId = user?.id ?? '';
  const { appointments, loading, fetchAppointments, updateAppointment, deleteAppointment } =
    useVetStore();

  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    if (userId) fetchAppointments(userId);
  }, [userId, fetchAppointments]);

  const handleRefresh = useCallback(() => { if (userId) fetchAppointments(userId); }, [userId, fetchAppointments]);

  // Build calendar marks from appointments
  const markedDates = appointments.reduce<Record<string, { marked: boolean; dotColor: string; dots?: { color: string }[] }>>(
    (acc, appt) => {
      const date = appt.appointment_at.split('T')[0];
      if (!date) return acc;
      const color = STATUS_CONFIG[appt.status].color;
      if (!acc[date]) {
        acc[date] = { marked: true, dotColor: color, dots: [{ color }] };
      } else {
        acc[date]?.dots?.push({ color });
      }
      return acc;
    },
    {},
  );

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] ?? { marked: false, dotColor: '#4CAF82' }),
      ...({
        selected: true,
        selectedColor: '#4CAF82',
      } as any),
    };
  }

  const filteredAppointments = selectedDate
    ? appointments.filter((a) => a.appointment_at.startsWith(selectedDate))
    : appointments.filter((a) => a.status === 'scheduled');

  function handleStatusChange(appt: Appointment) {
    const options: AppointmentStatus[] = ['scheduled', 'completed', 'cancelled'];
    Alert.alert('Change Status', `Current: ${appt.status}`, [
      ...options
        .filter((s) => s !== appt.status)
        .map((s) => ({
          text: STATUS_CONFIG[s].label,
          onPress: () =>
            updateAppointment(appt.id, { status: s }, userId).catch(() =>
              Alert.alert('Error', 'Could not update status.'),
            ),
        })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function handleDelete(appt: Appointment, uid: string) {
    Alert.alert('Delete Appointment', `Delete "${appt.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteAppointment(appt.id, uid).catch(() => Alert.alert('Error', 'Could not delete.')),
      },
    ]);
  }

  function renderAppointment({ item }: { item: Appointment }) {
    const statusConf = STATUS_CONFIG[item.status];
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AddAppointment', { appointmentId: item.id })}
        onLongPress={() =>
          Alert.alert(item.title, 'Options', [
            { text: 'Change Status', onPress: () => handleStatusChange(item) },
            { text: 'Edit', onPress: () => navigation.navigate('AddAppointment', { appointmentId: item.id }) },
            { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item, userId) },
            { text: 'Cancel', style: 'cancel' },
          ])
        }
        activeOpacity={0.75}
      >
        <View style={[styles.statusBar, { backgroundColor: statusConf.color }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.apptTitle}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusConf.color}18` }]}>
              <Text style={[styles.statusText, { color: statusConf.color }]}>{statusConf.label}</Text>
            </View>
          </View>
          <Text style={styles.apptTime}>{formatDateTime(item.appointment_at)}</Text>
          {item.pet ? <Text style={styles.petLabel}>{item.pet.name}</Text> : null}
          {item.vet ? <Text style={styles.vetLabel}>Dr. {item.vet.name}</Text> : null}
          {item.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color="#9E9E9E" />
              <Text style={styles.location}>{item.location}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

  if (loading && appointments.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day: DateData) =>
          setSelectedDate((prev) => (prev === day.dateString ? '' : day.dateString))
        }
        markedDates={markedDates}
        markingType="multi-dot"
        theme={{
          selectedDayBackgroundColor: '#4CAF82',
          todayTextColor: '#4CAF82',
          arrowColor: '#4CAF82',
          dotColor: '#4CAF82',
          textDayFontWeight: '500',
          textMonthFontWeight: '700',
        }}
      />

      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>
          {selectedDate
            ? `Appointments on ${selectedDate}`
            : `Upcoming (${filteredAppointments.length})`}
        </Text>
        {selectedDate ? (
          <TouchableOpacity onPress={() => setSelectedDate('')}>
            <Text style={styles.clearDate}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointment}
        contentContainerStyle={filteredAppointments.length === 0 ? styles.listEmpty : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title={selectedDate ? 'No appointments on this day' : 'No upcoming appointments'}
            subtitle="Tap + to schedule a new appointment."
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddAppointment', {})}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  list: { padding: 16 },
  listEmpty: { flex: 1 },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  listHeaderText: { fontSize: 13, fontWeight: '700', color: '#616161', textTransform: 'uppercase', letterSpacing: 0.5 },
  clearDate: { fontSize: 13, color: '#4CAF82', fontWeight: '600' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
  },
  statusBar: { width: 5 },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  apptTitle: { fontSize: 15, fontWeight: '700', color: '#212121', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  apptTime: { fontSize: 12, color: '#757575', marginBottom: 4 },
  petLabel: { fontSize: 12, color: '#4CAF82', fontWeight: '600', marginBottom: 2 },
  vetLabel: { fontSize: 12, color: '#2196F3', marginBottom: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  location: { fontSize: 12, color: '#9E9E9E' },
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
