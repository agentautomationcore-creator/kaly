import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../lib/theme';
import { useScanStore } from '../store/scanStore';
import { useAnalyzeFood } from '../hooks/useAnalyzeFood';
import { ScanCamera } from './ScanCamera';
import { ScanLoading } from './ScanLoading';
import { NutritionResultCard } from './NutritionResultCard';

export function ScanScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { photo, result, isAnalyzing, error, reset, setError } = useScanStore();
  const { mutate: analyze } = useAnalyzeFood();

  if (isAnalyzing) {
    return <ScanLoading />;
  }

  if (error && !result) {
    const isRateLimit = error === 'RATE_LIMIT';
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: colors.danger, fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
          {isRateLimit ? t('scan.scan_limit', { limit: 3 }) : t('errors.analysis_failed')}
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>
          {isRateLimit ? t('scan.upgrade_for_more') : t('errors.generic')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {!isRateLimit && photo && (
            <Pressable
              onPress={() => { setError(null); analyze(photo); }}
              style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{t('common.retry')}</Text>
            </Pressable>
          )}
          <Pressable
            onPress={reset}
            style={{ backgroundColor: colors.surface, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: colors.text, fontWeight: '600' }}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (result) {
    return <NutritionResultCard />;
  }

  return <ScanCamera />;
}
