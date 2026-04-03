import { useSettingsStore } from '../stores/settingsStore';

export const lightColors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#1A1A1A',
  textSecondary: '#525252',
  textTertiary: '#737373',
  primary: '#388E3C',
  primaryLight: '#E8F5E9',
  accent: '#FF9800',
  accentLight: '#FFF3E0',
  danger: '#F44336',
  dangerLight: '#FFEBEE',
  warning: '#F57F17',
  warningLight: '#FFF8E1',
  safe: '#388E3C',
  border: '#E0E0E0',
  card: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E0E0E0',
  skeleton: '#F0F0F0',
  overlay: 'rgba(0,0,0,0.5)',
  // A4: Missing color tokens
  success: '#22C55E',
  proteinColor: '#3B82F6',
  carbsColor: '#F59E0B',
  fatColor: '#EF4444',
  fiberColor: '#8B5CF6',
  info: '#2196F3',
};

export const darkColors: typeof lightColors = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#E0E0E0',
  textSecondary: '#A3A3A3',
  textTertiary: '#787878',
  primary: '#66BB6A',
  primaryLight: '#1B3A1B',
  accent: '#FFB74D',
  accentLight: '#3D2E1A',
  danger: '#EF5350',
  dangerLight: '#3D1A1A',
  warning: '#FFD54F',
  warningLight: '#3D3A1A',
  safe: '#66BB6A',
  border: '#333333',
  card: '#1E1E1E',
  tabBar: '#1E1E1E',
  tabBarBorder: '#333333',
  skeleton: '#2A2A2A',
  overlay: 'rgba(0,0,0,0.7)',
  // A4: Missing color tokens
  success: '#22C55E',
  proteinColor: '#60A5FA',
  carbsColor: '#FBBF24',
  fatColor: '#F87171',
  fiberColor: '#A78BFA',
  info: '#42A5F5',
};

export type Colors = typeof lightColors;

export function useColors(): Colors {
  const effectiveTheme = useSettingsStore((s) => s.effectiveTheme);
  return effectiveTheme === 'dark' ? darkColors : lightColors;
}

// A2: Export useThemeMode hook
export function useThemeMode() {
  return useSettingsStore((s) => s.effectiveTheme);
}
