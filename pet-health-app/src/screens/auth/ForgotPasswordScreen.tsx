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
import { useSignIn } from '@clerk/expo';

import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { S } from '../../lib/strings';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

type Step = 'email' | 'code' | 'success';

export function ForgotPasswordScreen({ navigation }: Props) {
  const { signIn, isLoaded } = useSignIn();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSendCode() {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = S.emailRequired;
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = S.emailInvalid;
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: email.trim() });
      Alert.alert(S.ok, S.resetCodeSent);
      setStep('code');
    } catch (err: any) {
      Alert.alert(S.error, err?.errors?.[0]?.longMessage ?? err?.message ?? S.error);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    const e: Record<string, string> = {};
    if (!code.trim()) e.code = S.verificationCode + ' ' + S.emailRequired;
    if (!newPassword) e.password = S.passwordRequired;
    else if (newPassword.length < 8) e.password = S.passwordMinLength;
    if (newPassword !== confirmPw) e.confirm = S.passwordsNoMatch;
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password: newPassword,
      } as any);
      if (result.status === 'complete') {
        setStep('success');
      }
    } catch (err: any) {
      Alert.alert(S.error, err?.errors?.[0]?.longMessage ?? err?.message ?? S.error);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'success') {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Ionicons name="checkmark-circle" size={48} color="#fff" />
            </View>
            <Text style={styles.appName}>{S.resetPasswordSuccess}</Text>
            <Text style={styles.tagline}>{S.resetPasswordSuccessMessage}</Text>
          </View>
          <View style={styles.card}>
            <Button title={S.signIn} onPress={() => navigation.navigate('Login')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (step === 'code') {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Ionicons name="lock-closed" size={40} color="#fff" />
            </View>
            <Text style={styles.appName}>{S.forgotPasswordTitle}</Text>
            <Text style={styles.tagline}>{S.verifyEmailTagline(email)}</Text>
          </View>
          <View style={styles.card}>
            <Input
              label={S.verificationCode}
              value={code}
              onChangeText={setCode}
              placeholder={S.verificationCodePlaceholder}
              keyboardType="numeric"
              autoComplete="one-time-code"
              error={errors.code}
            />
            <Input
              label={S.newPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={S.newPasswordPlaceholder}
              secureToggle
              error={errors.password}
            />
            <Input
              label={S.confirmPassword}
              value={confirmPw}
              onChangeText={setConfirmPw}
              placeholder={S.confirmPasswordPlaceholder}
              secureToggle
              error={errors.confirm}
            />
            <Button title={S.resetPassword} onPress={handleReset} loading={loading} style={styles.btn} />
            <TouchableOpacity onPress={() => setStep('email')} style={styles.linkRow}>
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
            <Ionicons name="lock-closed" size={48} color="#fff" />
          </View>
          <Text style={styles.appName}>{S.forgotPasswordTitle}</Text>
          <Text style={styles.tagline}>{S.forgotPasswordTagline}</Text>
        </View>
        <View style={styles.card}>
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
          <Button title={S.sendCode} onPress={handleSendCode} loading={loading} style={styles.btn} />
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
            <Text style={styles.link}>{S.back}</Text>
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
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#fff2', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  appName: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center' },
  tagline: { fontSize: 14, color: '#ffffffCC', marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8,
  },
  btn: { marginTop: 8 },
  linkRow: { marginTop: 20, alignItems: 'center' },
  link: { fontSize: 14, color: '#4CAF82', fontWeight: '700' },
});
