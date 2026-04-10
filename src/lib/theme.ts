import { useSettingsStore } from '../stores/settingsStore';

export const lightColors = {
  // ── New design system tokens ──
  primary:         '#22C55E',
  primaryHover:    '#16A34A',
  primaryLight:    '#4ADE80',
  primarySubtle:   '#F0FDF4',
  primaryGhost:    'rgba(34,197,94,0.08)',
  secondary:       '#0EA5E9',
  secondarySubtle: '#F0F9FF',
  bg:              '#FFFFFF',
  surface:         '#F8FAFC',
  surfaceElevated: '#FFFFFF',
  textPrimary:     '#0F172A',
  textSecondary:   '#64748B',
  textTertiary:    '#94A3B8',
  textInverse:     '#FFFFFF',
  border:          '#E2E8F0',
  borderStrong:    '#CBD5E1',
  protein:         '#3B82F6',
  carbs:           '#F59E0B',
  fat:             '#A855F7',
  fasting:         '#8B5CF6',
  fastingSubtle:   '#F5F3FF',
  success:         '#22C55E',
  warning:         '#F59E0B',
  error:           '#F97316',
  errorSubtle:     '#FFF7ED',

  // ── Backward-compat aliases (Phase 1 will remove) ──
  background:      '#FFFFFF',
  text:            '#0F172A',
  card:            '#FFFFFF',
  accent:          '#0EA5E9',
  accentLight:     '#F0F9FF',
  danger:          '#F97316',
  dangerLight:     '#FFF7ED',
  warningLight:    '#FFF7ED',
  safe:            '#22C55E',
  tabBar:          '#FFFFFF',
  tabBarBorder:    '#E2E8F0',
  skeleton:        '#F0F0F0',
  primaryDark:     '#16A34A',
  overlay:         'rgba(0,0,0,0.5)',
  overGoal:        '#64748B',
  overGoalRing:    '#7B8CA0',
  proteinColor:    '#3B82F6',
  carbsColor:      '#F59E0B',
  fatColor:        '#A855F7',
  fiberColor:      '#8B5CF6',
  info:            '#0EA5E9',
  textOnPrimary:   '#FFFFFF',
  toastBackground: 'rgba(0,0,0,0.85)',
  toastIcon:       '#22C55E',
};

export const darkColors: typeof lightColors = {
  // ── New design system tokens ──
  primary:         '#4ADE80',
  primaryHover:    '#22C55E',
  primaryLight:    '#86EFAC',
  primarySubtle:   '#052E16',
  primaryGhost:    'rgba(74,222,128,0.1)',
  secondary:       '#38BDF8',
  secondarySubtle: '#0C1929',
  bg:              '#0B0F14',
  surface:         '#141A22',
  surfaceElevated: '#1C2432',
  textPrimary:     '#F1F5F9',
  textSecondary:   '#94A3B8',
  textTertiary:    '#475569',
  textInverse:     '#0B0F14',
  border:          '#1E293B',
  borderStrong:    '#334155',
  protein:         '#60A5FA',
  carbs:           '#FBBF24',
  fat:             '#C084FC',
  fasting:         '#A78BFA',
  fastingSubtle:   '#1A1528',
  success:         '#22C55E',
  warning:         '#F59E0B',
  error:           '#FB923C',
  errorSubtle:     '#1C1408',

  // ── Backward-compat aliases (Phase 1 will remove) ──
  background:      '#0B0F14',
  text:            '#F1F5F9',
  card:            '#1C2432',
  accent:          '#38BDF8',
  accentLight:     '#0C1929',
  danger:          '#FB923C',
  dangerLight:     '#1C1408',
  warningLight:    '#1C1408',
  safe:            '#22C55E',
  tabBar:          '#0B0F14',
  tabBarBorder:    '#1E293B',
  skeleton:        '#1C2432',
  primaryDark:     '#22C55E',
  overlay:         'rgba(0,0,0,0.7)',
  overGoal:        '#94A3B8',
  overGoalRing:    '#64748B',
  proteinColor:    '#60A5FA',
  carbsColor:      '#FBBF24',
  fatColor:        '#C084FC',
  fiberColor:      '#A78BFA',
  info:            '#38BDF8',
  textOnPrimary:   '#0B0F14',
  toastBackground: 'rgba(0,0,0,0.85)',
  toastIcon:       '#4ADE80',
};

export type Colors = typeof lightColors;

export function useColors(): Colors {
  const effectiveTheme = useSettingsStore((s) => s.effectiveTheme);
  return effectiveTheme === 'dark' ? darkColors : lightColors;
}

export function useThemeMode() {
  return useSettingsStore((s) => s.effectiveTheme);
}
