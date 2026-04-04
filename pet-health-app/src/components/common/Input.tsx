import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  secureToggle?: boolean;
}

export function Input({ label, error, containerStyle, secureToggle, ...props }: InputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        <TextInput
          style={styles.input}
          placeholderTextColor="#9E9E9E"
          secureTextEntry={secureToggle ? !visible : props.secureTextEntry}
          {...props}
        />
        {secureToggle ? (
          <TouchableOpacity onPress={() => setVisible((v) => !v)} style={styles.eyeIcon}>
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9E9E9E" />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 12,
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#F44336',
  },
  eyeIcon: {
    padding: 4,
  },
});
