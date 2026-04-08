import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/lib/theme';
import { Button } from '../../src/components/Button';
import { FONT_SIZE, RADIUS, MIN_TOUCH, SPACING } from '../../src/lib/constants';
import { useAuthStore } from '../../src/stores/authStore';
import { captureException } from '../../src/lib/sentry';
import { track } from '../../src/lib/analytics';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const { isAnonymous, registerFromAnonymous } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!email || password.length < 6) return;
    setLoading(true);
    setError('');

    try {
      if (isAnonymous) {
        // [DOCLEAR] Anonymous → updateUser, NOT signUp
        await registerFromAnonymous(email, password);
      } else {
        // Fresh registration — use signUp
        const { supabase } = await import('../../src/lib/supabase');
        const { error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
      }
      track('registration_completed');
      router.replace('/(tabs)/diary');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '';
      if (message.includes('already registered')) {
        setError(t('auth.email_taken'));
      } else {
        setError(message || t('errors.generic'));
        captureException(e, { feature: 'register' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, padding: SPACING.xl, justifyContent: 'center' }}
      >
        <Text style={{ fontSize: FONT_SIZE.heading, fontWeight: '800', color: colors.text, marginBottom: SPACING.xxl }}>
          {t('auth.create_account')}
        </Text>

        {error ? (
          <View style={{ backgroundColor: colors.dangerLight, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.lg }}>
            <Text style={{ color: colors.danger, fontSize: FONT_SIZE.sm }}>{error}</Text>
          </View>
        ) : null}

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={t('auth.email')}
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel={t('auth.email')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            backgroundColor: colors.card,
            borderRadius: RADIUS.md,
            padding: SPACING.lg,
            fontSize: FONT_SIZE.md,
            color: colors.text,
            marginBottom: SPACING.md,
          }}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={t('auth.password')}
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel={t('auth.password')}
          secureTextEntry
          style={{
            backgroundColor: colors.card,
            borderRadius: RADIUS.md,
            padding: SPACING.lg,
            fontSize: FONT_SIZE.md,
            color: colors.text,
            marginBottom: SPACING.xl,
          }}
        />

        <Button title={t('auth.create_account')} onPress={handleRegister} loading={loading} />

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl, gap: SPACING.xs }}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZE.sm }}>{t('auth.have_account')}</Text>
          <Pressable onPress={() => router.push('/(auth)/login')} accessibilityRole="link" style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}>
            <Text style={{ color: colors.primary, fontSize: FONT_SIZE.sm, fontWeight: '600' }}>
              {t('auth.sign_in')}
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/onboarding/welcome'); }} accessibilityRole="link" style={{ marginTop: SPACING.lg, alignItems: 'center', minHeight: MIN_TOUCH, justifyContent: 'center' }}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZE.sm }}>{t('auth.back')}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
