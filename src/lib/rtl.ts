import { I18nManager, ViewStyle } from 'react-native';
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Returns true when the layout is right-to-left (Arabic). */
export const isRTL = (): boolean => I18nManager.isRTL;

/** Swap icon based on layout direction. */
export const rtlIcon = <T extends IconName>(ltrName: T, rtlName: T): T =>
  I18nManager.isRTL ? rtlName : ltrName;

export const backIcon = () => rtlIcon('arrow-back', 'arrow-forward');
export const forwardIcon = () => rtlIcon('chevron-forward', 'chevron-back');
export const backChevron = () => rtlIcon('chevron-back', 'chevron-forward');

/** Returns 'row' or 'row-reverse' based on layout direction. Use for rows that should flip in RTL. */
export const rtlRow = (): ViewStyle['flexDirection'] =>
  I18nManager.isRTL ? 'row-reverse' : 'row';

/**
 * Flip scaleX for elements that should mirror in RTL
 * (e.g., progress bar fill direction).
 */
export const rtlScaleX = (): ViewStyle => (I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : {});

/**
 * Force RTL for Arabic locale, LTR for everything else.
 * Called from i18n setup — triggers restart if direction changes.
 */
export function applyRTL(locale: string): boolean {
  const shouldBeRTL = locale === 'ar';
  const needsChange = I18nManager.isRTL !== shouldBeRTL;

  if (needsChange) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }

  return needsChange; // caller should reload if true
}
