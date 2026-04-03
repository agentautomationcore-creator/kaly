import React from 'react';
import { View, Text, Image, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/lib/theme';
import { Button } from '../../src/components/Button';
import { StepIndicator } from '../../src/components/StepIndicator';
import { FONT_SIZE } from '../../src/lib/constants';
import { Ionicons } from '@expo/vector-icons';

const PRIVACY_URL = 'https://kaly.app/privacy';
const TERMS_URL = 'https://kaly.app/terms';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();

  const signals = [
    { icon: 'flash-outline' as const, text: t('welcome.signals.fast') },
    { icon: 'language-outline' as const, text: t('welcome.signals.languages') },
    { icon: 'eye-outline' as const, text: t('welcome.signals.hidden') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 24 }}>
      <StepIndicator totalSteps={4} currentStep={1} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Logo placeholder */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Ionicons name="restaurant" size={40} color={colors.card} />
        </View>

        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
          {t('welcome.title')}
        </Text>
        <Text style={{ fontSize: FONT_SIZE.md, color: colors.textSecondary, textAlign: 'center', marginBottom: 32 }}>
          {t('welcome.subtitle')}
        </Text>

        <View style={{ gap: 12, width: '100%', marginBottom: 32 }}>
          {signals.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name={s.icon} size={20} color={colors.primary} />
              <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>{s.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <Button title={t('welcome.cta')} onPress={() => router.push('/onboarding/goal')} />
        <Button title={t('welcome.login')} variant="outline" onPress={() => router.push('/(auth)/login')} />
        <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
          {t('welcome.pricing')}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 }}>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} style={{ minHeight: 44, justifyContent: 'center', paddingVertical: 12 }} accessibilityRole="link" accessibilityLabel={t('paywall.terms')}>
            <Text style={{ fontSize: 11, color: colors.textSecondary, textDecorationLine: 'underline' }}>{t('paywall.terms')}</Text>
          </Pressable>
          <Text style={{ fontSize: 11, color: colors.border, alignSelf: 'center' }}>|</Text>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} style={{ minHeight: 44, justifyContent: 'center', paddingVertical: 12 }} accessibilityRole="link" accessibilityLabel={t('paywall.privacy')}>
            <Text style={{ fontSize: 11, color: colors.textSecondary, textDecorationLine: 'underline' }}>{t('paywall.privacy')}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
