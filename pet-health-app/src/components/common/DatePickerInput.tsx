import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { S } from '../../lib/strings';

interface Props {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  mode?: 'date' | 'datetime';
  placeholder?: string;
  error?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}

export function DatePickerInput({
  label,
  value,
  onChange,
  mode = 'date',
  placeholder,
  error,
  maximumDate,
  minimumDate,
}: Props) {
  // For Android datetime, we chain date → time
  const [visible, setVisible] = useState(false);
  const [androidStep, setAndroidStep] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState<Date>(new Date());

  function openPicker() {
    setTempDate(value ?? new Date());
    if (Platform.OS === 'android' && mode === 'datetime') {
      setAndroidStep('date');
    }
    setVisible(true);
  }

  function handleAndroidChange(event: DateTimePickerEvent, selected?: Date) {
    if (event.type === 'dismissed') {
      setVisible(false);
      return;
    }
    if (!selected) return;

    if (mode === 'datetime') {
      if (androidStep === 'date') {
        // Merge new date part, keep existing time
        const merged = new Date(selected);
        merged.setHours(tempDate.getHours(), tempDate.getMinutes(), 0, 0);
        setTempDate(merged);
        setAndroidStep('time');
      } else {
        // Time step done — selected has full date+time from Android
        setVisible(false);
        onChange(selected);
      }
    } else {
      setVisible(false);
      onChange(selected);
    }
  }

  function handleIOSChange(_event: DateTimePickerEvent, selected?: Date) {
    if (selected) setTempDate(selected);
  }

  function confirmIOS() {
    setVisible(false);
    onChange(tempDate);
  }

  function formatDisplay(d: Date): string {
    if (mode === 'datetime') {
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const pickerMode = Platform.OS === 'android' && mode === 'datetime' ? androidStep : mode;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={[styles.btn, !!error && styles.btnError]} onPress={openPicker}>
        <Ionicons name="calendar-outline" size={18} color="#4CAF82" />
        <Text style={[styles.btnText, !value && styles.placeholder]}>
          {value ? formatDisplay(value) : (placeholder ?? S.petBirthdatePlaceholder)}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#BDBDBD" />
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Android: modal-less dialog picker */}
      {Platform.OS === 'android' && visible && (
        <DateTimePicker
          value={tempDate}
          mode={pickerMode as 'date' | 'time'}
          display="default"
          onChange={handleAndroidChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}

      {/* iOS: modal with spinner + confirm */}
      {Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" visible={visible} onRequestClose={() => setVisible(false)}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.sheetCancel}>{S.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmIOS}>
                <Text style={styles.sheetConfirm}>{S.confirm}</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode={mode === 'datetime' ? 'datetime' : 'date'}
              display="spinner"
              onChange={handleIOSChange}
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              locale="pt-BR"
              style={styles.iosPicker}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  btnError: { borderColor: '#F44336' },
  btnText: { flex: 1, fontSize: 15, color: '#212121' },
  placeholder: { color: '#BDBDBD' },
  error: { fontSize: 12, color: '#F44336', marginTop: 4 },
  // iOS sheet
  backdrop: { flex: 1, backgroundColor: '#00000033' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sheetCancel: { fontSize: 16, color: '#9E9E9E' },
  sheetConfirm: { fontSize: 16, color: '#4CAF82', fontWeight: '700' },
  iosPicker: { height: 200 },
});
