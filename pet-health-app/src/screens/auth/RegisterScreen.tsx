import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { signUp, loading, error, clearError } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirm?: string;
  }>({});

  function validate(): boolean {
    const errors: typeof formErrors = {};
    if (!fullName.trim()) errors.fullName = 'Full name is required';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Enter a valid email';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (password !== confirm) errors.confirm = 'Passwords do not match';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleRegister() {
    clearError();
    if (!validate()) return;
    try {
      await signUp(email.trim(), password, fullName.trim());
      Alert.alert(
        'Check your email',
        'We sent a confirmation link to your email address. Please verify to continue.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
      );
    } catch {
      Alert.alert('Registration Failed', error ?? 'Something went wrong. Please try again.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Ionicons name="paw" size={48} color="#fff" />
          </View>
          <Text style={styles.appName}>Pet Health</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Create account</Text>

          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Jane Doe"
            autoComplete="name"
            error={formErrors.fullName}
          />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={formErrors.email}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureToggle
            error={formErrors.password}
          />

          <Input
            label="Confirm Password"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repeat your password"
            secureToggle
            error={formErrors.confirm}
          />

          <Button title="Create Account" onPress={handleRegister} loading={loading} style={styles.btn} />

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.linkRow}
          >
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.link}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#4CAF82' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 40 },
  hero: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appName: { fontSize: 28, fontWeight: '800', color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  heading: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 20 },
  btn: { marginTop: 8 },
  linkRow: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 14, color: '#666' },
  link: { color: '#4CAF82', fontWeight: '700' },
});
