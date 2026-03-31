import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useColors } from '../../src/lib/theme';
import { Button } from '../../src/components/Button';
import { FONT_SIZE, RADIUS, IS_IOS } from '../../src/lib/constants';
import { supabase } from '../../src/lib/supabase';

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

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(t('auth.invalid_credentials'));
    } else {
      router.replace('/(tabs)/diary');
    }
    setLoading(false);
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
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, padding: 24, justifyContent: 'center' }}
      >
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 32 }}>
          {t('auth.sign_in')}
        </Text>

        {error ? (
          <View style={{ backgroundColor: colors.dangerLight, padding: 12, borderRadius: RADIUS.md, marginBottom: 16 }}>
            <Text style={{ color: colors.danger, fontSize: FONT_SIZE.sm }}>{error}</Text>
          </View>
        ) : null}

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={t('auth.email')}
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            backgroundColor: colors.card,
            borderRadius: RADIUS.md,
            padding: 16,
            fontSize: FONT_SIZE.md,
            color: colors.text,
            marginBottom: 12,
          }}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={t('auth.password')}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          style={{
            backgroundColor: colors.card,
            borderRadius: RADIUS.md,
            padding: 16,
            fontSize: FONT_SIZE.md,
            color: colors.text,
            marginBottom: 24,
          }}
        />

        <Button title={t('auth.sign_in')} onPress={handleLogin} loading={loading} />

        {IS_IOS && (
          <View style={{ marginTop: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZE.sm }}>{t('auth.no_account')}</Text>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text style={{ color: colors.primary, fontSize: FONT_SIZE.sm, fontWeight: '600' }}>
              {t('auth.create_account')}
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={() => router.back()} style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZE.sm }}>{t('auth.back')}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
