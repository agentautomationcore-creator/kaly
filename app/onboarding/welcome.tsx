import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Linking, AccessibilityInfo } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useColors } from '../../src/lib/theme';
import { Button } from '../../src/components/Button';
import { StepIndicator } from '../../src/components/StepIndicator';
import { FONT_SIZE, RADIUS, MIN_TOUCH } from '../../src/lib/constants';
import { Ionicons } from '@expo/vector-icons';

const PRIVACY_URL = 'https://kaly.app/privacy';
const TERMS_URL = 'https://kaly.app/terms';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion); }, []);

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
        <Animated.View
          entering={reduceMotion ? undefined : FadeInDown.duration(500).delay(100)}
          style={{
            width: 80,
            height: 80,
            borderRadius: RADIUS.xl,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Ionicons name="restaurant" size={40} color={colors.card} />
        </Animated.View>

        <Animated.Text entering={reduceMotion ? undefined : FadeInDown.duration(500).delay(250)} style={{ fontSize: FONT_SIZE.xxl, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
          {t('welcome.title')}
        </Animated.Text>
        <Animated.Text entering={reduceMotion ? undefined : FadeInDown.duration(500).delay(400)} style={{ fontSize: FONT_SIZE.md, color: colors.textSecondary, textAlign: 'center', marginBottom: 32 }}>
          {t('welcome.subtitle')}
        </Animated.Text>

        <Animated.View entering={reduceMotion ? undefined : FadeInUp.duration(500).delay(550)} style={{ gap: 12, width: '100%', marginBottom: 32 }}>
          {signals.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name={s.icon} size={20} color={colors.primary} />
              <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>{s.text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Social proof */}
        <Animated.Text entering={reduceMotion ? undefined : FadeInUp.duration(500).delay(700)} style={{ fontSize: FONT_SIZE.sm, color: colors.textTertiary, textAlign: 'center', marginBottom: 24, fontStyle: 'italic' }}>
          {t('welcome.social_proof')}
        </Animated.Text>
      </View>

      <View style={{ gap: 12 }}>
        <Button title={t('welcome.cta')} onPress={() => router.push('/onboarding/goal')} />
        <Button title={t('welcome.login')} variant="outline" onPress={() => router.push('/(auth)/login')} />
        <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
          {t('welcome.pricing')}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 }}>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} style={{ minHeight: MIN_TOUCH, justifyContent: 'center', paddingVertical: 12 }} accessibilityRole="link" accessibilityLabel={t('paywall.terms')}>
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, textDecorationLine: 'underline' }}>{t('paywall.terms')}</Text>
          </Pressable>
          <Text style={{ fontSize: FONT_SIZE.xs, color: colors.border, alignSelf: 'center' }}>|</Text>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} style={{ minHeight: MIN_TOUCH, justifyContent: 'center', paddingVertical: 12 }} accessibilityRole="link" accessibilityLabel={t('paywall.privacy')}>
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, textDecorationLine: 'underline' }}>{t('paywall.privacy')}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
