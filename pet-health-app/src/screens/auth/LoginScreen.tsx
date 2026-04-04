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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const errors: typeof formErrors = {};
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Enter a valid email';
    if (!password) errors.password = 'Password is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleLogin() {
    clearError();
    if (!validate()) return;
    try {
      await signIn(email.trim(), password);
    } catch {
      Alert.alert('Sign In Failed', error ?? 'Please check your credentials and try again.');
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
        {/* Logo / Hero */}
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Ionicons name="paw" size={48} color="#fff" />
          </View>
          <Text style={styles.appName}>Pet Health</Text>
          <Text style={styles.tagline}>Keep your pets healthy & happy</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.heading}>Sign in</Text>

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
            placeholder="••••••••"
            secureToggle
            autoComplete="password"
            error={formErrors.password}
          />

          <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.btn} />

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.linkRow}
          >
            <Text style={styles.linkText}>
              Don't have an account?{' '}
              <Text style={styles.link}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#4CAF82' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  hero: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fff2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: { fontSize: 32, fontWeight: '800', color: '#fff' },
  tagline: { fontSize: 14, color: '#ffffffCC', marginTop: 4 },
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
