import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Linking, AccessibilityInfo, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../src/lib/theme';
import { Button } from '../../src/components/Button';
import { RADIUS, SPACING, MIN_TOUCH, SHADOW } from '../../src/lib/constants';
import { typography } from '../../src/lib/typography';
import { Ionicons } from '@expo/vector-icons';
import { setLanguage, SUPPORTED_LANGUAGES } from '../../src/i18n';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';

const PRIVACY_URL = 'https://doclear.app/kaly-privacy';
const TERMS_URL = 'https://doclear.app/kaly-terms';

export default function WelcomeScreen() {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const signInAnonymously = useAuthStore((s) => s.signInAnonymously);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [starting, setStarting] = useState(false);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion); }, []);

  const handleStart = async () => {
    if (starting) return;
    setStarting(true);
    try {
      // Create anonymous user immediately so all onboarding screens have a user
      const { data: { user: existing } } = await supabase.auth.getUser();
      if (!existing) {
        await signInAnonymously();
      }
      router.push('/onboarding/goal');
    } catch {
      // Even if anon auth fails, let them proceed — diet screen will retry
      router.push('/onboarding/goal');
    } finally {
      setStarting(false);
    }
  };

  const LANG_NAMES: Record<string, string> = {
    en: 'English', fr: 'Français', ru: 'Русский', de: 'Deutsch',
    es: 'Español', it: 'Italiano', ar: 'العربية', pt: 'Português',
    tr: 'Türkçe', zh: '中文',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: SPACING[6] }}>
      {/* Language picker */}
      <Pressable
        onPress={() => setShowLangPicker(true)}
        style={{ position: 'absolute', top: 60, end: 24, zIndex: 10, minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, justifyContent: 'center', alignItems: 'center' }}
        accessibilityLabel={t('profile.language')}
        accessibilityRole="button"
      >
        <Ionicons name="globe-outline" size={24} color={colors.textSecondary} />
      </Pressable>

      <Modal visible={showLangPicker} transparent animationType="fade" onRequestClose={() => setShowLangPicker(false)} accessibilityViewIsModal>
        <Pressable onPress={() => setShowLangPicker(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: colors.surfaceElevated, borderRadius: RADIUS.xl, padding: SPACING[6], width: '80%', maxHeight: '60%' }}>
            <Text style={{ ...typography.h2, color: colors.textPrimary, marginBottom: SPACING[4], textAlign: 'center' }}>
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
                    paddingVertical: SPACING[3],
                    paddingHorizontal: SPACING[4],
                    borderRadius: RADIUS.sm,
                    backgroundColor: i18n.language === lang ? colors.primarySubtle : 'transparent',
                    marginBottom: 4,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ ...typography.body, fontWeight: i18n.language === lang ? '600' : '400', color: i18n.language === lang ? colors.primary : colors.textPrimary }}>
                    {LANG_NAMES[lang] || lang}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Logo */}
        <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(500).delay(100)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING[8] }}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={{ width: 64, height: 64, borderRadius: RADIUS.xl, justifyContent: 'center', alignItems: 'center' }}
          >
            <Ionicons name="restaurant" size={32} color="#fff" />
          </LinearGradient>
          <Text style={{ ...typography.h1, color: colors.primary, textTransform: 'lowercase' }}>kaly</Text>
        </Animated.View>

        {/* Hero placeholder */}
        <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(500).delay(200)}>
          <LinearGradient
            colors={[colors.primarySubtle, colors.secondarySubtle]}
            style={{ width: 280, height: 180, borderRadius: RADIUS.xl, marginBottom: SPACING[6], ...SHADOW.lg, justifyContent: 'center', alignItems: 'center' }}
          >
            <Ionicons name="camera" size={48} color={colors.primary} style={{ opacity: 0.4 }} />
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          accessibilityRole="header"
          entering={reduceMotion ? undefined : FadeInDown.duration(500).delay(300)}
          style={{ ...typography.title, color: colors.textPrimary, textAlign: 'center', marginBottom: SPACING[2] }}
        >
          {t('welcome.title')}
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          entering={reduceMotion ? undefined : FadeInDown.duration(500).delay(400)}
          style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center', maxWidth: 300, marginBottom: SPACING[6] }}
        >
          {t('welcome.subtitle')}
        </Animated.Text>

        {/* Social proof — real user count, no fake ratings */}
        <Animated.View
          entering={reduceMotion ? undefined : FadeInUp.duration(500).delay(500)}
          style={{ backgroundColor: colors.surface, borderRadius: RADIUS.lg, paddingVertical: 10, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          <Ionicons name="sparkles" size={16} color={colors.primary} />
          <Text style={{ ...typography.small, color: colors.textSecondary }}>{t('welcome.social_proof')}</Text>
        </Animated.View>
      </View>

      {/* CTAs */}
      <View style={{ gap: SPACING[3] }}>
        <Button title={`${t('welcome.cta')} \u2192`} onPress={handleStart} loading={starting} gradient />
        <Button title={t('welcome.login')} variant="ghost" onPress={() => router.push('/(auth)/login')} />

        {/* Legal */}
        <Text style={{ ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: SPACING[1] }}>
          {t('welcome.pricing')}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} style={{ minHeight: MIN_TOUCH, justifyContent: 'center', paddingVertical: 12 }} accessibilityRole="link" accessibilityLabel={t('paywall.terms')}>
            <Text style={{ ...typography.caption, color: colors.primary }}>{t('paywall.terms')}</Text>
          </Pressable>
          <Text style={{ ...typography.caption, color: colors.border, alignSelf: 'center' }}>|</Text>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} style={{ minHeight: MIN_TOUCH, justifyContent: 'center', paddingVertical: 12 }} accessibilityRole="link" accessibilityLabel={t('paywall.privacy')}>
            <Text style={{ ...typography.caption, color: colors.primary }}>{t('paywall.privacy')}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
