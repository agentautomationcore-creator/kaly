import i18n from '../i18n';

/**
 * i18n-5: Locale-aware number formatting.
 * Replaces raw .toFixed() in UI components.
 */
export function formatNumber(value: number, decimals = 0, locale?: string): string {
  return new Intl.NumberFormat(locale || i18n.language, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Format weight with unit suffix.
 * formatWeight(85.5, 'kg') → "85,5 kg" (fr) / "85.5 kg" (en)
 */
export function formatWeight(value: number, unit: 'kg' | 'lbs'): string {
  return `${formatNumber(value, 1)} ${unit}`;
}
