import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useColors } from '../../src/lib/theme';
import { Button } from '../../src/components/Button';
import { FONT_SIZE, RADIUS, IS_IOS, MIN_TOUCH, SPACING } from '../../src/lib/constants';
import { supabase } from '../../src/lib/supabase';
import { captureException } from '../../src/lib/sentry';

export default function LoginScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(t('auth.invalid_credentials'));
      } else {
        router.replace('/(tabs)/diary');
      }
    } catch {
      setError(t('errors.network'));
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token');
      }

      const { error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (authError) {
        setError(authError.message);
      } else {
        router.replace('/(tabs)/diary');
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('ERR_REQUEST_CANCELED')) {
        // User cancelled — do nothing
      } else {
        setError(t('errors.generic'));
        captureException(e, { feature: 'apple_sign_in' });
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
          {t('auth.sign_in')}
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

        <Button title={t('auth.sign_in')} onPress={handleLogin} loading={loading} />

        {IS_IOS && (
          <View style={{ marginTop: SPACING.lg, gap: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZE.sm }}>{t('auth.or')}</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={RADIUS.md}
              style={{ height: 48 }}
              onPress={handleAppleSignIn}
            />
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl, gap: SPACING.xs }}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZE.sm }}>{t('auth.no_account')}</Text>
          <Pressable onPress={() => router.push('/(auth)/register')} accessibilityRole="link" style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}>
            <Text style={{ color: colors.primary, fontSize: FONT_SIZE.sm, fontWeight: '600' }}>
              {t('auth.create_account')}
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
