import React from 'react';
import { View, Text, Switch, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../lib/theme';
import { useUpdateProfile } from '../hooks/useProfile';
import { useSettingsStore } from '../../../stores/settingsStore';
import { setLanguage, SUPPORTED_LANGUAGES } from '../../../i18n';
import { Card } from '../../../components/Card';
import { FONT_SIZE, RADIUS } from '../../../lib/constants';
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
  const { themeMode, setThemeMode } = useSettingsStore();

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
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
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
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: RADIUS.md,
              backgroundColor: themeMode === th ? colors.primaryLight : colors.surface,
              borderWidth: 1.5,
              borderColor: themeMode === th ? colors.primary : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '500', color: themeMode === th ? colors.primary : colors.text }}>
              {t(`profile.theme_${th}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Notifications */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '500', color: colors.text }}>
          {t('profile.notifications')}
        </Text>
        <Switch
          value={profile?.notifications ?? true}
          onValueChange={(v) => update({ notifications: v })}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>
    </Card>
  );
}
