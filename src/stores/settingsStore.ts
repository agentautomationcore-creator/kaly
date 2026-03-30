import { create } from 'zustand';
import { Appearance } from 'react-native';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'kaly-settings' });

export type ThemeMode = 'light' | 'dark' | 'system';
export type Units = 'metric' | 'imperial';

interface SettingsState {
  themeMode: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  units: Units;
  locale: string;
  setThemeMode: (mode: ThemeMode) => void;
  setUnits: (units: Units) => void;
  setLocale: (locale: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => {
  const savedTheme = (storage.getString('themeMode') as ThemeMode) || 'system';
  const savedUnits = (storage.getString('units') as Units) || 'metric';
  const savedLocale = storage.getString('locale') || 'en';
  const systemTheme = Appearance.getColorScheme() || 'light';

  // Listen for system theme changes
  Appearance.addChangeListener(({ colorScheme }) => {
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
  };
});
