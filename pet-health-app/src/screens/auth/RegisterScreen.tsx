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
import { useSignUp } from '@clerk/clerk-expo';

import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { signUp, setActive, isLoaded } = useSignUp();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string; email?: string; password?: string; confirm?: string;
  }>({});

  function validate(): boolean {
    const e: typeof errors = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Minimum 8 characters';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!isLoaded || !validate()) return;
    setLoading(true);
    try {
      await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        emailAddress: email.trim(),
        password,
      });
      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.message ?? 'Registration failed.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: verificationCode.trim() });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      } else {
        Alert.alert('Verification', 'Could not verify. Check the code and try again.');
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.message ?? 'Verification failed.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'verify') {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Ionicons name="mail" size={40} color="#fff" />
            </View>
            <Text style={styles.appName}>Verify Email</Text>
            <Text style={styles.tagline}>Enter the code we sent to {email}</Text>
          </View>
          <View style={styles.card}>
            <Input
              label="Verification Code"
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="123456"
              keyboardType="numeric"
              autoComplete="one-time-code"
            />
            <Button title="Verify" onPress={handleVerify} loading={loading} style={styles.btn} />
            <TouchableOpacity onPress={() => setStep('form')} style={styles.linkRow}>
              <Text style={styles.link}>← Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Ionicons name="paw" size={48} color="#fff" />
          </View>
          <Text style={styles.appName}>Pet Health</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Create account</Text>

          <View style={styles.nameRow}>
            <Input
              label="First Name *"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Jane"
              containerStyle={styles.halfInput}
              error={errors.firstName}
            />
            <Input
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Doe"
              containerStyle={styles.halfInput}
            />
          </View>

          <Input
            label="Email *"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          <Input
            label="Password *"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureToggle
            error={errors.password}
          />

          <Input
            label="Confirm Password *"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repeat your password"
            secureToggle
            error={errors.confirm}
          />

          <Button title="Create Account" onPress={handleRegister} loading={loading} style={styles.btn} />

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
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
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#fff2', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  appName: { fontSize: 28, fontWeight: '800', color: '#fff' },
  tagline: { fontSize: 13, color: '#ffffffCC', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8,
  },
  heading: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 20 },
  nameRow: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  btn: { marginTop: 8 },
  linkRow: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 14, color: '#666' },
  link: { color: '#4CAF82', fontWeight: '700' },
});
