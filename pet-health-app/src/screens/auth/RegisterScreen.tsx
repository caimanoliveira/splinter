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
import { useSignUp } from '@clerk/expo';

import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { S } from '../../lib/strings';
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
    if (!firstName.trim()) e.firstName = S.firstNameRequired;
    if (!email.trim()) e.email = S.emailRequired;
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = S.emailInvalid;
    if (!password) e.password = S.passwordRequired;
    else if (password.length < 8) e.password = S.passwordMinLength;
    if (password !== confirm) e.confirm = S.passwordsNoMatch;
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
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.message ?? S.error;
      Alert.alert(S.error, msg);
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
        Alert.alert(S.verifyEmail, S.verificationFailed);
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.message ?? S.verificationFailed;
      Alert.alert(S.error, msg);
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
            <Text style={styles.appName}>{S.verifyEmail}</Text>
            <Text style={styles.tagline}>{S.verifyEmailTagline(email)}</Text>
          </View>
          <View style={styles.card}>
            <Input
              label={S.verificationCode}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder={S.verificationCodePlaceholder}
              keyboardType="numeric"
              autoComplete="one-time-code"
            />
            <Button title={S.verifyButton} onPress={handleVerify} loading={loading} style={styles.btn} />
            <TouchableOpacity onPress={() => setStep('form')} style={styles.linkRow}>
              <Text style={styles.link}>{S.back}</Text>
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
          <Text style={styles.appName}>{S.appName}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>{S.createAccount}</Text>

          <View style={styles.nameRow}>
            <Input
              label={S.firstName}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={S.firstNamePlaceholder}
              containerStyle={styles.halfInput}
              error={errors.firstName}
            />
            <Input
              label={S.lastName}
              value={lastName}
              onChangeText={setLastName}
              placeholder={S.lastNamePlaceholder}
              containerStyle={styles.halfInput}
            />
          </View>

          <Input
            label={S.email}
            value={email}
            onChangeText={setEmail}
            placeholder={S.emailPlaceholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          <Input
            label={S.password}
            value={password}
            onChangeText={setPassword}
            placeholder={S.passwordHint}
            secureToggle
            error={errors.password}
          />

          <Input
            label={S.confirmPassword}
            value={confirm}
            onChangeText={setConfirm}
            placeholder={S.confirmPasswordPlaceholder}
            secureToggle
            error={errors.confirm}
          />

          <Button title={S.createAccount} onPress={handleRegister} loading={loading} style={styles.btn} />

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
            <Text style={styles.link}>{S.hasAccount}</Text>
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
  link: { fontSize: 14, color: '#4CAF82', fontWeight: '700' },
});
