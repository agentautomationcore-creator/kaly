import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Linking, AccessibilityInfo, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useColors } from '../../src/lib/theme';
import { Button } from '../../src/components/Button';
import { StepIndicator } from '../../src/components/StepIndicator';
import { FONT_SIZE, RADIUS, SPACING, MIN_TOUCH } from '../../src/lib/constants';
import { Ionicons } from '@expo/vector-icons';
import { setLanguage, SUPPORTED_LANGUAGES } from '../../src/i18n';

const PRIVACY_URL = 'https://doclear.app/kaly-privacy';
const TERMS_URL = 'https://doclear.app/kaly-terms';

export default function WelcomeScreen() {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion); }, []);

  const LANG_NAMES: Record<string, string> = {
    en: 'English', fr: 'Français', ru: 'Русский', de: 'Deutsch',
    es: 'Español', it: 'Italiano', ar: 'العربية', pt: 'Português',
    tr: 'Türkçe', zh: '中文',
  };

  const signals = [
    { icon: 'flash-outline' as const, text: t('welcome.signals.fast') },
    { icon: 'language-outline' as const, text: t('welcome.signals.languages') },
    { icon: 'eye-outline' as const, text: t('welcome.signals.hidden') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: SPACING.xl }}>
      {/* Language picker globe icon */}
      <Pressable
        onPress={() => setShowLangPicker(true)}
        style={{ position: 'absolute', top: 60, end: 24, zIndex: 10, minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, justifyContent: 'center', alignItems: 'center' }}
        accessibilityLabel={t('profile.language')}
        accessibilityRole="button"
      >
        <Ionicons name="globe-outline" size={24} color={colors.textSecondary} />
      </Pressable>

      {/* Language picker modal */}
      <Modal visible={showLangPicker} transparent animationType="fade" onRequestClose={() => setShowLangPicker(false)} accessibilityViewIsModal={true}>
        <Pressable onPress={() => setShowLangPicker(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: SPACING.xl, width: '80%', maxHeight: '60%', minHeight: MIN_TOUCH }}>
            <Text style={{ fontSize: FONT_SIZE.lg, fontWeight: '700', color: colors.text, marginBottom: SPACING.lg, textAlign: 'center' }}>
              {t('profile.language')}
            </Text>
            <ScrollView>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <Pressable
                  key={lang}
                  onPress={() => { setLanguage(lang); setShowLangPicker(false); }}
                  accessibilityRole="button"
                  accessibilityLabel={LANG_NAMES[lang]}
                  style={{
                    minHeight: MIN_TOUCH,
                    paddingVertical: SPACING.md,
                    paddingHorizontal: SPACING.lg,
                    borderRadius: RADIUS.md,
                    backgroundColor: i18n.language === lang ? colors.primaryLight : 'transparent',
                    marginBottom: 4,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: FONT_SIZE.md, fontWeight: i18n.language === lang ? '600' : '400', color: i18n.language === lang ? colors.primary : colors.text }}>
                    {LANG_NAMES[lang] || lang}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

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
            marginBottom: SPACING.xl,
          }}
        >
          <Ionicons name="restaurant" size={40} color={colors.card} />
        </Animated.View>

        <Animated.Text accessibilityRole="header" entering={reduceMotion ? undefined : FadeInDown.duration(500).delay(250)} style={{ fontSize: FONT_SIZE.xxl, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: SPACING.sm }}>
          {t('welcome.title')}
        </Animated.Text>
        <Animated.Text entering={reduceMotion ? undefined : FadeInDown.duration(500).delay(400)} style={{ fontSize: FONT_SIZE.md, color: colors.textSecondary, textAlign: 'center', marginBottom: SPACING.xxl }}>
          {t('welcome.subtitle')}
        </Animated.Text>

        <Animated.View entering={reduceMotion ? undefined : FadeInUp.duration(500).delay(550)} style={{ gap: SPACING.md, width: '100%', marginBottom: SPACING.xxl }}>
          {signals.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
              <Ionicons name={s.icon} size={20} color={colors.primary} />
              <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>{s.text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Social proof */}
        <Animated.Text entering={reduceMotion ? undefined : FadeInUp.duration(500).delay(700)} style={{ fontSize: FONT_SIZE.sm, color: colors.textTertiary, textAlign: 'center', marginBottom: SPACING.xl, fontStyle: 'italic' }}>
          {t('welcome.social_proof')}
        </Animated.Text>
      </View>

      <View style={{ gap: SPACING.md }}>
        <Button title={t('welcome.cta')} onPress={() => router.push('/onboarding/goal')} />
        <Button title={t('welcome.login')} variant="outline" onPress={() => router.push('/(auth)/login')} />
        <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.xs }}>
          {t('welcome.pricing')}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.sm }}>
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
