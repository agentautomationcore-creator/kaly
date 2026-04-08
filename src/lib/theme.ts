import { useSettingsStore } from '../stores/settingsStore';

export const lightColors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#1A1A1A',
  textSecondary: '#525252',
  textTertiary: '#6B6B6B',
  primary: '#2E7D32',
  primaryLight: '#E8F5E9',
  accent: '#FF9800',
  accentLight: '#FFF3E0',
  danger: '#C62828',
  dangerLight: '#FFEBEE',
  warning: '#BF360C',
  warningLight: '#FFF8E1',
  safe: '#388E3C',
  border: '#E0E0E0',
  card: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E0E0E0',
  skeleton: '#F0F0F0',
  primaryDark: '#2E7D32',
  overlay: 'rgba(0,0,0,0.5)',
  overGoal: '#64748B',
  overGoalRing: '#7B8CA0',
  // A4: Missing color tokens
  success: '#15803D',
  proteinColor: '#3B82F6',
  carbsColor: '#F59E0B',
  fatColor: '#EF4444',
  fiberColor: '#8B5CF6',
  info: '#2196F3',
  textOnPrimary: '#FFFFFF',
  toastBackground: 'rgba(0,0,0,0.85)',
  toastIcon: '#4CAF50',
};

export const darkColors: typeof lightColors = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#E0E0E0',
  textSecondary: '#A3A3A3',
  textTertiary: '#8A8A8A',
  primary: '#388E3C',
  primaryLight: '#1B3A1B',
  accent: '#FFB74D',
  accentLight: '#3D2E1A',
  danger: '#EF5350',
  dangerLight: '#3D1A1A',
  warning: '#FFD54F',
  warningLight: '#3D3A1A',
  safe: '#388E3C',
  border: '#333333',
  card: '#1E1E1E',
  tabBar: '#1E1E1E',
  tabBarBorder: '#333333',
  skeleton: '#2A2A2A',
  primaryDark: '#2E7D32',
  overlay: 'rgba(0,0,0,0.7)',
  overGoal: '#94A3B8',
  overGoalRing: '#64748B',
  // A4: Missing color tokens
  success: '#22C55E',
  proteinColor: '#60A5FA',
  carbsColor: '#FBBF24',
  fatColor: '#F87171',
  fiberColor: '#A78BFA',
  info: '#42A5F5',
  textOnPrimary: '#FFFFFF',
  toastBackground: 'rgba(0,0,0,0.85)',
  toastIcon: '#4CAF50',
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
