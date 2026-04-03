import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../lib/theme';
import { Skeleton } from '../../../components/LoadingSkeleton';
import { FONT_SIZE, RADIUS } from '../../../lib/constants';
import { cancelAnalysis } from '../hooks/useAnalyzeFood';
import { useScanStore } from '../store/scanStore';

export function ScanLoading() {
  const { t } = useTranslation();
  const colors = useColors();
  const reset = useScanStore((s) => s.reset);

  const handleCancel = () => {
    cancelAnalysis();
    reset();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 32 }}>
        {t('scan.analyzing')}
      </Text>

      {/* Skeleton card */}
      <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, gap: 16 }}>
        <Skeleton width="70%" height={20} />
        <Skeleton width="40%" height={14} />

        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />

        {/* Macro bars skeleton */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton width={80} height={12} />
            <Skeleton width={40} height={12} />
          </View>
          <Skeleton width="100%" height={8} borderRadius={4} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton width={60} height={12} />
            <Skeleton width={40} height={12} />
          </View>
          <Skeleton width="75%" height={8} borderRadius={4} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton width={70} height={12} />
            <Skeleton width={40} height={12} />
          </View>
          <Skeleton width="50%" height={8} borderRadius={4} />
        </View>

        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />

        {/* Ingredients skeleton */}
        <Skeleton width="50%" height={14} />
        <View style={{ gap: 8 }}>
          <Skeleton width="100%" height={12} />
          <Skeleton width="90%" height={12} />
          <Skeleton width="80%" height={12} />
        </View>
      </View>

      <Pressable
        onPress={handleCancel}
        style={{ alignSelf: 'center', marginTop: 24, backgroundColor: colors.surface, paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.md, minHeight: 44, justifyContent: 'center' }}
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}
      >
        <Text style={{ color: colors.text, fontWeight: '600' }}>{t('common.cancel')}</Text>
      </Pressable>

      <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textSecondary, textAlign: 'center', marginTop: 16 }}>
        {t('scan.disclaimer')}
      </Text>
    </View>
  );
}
