import React from 'react';
import { View, Text, Switch, Pressable, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../lib/theme';

const PRIVACY_URL = 'https://kaly.app/privacy';
const TERMS_URL = 'https://kaly.app/terms';
import { useUpdateProfile } from '../hooks/useProfile';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { setLanguage, SUPPORTED_LANGUAGES } from '../../../i18n';
import { Card } from '../../../components/Card';
import { grantAnalyticsConsent, revokeAnalyticsConsent } from '../../../lib/analytics';
import { initSentryIfConsented } from '../../../lib/sentry';
import { scheduleWaterReminders, cancelWaterReminders, areWaterRemindersEnabled, requestNotificationPermission } from '../../../lib/waterReminders';
import { FONT_SIZE, RADIUS } from '../../../lib/constants';
import { useHealthKit } from '../../../hooks/useHealthKit';
import type { NutritionProfile } from '../types';

interface SettingsSectionProps {
  profile: NutritionProfile | null;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', fr: 'Français', ru: 'Русский', de: 'Deutsch',
  es: 'Español', it: 'Italiano', ar: 'العربية', pt: 'Português',
  tr: 'Türkçe', zh: '中文',
};

const THEME_OPTIONS = ['system', 'light', 'dark'] as const;

export function SettingsSection({ profile }: SettingsSectionProps) {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const { mutate: update } = useUpdateProfile();
  const { themeMode, setThemeMode, healthConsentGiven, setHealthConsent, aiConsentGiven, setAiConsent, analyticsConsentGiven, setAnalyticsConsent, showStreak, setShowStreak, units, setUnits, healthKitEnabled, setHealthKitEnabled } = useSettingsStore();
  const { isAvailable: healthKitAvailable, init: initHealthKit } = useHealthKit();

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    update({ language: lang });
  };

  const handleThemeChange = (theme: 'system' | 'light' | 'dark') => {
    setThemeMode(theme);
    update({ theme });
  };

  return (
    <Card style={{ marginBottom: 12 }}>
      {/* Language */}
      <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, fontWeight: '500', marginBottom: 8 }}>
        {t('profile.language')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <Pressable
            key={lang}
            onPress={() => handleLanguageChange(lang)}
            accessibilityLabel={`${t('profile.language')}: ${LANGUAGE_NAMES[lang] || lang}`}
            accessibilityRole="button"
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              minHeight: 44,
              justifyContent: 'center',
              borderRadius: RADIUS.full,
              backgroundColor: i18n.language === lang ? colors.primaryLight : colors.surface,
              borderWidth: 1.5,
              borderColor: i18n.language === lang ? colors.primary : 'transparent',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '500', color: i18n.language === lang ? colors.primary : colors.text }}>
              {LANGUAGE_NAMES[lang] || lang}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Theme */}
      <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, fontWeight: '500', marginBottom: 8 }}>
        {t('profile.theme')}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {THEME_OPTIONS.map((th) => (
          <Pressable
            key={th}
            onPress={() => handleThemeChange(th)}
            accessibilityLabel={`${t('profile.theme')}: ${t(`profile.theme_${th}`)}`}
            accessibilityRole="button"
            style={{
              flex: 1,
              minHeight: 44,
              paddingVertical: 10,
              borderRadius: RADIUS.md,
              backgroundColor: themeMode === th ? colors.primaryLight : colors.surface,
              borderWidth: 1.5,
              borderColor: themeMode === th ? colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '500', color: themeMode === th ? colors.primary : colors.text }}>
              {t(`profile.theme_${th}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Notifications */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '500', color: colors.text }}>
          {t('profile.notifications')}
        </Text>
        <Switch
          value={profile?.notifications ?? true}
          onValueChange={(v) => update({ notifications: v })}
          trackColor={{ false: colors.border, true: colors.primary }}
          accessibilityLabel={t('profile.notifications')}
        />
      </View>

      {/* Water reminders */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '500', color: colors.text }}>
          {t('profile.water_reminders')}
        </Text>
        <Switch
          value={areWaterRemindersEnabled()}
          onValueChange={async (v) => {
            if (v) {
              const granted = await requestNotificationPermission();
              if (granted) await scheduleWaterReminders();
            } else {
              await cancelWaterReminders();
            }
          }}
          trackColor={{ false: colors.border, true: colors.primary }}
          accessibilityLabel={t('profile.water_reminders')}
        />
      </View>

      {/* Streak toggle */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '500', color: colors.text }}>
          {t('profile.show_streak')}
        </Text>
        <Switch
          value={showStreak}
          onValueChange={setShowStreak}
          trackColor={{ false: colors.border, true: colors.primary }}
          accessibilityLabel={t('profile.show_streak')}
        />
      </View>

      {/* Apple Health */}
      {healthKitAvailable && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '500', color: colors.text }}>
              {t('settings.apple_health')}
            </Text>
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary }}>
              {t('settings.apple_health_hint')}
            </Text>
          </View>
          <Switch
            value={healthKitEnabled}
            onValueChange={async (v) => {
              if (v) {
                const success = await initHealthKit();
                setHealthKitEnabled(success);
              } else {
                setHealthKitEnabled(false);
              }
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            accessibilityLabel={t('settings.apple_health')}
          />
        </View>
      )}

      {/* Unit system toggle */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '500', color: colors.text }}>
          {t('settings.units')}
        </Text>
        <Pressable
          onPress={() => setUnits(units === 'metric' ? 'imperial' : 'metric')}
          style={{ minHeight: 44, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md, backgroundColor: colors.surface, justifyContent: 'center' }}
          accessibilityRole="button"
          accessibilityLabel={t('settings.toggle_units')}
        >
          <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '500', color: colors.primary }}>
            {units === 'metric' ? t('settings.metric') : t('settings.imperial')}
          </Text>
        </Pressable>
      </View>

      {/* Privacy — Consent Withdrawal (Art. 7 GDPR) */}
      <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, fontWeight: '500', marginBottom: 8 }}>
        {t('profile.privacy')}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '500', color: colors.text }}>
          {t('profile.ai_analysis')}
        </Text>
        <Switch
          value={aiConsentGiven}
          onValueChange={async (v) => {
            setAiConsent(v);
            const user = useAuthStore.getState().user;
            if (user) {
              await supabase.from('nutrition_profiles').update({
                ai_consent_given: v,
                ai_consent_at: v ? new Date().toISOString() : null,
              }).eq('id', user.id);
            }
          }}
          trackColor={{ false: colors.border, true: colors.primary }}
          accessibilityLabel={t('profile.ai_analysis')}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '500', color: colors.text }}>
          {t('profile.health_data')}
        </Text>
        <Switch
          value={healthConsentGiven}
          onValueChange={async (v) => {
            setHealthConsent(v);
            const user = useAuthStore.getState().user;
            if (user) {
              await supabase.from('nutrition_profiles').update({
                health_consent_given: v,
                health_consent_at: v ? new Date().toISOString() : null,
              }).eq('id', user.id);
            }
          }}
          trackColor={{ false: colors.border, true: colors.primary }}
          accessibilityLabel={t('profile.health_data')}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '500', color: colors.text }}>
          {t('profile.analytics')}
        </Text>
        <Switch
          value={analyticsConsentGiven}
          onValueChange={(v) => {
            setAnalyticsConsent(v);
            if (v) {
              grantAnalyticsConsent();
              initSentryIfConsented();
            } else {
              revokeAnalyticsConsent();
            }
          }}
          trackColor={{ false: colors.border, true: colors.primary }}
          accessibilityLabel={t('profile.analytics')}
        />
      </View>

      {/* Legal links */}
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} style={{ minHeight: 44, paddingVertical: 12, justifyContent: 'center' }} accessibilityRole="link" accessibilityLabel={t('paywall.privacy')}>
          <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, textDecorationLine: 'underline' }}>
            {t('paywall.privacy')}
          </Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(TERMS_URL)} style={{ minHeight: 44, paddingVertical: 12, justifyContent: 'center' }} accessibilityRole="link" accessibilityLabel={t('paywall.terms')}>
          <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, textDecorationLine: 'underline' }}>
            {t('paywall.terms')}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}
