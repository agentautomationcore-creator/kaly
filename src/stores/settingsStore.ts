import { create } from 'zustand';
import { Alert, Appearance } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import i18n from '../i18n';

const storage = createMMKV({ id: 'kaly-settings' });

export type ThemeMode = 'light' | 'dark' | 'system';
export type Units = 'metric' | 'imperial';

interface SettingsState {
  themeMode: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  units: Units;
  locale: string;
  aiConsentGiven: boolean;
  healthConsentGiven: boolean;
  analyticsConsentGiven: boolean;
  showStreak: boolean;
  healthKitEnabled: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setUnits: (units: Units) => void;
  setLocale: (locale: string) => void;
  setAiConsent: (v: boolean) => void;
  setHealthConsent: (v: boolean) => void;
  setAnalyticsConsent: (v: boolean) => void;
  setShowStreak: (v: boolean) => void;
  setHealthKitEnabled: (v: boolean) => void;
}

// A10: Store subscription reference at module level for cleanup
let appearanceSubscription: ReturnType<typeof Appearance.addChangeListener> | null = null;

export const useSettingsStore = create<SettingsState>((set, get) => {
  const savedTheme = (storage.getString('themeMode') as ThemeMode) || 'system';
  const savedUnits = (storage.getString('units') as Units) || 'metric';
  const savedLocale = storage.getString('locale') || 'en';
  const savedAiConsent = storage.getBoolean('aiConsentGiven') ?? false;
  const savedHealthConsent = storage.getBoolean('healthConsentGiven') ?? false;
  const savedAnalyticsConsent = storage.getBoolean('analyticsConsentGiven') ?? false;
  const savedShowStreak = storage.getBoolean('showStreak') ?? false;
  const savedHealthKitEnabled = storage.getBoolean('healthKitEnabled') ?? false;
  const systemTheme = Appearance.getColorScheme() || 'light';

  // A10: Clean up previous subscription if store is re-created
  if (appearanceSubscription) {
    appearanceSubscription.remove();
  }

  // Listen for system theme changes
  appearanceSubscription = Appearance.addChangeListener(({ colorScheme }) => {
    const currentMode = (storage.getString('themeMode') as ThemeMode) || 'system';
    if (currentMode === 'system') {
      set({ effectiveTheme: colorScheme || 'light' });
    }
  });

  return {
    themeMode: savedTheme,
    effectiveTheme: savedTheme === 'system' ? systemTheme : savedTheme,
    units: savedUnits,
    locale: savedLocale,
    aiConsentGiven: savedAiConsent,
    healthConsentGiven: savedHealthConsent,
    analyticsConsentGiven: savedAnalyticsConsent,
    showStreak: savedShowStreak,
    healthKitEnabled: savedHealthKitEnabled,

    setThemeMode: (mode) => {
      storage.set('themeMode', mode);
      const effective = mode === 'system' ? (Appearance.getColorScheme() || 'light') : mode;
      set({ themeMode: mode, effectiveTheme: effective });
    },

    setUnits: (units) => {
      storage.set('units', units);
      set({ units });
    },

    setLocale: (locale) => {
      storage.set('locale', locale);
      set({ locale });
    },

    setAiConsent: (v) => {
      storage.set('aiConsentGiven', v);
      set({ aiConsentGiven: v });
    },

    setHealthConsent: (v) => {
      storage.set('healthConsentGiven', v);
      set({ healthConsentGiven: v });
    },

    setAnalyticsConsent: (v) => {
      const prev = get().analyticsConsentGiven;
      storage.set('analyticsConsentGiven', v);
      set({ analyticsConsentGiven: v });
      // Sync to DB with rollback on failure
      const user = useAuthStore.getState().user;
      if (user) {
        supabase.from('nutrition_profiles').update({
          analytics_consent_given: v,
          analytics_consent_at: v ? new Date().toISOString() : null,
        }).eq('id', user.id).then(({ error }) => {
          if (error) {
            storage.set('analyticsConsentGiven', prev);
            set({ analyticsConsentGiven: prev });
            Alert.alert(i18n.t('common.error'), i18n.t('consent.save_failed'));
          }
        });
      }
    },

    setShowStreak: (v) => {
      storage.set('showStreak', v);
      set({ showStreak: v });
    },

    setHealthKitEnabled: (v) => {
      storage.set('healthKitEnabled', v);
      set({ healthKitEnabled: v });
    },
  };
});

/** Call this to clean up the Appearance listener (e.g., on app unmount) */
export function cleanupSettingsStore() {
  if (appearanceSubscription) {
    appearanceSubscription.remove();
    appearanceSubscription = null;
  }
}
