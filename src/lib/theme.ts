import { useSettingsStore } from '../stores/settingsStore';

export const lightColors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  primary: '#4CAF50',
  primaryLight: '#E8F5E9',
  accent: '#FF9800',
  accentLight: '#FFF3E0',
  danger: '#F44336',
  dangerLight: '#FFEBEE',
  warning: '#FFC107',
  warningLight: '#FFF8E1',
  safe: '#4CAF50',
  border: '#E0E0E0',
  card: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E0E0E0',
  skeleton: '#F0F0F0',
  overlay: 'rgba(0,0,0,0.5)',
};

export const darkColors: typeof lightColors = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#E0E0E0',
  textSecondary: '#999999',
  textTertiary: '#666666',
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
};

export type Colors = typeof lightColors;

export function useColors(): Colors {
  const effectiveTheme = useSettingsStore((s) => s.effectiveTheme);
  return effectiveTheme === 'dark' ? darkColors : lightColors;
}
