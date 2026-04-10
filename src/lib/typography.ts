import { TextStyle } from 'react-native';
import i18n from '../i18n';

// ── Font family maps ──
const JAKARTA: Record<string, string> = {
  '400': 'PlusJakartaSans_400Regular',
  '500': 'PlusJakartaSans_500Medium',
  '600': 'PlusJakartaSans_600SemiBold',
  '700': 'PlusJakartaSans_700Bold',
};

const ARABIC: Record<string, string> = {
  '400': 'IBMPlexSansArabic_400Regular',
  '500': 'IBMPlexSansArabic_500Medium',
  '600': 'IBMPlexSansArabic_600SemiBold',
  '700': 'IBMPlexSansArabic_700Bold',
};

function font(weight: '400' | '500' | '600' | '700'): string {
  return i18n.language === 'ar' ? ARABIC[weight] : JAKARTA[weight];
}

// ── Static presets (default Latin) ──
export const typography = {
  display:     { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 48, lineHeight: 48 * 1.1 },
  title:       { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 28, lineHeight: 28 * 1.2 },
  h1:          { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 24, lineHeight: 24 * 1.3 },
  h2:          { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 20, lineHeight: 20 * 1.3 },
  h3:          { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17, lineHeight: 17 * 1.4 },
  body:        { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16, lineHeight: 16 * 1.5 },
  bodyMedium:  { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 16, lineHeight: 16 * 1.5 },
  small:       { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, lineHeight: 14 * 1.4 },
  smallMedium: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, lineHeight: 14 * 1.4 },
  caption:     { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, lineHeight: 12 * 1.3 },
  overline:    { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 11 * 1.2, textTransform: 'uppercase' as const, letterSpacing: 0.88 },
} as const satisfies Record<string, TextStyle>;

/** Typography type without literal font family constraints */
type Typography = { [K in keyof typeof typography]: TextStyle };

/**
 * Returns typography presets with the correct font family for the current locale.
 * For Arabic → IBM Plex Sans Arabic, otherwise → Plus Jakarta Sans.
 */
export function getTypography(): Typography {
  if (i18n.language !== 'ar') return typography;

  return {
    display:     { ...typography.display, fontFamily: font('700') },
    title:       { ...typography.title, fontFamily: font('700') },
    h1:          { ...typography.h1, fontFamily: font('600') },
    h2:          { ...typography.h2, fontFamily: font('600') },
    h3:          { ...typography.h3, fontFamily: font('600') },
    body:        { ...typography.body, fontFamily: font('400') },
    bodyMedium:  { ...typography.bodyMedium, fontFamily: font('500') },
    small:       { ...typography.small, fontFamily: font('400') },
    smallMedium: { ...typography.smallMedium, fontFamily: font('500') },
    caption:     { ...typography.caption, fontFamily: font('500') },
    overline:    { ...typography.overline, fontFamily: font('600') },
  };
}
